/* ═══════════════════════════════════════════════════════════
   Tourist Place Recommender — app.js
   ═══════════════════════════════════════════════════════════ */

const API = 'http://localhost:5000/api';

const AVATARS = ['👤','👩','👨','🧑','👩‍💻','🧑‍💻','👩‍🎨','🧑‍🚀','👩‍🍳','👨‍🏫',
                 '🦸','🦊','🐼','🐨','🦁','🐯','🦋','🌺','🏔','🌊'];

const CAT_COLORS = {
  beach:'#e67e22', hill:'#27ae60', city:'#2980b9',
  forest:'#16a085', desert:'#d4ac0d', historical:'#8e44ad', adventure:'#c0392b',
};

/* ── safe DOM helpers ─────────────────────────────────── */
const $ = (id) => document.getElementById(id);
function on(id, ev, fn) { const el = typeof id === 'string' ? $(id) : id; if (el) el.addEventListener(ev, fn); }
function setText(id, v) { const el = $(id); if (el) el.textContent = v; }
function show(id) { const el = $(id); if (el) el.classList.remove('hidden'); }
function hide(id) { const el = $(id); if (el) el.classList.add('hidden'); }
function val(id, def='') { const el = $(id); return el ? el.value : def; }
function setVal(id, v) { const el = $(id); if (el) el.value = v; }

/* ── AUTH ─────────────────────────────────────────────── */
const auth = {
  getToken:   () => localStorage.getItem('wl_token'),
  getUser:    () => { try { return JSON.parse(localStorage.getItem('wl_user')); } catch { return null; } },
  save(t, u)  { localStorage.setItem('wl_token', t); localStorage.setItem('wl_user', JSON.stringify(u)); },
  clear()     { localStorage.removeItem('wl_token'); localStorage.removeItem('wl_user'); },
  isLoggedIn: () => !!localStorage.getItem('wl_token'),
  isAdmin:    () => { const u = auth.getUser(); return !!(u && u.role === 'admin'); },
  headers()   { const t = auth.getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; },
};

/* ── STATE ────────────────────────────────────────────── */
const state = {
  currentPage: 'home',
  category: 'all', search: '', location: '', budget: 'all', sort: 'rating', view: 'grid',
  allPlaces: [], mapCategory: 'all', mapSearch: '',
};

let mainMap = null, mapMarkers = [], pickerMap = null, pickerMarker = null;
let mpPickerMap = null, mpPickerMarker = null;
let mpSelectedFile = null;

/* ══════════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════════ */
function navigateTo(page) {
  if ((page === 'admin' || page === 'myplaces' || page === 'profile') && !auth.isLoggedIn()) {
    showToast('Please log in first', 'error'); navigateTo('login'); return;
  }
  if (page === 'admin' && !auth.isAdmin()) { showToast('Admin access only', 'error'); return; }

  closeDropdown();
  state.currentPage = page;
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));

  const pg   = $(`page-${page}`);
  const link = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (pg)   pg.classList.add('active');
  if (link) link.classList.add('active');

  if (page === 'home')     fetchPlaces();
  if (page === 'map')      setTimeout(initMainMap, 100);
  if (page === 'myplaces') { loadMyPlaces(); setTimeout(initMpPickerMap, 300); }
  if (page === 'profile')  loadProfilePage();
  if (page === 'admin')    loadAdminData();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* single delegated click handler */
document.addEventListener('click', (e) => {
  /* data-page links */
  const navEl = e.target.closest('a[data-page], button[data-page]');
  if (navEl) { e.preventDefault(); navigateTo(navEl.dataset.page); return; }

  /* close dropdown on outside click */
  if (!e.target.closest('#nav-user')) closeDropdown();

  /* password toggles */
  const pwBtn = e.target.closest('.toggle-pw');
  if (pwBtn) {
    const inp = $(pwBtn.dataset.target);
    if (inp) { inp.type = inp.type === 'password' ? 'text' : 'password'; pwBtn.textContent = inp.type === 'password' ? '👁' : '🙈'; }
  }
});

/* ── DROPDOWN ─────────────────────────────────────────── */
function closeDropdown() { const dd=$('profile-dropdown'); if(dd) dd.classList.add('hidden'); }
on('btn-profile-trigger', 'click', (e) => { e.stopPropagation(); const dd=$('profile-dropdown'); if(dd) dd.classList.toggle('hidden'); });

/* ── SYNC NAV ─────────────────────────────────────────── */
function syncNavUI() {
  if (auth.isLoggedIn()) {
    const user = auth.getUser() || {};
    const av   = user.avatar || '👤';
    hide('nav-guest'); show('nav-user');
    setText('nav-user-name', user.name || '');
    setText('nav-avatar',      av);
    setText('dropdown-avatar', av);
    setText('dropdown-name',   user.name  || '');
    setText('dropdown-email',  user.email || '');
    // show My Places for ALL logged-in users
    document.querySelector('.nav-myplaces') && document.querySelector('.nav-myplaces').classList.remove('hidden');
    // show Admin only for admins
    const al = document.querySelector('.nav-admin'), adl = document.querySelector('.nav-admin-dd');
    if (auth.isAdmin()) { al && al.classList.remove('hidden'); adl && adl.classList.remove('hidden'); }
    else                { al && al.classList.add('hidden');    adl && adl.classList.add('hidden'); }
  } else {
    show('nav-guest'); hide('nav-user');
    document.querySelector('.nav-myplaces') && document.querySelector('.nav-myplaces').classList.add('hidden');
    document.querySelector('.nav-admin')    && document.querySelector('.nav-admin').classList.add('hidden');
    document.querySelector('.nav-admin-dd') && document.querySelector('.nav-admin-dd').classList.add('hidden');
  }
}

/* ── LOGOUT ───────────────────────────────────────────── */
on('btn-logout', 'click', async () => {
  try { await fetch(`${API}/auth/logout`, { method:'POST', headers:{...auth.headers(),'Content-Type':'application/json'} }); } catch {}
  auth.clear(); syncNavUI(); showToast('Logged out. Safe travels!'); navigateTo('home');
});

