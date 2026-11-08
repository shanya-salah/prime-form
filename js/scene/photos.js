// =========================================================
// photos.js — optional "My photos" background.
// Put your own gym photos in assets/hero/ named
// slide-1.jpg … slide-6.jpg and choose Settings → 3D background
// → "My photos". If no photos exist, the 3D gym is used.
// =========================================================
let available = null; // null = not checked yet, [] = none found
let enabled = false;
const urls = [1, 2, 3, 4, 5, 6].map((n) => `assets/hero/slide-${n}.jpg`);

function probe(url) {
  return new Promise((res) => { const img = new Image(); img.onload = () => res(url); img.onerror = () => res(null); img.src = url; });
}

/** Check which photos exist. Returns the number found. */
export async function detectPhotos() {
  if (available === null) available = (await Promise.all(urls.map(probe))).filter(Boolean);
  return available.length;
}

export function setPhotosEnabled(on) {
  enabled = on && available && available.length > 0;
  const el = document.getElementById('scene-photo');
  if (!enabled) { el.classList.remove('on'); el.style.backgroundImage = ''; }
  return enabled;
}

export function showPhoto(index = 0) {
  if (!enabled) return;
  const el = document.getElementById('scene-photo');
  const url = available[index % available.length];
  el.classList.remove('on');
  setTimeout(() => { el.style.backgroundImage = `url("${url}")`; el.classList.add('on'); }, 220);
}
