import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

export function ImageCropperModal({ isOpen, imageSrc, onComplete, onCancel, aspectRatio = 16 / 9, title = "Crop Image" }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImage = async () => {
    try {
      const image = new window.Image();
      image.src = imageSrc;
      await new Promise(resolve => image.onload = resolve);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let targetWidth = croppedAreaPixels.width;
      let targetHeight = croppedAreaPixels.height;
      
      // Scale down if too massive to save space, but preserve aspect
      if (targetWidth > 1200) {
         targetWidth = 1200;
         targetHeight = Math.round(1200 * (1 / aspectRatio));
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
      );
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.95);
      onComplete(base64Image);
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 2000,
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h3>
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>
      
      <div style={{ position: 'relative', flex: 1, width: '100%' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      
      <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
          <span style={{ fontSize: '0.9rem' }}>Zoom</span>
          <input 
            type="range" 
            min={1} 
            max={3} 
            step={0.1} 
            value={zoom} 
            onChange={(e) => setZoom(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'transparent', color: 'white', border: '1px solid white' }} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={getCroppedImage}>
            <Check size={18} /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
