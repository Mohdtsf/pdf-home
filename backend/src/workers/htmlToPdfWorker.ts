import { Worker } from 'bullmq';
import { connection } from '../queues/connection';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export const htmlToPdfWorker = new Worker(
  'htmlPdf',
  async (job) => {
    const { url, landscape, filename } = job.data;
    
    await job.updateProgress(10);
    
    const outdir = path.join(process.cwd(), 'uploads');
    const outPath = path.join(outdir, filename);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
      
      await job.updateProgress(30);
      
      const page = await browser.newPage();
      
      // Set a standard viewport
      await page.setViewport({ width: 1200, height: 800 });
      
      // Navigate to URL and wait until network is idle
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000, // 30 seconds timeout
      });
      
      await job.updateProgress(70);
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: !!landscape,
        margin: {
          top: '0.4in',
          right: '0.4in',
          bottom: '0.4in',
          left: '0.4in',
        },
      });
      
      fs.writeFileSync(outPath, pdfBuffer);
      
      await job.updateProgress(90);
      await browser.close();
      browser = null;
      
      await job.updateProgress(100);
      return { filename };
    } catch (error: any) {
      console.error('HTML to PDF rendering error:', error);
      if (browser) {
        try {
          await (browser as any).close();
        } catch (e) {}
      }
      throw new Error(`HTML to PDF generation failed: ${error.message}`);
    }
  },
  { connection: connection as any }
);

htmlToPdfWorker.on('completed', (job) => {
  console.log(`HTML to PDF Job ${job.id} completed!`);
});

htmlToPdfWorker.on('failed', (job, err) => {
  console.error(`HTML to PDF Job ${job?.id} failed with ${err.message}`);
});
