import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import { fetchMultiSource } from '../../api/phimApi';
import { SearchResultCard } from '../movie/SearchResultCard';
import { HorizontalShimmer } from '../ui/ImageShimmer';

export const ListingPage = ({ currentTab, onSelect, setTab }: { currentTab: string, onSelect: (slug: string) => void, setTab: (t: string) => void }) => {
  const isMyList = currentTab === 'my-list';
  
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['movies', currentTab],
    queryFn: async ({ pageParam = 1 }) => {
      if (isMyList) {
        if (pageParam === 1) {
          const saved = localStorage.getItem('cinemax_mylist');
          if (saved) {
            return JSON.parse(saved);
          }
          return [];
        }
        return [];
      }
      return fetchMultiSource(currentTab, pageParam);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (isMyList || !lastPage || lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
  });

  const popularGenres = [
    { id: 'the-loai/hanh-dong', label: 'Hành Động' },
    { id: 'the-loai/tinh-cam', label: 'Tình Cảm' },
    { id: 'the-loai/hai-huoc', label: 'Hài Hước' },
    { id: 'the-loai/co-trang', label: 'Cổ Trang' },
    { id: 'the-loai/tam-ly', label: 'Tâm Lý' },
    { id: 'the-loai/hinh-su', label: 'Hình Sự' },
    { id: 'the-loai/chien-tranh', label: 'Chiến Tranh' },
    { id: 'the-loai/the-thao', label: 'Thể Thao' },
    { id: 'the-loai/vo-thuat', label: 'Võ Thuật' },
    { id: 'the-loai/vien-tuong', label: 'Viễn Tưởng' },
    { id: 'the-loai/kinh-di', label: 'Kinh Dị' },
    { id: 'the-loai/tai-lieu', label: 'Tài Liệu' },
    { id: 'the-loai/am-nhac', label: 'Âm Nhạc' },
    { id: 'the-loai/gia-dinh', label: 'Gia Đình' },
    { id: 'the-loai/hoc-duong', label: 'Học Đường' },
    { id: 'hoat-hinh', label: 'Hoạt Hình' },
  ];

  let title = 'PHIM';
  if (currentTab === 'phim-bo') title = 'Phim Bộ';
  else if (currentTab === 'phim-le') title = 'Phim Lẻ';
  else if (currentTab === 'phim-moi-cap-nhat') title = 'Mới & Phổ biến';
  else if (currentTab === 'my-list') title = 'Danh sách của tôi';
  else if (currentTab === 'hoat-hinh') title = 'Thể loại: Hoạt Hình';
  else if (currentTab.startsWith('the-loai/')) {
    const genre = popularGenres.find(g => g.id === currentTab);
    title = genre ? `Thể loại: ${genre.label}` : currentTab.replace('the-loai/', 'Thể loại: ').replace(/-/g, ' ').toUpperCase();
  }

  const movies = data?.pages.flatMap(page => page) || [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-12 w-full pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          {title}
        </h2>
      </div>
      
      {isLoading && (
        <div className="mt-12 flex flex-col items-center justify-center space-y-4">
          <HorizontalShimmer />
        </div>
      )}
      
      {!isLoading && movies.length === 0 && (
        <div className="text-center mt-32 text-[#808080] text-xl">
          {isMyList ? "Bạn chưa lưu phim nào vào danh sách." : "Không tìm thấy phim nào."}
        </div>
      )}

      {!isLoading && movies.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
            {movies.map((movie: any, idx: number) => (
              <SearchResultCard key={`${movie.slug || idx}-${idx}`} movie={movie} idx={idx} onSelect={(slug) => { onSelect(slug); }} />
            ))}
          </div>

          {hasNextPage && !isMyList && (
            <div className="flex justify-center mt-12 mb-8">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Tải Thêm'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
