const axios = require('axios');
const Jimp = require('jimp');
const ColorThief = require('colorthief');

async function getTwoColorGradient(imageUrl) {
  try {
    console.log('Generating gradient for image:', imageUrl);
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL');
    }
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    let image = await Jimp.read(buffer);
    image = image.resize(100, 100);

    const mime = image.getMIME();
    const resizedBuffer = await image.getBufferAsync(mime);

    const palette = await ColorThief.getPalette(resizedBuffer, 2);

    const toRGB = rgb => `rgb(${rgb.join(',')})`;
    const gradient = [toRGB(palette[0]), toRGB(palette[1])];
    image = null;
    global.gc && global.gc();

    return gradient;
  } catch (error) {
    console.error('Error generating gradient:', error.message);
    return ['#000000', '#FFFFFF'];
  }
}

module.exports = getTwoColorGradient;