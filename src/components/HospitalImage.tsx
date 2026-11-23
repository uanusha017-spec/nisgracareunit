import { useState } from 'react';
import { Leaf } from 'lucide-react';

interface HospitalImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
}

export function HospitalImage({ src, alt, fallbackTitle, className = '' }: HospitalImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#EAF1EC] via-[#F2F5F2] to-[#E2EBE5] text-[#135D43] p-6 text-center ${className}`}
      >
        <Leaf className="w-8 h-8 opacity-60" aria-hidden="true" />
        <span className="font-display text-sm font-medium text-[#14221D]">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
