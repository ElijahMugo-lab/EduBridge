/* EduBridge shared helpers for index.html and app.html (no build step).
   Must be loaded before each page's inline script. */

const P = (id, w) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('eb:' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('eb:' + k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem('eb:' + k); } catch {} },
};

/* ---- Upload helpers: compress images client-side so profiles stay small ---- */
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function fmtKB(kb) { return kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB'; }

/* Downscale to maxDim and step JPEG quality down until under targetKB (or quality floor). */
async function compressImage(file, maxDim = 1200, targetKB = 300) {
  const origKB = file.size / 1024;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i); i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    let q = 0.85, dataUrl = canvas.toDataURL('image/jpeg', q);
    const kbOf = s => s.length * 0.75 / 1024;
    while (kbOf(dataUrl) > targetKB && q > 0.45) {
      q -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', q);
    }
    return { dataUrl, sizeKB: kbOf(dataUrl), origKB };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 350); }, 2800);
}

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  const b = document.getElementById('themeBtn');
  if (b) {
    const k = b.querySelector('.knob');
    if (k) k.innerHTML = `<i class="ph ph-${t === 'dark' ? 'moon' : 'sun'}" aria-hidden="true"></i>`;
    b.setAttribute('aria-checked', String(t === 'dark'));
  }
}
function toggleTheme() {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(t); store.set('theme', t);
}
applyTheme(store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
