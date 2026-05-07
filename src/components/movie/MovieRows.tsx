import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, keepPreviousData, useQueries } from "@tanstack/react-query";
import { cn } from "../../lib/utils";
import { MovieCard } from "./MovieCard";
import { HorizontalShimmer } from "../ui/ImageShimmer";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { useWatchProgress, useMyList } from "../../hooks/useStorage";
import { fetchMultiSource, fetchDetail } from "../../api/phimApi";
import { fetchTmdbTrending } from "../../services/tmdb";

export const CustomMovieRowContainer = ({
  title,
  movies,
  onSelect,
  isTop10,
  progressStore,
}: {
  title: string;
  movies: any[];
  onSelect: (slug: string) => void;
  isTop10?: boolean;
  progressStore?: any;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (offset: number) => {
    if (scrollRef.current)
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="py-4 md:py-6 relative group/row mb-8">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-4 px-4 md:px-12 tracking-tight drop-shadow-md">
        {title}
      </h2>
      <div className="group relative">
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-8 pt-4 px-4 md:px-12 scrollbar-hide snap-x items-end",
            isTop10 ? "pl-2 md:pl-8 gap-6 sm:gap-8 md:gap-10" : "",
          )}
          style={{ scrollbarWidth: "none" }}
        >
          {movies.map((movie, idx) => (
            <MovieCard
              key={`${movie.slug}-${idx}`}
              movie={movie}
              onSelect={onSelect}
              isTop10={!!isTop10}
              idx={idx}
              progressData={progressStore?.[movie.slug as string]}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={() => scroll(-window.innerWidth * 0.7)}
          className="absolute left-0 top-[40%] -translate-y-1/2 w-10 h-20 sm:w-12 sm:h-24 bg-black/80 hover:bg-black items-center justify-center opacity-60 hover:opacity-100 transition-all z-50 text-white rounded-r-xl backdrop-blur-md pointer-events-auto hidden md:flex shadow-[4px_0_15px_rgba(0,0,0,0.5)]"
        >
          <ChevronLeft size={36} className="text-white" />
        </button>
        <button
          onClick={() => scroll(window.innerWidth * 0.7)}
          className="absolute right-0 top-[40%] -translate-y-1/2 w-10 h-20 sm:w-12 sm:h-24 bg-black/80 hover:bg-black items-center justify-center opacity-60 hover:opacity-100 transition-all z-50 text-white rounded-l-xl backdrop-blur-md pointer-events-auto hidden md:flex shadow-[-4px_0_15px_rgba(0,0,0,0.5)]"
        >
          <ChevronRight size={36} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export const TmdbTrendingRow = ({
  onSelect,
}: {
  onSelect: (slug: string) => void;
}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: "200px",
  });
  const { data, isLoading } = useQuery({
    queryKey: ["tmdb_trending"],
    queryFn: fetchTmdbTrending,
    enabled: isIntersecting,
  });

  const showLoading = isLoading || (!isIntersecting && !data);

  if (!showLoading && (!data || data.length === 0)) return <div ref={ref} />;

  return (
    <div
      ref={ref}
      className={showLoading ? "min-h-[200px] md:min-h-[250px]" : ""}
    >
      {showLoading && (
        <div className="py-2 md:py-4 mb-4 relative">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 md:mb-4 px-4 md:px-12">
            Top trending Âu Mỹ
          </h2>
          <HorizontalShimmer />
        </div>
      )}
      {!showLoading && data && data.length > 0 && (
        <CustomMovieRowContainer
          title="Top trending Âu Mỹ (TMDB)"
          movies={data.slice(0, 10)}
          onSelect={onSelect}
          isTop10={true}
        />
      )}
    </div>
  );
};

export const MovieRow = ({
  title,
  type,
  onSelect,
  isTop10,
}: {
  title: string;
  type: string;
  onSelect: (slug: string) => void;
  isTop10?: boolean;
}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: "200px",
  });
  const { data, isLoading } = useQuery({
    queryKey: ["movies", type],
    queryFn: () => fetchMultiSource(type),
    placeholderData: keepPreviousData,
    enabled: isIntersecting,
  });
  const { progressStore } = useWatchProgress();

  const showLoading = isLoading || (!isIntersecting && !data);

  if (!showLoading && (!data || data.length === 0)) return <div ref={ref} />;

  return (
    <div
      ref={ref}
      className={showLoading ? "min-h-[200px] md:min-h-[250px]" : ""}
    >
      {showLoading && (
        <div className="py-2 md:py-4 mb-4 relative">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 md:mb-4 px-4 md:px-12">
            {title}
          </h2>
          <HorizontalShimmer />
        </div>
      )}
      {!showLoading && data && data.length > 0 && (
        <CustomMovieRowContainer
          title={title}
          movies={isTop10 ? data.slice(0, 10) : data}
          isTop10={isTop10}
          onSelect={onSelect}
          progressStore={progressStore}
        />
      )}
    </div>
  );
};

export const ContinueWatchingRow = ({
  onSelect,
}: {
  onSelect: (slug: string) => void;
}) => {
  const { progressStore } = useWatchProgress();
  const items = Object.entries(progressStore)
    .sort(([, a]: [string, any], [, b]: [string, any]) => b.savedAt - a.savedAt)
    .map(([slug, data]: [string, any]) => ({
      slug,
      name: data.movieName,
      poster_url: data.posterUrl,
      thumb_url: data.posterUrl,
    }));

  if (items.length === 0) return null;

  return (
    <CustomMovieRowContainer
      title="Tiếp tục xem"
      movies={items}
      onSelect={onSelect}
      progressStore={progressStore}
    />
  );
};

export const MyListRow = ({
  onSelect,
}: {
  onSelect: (slug: string) => void;
}) => {
  const { myList } = useMyList();

  if (myList.length === 0) return null;

  return (
    <CustomMovieRowContainer
      title="Danh sách của tôi"
      movies={myList}
      onSelect={onSelect}
    />
  );
};