/* ══════════════════════════════════════════════════════════
   LOGIN
   ══════════════════════════════════════════════════════════ */
on('btn-login', 'click', handleLogin);
on('login-password', 'keydown', (e) => { if (e.key==='Enter') handleLogin(); });

async function handleLogin() {
  const btn = $('btn-login');
  const email = val('login-email').trim(), password = val('login-password');
  if (!email || !password) { showAuthMsg('login','Please enter your email and password','error'); return; }
  if (btn) { btn.disabled=true; btn.textContent='Signing in…'; }
  try {
    const res  = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    auth.save(data.token, data.user); syncNavUI();
    showToast(data.message || 'Welcome back!', 'success');
    setVal('login-email',''); setVal('login-password','');
    navigateTo('home');
  } catch(err) { showAuthMsg('login', err.message||'Login failed','error'); }
  finally { if (btn) { btn.disabled=false; btn.textContent='Sign in'; } }
}

/* ══════════════════════════════════════════════════════════
   REGISTER
   ══════════════════════════════════════════════════════════ */
on('btn-register', 'click', handleRegister);
on('reg-confirm',  'keydown', (e) => { if (e.key==='Enter') handleRegister(); });

async function handleRegister() {
  const btn = $('btn-register');
  const name=val('reg-name').trim(), email=val('reg-email').trim();
  const password=val('reg-password'), confirm=val('reg-confirm');
  if (!name||!email||!password||!confirm) { showAuthMsg('register','Please fill in all fields','error'); return; }
  if (password!==confirm) { showAuthMsg('register','Passwords do not match','error'); return; }
  if (password.length<6)  { showAuthMsg('register','Password must be at least 6 characters','error'); return; }
  if (btn) { btn.disabled=true; btn.textContent='Creating account…'; }
  try {
    const res  = await fetch(`${API}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,email,password}) });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    auth.save(data.token, data.user); syncNavUI();
    showToast(data.message || 'Account created!', 'success');
    ['reg-name','reg-email','reg-password','reg-confirm'].forEach((id)=>setVal(id,''));
    navigateTo('home');
  } catch(err) { showAuthMsg('register', err.message||'Registration failed','error'); }
  finally { if (btn) { btn.disabled=false; btn.textContent='Create account'; } }
}

function showAuthMsg(page, text, type) {
  const box = $(`${page}-message`);
  if (!box) return;
  box.textContent=text; box.className=`form-message ${type}`; box.classList.remove('hidden');
  clearTimeout(box._t); box._t=setTimeout(()=>box.classList.add('hidden'),5000);
}

/* ══════════════════════════════════════════════════════════
   MY PLACES — for ALL logged-in users
   ══════════════════════════════════════════════════════════ */
let mpEditingId = null;

async function loadMyPlaces() {
  const listEl = $('mp-list'), emptyEl = $('mp-empty'), countEl = $('mp-count');
  if (listEl) listEl.innerHTML = '<div class="spinner small" style="margin:24px auto;display:block"></div>';
  try {
    const res  = await fetch(`${API}/places/my`, { headers: auth.headers() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const places = data.data;
    if (countEl) countEl.textContent = `${places.length} place${places.length!==1?'s':''}`;
    if (!places.length) {
      if (listEl)  listEl.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    if (listEl)  listEl.innerHTML = places.map((p) => renderMpItem(p)).join('');
    // wire up edit/delete buttons
    listEl && listEl.querySelectorAll('.btn-mp-edit').forEach((btn) => {
      btn.addEventListener('click', () => startEditPlace(btn.dataset.id));
    });
    listEl && listEl.querySelectorAll('.btn-mp-delete').forEach((btn) => {
      btn.addEventListener('click', () => deleteMyPlace(btn.dataset.id));
    });
  } catch(err) {
    if (listEl) listEl.innerHTML = `<p style="color:var(--error);font-size:.85rem">Failed to load: ${err.message}</p>`;
  }
}

function renderMpItem(p) {
  const img = p.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(p.name)}/200/200`;
  const budget = {low:'Budget',medium:'Mid-range',high:'Luxury'}[p.budget]||'';
  return `
    <div class="mp-item" id="mp-item-${p._id}">
      <img class="mp-item-thumb" src="${escHtml(img)}" alt="${escHtml(p.name)}"
           onerror="this.src='https://picsum.photos/seed/${p._id}/200/200'" />
      <div class="mp-item-body">
        <div class="mp-item-name">${escHtml(p.name)}</div>
        <div class="mp-item-loc">📍 ${escHtml(p.location)}</div>
        <div class="mp-item-badges">
          <span class="mp-badge mp-badge-cat">${p.category}</span>
          ${p.rating?`<span class="mp-badge mp-badge-rate">⭐ ${p.rating}</span>`:''}
          ${budget?`<span class="mp-badge mp-badge-budget">${budget}</span>`:''}
        </div>
      </div>
      <div class="mp-item-actions">
        <button class="btn-mp-edit"   data-id="${p._id}">✏ Edit</button>
        <button class="btn-mp-delete" data-id="${p._id}">🗑 Delete</button>
      </div>
    </div>`;
}

/* load a place into the form for editing */
async function startEditPlace(id) {
  try {
    const res  = await fetch(`${API}/places/${id}`, { headers: auth.headers() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const p = data.data;
    mpEditingId = id;

    // populate form
    setVal('mp-name',     p.name);
    setVal('mp-desc',     p.description);
    setVal('mp-location', p.location);
    setVal('mp-category', p.category);
    setVal('mp-budget',   p.budget);
    setVal('mp-rating',   p.rating);
    setVal('mp-besttime', p.bestTimeToVisit);
    setVal('mp-imageurl', p.imageUrl);
    setVal('mp-lat',      p.lat || '');
    setVal('mp-lng',      p.lng || '');

    // show image preview
    if (p.imageUrl) {
      const prev = $('mp-image-preview');
      if (prev) { prev.innerHTML=`<img src="${escHtml(p.imageUrl)}" alt="preview"/>`; prev.classList.remove('hidden'); }
    }

    // update UI
    setText('mp-form-title', '✏️ Edit Destination');
    const saveBtn   = $('mp-btn-save');
    const cancelBtn = $('mp-btn-cancel');
    if (saveBtn)   { saveBtn.textContent = 'Save Changes'; }
    if (cancelBtn) cancelBtn.style.display = 'block';

    // highlight item in list
    document.querySelectorAll('.mp-item').forEach((el) => el.classList.remove('editing'));
    const item = $(`mp-item-${id}`);
    if (item) { item.classList.add('editing'); item.scrollIntoView({behavior:'smooth',block:'nearest'}); }

    // scroll to form
    document.querySelector('.myplaces-form-col')?.scrollIntoView({behavior:'smooth',block:'start'});
  } catch(err) { showToast('Failed to load place: '+err.message,'error'); }
}

async function deleteMyPlace(id) {
  if (!confirm('Delete this destination? This cannot be undone.')) return;
  try {
    const res  = await fetch(`${API}/places/${id}`, { method:'DELETE', headers:auth.headers() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast('Destination deleted','success');
    state.allPlaces = state.allPlaces.filter((p)=>p._id!==id);
    if (mpEditingId === id) cancelMpEdit();
    loadMyPlaces();
  } catch(err) { showToast(err.message||'Failed to delete','error'); }
}

function cancelMpEdit() {
  mpEditingId = null;
  clearMpForm();
  setText('mp-form-title','➕ Add New Destination');
  const saveBtn=$('mp-btn-save'), cancelBtn=$('mp-btn-cancel');
  if (saveBtn)   saveBtn.textContent = 'Add Destination';
  if (cancelBtn) cancelBtn.style.display = 'none';
  document.querySelectorAll('.mp-item').forEach((el)=>el.classList.remove('editing'));
}

on('mp-btn-cancel', 'click', cancelMpEdit);
on('mp-btn-clear',  'click', clearMpForm);
on('mp-btn-save',   'click', saveMpPlace);

async function saveMpPlace() {
  const btn = $('mp-btn-save');
  const name     = val('mp-name').trim();
  const desc     = val('mp-desc').trim();
  const location = val('mp-location').trim();
  const category = val('mp-category');
  if (!name||!desc||!location||!category) { showMpMsg('Please fill in all required fields (*)','error'); return; }

  const fd = new FormData();
  fd.append('name',            name);
  fd.append('description',     desc);
  fd.append('location',        location);
  fd.append('category',        category);
  fd.append('budget',          val('mp-budget','medium'));
  fd.append('rating',          val('mp-rating','0')||'0');
  fd.append('bestTimeToVisit', val('mp-besttime'));
  fd.append('lat',             val('mp-lat'));
  fd.append('lng',             val('mp-lng'));
  const imgUrl = val('mp-imageurl').trim();
  if (imgUrl) fd.append('imageUrl', imgUrl);
  else if (mpSelectedFile) fd.append('image', mpSelectedFile);

  if (btn) { btn.disabled=true; btn.textContent=mpEditingId?'Saving…':'Adding…'; }
  try {
    const url    = mpEditingId ? `${API}/places/${mpEditingId}` : `${API}/places`;
    const method = mpEditingId ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers:auth.headers(), body:fd });
    const data   = await res.json();
    if (!data.success) throw new Error(data.message);
    showMpMsg(mpEditingId?'✅ Destination updated!':'✅ Destination added!','success');
    showToast(mpEditingId?'Place updated!':'Place added to explore!','success');
    state.allPlaces = [];  // force refresh
    cancelMpEdit();
    loadMyPlaces();
  } catch(err) { showMpMsg(err.message||'Failed to save','error'); }
  finally { if (btn) { btn.disabled=false; btn.textContent=mpEditingId?'Save Changes':'Add Destination'; } }
}

function showMpMsg(text, type) {
  const box = $('mp-form-msg');
  if (!box) return;
  box.textContent=text; box.className=`form-message ${type}`; box.classList.remove('hidden');
  clearTimeout(box._t); box._t=setTimeout(()=>box.classList.add('hidden'),5000);
}

function clearMpForm() {
  ['mp-name','mp-desc','mp-location','mp-imageurl','mp-rating','mp-besttime','mp-lat','mp-lng']
    .forEach((id)=>setVal(id,''));
  setVal('mp-category',''); setVal('mp-budget','medium');
  clearImageSelection();
  const hint=$('mp-picker-hint'); if(hint) hint.textContent='Click anywhere to pin location';
  if (mpPickerMarker&&mpPickerMap) { mpPickerMap.removeLayer(mpPickerMarker); mpPickerMarker=null; }
}

/* ══════════════════════════════════════════════════════════
   IMAGE WIDGET — Camera + File Upload
   ══════════════════════════════════════════════════════════ */
let cameraStream = null;   // active MediaStream
let cameraActive = false;  // true while video is live

/* Tab switcher */
document.querySelectorAll('.img-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.img-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.querySelectorAll('.img-panel').forEach((p) => p.classList.add('hidden'));
    const panel = document.getElementById(`img-panel-${target}`);
    if (panel) panel.classList.remove('hidden');
    // stop camera when switching away
    if (target !== 'camera') stopCamera();
  });
});

/* ── Open Camera ── */
on('btn-open-camera', 'click', openCamera);
on('camera-facing',   'change', () => { if (cameraActive) openCamera(); });

async function openCamera() {
  const wrap    = $('camera-wrap');
  const video   = $('camera-video');
  const overlay = $('camera-overlay');
  const btnOpen = $('btn-open-camera');
  const btnSnap = $('btn-snap');
  const facingSel = $('camera-facing');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Camera not supported in this browser', 'error'); return;
  }

  // stop existing stream first
  stopCamera();

  const facing = (facingSel && facingSel.value) || 'environment';
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    if (video) {
      video.srcObject = cameraStream;
      video.play();
    }
    cameraActive = true;
    if (overlay)   overlay.classList.add('hidden');
    if (btnOpen)   btnOpen.classList.add('hidden');
    if (btnSnap)   btnSnap.classList.remove('hidden');
    if (facingSel) facingSel.classList.remove('hidden');
    showToast('Camera ready — point and shoot!', 'success');
  } catch (err) {
    let msg = 'Camera access denied';
    if (err.name === 'NotFoundError')     msg = 'No camera found on this device';
    if (err.name === 'NotAllowedError')   msg = 'Camera permission denied — allow it in browser settings';
    if (err.name === 'NotReadableError')  msg = 'Camera is in use by another app';
    showToast(msg, 'error');
    if (overlay) { overlay.classList.remove('hidden'); }
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  const video   = $('camera-video');
  const overlay = $('camera-overlay');
  const btnOpen = $('btn-open-camera');
  const btnSnap = $('btn-snap');
  const btnRetake = $('btn-retake');
  const facingSel = $('camera-facing');
  if (video)    { video.srcObject = null; }
  if (overlay)  overlay.classList.remove('hidden');
  if (btnOpen)  btnOpen.classList.remove('hidden');
  if (btnSnap)  { btnSnap.classList.add('hidden'); }
  if (btnRetake){ btnRetake.classList.add('hidden'); }
  if (facingSel){ facingSel.classList.add('hidden'); }
  cameraActive = false;
}

