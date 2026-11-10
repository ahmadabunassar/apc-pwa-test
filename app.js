// ---------- Register service worker ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW failed:', err));
}

const $ = id => document.getElementById(id);

// ---------- Online / offline badge ----------
function updateNet() {
  const on = navigator.onLine;
  $('net').textContent = on ? 'Online' : 'Offline';
  $('net').className = 'badge ' + (on ? 'on' : 'off');
}
addEventListener('online', updateNet); addEventListener('offline', updateNet); updateNet();

// ---------- Install status ----------
const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
$('mode').textContent = isStandalone
  ? '✅ Running as an installed app (from Home Screen).'
  : 'ℹ️ Running in the browser — install it to test app mode.';
if (!isStandalone && isIOS) $('iosHint').hidden = false;

// Android / desktop Chrome install prompt
let deferredPrompt;
addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e; $('installBtn').hidden = false;
});
$('installBtn').onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice;
  deferredPrompt = null; $('installBtn').hidden = true;
};

// ---------- Ping server ----------
$('pingBtn').onclick = async () => {
  $('pingOut').textContent = 'Calling /api/time …';
  try {
    const r = await fetch('/api/time');
    const d = await r.json();
    $('pingOut').textContent = `Server: ${d.host}\nTime:   ${new Date(d.serverTime).toLocaleString()}`;
  } catch {
    $('pingOut').textContent = '❌ Cannot reach server (offline?)';
  }
};

// ---------- Notes ----------
const esc = s => s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

async function loadNotes() {
  try {
    const notes = await (await fetch('/api/notes')).json();
    $('notes').innerHTML = notes.length ? notes.map(n => `
      <li><div>${esc(n.text)}<small>${new Date(n.createdAt).toLocaleString()}</small></div>
          <button data-id="${n.id}">Delete</button></li>`).join('')
      : '<li><small>No notes yet.</small></li>';
  } catch {
    $('notes').innerHTML = '<li><small>Offline — notes unavailable.</small></li>';
  }
}

$('noteForm').onsubmit = async e => {
  e.preventDefault();
  const text = $('noteText').value.trim();
  if (!text) return;
  try {
    await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text }) });
    $('noteText').value = ''; loadNotes();
  } catch { alert('Offline — cannot save now.'); }
};

$('notes').onclick = async e => {
  const id = e.target.dataset.id;
  if (!id) return;
  await fetch('/api/notes/' + id, { method: 'DELETE' }).catch(() => {});
  loadNotes();
};
loadNotes();

// ---------- Camera ----------
$('cam').onchange = () => {
  const f = $('cam').files[0];
  if (!f) return;
  $('preview').src = URL.createObjectURL(f);
  $('preview').hidden = false;
};
