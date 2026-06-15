import { Worker } from 'bullmq';
import { connection } from '../queues/connection';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export const convertWorker = new Worker(
  'convert',
  async (job) => {
    const { fileId, filename, uploadPath, targetFormat, useOcr, language } = job.data;
    
    // Security measure: validate target format to prevent command injection
    const allowedFormats = ['pdf', 'docx', 'xlsx', 'pptx', 'html', 'txt'];
    if (!allowedFormats.includes(targetFormat)) {
      throw new Error(`Unsupported target format: ${targetFormat}`);
    }

    const outdir = path.join(process.cwd(), 'uploads');
    const ext = path.extname(filename).toLowerCase();
    
    // Validate language
    const allowedLangs = ['eng', 'hin', 'spa', 'fra', 'deu', 'jpn', 'chi_sim'];
    const safeLang = allowedLangs.includes(language) ? language : 'eng';

    await job.updateProgress(5);
    
    try {
      let command = '';
      let tempFilesToCleanup: string[] = [];
      let currentUploadPath = uploadPath;

      if (useOcr && ext === '.pdf') {
        // Run OCR first to generate a searchable PDF
        const tempDir = path.join(outdir, `convert-ocr-temp-${fileId}`);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        tempFilesToCleanup.push(tempDir);
        
        await job.updateProgress(10);
        
        const ppmCommand = `pdftoppm -png -r 150 "${currentUploadPath}" "${path.join(tempDir, 'page')}"`;
        await execPromise(ppmCommand);
        
        await job.updateProgress(20);

        const files = fs.readdirSync(tempDir);
        const pngFiles = files
          .filter(f => f.startsWith('page-') && f.endsWith('.png'))
          .sort((a, b) => {
            const numA = parseInt(a.replace('page-', '').replace('.png', ''), 10);
            const numB = parseInt(b.replace('page-', '').replace('.png', ''), 10);
            return numA - numB;
          });

        if (pngFiles.length > 0) {
          const ocrPdfFiles: string[] = [];
          const totalPages = pngFiles.length;
          
          for (let i = 0; i < totalPages; i++) {
            const pngFile = pngFiles[i];
            const pngPath = path.join(tempDir, pngFile);
            const ocrBase = path.join(tempDir, `ocr-${i + 1}`);
            const ocrCommand = `tesseract "${pngPath}" "${ocrBase}" -l ${safeLang} pdf`;
            
            await execPromise(ocrCommand);
            ocrPdfFiles.push(`${ocrBase}.pdf`);
            
            const progress = Math.min(20 + Math.round((i + 1) / totalPages * 20), 40);
            await job.updateProgress(progress);
          }

          const ocrOutPath = path.join(tempDir, `ocr-merged-${fileId}.pdf`);
          const mergeCommand = `pdfunite ${ocrPdfFiles.map(f => `"${f}"`).join(' ')} "${ocrOutPath}"`;
          await execPromise(mergeCommand);
          
          currentUploadPath = ocrOutPath; // Use the OCR'd PDF for the next conversion step
        }
      }

      await job.updateProgress(45);

      if (ext === '.pdf') {
        // PDF to Office Formats
        if (targetFormat === 'docx') {
          command = `libreoffice --headless --infilter="writer_pdf_import" --convert-to docx "${currentUploadPath}" --outdir "${outdir}"`;
        } else if (targetFormat === 'pptx') {
          command = `libreoffice --headless --infilter="impress_pdf_import" --convert-to pptx "${currentUploadPath}" --outdir "${outdir}"`;
        } else if (targetFormat === 'txt') {
          command = `libreoffice --headless --infilter="writer_pdf_import" --convert-to txt "${currentUploadPath}" --outdir "${outdir}"`;
        } else if (targetFormat === 'html') {
          command = `libreoffice --headless --infilter="writer_pdf_import" --convert-to html "${currentUploadPath}" --outdir "${outdir}"`;
        } else if (targetFormat === 'xlsx') {
          // PDF to Excel: Convert to HTML first, then HTML to XLSX
          const basename = path.parse(filename).name;
          const generatedHtmlPath = path.join(outdir, `${basename}.html`);
          tempFilesToCleanup.push(generatedHtmlPath);

          const firstCmd = `libreoffice --headless --infilter="writer_pdf_import" --convert-to html "${currentUploadPath}" --outdir "${outdir}"`;
          await execPromise(firstCmd);
          await job.updateProgress(70);

          command = `libreoffice --headless --convert-to xlsx "${generatedHtmlPath}" --outdir "${outdir}"`;
        }
      } else {
        // Office Formats (DOCX, XLSX, PPTX, etc.) to PDF
        command = `libreoffice --headless --convert-to pdf "${currentUploadPath}" --outdir "${outdir}"`;
      }

      await execPromise(command);
      await job.updateProgress(90);

      // LibreOffice names the output file same as input but different extension
      const basename = path.parse(filename).name;
      const expectedOutFilename = `${basename}.${targetFormat}`;
      const outPath = path.join(outdir, expectedOutFilename);

      if (!fs.existsSync(outPath)) {
        throw new Error('Output file was not generated by LibreOffice.');
      }

      // Cleanup original upload and any temp files
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }
      for (const tempFile of tempFilesToCleanup) {
        if (fs.existsSync(tempFile)) {
          const stat = fs.statSync(tempFile);
          if (stat.isDirectory()) {
            fs.rmSync(tempFile, { recursive: true, force: true });
          } else {
            fs.unlinkSync(tempFile);
          }
        }
      }

      await job.updateProgress(100);
      return { filename: expectedOutFilename };
    } catch (error: any) {
      console.error('Conversion error:', error);
      throw new Error(`Conversion failed: ${error.message}`);
    }
  },
  { connection: connection as any }
);

convertWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed! Result:`, job.returnvalue);
});

convertWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});
