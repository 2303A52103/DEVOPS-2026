/* ═══════════════════════════════════════════════════════
   Tourist Place Recommender — app.js
   ═══════════════════════════════════════════════════════ */

const API = 'http://localhost:5001/api';

const AVATARS = ['👤', '🧑‍🌾', '👩‍✈️', '🧑‍💻', '👩‍🎨', '🧑‍🚀', '👩‍🔬', '🧑‍🍳', '👨‍🏫', '👩‍⚕️',
  '🦸', '🧙', '🧚', '🦊', '🐼', '🐨', '🦁', '🐯', '🦋', '🌺'];

const CAT_COLORS = {
  beach: '#e67e22', hill: '#27ae60', city: '#2980b9',
  forest: '#16a085', desert: '#d4ac0d', historical: '#8e44ad', adventure: '#c0392b',
};

/* ── SAFE DOM HELPER ─────────────────────────────────── */
const $ = (id) => document.getElementById(id);

/* safe addEventListener — silently skips if element missing */
function on(id, event, fn) {
  const el = typeof id === 'string' ? $(id) : id;
  if (el) el.addEventListener(event, fn);
}

/* safe text setter */
function setText(id, val) {
  const el = typeof id === 'string' ? $(id) : id;
  if (el) el.textContent = val;
}

/* safe class toggle */
function show(id) { const el = $(id); if (el) el.classList.remove('hidden'); }
function hide(id) { const el = $(id); if (el) el.classList.add('hidden'); }

/* ── AUTH ────────────────────────────────────────────── */
const auth = {
  getToken: () => localStorage.getItem('wl_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('wl_user')); } catch { return null; } },
  save(token, user) {
    localStorage.setItem('wl_token', token);
    localStorage.setItem('wl_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('wl_token');
    localStorage.removeItem('wl_user');
  },
  isLoggedIn: () => !!localStorage.getItem('wl_token'),
  isAdmin: () => { const u = auth.getUser(); return !!(u && u.role === 'admin'); },
  headers() { const t = auth.getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; },
};

/* ── STATE ───────────────────────────────────────────── */
const state = {
  currentPage: 'home',
  category: 'all', search: '', location: '', budget: 'all', sort: 'rating', view: 'grid',
  allPlaces: [], mapCategory: 'all', mapSearch: '',
};

let mainMap = null, mapMarkers = [], pickerMap = null, pickerMarker = null;

/* ══════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════ */
function navigateTo(page) {
  if (page === 'admin') {
    if (!auth.isLoggedIn()) { showToast('Please log in first', 'error'); navigateTo('login'); return; }
    if (!auth.isAdmin()) { showToast('Admin access only', 'error'); return; }
  }
  if (page === 'profile') {
    if (!auth.isLoggedIn()) { showToast('Please log in first', 'error'); navigateTo('login'); return; }
  }

  closeDropdown();
  state.currentPage = page;

  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));

  const pg = $(`page-${page}`);
  const link = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (pg) pg.classList.add('active');
  if (link) link.classList.add('active');

  if (page === 'admin') { loadAdminData(); setTimeout(initPickerMap, 300); }
  if (page === 'home') fetchPlaces();
  if (page === 'map') setTimeout(initMainMap, 100);
  if (page === 'profile') loadProfilePage();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* single delegated click handler for ALL data-page links/buttons */
document.addEventListener('click', (e) => {
  /* ── data-page navigation ── */
  const navEl = e.target.closest('a[data-page], button[data-page]');
  if (navEl) {
    e.preventDefault();
    navigateTo(navEl.dataset.page);
    return;
  }

  /* ── profile dropdown close on outside click ── */
  if (!e.target.closest('#nav-user')) {
    closeDropdown();
  }

  /* ── password show/hide toggle ── */
  const pwBtn = e.target.closest('.toggle-pw');
  if (pwBtn) {
    const input = $(pwBtn.dataset.target);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
      pwBtn.textContent = input.type === 'password' ? '👁' : '🙈';
    }
  }
});

/* ── DROPDOWN ────────────────────────────────────────── */
function closeDropdown() {
  const dd = $('profile-dropdown');
  if (dd) dd.classList.add('hidden');
}

on('btn-profile-trigger', 'click', (e) => {
  e.stopPropagation();
  const dd = $('profile-dropdown');
  if (dd) dd.classList.toggle('hidden');
});

