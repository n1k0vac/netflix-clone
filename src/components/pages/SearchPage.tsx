import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchSearch } from "../../api/phimApi";
import { SearchResultCard } from "../movie/SearchResultCard";
import { HorizontalShimmer } from "../ui/ImageShimmer";

export const SearchPage = ({
  onClose,
  onSelect,
}: {
  key?: React.Key;
  onClose: () => void;
  onSelect: (slug: string) => void;
}) => {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 800);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedKeyword],
    queryFn: () => fetchSearch(debouncedKeyword),
    enabled: debouncedKeyword.length > 0,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto pt-24 pb-20 px-4 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <ChevronLeft size={28} />
          </button>

          <div className="relative flex-1">
            <Search
              size={22}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              autoFocus
              type="text"
              placeholder="Tên phim..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-full py-3 md:py-4 pl-12 pr-12 text-lg md:text-xl focus:outline-none focus:border-white/30 transition-colors placeholder:text-gray-600"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="mt-12 flex flex-col items-center justify-center space-y-4">
            <HorizontalShimmer />
          </div>
        )}

        {!isLoading && data && data.length === 0 && debouncedKeyword && (
          <div className="text-center mt-32 text-gray-500 text-xl">
            Không tìm thấy phim nào.
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {data.map((movie: any, idx: number) => (
              <SearchResultCard
                key={`${movie.slug || idx}-${idx}`}
                movie={movie}
                idx={idx}
                onSelect={(slug) => {
                  onSelect(slug);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
