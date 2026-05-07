import { fetchTmdbTrending } from './src/services/tmdb.ts';
fetchTmdbTrending().then(data => console.log('tmdb items:', data.length)).catch(console.error);
