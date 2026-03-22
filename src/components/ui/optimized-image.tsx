import { useState } from 'react';
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
 * Upgrade Unsplash image URLs to high quality (w=1200, q=90)
 */
function getHighQualityUrl(src: string): string {
  if (!src) return src;
  // Replace low-res Unsplash params with high quality
  if (src.includes('images.unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('w', '1200');
    url.searchParams.set('q', '90');
    url.searchParams.set('auto', 'format');
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
  const imageSrc = getHighQualityUrl(rawSrc);

  return (
    <div
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
