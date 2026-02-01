import supabase from '../database/db.js'
import crypto from 'crypto'
import { randomUUID } from 'crypto'
import { sendMakeNotification } from '../utils/makeWebhook.js'

const HITPAY_API_KEY = process.env.HITPAY_API_KEY
const HITPAY_SALT = process.env.HITPAY_SALT // signature secret
const HITPAY_BASE_URL = process.env.HITPAY_BASE_URL || 'https://api.sandbox.hit-pay.com'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5000'
const HITPAY_ENABLED = (process.env.HITPAY_ENABLED || 'true').toLowerCase() !== 'false'

const ensureEnv = (res) => {
  if (!HITPAY_API_KEY || !HITPAY_SALT) {
    res.status(500).json({ error: 'HitPay environment variables missing (HITPAY_API_KEY, HITPAY_SALT)' })
    return false
  }
  return true
}

export const createHitpayCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.body
    if (!orderId) return res.status(400).json({ error: 'orderId required' })

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('orderId, eventId, totalAmount, currency, status, buyerName, buyerEmail, buyerPhone, metadata')
      .eq('orderId', orderId)
      .maybeSingle()
    if (orderErr) return res.status(500).json({ error: orderErr.message })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.status === 'PAID') return res.status(400).json({ error: 'Order already paid' })
    if ((order.totalAmount || 0) <= 0) return res.status(400).json({ error: 'Free orders do not require payment' })

    // If HitPay is disabled, short-circuit and mark as paid (dev/testing only)
    if (!HITPAY_ENABLED) {
      const { data: orderItems, error: oiErr } = await supabase
        .from('orderItems')
        .select('ticketTypeId, quantity, price')
        .eq('orderId', order.orderId)
      if (oiErr) return res.status(500).json({ error: oiErr.message })

      await supabase
        .from('paymentTransactions')
        .insert({
          orderId: order.orderId,
          gateway: 'HITPAY_DISABLED',
          hitpayReferenceId: order.orderId,
          amount: order.totalAmount,
          currency: order.currency,
          status: 'SUCCEEDED',
          rawPayload: { mock: true, reason: 'HitPay disabled' }
        })

      await supabase.from('orders').update({ status: 'PAID' }).eq('orderId', order.orderId)

      // issue tickets if not already issued
      const { count: existingTickets, error: ticketCountErr } = await supabase
        .from('tickets')
        .select('ticketId', { count: 'exact', head: true })
        .eq('orderId', order.orderId)
      if (ticketCountErr) return res.status(500).json({ error: ticketCountErr.message })

      if (!existingTickets || existingTickets === 0) {
        const company = order?.metadata?.company || null
        for (const item of orderItems || []) {
          const { ticketTypeId, quantity } = item
          for (let i = 0; i < quantity; i++) {
            const { data: attendee, error: attErr } = await supabase
              .from('attendees')
              .insert({
                eventId: order.eventId,
                orderId: order.orderId,
                name: order.buyerName,
                email: order.buyerEmail,
                phoneNumber: order.buyerPhone || null,
                company,
                consent: true
              })
              .select('*')
              .single()
            if (attErr) return res.status(500).json({ error: attErr.message })

            const ticketCode = randomUUID()
            const { error: ticketErr } = await supabase
              .from('tickets')
              .insert({
                eventId: order.eventId,
                ticketTypeId,
                orderId: order.orderId,
                attendeeId: attendee.attendeeId,
                ticketCode,
                qrPayload: ticketCode,
                status: 'ISSUED'
              })
            if (ticketErr) return res.status(500).json({ error: ticketErr.message })

            // fetch event details
            const { data: event, error: eventErr } = await supabase
              .from('events')
              .select('eventName, description, startAt, endAt, locationText, imageUrl')
              .eq('eventId', order.eventId)
              .maybeSingle();
            sendMakeNotification({
              type: 'ticket',
              email: order.buyerEmail,
              name: order.buyerName,
              meta: {
                eventId: order.eventId,
                orderId: order.orderId,
                eventName: event?.eventName || '',
                eventDescription: event?.description || '',
                eventStartAt: event?.startAt ? new Date(event.startAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
                eventEndAt: event?.endAt ? new Date(event.endAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
                eventLocation: event?.locationText || '',
                eventImageUrl: event?.imageUrl || '',
                ticket: { ticketCode, qrPayload: ticketCode, status: 'ISSUED' }
              }
            }).catch(() => {})
          }
        }
      }

      return res.status(200).json({ checkoutUrl: null, status: 'PAID', mock: true })
    }

    if (!ensureEnv(res)) return

    const payload = {
      amount: Number(order.totalAmount),
      currency: order.currency || 'PHP',
      reference_number: order.orderId,
      name: order.buyerName || 'Buyer',
      email: order.buyerEmail || undefined,
      redirect_url: `${FRONTEND_URL}/payment/status?sessionId=${order.orderId}`,
      webhook: `${SERVER_BASE_URL}/api/payments/hitpay/webhook`,
      purpose: `Order ${order.orderId}`
    }

    const response = await fetch(`${HITPAY_BASE_URL}/v1/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Business-Api-Key': HITPAY_API_KEY
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('HitPay checkout creation failed', data)
      return res.status(500).json({ error: data?.error || data?.message || 'Failed to create HitPay payment request' })
    }

    const hitpayReferenceId = data.payment_request_id || data.id || data.reference_number || order.orderId
    const checkoutUrl = data.url ?? data.payment_url ?? data.checkout_url

    if (!checkoutUrl || checkoutUrl === 'null') {
      console.error('HitPay checkout URL missing or null', data)
      return res.status(500).json({ error: 'Checkout URL missing from HitPay response' })
    }

    // record payment transaction
    await supabase.from('paymentTransactions').insert({
      orderId: order.orderId,
      gateway: 'HITPAY',
      hitpayReferenceId,
      amount: order.totalAmount,
      currency: order.currency,
      status: 'PENDING',
      rawPayload: data
    })

    return res.status(200).json({ checkoutUrl, hitpayReferenceId })
  } catch (err) {
    console.error('createHitpayCheckoutSession error', err)
    return res.status(500).json({ error: err?.message || 'Unexpected error' })
  }
}

function computeHmac(payloadObj) {
  const entries = Object.entries(payloadObj)
    .filter(([k]) => k !== 'hmac' && payloadObj[k] !== undefined && payloadObj[k] !== null)
    .sort(([a], [b]) => a.localeCompare(b))
  const message = entries.map(([k, v]) => `${k}:${v}`).join('|')
  return crypto.createHmac('sha256', HITPAY_SALT).update(message).digest('hex')
}

export const hitpayWebhook = async (req, res) => {
  try {
    if (!ensureEnv(res)) return
    const payload = req.body || {}
    const incomingHmac = payload.hmac || req.query?.hmac
    if (!incomingHmac) {
      return res.status(400).json({ error: 'Missing HMAC' })
    }
    const calculated = computeHmac(payload)
    if (calculated !== incomingHmac) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const reference = payload.reference_number || payload.reference || payload.order_id
    const paymentStatus = (payload.status || '').toUpperCase()
    const hitpayReferenceId = payload.payment_request_id || payload.id || reference

    // fetch transaction
    const { data: tx, error: txErr } = await supabase
      .from('paymentTransactions')
      .select('paymentTransactionId, orderId')
      .eq('hitpayReferenceId', hitpayReferenceId)
      .maybeSingle()
    if (txErr) return res.status(500).json({ error: txErr.message })
    if (!tx) return res.status(404).json({ error: 'Payment transaction not found' })

    // helper: fetch order + items
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('orderId, eventId, buyerName, buyerEmail, buyerPhone, metadata, status, totalAmount, currency')
      .eq('orderId', tx.orderId)
      .maybeSingle()
    if (orderErr) return res.status(500).json({ error: orderErr.message })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const { data: orderItems, error: oiErr } = await supabase
      .from('orderItems')
      .select('ticketTypeId, quantity, price')
      .eq('orderId', tx.orderId)
    if (oiErr) return res.status(500).json({ error: oiErr.message })

    // map status
    let newStatus = 'PENDING'
    if (paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCEEDED') newStatus = 'SUCCEEDED'
    else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') newStatus = 'FAILED'

    await supabase
      .from('paymentTransactions')
      .update({ status: newStatus, rawPayload: payload })
      .eq('hitpayReferenceId', hitpayReferenceId)

    if (newStatus === 'SUCCEEDED') {
      // mark order paid
      await supabase.from('orders').update({ status: 'PAID' }).eq('orderId', tx.orderId)

      // issue tickets only if not already issued
      const { count: existingTickets, error: ticketCountErr } = await supabase
        .from('tickets')
        .select('ticketId', { count: 'exact', head: true })
        .eq('orderId', tx.orderId)
      if (ticketCountErr) return res.status(500).json({ error: ticketCountErr.message })

      if (!existingTickets || existingTickets === 0) {
        const company = order?.metadata?.company || null
        for (const item of orderItems || []) {
          const { ticketTypeId, quantity } = item
          for (let i = 0; i < quantity; i++) {
            const { data: attendee, error: attErr } = await supabase
              .from('attendees')
              .insert({
                eventId: order.eventId,
                orderId: order.orderId,
                name: order.buyerName,
                email: order.buyerEmail,
                phoneNumber: order.buyerPhone || null,
                company: order.metadata?.company || null,
                consent: true
              })
              .select('*')
              .single()
            if (attErr) return res.status(500).json({ error: attErr.message })

            const ticketCode = randomUUID()
            const { error: ticketErr } = await supabase
              .from('tickets')
              .insert({
                eventId: order.eventId,
                ticketTypeId,
                orderId: order.orderId,
                attendeeId: attendee.attendeeId,
                ticketCode,
                qrPayload: ticketCode,
                status: 'ISSUED'
              })
            if (ticketErr) return res.status(500).json({ error: ticketErr.message })

            // fetch event details
            const { data: event, error: eventErr } = await supabase
              .from('events')
              .select('eventName, description, startAt, endAt, locationText, imageUrl')
              .eq('eventId', order.eventId)
              .maybeSingle();
            sendMakeNotification({
              type: 'ticket',
              email: order.buyerEmail,
              name: order.buyerName,
              meta: {
                eventId: order.eventId,
                orderId: order.orderId,
                eventName: event?.eventName || '',
                eventDescription: event?.description || '',
                eventStartAt: event?.startAt ? new Date(event.startAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
                eventEndAt: event?.endAt ? new Date(event.endAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
                eventLocation: event?.locationText || '',
                eventImageUrl: event?.imageUrl || '',
                ticket: { ticketCode, qrPayload: ticketCode, status: 'ISSUED' }
              }
            }).catch(() => {})
          }
        }
      }
    } else if (newStatus === 'FAILED') {
      // mark order failed
      await supabase.from('orders').update({ status: 'FAILED' }).eq('orderId', tx.orderId)

      // cleanup any issued tickets/attendees for this order
      await supabase.from('tickets').delete().eq('orderId', tx.orderId)
      await supabase.from('attendees').delete().eq('orderId', tx.orderId)

      // release inventory
      const qtyByType = {}
      for (const item of orderItems || []) {
        qtyByType[item.ticketTypeId] = (qtyByType[item.ticketTypeId] || 0) + (item.quantity || 0)
      }
      const typeIds = Object.keys(qtyByType)
      if (typeIds.length) {
        const { data: tts, error: ttErr } = await supabase
          .from('ticketTypes')
          .select('ticketTypeId, quantitySold')
          .in('ticketTypeId', typeIds)
        if (ttErr) return res.status(500).json({ error: ttErr.message })

        for (const tt of tts || []) {
          const dec = qtyByType[tt.ticketTypeId] || 0
          const newSold = Math.max(0, (tt.quantitySold || 0) - dec)
          const { error: updErr } = await supabase
            .from('ticketTypes')
            .update({ quantitySold: newSold })
            .eq('ticketTypeId', tt.ticketTypeId)
          if (updErr) return res.status(500).json({ error: updErr.message })
        }
      }
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('hitpayWebhook error', err)
    return res.status(500).json({ error: err?.message || 'Unexpected error' })
  }
}
