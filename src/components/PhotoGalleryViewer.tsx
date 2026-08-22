import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  extractGoogleDriveId,
  getDrivePreviewIframeUrl,
  getDriveViewUrl,
  getDriveDirectImageCandidates,
  getCachedPhoto,
  loadDriveImageWithAuth
} from '../utils/photoCache';

interface PhotoGalleryViewerProps {
  fotoBukti?: string;
  fotoBuktiList?: string[];
  title?: string;
  compact?: boolean; // If true, display in table-friendly format
}

/**
 * Extracts list of photos from single string or array, handling newline-separated, comma-separated, or JSON strings.
 */
export const getPhotosFromAduan = (fotoBukti?: string, fotoBuktiList?: string[]): string[] => {
  if (fotoBuktiList && Array.isArray(fotoBuktiList) && fotoBuktiList.length > 0) {
    const valid = fotoBuktiList.filter((p) => p && typeof p === 'string' && p.trim() !== '' && p !== '-');
    if (valid.length > 0) return valid;
  }

  if (fotoBukti && typeof fotoBukti === 'string' && fotoBukti.trim() !== '' && fotoBukti !== '-') {
    const trimmed = fotoBukti.trim();

    // Check if it's a JSON array string like '["http...", "http..."]'
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = parsed.filter((p) => typeof p === 'string' && p.trim() !== '' && p !== '-');
          if (list.length > 0) return list;
        }
      } catch {
        // Continue with string splits
      }
    }

    // Check for newline separated
    if (trimmed.includes('\n')) {
      return trimmed
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s && s !== '-');
    }

    // Check for comma separated (only if not a data URL with comma)
    if (trimmed.includes(',') && !trimmed.startsWith('data:image')) {
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== '-');
    }

    return [trimmed];
  }

  return [];
};

/**
 * Converts Google Drive file URLs or raw IDs into direct preview candidate
 */
export const getDirectImageUrl = (urlOrData: string, candidateIndex: number = 0): string => {
  if (!urlOrData || urlOrData === '-' || typeof urlOrData !== 'string') return '';

  const trimmed = urlOrData.trim();
  if (trimmed.startsWith('data:image') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    const candidates = getDriveDirectImageCandidates(driveId);
    const safeIndex = Math.min(Math.max(0, candidateIndex), candidates.length - 1);
    return candidates[safeIndex];
  }

  return trimmed;
};

interface SinglePhotoItemProps {
  rawPhoto: string;
  index: number;
  totalPhotos: number;
  onOpen: (index: number) => void;
}

/**
 * Robust Thumbnail Component that checks cache, Auth Token, and cascading CDNs
 */
