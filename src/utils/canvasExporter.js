const PRESET_COLORS = {
  '/raw_icons/equality.svg': '#f44336',
  '/raw_icons/markets.svg': '#00897b',
  '/raw_icons/nation.svg': '#ff9800',
  '/raw_icons/globe.svg': '#03a9f4',
  '/raw_icons/liberty.svg': '#ffeb3b',
  '/raw_icons/authority.svg': '#3f51b5',
  '/raw_icons/tradition.svg': '#8e24aa',
  '/raw_icons/progress.svg': '#e91e63'
};

function getSubTierLabel(val, fullAxis) {
  if (val > 100 || val < 0) return "";
  if (!fullAxis || !fullAxis.tiers || fullAxis.tiers.length === 0) return "Unknown";
  
  const sortedTiers = [...fullAxis.tiers].sort((a, b) => b.threshold - a.threshold);
  for (const tier of sortedTiers) {
    if (val >= tier.threshold) {
      return tier.name;
    }
  }
  return sortedTiers[sortedTiers.length - 1].name;
}

const loadImage = (src) => new Promise((resolve) => {
  if (!src) return resolve(null);
  let resolvedSrc = src;
  if (resolvedSrc.startsWith('/value_images/')) resolvedSrc = resolvedSrc.replace('/value_images/', '/raw_icons/');
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve({ img, src: resolvedSrc });
  img.onerror = () => resolve(null);
  img.src = resolvedSrc;
});

/**
 * Generates an 8values-style PNG canvas image of test results using SVG vector images.
 */
