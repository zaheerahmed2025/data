// ═══════════════════════════════════════════════════════════
//  RankIQ — UI Layer
//  Router, Components, Toast, Sidebar, Global UI
// ═══════════════════════════════════════════════════════════

// ─── Router ───────────────────────────────────────────────
const Router = (() => {
  let _current = null;
  let _routes = {};

  const register = (name, initFn) => { _routes[name] = initFn; };

  const go = (name, params = {}) => {
    $$('.page').forEach(p => p.classList.remove('active'));
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    const page = $('page-' + name);
    if (!page) return;
    page.classList.add('active');
    const navItem = $(name + '-nav');
    if (navItem) navItem.classList.add('active');
    // Update sidebar active
    $$('[data-page]').forEach(el => el.classList.toggle('is-active', el.dataset.page === name));
    _current = name;
    if (_routes[name]) _routes[name](params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Track navigation history
    RankIQ.store.set('last_page', name);
  };

  const current = () => _current;
  return { register, go, current };
})();

// ─── Toast ────────────────────────────────────────────────
const Toast = (() => {
  let container;
  const init = () => {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none';
    document.body.appendChild(container);
  };
  const show = (msg, type = 'info', duration = 3500) => {
    if (!container) init();
    const icons = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
    const colors = { success:'#06D6A0', error:'#EF476F', info:'#2B86C5', warning:'#FFD166' };
    const t = document.createElement('div');
    t.style.cssText = `background:#0D0D1A;border:1px solid ${colors[type]}33;border-left:3px solid ${colors[type]};
      border-radius:10px;padding:12px 18px;font-size:13px;font-weight:500;color:#F0F0FF;
      display:flex;align-items:center;gap:10px;pointer-events:all;cursor:pointer;
      box-shadow:0 8px 32px rgba(0,0,0,0.5);min-width:260px;max-width:360px;
      animation:toastIn 0.25s ease;`;
    t.innerHTML = `<span style="color:${colors[type]};font-size:16px;flex-shrink:0">${icons[type]}</span><span>${RankIQ.esc(msg)}</span>`;
    t.onclick = () => dismiss(t);
    container.appendChild(t);
    setTimeout(() => dismiss(t), duration);
    return t;
  };
  const dismiss = (el) => {
    el.style.animation = 'toastOut 0.2s ease forwards';
    setTimeout(() => el.remove(), 200);
  };
  return { show };
})();

// ─── Modal ────────────────────────────────────────────────
const Modal = (() => {
  const open = (content, opts = {}) => {
    let overlay = $('modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:5000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease';
      document.body.appendChild(overlay);
      overlay.onclick = e => { if(e.target===overlay) close(); };
    }
    overlay.style.display = 'flex';
    const maxW = opts.wide ? '900px' : opts.small ? '400px' : '640px';
    overlay.innerHTML = `
      <div style="background:#0D0D1A;border:1px solid rgba(255,255,255,0.08);border-radius:20px;width:100%;max-width:${maxW};max-height:90vh;overflow-y:auto;position:relative;animation:slideUp 0.25s ease">
        ${opts.title ? `<div style="display:flex;justify-content:space-between;align-items:center;padding:24px 28px 0"><h2 style="font-family:'Cabinet Grotesk',sans-serif;font-size:20px;font-weight:800">${opts.title}</h2><button onclick="Modal.close()" style="background:rgba(255,255,255,0.06);border:none;color:#888;font-size:18px;cursor:pointer;padding:6px 10px;border-radius:8px;line-height:1">✕</button></div>` : ''}
        <div style="padding:${opts.title?'20px 28px 28px':'28px'}">${content}</div>
      </div>`;
  };
  const close = () => {
    const overlay = $('modal-overlay');
    if (overlay) { overlay.style.animation = 'fadeOut 0.15s ease forwards'; setTimeout(()=>overlay.style.display='none',150); }
  };
  return { open, close };
})();

// ─── UI Components ────────────────────────────────────────
const UI = {

  // Stat card
  statCard: (icon, val, label, sub='', accent='var(--gold)') => `
    <div class="stat-card">
      <div class="sc-icon">${icon}</div>
      <div class="sc-val" style="color:${accent}">${val}</div>
      ${sub ? `<div class="sc-sub">${sub}</div>` : ''}
      <div class="sc-label">${label}</div>
    </div>`,

  // Score ring
  scoreRing: (score, size=80, color='var(--accent)') => {
    const r = (size/2)-8; const circ = 2*Math.PI*r;
    const dash = circ * (score/100);
    return `<svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
        stroke-dasharray="${dash} ${circ}" stroke-linecap="round" style="transition:stroke-dasharray 1s ease"/>
      <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="middle"
        style="transform:rotate(90deg) translate(0,-${size/2}px);transform-origin:center;fill:${color};font-size:${size<60?'12':'16'}px;font-weight:800;font-family:'Cabinet Grotesk',sans-serif">${score}</text>
    </svg>`;
  },

  // Progress bar
  bar: (val, max=100, color='var(--accent)') => {
    const pct = Math.min(100, (val/max)*100);
    return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>`;
  },

  // Gradient bar (for difficulty)
  diffBar: (score) => {
    const color = score>80?'#EF476F':score>60?'#FF9F1C':score>40?'#FFD166':score>20?'#06D6A0':'#2EC4B6';
    return `<div class="diff-bar-wrap">
      <div class="diff-bar"><div style="width:${score}%;background:${color};height:100%;border-radius:4px;transition:width 1s ease"></div></div>
      <span style="color:${color};font-size:12px;font-weight:700;margin-left:8px">${score}</span>
    </div>`;
  },

  // Channel mini card
  channelMini: (ch, onclick='') => {
    const s = ch.statistics, sn = ch.snippet;
    return `<div class="ch-mini" onclick="${onclick}" style="cursor:${onclick?'pointer':'default'}">
      <img src="${RankIQ.esc(sn.thumbnails?.default?.url||sn.thumbnails?.medium?.url||'')}" alt="" class="ch-mini-img" onerror="this.style.background='#1a1a2e'">
      <div class="ch-mini-info">
        <div class="ch-mini-name">${RankIQ.esc(sn.title)}</div>
        <div class="ch-mini-stat">👥 ${RankIQ.fmt(s.subscriberCount)} · 🎬 ${RankIQ.fmt(s.videoCount)}</div>
      </div>
    </div>`;
  },

  // Video card
  videoCard: (v, rank=null, onclick='') => {
    const sn = v.snippet, s = v.statistics;
    const score = RankIQ.scoreVideo(v);
    const thumb = sn.thumbnails?.medium?.url||sn.thumbnails?.high?.url||sn.thumbnails?.default?.url||'';
    const gradeColor = {A:'#06D6A0',B:'#2B86C5',C:'#FFD166',D:'#FF9F1C',F:'#EF476F'}[score.grade]||'#888';
    return `<div class="video-card" onclick="${onclick||`window.open('https://youtube.com/watch?v=${v.id}','_blank')`}">
      <div class="vc-thumb-wrap">
        <img src="${RankIQ.esc(thumb)}" alt="" class="vc-thumb" loading="lazy" onerror="this.style.background='#1a1a2e'">
        <div class="vc-dur">${RankIQ.fmtDur(v.contentDetails?.duration)}</div>
        ${rank ? `<div class="vc-rank">#${rank}</div>` : ''}
        <div class="vc-grade" style="background:${gradeColor}20;color:${gradeColor};border:1px solid ${gradeColor}40">${score.grade}</div>
      </div>
      <div class="vc-info">
        <div class="vc-title">${RankIQ.esc(sn.title)}</div>
        <div class="vc-meta">
          <span>👁 ${RankIQ.fmt(s?.viewCount)}</span>
          <span>👍 ${RankIQ.fmt(s?.likeCount)}</span>
          <span>${RankIQ.ago(sn.publishedAt)}</span>
        </div>
        <div class="vc-er" style="color:${gradeColor}">⚡ ${score.engagementRate}% engagement</div>
      </div>
    </div>`;
  },

  // Loading spinner
  loading: (msg='Loading...') => `<div class="loader-wrap"><div class="loader-ring"></div><div class="loader-msg">${msg}</div></div>`,

  // Empty state
  empty: (icon, title, sub='') => `<div class="empty-state"><div class="es-icon">${icon}</div><div class="es-title">${title}</div>${sub?`<div class="es-sub">${sub}</div>`:''}</div>`,

  // Tag pill
  tag: (text, color='var(--muted)', bg='rgba(255,255,255,0.06)') =>
    `<span class="tag-pill" style="color:${color};background:${bg}">${RankIQ.esc(text)}</span>`,

  // Copy button
  copyBtn: (text, label='Copy') =>
    `<button class="copy-btn" onclick="UI.copy(this, ${JSON.stringify(text)})">${label}</button>`,

  copy: (btn, text) => {
    navigator.clipboard.writeText(text).then(() => {
      const old = btn.innerHTML;
      btn.innerHTML = '✓ Copied'; btn.style.color = 'var(--green)';
      setTimeout(() => { btn.innerHTML = old; btn.style.color = ''; }, 2000);
    }).catch(() => Toast.show('Copy failed — please copy manually', 'error'));
  },

  // Difficulty badge
  diffBadge: (diff) => {
    const label = diff>80?'Very Hard':diff>60?'Hard':diff>40?'Medium':diff>20?'Easy':'Very Easy';
    const color = diff>80?'#EF476F':diff>60?'#FF9F1C':diff>40?'#FFD166':diff>20?'#06D6A0':'#2EC4B6';
    return `<span style="background:${color}20;color:${color};border:1px solid ${color}40;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700">${label}</span>`;
  },

  // Grade badge
  gradeBadge: (grade) => {
    const color = {A:'#06D6A0',B:'#2B86C5',C:'#FFD166',D:'#FF9F1C',F:'#EF476F'}[grade]||'#888';
    return `<span style="background:${color}20;color:${color};border:1px solid ${color}40;border-radius:6px;padding:2px 10px;font-size:13px;font-weight:800">${grade}</span>`;
  },
};

// ─── Sidebar ──────────────────────────────────────────────
const Sidebar = (() => {
  const updateQuota = () => {
    const q = RankIQ.getQuota();
    const el = $('quota-bar');
    const txt = $('quota-text');
    if (el) el.style.width = q.pct + '%';
    if (txt) txt.textContent = `${q.used.toLocaleString()} / 10,000 units`;
  };

  const init = () => {
    RankIQ.on('quotaUpdate', updateQuota);
    updateQuota();
    // Mobile toggle
    const toggle = $('sidebar-toggle');
    const sidebar = $('sidebar');
    if (toggle && sidebar) {
      toggle.onclick = () => sidebar.classList.toggle('open');
    }
  };

  return { init, updateQuota };
})();

// ─── Global helpers ───────────────────────────────────────
const debounce = (fn, ms=300) => { let t; return (...a) => { clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
const throttle = (fn, ms=300) => { let last=0; return (...a) => { const now=Date.now(); if(now-last>ms){last=now;fn(...a);} }; };

// Format $ revenue
const fmtRevenue = (n) => n>=1e6?'$'+(n/1e6).toFixed(1)+'M':n>=1e3?'$'+(n/1e3).toFixed(1)+'K':'$'+n;

// Channel size label
const channelSizeLabel = (subs) => {
  const n = parseInt(subs)||0;
  if (n>50e6) return { label:'Mega Creator', color:'#FFD166' };
  if (n>10e6) return { label:'Top Creator', color:'#FF9F1C' };
  if (n>1e6)  return { label:'Large Channel', color:'#06D6A0' };
  if (n>100e3)return { label:'Growing Channel', color:'#2B86C5' };
  if (n>10e3) return { label:'Small Channel', color:'#CE93D8' };
  return { label:'Starter', color:'#888' };
};

// Run when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Sidebar.init();

  // Restore last page
  const lastPage = RankIQ.store.get('last_page') || 'dashboard';
  if (RankIQ.hasKey()) {
    Router.go(lastPage);
  } else {
    Router.go('dashboard');
    setTimeout(() => {
      if (!RankIQ.hasKey()) $('setup-modal')?.classList.add('visible');
    }, 400);
  }

  // Keyboard shortcut: Ctrl+K = search
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const si = $('global-search');
      if (si) { Router.go('research'); si.focus(); }
    }
  });
});
