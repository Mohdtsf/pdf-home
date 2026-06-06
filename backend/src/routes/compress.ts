import { FastifyInstance } from 'fastify';
import { compressQueue } from '../queues';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';

export default async function compressRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const fileId = uuidv4();
    const filename = `${fileId}-${data.filename}`;
    const uploadPath = path.join(process.cwd(), 'uploads', filename);

    // Save file locally for processing
    await pipeline(data.file, fs.createWriteStream(uploadPath));

    // Optional: Extract quality from form fields if provided, else default to 'medium'
    // For now, we hardcode medium or parse fields if needed

    // Add job to BullMQ
    const job = await compressQueue.add('compress', {
      fileId,
      filename,
      uploadPath,
      quality: 'medium', // this can be parameterized later
    });

    return { jobId: job.id };
  });
}
