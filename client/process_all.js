import { Jimp } from 'jimp';

async function processImages() {
  try {
    // Process favicon (Feather)
    const favImg = await Jimp.read('c:/Users/rahul/OneDrive/su/client/public/favicon_raw.jpg');
    for (let i = 0; i < favImg.bitmap.data.length; i += 4) {
      if (favImg.bitmap.data[i] > 240 && favImg.bitmap.data[i+1] > 240 && favImg.bitmap.data[i+2] > 240) {
        favImg.bitmap.data[i+3] = 0;
      }
    }
    await favImg.write('c:/Users/rahul/OneDrive/su/client/public/favicon.png');
    console.log('Processed favicon.png');

    // Process main logo (Circle Feather)
    const logoImg = await Jimp.read('c:/Users/rahul/OneDrive/su/client/public/logo.jpg');
    for (let i = 0; i < logoImg.bitmap.data.length; i += 4) {
      if (logoImg.bitmap.data[i] > 240 && logoImg.bitmap.data[i+1] > 240 && logoImg.bitmap.data[i+2] > 240) {
        logoImg.bitmap.data[i+3] = 0;
      }
    }
    await logoImg.write('c:/Users/rahul/OneDrive/su/client/public/logo.png');
    console.log('Processed logo.png');
  } catch (err) {
    console.error('Error processing images:', err);
  }
}

processImages();
