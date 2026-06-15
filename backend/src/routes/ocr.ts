import { FastifyInstance } from 'fastify';
import { ocrQueue } from '../queues';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { sanitizeFilename } from '../utils/sanitize';

export default async function ocrRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    let language = 'eng';
    if (data.fields.language) {
      // @ts-ignore
      language = data.fields.language.value;
    }

    const fileId = uuidv4();
    const filename = `${fileId}-${sanitizeFilename(data.filename)}`;
    const uploadPath = path.join(process.cwd(), 'uploads', filename);

    // Save file locally for processing
    await pipeline(data.file, fs.createWriteStream(uploadPath));

    // Add job to BullMQ
    const job = await ocrQueue.add('ocr', {
      fileId,
      filename,
      uploadPath,
      language,
    });

    return { jobId: job.id };
  });
}