/* ══════════════════════════════════════════════════════
   SYNC NAV UI
   ══════════════════════════════════════════════════════ */
function syncNavUI() {
  if (auth.isLoggedIn()) {
    const user = auth.getUser() || {};
    const av = user.avatar || '👤';

    hide('nav-guest');
    show('nav-user');

    setText('nav-user-name', user.name || '');
    setText('nav-avatar', av);
    setText('dropdown-avatar', av);
    setText('dropdown-name', user.name || '');
    setText('dropdown-email', user.email || '');

    const adminLink = document.querySelector('.nav-admin');
    const adminDdLink = document.querySelector('.nav-admin-dd');
    if (auth.isAdmin()) {
      adminLink && adminLink.classList.remove('hidden');
      adminDdLink && adminDdLink.classList.remove('hidden');
    } else {
      adminLink && adminLink.classList.add('hidden');
      adminDdLink && adminDdLink.classList.add('hidden');
    }
  } else {
    show('nav-guest');
    hide('nav-user');
    document.querySelector('.nav-admin') && document.querySelector('.nav-admin').classList.add('hidden');
    document.querySelector('.nav-admin-dd') && document.querySelector('.nav-admin-dd').classList.add('hidden');
  }
}

/* ══════════════════════════════════════════════════════
   AUTH — LOGOUT
   ══════════════════════════════════════════════════════ */
on('btn-logout', 'click', async () => {
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: { ...auth.headers(), 'Content-Type': 'application/json' },
    });
  } catch { /* ignore */ }
  auth.clear();
  syncNavUI();
  showToast('Logged out. Safe travels! 👋');
  navigateTo('home');
});

/* ══════════════════════════════════════════════════════
   AUTH — LOGIN
   ══════════════════════════════════════════════════════ */
on('btn-login', 'click', handleLogin);
on('login-password', 'keydown', (e) => { if (e.key === 'Enter') handleLogin(); });

async function handleLogin() {
  const btn = $('btn-login');
  const emailEl = $('login-email');
  const passEl = $('login-password');
  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) {
    showAuthMsg('login', 'Please enter your email and password', 'error');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    auth.save(data.token, data.user);
    syncNavUI();
    showToast(data.message || 'Welcome back!', 'success');
    emailEl.value = '';
    passEl.value = '';
    navigateTo('home');
  } catch (err) {
    showAuthMsg('login', err.message || 'Login failed. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sign in'; }
  }
}

/* ══════════════════════════════════════════════════════
   AUTH — REGISTER
   ══════════════════════════════════════════════════════ */
on('btn-register', 'click', handleRegister);
on('reg-confirm', 'keydown', (e) => { if (e.key === 'Enter') handleRegister(); });

