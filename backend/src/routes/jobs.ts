import { FastifyInstance } from 'fastify';
import { compressQueue, convertQueue, ocrQueue, htmlPdfQueue } from '../queues';
import fs from 'fs';
import path from 'path';

export default async function jobsRoutes(app: FastifyInstance) {
  // Poll job status
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    // We check all queues for simplicity. In production, it's better to prefix job IDs or pass queue name
    const queues = [compressQueue, convertQueue, ocrQueue, htmlPdfQueue];

    
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

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (ext === '.pptx') {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }

    let displayName = filename;
    if (filename.length > 37 && filename.charAt(36) === '-') {
      displayName = filename.substring(37);
    }

    const stream = fs.createReadStream(filePath);
    return reply
      .type(contentType)
      .header('Content-Disposition', `attachment; filename="${encodeURIComponent(displayName)}"`)
      .send(stream);
  });
}
