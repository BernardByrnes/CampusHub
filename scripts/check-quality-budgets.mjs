import { gzipSync } from 'node:zlib';
import { readFile, stat } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const htmlPath = resolve(root, 'index.html');
const html = await readFile(htmlPath, 'utf8');

function localReference(value) {
  if (!value || /^(?:[a-z]+:|\/\/)/i.test(value) || value.startsWith('#')) return null;
  return value.split(/[?#]/, 1)[0].replace(/^\/+/, '');
}

function referencedAssets(pattern, source) {
  return [...source.matchAll(pattern)]
    .map(match => localReference(match[1]))
    .filter(Boolean);
}

const stylesheetRefs = referencedAssets(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, html);
const scriptRefs = referencedAssets(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi, html);
const runtimeRefs = ['index.html', ...stylesheetRefs, ...scriptRefs];
const runtimeFiles = [...new Set(runtimeRefs)].map(file => resolve(root, file));

const runtimeDetails = [];
for (const file of runtimeFiles) {
  const bytes = await readFile(file);
  const compressedBytes = gzipSync(bytes, { level: 9 }).byteLength;
  runtimeDetails.push({ file: relative(root, file).replaceAll('\\', '/'), bytes: bytes.byteLength, compressedBytes });
}

// Initial Home content is the header plus the Home view. Lazy Discover/detail
// media is intentionally not counted as above-the-fold startup imagery.
const homeStart = html.indexOf('<header');
const homeEnd = html.indexOf('id="view-discover"');
const initialHomeMarkup = `${html.slice(Math.max(0, homeStart), homeEnd < 0 ? html.length : homeEnd)}`;
const imageRefs = referencedAssets(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi, initialHomeMarkup)
  .filter(file => /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(file));
const imageFiles = [...new Set(imageRefs)].map(file => resolve(root, file));
const imageDetails = [];
for (const file of imageFiles) {
  const fileStat = await stat(file);
  imageDetails.push({ file: relative(root, file).replaceAll('\\', '/'), bytes: fileStat.size });
}

const runtimeCompressedBytes = runtimeDetails.reduce((sum, item) => sum + item.compressedBytes, 0);
const aboveFoldImageBytes = imageDetails.reduce((sum, item) => sum + item.bytes, 0);
const combinedInitialBytes = runtimeCompressedBytes + aboveFoldImageBytes;
const runtimeLimit = 300 * 1024;
const combinedLimit = 600 * 1024;

console.log('CampusHub static quality budget');
console.log('Method: gzip level 9 estimate for index.html, locally referenced CSS, and runtime JS; actual bytes for header/Home images present at reset. Tests, node_modules, frozen documents, source maps, and lazy detail media are excluded.');
console.log(`Runtime non-image (gzip): ${runtimeCompressedBytes.toLocaleString()} bytes / ${runtimeLimit.toLocaleString()} byte limit`);
console.log(`Above-fold Home images: ${aboveFoldImageBytes.toLocaleString()} bytes`);
console.log(`Combined initial estimate: ${combinedInitialBytes.toLocaleString()} bytes / ${combinedLimit.toLocaleString()} byte limit`);
console.log('Largest runtime contributors:');
runtimeDetails
  .slice()
  .sort((left, right) => right.compressedBytes - left.compressedBytes)
  .slice(0, 5)
  .forEach(item => console.log(`  ${item.file}: ${item.compressedBytes.toLocaleString()} gzip bytes (${item.bytes.toLocaleString()} raw)`));
console.log('Above-fold image assets:');
imageDetails.forEach(item => console.log(`  ${item.file}: ${item.bytes.toLocaleString()} bytes`));

if (runtimeCompressedBytes > runtimeLimit || combinedInitialBytes > combinedLimit) {
  console.error('QUALITY BUDGET FAILED');
  process.exitCode = 1;
} else {
  console.log('QUALITY BUDGET PASSED');
}
