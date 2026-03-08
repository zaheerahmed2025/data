// =============================================
//   TubeIntel v2.0 — YouTube Data API Engine
//   Key stored in localStorage (never in code)
// =============================================

const YT = 'https://www.googleapis.com/youtube/v3';
let API_KEY = localStorage.getItem('yt_api_key') || '';
let compareData = { ch1: null, ch2: null };
let currentChannel = null;
let currentChannelVideos = [];

// ---- INIT ----
window.onload = () => {
  if (API_KEY) {
    hideEl('setupModal');
    document.getElementById('apiStatus').style.display = 'flex';
  }
};

// ---- DOM HELPERS ----
function showEl(id, display='block') { const el=document.getElementById(id); if(el) el.style.display=display; }
function hideEl(id) { const el=document.getElementById(id); if(el) el.style.display='none'; }
function setText(id, txt) { const el=document.getElementById(id); if(el) el.innerHTML=txt; }

function fmt(n) {
  n = parseInt(n) || 0;
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString();
}
function fmtFull(n) { return (parseInt(n)||0).toLocaleString(); }
function fmtDuration(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h=parseInt(m[1]||0), min=parseInt(m[2]||0), s=parseInt(m[3]||0);
  return h>0 ? `${h}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${min}:${String(s).padStart(2,'0')}`;
}
function timeAgo(iso) {
  const d = Math.floor((Date.now()-new Date(iso))/86400000);
  if (d===0) return 'Aaj'; if (d===1) return 'Kal';
  if (d<7) return `${d} din pehle`; if (d<30) return `${Math.floor(d/7)} hafte pehle`;
  if (d<365) return `${Math.floor(d/30)} mahine pehle`; return `${Math.floor(d/365)} saal pehle`;
}
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ---- TOAST ----
function toast(msg, type='info') {
  let t = document.getElementById('_toast');
  if (!t) { t=document.createElement('div'); t.id='_toast'; document.body.appendChild(t);
    t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;transition:opacity 0.3s;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,0.4)'; }
  const cols={success:'#06D6A0',error:'#EF476F',info:'#2B86C5'};
  t.style.background=cols[type]||cols.info; t.style.color='#fff'; t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t); t._t=setTimeout(()=>{ t.style.opacity='0'; },3500);
}

// ---- API KEY ----
function saveApiKey() {
  const key = (document.getElementById('apiKeyInput').value||'').trim();
  if (!key.startsWith('AIza') || key.length < 30) { toast('Sahi API key daalo — "AIza..." se shuru honi chahiye!','error'); return; }
  API_KEY = key; localStorage.setItem('yt_api_key', key);
  hideEl('setupModal'); document.getElementById('apiStatus').style.display='flex';
  toast('✅ API Key save ho gayi!','success');
}
function changeKey() { document.getElementById('apiKeyInput').value=API_KEY; document.getElementById('setupModal').style.display='flex'; }
function showGuide() { hideEl('setupModal'); document.getElementById('guideModal').style.display='flex'; }
function closeGuide() { hideEl('guideModal'); document.getElementById('setupModal').style.display='flex'; }
function requireKey() { if(!API_KEY){ document.getElementById('setupModal').style.display='flex'; return false; } return true; }

// ---- YT API FETCH ----
async function ytFetch(endpoint, params) {
  params.key = API_KEY;
  const res = await fetch(YT+endpoint+'?'+new URLSearchParams(params));
  const data = await res.json();
  if (data.error) {
    const r = data.error.errors?.[0]?.reason||'';
    if (r==='quotaExceeded') throw new Error('Daily quota khatam! Kal dobara try karo.');
    if (r==='keyInvalid') throw new Error('API key galat hai! Settings check karo.');
    throw new Error(data.error.message);
  }
  return data;
}

