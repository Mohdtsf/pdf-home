import { FastifyInstance } from 'fastify';
import { htmlPdfQueue } from '../queues';
import { v4 as uuidv4 } from 'uuid';

export default async function htmlToPdfRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    let url = '';
    let landscape = false;

    if (req.isMultipart()) {
      const parts = req.parts();
      for await (const part of parts) {
        if (part.type === 'field') {
          if (part.fieldname === 'url') {
            url = part.value as string;
          } else if (part.fieldname === 'landscape') {
            landscape = part.value === 'true';
          }
        }
      }
    } else {
      const body = req.body as { url?: string; landscape?: boolean } | null;
      url = body?.url || '';
      landscape = !!body?.landscape;
    }

    if (!url) {
      return reply.status(400).send({ error: 'URL parameter is required' });
    }

    // Basic URL validation
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return reply.status(400).send({ error: 'URL protocol must be http or https' });
      }
    } catch (err) {
      return reply.status(400).send({ error: 'Invalid URL provided' });
    }

    const jobId = uuidv4();
    const filename = `html-${jobId}.pdf`;

    // Add job to BullMQ htmlPdfQueue
    const job = await htmlPdfQueue.add('htmlPdf', {
      jobId,
      url,
      landscape,
      filename,
    });

    return { jobId: job.id };
  });
}
