import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Smartphone, Plus, Eye, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';

interface CameraUploaderProps {
  value?: string; // Legacy single string
  values?: string[]; // Multiple photos array
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

export const CameraUploader: React.FC<CameraUploaderProps> = ({
  value,
  values,
  onChange,
  maxFiles = 10
}) => {
  // Normalize internal photos array
  const currentPhotos: string[] = React.useMemo(() => {
    if (values && Array.isArray(values)) {
      return values.filter(Boolean);
    }
    if (value) {
      return [value];
    }
    return [];
  }, [values, value]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<{ src: string; index: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (targetMode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);

    // Stop existing stream if switching
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (cameraFileInputRef.current) {
        cameraFileInputRef.current.setAttribute('capture', targetMode === 'environment' ? 'environment' : 'user');
        cameraFileInputRef.current.click();
      } else {
        setCameraError('Fitur kamera tidak didukung di browser ini. Silakan gunakan "Unggah File Foto".');
      }
      return;
    }

    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: targetMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: targetMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
          });
        } catch {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      setStream(mediaStream);
      setFacingMode(targetMode);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err: any) {
      console.error('Kamera gagal dibuka:', err);
      if (cameraFileInputRef.current) {
        cameraFileInputRef.current.setAttribute('capture', targetMode === 'environment' ? 'environment' : 'user');
        cameraFileInputRef.current.click();
        return;
      }
      let errorMsg = 'Gagal mengakses kamera. Silakan periksa izin kamera di browser Anda atau gunakan "Unggah File Foto".';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errorMsg = 'Akses kamera ditolak. Harap klik "Izinkan / Allow" kamera di browser Anda.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errorMsg = 'Perangkat kamera tidak ditemukan. Silakan gunakan "Unggah File Foto".';
      }
      setCameraError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const updated = [...currentPhotos, dataUrl];
        onChange(updated);
        stopCamera();
      }
    }
  };

  const compressAndReadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1200;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
              resolve(compressedDataUrl);
            } else {
              resolve(reader.result as string);
            }
          };
          img.onerror = () => resolve(reader.result as string);
          img.src = reader.result;
        } else {
          reject(new Error('Gagal membaca data file gambar'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const newPhotoPromises: Promise<string>[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          if (file.size <= 15 * 1024 * 1024) {
            newPhotoPromises.push(compressAndReadImage(file));
          } else {
            console.warn(`File ${file.name} melebihi batas 15MB`);
          }
        }
      }

      const newPhotos = await Promise.all(newPhotoPromises);
      if (newPhotos.length > 0) {
        const updated = [...currentPhotos, ...newPhotos].slice(0, maxFiles);
        onChange(updated);
      }
    } catch (err) {
      console.error('Gagal mengolah file foto:', err);
    } finally {
      setIsProcessing(false);
      // Reset file input value so re-selecting same file triggers change
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const updated = currentPhotos.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleClearAllPhotos = () => {
    if (window.confirm('Hapus semua lampiran foto bukti?')) {
      onChange([]);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* 1. Camera View Screen */}
      {isCameraActive ? (
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border-2 border-teal-500 shadow-xl">
          {/* Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-56 md:h-64 object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            onLoadedMetadata={() => videoRef.current?.play()}
          />

          {/* Top Control Bar: Camera Selection Buttons (Front / Back) */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-white/20">
            <span className="text-[10px] font-bold text-teal-200 uppercase px-1 hidden sm:inline">
              Pilih Kamera:
            </span>

            <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  facingMode === 'environment'
                    ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-300'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kamera Belakang</span>
              </button>

              <button
                type="button"
                onClick={() => startCamera('user')}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  facingMode === 'user'
                    ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-300'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Kamera Depan</span>
              </button>
            </div>
          </div>

          {/* Bottom Actions: Capture & Cancel */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 px-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs uppercase tracking-wide border-2 border-emerald-300 transition-transform"
            >
              <Camera className="w-4 h-4" />
              <span>Jepret Foto Ini</span>
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-white font-semibold px-4 py-2.5 rounded-full text-xs border border-slate-600 backdrop-blur-sm"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {/* 2. Gallery of Attached Photos */}
      {currentPhotos.length > 0 && !isCameraActive && (
        <div className="bg-slate-50 border border-teal-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-teal-950 uppercase">
              <ImageIcon className="w-4 h-4 text-teal-700" />
              <span>Bukti Foto Terlampir ({currentPhotos.length})</span>
            </div>
            {currentPhotos.length > 1 && (
              <button
                type="button"
                onClick={handleClearAllPhotos}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Hapus Semua
              </button>
            )}
          </div>

          {/* Grid of thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {currentPhotos.map((imgSrc, idx) => (
              <div
                key={idx}
                className="relative group rounded-lg overflow-hidden border-2 border-teal-400/80 bg-slate-900 shadow-sm aspect-4/3 flex items-center justify-center"
              >
                <img
                  src={imgSrc}
                  alt={`Bukti Foto ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />

                {/* Badge Number */}
                <div className="absolute top-1.5 left-1.5 bg-teal-900/90 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                  #{idx + 1}
                </div>

                {/* Hover Overlay Controls */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalImg({ src: imgSrc, index: idx })}
                    className="bg-teal-600 hover:bg-teal-500 text-white p-1.5 rounded-full shadow-xs transition-transform active:scale-95"
                    title="Perbesar Foto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-full shadow-xs transition-transform active:scale-95"
                    title="Hapus Foto Ini"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-teal-800/80 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Foto tersimpan siap di-upload ke Google Drive & otomatis dicatat ke Google Sheets.</span>
          </div>
        </div>
      )}

      {/* 3. Action Buttons (Add from Camera / Add from File Upload) */}
      {!isCameraActive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => startCamera('environment')}
            id="btn-take-photo"
            className="h-11 bg-teal-50/60 hover:bg-teal-100/80 border-2 border-dashed border-teal-300 hover:border-teal-600 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all text-teal-900 font-bold text-xs active:scale-98"
          >
            {currentPhotos.length > 0 ? (
              <>
                <Plus className="w-4 h-4 text-teal-700" />
                <span>+ Tambah Foto dari Kamera</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-teal-600" />
                <span>Ambil Foto Langsung (Kamera)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            id="btn-upload-file"
            disabled={isProcessing}
            className="h-11 bg-blue-50/60 hover:bg-blue-100/80 border-2 border-dashed border-blue-300 hover:border-blue-600 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all text-blue-950 font-bold text-xs active:scale-98 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="animate-pulse">Mengolah foto...</span>
            ) : currentPhotos.length > 0 ? (
              <>
                <Plus className="w-4 h-4 text-blue-600" />
                <span>+ Tambah / Unggah File Foto</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Unggah File Foto (Bisa &gt;1)</span>
              </>
            )}
          </button>

          {/* Hidden inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <input
            type="file"
            ref={cameraFileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {cameraError && (
        <p className="text-[11px] text-rose-600 font-medium italic mt-1 bg-rose-50 p-2 rounded border border-rose-200">
          {cameraError}
        </p>
      )}

      {/* 4. Enlarge Preview Lightbox Modal */}
      {previewModalImg && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-teal-300">
                Pratinjau Foto #{previewModalImg.index + 1} dari {currentPhotos.length}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 max-h-[70vh] flex items-center justify-center overflow-hidden rounded-lg bg-black">
              <img
                src={previewModalImg.src}
                alt="Pratinjau Foto"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="w-full flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  handleRemovePhoto(previewModalImg.index);
                  setPreviewModalImg(null);
                }}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-rose-950/50"
              >
                <Trash2 className="w-4 h-4" /> Hapus Foto Ini
              </button>

              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
