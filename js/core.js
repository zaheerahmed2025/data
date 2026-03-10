// ═══════════════════════════════════════════════════════════
//  RankIQ — Core Engine v1.0
//  YouTube API wrapper + Cache + Storage + Event Bus
// ═══════════════════════════════════════════════════════════

const RankIQ = (() => {

  // ─── Config ───────────────────────────────────────────────
  const YT_BASE = 'https://www.googleapis.com/youtube/v3';
  const CACHE_TTL = 30 * 60 * 1000; // 30 min cache
  const STORE_PREFIX = 'riq_';

  // ─── State ────────────────────────────────────────────────
  let _apiKey = localStorage.getItem(STORE_PREFIX + 'apikey') || '';
  let _cache = JSON.parse(sessionStorage.getItem(STORE_PREFIX + 'cache') || '{}');
  let _quotaUsed = parseInt(sessionStorage.getItem(STORE_PREFIX + 'quota') || '0');

  // ─── Event Bus ────────────────────────────────────────────
  const _listeners = {};
  const on  = (evt, fn) => { (_listeners[evt] = _listeners[evt]||[]).push(fn); };
  const off = (evt, fn) => { _listeners[evt] = (_listeners[evt]||[]).filter(f=>f!==fn); };
  const emit = (evt, data) => { (_listeners[evt]||[]).forEach(fn => fn(data)); };

  // ─── API Key Management ───────────────────────────────────
  const getKey  = () => _apiKey;
  const hasKey  = () => !!_apiKey && _apiKey.startsWith('AIza');
  const setKey  = (k) => {
    _apiKey = k;
    localStorage.setItem(STORE_PREFIX + 'apikey', k);
    emit('keyChanged', k);
  };

  // ─── Quota Tracker ────────────────────────────────────────
  const QUOTA_COSTS = {
    '/search': 100, '/channels': 1, '/videos': 1,
    '/playlistItems': 1, '/commentThreads': 1, '/captions': 50
  };
  const trackQuota = (endpoint) => {
    const cost = Object.entries(QUOTA_COSTS).find(([k]) => endpoint.includes(k))?.[1] || 1;
    _quotaUsed += cost;
    sessionStorage.setItem(STORE_PREFIX + 'quota', _quotaUsed);
    emit('quotaUpdate', { used: _quotaUsed, limit: 10000, cost });
  };
  const getQuota = () => ({ used: _quotaUsed, limit: 10000, pct: Math.min(100, (_quotaUsed/10000)*100) });

  // ─── Cache ────────────────────────────────────────────────
  const cacheGet = (key) => {
    const entry = _cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { delete _cache[key]; return null; }
    return entry.data;
  };
  const cacheSet = (key, data) => {
    _cache[key] = { ts: Date.now(), data };
    try { sessionStorage.setItem(STORE_PREFIX + 'cache', JSON.stringify(_cache)); } catch(e) {
      // If sessionStorage full, clear half
      const keys = Object.keys(_cache);
      keys.slice(0, Math.floor(keys.length/2)).forEach(k => delete _cache[k]);
    }
  };

  // ─── Core API Fetch ──────────────────────────────────────
  const ytFetch = async (endpoint, params = {}, skipCache = false) => {
    if (!hasKey()) throw new Error('NO_KEY');
    const cacheKey = endpoint + JSON.stringify(params);
    if (!skipCache) {
      const cached = cacheGet(cacheKey);
      if (cached) return cached;
    }
    params.key = _apiKey;
    const url = YT_BASE + endpoint + '?' + new URLSearchParams(params);
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      const reason = data.error.errors?.[0]?.reason || '';
      const msgs = {
        quotaExceeded: 'Daily API quota exceeded (10,000 units). Try again tomorrow.',
        keyInvalid: 'Invalid API key. Please re-enter your key in settings.',
        forbidden: 'API access forbidden. Check your key restrictions.',
      };
      throw new Error(msgs[reason] || data.error.message);
    }
    trackQuota(endpoint);
    cacheSet(cacheKey, data);
    return data;
  };

  // ─── High-Level API Methods ──────────────────────────────

  const searchChannels = async (query, maxResults = 8) => {
    const sd = await ytFetch('/search', { part: 'snippet', type: 'channel', q: query, maxResults });
    if (!sd.items?.length) return [];
    const ids = sd.items.map(i => i.snippet.channelId).join(',');
    const cd = await ytFetch('/channels', { part: 'snippet,statistics,brandingSettings,contentDetails', id: ids });
    return cd.items;
  };

  const getChannel = async (idOrHandle) => {
    let id = idOrHandle;
    if (idOrHandle.includes('youtube.com/@')) {
      const handle = idOrHandle.split('@')[1].split(/[/?]/)[0];
      const sd = await ytFetch('/search', { part: 'snippet', type: 'channel', q: handle, maxResults: 1 });
      if (!sd.items?.length) throw new Error('Channel not found');
      id = sd.items[0].snippet.channelId;
    } else if (idOrHandle.includes('youtube.com/channel/')) {
      id = idOrHandle.split('/channel/')[1].split(/[/?]/)[0];
    } else if (!idOrHandle.startsWith('UC')) {
      const sd = await ytFetch('/search', { part: 'snippet', type: 'channel', q: idOrHandle, maxResults: 1 });
      if (!sd.items?.length) throw new Error('Channel not found');
      id = sd.items[0].snippet.channelId;
    }
    const cd = await ytFetch('/channels', { part: 'snippet,statistics,brandingSettings,contentDetails', id });
    if (!cd.items?.length) throw new Error('Channel not found');
    return cd.items[0];
  };

  const getChannelVideos = async (channelId, maxResults = 24, pageToken = null) => {
    const params = { part: 'contentDetails', id: channelId };
    const chData = await ytFetch('/channels', params);
    const uploadsId = chData.items[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return { items: [], nextPageToken: null };
    const plParams = { part: 'contentDetails', playlistId: uploadsId, maxResults };
    if (pageToken) plParams.pageToken = pageToken;
    const pl = await ytFetch('/playlistItems', plParams);
    const ids = pl.items.map(i => i.contentDetails.videoId).join(',');
    const vd = await ytFetch('/videos', { part: 'snippet,statistics,contentDetails', id: ids });
    return { items: vd.items, nextPageToken: pl.nextPageToken || null };
  };

  const searchVideos = async (query, opts = {}) => {
    const params = {
      part: 'snippet', type: 'video', q: query,
      maxResults: opts.maxResults || 10,
      order: opts.order || 'relevance',
      ...(opts.publishedAfter && { publishedAfter: opts.publishedAfter }),
      ...(opts.videoDuration && { videoDuration: opts.videoDuration }),
      ...(opts.regionCode && { regionCode: opts.regionCode }),
      ...(opts.relevanceLanguage && { relevanceLanguage: opts.relevanceLanguage }),
    };
    const sd = await ytFetch('/search', params);
    if (!sd.items?.length) return [];
    const ids = sd.items.map(i => i.id.videoId).join(',');
    const vd = await ytFetch('/videos', { part: 'snippet,statistics,contentDetails', id: ids });
    return vd.items;
  };

  const getVideoDetails = async (videoId) => {
    const vd = await ytFetch('/videos', { part: 'snippet,statistics,contentDetails,topicDetails', id: videoId });
    return vd.items?.[0] || null;
  };

  const getTrendingVideos = async (regionCode = 'US', categoryId = '0', maxResults = 20) => {
    const vd = await ytFetch('/videos', {
      part: 'snippet,statistics,contentDetails',
      chart: 'mostPopular', regionCode, videoCategoryId: categoryId, maxResults
    });
    return vd.items || [];
  };

  const getKeywordStats = async (keyword, niche = '') => {
    const q = niche ? `${keyword} ${niche}` : keyword;
    const [byViews, byDate, byRel] = await Promise.all([
      ytFetch('/search', { part: 'snippet', type: 'video', q, order: 'viewCount', maxResults: 5 }),
      ytFetch('/search', { part: 'snippet', type: 'video', q, order: 'date', maxResults: 5 }),
      ytFetch('/search', { part: 'snippet', type: 'video', q, order: 'relevance', maxResults: 5 }),
    ]);
    // Get stats for top results
    const allIds = [...new Set([
      ...byViews.items.map(i=>i.id.videoId),
      ...byDate.items.map(i=>i.id.videoId),
      ...byRel.items.map(i=>i.id.videoId),
    ])].slice(0,10).join(',');
    const stats = await ytFetch('/videos', { part: 'statistics,snippet,contentDetails', id: allIds });
    return { byViews: byViews.items, byDate: byDate.items, byRel: byRel.items, stats: stats.items };
  };

  const getComments = async (videoId, maxResults = 20) => {
    try {
      const cd = await ytFetch('/commentThreads', { part: 'snippet', videoId, maxResults, order: 'relevance' });
      return cd.items || [];
    } catch { return []; }
  };

  // ─── Persistence (localStorage) ─────────────────────────
  const store = {
    get: (key, def = null) => {
      try { const v = localStorage.getItem(STORE_PREFIX + key); return v ? JSON.parse(v) : def; } catch { return def; }
    },
    set: (key, val) => {
      try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(val)); return true; } catch { return false; }
    },
    del: (key) => localStorage.removeItem(STORE_PREFIX + key),
    keys: () => Object.keys(localStorage).filter(k => k.startsWith(STORE_PREFIX)).map(k => k.slice(STORE_PREFIX.length)),
  };

  // Saved channels list
  const savedChannels = {
    get: () => store.get('saved_channels', []),
    add: (ch) => {
      const list = savedChannels.get();
      if (!list.find(c => c.id === ch.id)) {
        list.unshift({ id:ch.id, title:ch.snippet.title, thumb:ch.snippet.thumbnails?.default?.url||'', subs:ch.statistics.subscriberCount, savedAt:new Date().toISOString() });
        store.set('saved_channels', list.slice(0, 20));
        emit('savedChannelsChanged');
      }
    },
    remove: (id) => { store.set('saved_channels', savedChannels.get().filter(c=>c.id!==id)); emit('savedChannelsChanged'); },
    has: (id) => !!savedChannels.get().find(c => c.id === id),
  };

  // Tracked keywords
  const keywords = {
    get: () => store.get('keywords', []),
    add: (kw, niche='') => {
      const list = keywords.get();
      if (!list.find(k => k.kw === kw)) {
        list.unshift({ kw, niche, addedAt: new Date().toISOString() });
        store.set('keywords', list.slice(0,50));
        emit('keywordsChanged');
      }
    },
    remove: (kw) => { store.set('keywords', keywords.get().filter(k=>k.kw!==kw)); emit('keywordsChanged'); },
  };

  // Notes
  const notes = {
    get: () => store.get('notes', []),
    add: (text, tag='') => {
      const list = notes.get();
      list.unshift({ id: Date.now().toString(36), text, tag, createdAt: new Date().toISOString() });
      store.set('notes', list.slice(0,100));
      emit('notesChanged');
    },
    remove: (id) => { store.set('notes', notes.get().filter(n=>n.id!==id)); emit('notesChanged'); },
  };

  // SEO history
  const seoHistory = {
    get: () => store.get('seo_history', []),
    add: (entry) => {
      const list = seoHistory.get();
      list.unshift({ ...entry, id: Date.now().toString(36), savedAt: new Date().toISOString() });
      store.set('seo_history', list.slice(0,50));
    },
  };

  // ─── Analytics / Scoring ─────────────────────────────────
  const scoreChannel = (ch) => {
    const s = ch.statistics;
    const sub = parseInt(s.subscriberCount)||0;
    const views = parseInt(s.viewCount)||0;
    const vids = parseInt(s.videoCount)||1;
    const avg = views/vids;
    const yrs = Math.max(1, (new Date()-new Date(ch.snippet.publishedAt))/31536000000);
    const vpy = vids/yrs;

    // Compute score components (0-100 each)
    const subsScore = Math.min(100, Math.log10(Math.max(1,sub))/8*100);
    const engScore = Math.min(100, Math.log10(Math.max(1,avg))/7*100);
    const consistScore = Math.min(100, Math.min(vpy,365)/365*100);
    const vpvScore = sub>0 ? Math.min(100, (views/sub)/100*100) : 0;

    return {
      overall: Math.round((subsScore*0.3 + engScore*0.4 + consistScore*0.15 + vpvScore*0.15)),
      subs: Math.round(subsScore),
      engagement: Math.round(engScore),
      consistency: Math.round(consistScore),
      efficiency: Math.round(vpvScore),
    };
  };

  const scoreVideo = (v) => {
    const s = v.statistics;
    const views = parseInt(s.viewCount)||0;
    const likes = parseInt(s.likeCount)||0;
    const comments = parseInt(s.commentCount)||0;
    const likeRatio = views>0 ? (likes/views)*100 : 0;
    const commentRatio = views>0 ? (comments/views)*100 : 0;
    const engagementRate = likeRatio + commentRatio*2;
    const daysSince = (Date.now()-new Date(v.snippet.publishedAt))/86400000;
    const velocity = daysSince > 0 ? views/daysSince : 0;

    return {
      views, likes, comments,
      likeRatio: likeRatio.toFixed(2),
      engagementRate: engagementRate.toFixed(2),
      velocity: Math.round(velocity),
      grade: engagementRate > 5 ? 'A' : engagementRate > 2 ? 'B' : engagementRate > 1 ? 'C' : engagementRate > 0.5 ? 'D' : 'F',
    };
  };

  const estimateRevenue = (views, rpm = 2.5) => {
    // RPM range: $0.5-$5 depending on niche/region
    const low = Math.round((views/1000)*0.5);
    const mid = Math.round((views/1000)*rpm);
    const high = Math.round((views/1000)*5);
    return { low, mid, high, display: `$${low.toLocaleString()} – $${high.toLocaleString()}` };
  };

  const analyzeKeywordDifficulty = (videos) => {
    // Based on avg views/likes/comments of top results
    const views = videos.map(v=>parseInt(v.statistics?.viewCount||0));
    const avgViews = views.reduce((a,b)=>a+b,0)/(views.length||1);
    const maxViews = Math.max(...views, 1);
    const difficulty = Math.min(100, Math.round(Math.log10(avgViews)/8*100));
    const opportunity = 100-difficulty;
    return {
      difficulty, opportunity,
      label: difficulty>80?'Very Hard':difficulty>60?'Hard':difficulty>40?'Medium':difficulty>20?'Easy':'Very Easy',
      color: difficulty>80?'#EF476F':difficulty>60?'#FF9F1C':difficulty>40?'#FFD166':difficulty>20?'#06D6A0':'#2EC4B6',
      avgViews: Math.round(avgViews),
      maxViews,
    };
  };

  // ─── Formatters ───────────────────────────────────────────
  const fmt = (n) => {
    n = parseInt(n)||0;
    if(n>=1e9) return (n/1e9).toFixed(2)+'B';
    if(n>=1e6) return (n/1e6).toFixed(2)+'M';
    if(n>=1e3) return (n/1e3).toFixed(1)+'K';
    return n.toLocaleString();
  };
  const fmtFull = (n) => (parseInt(n)||0).toLocaleString();
  const fmtDur = (iso) => {
    if(!iso) return '';
    const m=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if(!m) return '0:00';
    const h=+(m[1]||0),mi=+(m[2]||0),s=+(m[3]||0);
    return h?`${h}:${String(mi).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${mi}:${String(s).padStart(2,'0')}`;
  };
  const ago = (iso) => {
    const d=Math.floor((Date.now()-new Date(iso))/86400000);
    if(d===0)return'Today';if(d===1)return'Yesterday';
    if(d<7)return`${d}d ago`;if(d<30)return`${Math.floor(d/7)}w ago`;
    if(d<365)return`${Math.floor(d/30)}mo ago`;return`${Math.floor(d/365)}y ago`;
  };
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const esc = (s) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // ─── SEO Generator ────────────────────────────────────────
  const generateSEO = (topic, channelName, niche, trendTitles = [], trendTags = []) => {
    const t = topic;
    const titles = [
      `${t} | ${niche} | ${channelName}`,
      `${t} for Kids | Learn with ${channelName} | Educational Song`,
      `${t} 🎵 Fun Learning Song | ${channelName}`,
      `Learn ${t} | Educational Video | ${channelName} | Children's Learning`,
      `${t} | Kids Education | ${channelName} | Toddlers & Preschoolers`,
    ];
    const baseTags = [
      t, t+' for kids', t+' song', t+' nursery rhyme', t+' educational',
      'kids songs', 'nursery rhymes', 'toddler learning', 'preschool',
      'educational videos for kids', 'children songs', 'learn '+t,
      'kids education', 'baby songs', 'kindergarten learning',
      'educational animation', 'fun learning for kids', channelName,
    ];
    const allTags = [...new Set([...baseTags, ...trendTags])].slice(0,30);
    const description = `🎵 Welcome to ${channelName}! 🎵

Today we're learning about "${t}" in a fun and engaging way! Perfect for toddlers, preschoolers, and kindergarten students.

🌟 WHAT YOUR CHILD WILL LEARN:
✅ ${t} in a simple, memorable way
✅ Engaging animations and bright visuals
✅ A catchy song to make learning stick
✅ Designed for ages 1–6

📚 GREAT FOR:
• Early childhood development
• Preschool and kindergarten prep
• ESL and bilingual learners
• Homeschool families

🔔 SUBSCRIBE to ${channelName} for new educational videos every week!
👍 LIKE if your child enjoyed learning!
💬 COMMENT what topic you'd like us to cover next!

━━━━━━━━━━━━━━━━━━━━━━
${allTags.slice(0,15).map(t=>'#'+t.replace(/\s+/g,'')).join(' ')}
━━━━━━━━━━━━━━━━━━━━━━`;

    return { titles, description, tags: allTags };
  };

  // ─── Public API ────────────────────────────────────────────
  return {
    // Key
    getKey, hasKey, setKey,
    // Quota
    getQuota, trackQuota,
    // Cache
    cacheGet, cacheSet,
    // YT API
    ytFetch, searchChannels, getChannel, getChannelVideos,
    searchVideos, getVideoDetails, getTrendingVideos,
    getKeywordStats, getComments,
    // Storage
    store, savedChannels, keywords, notes, seoHistory,
    // Analytics
    scoreChannel, scoreVideo, estimateRevenue, analyzeKeywordDifficulty,
    // SEO
    generateSEO,
    // Formatters
    fmt, fmtFull, fmtDur, ago, fmtDate, esc,
    // Events
    on, off, emit,
  };
})();

// Global shorthand
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
