import {
  FileRecord,
  ShareRecord,
  SecurityStats,
  TestSuiteSummary,
  CompressionAnalysisResult,
  SecurityEvent,
  DownloadEvent,
  ChatMessage,
  UserAccount
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('vaultx_auth_token');
  const userStr = localStorage.getItem('vaultx_user');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.id) headers['x-user-id'] = u.id;
    } catch {}
  }
  return headers;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async verifyEmail(token: string) {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    return data;
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserAccount }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async loginWithGoogle(credential?: string, email?: string, name?: string, picture?: string): Promise<{ token: string; user: UserAccount }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, email, name, picture })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');
    return data;
  },

  // Files
  async uploadFiles(files: File[], onProgress?: (pct: number) => void): Promise<{ files: FileRecord[] }> {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }

    const headers = getAuthHeader();

    // Use XMLHttpRequest for actual progress reporting
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/files/upload`);

      for (const [key, val] of Object.entries(headers)) {
        xhr.setRequestHeader(key, val);
      }

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(formData);
    });
  },

  async listFiles(): Promise<{ files: FileRecord[] }> {
    const res = await fetch(`${API_BASE}/files`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to list files');
    return data;
  },

  async replaceFile(fileId: string, newFile: File): Promise<{ message: string; version: number; sha256Original: string }> {
    const formData = new FormData();
    formData.append('file', newFile);

    const res = await fetch(`${API_BASE}/files/${fileId}/replace`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to replace file');
    return data;
  },

  async deleteFile(fileId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete file');
  },

  async analyzeCompression(files: Array<{ originalName: string; size: number }>): Promise<CompressionAnalysisResult> {
    const res = await fetch(`${API_BASE}/files/analyze-compression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to analyze compression');
    return data;
  },

  // Shares
  async createShare(params: {
    fileIds: string[];
    password?: string;
    maxDownloads: number;
    expirationHours: number;
    requireOtp?: boolean;
    deviceBinding?: boolean;
    downloadNotifications?: boolean;
    suspiciousAccessDetection?: boolean;
  }): Promise<{ share: ShareRecord }> {
    const res = await fetch(`${API_BASE}/shares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create share');
    return data;
  },

  async listShares(): Promise<{ shares: ShareRecord[] }> {
    const res = await fetch(`${API_BASE}/shares`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to list shares');
    return data;
  },

  async revokeShare(shareId: string): Promise<{ message: string; status: string }> {
    const res = await fetch(`${API_BASE}/shares/${shareId}/revoke`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to revoke share');
    return data;
  },

  async getShareActivity(shareId: string): Promise<{
    shareId: string;
    secureShareId: string;
    status: string;
    downloadCount: number;
    maxDownloads: number;
    securityScore: number;
    receivers?: any[];
    securityEvents: SecurityEvent[];
    downloadEvents: DownloadEvent[];
  }> {
    const res = await fetch(`${API_BASE}/shares/${shareId}/activity`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch activity');
    return data;
  },

  async getShareReceivers(shareId: string): Promise<{
    shareId: string;
    secureShareId: string;
    receiversCount: number;
    receivers: any[];
  }> {
    const res = await fetch(`${API_BASE}/shares/${shareId}/receivers`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch receivers');
    return data;
  },

  // Receiver API
  async getPublicShare(secureShareId: string) {
    const res = await fetch(`${API_BASE}/public/shares/${secureShareId}`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to open share');
      (err as any).status = data.status || res.status;
      (err as any).requiresLogin = data.requiresLogin;
      throw err;
    }
    return data;
  },

  async unlockShare(secureShareId: string, password?: string) {
    const res = await fetch(`${API_BASE}/public/shares/${secureShareId}/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Unlock failed');
      (err as any).remainingAttempts = data.remainingAttempts;
      (err as any).locked = data.locked;
      (err as any).lockedUntil = data.lockedUntil;
      (err as any).requiresLogin = data.requiresLogin;
      throw err;
    }
    return data;
  },

  async downloadSingleFile(secureShareId: string, fileId: string, token?: string) {
    const url = `${API_BASE}/public/shares/${secureShareId}/files/${fileId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const headers: Record<string, string> = {
      ...getAuthHeader()
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Download failed');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = 'downloaded_file';
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1]);
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },

  async downloadSelectedZip(secureShareId: string, fileIds: string[], token?: string) {
    const res = await fetch(`${API_BASE}/public/shares/${secureShareId}/download-selected`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ fileIds, token })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'ZIP download failed');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `vaultx-package-${secureShareId.slice(0, 8)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Chat
  async getChatMessages(secureShareId: string): Promise<{ messages: ChatMessage[] }> {
    const res = await fetch(`${API_BASE}/public/shares/${secureShareId}/chat`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch chat messages');
    return data;
  },

  async sendChatMessage(secureShareId: string, text: string, senderType: 'SENDER' | 'RECEIVER', senderName: string) {
    const res = await fetch(`${API_BASE}/public/shares/${secureShareId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, senderType, senderName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send chat message');
    return data;
  },

  // Security Center
  async getSecurityStats(): Promise<SecurityStats> {
    const res = await fetch(`${API_BASE}/security/stats`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load security statistics');
    return data;
  },

  async runSecuritySuite(): Promise<TestSuiteSummary> {
    const res = await fetch(`${API_BASE}/security/run-tests`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to run security test suite');
    return data;
  }
};
