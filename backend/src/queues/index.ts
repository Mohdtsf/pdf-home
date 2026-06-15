import { Queue } from 'bullmq';
import { connection } from './connection';

export const compressQueue = new Queue('compress', { connection: connection as any });
export const convertQueue = new Queue('convert', { connection: connection as any });
export const ocrQueue = new Queue('ocr', { connection: connection as any });
export const htmlPdfQueue = new Queue('htmlPdf', { connection: connection as any });


