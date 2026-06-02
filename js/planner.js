// ===========================
// PLANNER — state
// ===========================
let calendarMonth = new Date();

// ===========================
// PLANNER — main render
// ===========================

function renderPlanner() {
  document.getElementById('plannerDate').textContent =
    plannerDay.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  renderCalendar();
  renderSchedule();
  renderTodos();
  renderHabits();
  renderMoodChart();
  renderQuote();
}

function changeDay(d) {
  plannerDay.setDate(plannerDay.getDate() + d);
  calendarMonth = new Date(plannerDay);
  renderPlanner();
}

function goToday() {
  plannerDay = new Date();
  calendarMonth = new Date();
  renderPlanner();
}

// ===========================
// CALENDAR
// ===========================

function renderCalendar() {
  const container = document.getElementById('calendarGrid');
  if (!container) return;

  const year  = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  document.getElementById('calendarMonthLabel').textContent =
    calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const events      = JSON.parse(localStorage.getItem('soyuco_events') || '{}');
  const today       = new Date();

  let html = '';

  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    html += `<div class="cal-day-header">${d}</div>`;
  });

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-cell cal-empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate   = new Date(year, month, d);
    const dayKey     = cellDate.toDateString();
    const isToday    = cellDate.toDateString() === today.toDateString();
    const isSelected = cellDate.toDateString() === plannerDay.toDateString();
    const dayEvents  = events[dayKey] ? Object.values(events[dayKey]) : [];
    const dotCount   = Math.min(dayEvents.length, 3);
    const dots = dotCount > 0
      ? `<div class="cal-dots">${Array(dotCount).fill('<div class="cal-dot"></div>').join('')}</div>`
      : '';

    html += `
      <div class="cal-cell ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}"
           onclick="selectCalendarDay(${year}, ${month}, ${d})">
        <span class="cal-day-num">${d}</span>
        ${dots}
      </div>`;
  }

  container.innerHTML = html;
}

function selectCalendarDay(year, month, day) {
  plannerDay = new Date(year, month, day);
  renderPlanner();
}

function calPrevMonth() {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
}

function calNextMonth() {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
}

// ===========================
// MODAL BACKDROP & ESCAPE
// ===========================

document.addEventListener('click', function(e) {
  ['eventModal','todoModal','habitModal','tagModal','collectionModal','deleteEntryModal','deleteCollectionModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el && e.target === el) closeModal(id);
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['eventModal','todoModal','habitModal','tagModal','collectionModal','deleteEntryModal','deleteCollectionModal'].forEach(closeModal);
  }
});

// ===========================
// SCHEDULE
// ===========================

function renderSchedule() {
  const hours  = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const events = JSON.parse(localStorage.getItem('soyuco_events') || '{}');
  const dayKey = plannerDay.toDateString();

  document.getElementById('scheduleBody').innerHTML = hours.map(h => {
    const lbl = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
    const ev  = events[dayKey]?.[h];
    return `<div class="time-block">
      <div class="time-label">${lbl}</div>
      ${ev
        ? `<div class="time-event${ev.ai ? ' ai-generated' : ''}" onclick="openEventModal(${h},'${dayKey}',true)">${escHtml(ev.text || ev)}</div>`
        : `<div class="time-empty" onclick="openEventModal(${h},'${dayKey}',false)">–</div>`
      }
    </div>`;
  }).join('');
}

// ===========================
// EVENT MODAL
// ===========================
let _eventModalHour   = null;
let _eventModalDayKey = null;
let _eventModalIsEdit = false;

function openEventModal(h, dayKey, isEdit) {
  _eventModalHour   = h;
  _eventModalDayKey = dayKey;
  _eventModalIsEdit = isEdit;

  const lbl = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
  document.getElementById('eventModalTitle').textContent = isEdit ? `Edit Event — ${lbl}` : `Add Event — ${lbl}`;
  document.getElementById('eventModalDeleteBtn').style.display = isEdit ? 'block' : 'none';

  const events   = JSON.parse(localStorage.getItem('soyuco_events') || '{}');
  const existing = events[dayKey]?.[h];
  document.getElementById('eventModalInput').value = isEdit ? (existing?.text || existing || '') : '';

  openModal('eventModal');
}

function saveEventModal() {
  const text   = document.getElementById('eventModalInput').value.trim();
  const events = JSON.parse(localStorage.getItem('soyuco_events') || '{}');
  if (!events[_eventModalDayKey]) events[_eventModalDayKey] = {};
  if (!text) {
    delete events[_eventModalDayKey][_eventModalHour];
  } else {
    const existing = events[_eventModalDayKey][_eventModalHour];
    events[_eventModalDayKey][_eventModalHour] = { text, ai: existing?.ai || false };
  }
  localStorage.setItem('soyuco_events', JSON.stringify(events));
  closeModal('eventModal');
  renderSchedule();
  renderCalendar();
}

