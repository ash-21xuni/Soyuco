// ===========================
// THEME
// ===========================

function setTheme(el) {
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  if (el && el.classList) el.classList.add('active');
  setThemeByName(el && el.dataset ? el.dataset.t : el);
}

function setThemeByName(name) {
  document.body.dataset.theme = name;
  localStorage.setItem('soyuco_theme', name);
  syncColorPickers();
  applyThemeCopy(name);
  renderQuote();
}

function applyThemeCopy(name) {
  const copy = THEME_COPY[name] || THEME_COPY.default;

  const ei = document.getElementById('emptyIcon');
  const et = document.getElementById('emptyTitle');
  if (ei) ei.textContent = copy.empty;
  if (et) et.textContent = copy.emptyTitle;

  const sc = document.getElementById('scheduleCardTitle');
  const tc = document.getElementById('tasksCardTitle');
  const hc = document.getElementById('habitsCardTitle');
  const qc = document.getElementById('quoteCardTitle');
  const ah = document.getElementById('aiHeroTitle');
  if (sc) sc.textContent = copy.schedule;
  if (tc) tc.textContent = copy.tasks;
  if (hc) hc.textContent = copy.habits;
  if (qc) qc.textContent = copy.quote;
  if (ah) ah.textContent = copy.aiTitle;
}

function toggleCustomizer() {
  document.getElementById('customizer').classList.toggle('open');
  syncColorPickers();
}

function syncColorPickers() {
  const s = getComputedStyle(document.body);
  const map = { '--bg': 'c-bg', '--surface': 'c-surface', '--text': 'c-text', '--accent': 'c-accent', '--border': 'c-border' };
  Object.entries(map).forEach(([v, id]) => {
    const raw = s.getPropertyValue(v).trim();
    const el  = document.getElementById(id);
    if (el) try { el.value = rgbToHex(raw); } catch (e) {}
  });
}

function applyCustomColor(varName, value) {
  document.body.style.setProperty(varName, value);
}

function applyCustomVar(varName, value) {
  document.body.style.setProperty(varName, value);
}

function rgbToHex(rgb) {
  if (rgb.startsWith('#')) return rgb;
  const r = rgb.match(/\d+/g);
  if (!r || r.length < 3) return '#000000';
  return '#' + r.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
}

function exportTheme() {
  const vars = [
    '--bg', '--bg2', '--bg3', '--surface', '--surface2', '--border',
    '--text', '--text2', '--text3', '--accent', '--accent2', '--accent3',
    '--font-display', '--font-body', '--font-ui', '--radius', '--sidebar-w',
  ];
  const s   = getComputedStyle(document.body);
  const css = `:root {\n${vars.map(v => `  ${v}: ${s.getPropertyValue(v).trim()};`).join('\n')}\n}`;
  const a   = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([css], { type: 'text/css' })),
    download: 'soyuco-theme.css',
  });
  a.click();
}

function importTheme() {
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.css' });
  input.onchange = e => {
    const reader = new FileReader();
    reader.onload = ev => {
      [...ev.target.result.matchAll(/--([\w-]+):\s*([^;]+);/g)].forEach(([, name, value]) => {
        document.body.style.setProperty('--' + name, value.trim());
      });
      alert('Theme imported!');
    };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
}
