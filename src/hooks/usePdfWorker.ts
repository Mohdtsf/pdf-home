import { useRef, useCallback } from 'react';

type WorkerTask = {
  id: string;
  type: 'MERGE' | 'SPLIT' | 'ROTATE';
  payload: any;
};

export function usePdfWorker() {
  const workerRef = useRef<Worker | null>(null);

  const getWorker = () => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url));
    }
    return workerRef.current;
  };

  const runTask = useCallback(<T,>(type: WorkerTask['type'], payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      const worker = getWorker();
      const id = Math.random().toString(36).substring(7);
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          worker.removeEventListener('message', handleMessage);
          if (e.data.success) {
            resolve(e.data.result);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };
      
      worker.addEventListener('message', handleMessage);
      worker.postMessage({ id, type, payload });
    });
  }, []);

  return { runTask };
}
