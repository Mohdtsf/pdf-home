import path from 'path';

export function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const safeName = name
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_\-]/g, ''); // Remove non-alphanumeric except _ and -
  return `${safeName}${ext}`;
}
