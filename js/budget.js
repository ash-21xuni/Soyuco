// ===========================
// BUDGET — Modals
// ===========================
let trendRange = 7; // days

function setTrendRange(days) {
  trendRange = days;
  // Update button styles
  [7, 30, 365].forEach(d => {
    const btn = document.getElementById(`trendBtn${d}`);
    if (!btn) return;
    btn.className = d === days ? 'btn btn-primary' : 'btn btn-ghost';
    btn.style.fontSize = '0.65rem';
    btn.style.padding  = '3px 10px';
  });
  renderTrendChart();
}

function renderTrendChart() {
  const svg     = document.getElementById('trendChart');
  const empty   = document.getElementById('trendEmpty');
  if (!svg) return;

  const now     = new Date();
  const msDay   = 86400000;

  // Build buckets
  let labels = [];
  let buckets = [];

  if (trendRange === 7) {
    // One bucket per day for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * msDay);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      buckets.push({ label: labels[labels.length - 1], total: 0, dateStr: d.toISOString().split('T')[0] });
    }
    window.bTransactions.filter(t => t.type === 'expense').forEach(t => {
      const b = buckets.find(b => b.dateStr === t.date);
      if (b) b.total += t.amount;
    });

  } else if (trendRange === 30) {
    // One bucket per day for last 30 days, but label every 5th
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * msDay);
      const dateStr = d.toISOString().split('T')[0];
      const lbl = i % 5 === 0
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';
      buckets.push({ label: lbl, total: 0, dateStr });
    }
    window.bTransactions.filter(t => t.type === 'expense').forEach(t => {
      const b = buckets.find(b => b.dateStr === t.date);
      if (b) b.total += t.amount;
    });

  } else {
    // One bucket per month for last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        total: 0,
        key,
      });
    }
    window.bTransactions.filter(t => t.type === 'expense').forEach(t => {
      const key = t.date.substring(0, 7);
      const b = buckets.find(b => b.key === key);
      if (b) b.total += t.amount;
    });
  }

  const maxVal = Math.max(...buckets.map(b => b.total), 0.01);
  const hasData = buckets.some(b => b.total > 0);

  if (!hasData) {
    svg.style.display  = 'none';
    empty.style.display = 'block';
    return;
  }
  svg.style.display   = 'block';
  empty.style.display = 'none';

  // Chart dimensions
  const W      = 800;
  const H      = 140;
  const padL   = 42;
  const padR   = 12;
  const padT   = 12;
  const padB   = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n      = buckets.length;

  const pts = buckets.map((b, i) => {
    const x = padL + (i / (n - 1)) * chartW;
    const y = padT + chartH - (b.total / maxVal) * chartH;
    return { x, y, total: b.total, label: b.label };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L${pts[pts.length-1].x.toFixed(1)},${(padT+chartH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT+chartH).toFixed(1)} Z`;

  const yTicks = [0, 0.5, 1].map(frac => ({
    y: padT + chartH - frac * chartH,
    val: (frac * maxVal).toFixed(0),
  }));

  const yLines = yTicks.map(t =>
    `<line x1="${padL}" y1="${t.y.toFixed(1)}" x2="${W - padR}" y2="${t.y.toFixed(1)}"
      stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"/>`
  ).join('');

  const yLabels = yTicks.map(t =>
    `<text x="${(padL - 5).toFixed(1)}" y="${(t.y + 4).toFixed(1)}"
      font-family="var(--font-mono)" font-size="9" fill="var(--text3)" text-anchor="end">$${t.val}</text>`
  ).join('');

  const xLabels = pts
    .filter(p => p.label)
    .map(p =>
      `<text x="${p.x.toFixed(1)}" y="${(padT + chartH + 14).toFixed(1)}"
        font-family="var(--font-mono)" font-size="9" fill="var(--text3)" text-anchor="middle">${p.label}</text>`
    ).join('');

  const dots = pts
    .filter(p => p.total > 0)
    .map(p =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3"
        fill="var(--accent)" stroke="var(--bg2)" stroke-width="1.5">
        <title>$${p.total.toFixed(2)}</title>
      </circle>`
    ).join('');

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="var(--accent)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${yLines}
    ${yLabels}
    ${xLabels}
    <path d="${fillPath}" fill="url(#trendFill)"/>
    <path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
  `;
}


// ===========================
// TRANSACTION MODAL (add + edit)
// ===========================
let _txEditId = null;

function openTxModal(editId = null) {
  _txEditId = editId;

  if (editId !== null) {
    const t = window.bTransactions.find(t => t.id === editId);
    if (!t) return;
    document.getElementById('txModalTitle').textContent = 'Edit Transaction';
    document.getElementById('txModalSaveBtn').textContent = 'Save Changes';
    document.getElementById('txModalDeleteBtn').style.display = 'block';
    document.getElementById('txDesc').value = t.desc;
    document.getElementById('txAmount').value = t.amount;
    document.getElementById('txDate').value = t.date;
    document.getElementById('txCat').value = t.cat;
    window.txTypeB = t.type;
  } else {
    document.getElementById('txModalTitle').textContent = 'Add Transaction';
    document.getElementById('txModalSaveBtn').textContent = 'Add Transaction';
    document.getElementById('txModalDeleteBtn').style.display = 'none';
    document.getElementById('txDesc').value = '';
    document.getElementById('txAmount').value = '';
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('txCat').value = 'food';
    window.txTypeB = 'expense';
  }

  document.getElementById('btnExpense').className = window.txTypeB === 'expense' ? 'btn btn-primary' : 'btn btn-ghost';
  document.getElementById('btnIncome').className = window.txTypeB === 'income' ? 'btn btn-primary' : 'btn btn-ghost';
  document.getElementById('txModal').style.display = 'flex';
}

function closeTxModal() {
  document.getElementById('txModal').style.display = 'none';
}

function setTxType(t) {
  window.txTypeB = t;
  document.getElementById('btnExpense').className = t === 'expense' ? 'btn btn-primary' : 'btn btn-ghost';
  document.getElementById('btnIncome').className  = t === 'income'  ? 'btn btn-primary' : 'btn btn-ghost';
}

async function saveTx() {
  const desc = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const cat = document.getElementById('txCat').value;
  const date = document.getElementById('txDate').value;

  if (!desc || isNaN(amount) || amount <= 0) {
    alert('Please enter a description and valid amount.');
    return;
  }

  let transactionId;
  
  if (_txEditId !== null) {
    // Update existing transaction
    const t = window.bTransactions.find(t => t.id === _txEditId);
    if (t) { 
      t.desc = desc; 
      t.amount = amount; 
      t.type = window.txTypeB; 
      t.cat = cat; 
      t.date = date;
      transactionId = _txEditId;
    }
  } else {
    // Create new transaction
    transactionId = Date.now();
    window.bTransactions.push({ 
      id: transactionId, 
      desc, 
      amount, 
      type: window.txTypeB, 
      cat, 
      date 
    });
  }

  // Save to localStorage
  localStorage.setItem('soyuco_tx', JSON.stringify(window.bTransactions));
  
  // Sync to cloud if logged in
  if (window.currentUser) {
    try {
      const { supabase } = await import('./supabase-client.js');
      const { error } = await supabase
        .from('transactions')
        .upsert({ 
          id: transactionId,
          user_id: window.currentUser.id,
          description: desc,
          amount: amount,
          type: window.txTypeB,
          category: cat,
          date: date
        });
      if (error) {
        console.error('Error saving transaction to cloud:', error);
      } else {
        console.log('Transaction saved to cloud');
      }
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }
  
  closeTxModal();
  renderBudget();
  if (window.showToast) window.showToast('Transaction saved!', 'success');
}

async function deleteTxModal() {
  if (_txEditId === null) return;
  
  const transactionId = _txEditId;
  window.bTransactions = window.bTransactions.filter(t => t.id !== transactionId);
  localStorage.setItem('soyuco_tx', JSON.stringify(window.bTransactions));
  
  if (window.currentUser) {
    try {
      const { supabase } = await import('./supabase-client.js');
      await supabase.from('transactions').delete().eq('id', transactionId);
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }
  
  closeTxModal();
  renderBudget();
  if (window.showToast) window.showToast('Transaction deleted!', 'success');
}

// ===========================
// SAVINGS ADJUSTMENT MODAL
// ===========================
let _savingsGoalId = null;

function openSavingsModal(goalId) {
  _savingsGoalId = goalId;
  const g = window.bGoals.find(g => g.id === goalId);
  if (!g) return;
  document.getElementById('savingsModalGoalName').textContent = g.name;
  document.getElementById('savingsModalCurrent').textContent  = `$${g.saved.toFixed(2)}`;
  document.getElementById('savingsModalAmount').value = '';
  openModal('savingsModal');
}

async function applySavings(isAdd) {
  const amount = parseFloat(document.getElementById('savingsModalAmount').value);
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }
  
  const g = window.bGoals.find(g => g.id === _savingsGoalId);
  if (!g) return;
  
  g.saved = Math.max(0, g.saved + (isAdd ? amount : -amount));
  localStorage.setItem('soyuco_goals', JSON.stringify(window.bGoals));
  
  if (window.currentUser) {
    try {
      const { supabase } = await import('./supabase-client.js');
      await supabase.from('goals').upsert({ 
        id: g.id,
        user_id: window.currentUser.id,
        name: g.name,
        target: g.target,
        saved: g.saved
      });
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }
  
  closeModal('savingsModal');
  renderBudget();
  if (window.showToast) window.showToast(`$${amount.toFixed(2)} ${isAdd ? 'added to' : 'removed from'} savings!`, 'success');
}

function openGoalModal() {
  document.getElementById('goalName').value = '';
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalSaved').value = '';
  document.getElementById('goalModal').style.display = 'flex';
}

function closeGoalModal() {
  document.getElementById('goalModal').style.display = 'none';
}

async function saveGoal() {
  const name = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value);
  const saved = parseFloat(document.getElementById('goalSaved').value) || 0;

  if (!name || isNaN(target) || target <= 0) {
    alert('Please enter a goal name and target amount.');
    return;
  }

  const goalId = Date.now();
  const newGoal = { id: goalId, name, target, saved };
  window.bGoals.push(newGoal);
  localStorage.setItem('soyuco_goals', JSON.stringify(window.bGoals));
  
  if (window.currentUser) {
    try {
      const { supabase } = await import('./supabase-client.js');
      await supabase.from('goals').upsert({ 
        id: goalId,
        user_id: window.currentUser.id,
        name: name,
        target: target,
        saved: saved
      });
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }
  
  closeGoalModal();
  renderBudget();
  if (window.showToast) window.showToast('Goal saved!', 'success');
}

async function deleteGoal(id) {
  window.bGoals = window.bGoals.filter(g => g.id !== id);
  localStorage.setItem('soyuco_goals', JSON.stringify(window.bGoals));
  
  if (window.currentUser) {
    try {
      const { supabase } = await import('./supabase-client.js');
      await supabase.from('goals').delete().eq('id', id);
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }
  
  renderBudget();
  if (window.showToast) window.showToast('Goal deleted!', 'success');
}

async function deleteLimit(cat) {
  window.bLimits = window.bLimits.filter(l => l.cat !== cat);
  localStorage.setItem('soyuco_limits', JSON.stringify(window.bLimits));
  
  if (window.currentUser) {
    try {
      const { supabase } = await import('./supabase-client.js');
      await supabase.from('budget_limits').delete().eq('category', cat);
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }
  
  renderBudget();
  if (window.showToast) window.showToast('Budget limit deleted!', 'success');
}

function openLimitModal() {
  document.getElementById('limitAmt').value = '';
  document.getElementById('limitModal').style.display = 'flex';
}

function closeLimitModal() {
  document.getElementById('limitModal').style.display = 'none';
}

async function saveLimit() {
  const cat = document.getElementById('limitCat').value;
  const amount = parseFloat(document.getElementById('limitAmt').value);

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid limit.');
    return;
  }

  window.bLimits = window.bLimits.filter(l => l.cat !== cat);
  window.bLimits.push({ cat, amount });
  localStorage.setItem('soyuco_limits', JSON.stringify(window.bLimits));
  
  if (window.currentUser) {
    try {
      const { supabase } = await import('./supabase-client.js');
      await supabase.from('budget_limits').upsert({ 
        user_id: window.currentUser.id,
        category: cat,
        amount: amount
      });
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }
  
  closeLimitModal();
  renderBudget();
  if (window.showToast) window.showToast('Budget limit saved!', 'success');
}

// ===========================
// BUDGET — Render
// ===========================

function renderBudget() {
  renderTrendChart();
  
  const income = window.bTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = window.bTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  document.getElementById('bIncome').textContent = '$' + income.toFixed(2);
  document.getElementById('bExpenses').textContent = '$' + expenses.toFixed(2);

  const balEl = document.getElementById('bBalance');
  balEl.textContent = (balance < 0 ? '-$' : '$') + Math.abs(balance).toFixed(2);
  balEl.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';

  const totalSaved = window.bGoals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = window.bGoals.reduce((s, g) => s + g.target, 0);
  document.getElementById('bSavings').textContent = '$' + totalSaved.toFixed(2);
  document.getElementById('bSavingsPct').textContent = totalTarget > 0 ? Math.round(totalSaved / totalTarget * 100) + '%' : '0%';

  // Transactions list
  const txList = document.getElementById('txList');
  const txEmpty = document.getElementById('txEmpty');

  if (!window.bTransactions.length) {
    txList.innerHTML = '';
    txEmpty.style.display = 'block';
  } else {
    txEmpty.style.display = 'none';
    txList.innerHTML = [...window.bTransactions].reverse().map(t => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);">
        <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'};"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--font-ui);font-size:0.82rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(t.desc)}</div>
          <div style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text3);margin-top:2px;">${CAT_LABELS[t.cat] || t.cat} · ${t.date}</div>
        </div>
        <div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'};">${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</div>
        <button onclick="openTxModal(${t.id})" style="font-size:0.65rem;color:var(--text3);padding:2px 6px;background:none;border:1px solid transparent;border-radius:var(--radius);cursor:pointer;">✎</button>
      </div>
    `).join('');
  }

  // Category breakdown
  const catTotals = {};
  window.bTransactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.cat] = (catTotals[t.cat] || 0) + t.amount;
  });
  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const byCat = document.getElementById('byCat');
  const byCatEmpty = document.getElementById('byCatEmpty');

  if (!catEntries.length) {
    byCat.innerHTML = '';
    byCatEmpty.style.display = 'block';
  } else {
    byCatEmpty.style.display = 'none';
    const maxV = catEntries[0][1];
    byCat.innerHTML = catEntries.map(([cat, amt]) => `
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-family:var(--font-ui);font-size:0.78rem;color:var(--text2);">${CAT_LABELS[cat] || cat}</span>
          <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--accent2);">$${amt.toFixed(2)}</span>
        </div>
        <div style="height:5px;background:var(--bg3);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${Math.round(amt / maxV * 100)}%;background:var(--accent);border-radius:4px;"></div>
        </div>
      </div>
    `).join('');
  }

  // Goals
  const goalsList = document.getElementById('goalsList');
  const goalsEmpty = document.getElementById('goalsEmpty');

  if (!window.bGoals.length) {
    goalsList.innerHTML = '';
    goalsEmpty.style.display = 'block';
  } else {
    goalsEmpty.style.display = 'none';
    goalsList.innerHTML = window.bGoals.map(g => {
      const pct = Math.min(100, Math.round(g.saved / g.target * 100));
      const isComplete = pct >= 100;
      return `<div style="display:flex;flex-direction:column;gap:6px;padding:12px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-family:var(--font-ui);font-size:0.82rem;color:var(--text);font-weight:500;">${isComplete ? '🎉 ' : ''}${escHtml(g.name)}</span>
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-family:var(--font-mono);font-size:0.68rem;color:var(--accent2);">${pct}%</span>
            <button onclick="deleteGoal(${g.id})" style="font-size:0.65rem;color:var(--text3);background:none;border:none;cursor:pointer;">✕</button>
          </span>
        </div>
        <div style="height:7px;background:var(--bg3);border-radius:8px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:8px;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
          <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text3);">$${g.saved.toFixed(2)} of $${g.target.toFixed(2)}</span>
          <button onclick="openSavingsModal(${g.id})" style="font-family:var(--font-ui);font-size:0.65rem;padding:3px 8px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);color:var(--text2);cursor:pointer;">± Add / Remove</button>
        </div>
      </div>`;
    }).join('');
  }

  // Limits
  const limitsList = document.getElementById('limitsList');
  const limitsEmpty = document.getElementById('limitsEmpty');

  if (!window.bLimits.length) {
    limitsList.innerHTML = '';
    limitsEmpty.style.display = 'block';
  } else {
    limitsEmpty.style.display = 'none';
    limitsList.innerHTML = window.bLimits.map(l => {
      const spent = catTotals[l.cat] || 0;
      const pct = Math.min(100, Math.round(spent / l.amount * 100));
      const col = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--accent2)' : 'var(--success)';
      return `<div style="display:flex;flex-direction:column;gap:4px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-family:var(--font-ui);font-size:0.8rem;color:var(--text);">${CAT_LABELS[l.cat] || l.cat}</span>
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-family:var(--font-mono);font-size:0.65rem;color:${col};">$${spent.toFixed(0)} / $${l.amount.toFixed(0)}</span>
            <button onclick="deleteLimit('${l.cat}')" style="font-size:0.6rem;color:var(--text3);padding:1px 4px;background:none;border:none;cursor:pointer;">✕</button>
          </span>
        </div>
        <div style="height:5px;background:var(--bg3);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${col};border-radius:4px;"></div>
        </div>
      </div>`;
    }).join('');
  }
}