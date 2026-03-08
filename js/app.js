// ============================================================
//   TubeIntel v3.0
//   - Fully English UI
//   - Generic "My Channel" (any channel URL/name)
//   - SEO Optimizer with trending data from YouTube
//   - localStorage data persistence & self-learning
//   - Smart next-video suggestions based on saved data
// ============================================================

const YT = 'https://www.googleapis.com/youtube/v3';
let API_KEY = localStorage.getItem('ti_apikey') || '';
let compareData = { ch1: null, ch2: null };
let currentChannel = null;
let myChannelData = null;
let myChannelVideos = [];

// ============================================================
//  INIT
// ============================================================
window.onload = () => {
  if (API_KEY) { hideEl('setupModal'); showFlex('apiStatus'); }
  loadSavedChannelBtns();
  loadSavedPage();
  loadSeoHistory();
};

// ============================================================
//  UTILITIES
// ============================================================
const $ = id => document.getElementById(id);
function showEl(id)       { const e=$( id); if(e) e.style.display='block'; }
function showFlex(id)     { const e=$(id); if(e) e.style.display='flex'; }
function hideEl(id)       { const e=$(id); if(e) e.style.display='none'; }
function setHtml(id, h)   { const e=$(id); if(e) e.innerHTML=h; }

function fmt(n) {
  n = parseInt(n)||0;
  if(n>=1e9) return (n/1e9).toFixed(2)+'B';
  if(n>=1e6) return (n/1e6).toFixed(2)+'M';
  if(n>=1e3) return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString();
}
function fmtFull(n) { return (parseInt(n)||0).toLocaleString(); }
function fmtDur(iso) {
  if(!iso) return '';
  const m=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if(!m) return '0:00';
  const h=+(m[1]||0), mi=+(m[2]||0), s=+(m[3]||0);
  return h ? `${h}:${String(mi).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${mi}:${String(s).padStart(2,'0')}`;
}
function ago(iso) {
  const d=Math.floor((Date.now()-new Date(iso))/86400000);
  if(d===0) return 'Today'; if(d===1) return 'Yesterday';
  if(d<7) return `${d}d ago`; if(d<30) return `${Math.floor(d/7)}w ago`;
  if(d<365) return `${Math.floor(d/30)}mo ago`; return `${Math.floor(d/365)}y ago`;
}
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

// ============================================================
//  TOAST
// ============================================================
function toast(msg, type='info') {
  let t = $('_toast');
  if(!t) {
    t=document.createElement('div'); t.id='_toast'; document.body.appendChild(t);
    t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;transition:opacity 0.4s;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,0.5)';
  }
  const c={success:'#06D6A0',error:'#EF476F',info:'#2B86C5'};
  t.style.background=c[type]||c.info; t.style.color='#fff'; t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t); t._t=setTimeout(()=>t.style.opacity='0', 3500);
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(()=>{
    const old = btn.textContent; btn.textContent='✓ Copied!'; btn.style.color='var(--green)';
    setTimeout(()=>{ btn.textContent=old; btn.style.color=''; }, 2000);
  });
}

// ============================================================
//  API KEY
// ============================================================
function saveApiKey() {
  const k=($('apiKeyInput').value||'').trim();
  if(!k.startsWith('AIza')||k.length<30){ toast('Invalid API key — must start with "AIza..."','error'); return; }
  API_KEY=k; localStorage.setItem('ti_apikey',k);
  hideEl('setupModal'); showFlex('apiStatus');
  toast('✅ API Key connected!','success');
}
function changeKey() { $('apiKeyInput').value=API_KEY; $('setupModal').style.display='flex'; }
function showGuide() { hideEl('setupModal'); $('guideModal').style.display='flex'; }
function closeGuide() { hideEl('guideModal'); $('setupModal').style.display='flex'; }
function requireKey() { if(!API_KEY){ $('setupModal').style.display='flex'; return false; } return true; }

// ============================================================
//  YOUTUBE API
// ============================================================
async function ytFetch(endpoint, params) {
  params.key = API_KEY;
  const res = await fetch(YT+endpoint+'?'+new URLSearchParams(params));
  const data = await res.json();
  if(data.error) {
    const r=data.error.errors?.[0]?.reason||'';
    if(r==='quotaExceeded') throw new Error('Daily API quota exceeded! Try again tomorrow.');
    if(r==='keyInvalid') throw new Error('Invalid API key! Please check your key in settings.');
    throw new Error(data.error.message);
  }
  return data;
}

async function getUploadsPlaylist(channelId) {
  const d=await ytFetch('/channels',{part:'contentDetails',id:channelId});
  return d.items[0]?.contentDetails?.relatedPlaylists?.uploads;
}

async function getVideosFromPlaylist(uploadsId, maxResults=24) {
  const pl=await ytFetch('/playlistItems',{part:'contentDetails',playlistId:uploadsId,maxResults});
  const ids=pl.items.map(i=>i.contentDetails.videoId).join(',');
  const vd=await ytFetch('/videos',{part:'snippet,statistics,contentDetails',id:ids});
  return vd.items;
}

// ============================================================
//  PAGE NAV
// ============================================================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  $('page-'+name).classList.add('active');
  const tab=document.querySelector(`[data-page="${name}"]`);
  if(tab) tab.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='saved') loadSavedPage();
}
function showInnerTab(name) {
  $('page-channel').querySelectorAll('.itab').forEach(t=>t.classList.remove('active'));
  $('page-channel').querySelectorAll('.inner-panel').forEach(p=>p.classList.remove('active'));
  $('itab-'+name).classList.add('active'); event.target.classList.add('active');
}
function showMyTab(name) {
  $('page-mychannel').querySelectorAll('.itab').forEach(t=>t.classList.remove('active'));
  $('page-mychannel').querySelectorAll('.inner-panel').forEach(p=>p.classList.remove('active'));
  $('mytab-'+name).classList.add('active'); event.target.classList.add('active');
}
function showSavedTab(name) {
  $('page-saved').querySelectorAll('.itab').forEach(t=>t.classList.remove('active'));
  $('page-saved').querySelectorAll('.inner-panel').forEach(p=>p.classList.remove('active'));
  $('savedtab-'+name).classList.add('active'); event.target.classList.add('active');
}

// ============================================================
//  SEARCH CHANNELS
// ============================================================
function quickSearch(n){ $('searchInput').value=n; searchChannels(); }

async function searchChannels() {
  if(!requireKey()) return;
  const q=($('searchInput').value||'').trim(); if(!q) return;
  $('searchResults').innerHTML=''; hideEl('searchError'); showEl('searchLoading');
  $('searchBtn').disabled=true;
  try {
    const sd=await ytFetch('/search',{part:'snippet',type:'channel',q,maxResults:8});
    if(!sd.items?.length) throw new Error('No channels found. Try a different name.');
    const ids=sd.items.map(i=>i.snippet.channelId).join(',');
    const cd=await ytFetch('/channels',{part:'snippet,statistics',id:ids});
    hideEl('searchLoading'); renderSearchResults(cd.items);
  } catch(err) {
    hideEl('searchLoading');
    $('searchError').textContent='⚠️ '+err.message; showEl('searchError');
  }
  $('searchBtn').disabled=false;
}

function renderSearchResults(channels) {
  const grid=$('searchResults'); grid.innerHTML='';
  channels.forEach((ch,i)=>{
    const s=ch.statistics, sn=ch.snippet, sub=parseInt(s.subscriberCount)||0;
    const badge=sub>10e6?'🏆 Mega':sub>1e6?'🌟 Large':sub>100e3?'📈 Growing':sub>10e3?'🌱 Small':'🐣 New';
    const thumb=sn.thumbnails?.medium?.url||sn.thumbnails?.default?.url||'';
    const card=document.createElement('div'); card.className='channel-card'; card.style.animationDelay=(i*0.07)+'s';
    card.innerHTML=`
      <div class="channel-card-top">
        <img class="ch-thumb" src="${esc(thumb)}" alt="" onerror="this.style.background='#333'">
        <div style="flex:1;min-width:0">
          <div class="ch-name">${esc(sn.title)}</div>
          <div class="ch-handle">${sn.customUrl?'@'+sn.customUrl:''}</div>
          <span class="size-badge">${badge}</span>
        </div>
      </div>
      <div class="ch-stats">
        <div class="ch-stat">👥 <span>${fmt(s.subscriberCount)}</span></div>
        <div class="ch-stat">👁️ <span>${fmt(s.viewCount)}</span> Views</div>
        <div class="ch-stat">🎬 <span>${fmt(s.videoCount)}</span> Videos</div>
      </div>
      <div class="ch-desc">${esc((sn.description||'No description').substring(0,120))}${(sn.description||'').length>120?'...':''}</div>
      <div class="card-action">Click to analyze →</div>`;
    card.onclick=()=>loadChannel(ch); grid.appendChild(card);
  });
}

