import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, Scan, Check, RefreshCw, ZoomIn, ZoomOut, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Convert plain text to HTML preserving paragraph breaks. */
function textToHtml(text) {
  if (!text) return '';
  const paras = [];
  let current = [];
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const t = line.trim();
    if (!t) {
      if (current.length) { paras.push(current.join(' ')); current = []; }
    } else {
      current.push(t);
    }
  }
  if (current.length) paras.push(current.join(' '));
  return paras.map((p) => `<p>${p}</p>`).join('\n') || '';
}

export default function HandwritingScanner({ onInsert, onClose }) {
  const [step, setStep] = useState('capture');      // capture | preview | scanning | result
  const [captureMode, setCaptureMode] = useState('camera'); // camera | upload
  const [imageSrc, setImageSrc] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [dots, setDots] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const textareaRef = useRef(null);

  // Animated dots for scanning
  useEffect(() => {
    if (step !== 'scanning') return;
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(id);
  }, [step]);

  // Auto-focus textarea when result step is shown
  useEffect(() => {
    if (step === 'result' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [step]);

  // Camera helpers
  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError('Camera access denied — please allow permissions, or use Upload instead.');
      setCaptureMode('upload');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (captureMode === 'camera' && step === 'capture') startCamera();
    return () => { if (step === 'capture') stopCamera(); };
  }, [captureMode, step]);

  // Capture from camera
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    stopCamera();
    setImageSrc(canvas.toDataURL('image/jpeg', 0.95));
    setStep('preview');
  };

  // Upload from file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImageSrc(ev.target.result); setStep('preview'); };
    reader.readAsDataURL(file);
  };

  // Call secure backend OCR endpoint (Mistral Pixtral - free tier, key never exposed)
  const runOCR = async () => {
    setStep('scanning');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: imageSrc, mimeType: 'image/jpeg' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'OCR failed');
      const text = data?.text || '';
      if (!text) throw new Error('No text detected in the image.');
      setOcrText(text);
      setEditedText(text);
      setStep('result');
    } catch (err) {
      setError(err.message || 'OCR failed. Please try again.');
      setStep('preview');
    }
  };

  // Insert into editor
  const handleInsert = () => {
    onInsert(textToHtml(editedText));
    onClose();
  };

  // Reset everything
  const reset = () => {
    setImageSrc(null);
    setOcrText('');
    setEditedText('');
    setError('');
    setZoom(1);
    setStep('capture');
    if (captureMode === 'camera') startCamera();
  };

  const STEPS = ['capture', 'preview', 'result'];
  const stepIdx = step === 'scanning' ? 1 : STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-brown/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="w-full max-w-2xl bg-parchment rounded-2xl shadow-warm-lg flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-dark flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center">
              <Scan size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="font-heading text-xl text-ink">Handwriting Scanner</h2>
              <p className="text-xs font-sans text-brown-lighter">
                {step === 'capture' && 'Align your handwritten notes in the frame.'}
                {step === 'preview' && 'Review image before AI scanning.'}
                {step === 'scanning' && 'Gemini AI is reading your handwriting…'}
                {step === 'result' && 'Review & edit the text, then insert.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-brown-lighter hover:text-ink rounded-xl hover:bg-parchment-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-semibold transition-colors ${stepIdx > i ? 'bg-sage/40 text-sage-dark' : stepIdx === i ? 'bg-gold text-white' : 'bg-parchment-dark text-brown-lighter'
                  }`}>
                  {stepIdx > i ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs font-sans text-brown-lighter capitalize">{s}</span>
                {i < STEPS.length - 1 && <ChevronRight size={14} className="text-parchment-dark" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-sans">
              {error}
            </div>
          )}

          {/* ── CAPTURE ─────────────────────────────────────────────── */}
          {step === 'capture' && (
            <div className="space-y-4">
              <div className="flex gap-2 justify-center">
                {['camera', 'upload'].map((m) => (
                  <button key={m} onClick={() => setCaptureMode(m)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-sans font-medium transition-all capitalize ${captureMode === m ? 'bg-ink text-white' : 'bg-parchment-dark text-brown hover:bg-parchment-dark/70'}`}>
                    {m === 'camera' ? <Camera size={15} /> : <Upload size={15} />} {m === 'camera' ? 'Camera' : 'Upload Photo'}
                  </button>
                ))}
              </div>

              {captureMode === 'camera' ? (
                <div className="relative rounded-2xl overflow-hidden bg-ink" style={{ aspectRatio: '16/9' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Corner guides */}
                  <div className="absolute inset-4 border-2 border-gold/50 rounded-xl pointer-events-none">
                    {[['top-0 left-0 border-t-2 border-l-2 rounded-tl-xl'], ['top-0 right-0 border-t-2 border-r-2 rounded-tr-xl'],
                    ['bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl'], ['bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl']
                    ].map(([cls], i) => <div key={i} className={`absolute w-6 h-6 border-gold ${cls}`} />)}
                  </div>
                  <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-xs font-sans bg-black/40 px-3 py-1 rounded-full whitespace-nowrap">
                    Keep notes flat and well-lit
                  </p>
                </div>
              ) : (
                <label htmlFor="scanner-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gold/40 hover:border-gold rounded-2xl cursor-pointer bg-parchment-dark/20 hover:bg-gold/5 transition-colors group"
                  style={{ minHeight: '200px' }}>
                  <Upload size={36} className="text-gold/50 group-hover:text-gold transition-colors mb-3" />
                  <p className="font-body text-brown-lighter group-hover:text-brown text-center px-4">Click to upload a photo of your handwritten notes</p>
                  <p className="text-xs text-brown-lighter/60 mt-1 font-sans">JPG, PNG, WEBP · Good lighting = better results</p>
                  <input id="scanner-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {captureMode === 'camera' && (
                <button onClick={capturePhoto} className="w-full btn-gold flex items-center justify-center gap-2 py-3">
                  <Camera size={18} /> Capture Photo
                </button>
              )}
            </div>
          )}

          {/* ── PREVIEW ─────────────────────────────────────────────── */}
          {step === 'preview' && imageSrc && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden bg-ink flex items-center justify-center" style={{ minHeight: '200px' }}>
                <div className="overflow-auto w-full flex items-center justify-center p-2">
                  <img src={imageSrc} alt="Captured"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s', maxWidth: '100%' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} className="p-2 rounded-lg bg-parchment-dark hover:bg-gold/10 text-brown-lighter hover:text-gold transition-colors"><ZoomOut size={16} /></button>
                <span className="text-xs font-sans text-brown-lighter w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))} className="p-2 rounded-lg bg-parchment-dark hover:bg-gold/10 text-brown-lighter hover:text-gold transition-colors"><ZoomIn size={16} /></button>
                <button onClick={() => setZoom(1)} className="p-2 rounded-lg bg-parchment-dark hover:bg-gold/10 text-brown-lighter hover:text-gold transition-colors"><RotateCcw size={16} /></button>
              </div>

              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 btn-outline flex items-center justify-center gap-2 py-3"><RefreshCw size={15} /> Retake</button>
                <button onClick={runOCR} className="flex-1 btn-gold flex items-center justify-center gap-2 py-3"><Scan size={18} /> Scan with Gemini AI</button>
              </div>
            </div>
          )}

          {/* ── SCANNING ────────────────────────────────────────────── */}
          {step === 'scanning' && (
            <div className="py-20 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <Loader2 size={32} className="text-gold animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-heading text-xl text-ink mb-1">Reading your handwriting{dots}</p>
                <p className="font-body text-brown-lighter text-sm italic">Gemini AI is analysing every word.</p>
              </div>
            </div>
          )}

          {/* ── RESULT ──────────────────────────────────────────────── */}
          {step === 'result' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-sans font-medium text-brown-lighter uppercase tracking-wider">
                  Detected Text — edit freely before inserting
                </p>
                <button onClick={reset} className="text-xs text-gold hover:text-gold-dark font-sans flex items-center gap-1">
                  <RefreshCw size={12} /> Scan again
                </button>
              </div>

              {/* Big, fully-clickable textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-4 bg-white border-2 border-parchment-dark rounded-xl font-body text-brown leading-relaxed text-base focus:border-gold focus:outline-none transition-colors cursor-text"
                  style={{
                    fontFamily: "'Lora', Georgia, serif",
                    lineHeight: '1.85',
                    resize: 'vertical',
                    minHeight: '260px',
                    caretColor: '#C9A84C',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                  }}
                  placeholder="Transcribed text will appear here…"
                  spellCheck
                  onClick={(e) => e.currentTarget.focus()}
                />
                <span className="absolute bottom-2 right-3 text-xs text-brown-lighter/40 font-sans pointer-events-none">
                  {editedText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {/* Side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl overflow-hidden border border-parchment-dark">
                  <p className="text-xs px-3 py-1.5 bg-parchment-dark/40 font-sans text-brown-lighter">Original Scan</p>
                  <img src={imageSrc} alt="Original" className="w-full object-contain" style={{ maxHeight: '120px' }} />
                </div>
                <div className="rounded-xl border border-parchment-dark overflow-hidden">
                  <p className="text-xs px-3 py-1.5 bg-parchment-dark/40 font-sans text-brown-lighter">Formatted Preview</p>
                  <div className="p-3 prose-literary text-sm overflow-y-auto" style={{ maxHeight: '120px' }}
                    dangerouslySetInnerHTML={{ __html: textToHtml(editedText) }} />
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
