// VITA — application entry point. Owns the renderer, the menu/creator presentation
// and the single animation loop that hands control to the Game instance.
import * as THREE from 'three';
import { createWorld } from './gl/index.js';
import { buildCharacter } from './character.js';
import { UI } from './ui.js';
import { Game } from './game.js';
import { t, setLang, getLang, LANGS } from './i18n.js';

const $ = (sel) => document.querySelector(sel);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ------------------------------------------------------------------ language
try {
  const stored = localStorage.getItem('vita.lang');
  if (stored && LANGS[stored]) setLang(stored);
} catch { /* private mode */ }

// ------------------------------------------------------------------ renderer
const canvas = $('#scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
} catch (error) {
  const boot = $('#boot');
  if (boot) {
    boot.innerHTML = '<div class="boot-mark">V</div><h1 class="boot-logo">VITA</h1>' +
      '<p class="boot-sub">WebGL indisponibile / unavailable</p>' +
      '<p class="boot-hint">Abilita l’accelerazione hardware o prova un altro browser.</p>';
  }
  throw error;
}

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor('#101613', 1);

// ------------------------------------------------------------------ world
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 900);
const world = createWorld(renderer, scene);

// ------------------------------------------------------------------ audio
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.musicVolume = 65;
    this.sfxVolume = 75;
    this.ambientTimer = 0;
    this.step = 0;
    this.notes = [523.25, 659.25, 783.99, 659.25, 587.33, 493.88, 440.0, 493.88];
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      const ctx = new AudioCtx();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.72;
      this.master.connect(ctx.destination);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0;
      this.sfxBus.connect(this.master);

      this.startAmbient();
      this.applyVolume('music', this.musicVolume);
      this.applyVolume('sfx', this.sfxVolume);
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  startAmbient() {
    const ctx = this.ctx;
    if (!ctx || this.ambientTimer) return;
    const now = ctx.currentTime;

    // Warm, slowly breathing pad.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 880;
    filter.Q.value = 0.7;
    filter.connect(this.musicBus);

    const pad = ctx.createGain();
    pad.gain.setValueAtTime(0.0001, now);
    pad.gain.exponentialRampToValueAtTime(0.18, now + 5);
    pad.connect(filter);

    for (const [freq, detune, amp] of [[130.81, -4, 0.5], [196.0, 3, 0.36], [261.63, 0, 0.3], [329.63, 5, 0.18]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = amp;
      osc.connect(g);
      g.connect(pad);
      osc.start();
    }

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.075;
    lfo.connect(lfoGain);
    lfoGain.connect(pad.gain);
    lfo.start();

    // A very quiet sea wash under the music.
    const len = Math.floor(ctx.sampleRate * 5);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[i] = last * 2.4;
    }
    const sea = ctx.createBufferSource();
    sea.buffer = buffer;
    sea.loop = true;
    const seaFilter = ctx.createBiquadFilter();
    seaFilter.type = 'lowpass';
    seaFilter.frequency.value = 680;
    const seaGain = ctx.createGain();
    seaGain.gain.value = 0.085;
    sea.connect(seaFilter);
    seaFilter.connect(seaGain);
    seaGain.connect(this.musicBus);
    sea.start();

    this.ambientTimer = window.setInterval(() => this.pluck(), 3100);
  }

  pluck() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const freq = this.notes[this.step++ % this.notes.length];
    const now = ctx.currentTime + 0.02;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.065, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    osc.connect(gain);
    gain.connect(filter);
    filter.connect(this.musicBus);
    osc.start(now);
    osc.stop(now + 1.9);
  }

  applyVolume(kind, value) {
    const v = clamp(Number(value) || 0, 0, 100) / 100;
    if (kind === 'music') {
      this.musicVolume = Number(value) || 0;
      if (this.musicBus) this.musicBus.gain.setTargetAtTime(v * 0.62, this.ctx.currentTime, 0.25);
    } else {
      this.sfxVolume = Number(value) || 0;
      if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(v * 0.72, this.ctx.currentTime, 0.12);
    }
  }

  setVolume(kind, value) {
    if (!this.ctx) {
      if (kind === 'music') this.musicVolume = value;
      else this.sfxVolume = value;
      return;
    }
    this.ensure();
    this.applyVolume(kind, value);
  }

  tone(freq, { at = 0, dur = 0.14, type = 'sine', gain = 0.16, slide = 0 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.035, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  sfx(kind) {
    switch (kind) {
      case 'success':
        [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, { at: i * 0.075, dur: 0.24, gain: 0.13 }));
        break;
      case 'error':
        this.tone(196, { dur: 0.2, type: 'sawtooth', gain: 0.09, slide: -55 });
        break;
      case 'start':
        [261.63, 329.63, 392.0, 523.25].forEach((f, i) => this.tone(f, { at: i * 0.09, dur: 1.1, gain: 0.11 }));
        break;
      case 'open':
        this.tone(660, { dur: 0.09, gain: 0.1 });
        this.tone(990, { at: 0.04, dur: 0.11, gain: 0.06 });
        break;
      case 'pause':
        this.tone(392, { dur: 0.16, gain: 0.09 });
        break;
      default:
        this.tone(520, { dur: 0.07, gain: 0.08 });
    }
  }
}

