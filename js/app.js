// ===========================
// INIT
// ===========================

function init() {
  updateDate();
  renderEntryList();
  renderCollectionsSidebar();
  renderPlanner();
  renderMoodChart();
  renderAiInsights();
  document.getElementById('entryCount').textContent = entries.length;
  setInterval(updateDate, 60000);
}

function updateDate() {
  document.getElementById('sidebarDate').textContent = new Date()
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();
}

// ===========================
// VIEW SWITCHING
// ===========================

function switchView(btn) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn && btn.classList) btn.classList.add('active');

  const viewId = btn && btn.dataset ? btn.dataset.view : btn;
  currentView = viewId;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + viewId).classList.add('active');

  const titles = { journal: 'Journal', planner: 'Day Planner', ai: 'AI Day Planner', budget: 'Budget Planner' };
  document.getElementById('topbarTitle').textContent = titles[viewId] || viewId;
  document.getElementById('newBtn').style.display = viewId === 'journal' ? 'flex' : 'none';

  if (viewId === 'planner') renderPlanner();
  if (viewId === 'ai')      renderAiInsights();
  if (viewId === 'budget')  renderBudget();
}

// ===========================
// ACCOUNT MENU
// ===========================

function toggleAccountMenu() {
  const m = document.getElementById('accountMenu');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', function (e) {
  const area = document.getElementById('accountArea');
  if (area && !area.contains(e.target)) {
    document.getElementById('accountMenu').style.display = 'none';
  }
});

// ===========================
// LOAD — restore saved theme
// ===========================

const savedTheme = localStorage.getItem('soyuco_theme');
if (savedTheme) {
  document.body.dataset.theme = savedTheme;
  const sw = document.querySelector(`.swatch[data-t="${savedTheme}"]`);
  if (sw) {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
  }
  applyThemeCopy(savedTheme);
}

init();
