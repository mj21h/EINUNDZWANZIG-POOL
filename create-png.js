import fs from 'fs';
import { Resvg } from '@resvg/resvg-js';

const svg = fs.readFileSync('public/bitcoin-logo.svg', 'utf8');
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 512 },
});
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

fs.writeFileSync('public/bitcoin-logo-512.png', pngBuffer);
console.log('PNG generated successfully');
