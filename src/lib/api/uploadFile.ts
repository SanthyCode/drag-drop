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
        reject('Carga cancelada por el usuario');
        return;
      }

      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= total) {
        clearInterval(interval);

        // Simula fallo aleatorio (20% de probabilidad)
        if (Math.random() < 0.2) {
          reject('Error simulado en la carga');
        } else {
          resolve({
            id: file.id,
            url: `/uploads/${encodeURIComponent(file.name)}`
          });
        }
      } else {
        onProgress(Math.min(progress, 100));
      }
    }, 300);
  });
}