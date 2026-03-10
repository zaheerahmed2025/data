// ═══════════════════════════════════════════════════════════
//  RankIQ — Page Modules
//  Dashboard, Channel Analyzer, Keyword Research,
//  SEO Optimizer, Trending, Competitor Compare, Saved
// ═══════════════════════════════════════════════════════════

// ════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════
Router.register('dashboard', async () => {
  const el = $('page-dashboard');
  if (!RankIQ.hasKey()) {
    el.innerHTML = `<div class="page-inner">
      <div class="page-head"><h1 class="page-title">Welcome to <span class="grad">RankIQ</span></h1>
        <p class="page-sub">The free, open-source YouTube intelligence platform. Rank faster. Research smarter.</p></div>
      <div class="feature-grid">
        ${[
          ['🔍','Keyword Research','Find what people are searching — see difficulty, competition, and opportunity scores'],
          ['📊','Channel Analyzer','Deep-dive any channel: scores, top videos, revenue estimates, growth velocity'],
          ['📈','Trending Now','Real-time trending videos by region and category — spot trends early'],
          ['✍️','SEO Optimizer','Generate optimized titles, descriptions, and tags from real trending data'],
          ['⚔️','Competitor Compare','Side-by-side comparison of any two channels with win/loss breakdown'],
          ['💾','Saved Data','All your research — keywords, channels, SEO history — saved locally forever'],
        ].map(([icon,title,desc])=>`<div class="feature-card"><div class="fc-icon">${icon}</div><div class="fc-title">${title}</div><div class="fc-desc">${desc}</div></div>`).join('')}
      </div>
      <div style="text-align:center;margin-top:40px">
        <button class="btn-primary btn-lg" onclick="$('setup-modal').classList.add('visible')">🔑 Connect Your YouTube API Key</button>
        <div style="margin-top:12px;font-size:13px;color:var(--muted)">Free API key · 10,000 units/day · No server · Your data stays in your browser</div>
      </div>
    </div>`;
    return;
  }

  el.innerHTML = `<div class="page-inner">
    <div class="page-head"><h1 class="page-title">Dashboard</h1><p class="page-sub">Your research hub — everything at a glance</p></div>
    <div id="dash-stats" class="stats-row"></div>
    <div class="dash-grid">
      <div class="dash-panel" id="dash-saved-channels">
        <div class="panel-head"><span>📌 Tracked Channels</span><button class="panel-btn" onclick="Router.go('channel')">+ Add</button></div>
        <div id="dash-ch-list"></div>
      </div>
      <div class="dash-panel" id="dash-keywords">
        <div class="panel-head"><span>🔑 Tracked Keywords</span><button class="panel-btn" onclick="Router.go('keywords')">+ Add</button></div>
        <div id="dash-kw-list"></div>
      </div>
      <div class="dash-panel" id="dash-trending-mini">
        <div class="panel-head"><span>🔥 Trending Right Now</span><button class="panel-btn" onclick="Router.go('trending')">View All</button></div>
        <div id="dash-trend-list"></div>
      </div>
      <div class="dash-panel" id="dash-recent-seo">
        <div class="panel-head"><span>✍️ Recent SEO</span><button class="panel-btn" onclick="Router.go('seo')">Open Tool</button></div>
        <div id="dash-seo-list"></div>
      </div>
    </div>
  </div>`;

  // Stats
  const q = RankIQ.getQuota();
  const saved = RankIQ.savedChannels.get();
  const kws = RankIQ.keywords.get();
  const seoH = RankIQ.seoHistory.get();
  $('dash-stats').innerHTML =
    UI.statCard('📊', saved.length, 'Tracked Channels', '', 'var(--accent3)') +
    UI.statCard('🔑', kws.length, 'Keywords Tracked', '', 'var(--gold)') +
    UI.statCard('✍️', seoH.length, 'SEO Reports', '', 'var(--green)') +
    UI.statCard('⚡', `${10000-q.used}`, 'API Units Left Today', `${q.used} used`, 'var(--accent)');

  // Saved channels
  const chList = $('dash-ch-list');
  if (saved.length) {
    chList.innerHTML = saved.slice(0,5).map(c=>`
      <div class="dash-row" onclick="Pages.channel.loadById('${c.id}')">
        <img src="${RankIQ.esc(c.thumb)}" class="dr-img" onerror="this.style.background='#222'">
        <div class="dr-info"><div class="dr-title">${RankIQ.esc(c.title)}</div>
          <div class="dr-sub">👥 ${RankIQ.fmt(c.subs)}</div></div>
        <span class="dr-arrow">→</span>
      </div>`).join('');
  } else {
    chList.innerHTML = UI.empty('📌','No channels tracked yet','Search a channel and click Track');
  }

  // Keywords
  const kwList = $('dash-kw-list');
  if (kws.length) {
    kwList.innerHTML = kws.slice(0,6).map(k=>`
      <div class="dash-row" onclick="Pages.keywords.search('${RankIQ.esc(k.kw)}')">
        <div class="kw-icon">🔍</div>
        <div class="dr-info"><div class="dr-title">${RankIQ.esc(k.kw)}</div>
          <div class="dr-sub">${k.niche||'No niche'} · Added ${RankIQ.ago(k.addedAt)}</div></div>
        <span class="dr-arrow">→</span>
      </div>`).join('');
  } else {
    kwList.innerHTML = UI.empty('🔑','No keywords tracked','Use Keyword Research to add keywords');
  }

  // Trending mini
  try {
    const trends = await RankIQ.getTrendingVideos('US','0',5);
    $('dash-trend-list').innerHTML = trends.map(v=>`
      <div class="dash-row" onclick="window.open('https://youtube.com/watch?v=${v.id}','_blank')">
        <img src="${RankIQ.esc(v.snippet.thumbnails?.default?.url||'')}" class="dr-img" style="border-radius:6px;aspect-ratio:16/9;width:64px;object-fit:cover">
        <div class="dr-info"><div class="dr-title">${RankIQ.esc(v.snippet.title.substring(0,50))}${v.snippet.title.length>50?'...':''}</div>
          <div class="dr-sub">👁 ${RankIQ.fmt(v.statistics?.viewCount)} · ${v.snippet.channelTitle.substring(0,25)}</div></div>
        <span class="dr-arrow">↗</span>
      </div>`).join('');
  } catch(e) {
    $('dash-trend-list').innerHTML = UI.empty('🔥','Could not load trending','Check your API key');
  }

  // Recent SEO
  const seoList = $('dash-seo-list');
  if (seoH.length) {
    seoList.innerHTML = seoH.slice(0,4).map(s=>`
      <div class="dash-row" onclick="Pages.seo.loadFromHistory(${JSON.stringify(s)})">
        <div class="kw-icon">✍️</div>
        <div class="dr-info"><div class="dr-title">${RankIQ.esc(s.topic)}</div>
          <div class="dr-sub">${RankIQ.fmtDate(s.savedAt)}</div></div>
        <span class="dr-arrow">→</span>
      </div>`).join('');
  } else {
    seoList.innerHTML = UI.empty('✍️','No SEO reports yet','Use the SEO Optimizer');
  }
});

// ════════════════════════════════════════════
//  CHANNEL ANALYZER
// ════════════════════════════════════════════
const Pages = {};

