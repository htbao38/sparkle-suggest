import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  aspectRatio?: 'square' | '4/3' | '16/9' | 'auto';
  priority?: boolean;
  onLoad?: () => void;
}

/**
 * Build responsive Unsplash URL based on container width.
 * Requests 2x the display size for retina, capped at 1200.
 */
function getOptimizedUrl(src: string, containerWidth: number): string {
  if (!src) return src;
  if (src.includes('images.unsplash.com')) {
    const url = new URL(src);
    const w = Math.min(Math.max(containerWidth * 2, 400), 1200);
    url.searchParams.set('w', String(w));
    url.searchParams.set('q', '80');
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    return url.toString();
  }
  return src;
}

export function OptimizedImage({
  src,
  alt,
  className,
  wrapperClassName,
  aspectRatio = 'square',
  priority = false,
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (wrapperRef.current) {
      setContainerWidth(wrapperRef.current.offsetWidth || 400);
    }
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    auto: '',
  }[aspectRatio];

  const rawSrc = hasError ? '/placeholder.svg' : (src || '/placeholder.svg');
  const imageSrc = getOptimizedUrl(rawSrc, containerWidth);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClass,
        wrapperClassName
      )}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
      )}

      <img
        src={imageSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
    </div>
  );
}
