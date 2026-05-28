// ===========================
// COLLECTIONS
// ===========================

function saveCollections() {
  localStorage.setItem('soyuco_collections', JSON.stringify(collections));
  renderCollectionsSidebar();
}

function renderCollectionsSidebar() {
  const container = document.getElementById('collectionsNav');
  if (!container) return;

  container.innerHTML = collections.map(c => {
    const count = entries.filter(e => (e.collections || []).includes(c.id)).length;
    const isActive = activeCollectionId === c.id;
    return `
      <div class="nav-item ${isActive ? 'active' : ''}" style="justify-content:space-between;" onclick="selectCollection(${c.id})">
        <span style="display:flex;align-items:center;gap:10px;">
          <span class="icon">◇</span> ${escHtml(c.name)}
        </span>
        <span style="display:flex;align-items:center;gap:6px;">
          <span class="count">${count}</span>
          <button onclick="event.stopPropagation();deleteCollection(${c.id})"
            style="font-size:0.6rem;color:var(--text3);padding:1px 4px;background:none;border:none;cursor:pointer;line-height:1;"
            onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text3)'">✕</button>
        </span>
      </div>`;
  }).join('');
}

function newCollection() {
  document.getElementById('collectionModalInput').value = '';
  openModal('collectionModal');
}

function saveCollectionModal() {
  const name = document.getElementById('collectionModalInput').value.trim();
  if (!name) return;
  collections.push({ id: Date.now(), name });
  saveCollections();
  closeModal('collectionModal');
  if (currentView !== 'journal') {
    const journalBtn = document.querySelector('[data-view="journal"]');
    switchView(journalBtn);
  }
}

let _deleteCollectionId = null;

function deleteCollection(id) {
  _deleteCollectionId = id;
  openModal('deleteCollectionModal');
}

function confirmDeleteCollection() {
  const id = _deleteCollectionId;
  collections = collections.filter(c => c.id !== id);
  entries.forEach(e => {
    if (e.collections) e.collections = e.collections.filter(cid => cid !== id);
  });
  localStorage.setItem('soyuco_entries', JSON.stringify(entries));
  if (activeCollectionId === id) activeCollectionId = null;
  saveCollections();
  closeModal('deleteCollectionModal');
  renderEntryList();
}

function selectCollection(id) {
  activeCollectionId = activeCollectionId === id ? null : id;
  renderCollectionsSidebar();
  renderEntryList();
  // Switch to journal view if not already there
  if (currentView !== 'journal') {
    const journalBtn = document.querySelector('[data-view="journal"]');
    switchView(journalBtn);
  }
}

// Render the collection dropdown inside the entry editor
function renderEntryCollectionPicker() {
  const container = document.getElementById('entryCollectionPicker');
  if (!container) return;
  const entry = entries.find(e => e.id === currentEntryId);
  if (!entry) return;

  const entryCollections = entry.collections || [];

  if (!collections.length) {
    container.innerHTML = `<span style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text3);">No collections yet</span>`;
    return;
  }

  container.innerHTML = collections.map(c => {
    const checked = entryCollections.includes(c.id);
    return `
      <label style="display:flex;align-items:center;gap:6px;font-family:var(--font-ui);font-size:0.78rem;color:var(--text2);cursor:pointer;padding:3px 0;">
        <input type="checkbox" ${checked ? 'checked' : ''}
          onchange="toggleEntryCollection(${c.id}, this.checked)"
          style="accent-color:var(--accent);cursor:pointer;">
        ${escHtml(c.name)}
      </label>`;
  }).join('');
}

function toggleEntryCollection(collectionId, add) {
  const entry = entries.find(e => e.id === currentEntryId);
  if (!entry) return;
  if (!entry.collections) entry.collections = [];
  if (add) {
    if (!entry.collections.includes(collectionId)) entry.collections.push(collectionId);
  } else {
    entry.collections = entry.collections.filter(id => id !== collectionId);
  }
  saveEntries();
  renderCollectionsSidebar();
}

// Auto-create collections from tags when saving
function syncTagCollections(entry) {
  if (!entry.tags || !entry.tags.length) return;
  entry.tags.forEach(tag => {
    const exists = collections.find(c => c.name.toLowerCase() === tag.toLowerCase());
    if (!exists) {
      const newCol = { id: Date.now() + Math.random(), name: tag };
      collections.push(newCol);
      // also assign entry to this new collection
      if (!entry.collections) entry.collections = [];
      entry.collections.push(newCol.id);
    }
  });
  saveCollections();
}

// ===========================
// JOURNAL
// ===========================