const PhotoThumbnail: React.FC<SinglePhotoItemProps> = ({
  rawPhoto,
  index,
  totalPhotos,
  onOpen
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [candidateIdx, setCandidateIdx] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const driveId = extractGoogleDriveId(rawPhoto);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setCandidateIdx(0);

    const resolvePhoto = async () => {
      // 1. Direct Base64 / Blob
      if (rawPhoto.startsWith('data:image') || rawPhoto.startsWith('blob:')) {
        if (isMounted) {
          setImgSrc(rawPhoto);
          setIsLoading(false);
        }
        return;
      }

      // 2. Check local photo cache (IndexedDB)
      const cached = await getCachedPhoto(rawPhoto);
      if (cached && isMounted) {
        setImgSrc(cached);
        setIsLoading(false);
        return;
      }

      // 3. If Drive ID, attempt auth load
      if (driveId) {
        const authBlob = await loadDriveImageWithAuth(driveId);
        if (authBlob && isMounted) {
          setImgSrc(authBlob);
          setIsLoading(false);
          return;
        }
      }

      // 4. Default candidate URL
      if (isMounted) {
        setImgSrc(getDirectImageUrl(rawPhoto, 0));
        setIsLoading(false);
      }
    };

    resolvePhoto();

    return () => {
      isMounted = false;
    };
  }, [rawPhoto, driveId]);

  const handleImgError = () => {
    if (driveId) {
      const candidates = getDriveDirectImageCandidates(driveId);
      if (candidateIdx + 1 < candidates.length) {
        const nextIdx = candidateIdx + 1;
        setCandidateIdx(nextIdx);
        setImgSrc(candidates[nextIdx]);
        return;
      }
    }
    setHasError(true);
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      title={`Klik untuk melihat foto bukti #${index + 1} (${totalPhotos} foto)`}
      className="relative cursor-pointer group rounded-lg overflow-hidden border-2 border-slate-300 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all bg-slate-900 w-12 h-12 flex items-center justify-center shrink-0"
    >
      {!hasError && imgSrc ? (
        <img
          src={imgSrc}
          alt={`Bukti #${index + 1}`}
          referrerPolicy="no-referrer"
          onError={handleImgError}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
        />
      ) : (
        <div className="w-full h-full bg-linear-to-br from-emerald-800 to-slate-900 text-white flex flex-col items-center justify-center text-[9px] font-bold p-1">
          <ImageIcon className="w-4 h-4 text-emerald-300 mb-0.5" />
          <span className="text-[8px] leading-none text-emerald-200">Foto {index + 1}</span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
          <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Hover overlay with Eye Icon */}
      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <Eye className="w-4 h-4 text-white drop-shadow" />
      </div>
    </button>
  );
};

