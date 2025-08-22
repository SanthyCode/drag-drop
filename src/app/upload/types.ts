export type FileStatus = 'idle' | 'uploading' | 'done' | 'error' | 'canceled';

export interface FileDescriptor {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number; // 0–100
  error?: string;
  url?: string;
  tag?: string;
  createdAt: string;     // ISO
  createdBy: string;     // e.g., 'User Test 4'
}

export interface SubmitPayload {
  title: string;
  description: string;
  files: Array<Pick<FileDescriptor, 'id'|'name'|'size'|'type'|'url'>>;
} 