const axios = require('axios');
const Jimp = require('jimp');
const ColorThief = require('colorthief');

// async function process_gradient(imageUrl) {
//   let gradient = [];
//   const toRGB = rgb => `rgb(${rgb.join(',')})`;
//   const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//   const buffer = Buffer.from(response.data);

//   let image = await Jimp.read(buffer);
//   image = image.resize(100, 100);

//   const mime = image.getMIME();
//   const resizedBuffer = await image.getBufferAsync(mime);

//   const palette = await ColorThief.getPalette(resizedBuffer, 2);
//   if (!palette || palette.length < 2) {
//     rgb_flag = false;
//     console.warn(`Could not extract a valid color palette, using default colors. ${imageUrl}`);
//     gradient = [toRGB([0, 0, 0]), toRGB([255, 255, 255])];
//   }
//   else {
//     gradient = [toRGB(palette[0]), toRGB(palette[1])];
//     image = null;
//   }
//   global.gc && global.gc();
//   // If the palette extraction fails or returns less than 2 colors, use default colors
//   if (gradient.length < 2) {
//     console.warn(`no gradient found for the image, using default colors. ${imageUrl}`);
//     gradient = [toRGB([0, 0, 0]), toRGB([255, 255, 255])];
//   }
//   return gradient;
// }

async function process_gradient(imageUrl) {
  const toRGB = rgb => {
    if (!Array.isArray(rgb) || rgb.length !== 3) return null;
    return `rgb(${rgb.join(",")})`;
  };

  const defaultGradient = [toRGB([0, 0, 0]), toRGB([255, 255, 255])];
  let gradient = [];
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🎨 Attempt ${attempt} - Processing ${imageUrl}`);

      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);

      let image = await Jimp.read(buffer);
      image = image.resize(100, 100);

      const mime = image.getMIME();
      const resizedBuffer = await image.getBufferAsync(mime);

      const palette = await ColorThief.getPalette(resizedBuffer, 2);
      if (Array.isArray(palette) && palette.length >= 2) {
        const color1 = toRGB(palette[0]);
        const color2 = toRGB(palette[1]);

        if (color1 && color2) {
          gradient = [color1, color2];
          break;
        }
      }

      console.warn(`⚠️ Invalid palette on attempt ${attempt}, trying again...`);
    } catch (err) {
      console.warn(`❌ Attempt ${attempt} failed: ${err.message}`);
    }

    await new Promise(res => setTimeout(res, 100));
  }

  // Final check: force fallback if gradient is still invalid
  if (!Array.isArray(gradient) || gradient.length < 2 || !gradient[0] || !gradient[1]) {
    console.warn(`🔁 Using fallback gradient for ${imageUrl}`);
    gradient = defaultGradient;
  }

  global.gc && global.gc();
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