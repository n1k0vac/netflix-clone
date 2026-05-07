import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  X,
  Film,
  Plus,
  Check,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "../../lib/utils";
import { fetchDetail } from "../../api/phimApi";
import { useTmdbMeta } from "../../hooks/useTmdb";
import { useMyList, useWatchProgress } from "../../hooks/useStorage";
import { getTmdbImageUrl } from "../../services/tmdb";
import { HorizontalShimmer, SafeImage } from "../ui/ImageShimmer";
import { NetflixPlayer } from "../player/NetflixPlayer";
import { SimilarMovies } from "./SimilarMovies";

export const MovieDetail = ({
  slug,
  onClose,
  onSelect,
}: {
  slug: string;
  onClose: () => void;
  onSelect: (slug: string) => void;
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["detail", slug],
    queryFn: () => fetchDetail(slug),
  });
  const { data: tmdbMeta } = useTmdbMeta(
    data?.movie?.origin_name || data?.movie?.name,
    data?.movie?.year,
  );

  const [tab, setTab] = useState<"info" | "episodes">("info");
  const [selectedServerId, setSelectedServerId] = useState<number>(0);
  const [activeEp, setActiveEp] = useState<any>(null); // Store the full episode object

  const { addToList, removeFromList, isInList } = useMyList();
  const inList = isInList(slug);
  const queryClient = useQueryClient();

  const handleToggleList = () => {
    if (data?.movie) {
      if (inList) {
        removeFromList(slug);
      } else {
        addToList({
          slug: slug,
          name: data.movie.name,
          poster_url: data.movie.poster_url,
          thumb_url: data.movie.thumb_url,
        });
      }
      // Invalidate my-list to ensure ListingPage updates immediately
      queryClient.invalidateQueries({ queryKey: ["movies", "my-list"] });
    }
  };

  // Auto-select first episode when data loads
  useEffect(() => {
    if (data?.episodes?.length > 0 && !activeEp) {
      try {
        const stored = localStorage.getItem('cinemax_progress');
        if (stored) {
          const parsed = JSON.parse(stored);
          const savedProgress = parsed[slug];
          if (savedProgress?.episodeName) {
            for (const server of data.episodes as any[]) {
              const ep = server.server_data?.find((e: any) => e.name === savedProgress.episodeName);
              if (ep) {
                setActiveEp(ep);
                return;
              }
            }
          }
        }
      } catch (e) {}

      setActiveEp(data.episodes[0].server_data?.[0]);
    }
  }, [data, activeEp, slug]);

  const handleSimilarSelect = useCallback(
    (s: string) => {
      onSelect(s);
    },
    [onSelect],
  );

  if (isLoading)
    return (
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 flex items-end"
      >
        <div className="bg-[#111] w-full h-[90vh] rounded-t-[2.5rem] p-8 overflow-hidden relative">
          <HorizontalShimmer />
        </div>
      </motion.div>
    );

  if (!data?.movie) return null;
  const { movie, episodes } = data;
  let rawServers = Array.isArray(episodes) ? episodes : [];

  // Inject vidsrcme.ru
  const targetId = tmdbMeta?.tmdb_id || movie.tmdb_id;
  const targetType = tmdbMeta?.media_type || movie.media_type;

  if (targetId) {
    if (targetType === "movie" || movie.type === "single") {
      rawServers = [
        {
          server_name: "Châu Âu (4K/Không QC)",
          server_data: [
            {
              name: "Full",
              slug: "full",
              filename: "full",
              link_embed: `https://vidsrcme.ru/embed/movie?tmdb=${targetId}`,
              link_m3u8: "",
            },
          ],
        },
        ...rawServers,
      ];
    } else {
      const vidsrcEps = (episodes?.[0]?.server_data || []).map(
        (ep: any, index: number) => {
          const epNumMatch = ep.name.match(/\d+/);
          const epNum = epNumMatch ? parseInt(epNumMatch[0]) : index + 1;
          return {
            name: ep.name,
            slug: ep.slug,
            filename: ep.filename,
            link_embed: `https://vidsrcme.ru/embed/tv?tmdb=${targetId}&season=1&episode=${epNum}`,
            link_m3u8: "",
          };
        },
      );
      if (vidsrcEps.length > 0) {
        rawServers = [
          {
            server_name: "Châu Âu (4K/Không QC)",
            server_data: vidsrcEps,
          },
          ...rawServers,
        ];
      } else if (movie.media_type === "tv" || movie.type === "series") {
        // Generate default season 1 episodes if none exist
        const tvEps = Array.from({
          length: data?.movie?.number_of_episodes || 12,
        }).map((_, i) => ({
          name: `Tập ${i + 1}`,
          slug: `tap-${i + 1}`,
          filename: `tap-${i + 1}`,
          link_embed: `https://vidsrcme.ru/embed/tv?tmdb=${targetId}&season=1&episode=${i + 1}`,
          link_m3u8: "",
        }));
        rawServers = [
          {
            server_name: "Châu Âu (4K/Không QC)",
            server_data: tvEps,
          },
          ...rawServers,
        ];
      }
    }
  }

  // Rename and filter servers based on the mode
  const appMode = localStorage.getItem("cinemax_server") || "asia";

  let servers = [];
  if (appMode === "eu") {
    // Show Châu Âu
    servers = rawServers.filter((s) => s.server_name.includes("Châu Âu"));
    // Fallback if no EU server
    if (servers.length === 0) servers = rawServers;
  } else {
    // Châu Á Mode: Rename raw servers to Vietsub 1, Lồng Tiếng, vv
    let vietsubCount = 1;
    servers = rawServers.map((s) => {
      let newName = s.server_name;
      const lowerName = s.server_name.toLowerCase();
      if (lowerName.includes("châu âu")) {
        newName = "Vietsub VIP (Mượt)";
      } else if (
        lowerName.includes("lồng tiếng") ||
        lowerName.includes("thuyết minh")
      ) {
        newName = "Lồng Tiếng";
      } else {
        newName = `Vietsub ${vietsubCount}`;
        vietsubCount++;
      }
      return { ...s, server_name: newName };
    });
  }

  const currentServer = servers[selectedServerId] || servers[0];
  const epList = currentServer?.server_data || [];

  const handleSelectEpisode = (ep: any) => {
    setActiveEp(ep);
  };

  const renderPlayer = () => {
    if (!activeEp) {
      const bgDetailImg = tmdbMeta?.backdrop_path
        ? getTmdbImageUrl(tmdbMeta.backdrop_path, "original")
        : typeof movie.thumb_url === "string" &&
            movie.thumb_url.startsWith("http")
          ? movie.thumb_url
          : `https://phimimg.com/${movie.thumb_url}`;
      return (
        <SafeImage
          src={bgDetailImg || ""}
          alt="hero"
          className="w-full h-full object-cover opacity-60"
          priority={true}
        />
      );
    }
    if (activeEp.link_m3u8) {
      const savedPoster = tmdbMeta?.backdrop_path
        ? getTmdbImageUrl(tmdbMeta.backdrop_path, "w780")
        : movie.thumb_url || movie.poster_url;
      return (
        <NetflixPlayer
          url={activeEp.link_m3u8}
          title={`${movie.name} - ${activeEp.name}`}
          slug={slug}
          episodeName={activeEp.name}
          posterUrl={savedPoster}
          movieName={movie.name}
          onClose={onClose}
          servers={servers}
          selectedServerId={selectedServerId}
          onServerChange={(newId) => {
            setSelectedServerId(newId);
            if (
              servers[newId]?.server_data?.find(
                (ep: any) => ep.slug === activeEp.slug,
              )
            ) {
              setActiveEp(
                servers[newId].server_data.find(
                  (ep: any) => ep.slug === activeEp.slug,
                ),
              );
            } else if (servers[newId]?.server_data?.[0]) {
              setActiveEp(servers[newId].server_data[0]);
            }
          }}
          episodes={epList}
          onEpisodeSelect={handleSelectEpisode}
        />
      );
    }
    if (activeEp.link_embed) {
      return (
        <div className="w-full h-full relative bg-black">
          <iframe
            src={activeEp.link_embed}
            className="w-full h-full border-none relative z-50 pointer-events-auto"
            allowFullScreen
            referrerPolicy="origin"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[#1c1c1c] w-full max-w-7xl h-[100dvh] sm:h-[90vh] sm:rounded-2xl rounded-none flex flex-col relative shadow-[0_-10px_40px_rgba(220,38,38,0.15)] overflow-hidden">
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col custom-scrollbar pb-10">
          {/* Header / Player Area */}
          <div
            className={cn(
              "relative w-full flex-shrink-0 bg-[#1c1c1c] z-10 transition-all duration-300",
              activeEp
                ? "aspect-video sm:h-[60vh] sm:aspect-auto landscape:h-[80dvh]"
                : "aspect-[4/5] sm:aspect-video sm:h-auto lg:h-[55vh] lg:aspect-auto landscape:h-[80dvh]",
            )}
          >
            <style>{`
              .mobile-notch-mask {
                -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
                mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
              }
              @media (min-width: 640px) {
                .mobile-notch-mask {
                  -webkit-mask-image: none;
                  mask-image: none;
                }
              }
            `}</style>
            <div
              className={cn(
                "absolute inset-0 bg-black",
                !activeEp && "mobile-notch-mask overflow-hidden",
              )}
            >
              {renderPlayer()}
            </div>

            {/* Header Overlays (Mobile only) */}
            {!activeEp && (
              <div className="absolute top-6 left-6 z-[60] flex sm:hidden">
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto"
                >
                  <ArrowLeft size={22} color="white" />
                </button>
              </div>
            )}

            <div className="absolute top-6 right-6 z-[60] flex gap-2">
              {!activeEp && (
                <button className="w-11 h-11 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto sm:hidden">
                  <MoreVertical size={22} color="white" />
                </button>
              )}
              {!activeEp && (
                <button
                  onClick={onClose}
                  className="hidden sm:flex w-10 h-10 rounded-full bg-black/60 backdrop-blur-md items-center justify-center text-white hover:bg-white hover:text-black transition-colors shadow-lg pointer-events-auto"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Centered Floating Play Button for Mobile */}
            {!activeEp && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-[70] sm:hidden">
                <button
                  onClick={() => {
                    if (epList.length > 0) setActiveEp(epList[0]);
                  }}
                  className="w-[4.5rem] h-[4.5rem] rounded-full bg-[#404040] flex items-center justify-center text-white hover:scale-105 transition-transform"
                >
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </button>
              </div>
            )}

            {/* Desktop Right-aligned floating button */}
            {!activeEp && (
              <div className="absolute -bottom-8 right-6 z-[70] hidden sm:block">
                <button
                  onClick={() => {
                    if (epList.length > 0) setActiveEp(epList[0]);
                  }}
                  className="w-16 h-16 rounded-full bg-[#2a2a2a]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:scale-105 transition-transform shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                >
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </button>
              </div>
            )}

            {/* Desktop Gradient Overlay & Info */}
            {!activeEp && (
              <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-10 hidden sm:block">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-[1.1] drop-shadow-xl w-[85%]">
                  {typeof movie.name === "string" ? movie.name : ""}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-[#222]/80 backdrop-blur-md rounded-full text-xs font-semibold text-gray-200 border border-white/5 shadow-sm">
                    {movie.time || "1h 41min"}
                  </span>
                  {movie.category?.[0] && (
                    <span className="px-3 py-1 bg-[#222]/80 backdrop-blur-md rounded-full text-xs font-semibold text-gray-200 border border-white/5 shadow-sm">
                      {movie.category[0].name}
                    </span>
                  )}
                  {movie.type && (
                    <span className="px-3 py-1 bg-[#222]/80 backdrop-blur-md rounded-full text-xs font-semibold text-gray-200 border border-white/5 shadow-sm">
                      {movie.type === "single" ? "Movie" : "Series"}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-[#222]/80 backdrop-blur-md rounded-full text-xs font-semibold text-gray-200 border border-white/5 shadow-sm">
                    {tmdbMeta?.vote_average
                      ? `${tmdbMeta.vote_average.toFixed(1)}/10`
                      : "16+"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="flex-1 p-6 md:p-8 pt-12 sm:pt-6">
            {/* Mobile Info Header */}
            {!activeEp && (
              <div className="sm:hidden flex flex-col items-start justify-start text-left mb-8">
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                  {typeof movie.name === "string" ? movie.name : ""}
                </h1>
                <div className="flex flex-wrap items-center justify-start gap-2">
                  <span className="px-4 py-1.5 bg-[#333] rounded-full text-sm font-medium text-gray-200">
                    {movie.time || "1h 41min"}
                  </span>
                  {movie.category?.[0] && (
                    <span className="px-4 py-1.5 bg-[#333] rounded-full text-sm font-medium text-gray-200">
                      {movie.category[0].name}
                    </span>
                  )}
                  {movie.type && (
                    <span className="px-4 py-1.5 bg-[#333] rounded-full text-sm font-medium text-gray-200">
                      {movie.type === "single" ? "Movie" : "Series"}
                    </span>
                  )}
                  <span className="px-4 py-1.5 bg-[#333] rounded-full text-sm font-medium text-gray-200">
                    {tmdbMeta?.vote_average
                      ? `+${Math.round(tmdbMeta.vote_average)}`
                      : "+6"}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hidden sm:flex">
              <h1 className="text-2xl font-bold text-white">
                {typeof movie.name === "string" ? movie.name : ""}
              </h1>
              <button
                onClick={handleToggleList}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition text-sm font-medium text-white shadow-sm ring-1 ring-white/20",
                  inList
                    ? "bg-white/20 hover:bg-white/30"
                    : "bg-red-600 hover:bg-red-700 ring-transparent",
                )}
              >
                {inList ? <Check size={16} /> : <Plus size={16} />}
                {inList ? "Đã lưu" : "Lưu phim"}
              </button>
            </div>

            <div className="flex items-center gap-4 sm:hidden mb-8 w-full">
              <button
                onClick={handleToggleList}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[1.25rem] transition text-sm font-bold text-white shadow-lg border border-white/5",
                  inList
                    ? "bg-[#2a2a2a] hover:bg-[#333]"
                    : "bg-[#2a2a2a] hover:bg-[#333]",
                )}
              >
                {inList ? <Check size={18} /> : <Plus size={18} />}
                My List
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-2">
              <div className="flex gap-4">
                <button
                  onClick={() => setTab("info")}
                  className={cn(
                    "px-4 py-2 font-semibold transition-colors relative",
                    tab === "info" ? "text-white" : "text-gray-500",
                  )}
                >
                  Nội dung
                  {tab === "info" && (
                    <motion.div
                      layoutId="tab"
                      className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-red-600"
                    />
                  )}
                </button>
                {epList.length > 0 && (
                  <button
                    onClick={() => setTab("episodes")}
                    className={cn(
                      "px-4 py-2 font-semibold transition-colors relative",
                      tab === "episodes" ? "text-white" : "text-gray-500",
                    )}
                  >
                    Tập phim
                    {tab === "episodes" && (
                      <motion.div
                        layoutId="tab"
                        className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-red-600"
                      />
                    )}
                  </button>
                )}
              </div>

              {servers.length > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Nguồn phát:</span>
                  <select
                    value={selectedServerId}
                    onChange={(e) => {
                      const newId = parseInt(e.target.value);
                      setSelectedServerId(newId);
                      if (servers[newId]?.server_data?.[0]) {
                        setActiveEp(servers[newId].server_data[0]);
                      }
                    }}
                    className="bg-[#111] border border-white/20 rounded px-3 py-1.5 focus:outline-none focus:border-red-500 text-white min-w-[200px]"
                  >
                    {servers.map((s: any, i: number) => (
                      <option key={i} value={i}>
                        {s.server_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {tab === "info" ? (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-6 max-w-4xl">
                    <p
                      className="text-gray-300 leading-relaxed font-medium text-lg"
                      dangerouslySetInnerHTML={{
                        __html:
                          typeof movie.content === "string"
                            ? movie.content
                            : "Chưa có mô tả",
                      }}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {movie.actor && Array.isArray(movie.actor) && (
                        <div className="text-gray-400">
                          <span className="text-gray-500">Diễn viên: </span>
                          {movie.actor.join(", ")}
                        </div>
                      )}
                      {movie.director && Array.isArray(movie.director) && (
                        <div className="text-gray-400">
                          <span className="text-gray-500">Đạo diễn: </span>
                          {movie.director.join(", ")}
                        </div>
                      )}
                      {movie.category &&
                        Array.isArray(movie.category) &&
                        movie.category.length > 0 && (
                          <div className="text-gray-400 col-span-1 md:col-span-2">
                            <span className="text-gray-500">Thể loại: </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {movie.category.map((c: any, i: number) => {
                                const nameMap: Record<string, string> = {
                                  "Hanh Dong": "Hành Động",
                                  "Tinh Cam": "Tình Cảm",
                                  "Hai Huoc": "Hài Hước",
                                  "Co Trang": "Cổ Trang",
                                  "Tam Ly": "Tâm Lý",
                                  "Hinh Su": "Hình Sự",
                                  "Chien Tranh": "Chiến Tranh",
                                  "The Thao": "Thể Thao",
                                  "Vo Thuat": "Võ Thuật",
                                  "Vien Tuong": "Viễn Tưởng",
                                  "Kinh Di": "Kinh Dị",
                                  "Tai Lieu": "Tài Liệu",
                                  "Am Nhac": "Âm Nhạc",
                                  "Gia Dinh": "Gia Đình",
                                  "Hoc Duong": "Học Đường",
                                  "Hoat Hinh": "Hoạt Hình",
                                };
                                const displayName = nameMap[c.name] || c.name;
                                return (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-white/10 rounded text-xs text-white"
                                  >
                                    {displayName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Similar Movies */}
                  <SimilarMovies
                    originName={movie.origin_name || movie.name}
                    year={movie.year}
                    categorySlug={movie.category?.[0]?.slug}
                    onSelect={handleSimilarSelect}
                    currentSlug={movie.slug}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="episodes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "max-w-5xl",
                    epList.some((ep: any) => !!ep.still_path || !!ep.overview)
                      ? "flex flex-col gap-4"
                      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3",
                  )}
                >
                  {epList.map((ep: any, i: number) => {
                    const hasNetflixStyle = !!ep.still_path || !!ep.overview;
                    if (hasNetflixStyle) {
                      return (
                        <div
                          key={i}
                          onClick={() => handleSelectEpisode(ep)}
                          className={cn(
                            "col-span-full flex flex-col sm:flex-row gap-4 p-4 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent",
                            activeEp === ep
                              ? "bg-white/10 border-white/20"
                              : "",
                          )}
                        >
                          <div className="relative w-full sm:w-48 flex-shrink-0 aspect-video rounded-md overflow-hidden bg-[#222]">
                            {ep.still_path ? (
                              <SafeImage
                                src={ep.still_path}
                                alt={ep.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Film size={24} />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                              <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-black/50 text-white">
                                <Play
                                  size={18}
                                  className="ml-1"
                                  fill="currentColor"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col justify-center flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-white sm:text-lg">
                                {ep.name}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-3 sm:line-clamp-4 mt-1">
                              {ep.overview || "Chưa có mô tả cho tập này."}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Fallback for Ophim/KKPhim normal buttons
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectEpisode(ep)}
                        className={cn(
                          "flex items-center justify-center py-3 px-4 rounded-md font-medium transition-all w-full",
                          activeEp === ep
                            ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                            : "bg-[#1f1f1f] text-gray-300 hover:bg-white hover:text-black",
                        )}
                      >
                        {ep.name.startsWith("Tập") ? ep.name : `Tập ${ep.name}`}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
