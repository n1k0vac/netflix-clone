export const fetchMultiSource = async (type: string, page: number = 1) => {
  const isNew = type === 'phim-moi-cap-nhat';
  const isCategory = type.startsWith('the-loai/') || type.startsWith('quoc-gia/');
  
  let path1 = '', path2 = '';
  if (isNew) {
    path1 = `danh-sach/phim-moi-cap-nhat?page=${page * 2 - 1}`;
    path2 = `danh-sach/phim-moi-cap-nhat?page=${page * 2}`;
  } else if (isCategory) {
    path1 = `v1/api/${type}?limit=24&page=${page * 2 - 1}`;
    path2 = `v1/api/${type}?limit=24&page=${page * 2}`;
  } else {
    // Like phim-bo, phim-le, hoat-hinh
    path1 = `v1/api/danh-sach/${type}?limit=24&page=${page * 2 - 1}`;
    path2 = `v1/api/danh-sach/${type}?limit=24&page=${page * 2}`;
  }
  
  const sources = [
    `https://phimapi.com/${path1}`,
    `https://phimapi.com/${path2}`,
    `https://ophim1.com/${path1}`
  ];
  const results = await Promise.allSettled(sources.map(url => fetch(url).then(r => r.json())));
  const merged: any[] = [];
  results.forEach(res => {
    if (res.status === 'fulfilled') {
      const v = res.value;
      const pathImage = v.pathImage || v.data?.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com/';
      const rawItems = v?.items || v?.data?.items || [];
      
      const items = rawItems.map((item: any) => {
        let poster = typeof item.poster_url === 'string' ? item.poster_url : '';
        let thumb = typeof item.thumb_url === 'string' ? item.thumb_url : '';
        
        if (poster && !poster.startsWith('http')) {
          poster = pathImage.endsWith('/') ? `${pathImage}${poster}` : `${pathImage}/${poster}`;
        }
        if (thumb && !thumb.startsWith('http')) {
          thumb = pathImage.endsWith('/') ? `${pathImage}${thumb}` : `${pathImage}/${thumb}`;
        }
        return { ...item, poster_url: poster, thumb_url: thumb };
      });

      merged.push(...items);
    }
  });

  const unique = new Map();
  merged.forEach(item => {
    if (typeof item?.slug === 'string' && !unique.has(item.slug)) {
      unique.set(item.slug, item);
    }
  });

  return Array.from(unique.values());
};

export const fetchSearch = async (keyword: string) => {
  if (!keyword) return [];
  const encodedKw = encodeURIComponent(keyword);
  const sources = [
    `https://phimapi.com/v1/api/tim-kiem?keyword=${encodedKw}&limit=30`,
    `https://ophim1.com/v1/api/tim-kiem?keyword=${encodedKw}&limit=30`
  ];
  const TMDB_KEY = (import.meta as any).env.VITE_TMDB_API_KEY || "8d6d91941230817f7807d643736e8a49";
  if (TMDB_KEY) {
     sources.push(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&language=vi-VN&query=${encodedKw}`);
  }

  const results = await Promise.allSettled(sources.map(url => fetch(url).then(r => r.json()).then(data => ({url, data}))));
  const merged: any[] = [];
  results.forEach(res => {
    if (res.status === 'fulfilled') {
      const v = res.value.data;
      if (res.value.url.includes('themoviedb.org')) {
         const tmdbRes = v?.results || [];
         tmdbRes.forEach((m: any) => {
           if (m.media_type === 'movie' || m.media_type === 'tv') {
             if (!merged.find(x => x.tmdb_id === m.id)) {
               merged.push({
                 _id: `tmdb_${m.id}`,
                 name: m.title || m.name,
                 origin_name: m.original_title || m.original_name,
                 slug: `tmdb:${m.id}:${m.media_type}:${(m.title||m.name||'').replace(/\\s+/g, '-').toLowerCase()}`,
                 poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
                 thumb_url: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
                 year: (m.release_date || m.first_air_date || '').split('-')[0],
                 tmdb_id: m.id,
                 media_type: m.media_type
               });
             }
           }
         });
      } else {
        const pathImage = v?.data?.APP_DOMAIN_CDN_IMAGE || v?.pathImage || 'https://phimimg.com/';
        if (v?.data?.items) {
           v.data.items.forEach((item: any) => {
             let poster = typeof item.poster_url === 'string' ? item.poster_url : '';
             let thumb = typeof item.thumb_url === 'string' ? item.thumb_url : '';
             if (poster && !poster.startsWith('http')) poster = pathImage.endsWith('/') ? `${pathImage}${poster}` : `${pathImage}/${poster}`;
             if (thumb && !thumb.startsWith('http')) thumb = pathImage.endsWith('/') ? `${pathImage}${thumb}` : `${pathImage}/${thumb}`;
             merged.push({ ...item, poster_url: poster, thumb_url: thumb });
           });
        }
      }
    }
  });

  const unique = new Map();
  merged.forEach(item => {
    const key = item.tmdb_id ? `tmdb_${item.tmdb_id}` : (typeof item?.slug === 'string' ? item.slug : null);
    if (key && !unique.has(key)) {
      unique.set(key, item);
    }
  });

  return Array.from(unique.values()).map((item: any) => {
    if (item.tmdb_id) return item;
    const poster = typeof item.poster_url === 'string' ? item.poster_url : '';
    const thumb = typeof item.thumb_url === 'string' ? item.thumb_url : '';
    return {
      ...item,
      poster_url: poster.startsWith('http') ? poster : `https://phimimg.com/${poster}`,
      thumb_url: thumb.startsWith('http') ? thumb : `https://phimimg.com/${thumb}`
    };
  });
};

