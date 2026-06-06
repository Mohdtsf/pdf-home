const fs = require('fs');
const path = require('path');

const toolsDir = 'src/app/(tools)';
const tools = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());

tools.forEach(tool => {
  const toolFiles = fs.readdirSync(path.join(toolsDir, tool));
  const clientFile = toolFiles.find(f => f.endsWith('Client.tsx'));
  
  if (!clientFile) return;
  const filePath = path.join(toolsDir, tool, clientFile);
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Add imports if missing
  if (!content.includes('import { trackEvent }')) {
    content = content.replace(/(import .*? from "lucide-react";)/, `$1\nimport { trackEvent } from "@/lib/analytics";`);
  }
  if (!content.includes('import { PreDownloadAd }')) {
    content = content.replace(/(import \{ trackEvent \} from "@\/lib\/analytics";)/, `$1\nimport { PreDownloadAd } from "@/components/ads/PreDownloadAd";`);
  }
  if (!content.includes('import { ProcessingOverlay }')) {
    content = content.replace(/(import \{ trackEvent \} from "@\/lib\/analytics";)/, `$1\nimport { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";`);
  }

  // 2. Add showAd state if missing
  if (!content.includes('setShowAd')) {
    content = content.replace(/const \[isProcessing, setIsProcessing\] = useState\(false\);/, `const [isProcessing, setIsProcessing] = useState(false);\n  const [showAd, setShowAd] = useState(false);`);
  }

  // 3. Update handleDownload -> handleAdComplete
  if (content.includes('const handleDownload = useCallback(() => {') && !content.includes('const handleAdComplete')) {
    // Replace the definition
    content = content.replace(/const handleDownload = useCallback\(\(\) => \{([\s\S]*?)\}, \[(.*?)\]\);/, (match, body, deps) => {
      return `const handleAdComplete = useCallback(() => {
    trackEvent("download_completed", { tool: "${tool}" });
    setShowAd(false);${body}}, [${deps}]);
    
  const handleAdCancel = useCallback(() => {
    setShowAd(false);
  }, []);`;
    });
    
    // Replace the onClick call
    content = content.replace(/onClick=\{handleDownload\}/g, `onClick={() => setShowAd(true)}`);
  }
  
  // 4. Update existing handleAdComplete (for merge, split, rotate which already had it)
  if (content.includes('const handleAdComplete = useCallback(() => {') && !content.includes('trackEvent("download_completed"')) {
     content = content.replace(/const handleAdComplete = useCallback\(\(\) => \{/, `const handleAdComplete = useCallback(() => {\n    trackEvent("download_completed", { tool: "${tool}" });`);
  }

  // 5. Add trackEvent to main processing function
  // We'll look for `setIsProcessing(true);`
  if (!content.includes('trackEvent("tool_used"')) {
    content = content.replace(/setIsProcessing\(true\);/, `setIsProcessing(true);\n    trackEvent("tool_used", { tool: "${tool}" });`);
  }

  // 6. Insert Overlays before ToolPageLayout children
  if (content.includes('<ToolPageLayout') && !content.includes('<ProcessingOverlay')) {
    content = content.replace(/(<ToolPageLayout[^>]*>)/, `$1\n      {isProcessing && <ProcessingOverlay />}\n      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}`);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
});

console.log('Patch complete.');
