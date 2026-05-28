// ===========================
// AI PLANNER
// ===========================

function renderAiInsights() {
  const totalEntries = entries.length;
  const todayTodos   = todos.filter(t => t.day === new Date().toDateString());
  const doneTodos    = todayTodos.filter(t => t.done).length;
  const habitsDone   = habits.reduce((s, h) => s + h.days.filter(Boolean).length, 0);
  const moodValues   = Object.values(moodHistory).filter(Boolean);
  const avgMood      = moodValues.length
    ? Math.round(moodValues.reduce((s, v) => s + v, 0) / moodValues.length * 10) / 10
    : 0;
  const moodLabels   = ['–', 'Awful', 'Meh', 'Okay', 'Good', 'Great'];

  document.getElementById('aiInsights').innerHTML = `
    <div class="ai-section-title">Your Week at a Glance</div>
    <div class="ai-insights">
      <div class="ai-insight-card">
        <div class="ai-insight-icon">📓</div>
        <div class="ai-insight-label">Journal Entries</div>
        <div class="ai-insight-value">${totalEntries}</div>
        <div class="ai-insight-sub">Total written</div>
      </div>
      <div class="ai-insight-card">
        <div class="ai-insight-icon">☑</div>
        <div class="ai-insight-label">Today's Tasks</div>
        <div class="ai-insight-value">${doneTodos}/${todayTodos.length}</div>
        <div class="ai-insight-sub">${todayTodos.length ? Math.round(doneTodos / todayTodos.length * 100) : 0}% complete</div>
      </div>
      <div class="ai-insight-card">
        <div class="ai-insight-icon">◈</div>
        <div class="ai-insight-label">Habit Streak</div>
        <div class="ai-insight-value">${habitsDone}</div>
        <div class="ai-insight-sub">Completions this week</div>
      </div>
      <div class="ai-insight-card">
        <div class="ai-insight-icon">😊</div>
        <div class="ai-insight-label">Avg Mood</div>
        <div class="ai-insight-value">${avgMood || '–'}</div>
        <div class="ai-insight-sub">${avgMood ? moodLabels[Math.round(avgMood)] : 'Not set'}</div>
      </div>
    </div>
    ${aiMessages.length === 0 ? `
      <div class="ai-section-title">What would you like to do?</div>
      <div style="font-family:var(--font-ui);font-size:0.83rem;color:var(--text2);line-height:1.7;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;">
        <strong style="color:var(--accent2);">⬡ Your AI planner can:</strong><br>
        • Build a complete hourly schedule for your day<br>
        • Suggest tasks and priorities based on your goals<br>
        • Create balanced routines (work, health, rest)<br>
        • Apply plans directly to your Day Planner<br><br>
        <span style="color:var(--text3);">Describe your day above, or pick a quick-start template.</span>
      </div>
    ` : ''}
  `;
}

function fillChip(text) {
  document.getElementById('aiPrompt').value = text;
  document.getElementById('aiPrompt').focus();
}

