import React, { useState, useRef } from 'react';
import {
  FileText,
  Search,
  Grid,
  List,
  Trash2,
  RefreshCw,
  Share2,
  ShieldCheck,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  CheckCircle2,
  Plus,
  ArrowRight
} from 'lucide-react';
import { FileRecord } from '../types';
import { api } from '../services/api';

interface FileManagerProps {
  files: FileRecord[];
  onRefresh: () => void;
  onCreateShare: (selectedFiles: FileRecord[]) => void;
  onOpenUpload: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  onRefresh,
  onCreateShare,
  onOpenUpload
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [replacingFileId, setReplacingFileId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className="h-4 w-4 text-[#D6536D]" />;
    if (['zip', 'tar', 'gz', '7z'].includes(ext || '')) return <FileArchive className="h-4 w-4 text-[#EFB11D]" />;
    if (['csv', 'xlsx', 'xls'].includes(ext || '')) return <FileSpreadsheet className="h-4 w-4 text-[#34A853]" />;
    if (['js', 'ts', 'py', 'json', 'html', 'css', 'sql'].includes(ext || '')) return <FileCode className="h-4 w-4 text-[#E43D12]" />;
    return <FileText className="h-4 w-4 text-[#5F5B55]" />;
  };

  const filtered = files.filter(f =>
    f.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.sha256Original.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(f => f.id));
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await api.deleteFile(fileId);
      setSelectedIds(selectedIds.filter(id => id !== fileId));
      onRefresh();
      setMessage('File and encrypted blocks deleted successfully.');
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Delete failed'}`);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const initiateReplace = (fileId: string) => {
    setReplacingFileId(fileId);
    replaceInputRef.current?.click();
  };

  const handleFileReplaced = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !replacingFileId) return;
    const file = e.target.files[0];
    try {
      const res = await api.replaceFile(replacingFileId, file);
      onRefresh();
      setMessage(`File replaced & re-encrypted (Updated to v${res.version})`);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Failed to replace file'}`);
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setReplacingFileId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleCreateShareWithSelected = () => {
    const selected = files.filter(f => selectedIds.includes(f.id));
    if (selected.length > 0) {
      onCreateShare(selected);
    }
  };

  return (
    <div className="space-y-8">
      <input
        ref={replaceInputRef}
        type="file"
        className="hidden"
        onChange={handleFileReplaced}
      />

      {/* Editorial Hero Header (Section 7) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(23,23,23,0.12)]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#E43D12] font-semibold block mb-2">
            02 / ISOLATED ENCRYPTED REPOSITORY
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-[#171717] leading-none">
            YOUR<br />
            <span className="text-[#E43D12]">SECURE</span><br />
            VAULT.
          </h1>
          <p className="text-xs sm:text-sm text-[#5F5B55] mt-3 max-w-lg leading-relaxed">
            Zero-trust file infrastructure. Private by default. Controlled by policy. Every object is authenticated with an isolated AES-256-GCM data key.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleCreateShareWithSelected}
              className="inline-flex items-center gap-2 rounded bg-[#171717] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-black transition-all shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5 text-[#FFA2B6]" />
              <span>Share Selected ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 rounded bg-[#E43D12] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c9330d] active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Toast */}
      {message && (
        <div className="flex items-center gap-2 rounded border border-[rgba(23,23,23,0.12)] bg-white px-4 py-3 text-xs text-[#171717] shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34A853]" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded border border-[rgba(23,23,23,0.12)] bg-white p-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F5B55]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by file name or SHA-256 hash..."
            className="w-full rounded border border-[rgba(23,23,23,0.15)] bg-[#FAF8F5] pl-9 pr-4 py-1.5 text-xs text-[#171717] placeholder-[#5F5B55] focus:border-[#E43D12] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#5F5B55] uppercase">
            {filtered.length} Object{filtered.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-1 border border-[rgba(23,23,23,0.15)] rounded p-0.5 bg-[#FAF8F5]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-[#E43D12] shadow-sm' : 'text-[#5F5B55] hover:text-[#171717]'}`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-[#E43D12] shadow-sm' : 'text-[#5F5B55] hover:text-[#171717]'}`}
              title="Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Editorial File Collection (Section 9) */}
      {filtered.length === 0 ? (
        <div className="rounded border-2 border-dashed border-[rgba(23,23,23,0.15)] bg-white/60 p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-[#5F5B55]/50" />
          <h3 className="mt-3 text-sm font-display font-bold uppercase tracking-wider text-[#171717]">
            {searchTerm ? 'No matching files found' : 'Your vault is empty'}
          </h3>
          <p className="mt-1 text-xs text-[#5F5B55]">
            {searchTerm ? 'Try a different search term.' : 'Upload your first encrypted document to create an ephemeral share.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onOpenUpload}
              className="mt-4 inline-flex items-center gap-2 rounded bg-[#E43D12] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c9330d]"
            >
              Upload Files Now
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded border border-[rgba(23,23,23,0.12)] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(23,23,23,0.12)] bg-[#FAF8F5] text-[10px] font-mono uppercase tracking-wider text-[#5F5B55]">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-[rgba(23,23,23,0.2)] text-[#E43D12] focus:ring-[#E43D12]"
                    />
                  </th>
                  <th className="p-3.5 font-bold">IDX</th>
                  <th className="p-3.5 font-bold">Document Name</th>
                  <th className="p-3.5 font-bold">Size</th>
                  <th className="p-3.5 font-bold">Cipher & Integrity</th>
                  <th className="p-3.5 font-bold">Version</th>
                  <th className="p-3.5 font-bold">Stored</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(23,23,23,0.06)]">
                {filtered.map((f, idx) => {
                  const isSelected = selectedIds.includes(f.id);
                  return (
                    <tr
                      key={f.id}
                      className={`group transition-colors relative hover:bg-[#FAF8F5] ${
                        isSelected ? 'bg-[#E43D12]/5' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(f.id)}
                          className="h-3.5 w-3.5 rounded border-[rgba(23,23,23,0.2)] text-[#E43D12] focus:ring-[#E43D12]"
                        />
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-[#E43D12]">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {getFileIcon(f.originalName)}
                          <span className="font-semibold text-[#171717] truncate max-w-xs">{f.originalName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[#5F5B55] tabular-nums">
                        {formatSize(f.size)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#E43D12] uppercase">
                            <ShieldCheck className="h-3 w-3" />
                            AES-256
                          </span>
                          <span className="text-[#5F5B55]/30">·</span>
                          <span className="font-mono text-[10px] text-[#5F5B55]" title={`SHA-256: ${f.sha256Original}`}>
                            {f.sha256Original.slice(0, 10)}...
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex rounded bg-[#EBE9E1] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#171717]">
                          v{f.version}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#5F5B55] text-[11px] font-mono">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => onCreateShare([f])}
                            className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold text-[#171717] hover:bg-[#EBE9E1] hover:text-[#E43D12] transition-colors"
                            title="Create Share"
                          >
                            <span>Share</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => initiateReplace(f.id)}
                            className="rounded p-1 text-[#5F5B55] hover:bg-[#EBE9E1] hover:text-[#171717] transition-colors"
                            title="Replace File (maintains version)"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="rounded p-1 text-[#5F5B55] hover:bg-[#EBE9E1] hover:text-[#D6536D] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f, idx) => (
            <div
              key={f.id}
              className={`rounded border p-5 transition-all bg-white relative ${
                selectedIds.includes(f.id)
                  ? 'border-[#E43D12] shadow-sm'
                  : 'border-[rgba(23,23,23,0.12)] hover:border-[#171717]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#E43D12]">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  {getFileIcon(f.originalName)}
                  <span className="font-bold text-xs text-[#171717] truncate max-w-[170px]">
                    {f.originalName}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(f.id)}
                  onChange={() => toggleSelect(f.id)}
                  className="h-3.5 w-3.5 rounded border-[rgba(23,23,23,0.2)] text-[#E43D12]"
                />
              </div>

              <div className="mt-4 space-y-1 text-xs text-[#5F5B55] font-mono">
                <div className="flex justify-between">
                  <span>SIZE:</span>
                  <span className="text-[#171717] font-bold">{formatSize(f.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VERSION:</span>
                  <span className="text-[#171717]">v{f.version}</span>
                </div>
                <div className="flex justify-between">
                  <span>CIPHER:</span>
                  <span className="text-[#E43D12]">AES-256-GCM</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-[rgba(23,23,23,0.08)]">
                <span className="text-[10px] font-mono text-[#5F5B55]">{new Date(f.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCreateShare([f])}
                    className="p-1 text-[#5F5B55] hover:text-[#E43D12]"
                    title="Share"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => initiateReplace(f.id)}
                    className="p-1 text-[#5F5B55] hover:text-[#171717]"
                    title="Replace"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="p-1 text-[#5F5B55] hover:text-[#D6536D]"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
