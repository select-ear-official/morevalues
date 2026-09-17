import React, { useEffect, useState } from 'react';
import { exportResultsCanvas } from '../utils/canvasExporter';
import { encodeTestToUrlHash } from '../utils/compressor';
import { ValueIcon } from './ValueIcon';

export function getSubTierLabel(val, fullAxis) {
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

export function TestResults({ test, results, onRetake, onEditInStudio }) {
  const [copied, setCopied] = useState(false);
  const [bannerSrc, setBannerSrc] = useState(null);

  useEffect(() => {

    if (test && results) {
      exportResultsCanvas(test.title, results.matchedIdeology, results.axisResults, test.axes)
        .then(dataUrl => setBannerSrc(dataUrl))
        .catch(err => console.error("Canvas banner generation failed:", err));
    }
  }, [test, results]);

  if (!results) return null;

  const { axisResults, matchedIdeology } = results;

  const handleCopyLink = () => {
    const compressed = encodeTestToUrlHash(test);
    const fullUrl = `${window.location.origin}${window.location.pathname}#test=${compressed}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h1>{test.title}</h1>
      <hr />

      <h1>Results</h1>

      {axisResults.map((axisResult) => {
        const fullAxis = test.axes.find(a => a.id === axisResult.axisId);
        const subLabel = getSubTierLabel(axisResult.left.percentage, fullAxis);
        return (
          <div key={axisResult.axisId}>
            <h2>
              {axisResult.axisName.charAt(0).toUpperCase() + axisResult.axisName.slice(1).toLowerCase()} Axis: <span className="weight-300">{subLabel}</span>
            </h2>
            <div className="axis">
              <ValueIcon
                name={axisResult.left.name}
                color={axisResult.left.color}
                iconSrc={axisResult.left.icon || '/raw_icons/equality.svg'}
                className="axis-icon"
              />

              <div className="bar bar-left" style={{ width: `${axisResult.left.percentage}%`, backgroundColor: axisResult.left.color }}>
                <div style={{ padding: '0 8px' }}>{axisResult.left.percentage > 30 ? `${axisResult.left.percentage.toFixed(1)}%` : ''}</div>
              </div>

              <div className="bar bar-right" style={{ width: `${axisResult.right.percentage}%`, backgroundColor: axisResult.right.color }}>
                <div style={{ padding: '0 8px' }}>{axisResult.right.percentage > 30 ? `${axisResult.right.percentage.toFixed(1)}%` : ''}</div>
              </div>

              <ValueIcon
                name={axisResult.right.name}
                color={axisResult.right.color}
                iconSrc={axisResult.right.icon || '/raw_icons/markets.svg'}
                className="axis-icon"
              />
            </div>
          </div>
        );
      })}

      <h2>
        Closest Match: <span className="weight-300">{matchedIdeology.name}</span>
      </h2>
      <p>Ideological matching is a work in progress, and is much less accurate than the values and axes.</p>
      <p>You can share these results by copying and pasting the URL at the top of the page or using the image banner below.</p>
      
      <hr />

      {/* Generated Banner Image matching results.html #banner */}
      {bannerSrc && <img src={bannerSrc} id="banner" alt="8values Results Banner" />}

      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <button className="button" style={{ display: 'inline-block', width: 'auto', padding: '12pt 24pt' }} onClick={onRetake}>
          Back
        </button>

        {/* <button className="small_button" style={{ margin: '0 8px' }} onClick={handleCopyLink}>
          {copied ? 'Copied URL!' : 'Share Link'}
        </button>

        <button className="small_button" style={{ margin: '0 8px' }} onClick={onEditInStudio}>
          Edit in Creator
        </button> */}
      </div>
    </div>
  );
}
