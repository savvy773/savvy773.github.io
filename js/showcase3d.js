/* PRISM showcase 3D: the screenshots sit on a ring; switching tabs pulls the camera back,
   swings the ring and settles on the next screen. Renders only while a move is running,
   so the page has no idle GPU work. The <img> slides stay underneath as the accessible content. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';

const W = 1.6;            // plane width; the stage is 16:10, so height is 1
const MOVE_MS = 1150;
const PULL = 1.9;         // extra camera distance at the middle of a move

export function init(root) {
  const view = root.querySelector('.showcase-view');
  const slides = [...root.querySelectorAll('.showcase-slide')];
  const n = slides.length;
  const step = (Math.PI * 2) / n;
  const radius = (W * 1.12) / (2 * Math.sin(Math.PI / n));
  const fov = 30;
  const rest = 0.5 / Math.tan(THREE.MathUtils.degToRad(fov / 2));

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x17181b, 1);
  const canvas = renderer.domElement;
  canvas.className = 'showcase-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x17181b, rest + radius * 0.9, rest + radius + PULL + 2.5);
  const camera = new THREE.PerspectiveCamera(fov, 1.6, 0.1, 50);
  const ring = new THREE.Group();
  scene.add(ring);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const loader = new THREE.TextureLoader();
  const loads = slides.map((slide, i) => new Promise((resolve, reject) => {
    const img = slide.querySelector('img');
    loader.load(img.currentSrc || img.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      // object-fit: cover, anchored top-left like the <img>
      const a = tex.image.width / tex.image.height;
      if (a > W) { tex.repeat.set(W / a, 1); tex.offset.set(0, 0); }
      else { tex.repeat.set(1, a / W); tex.offset.set(0, 1 - a / W); }
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, 1), new THREE.MeshBasicMaterial({ map: tex, fog: true }));
      const angle = i * step;
      mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
      mesh.rotation.y = angle;
      ring.add(mesh);
      resolve();
    }, undefined, reject);
  }));

  let current = slides.findIndex((s) => s.classList.contains('is-active'));
  if (current < 0) current = 0;
  let angle = -current * step;   // ring rotation that faces `current` to the camera
  let pull = 0;
  let anim = null;

  function place() {
    ring.rotation.y = angle;
    const d = radius + rest + pull;
    camera.position.set(0, pull * 0.28, d);
    camera.lookAt(0, 0, radius * (1 - pull / (PULL * 2.2)));
  }
  function render() {
    place();
    renderer.render(scene, camera);
  }
  function resize() {
    const w = view.clientWidth;
    const h = view.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function goTo(index) {
    if (index === current && !anim) return;
    // shortest way round the ring
    let delta = (index - current) % n;
    if (delta > n / 2) delta -= n;
    if (delta < -n / 2) delta += n;
    current = index;
    const start = performance.now();
    const fromAngle = angle;
    const toAngle = fromAngle - delta * step;
    if (anim) cancelAnimationFrame(anim);
    const frame = (now) => {
      const t = Math.min(1, (now - start) / MOVE_MS);
      const e = ease(t);
      angle = fromAngle + (toAngle - fromAngle) * e;
      pull = Math.sin(Math.PI * t) * PULL * Math.min(1, Math.abs(delta) * 0.6 + 0.4);
      render();
      anim = t < 1 ? requestAnimationFrame(frame) : null;
      if (!anim) root.classList.remove('is-moving');
    };
    root.classList.add('is-moving');
    anim = requestAnimationFrame(frame);
  }

  return Promise.all(loads).then(() => {
    view.appendChild(canvas);
    resize();
    new ResizeObserver(resize).observe(view);
    // show the canvas only once a frame matching the active <img> is on it
    requestAnimationFrame(() => root.classList.add('has-3d'));
    root.addEventListener('showcase:change', (e) => goTo(e.detail.index));
  });
}
