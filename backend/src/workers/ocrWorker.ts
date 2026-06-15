import { Worker } from 'bullmq';
import { connection } from '../queues/connection';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export const ocrWorker = new Worker(
  'ocr',
  async (job) => {
    const { fileId, filename, uploadPath, language } = job.data;
    
    // Validate language
    const allowedLangs = ['eng', 'hin', 'spa', 'fra', 'deu', 'jpn', 'chi_sim'];
    const safeLang = allowedLangs.includes(language) ? language : 'eng';

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const tempDir = path.join(uploadsDir, `ocr-temp-${fileId}`);
    const outBasename = `ocr-${fileId}`;
    const outPath = path.join(uploadsDir, `${outBasename}.pdf`);

    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      await job.updateProgress(10);
      
      // Step 1: Render PDF pages as PNG images (150 DPI is standard for OCR speed & quality)
      const ppmCommand = `pdftoppm -png -r 150 "${uploadPath}" "${path.join(tempDir, 'page')}"`;
      await execPromise(ppmCommand);
      
      await job.updateProgress(40);

      // Step 2: Read temp directory and find all page images
      const files = fs.readdirSync(tempDir);
      const pngFiles = files
        .filter(f => f.startsWith('page-') && f.endsWith('.png'))
        .sort((a, b) => {
          const numA = parseInt(a.replace('page-', '').replace('.png', ''), 10);
          const numB = parseInt(b.replace('page-', '').replace('.png', ''), 10);
          return numA - numB;
        });

      if (pngFiles.length === 0) {
        throw new Error('No pages extracted from the PDF.');
      }

      await job.updateProgress(50);

      // Step 3: Run Tesseract on each page image
      const ocrPdfFiles: string[] = [];
      const totalPages = pngFiles.length;
      
      for (let i = 0; i < totalPages; i++) {
        const pngFile = pngFiles[i];
        const pngPath = path.join(tempDir, pngFile);
        const ocrBase = path.join(tempDir, `ocr-${i + 1}`);
        const ocrCommand = `tesseract "${pngPath}" "${ocrBase}" -l ${safeLang} pdf`;
        
        await execPromise(ocrCommand);
        ocrPdfFiles.push(`${ocrBase}.pdf`);
        
        const progress = Math.min(50 + Math.round((i + 1) / totalPages * 35), 85);
        await job.updateProgress(progress);
      }

      await job.updateProgress(90);

      // Step 4: Merge single page PDFs back into one PDF
      const mergeCommand = `pdfunite ${ocrPdfFiles.map(f => `"${f}"`).join(' ')} "${outPath}"`;
      await execPromise(mergeCommand);

      await job.updateProgress(95);

      // Cleanup temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      // Cleanup original upload
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }

      await job.updateProgress(100);
      return { filename: `${outBasename}.pdf` };
    } catch (error: any) {
      console.error('OCR error:', error);
      // Clean up temp directory on failure
      if (fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}
      }
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  },
  { connection: connection as any }
);

ocrWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed! Result:`, job.returnvalue);
});

ocrWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});