const audio = new AudioEngine();

// ------------------------------------------------------------------ UI / game
let mode = 'menu';
let menuTime = 0;
let creatorYaw = 0;
let creatorPreview = null;
let creatorDrag = null;
let creatorIdle = 0;

const ui = new UI({
  onNewGame() {
    audio.ensure();
    mode = 'creator';
    game.stop();
    ui.openCreator();
    applyCreatorCamera();
    creatorYaw = 0;
  },
  onContinue() {
    audio.ensure();
    if (game.continueGame()) {
      mode = 'game';
      camera.clearViewOffset();
      updateCameraAspect();
    } else {
      ui.toast(t('menu.continueHint'), 'warn');
      ui.refreshMenuSave();
    }
  },
  onCreatorBack() {
    mode = 'menu';
    ui.showMenu();
    camera.clearViewOffset();
    updateCameraAspect();
  },
  onCreatorBegin(draft, appearance) {
    mode = 'game';
    camera.clearViewOffset();
    updateCameraAspect();
    audio.ensure();
    game.startNew(draft, appearance);
  },
  onCreatorChange(draft, appearance) {
    buildCreatorPreview(appearance);
  },
  onFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    } catch {
      ui.toast(t('settings.fullscreen'), 'warn');
    }
  },
  onReset() {
    game.reset();
    mode = 'menu';
    try { localStorage.removeItem('vita.save.v1'); } catch { /* ignore */ }
    ui.closeModal(true);
    ui.refreshMenuSave();
    ui.showMenu();
    camera.clearViewOffset();
    updateCameraAspect();
    ui.toast(t('toast.reset'), 'success');
  },
  onModalChange() { /* Game pauses while the UI is busy. */ }
});

const game = new Game({
  world,
  renderer,
  camera,
  ui,
  hooks: {
    onStart() {
      mode = 'game';
      camera.clearViewOffset();
      updateCameraAspect();
      audio.ensure();
    },
    setQuality: applyQuality,
    volume(kind, value) { audio.setVolume(kind, value); },
    sfx(kind) { audio.sfx(kind); }
  }
});
ui.setGame(game);
// A small debug surface for automated checks and curious players.
window.__vita = { game, ui, world, scene, camera, renderer, audio };

