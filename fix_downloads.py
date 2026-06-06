import os
import re

files = [
    "src/app/(tools)/add-page-numbers/PageNumbersClient.tsx",
    "src/app/(tools)/add-text-to-pdf/AddTextClient.tsx",
    "src/app/(tools)/jpg-to-pdf/JpgToPdfClient.tsx",
    "src/app/(tools)/pdf-to-jpg/PdfToJpgClient.tsx",
    "src/app/(tools)/protect-pdf/ProtectPdfClient.tsx",
    "src/app/(tools)/sign-pdf/SignPdfClient.tsx",
    "src/app/(tools)/watermark-pdf/AddWatermarkClient.tsx"
]

for fpath in files:
    with open(fpath, "r") as f:
        content = f.read()

    # 1. Add `resultData` and `downloadFilename` state
    if "const [resultData, setResultData]" not in content:
        content = re.sub(
            r"(const \[showAd, setShowAd\] = useState\(false\);)",
            r"\1\n  const [resultData, setResultData] = useState<any>(null);\n  const [downloadFilename, setDownloadFilename] = useState<string>('');",
            content
        )

    # 2. Add handleAdComplete
    if "const handleAdComplete = useCallback(() => {" not in content:
        # Find where to insert it, before the `return (`
        tool_name = fpath.split("/")[3]
        handler = f"""
  const handleAdComplete = useCallback(() => {{
    trackEvent({{ name: "download_completed", tool: "{tool_name}" }});
    setShowAd(false);
    if (resultData && downloadFilename) {{
      downloadFile(resultData, downloadFilename);
    }}
  }}, [resultData, downloadFilename]);

  const handleAdCancel = useCallback(() => {{
    setShowAd(false);
  }}, []);
"""
        content = re.sub(r"(?=\n  return \(\n\s*<ToolPageLayout)", handler, content)

    # 3. Replace the direct downloadFile(...) with state setters
    # Match downloadFile(arg1, arg2); or downloadFile(arg1, `...`);
    download_pattern = r"downloadFile\(([^,]+),\s*([^)]+)\);"
    def replace_download(m):
        buffer_var = m.group(1).strip()
        filename_var = m.group(2).strip()
        return f"setResultData({buffer_var});\n      setDownloadFilename({filename_var});\n      setShowAd(true);"
    
    content = re.sub(download_pattern, replace_download, content)

    with open(fpath, "w") as f:
        f.write(content)

print("Fixed!")
