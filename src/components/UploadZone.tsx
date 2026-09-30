import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, CheckCircle2, ShieldCheck, AlertCircle, X, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { FileRecord, CompressionAnalysisResult } from '../types';

interface UploadZoneProps {
  onUploadSuccess: (files: FileRecord[]) => void;
  onCancel?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess, onCancel }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [encryptionStage, setEncryptionStage] = useState<'idle' | 'encrypting' | 'verified'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setError(null);
    const updated = [...selectedFiles, ...newFiles];
    setSelectedFiles(updated);

    // Run compression analysis (Section 13)
    try {
      const payload = updated.map(f => ({ originalName: f.name, size: f.size }));
      const analysis = await api.analyzeCompression(payload);
      setCompressionResult(analysis);
    } catch (e) {
      console.warn('Compression check note:', e);
    }
  }, [selectedFiles]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    const next = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(next);
    if (next.length === 0) {
      setCompressionResult(null);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setError(null);
    setUploadProgress(0);
    setEncryptionStage('idle');

    try {
      const res = await api.uploadFiles(selectedFiles, (pct) => {
        setUploadProgress(pct);
        if (pct >= 95) {
          setEncryptionStage('encrypting');
        }
      });

      setEncryptionStage('verified');
      setTimeout(() => {
        onUploadSuccess(res.files);
      }, 600);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
      setUploadProgress(null);
      setEncryptionStage('idle');
    }
  };

  return (
    <div className="relative rounded-lg border border-[rgba(23,23,23,0.14)] bg-white p-6 sm:p-8 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(23,23,23,0.1)]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-1">
            01 / VAULT INGESTION
          </span>
          <h2 className="text-xl font-display font-bold text-[#171717]">
            Upload Encrypted Objects
          </h2>
          <p className="text-xs text-[#5F5B55] mt-0.5">
            Files are authenticated with AES-256-GCM and hashed with SHA-256 prior to isolation.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded p-1.5 text-[#5F5B55] hover:bg-[#EBE9E1] hover:text-[#171717] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Editorial Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-6 flex flex-col items-center justify-center rounded border-2 border-dashed p-8 sm:p-10 transition-all cursor-pointer ${
          isDragging
            ? 'border-[#E43D12] bg-[#E43D12]/5'
            : 'border-[rgba(23,23,23,0.2)] bg-[#FAF8F5] hover:border-[#E43D12] hover:bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesAdded(Array.from(e.target.files));
          }}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EBE9E1] text-[#E43D12]">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-base font-display font-bold uppercase tracking-wider text-[#171717]">
          Drop Files Here
        </h3>
        <p className="mt-1 text-xs text-[#5F5B55]">
          Drag and drop sensitive files, or{' '}
          <span className="font-semibold text-[#E43D12] underline underline-offset-2">browse filesystem</span>
        </p>

        {/* Technical Footer Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono tracking-wider text-[#5F5B55] uppercase border-t border-[rgba(23,23,23,0.1)] pt-4">
          <span>AES-256-GCM</span>
          <span>•</span>
          <span>SHA-256 TAGGED</span>
          <span>•</span>
          <span>ZERO-TRUST STORAGE</span>
          <span>•</span>
          <span>UP TO 1 GB</span>
        </div>
      </div>

      {/* Selected File Collection */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-[#5F5B55]">
            <span>STAGED FILES ({selectedFiles.length})</span>
            <span>TOTAL: {formatSize(totalBytes)}</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-[rgba(23,23,23,0.06)] border border-[rgba(23,23,23,0.1)] rounded bg-[#FAF8F5] p-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[10px] font-bold text-[#E43D12]">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <FileText className="h-4 w-4 shrink-0 text-[#5F5B55]" />
                  <span className="font-medium text-[#171717] truncate max-w-xs">{file.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-[#5F5B55]">{formatSize(file.size)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-[#5F5B55] hover:text-[#E43D12] transition-colors p-1"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Intelligent Compression Analysis (Section 13) */}
          {compressionResult && (
            <div className="rounded border border-[rgba(23,23,23,0.12)] bg-[#FAF8F5] p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-[#E43D12]" />
                  Intelligent Lossless Compression Check
                </span>
                {compressionResult.isOver500MB && (
                  <span className="rounded bg-[#EFB11D]/20 px-2 py-0.5 text-[10px] font-mono text-[#171717] font-bold">
                    &gt; 500 MB
                  </span>
                )}
              </div>

              <div className="mt-2.5 space-y-1.5 text-xs text-[#5F5B55]">
                {compressionResult.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="truncate max-w-[220px] text-[#171717]">{item.filename}</span>
                    {item.status === 'LOSSLESS_AVAILABLE' ? (
                      <span className="text-[#34A853] font-semibold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="h-3 w-3" /> Lossless ready
                      </span>
                    ) : item.status === 'COMPRESSION_SKIPPED' ? (
                      <span className="text-[#D6536D] font-semibold flex items-center gap-1 shrink-0">
                        Media compressed (skipped)
                      </span>
                    ) : (
                      <span className="text-[#5F5B55]">Standard binary</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress & Cryptographic Status */}
          {uploadProgress !== null && (
            <div className="space-y-2 rounded border border-[#E43D12]/20 bg-[#FAF8F5] p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#171717]">
                  {encryptionStage === 'encrypting'
                    ? 'Encrypting payload with AES-256-GCM cipher...'
                    : encryptionStage === 'verified'
                    ? 'Authentication & SHA-256 integrity verified'
                    : 'Streaming ciphertext to isolated vault...'}
                </span>
                <span className="font-mono font-bold text-[#E43D12]">{uploadProgress}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(23,23,23,0.1)]">
                <div
                  className="h-full bg-[#E43D12] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono uppercase tracking-wider text-[#5F5B55] pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#E43D12]" />
                  <span>CIPHER: AES-256-GCM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#34A853]" />
                  <span>INTEGRITY: SHA-256</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded border border-[#D6536D]/30 bg-[#D6536D]/10 p-3 text-xs text-[#D6536D]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#D6536D]" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(23,23,23,0.1)]">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={uploadProgress !== null && uploadProgress < 100}
                className="rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5F5B55] hover:text-[#171717] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleStartUpload}
              disabled={uploadProgress !== null && uploadProgress < 100}
              className="inline-flex items-center gap-2 rounded bg-[#E43D12] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#c9330d] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Encrypt & Configure Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
