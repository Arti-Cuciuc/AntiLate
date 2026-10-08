// Asset generation only; this script is not needed by the app or EAS Build.
// Use an installed sharp module, or point ANTILATE_SHARP_MODULE at one.
const fs = require('node:fs/promises');
const path = require('node:path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const sharp = require(process.env.ANTILATE_SHARP_MODULE || 'sharp');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const source = path.join(root, 'design/icon/antilate-final-icon.svg');
const background = '#FFFDFC';
const size = 1024;

async function centeredLayer(input, height) {
  const cropped = await sharp(input).trim().png().toBuffer();
  const resized = await sharp(cropped).resize({ height }).png().toBuffer();
  const metadata = await sharp(resized).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
    .composite([{ input: resized, left: Math.round((size - metadata.width) / 2), top: Math.round((size - metadata.height) / 2) }])
    .png().toBuffer();
}

async function main() {
  const svg = await fs.readFile(source);
  const rendered = await sharp(svg, { density: 144 }).resize(size, size).png().toBuffer();
  const iconLayer = await centeredLayer(rendered, 710);
  await sharp(iconLayer).flatten({ background }).png().toFile(path.join(assets, 'antilate-icon.png'));
  await sharp(iconLayer).flatten({ background }).resize(48, 48).png().toFile(path.join(assets, 'antilate-favicon.png'));

  // The central 66/108 safe zone must contain the artwork on adaptive icons.
  const foreground = await centeredLayer(rendered, 590);
  await fs.writeFile(path.join(assets, 'antilate-adaptive-foreground.png'), foreground);

  // The source also contains an off-artboard study. Use only the visible runner
  // for themed icons, so the brown platform does not merge with its legs.
  const document = new DOMParser().parseFromString(svg.toString(), 'image/svg+xml');
  const children = Array.from(document.documentElement.childNodes);
  const runner = children.filter(node => node.nodeName === 'g' && node.getAttribute('id')?.startsWith('runner')).at(-1);
  if (!runner) throw new Error('Visible runner group is missing from the source SVG');
  for (const node of children) {
    if (node !== runner) document.documentElement.removeChild(node);
  }
  const runnerSvg = new XMLSerializer().serializeToString(document);
  const runnerLayer = await sharp(Buffer.from(runnerSvg), { density: 144 }).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < runnerLayer.data.length; i += 4) {
    // Light details become holes in the monochrome mask.
    if (runnerLayer.data[i] > 240 && runnerLayer.data[i + 1] > 240 && runnerLayer.data[i + 2] > 240) runnerLayer.data[i + 3] = 0;
    runnerLayer.data[i] = runnerLayer.data[i + 1] = runnerLayer.data[i + 2] = 0;
  }
  const runnerPng = await sharp(runnerLayer.data, { raw: runnerLayer.info }).png().toBuffer();
  // Same scale as the colour composition; the monochrome runner is shorter.
  const trimmedRunner = await sharp(runnerPng).trim().png().toBuffer();
  const runnerHeight = (await sharp(trimmedRunner).metadata()).height;
  const trimmedColour = await sharp(rendered).trim().png().toBuffer();
  const colourBounds = await sharp(trimmedColour).metadata();
  const monochrome = await centeredLayer(runnerPng, Math.round(runnerHeight * 590 / colourBounds.height));
  await fs.writeFile(path.join(assets, 'antilate-monochrome.png'), monochrome);
  await sharp(monochrome).flatten({ background }).resize(512, 512).png()
    .toFile(path.join(root, 'design/icon/antilate-monochrome-preview.png'));

  // Preview Android's final circular mask after clipping the outer 18/108.
  const clipped = await sharp(foreground).extract({ left: 171, top: 171, width: 682, height: 682 }).resize(512, 512).flatten({ background }).png().toBuffer();
  const circle = Buffer.from('<svg width="512" height="512"><circle cx="256" cy="256" r="256" fill="white"/></svg>');
  await sharp(clipped).ensureAlpha().composite([{ input: circle, blend: 'dest-in' }]).png()
    .toFile(path.join(root, 'design/icon/antilate-android-preview.png'));
  console.log('Generated launcher, adaptive, monochrome and favicon assets from antilate-final-icon.svg');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
