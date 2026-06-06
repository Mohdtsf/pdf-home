const fs = require('fs');

const path = '/home/tauseef/.gemini/antigravity/brain/3926b7b4-30f2-4d1e-9fb2-60e811754036/task.md';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/- \[ \] Integrate `trackEvent` into all 12 tool client components.*/, '- [x] Integrate `trackEvent` into all 12 tool client components to capture `tool_used` and `download_completed`.');
content = content.replace(/- \[ \] Wrap all remaining tools.*with the `PreDownloadAd`.*/, '- [x] Wrap all remaining tools (non-Merge/Split/Rotate) with the `PreDownloadAd` interstitial and `ProcessingOverlay` for consistent UX.');
content = content.replace(/- \[ \] Systematically update all tool client components.*/, '- [x] Systematically update all tool client components with the analytics hooks and loading indicators.');
content = content.replace(/- \[ \] Conduct a full smoke test by running.*/, '- [x] Conduct a full smoke test by running `npm run build` and `npm run lint` and verifying types.');

fs.writeFileSync(path, content, 'utf8');
