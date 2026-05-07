/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { NavBar } from "./components/layout/NavBar";
import { Hero } from "./components/Hero";
import {
  TmdbTrendingRow,
  MovieRow,
  ContinueWatchingRow,
  MyListRow,
} from "./components/movie/MovieRows";
import { MovieDetail } from "./components/movie/MovieDetail";
import { SearchPage } from "./components/pages/SearchPage";
import { ListingPage } from "./components/pages/ListingPage";
import "./lib/firebase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [currentTab, setCurrentTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "home";
  });

  const handleSetTab = (tab: string) => {
    setCurrentTab(tab);
    setSelectedMovieSlug(null);
    setShowSearch(false);
    window.history.pushState({}, "", tab === "home" ? "/" : `/?tab=${tab}`);
    window.scrollTo(0, 0);
  };

  const [selectedMovieSlug, setSelectedMovieSlug] = useState<string | null>(
    null,
  );
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    // Inject keyframes globally
    if (!document.getElementById("cinemax-styles")) {
      const style = document.createElement("style");
      style.id = "cinemax-styles";
      style.innerHTML = `
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen xl:max-w-[1536px] xl:mx-auto bg-[#111] text-white selection:bg-red-600/30 selection:text-white font-sans overflow-x-hidden relative">
        <NavBar
          currentTab={currentTab}
          setTab={handleSetTab}
          onShowSearch={() => setShowSearch(true)}
        />

        <AnimatePresence mode="wait">
          {currentTab === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero
                onSelect={setSelectedMovieSlug}
                setTab={handleSetTab}
                onShowSearch={() => setShowSearch(true)}
                onScrollDown={() => {
                  const el = document.getElementById("movie-lists");
                  if (el) {
                    const targetY =
                      el.getBoundingClientRect().top + window.scrollY - 80;
                    const startY = window.scrollY;
                    const difference = targetY - startY;
                    const duration = 800; // ms
                    let startTime: number | null = null;
                    const step = (time: number) => {
                      if (!startTime) startTime = time;
                      const progress = Math.min(
                        (time - startTime) / duration,
                        1,
                      );
                      const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
                      window.scrollTo(0, startY + difference * ease);
                      if (progress < 1) requestAnimationFrame(step);
                    };
                    requestAnimationFrame(step);
                  }
                }}
              />
              <div
                id="movie-lists"
                className="pb-20 mt-4 sm:mt-8 relative z-20 flex flex-col gap-3 sm:gap-4 md:gap-5"
              >
                <ContinueWatchingRow onSelect={setSelectedMovieSlug} />
                <MyListRow onSelect={setSelectedMovieSlug} />
                <TmdbTrendingRow onSelect={setSelectedMovieSlug} />
                <MovieRow
                  title="Phim Mới Cập Nhật"
                  type="phim-moi-cap-nhat"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Phim Bộ Đặc Sắc"
                  type="phim-bo"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Phim Lẻ Đáng Xem"
                  type="phim-le"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Hành Động Khét Lẹt"
                  type="the-loai/hanh-dong"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Viễn Tưởng Ảo Ma"
                  type="the-loai/vien-tuong"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Kinh Dị Rén Ngang"
                  type="the-loai/kinh-di"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Hài Hước Cười Điên"
                  type="the-loai/hai-huoc"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Tình Cảm Suy Ngang"
                  type="the-loai/tinh-cam"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Cổ Trang Bơm Đểu"
                  type="the-loai/co-trang"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Hollywood Đỉnh Chóp"
                  type="quoc-gia/au-my"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Oppa Hàn Xẻng"
                  type="quoc-gia/han-quoc"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Tỷ Tỷ Điện Ảnh"
                  type="quoc-gia/trung-quoc"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Hoạt Hình Wibu"
                  type="hoat-hinh"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Võ Thuật Ầm Ầm"
                  type="the-loai/vo-thuat"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Tâm Lý Thao Túng"
                  type="the-loai/tam-ly"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Thanh Xuân Vườn Trường"
                  type="the-loai/hoc-duong"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Gia Đình Cảm Lạnh"
                  type="the-loai/gia-dinh"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Hình Sự Găng Sờ Tơ"
                  type="the-loai/hinh-su"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Tài Liệu Deep Talk"
                  type="the-loai/tai-lieu"
                  onSelect={setSelectedMovieSlug}
                />
                <MovieRow
                  title="Chiến Tranh Cháy Nổ"
                  type="the-loai/chien-tranh"
                  onSelect={setSelectedMovieSlug}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-24 pb-20 min-h-screen"
            >
              <ListingPage
                currentTab={currentTab}
                setTab={handleSetTab}
                onSelect={setSelectedMovieSlug}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSearch && (
            <SearchPage
              key="search-page"
              onClose={() => setShowSearch(false)}
              onSelect={setSelectedMovieSlug}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedMovieSlug && (
            <MovieDetail
              slug={selectedMovieSlug}
              onClose={() => setSelectedMovieSlug(null)}
              onSelect={setSelectedMovieSlug}
            />
          )}
        </AnimatePresence>
      </div>
    </QueryClientProvider>
  );
}
