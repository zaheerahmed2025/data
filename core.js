/* ═══════════════════════════════════════════════════
   RankIQ — Design System
   Theme: Dark Premium / Data-Forward / Tool-Grade
═══════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

:root {
  --bg:       #050508;
  --bg2:      #0A0A12;
  --surface:  #0D0D1A;
  --surface2: #121220;
  --surface3: #181828;
  --surface4: #1F1F35;
  --border:   rgba(255,255,255,0.06);
  --border2:  rgba(255,255,255,0.1);
  --text:     #EEEEFF;
  --text2:    #A8A8C8;
  --muted:    #5A5A80;
  --accent:   #7C5CFC;
  --accent2:  #FF4D9E;
  --accent3:  #00D4FF;
  --gold:     #FFD166;
  --green:    #06D6A0;
  --red:      #EF476F;
  --orange:   #FF9F1C;
  --sidebar-w: 240px;
  --header-h:  56px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 14px; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Instrument Sans', sans-serif;
  min-height: 100vh;
  display: flex;
  overflow-x: hidden;
}

/* Noise texture overlay */
body::before {
  content: '';
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  opacity: 0.4;
}

/* ════════════ SCROLLBAR ════════════ */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--surface4); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }

/* ════════════ SIDEBAR ════════════ */
#sidebar {
  width: var(--sidebar-w);
  min-height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0; top: 0; bottom: 0;
  z-index: 100;
  transition: transform 0.3s ease;
}

.sidebar-logo {
  padding: 20px 20px 16px;
  display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid var(--border);
}
.sl-icon { font-size: 28px; line-height: 1; }
.sl-name { font-family: 'Cabinet Grotesk', sans-serif; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
.sl-name span { color: var(--accent); }
.sl-tag { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; }

.sidebar-nav { padding: 12px 0; flex: 1; overflow-y: auto; }

.nav-section { padding: 16px 16px 6px; font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }

[data-page] {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; margin: 2px 8px;
  border-radius: 10px; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--text2);
  border: none; background: transparent; width: calc(100% - 16px);
  text-align: left; transition: all 0.15s;
}
[data-page]:hover { background: var(--surface3); color: var(--text); }
[data-page].is-active { background: rgba(124,92,252,0.15); color: var(--accent); border: 1px solid rgba(124,92,252,0.2); }
[data-page].is-active .nav-icon { filter: none; }
.nav-icon { font-size: 16px; flex-shrink: 0; }
.nav-badge { margin-left: auto; background: var(--accent); color: white; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 20px; }

.sidebar-bottom { border-top: 1px solid var(--border); padding: 16px; }
.quota-widget { }
.qw-header { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-bottom: 8px; }
.qw-bar { height: 4px; background: var(--surface3); border-radius: 4px; overflow: hidden; }
#quota-bar { height: 100%; background: linear-gradient(90deg, var(--green), var(--gold)); border-radius: 4px; width: 0%; transition: width 0.5s ease; }
#quota-text { font-size: 10px; color: var(--muted); margin-top: 4px; }

.api-key-btn {
  margin-top: 10px; width: 100%; padding: 8px; border-radius: 8px;
  background: var(--surface3); border: 1px solid var(--border);
  color: var(--text2); font-size: 12px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 6px;
}
.api-key-btn:hover { border-color: var(--accent); color: var(--accent); }

/* ════════════ MAIN CONTENT ════════════ */
#main {
  flex: 1;
  margin-left: var(--sidebar-w);
  min-height: 100vh;
  position: relative; z-index: 1;
}

.page { display: none; min-height: 100vh; }
.page.active { display: block; animation: pageIn 0.25s ease; }
@keyframes pageIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

.page-inner { max-width: 1280px; margin: 0 auto; padding: 36px 32px 60px; }

