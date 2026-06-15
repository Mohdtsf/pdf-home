export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface JobResponse {
  jobId: string;
}

export interface JobStatus {
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress?: number;
  downloadUrl?: string;
  error?: string;
}

/**
 * Upload a file to a specific tool endpoint.
 */
export async function uploadFile(
  endpoint: '/compress' | '/convert' | '/ocr' | '/html-to-pdf' | string,
  file: File,
  additionalFields?: Record<string, string>
): Promise<JobResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalFields) {
    for (const [key, value] of Object.entries(additionalFields)) {
      formData.append(key, value);
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || 'Upload failed');
  }

  return res.json();
}

/**
 * Poll job status until it is completed or failed.
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    let delay = 1000;
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch job status');
        
        const data: JobStatus = await res.json();
        
        if (data.status === 'completed' && data.downloadUrl) {
          resolve(`${API_BASE_URL}${data.downloadUrl.replace('/api', '')}`);
        } else if (data.status === 'failed') {
          reject(new Error(data.error || 'Job failed'));
        } else {
          if (onProgress && data.progress !== undefined) {
            onProgress(data.progress);
          }
          // Exponential backoff up to 5 seconds
          delay = Math.min(delay * 1.5, 5000);
          setTimeout(checkStatus, delay);
        }
      } catch (err) {
        reject(err);
      }
    };

    checkStatus();
  });
}