export const PhotoGalleryViewer: React.FC<PhotoGalleryViewerProps> = ({
  fotoBukti,
  fotoBuktiList,
  title = 'Bukti Foto',
  compact = false
}) => {
  const rawPhotos = getPhotosFromAduan(fotoBukti, fotoBuktiList);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [activeViewMode, setActiveViewMode] = useState<'image' | 'iframe'>('image');
  const [currentImgSrc, setCurrentImgSrc] = useState<string>('');
  const [imgLoadFailed, setImgLoadFailed] = useState<boolean>(false);
  const [candidateAttempt, setCandidateAttempt] = useState<number>(0);
  const [isResolving, setIsResolving] = useState<boolean>(false);

  const selectedPhoto = selectedPhotoIndex !== null ? rawPhotos[selectedPhotoIndex] : null;
  const currentDriveId = selectedPhoto ? extractGoogleDriveId(selectedPhoto) : null;

  // Resolve current active photo in Lightbox
  const resolveLightboxPhoto = useCallback(async (rawPhoto: string) => {
    setIsResolving(true);
    setImgLoadFailed(false);
    setCandidateAttempt(0);

    // 1. Direct Base64 / Blob
    if (rawPhoto.startsWith('data:image') || rawPhoto.startsWith('blob:')) {
      setCurrentImgSrc(rawPhoto);
      setActiveViewMode('image');
      setIsResolving(false);
      return;
    }

    // 2. Check local photo cache
    const cached = await getCachedPhoto(rawPhoto);
    if (cached) {
      setCurrentImgSrc(cached);
      setActiveViewMode('image');
      setIsResolving(false);
      return;
    }

    const driveId = extractGoogleDriveId(rawPhoto);
    if (driveId) {
      // 3. Try OAuth Bearer Token fetch
      const authBlob = await loadDriveImageWithAuth(driveId);
      if (authBlob) {
        setCurrentImgSrc(authBlob);
        setActiveViewMode('image');
        setIsResolving(false);
        return;
      }

      // Default candidate URL
      const candidateUrl = getDirectImageUrl(rawPhoto, 0);
      setCurrentImgSrc(candidateUrl);
      setIsResolving(false);
    } else {
      setCurrentImgSrc(rawPhoto);
      setActiveViewMode('image');
      setIsResolving(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPhotoIndex !== null && rawPhotos[selectedPhotoIndex]) {
      resolveLightboxPhoto(rawPhotos[selectedPhotoIndex]);
    }
  }, [selectedPhotoIndex, rawPhotos, resolveLightboxPhoto]);

  if (rawPhotos.length === 0) {
    return compact ? (
      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium">
        <ImageIcon className="w-3 h-3 text-slate-400" />
        Tanpa Bukti Foto
      </span>
    ) : null;
  }

  const handleOpenLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
    setZoomLevel(1);
    setRotation(0);
    setActiveViewMode('image');
  };

  const handleCloseLightbox = () => {
    setSelectedPhotoIndex(null);
    setZoomLevel(1);
    setRotation(0);
    setCurrentImgSrc('');
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex < rawPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
      setZoomLevel(1);
      setRotation(0);
      setActiveViewMode('image');
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
      setZoomLevel(1);
      setRotation(0);
      setActiveViewMode('image');
    }
  };

  const handleMainImgError = () => {
    if (currentDriveId) {
      const candidates = getDriveDirectImageCandidates(currentDriveId);
      if (candidateAttempt + 1 < candidates.length) {
        const nextAttempt = candidateAttempt + 1;
        setCandidateAttempt(nextAttempt);
        setCurrentImgSrc(candidates[nextAttempt]);
        return;
      }
      // If all direct image CDNs fail for Google Drive, automatically switch to iframe preview mode
      setImgLoadFailed(true);
      setActiveViewMode('iframe');
    } else {
      setImgLoadFailed(true);
    }
  };

  const renderLightboxModal = () => {
    if (selectedPhotoIndex === null || !selectedPhoto) return null;

    const driveViewUrl = getDriveViewUrl(selectedPhoto);
    const iframePreviewUrl = currentDriveId ? getDrivePreviewIframeUrl(currentDriveId) : null;

    return (
      <div
        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn"
        onClick={handleCloseLightbox}
      >
        <div
          className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-5xl w-full p-3 sm:p-5 text-white shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-950/80 border border-emerald-700/50 rounded-lg text-emerald-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{title}</span>
                  <span className="text-emerald-400 font-extrabold">
                    ({selectedPhotoIndex + 1} / {rawPhotos.length})
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  {currentDriveId ? 'File Google Drive' : 'Foto Dokumen Langsung'}
                </p>
              </div>
            </div>

            {/* Toolbar Controls */}
            <div className="flex items-center flex-wrap gap-1.5">
              {/* Drive vs Direct Image View Switcher */}
              {iframePreviewUrl && (
                <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs mr-1">
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('image')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                      activeViewMode === 'image'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Gambar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('iframe')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                      activeViewMode === 'iframe'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Drive Preview</span>
                  </button>
                </div>
              )}

              {/* Direct image zoom/rotate controls (active in image mode) */}
              {activeViewMode === 'image' && !imgLoadFailed && (
                <>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                    title="Perbesar (Zoom In)"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white text-xs"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                    title="Perkecil (Zoom Out)"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white text-xs"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    title="Putar Foto (Rotate)"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white text-xs"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Open in Drive Link */}
              {selectedPhoto && (selectedPhoto.startsWith('http') || currentDriveId) && (
                <a
                  href={driveViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka File Asli di Google Drive / Tab Baru"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs flex items-center gap-1 font-semibold px-2 border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Buka Link</span>
                </a>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseLightbox}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Stage */}
          <div className="relative flex-1 my-3 min-h-[340px] max-h-[66vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/90 border border-slate-800">
            {/* Previous Navigation Button */}
            {selectedPhotoIndex > 0 && (
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-slate-900/85 hover:bg-slate-800 text-white p-2 sm:p-2.5 rounded-full border border-slate-700 shadow-xl transition-transform active:scale-95 cursor-pointer"
                title="Foto Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Content Display: Direct Image or Drive Iframe */}
            <div className="w-full h-full flex items-center justify-center p-1 sm:p-2 overflow-auto">
              {isResolving ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
                  <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                  <p className="text-xs">Memuat foto bukti lampiran...</p>
                </div>
              ) : activeViewMode === 'iframe' && iframePreviewUrl ? (
                <div className="w-full h-full min-h-[420px] flex flex-col">
                  <iframe
                    src={iframePreviewUrl}
                    title={`Google Drive Preview #${selectedPhotoIndex + 1}`}
                    className="w-full flex-1 rounded-lg border-0 bg-white"
                    allow="autoplay"
                  />
                </div>
              ) : !imgLoadFailed && currentImgSrc ? (
                <img
                  src={currentImgSrc}
                  alt={`Bukti Foto #${selectedPhotoIndex + 1}`}
                  referrerPolicy="no-referrer"
                  onError={handleMainImgError}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-out'
                  }}
                  className="max-h-[62vh] max-w-full object-contain rounded select-none shadow-2xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-md gap-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <div>
                    <h5 className="text-sm font-bold text-white mb-1">
                      Foto Memerlukan Akses Tampilan Langsung
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Foto ini tersimpan di Google Drive. Anda dapat menampilkannya melalui mode Google Drive Preview atau membuka tautan langsung.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {iframePreviewUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setImgLoadFailed(false);
                          setActiveViewMode('iframe');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Buka Drive Preview</span>
                      </button>
                    )}

                    <a
                      href={driveViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka di Google Drive</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Next Navigation Button */}
            {selectedPhotoIndex < rawPhotos.length - 1 && (
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-slate-900/85 hover:bg-slate-800 text-white p-2 sm:p-2.5 rounded-full border border-slate-700 shadow-xl transition-transform active:scale-95 cursor-pointer"
                title="Foto Selanjutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Footer / Thumbnails Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
              {rawPhotos.map((rawP, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedPhotoIndex(i);
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className={`h-11 w-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 relative bg-slate-800 ${
                    selectedPhotoIndex === i
                      ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-900/60 ring-2 ring-emerald-500/50'
                      : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getDirectImageUrl(rawP, 0)}
                    alt={`Foto ${i + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Silently replace broken image element with fallback style
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-300 bg-slate-900/40 pointer-events-none">
                    #{i + 1}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden md:inline">
                Tekan tombol panah untuk melihat foto lain
              </span>
              <button
                type="button"
                onClick={handleCloseLightbox}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Compact layout (table cells in Wali Kelas Dashboard or Admin)
  if (compact) {
    return (
      <div className="flex flex-col items-start gap-1.5 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {rawPhotos.slice(0, 3).map((rawPhoto, idx) => (
            <PhotoThumbnail
              key={idx}
              rawPhoto={rawPhoto}
              index={idx}
              totalPhotos={rawPhotos.length}
              onOpen={handleOpenLightbox}
            />
          ))}

          {rawPhotos.length > 3 && (
            <button
              type="button"
              onClick={() => handleOpenLightbox(3)}
              className="text-[10px] font-extrabold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-3 rounded-lg border border-emerald-300 cursor-pointer shadow-xs transition-colors flex items-center gap-0.5"
            >
              +{rawPhotos.length - 3}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleOpenLightbox(0)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-700" />
          <span>Lihat Preview ({rawPhotos.length} Foto)</span>
        </button>

        {renderLightboxModal()}
      </div>
    );
  }

  // Standard Card / Detail Layout
  return (
    <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
          <ImageIcon className="w-4 h-4 text-emerald-700" />
          <span>
            {title} ({rawPhotos.length} Foto)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {rawPhotos.map((photo, idx) => (
          <div
            key={idx}
            onClick={() => handleOpenLightbox(idx)}
            className="relative cursor-pointer group rounded-lg overflow-hidden border border-slate-300 bg-slate-900 shadow-xs aspect-4/3 flex items-center justify-center hover:border-emerald-500 transition-all"
          >
            <img
              src={getDirectImageUrl(photo, 0)}
              alt={`Bukti Foto ${idx + 1}`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-1.5 left-1.5 bg-slate-950/80 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-xs">
              #{idx + 1}
            </div>

            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Eye className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </div>

      {renderLightboxModal()}
    </div>
  );
};
