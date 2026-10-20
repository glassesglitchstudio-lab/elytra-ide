import React from 'react';

interface ElythraLogoProps {
  className?: string;
  size?: number;
}

export const ElythraLogo: React.FC<ElythraLogoProps> = ({ className = '', size = 20 }) => {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
    >
      <img
        src="./logo.png"
        alt="Elythra Logo"
        className="w-full h-full object-contain rounded-md"
        onError={(e) => {
          // Fallback if image path has relative resolution issues
          (e.currentTarget as HTMLImageElement).src = '/logo.png';
        }}
      />
    </div>
  );
};