function renderEntryList(filter = '') {
  const body = document.getElementById('entryListBody');

  let filtered = entries.filter(e =>
    e.title.toLowerCase().includes(filter.toLowerCase()) ||
    e.body.toLowerCase().includes(filter.toLowerCase())
  );

  // Filter by active collection if one is selected
  if (activeCollectionId !== null) {
    filtered = filtered.filter(e => (e.collections || []).includes(activeCollectionId));
  }

  if (!filtered.length) {
    body.innerHTML = '<div class="empty-state" style="padding:32px 16px;"><div class="empty-sub">No entries yet.<br>Create your first one!</div></div>';
    return;
  }

  body.innerHTML = filtered
    .sort((a, b) => b.date - a.date)
    .map(e => `
      <div class="entry-card ${e.id === currentEntryId ? 'active' : ''}" onclick="openEntry(${e.id})">
        <div class="entry-card-date">${formatDate(e.date)}</div>
        <div class="entry-card-title">${e.title || 'Untitled'}</div>
        <div class="entry-card-preview">${e.body.substring(0, 120) || '<em>No content</em>'}</div>
        <div class="entry-card-tags">${(e.tags || []).map(t => `<span class="tag accent">${t}</span>`).join('')}</div>
      </div>
    `)
    .join('');
}

function filterEntries(val) {
  renderEntryList(val);
}

function newEntry() {
  const id = Date.now();
  entries.unshift({ id, title: '', body: '', date: Date.now(), tags: [] });
  saveEntries();
  openEntry(id, true);
}

function openEntry(id, isNew = false) {
  currentEntryId = id;
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  document.getElementById('editorPlaceholder').style.display = 'none';
  document.getElementById('editorActive').style.display = 'flex';
  document.getElementById('entryTitle').value = entry.title;
  document.getElementById('editorTextarea').value = entry.body;
  document.getElementById('metaDate').textContent = formatDate(entry.date);
  document.getElementById('metaTags').textContent = entry.tags?.length ? entry.tags.join(', ') : 'Add tag';

  updateWordCount();
  renderEntryList(document.querySelector('.entry-search').value);
  renderEntryCollectionPicker();

  if (isNew) document.getElementById('entryTitle').focus();
  else document.getElementById('editorTextarea').focus();
}

function saveEntry() {
  const entry = entries.find(e => e.id === currentEntryId);
  if (!entry) return;
  entry.title = document.getElementById('entryTitle').value;
  entry.body  = document.getElementById('editorTextarea').value;
  saveEntries();
  renderEntryList();
}

function deleteEntry() {
  if (!currentEntryId) return;
  openModal('deleteEntryModal');
}

function confirmDeleteEntry() {
  entries = entries.filter(e => e.id !== currentEntryId);
  currentEntryId = null;
  saveEntries();
  closeModal('deleteEntryModal');
  document.getElementById('editorActive').style.display = 'none';
  document.getElementById('editorPlaceholder').style.display = 'flex';
  renderEntryList();
}

function onTitleChange() {
  const e = entries.find(e => e.id === currentEntryId);
  if (e) {
    e.title = document.getElementById('entryTitle').value;
    saveEntries();
    renderEntryList();
  }
}

function onBodyChange() {
  const e = entries.find(e => e.id === currentEntryId);
  if (e) e.body = document.getElementById('editorTextarea').value;
  updateWordCount();
}

function updateWordCount() {
  const w = document.getElementById('editorTextarea').value
    .trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('wordCount').textContent = w;
}

function saveEntries() {
  localStorage.setItem('soyuco_entries', JSON.stringify(entries));
  document.getElementById('entryCount').textContent = entries.length;
}

function addTag() {
  document.getElementById('tagModalInput').value = '';
  openModal('tagModal');
}

function saveTagModal() {
  const tag = document.getElementById('tagModalInput').value.trim().toLowerCase();
  if (!tag) return;
  const entry = entries.find(e => e.id === currentEntryId);
  if (!entry) return;
  if (!entry.tags) entry.tags = [];
  if (!entry.tags.includes(tag)) entry.tags.push(tag);
  syncTagCollections(entry);
  saveEntries();
  document.getElementById('metaTags').textContent = entry.tags.join(', ');
  closeModal('tagModal');
  renderEntryList();
  renderEntryCollectionPicker();
}

function changeEditorFont(val) {
  document.getElementById('editorTextarea').style.fontFamily = val;
  document.getElementById('entryTitle').style.fontFamily = val;
}

async function aiAssistEntry() {
  const body  = document.getElementById('editorTextarea');
  const title = document.getElementById('entryTitle').value;
  const current = body.value;

  if (!current.trim() && !title) { alert('Write something first!'); return; }

  const btn  = document.querySelector('[onclick="aiAssistEntry()"]');
  const orig = btn.textContent;
  btn.innerHTML = '<span class="spin">⬡</span> Writing…';
  btn.disabled = true;

  try {
    const prompt = current.trim()
      ? `You are a thoughtful journal writing assistant. The user has started a journal entry titled "${title || 'Untitled'}". Continue it naturally in their voice — about 2-3 more paragraphs. Don't add a title, just continue the text:\n\n${current}`
      : `Start a journal entry titled "${title}". Write 2-3 paragraphs in a personal, reflective, first-person voice.`;

    const res = await callClaude(prompt);
    body.value = current + (current && !current.endsWith('\n') ? '\n\n' : '') + res;
    onBodyChange();
  } catch (e) {
    alert('AI assist failed.');
  }

  btn.textContent = orig;
  btn.disabled = false;
}
