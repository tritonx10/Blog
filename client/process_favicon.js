import { Jimp } from 'jimp';

async function removeBackground() {
  try {
    const image = await Jimp.read('c:/Users/rahul/OneDrive/su/client/public/favicon_raw.jpg');
    for (let i = 0; i < image.bitmap.data.length; i += 4) {
      const r = image.bitmap.data[i + 0];
      const g = image.bitmap.data[i + 1];
      const b = image.bitmap.data[i + 2];
      if (r > 240 && g > 240 && b > 240) {
        image.bitmap.data[i + 3] = 0;
      }
    }
    await image.write('c:/Users/rahul/OneDrive/su/client/public/favicon.png');
    console.log('Successfully processed correct feather favicon');
  } catch (err) {
    console.error('Error processing favicon:', err);
  }
}

removeBackground();
