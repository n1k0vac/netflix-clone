import { useQuery } from '@tanstack/react-query';
import { fetchTmdbMeta, fetchTmdbTrailer, fetchTmdbSimilar, fetchTmdbTrending } from '../services/tmdb';

export const useTmdbTrending = () => {
  return useQuery({
    queryKey: ['tmdb-trending'],
    queryFn: fetchTmdbTrending,
    staleTime: 60 * 60 * 1000,
  });
};

export const useTmdbMeta = (originName: string | undefined, year: string | number | undefined) => {
  return useQuery({
    queryKey: ['tmdb-meta', originName, year],
    queryFn: () => fetchTmdbMeta(originName || '', year || ''),
    enabled: !!originName,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useTmdbTrailer = (tmdbId: number | null | undefined, mediaType: 'movie' | 'tv' | undefined) => {
  return useQuery({
    queryKey: ['tmdb-trailer', tmdbId],
    queryFn: () => fetchTmdbTrailer(tmdbId || null, mediaType || 'movie'),
    enabled: !!tmdbId,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  });
};

export const useTmdbSimilar = (tmdbId: number | null | undefined, mediaType: 'movie' | 'tv' | undefined) => {
  return useQuery({
    queryKey: ['tmdb-similar', tmdbId],
    queryFn: () => fetchTmdbSimilar(tmdbId || null, mediaType || 'movie'),
    enabled: !!tmdbId,
  });
};
