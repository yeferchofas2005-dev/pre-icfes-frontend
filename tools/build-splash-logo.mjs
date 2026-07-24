import fs from 'fs';

const MIN_LEN = 800;
const src = fs.readFileSync('src/assets/icon/logo.svg', 'utf8');
const header = src.match(/^[\s\S]*?<svg[^>]*>/)[0].replace(/width="[^"]*"/, 'viewBox="0 0 506 542"').replace(/height="[^"]*"/, '');
const paths = [...src.matchAll(/<path[^>]+>/g)].map(m => m[0]);
const selected = paths.filter(p => p.length >= MIN_LEN);
const out = `${header}\n${selected.join('\n')}\n</svg>\n`;
fs.writeFileSync('src/assets/icon/splash-logo.svg', out);
console.log('paths', selected.length, 'bytes', out.length);
