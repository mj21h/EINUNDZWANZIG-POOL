import fs from 'fs';
import sharp from 'sharp';

async function generate() {
  try {
    await sharp('public/bitcoin-logo.svg')
      .resize(512, 512)
      .png()
      .toFile('public/bitcoin-logo-512.png');
    console.log('PNG generated successfully');
  } catch (error) {
    console.error('Error generating PNG:', error);
    process.exit(1);
  }
}

generate();
