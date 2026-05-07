import React, { useState, useEffect } from 'react';

export const SafeImage = ({ src, alt, className, priority }: { src: string, alt: string, className?: string, priority?: boolean }) => {
  const [img, setImg] = useState(src);
  const [errCount, setErrCount] = useState(0);

  const fallbackRules = [
    (url: string) => url.replace('phimimg.com', 'img.phimapi.com'),
    (url: string) => url.replace('img.phimapi.com', 'img.ophim.live/uploads/movies'),
    (_: string) => `https://via.placeholder.com/500x750/050505/333333?text=${encodeURIComponent(alt || 'CINEMAX')}`
  ];

  const onError = () => {
    if (errCount < fallbackRules.length) {
      setImg(fallbackRules[errCount](img));
      setErrCount(p => p + 1);
    }
  };

  useEffect(() => { setImg(src); setErrCount(0); }, [src]);
  
  if (priority) {
    return <img src={img} alt={alt} className={className} onError={onError} fetchPriority="high" />;
  }
  return <img src={img} alt={alt} className={className} onError={onError} loading="lazy" />;
};

export const HorizontalShimmer = () => (
  <div className="flex gap-4 sm:gap-5 md:gap-6 lg:gap-8 overflow-x-auto pb-8 pt-4 px-4 md:px-12 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none' }}>
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex-shrink-0 w-[95px] sm:w-[110px] md:w-[140px] lg:w-[180px] rounded-xl bg-[#1a1a1a] relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]" />
      </div>
    ))}
  </div>
);