// ------------------------------------------------------------------ quality
let quality = 'high';
function applyQuality(next) {
  quality = next === 'low' ? 'low' : 'high';
  const low = quality === 'low';
  renderer.setPixelRatio(low ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = !low;
  if (world.ctx.sunLight) {
    world.ctx.sunLight.castShadow = !low;
    if (low && world.ctx.sunLight.shadow.map) {
      world.ctx.sunLight.shadow.map.dispose();
      world.ctx.sunLight.shadow.map = null;
    }
  }
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}

function updateCameraAspect() {
  camera.aspect = Math.max(0.4, window.innerWidth / Math.max(1, window.innerHeight));
  camera.updateProjectionMatrix();
}

function applyCreatorCamera() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  creatorCamera.aspect = Math.max(0.4, w / Math.max(1, h));
  const narrow = w <= 980;
  const dist = narrow ? 14.0 : 5.1;
  const targetY = narrow ? 1.02 : 1.06;
  const cameraY = narrow ? 1.55 : 1.62;
  creatorCamera.fov = narrow ? 32 : 34;
  creatorCamera.position.set(0, cameraY, dist);
  creatorCamera.lookAt(0, targetY, 0);
  if (narrow) {
    creatorCamera.setViewOffset(w, h, 0, Math.round(h * 0.305), w, h);
  } else {
    creatorCamera.setViewOffset(w, h, -Math.round(w * 0.115), 0, w, h);
  }
  creatorCamera.updateProjectionMatrix();
}

// ------------------------------------------------------------------ creator studio
const creatorScene = new THREE.Scene();
creatorScene.background = new THREE.Color('#111713');
creatorScene.fog = new THREE.Fog('#111713', 12, 30);
const creatorCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

{
  creatorScene.add(new THREE.HemisphereLight('#f0dfc4', '#1d2a22', 1.0));

  const key = new THREE.DirectionalLight('#ffe7c2', 3.1);
  key.position.set(3.4, 6.2, 4.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 18;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -2;
  key.shadow.normalBias = 0.02;
  creatorScene.add(key);

  const rim = new THREE.DirectionalLight('#d5b274', 2.0);
  rim.position.set(-4, 3.4, -3.2);
  creatorScene.add(rim);

  const fill = new THREE.DirectionalLight('#9fc7c4', 0.75);
  fill.position.set(-3.4, 2.2, 4.2);
  creatorScene.add(fill);

  const face = new THREE.DirectionalLight('#ffe9d0', 0.9);
  face.position.set(0.4, 2.6, 5.4);
  creatorScene.add(face);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: '#1a211b', roughness: 0.92, metalness: 0.04 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  creatorScene.add(floor);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.38, 0.16, 64),
    new THREE.MeshStandardMaterial({ color: '#2a3029', roughness: 0.55, metalness: 0.18 })
  );
  pedestal.position.y = -0.09;
  pedestal.receiveShadow = true;
  creatorScene.add(pedestal);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.04, 0.018, 6, 80),
    new THREE.MeshBasicMaterial({ color: '#d5b274', transparent: true, opacity: 0.72 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.005;
  creatorScene.add(ring);

  // A soft dark backdrop keeps the character legible behind the panel.
  const backdrop = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 13, 14, 48, 1, true),
    new THREE.MeshBasicMaterial({ color: '#151d18', side: THREE.BackSide, fog: true })
  );
  backdrop.position.y = 5.4;
  creatorScene.add(backdrop);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(2.7, 4.9, 64),
    new THREE.MeshBasicMaterial({ color: '#d5b274', transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false })
  );
  halo.position.set(0, 2.6, -3.2);
  creatorScene.add(halo);

  // Warm studio glow behind the character.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(128, 128, 8, 128, 128, 126);
  grad.addColorStop(0, 'rgba(232,196,132,.34)');
  grad.addColorStop(0.32, 'rgba(213,178,116,.15)');
  grad.addColorStop(0.7, 'rgba(120,98,64,.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.MeshBasicMaterial({
      map: glowTex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.9
    })
  );
  glow.position.set(0, 2.5, -3.4);
  creatorScene.add(glow);
}

function disposeModel(model) {
  if (!model?.group) return;
  model.group.traverse((child) => {
    if (child.geometry) child.geometry.dispose?.();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose?.());
      else child.material.dispose?.();
    }
  });
}

