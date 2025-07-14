const axios = require('axios');
const Jimp = require('jimp');
const ColorThief = require('colorthief');

async function getTwoColorGradient(imageUrl) {
  try{
    console.log('Generating gradient for image:', imageUrl);
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL');
    }
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    const buffer = Buffer.from(response.data);
    const image = await Jimp.read(buffer);
    const mime = image.getMIME();
    const imageBuffer = await image.getBufferAsync(mime);

    const palette = await ColorThief.getPalette(imageBuffer, 2);

    const toRGB = rgb => `rgb(${rgb.join(',')})`;
    const gradient = [toRGB(palette[0]),toRGB(palette[1])];

    return gradient;
  }
  catch (error) {
    console.error('Error generating gradient:', error.message);
    return ['#000000', '#FFFFFF']; // Fallback to black and white
  }
}

module.exports = getTwoColorGradient;