// ============================================================
//  CHANNEL DETAIL
// ============================================================
async function loadChannel(ch) {
  currentChannel=ch; showPage('channel'); $('navChannel').style.display='flex';
  const sn=ch.snippet, s=ch.statistics;
  const sub=parseInt(s.subscriberCount)||0, views=parseInt(s.viewCount)||0, vids=parseInt(s.videoCount)||1;
  const avg=Math.round(views/vids), startY=new Date(sn.publishedAt).getFullYear();
  const yrs=Math.max(1,new Date().getFullYear()-startY);

  $('channelHeader').innerHTML=`
    <img src="${esc(sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'')}" alt="" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.1);flex-shrink:0">
    <div class="channel-hero-info" style="flex:1;min-width:0">
      <h2>${esc(sn.title)}</h2>
      <p>${esc((sn.description||'').substring(0,200))}${(sn.description||'').length>200?'...':''}</p>
      <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
        <a class="ch-link" href="https://youtube.com/channel/${ch.id}" target="_blank">▶ Open on YouTube</a>
        ${sn.customUrl?`<a class="ch-link" href="https://youtube.com/@${sn.customUrl}" target="_blank">@ Channel Link</a>`:''}
        <span style="color:var(--muted);font-size:12px">📅 Since ${startY} (${yrs} years active)</span>
      </div>
    </div>`;

  $('statsRow').innerHTML=`
    <div class="stat-box"><div class="s-icon">👥</div><div class="s-val">${fmt(sub)}</div><div class="s-full">${fmtFull(sub)}</div><div class="s-label">Subscribers</div></div>
    <div class="stat-box"><div class="s-icon">👁️</div><div class="s-val">${fmt(views)}</div><div class="s-full">${fmtFull(views)}</div><div class="s-label">Total Views</div></div>
    <div class="stat-box"><div class="s-icon">🎬</div><div class="s-val">${fmt(vids)}</div><div class="s-full">${fmtFull(vids)}</div><div class="s-label">Videos</div></div>
    <div class="stat-box"><div class="s-icon">📊</div><div class="s-val">${fmt(avg)}</div><div class="s-full">per video</div><div class="s-label">Avg Views</div></div>`;

  await loadChannelVideos(ch.id);
  renderInsights(ch);
  renderGrowthTips(ch);
}

async function loadChannelVideos(chId) {
  showEl('videoLoading'); $('videoGrid').innerHTML='';
  try {
    const upId=await getUploadsPlaylist(chId);
    if(!upId) throw new Error('Could not load videos');
    const videos=await getVideosFromPlaylist(upId, 24);
    hideEl('videoLoading');
    renderVideoGrid(videos,'videoGrid');
    renderIdeasForChannel(currentChannel, videos);
    renderInsightsWithVideos(currentChannel, videos);
  } catch(err) {
    hideEl('videoLoading');
    $('videoGrid').innerHTML=`<div class="error-box" style="display:block">⚠️ ${err.message}</div>`;
  }
}