function deleteEventModal() {
  const events = JSON.parse(localStorage.getItem('soyuco_events') || '{}');
  if (events[_eventModalDayKey]) delete events[_eventModalDayKey][_eventModalHour];
  localStorage.setItem('soyuco_events', JSON.stringify(events));
  closeModal('eventModal');
  renderSchedule();
  renderCalendar();
}

// ===========================
// TASK MODAL
// ===========================
let _todoEditId = null;

function openTodoModal(editId = null) {
  _todoEditId = editId;

  if (editId !== null) {
    const t = todos.find(t => t.id === editId);
    if (!t) return;
    document.getElementById('todoModalTitle').textContent    = 'Edit Task';
    document.getElementById('todoModalInput').value          = t.text;
    document.getElementById('todoModalPriority').value       = t.priority;
    document.getElementById('todoModalSaveBtn').textContent  = 'Save Changes';
    document.getElementById('todoModalDeleteBtn').style.display = 'block';
  } else {
    document.getElementById('todoModalTitle').textContent    = 'Add Task';
    document.getElementById('todoModalInput').value          = '';
    document.getElementById('todoModalPriority').value       = 'med';
    document.getElementById('todoModalSaveBtn').textContent  = 'Add Task';
    document.getElementById('todoModalDeleteBtn').style.display = 'none';
  }

  openModal('todoModal');
}

function saveTodoModal() {
  const text     = document.getElementById('todoModalInput').value.trim();
  const priority = document.getElementById('todoModalPriority').value;
  if (!text) return;

  if (_todoEditId !== null) {
    const t = todos.find(t => t.id === _todoEditId);
    if (t) { t.text = text; t.priority = priority; }
  } else {
    todos.push({ id: Date.now(), text, done: false, priority, day: plannerDay.toDateString() });
  }

  localStorage.setItem('soyuco_todos', JSON.stringify(todos));
  closeModal('todoModal');
  renderTodos();
}

function deleteTodoModal() {
  if (_todoEditId === null) return;
  todos = todos.filter(t => t.id !== _todoEditId);
  localStorage.setItem('soyuco_todos', JSON.stringify(todos));
  closeModal('todoModal');
  renderTodos();
}

// ===========================
// HABIT MODAL
// ===========================

function openHabitModal() {
  document.getElementById('habitModalInput').value = '';
  openModal('habitModal');
}

function saveHabitModal() {
  const name = document.getElementById('habitModalInput').value.trim();
  if (!name) return;
  habits.push({ id: Date.now(), name, days: [false, false, false, false, false, false, false] });
  localStorage.setItem('soyuco_habits', JSON.stringify(habits));
  closeModal('habitModal');
  renderHabits();
}

// ===========================
// TODOS
// ===========================

const PRIORITY_LABEL = { high: '🔴', med: '🟡', low: '🟢' };

function renderTodos() {
  const dayKey   = plannerDay.toDateString();
  const dayTodos = todos.filter(t => t.day === dayKey);
  const done     = dayTodos.filter(t => t.done).length;

  document.getElementById('todoProgress').textContent = `${done}/${dayTodos.length}`;
  document.getElementById('todoList').innerHTML = dayTodos.map(t => `
    <div class="todo-item">
      <div class="todo-check ${t.done ? 'done' : ''}" onclick="toggleTodo(${t.id})">${t.done ? '✓' : ''}</div>
      <div class="todo-priority p-${t.priority}" title="${t.priority} priority"></div>
      <div class="todo-text ${t.done ? 'done' : ''}" style="flex:1;">${escHtml(t.text)}</div>
      <button onclick="openTodoModal(${t.id})"
        style="font-size:0.65rem;color:var(--text3);padding:2px 6px;background:none;border:1px solid transparent;border-radius:var(--radius);cursor:pointer;transition:all var(--transition);"
        onmouseover="this.style.borderColor='var(--border)';this.style.color='var(--text)'"
        onmouseout="this.style.borderColor='transparent';this.style.color='var(--text3)'">✎</button>
    </div>
  `).join('') || '<div style="font-family:var(--font-ui);font-size:.78rem;color:var(--text3);padding:8px 0">No tasks yet</div>';
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) {
    t.done = !t.done;
    localStorage.setItem('soyuco_todos', JSON.stringify(todos));
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  localStorage.setItem('soyuco_todos', JSON.stringify(todos));
  renderTodos();
}

// ===========================
// HABITS
// ===========================