export const fetchDetail = async (slug: string) => {
  if (slug.startsWith('tmdb:')) {
     const [_, id, mediaType] = slug.split(':');
     const TMDB_KEY = (import.meta as any).env.VITE_TMDB_API_KEY || "8d6d91941230817f7807d643736e8a49";
     const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_KEY}&language=vi-VN`);
     const data = await res.json();
     
     let episodesData: any[] = [];
     
     if (mediaType === 'movie') {
         episodesData = [{
             server_name: 'Vidsrc (Thuyết Minh / Vietsub)',
             server_data: [{
                 name: 'Bản Đẹp Nhất',
                 slug: 'full',
                 link_embed: `https://vidsrc.me/embed/movie?tmdb=${data.id}`,
                 still_path: data.backdrop_path ? `https://image.tmdb.org/t/p/w500${data.backdrop_path}` : '',
                 overview: data.overview
             }]
         }];
     } else {
         const seasonRes = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/1?api_key=${TMDB_KEY}&language=vi-VN`).catch(() => null);
         let eps = [];
         if (seasonRes && seasonRes.ok) {
             const sData = await seasonRes.json();
             eps = sData.episodes?.map((ep:any) => ({
                 name: `Tập ${ep.episode_number} - ${ep.name}`,
                 slug: `ep-${ep.episode_number}`,
                 link_embed: `https://vidsrc.me/embed/tv?tmdb=${data.id}&season=1&episode=${ep.episode_number}`,
                 still_path: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : '',
                 overview: ep.overview || `Đang cập nhật nội dung tập ${ep.episode_number}...`
             })) || [];
         }
         
         if (eps.length === 0 && data.number_of_episodes > 0) {
             for (let i = 1; i <= data.number_of_episodes; i++) {
                 eps.push({
                     name: `Tập ${i}`,
                     slug: `ep-${i}`,
                     link_embed: `https://vidsrc.me/embed/tv?tmdb=${data.id}&season=1&episode=${i}`,
                     still_path: '',
                     overview: ''
                 });
             }
         }
         episodesData = eps.length > 0 ? [{ server_name: 'Vidsrc (Mùa 1)', server_data: eps }] : [];
     }

     return {
        movie: {
           _id: `tmdb_${id}`,
           name: data.title || data.name,
           origin_name: data.original_title || data.original_name,
           content: data.overview,
           type: mediaType === 'movie' ? 'single' : 'series',
           status: data.status,
           poster_url: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
           thumb_url: `https://image.tmdb.org/t/p/original${data.backdrop_path}`,
           year: (data.release_date || data.first_air_date || '').split('-')[0],
           actor: [],
           director: [],
           category: data.genres?.map((g:any)=>({name: g.name})) || [],
           country: data.production_countries?.map((c:any)=>({name: c.name})) || [],
           tmdb_id: data.id, 
           media_type: mediaType,
           number_of_episodes: data.number_of_episodes
        },
        episodes: episodesData
     };
  }

  const sources = [
    { name: 'OPhim', url: `https://ophim1.com/phim/${slug}` },
    { name: 'PhimAPI', url: `https://phimapi.com/phim/${slug}` }
  ];
  
  const results = await Promise.allSettled(sources.map(s => fetch(s.url).then(r => r.json()).then(data => ({ sourceName: s.name, data }))));
  
  let baseMovie: any = null;
  const allEpisodes: any[] = [];
  
  results.forEach(res => {
    if (res.status === 'fulfilled' && res.value.data?.status && res.value.data?.movie) {
      if (!baseMovie) baseMovie = res.value.data.movie;
      
      const eps = res.value.data.episodes;
      if (Array.isArray(eps)) {
        eps.forEach(ep => {
          allEpisodes.push({
            server_name: `${res.value.sourceName} - ${ep.server_name || 'Server'}`,
            server_data: ep.server_data
          });
        });
      }
    }
  });

  if (!baseMovie) throw new Error("Not found");
  
  return { movie: baseMovie, episodes: allEpisodes };
};