/* ── Snap Photo ── */
on('btn-snap', 'click', snapPhoto);

function snapPhoto() {
  const video  = $('camera-video');
  const canvas = $('camera-canvas');
  const wrap   = $('camera-wrap');
  if (!video || !canvas || !video.videoWidth) return;

  // shutter flash
  if (wrap) { wrap.classList.add('snapping'); setTimeout(() => wrap.classList.remove('snapping'), 200); }

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setImageFile(file, canvas.toDataURL('image/jpeg', 0.92));
    stopCamera();
    // show retake button
    const btnSnap   = $('btn-snap');
    const btnRetake = $('btn-retake');
    const btnOpen   = $('btn-open-camera');
    if (btnSnap)   btnSnap.classList.add('hidden');
    if (btnRetake) btnRetake.classList.remove('hidden');
    if (btnOpen)   btnOpen.classList.remove('hidden');
    showToast('Photo captured!', 'success');
  }, 'image/jpeg', 0.92);
}

/* ── Retake ── */
on('btn-retake', 'click', () => {
  clearImageSelection();
  const btnRetake = $('btn-retake');
  if (btnRetake) btnRetake.classList.add('hidden');
  openCamera();
});

/* ── File Upload ── */
on('mp-file-drop', 'click', () => { const fi=$('mp-image'); if(fi) fi.click(); });
on('mp-file-drop', 'dragover', (e) => { e.preventDefault(); const fd=$('mp-file-drop'); if(fd) fd.style.borderColor='var(--gold)'; });
on('mp-file-drop', 'dragleave', () => { const fd=$('mp-file-drop'); if(fd) fd.style.borderColor=''; });
on('mp-file-drop', 'drop', (e) => {
  e.preventDefault(); const fd=$('mp-file-drop'); if(fd) fd.style.borderColor='';
  const f = e.dataTransfer.files[0]; if(f && f.type.startsWith('image/')) handleMpFileSelect(f);
});
on('mp-image', 'change', () => { const fi=$('mp-image'); if(fi&&fi.files[0]) handleMpFileSelect(fi.files[0]); });