.page-head { margin-bottom: 32px; }
.page-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 6px; }
.grad { background: linear-gradient(135deg, var(--accent), var(--accent2), var(--accent3)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.page-sub { color: var(--text2); font-size: 15px; line-height: 1.5; }

/* ════════════ SETUP MODAL ════════════ */
#setup-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,0.92);
  backdrop-filter: blur(12px); z-index: 9000;
  display: none; align-items: center; justify-content: center; padding: 20px;
}
#setup-modal.visible { display: flex; animation: fadeIn 0.25s ease; }
.sm-box {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 24px; padding: 44px 40px;
  max-width: 520px; width: 100%; text-align: center;
  position: relative;
}
.sm-logo { font-size: 48px; margin-bottom: 8px; }
.sm-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 26px; font-weight: 900; margin-bottom: 8px; }
.sm-sub { color: var(--text2); font-size: 14px; margin-bottom: 28px; line-height: 1.6; }
.sm-input { width: 100%; background: var(--surface2); border: 1.5px solid var(--border2); border-radius: 12px; padding: 14px 18px; color: var(--text); font-family: 'Instrument Sans', sans-serif; font-size: 14px; outline: none; margin-bottom: 12px; transition: border-color 0.2s; }
.sm-input:focus { border-color: var(--accent); }
.sm-features { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 20px 0 24px; text-align: left; }
.sm-feat { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); padding: 6px; }
.sm-feat::before { content: '✓'; color: var(--green); font-weight: 700; }
.sm-guide-link { color: var(--accent3); font-size: 13px; cursor: pointer; text-decoration: none; display: block; margin-top: 14px; }
.sm-guide-link:hover { text-decoration: underline; }

/* API Guide */
#api-guide {
  position: fixed; inset: 0; background: rgba(0,0,0,0.92);
  backdrop-filter: blur(12px); z-index: 9100;
  display: none; align-items: center; justify-content: center; padding: 20px;
}
#api-guide.visible { display: flex; }
.ag-box {
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 24px; padding: 36px; max-width: 560px; width: 100%;
  max-height: 90vh; overflow-y: auto;
}
.ag-box h2 { font-family: 'Cabinet Grotesk', sans-serif; font-size: 22px; font-weight: 900; margin-bottom: 20px; }
.steps-list { }
.step-item { display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.step-item:last-child { border: none; }
.step-num { width: 30px; height: 30px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.step-text { font-size: 13px; color: var(--text2); line-height: 1.7; }
.step-text strong { color: var(--text); }
.step-text a { color: var(--accent3); }
.guide-note { background: rgba(255,209,102,0.08); border: 1px solid rgba(255,209,102,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: var(--text2); margin: 20px 0; }
.guide-note strong { color: var(--gold); }

/* ════════════ BUTTONS ════════════ */
.btn-primary {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border: none; border-radius: 12px; padding: 12px 24px;
  color: white; font-family: 'Cabinet Grotesk', sans-serif;
  font-size: 14px; font-weight: 800; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px;
  transition: all 0.2s; white-space: nowrap; letter-spacing: 0.2px;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,92,252,0.4); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-primary.btn-lg { padding: 16px 36px; font-size: 16px; border-radius: 14px; }

.btn-ghost-sm {
  background: var(--surface3); border: 1px solid var(--border);
  border-radius: 8px; padding: 6px 14px; color: var(--text2);
  font-family: 'Instrument Sans', sans-serif; font-size: 12px;
  font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-ghost-sm:hover { border-color: var(--accent); color: var(--accent); }
.btn-ghost-sm.btn-saved { border-color: var(--green); color: var(--green); background: rgba(6,214,160,0.08); }

.btn-danger { background: rgba(239,71,111,0.12); border: 1px solid rgba(239,71,111,0.25); border-radius: 10px; padding: 9px 18px; color: var(--red); font-size: 13px; cursor: pointer; transition: all 0.2s; }
.btn-danger:hover { background: rgba(239,71,111,0.2); }

.copy-btn { background: var(--surface3); border: 1px solid var(--border); border-radius: 7px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: var(--text2); cursor: pointer; transition: all 0.2s; flex-shrink: 0; white-space: nowrap; }
.copy-btn:hover { border-color: var(--green); color: var(--green); }

.del-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 13px; padding: 4px 8px; border-radius: 6px; transition: all 0.2s; flex-shrink: 0; }
.del-btn:hover { color: var(--red); background: rgba(239,71,111,0.1); }

/* ════════════ SEARCH BAR ════════════ */
.search-bar-wrap { margin-bottom: 28px; }
.search-bar {
  display: flex; gap: 10px; align-items: center;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 14px; padding: 8px 8px 8px 16px;
  transition: border-color 0.2s;
}
.search-bar:focus-within { border-color: rgba(124,92,252,0.4); }
.sb-icon { font-size: 18px; flex-shrink: 0; }
.sb-input { flex: 1; background: none; border: none; outline: none; color: var(--text); font-family: 'Instrument Sans', sans-serif; font-size: 14px; min-width: 0; }
.sb-input::placeholder { color: var(--muted); }
.sb-select { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--text2); font-size: 13px; cursor: pointer; outline: none; }
.sb-btn { background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; border-radius: 10px; padding: 10px 20px; color: white; font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px; font-weight: 800; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.sb-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,92,252,0.4); }

.quick-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.qr-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
.q-chip { background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--text2); cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.q-chip:hover { border-color: var(--accent3); color: var(--accent3); }
.kw-chip { background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.25); border-radius: 20px; padding: 5px 12px; font-size: 12px; color: var(--accent); cursor: pointer; transition: all 0.2s; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }

