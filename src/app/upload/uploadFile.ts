import { FileDescriptor } from '@/app/upload/types';

export async function uploadFile(
  file: FileDescriptor,
  signal: AbortSignal,
  onProgress: (progress: number) => void
): Promise<{ id: string; url: string }> {
  return new Promise((resolve, reject) => {
    const total = 100;
    let progress = 0;

    const interval = setInterval(() => {
      if (signal.aborted) {
        clearInterval(interval);
        reject('Cancelado');
        return;
      }

      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= total) {
        clearInterval(interval);
        if (Math.random() < 0.2) {
          reject('Error simulado');
        } else {
          resolve({ id: file.id, url: `/uploads/${file.name}` });
        }
      } else {
        onProgress(progress);
      }
    }, 300);
  });
}