function handleMpFileSelect(file) {
  const reader = new FileReader();
  reader.onload = (e) => setImageFile(file, e.target.result);
  reader.readAsDataURL(file);
}

/* ── Shared image setter ── */
function setImageFile(file, dataUrl) {
  mpSelectedFile = file;
  const prev = $('mp-image-preview');
  if (prev) {
    prev.innerHTML = `<img src="${dataUrl}" alt="preview"/>
      <button type="button" class="preview-clear" id="btn-clear-image">✕ Remove</button>`;
    prev.classList.remove('hidden');
    on('btn-clear-image', 'click', clearImageSelection);
  }
  const txt = document.querySelector('#mp-file-drop .file-drop-text');
  if (txt) txt.textContent = file.name;
}

function clearImageSelection() {
  mpSelectedFile = null;
  const prev = $('mp-image-preview');
  if (prev) { prev.innerHTML = ''; prev.classList.add('hidden'); }
  const fi = $('mp-image'); if(fi) fi.value = '';
  const txt = document.querySelector('#mp-file-drop .file-drop-text');
  if (txt) txt.textContent = 'Click or drag an image here';
}

/* Stop camera if user navigates away */
document.addEventListener('visibilitychange', () => { if (document.hidden) stopCamera(); });

/* mini-map for My Places form */
function initMpPickerMap() {
  const el=$('mp-picker-map'); if(!el) return;
  if(mpPickerMap){ mpPickerMap.invalidateSize(); return; }
  mpPickerMap=L.map('mp-picker-map').setView([20,0],2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(mpPickerMap);
  mpPickerMap.on('click',(e)=>{
    const{lat,lng}=e.latlng;
    setVal('mp-lat',lat.toFixed(6)); setVal('mp-lng',lng.toFixed(6));
    setText('mp-picker-hint',`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    if(mpPickerMarker) mpPickerMap.removeLayer(mpPickerMarker);
    mpPickerMarker=L.marker([lat,lng]).addTo(mpPickerMap);
  });
}

['mp-lat','mp-lng'].forEach((id)=>{
  on(id,'change',()=>{
    const lat=parseFloat(val('mp-lat')), lng=parseFloat(val('mp-lng'));
    if(!isNaN(lat)&&!isNaN(lng)&&mpPickerMap){
      if(mpPickerMarker) mpPickerMap.removeLayer(mpPickerMarker);
      mpPickerMarker=L.marker([lat,lng]).addTo(mpPickerMap);
      mpPickerMap.setView([lat,lng],8);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   PROFILE PAGE
   ══════════════════════════════════════════════════════════ */
async function loadProfilePage() {
  try {
    const res  = await fetch(`${API}/auth/me`, { headers:auth.headers() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    populateProfileUI(data.user);
  } catch(err) { showToast('Failed to load profile: '+err.message,'error'); }
}

function populateProfileUI(user) {
  const av=user.avatar||'👤';
  setText('profile-avatar-display',av);
  setText('profile-display-name',user.name);
  setText('profile-display-email',user.email);
  setText('profile-member-since',`Member since ${new Date(user.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long'})}`);
  const badge=$('profile-role-badge');
  if(badge){badge.textContent=user.role;badge.className=`profile-role-badge${user.role==='admin'?' admin':''}`;}
  setVal('p-name',user.name); setVal('p-email',user.email);
  setText('ai-role',user.role);
  setText('ai-since',new Date(user.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}));
  setText('ai-id',user.id||user._id||'');
  buildAvatarGrid(av);
}

function buildAvatarGrid(current) {
  const grid=$('avatar-grid'); if(!grid) return;
  grid.innerHTML=AVATARS.map((a)=>`<div class="avatar-opt${a===current?' active':''}" data-avatar="${a}">${a}</div>`).join('');
  grid.querySelectorAll('.avatar-opt').forEach((opt)=>{
    opt.addEventListener('click',async()=>{
      grid.querySelectorAll('.avatar-opt').forEach((o)=>o.classList.remove('active')); opt.classList.add('active');
      const av=opt.dataset.avatar;
      try {
        const res=await fetch(`${API}/auth/update-profile`,{method:'PUT',headers:{...auth.headers(),'Content-Type':'application/json'},body:JSON.stringify({avatar:av})});
        const data=await res.json(); if(!data.success) throw new Error(data.message);
        const u=auth.getUser(); if(u){u.avatar=av;auth.save(auth.getToken(),u);}
        syncNavUI(); setText('profile-avatar-display',av); showToast('Avatar updated!','success');
      } catch(err){showToast(err.message||'Failed','error');}
    });
  });
}

on('btn-save-profile','click',async()=>{
  const btn=$('btn-save-profile');
  const name=val('p-name').trim(), email=val('p-email').trim();
  if(!name||!email){showProfileMsg('info','Please fill in name and email','error');return;}
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try {
    const res=await fetch(`${API}/auth/update-profile`,{method:'PUT',headers:{...auth.headers(),'Content-Type':'application/json'},body:JSON.stringify({name,email})});
    const data=await res.json(); if(!data.success) throw new Error(data.message);
    const u=auth.getUser(); if(u){u.name=data.user.name;u.email=data.user.email;auth.save(auth.getToken(),u);}
    syncNavUI(); populateProfileUI({...data.user,createdAt:data.user.createdAt||new Date().toISOString()});
    showProfileMsg('info','Profile updated! ✅','success'); showToast('Profile saved!','success');
  } catch(err){showProfileMsg('info',err.message||'Failed','error');}
  finally{if(btn){btn.disabled=false;btn.textContent='Save Changes';}}
});

on('btn-change-pw','click',async()=>{
  const btn=$('btn-change-pw');
  const cur=val('p-current-pw'),nw=val('p-new-pw'),conf=val('p-confirm-pw');
  if(!cur||!nw||!conf){showProfileMsg('pw','Please fill in all password fields','error');return;}
  if(nw!==conf){showProfileMsg('pw','New passwords do not match','error');return;}
  if(nw.length<6){showProfileMsg('pw','New password must be at least 6 characters','error');return;}
  if(btn){btn.disabled=true;btn.textContent='Updating…';}
  try {
    const res=await fetch(`${API}/auth/change-password`,{method:'PUT',headers:{...auth.headers(),'Content-Type':'application/json'},body:JSON.stringify({currentPassword:cur,newPassword:nw})});
    const data=await res.json(); if(!data.success) throw new Error(data.message);
    setVal('p-current-pw','');setVal('p-new-pw','');setVal('p-confirm-pw','');
    showProfileMsg('pw','Password changed! 🔒','success'); showToast('Password updated!','success');
  } catch(err){showProfileMsg('pw',err.message||'Failed','error');}
  finally{if(btn){btn.disabled=false;btn.textContent='Update Password';}}
});

function showProfileMsg(type,text,cls){
  const id=type==='pw'?'profile-pw-msg':'profile-info-msg';
  const box=$(id); if(!box) return;
  box.textContent=text;box.className=`form-message ${cls}`;box.classList.remove('hidden');
  clearTimeout(box._t);box._t=setTimeout(()=>box.classList.add('hidden'),5000);
}

/* ══════════════════════════════════════════════════════════
   EXPLORE — SEARCH & FILTERS
   ══════════════════════════════════════════════════════════ */
on('btn-search',       'click', performSearch);
on('search-input',     'keydown',(e)=>{if(e.key==='Enter')performSearch();});
on('btn-apply-filters','click', performSearch);
on('btn-reset-filters','click', resetFilters);
on('btn-empty-reset',  'click', resetFilters);
on('btn-goto-map',     'click', ()=>navigateTo('map'));

document.querySelectorAll('.chip').forEach((c)=>{
  c.addEventListener('click',()=>{
    document.querySelectorAll('.chip').forEach((x)=>x.classList.remove('active'));
    c.classList.add('active'); state.category=c.dataset.cat; fetchPlaces();
  });
});

document.querySelectorAll('.view-btn').forEach((b)=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.view-btn').forEach((x)=>x.classList.remove('active'));
    b.classList.add('active'); state.view=b.dataset.view;
    const g=$('places-grid'); if(g) g.className=`places-grid${state.view==='list'?' list-view':''}`;
  });
});

function performSearch(){
  state.search  =($('search-input')   ||{value:''}).value.trim();
  state.location=($('filter-location')||{value:''}).value.trim();
  state.budget  =($('filter-budget')  ||{value:'all'}).value;
  state.sort    =($('filter-sort')    ||{value:'rating'}).value;
  fetchPlaces();
}

function resetFilters(){
  ['search-input','filter-location'].forEach((id)=>setVal(id,''));
  setVal('filter-budget','all'); setVal('filter-sort','rating');
  Object.assign(state,{search:'',location:'',budget:'all',sort:'rating',category:'all'});
  document.querySelectorAll('.chip').forEach((c)=>c.classList.remove('active'));
  const all=document.querySelector('.chip[data-cat="all"]'); if(all) all.classList.add('active');
  fetchPlaces();
}

/* ══════════════════════════════════════════════════════════
   FETCH PLACES
   ══════════════════════════════════════════════════════════ */
async function fetchPlaces() {
  showLoading(true);
  const params=new URLSearchParams();
  if(state.search)           params.set('search',  state.search);
  if(state.location)         params.set('location',state.location);
  if(state.budget!=='all')   params.set('budget',  state.budget);
  if(state.category!=='all') params.set('category',state.category);
  if(state.sort)             params.set('sort',    state.sort);
  params.set('limit','100');
  try {
    const res=await fetch(`${API}/places?${params}`);
    const data=await res.json();
    if(!data.success) throw new Error(data.message);
    state.allPlaces=data.data; renderPlaces(data.data,data.total);
  } catch(err) {
    showToast('Cannot connect to server. Is it running?','error'); renderPlaces([],0);
  } finally { showLoading(false); }
}

function renderPlaces(places,total){
  const grid=$('places-grid'); if(!grid) return; grid.innerHTML='';
  const empty=$('empty-state'),count=$('results-count');
  if(!places.length){ if(empty) empty.classList.remove('hidden'); if(count) count.textContent='No destinations found'; return; }
  if(empty) empty.classList.add('hidden');
  if(count) count.innerHTML=`Showing <strong>${places.length}</strong> of <strong>${total}</strong> destinations`;
  places.forEach((p,i)=>grid.appendChild(createCard(p,i)));
}

function createCard(place,index){
  const card=document.createElement('div'); card.className='place-card'; card.style.animationDelay=`${index*0.04}s`;
  const img=place.imageUrl||`https://picsum.photos/seed/${encodeURIComponent(place.name)}/800/500`;
  const bLabel={low:'$ Budget',medium:'$$ Mid-range',high:'$$$ Luxury'}[place.budget]||'';
  const isOwn = auth.isLoggedIn() && auth.getUser() && place.addedBy && place.addedBy === auth.getUser().id;
  card.innerHTML=`
    <div class="card-img-wrap">
      <img class="card-img" src="${escHtml(img)}" alt="${escHtml(place.name)}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${index}/800/500'"/>
      <span class="card-category-badge">${place.category}</span>
      ${bLabel?`<span class="card-budget-badge">${bLabel}</span>`:''}
      ${place.addedByName?`<span class="card-added-by">by ${escHtml(place.addedByName)}</span>`:''}
    </div>
    <div class="card-body">
      <h3 class="card-title">${escHtml(place.name)}</h3>
      <p class="card-location">📍 ${escHtml(place.location)}</p>
      <p class="card-desc">${escHtml(place.description)}</p>
      <div class="card-footer">
        <div class="card-rating"><span class="stars">${renderStars(place.rating)}</span> <span>${place.rating?place.rating.toFixed(1):'N/A'}</span></div>
        ${place.bestTimeToVisit?`<span class="card-best-time">🗓 ${escHtml(place.bestTimeToVisit)}</span>`:''}
      </div>
      ${place.lat&&place.lng?`<button class="btn-show-map" data-id="${place._id}">📍 Show on Map</button>`:''}
    </div>`;
  card.addEventListener('click',(e)=>{
    if(e.target.closest('.btn-show-map')){ e.stopPropagation(); navigateTo('map'); setTimeout(()=>flyToPlace(place),500); }
    else openModal(place);
  });
  return card;
}

function renderStars(r){
  if(!r) return '☆☆☆☆☆';
  return '★'.repeat(Math.floor(r))+(r%1>=.5?'½':'')+'☆'.repeat(5-Math.floor(r)-(r%1>=.5?1:0));
}

/* ══════════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════════ */
function openModal(place){
  const img=place.imageUrl||`https://picsum.photos/seed/${encodeURIComponent(place.name)}/800/500`;
  const bLabel={low:'Budget Friendly ($)',medium:'Mid-range ($$)',high:'Luxury ($$$)'}[place.budget]||'N/A';
  const content=$('modal-content'); if(!content) return;
  const isOwn  = auth.isLoggedIn() && auth.getUser() && place.addedBy === auth.getUser().id;
  const isAdmin = auth.isAdmin();

  content.innerHTML=`
    <img class="modal-img" src="${escHtml(img)}" alt="${escHtml(place.name)}" onerror="this.src='https://picsum.photos/seed/fallback/800/500'"/>
    <div class="modal-body">
      <div class="modal-meta">
        <span class="card-category-badge" style="position:static">${place.category}</span>
        <span class="card-rating"><span class="stars">${renderStars(place.rating)}</span> ${place.rating?place.rating.toFixed(1):'N/A'}</span>
      </div>
      <h2 class="modal-title">${escHtml(place.name)}</h2>
      <p class="modal-location">📍 ${escHtml(place.location)}</p>
      ${place.addedByName?`<p style="font-size:.78rem;color:var(--ink-3);margin-bottom:10px">Added by ${escHtml(place.addedByName)}</p>`:''}
      <p class="modal-desc">${escHtml(place.description)}</p>
      <div class="modal-details">
        <div class="modal-detail-item"><div class="modal-detail-label">Category</div><div class="modal-detail-value">${place.category}</div></div>
        <div class="modal-detail-item"><div class="modal-detail-label">Budget</div><div class="modal-detail-value">${bLabel}</div></div>
        <div class="modal-detail-item"><div class="modal-detail-label">Best Time</div><div class="modal-detail-value">${place.bestTimeToVisit||'Year round'}</div></div>
        <div class="modal-detail-item"><div class="modal-detail-label">Rating</div><div class="modal-detail-value">${place.rating?place.rating+' / 5':'Not rated'}</div></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
        ${place.lat&&place.lng?`<button class="btn-primary" style="flex:1" id="modal-map-btn">📍 View on Map</button>`:''}
        ${(isOwn||isAdmin)?`<button class="btn-secondary" style="flex:1" id="modal-edit-btn">✏ Edit</button>`:''}
        ${(isOwn||isAdmin)?`<button class="btn-secondary" style="flex:1;border-color:var(--error);color:var(--error)" id="modal-delete-btn">🗑 Delete</button>`:''}
      </div>
    </div>`;

  const mapBtn=$('modal-map-btn');
  if(mapBtn) mapBtn.addEventListener('click',()=>{ closeModal(); navigateTo('map'); setTimeout(()=>flyToPlace(place),500); });

  const editBtn=$('modal-edit-btn');
  if(editBtn) editBtn.addEventListener('click',()=>{ closeModal(); navigateTo('myplaces'); setTimeout(()=>startEditPlace(place._id),400); });

  const delBtn=$('modal-delete-btn');
  if(delBtn) delBtn.addEventListener('click',async()=>{
    if(!confirm('Delete this destination?')) return;
    try {
      const res=await fetch(`${API}/places/${place._id}`,{method:'DELETE',headers:auth.headers()});
      const data=await res.json(); if(!data.success) throw new Error(data.message);
      closeModal(); showToast('Destination deleted','success');
      state.allPlaces=state.allPlaces.filter((p)=>p._id!==place._id);
      fetchPlaces();
    } catch(err){showToast(err.message||'Failed to delete','error');}
  });

  const overlay=$('place-modal'); if(overlay) overlay.classList.remove('hidden');
  document.body.style.overflow='hidden';
}

on('modal-close','click',closeModal);
on('place-modal','click',(e)=>{if(e.target===$('place-modal'))closeModal();});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeModal();});
function closeModal(){const o=$('place-modal');if(o)o.classList.add('hidden');document.body.style.overflow='';}