async function handleRegister() {
  const btn = $('btn-register');
  const nameEl = $('reg-name');
  const emailEl = $('reg-email');
  const passEl = $('reg-password');
  const confEl = $('reg-confirm');
  if (!nameEl || !emailEl || !passEl || !confEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passEl.value;
  const confirm = confEl.value;

  if (!name || !email || !password || !confirm) {
    showAuthMsg('register', 'Please fill in all fields', 'error'); return;
  }
  if (password !== confirm) {
    showAuthMsg('register', 'Passwords do not match', 'error'); return;
  }
  if (password.length < 6) {
    showAuthMsg('register', 'Password must be at least 6 characters', 'error'); return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    auth.save(data.token, data.user);
    syncNavUI();
    showToast(data.message || 'Account created!', 'success');
    [nameEl, emailEl, passEl, confEl].forEach((el) => { el.value = ''; });
    navigateTo('home');
  } catch (err) {
    showAuthMsg('register', err.message || 'Registration failed. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Create account'; }
  }
}

function showAuthMsg(page, text, type) {
  const box = $(`${page}-message`);
  if (!box) return;
  box.textContent = text;
  box.className = `form-message ${type}`;
  box.classList.remove('hidden');
  clearTimeout(box._t);
  box._t = setTimeout(() => box.classList.add('hidden'), 5000);
}

/* ══════════════════════════════════════════════════════
   PROFILE PAGE
   ══════════════════════════════════════════════════════ */
async function loadProfilePage() {
  try {
    const res = await fetch(`${API}/auth/me`, { headers: auth.headers() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    populateProfileUI(data.user);
  } catch (err) {
    showToast('Failed to load profile: ' + (err.message || ''), 'error');
  }
}

function populateProfileUI(user) {
  const av = user.avatar || '👤';
  setText('profile-avatar-display', av);
  setText('profile-display-name', user.name);
  setText('profile-display-email', user.email);
  setText('profile-member-since', `Member since ${new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`);

  const badge = $('profile-role-badge');
  if (badge) {
    badge.textContent = user.role;
    badge.className = `profile-role-badge${user.role === 'admin' ? ' admin' : ''}`;
  }

  const pName = $('p-name');
  const pEmail = $('p-email');
  if (pName) pName.value = user.name;
  if (pEmail) pEmail.value = user.email;

  setText('ai-role', user.role);
  setText('ai-since', new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  setText('ai-id', user.id || user._id || '');

  buildAvatarGrid(av);
}

function buildAvatarGrid(currentAvatar) {
  const grid = $('avatar-grid');
  if (!grid) return;
  grid.innerHTML = AVATARS.map((a) =>
    `<div class="avatar-opt${a === currentAvatar ? ' active' : ''}" data-avatar="${a}">${a}</div>`
  ).join('');

  grid.querySelectorAll('.avatar-opt').forEach((opt) => {
    opt.addEventListener('click', async () => {
      grid.querySelectorAll('.avatar-opt').forEach((o) => o.classList.remove('active'));
      opt.classList.add('active');
      const av = opt.dataset.avatar;
      try {
        const res = await fetch(`${API}/auth/update-profile`, {
          method: 'PUT',
          headers: { ...auth.headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: av }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        const user = auth.getUser();
        if (user) { user.avatar = av; auth.save(auth.getToken(), user); }
        syncNavUI();
        setText('profile-avatar-display', av);
        showToast('Avatar updated!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to update avatar', 'error');
      }
    });
  });
}

on('btn-save-profile', 'click', async () => {
  const btn = $('btn-save-profile');
  const nameEl = $('p-name'), emailEl = $('p-email');
  if (!nameEl || !emailEl) return;
  const name = nameEl.value.trim(), email = emailEl.value.trim();
  if (!name || !email) { showProfileMsg('info', 'Please fill in name and email', 'error'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    const res = await fetch(`${API}/auth/update-profile`, {
      method: 'PUT',
      headers: { ...auth.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const user = auth.getUser();
    if (user) { user.name = data.user.name; user.email = data.user.email; auth.save(auth.getToken(), user); }
    syncNavUI();
    populateProfileUI({ ...data.user, createdAt: data.user.createdAt || new Date().toISOString() });
    showProfileMsg('info', 'Profile updated successfully! ✅', 'success');
    showToast('Profile saved!', 'success');
  } catch (err) {
    showProfileMsg('info', err.message || 'Failed to save', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
  }
});

on('btn-change-pw', 'click', async () => {
  const btn = $('btn-change-pw');
  const curEl = $('p-current-pw');
  const newEl = $('p-new-pw');
  const confEl = $('p-confirm-pw');
  if (!curEl || !newEl || !confEl) return;
  const currentPassword = curEl.value;
  const newPassword = newEl.value;
  const confirmPw = confEl.value;
  if (!currentPassword || !newPassword || !confirmPw) { showProfileMsg('pw', 'Please fill in all password fields', 'error'); return; }
  if (newPassword !== confirmPw) { showProfileMsg('pw', 'New passwords do not match', 'error'); return; }
  if (newPassword.length < 6) { showProfileMsg('pw', 'New password must be at least 6 characters', 'error'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Updating…'; }
  try {
    const res = await fetch(`${API}/auth/change-password`, {
      method: 'PUT',
      headers: { ...auth.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    curEl.value = ''; newEl.value = ''; confEl.value = '';
    showProfileMsg('pw', 'Password changed successfully! 🔒', 'success');
    showToast('Password updated!', 'success');
  } catch (err) {
    showProfileMsg('pw', err.message || 'Failed to change password', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Update Password'; }
  }
});

function showProfileMsg(type, text, cls) {
  const id = type === 'pw' ? 'profile-pw-msg' : 'profile-info-msg';
  const box = $(id);
  if (!box) return;
  box.textContent = text;
  box.className = `form-message ${cls}`;
  box.classList.remove('hidden');
  clearTimeout(box._t);
  box._t = setTimeout(() => box.classList.add('hidden'), 5000);
}

/* ══════════════════════════════════════════════════════
   EXPLORE PAGE — SEARCH & FILTERS
   ══════════════════════════════════════════════════════ */
on('btn-search', 'click', performSearch);
on('search-input', 'keydown', (e) => { if (e.key === 'Enter') performSearch(); });
on('btn-apply-filters', 'click', performSearch);
on('btn-reset-filters', 'click', resetFilters);
on('btn-empty-reset', 'click', resetFilters);
on('btn-goto-map', 'click', () => navigateTo('map'));

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.category = chip.dataset.cat;
    fetchPlaces();
  });
});

document.querySelectorAll('.view-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.view = btn.dataset.view;
    const grid = $('places-grid');
    if (grid) grid.className = `places-grid${state.view === 'list' ? ' list-view' : ''}`;
  });
});

function performSearch() {
  state.search = ($('search-input') || { value: '' }).value.trim();
  state.location = ($('filter-location') || { value: '' }).value.trim();
  state.budget = ($('filter-budget') || { value: 'all' }).value;
  state.sort = ($('filter-sort') || { value: 'rating' }).value;
  fetchPlaces();
}

function resetFilters() {
  ['search-input', 'filter-location'].forEach((id) => { const el = $(id); if (el) el.value = ''; });
  const fb = $('filter-budget'), fs = $('filter-sort');
  if (fb) fb.value = 'all';
  if (fs) fs.value = 'rating';
  Object.assign(state, { search: '', location: '', budget: 'all', sort: 'rating', category: 'all' });
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  const allChip = document.querySelector('.chip[data-cat="all"]');
  if (allChip) allChip.classList.add('active');
  fetchPlaces();
}

/* ══════════════════════════════════════════════════════
   FETCH & RENDER PLACES
   ══════════════════════════════════════════════════════ */
async function fetchPlaces() {
  showLoading(true);
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.location) params.set('location', state.location);
  if (state.budget !== 'all') params.set('budget', state.budget);
  if (state.category !== 'all') params.set('category', state.category);
  if (state.sort) params.set('sort', state.sort);
  params.set('limit', '100');
  try {
    const res = await fetch(`${API}/places?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    state.allPlaces = data.data;
    renderPlaces(data.data, data.total);
  } catch (err) {
    showToast('Failed to load destinations. Is the server running?', 'error');
    renderPlaces([], 0);
  } finally {
    showLoading(false);
  }
}

function renderPlaces(places, total) {
  const grid = $('places-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const empty = $('empty-state');
  const count = $('results-count');

  if (!places.length) {
    if (empty) empty.classList.remove('hidden');
    if (count) count.textContent = 'No destinations found';
    return;
  }
  if (empty) empty.classList.add('hidden');
  if (count) count.innerHTML = `Showing <strong>${places.length}</strong> of <strong>${total}</strong> destinations`;
  places.forEach((place, i) => grid.appendChild(createCard(place, i)));
}

function createCard(place, index) {
  const card = document.createElement('div');
  card.className = 'place-card';
  card.style.animationDelay = `${index * 0.04}s`;
  const img = place.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(place.name)}/800/500`;
  const budgetLabel = { low: '$ Budget', medium: '$$ Mid-range', high: '$$$ Luxury' }[place.budget] || '';
  card.innerHTML = `
    <div class="card-img-wrap">
      <img class="card-img" src="${img}" alt="${escHtml(place.name)}" loading="lazy"
           onerror="this.src='https://picsum.photos/seed/${index}/800/500'" />
      <span class="card-category-badge">${place.category}</span>
      ${budgetLabel ? `<span class="card-budget-badge">${budgetLabel}</span>` : ''}
    </div>
    <div class="card-body">
      <h3 class="card-title">${escHtml(place.name)}</h3>
      <p class="card-location">📍 ${escHtml(place.location)}</p>
      <p class="card-desc">${escHtml(place.description)}</p>
      <div class="card-footer">
        <div class="card-rating"><span class="stars">${renderStars(place.rating)}</span> <span>${place.rating ? place.rating.toFixed(1) : 'N/A'}</span></div>
        ${place.bestTimeToVisit ? `<span class="card-best-time">🗓 ${escHtml(place.bestTimeToVisit)}</span>` : ''}
      </div>
      ${place.lat && place.lng ? `<button class="btn-show-map" data-lat="${place.lat}" data-lng="${place.lng}" data-id="${place._id}">📍 Show on Map</button>` : ''}
    </div>`;

  card.addEventListener('click', (e) => {
    const mapBtn = e.target.closest('.btn-show-map');
    if (mapBtn) {
      e.stopPropagation();
      navigateTo('map');
      setTimeout(() => flyToPlace(place), 500);
    } else {
      openModal(place);
    }
  });
  return card;
}

function renderStars(r) {
  if (!r) return '☆☆☆☆☆';
  const full = Math.floor(r), half = r % 1 >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ══════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════ */
function openModal(place) {
  const img = place.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(place.name)}/800/500`;
  const budgetLabel = { low: 'Budget Friendly ($)', medium: 'Mid-range ($$)', high: 'Luxury ($$$)' }[place.budget] || 'N/A';
  const content = $('modal-content');
  if (!content) return;
  content.innerHTML = `
    <img class="modal-img" src="${img}" alt="${escHtml(place.name)}"
         onerror="this.src='https://picsum.photos/seed/fallback/800/500'" />
    <div class="modal-body">
      <div class="modal-meta">
        <span class="card-category-badge" style="position:static">${place.category}</span>
        <span class="card-rating"><span class="stars">${renderStars(place.rating)}</span> ${place.rating ? place.rating.toFixed(1) : 'N/A'}</span>
      </div>
      <h2 class="modal-title">${escHtml(place.name)}</h2>
      <p class="modal-location">📍 ${escHtml(place.location)}</p>
      <p class="modal-desc">${escHtml(place.description)}</p>
      <div class="modal-details">
        <div class="modal-detail-item"><div class="modal-detail-label">Category</div><div class="modal-detail-value">${place.category}</div></div>
        <div class="modal-detail-item"><div class="modal-detail-label">Budget</div><div class="modal-detail-value">${budgetLabel}</div></div>
        <div class="modal-detail-item"><div class="modal-detail-label">Best Time</div><div class="modal-detail-value">${place.bestTimeToVisit || 'Year round'}</div></div>
        <div class="modal-detail-item"><div class="modal-detail-label">Rating</div><div class="modal-detail-value">${place.rating ? place.rating + ' / 5' : 'Not rated'}</div></div>
      </div>
      ${place.lat && place.lng ? `
        <button class="btn-primary" style="margin-top:18px;width:100%" id="modal-map-btn">📍 View on Map</button>` : ''}
    </div>`;

  const mapBtn = $('modal-map-btn');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      closeModal();
      navigateTo('map');
      setTimeout(() => flyToPlace(place), 500);
    });
  }

  const overlay = $('place-modal');
  if (overlay) overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

on('modal-close', 'click', closeModal);
on('place-modal', 'click', (e) => { if (e.target === $('place-modal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
  const overlay = $('place-modal');
  if (overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════════
   LEAFLET MAP
   ══════════════════════════════════════════════════════ */
function initMainMap() {
  const mapEl = $('main-map');
  if (!mapEl) return;

  if (mainMap) {
    mainMap.invalidateSize();
    const filtered = getFilteredPlaces();
    renderMapMarkers(filtered);
    renderMapSidebar(filtered);
    return;
  }

  mainMap = L.map('main-map', { zoomControl: true }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(mainMap);

  const loadAndRender = () => {
    const filtered = getFilteredPlaces();
    renderMapMarkers(filtered);
    renderMapSidebar(filtered);
  };

  if (state.allPlaces.length) {
    loadAndRender();
  } else {
    fetch(`${API}/places?limit=200`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) { state.allPlaces = data.data; loadAndRender(); }
      });
  }

  document.querySelectorAll('.map-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.map-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.mapCategory = chip.dataset.cat;
      const f = getFilteredPlaces();
      renderMapMarkers(f);
      renderMapSidebar(f);
    });
  });

  on('map-search', 'input', () => {
    state.mapSearch = ($('map-search') || { value: '' }).value.toLowerCase();
    const f = getFilteredPlaces();
    renderMapMarkers(f);
    renderMapSidebar(f);
  });
}

function getFilteredPlaces() {
  return state.allPlaces.filter((p) => {
    const catOk = state.mapCategory === 'all' || p.category === state.mapCategory;
    const srchOk = !state.mapSearch ||
      p.name.toLowerCase().includes(state.mapSearch) ||
      p.location.toLowerCase().includes(state.mapSearch);
    return catOk && srchOk;
  });
}

function makeColorMarker(place) {
  const color = CAT_COLORS[place.category] || '#888';
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="white"/></svg>`,
    className: '', iconSize: [28, 38], iconAnchor: [14, 38], popupAnchor: [0, -38],
  });
}

function renderMapMarkers(places) {
  if (!mainMap) return;
  mapMarkers.forEach((m) => mainMap.removeLayer(m));
  mapMarkers = [];
  places.forEach((place) => {
    if (!place.lat || !place.lng) return;
    const marker = L.marker([place.lat, place.lng], { icon: makeColorMarker(place) });
    const img = place.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(place.name)}/400/200`;
    const bLabel = { low: 'Budget', medium: 'Mid-range', high: 'Luxury' }[place.budget] || '';
    marker.bindPopup(`
      <div class="map-popup">
        <img class="map-popup-img" src="${img}" alt="${escHtml(place.name)}"
             onerror="this.src='https://picsum.photos/seed/fallback/400/200'" />
        <div class="map-popup-body">
          <div class="map-popup-name">${escHtml(place.name)}</div>
          <div class="map-popup-loc">📍 ${escHtml(place.location)}</div>
          <div class="map-popup-badges">
            <span class="map-popup-badge badge-cat">${place.category}</span>
            ${place.rating ? `<span class="map-popup-badge badge-rate">⭐ ${place.rating}</span>` : ''}
            ${bLabel ? `<span class="map-popup-badge badge-budget">${bLabel}</span>` : ''}
          </div>
          <button class="map-popup-btn" onclick="window._openById('${place._id}')">View Details</button>
        </div>
      </div>`, { maxWidth: 260 });
    marker.addTo(mainMap);
    mapMarkers.push(marker);
  });
}

function renderMapSidebar(places) {
  const list = $('map-place-list');
  if (!list) return;
  if (!places.length) { list.innerHTML = '<div class="map-no-results">No destinations match</div>'; return; }
  list.innerHTML = places.map((p) => {
    const img = p.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(p.name)}/100/100`;
    return `<div class="map-place-item" data-id="${p._id}">
      <img class="map-place-thumb" src="${img}" alt="${escHtml(p.name)}"
           onerror="this.src='https://picsum.photos/seed/${p._id}/100/100'" />
      <div class="map-place-info">
        <div class="map-place-name">${escHtml(p.name)}</div>
        <div class="map-place-loc">📍 ${escHtml(p.location)}</div>
        ${p.rating ? `<div class="map-place-rating">⭐ ${p.rating}</div>` : ''}
      </div></div>`;
  }).join('');

  list.querySelectorAll('.map-place-item').forEach((item) => {
    item.addEventListener('click', () => {
      const place = state.allPlaces.find((p) => p._id === item.dataset.id);
      if (!place) return;
      list.querySelectorAll('.map-place-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      if (place.lat && place.lng) flyToPlace(place);
      else openModal(place);
    });
  });
}

function flyToPlace(place) {
  if (!mainMap || !place.lat || !place.lng) return;
  mainMap.flyTo([place.lat, place.lng], 10, { duration: 1.2 });
  const marker = mapMarkers.find((m) => {
    const ll = m.getLatLng();
    return Math.abs(ll.lat - place.lat) < 0.001 && Math.abs(ll.lng - place.lng) < 0.001;
  });
  if (marker) setTimeout(() => marker.openPopup(), 1300);
  const item = document.querySelector(`.map-place-item[data-id="${place._id}"]`);
  if (item) {
    document.querySelectorAll('.map-place-item').forEach((i) => i.classList.remove('active'));
    item.classList.add('active');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

window._openById = (id) => {
  const place = state.allPlaces.find((p) => p._id === id);
  if (place) openModal(place);
};

/* ── ADMIN PICKER MAP ────────────────────────────────── */
function initPickerMap() {
  const pickerEl = $('picker-map');
  if (!pickerEl) return;
  if (pickerMap) { pickerMap.invalidateSize(); return; }
  pickerMap = L.map('picker-map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(pickerMap);
  pickerMap.on('click', (e) => {
    const { lat, lng } = e.latlng;
    const latEl = $('f-lat'), lngEl = $('f-lng'), hint = $('picker-hint');
    if (latEl) latEl.value = lat.toFixed(6);
    if (lngEl) lngEl.value = lng.toFixed(6);
    if (hint) hint.textContent = `📍 Selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    if (pickerMarker) pickerMap.removeLayer(pickerMarker);
    pickerMarker = L.marker([lat, lng]).addTo(pickerMap);
  });
}

['f-lat', 'f-lng'].forEach((id) => {
  on(id, 'change', () => {
    const lat = parseFloat(($('f-lat') || {}).value);
    const lng = parseFloat(($('f-lng') || {}).value);
    if (!isNaN(lat) && !isNaN(lng) && pickerMap) {
      if (pickerMarker) pickerMap.removeLayer(pickerMarker);
      pickerMarker = L.marker([lat, lng]).addTo(pickerMap);
      pickerMap.setView([lat, lng], 8);
    }
  });
});

/* ── ADMIN DATA ──────────────────────────────────────── */
async function loadAdminData() {
  await Promise.all([loadStats(), loadAdminList()]);
}

async function loadStats() {
  try {
    const res = await fetch(`${API}/admin/stats`, { headers: auth.headers() });
    const data = await res.json();
    if (!data.success) throw new Error();
    const { total, byCategory, averageRating } = data.data;
    const max = byCategory[0]?.count || 1;
    const sc = $('stats-content');
    if (sc) sc.innerHTML = `
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-num">${total}</div><div class="stat-label">Destinations</div></div>
        <div class="stat-box"><div class="stat-num">${averageRating}</div><div class="stat-label">Avg Rating</div></div>
      </div>
      <div class="category-bar">
        ${byCategory.map((c) => `<div class="cat-row"><span class="cat-label">${c._id}</span><div class="cat-track"><div class="cat-fill" style="width:${(c.count / max) * 100}%"></div></div><span class="cat-count">${c.count}</span></div>`).join('')}
      </div>`;
  } catch {
    const sc = $('stats-content');
    if (sc) sc.innerHTML = `<p style="color:var(--ink-3);font-size:.85rem">Unable to load stats</p>`;
  }
}

async function loadAdminList() {
  const list = $('admin-list');
  if (!list) return;
  try {
    const res = await fetch(`${API}/admin/places`, { headers: auth.headers() });
    const data = await res.json();
    if (!data.success) throw new Error();
    if (!data.data.length) { list.innerHTML = '<p style="color:var(--ink-3);font-size:.85rem;text-align:center;padding:20px">No destinations yet</p>'; return; }
    list.innerHTML = data.data.map((p) => `
      <div class="admin-list-item">
        <span class="admin-list-name">${escHtml(p.name)}</span>
        <span class="admin-list-meta">⭐ ${p.rating || '—'}</span>
        <button class="btn-delete" data-id="${p._id}">✕</button>
      </div>`).join('');
    list.querySelectorAll('.btn-delete').forEach((btn) =>
      btn.addEventListener('click', () => deletePlace(btn.dataset.id)));
  } catch {
    list.innerHTML = `<p style="color:var(--ink-3);font-size:.85rem">Unable to load list</p>`;
  }
}

async function deletePlace(id) {
  if (!confirm('Remove this destination?')) return;
  try {
    const res = await fetch(`${API}/places/${id}`, { method: 'DELETE', headers: auth.headers() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast('Destination removed', 'success');
    state.allPlaces = state.allPlaces.filter((p) => p._id !== id);
    loadAdminData();
  } catch (err) {
    showToast(err.message || 'Failed to delete', 'error');
  }
}

/* ── ADD PLACE FORM ──────────────────────────────────── */
let selectedFile = null;

on('file-drop', 'click', () => { const fi = $('f-image'); if (fi) fi.click(); });
on('file-drop', 'dragover', (e) => { e.preventDefault(); const fd = $('file-drop'); if (fd) fd.style.borderColor = 'var(--gold)'; });
on('file-drop', 'dragleave', () => { const fd = $('file-drop'); if (fd) fd.style.borderColor = ''; });
on('file-drop', 'drop', (e) => {
  e.preventDefault();
  const fd = $('file-drop'); if (fd) fd.style.borderColor = '';
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) handleFileSelect(f);
});
on('f-image', 'change', () => { const fi = $('f-image'); if (fi && fi.files[0]) handleFileSelect(fi.files[0]); });

function handleFileSelect(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const prev = $('image-preview');
    if (prev) { prev.innerHTML = `<img src="${e.target.result}" alt="preview" />`; prev.classList.remove('hidden'); }
  };
  reader.readAsDataURL(file);
  const txt = document.querySelector('#file-drop .file-drop-text');
  if (txt) txt.textContent = file.name;
}

on('btn-add-place', 'click', submitPlace);
on('btn-clear-form', 'click', clearForm);

async function submitPlace() {
  if (!auth.isLoggedIn()) { showToast('Please log in first', 'error'); navigateTo('login'); return; }
  const btn = $('btn-add-place');
  const fields = {
    name: ($('f-name') || { value: '' }).value.trim(),
    description: ($('f-desc') || { value: '' }).value.trim(),
    location: ($('f-location') || { value: '' }).value.trim(),
    category: ($('f-category') || { value: '' }).value,
  };
  if (!fields.name || !fields.description || !fields.location || !fields.category) {
    showFormMsg('Please fill in all required fields (*)', 'error'); return;
  }
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  fd.append('budget', ($('f-budget') || { value: 'medium' }).value);
  fd.append('rating', ($('f-rating') || { value: '0' }).value || '0');
  fd.append('bestTimeToVisit', ($('f-besttime') || { value: '' }).value.trim());
  fd.append('lat', ($('f-lat') || { value: '' }).value);
  fd.append('lng', ($('f-lng') || { value: '' }).value);
  const imageUrl = ($('f-imageurl') || { value: '' }).value.trim();
  if (imageUrl) fd.append('imageUrl', imageUrl);
  else if (selectedFile) fd.append('image', selectedFile);
  if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
  try {
    const res = await fetch(`${API}/places`, { method: 'POST', headers: auth.headers(), body: fd });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showFormMsg('✅ Destination added successfully!', 'success');
    showToast('Destination added!', 'success');
    state.allPlaces.push(data.data);
    clearForm();
    loadAdminData();
  } catch (err) {
    showFormMsg(err.message || 'Failed to add destination', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Add Destination'; }
  }
}

function showFormMsg(text, type) {
  const box = $('form-message');
  if (!box) return;
  box.textContent = text; box.className = `form-message ${type}`; box.classList.remove('hidden');
  clearTimeout(box._t); box._t = setTimeout(() => box.classList.add('hidden'), 5000);
}

function clearForm() {
  ['f-name', 'f-desc', 'f-location', 'f-imageurl', 'f-rating', 'f-besttime', 'f-lat', 'f-lng']
    .forEach((id) => { const el = $(id); if (el) el.value = ''; });
  const fc = $('f-category'), fb = $('f-budget');
  if (fc) fc.value = '';
  if (fb) fb.value = 'medium';
  selectedFile = null;
  const prev = $('image-preview');
  if (prev) { prev.classList.add('hidden'); prev.innerHTML = ''; }
  const txt = document.querySelector('#file-drop .file-drop-text');
  if (txt) txt.textContent = 'Click or drag an image here';
  const fi = $('f-image');
  if (fi) fi.value = '';
  const hint = $('picker-hint');
  if (hint) hint.textContent = 'Click anywhere on the map to set coordinates';
  if (pickerMarker && pickerMap) { pickerMap.removeLayer(pickerMarker); pickerMarker = null; }
}

/* ══════════════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════════════ */
function showLoading(show) {
  const ls = $('loading-state');
  if (ls) ls.style.display = show ? 'flex' : 'none';
  if (show) {
    const grid = $('places-grid');
    const empty = $('empty-state');
    if (grid) grid.innerHTML = '';
    if (empty) empty.classList.add('hidden');
  }
}

function showToast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast${type ? ' ' + type : ''}`;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3500);
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* btn-show-map style */
const s = document.createElement('style');
s.textContent = `.btn-show-map{margin-top:10px;padding:6px 14px;background:rgba(44,120,115,.1);color:var(--teal);border:1.5px solid var(--teal);border-radius:var(--radius-sm);font-size:.8rem;font-weight:600;cursor:pointer;transition:var(--transition);width:100%}.btn-show-map:hover{background:var(--teal);color:#fff}`;
document.head.appendChild(s);

/* ══════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════ */
syncNavUI();
fetchPlaces();