/* ════════════ STAT CARDS ════════════ */
.stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
.stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 16px; padding: 18px 16px; text-align: center; transition: border-color 0.2s;
}
.stat-card:hover { border-color: var(--border2); }
.sc-icon { font-size: 22px; margin-bottom: 8px; }
.sc-val { font-family: 'Cabinet Grotesk', sans-serif; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
.sc-sub { font-size: 10px; color: var(--muted); margin: 2px 0; }
.sc-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

/* ════════════ TABS ════════════ */
.tab-bar { display: flex; gap: 4px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 4px; margin-bottom: 20px; overflow-x: auto; flex-wrap: nowrap; }
.tab-bar::-webkit-scrollbar { height: 0; }
.tab { flex-shrink: 0; background: none; border: none; border-radius: 9px; padding: 9px 16px; color: var(--muted); font-family: 'Instrument Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.tab:hover { color: var(--text2); }
.tab.active { background: var(--surface3); color: var(--text); }
.tab-panel { display: none; }
.tab-panel.active { display: block; animation: fadeIn 0.2s ease; }

/* ════════════ CHANNEL CARDS ════════════ */
.results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.ch-result-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 18px; padding: 20px; cursor: pointer; transition: all 0.2s;
  animation: fadeUp 0.35s ease both;
}
.ch-result-card:hover { transform: translateY(-3px); border-color: rgba(124,92,252,0.3); box-shadow: 0 12px 40px rgba(124,92,252,0.08); }
.crc-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px; }
.crc-img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; background: var(--surface3); flex-shrink: 0; }
.crc-name { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 800; margin-bottom: 2px; line-height: 1.3; }
.crc-handle { font-size: 11px; color: var(--muted); margin-bottom: 6px; }
.size-label { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
.crc-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.crc-stat { background: var(--surface2); border-radius: 10px; padding: 10px 8px; text-align: center; }
.crs-val { font-family: 'Cabinet Grotesk', sans-serif; font-size: 16px; font-weight: 800; color: var(--gold); }
.crs-lbl { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
.crc-desc { font-size: 12px; color: var(--muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.crc-footer { margin-top: 12px; font-size: 12px; color: var(--accent3); font-weight: 700; opacity: 0; transition: opacity 0.2s; }
.ch-result-card:hover .crc-footer { opacity: 1; }

/* ════════════ CHANNEL DETAIL ════════════ */
.ch-detail { }
.chd-header { display: flex; gap: 24px; align-items: flex-start; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 28px 24px; margin-bottom: 20px; }
.chd-avatar { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid var(--surface3); flex-shrink: 0; }
.chd-info { flex: 1; min-width: 0; }
.chd-name { font-family: 'Cabinet Grotesk', sans-serif; font-size: 26px; font-weight: 900; line-height: 1.1; margin-bottom: 4px; }
.chd-handle { font-size: 13px; color: var(--muted); margin-bottom: 8px; }
.chd-desc { font-size: 13px; color: var(--text2); line-height: 1.6; margin-bottom: 12px; }
.chd-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.chd-score-block { text-align: center; flex-shrink: 0; }
.csb-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.csb-grade { font-size: 12px; color: var(--text2); margin-top: 6px; }

/* Score breakdown */
.score-breakdown { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.section-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 14px; color: var(--text2); }
.sb-row { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.sb-row:last-child { border: none; }
.sb-label { font-size: 13px; color: var(--text2); width: 180px; flex-shrink: 0; }
.sb-val { font-family: 'Cabinet Grotesk', sans-serif; font-size: 18px; font-weight: 900; width: 40px; text-align: right; flex-shrink: 0; }
.progress-bar { flex: 1; height: 6px; background: var(--surface3); border-radius: 6px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 6px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
.diff-bar-wrap { display: flex; align-items: center; }
.diff-bar { flex: 1; height: 6px; background: var(--surface3); border-radius: 6px; overflow: hidden; }

/* Analysis grid */
.analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.analysis-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
.ac-wide { grid-column: 1 / -1; }
.ac-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 800; margin-bottom: 14px; }
.metric-list { }
.ml-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--text2); }
.ml-row:last-child { border: none; }
.ml-row strong { color: var(--text); }
.top-vid-row { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; border-radius: 8px; }
.top-vid-row:last-child { border: none; }
.top-vid-row:hover { background: var(--surface2); }
.tvr-thumb { width: 64px; height: 48px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.tvr-info { flex: 1; min-width: 0; }
.tvr-title { font-size: 12px; font-weight: 600; line-height: 1.4; margin-bottom: 4px; }
.tvr-meta { font-size: 11px; color: var(--muted); }
.opp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.opp-item { background: var(--surface2); border-radius: 12px; padding: 14px; }
.oi-icon { font-size: 20px; margin-bottom: 6px; }
.oi-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
.oi-desc { font-size: 12px; color: var(--text2); line-height: 1.5; }

/* Sort bar */
.sort-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.sort-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: var(--text2); cursor: pointer; transition: all 0.15s; }
.sort-btn.active { background: rgba(124,92,252,0.15); border-color: rgba(124,92,252,0.3); color: var(--accent); }

/* ════════════ VIDEO GRID ════════════ */
.video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.video-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; cursor: pointer; transition: all 0.2s; animation: fadeUp 0.3s ease both; }
.video-card:hover { transform: translateY(-3px); border-color: rgba(255,209,102,0.2); }
.vc-thumb-wrap { position: relative; aspect-ratio: 16/9; background: var(--surface2); }
.vc-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.vc-dur { position: absolute; bottom: 7px; right: 7px; background: rgba(0,0,0,0.88); color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 5px; }
.vc-rank { position: absolute; top: 7px; left: 7px; background: var(--gold); color: #111; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 5px; font-family: 'Cabinet Grotesk', sans-serif; }
.vc-grade { position: absolute; top: 7px; right: 7px; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 5px; font-family: 'Cabinet Grotesk', sans-serif; }
.vc-info { padding: 12px; }
.vc-title { font-size: 12px; font-weight: 600; line-height: 1.4; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.vc-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
.vc-meta span { font-size: 11px; color: var(--text2); }
.vc-er { font-size: 11px; font-weight: 600; }

/* ════════════ IDEAS ════════════ */
.ideas-banner { background: linear-gradient(135deg, rgba(124,92,252,0.08), rgba(255,77,158,0.08)); border: 1px solid rgba(124,92,252,0.15); border-radius: 12px; padding: 14px 18px; font-size: 13px; color: var(--text2); margin-bottom: 20px; }
.ideas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.idea-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; cursor: pointer; transition: all 0.2s; }
.idea-card:hover { transform: translateY(-3px); border-color: rgba(124,92,252,0.3); }
.ic-priority { display: inline-block; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
.icp-high { background: rgba(239,71,111,0.12); color: var(--red); }
.icp-med { background: rgba(255,209,102,0.12); color: var(--gold); }
.icp-low { background: rgba(6,214,160,0.12); color: var(--green); }
.ic-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; font-weight: 800; margin-bottom: 8px; line-height: 1.3; }
.ic-why { font-size: 12px; color: var(--text2); line-height: 1.6; margin-bottom: 10px; }
.ic-cta { font-size: 11px; color: var(--accent3); font-weight: 700; }

/* SEO Modal */
.seo-modal { }
.sm-why { background: rgba(255,209,102,0.06); border: 1px solid rgba(255,209,102,0.15); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: var(--text2); margin-bottom: 20px; line-height: 1.6; }
.sm-section { margin-bottom: 20px; }
.sm-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 10px; }
.sm-copy-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; font-size: 13px; line-height: 1.6; color: var(--text); margin-bottom: 8px; position: relative; display: flex; align-items: flex-start; gap: 12px; }
.sm-best { border-color: rgba(255,209,102,0.3); background: rgba(255,209,102,0.04); }
.sm-desc { white-space: pre-wrap; font-family: 'Instrument Sans', sans-serif; font-size: 12px; line-height: 1.7; color: var(--text2); flex: 1; }
.best-badge { background: var(--gold); color: #111; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 4px; flex-shrink: 0; align-self: flex-start; margin-top: 2px; }
.scr-text { flex: 1; }

/* ════════════ KEYWORD PAGE ════════════ */
.tracked-kws { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 14px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
.kwo-overview, .kw-overview { display: flex; gap: 24px; align-items: flex-start; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 24px; margin-bottom: 20px; }
.kwo-main { flex: 1; }
.kwo-keyword { font-family: 'Cabinet Grotesk', sans-serif; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 6px; }
.kwo-meta { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
.kwo-scores { display: flex; gap: 16px; flex-shrink: 0; }
.kws-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; text-align: center; min-width: 100px; }
.kws-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.kws-val { font-family: 'Cabinet Grotesk', sans-serif; font-size: 28px; font-weight: 900; margin-bottom: 4px; }
.kw-diff-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.kw-related { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; }
.kwr-item { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; }
.kwr-item:hover { border-color: var(--accent); }
.kwr-icon { font-size: 14px; }
.kwr-text { flex: 1; font-size: 13px; }
.kwr-arrow { color: var(--muted); font-size: 14px; }

/* ════════════ SEO PAGE ════════════ */
.seo-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
.seo-main { }
.seo-form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 24px; margin-bottom: 20px; }
.seo-sidebar { position: sticky; top: 24px; }
.ss-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
.ss-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px; font-weight: 800; margin-bottom: 12px; color: var(--text2); }
.sh-item { padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; transition: all 0.15s; }
.sh-item:last-child { border: none; }
.sh-item:hover { padding-left: 4px; }
.shi-topic { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.shi-date { font-size: 11px; color: var(--muted); }
.tip-list { }
.tip-item { font-size: 12px; color: var(--text2); padding: 8px 0; border-bottom: 1px solid var(--border); line-height: 1.5; }
.tip-item:last-child { border: none; }

.seo-result { }
.seo-section { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
.seo-sec-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; font-weight: 800; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.seo-copy-row { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; font-size: 13px; line-height: 1.6; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 12px; }
.scr-best { border-color: rgba(255,209,102,0.3); background: rgba(255,209,102,0.04); }
.seo-desc-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
.seo-desc-box pre { white-space: pre-wrap; font-family: 'Instrument Sans', sans-serif; font-size: 12px; line-height: 1.7; color: var(--text2); }

.trend-insight { background: var(--surface); border: 1px solid rgba(255,209,102,0.15); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
.ti-title { font-size: 13px; font-weight: 700; color: var(--gold); margin-bottom: 14px; }
.ti-videos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.tiv-item { display: flex; gap: 10px; cursor: pointer; transition: all 0.15s; }
.tiv-item:hover { opacity: 0.8; }
.tiv-thumb { width: 60px; height: 45px; object-fit: cover; border-radius: 7px; flex-shrink: 0; }
.tiv-title { font-size: 12px; font-weight: 600; line-height: 1.4; margin-bottom: 2px; }
.tiv-views { font-size: 11px; color: var(--muted); }

/* ════════════ TRENDING ════════════ */
.filter-row { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; }
.filter-group { }
.form-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; display: block; margin-bottom: 6px; }
.form-input { background: var(--surface2); border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; color: var(--text); font-family: 'Instrument Sans', sans-serif; font-size: 13px; outline: none; width: 100%; transition: border-color 0.2s; }
.form-input:focus { border-color: var(--accent); }
select.form-input { cursor: pointer; }
.form-row { display: flex; gap: 12px; }
.form-group { flex: 1; }

.trending-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 13px; color: var(--text2); }
.trending-list { display: flex; flex-direction: column; gap: 12px; }
.tr-item { display: flex; gap: 16px; align-items: flex-start; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; transition: all 0.2s; }
.tr-item:hover { border-color: rgba(124,92,252,0.2); }
.tri-rank { font-family: 'Cabinet Grotesk', sans-serif; font-size: 22px; font-weight: 900; color: var(--surface4); width: 36px; flex-shrink: 0; text-align: center; padding-top: 2px; }
.tr-item:nth-child(1) .tri-rank { color: var(--gold); }
.tr-item:nth-child(2) .tri-rank { color: #aaa; }
.tr-item:nth-child(3) .tri-rank { color: #cd7f32; }
.tri-thumb { width: 140px; height: 80px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
.tri-info { flex: 1; min-width: 0; }
.tri-title { font-size: 14px; font-weight: 700; line-height: 1.4; margin-bottom: 6px; cursor: pointer; }
.tri-title:hover { color: var(--accent); }
.tri-channel { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
.tri-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tri-stats { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; min-width: 100px; }
.tris-row { font-size: 12px; color: var(--text2); }
.tris-row strong { color: var(--text); }
.tri-actions { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }

/* ════════════ COMPARE ════════════ */
.compare-layout { display: grid; grid-template-columns: 1fr 80px 1fr; gap: 16px; align-items: start; }
.cmp-input-box { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
.cib-label { font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; font-weight: 800; margin-bottom: 12px; color: var(--text2); }
.cmp-found-ch { margin-top: 12px; }
.cmp-header-bar { display: flex; align-items: center; gap: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 24px; margin-bottom: 20px; }
.chb-ch { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; }
.chb-score { margin-top: 8px; }
.chb-vs { text-align: center; flex-shrink: 0; }
.chb-winner { font-size: 11px; color: var(--gold); font-weight: 700; margin-top: 4px; }
.cmp-table { width: 100%; border-collapse: collapse; background: var(--surface); font-size: 13px; }
.cmp-table th { background: var(--surface2); padding: 14px 20px; text-align: left; font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px; font-weight: 800; }
.th-win { color: var(--gold); }
.cmp-table td { padding: 12px 20px; border-top: 1px solid var(--border); }
.cmp-table tr:hover td { background: var(--surface2); }
.win { color: var(--green); font-weight: 800; }
.lose { color: var(--muted); }
.cmp-insights { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.ci-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
.ci-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; font-weight: 800; margin-bottom: 8px; }
.ci-card p { font-size: 13px; color: var(--text2); line-height: 1.6; }

/* ════════════ CHANNEL MINI ════════════ */
.ch-mini { display: flex; align-items: center; gap: 12px; }
.ch-mini-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; background: var(--surface3); flex-shrink: 0; }
.ch-mini-name { font-size: 14px; font-weight: 700; line-height: 1.3; }
.ch-mini-stat { font-size: 12px; color: var(--muted); }

/* ════════════ SAVED PAGE ════════════ */
.saved-list { display: flex; flex-direction: column; gap: 8px; }
.sl-item { display: flex; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; transition: all 0.2s; }
.sl-item:hover { border-color: var(--border2); }
.sl-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.sl-info { flex: 1; min-width: 0; }
.sl-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.sl-meta { font-size: 12px; color: var(--muted); }
.kw-icon { width: 40px; height: 40px; background: var(--surface3); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.note-add { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; margin-bottom: 16px; }
.note-item { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 10px; }
.ni-text { font-size: 13px; line-height: 1.7; flex: 1; color: var(--text2); }
.ni-meta { font-size: 11px; color: var(--muted); margin-top: 8px; }

/* ════════════ DASHBOARD ════════════ */
.feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 32px; }
.feature-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; transition: all 0.2s; }
.feature-card:hover { transform: translateY(-3px); border-color: rgba(124,92,252,0.25); }
.fc-icon { font-size: 32px; margin-bottom: 12px; }
.fc-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 6px; }
.fc-desc { font-size: 13px; color: var(--text2); line-height: 1.6; }
.dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.dash-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; font-weight: 800; }
.panel-btn { background: var(--surface3); border: 1px solid var(--border); border-radius: 8px; padding: 5px 12px; font-size: 12px; color: var(--text2); cursor: pointer; transition: all 0.15s; }
.panel-btn:hover { border-color: var(--accent); color: var(--accent); }
.dash-row { display: flex; align-items: center; gap: 12px; padding: 9px 8px; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
.dash-row:hover { background: var(--surface2); }
.dr-img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: var(--surface3); }
.dr-info { flex: 1; min-width: 0; }
.dr-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dr-sub { font-size: 11px; color: var(--muted); }
.dr-arrow { color: var(--muted); font-size: 13px; flex-shrink: 0; }

/* ════════════ TAGS ════════════ */
.tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-pill { background: var(--surface3); border: 1px solid var(--border); border-radius: 20px; padding: 5px 14px; font-size: 12px; color: var(--text2); cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 4px; }
.tag-pill:hover { background: rgba(0,212,255,0.1); border-color: var(--accent3); color: var(--accent3); }
.tag-hot { border-color: rgba(255,209,102,0.3); color: var(--gold); }
.tag-hot:hover { background: rgba(255,209,102,0.1); }
.hot-dot { color: var(--red); font-size: 8px; margin-left: 2px; }

/* ════════════ LOADING / EMPTY ════════════ */
.loader-wrap { text-align: center; padding: 60px 24px; }
.loader-ring { width: 48px; height: 48px; border: 3px solid var(--surface3); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
.loading-mini { color: var(--muted); font-size: 13px; padding: 20px 0; }
.loader-msg { color: var(--muted); font-size: 13px; }
.empty-state { text-align: center; padding: 60px 24px; }
.es-icon { font-size: 48px; margin-bottom: 14px; opacity: 0.5; }
.es-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 6px; color: var(--text2); }
.es-sub { font-size: 13px; color: var(--muted); }
.error-box { background: rgba(239,71,111,0.08); border: 1px solid rgba(239,71,111,0.2); border-radius: 12px; padding: 16px 20px; color: var(--red); font-size: 13px; margin: 16px 0; }

/* SEO panel in channel */
.seo-panel-wrap { }
.seo-panel-intro { background: rgba(124,92,252,0.06); border: 1px solid rgba(124,92,252,0.15); border-radius: 12px; padding: 14px 18px; font-size: 13px; color: var(--text2); margin-bottom: 16px; line-height: 1.6; }

/* ════════════ ANIMATIONS ════════════ */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes fadeOut { to { opacity:0; } }
@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
@keyframes toastOut { to { opacity:0; transform:translateX(20px); } }

/* ════════════ RESPONSIVE ════════════ */
@media (max-width: 1024px) {
  .seo-layout { grid-template-columns: 1fr; }
  .analysis-grid { grid-template-columns: 1fr; }
  .dash-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  :root { --sidebar-w: 0px; }
  #sidebar { transform: translateX(-240px); width: 240px; }
  #sidebar.open { transform: translateX(0); }
  #main { margin-left: 0; }
  .compare-layout { grid-template-columns: 1fr; }
  .kwo-overview, .kw-overview { flex-direction: column; }
  .kwo-scores { flex-wrap: wrap; }
  .stats-row { grid-template-columns: repeat(2,1fr); }
  .chd-header { flex-direction: column; }
  .ti-videos { grid-template-columns: 1fr; }
  .cmp-insights { grid-template-columns: 1fr; }
  .opp-grid { grid-template-columns: 1fr; }
  .page-inner { padding: 20px 16px 40px; }
  #sidebar-toggle { display: flex; }
}
@media (max-width: 480px) {
  .form-row { flex-direction: column; }
  .results-grid { grid-template-columns: 1fr; }
  .video-grid { grid-template-columns: 1fr; }
  .ideas-grid { grid-template-columns: 1fr; }
}