/* ══════════════════════════════════════════════════════════
   ADMIN PAGE (stats + full list)
   ══════════════════════════════════════════════════════════ */
async function loadAdminData(){
  // stats
  try {
    const res=await fetch(`${API}/admin/stats`,{headers:auth.headers()});
    const data=await res.json(); if(!data.success) throw new Error();
    const{total,byCategory,averageRating}=data.data; const max=byCategory[0]?.count||1;
    const sc=$('stats-content');
    if(sc) sc.innerHTML=`
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-num">${total}</div><div class="stat-label">Destinations</div></div>
        <div class="stat-box"><div class="stat-num">${averageRating}</div><div class="stat-label">Avg Rating</div></div>
      </div>
      <div class="category-bar">${byCategory.map((c)=>`<div class="cat-row"><span class="cat-label">${c._id}</span><div class="cat-track"><div class="cat-fill" style="width:${(c.count/max)*100}%"></div></div><span class="cat-count">${c.count}</span></div>`).join('')}</div>`;
  } catch { const sc=$('stats-content'); if(sc) sc.innerHTML='<p style="color:var(--ink-3);font-size:.85rem">Unable to load stats</p>'; }

  // list
  const list=$('admin-list'); if(!list) return;
  try {
    const res=await fetch(`${API}/admin/places`,{headers:auth.headers()});
    const data=await res.json(); if(!data.success) throw new Error();
    if(!data.data.length){list.innerHTML='<p style="color:var(--ink-3);font-size:.85rem;text-align:center;padding:20px">No destinations yet</p>';return;}
    list.innerHTML=data.data.map((p)=>`
      <div class="admin-list-item">
        <span class="admin-list-name">${escHtml(p.name)}</span>
        <span class="admin-list-meta" style="font-size:.72rem;color:var(--ink-3)">${escHtml(p.addedByName||'—')}</span>
        <span class="admin-list-meta">⭐${p.rating||'—'}</span>
        <button class="btn-delete" data-id="${p._id}">✕</button>
      </div>`).join('');
    list.querySelectorAll('.btn-delete').forEach((btn)=>btn.addEventListener('click',async()=>{
      if(!confirm('Delete this place?')) return;
      const r=await fetch(`${API}/places/${btn.dataset.id}`,{method:'DELETE',headers:auth.headers()});
      const d=await r.json(); if(d.success){showToast('Deleted','success');loadAdminData();}
      else showToast(d.message,'error');
    }));
  } catch { list.innerHTML='<p style="color:var(--ink-3);font-size:.85rem">Unable to load</p>'; }
}

