import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { compressQueue, convertQueue, ocrQueue } from './queues';

dotenv.config();

const app = Fastify({ logger: true });

// Register plugins
app.register(helmet);
app.register(cors, {
  origin: '*', // For development, allow all. In production, restrict to your frontend domain.
});
app.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Basic health check route
app.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

import compressRoutes from './routes/compress';
import convertRoutes from './routes/convert';
import ocrRoutes from './routes/ocr';
import jobsRoutes from './routes/jobs';
import startCleanupJob from './plugins/cleanup';

// Import workers to ensure they start processing jobs
import './workers';

app.register(compressRoutes, { prefix: '/api/compress' });
app.register(convertRoutes, { prefix: '/api/convert' });
app.register(ocrRoutes, { prefix: '/api/ocr' });
app.register(jobsRoutes, { prefix: '/api/jobs' });

// Start background cleanup
startCleanupJob(app);

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
