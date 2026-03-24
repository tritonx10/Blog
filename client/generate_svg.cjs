const fs = require('fs');

function createSVG(pngPath, svgPath) {
  try {
    const data = fs.readFileSync(pngPath).toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${data}" x="0" y="0" width="512" height="512"/>
</svg>`;
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Successfully created ${svgPath}`);
  } catch (err) {
    console.error(`Error creating ${svgPath}:`, err);
  }
}

createSVG('c:/Users/rahul/OneDrive/su/client/public/favicon.png', 'c:/Users/rahul/OneDrive/su/client/public/favicon.svg');
createSVG('c:/Users/rahul/OneDrive/su/client/public/logo.png', 'c:/Users/rahul/OneDrive/su/client/public/logo.svg');