async function sendAiPlan() {
  const prompt = document.getElementById('aiPrompt').value.trim();
  if (!prompt) return;

  const btn   = document.getElementById('aiSendBtn');
  const label = document.getElementById('aiSendLabel');
  btn.disabled = true;
  label.innerHTML = '<span class="spin">⬡</span> Planning…';

  const userMsg = {
    role: 'user',
    content: prompt,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
  aiMessages.push(userMsg);
  renderAiThread();
  document.getElementById('aiPrompt').value = '';

  // Show typing indicator
  const thread   = document.getElementById('aiThread');
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-msg fade-in';
  typingEl.id = 'aiTyping';
  typingEl.innerHTML = `
    <div class="ai-msg-avatar assistant">⬡</div>
    <div class="ai-msg-bubble assistant">
      <div class="ai-typing">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  thread.appendChild(typingEl);
  thread.scrollTop = thread.scrollHeight;

  try {
    const todayKey     = new Date().toDateString();
    const todayTasks   = todos.filter(t => t.day === todayKey).map(t => t.text);
    const habitsList   = habits.map(h => h.name);
    const recentEntries = entries.slice(0, 3).map(e => `"${e.title || 'Untitled'}": ${e.body.substring(0, 100)}`);

    const systemPrompt = `You are Soyuco, an expert personal AI day planner and life coach. Your role is to create realistic, thoughtful, and personalized daily schedules.

When given a request to plan a day, always respond with:
1. A warm, brief intro (1-2 sentences)
2. A JSON plan block wrapped in <PLAN> tags in this exact format:
<PLAN>
[
  {"hour": 6, "title": "Morning Routine", "note": "Wake up, stretch, hydrate", "category": "health"},
  {"hour": 7, "title": "Breakfast & Journaling", "note": "15 min journal entry while eating", "category": "personal"}
]
</PLAN>
3. 2-3 sentences of personalized advice after the plan.

Categories must be one of: work, health, personal, focus
Hours must be integers from 5-22.
For non-planning questions, just respond naturally without a <PLAN> block.

User context:
- Existing today's tasks: ${todayTasks.length ? todayTasks.join(', ') : 'None'}
- Habits they track: ${habitsList.join(', ')}
- Recent journal themes: ${recentEntries.length ? recentEntries.join(' | ') : 'No entries yet'}`;

    const response = await callClaudeWithSystem(systemPrompt, buildConversationHistory(prompt));
    document.getElementById('aiTyping')?.remove();

    const planMatch    = response.match(/<PLAN>([\s\S]*?)<\/PLAN>/);
    let planData       = null;
    const cleanResponse = response.replace(/<PLAN>[\s\S]*?<\/PLAN>/, '').trim();
    if (planMatch) {
      try { planData = JSON.parse(planMatch[1].trim()); } catch (e) {}
    }

    aiMessages.push({
      role: 'assistant',
      content: cleanResponse,
      plan: planData,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    });
    renderAiThread();

  } catch (err) {
    document.getElementById('aiTyping')?.remove();
    aiMessages.push({
      role: 'assistant',
      content: 'I had trouble generating your plan. Please check your connection and try again.',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    });
    renderAiThread();
  }

  btn.disabled = false;
  label.innerHTML = '⬡ Plan My Day';
}

function buildConversationHistory(newPrompt) {
  const history = [];
  for (const msg of aiMessages) {
    if (msg.role === 'user')
      history.push({ role: 'user', content: msg.content });
    else if (msg.role === 'assistant')
      history.push({ role: 'assistant', content: msg.content + (msg.plan ? `\n<PLAN>${JSON.stringify(msg.plan)}</PLAN>` : '') });
  }
  history.push({ role: 'user', content: newPrompt });
  return history;
}

function renderAiThread() {
  const thread = document.getElementById('aiThread');
  if (!aiMessages.length) { thread.innerHTML = ''; return; }

  thread.innerHTML = aiMessages.map((msg, i) => {
    if (msg.role === 'user') {
      return `<div class="ai-msg fade-in">
        <div class="ai-msg-avatar user">You</div>
        <div class="ai-msg-bubble user">${escHtml(msg.content)}<div class="ai-timestamp">${msg.time}</div></div>
      </div>`;
    }
    const planHtml = msg.plan ? renderPlanCard(msg.plan, i) : '';
    return `<div class="ai-msg fade-in">
      <div class="ai-msg-avatar assistant">⬡</div>
      <div class="ai-msg-bubble assistant">${formatAiText(msg.content)}<div class="ai-timestamp">${msg.time}</div></div>
    </div>${planHtml}`;
  }).join('');

  thread.scrollTop = thread.scrollHeight;
}

function renderPlanCard(plan, idx) {
  const catEmoji = { work: '💼', health: '💪', personal: '🌿', focus: '🎯' };
  const items = plan.map(item => `
    <div class="ai-plan-item">
      <div class="ai-plan-time">${item.hour < 12 ? item.hour + 'am' : item.hour === 12 ? '12pm' : (item.hour - 12) + 'pm'}</div>
      <div class="ai-plan-event">
        <div class="ai-plan-event-title">${catEmoji[item.category] || '•'} ${escHtml(item.title)}</div>
        ${item.note ? `<div class="ai-plan-event-note">${escHtml(item.note)}</div>` : ''}
        <span class="ai-plan-tag ${item.category}">${item.category}</span>
      </div>
    </div>
  `).join('');

  return `<div class="ai-plan-card fade-in">
    <div class="ai-plan-header">
      <div class="ai-plan-title">✦ Your Personalized Day Plan</div>
      <div class="ai-plan-actions">
        <button class="ai-plan-btn regen" onclick="regeneratePlan(${idx})">↻ Regenerate</button>
        <button class="ai-plan-btn apply" onclick="applyPlan(${idx})">Apply to Planner →</button>
      </div>
    </div>
    <div class="ai-plan-body">${items}</div>
  </div>`;
}

function applyPlan(msgIdx) {
  const msg = aiMessages[msgIdx];
  if (!msg?.plan) return;

  const dayKey = plannerDay.toDateString();
  const events = JSON.parse(localStorage.getItem('soyuco_events') || '{}');
  if (!events[dayKey]) events[dayKey] = {};

  msg.plan.forEach(item => {
    events[dayKey][item.hour] = { text: item.title + (item.note ? ` — ${item.note}` : ''), ai: true };
  });
  localStorage.setItem('soyuco_events', JSON.stringify(events));

  // Add work/focus items as tasks
  const workItems = msg.plan.filter(i => i.category === 'work' || i.category === 'focus');
  workItems.forEach(item => {
    if (!todos.some(t => t.text === item.title && t.day === dayKey))
      todos.push({ id: Date.now() + Math.random(), text: item.title, done: false, priority: 'med', day: dayKey });
  });
  localStorage.setItem('soyuco_todos', JSON.stringify(todos));

  switchView(document.querySelector('[data-view=planner]'));
  alert(`✦ Plan applied! ${msg.plan.length} events added to your Day Planner for ${dayKey}.`);
}

function regeneratePlan(msgIdx) {
  const prev = aiMessages[msgIdx - 1];
  if (prev?.role === 'user') {
    document.getElementById('aiPrompt').value = prev.content + ' (please give me a different variation)';
    sendAiPlan();
  }
}

function formatAiText(text) {
  return escHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// ===========================
// CLAUDE API
// ===========================
async function callClaude(userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  const data = await res.json();
  return data.content.map(b => b.text || '').join('');
}

async function callClaudeWithSystem(system, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system,
      messages,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b => b.text || '').join('');
}
