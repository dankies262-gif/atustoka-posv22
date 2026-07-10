// Barcode Scanner Component — uses ZXing for reliable real barcode detection
import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanLine, Camera, CameraOff, CheckCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [phase, setPhase]   = useState<'idle' | 'loading' | 'active' | 'found' | 'error'>('idle');
  const [manual, setManual] = useState('');
  const [found, setFound]   = useState('');
  const [errMsg, setErr]    = useState('');

  const videoRef    = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const doneRef     = useRef(false);

  const stopScanner = useCallback(() => {
    try { controlsRef.current?.stop(); } catch { /* ignore */ }
    controlsRef.current = null;
  }, []);

  useEffect(() => () => stopScanner(), [stopScanner]);

  const startCamera = async () => {
    setPhase('loading');
    setErr('');
    doneRef.current = false;

    try {
      const reader = new BrowserMultiFormatReader();

      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } },
        videoRef.current!,
        (result, error) => {
          if (doneRef.current) return;
          if (result) {
            const code = result.getText();
            if (code && code.length > 2) {
              doneRef.current = true;
              setFound(code);
              setPhase('found');
              stopScanner();
              setTimeout(() => onScan(code), 400);
            }
          } else if (error && !(error instanceof NotFoundException)) {
            console.debug('ZXing scanner:', error?.message);
          }
        }
      );

      if (!doneRef.current) {
        controlsRef.current = controls;
        setPhase('active');
      } else {
        controls.stop();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/permission|notallowed|denied/i.test(msg)) {
        setErr('Camera access denied. Allow camera in your browser settings, or type the barcode below.');
      } else {
        setErr(`Could not start scanner: ${msg}. Try typing the barcode below.`);
      }
      setPhase('error');
    }
  };

  const handleStop = () => { stopScanner(); setPhase('idle'); };

  const submitManual = () => {
    const v = manual.trim();
    if (v) { stopScanner(); onScan(v); }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Viewfinder */}
      <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-slate-900">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full max-h-[280px] object-cover"
          style={{ display: phase === 'active' || phase === 'loading' ? 'block' : 'none' }}
        />

        {phase === 'active' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative w-4/5 h-24">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-teal-400 rounded-tl" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-teal-400 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-teal-400 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-teal-400 rounded-br" />
              <div className="scan-line absolute inset-x-0 h-0.5 bg-teal-400/80 rounded" />
            </div>
            <p className="absolute bottom-3 text-white/60 text-xs">Point camera at barcode</p>
          </div>
        )}

        {phase === 'idle' && (
          <div className="p-10 text-center text-white/40">
            <Camera className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">Tap Start Camera</p>
          </div>
        )}
        {phase === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ScanLine className="h-8 w-8 text-teal-400 animate-pulse" />
            <p className="text-teal-400 text-sm">Starting camera…</p>
          </div>
        )}
        {phase === 'found' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/90 gap-2">
            <CheckCircle className="h-10 w-10 text-white" />
            <p className="font-bold text-white text-lg">Detected!</p>
            <p className="font-mono text-white text-sm">{found}</p>
          </div>
        )}
        {phase === 'error' && (
          <div className="p-6 text-center">
            <CameraOff className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">Camera unavailable</p>
          </div>
        )}
      </div>

      {errMsg && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          ⚠️ {errMsg}
        </div>
      )}

      <div className="flex gap-2">
        {(phase === 'idle' || phase === 'error') ? (
          <Button onClick={startCamera} className="w-full gap-2">
            <Camera className="h-4 w-4" /> Start Camera Scan
          </Button>
        ) : phase === 'active' ? (
          <Button onClick={handleStop} variant="destructive" className="w-full gap-2">
            <CameraOff className="h-4 w-4" /> Stop Camera
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="whitespace-nowrap text-xs text-muted-foreground">or type manually</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex gap-2">
        <Input
          className="font-mono flex-1"
          value={manual}
          onChange={e => setManual(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitManual()}
          placeholder="Type barcode / SKU and press Enter…"
        />
        <Button onClick={submitManual} disabled={!manual.trim()}>Add</Button>
      </div>

      <div className="rounded-lg bg-teal-500/10 px-3 py-2.5 text-xs text-teal-700 dark:text-teal-400">
        <strong>Tip:</strong> Use your device's rear camera for best results. Ensure the barcode is well-lit and fully in frame.
      </div>
    </div>
  );
}
