const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'public/value_images');
const destDir = path.join(__dirname, 'public/raw_icons');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  
  // Remove rects (backgrounds)
  content = content.replace(/<rect[\s\S]*?\/>/gi, '');
  
  // Remove text tags
  content = content.replace(/<text[\s\S]*?<\/text>/gi, '');
  
  // Remove groups containing aria-label for text
  content = content.replace(/<g[^>]*aria-label="[A-Z]+"[\s\S]*?<\/g>/gi, '');
  
  // Remove the specific path used for the thick black text band at the bottom
  content = content.replace(/<path[^>]*d="m 0\.72760467,18\.520836[^>]*\/>/gi, '');
  
  // Update viewBox to tightly crop around the red area containing the icon
  content = content.replace(/viewBox="[^"]+"/i, 'viewBox="2.645834 2.645834 47.625 34.395838"');
  
  // Remove hardcoded width and height from the svg tag so it scales perfectly to the new viewBox aspect ratio
  content = content.replace(/width="200"/i, '');
  content = content.replace(/height="200"/i, '');
  
  fs.writeFileSync(path.join(destDir, file), content);
  console.log('Processed', file);
});