/* ══════════════════════════════════════════════════════════
   LEAFLET MAP
   ══════════════════════════════════════════════════════════ */
function initMainMap(){
  const el=$('main-map'); if(!el) return;
  if(mainMap){mainMap.invalidateSize();renderMapMarkers(getFilteredPlaces());renderMapSidebar(getFilteredPlaces());return;}
  mainMap=L.map('main-map',{zoomControl:true}).setView([20,0],2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(mainMap);
  const render=()=>{const f=getFilteredPlaces();renderMapMarkers(f);renderMapSidebar(f);};
  if(state.allPlaces.length){render();}
  else{fetch(`${API}/places?limit=200`).then((r)=>r.json()).then((d)=>{if(d.success){state.allPlaces=d.data;render();}});}
  document.querySelectorAll('.map-chip').forEach((c)=>{
    c.addEventListener('click',()=>{document.querySelectorAll('.map-chip').forEach((x)=>x.classList.remove('active'));c.classList.add('active');state.mapCategory=c.dataset.cat;const f=getFilteredPlaces();renderMapMarkers(f);renderMapSidebar(f);});
  });
  on('map-search','input',()=>{state.mapSearch=($('map-search')||{value:''}).value.toLowerCase();const f=getFilteredPlaces();renderMapMarkers(f);renderMapSidebar(f);});
}

function getFilteredPlaces(){
  return state.allPlaces.filter((p)=>{
    const catOk=state.mapCategory==='all'||p.category===state.mapCategory;
    const srOk=!state.mapSearch||p.name.toLowerCase().includes(state.mapSearch)||p.location.toLowerCase().includes(state.mapSearch);
    return catOk&&srOk;
  });
}

function makeColorMarker(place){
  const color=CAT_COLORS[place.category]||'#888';
  return L.divIcon({html:`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`,className:'',iconSize:[28,38],iconAnchor:[14,38],popupAnchor:[0,-38]});
}

function renderMapMarkers(places){
  if(!mainMap) return;
  mapMarkers.forEach((m)=>mainMap.removeLayer(m)); mapMarkers=[];
  places.forEach((place)=>{
    if(!place.lat||!place.lng) return;
    const marker=L.marker([place.lat,place.lng],{icon:makeColorMarker(place)});
    const img=place.imageUrl||`https://picsum.photos/seed/${encodeURIComponent(place.name)}/400/200`;
    const bLabel={low:'Budget',medium:'Mid-range',high:'Luxury'}[place.budget]||'';
    marker.bindPopup(`<div class="map-popup"><img class="map-popup-img" src="${escHtml(img)}" onerror="this.src='https://picsum.photos/seed/fallback/400/200'"/><div class="map-popup-body"><div class="map-popup-name">${escHtml(place.name)}</div><div class="map-popup-loc">📍 ${escHtml(place.location)}</div><div class="map-popup-badges"><span class="map-popup-badge badge-cat">${place.category}</span>${place.rating?`<span class="map-popup-badge badge-rate">⭐${place.rating}</span>`:''} ${bLabel?`<span class="map-popup-badge badge-budget">${bLabel}</span>`:''}</div><button class="map-popup-btn" onclick="window._openById('${place._id}')">View Details</button></div></div>`,{maxWidth:260});
    marker.addTo(mainMap); mapMarkers.push(marker);
  });
}

function renderMapSidebar(places){
  const list=$('map-place-list'); if(!list) return;
  if(!places.length){list.innerHTML='<div class="map-no-results">No destinations match</div>';return;}
  list.innerHTML=places.map((p)=>{const img=p.imageUrl||`https://picsum.photos/seed/${encodeURIComponent(p.name)}/100/100`;return`<div class="map-place-item" data-id="${p._id}"><img class="map-place-thumb" src="${escHtml(img)}" onerror="this.src='https://picsum.photos/seed/${p._id}/100/100'"/><div class="map-place-info"><div class="map-place-name">${escHtml(p.name)}</div><div class="map-place-loc">📍 ${escHtml(p.location)}</div>${p.rating?`<div class="map-place-rating">⭐${p.rating}</div>`:''}</div></div>`;}).join('');
  list.querySelectorAll('.map-place-item').forEach((item)=>{item.addEventListener('click',()=>{const p=state.allPlaces.find((x)=>x._id===item.dataset.id);if(!p) return;list.querySelectorAll('.map-place-item').forEach((i)=>i.classList.remove('active'));item.classList.add('active');if(p.lat&&p.lng)flyToPlace(p);else openModal(p);});});
}

function flyToPlace(place){
  if(!mainMap||!place.lat||!place.lng) return;
  mainMap.flyTo([place.lat,place.lng],10,{duration:1.2});
  const marker=mapMarkers.find((m)=>{const ll=m.getLatLng();return Math.abs(ll.lat-place.lat)<0.001&&Math.abs(ll.lng-place.lng)<0.001;});
  if(marker) setTimeout(()=>marker.openPopup(),1300);
  const item=document.querySelector(`.map-place-item[data-id="${place._id}"]`);
  if(item){document.querySelectorAll('.map-place-item').forEach((i)=>i.classList.remove('active'));item.classList.add('active');item.scrollIntoView({behavior:'smooth',block:'nearest'});}
}

window._openById=(id)=>{const p=state.allPlaces.find((x)=>x._id===id);if(p)openModal(p);};

/* ══════════════════════════════════════════════════════════
   UTILS
   ══════════════════════════════════════════════════════════ */
function showLoading(show){const ls=$('loading-state');if(ls)ls.style.display=show?'flex':'none';if(show){const g=$('places-grid');const e=$('empty-state');if(g)g.innerHTML='';if(e)e.classList.add('hidden');}}
function showToast(msg,type=''){const t=$('toast');if(!t)return;t.textContent=msg;t.className=`toast${type?' '+type:''}`;t.classList.remove('hidden');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.add('hidden'),3500);}
function escHtml(str){return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* card added-by badge style */
const st=document.createElement('style');
st.textContent=`
  .card-added-by{position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,.55);color:rgba(255,255,255,.85);font-size:.68rem;font-weight:600;padding:2px 9px;border-radius:50px;backdrop-filter:blur(6px);}
  .btn-show-map{margin-top:10px;padding:6px 14px;background:rgba(44,120,115,.1);color:var(--teal);border:1.5px solid var(--teal);border-radius:var(--radius-sm);font-size:.8rem;font-weight:600;cursor:pointer;transition:var(--transition);width:100%}
  .btn-show-map:hover{background:var(--teal);color:#fff}`;
document.head.appendChild(st);

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
syncNavUI();
fetchPlaces();