function buildCreatorPreview(appearance) {
  const previous = creatorPreview;
  const group = new THREE.Group();
  const model = buildCharacter(appearance);
  model.group.position.set(0, 0, 0);
  group.add(model.group);
  group.rotation.y = creatorYaw;
  group.visible = mode === 'creator';
  creatorScene.add(group);
  creatorPreview = { group, model };

  if (previous) {
    creatorScene.remove(previous.group);
    disposeModel(previous.model);
  }
  return creatorPreview;
}

// Rotate the model with a drag on the canvas while in the creator.
canvas.addEventListener('pointerdown', (event) => {
  if (mode !== 'creator') return;
  creatorDrag = { id: event.pointerId, x: event.clientX };
  creatorIdle = 0;
  try { canvas.setPointerCapture(event.pointerId); } catch { /* ignore */ }
});
canvas.addEventListener('pointermove', (event) => {
  if (mode !== 'creator' || !creatorDrag || event.pointerId !== creatorDrag.id) return;
  const dx = event.clientX - creatorDrag.x;
  creatorDrag.x = event.clientX;
  creatorYaw += dx * 0.008;
  if (creatorPreview) creatorPreview.group.rotation.y = creatorYaw;
});
const endCreatorDrag = (event) => {
  if (creatorDrag && event.pointerId === creatorDrag.id) creatorDrag = null;
};
canvas.addEventListener('pointerup', endCreatorDrag);
canvas.addEventListener('pointercancel', endCreatorDrag);
canvas.addEventListener('wheel', (event) => {
  if (mode !== 'creator') return;
  event.preventDefault();
  creatorYaw += event.deltaY * 0.0015;
  if (creatorPreview) creatorPreview.group.rotation.y = creatorYaw;
}, { passive: false });

// ------------------------------------------------------------------ menu camera
const menuTarget = new THREE.Vector3(0, 2.2, 0);
function updateMenuCamera(dt) {
  menuTime += dt;
  const angle = 0.55 + Math.sin(menuTime * 0.045) * 0.32 + menuTime * 0.006;
  const radius = 49;
  camera.fov = 46;
  camera.position.set(
    Math.sin(angle) * radius,
    17.5 + Math.sin(menuTime * 0.18) * 0.5,
    Math.cos(angle) * radius
  );
  camera.lookAt(menuTarget);
  camera.updateProjectionMatrix();
}

// ------------------------------------------------------------------ render loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;

  if (mode === 'menu') {
    updateMenuCamera(dt);
    world.update(dt, {
      hour: 17.65,
      weather: 'sunny',
      playerPos: menuTarget,
      camera,
      playerSpeed: 0
    });
    renderer.render(scene, camera);
  } else if (mode === 'creator') {
    if (!creatorDrag) {
      creatorIdle += dt;
      if (creatorIdle > 1.2) creatorYaw += dt * 0.055;
    }
    if (creatorPreview) {
      creatorPreview.group.rotation.y = creatorYaw;
      creatorPreview.model.update(dt, 0);
    }
    renderer.render(creatorScene, creatorCamera);
  } else {
    game.update(dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ viewport
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  if (mode === 'creator') {
    applyCreatorCamera();
  } else {
    camera.clearViewOffset();
    updateCameraAspect();
  }
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => window.setTimeout(resize, 120));
document.addEventListener('fullscreenchange', resize);

// ------------------------------------------------------------------ boot
applyQuality('high');
resize();
updateMenuCamera(0);

// The audio graph must wait for the first gesture (browser autoplay policy).
const unlockAudio = () => {
  audio.ensure();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('keydown', unlockAudio);

// Escape leaves the creator like the back button.
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mode === 'creator' && !ui.busy) {
    mode = 'menu';
    ui.showMenu();
    camera.clearViewOffset();
    updateCameraAspect();
  }
});

async function boot() {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch { /* fonts optional */ }
  await new Promise((resolve) => window.setTimeout(resolve, 850));
  ui.showMenu();
  mode = 'menu';
  updateMenuCamera(0);
  requestAnimationFrame(frame);
}

boot();
