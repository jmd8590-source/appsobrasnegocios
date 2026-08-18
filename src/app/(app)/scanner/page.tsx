'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Upload, Zap, AlertCircle, Loader2, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import type { AnalyzeScrapResponse, ReferenceObject, ScrapAnalysis } from '@/types';
import { AnalysisResultForm } from '@/components/scanner/AnalysisResultForm';

type ScanStep = 'camera' | 'preview' | 'analyzing' | 'result';

const referenceOptions: { value: ReferenceObject; label: string; icon: string; description: string }[] = [
  { value: 'coin', label: 'Moneda 2€', icon: '🪙', description: 'Coloca una moneda de 2€ junto al material' },
  { value: 'hand', label: 'Mano', icon: '✋', description: 'Coloca tu mano abierta junto al material' },
  { value: 'tape', label: 'Cinta métrica', icon: '📏', description: 'Coloca una cinta métrica visible en la imagen' },
];

export default function ScannerPage() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ScanStep>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedReference, setSelectedReference] = useState<ReferenceObject>('hand');
  const [analysisResult, setAnalysisResult] = useState<ScrapAnalysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setStep('preview');
      }
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Imagen demasiado grande', description: 'El límite es 10MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
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

      const data: AnalyzeScrapResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error ?? 'Error desconocido');
      }

      setAnalysisResult(data.data);
      setIsDemo(data.isDemo ?? false);
      setStep('result');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al analizar la imagen';
      toast({ title: 'Error de análisis', description: message, variant: 'destructive' });
      setStep('preview');
    }
  };

  const handleSaved = () => {
    toast({ title: '✅ Sobrante guardado', description: 'Añadido a tu inventario correctamente' });
    handleRetake();
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col fade-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Camera className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Escáner IA</h1>
            <p className="text-xs text-slate-500">Fotografía el material para identificarlo</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mt-4">
          {['camera', 'preview', 'analyzing', 'result'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? 'bg-amber-500 text-slate-950' :
                ['camera', 'preview', 'analyzing', 'result'].indexOf(step) > i ? 'bg-emerald-600 text-white' :
                'bg-slate-800 text-slate-500'
              }`}>
                {['camera', 'preview', 'analyzing', 'result'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 rounded-full ${['camera', 'preview', 'analyzing', 'result'].indexOf(step) > i ? 'bg-emerald-600' : 'bg-slate-800'}`} />}
            </div>
          ))}
          <p className="ml-2 text-xs text-slate-500 capitalize">
            {step === 'camera' ? 'Captura' : step === 'preview' ? 'Previsualiza' : step === 'analyzing' ? 'Analizando...' : 'Resultado'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4">
        {/* STEP: Camera */}
        {step === 'camera' && (
          <div className="space-y-4">
            {/* Reference selector */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">Referencia de escala (opcional):</p>
              <div className="flex gap-2">
                {referenceOptions.map((ref) => (
                  <button
                    key={ref.value}
                    onClick={() => setSelectedReference(ref.value)}
                    className={`flex-1 py-2 px-2 rounded-xl border text-center transition-all duration-200 ${
                      selectedReference === ref.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-lg block">{ref.icon}</span>
                    <span className="text-[10px] font-medium">{ref.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                💡 {referenceOptions.find((r) => r.value === selectedReference)?.description}
              </p>
            </div>

            {/* Camera view */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center h-72 gap-4 p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                  <div>
                    <p className="text-slate-300 font-medium mb-1">Cámara no disponible</p>
                    <p className="text-slate-500 text-sm">{cameraError}</p>
                    <p className="text-slate-500 text-xs mt-2">Permite el acceso a la cámara en la configuración del navegador</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir imagen
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
                    onUserMediaError={(err) => setCameraError(typeof err === 'string' ? err : 'No se puede acceder a la cámara')}
                    className="w-full aspect-video object-cover camera-feed"
                  />
                  {/* Camera overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-6 border-2 border-amber-500/50 rounded-xl" />
                    <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl" />
                    <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr" />
                    <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl" />
                    <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br" />
                  </div>
                  {/* Flip camera button */}
                  <button
                    onClick={toggleCamera}
                    className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors hover:bg-black/70"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Subir foto
              </Button>
              <button
                onClick={handleCapture}
                disabled={!!cameraError}
                className="relative flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-amber-500/30"
              >
                <Camera className="w-5 h-5" />
                Capturar
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && capturedImage && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800">
              <img src={capturedImage} alt="Imagen capturada" className="w-full object-contain max-h-80" />
              <div className="absolute top-3 right-3">
                <Badge variant="default" className="text-xs">Vista previa</Badge>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-200">
                Asegúrate de que el material ocupa la mayor parte de la imagen y la referencia de escala (<strong>{referenceOptions.find(r => r.value === selectedReference)?.label}</strong>) es visible.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetake} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Repetir
              </Button>
              <Button variant="amber" onClick={handleAnalyze} className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                Analizar
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Analyzing */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            {capturedImage && (
              <div className="relative w-48 h-36 rounded-2xl overflow-hidden border border-amber-500/30">
                <img src={capturedImage} alt="Analizando" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center animate-pulse">
                    <Zap className="w-6 h-6 text-slate-950" />
                  </div>
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="flex items-center gap-2 text-amber-400 mb-2 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Analizando imagen...</span>
              </div>
              <p className="text-sm text-slate-500">La IA está identificando el material y calculando su valor</p>
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
