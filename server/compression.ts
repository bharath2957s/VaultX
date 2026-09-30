/**
 * Intelligent Lossless Compression Analyzer
 * Section 13 of VaultX Specification
 */

const LOSSLESS_CANDIDATE_EXTENSIONS = new Set([
  'pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv', 'tsv',
  'json', 'xml', 'log', 'md', 'html', 'css', 'js',
  'ts', 'py', 'c', 'cpp', 'rs', 'go', 'java', 'sql',
  'tar', 'bmp', 'svg'
]);

const ALREADY_COMPRESSED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif',
  'mp4', 'mov', 'mkv', 'avi', 'webm',
  'mp3', 'aac', 'wav', 'flac', 'ogg', 'm4a',
  'zip', 'gz', 'bz2', 'xz', '7z', 'rar'
]);

export interface CompressionAnalysisItem {
  filename: string;
  size: number;
  extension: string;
  canCompressLossless: boolean;
  status: 'LOSSLESS_AVAILABLE' | 'COMPRESSION_SKIPPED' | 'ALREADY_COMPACT';
  reason: string;
}

export interface BatchCompressionResult {
  totalSize: number;
  isOver500MB: boolean;
  items: CompressionAnalysisItem[];
  compressibleCount: number;
  skippedCount: number;
}

export function analyzeCompression(files: Array<{ originalName: string; size: number }>): BatchCompressionResult {
  let totalSize = 0;

  const items: CompressionAnalysisItem[] = files.map(file => {
    totalSize += file.size;
    const parts = file.originalName.split('.');
    const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';

    if (ALREADY_COMPRESSED_EXTENSIONS.has(ext)) {
      return {
        filename: file.originalName,
        size: file.size,
        extension: ext,
        canCompressLossless: false,
        status: 'COMPRESSION_SKIPPED',
        reason: 'Media format is already compressed; skipping re-compression to preserve quality and avoid CPU overhead'
      };
    } else if (LOSSLESS_CANDIDATE_EXTENSIONS.has(ext)) {
      return {
        filename: file.originalName,
        size: file.size,
        extension: ext,
        canCompressLossless: true,
        status: 'LOSSLESS_AVAILABLE',
        reason: 'Structured text/document format; lossless compression is recommended'
      };
    } else {
      return {
        filename: file.originalName,
        size: file.size,
        extension: ext,
        canCompressLossless: false,
        status: 'ALREADY_COMPACT',
        reason: 'Standard binary format; evaluated without quality loss'
      };
    }
  });

  const compressibleCount = items.filter(i => i.canCompressLossless).length;
  const skippedCount = items.length - compressibleCount;

  return {
    totalSize,
    isOver500MB: totalSize > 500 * 1024 * 1024,
    items,
    compressibleCount,
    skippedCount
  };
}
