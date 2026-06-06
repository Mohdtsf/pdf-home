import { FastifyInstance } from 'fastify';
import { compressQueue, convertQueue, ocrQueue } from '../queues';
import fs from 'fs';
import path from 'path';

export default async function jobsRoutes(app: FastifyInstance) {
  // Poll job status
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    // We check all queues for simplicity. In production, it's better to prefix job IDs or pass queue name
    const queues = [compressQueue, convertQueue, ocrQueue];
    
    for (const queue of queues) {
      const job = await queue.getJob(id);
      if (job) {
        const state = await job.getState();
        if (state === 'completed') {
          return { status: 'completed', downloadUrl: `/api/jobs/download/${job.returnvalue.filename}` };
        }
        if (state === 'failed') {
          return { status: 'failed', error: job.failedReason };
        }
        return { status: state, progress: job.progress };
      }
    }

    return reply.status(404).send({ error: 'Job not found' });
  });

  // Download completed file
  app.get('/download/:filename', async (req, reply) => {
    const { filename } = req.params as { filename: string };
    
    // basic security check to avoid path traversal
    if (filename.includes('/') || filename.includes('..')) {
      return reply.status(400).send({ error: 'Invalid filename' });
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'File not found or expired' });
    }

    const stream = fs.createReadStream(filePath);
    return reply.type('application/pdf').send(stream);
  });
}
