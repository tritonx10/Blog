import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, Scan, Check, RefreshCw, ZoomIn, ZoomOut, RotateCcw, ChevronRight } from 'lucide-react';
import { createWorker } from 'tesseract.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert raw Tesseract text to light HTML preserving paragraph breaks. */
function textToHtml(text) {
  if (!text) return '';
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n');

  const paragraphs = [];
  let current = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (current.length) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    } else {
      current.push(trimmed);
    }
  }
  if (current.length) paragraphs.push(current.join(' '));

  return paragraphs.map((p) => `<p>${p}</p>`).join('\n');
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HandwritingScanner({ onInsert, onClose }) {
  // Local state
  const [step, setStep] = useState('capture'); // 'capture' | 'preview' | 'scanning' | 'result'
  const [captureMode, setCaptureMode] = useState('camera'); // 'camera' | 'upload'
  const [imageSrc, setImageSrc] = useState(null);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again, or use the Upload option instead.');
      setCaptureMode('upload');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (captureMode === 'camera' && step === 'capture') {
      startCamera();
    }
    return () => {
      if (step !== 'preview' && step !== 'result') stopCamera();
    };
  }, [captureMode, step]);

  // Capture from camera
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    setImageSrc(dataUrl);
    setStep('preview');
  };

  // Upload from file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  };

  // Run OCR
  const runOCR = async () => {
    setStep('scanning');
    setProgress(0);
    setError('');
    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { data } = await worker.recognize(imageSrc);
      await worker.terminate();
      const raw = data.text;
      setOcrText(raw);
      setEditedText(raw);
      setStep('result');
    } catch (err) {
      setError('OCR failed. Please try again with a clearer image.');
      setStep('preview');
    }
  };

  // Insert into editor as HTML
  const handleInsert = () => {
    const html = textToHtml(editedText);
    onInsert(html);
    onClose();
  };

  // Reset to retake
  const reset = () => {
    setImageSrc(null);
    setOcrText('');
    setEditedText('');
    setProgress(0);
    setError('');
    setZoom(1);
    setStep('capture');
    if (captureMode === 'camera') startCamera();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-brown/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="w-full max-w-2xl bg-parchment rounded-2xl shadow-warm-lg overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-dark bg-parchment sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center">
              <Scan size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="font-heading text-xl text-ink">Handwriting Scanner</h2>
              <p className="text-xs font-sans text-brown-lighter">
                {step === 'capture' && 'Position your notes clearly within the frame.'}
                {step === 'preview' && 'Review your image before scanning.'}
                {step === 'scanning' && 'Reading your handwriting…'}
                {step === 'result' && 'Review & edit the detected text before inserting.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-brown-lighter hover:text-ink rounded-xl hover:bg-parchment-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center">
            {['capture', 'preview', 'result'].map((s, i, arr) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-semibold transition-colors ${
                  step === s ? 'bg-gold text-white'
                  : (step === 'scanning' && s === 'preview') ? 'bg-gold text-white'
                  : ['capture', 'preview', 'result'].indexOf(step) > i ? 'bg-sage/40 text-sage-dark'
                  : 'bg-parchment-dark text-brown-lighter'
                }`}>
                  {['capture', 'preview', 'result'].indexOf(step) > i ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs font-sans text-brown-lighter capitalize">{s}</span>
                {i < arr.length - 1 && <ChevronRight size={14} className="text-parchment-dark" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-sans">
              {error}
            </div>
          )}

          {/* ── CAPTURE ───────────────────────────────── */}
          {step === 'capture' && (
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setCaptureMode('camera')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-sans font-medium transition-all ${captureMode === 'camera' ? 'bg-ink text-white' : 'bg-parchment-dark text-brown hover:bg-parchment-dark/70'}`}
                >
                  <Camera size={16} /> Camera
                </button>
                <button
                  onClick={() => setCaptureMode('upload')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-sans font-medium transition-all ${captureMode === 'upload' ? 'bg-ink text-white' : 'bg-parchment-dark text-brown hover:bg-parchment-dark/70'}`}
                >
                  <Upload size={16} /> Upload Photo
                </button>
              </div>

              {captureMode === 'camera' ? (
                <div className="relative rounded-2xl overflow-hidden bg-ink aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Scan overlay */}
                  <div className="absolute inset-4 border-2 border-gold/60 rounded-xl pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold rounded-br-xl" />
                  </div>
                  <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-xs font-sans bg-ink/50 px-3 py-1 rounded-full">
                    Align handwritten notes within the golden frame
                  </p>
                </div>
              ) : (
                <label
                  htmlFor="scanner-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gold/40 hover:border-gold rounded-2xl aspect-video cursor-pointer bg-parchment-dark/20 hover:bg-gold/5 transition-colors group"
                >
                  <Upload size={32} className="text-gold/50 group-hover:text-gold transition-colors mb-3" />
                  <p className="font-body text-brown-lighter group-hover:text-brown transition-colors">Click to upload a photo of your handwritten notes</p>
                  <p className="text-xs text-brown-lighter/60 mt-1 font-sans">JPG, PNG, WEBP · Best in good lighting</p>
                  <input id="scanner-upload" type="file" accept="image/*" ref={fileRef} onChange={handleFileUpload} className="hidden" />
                </label>
              )}

              {/* Hidden canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {captureMode === 'camera' && (
                <button
                  onClick={capturePhoto}
                  className="w-full btn-gold flex items-center justify-center gap-3 py-3 text-base"
                >
                  <Camera size={20} /> Capture Photo
                </button>
              )}
            </div>
          )}

          {/* ── PREVIEW ───────────────────────────────── */}
          {step === 'preview' && imageSrc && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-ink">
                <div className="overflow-auto max-h-[50vh] flex items-center justify-center">
                  <img
                    src={imageSrc}
                    alt="Captured"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}
                    className="max-w-full"
                  />
                </div>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} className="p-2 rounded-lg bg-parchment-dark hover:bg-gold/10 text-brown-lighter hover:text-gold transition-colors">
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-sans text-brown-lighter w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} className="p-2 rounded-lg bg-parchment-dark hover:bg-gold/10 text-brown-lighter hover:text-gold transition-colors">
                  <ZoomIn size={16} />
                </button>
                <button onClick={() => setZoom(1)} className="p-2 rounded-lg bg-parchment-dark hover:bg-gold/10 text-brown-lighter hover:text-gold transition-colors">
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 btn-outline flex items-center justify-center gap-2">
                  <RefreshCw size={16} /> Retake
                </button>
                <button onClick={runOCR} className="flex-1 btn-gold flex items-center justify-center gap-2">
                  <Scan size={18} /> Scan Handwriting
                </button>
              </div>
            </div>
          )}

          {/* ── SCANNING ──────────────────────────────── */}
          {step === 'scanning' && (
            <div className="py-16 flex flex-col items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#E8DCCF" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="36"
                    fill="none" stroke="#C9A84C" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-sans font-semibold text-gold text-sm">{progress}%</span>
              </div>
              <div className="text-center">
                <p className="font-heading text-xl text-ink mb-1">Reading&hellip;</p>
                <p className="font-body text-brown-lighter text-sm italic">Deciphering your handwriting, please wait.</p>
              </div>
              {/* Animated scan line */}
              <div className="w-64 h-1 bg-parchment-dark rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full animate-pulse" style={{ width: `${progress}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          {/* ── RESULT ────────────────────────────────── */}
          {step === 'result' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-sans font-medium text-brown-lighter uppercase tracking-wider">Detected Text — Edit before inserting</p>
                <button onClick={reset} className="text-xs text-gold hover:text-gold-dark font-sans flex items-center gap-1">
                  <RefreshCw size={12} /> Scan again
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={14}
                  className="w-full p-4 bg-white border border-parchment-dark rounded-xl font-body text-brown leading-relaxed text-sm resize-y focus:outline-none focus:border-gold transition-colors"
                  placeholder="Detected text will appear here…"
                  style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '15px', lineHeight: '1.8' }}
                />
                <p className="absolute bottom-3 right-3 text-xs text-brown-lighter/50 font-sans pointer-events-none">
                  {editedText.split(/\s+/).filter(Boolean).length} words
                </p>
              </div>

              {/* Side by side preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl overflow-hidden border border-parchment-dark">
                  <p className="text-xs px-3 py-1.5 bg-parchment-dark/40 font-sans text-brown-lighter">Original</p>
                  <img src={imageSrc} alt="Original scan" className="w-full object-contain max-h-40" />
                </div>
                <div className="rounded-xl border border-parchment-dark overflow-hidden">
                  <p className="text-xs px-3 py-1.5 bg-parchment-dark/40 font-sans text-brown-lighter">Preview</p>
                  <div
                    className="p-3 prose-literary text-sm max-h-40 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: textToHtml(editedText) }}
                  />
                </div>
              </div>

              <button
                onClick={handleInsert}
                disabled={!editedText.trim()}
                className="w-full btn-gold flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
              >
                <Check size={18} /> Insert into Editor
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
