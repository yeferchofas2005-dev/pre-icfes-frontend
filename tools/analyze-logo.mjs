import fs from 'fs';

const s = fs.readFileSync('src/assets/icon/logo.svg', 'utf8');
const paths = [...s.matchAll(/<path[^>]+>/g)].map(m => m[0]);

for (let i = 0; i < 250; i++) {
  const p = paths[i];
  const len = p.length;
  if (len >= 400) {
    const fill = p.match(/fill="([^"]+)"/)?.[1];
    console.log(`${i + 1}\t${len}\t${fill}`);
  }
}

console.log('--- threshold 300 ---');
const selected = paths.filter(p => p.length >= 300);
console.log('count', selected.length);

console.log('--- threshold 200 ---');
console.log('count', paths.filter(p => p.length >= 200).length);
