import React from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useTmdbMeta, useTmdbSimilar } from "../../hooks/useTmdb";
import { getTmdbImageUrl } from "../../services/tmdb";
import { fetchMultiSource, fetchSearch } from "../../api/phimApi";
import { HorizontalShimmer, SafeImage } from "../ui/ImageShimmer";

export const SimilarMovies = ({
  originName,
  year,
  categorySlug,
  onSelect,
  currentSlug,
}: {
  originName: string;
  year: string;
  categorySlug: string;
  onSelect: (slug: string) => void;
  currentSlug?: string;
}) => {
  const { data: tmdbMeta } = useTmdbMeta(originName, year);
  const { data: similarList, isLoading: tmdbLoading } = useTmdbSimilar(
    tmdbMeta?.tmdb_id,
    tmdbMeta?.media_type,
  );

  // Use TMDB data or fallback to category fetch
  const fallbackType = categorySlug
    ? `the-loai/${categorySlug}`
    : "phim-moi-cap-nhat";
  const { data: fallbackData, isLoading: fallbackLoading } = useQuery({
    queryKey: ["movies", fallbackType],
    queryFn: () => fetchMultiSource(fallbackType),
    enabled: !similarList?.length && !tmdbLoading,
  });

  const isLoading = tmdbLoading || fallbackLoading;

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scroll = (offset: number) => {
    if (scrollRef.current)
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (isLoading) return <HorizontalShimmer />;

  let finalSimilar: any[] = [];
  if (similarList?.length) {
    // Map tmdb similar to a lightweight format
    finalSimilar = similarList
      .map((item) => ({
        name: item.title || (item as any).name,
        origin_name:
          (item as any).original_title || (item as any).original_name,
        poster_url:
          getTmdbImageUrl(
            (item as any).poster_path || (item as any).backdrop_path,
            "w500",
          ) || "",
        tmdbItem: item,
      }))
      .filter(
        (m) =>
          (m.tmdbItem as any).id !== tmdbMeta?.tmdb_id &&
          m.name !== originName &&
          m.origin_name !== originName,
      );
  } else if (fallbackData?.length) {
    finalSimilar = fallbackData
      .filter((m) => m.slug !== currentSlug)
      .map((m) => ({
        ...m,
        poster_url: m.poster_url || m.thumb_url,
      }));
  }

  if (!finalSimilar?.length) return null;

  return (
    <div className="mt-8 relative group/similar">
      <h3 className="text-xl font-bold text-white mb-4">Có thể bạn thích</h3>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x"
          style={{ scrollbarWidth: "none" }}
        >
          {finalSimilar.slice(0, 15).map((movie, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                if (typeof movie.slug === "string") {
                  onSelect(movie.slug);
                } else if (movie.tmdbItem) {
                  fetchSearch(movie.name)
                    .then((res) => {
                      if (
                        res &&
                        res.length > 0 &&
                        typeof res[0].slug === "string"
                      ) {
                        onSelect(res[0].slug);
                      } else if (movie.origin_name) {
                        fetchSearch(movie.origin_name)
                          .then((res2) => {
                            if (
                              res2 &&
                              res2.length > 0 &&
                              typeof res2[0].slug === "string"
                            ) {
                              onSelect(res2[0].slug);
                            } else {
                              alert(
                                "Rất tiếc bộ phim này hiện chưa có vietsub trên hệ thống!",
                              );
                            }
                          })
                          .catch(() =>
                            alert(
                              "Rất tiếc bộ phim này hiện chưa có vietsub trên hệ thống!",
                            ),
                          );
                      } else {
                        alert(
                          "Rất tiếc bộ phim này hiện chưa có vietsub trên hệ thống!",
                        );
                      }
                    })
                    .catch(() =>
                      alert(
                        "Rất tiếc bộ phim này hiện chưa có vietsub trên hệ thống!",
                      ),
                    );
                }
              }}
              className="flex-shrink-0 w-[120px] sm:w-[150px] cursor-pointer snap-start rounded-md overflow-hidden bg-[#111] relative group aspect-[2/3]"
            >
              <SafeImage
                src={movie.poster_url}
                alt={movie.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:brightness-75 transition-all"
              />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-transparent">
                <p className="text-xs text-white truncate font-medium">
                  {movie.name}
                </p>
                {movie.tmdbItem?.vote_average ? (
                  <p className="text-[10px] text-green-500">
                    ⭐ {movie.tmdbItem.vote_average.toFixed(1)}
                  </p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={() => scroll(-window.innerWidth * 0.4)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-black/80 hover:bg-black items-center justify-center opacity-60 hover:opacity-100 transition-all z-10 text-white rounded-r-xl backdrop-blur-md pointer-events-auto hidden md:flex shadow-[4px_0_15px_rgba(0,0,0,0.5)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={() => scroll(window.innerWidth * 0.4)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-black/80 hover:bg-black items-center justify-center opacity-60 hover:opacity-100 transition-all z-10 text-white rounded-l-xl backdrop-blur-md pointer-events-auto hidden md:flex shadow-[-4px_0_15px_rgba(0,0,0,0.5)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
