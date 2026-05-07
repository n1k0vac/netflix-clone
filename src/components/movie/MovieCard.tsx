import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SafeImage } from '../ui/ImageShimmer';
import { useTmdbMeta } from '../../hooks/useTmdb';
import { getTmdbImageUrl } from '../../services/tmdb';

export const MovieCard = React.memo(({ movie, onSelect, isTop10, idx, progressData }: { movie: any, onSelect: (s:string)=>void, isTop10: boolean, idx: number, progressData?: any }) => {
  const { data: tmdbMeta } = useTmdbMeta(movie.origin_name || movie.name, movie.year);

  const progressPercent = progressData ? (progressData.currentTime / progressData.duration) * 100 : 0;
  const displayName = typeof movie.name === 'string' ? movie.name : '';
  const rawPoster = movie.poster_url;
  const safePoster = typeof rawPoster === 'string' && !rawPoster.startsWith('http') ? `https://phimimg.com/${rawPoster}` : rawPoster;
  const finalPoster = tmdbMeta?.poster_path ? getTmdbImageUrl(tmdbMeta.poster_path, 'w500') : safePoster;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8, zIndex: 40 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={() => onSelect(movie.slug)}
      className={cn(
        "movie-card flex-shrink-0 cursor-pointer snap-start relative transition-shadow duration-300 group",
        isTop10 ? "w-[120px] sm:w-[150px] md:w-[180px] lg:w-[220px]" : "w-[100px] sm:w-[120px] md:w-[150px] lg:w-[180px]"
      )}
    >
      {isTop10 && (
        <span className="absolute -left-4 sm:-left-6 md:-left-8 bottom-[-10px] sm:bottom-[-15px] md:bottom-[-20px] text-[100px] sm:text-[140px] md:text-[180px] font-black leading-none stroke-text drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] z-0" style={{ WebkitTextStroke: '3px #555', color: '#050505', letterSpacing: '-0.05em' }}>
          {idx + 1}
        </span>
      )}
      
      <div className={cn("rounded-[24px] sm:rounded-[32px] overflow-hidden bg-[#111] relative shadow-lg group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/5 group-hover:ring-white/20 transition-all z-10", isTop10 ? "ml-8 md:ml-12" : "")} style={{ aspectRatio: '2/3' }}>
        <SafeImage src={finalPoster} alt={displayName} className="absolute inset-0 w-full h-full object-cover group-hover:brightness-[0.4] transition-all duration-500 rounded-[24px] sm:rounded-[32px]" />
        
        {/* Info Overlay (Visible on hover on desktop, always visible on mobile) */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 z-10 rounded-[24px] sm:rounded-[32px] pointer-events-none">
          <div className="lg:translate-y-4 lg:group-hover:translate-y-0 transition-transform duration-300 flex flex-col gap-1.5 sm:gap-2">
            <h3 className="text-white font-bold text-sm sm:text-base leading-tight drop-shadow-md line-clamp-2">{displayName}</h3>
            
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-gray-300">
              {tmdbMeta?.vote_average ? <span className="text-green-500 font-bold">{(tmdbMeta.vote_average * 10).toFixed(0)}%</span> : null}
              <span>{movie.year || '2024'}</span>
              <span className="truncate max-w-[80px]">{movie.category?.[0]?.name || (movie.type === 'series' ? 'Phim Bộ' : 'Phim Lẻ')}</span>
              <span className="border border-white/30 px-1 rounded text-gray-400 hidden sm:inline-block">{movie.quality || 'FHD'}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 mt-1 sm:mt-2 pointer-events-auto">
              <button className="w-full bg-white text-black py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:scale-105 transition-transform shadow-lg active:scale-95">
                <Play className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" /> Play
              </button>
            </div>
          </div>
        </div>

        {progressData && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600/50 z-20">
            <div className="h-full bg-red-600 rounded-r-md" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}, (prev, next) => prev.movie.slug === next.movie.slug && prev.isTop10 === next.isTop10 && prev.progressData?.currentTime === next.progressData?.currentTime && prev.idx === next.idx);
