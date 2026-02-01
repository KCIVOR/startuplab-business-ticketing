
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { apiService } from '../../services/apiService';
import { Button, Card, Input } from '../../components/Shared';
import { ICONS } from '../../constants';

export const CheckIn: React.FC = () => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'scanning'>('idle');
  const [attendeeInfo, setAttendeeInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const isProcessingScan = useRef(false);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setStatus('scanning');
    setErrorMsg('');
    try {
      const result = await apiService.checkInTicket(code.trim());
      setAttendeeInfo(result);
      setStatus('success');
      setCode('');
    } catch (err: any) {
      setStatus('error');
      const msg = err?.message || 'This code is unrecognized or already used.';
      setErrorMsg(msg.replace(/"/g, ''));
    }
  };

  const handleManualCheckInFromValue = async (value: string) => {
    if (!value) return;
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;
    setShowScanner(false);
    setStatus('scanning');
    setErrorMsg('');
    try {
      const result = await apiService.checkInTicket(value.trim());
      setAttendeeInfo(result);
      setStatus('success');
      setCode('');
    } catch (err: any) {
      setStatus('error');
      const msg = err?.message || 'This code is unrecognized or already used.';
      setErrorMsg(msg.replace(/"/g, ''));
    } finally {
      isProcessingScan.current = false;
    }
  };

  const reset = () => {
    setStatus('idle');
    setAttendeeInfo(null);
    setErrorMsg('');
  };

  // Initialize QR scanner when toggled on
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          rememberLastUsedCamera: true,
          disableFlip: true,
          showTorchButtonIfSupported: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        false
      );
      scanner.render(
        (text) => {
          if (text) {
            handleManualCheckInFromValue(text);
          }
        },
        () => {}
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
        scanner = null;
      }
    };
  }, [showScanner]);

  return (
    <div className="max-w-md mx-auto py-8 px-4 h-full flex flex-col">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Operation Center</h1>
        <p className="text-slate-500">Rapid check-in and attendee verification.</p>
      </div>

      <div className="flex-1 space-y-6">
        <Card className="p-6 bg-slate-950 text-white flex flex-col items-center justify-center min-h-[300px] border-none shadow-2xl relative overflow-hidden group">
            {/* Emerald Accent Layer */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>

            {status === 'idle' ? (
                <>
                    <div className="w-20 h-20 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden">
                        <div className="w-full h-[2px] bg-emerald-500 absolute animate-scan-y top-0"></div>
                        <ICONS.CheckCircle className="w-8 h-8 text-emerald-500/50" />
                    </div>
                    <p className="font-bold text-lg mb-2">Scanner Active</p>
                    <p className="text-slate-400 text-sm text-center px-8">Align the attendee's QR code within the viewfinder frame.</p>
                    <button
                      className="mt-8 text-emerald-400 hover:text-emerald-300 font-bold text-sm tracking-wide transition-colors"
                      onClick={() => setShowScanner((s) => !s)}
                    >
                        {showScanner ? 'CLOSE CAMERA' : 'ACTIVATE CAMERA'}
                    </button>
                    {showScanner && (
                      <div className="w-full mt-4 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/30 p-2">
                        <div id="qr-reader" className="w-full" />
                      </div>
                    )}
                </>
            ) : status === 'scanning' ? (
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-emerald-400">Verifying Ticket...</p>
                </div>
            ) : status === 'success' ? (
                <div className="text-center w-full animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/40">
                        <ICONS.CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Check-In Successful</h2>
                    <p className="text-emerald-400 font-mono text-xs uppercase tracking-widest font-black mb-6">ENTRY GRANTED</p>
                    
                    <div className="bg-slate-900 rounded-xl p-4 text-left w-full space-y-2 border border-slate-800">
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Attendee</span>
                            <span className="text-white text-sm font-bold">{attendeeInfo?.attendee?.name || attendeeInfo?.attendeeName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Event</span>
                            <span className="text-white text-sm font-bold truncate max-w-[150px]">{attendeeInfo?.eventName || attendeeInfo?.eventId}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Type</span>
                            <span className="text-emerald-400 text-sm font-bold">{attendeeInfo?.ticketName || attendeeInfo?.ticketCode}</span>
                        </div>
                    </div>

                    <Button className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-900/40" onClick={reset}>
                        Ready for Next
                    </Button>
                </div>
            ) : (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/40">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Invalid Ticket</h2>
                    <p className="text-rose-400 text-sm mb-8 font-medium">This code is unrecognized or already used.</p>
                    <Button variant="outline" className="w-full border-slate-800 text-white hover:bg-slate-900" onClick={reset}>
                        Scan Again
                    </Button>
                </div>
            )}
        </Card>

        <Card className="p-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Manual Entry</p>
            <form onSubmit={handleManualCheckIn} className="flex gap-2">
                <input 
                    placeholder="Enter Ticket ID / QR Code" 
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={code}
                    onChange={(e: any) => setCode(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!code || status === 'scanning'}
                  className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Verify
                </button>
            </form>
            {errorMsg && (
              <p className="text-rose-500 text-xs font-semibold mt-3">{errorMsg}</p>
            )}
        </Card>
      </div>

      <div className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
        StartupLab Business Systems • Ops Portal
      </div>

      <style>{`
        @keyframes scan {
          from { top: 0%; }
          to { top: 100%; }
        }
        .animate-scan-y {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
