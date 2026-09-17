import React from 'react';

/**
 * A dynamic component that reconstructs the classic 8values value image style using HTML/CSS.
 * It renders a black container with a colored inner box for the icon, and a text label below it.
 *
 * @param {Object} props
 * @param {string} props.name - The text label for the value (e.g., "EQUALITY")
 * @param {string} props.color - The hex color for the inner box (e.g., "#f44336")
 * @param {string} props.iconSrc - The path/URL to the raw vector icon
 * @param {string} [props.className] - Optional class name for the wrapper
 * @param {Object} [props.style] - Optional inline styles for the wrapper
 */
export function ValueIcon({ name, color, iconSrc, className = '', style = {} }) {
  // Auto-migrate old state using /value_images/ to the new /raw_icons/
  let resolvedIconSrc = iconSrc;
  if (resolvedIconSrc && resolvedIconSrc.startsWith('/value_images/')) {
    resolvedIconSrc = resolvedIconSrc.replace('/value_images/', '/raw_icons/');
  }

  // If no iconSrc is provided, default to a transparent fallback or empty
  return (
    <div
      className={className}
      style={{
        backgroundColor: '#222',
        borderRadius: '7.5%',
        position: 'relative',
        boxSizing: 'border-box',
        aspectRatio: '1 / 1', // The original SVG is a perfect square!
        containerType: 'inline-size', // Define the container for the children
        ...style
      }}
    >
      {/* 
        We use absolute positioning with 5% offsets to perfectly simulate 5% padding 
        without triggering flexbox bugs on safari/older engines.
      */}
      <div 
        style={{
          position: 'absolute',
          top: '5%',
          bottom: '5%',
          left: '5%',
          right: '5%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Colored Area */}
        <div
          style={{
            backgroundColor: {
              '/raw_icons/equality.svg': '#f44336',
              '/raw_icons/markets.svg': '#00897b',
              '/raw_icons/nation.svg': '#ff9800',
              '/raw_icons/globe.svg': '#03a9f4',
              '/raw_icons/liberty.svg': '#ffeb3b',
              '/raw_icons/authority.svg': '#3f51b5',
              '/raw_icons/tradition.svg': '#8e24aa',
              '/raw_icons/progress.svg': '#e91e63'
            }[resolvedIconSrc] || '#ffffff',
            borderTopLeftRadius: '5%',
            borderTopRightRadius: '5%',
            height: '72.2%', // The exact ratio of the colored box in the SVG
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end', // Pushes the icon to the very bottom, touching the text area!
            boxSizing: 'border-box',
            overflow: 'hidden' // Generalize fix: clip any bleed from the scaled image below
          }}
        >
          {resolvedIconSrc && (
            <img
              src={resolvedIconSrc}
              alt={`${name} icon`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom', // Ensures the bottom of the image rests on the edge
                transform: 'scale(1.015)', // Generalize fix: Scale slightly up to cover subpixel rounding on all edges
                transformOrigin: 'bottom center',
                display: 'block'
              }}
            />
          )}
        </div>
        
        {/* Bottom Text Area */}
        <div
          style={{
            height: '27.8%', // The exact ratio of the black band in the SVG
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#eee',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            /* 13% of the container's width so it scales perfectly everywhere */
            fontSize: '13cqi', 
            textTransform: 'uppercase',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          className="value-icon-label"
        >
          {name}
        </div>
      </div>
    </div>
  );
}
