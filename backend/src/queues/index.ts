import { Queue } from 'bullmq';
import { connection } from './connection';

export const compressQueue = new Queue('compress', { connection });
export const convertQueue = new Queue('convert', { connection });
export const ocrQueue = new Queue('ocr', { connection });
