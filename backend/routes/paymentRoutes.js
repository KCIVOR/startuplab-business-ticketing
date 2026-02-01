import express from 'express'
import { createHitpayCheckoutSession, hitpayWebhook } from '../controller/paymentController.js'

const router = express.Router()

// Create HitPay checkout session (sandbox-ready)
router.post('/hitpay/checkout-session', createHitpayCheckoutSession)

// HitPay webhook endpoint
router.post('/hitpay/webhook', express.json({ type: 'application/json' }), hitpayWebhook)

export default router
