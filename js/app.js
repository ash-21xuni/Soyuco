// ===========================
// APP.JS - WITH AUTH INTEGRATION
// ===========================

import { initAuth, getCurrentUser, onAuthChange, signOut } from '../auth.js';

// Global auth state
let currentUser = null;

// ===========================
// INIT
// ===========================

async function init() {
  // Initialize auth first
  currentUser = await initAuth();
  
  // Update UI based on auth state
  updateAuthUI(currentUser);
  
  // Listen for auth changes
  onAuthChange((user) => {
    currentUser = user;
    updateAuthUI(user);
    if (user) {
      // Reload data when user logs in
      loadUserDataFromCloud();
    }
  });
  
  // Regular app initialization
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

// Update UI based on login state
function updateAuthUI(user) {
  const accountBtn = document.getElementById('accountBtn');
  const accountMenu = document.getElementById('accountMenu');
  
  if (user) {
    // User is logged in
    accountBtn.innerHTML = `◉ ${user.email?.split('@')[0] || 'User'}`;
    
    // Update menu content
    const menuContent = accountMenu.querySelector('div:first-child');
      menuContent.innerHTML = `
        <div style="font-family:var(--font-ui);font-size:0.82rem;font-weight:600;color:var(--text);">${user.email}</div>
        <div style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text3);margin-top:2px;">Cloud Synced ✓</div>
      `;
    
    // Change first button to Sign Out
    const buttons = accountMenu.querySelectorAll('button');
    if (buttons[0] && buttons[0].textContent.includes('Sign In')) {
      buttons[0].textContent = '✦ Sign Out';
      buttons[0].onclick = async () => {
        await signOut();
        alert('Signed out. Your data remains in the cloud.');
        location.reload();
      };
    }
  } else {
    // User is logged out
    accountBtn.innerHTML = '◉ Sign In';
    
    const menuContent = accountMenu.querySelector('div:first-child');
      menuContent.innerHTML = `
        <div style="font-family:var(--font-ui);font-size:0.82rem;font-weight:600;color:var(--text);">Guest</div>
        <div style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text3);margin-top:2px;">Sign in to sync your data</div>
      `;
  }
}

// Load user data from cloud to localStorage
async function loadUserDataFromCloud() {
  try {
    const { supabase } = await import('../supabase-client.js');
    
    // Load entries
    const { data: cloudEntries } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false });
    
    if (cloudEntries && cloudEntries.length) {
      entries = cloudEntries;
      localStorage.setItem('soyuco_entries', JSON.stringify(entries));
      renderEntryList();
      document.getElementById('entryCount').textContent = entries.length;
    }
    
    // Load todos
    const { data: cloudTodos } = await supabase
      .from('todos')
      .select('*');
    
    if (cloudTodos && cloudTodos.length) {
      todos = cloudTodos;
      localStorage.setItem('soyuco_todos', JSON.stringify(todos));
      if (currentView === 'planner') renderPlanner();
    }
    
    // Load habits
    const { data: cloudHabits } = await supabase
      .from('habits')
      .select('*');
    
    if (cloudHabits && cloudHabits.length) {
      habits = cloudHabits;
      localStorage.setItem('soyuco_habits', JSON.stringify(habits));
      if (currentView === 'planner') renderPlanner();
    }
    
    // Load mood history
    const { data: cloudMoods } = await supabase
      .from('mood_history')
      .select('*');
    
    if (cloudMoods && cloudMoods.length) {
      const moodMap = {};
      cloudMoods.forEach(m => { moodMap[m.date] = m.mood_value; });
      moodHistory = moodMap;
      localStorage.setItem('soyuco_mood', JSON.stringify(moodHistory));
      renderMoodChart();
    }
    
    // Load events
    const { data: cloudEvents } = await supabase
      .from('events')
      .select('*');
    
    if (cloudEvents && cloudEvents.length) {
      const eventsMap = {};
      cloudEvents.forEach(e => {
        if (!eventsMap[e.day]) eventsMap[e.day] = {};
        eventsMap[e.day][e.hour] = { text: e.text, ai: e.ai_generated };
      });
      localStorage.setItem('soyuco_events', JSON.stringify(eventsMap));
      if (currentView === 'planner') renderPlanner();
    }
    
    // Load transactions
    const { data: cloudTx } = await supabase
      .from('transactions')
      .select('*');
    
    if (cloudTx && cloudTx.length) {
      bTransactions = cloudTx;
      localStorage.setItem('soyuco_tx', JSON.stringify(bTransactions));
      if (currentView === 'budget') renderBudget();
    }
    
    // Load goals
    const { data: cloudGoals } = await supabase
      .from('goals')
      .select('*');
    
    if (cloudGoals && cloudGoals.length) {
      bGoals = cloudGoals;
      localStorage.setItem('soyuco_goals', JSON.stringify(bGoals));
      if (currentView === 'budget') renderBudget();
    }
    
    // Load budget limits
    const { data: cloudLimits } = await supabase
      .from('budget_limits')
      .select('*');
    
    if (cloudLimits && cloudLimits.length) {
      bLimits = cloudLimits;
      localStorage.setItem('soyuco_limits', JSON.stringify(bLimits));
      if (currentView === 'budget') renderBudget();
    }
    
    alert('✅ Your cloud data has been loaded!');
  } catch (error) {
    console.error('Error loading cloud data:', error);
  }
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

window.toggleAccountMenu = function() {
  const m = document.getElementById('accountMenu');
  if (currentUser) {
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
  } else {
    showAuthModal();
  }
};

// Show auth modal
window.showAuthModal = function() {
  document.getElementById('authModal').style.display = 'flex';
};

// Close modal when clicking outside
document.addEventListener('click', function(e) {
  const area = document.getElementById('accountArea');
  const modal = document.getElementById('authModal');
  if (area && !area.contains(e.target) && !modal?.contains(e.target)) {
    document.getElementById('accountMenu').style.display = 'none';
  }
  if (modal && e.target === modal) {
    modal.style.display = 'none';
  }
});

// ===========================
// THEME
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

// Start the app
init();