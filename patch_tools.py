import os
import re

tools_dir = 'src/app/(tools)'
tools = [d for d in os.listdir(tools_dir) if os.path.isdir(os.path.join(tools_dir, d))]

for tool in tools:
    client_file = None
    for f in os.listdir(os.path.join(tools_dir, tool)):
        if f.endswith('Client.tsx'):
            client_file = os.path.join(tools_dir, tool, f)
            break
            
    if not client_file:
        continue

    with open(client_file, 'r') as f:
        content = f.read()

    # 1. Imports
    if 'trackEvent' not in content:
        content = re.sub(r'import \{.*\} from "lucide-react";\n', 
                         r'\g<0>import { trackEvent } from "@/lib/analytics";\n', content)
                         
    if 'PreDownloadAd' not in content:
        content = re.sub(r'import \{ trackEvent \} from "@/lib/analytics";\n', 
                         r'\g<0>import { PreDownloadAd } from "@/components/ads/PreDownloadAd";\n', content)

    if 'ProcessingOverlay' not in content:
        content = re.sub(r'import \{ trackEvent \} from "@/lib/analytics";\n', 
                         r'\g<0>import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";\n', content)

    # 2. Add showAd state if not present
    if 'setShowAd' not in content:
        content = re.sub(r'const \[isProcessing, setIsProcessing\] = useState\(false\);\n',
                         r'const [isProcessing, setIsProcessing] = useState(false);\n  const [showAd, setShowAd] = useState(false);\n', content)
                         
    # 3. Add PreDownloadAd handlers
    if 'handleAdComplete' not in content:
        # Find handleDownload and replace with handleAdComplete
        if 'const handleDownload = useCallback(() => {' in content:
            content = content.replace('const handleDownload = useCallback(() => {',
                f'''const handleAdComplete = useCallback(() => {{
    trackEvent("download_completed", {{ tool: "{tool}" }});
    setShowAd(false);''')
            # Also replace the trigger for handleDownload
            content = content.replace('onClick={handleDownload}', 'onClick={() => setShowAd(true)}')
            
            content = content.replace('handleDownload}', 'handleAdComplete}')
            
            # Add handleAdCancel
            content = re.sub(r'const handleAdComplete = useCallback[\s\S]*?\}, \[.*?\]\);',
                             r'\g<0>\n\n  const handleAdCancel = useCallback(() => {\n    setShowAd(false);\n  }, []);', content)
        
    # 4. Insert components before ToolPageLayout children
    if 'showAd &&' not in content:
        content = content.replace('<ToolPageLayout', '<ToolPageLayout') # no-op
        # Find where ToolPageLayout children begin. It's usually after >
        content = re.sub(r'(<ToolPageLayout[^>]*>)\n', 
                         r'\1\n      {isProcessing && <ProcessingOverlay />}\n      {showAd && <PreDownloadAd onComplete={handleAdComplete} onCancel={handleAdCancel} />}\n', content)
                         
    # 5. Insert trackEvent in the main action (like handleCompress, handleMerge)
    # We will just do this manually because finding the exact spot is hard in a script

    with open(client_file, 'w') as f:
        f.write(content)
        
print("Initial patching done.")
