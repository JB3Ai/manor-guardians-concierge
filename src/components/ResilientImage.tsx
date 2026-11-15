import { useState } from 'react';
import { Shield } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  loading?: 'eager' | 'lazy';
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  loading = 'lazy',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1C] via-[#151515] to-[#0E0E0E] text-[#FAF9F6]/70 p-6 text-center ${className}`}
      >
        <Shield className="w-7 h-7 text-[#C5A059] mb-3 stroke-[1.25]" aria-hidden="true" />
        <span className="font-display text-lg text-[#FAF9F6] tracking-wide">
          {fallbackTitle || 'The Manor Guardians'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