function renderVideoGrid(videos, containerId) {
  const grid=$(containerId); if(!grid) return; grid.innerHTML='';
  const sorted=[...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
  sorted.forEach((v,i)=>{
    const sn=v.snippet, s=v.statistics;
    const thumb=sn.thumbnails?.medium?.url||sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'';
    const card=document.createElement('div'); card.className='video-card'; card.style.animationDelay=(i*0.04)+'s';
    card.innerHTML=`
      <div class="video-thumb-wrap">
        <img class="video-thumb" src="${esc(thumb)}" alt="" loading="lazy" onerror="this.style.background='#222'">
        <div class="video-duration">${fmtDur(v.contentDetails?.duration)}</div>
        ${i===0?'<div class="top-badge">🏆 #1</div>':''}
      </div>
      <div class="video-info">
        <div class="video-title">${esc(sn.title)}</div>
        <div class="video-meta">
          <div class="vmeta">👁️ <strong>${fmt(s?.viewCount)}</strong></div>
          <div class="vmeta">👍 <strong>${fmt(s?.likeCount)}</strong></div>
          ${parseInt(s?.commentCount||0)>0?`<div class="vmeta">💬 <strong>${fmt(s?.commentCount)}</strong></div>`:''}
          <div class="vmeta">🕐 ${ago(sn.publishedAt)}</div>
        </div>
        <div class="video-date">${fmtDate(sn.publishedAt)}</div>
      </div>`;
    card.onclick=()=>window.open(`https://youtube.com/watch?v=${v.id}`,'_blank');
    grid.appendChild(card);
  });
}

// ============================================================
//  INSIGHTS
// ============================================================
function renderInsights(ch) {
  const s=ch.statistics;
  const sub=parseInt(s.subscriberCount)||0, views=parseInt(s.viewCount)||0, vids=parseInt(s.videoCount)||1;
  const avg=Math.round(views/vids), vps=sub>0?(views/sub).toFixed(1):'?';
  const yrs=Math.max(1,new Date().getFullYear()-new Date(ch.snippet.publishedAt).getFullYear());
  const vpy=Math.round(vids/yrs);
  $('insightsPanel').innerHTML=`
    <div class="insight-card">
      <h3 style="color:var(--gold)">📊 Channel Statistics</h3>
      <ul>
        <li><div class="dot" style="background:var(--gold)"></div>Average views per video: <strong style="color:var(--gold)">${fmt(avg)}</strong></li>
        <li><div class="dot" style="background:var(--green)"></div>Views / Subscriber ratio: <strong style="color:var(--green)">${vps}x</strong></li>
        <li><div class="dot" style="background:var(--accent3)"></div>Videos uploaded per year: <strong style="color:var(--accent3)">${vpy}</strong></li>
        <li><div class="dot" style="background:var(--accent)"></div>Channel age: <strong style="color:var(--accent)">${yrs} year${yrs>1?'s':''}</strong> (since ${new Date(ch.snippet.publishedAt).getFullYear()})</li>
      </ul>
    </div>
    <div class="insight-card">
      <h3 style="color:var(--accent)">🎯 Performance Grade</h3>
      <ul>
        <li><div class="dot" style="background:${sub>10e6?'var(--green)':sub>1e6?'var(--gold)':'var(--muted)'}"></div>Size: <strong>${sub>10e6?'🏆 Mega (10M+)':sub>1e6?'🌟 Large (1M+)':sub>100e3?'📈 Medium (100K+)':sub>10e3?'🌱 Small (10K+)':'🐣 Starter'}</strong></li>
        <li><div class="dot" style="background:${avg>500e3?'var(--green)':avg>50e3?'var(--gold)':'var(--muted)'}"></div>Avg Engagement: <strong>${avg>500e3?'🔥 Viral':avg>50e3?'💪 Strong':avg>5e3?'📈 Good':'🌱 Growing'}</strong></li>
        <li><div class="dot" style="background:${vpy>100?'var(--green)':vpy>50?'var(--gold)':'var(--muted)'}"></div>Upload Consistency: <strong>${vpy>100?'🚀 Excellent':vpy>50?'✅ Good':vpy>20?'⚠️ Average':'❌ Irregular'}</strong></li>
        <li><div class="dot" style="background:var(--accent3)"></div>Views/Sub ratio: <strong>${parseFloat(vps)>50?'🔥 Excellent':parseFloat(vps)>20?'✅ Good':parseFloat(vps)>5?'⚠️ Average':'❌ Low'}</strong></li>
      </ul>
    </div>`;
}

function renderInsightsWithVideos(ch, videos) {
  if(!videos?.length) return;
  const sorted=[...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
  const top3=sorted.slice(0,3);
  const topHtml=top3.map((v,i)=>`
    <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://youtube.com/watch?v=${v.id}','_blank')">
      <img src="${esc(v.snippet.thumbnails?.default?.url||'')}" style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;line-height:1.3;margin-bottom:4px">${esc(v.snippet.title.substring(0,60))}${v.snippet.title.length>60?'...':''}</div>
        <div style="font-size:11px;color:var(--muted)">👁️ <strong style="color:var(--gold)">${fmt(v.statistics?.viewCount)}</strong> • ${ago(v.snippet.publishedAt)} • ${fmtDur(v.contentDetails?.duration)}</div>
      </div>
      <span style="flex-shrink:0;font-size:22px;color:${i===0?'var(--gold)':i===1?'#aaa':'#cd7f32'}">#${i+1}</span>
    </div>`).join('');
  $('insightsPanel').innerHTML+=`
    <div class="insight-card" style="grid-column:1/-1">
      <h3 style="color:var(--green)">🏆 Top Performing Videos</h3>
      ${topHtml}
      <div style="margin-top:12px;padding:12px;background:rgba(255,209,102,0.06);border-radius:10px;font-size:13px;color:#ccc">
        💡 Note these topics and formats — this is what's working on this channel. Replicate with your own angle!
      </div>
    </div>`;
}

function renderGrowthTips(ch) {
  const s=ch.statistics, sub=parseInt(s.subscriberCount)||0;
  $('growthPanel').innerHTML=`
    <div class="growth-card">
      <h3 style="color:var(--green)">💡 What You Can Learn From This Channel</h3>
      <ul>
        <li><div class="dot" style="background:var(--green)"></div>Study their upload frequency — match or beat it</li>
        <li><div class="dot" style="background:var(--green)"></div>Top 3 videos topics — create your version with your style</li>
        <li><div class="dot" style="background:var(--green)"></div>Thumbnail style — bright colors, big readable text, expressive faces</li>
        <li><div class="dot" style="background:var(--green)"></div>Title keywords — use the same words in your titles for search ranking</li>
        <li><div class="dot" style="background:var(--green)"></div>Description format — timestamps, hashtags, channel links</li>
      </ul>
    </div>
    <div class="growth-card">
      <h3 style="color:var(--accent)">🚀 Your Competitive Advantages</h3>
      <ul>
        <li><div class="dot" style="background:var(--accent)"></div>${sub>1e6?'Broad channel — you can dominate a tight niche they ignore':'Still growing — you can compete right now!'}</li>
        <li><div class="dot" style="background:var(--accent)"></div>Urdu/Hindi content — 1.5 billion people, barely covered by kids channels</li>
        <li><div class="dot" style="background:var(--accent)"></div>YouTube Shorts — if they have fewer Shorts, fill that gap immediately</li>
        <li><div class="dot" style="background:var(--accent)"></div>Local cultural content (Eid, local festivals) — zero competition</li>
        <li><div class="dot" style="background:var(--accent)"></div>Local parents trust local content — stronger connection = more views</li>
      </ul>
    </div>
    <div class="growth-card" style="grid-column:1/-1;background:linear-gradient(135deg,rgba(255,60,172,0.05),rgba(43,134,197,0.05));border-color:rgba(255,60,172,0.12)">
      <h3 style="color:var(--gold)">🎯 3 Immediate Actions After Analyzing This Channel</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:12px">
        <div style="background:var(--surface2);padding:14px;border-radius:12px"><div style="font-size:20px;margin-bottom:6px">1️⃣</div><div style="font-size:13px;font-weight:600;margin-bottom:4px">Copy Their Top Topic</div><div style="font-size:12px;color:var(--muted)">Make their most viral topic in your own style/language</div></div>
        <div style="background:var(--surface2);padding:14px;border-radius:12px"><div style="font-size:20px;margin-bottom:6px">2️⃣</div><div style="font-size:13px;font-weight:600;margin-bottom:4px">Use Their Title Formula</div><div style="font-size:12px;color:var(--muted)">Same keywords, adapted for your channel name</div></div>
        <div style="background:var(--surface2);padding:14px;border-radius:12px"><div style="font-size:20px;margin-bottom:6px">3️⃣</div><div style="font-size:13px;font-weight:600;margin-bottom:4px">Fill Their Content Gap</div><div style="font-size:12px;color:var(--muted)">Topics they haven't covered — be first in your language!</div></div>
      </div>
    </div>`;
}

// ============================================================
//  VIDEO IDEAS FOR ANY CHANNEL (based on their top content)
// ============================================================
function renderIdeasForChannel(ch, videos) {
  const sorted=[...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
  const topTitles=sorted.slice(0,5).map(v=>v.snippet.title);
  const topViews=sorted[0]?.statistics?.viewCount||0;

  // Extract keywords from top performing videos
  const keywords=topTitles.join(' ').toLowerCase()
    .replace(/[^a-z0-9 ]/g,' ').split(' ')
    .filter(w=>w.length>3 && !['with','this','that','from','your','their','have','kids','song','for','the'].includes(w));
  const uniqueKw=[...new Set(keywords)].slice(0,8);

  const ideas=[
    { emoji:'🔄', title:`${topTitles[0]?.split('|')[0]?.trim()} — Part 2`, why:`Your top video is at ${fmt(topViews)} views. A Part 2 sequel is guaranteed to perform well!`, priority:'high', tags:['sequel','part2','trending'] },
    { emoji:'📱', title:`YouTube Short: 45-sec highlight of your best video`, why:'Shorts drive discovery. Clip your top video and upload as a Short immediately.', priority:'high', tags:['shorts','quickwin','algorithm'] },
    { emoji:'🎵', title:`${uniqueKw[0]||'Learning'} Song — Extended Compilation`, why:'Compilations get 3-5x more watch time. Combine your best segments into a 10-min video.', priority:'high', tags:['compilation','watchtime'] },
    { emoji:'🌟', title:`Trending: ${uniqueKw[1]||'Educational'} for Toddlers`, why:'This keyword appears in your top videos. Make a dedicated video targeting this exact term.', priority:'med', tags:['trending','seo','keyword'] },
    { emoji:'🎯', title:`${uniqueKw[2]||'Kids'} + ${uniqueKw[3]||'Learning'} Mashup`, why:'Combine two of your proven topics into one video — double the search traffic potential.', priority:'med', tags:['mashup','crossover'] },
    { emoji:'🌍', title:`Same content in Urdu/Hindi version`, why:'If your videos are in English, making Urdu versions taps into 300M+ additional viewers.', priority:'med', tags:['urdu','hindi','multilingual'] },
    { emoji:'📅', title:`Days of the Week Song`, why:'School curriculum — teachers share these constantly. Built-in viral network!', priority:'med', tags:['school','curriculum','teachers'] },
    { emoji:'🐾', title:`Animal Sounds + ${uniqueKw[0]||'Learning'} Mashup`, why:'Animal content is evergreen with billions of views. Combine with your niche for unique content.', priority:'low', tags:['animals','evergreen'] },
  ];

  $('ideasPanel').innerHTML=`
    <div style="margin-bottom:16px;padding:14px 18px;background:rgba(255,209,102,0.06);border:1px solid rgba(255,209,102,0.15);border-radius:12px;font-size:13px;color:#ccc">
      💡 These ideas are generated based on <strong style="color:var(--gold)">${esc(ch.snippet.title)}</strong>'s actual top performing content. Click any idea to see full title, description & tags.
    </div>
    <div class="ideas-grid">
      ${ideas.map((idea,i)=>`
        <div class="idea-card" onclick="showIdeaDetail(${i}, '${esc(ch.snippet.title)}')">
          <div class="priority-chip ${idea.priority==='high'?'chip-high':idea.priority==='med'?'chip-med':'chip-low'}">${idea.priority==='high'?'🔥 High Priority':idea.priority==='med'?'⭐ Recommended':'✅ Good Idea'}</div>
          <h3>${idea.emoji} ${esc(idea.title)}</h3>
          <p>${esc(idea.why)}</p>
          <div class="idea-meta">${idea.tags.map(t=>`<span class="idea-tag">#${t}</span>`).join('')}<span class="idea-tag" style="color:var(--accent3)">Click for full SEO →</span></div>
        </div>`).join('')}
    </div>`;

  // Store ideas globally for modal
  window._currentIdeas = ideas;
  window._currentChName = ch.snippet.title;
}

function showIdeaDetail(idx, chName) {
  const idea = window._currentIdeas?.[idx];
  if(!idea) return;
  const niche = 'kids education';
  const fullDesc = generateDescription(idea.title, niche, chName);
  const fullTags = generateTags(idea.title, niche);

  $('ideaModalContent').innerHTML=`
    <div class="seo-field">
      <label>Suggested Title</label>
      <div class="seo-copy-box" style="position:relative">
        <strong style="color:var(--gold);font-size:15px">${esc(idea.title)}</strong>
        <button class="copy-btn" onclick="copyText('${esc(idea.title)}', this)">Copy</button>
      </div>
    </div>
    <div class="seo-field">
      <label>Why This Will Work</label>
      <div class="seo-copy-box">${esc(idea.why)}</div>
    </div>
    <div class="seo-field">
      <label>Suggested Description</label>
      <div class="seo-copy-box" style="position:relative">
        <pre style="white-space:pre-wrap;font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.7">${esc(fullDesc)}</pre>
        <button class="copy-btn" onclick="copyText(${JSON.stringify(fullDesc)}, this)">Copy</button>
      </div>
    </div>
    <div class="seo-field">
      <label>Recommended Tags</label>
      <div class="tag-cloud">${fullTags.map(t=>`<span class="tag-pill" onclick="copyText('${t}',this)">${t}</span>`).join('')}</div>
    </div>
    <button class="btn-primary" onclick="saveIdeaToStorage('${esc(idea.title)}', '${esc(chName)}')" style="margin-top:16px;width:100%;justify-content:center">💾 Save This Idea</button>`;

  $('ideaModal').style.display='flex';
}

function closeIdeaModal() { hideEl('ideaModal'); }

// ============================================================
//  SAVE CURRENT CHANNEL
// ============================================================
function saveCurrentChannel() {
  if(!currentChannel) return;
  const saved=JSON.parse(localStorage.getItem('ti_channels')||'[]');
  const exists=saved.find(c=>c.id===currentChannel.id);
  if(exists){ toast('Channel already saved!','info'); return; }
  saved.push({
    id: currentChannel.id,
    title: currentChannel.snippet.title,
    thumb: currentChannel.snippet.thumbnails?.default?.url||'',
    subs: currentChannel.statistics.subscriberCount,
    views: currentChannel.statistics.viewCount,
    savedAt: new Date().toISOString()
  });
  localStorage.setItem('ti_channels', JSON.stringify(saved));
  toast('✅ Channel saved!','success');
  loadSavedChannelBtns();
}

function saveMyChannel() {
  if(!myChannelData) return;
  const saved=JSON.parse(localStorage.getItem('ti_channels')||'[]');
  const exists=saved.find(c=>c.id===myChannelData.id);
  if(!exists) {
    saved.push({
      id: myChannelData.id,
      title: myChannelData.snippet.title,
      thumb: myChannelData.snippet.thumbnails?.default?.url||'',
      subs: myChannelData.statistics.subscriberCount,
      views: myChannelData.statistics.viewCount,
      savedAt: new Date().toISOString(),
      isMine: true
    });
    localStorage.setItem('ti_channels', JSON.stringify(saved));
  }
  toast('✅ Channel saved!','success');
  loadSavedChannelBtns();
}

function loadSavedChannelBtns() {
  const saved=JSON.parse(localStorage.getItem('ti_channels')||'[]');
  const el=$('savedChannelBtns'); if(!el) return;
  el.innerHTML=saved.slice(0,5).map(c=>`
    <button class="qbtn" onclick="quickLoadMyChannel('${esc(c.id)}','${esc(c.title)}')" style="display:flex;align-items:center;gap:6px">
      <img src="${esc(c.thumb)}" style="width:16px;height:16px;border-radius:50%;object-fit:cover"> ${esc(c.title.substring(0,20))}
    </button>`).join('');
}

function quickLoadMyChannel(id, title) {
  $('myChannelInput').value=title;
  loadMyChannel(id);
}

// ============================================================
//  MY CHANNEL — GENERIC
// ============================================================
async function loadMyChannel(channelId=null) {
  if(!requireKey()) return;
  const input=channelId||($('myChannelInput').value||'').trim();
  if(!input){ toast('Enter your channel URL or name!','error'); return; }
  toast('⏳ Loading channel data...','info');

  try {
    let chId=input;
    // Handle youtube.com/@handle URLs
    if(input.includes('youtube.com/@')) {
      const handle=input.split('@')[1].split(/[/?]/)[0];
      const sd=await ytFetch('/search',{part:'snippet',type:'channel',q:handle,maxResults:1});
      if(!sd.items?.length) throw new Error('Channel not found');
      chId=sd.items[0].snippet.channelId;
    } else if(input.includes('youtube.com/channel/')) {
      chId=input.split('/channel/')[1].split(/[/?]/)[0];
    } else if(!input.startsWith('UC')) {
      const sd=await ytFetch('/search',{part:'snippet',type:'channel',q:input,maxResults:1});
      if(!sd.items?.length) throw new Error('Channel not found. Try a different name.');
      chId=sd.items[0].snippet.channelId;
    }

    const cd=await ytFetch('/channels',{part:'snippet,statistics,contentDetails',id:chId});
    if(!cd.items?.length) throw new Error('Channel not found');
    const ch=cd.items[0]; myChannelData=ch;
    const s=ch.statistics;
    const sub=parseInt(s.subscriberCount)||0, views=parseInt(s.viewCount)||0, vids=parseInt(s.videoCount)||1;

    hideEl('mySetup'); showEl('myDash');

    // Channel hero
    const sn=ch.snippet;
    $('myChannelHero').innerHTML=`
      <img src="${esc(sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'')}" alt="" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.1);flex-shrink:0">
      <div style="flex:1;min-width:0">
        <h2 style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:6px">${esc(sn.title)}</h2>
        <p style="color:var(--muted);font-size:13px;line-height:1.5">${esc((sn.description||'').substring(0,150))}${(sn.description||'').length>150?'...':''}</p>
        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
          <a class="ch-link" href="https://youtube.com/channel/${ch.id}" target="_blank">▶ Open on YouTube</a>
          <span style="color:var(--muted);font-size:12px">Since ${new Date(sn.publishedAt).getFullYear()}</span>
        </div>
      </div>`;

    $('myStatsRow').innerHTML=`
      <div class="stat-box"><div class="s-icon">👥</div><div class="s-val">${fmt(sub)}</div><div class="s-full">${fmtFull(sub)}</div><div class="s-label">Subscribers</div></div>
      <div class="stat-box"><div class="s-icon">👁️</div><div class="s-val">${fmt(views)}</div><div class="s-full">${fmtFull(views)}</div><div class="s-label">Total Views</div></div>
      <div class="stat-box"><div class="s-icon">🎬</div><div class="s-val">${fmt(vids)}</div><div class="s-full">${fmtFull(vids)}</div><div class="s-label">Videos</div></div>
      <div class="stat-box"><div class="s-icon">📊</div><div class="s-val">${fmt(Math.round(views/vids))}</div><div class="s-full">per video</div><div class="s-label">Avg Views</div></div>`;

    // Load videos
    const upId=ch.contentDetails?.relatedPlaylists?.uploads;
    if(upId) {
      const videos=await getVideosFromPlaylist(upId, 20);
      myChannelVideos=videos;
      renderVideoGrid(videos,'myVideoGrid');
      renderMyNextIdeas(videos, ch);
      renderMyActionPlan(videos, s, ch);
      renderMySeoTools(ch, videos);
    }

    // Auto-save channel data for learning
    saveChannelSnapshot(ch, myChannelVideos);
    toast('✅ Channel loaded!','success');
  } catch(err) {
    toast('⚠️ '+err.message,'error');
  }
}

function resetMyChannel() { showEl('mySetup'); hideEl('myDash'); myChannelData=null; myChannelVideos=[]; }
async function refreshMyChannel() { if(myChannelData) await loadMyChannel(myChannelData.id); }

// ============================================================
//  SAVE CHANNEL SNAPSHOT (self-learning data)
// ============================================================
function saveChannelSnapshot(ch, videos) {
  const snapshots=JSON.parse(localStorage.getItem('ti_snapshots')||'[]');
  const snap={
    channelId: ch.id,
    title: ch.snippet.title,
    subs: parseInt(ch.statistics.subscriberCount)||0,
    views: parseInt(ch.statistics.viewCount)||0,
    videoCount: parseInt(ch.statistics.videoCount)||0,
    topVideos: videos.sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0))
      .slice(0,5).map(v=>({ title: v.snippet.title, views: parseInt(v.statistics?.viewCount||0), tags: v.snippet.tags||[] })),
    savedAt: new Date().toISOString()
  };
  // Keep last 50 snapshots
  snapshots.push(snap);
  if(snapshots.length>50) snapshots.splice(0, snapshots.length-50);
  localStorage.setItem('ti_snapshots', JSON.stringify(snapshots));
}

// ============================================================
//  MY NEXT VIDEO IDEAS (smart, based on real data + history)
// ============================================================
function renderMyNextIdeas(videos, ch) {
  const sorted=[...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
  const topVideo=sorted[0];
  const topTitle=topVideo?.snippet?.title||'';
  const topViews=parseInt(topVideo?.statistics?.viewCount||0);

  // Pull saved SEO history for smarter suggestions
  const seoHistory=JSON.parse(localStorage.getItem('ti_seohistory')||'[]');
  const savedTopics=seoHistory.map(s=>s.topic).slice(0,5);

  // Analyze what topics are working
  const allTitles=sorted.map(v=>v.snippet.title.toLowerCase());
  const hasBodyParts=allTitles.some(t=>t.includes('body')||t.includes('part'));
  const hasColors=allTitles.some(t=>t.includes('color'));
  const hasNumbers=allTitles.some(t=>t.includes('number')||t.includes('count'));
  const hasAlphabet=allTitles.some(t=>t.includes('abc')||t.includes('alphabet'));
  const hasShapes=allTitles.some(t=>t.includes('shape'));
  const hasAnimals=allTitles.some(t=>t.includes('animal'));

  const ideas=[
    hasBodyParts ? { e:'🦷', t:`${topTitle.split('|')[0]?.trim()} — Part 2`, w:`Your top video (${fmt(topViews)} views!) deserves a sequel. Audiences already love this topic.`, p:'high', saved:true } : null,
    { e:'📱', t:`YouTube Short: "${topTitle.substring(0,40)}..." clip`, w:`Cut your best 45-60 seconds from your top video → upload as a Short. Shorts drive 40-60% faster growth.`, p:'high', saved:false },
    !hasAnimals ? { e:'🐘', t:`Animal Sounds Song — Cow, Dog, Cat, Lion, Elephant`, w:'Animal sounds have billions of views on YouTube. Combine with your teaching style for instant results.', p:'high', saved:false } : null,
    { e:'📅', t:`Days of the Week Song (English + your language)`, w:'School curriculum staple. Teachers share these widely — built-in viral teacher network!', p:'high', saved:false },
    { e:'🕌', t:`Eid Mubarak Song for Kids`, w:'Cultural-specific content = zero competition + massive local audience. Huge seasonal spike every year.', p:'high', saved:false },
    !hasColors ? { e:'🍎', t:`Colors Song with Fruits — Red Apple, Yellow Banana`, w:'Fruits + Colors = double the search queries. Perfect visual content for toddlers.', p:'med', saved:false } : null,
    { e:'🌦️', t:`Weather Song for Kids — Sunny, Rainy, Cloudy, Snowy`, w:'Classroom favorite. Simple animation + catchy tune = teachers share it = organic growth.', p:'med', saved:false },
    { e:'👨‍👩‍👧', t:`Family Members Song — Mama, Baba, Grandma, Grandpa`, w:'Strong family values content. Unique in Urdu/local language — almost no competition.', p:'med', saved:false },
    !hasNumbers ? { e:'🔢', t:`Numbers 1-20 Extended Song + Dance`, w:'If you have 1-10, make the full 1-20 version. Longer = more watch time = better ranking.', p:'med', saved:false } : null,
    { e:'🎨', t:`DIY Arts & Crafts for Kids (Simple + Educational)`, w:'Craft videos have long watch times and high repeat views. Parents watch with kids.', p:'low', saved:false },
    { e:'🌙', t:`Bedtime Song / Lullaby for Babies`, w:'Parents play these on repeat = massive watch hours. Perfect for nighttime algorithm placement.', p:'low', saved:false },
    { e:'🏠', t:`House Objects Song — Table, Chair, Door, Window`, w:'Simple educational format. Great for ESL learners. Huge international search volume.', p:'low', saved:false },
  ].filter(Boolean);

  $('myNextIdeas').innerHTML=`
    <div style="margin-bottom:20px;padding:16px 20px;background:linear-gradient(135deg,rgba(255,60,172,0.06),rgba(43,134,197,0.06));border:1px solid rgba(255,60,172,0.15);border-radius:14px">
      <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:6px">🧠 Smart Suggestions — Based on Your Channel Data</div>
      <div style="font-size:13px;color:#bbb">These ideas are generated by analyzing your top performing videos, your niche gaps, and trending YouTube patterns. Click any idea to get full SEO-optimized title, description & tags.</div>
    </div>
    <div class="ideas-grid">
      ${ideas.map((idea,i)=>`
        <div class="idea-card" onclick="showMyIdeaDetail(${i})">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div class="priority-chip ${idea.p==='high'?'chip-high':idea.p==='med'?'chip-med':'chip-low'}">${idea.p==='high'?'🔥 High Priority':idea.p==='med'?'⭐ Recommended':'✅ Good Idea'}</div>
            ${idea.saved?'<span style="font-size:10px;color:var(--accent3);font-weight:700">💾 SAVED</span>':''}
          </div>
          <h3>${idea.e} ${esc(idea.t)}</h3>
          <p>${esc(idea.w)}</p>
          <div class="idea-meta"><span class="idea-tag" style="color:var(--accent3)">Click for SEO Title + Tags →</span></div>
        </div>`).join('')}
    </div>`;

  window._myIdeas = ideas;
}

function showMyIdeaDetail(idx) {
  const idea = window._myIdeas?.[idx];
  if(!idea) return;
  const niche='kids education';
  const chName=myChannelData?.snippet?.title||'Your Channel';
  const desc=generateDescription(idea.t, niche, chName);
  const tags=generateTags(idea.t, niche);

  $('ideaModalContent').innerHTML=`
    <div style="margin-bottom:16px;padding:10px 14px;background:rgba(255,60,172,0.08);border-radius:10px;font-size:13px;color:#ccc">
      <strong style="color:var(--accent)">For: ${esc(chName)}</strong>
    </div>
    <div class="seo-field">
      <label>Optimized Title</label>
      <div class="seo-copy-box" style="position:relative">
        <strong style="color:var(--gold);font-size:15px">${esc(idea.t)}</strong>
        <button class="copy-btn" onclick="copyText('${esc(idea.t)}', this)">Copy</button>
      </div>
    </div>
    <div class="seo-field">
      <label>Why This Works</label>
      <div class="seo-copy-box">${esc(idea.w)}</div>
    </div>
    <div class="seo-field">
      <label>Full SEO Description</label>
      <div class="seo-copy-box" style="position:relative">
        <pre style="white-space:pre-wrap;font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.7">${esc(desc)}</pre>
        <button class="copy-btn" onclick="copyText(${JSON.stringify(desc)}, this)">Copy</button>
      </div>
    </div>
    <div class="seo-field">
      <label>Tags (click to copy individual)</label>
      <div class="tag-cloud">${tags.map(t=>`<span class="tag-pill" onclick="copyText('${t}',this)">${t}</span>`).join('')}</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      <button class="btn-primary" onclick="saveIdeaToStorage('${esc(idea.t)}', '${esc(chName)}')" style="flex:1;justify-content:center">💾 Save Idea</button>
      <button class="btn-secondary" onclick="closeIdeaModal();showPage('seo');$('seoTopicInput').value='${esc(idea.t)}';runSeoOptimizer();" style="flex:1;justify-content:center">✍️ Full SEO Optimize</button>
    </div>`;
  $('ideaModal').style.display='flex';
}

function saveIdeaToStorage(title, chName) {
  const ideas=JSON.parse(localStorage.getItem('ti_ideas')||'[]');
  ideas.unshift({ title, chName, savedAt: new Date().toISOString(), id: uid() });
  if(ideas.length>100) ideas.splice(100);
  localStorage.setItem('ti_ideas', JSON.stringify(ideas));
  toast('✅ Idea saved!','success');
  closeIdeaModal();
}

// ============================================================
//  MY ACTION PLAN
// ============================================================
function renderMyActionPlan(videos, stats, ch) {
  const sorted=[...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
  const top=sorted[0]; const topT=top?.snippet?.title?.substring(0,35)||'Top video';
  const sub=parseInt(stats.subscriberCount)||0;
  $('myActionPlan').innerHTML=`
    <div class="action-item" style="border-left:3px solid var(--red)"><div class="priority-chip chip-high">🔥 This Week — Urgent</div><h4>Do These Now</h4><ul>
      <li>Cut 45-60 sec clip from "${esc(topT)}..." → upload as YouTube Short</li>
      <li>Add proper descriptions + tags to all existing videos</li>
      <li>Create 4 playlists grouping your videos by topic</li>
      <li>Update channel description with keywords</li>
    </ul></div>
    <div class="action-item" style="border-left:3px solid var(--gold)"><div class="priority-chip chip-med">⭐ This Month</div><h4>30-Day Goals</h4><ul>
      <li>Upload 1 long video + 2-3 Shorts every week — lock in the schedule</li>
      <li>Create sequel to your top video (proven topic)</li>
      <li>Film Animal Sounds Song — billion-view formula</li>
      <li>Design a permanent mascot character for your channel</li>
    </ul></div>
    <div class="action-item" style="border-left:3px solid var(--green)"><div class="priority-chip chip-low">📈 3-Month Target</div><h4>Growth Milestones</h4><ul>
      <li>${sub>=1000?'✅ 1K done! Now push for 4,000 watch hours':'Reach 1,000 subscribers (currently '+fmtFull(sub)+')'}</li>
      <li>Build 20+ video library for algorithm momentum</li>
      <li>Create Urdu/local language versions — unique audience</li>
      <li>Test different thumbnail styles — track which gets more clicks</li>
    </ul></div>
    <div class="action-item" style="border-left:3px solid var(--accent3)"><div class="priority-chip" style="background:rgba(43,134,197,0.12);color:var(--accent3)">🚀 6-Month Vision</div><h4>Big Goals</h4><ul>
      <li>10,000 subscribers — channel authority established</li>
      <li>50+ video catalog — passive views machine</li>
      <li>Become the #1 kids channel in your local language</li>
      <li>Brand deals with educational toy companies</li>
    </ul></div>`;
}

// ============================================================
//  MY SEO TOOLS (in-channel tab)
// ============================================================
function renderMySeoTools(ch, videos) {
  $('mySeoTools').innerHTML=`
    <div style="margin-bottom:20px;padding:16px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px">
      <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:12px">✍️ Quick SEO Generator for ${esc(ch.snippet.title)}</div>
      <label class="field-label">Enter a video topic to generate optimized title, description & tags</label>
      <div class="search-row">
        <input type="text" class="search-input" id="quickSeoInput" placeholder="e.g. Body Parts Song Part 2, Animal Sounds...">
        <button class="btn-primary" onclick="quickSeoGenerate()">Generate →</button>
      </div>
      <div class="quick-picks" style="margin-top:10px">
        <span class="quick-label">Quick topics:</span>
        <button class="qbtn" onclick="$('quickSeoInput').value='Body Parts Song Part 2';quickSeoGenerate()">Body Parts Pt.2</button>
        <button class="qbtn" onclick="$('quickSeoInput').value='Animal Sounds Song';quickSeoGenerate()">Animal Sounds</button>
        <button class="qbtn" onclick="$('quickSeoInput').value='Days of the Week Song';quickSeoGenerate()">Days of Week</button>
        <button class="qbtn" onclick="$('quickSeoInput').value='Colors with Fruits';quickSeoGenerate()">Colors + Fruits</button>
      </div>
    </div>
    <div id="quickSeoOutput"></div>`;
}

function quickSeoGenerate() {
  const topic=($('quickSeoInput').value||'').trim(); if(!topic) return;
  const chName=myChannelData?.snippet?.title||'My Channel';
  const niche='kids education';
  renderSeoOutput(topic, niche, chName, $('quickSeoOutput'));
  // Save to SEO history
  saveSeoToHistory(topic, niche, chName);
}

// ============================================================
//  SEO OPTIMIZER (full page)
// ============================================================
async function runSeoOptimizer() {
  if(!requireKey()) return;
  const topic=($('seoTopicInput').value||'').trim();
  if(!topic){ toast('Enter a video topic first!','error'); return; }
  const niche=$('seoNiche').value;
  const draft=$('seoDraftTitle').value.trim();
  $('seoResults').innerHTML=''; showEl('seoLoading');
  $('seoBtn').disabled=true;

  try {
    // Fetch trending videos for this topic from YouTube
    const trendData=await ytFetch('/search',{part:'snippet',type:'video',q:topic+' '+niche,order:'viewCount',maxResults:5,relevanceLanguage:'en'});
    const trendIds=trendData.items.map(i=>i.id.videoId).join(',');
    const trendStats=await ytFetch('/videos',{part:'statistics,snippet',id:trendIds});

    const trendTitles=trendStats.items.map(v=>v.snippet.title);
    const trendViews=trendStats.items.map(v=>parseInt(v.statistics.viewCount||0));
    const allTags=[...new Set(trendStats.items.flatMap(v=>v.snippet.tags||[]).slice(0,30))];

    hideEl('seoLoading');
    const chName=myChannelData?.snippet?.title||'My Channel';
    renderSeoOutputFull(topic, niche, chName, draft, trendTitles, trendViews, allTags);
    saveSeoToHistory(topic, niche, chName, trendTitles[0]);
    loadSeoHistory();
  } catch(err) {
    hideEl('seoLoading');
    // Fallback without trending data
    const chName=myChannelData?.snippet?.title||'My Channel';
    renderSeoOutput(topic, niche, chName, $('seoResults'));
    saveSeoToHistory(topic, niche, chName);
  }
  $('seoBtn').disabled=false;
}

function renderSeoOutputFull(topic, niche, chName, draft, trendTitles, trendViews, trendTags) {
  const titles=generateTitles(topic, niche, chName, draft, trendTitles);
  const desc=generateDescription(topic, niche, chName);
  const tags=generateTags(topic, niche, trendTags);

  $('seoResults').innerHTML=`
    <div class="seo-result-box">
      <h3>✍️ SEO Results for: "${esc(topic)}"</h3>

      <div style="margin-bottom:20px;padding:14px;background:rgba(255,209,102,0.06);border:1px solid rgba(255,209,102,0.15);border-radius:12px">
        <div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:10px">📊 Trending Videos on This Topic (Real YouTube Data)</div>
        ${trendTitles.slice(0,3).map((t,i)=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;color:#ccc"><span>${esc(t.substring(0,70))}${t.length>70?'...':''}</span><span style="color:var(--gold);font-weight:700;flex-shrink:0;margin-left:10px">${fmt(trendViews[i])}</span></div>`).join('')}
      </div>

      <div class="seo-field">
        <label>🏆 Recommended Titles (Pick the Best One)</label>
        ${titles.map((t,i)=>`
          <div class="seo-copy-box" style="position:relative;margin-bottom:10px;${i===0?'border-color:rgba(255,209,102,0.4);background:rgba(255,209,102,0.04)':''}">
            ${i===0?'<span style="position:absolute;top:10px;left:14px;background:var(--gold);color:#111;font-size:9px;font-weight:800;padding:2px 8px;border-radius:4px">BEST</span><br>':''}
            <span style="${i===0?'font-weight:700;color:var(--text)':'color:#ccc'}">${esc(t)}</span>
            <button class="copy-btn" onclick="copyText('${esc(t)}',this)">Copy</button>
          </div>`).join('')}
      </div>

      <div class="seo-field">
        <label>📝 SEO-Optimized Description</label>
        <div class="seo-copy-box" style="position:relative">
          <pre style="white-space:pre-wrap;font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.7;color:#ddd">${esc(desc)}</pre>
          <button class="copy-btn" onclick="copyText(${JSON.stringify(desc)},this)">Copy All</button>
        </div>
      </div>

      <div class="seo-field">
        <label>🏷️ Tags (${tags.length} tags — click any to copy)</label>
        <div class="tag-cloud">
          ${tags.map((t,i)=>`<span class="tag-pill"${i<5?' style="border-color:rgba(255,209,102,0.3);color:var(--gold)"':''} onclick="copyText('${esc(t)}',this)">${esc(t)}${i<5?'<span class="trending-badge">HOT</span>':''}</span>`).join('')}
        </div>
        <button class="btn-secondary" style="margin-top:12px;font-size:12px" onclick="copyText('${esc(tags.join(', '))}',this)">Copy All Tags</button>
      </div>
    </div>`;
}

function renderSeoOutput(topic, niche, chName, container) {
  const titles=generateTitles(topic, niche, chName, '', []);
  const desc=generateDescription(topic, niche, chName);
  const tags=generateTags(topic, niche, []);
  container.innerHTML=`
    <div class="seo-result-box">
      <h3>✍️ SEO Results: "${esc(topic)}"</h3>
      <div class="seo-field">
        <label>Recommended Titles</label>
        ${titles.map((t,i)=>`<div class="seo-copy-box" style="position:relative;margin-bottom:8px"><span style="${i===0?'font-weight:700':''}">${esc(t)}</span><button class="copy-btn" onclick="copyText('${esc(t)}',this)">Copy</button></div>`).join('')}
      </div>
      <div class="seo-field">
        <label>Description</label>
        <div class="seo-copy-box" style="position:relative"><pre style="white-space:pre-wrap;font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.7">${esc(desc)}</pre><button class="copy-btn" onclick="copyText(${JSON.stringify(desc)},this)">Copy</button></div>
      </div>
      <div class="seo-field">
        <label>Tags</label>
        <div class="tag-cloud">${tags.map(t=>`<span class="tag-pill" onclick="copyText('${esc(t)}',this)">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>`;
}

// ============================================================
//  SEO CONTENT GENERATORS
// ============================================================
function generateTitles(topic, niche, chName, draft, trendTitles) {
  const t=topic, n=chName;
  const titles=[
    `${t} | ${niche.includes('kids')?'Kids Songs & Nursery Rhymes':'Educational Video'} | ${n}`,
    `${t} for Kids | Learn with ${n} | Toddlers & Preschoolers`,
    `${t} 🎵 Fun ${niche.includes('nursery')?'Nursery Rhymes':'Learning Songs'} for Children | ${n}`,
    `Learn ${t} | Educational Video for Kids | ${n}`,
    draft ? `${draft} | ${n}` : `${t} | Children's Learning Video | ${n}`,
  ];
  return [...new Set(titles)];
}

function generateDescription(topic, niche, chName) {
  return `🎵 Welcome to ${chName}! 🎵

In this video, children will learn about "${topic}" in a fun, engaging, and educational way! Perfect for toddlers, preschoolers, and kindergarten students.

🌟 WHAT YOUR CHILD WILL LEARN:
✅ ${topic} in a simple and fun way
✅ Engaging animations and colorful visuals
✅ Catchy song that makes learning easy
✅ Perfect for ages 1-6 years

📚 PERFECT FOR:
• Toddler learning & development
• Preschool and kindergarten preparation
• ESL learners and bilingual education
• Homeschool families

🔔 SUBSCRIBE to ${chName} for more fun educational videos:
👍 LIKE this video if your child enjoyed it!
💬 COMMENT below and tell us what topic to cover next!

🎬 MORE VIDEOS YOU'LL LOVE:
[Playlist links here]

#${topic.replace(/\s+/g,'')} #KidsSongs #NurseryRhymes #LearnWithMe #ToddlerLearning #EducationalKids #PreschoolLearning #KidsEducation #ChildrenSongs #LearningForKids`;
}

function generateTags(topic, niche, trendTags=[]) {
  const base=[
    topic, topic+' for kids', topic+' song', topic+' nursery rhyme',
    'kids songs', 'nursery rhymes', 'toddler learning', 'preschool learning',
    'educational videos for kids', 'children songs', 'learning for kids',
    'kids education', 'baby songs', 'kindergarten', 'phonics for kids',
    'learn '+topic, topic+' video', 'fun learning', 'kids animation',
    'toddler songs', 'educational animation'
  ];
  const combined=[...new Set([...base, ...trendTags.slice(0,10)])].slice(0,30);
  return combined;
}

// ============================================================
//  SEO HISTORY (localStorage)
// ============================================================
function saveSeoToHistory(topic, niche, chName, trendTitle='') {
  const h=JSON.parse(localStorage.getItem('ti_seohistory')||'[]');
  h.unshift({ id:uid(), topic, niche, chName, trendTitle, savedAt:new Date().toISOString() });
  if(h.length>50) h.splice(50);
  localStorage.setItem('ti_seohistory', JSON.stringify(h));
}

function loadSeoHistory() {
  const h=JSON.parse(localStorage.getItem('ti_seohistory')||'[]');
  const el=$('seoHistory'); if(!el) return;
  if(!h.length){ el.innerHTML=''; return; }
  el.innerHTML=`
    <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:12px;color:var(--muted)">Recent SEO Searches</div>
    ${h.slice(0,5).map(s=>`
      <div class="saved-seo-item" style="cursor:pointer" onclick="$('seoTopicInput').value='${esc(s.topic)}';runSeoOptimizer()">
        <div class="seo-topic">${esc(s.topic)}</div>
        ${s.trendTitle?`<div style="font-size:12px;color:var(--muted);margin-top:2px">Trending: ${esc(s.trendTitle.substring(0,50))}</div>`:''}
        <div class="seo-date">${fmtDate(s.savedAt)} · ${esc(s.chName)}</div>
      </div>`).join('')}`;
}

// ============================================================
//  COMPARE
// ============================================================
async function searchForCompare(num) {
  if(!requireKey()) return;
  const q=($(`cmpInput${num}`).value||'').trim(); if(!q) return;
  const res=$(`cmpResult${num}`);
  res.innerHTML='<div style="color:var(--muted);font-size:13px;padding:8px 0">⏳ Searching...</div>';
  try {
    const sd=await ytFetch('/search',{part:'snippet',type:'channel',q,maxResults:1});
    if(!sd.items?.length) throw new Error('Not found');
    const id=sd.items[0].snippet.channelId;
    const cd=await ytFetch('/channels',{part:'snippet,statistics',id});
    const ch=cd.items[0]; compareData[`ch${num}`]=ch;
    res.innerHTML=`<div class="cmp-card"><img src="${esc(ch.snippet.thumbnails?.default?.url||'')}" alt=""><div><div class="cmp-card-name">${esc(ch.snippet.title)}</div><div class="cmp-card-subs">👥 ${fmt(ch.statistics.subscriberCount)} · 👁️ ${fmt(ch.statistics.viewCount)}</div></div><span style="margin-left:auto;color:var(--green);font-size:18px">✓</span></div>`;
    if(compareData.ch1&&compareData.ch2) $('compareBtn').disabled=false;
  } catch(err) { res.innerHTML=`<div style="color:var(--red);font-size:13px;padding:8px 0">⚠️ ${err.message}</div>`; }
}

async function runCompare() {
  const ch1=compareData.ch1, ch2=compareData.ch2; if(!ch1||!ch2) return;
  showEl('compareLoading'); $('compareResults').innerHTML=''; $('compareBtn').disabled=true;
  try {
    const [v1,v2]=await Promise.all([getVidStats(ch1.id),getVidStats(ch2.id)]);
    hideEl('compareLoading'); renderCompare(ch1,ch2,v1,v2);
  } catch(err) {
    hideEl('compareLoading'); $('compareResults').innerHTML=`<div class="error-box" style="display:block">⚠️ ${err.message}</div>`;
  }
  $('compareBtn').disabled=false;
}

async function getVidStats(chId) {
  try {
    const upId=await getUploadsPlaylist(chId);
    const pl=await ytFetch('/playlistItems',{part:'contentDetails',playlistId:upId,maxResults:15});
    const ids=pl.items.map(i=>i.contentDetails.videoId).join(',');
    const vd=await ytFetch('/videos',{part:'statistics,contentDetails,snippet',id:ids});
    const views=vd.items.map(v=>parseInt(v.statistics?.viewCount||0));
    const likes=vd.items.map(v=>parseInt(v.statistics?.likeCount||0));
    const avgV=Math.round(views.reduce((a,b)=>a+b,0)/(views.length||1));
    const maxV=Math.max(...views,0);
    const avgL=Math.round(likes.reduce((a,b)=>a+b,0)/(likes.length||1));
    const dates=vd.items.map(v=>new Date(v.snippet.publishedAt)).sort((a,b)=>b-a);
    let freq=0;
    if(dates.length>1){const sp=[];for(let i=0;i<dates.length-1;i++)sp.push((dates[i]-dates[i+1])/86400000);freq=Math.round(sp.reduce((a,b)=>a+b,0)/sp.length);}
    return {avgV,maxV,avgL,freq};
  } catch { return {avgV:0,maxV:0,avgL:0,freq:0}; }
}

function renderCompare(ch1,ch2,v1,v2) {
  const s1=ch1.statistics, s2=ch2.statistics, n1=ch1.snippet.title, n2=ch2.snippet.title;
  function cmp(a,b,inv=false){if(!a&&!b)return['','']; return (inv?a<b:a>b)?['win','lose']:['lose','win'];}
  const rows=[
    ['👥 Subscribers',fmt(s1.subscriberCount),fmt(s2.subscriberCount),...cmp(parseInt(s1.subscriberCount),parseInt(s2.subscriberCount))],
    ['👁️ Total Views',fmt(s1.viewCount),fmt(s2.viewCount),...cmp(parseInt(s1.viewCount),parseInt(s2.viewCount))],
    ['🎬 Total Videos',fmt(s1.videoCount),fmt(s2.videoCount),...cmp(parseInt(s1.videoCount),parseInt(s2.videoCount))],
    ['📊 Avg Views/Video',fmt(v1.avgV),fmt(v2.avgV),...cmp(v1.avgV,v2.avgV)],
    ['🔥 Best Video Views',fmt(v1.maxV),fmt(v2.maxV),...cmp(v1.maxV,v2.maxV)],
    ['👍 Avg Likes/Video',fmt(v1.avgL),fmt(v2.avgL),...cmp(v1.avgL,v2.avgL)],
    ['⏱️ Upload Frequency',v1.freq?`Every ${v1.freq}d`:'?',v2.freq?`Every ${v2.freq}d`:'?',...cmp(v1.freq,v2.freq,true)],
    ['📅 Channel Started',new Date(ch1.snippet.publishedAt).getFullYear()+'',new Date(ch2.snippet.publishedAt).getFullYear()+'',...cmp(new Date(ch1.snippet.publishedAt).getFullYear(),new Date(ch2.snippet.publishedAt).getFullYear(),true)],
  ];
  const w1=rows.filter(r=>r[3]==='win').length, w2=rows.filter(r=>r[4]==='win').length;
  $('compareResults').innerHTML=`
    <div style="display:flex;align-items:center;gap:16px;margin:20px 0;padding:20px;background:var(--surface);border:1px solid var(--border);border-radius:16px">
      <img src="${esc(ch1.snippet.thumbnails?.default?.url||'')}" style="width:52px;height:52px;border-radius:50%;object-fit:cover">
      <div style="flex:1;text-align:center"><div style="font-size:30px;font-weight:800;color:var(--accent)">VS</div><div style="font-size:12px;color:var(--muted)">${w1} vs ${w2} categories won</div></div>
      <img src="${esc(ch2.snippet.thumbnails?.default?.url||'')}" style="width:52px;height:52px;border-radius:50%;object-fit:cover">
    </div>
    <div style="overflow-x:auto;border-radius:16px;border:1px solid var(--border);margin-bottom:20px">
      <table class="compare-table">
        <thead><tr><th>Metric</th><th class="${w1>w2?'winner-col':''}">${esc(n1)} ${w1>w2?'🏆':''}</th><th class="${w2>w1?'winner-col':''}">${esc(n2)} ${w2>w1?'🏆':''}</th></tr></thead>
        <tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="${r[3]}">${r[1]}</td><td class="${r[4]}">${r[2]}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="growth-card"><h3 style="color:var(--gold)">🏆 Overall Winner</h3><p style="font-size:18px;font-weight:800;color:var(--green);margin-bottom:8px">${esc(w1>=w2?n1:n2)}</p><p style="font-size:13px;color:#bbb">Won ${Math.max(w1,w2)} out of ${rows.length} categories measured.</p></div>
      <div class="growth-card"><h3 style="color:var(--accent)">💡 What To Learn</h3><p style="font-size:13px;color:#bbb">Copy the winner's content format. Fill the loser's gaps. Your local-language advantage differentiates you from both!</p></div>
    </div>`;
}

// ============================================================
//  SAVED DATA PAGE
// ============================================================
function loadSavedPage() {
  // Saved channels
  const channels=JSON.parse(localStorage.getItem('ti_channels')||'[]');
  const chEl=$('savedChannelsList');
  if(chEl) chEl.innerHTML=channels.length ? channels.map(c=>`
    <div class="saved-channel-item" onclick="$('myChannelInput').value='${esc(c.id)}';showPage('mychannel');loadMyChannel('${esc(c.id)}')">
      <img src="${esc(c.thumb)}" alt="" onerror="this.style.background='#333'">
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:15px">${esc(c.title)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">👥 ${fmt(c.subs)} · 👁️ ${fmt(c.views)} · Saved ${ago(c.savedAt)}</div>
        ${c.isMine?'<span style="font-size:10px;color:var(--accent);font-weight:700">MY CHANNEL</span>':''}
      </div>
      <div style="font-size:12px;color:var(--accent3)">Open Dashboard →</div>
    </div>`).join('')
    : '<div class="empty-state"><div class="e-icon">📊</div><div>No channels saved yet.<br>Analyze a channel and click "Save Channel"</div></div>';

  // SEO History
  const seoH=JSON.parse(localStorage.getItem('ti_seohistory')||'[]');
  const seoEl=$('savedSeoList');
  if(seoEl) seoEl.innerHTML=seoH.length ? seoH.map(s=>`
    <div class="saved-seo-item" style="cursor:pointer" onclick="showPage('seo');$('seoTopicInput').value='${esc(s.topic)}';runSeoOptimizer()">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="seo-topic">${esc(s.topic)}</div>
        <button class="delete-btn" onclick="event.stopPropagation();deleteSeoItem('${s.id}')">✕</button>
      </div>
      ${s.trendTitle?`<div style="font-size:12px;color:var(--muted);margin-top:4px">📈 Trending: ${esc(s.trendTitle.substring(0,60))}</div>`:''}
      <div class="seo-date">${fmtDate(s.savedAt)} · ${esc(s.niche)} · ${esc(s.chName)}</div>
    </div>`).join('')
    : '<div class="empty-state"><div class="e-icon">✍️</div><div>No SEO searches yet.<br>Use the SEO Optimizer to generate titles & tags</div></div>';

  // Notes
  loadNotes();
}

function deleteSeoItem(id) {
  const h=JSON.parse(localStorage.getItem('ti_seohistory')||'[]').filter(s=>s.id!==id);
  localStorage.setItem('ti_seohistory', JSON.stringify(h));
  loadSavedPage();
}

function saveNote() {
  const txt=($('noteInput').value||'').trim(); if(!txt) return;
  const notes=JSON.parse(localStorage.getItem('ti_notes')||'[]');
  notes.unshift({ id:uid(), text:txt, savedAt:new Date().toISOString() });
  localStorage.setItem('ti_notes', JSON.stringify(notes));
  $('noteInput').value=''; loadNotes(); toast('✅ Note saved!','success');
}

function loadNotes() {
  const notes=JSON.parse(localStorage.getItem('ti_notes')||'[]');
  const el=$('notesList'); if(!el) return;
  el.innerHTML=notes.length ? notes.map(n=>`
    <div class="note-item">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="note-text">${esc(n.text).replace(/\n/g,'<br>')}</div>
        <button class="delete-btn" onclick="deleteNote('${n.id}')">✕</button>
      </div>
      <div class="note-meta">${fmtDate(n.savedAt)}</div>
    </div>`).join('')
    : '<div class="empty-state"><div class="e-icon">📝</div><div>No notes yet. Write your strategy notes here!</div></div>';
}

function deleteNote(id) {
  const notes=JSON.parse(localStorage.getItem('ti_notes')||'[]').filter(n=>n.id!==id);
  localStorage.setItem('ti_notes', JSON.stringify(notes));
  loadNotes();
}

function clearAllData() {
  if(!confirm('Are you sure? This will delete ALL saved channels, SEO history, and notes.')) return;
  ['ti_channels','ti_seohistory','ti_notes','ti_snapshots','ti_ideas'].forEach(k=>localStorage.removeItem(k));
  loadSavedPage(); loadSavedChannelBtns(); loadSeoHistory();
  toast('All data cleared','info');
}
