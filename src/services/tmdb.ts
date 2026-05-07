export type TmdbMeta = {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  vote_average: number;
  vote_count: number;
  backdrop_path: string | null;
  poster_path: string | null;
  overview: string;
  genres: { id: number; name: string }[];
  runtime?: number;
} | null;

export type TmdbSimilarItem = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
};

export type TmdbTrendingItem = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  media_type: 'movie' | 'tv';
  overview: string;
};

const TMDB_KEY = (import.meta as any).env.VITE_TMDB_API_KEY || "8d6d91941230817f7807d643736e8a49";

export const fetchTmdbTrending = async (): Promise<TmdbTrendingItem[]> => {
  if (!TMDB_KEY) return [];
  try {
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}&language=vi-VN`);
    const data = await res.json();
    if (data?.results?.length > 0) {
      return data.results.map((r: any) => ({
        tmdb_id: r.id,
        title: r.title || r.name,
        poster_path: r.poster_path,
        backdrop_path: r.backdrop_path,
        vote_average: r.vote_average,
        release_date: r.release_date || r.first_air_date,
        media_type: r.media_type,
        overview: r.overview
      }));
    }
  } catch (e) {
    console.warn("TMDB trending error", e);
  }
  return [];
};

export const fetchTmdbMeta = async (originName: string, year: string | number): Promise<TmdbMeta> => {
  if (!TMDB_KEY) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(originName)}&year=${year}&api_key=${TMDB_KEY}&language=vi-VN`);
    const data = await res.json();
    if (data?.results?.length > 0) {
      const match = data.results[0];
      return {
        tmdb_id: match.id,
        media_type: match.media_type,
        vote_average: match.vote_average,
        vote_count: match.vote_count,
        backdrop_path: match.backdrop_path,
        poster_path: match.poster_path,
        overview: match.overview,
        genres: match.genre_ids?.map((id: number) => ({ id, name: id.toString() })) || []
      };
    }
  } catch (e) {
    console.warn("TMDB fetch error", e);
  }
  return null;
};

export const fetchTmdbTrailer = async (tmdbId: number | null, mediaType: 'movie' | 'tv'): Promise<string | null> => {
  if (!TMDB_KEY || !tmdbId) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${TMDB_KEY}`);
    const data = await res.json();
    if (data?.results?.length > 0) {
      const trailers = data.results.filter((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
      trailers.sort((a: any, b: any) => (a.official === b.official ? 0 : a.official ? -1 : 1));
      if (trailers.length > 0) return trailers[0].key;
    }
  } catch (e) {
    console.warn("TMDB trailer error", e);
  }
  return null;
};

export const fetchTmdbSimilar = async (tmdbId: number | null, mediaType: 'movie' | 'tv'): Promise<TmdbSimilarItem[]> => {
  if (!TMDB_KEY || !tmdbId) return [];
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/similar?api_key=${TMDB_KEY}&language=vi-VN`);
    const data = await res.json();
    if (data?.results?.length > 0) {
      return data.results.map((r: any) => ({
        tmdb_id: r.id,
        title: r.title || r.name,
        poster_path: r.poster_path,
        vote_average: r.vote_average,
        release_date: r.release_date || r.first_air_date
      }));
    }
  } catch (e) {
    console.warn("TMDB similar error", e);
  }
  return [];
};

export const getTmdbImageUrl = (path: string | null | undefined, size: 'w300' | 'w500' | 'w780' | 'w1280' | 'original'): string | null => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
