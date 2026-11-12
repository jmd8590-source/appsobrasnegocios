'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Upload, Zap, AlertCircle, Loader2, Info, RefreshCw, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AnalysisResultForm } from '@/components/scanner/AnalysisResultForm';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const STEPS = ['camera', 'preview', 'analyzing', 'result'];

export default function ScannerPage() {
  const { t } = useLanguage();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('camera');
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedReference, setSelectedReference] = useState('hand');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  const referenceOptions = [
    { value: 'coin', label: t('scanner.refCoin'), icon: '🪙', description: t('scanner.refCoinDesc') },
    { value: 'hand', label: t('scanner.refHand'), icon: '✋', description: t('scanner.refHandDesc') },
    { value: 'tape', label: t('scanner.refTape'), icon: '📏', description: t('scanner.refTapeDesc') },
  ];

  const stepLabels = {
    camera: t('scanner.stepCapture'),
    preview: t('scanner.stepPreview'),
    analyzing: t('scanner.stepAnalyzing'),
    result: t('scanner.stepResult'),
  };

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setStep('preview');
      }
    }
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t('scanner.tooLargeTitle'), description: t('scanner.tooLargeDesc'), variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setStep('camera');
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setStep('analyzing');

    try {
      // Extract base64 from data URL
      const base64 = capturedImage.split(',')[1];
      const mimeTypeMatch = capturedImage.match(/data:([^;]+);base64/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      const response = await fetch('/api/analyze-scrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          referenceObject: selectedReference,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error ?? 'Unknown error');
      }

      setAnalysisResult(data.data);
      setIsDemo(data.isDemo ?? false);
      setStep('result');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('scanner.analysisErrorTitle');
      toast({ title: t('scanner.analysisErrorTitle'), description: message, variant: 'destructive' });
      setStep('preview');
    }
  };

  const handleSaved = () => {
    toast({ title: t('scanner.savedToastTitle'), description: t('scanner.savedToastDesc') });
    handleRetake();
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col fade-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center">
              <Camera className="w-5 h-5 text-accent" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink tracking-tight">{t('scanner.title')}</h1>
              <p className="text-xs text-ink-faint">{t('scanner.subtitle')}</p>
            </div>
          </div>
          <Link href="/manual-entry">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <PenSquare className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              {t('scanner.enterManually')}
            </Button>
          </Link>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mt-4" role="status" aria-label={stepLabels[step]}>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? 'bg-accent text-accent-ink' :
                STEPS.indexOf(step) > i ? 'bg-positive text-positive-ink' :
                'bg-surface-2 text-ink-faint'
              }`}>
                {STEPS.indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 rounded-full ${STEPS.indexOf(step) > i ? 'bg-positive' : 'bg-edge'}`} />}
            </div>
          ))}
          <p className="ml-2 text-xs text-ink-faint">{stepLabels[step]}</p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4">
        {/* STEP: Camera */}
        {step === 'camera' && (
          <div className="space-y-4">
            {/* Reference selector */}
            <div>
              <p className="text-xs text-ink-muted mb-2 font-medium">{t('scanner.referenceLabel')}</p>
              <div className="flex gap-2">
                {referenceOptions.map((ref) => (
                  <button
                    key={ref.value}
                    onClick={() => setSelectedReference(ref.value)}
                    aria-pressed={selectedReference === ref.value}
                    className={`flex-1 py-2 px-2 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                      selectedReference === ref.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-edge bg-surface text-ink-muted hover:border-edge-strong'
                    }`}
                  >
                    <span className="text-lg block" aria-hidden="true">{ref.icon}</span>
                    <span className="text-[10px] font-medium">{ref.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-ink-faint mt-1.5">
                💡 {referenceOptions.find((r) => r.value === selectedReference)?.description}
              </p>
            </div>

            {/* Camera view */}
            <div className="relative rounded-2xl overflow-hidden bg-surface border border-edge">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center h-72 gap-4 p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-danger" aria-hidden="true" />
                  <div>
                    <p className="text-ink-muted font-medium mb-1">{t('scanner.cameraUnavailable')}</p>
                    <p className="text-ink-faint text-sm">{cameraError}</p>
                    <p className="text-ink-faint text-xs mt-2">{t('scanner.allowCameraHint')}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t('scanner.uploadImage')}
                  </Button>
                </div>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.9}
                    videoConstraints={{ facingMode, width: 1280, height: 720 }}
                    onUserMediaError={(err) => setCameraError(typeof err === 'string' ? err : t('scanner.cameraUnavailable'))}
                    className="w-full aspect-video object-cover camera-feed"
                  />
                  {/* Camera overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-6 border-2 border-accent/40 rounded-xl" />
                    <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-accent rounded-tl" />
                    <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-accent rounded-tr" />
                    <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-accent rounded-bl" />
                    <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-accent rounded-br" />
                  </div>
                  {/* Flip camera button */}
                  <button
                    onClick={toggleCamera}
                    aria-label={t('scanner.flipCamera')}
                    title={t('scanner.flipCamera')}
                    className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors hover:bg-black/70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('scanner.uploadPhoto')}
              </Button>
              <button
                onClick={handleCapture}
                disabled={!!cameraError}
                className="relative flex-1 h-12 rounded-xl bg-accent hover:bg-accent-strong text-accent-ink font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <Camera className="w-5 h-5" aria-hidden="true" />
                {t('scanner.capture')}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} aria-label={t('scanner.uploadImage')} />
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && capturedImage && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-edge">
              <img src={capturedImage} alt={t('scanner.previewBadge')} className="w-full object-contain max-h-80" />
              <div className="absolute top-3 right-3">
                <Badge variant="default" className="text-xs">{t('scanner.previewBadge')}</Badge>
              </div>
            </div>

            <div className="rounded-xl border border-accent/25 bg-accent/5 p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs text-ink-muted">
                {t('scanner.previewHint', { ref: referenceOptions.find((r) => r.value === selectedReference)?.label })}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetake} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('scanner.retake')}
              </Button>
              <Button variant="amber" onClick={handleAnalyze} className="flex-1">
                <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('scanner.analyzeAI')}
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Analyzing */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 gap-6" role="status">
            {capturedImage && (
              <div className="relative w-48 h-36 rounded-2xl overflow-hidden border border-accent/25">
                <img src={capturedImage} alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center animate-pulse">
                    <Zap className="w-6 h-6 text-accent-ink" aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="flex items-center gap-2 text-accent mb-2 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span className="font-semibold">{t('scanner.analyzing')}</span>
              </div>
              <p className="text-sm text-ink-faint">{t('scanner.analyzingDesc')}</p>
            </div>
          </div>
        )}

        {/* STEP: Result */}
        {step === 'result' && analysisResult && (
          <AnalysisResultForm
            analysis={analysisResult}
            imageData={capturedImage}
            isDemo={isDemo}
            onSaved={handleSaved}
            onRetake={handleRetake}
          />
        )}
      </div>
    </div>
  );
}
