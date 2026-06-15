import { FastifyInstance } from 'fastify';
import { convertQueue } from '../queues';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { sanitizeFilename } from '../utils/sanitize';

export default async function convertRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // You can parse form fields like "targetFormat" (e.g., "docx", "pdf")
    // Let's assume there's a field targetFormat passed as part of the multipart.
    // However, @fastify/multipart handles fields iteratively. For simplicity, we can default to 'docx' if not provided
    // or parse it from data.fields.
    let targetFormat = 'docx';
    if (data.fields.targetFormat) {
      // @ts-ignore
      targetFormat = data.fields.targetFormat.value;
    }

    const fileId = uuidv4();
    const filename = `${fileId}-${sanitizeFilename(data.filename)}`;
    const uploadPath = path.join(process.cwd(), 'uploads', filename);

    // Save file locally for processing
    await pipeline(data.file, fs.createWriteStream(uploadPath));

    // Add job to BullMQ
    const job = await convertQueue.add('convert', {
      fileId,
      filename,
      uploadPath,
      targetFormat,
    });

    return { jobId: job.id };
  });
}
