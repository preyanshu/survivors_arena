import { ReactElement, useState, useEffect } from 'react';

// Map icon names to their SVG file paths and colors
const iconConfig: Record<string, { path: string; color: string }> = {
  'lock-alt': { path: '/icons/lock-alt-solid.svg', color: '#00ffff' }, // Cyan for shield
  'fire': { path: '/icons/fire-solid.svg', color: '#ff4500' }, // Orange-red for fire
  'bolt': { path: '/icons/bolt-solid.svg', color: '#ffff00' }, // Yellow for lightning/speed
  'star': { path: '/icons/star-solid.svg', color: '#ff6b35' }, // Orange for damage
  'circle-notch': { path: '/icons/circle-notch-solid.svg', color: '#add8e6' }, // Light blue for freeze
  'heart': { path: '/icons/heart-solid.svg', color: '#ff0000' }, // Red for health
  'arrow-circle-up': { path: '/icons/arrow-circle-up-solid.svg', color: '#00ff00' }, // Green for projectile size
  'arrow-up': { path: '/icons/arrow-up-solid.svg', color: '#ffff00' }, // Yellow for knockback
  'refresh': { path: '/icons/refresh-solid.svg', color: '#00ffff' }, // Cyan for cooldown
};

export const PixelIcon = ({ name, size = 24, className = '' }: { name: string; size?: number; className?: string }): ReactElement => {
  const config = iconConfig[name] || iconConfig['bolt'];
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    fetch(config.path)
      .then(res => res.text())
      .then(svg => {
        // Add fill color to SVG elements
        let coloredSvg = svg;
        
        // Add fill to polygon, path, circle, rect, etc. if they don't have fill
        coloredSvg = coloredSvg.replace(/<polygon([^>]*)>/g, (match, attrs) => {
          if (!attrs.includes('fill=')) {
            return `<polygon${attrs} fill="${config.color}">`;
          }
          return match.replace(/fill="[^"]*"/g, `fill="${config.color}"`).replace(/fill='[^']*'/g, `fill='${config.color}'`);
        });
        
        coloredSvg = coloredSvg.replace(/<path([^>]*)>/g, (match, attrs) => {
          if (!attrs.includes('fill=')) {
            return `<path${attrs} fill="${config.color}">`;
          }
          return match.replace(/fill="[^"]*"/g, `fill="${config.color}"`).replace(/fill='[^']*'/g, `fill='${config.color}'`);
        });
        
        coloredSvg = coloredSvg.replace(/<circle([^>]*)>/g, (match, attrs) => {
          if (!attrs.includes('fill=')) {
            return `<circle${attrs} fill="${config.color}">`;
          }
          return match.replace(/fill="[^"]*"/g, `fill="${config.color}"`).replace(/fill='[^']*'/g, `fill='${config.color}'`);
        });
        
        coloredSvg = coloredSvg.replace(/<rect([^>]*)>/g, (match, attrs) => {
          if (!attrs.includes('fill=')) {
            return `<rect${attrs} fill="${config.color}">`;
          }
          return match.replace(/fill="[^"]*"/g, `fill="${config.color}"`).replace(/fill='[^']*'/g, `fill='${config.color}'`);
        });
        
        // Also set default fill on SVG element
        if (!coloredSvg.includes('fill=')) {
          coloredSvg = coloredSvg.replace(/<svg([^>]*)>/g, (_match, attrs) => {
            return `<svg${attrs} fill="${config.color}">`;
          });
        }
        
        setSvgContent(coloredSvg);
      })
      .catch(err => {
        console.error('Failed to load icon:', err);
        setSvgContent('');
      });
  }, [config.path, config.color]);

  if (!svgContent) {
    return <div style={{ width: size, height: size, display: 'inline-block' }}></div>;
  }

  return (
    <div
      className={className}
      style={{ 
        display: 'inline-block',
        verticalAlign: 'middle',
        width: size,
        height: size,
        imageRendering: 'pixelated'
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
