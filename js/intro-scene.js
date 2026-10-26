// 33AD — scroll-driven 3D headset intro.
//
// Narrative: Calvary fills the frame (as if viewed through a worn headset) ->
// the headset is taken off and spins around to show its front -> it pushes
// toward the camera and grows until it fills the frame, and its own material
// color becomes the page background for everything that follows.
//
// Degrades silently to the static gradient hero (left in the DOM as
// .intro-fallback-bg) if: prefers-reduced-motion is set, WebGL isn't
// available, or either source asset (calvary.jpg/png, headset.glb) 404s —
// expected until those files are dropped into assets/images/hero/ and
// assets/models/headset/.
//
// Tuning constants are grouped below — the exact look will need adjusting
// once the real headset model is in hand (its native scale/pivot are
// unknown, so this auto-fits from the model's bounding box as a starting
// point).

const PHASE_SPIN_START = 0.35;
const PHASE_SPIN_END = 0.70;
const COPY_FADE_END = 0.18;
const HEADSET_NEAR_Z = -0.6; // "just taken off" position
const HEADSET_FAR_Z = -1.2; // drifts back slightly while spinning
const HEADSET_FILL_Z = -0.05; // pushed in close enough to fill the frame
const HEADSET_FILL_SCALE_MULT = 9; // grows this many times its base (frame-filling) scale
const CALVARY_DISTANCE = 8;

const section = document.getElementById('intro-scroll');
const canvas = document.getElementById('intro-canvas');
const fallback = document.querySelector('.intro-fallback-bg');
const copyEl = document.querySelector('.intro-copy');
const hintEl = document.querySelector('.intro-scroll-hint');

function useFallback(reason) {
  if (reason) console.info(`[33AD intro] Falling back to static hero — ${reason}`);
  if (canvas) canvas.style.display = 'none';
}

function hasWebGL() {
  try {
    const testCanvas = document.createElement('canvas');
    return !!(testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!section || !canvas) {
  // Markup not present on this page — nothing to do.
} else if (reduceMotion) {
  useFallback('prefers-reduced-motion is set');
} else if (!hasWebGL()) {
  useFallback('WebGL is not available in this browser');
} else {
  initScene().catch((err) => {
    const missing = err && err.target && err.target.src ? err.target.src : err?.message || err;
    useFallback(`required asset missing or failed to load (${missing})`);
  });
}

function loadCalvaryTexture(THREE) {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      'assets/images/hero/calvary.jpg',
      resolve,
      undefined,
      () => loader.load('assets/images/hero/calvary.png', resolve, undefined, reject)
    );
  });
}

function loadHeadset(GLTFLoader) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load('assets/models/headset/headset.glb', resolve, undefined, reject);
  });
}

function pickHeadsetColor(THREE, gltfScene) {
  let best = null;
  let bestCount = -1;

  gltfScene.traverse((node) => {
    if (!node.isMesh || !node.geometry || !node.geometry.attributes.position) return;
    const count = node.geometry.attributes.position.count;
    const material = Array.isArray(node.material) ? node.material[0] : node.material;
    if (material && material.color && count > bestCount) {
      bestCount = count;
      best = material.color;
    }
  });

  return best ? best.clone() : new THREE.Color('#c9a24b');
}

async function initScene() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  const [calvaryTexture, gltf] = await Promise.all([
    loadCalvaryTexture(THREE),
    loadHeadset(GLTFLoader),
  ]);

  fallback.style.display = 'none';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 0);

  const headsetColor = pickHeadsetColor(THREE, gltf.scene);
  const handoffHex = `#${headsetColor.getHexString()}`;
  document.documentElement.style.setProperty('--intro-handoff-color', handoffHex);
  renderer.setClearColor(headsetColor, 1);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(2, 3, 4);
  scene.add(keyLight);

  calvaryTexture.colorSpace = THREE.SRGBColorSpace;
  const calvaryMaterial = new THREE.MeshBasicMaterial({
    map: calvaryTexture,
    transparent: true,
    opacity: 1,
  });
  const calvaryPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), calvaryMaterial);
  calvaryPlane.position.z = -CALVARY_DISTANCE;
  scene.add(calvaryPlane);

  const headsetGroup = new THREE.Group();
  headsetGroup.add(gltf.scene);
  scene.add(headsetGroup);

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  gltf.scene.position.sub(center);

  const largestDimension = Math.max(size.x, size.y, size.z) || 1;
  const baseScale = 0.9 / largestDimension;
  headsetGroup.scale.setScalar(baseScale);
  headsetGroup.position.set(0, 0, HEADSET_NEAR_Z);

  function fitCalvaryPlane() {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFov / 2) * CALVARY_DISTANCE;
    const width = height * camera.aspect;
    calvaryPlane.geometry.dispose();
    calvaryPlane.geometry = new THREE.PlaneGeometry(width, height);
  }

  function resize() {
    const width = section.clientWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitCalvaryPlane();
  }

  window.addEventListener('resize', resize);
  resize();

  let sectionTop = 0;
  let sectionHeight = 0;

  function measure() {
    sectionTop = section.offsetTop;
    sectionHeight = section.offsetHeight;
  }
  measure();
  window.addEventListener('resize', measure);

  function getProgress() {
    const total = sectionHeight - window.innerHeight;
    if (total <= 0) return 1;
    const p = (window.scrollY - sectionTop) / total;
    return Math.min(1, Math.max(0, p));
  }

  function smoothstep(edge0, edge1, x) {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  const clock = new THREE.Clock();

  function updateScene(progress) {
    const spinT = smoothstep(PHASE_SPIN_START, PHASE_SPIN_END, progress);
    const fillT = smoothstep(PHASE_SPIN_END, 1, progress);
    const idle = Math.sin(clock.getElapsedTime() * 0.6) * 0.03;

    headsetGroup.rotation.y = lerp(0, Math.PI, spinT) + idle;
    headsetGroup.position.z = lerp(
      lerp(HEADSET_NEAR_Z, HEADSET_FAR_Z, spinT),
      HEADSET_FILL_Z,
      fillT
    );
    headsetGroup.scale.setScalar(baseScale * lerp(1, HEADSET_FILL_SCALE_MULT, fillT));

    calvaryMaterial.opacity = lerp(1, 0, Math.min(1, spinT + fillT));

    if (copyEl) {
      const copyOpacity = 1 - smoothstep(0, COPY_FADE_END, progress);
      copyEl.style.opacity = String(copyOpacity);
      copyEl.style.pointerEvents = copyOpacity < 0.05 ? 'none' : 'auto';
    }
    if (hintEl) {
      hintEl.style.opacity = String(1 - smoothstep(0, COPY_FADE_END, progress));
    }
  }

  let running = false;
  let rafId = null;

  function animate() {
    if (!running) return;
    updateScene(getProgress());
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        rafId = requestAnimationFrame(animate);
      } else if (!entry.isIntersecting && running) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      }
    },
    { threshold: 0 }
  );
  observer.observe(section);

  // Paint one frame immediately so there's no blank flash before the first
  // scroll/intersection event fires.
  updateScene(getProgress());
  renderer.render(scene, camera);
}