export async function exportResultsCanvas(testTitle, matchedIdeology, axisResults, testAxes) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = 800;
  const headerHeight = 170; // top offset for the first axis text
  const iconSize = 100;
  const barHeight = 80;
  const axisSpacing = 120; // 170 -> 290 -> 410 -> 530

  const totalHeight = headerHeight + axisResults.length * axisSpacing + 10;
  const moreValuesDomain = "morevalues.vercel.app";

  canvas.width = width;
  canvas.height = totalHeight;

  // 8values background
  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(0, 0, width, totalHeight);

  // Top Right Branding (Scale if title is too long)
  let brandingFontSize = 30;
  ctx.font = `300 ${brandingFontSize}px Montserrat, sans-serif`;
  while (ctx.measureText(testTitle).width > 350 && brandingFontSize > 12) {
    brandingFontSize -= 2;
    ctx.font = `300 ${brandingFontSize}px Montserrat, sans-serif`;
  }
  ctx.fillStyle = '#222222';
  ctx.textAlign = 'right';
  // ctx.fillText(testTitle, 780, 60);
  ctx.fillText(moreValuesDomain, 780, 60);
  ctx.font = '300 30px Montserrat, sans-serif';
  const testEditionText = 'Test Edition #1';
  ctx.fillText(testEditionText, 780, 90);

  // Measure branding width to avoid overlap with main title
  ctx.font = `300 ${brandingFontSize}px Montserrat, sans-serif`;
  const brandingWidth1 = ctx.measureText(moreValuesDomain).width;
  ctx.font = '300 30px Montserrat, sans-serif';
  const brandingWidth2 = ctx.measureText(testEditionText).width;
  const maxBrandingWidth = Math.max(brandingWidth1, brandingWidth2);

  // Title Layout (Scale if too long)
  const maxTitleWidth = width - 40 - maxBrandingWidth - 20; // 800 - left(20) - right(20) - branding - padding(20)
  let titleFontSize = 80;
  ctx.font = `700 ${titleFontSize}px Montserrat, sans-serif`;
  while (ctx.measureText(testTitle).width > maxTitleWidth && titleFontSize > 20) {
    titleFontSize -= 2;
    ctx.font = `700 ${titleFontSize}px Montserrat, sans-serif`;
  }
  
  ctx.fillStyle = '#222222';
  ctx.textAlign = 'left';
  ctx.fillText(testTitle, 20, 90);

  // Ideology Match
  ctx.fillStyle = '#444444';
  ctx.font = '50px Montserrat, sans-serif';
  ctx.fillText(matchedIdeology.name, 20, 140);

  // Load all icons in parallel
  const imagePromises = [];
  axisResults.forEach(axis => {
    imagePromises.push(loadImage(axis.left.icon || '/raw_icons/equality.svg'));
    imagePromises.push(loadImage(axis.right.icon || '/raw_icons/markets.svg'));
  });
  const images = await Promise.all(imagePromises);
  let imgIndex = 0;

  const drawValueIcon = (x, y, size, name, imgObj) => {
    // Draw outer #222 box
    ctx.fillStyle = '#222';
    const radius = size * 0.075;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.fill();

    const p = size * 0.05; // padding inside
    const innerX = x + p;
    const innerY = y + p;
    const innerSize = size - p * 2;
    
    const topHeight = innerSize * 0.722;
    const botHeight = innerSize * 0.278;

    // Draw top colored box
    const bgColor = PRESET_COLORS[imgObj?.src] || '#ffffff';
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, innerSize, topHeight, [radius, radius, 0, 0]);
    ctx.fill();

    // Draw image
    if (imgObj && imgObj.img) {
      const img = imgObj.img;
      const aspect = img.width / img.height;
      let drawW = innerSize;
      let drawH = innerSize / aspect;
      if (drawH > topHeight) {
        drawH = topHeight;
        drawW = topHeight * aspect;
      }
      const drawX = innerX + (innerSize - drawW) / 2;
      const drawY = innerY + topHeight - drawH; // align bottom
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // Draw bottom text
    ctx.fillStyle = '#eeeeee';
    ctx.font = `bold ${innerSize * 0.15}px Montserrat, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.toUpperCase(), x + size / 2, innerY + topHeight + botHeight / 2 + 1);
  };

  // Draw Axis Bars
  axisResults.forEach((axis, i) => {
    const currentY = headerHeight + i * axisSpacing;
    const barY = currentY + 10;
    const barX = 120;
    const barWidth = 560;

    const leftPct = axis.left.percentage;
    const rightPct = axis.right.percentage;

    const leftImg = images[imgIndex++];
    const rightImg = images[imgIndex++];

    // Draw Axis Title
    const fullAxis = testAxes.find(a => a.id === axis.axisId);
    const subLabel = getSubTierLabel(leftPct, fullAxis);
    const formattedAxisName = axis.axisName.charAt(0).toUpperCase() + axis.axisName.slice(1).toLowerCase() + ' Axis';
    ctx.fillStyle = '#222222';
    ctx.font = '300 30px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${formattedAxisName}: ${subLabel}`, width / 2, currentY + 5);

    // Draw Value Icons
    drawValueIcon(20, currentY, iconSize, axis.left.name, leftImg);
    drawValueIcon(680, currentY, iconSize, axis.right.name, rightImg);

    // Draw Outer Black Bar
    ctx.fillStyle = '#222222';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw Inner Colored Bars (with 4px gap in middle and 4px top/bottom padding)
    const leftWidth = (barWidth * leftPct) / 100;
    const rightWidth = (barWidth * rightPct) / 100;

    if (leftWidth > 2) {
      ctx.fillStyle = axis.left.color || '#f44336';
      ctx.fillRect(barX, barY + 4, leftWidth - 2, barHeight - 8);
    }

    if (rightWidth > 2) {
      ctx.fillStyle = axis.right.color || '#00897b';
      ctx.fillRect(barX + barWidth + 2 - rightWidth, barY + 4, rightWidth - 2, barHeight - 8);
    }

    // Bar Percentage Text Overlay
    ctx.fillStyle = '#222222';
    ctx.font = '50px Montserrat, sans-serif';
    ctx.textBaseline = 'middle';

    const leftText = `${leftPct.toFixed(1)}%`;
    const rightText = `${rightPct.toFixed(1)}%`;

    if (leftPct > 30) {
      ctx.textAlign = 'left';
      ctx.fillText(leftText, barX + 10, barY + barHeight / 2 + 3);
    }

    if (rightPct > 30) {
      ctx.textAlign = 'right';
      ctx.fillText(rightText, barX + barWidth - 10, barY + barHeight / 2 + 3);
    }
  });

  return canvas.toDataURL('image/png');
}
