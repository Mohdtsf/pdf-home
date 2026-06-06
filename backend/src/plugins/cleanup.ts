import fs from 'fs';
import path from 'path';
import { FastifyInstance } from 'fastify';

export default function startCleanupJob(app: FastifyInstance) {
  // Run every 15 minutes
  setInterval(() => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadDir)) return;

    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        app.log.error(`Cleanup read error: ${err.message}`);
        return;
      }

      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      files.forEach(file => {
        // Skip .gitkeep or other hidden files if any
        if (file.startsWith('.')) return;

        const filePath = path.join(uploadDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;

          // If file is older than 1 hour, delete it
          if (now - stats.mtimeMs > ONE_HOUR) {
            fs.unlink(filePath, err => {
              if (err) app.log.error(`Failed to delete old file ${file}: ${err.message}`);
              else app.log.info(`Cleaned up old file: ${file}`);
            });
          }
        });
      });
    });
  }, 15 * 60 * 1000); // 15 mins
}