// ---- PAGE NAV ----
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  const tab=document.querySelector(`[data-page="${name}"]`); if(tab) tab.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}
function showInnerTab(name) {
  document.getElementById('page-channel').querySelectorAll('.itab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-channel').querySelectorAll('.inner-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('itab-'+name).classList.add('active'); event.target.classList.add('active');
}
function showMyTab(name) {
  document.getElementById('page-mywow').querySelectorAll('.itab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-mywow').querySelectorAll('.inner-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('mytab-'+name).classList.add('active'); event.target.classList.add('active');
}

// =============================================
//   SEARCH
// =============================================
function quickSearch(name) { document.getElementById('searchInput').value=name; searchChannels(); }

async function searchChannels() {
  if (!requireKey()) return;
  const q = (document.getElementById('searchInput').value||'').trim();
  if (!q) return;
  document.getElementById('searchResults').innerHTML='';
  hideEl('searchError'); showEl('searchLoading');
  document.getElementById('searchBtn').disabled=true;
  try {
    const sd = await ytFetch('/search',{part:'snippet',type:'channel',q,maxResults:8});
    if (!sd.items?.length) throw new Error('Koi channel nahi mila. Dusra naam try karo!');
    const ids = sd.items.map(i=>i.snippet.channelId).join(',');
    const cd = await ytFetch('/channels',{part:'snippet,statistics,brandingSettings',id:ids});
    hideEl('searchLoading'); renderSearchResults(cd.items);
  } catch(err) {
    hideEl('searchLoading');
    const e=document.getElementById('searchError'); e.textContent='⚠️ '+err.message; showEl('searchError');
  }
  document.getElementById('searchBtn').disabled=false;
}

function renderSearchResults(channels) {
  const grid=document.getElementById('searchResults'); grid.innerHTML='';
  channels.forEach((ch,i)=>{
    const s=ch.statistics, sn=ch.snippet;
    const sub=parseInt(s.subscriberCount)||0;
    const badge=sub>10e6?'🏆 Mega':sub>1e6?'🌟 Large':sub>100e3?'📈 Growing':sub>10e3?'🌱 Small':'🐣 New';
    const card=document.createElement('div'); card.className='channel-card'; card.style.animationDelay=(i*0.07)+'s';
    const thumb=sn.thumbnails?.medium?.url||sn.thumbnails?.default?.url||'';
    card.innerHTML=`
      <div class="channel-card-top">
        <img class="ch-thumb" src="${esc(thumb)}" alt="" onerror="this.style.background='#333';this.src=''">
        <div style="flex:1;min-width:0">
          <div class="ch-name">${esc(sn.title)}</div>
          <div class="ch-handle">${sn.customUrl?'@'+sn.customUrl:ch.id}</div>
          <span class="size-badge">${badge}</span>
        </div>
      </div>
      <div class="ch-stats">
        <div class="ch-stat">👥 <span>${fmt(s.subscriberCount)}</span></div>
        <div class="ch-stat">👁️ <span>${fmt(s.viewCount)}</span> Views</div>
        <div class="ch-stat">🎬 <span>${fmt(s.videoCount)}</span> Videos</div>
      </div>
      <div class="ch-desc">${esc((sn.description||'No description').substring(0,120))}${(sn.description||'').length>120?'...':''}</div>
      <div class="card-action">Click to full analyze →</div>`;
    card.onclick=()=>loadChannel(ch); grid.appendChild(card);
  });
}

// =============================================
//   FULL CHANNEL DETAIL
// =============================================
async function loadChannel(ch) {
  currentChannel=ch; showPage('channel'); document.getElementById('navChannel').style.display='flex';
  const sn=ch.snippet, s=ch.statistics;
  const sub=parseInt(s.subscriberCount)||0, views=parseInt(s.viewCount)||0, vids=parseInt(s.videoCount)||1;
  const avg=Math.round(views/vids), startY=new Date(sn.publishedAt).getFullYear();
  const yrs=Math.max(1,new Date().getFullYear()-startY);

  document.getElementById('channelHeader').innerHTML=`
    <img src="${esc(sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'')}" alt="" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.1);flex-shrink:0">
    <div class="channel-hero-info" style="flex:1;min-width:0">
      <h2>${esc(sn.title)}</h2>
      <p style="color:var(--muted);font-size:14px;margin:6px 0;line-height:1.5">${esc((sn.description||'').substring(0,180))}${(sn.description||'').length>180?'...':''}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
        <a class="ch-link" href="https://youtube.com/channel/${ch.id}" target="_blank">▶ YouTube pe dekho</a>
        ${sn.customUrl?`<a class="ch-link" href="https://youtube.com/@${sn.customUrl}" target="_blank">@ Direct Link</a>`:''}
        <span style="color:var(--muted);font-size:12px;padding:4px 0">📅 Since ${startY} (${yrs} saal active)</span>
      </div>
    </div>`;

  document.getElementById('statsRow').innerHTML=`
    <div class="stat-box"><div class="s-icon">👥</div><div class="s-val">${fmt(sub)}</div><div class="s-full">${fmtFull(sub)}</div><div class="s-label">Subscribers</div></div>
    <div class="stat-box"><div class="s-icon">👁️</div><div class="s-val">${fmt(views)}</div><div class="s-full">${fmtFull(views)}</div><div class="s-label">Total Views</div></div>
    <div class="stat-box"><div class="s-icon">🎬</div><div class="s-val">${fmt(vids)}</div><div class="s-full">${fmtFull(vids)} videos</div><div class="s-label">Total Videos</div></div>
    <div class="stat-box"><div class="s-icon">📊</div><div class="s-val">${fmt(avg)}</div><div class="s-full">per video</div><div class="s-label">Avg Views</div></div>`;

  await loadChannelVideos(ch.id);
  renderInsights(ch);
  renderGrowthTips(ch);
}

async function loadChannelVideos(chId) {
  showEl('videoLoading'); document.getElementById('videoGrid').innerHTML='';
  try {
    const cd=await ytFetch('/channels',{part:'contentDetails',id:chId});
    const upId=cd.items[0]?.contentDetails?.relatedPlaylists?.uploads;
    if(!upId) throw new Error('Videos nahi mile');
    const pl=await ytFetch('/playlistItems',{part:'contentDetails',playlistId:upId,maxResults:24});
    const ids=pl.items.map(i=>i.contentDetails.videoId).join(',');
    const vd=await ytFetch('/videos',{part:'snippet,statistics,contentDetails',id:ids});
    currentChannelVideos=vd.items;
    hideEl('videoLoading'); renderVideoGrid(vd.items,'videoGrid');
    renderInsightsWithVideos(currentChannel, vd.items);
  } catch(err) {
    hideEl('videoLoading');
    document.getElementById('videoGrid').innerHTML=`<div class="error-box" style="display:block">⚠️ ${err.message}</div>`;
  }
}

function renderVideoGrid(videos, containerId) {
  const grid=document.getElementById(containerId); if(!grid) return;
  grid.innerHTML='';
  const sorted=[...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
  sorted.forEach((v,i)=>{
    const sn=v.snippet, s=v.statistics;
    const thumb=sn.thumbnails?.medium?.url||sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'';
    const card=document.createElement('div'); card.className='video-card'; card.style.animationDelay=(i*0.05)+'s';
    card.innerHTML=`
      <div class="video-thumb-wrap">
        <img class="video-thumb" src="${esc(thumb)}" alt="" loading="lazy" onerror="this.style.background='#222'">
        <div class="video-duration">${fmtDuration(v.contentDetails?.duration)}</div>
        ${i===0?'<div class="top-badge">🏆 Top</div>':''}
      </div>
      <div class="video-info">
        <div class="video-title">${esc(sn.title)}</div>
        <div class="video-meta">
          <div class="vmeta">👁️ <strong>${fmt(s?.viewCount)}</strong></div>
          <div class="vmeta">👍 <strong>${fmt(s?.likeCount)}</strong></div>
          ${parseInt(s?.commentCount||0)>0?`<div class="vmeta">💬 <strong>${fmt(s?.commentCount)}</strong></div>`:''}
          <div class="vmeta">🕐 ${timeAgo(sn.publishedAt)}</div>
        </div>
        <div class="video-date">${fmtDate(sn.publishedAt)}</div>
      </div>`;
    card.onclick=()=>window.open(`https://youtube.com/watch?v=${v.id}`,'_blank');
    grid.appendChild(card);
  });
}

function renderInsights(ch) {
  const s=ch.statistics;
  const sub=parseInt(s.subscriberCount)||0, views=parseInt(s.viewCount)||0, vids=parseInt(s.videoCount)||1;
  const avg=Math.round(views/vids), vps=sub>0?(views/sub).toFixed(1):'?';
  const yrs=Math.max(1,new Date().getFullYear()-new Date(ch.snippet.publishedAt).getFullYear());
  const vpy=Math.round(vids/yrs);
  document.getElementById('insightsPanel').innerHTML=`
    <div class="insight-card">
      <h3 style="color:var(--gold)">📊 Deep Statistics</h3>
      <ul>
        <li><div class="dot" style="background:var(--gold)"></div>Avg views per video: <strong style="color:var(--gold)">${fmt(avg)}</strong> (${fmtFull(avg)})</li>
        <li><div class="dot" style="background:var(--green)"></div>Views/Subscriber ratio: <strong style="color:var(--green)">${vps}x</strong></li>
        <li><div class="dot" style="background:var(--accent3)"></div>Videos per year: <strong style="color:var(--accent3)">${vpy} videos</strong></li>
        <li><div class="dot" style="background:var(--accent)"></div>Channel age: <strong style="color:var(--accent)">${yrs} saal</strong> (since ${new Date(ch.snippet.publishedAt).getFullYear()})</li>
        <li><div class="dot" style="background:var(--purple)"></div>Total content: <strong style="color:var(--purple)">${fmtFull(vids)} videos × ${yrs} years</strong></li>
      </ul>
    </div>
    <div class="insight-card">
      <h3 style="color:var(--accent)">🎯 Performance Grade</h3>
      <ul>
        <li><div class="dot" style="background:${sub>10e6?'var(--green)':sub>1e6?'var(--gold)':'var(--muted)'}"></div>Channel Size: <strong>${sub>10e6?'🏆 Mega (10M+)':sub>1e6?'🌟 Large (1M+)':sub>100e3?'📈 Medium (100K+)':sub>10e3?'🌱 Small':'🐣 Starter'}</strong></li>
        <li><div class="dot" style="background:${avg>500e3?'var(--green)':avg>50e3?'var(--gold)':'var(--muted)'}"></div>Avg Engagement: <strong>${avg>500e3?'🔥 Viral':avg>50e3?'💪 Strong':avg>5e3?'📈 Good':'🌱 Growing'}</strong></li>
        <li><div class="dot" style="background:${vpy>100?'var(--green)':vpy>50?'var(--gold)':'var(--muted)'}"></div>Upload Consistency: <strong>${vpy>100?'🚀 Excellent':vpy>50?'✅ Good':vpy>20?'⚠️ Average':'❌ Irregular'}</strong></li>
        <li><div class="dot" style="background:var(--accent3)"></div>Views/Sub: <strong>${parseFloat(vps)>50?'🔥 Excellent':parseFloat(vps)>20?'✅ Good':parseFloat(vps)>5?'⚠️ Average':'❌ Low'}</strong></li>
      </ul>
    </div>`;
}

function renderInsightsWithVideos(ch, videos) {
  if (!videos?.length) return;
  const sorted=[...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
  const top3=sorted.slice(0,3);
  const topHtml=top3.map((v,i)=>`
    <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''" onclick="window.open('https://youtube.com/watch?v=${v.id}','_blank')">
      <img src="${esc(v.snippet.thumbnails?.default?.url||'')}" style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;line-height:1.3;margin-bottom:4px">${esc(v.snippet.title.substring(0,60))}${v.snippet.title.length>60?'...':''}</div>
        <div style="font-size:11px;color:var(--muted)">👁️ <strong style="color:var(--gold)">${fmt(v.statistics?.viewCount)}</strong> views • ${timeAgo(v.snippet.publishedAt)} • ${fmtDuration(v.contentDetails?.duration)}</div>
      </div>
      <span style="flex-shrink:0;font-family:'Syne',sans-serif;font-size:22px;color:${i===0?'var(--gold)':i===1?'#aaa':'#cd7f32'}">#${i+1}</span>
    </div>`).join('');
  document.getElementById('insightsPanel').innerHTML+=`
    <div class="insight-card" style="grid-column:1/-1">
      <h3 style="color:var(--green)">🏆 Top Performing Videos (Real YouTube Data)</h3>
      ${topHtml}
      <div style="margin-top:12px;padding:12px;background:rgba(255,209,102,0.06);border-radius:10px;font-size:13px;color:#ccc">
        💡 In videos ka topic aur format note karo — yahi formula is channel pe kaam kar raha hai. Isi topic par apna version banao!
      </div>
    </div>`;
}

function renderGrowthTips(ch) {
  const s=ch.statistics, sub=parseInt(s.subscriberCount)||0;
  document.getElementById('growthPanel').innerHTML=`
    <div class="growth-card">
      <h3 style="color:var(--green)">💡 WOW Super Kido ke liye Direct Lessons</h3>
      <ul>
        <li><div class="dot" style="background:var(--green)"></div>Upload frequency copy karo — algorithm consistency reward karta hai</li>
        <li><div class="dot" style="background:var(--green)"></div>Top 3 videos ke topics — proven hain, apne style mein banao</li>
        <li><div class="dot" style="background:var(--green)"></div>Thumbnail style study karo — colors, text size, character placement</li>
        <li><div class="dot" style="background:var(--green)"></div>Title keywords note karo — same words apne titles mein use karo</li>
        <li><div class="dot" style="background:var(--green)"></div>Description format copy karo — timestamps, tags, channel links</li>
      </ul>
    </div>
    <div class="growth-card">
      <h3 style="color:var(--accent)">🚀 Tumhara Competitive Advantage</h3>
      <ul>
        <li><div class="dot" style="background:var(--accent)"></div>${sub>1e6?'Broad channel — tum tight niche mein dominant ho sakte ho':'Still growing — abhi compete possible hai!'}</li>
        <li><div class="dot" style="background:var(--accent)"></div>Urdu/Hindi content — Pakistan + India = 1.5B people, barely covered</li>
        <li><div class="dot" style="background:var(--accent)"></div>YouTube Shorts — agar inke kam hain, wahan tum lead le sakte ho</li>
        <li><div class="dot" style="background:var(--accent)"></div>Pakistani-specific: Eid songs, Urdu rhymes — zero competition!</li>
        <li><div class="dot" style="background:var(--accent)"></div>Local parents prefer local content — trust aur views dono zyada</li>
      </ul>
    </div>
    <div class="growth-card" style="grid-column:1/-1;background:linear-gradient(135deg,rgba(255,60,172,0.05),rgba(43,134,197,0.05));border-color:rgba(255,60,172,0.12)">
      <h3 style="color:var(--gold)">🎯 3 Immediate Actions After Seeing This Channel</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:12px">
        <div style="background:var(--surface2);padding:14px;border-radius:12px"><div style="font-size:20px;margin-bottom:6px">1️⃣</div><div style="font-size:13px;font-weight:600;margin-bottom:4px">Top Video Topic Copy Karo</div><div style="font-size:12px;color:var(--muted)">Unka most viral topic apne Urdu/Hindi style mein banao</div></div>
        <div style="background:var(--surface2);padding:14px;border-radius:12px"><div style="font-size:20px;margin-bottom:6px">2️⃣</div><div style="font-size:13px;font-weight:600;margin-bottom:4px">Title Formula Use Karo</div><div style="font-size:12px;color:var(--muted)">Same keywords, apne channel naam ke saath</div></div>
        <div style="background:var(--surface2);padding:14px;border-radius:12px"><div style="font-size:20px;margin-bottom:6px">3️⃣</div><div style="font-size:13px;font-weight:600;margin-bottom:4px">Unki Gap Fill Karo</div><div style="font-size:12px;color:var(--muted)">Jo topic inhon ne miss kiya, woh Urdu mein banao — first mover ban jao!</div></div>
      </div>
    </div>`;
}

// =============================================
//   COMPARE
// =============================================
async function searchForCompare(num) {
  if (!requireKey()) return;
  const q=(document.getElementById(`cmpInput${num}`).value||'').trim(); if(!q) return;
  const res=document.getElementById(`cmpResult${num}`);
  res.innerHTML='<div style="color:var(--muted);font-size:13px;padding:8px 0">⏳ Dhundh raha hoon...</div>';
  try {
    const sd=await ytFetch('/search',{part:'snippet',type:'channel',q,maxResults:1});
    if(!sd.items?.length) throw new Error('Nahi mila');
    const id=sd.items[0].snippet.channelId;
    const cd=await ytFetch('/channels',{part:'snippet,statistics',id});
    const ch=cd.items[0]; compareData[`ch${num}`]=ch;
    res.innerHTML=`<div class="cmp-card"><img src="${esc(ch.snippet.thumbnails?.default?.url||'')}" alt=""><div><div class="cmp-card-name">${esc(ch.snippet.title)}</div><div class="cmp-card-subs">👥 ${fmt(ch.statistics.subscriberCount)} • 👁️ ${fmt(ch.statistics.viewCount)}</div></div><span style="margin-left:auto;color:var(--green);font-size:18px">✓</span></div>`;
    if(compareData.ch1&&compareData.ch2) document.getElementById('compareBtn').disabled=false;
  } catch(err) { res.innerHTML=`<div style="color:var(--red);font-size:13px;padding:8px 0">⚠️ ${err.message}</div>`; }
}

async function runCompare() {
  const ch1=compareData.ch1, ch2=compareData.ch2; if(!ch1||!ch2) return;
  showEl('compareLoading'); document.getElementById('compareResults').innerHTML=''; document.getElementById('compareBtn').disabled=true;
  try {
    const [v1,v2]=await Promise.all([getVidStats(ch1.id),getVidStats(ch2.id)]);
    hideEl('compareLoading'); renderCompare(ch1,ch2,v1,v2);
  } catch(err) {
    hideEl('compareLoading'); document.getElementById('compareResults').innerHTML=`<div class="error-box" style="display:block">⚠️ ${err.message}</div>`;
  }
  document.getElementById('compareBtn').disabled=false;
}

async function getVidStats(chId) {
  try {
    const cd=await ytFetch('/channels',{part:'contentDetails',id:chId});
    const upId=cd.items[0]?.contentDetails?.relatedPlaylists?.uploads;
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
    if(dates.length>1){const spans=[];for(let i=0;i<dates.length-1;i++)spans.push((dates[i]-dates[i+1])/86400000);freq=Math.round(spans.reduce((a,b)=>a+b,0)/spans.length);}
    return {avgV,maxV,avgL,freq,n:views.length};
  } catch { return {avgV:0,maxV:0,avgL:0,freq:0,n:0}; }
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
    ['⏱️ Upload Freq',v1.freq?`Har ${v1.freq} din`:'?',v2.freq?`Har ${v2.freq} din`:'?',...cmp(v1.freq,v2.freq,true)],
    ['📅 Channel Start',new Date(ch1.snippet.publishedAt).getFullYear()+'',new Date(ch2.snippet.publishedAt).getFullYear()+'',...cmp(new Date(ch1.snippet.publishedAt).getFullYear(),new Date(ch2.snippet.publishedAt).getFullYear(),true)],
  ];
  const w1=rows.filter(r=>r[3]==='win').length, w2=rows.filter(r=>r[4]==='win').length;
  document.getElementById('compareResults').innerHTML=`
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:20px;background:var(--surface);border:1px solid var(--border);border-radius:16px">
      <img src="${esc(ch1.snippet.thumbnails?.default?.url||'')}" style="width:52px;height:52px;border-radius:50%;object-fit:cover">
      <div style="flex:1;text-align:center"><div style="font-size:30px;font-weight:800;color:var(--accent)">VS</div><div style="font-size:12px;color:var(--muted)">${w1} vs ${w2} categories</div></div>
      <img src="${esc(ch2.snippet.thumbnails?.default?.url||'')}" style="width:52px;height:52px;border-radius:50%;object-fit:cover">
    </div>
    <div style="overflow-x:auto;border-radius:16px;border:1px solid var(--border);margin-bottom:20px">
      <table class="compare-table">
        <thead><tr><th>Metric</th><th class="${w1>w2?'winner-col':''}">${esc(n1)} ${w1>w2?'🏆':''}</th><th class="${w2>w1?'winner-col':''}">${esc(n2)} ${w2>w1?'🏆':''}</th></tr></thead>
        <tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="${r[3]}">${r[1]}</td><td class="${r[4]}">${r[2]}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="growth-card"><h3 style="color:var(--gold)">🏆 Overall Winner</h3><p style="font-size:18px;font-weight:800;color:var(--green);margin-bottom:8px">${esc(w1>=w2?n1:n2)}</p><p style="font-size:13px;color:#bbb">${w1} vs ${w2} categories — clear winner!</p></div>
      <div class="growth-card"><h3 style="color:var(--accent)">💡 WOW Super Kido ke liye</h3><p style="font-size:13px;color:#bbb">Winner ka format seedha use karo. Dono ki combined weaknesses = tumhara opportunity. Urdu angle = unique competitive advantage!</p></div>
    </div>`;
}

// =============================================
//   MY CHANNEL
// =============================================
async function loadMyChannel() {
  if (!requireKey()) return;
  const input=(document.getElementById('myChannelInput').value||'').trim();
  if (!input) { toast('Channel naam ya ID daalo!','error'); return; }
  toast('⏳ Channel load ho raha hai...','info');
  try {
    let chId=input;
    if (!input.startsWith('UC')) {
      const sd=await ytFetch('/search',{part:'snippet',type:'channel',q:input,maxResults:1});
      if (!sd.items?.length) throw new Error('Channel nahi mila');
      chId=sd.items[0].snippet.channelId;
    }
    const cd=await ytFetch('/channels',{part:'snippet,statistics,contentDetails',id:chId});
    if (!cd.items?.length) throw new Error('Channel data nahi aaya');
    const ch=cd.items[0], s=ch.statistics;
    const sub=parseInt(s.subscriberCount)||0, views=parseInt(s.viewCount)||0, vids=parseInt(s.videoCount)||1;
    hideEl('wowSetup'); showEl('myChannelDash');
    document.getElementById('myStatsRow').innerHTML=`
      <div class="stat-box"><div class="s-icon">👥</div><div class="s-val">${fmt(sub)}</div><div class="s-full">${fmtFull(sub)}</div><div class="s-label">Subscribers</div></div>
      <div class="stat-box"><div class="s-icon">👁️</div><div class="s-val">${fmt(views)}</div><div class="s-full">${fmtFull(views)}</div><div class="s-label">Total Views</div></div>
      <div class="stat-box"><div class="s-icon">🎬</div><div class="s-val">${fmt(vids)}</div><div class="s-full">${fmtFull(vids)} videos</div><div class="s-label">Videos</div></div>
      <div class="stat-box"><div class="s-icon">📊</div><div class="s-val">${fmt(Math.round(views/vids))}</div><div class="s-full">per video</div><div class="s-label">Avg Views</div></div>`;
    const upId=ch.contentDetails?.relatedPlaylists?.uploads;
    if (upId) {
      const pl=await ytFetch('/playlistItems',{part:'contentDetails',playlistId:upId,maxResults:20});
      const ids=pl.items.map(i=>i.contentDetails.videoId).join(',');
      const vd=await ytFetch('/videos',{part:'snippet,statistics,contentDetails',id:ids});
      renderVideoGrid(vd.items,'myVideoGrid');
      renderMyActionPlan(vd.items,s);
      renderNextIdeas(vd.items);
    }
    toast('✅ Channel loaded!','success');
  } catch(err) { toast('⚠️ '+err.message,'error'); showEl('wowSetup'); hideEl('myChannelDash'); }
}

function renderMyActionPlan(videos, stats) {
  const sorted=[...videos].sort((a,b)=>parseInt(b.statistics?.viewCount||0)-parseInt(a.statistics?.viewCount||0));
  const top=sorted[0]; const topT=top?.snippet?.title?.substring(0,35)||'Top video';
  const sub=parseInt(stats.subscriberCount)||0;
  document.getElementById('actionPlan').innerHTML=`
    <div class="action-item" style="border-left:3px solid var(--red)"><div class="priority-chip chip-high">🔥 Is Hafte Abhi</div><h4>Urgent Tasks</h4><ul>
      <li>"${esc(topT)}..." ka 45-60 sec clip → YouTube Short banao ABHI</li>
      <li>Shapes video ka title typo fix karo ("Rectabngle"→"Rectangle")</li>
      <li>Har video mein description + proper tags daalo (SEO)</li>
      <li>4 Playlists banao: Body Parts / Colors / Numbers / Rhymes</li>
    </ul></div>
    <div class="action-item" style="border-left:3px solid var(--gold)"><div class="priority-chip chip-med">⭐ 30 Din</div><h4>Aglay Mahine</h4><ul>
      <li>1 long video + 2-3 Shorts per week — schedule lock karo</li>
      <li>Body Parts Part 2 banao (Face: Eyes, Ears, Nose)</li>
      <li>Animal Sounds Song — Cow, Dog, Cat, Lion, Elephant</li>
      <li>Channel mascot "Kido" design karo — har video mein same character</li>
    </ul></div>
    <div class="action-item" style="border-left:3px solid var(--green)"><div class="priority-chip chip-low">📈 3 Mahine</div><h4>Growth Targets</h4><ul>
      <li>${sub>=1000?'✅ 1K done! 4,000 watch hours achieve karo':'1,000 subscribers — monetization ke liye (abhi '+fmtFull(sub)+' hain)'}</li>
      <li>20+ videos complete karo — catalog = passive views</li>
      <li>Urdu nursery rhymes — untapped 200M+ audience</li>
      <li>Thumbnail A/B test — CTR improve karo</li>
    </ul></div>
    <div class="action-item" style="border-left:3px solid var(--accent3)"><div class="priority-chip" style="background:rgba(43,134,197,0.12);color:var(--accent3)">🚀 6 Mahine</div><h4>Big Vision</h4><ul>
      <li>10,000 subscribers — Channel Authority level</li>
      <li>50+ video library — algorithm ka pyara channel</li>
      <li>Pakistan ka #1 kids animation channel</li>
      <li>Brand deals: educational toys, apps — Rs. 50K-200K/deal</li>
    </ul></div>`;
}

function renderNextIdeas(videos) {
  const ideas=[
    {e:'🦷',t:'Body Parts Part 2 — Face & Senses',w:'Top video ka sequel — Eyes, Ears, Nose, Mouth song. Guaranteed views!',p:'high'},
    {e:'🐘',t:'Animal Sounds Song',w:'Cow, Dog, Cat, Lion, Elephant — global billion views wala proven formula!',p:'high'},
    {e:'📅',t:'Days of Week (English + Urdu)',w:'School curriculum — teachers aur moms actively search, share bhi karti hain.',p:'high'},
    {e:'🕌',t:'Eid Mubarak Song for Kids (Urdu)',w:'Pakistan-exclusive! Zero competition. Instant viral potential — 220M audience.',p:'high'},
    {e:'🍎',t:'Colors with Fruits Song',w:'Colors topic already kiya — fruits se fresh angle, double search traffic.',p:'med'},
    {e:'🌦️',t:'Weather Song — Sunny Rainy Cloudy',w:'Classroom mein teachers share karti hain — teacher network = organic viral!',p:'med'},
    {e:'👨‍👩‍👧',t:'Family Members Song (Mama, Baba, Dada)',w:'Pakistan mein family values strong — Urdu family song bilkul unique hoga.',p:'med'},
    {e:'🔢',t:'Numbers 1-20 Extended Version',w:'1-10 ka sequel — 5+ minutes, better watch time, aur already proven topic.',p:'low'},
  ];
  document.getElementById('nextIdeas').innerHTML=ideas.map(idea=>`
    <div class="idea-card">
      <div class="priority-chip ${idea.p==='high'?'chip-high':idea.p==='med'?'chip-med':'chip-low'}">${idea.p==='high'?'🔥 High Priority':idea.p==='med'?'⭐ Recommended':'✅ Good Idea'}</div>
      <h3>${idea.e} ${esc(idea.t)}</h3><p>${esc(idea.w)}</p>
    </div>`).join('');
}
