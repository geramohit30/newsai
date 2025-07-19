const axios = require('axios');
const Jimp = require('jimp');
const ColorThief = require('colorthief');

async function process_gradient(imageUrl) {
  let gradient = [];
  const toRGB = rgb => `rgb(${rgb.join(',')})`;
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);

  let image = await Jimp.read(buffer);
  image = image.resize(100, 100);

  const mime = image.getMIME();
  const resizedBuffer = await image.getBufferAsync(mime);

  const palette = await ColorThief.getPalette(resizedBuffer, 2);
  if (!palette || palette.length < 2) {
    rgb_flag = false;
    console.warn(`Could not extract a valid color palette, using default colors. ${imageUrl}`);
    gradient = [toRGB([0, 0, 0]), toRGB([255, 255, 255])];
  }
  else {
    gradient = [toRGB(palette[0]), toRGB(palette[1])];
    image = null;
  }
  global.gc && global.gc();
  // If the palette extraction fails or returns less than 2 colors, use default colors
  if (gradient.length < 2) {
    console.warn(`no gradient found for the image, using default colors. ${imageUrl}`);
    gradient = [toRGB([0, 0, 0]), toRGB([255, 255, 255])];
  }
  return gradient;
}

async function getTwoColorGradient(imageUrl) {
  try {
    console.log('Generating gradient for image:', imageUrl);
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL');
    }
    return await process_gradient(imageUrl);
  } catch (error) {
    console.error('Error generating gradient:', error.message);
    let toRGB = rgb => `rgb(${rgb.join(',')})`;
    return [toRGB([0, 0, 0]), toRGB([255, 255, 255])];
  }
}

module.exports = getTwoColorGradient;