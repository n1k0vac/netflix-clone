import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { useTmdbMeta } from '../../hooks/useTmdb';
import { getTmdbImageUrl } from '../../services/tmdb';
import { SafeImage } from '../ui/ImageShimmer';

export const SearchResultCard = ({ movie, onSelect, idx }: { key?: React.Key, movie: any, onSelect: (slug: string) => void, idx: number }) => {
  const { data: tmdbMeta } = useTmdbMeta(movie.origin_name || movie.name, movie.year);
  const rawPoster = movie.poster_url;
  const safePoster = typeof rawPoster === 'string' && !rawPoster.startsWith('http') ? `https://phimimg.com/${rawPoster}` : rawPoster;
  const finalPoster = tmdbMeta?.poster_path ? getTmdbImageUrl(tmdbMeta.poster_path, 'w500') : safePoster;
  const displayName = typeof movie.name === 'string' ? movie.name : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: idx * 0.03 }}
      whileHover={{ scale: 1.05, y: -4, zIndex: 10 }}
      onClick={() => {
        if (typeof movie.slug === 'string') {
          onSelect(movie.slug);
        }
      }}
      className="cursor-pointer group relative"
    >
      <div className="rounded-md overflow-hidden bg-[#111] relative shadow-lg ring-1 ring-white/5 group-hover:ring-white/20 transition-all" style={{ aspectRatio: '2/3' }}>
        <SafeImage src={finalPoster} alt={movie.name || 'Movie'} className="absolute inset-0 w-full h-full object-cover group-hover:brightness-[0.4] transition-all duration-300" />
        
        {/* Glassmorphism Info Overlay (Appears on Hover) */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex flex-col gap-2">
            <h3 className="text-white font-bold text-xs sm:text-sm md:text-base leading-tight drop-shadow-md line-clamp-2">{displayName}</h3>
            
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-gray-300">
              {tmdbMeta?.vote_average ? <span className="text-green-500 font-bold">{(tmdbMeta.vote_average * 10).toFixed(0)}%</span> : null}
              <span>{movie.year || '2024'}</span>
              <span className="border border-white/30 px-1 rounded text-gray-400">{movie.quality || 'FHD'}</span>
            </div>

            <div className="flex items-center gap-2 mt-1 sm:mt-2">
              <button className="w-full bg-white text-black py-1.5 sm:py-2 rounded-md font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors shadow-lg">
                <Play className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" /> Phát
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