function renderHabits() {
  const dn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  document.getElementById('habitBody').innerHTML = habits.map(h => `
    <div class="habit-row">
      <div class="habit-name">${escHtml(h.name)}</div>
      <div class="habit-days">${h.days.map((d, i) =>
        `<div class="habit-day ${d ? 'done' : ''}" onclick="toggleHabit(${h.id},${i})">${dn[i]}</div>`
      ).join('')}</div>
      <button onclick="deleteHabit(${h.id})"
        style="font-size:0.6rem;color:var(--text3);padding:2px 5px;background:none;border:none;cursor:pointer;"
        onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text3)'">✕</button>
    </div>
  `).join('');
}

function toggleHabit(id, i) {
  const h = habits.find(h => h.id === id);
  if (h) {
    h.days[i] = !h.days[i];
    localStorage.setItem('soyuco_habits', JSON.stringify(habits));
    renderHabits();
  }
}

function deleteHabit(id) {
  habits = habits.filter(h => h.id !== id);
  localStorage.setItem('soyuco_habits', JSON.stringify(habits));
  renderHabits();
}

// ===========================
// MOOD CHART
// ===========================

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function renderMoodChart() {
  const days       = getLast7Days();
  const today      = new Date().toDateString();
  const moodLabels = ['', 'Awful', 'Meh', 'Okay', 'Good', 'Great'];
  const chart      = document.getElementById('moodChart');
  if (!chart) return;

  chart.innerHTML = days.map(d => {
    const key      = d.toDateString();
    const val      = window.moodHistory?.[key] || 0;
    const isToday  = key === today;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const height   = val ? val * 12 : 4;
    const opacity  = val ? (isToday ? 1 : 0.6) : 0.2;
    const color    = isToday ? 'var(--accent2)' : 'var(--accent)';
    const title    = `${dayLabel}: ${val ? moodLabels[val] : '–'}`;

    return `<div class="mood-bar-item ${isToday ? 'mood-today' : ''}"
      style="height:${height}px;opacity:${opacity};background:${color};flex:1;margin:0 2px;border-radius:2px 2px 0 0;"
      data-label="${dayLabel}"
      title="${title}"></div>`;
  }).join('');

  // Restore selected emoji if today has a mood set
  const todayMood = window.moodHistory?.[today];
  const moodEmojis = document.querySelectorAll('.mood-emoji');
  if (todayMood && moodEmojis.length) {
    moodEmojis.forEach((el, i) => {
      if (i + 1 === todayMood) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  } else if (moodEmojis.length) {
    moodEmojis.forEach(el => el.classList.remove('selected'));
  }
}

async function selectMood(el) {
  // Update UI
  document.querySelectorAll('.mood-emoji').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  const val = [...el.parentNode.children].indexOf(el) + 1;
  
  // Use consistent date format
  const todayDate = new Date();
  const todayKey = todayDate.toDateString();
  const todayISO = todayDate.toISOString().split('T')[0];
  
  // Save to window.moodHistory
  if (!window.moodHistory) window.moodHistory = {};
  window.moodHistory[todayKey] = val;
  
  // Prune older than 7 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  Object.keys(window.moodHistory).forEach(key => {
    if (new Date(key) < cutoff) delete window.moodHistory[key];
  });
  
  // Save to localStorage
  localStorage.setItem('soyuco_mood', JSON.stringify(window.moodHistory));
  
  // Save to cloud if logged in
  if (window.currentUser) {
    try {
      const { supabase } = await import('./supabase-client.js');
      const { error } = await supabase
        .from('mood_history')
        .upsert({ 
          user_id: window.currentUser.id, 
          date: todayISO, 
          mood_value: val 
        }, { onConflict: 'user_id, date' });
      
      if (error) {
        console.error('Error saving mood to cloud:', error);
      } else {
        console.log('Mood saved to cloud:', val);
      }
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }
  
  // Refresh the chart
  renderMoodChart();
  
  // Show confirmation
  const moodNames = ['', 'Awful', 'Meh', 'Okay', 'Good', 'Great'];
  if (window.showToast) {
    window.showToast(`Mood saved: ${moodNames[val]}`, 'success');
  }
}

// Make sure selectMood is available globally
window.selectMood = selectMood;
window.renderMoodChart = renderMoodChart;

// ===========================
// DAILY QUOTE
// ===========================

function renderQuote() {
  const theme = document.body.dataset.theme;
  let pool = QUOTES;
  if (theme === 'spongebob') pool = SPONGEBOB_QUOTES;
  else if (theme === 'meangirls') pool = MEANGIRLS_QUOTES;
  else if (theme === 'minecraft') pool = MINECRAFT_QUOTES;

  const q = pool[quoteIdx % pool.length];
  document.getElementById('dailyQuote').innerHTML = `"${q.text}" <cite>— ${q.author}</cite>`;
}

function newQuote() {
  quoteIdx = (quoteIdx + 1);
  renderQuote();
}
