const fs = require('fs');
const pdfjsLib = require('./node_modules/pdfjs-dist/legacy/build/pdf.js');

async function inspect() {
  const data = new Uint8Array(fs.readFileSync('test.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });
  
  const results = textContent.items.slice(0, 15).map(item => {
    const pdfX = item.transform[4];
    const pdfY = item.transform[5];
    const [canvasX, canvasY] = viewport.convertToViewportPoint(pdfX, pdfY);
    return {
      str: item.str,
      pdfX, pdfY,
      canvasX, canvasY,
      width: item.width,
      transform: item.transform
    };
  });
  
  fs.writeFileSync('/home/tauseef/.gemini/antigravity/brain/df658db4-877a-4def-ac5a-5568b2a887da/scratch/pdf_text_dump.json', JSON.stringify(results, null, 2));
  console.log("Dumped to scratch file.");
}
inspect().catch(console.error);
