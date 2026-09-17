import React from 'react';
import { Plus, Trash2, Sliders } from 'lucide-react';
import { ValueIcon } from '../ValueIcon';
import { RemoveButton } from '../RemoveButton';



export function AxisEditor({ axes, setAxes }) {
  const handleAddAxis = () => {
    const newAxis = {
      id: `axis_${Date.now()}`,
      name: `Axis ${axes.length + 1}`,
      left: { name: "Value A", color: "#3b82f6", icon: "/raw_icons/equality.svg" },
      right: { name: "Value B", color: "#ef4444", icon: "/raw_icons/markets.svg" },
      tiers: [
        { threshold: 50, name: "Leans A" },
        { threshold: 0, name: "Leans B" }
      ]
    };
    setAxes([...axes, newAxis]);
  };

  const handleRemoveAxis = (index) => {
    if (axes.length <= 1) {
      alert("Tests must have at least 1 axis!");
      return;
    }
    const updated = axes.filter((_, i) => i !== index);
    setAxes(updated);
  };

  const handleUpdateAxis = (index, field, value) => {
    const updated = [...axes];
    updated[index] = { ...updated[index], [field]: value };
    setAxes(updated);
  };

  const handleUpdateValue = (index, pole, field, value) => {
    const updated = [...axes];
    updated[index] = {
      ...updated[index],
      [pole]: { ...updated[index][pole], [field]: value }
    };
    setAxes(updated);
  };

  const handleAddTier = (axisIndex) => {
    const updated = [...axes];
    const tiers = updated[axisIndex].tiers || [];
    updated[axisIndex] = {
      ...updated[axisIndex],
      tiers: [...tiers, { threshold: 50, name: "New Tier" }]
    };
    setAxes(updated);
  };

  const handleUpdateTier = (axisIndex, tierIndex, field, value) => {
    const updated = [...axes];
    const tiers = [...(updated[axisIndex].tiers || [])];
    tiers[tierIndex] = { ...tiers[tierIndex], [field]: field === 'threshold' ? Number(value) : value };
    updated[axisIndex] = { ...updated[axisIndex], tiers };
    setAxes(updated);
  };

  const handleRemoveTier = (axisIndex, tierIndex) => {
    const updated = [...axes];
    const tiers = (updated[axisIndex].tiers || []).filter((_, i) => i !== tierIndex);
    updated[axisIndex] = { ...updated[axisIndex], tiers };
    setAxes(updated);
  };

  const handleCustomImageUpload = (index, pole, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (file.type === 'image/svg+xml') {
        handleUpdateValue(index, pole, 'icon', event.target.result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 128;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as PNG to preserve transparency if any
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        handleUpdateValue(index, pole, 'icon', dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3>Custom Axes ({axes.length})</h3>
          <p style={{ color: '#555', fontSize: '0.95rem' }}>
            Define the axes and values of your test.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {axes.map((axis, idx) => (
          <div key={axis.id || idx} className="studio-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Axis #{idx + 1}</span>
              <RemoveButton className="btn-sm" onClick={() => handleRemoveAxis(idx)} />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Axis Header Name</label>
              <input
                type="text"
                className="form-input"
                value={axis.name}
                onChange={(e) => handleUpdateAxis(idx, 'name', e.target.value)}
                placeholder="e.g. ECONOMIC"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Left Value */}
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '2px solid #cccccc' }}>
                <h4 style={{ color: axis.left.color, marginBottom: '0.75rem' }}>Left Value (0-50%)</h4>
                
                <div className="form-group">
                  <label className="form-label">Label Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={axis.left.name}
                    onChange={(e) => handleUpdateValue(idx, 'left', 'name', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Result Bar Color</label>
                  <input
                    type="color"
                    className="form-input"
                    style={{ height: '40px', padding: '2px', cursor: 'pointer' }}
                    value={axis.left.color}
                    onChange={(e) => handleUpdateValue(idx, 'left', 'color', e.target.value)}
                  />
                </div>

                <label className="image-upload-wrapper" style={{ display: 'block', width: '100px', height: '100px', margin: '1rem auto 0' }}>
                  <div style={{ width: '100%', height: '100%' }}>
                    <ValueIcon
                      name={axis.left.name}
                      color={axis.left.color}
                      iconSrc={axis.left.icon || '/raw_icons/equality.svg'}
                    />
                  </div>
                  <div className="image-upload-overlay" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                    Upload Icon
                  </div>
                  <input
                    type="file"
                    accept=".svg,.png,.jpeg,.jpg"
                    onChange={(e) => handleCustomImageUpload(idx, 'left', e.target.files?.[0])}
                  />
                </label>
              </div>

              {/* Right Value */}
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '2px solid #cccccc' }}>
                <h4 style={{ color: axis.right.color, marginBottom: '0.75rem' }}>Right Value (50-100%)</h4>
                
                <div className="form-group">
                  <label className="form-label">Label Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={axis.right.name}
                    onChange={(e) => handleUpdateValue(idx, 'right', 'name', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Result Bar Color</label>
                  <input
                    type="color"
                    className="form-input"
                    style={{ height: '40px', padding: '2px', cursor: 'pointer' }}
                    value={axis.right.color}
                    onChange={(e) => handleUpdateValue(idx, 'right', 'color', e.target.value)}
                  />
                </div>

                <label className="image-upload-wrapper" style={{ display: 'block', width: '100px', height: '100px', margin: '1rem auto 0' }}>
                  <div style={{ width: '100%', height: '100%' }}>
                    <ValueIcon
                      name={axis.right.name}
                      color={axis.right.color}
                      iconSrc={axis.right.icon || '/raw_icons/markets.svg'}
                    />
                  </div>
                  <div className="image-upload-overlay" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                    Upload Icon
                  </div>
                  <input
                    type="file"
                    accept=".svg,.png,.jpeg,.jpg"
                    onChange={(e) => handleCustomImageUpload(idx, 'right', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* Axis Tiers */}
            <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '2px solid #cccccc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Axis Tiers (Categories)</h4>
                <button className="btn btn-light btn-sm" style={{ margin: 0 }} onClick={() => handleAddTier(idx)}>
                  <Plus size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Add Tier
                </button>
              </div>
              <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Tiers define the label shown based on the user's score on the <strong style={{ color: axis.left.color }}>{axis.left.name || 'left'}</strong> value (0-100%). It matches the highest threshold met.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(axis.tiers || []).sort((a, b) => a.threshold - b.threshold).map((tier, tIdx) => {
                  // Find original index
                  const originalIndex = axis.tiers.indexOf(tier);
                  return (
                    <div key={`tier-${tIdx}-${originalIndex}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="form-group" style={{ marginBottom: 0, width: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: 'bold' }}>&gt;=</span>
                          <input
                            type="number"
                            className="form-input"
                            value={tier.threshold}
                            onChange={(e) => handleUpdateTier(idx, originalIndex, 'threshold', e.target.value)}
                            min="0"
                            max="100"
                            style={{ padding: '4px 8px' }}
                          />
                          <span style={{ fontSize: '0.9rem', color: '#555' }}>%</span>
                        </div>
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <input
                          type="text"
                          className="form-input"
                          value={tier.name}
                          onChange={(e) => handleUpdateTier(idx, originalIndex, 'name', e.target.value)}
                          placeholder="e.g. Statist"
                          style={{ padding: '4px 8px' }}
                        />
                      </div>
                      
                      <RemoveButton iconOnly={true} className="btn-sm" onClick={() => handleRemoveTier(idx, originalIndex)} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={handleAddAxis}>
        <Plus size={20} style={{ marginRight: '0.5rem' }} /> Add Another Axis
      </button>
    </div>
  );
}