Pages.channel = {
  currentChannel: null,
  currentVideos: [],

  init: () => {
    $('page-channel').innerHTML = `<div class="page-inner">
      <div class="page-head">
        <h1 class="page-title">Channel Analyzer</h1>
        <p class="page-sub">Deep intelligence on any YouTube channel — scores, revenue, growth velocity, top content</p>
      </div>
      <div class="search-bar-wrap">
        <div class="search-bar">
          <span class="sb-icon">🔍</span>
          <input id="ch-search-input" class="sb-input" placeholder="Enter channel name, URL, or @handle..." onkeydown="if(event.key==='Enter') Pages.channel.search()">
          <button class="sb-btn" onclick="Pages.channel.search()">Analyze →</button>
        </div>
        <div class="quick-row">
          <span class="qr-label">Try:</span>
          ${['Cocomelon','MrBeast','Super Simple Songs','Pinkfong','Ms Rachel Songs','BabaSharo TV'].map(n=>`<button class="q-chip" onclick="Pages.channel.quickSearch('${n}')">${n}</button>`).join('')}
        </div>
      </div>
      <div id="ch-results"></div>
    </div>`;
  },

  quickSearch: (name) => {
    $('ch-search-input').value = name;
    Pages.channel.search();
  },

  search: async () => {
    const q = ($('ch-search-input')?.value||'').trim();
    if (!q) return;
    $('ch-results').innerHTML = UI.loading('Searching YouTube...');
    try {
      const channels = await RankIQ.searchChannels(q);
      if (!channels.length) { $('ch-results').innerHTML = UI.empty('😕','No channels found','Try a different name or URL'); return; }
      $('ch-results').innerHTML = `<div class="results-grid">${channels.map(ch => {
        const size = channelSizeLabel(ch.statistics.subscriberCount);
        const score = RankIQ.scoreChannel(ch);
        const thumb = ch.snippet.thumbnails?.medium?.url||ch.snippet.thumbnails?.default?.url||'';
        return `<div class="ch-result-card" onclick="Pages.channel.load(${JSON.stringify(ch).replace(/"/g,'&quot;')})">
          <div class="crc-header">
            <img src="${RankIQ.esc(thumb)}" class="crc-img" onerror="this.style.background='#1a1a2e'">
            <div style="flex:1;min-width:0">
              <div class="crc-name">${RankIQ.esc(ch.snippet.title)}</div>
              <div class="crc-handle">${ch.snippet.customUrl?'@'+ch.snippet.customUrl:''}</div>
              <span class="size-label" style="color:${size.color};background:${size.color}15;border:1px solid ${size.color}30">${size.label}</span>
            </div>
            <div style="flex-shrink:0">${UI.scoreRing(score.overall, 64)}</div>
          </div>
          <div class="crc-stats">
            <div class="crc-stat"><div class="crs-val">${RankIQ.fmt(ch.statistics.subscriberCount)}</div><div class="crs-lbl">Subscribers</div></div>
            <div class="crc-stat"><div class="crs-val">${RankIQ.fmt(ch.statistics.viewCount)}</div><div class="crs-lbl">Total Views</div></div>
            <div class="crc-stat"><div class="crs-val">${RankIQ.fmt(ch.statistics.videoCount)}</div><div class="crs-lbl">Videos</div></div>
          </div>
          <div class="crc-desc">${RankIQ.esc((ch.snippet.description||'').substring(0,100))}${(ch.snippet.description||'').length>100?'...':''}</div>
          <div class="crc-footer">Click to Full Analyze →</div>
        </div>`;
      }).join('')}</div>`;
    } catch(e) {
      $('ch-results').innerHTML = `<div class="error-box">⚠️ ${RankIQ.esc(e.message)}</div>`;
    }
  },

  loadById: async (id) => {
    Router.go('channel');
    $('ch-results').innerHTML = UI.loading('Loading channel...');
    try {
      const ch = await RankIQ.getChannel(id);
      Pages.channel.load(ch);
    } catch(e) {
      $('ch-results').innerHTML = `<div class="error-box">⚠️ ${RankIQ.esc(e.message)}</div>`;
    }
  },

  load: async (ch) => {
    Pages.channel.currentChannel = ch;
    const sn = ch.snippet, s = ch.statistics;
    const sub = parseInt(s.subscriberCount)||0, views = parseInt(s.viewCount)||0, vids = parseInt(s.videoCount)||1;
    const avg = Math.round(views/vids);
    const score = RankIQ.scoreChannel(ch);
    const size = channelSizeLabel(sub);
    const startY = new Date(sn.publishedAt).getFullYear();
    const yrs = Math.max(1,(Date.now()-new Date(sn.publishedAt))/31536000000);
    const vpy = Math.round(vids/yrs);
    const rev = RankIQ.estimateRevenue(views);
    const isSaved = RankIQ.savedChannels.has(ch.id);

    $('ch-results').innerHTML = `
      <div class="ch-detail">
        <!-- Header -->
        <div class="chd-header">
          <img src="${RankIQ.esc(sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'')}" class="chd-avatar">
          <div class="chd-info">
            <div class="chd-name">${RankIQ.esc(sn.title)}</div>
            <div class="chd-handle">${sn.customUrl?'@'+sn.customUrl:''} · Since ${startY}</div>
            <div class="chd-desc">${RankIQ.esc((sn.description||'').substring(0,200))}${(sn.description||'').length>200?'...':''}</div>
            <div class="chd-actions">
              <a href="https://youtube.com/channel/${ch.id}" target="_blank" class="btn-ghost-sm">▶ Open Channel</a>
              <button class="btn-ghost-sm ${isSaved?'btn-saved':''}" onclick="Pages.channel.toggleSave()" id="ch-save-btn">
                ${isSaved?'✓ Tracked':'+ Track Channel'}
              </button>
              <button class="btn-ghost-sm" onclick="Router.go('compare');Pages.compare.setChannel(1,${JSON.stringify(ch).replace(/"/g,'&quot;')})">⚔️ Compare</button>
              <button class="btn-ghost-sm" onclick="Pages.channel.search()">← Back to Results</button>
            </div>
          </div>
          <div class="chd-score-block">
            <div class="csb-label">Channel Score</div>
            ${UI.scoreRing(score.overall, 100, score.overall>70?'var(--green)':score.overall>40?'var(--gold)':'var(--accent)')}
            <div class="csb-grade">${score.overall>70?'Strong':score.overall>40?'Growing':'Early Stage'}</div>
          </div>
        </div>

        <!-- Main Stats -->
        <div class="stats-row">
          ${UI.statCard('👥', RankIQ.fmt(sub), 'Subscribers', RankIQ.fmtFull(sub), 'var(--accent)')}
          ${UI.statCard('👁', RankIQ.fmt(views), 'Total Views', RankIQ.fmtFull(views), 'var(--accent3)')}
          ${UI.statCard('🎬', RankIQ.fmt(vids), 'Total Videos', `${vpy}/yr`, 'var(--gold)')}
          ${UI.statCard('📊', RankIQ.fmt(avg), 'Avg Views/Video', 'per upload', 'var(--green)')}
          ${UI.statCard('💰', rev.display, 'Est. Total Revenue', `~$${RankIQ.fmt(Math.round(views/1000*2.5))}/yr`, '#CE93D8')}
          ${UI.statCard('⚡', `${(views/sub||0).toFixed(1)}x`, 'Views/Sub Ratio', sub>0?'efficiency':'N/A', 'var(--accent2)')}
        </div>

        <!-- Score Breakdown -->
        <div class="section-title">📊 Score Breakdown</div>
        <div class="score-breakdown">
          ${[['Subscriber Base',score.subs,'var(--accent)'],['Engagement Rate',score.engagement,'var(--green)'],['Upload Consistency',score.consistency,'var(--gold)'],['Channel Efficiency',score.efficiency,'var(--accent3)']].map(([label,val,color])=>`
            <div class="sb-row">
              <div class="sb-label">${label}</div>
              ${UI.bar(val, 100, color)}
              <div class="sb-val" style="color:${color}">${val}</div>
            </div>`).join('')}
        </div>

        <!-- Tabs -->
        <div class="tab-bar" id="ch-tabs">
          <button class="tab active" data-tab="ch-videos">📹 Videos</button>
          <button class="tab" data-tab="ch-analysis">💡 Analysis</button>
          <button class="tab" data-tab="ch-ideas">🎬 Video Ideas</button>
          <button class="tab" data-tab="ch-seo">✍️ SEO Tools</button>
        </div>
        <div id="ch-tab-content">
          <div id="ch-videos" class="tab-panel active"><div class="loading-mini">Loading videos...</div></div>
          <div id="ch-analysis" class="tab-panel"></div>
          <div id="ch-ideas" class="tab-panel"></div>
          <div id="ch-seo" class="tab-panel"></div>
        </div>
      </div>`;

    // Tab switching
    $$('#ch-tabs .tab').forEach(btn => {
      btn.onclick = () => {
        $$('#ch-tabs .tab').forEach(b=>b.classList.remove('active'));
        $$('#ch-tab-content .tab-panel').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active');
        $(btn.dataset.tab).classList.add('active');
        Pages.channel.renderTab(btn.dataset.tab);
      };
    });

    // Load videos
    Pages.channel.loadVideos(ch.id);
  },

  toggleSave: () => {
    const ch = Pages.channel.currentChannel;
    if (!ch) return;
    if (RankIQ.savedChannels.has(ch.id)) {
      RankIQ.savedChannels.remove(ch.id);
      $('ch-save-btn').innerHTML = '+ Track Channel';
      $('ch-save-btn').classList.remove('btn-saved');
      Toast.show('Channel removed from tracking', 'info');
    } else {
      RankIQ.savedChannels.add(ch);
      $('ch-save-btn').innerHTML = '✓ Tracked';
      $('ch-save-btn').classList.add('btn-saved');
      Toast.show('✓ Channel is now being tracked!', 'success');
    }
  },

  loadVideos: async (chId) => {
    try {
      const { items } = await RankIQ.getChannelVideos(chId, 24);
      Pages.channel.currentVideos = items;
      const sorted = [...items].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
      $('ch-videos').innerHTML = `
        <div class="sort-bar">
          <span style="font-size:13px;color:var(--muted)">Showing ${items.length} videos — sorted by views</span>
          <div style="display:flex;gap:8px">
            <button class="sort-btn active" onclick="Pages.channel.sortVideos('views',this)">Most Viewed</button>
            <button class="sort-btn" onclick="Pages.channel.sortVideos('date',this)">Latest</button>
            <button class="sort-btn" onclick="Pages.channel.sortVideos('engagement',this)">Engagement</button>
          </div>
        </div>
        <div class="video-grid" id="ch-vgrid">${sorted.map((v,i)=>UI.videoCard(v,i+1)).join('')}</div>`;
      Pages.channel.renderTab('ch-analysis');
      Pages.channel.renderTab('ch-ideas');
      Pages.channel.renderTab('ch-seo');
    } catch(e) {
      $('ch-videos').innerHTML = `<div class="error-box">⚠️ ${RankIQ.esc(e.message)}</div>`;
    }
  },

  sortVideos: (by, btn) => {
    const videos = [...Pages.channel.currentVideos];
    $$('.sort-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if (by==='views') videos.sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
    else if (by==='date') videos.sort((a,b)=>new Date(b.snippet.publishedAt)-new Date(a.snippet.publishedAt));
    else if (by==='engagement') videos.sort((a,b)=>parseFloat(RankIQ.scoreVideo(b).engagementRate)-parseFloat(RankIQ.scoreVideo(a).engagementRate));
    $('ch-vgrid').innerHTML = videos.map((v,i)=>UI.videoCard(v,i+1)).join('');
  },

  renderTab: (tabId) => {
    const ch = Pages.channel.currentChannel;
    const videos = Pages.channel.currentVideos;
    if (!ch) return;

    if (tabId === 'ch-analysis' && $('ch-analysis').innerHTML.trim()==='') {
      const s = ch.statistics;
      const sub = parseInt(s.subscriberCount)||0, views = parseInt(s.viewCount)||0, vids = parseInt(s.videoCount)||1;
      const yrs = Math.max(1,(Date.now()-new Date(ch.snippet.publishedAt))/31536000000);
      const vpy = Math.round(vids/yrs);
      const avg = Math.round(views/vids);
      const rev = RankIQ.estimateRevenue(views);

      let topVideoHtml = '';
      if (videos.length) {
        const sorted = [...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
        topVideoHtml = sorted.slice(0,3).map((v,i)=>`
          <div class="top-vid-row" onclick="window.open('https://youtube.com/watch?v=${v.id}','_blank')">
            <img src="${RankIQ.esc(v.snippet.thumbnails?.default?.url||'')}" class="tvr-thumb">
            <div class="tvr-info">
              <div class="tvr-title">${RankIQ.esc(v.snippet.title.substring(0,60))}${v.snippet.title.length>60?'...':''}</div>
              <div class="tvr-meta">👁 <strong>${RankIQ.fmt(v.statistics?.viewCount)}</strong> · 👍 ${RankIQ.fmt(v.statistics?.likeCount)} · ${RankIQ.ago(v.snippet.publishedAt)}</div>
            </div>
            <span style="color:${i===0?'var(--gold)':i===1?'#aaa':'#cd7f32'};font-size:24px;flex-shrink:0">#${i+1}</span>
          </div>`).join('');
      }

      $('ch-analysis').innerHTML = `
        <div class="analysis-grid">
          <div class="analysis-card">
            <div class="ac-title">📊 Key Metrics</div>
            <div class="metric-list">
              <div class="ml-row"><span>Views per subscriber</span><strong>${sub>0?(views/sub).toFixed(1)+'x':'N/A'}</strong></div>
              <div class="ml-row"><span>Videos per year</span><strong>${vpy}</strong></div>
              <div class="ml-row"><span>Avg views per video</span><strong>${RankIQ.fmt(avg)}</strong></div>
              <div class="ml-row"><span>Channel age</span><strong>${yrs.toFixed(1)} years</strong></div>
              <div class="ml-row"><span>Est. revenue (total)</span><strong style="color:var(--green)">${rev.display}</strong></div>
              <div class="ml-row"><span>Revenue per video</span><strong>${fmtRevenue(Math.round(avg/1000*2.5))}</strong></div>
            </div>
          </div>
          <div class="analysis-card">
            <div class="ac-title">🏆 Top 3 Videos</div>
            <div>${topVideoHtml || UI.loading('Loading...')}</div>
          </div>
          <div class="analysis-card ac-wide">
            <div class="ac-title">💡 Growth Opportunities</div>
            <div class="opp-grid">
              <div class="opp-item"><div class="oi-icon">📱</div><div class="oi-title">YouTube Shorts</div><div class="oi-desc">Post 45-60sec clips from your best videos. Shorts drive 40-60% faster channel growth.</div></div>
              <div class="opp-item"><div class="oi-icon">🌍</div><div class="oi-title">Multi-Language</div><div class="oi-desc">Urdu/Hindi content is underserved. 1.5B speakers with almost no top kids channels.</div></div>
              <div class="opp-item"><div class="oi-icon">📋</div><div class="oi-title">Playlists</div><div class="oi-desc">Group videos into playlists. YouTube recommends playlist videos together — free watch time.</div></div>
              <div class="opp-item"><div class="oi-icon">🏷️</div><div class="oi-title">SEO Gaps</div><div class="oi-desc">Optimize titles and descriptions. Most small channels are leaving 30-40% organic traffic on the table.</div></div>
            </div>
          </div>
        </div>`;
    }

    if (tabId === 'ch-ideas' && $('ch-ideas').innerHTML.trim()==='') {
      Pages.channel.renderIdeas();
    }

    if (tabId === 'ch-seo' && $('ch-seo').innerHTML.trim()==='') {
      Pages.channel.renderSEOPanel();
    }
  },

  renderIdeas: () => {
    const ch = Pages.channel.currentChannel;
    const videos = Pages.channel.currentVideos;
    const chName = ch.snippet.title;
    const sorted = [...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
    const topTitles = sorted.slice(0,3).map(v=>v.snippet.title.toLowerCase());
    const hasTopics = (keywords) => keywords.some(k => topTitles.some(t=>t.includes(k)));

    const ideas = [
      { e:'🔄', t:`${sorted[0]?.snippet?.title?.split('|')[0]?.trim()||'Top Video'} — Part 2`, w:`Your #1 video is a proven winner. A sequel will inherit its audience and rank alongside it.`, p:'high' },
      { e:'📱', t:`YouTube Short: Highlight clip from your best video`, w:`Shorts get shown to millions in feed. Cut 50 seconds from your top video and upload NOW.`, p:'high' },
      !hasTopics(['animal','sound']) ? { e:'🐘', t:`Animal Sounds Song for Kids`, w:`Billions of views. Cow, Dog, Cat, Lion — the most-searched kids content globally.`, p:'high' } : null,
      !hasTopics(['day','week']) ? { e:'📅', t:`Days of the Week Song`, w:`School curriculum. Teachers share these → built-in viral network. Evergreen forever.`, p:'high' } : null,
      { e:'🕌', t:`Eid Song for Kids — Eid Mubarak Children's Song`, w:`Seasonal viral potential. 220M Pakistanis + massive diaspora. Zero competition in English+Urdu.`, p:'high' },
      !hasTopics(['color','fruit']) ? { e:'🍎', t:`Colors with Fruits Song`, w:`Colors + Fruits = double search queries. Great visuals for toddlers.`, p:'med' } : null,
      { e:'🌦️', t:`Weather Song for Kids — Sunny, Rainy, Cloudy`, w:`Teachers use these in classrooms. One teacher sharing = 30 parents watching = viral.`, p:'med' },
      { e:'👨‍👩‍👧', t:`Family Members Song (Mama, Baba, Grandma, Grandpa)`, w:`Strong emotional content. Especially powerful in Urdu — almost no competition.`, p:'med' },
      { e:'🔢', t:`Numbers 1-20 Extended Song with Dance`, w:`Extend what you have. Longer video = more watch time = better ranking.`, p:'low' },
      { e:'🌙', t:`Bedtime Lullaby for Babies`, w:`Parents play on repeat at night. Insane watch hours. Quiet competition.`, p:'low' },
    ].filter(Boolean);

    $('ch-ideas').innerHTML = `
      <div class="ideas-banner">🧠 Smart suggestions based on <strong>${RankIQ.esc(chName)}</strong>'s actual top content — click any for full SEO package</div>
      <div class="ideas-grid">${ideas.map((idea,i)=>`
        <div class="idea-card" onclick="Pages.channel.openIdeaModal(${i})">
          <div class="ic-priority ${idea.p==='high'?'icp-high':idea.p==='med'?'icp-med':'icp-low'}">${idea.p==='high'?'🔥 High':'⭐ Good'}</div>
          <div class="ic-title">${idea.e} ${RankIQ.esc(idea.t)}</div>
          <div class="ic-why">${RankIQ.esc(idea.w)}</div>
          <div class="ic-cta">Get Full SEO Package →</div>
        </div>`).join('')}
      </div>`;
    window._chIdeas = ideas;
  },

  openIdeaModal: (i) => {
    const idea = window._chIdeas?.[i];
    if (!idea) return;
    const ch = Pages.channel.currentChannel;
    const seo = RankIQ.generateSEO(idea.t, ch.snippet.title, 'kids education');
    Modal.open(`
      <div class="seo-modal">
        <div class="sm-why"><strong>Why this works:</strong> ${RankIQ.esc(idea.why||idea.w)}</div>
        <div class="sm-section">
          <div class="sm-label">Recommended Titles</div>
          ${seo.titles.map((t,ti)=>`<div class="sm-copy-box ${ti===0?'sm-best':''}">
            ${ti===0?'<span class="best-badge">BEST</span>':''}
            <span>${RankIQ.esc(t)}</span>${UI.copyBtn(t)}
          </div>`).join('')}
        </div>
        <div class="sm-section">
          <div class="sm-label">SEO Description</div>
          <div class="sm-copy-box" style="position:relative">
            <pre class="sm-desc">${RankIQ.esc(seo.description)}</pre>
            ${UI.copyBtn(seo.description,'Copy All')}
          </div>
        </div>
        <div class="sm-section">
          <div class="sm-label">Tags (${seo.tags.length}) — click to copy</div>
          <div class="tag-cloud">${seo.tags.map(t=>`<span class="tag-pill" onclick="UI.copy(this,'${t.replace(/'/g,"\\'")}')">${RankIQ.esc(t)}</span>`).join('')}</div>
          ${UI.copyBtn(seo.tags.join(', '),'Copy All Tags')}
        </div>
      </div>`, { title: `🎬 ${idea.t}` });
  },

  renderSEOPanel: () => {
    const ch = Pages.channel.currentChannel;
    $('ch-seo').innerHTML = `
      <div class="seo-panel-wrap">
        <div class="seo-panel-intro">Quick SEO generator for <strong>${RankIQ.esc(ch.snippet.title)}</strong> — enter a topic to get optimized title, description, and tags</div>
        <div class="search-bar" style="margin-bottom:16px">
          <span class="sb-icon">✍️</span>
          <input id="quick-seo-input" class="sb-input" placeholder="Enter video topic (e.g. Body Parts Song, Animal Sounds...)..." onkeydown="if(event.key==='Enter') Pages.channel.quickSEO()">
          <button class="sb-btn" onclick="Pages.channel.quickSEO()">Generate →</button>
        </div>
        <div class="quick-row">
          ${['Body Parts Part 2','Animal Sounds Song','Days of the Week','Colors with Fruits','Eid Song for Kids'].map(t=>`<button class="q-chip" onclick="$('quick-seo-input').value='${t}';Pages.channel.quickSEO()">${t}</button>`).join('')}
        </div>
        <div id="quick-seo-output"></div>
      </div>`;
  },

  quickSEO: () => {
    const topic = ($('quick-seo-input')?.value||'').trim();
    if (!topic) return;
    const ch = Pages.channel.currentChannel;
    const seo = RankIQ.generateSEO(topic, ch.snippet.title, 'kids education');
    RankIQ.seoHistory.add({ topic, channelName: ch.snippet.title });
    $('quick-seo-output').innerHTML = renderSEOResult(seo, topic);
  },
};

Router.register('channel', Pages.channel.init);

// ════════════════════════════════════════════
//  KEYWORD RESEARCH
// ════════════════════════════════════════════
Pages.keywords = {
  init: () => {
    $('page-keywords').innerHTML = `<div class="page-inner">
      <div class="page-head"><h1 class="page-title">Keyword Research</h1>
        <p class="page-sub">Find high-opportunity keywords — see real search volume, competition, and top-ranking videos</p></div>
      <div class="search-bar-wrap">
        <div class="search-bar">
          <span class="sb-icon">🔍</span>
          <input id="global-search" class="sb-input" placeholder="Enter keyword or topic... (Ctrl+K)" onkeydown="if(event.key==='Enter') Pages.keywords.run()">
          <select id="kw-niche" class="sb-select">
            <option value="">Any Niche</option>
            <option value="kids education">Kids Education</option>
            <option value="nursery rhymes">Nursery Rhymes</option>
            <option value="gaming">Gaming</option>
            <option value="cooking">Cooking</option>
            <option value="fitness">Fitness</option>
            <option value="tech">Tech Reviews</option>
            <option value="vlog">Vlog / Lifestyle</option>
          </select>
          <button class="sb-btn" onclick="Pages.keywords.run()">Research →</button>
        </div>
        <div class="quick-row">
          <span class="qr-label">Popular:</span>
          ${['body parts song','animal sounds for kids','nursery rhymes','kids cooking','minecraft tutorial','workout for beginners'].map(k=>`<button class="q-chip" onclick="Pages.keywords.quickSearch('${k}')">${k}</button>`).join('')}
        </div>
      </div>
      <div id="kw-tracked-bar" style="margin-bottom:24px"></div>
      <div id="kw-results"></div>
    </div>`;
    Pages.keywords.renderTracked();
  },

  quickSearch: (kw) => {
    $('global-search').value = kw;
    Pages.keywords.run();
  },

  search: (kw) => {
    Router.go('keywords');
    $('global-search').value = kw;
    Pages.keywords.run();
  },

  renderTracked: () => {
    const kws = RankIQ.keywords.get();
    if (!kws.length) { $('kw-tracked-bar').innerHTML=''; return; }
    $('kw-tracked-bar').innerHTML = `<div class="tracked-kws">
      <span style="font-size:12px;color:var(--muted);margin-right:8px">📌 Tracked:</span>
      ${kws.map(k=>`<button class="kw-chip" onclick="Pages.keywords.quickSearch('${RankIQ.esc(k.kw)}')">${RankIQ.esc(k.kw)} <span onclick="event.stopPropagation();RankIQ.keywords.remove('${RankIQ.esc(k.kw)}');Pages.keywords.renderTracked()" style="color:var(--muted);margin-left:4px">✕</span></button>`).join('')}
    </div>`;
  },

  run: async () => {
    const q = ($('global-search')?.value||'').trim();
    const niche = $('kw-niche')?.value||'';
    if (!q) return;
    if (!RankIQ.hasKey()) { $('setup-modal').classList.add('visible'); return; }
    $('kw-results').innerHTML = UI.loading('Fetching real YouTube data for this keyword...');
    try {
      const data = await RankIQ.getKeywordStats(q, niche);
      const allVideos = data.stats;
      const diff = RankIQ.analyzeKeywordDifficulty(allVideos);
      const topViews = allVideos.map(v=>parseInt(v.statistics?.viewCount||0));
      const avgViews = Math.round(topViews.reduce((a,b)=>a+b,0)/(topViews.length||1));

      $('kw-results').innerHTML = `
        <!-- Keyword Overview -->
        <div class="kw-overview">
          <div class="kwo-main">
            <div class="kwo-keyword">"${RankIQ.esc(q)}"</div>
            <div class="kwo-meta">in ${niche||'all niches'} · ${allVideos.length} results analyzed</div>
            <button class="btn-ghost-sm" onclick="RankIQ.keywords.add('${RankIQ.esc(q)}','${RankIQ.esc(niche)}');Pages.keywords.renderTracked();Toast.show('Keyword tracked!','success')">📌 Track Keyword</button>
          </div>
          <div class="kwo-scores">
            <div class="kws-box">
              <div class="kws-label">Difficulty</div>
              <div class="kws-val" style="color:${diff.color}">${diff.difficulty}</div>
              ${UI.diffBadge(diff.difficulty)}
            </div>
            <div class="kws-box">
              <div class="kws-label">Opportunity</div>
              <div class="kws-val" style="color:var(--green)">${diff.opportunity}</div>
              <span style="color:var(--green);font-size:11px;font-weight:700">${diff.opportunity>70?'HIGH':'MEDIUM'}</span>
            </div>
            <div class="kws-box">
              <div class="kws-label">Avg Top Views</div>
              <div class="kws-val" style="color:var(--gold)">${RankIQ.fmt(avgViews)}</div>
            </div>
            <div class="kws-box">
              <div class="kws-label">Top Video</div>
              <div class="kws-val" style="color:var(--accent)">${RankIQ.fmt(Math.max(...topViews,0))}</div>
            </div>
          </div>
        </div>

        <!-- Score bar -->
        <div class="kw-diff-row">
          <span style="font-size:13px;color:var(--muted)">Difficulty</span>
          ${UI.diffBar(diff.difficulty)}
          <span style="font-size:13px;color:var(--muted);margin-left:16px">Opportunity</span>
          ${UI.diffBar(diff.opportunity)}
        </div>

        <!-- Related keyword ideas -->
        <div class="section-title" style="margin-top:28px">🔍 Related Keyword Ideas</div>
        <div class="kw-related">${Pages.keywords.getRelated(q).map(k=>`
          <div class="kwr-item" onclick="Pages.keywords.quickSearch('${RankIQ.esc(k)}')">
            <span class="kwr-icon">🔍</span>
            <span class="kwr-text">${RankIQ.esc(k)}</span>
            <span class="kwr-arrow">→</span>
          </div>`).join('')}
        </div>

        <!-- Tabs for video results -->
        <div class="tab-bar" style="margin-top:28px" id="kw-tabs">
          <button class="tab active" data-kwt="kw-top">🏆 Top Videos (by Views)</button>
          <button class="tab" data-kwt="kw-new">🆕 Latest Uploads</button>
          <button class="tab" data-kwt="kw-seo">✍️ SEO Tips</button>
        </div>
        <div id="kw-tab-content">
          <div id="kw-top" class="tab-panel active">
            <div class="video-grid">${allVideos.map((v,i)=>UI.videoCard(v,i+1)).join('')}</div>
          </div>
          <div id="kw-new" class="tab-panel">
            <div class="video-grid">${data.byDate.map(item=>{
              const vid = allVideos.find(v=>v.id===item.id.videoId)||{snippet:item.snippet,statistics:{},contentDetails:{}};
              return UI.videoCard(vid);
            }).join('')}</div>
          </div>
          <div id="kw-seo" class="tab-panel" id="kw-seo-panel">
            ${Pages.keywords.renderSEOTips(q, niche, allVideos)}
          </div>
        </div>`;

      // Tab switching
      $$('#kw-tabs .tab').forEach(btn => {
        btn.onclick = () => {
          $$('#kw-tabs .tab').forEach(b=>b.classList.remove('active'));
          $$('#kw-tab-content .tab-panel').forEach(p=>p.classList.remove('active'));
          btn.classList.add('active');
          $(btn.dataset.kwt).classList.add('active');
        };
      });

    } catch(e) {
      $('kw-results').innerHTML = `<div class="error-box">⚠️ ${RankIQ.esc(e.message)}</div>`;
    }
  },

  getRelated: (kw) => {
    const base = kw.toLowerCase();
    const suffixes = ['for kids','song','tutorial','how to','beginners','2024','best','easy'];
    const prefixes = ['best','top','how to','learn','easy','fun'];
    return [...new Set([
      ...suffixes.map(s=>`${base} ${s}`),
      ...prefixes.map(p=>`${p} ${base}`),
    ])].slice(0,12);
  },

  renderSEOTips: (keyword, niche, videos) => {
    const topTitles = videos.slice(0,5).map(v=>v.snippet.title);
    const allTags = [...new Set(videos.flatMap(v=>v.snippet.tags||[]))].slice(0,20);
    const seo = RankIQ.generateSEO(keyword, 'Your Channel', niche||'kids education', topTitles, allTags);
    return renderSEOResult(seo, keyword, true);
  },
};

Router.register('keywords', Pages.keywords.init);

// ════════════════════════════════════════════
//  SEO OPTIMIZER
// ════════════════════════════════════════════
Pages.seo = {
  init: () => {
    const hist = RankIQ.seoHistory.get();
    $('page-seo').innerHTML = `<div class="page-inner">
      <div class="page-head"><h1 class="page-title">SEO Optimizer</h1>
        <p class="page-sub">Generate optimized titles, descriptions, and tags from real trending YouTube data</p></div>
      <div class="seo-layout">
        <div class="seo-main">
          <div class="seo-form-card">
            <div class="form-row">
              <div class="form-group" style="flex:2">
                <label class="form-label">Video Topic</label>
                <input id="seo-topic" class="form-input" placeholder="e.g. Body Parts Song for Kids, Animal Sounds, How to Make Pizza..." onkeydown="if(event.key==='Enter') Pages.seo.run()">
              </div>
              <div class="form-group">
                <label class="form-label">Niche</label>
                <select id="seo-niche" class="form-input">
                  <option value="kids education">Kids Education</option>
                  <option value="nursery rhymes">Nursery Rhymes</option>
                  <option value="gaming">Gaming</option>
                  <option value="cooking">Cooking</option>
                  <option value="fitness">Fitness</option>
                  <option value="tech">Tech</option>
                  <option value="vlog">Vlog</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Channel Name</label>
                <input id="seo-channel-name" class="form-input" placeholder="Your Channel" value="${RankIQ.esc(RankIQ.store.get('my_channel_name','')||'')}">
              </div>
            </div>
            <div class="form-row" style="margin-top:10px">
              <div class="form-group" style="flex:2">
                <label class="form-label">Your Draft Title (optional — we'll improve it)</label>
                <input id="seo-draft" class="form-input" placeholder="Your current title idea...">
              </div>
              <div style="display:flex;align-items:flex-end">
                <button class="btn-primary" onclick="Pages.seo.run()" id="seo-run-btn" style="height:44px;padding:0 28px">Generate SEO →</button>
              </div>
            </div>
            <div class="quick-row" style="margin-top:12px">
              ${['Body Parts Song','Animal Sounds for Kids','Days of the Week','Eid Song for Kids','Colors with Fruits','Numbers 1-20'].map(t=>`<button class="q-chip" onclick="$('seo-topic').value='${t}';Pages.seo.run()">${t}</button>`).join('')}
            </div>
          </div>
          <div id="seo-loading" style="display:none">${UI.loading('Fetching trending data from YouTube...')}</div>
          <div id="seo-output"></div>
        </div>
        <div class="seo-sidebar">
          <div class="ss-panel">
            <div class="ss-title">📚 SEO History</div>
            <div id="seo-hist-list"></div>
          </div>
          <div class="ss-panel" style="margin-top:16px">
            <div class="ss-title">💡 Pro Tips</div>
            <div class="tip-list">
              <div class="tip-item">📌 Keep titles under 60 characters for full display in search</div>
              <div class="tip-item">🔥 Front-load your main keyword in the title</div>
              <div class="tip-item">📝 First 2-3 lines of description matter most for SEO</div>
              <div class="tip-item">🏷️ Use 15-30 tags — mix specific and broad terms</div>
              <div class="tip-item">🖼️ Custom thumbnails increase CTR by 30-50%</div>
              <div class="tip-item">💬 Reply to first 10 comments — boosts algorithm ranking</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    Pages.seo.renderHistory();
  },

  loadFromHistory: (entry) => {
    Router.go('seo');
    $('seo-topic').value = entry.topic || '';
    if (entry.channelName) $('seo-channel-name').value = entry.channelName;
    Pages.seo.run();
  },

  renderHistory: () => {
    const hist = RankIQ.seoHistory.get();
    const el = $('seo-hist-list');
    if (!el) return;
    el.innerHTML = hist.slice(0,8).map(h=>`
      <div class="sh-item" onclick="Pages.seo.loadFromHistory(${JSON.stringify(h).replace(/"/g,'&quot;')})">
        <div class="shi-topic">${RankIQ.esc(h.topic)}</div>
        <div class="shi-date">${RankIQ.fmtDate(h.savedAt)}</div>
      </div>`).join('') || '<div style="color:var(--muted);font-size:13px;padding:12px 0">No history yet</div>';
  },

  run: async () => {
    const topic = ($('seo-topic')?.value||'').trim();
    if (!topic) { Toast.show('Enter a video topic first!', 'error'); return; }
    const niche = $('seo-niche')?.value||'kids education';
    const chName = $('seo-channel-name')?.value||'Your Channel';
    const draft = $('seo-draft')?.value||'';

    RankIQ.store.set('my_channel_name', chName);

    $('seo-output').innerHTML = '';
    $('seo-loading').style.display = 'block';
    $('seo-run-btn').disabled = true;

    let trendTitles = [], trendTags = [], trendVideos = [];

    if (RankIQ.hasKey()) {
      try {
        const results = await RankIQ.searchVideos(topic + ' ' + niche, { order:'viewCount', maxResults:8 });
        trendVideos = results;
        trendTitles = results.map(v=>v.snippet.title);
        trendTags = [...new Set(results.flatMap(v=>v.snippet.tags||[]))].slice(0,20);
      } catch(e) { /* fallback to non-trending */ }
    }

    const seo = RankIQ.generateSEO(topic, chName, niche, trendTitles, trendTags);
    $('seo-loading').style.display = 'none';
    $('seo-run-btn').disabled = false;

    RankIQ.seoHistory.add({ topic, channelName: chName, niche });
    Pages.seo.renderHistory();

    $('seo-output').innerHTML = `
      ${trendVideos.length ? `
        <div class="trend-insight">
          <div class="ti-title">📊 Trending Videos for "${RankIQ.esc(topic)}" — Real YouTube Data</div>
          <div class="ti-videos">${trendVideos.slice(0,4).map(v=>`
            <div class="tiv-item" onclick="window.open('https://youtube.com/watch?v=${v.id}','_blank')">
              <img src="${RankIQ.esc(v.snippet.thumbnails?.default?.url||'')}" class="tiv-thumb">
              <div>
                <div class="tiv-title">${RankIQ.esc(v.snippet.title.substring(0,55))}${v.snippet.title.length>55?'...':''}</div>
                <div class="tiv-views">👁 ${RankIQ.fmt(v.statistics?.viewCount)} views</div>
              </div>
            </div>`).join('')}
          </div>
        </div>` : ''}
      ${renderSEOResult(seo, topic)}`;
  },
};

Router.register('seo', Pages.seo.init);

// ════════════════════════════════════════════
//  TRENDING
// ════════════════════════════════════════════
Pages.trending = {
  init: async () => {
    $('page-trending').innerHTML = `<div class="page-inner">
      <div class="page-head"><h1 class="page-title">Trending Now</h1>
        <p class="page-sub">Real-time trending videos from YouTube — by region and category</p></div>
      <div class="filter-row">
        <div class="filter-group">
          <label class="form-label">Region</label>
          <select id="tr-region" class="sb-select" onchange="Pages.trending.load()">
            <option value="US">🇺🇸 United States</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="PK">🇵🇰 Pakistan</option>
            <option value="IN">🇮🇳 India</option>
            <option value="CA">🇨🇦 Canada</option>
            <option value="AU">🇦🇺 Australia</option>
            <option value="DE">🇩🇪 Germany</option>
            <option value="FR">🇫🇷 France</option>
            <option value="JP">🇯🇵 Japan</option>
            <option value="BR">🇧🇷 Brazil</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="form-label">Category</label>
          <select id="tr-cat" class="sb-select" onchange="Pages.trending.load()">
            <option value="0">All Categories</option>
            <option value="10">🎵 Music</option>
            <option value="20">🎮 Gaming</option>
            <option value="22">👤 People & Blogs</option>
            <option value="23">😂 Comedy</option>
            <option value="24">🎬 Entertainment</option>
            <option value="25">📰 News & Politics</option>
            <option value="26">📚 Howto & Style</option>
            <option value="27">📖 Education</option>
            <option value="28">💻 Science & Tech</option>
            <option value="17">⚽ Sports</option>
          </select>
        </div>
        <div style="display:flex;align-items:flex-end">
          <button class="btn-primary" onclick="Pages.trending.load()" style="height:44px">🔄 Refresh</button>
        </div>
      </div>
      <div id="trend-results"></div>
    </div>`;
    Pages.trending.load();
  },

  load: async () => {
    if (!RankIQ.hasKey()) { $('trend-results').innerHTML = UI.empty('🔑','API key required','Add your YouTube API key to see trending videos'); return; }
    const region = $('tr-region')?.value||'US';
    const cat = $('tr-cat')?.value||'0';
    $('trend-results').innerHTML = UI.loading('Fetching trending videos...');
    try {
      const videos = await RankIQ.getTrendingVideos(region, cat, 20);
      if (!videos.length) { $('trend-results').innerHTML = UI.empty('😕','No trending data','Try a different region or category'); return; }
      $('trend-results').innerHTML = `
        <div class="trending-header">
          <span>Showing top ${videos.length} trending videos</span>
          <span style="color:var(--muted);font-size:12px">Updated just now</span>
        </div>
        <div class="trending-list">${videos.map((v,i)=>{
          const score = RankIQ.scoreVideo(v);
          const rev = RankIQ.estimateRevenue(parseInt(v.statistics?.viewCount||0));
          return `<div class="tr-item">
            <div class="tri-rank">#${i+1}</div>
            <img src="${RankIQ.esc(v.snippet.thumbnails?.medium?.url||'')}" class="tri-thumb" onclick="window.open('https://youtube.com/watch?v=${v.id}','_blank')" style="cursor:pointer">
            <div class="tri-info">
              <div class="tri-title" onclick="window.open('https://youtube.com/watch?v=${v.id}','_blank')">${RankIQ.esc(v.snippet.title.substring(0,80))}${v.snippet.title.length>80?'...':''}</div>
              <div class="tri-channel">${RankIQ.esc(v.snippet.channelTitle)} · ${RankIQ.ago(v.snippet.publishedAt)}</div>
              <div class="tri-tags">${(v.snippet.tags||[]).slice(0,4).map(t=>UI.tag(t)).join('')}</div>
            </div>
            <div class="tri-stats">
              <div class="tris-row">👁 <strong>${RankIQ.fmt(v.statistics?.viewCount)}</strong></div>
              <div class="tris-row">👍 ${RankIQ.fmt(v.statistics?.likeCount)}</div>
              <div class="tris-row">💰 ${rev.display}</div>
              <div class="tris-row">⚡ ${score.engagementRate}%</div>
            </div>
            <div class="tri-actions">
              ${UI.gradeBadge(score.grade)}
              <button class="btn-ghost-sm" style="margin-top:8px" onclick="Pages.seo.loadFromHistory({topic:'${RankIQ.esc(v.snippet.title.split('|')[0].trim().substring(0,40))}',channelName:''});Router.go('seo')">✍️ SEO</button>
            </div>
          </div>`;
        }).join('')}`;
    } catch(e) {
      $('trend-results').innerHTML = `<div class="error-box">⚠️ ${RankIQ.esc(e.message)}</div>`;
    }
  },
};

Router.register('trending', Pages.trending.init);

// ════════════════════════════════════════════
//  COMPARE
// ════════════════════════════════════════════
Pages.compare = {
  ch: [null, null],

  init: () => {
    $('page-compare').innerHTML = `<div class="page-inner">
      <div class="page-head"><h1 class="page-title">Competitor Compare</h1>
        <p class="page-sub">Side-by-side analysis of any two YouTube channels — find who wins, where, and why</p></div>
      <div class="compare-layout">
        ${[1,2].map(n=>`
          <div class="cmp-input-box" id="cmp-box-${n}">
            <div class="cib-label">Channel ${n}</div>
            <div class="search-bar">
              <input id="cmp-input-${n}" class="sb-input" placeholder="Channel name or URL..." onkeydown="if(event.key==='Enter') Pages.compare.findChannel(${n})">
              <button class="sb-btn" onclick="Pages.compare.findChannel(${n})">Find</button>
            </div>
            <div id="cmp-result-${n}" class="cmp-found-ch"></div>
          </div>`).join('')}
      </div>
      <button id="cmp-run-btn" class="btn-primary" onclick="Pages.compare.run()" disabled style="width:100%;justify-content:center;margin:20px 0">⚔️ Compare Channels</button>
      <div id="cmp-output"></div>
    </div>`;
  },

  setChannel: (n, ch) => {
    Pages.compare.ch[n-1] = ch;
    $(`cmp-input-${n}`).value = ch.snippet.title;
    $(`cmp-result-${n}`).innerHTML = UI.channelMini(ch);
    if (Pages.compare.ch[0] && Pages.compare.ch[1]) $('cmp-run-btn').disabled = false;
  },

  findChannel: async (n) => {
    const q = ($(`cmp-input-${n}`)?.value||'').trim();
    if (!q) return;
    $(`cmp-result-${n}`).innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px">Searching...</div>';
    try {
      const channels = await RankIQ.searchChannels(q, 1);
      if (!channels.length) throw new Error('Not found');
      const ch = channels[0];
      Pages.compare.ch[n-1] = ch;
      $(`cmp-result-${n}`).innerHTML = UI.channelMini(ch);
      if (Pages.compare.ch[0] && Pages.compare.ch[1]) $('cmp-run-btn').disabled = false;
    } catch(e) {
      $(`cmp-result-${n}`).innerHTML = `<div style="color:var(--red);font-size:13px;padding:8px">⚠️ ${e.message}</div>`;
    }
  },

  run: async () => {
    const [ch1, ch2] = Pages.compare.ch;
    if (!ch1 || !ch2) return;
    $('cmp-output').innerHTML = UI.loading('Fetching data for both channels...');
    $('cmp-run-btn').disabled = true;
    try {
      const [v1, v2] = await Promise.all([Pages.compare.getStats(ch1.id), Pages.compare.getStats(ch2.id)]);
      Pages.compare.render(ch1, ch2, v1, v2);
    } catch(e) {
      $('cmp-output').innerHTML = `<div class="error-box">⚠️ ${RankIQ.esc(e.message)}</div>`;
    }
    $('cmp-run-btn').disabled = false;
  },

  getStats: async (chId) => {
    try {
      const upId = await (async()=>{ const d=await RankIQ.ytFetch('/channels',{part:'contentDetails',id:chId}); return d.items[0]?.contentDetails?.relatedPlaylists?.uploads; })();
      const pl = await RankIQ.ytFetch('/playlistItems',{part:'contentDetails',playlistId:upId,maxResults:15});
      const ids = pl.items.map(i=>i.contentDetails.videoId).join(',');
      const vd = await RankIQ.ytFetch('/videos',{part:'statistics,snippet,contentDetails',id:ids});
      const videos = vd.items;
      const views = videos.map(v=>parseInt(v.statistics?.viewCount||0));
      const likes = videos.map(v=>parseInt(v.statistics?.likeCount||0));
      const dates = videos.map(v=>new Date(v.snippet.publishedAt)).sort((a,b)=>b-a);
      let freq = 0;
      if (dates.length>1) { const sp=[]; for(let i=0;i<dates.length-1;i++) sp.push((dates[i]-dates[i+1])/86400000); freq=Math.round(sp.reduce((a,b)=>a+b,0)/sp.length); }
      return {
        avgV: Math.round(views.reduce((a,b)=>a+b,0)/(views.length||1)),
        maxV: Math.max(...views,0),
        avgL: Math.round(likes.reduce((a,b)=>a+b,0)/(likes.length||1)),
        freq, videos,
      };
    } catch { return { avgV:0, maxV:0, avgL:0, freq:0, videos:[] }; }
  },

  render: (ch1, ch2, v1, v2) => {
    const s1=ch1.statistics, s2=ch2.statistics;
    const sc1=RankIQ.scoreChannel(ch1), sc2=RankIQ.scoreChannel(ch2);
    const w1=sc1.overall>=sc2.overall?ch1.snippet.title:ch2.snippet.title;
    function cmp(a,b,inv=false){ return (inv?a<b:a>b)?['win','lose']:['lose','win']; }
    const rows = [
      ['👥 Subscribers', RankIQ.fmt(s1.subscriberCount), RankIQ.fmt(s2.subscriberCount), ...cmp(parseInt(s1.subscriberCount),parseInt(s2.subscriberCount))],
      ['👁 Total Views', RankIQ.fmt(s1.viewCount), RankIQ.fmt(s2.viewCount), ...cmp(parseInt(s1.viewCount),parseInt(s2.viewCount))],
      ['🎬 Total Videos', RankIQ.fmt(s1.videoCount), RankIQ.fmt(s2.videoCount), ...cmp(parseInt(s1.videoCount),parseInt(s2.videoCount))],
      ['📊 Avg Views/Video', RankIQ.fmt(v1.avgV), RankIQ.fmt(v2.avgV), ...cmp(v1.avgV,v2.avgV)],
      ['🔥 Top Video', RankIQ.fmt(v1.maxV), RankIQ.fmt(v2.maxV), ...cmp(v1.maxV,v2.maxV)],
      ['👍 Avg Likes/Video', RankIQ.fmt(v1.avgL), RankIQ.fmt(v2.avgL), ...cmp(v1.avgL,v2.avgL)],
      ['🏆 Channel Score', sc1.overall, sc2.overall, ...cmp(sc1.overall,sc2.overall)],
      ['⏱ Upload Frequency', v1.freq?`Every ${v1.freq}d`:'?', v2.freq?`Every ${v2.freq}d`:'?', ...cmp(v1.freq,v2.freq,true)],
      ['📅 Channel Age', new Date(ch1.snippet.publishedAt).getFullYear()+'', new Date(ch2.snippet.publishedAt).getFullYear()+'', ...cmp(new Date(ch1.snippet.publishedAt).getFullYear(),new Date(ch2.snippet.publishedAt).getFullYear(),true)],
    ];
    const wins1=rows.filter(r=>r[3]==='win').length, wins2=rows.filter(r=>r[4]==='win').length;

    $('cmp-output').innerHTML = `
      <div class="cmp-header-bar">
        <div class="chb-ch">${UI.channelMini(ch1)}
          <div class="chb-score">${UI.scoreRing(sc1.overall,80,sc1.overall>=sc2.overall?'var(--green)':'var(--muted)')}</div>
        </div>
        <div class="chb-vs">
          <div style="font-size:36px;font-weight:900;color:var(--accent)">VS</div>
          <div style="font-size:12px;color:var(--muted)">${wins1}–${wins2}</div>
          <div class="chb-winner">🏆 ${RankIQ.esc(w1)}</div>
        </div>
        <div class="chb-ch">${UI.channelMini(ch2)}
          <div class="chb-score">${UI.scoreRing(sc2.overall,80,sc2.overall>=sc1.overall?'var(--green)':'var(--muted)')}</div>
        </div>
      </div>
      <div style="overflow-x:auto;border-radius:16px;border:1px solid var(--border);margin-top:20px">
        <table class="cmp-table">
          <thead><tr>
            <th>Metric</th>
            <th class="${wins1>wins2?'th-win':''}">${RankIQ.esc(ch1.snippet.title.substring(0,25))} ${wins1>wins2?'🏆':''}</th>
            <th class="${wins2>wins1?'th-win':''}">${RankIQ.esc(ch2.snippet.title.substring(0,25))} ${wins2>wins1?'🏆':''}</th>
          </tr></thead>
          <tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="${r[3]}">${r[1]}</td><td class="${r[4]}">${r[2]}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="cmp-insights">
        <div class="ci-card"><div class="ci-title" style="color:var(--gold)">🏆 Winner Analysis</div>
          <p><strong style="color:var(--green)">${RankIQ.esc(w1)}</strong> wins ${Math.max(wins1,wins2)} out of ${rows.length} categories. Stronger overall channel performance.</p></div>
        <div class="ci-card"><div class="ci-title" style="color:var(--accent)">💡 How to Beat Both</div>
          <p>Focus on Urdu/local language content — neither channel serves that audience. Combine winner's upload frequency with better SEO to dominate your niche.</p></div>
      </div>`;
  },
};

Router.register('compare', Pages.compare.init);

// ════════════════════════════════════════════
//  SAVED / LIBRARY
// ════════════════════════════════════════════
Pages.saved = {
  init: () => {
    $('page-saved').innerHTML = `<div class="page-inner">
      <div class="page-head"><h1 class="page-title">Your Library</h1>
        <p class="page-sub">All your saved channels, keywords, SEO history, and notes — stored locally in your browser forever</p></div>
      <div class="tab-bar" id="saved-tabs">
        <button class="tab active" data-st="sv-channels">📌 Channels (${RankIQ.savedChannels.get().length})</button>
        <button class="tab" data-st="sv-keywords">🔑 Keywords (${RankIQ.keywords.get().length})</button>
        <button class="tab" data-st="sv-seo">✍️ SEO History (${RankIQ.seoHistory.get().length})</button>
        <button class="tab" data-st="sv-notes">📝 Notes (${RankIQ.notes.get().length})</button>
      </div>
      <div id="saved-tab-content">
        <div id="sv-channels" class="tab-panel active"></div>
        <div id="sv-keywords" class="tab-panel"></div>
        <div id="sv-seo" class="tab-panel"></div>
        <div id="sv-notes" class="tab-panel">
          <div class="note-add">
            <textarea id="note-input" class="form-input" style="min-height:80px;resize:vertical" placeholder="Write strategy notes, ideas, observations..."></textarea>
            <div style="display:flex;gap:8px;margin-top:8px">
              <input id="note-tag" class="form-input" style="max-width:150px" placeholder="Tag (optional)">
              <button class="btn-primary" onclick="Pages.saved.addNote()">Add Note</button>
            </div>
          </div>
          <div id="note-list" style="margin-top:16px"></div>
        </div>
      </div>
      <div style="margin-top:40px;padding:16px;background:rgba(239,71,111,0.06);border:1px solid rgba(239,71,111,0.15);border-radius:12px;display:flex;align-items:center;gap:12px">
        <button onclick="Pages.saved.clearAll()" class="btn-danger">🗑 Clear All Data</button>
        <span style="font-size:13px;color:var(--muted)">Removes all tracked channels, keywords, SEO history, and notes</span>
      </div>
    </div>`;

    $$('#saved-tabs .tab').forEach(btn => {
      btn.onclick = () => {
        $$('#saved-tabs .tab').forEach(b=>b.classList.remove('active'));
        $$('#saved-tab-content .tab-panel').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active');
        $(btn.dataset.st).classList.add('active');
        Pages.saved.renderTab(btn.dataset.st);
      };
    });
    Pages.saved.renderTab('sv-channels');
  },

  renderTab: (id) => {
    if (id==='sv-channels') {
      const list = RankIQ.savedChannels.get();
      $('sv-channels').innerHTML = list.length ? `<div class="saved-list">${list.map(c=>`
        <div class="sl-item">
          <img src="${RankIQ.esc(c.thumb)}" class="sl-img">
          <div class="sl-info">
            <div class="sl-title">${RankIQ.esc(c.title)}</div>
            <div class="sl-meta">👥 ${RankIQ.fmt(c.subs)} · Saved ${RankIQ.ago(c.savedAt)}</div>
          </div>
          <button class="btn-ghost-sm" onclick="Pages.channel.loadById('${c.id}')">Analyze →</button>
          <button class="del-btn" onclick="RankIQ.savedChannels.remove('${c.id}');Pages.saved.renderTab('sv-channels')">✕</button>
        </div>`).join('')}</div>`
        : UI.empty('📌','No channels tracked yet','Search a channel and click "+ Track Channel"');
    }
    if (id==='sv-keywords') {
      const list = RankIQ.keywords.get();
      $('sv-keywords').innerHTML = list.length ? `<div class="saved-list">${list.map(k=>`
        <div class="sl-item">
          <div class="kw-icon">🔍</div>
          <div class="sl-info">
            <div class="sl-title">${RankIQ.esc(k.kw)}</div>
            <div class="sl-meta">${k.niche||'General'} · Added ${RankIQ.ago(k.addedAt)}</div>
          </div>
          <button class="btn-ghost-sm" onclick="Pages.keywords.search('${RankIQ.esc(k.kw)}')">Research →</button>
          <button class="del-btn" onclick="RankIQ.keywords.remove('${RankIQ.esc(k.kw)}');Pages.saved.renderTab('sv-keywords')">✕</button>
        </div>`).join('')}</div>`
        : UI.empty('🔑','No keywords tracked yet','Use Keyword Research to track keywords');
    }
    if (id==='sv-seo') {
      const list = RankIQ.seoHistory.get();
      $('sv-seo').innerHTML = list.length ? `<div class="saved-list">${list.map(s=>`
        <div class="sl-item">
          <div class="kw-icon">✍️</div>
          <div class="sl-info">
            <div class="sl-title">${RankIQ.esc(s.topic)}</div>
            <div class="sl-meta">${RankIQ.esc(s.channelName||'')} · ${RankIQ.fmtDate(s.savedAt)}</div>
          </div>
          <button class="btn-ghost-sm" onclick="Pages.seo.loadFromHistory(${JSON.stringify(s).replace(/"/g,'&quot;')});Router.go('seo')">Regenerate →</button>
        </div>`).join('')}</div>`
        : UI.empty('✍️','No SEO reports yet','Use the SEO Optimizer to generate titles and tags');
    }
    if (id==='sv-notes') Pages.saved.renderNotes();
  },

  renderNotes: () => {
    const list = RankIQ.notes.get();
    $('note-list').innerHTML = list.length ? list.map(n=>`
      <div class="note-item">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="ni-text">${RankIQ.esc(n.text).replace(/\n/g,'<br>')}</div>
          <button class="del-btn" onclick="RankIQ.notes.remove('${n.id}');Pages.saved.renderNotes()">✕</button>
        </div>
        <div class="ni-meta">${n.tag?`<span style="color:var(--accent3)">#${RankIQ.esc(n.tag)}</span> · `:''} ${RankIQ.fmtDate(n.createdAt)}</div>
      </div>`).join('')
      : UI.empty('📝','No notes yet','Write strategy notes, video ideas, and observations here');
  },

  addNote: () => {
    const text = ($('note-input')?.value||'').trim();
    const tag = $('note-tag')?.value||'';
    if (!text) return;
    RankIQ.notes.add(text, tag);
    $('note-input').value = '';
    Pages.saved.renderNotes();
    Toast.show('Note saved!', 'success');
  },

  clearAll: () => {
    if (!confirm('Clear ALL saved data? This cannot be undone.')) return;
    ['saved_channels','keywords','seo_history','notes'].forEach(k=>RankIQ.store.del(k));
    Pages.saved.init();
    Toast.show('All data cleared', 'info');
  },
};

Router.register('saved', Pages.saved.init);

// ════════════════════════════════════════════
//  SHARED: SEO Result Renderer
// ════════════════════════════════════════════
function renderSEOResult(seo, topic, compact=false) {
  return `<div class="seo-result">
    <div class="seo-section">
      <div class="seo-sec-title">🏆 Recommended Titles <span style="font-size:12px;color:var(--muted);font-weight:400">(pick the best one)</span></div>
      ${seo.titles.map((t,i)=>`
        <div class="seo-copy-row ${i===0?'scr-best':''}">
          ${i===0?'<span class="best-badge">BEST</span>':''}
          <span class="scr-text">${RankIQ.esc(t)}</span>
          ${UI.copyBtn(t)}
        </div>`).join('')}
    </div>
    <div class="seo-section">
      <div class="seo-sec-title">📝 SEO-Optimized Description ${UI.copyBtn(seo.description,'Copy All')}</div>
      <div class="seo-desc-box"><pre>${RankIQ.esc(seo.description)}</pre></div>
    </div>
    <div class="seo-section">
      <div class="seo-sec-title">🏷️ Tags (${seo.tags.length}) ${UI.copyBtn(seo.tags.join(', '),'Copy All Tags')}</div>
      <div class="tag-cloud">${seo.tags.map((t,i)=>`<span class="tag-pill ${i<5?'tag-hot':''}" onclick="UI.copy(this,'${t.replace(/'/g,"\\'")}' )">${RankIQ.esc(t)}${i<5?'<span class="hot-dot">●</span>':''}</span>`).join('')}</div>
    </div>
  </div>`;
}
