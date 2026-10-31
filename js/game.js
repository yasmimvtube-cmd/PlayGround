// VITA — life simulation rules, state, input and the playable world camera.
import * as THREE from 'three';
import { buildCharacter } from './character.js';
import {
  DLCS, CAREERS, TRAITS, OUTFITS, OUTFIT_KEYS, PETS, SPOTS, NPCS, DISTRICT_NAMES
} from './data.js';
import { t, tr } from './i18n.js';
import { SAVE_KEY } from './ui.js';

const VERSION = 1;
const WALK_SPEED = 4.6;
const START = { x: 0, z: 12, yaw: Math.PI };
const NEED_RATES = { energy: 3.3, hunger: 4.3, hygiene: 2.8, social: 2.5, fun: 3.6 };
const LEISURE = new Set([
  'relax', 'photo', 'walk', 'tv', 'wine', 'harvest', 'swim', 'sunbathe',
  'gondola', 'tour', 'pray', 'sailing', 'runway', 'train'
]);
const AMORE_RELATIONS = new Set(['date', 'propose', 'wedding']);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v) => Math.round(v);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function hoursText(h) {
  if (!h) return '';
  if (h < 1) return `${Math.round(h * 60)} ${t('common.min')}`;
  return `${Math.round(h * 10) / 10} ${t('common.hours')}`;
}

function weatherName(key) {
  return t('hud.weather.' + key);
}

// ------------------------------------------------------------------ actions
const SPOT_ACTIONS = {
  home: [
    { id: 'sleep', icon: 'moon', hours: 0, special: 'sleep' },
    { id: 'nap', icon: 'moon', hours: 2, needs: { energy: 26, hunger: -3, hygiene: -2, fun: 2 } },
    { id: 'shower', icon: 'droplet', hours: 0.5, setNeeds: { hygiene: 100 }, needs: { fun: 4, energy: 3 } },
    { id: 'cook', icon: 'utensils', hours: 1, cost: 6, needs: { hunger: 55, fun: 10, hygiene: -2 }, toast: 'toast.recipe' },
    { id: 'tv', icon: 'star', hours: 1.5, needs: { fun: 24, energy: 2, social: -3 }, leisure: true },
    { id: 'changeOutfit', icon: 'hanger', hours: 0, special: 'wardrobe' }
  ],
  cafe: [
    { id: 'coffee', icon: 'cup', hours: 0.5, cost: 4, needs: { energy: 12, hunger: 8, fun: 6, hygiene: -2 } },
    { id: 'eat', icon: 'utensils', hours: 1, cost: 22, needs: { hunger: 72, fun: 10, social: 3, hygiene: -3 } },
    { id: 'talkBarista', icon: 'users', hours: 0.5, needs: { social: 20, fun: 5 }, talk: true }
  ],
  piazza: [
    { id: 'relax', icon: 'users', hours: 1, needs: { fun: 16, social: 5, energy: 3 }, leisure: true },
    { id: 'coin', icon: 'coin', hours: 0.2, cost: 1, needs: { fun: 14, social: 2 }, toast: 'toast.wish' },
    { id: 'photo', icon: 'camera', hours: 0.4, needs: { fun: 10 }, leisure: true, photo: true, toast: 'toast.photo' },
    { id: 'talk', icon: 'users', hours: 0.5, needs: { social: 18, fun: 4 }, talk: true }
  ],
  market: [
    { id: 'order', icon: 'utensils', hours: 0.7, cost: 14, needs: { hunger: 55, fun: 5, social: 2 } },
    { id: 'groceries', icon: 'basket', hours: 0.5, cost: 20, needs: { hunger: 18, fun: 4 }, groceries: true },
    { id: 'talk', icon: 'users', hours: 0.5, needs: { social: 17, fun: 4 }, talk: true }
  ],
  gym: [
    { id: 'workout', icon: 'dumbbell', hours: 1.5, needs: { energy: -15, hygiene: -20, fun: 24, social: 5 }, leisure: true },
    { id: 'train', icon: 'briefcase', hours: 2, pay: 45, needs: { energy: -12, social: 10, fun: 8 }, requiresCareer: 'trainer' }
  ],
  duomo: [
    { id: 'pray', icon: 'church', hours: 0.5, needs: { fun: 12, social: 5, energy: 3 }, leisure: true },
    { id: 'tour', icon: 'walk', hours: 1, cost: 10, needs: { fun: 24, social: 10 }, leisure: true, toast: 'toast.tour' }
  ],
  promenade: [
    { id: 'walk', icon: 'walk', hours: 1, needs: { fun: 12, energy: -3, social: 4 }, leisure: true },
    { id: 'photo', icon: 'camera', hours: 0.4, needs: { fun: 10 }, leisure: true, photo: true, toast: 'toast.photo' },
    { id: 'sailing', icon: 'boat', hours: 2, cost: 25, needs: { fun: 35, social: 10 }, leisure: true, toast: 'toast.sailing', requiresDlc: 'mare' }
  ],
  boutique: [
    { id: 'buyOutfit', icon: 'hanger', hours: 1, cost: 55, needs: { fun: 25, hygiene: 4 }, buyOutfit: true, toast: 'toast.outfit' },
    { id: 'runway', icon: 'sparkle', hours: 2, pay: 45, needs: { fun: 35, social: 20, energy: -8 }, leisure: true, toast: 'toast.runway', requiresDlc: 'moda' }
  ],
  vineyard: [
    { id: 'wine', icon: 'grape', hours: 1, cost: 12, needs: { fun: 22, social: 7, hunger: 10 }, leisure: true, toast: 'toast.wine' },
    { id: 'harvest', icon: 'basket', hours: 3, pay: 38, needs: { energy: -18, hunger: -10, fun: 8 }, leisure: true, toast: 'toast.harvest' }
  ],
  colosseum: [
    { id: 'tour', icon: 'column', hours: 1, cost: 12, needs: { fun: 24, social: 10 }, leisure: true, toast: 'toast.tour' }
  ],
  canal: [
    { id: 'gondola', icon: 'boat', hours: 1.5, cost: 20, needs: { fun: 35, social: 12 }, leisure: true }
  ],
  beach: [
    { id: 'swim', icon: 'wave', hours: 1.5, needs: { energy: -10, hygiene: 25, fun: 30 }, leisure: true },
    { id: 'sunbathe', icon: 'sun', hours: 2, needs: { fun: 20, energy: 5, hygiene: -6 }, leisure: true },
    { id: 'sailing', icon: 'boat', hours: 2, cost: 25, needs: { fun: 35, social: 10 }, leisure: true, toast: 'toast.sailing', requiresDlc: 'mare' }
  ],
  garden: [
    { id: 'relax', icon: 'flower', hours: 1, needs: { fun: 20, social: 8 }, leisure: true },
    { id: 'date', icon: 'heart', hours: 2, cost: 20, special: 'date', requiresDlc: 'amore' },
    { id: 'propose', icon: 'heart', hours: 1, special: 'propose', requiresDlc: 'amore' },
    { id: 'wedding', icon: 'church', hours: 2, cost: 120, special: 'wedding', requiresDlc: 'amore' }
  ],
  shelter: [
    { id: 'adoptDog', icon: 'paw', hours: 0.5, special: 'adopt', petType: 'dog', requiresDlc: 'pets' },
    { id: 'adoptCat', icon: 'paw', hours: 0.5, special: 'adopt', petType: 'cat', requiresDlc: 'pets' },
    { id: 'playPet', icon: 'paw', hours: 1, needs: { fun: 28, social: 14 }, special: 'playPet', requiresDlc: 'pets' }
  ]
};

export class Game {
  constructor({ world, renderer, camera, ui, hooks = {} }) {
    this.world = world;
    this.scene = world.scene;
    this.renderer = renderer;
    this.camera = camera;
    this.ui = ui;
    this.hooks = hooks;
    this.state = null;
    this.active = false;
    this.player = null;
    this.keys = new Set();
    this.joystick = { x: 0, y: 0 };
    this.joystickPointer = null;
    this.drag = null;
    this.cameraYaw = 0;
    this.cameraPitch = 0.36;
    this.cameraDistance = 8.8;
    this.cameraTarget = new THREE.Vector3();
    this.tmpTarget = new THREE.Vector3();
    this.tmpPos = new THREE.Vector3();
    this.interaction = null;
    this.interactionTimer = 0;
    this.hudTimer = 0;
    this.minimapTimer = 0;
    this.autosaveTimer = 0;
    this.previousSpeed = 1;
    this.lastPromptSignature = '';
    this._bindInput();
    this._bindJoystick();
    window.addEventListener('pagehide', () => { if (this.active) this.save(false); });
  }

  // ---------------------------------------------------------------- state
  defaultState(draft = {}, appearance = {}) {
    const outfit = draft.outfit || appearance.outfit || 'casual';
    const dlc = Object.fromEntries(DLCS.map((d) => [d.id, true]));
    return {
      version: VERSION,
      name: draft.name || 'Giulia',
      appearance: {
        skin: draft.skin || appearance.skin || '#e8b690',
        hair: draft.hair || appearance.hair || '#4b2e1f',
        hairStyle: draft.hairStyle || appearance.hairStyle || 'long',
        outfit,
        palette: draft.palette || outfit && OUTFITS[outfit]?.accent || '#c4573f'
      },
      traits: Array.isArray(draft.traits) ? draft.traits.slice(0, 2) : [],
      money: 120,
      day: 1,
      hour: 9,
      speed: 1,
      weather: 'sunny',
      needs: { energy: 88, hunger: 74, hygiene: 84, social: 68, fun: 76 },
      career: null,
      relationships: {},
      marriedTo: null,
      engagedTo: null,
      partner: null,
      pet: null,
      ownedOutfits: [...new Set([outfit, 'casual'])],
      stats: { leisure: 0, dates: 0, photos: 0 },
      questsDone: {},
      allQuests: false,
      needWarnings: {},
      discovered: [],
      lastWorkDay: -1,
      settings: { music: 65, sfx: 75, quality: 'high' },
      player: { ...START },
      dlc
    };
  }

  normalizeState(s) {
    const base = this.defaultState({}, {});
    const out = {
      ...base,
      ...s,
      appearance: { ...base.appearance, ...(s.appearance || {}) },
      needs: { ...base.needs, ...(s.needs || {}) },
      stats: { ...base.stats, ...(s.stats || {}) },
      settings: { ...base.settings, ...(s.settings || {}) },
      player: { ...base.player, ...(s.player || {}) },
      questsDone: { ...(s.questsDone || {}) },
      needWarnings: { ...(s.needWarnings || {}) },
      relationships: { ...(s.relationships || {}) },
      dlc: { ...base.dlc, ...(s.dlc || {}) },
      ownedOutfits: Array.isArray(s.ownedOutfits) && s.ownedOutfits.length ? s.ownedOutfits : base.ownedOutfits
    };
    if (out.career && !CAREERS[out.career.id]) out.career = null;
    if (!OUTFITS[out.appearance.outfit]) out.appearance.outfit = 'casual';
    out.hour = clamp(Number(out.hour) || 9, 0, 23.99);
    out.day = Math.max(1, Math.floor(Number(out.day) || 1));
    out.money = Math.max(0, Number(out.money) || 0);
    out.speed = [0, 1, 2, 4].includes(Number(out.speed)) ? Number(out.speed) : 1;
    for (const npc of NPCS) {
      if (!out.relationships[npc.id]) out.relationships[npc.id] = { friendship: 0, romance: 0, met: false };
      else out.relationships[npc.id] = {
        friendship: clamp(Number(out.relationships[npc.id].friendship) || 0, 0, 100),
        romance: clamp(Number(out.relationships[npc.id].romance) || 0, 0, 100),
        met: !!out.relationships[npc.id].met
      };
    }
    return out;
  }

  startNew(draft, appearance) {
    this.stop();
    this.state = this.normalizeState(this.defaultState(draft, appearance));
    this.begin(true);
  }

  continueGame() {
    const save = Game.readSave();
    if (!save) return false;
    this.stop();
    this.state = this.normalizeState(save);
    this.begin(false);
    return true;
  }

  static readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && data.version <= VERSION ? data : data;
    } catch { return null; }
  }

  begin(isNew) {
    this.active = true;
    this.syncWorldDLC();
    this.buildPlayer();
    this.world.setPet(this.state.pet || null);
    this.syncCameraToPlayer(true);
    this.ui.showGame();
    this.ui.renderHUD();
    this.ui.setSpeed(this.state.speed);
    this.refreshPrompt();
    this.hooks.onStart?.();
    this.hooks.setQuality?.(this.state.settings.quality);
    this.hooks.volume?.('music', this.state.settings.music);
    this.hooks.volume?.('sfx', this.state.settings.sfx);
    this.sfx('start');
    if (isNew) {
      this.ui.banner('Porto Sereno', t('banner.welcome'), t('banner.welcomeDesc'), 4600);
      this.ui.toast(t('menu.enter'), 'success');
      window.setTimeout(() => {
        if (this.active) this.ui.toast(t('hint.move'), 'info');
      }, 1800);
    } else {
      this.ui.toast(t('menu.continueHint'), 'success');
    }
    this.save(false);
  }

  stop() {
    this.active = false;
    this.keys.clear();
    this.joystick = { x: 0, y: 0 };
    this.joystickPointer = null;
    this.drag = null;
    this.interaction = null;
    this.interactionTimer = 0;
    this.lastPromptSignature = '';
    this.ui?.hidePrompt();
    if (this.player) {
      this.scene.remove(this.player.group);
      this.player = null;
    }
    this.world?.setPet?.(null);
  }

  disposePlayerModel(model) {
    if (!model?.group) return;
    model.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose?.();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose?.());
        else child.material.dispose?.();
      }
    });
  }

  playerAppearance() {
    const a = this.state.appearance;
    const outfit = OUTFITS[a.outfit] || OUTFITS.casual;
    return {
      skin: a.skin, hair: a.hair, hairStyle: a.hairStyle,
      top: outfit.top, bottom: outfit.bottom, shoes: outfit.shoes,
      accent: a.palette || outfit.accent, dress: outfit.dress
    };
  }

  buildPlayer() {
    if (this.player) {
      this.disposePlayerModel(this.player);
      this.scene.remove(this.player.group);
    }
    const model = buildCharacter(this.playerAppearance());
    const p = this.state.player;
    model.group.position.set(Number(p.x) || 0, 0, Number(p.z) || 12);
    model.group.rotation.y = Number(p.yaw) || Math.PI;
    model.group.visible = this.active;
    this.scene.add(model.group);
    this.player = model;
    this.world.ctx.playerYaw = model.group.rotation.y;
  }

  syncCameraToPlayer(instant = false) {
    const p = this.state.player;
    this.cameraYaw = (Number(p.yaw) || Math.PI) - Math.PI;
    this.cameraPitch = 0.36;
    this.cameraDistance = 8.8;
    this.tmpTarget.set(p.x || 0, 1.35, p.z || 12);
    const cos = Math.cos(this.cameraPitch);
    this.tmpPos.set(
      this.tmpTarget.x + Math.sin(this.cameraYaw) * cos * this.cameraDistance,
      this.tmpTarget.y + Math.sin(this.cameraPitch) * this.cameraDistance,
      this.tmpTarget.z + Math.cos(this.cameraYaw) * cos * this.cameraDistance
    );
    if (instant) this.camera.position.copy(this.tmpPos);
    this.cameraTarget.copy(this.tmpTarget);
    this.camera.lookAt(this.tmpTarget);
  }

  rebuildPlayer() {
    const pos = this.player?.group.position;
    const yaw = this.player?.group.rotation.y;
    if (pos) {
      this.state.player.x = pos.x;
      this.state.player.z = pos.z;
      this.state.player.yaw = yaw;
    }
    this.buildPlayer();
  }

  // ---------------------------------------------------------------- input
  _bindInput() {
    window.addEventListener('keydown', (event) => {
      if (!this.active) return;
      if (event.target instanceof HTMLElement && event.target.matches('input, textarea, select')) return;
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        this.keys.add(key);
        event.preventDefault();
        return;
      }
      if (key === 'e') {
        event.preventDefault();
        this.interact();
      } else if (key === ' ') {
        event.preventDefault();
        this.togglePause();
      } else if (key === 'escape') {
        if (!this.ui.modalOpen && this.ui.progressOpen === false) this.togglePause();
      } else if (key === 'm') {
        if (!this.ui.busy) this.ui.openMap();
      } else if (key === 'j') {
        if (!this.ui.busy) this.ui.openDiary();
      } else if (key === 'r') {
        if (!this.ui.busy) this.ui.openRelations();
      } else if (key === 'h') {
        if (!this.ui.busy) this.ui.openHelp();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener('blur', () => this.keys.clear());

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (event) => {
      if (!this.active || this.ui.busy) return;
      this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      try { canvas.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.active || !this.drag || event.pointerId !== this.drag.id) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
      this.cameraYaw -= dx * 0.0055;
      this.cameraPitch = clamp(this.cameraPitch - dy * 0.0035, 0.08, 0.92);
    });
    const endDrag = (event) => {
      if (this.drag && event.pointerId === this.drag.id) this.drag = null;
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', (event) => {
      if (!this.active || this.ui.busy) return;
      event.preventDefault();
      this.cameraDistance = clamp(this.cameraDistance + event.deltaY * 0.007, 4.5, 15);
    }, { passive: false });
  }

  _bindJoystick() {
    const joy = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    if (!joy || !knob) return;
    const setKnob = (x, y) => { knob.style.transform = `translate(${x}px, ${y}px)`; };
    const update = (event) => {
      const rect = joy.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (event.clientX - cx) / (rect.width / 2 - 12);
      let dy = (event.clientY - cy) / (rect.height / 2 - 12);
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      this.joystick.x = dx;
      this.joystick.y = -dy;
      const max = rect.width / 2 - 22;
      setKnob(dx * max, dy * max);
    };
    joy.addEventListener('pointerdown', (event) => {
      if (!this.active) return;
      event.preventDefault();
      this.joystickPointer = event.pointerId;
      try { joy.setPointerCapture(event.pointerId); } catch { /* ignore */ }
      update(event);
    });
    joy.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.joystickPointer) update(event);
    });
    const end = (event) => {
      if (event.pointerId !== this.joystickPointer) return;
      this.joystickPointer = null;
      this.joystick.x = 0;
      this.joystick.y = 0;
      setKnob(0, 0);
    };
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
  }

  // ---------------------------------------------------------------- loop
  update(dt) {
    if (!this.active || !this.state || !this.player) return;
    const busy = this.ui.busy;
    let movingSpeed = 0;

    if (!busy) {
      movingSpeed = this.updateMovement(dt);
      if (this.state.speed > 0) {
        const hours = (dt * this.state.speed) / 60;
        this.advanceTime(hours, true);
      }
    } else {
      this.player.update(dt, 0);
    }

    this.updateCamera(dt);
    this.world.update(dt, {
      hour: this.state.hour,
      weather: this.state.weather,
      playerPos: this.player.group.position,
      camera: this.camera,
      playerSpeed: movingSpeed
    });
    this.world.ctx.playerYaw = this.player.group.rotation.y;

    this.hudTimer += dt;
    if (this.hudTimer > 0.24) {
      this.hudTimer = 0;
      this.ui.renderHUD();
    }
    this.interactionTimer += dt;
    if (this.interactionTimer > 0.12) {
      this.interactionTimer = 0;
      this.refreshPrompt();
    }
    this.minimapTimer += dt;
    if (this.minimapTimer > 0.5) {
      this.minimapTimer = 0;
      this.ui.drawMinimap();
    }
    this.autosaveTimer += dt;
    if (this.autosaveTimer > 45) {
      this.autosaveTimer = 0;
      if (!busy) this.save(false);
    }
  }

  updateMovement(dt) {
    let ix = 0;
    let iy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) iy += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) iy -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) ix += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) ix -= 1;
    ix += this.joystick.x;
    iy += this.joystick.y;
    const len = Math.hypot(ix, iy);
    if (len < 0.08) {
      this.player.update(dt, 0);
      return 0;
    }
    if (len > 1) { ix /= len; iy /= len; }

    const forwardX = -Math.sin(this.cameraYaw);
    const forwardZ = -Math.cos(this.cameraYaw);
    const rightX = Math.cos(this.cameraYaw);
    const rightZ = -Math.sin(this.cameraYaw);
    const vx = forwardX * iy + rightX * ix;
    const vz = forwardZ * iy + rightZ * ix;
    const speed = WALK_SPEED * Math.min(1, Math.hypot(ix, iy));
    const step = speed * dt;
    const group = this.player.group;
    let x = group.position.x;
    let z = group.position.z;
    const nx = x + vx * step;
    if (!this.world.isBlocked(nx, z)) x = nx;
    const nz = z + vz * step;
    if (!this.world.isBlocked(x, nz)) z = nz;
    group.position.x = x;
    group.position.z = z;

    if (Math.abs(vx) + Math.abs(vz) > 0.02) {
      const targetYaw = Math.atan2(vx, vz);
      let diff = ((targetYaw - group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      group.rotation.y += diff * Math.min(1, dt * 12);
    }
    this.player.update(dt, speed);
    this.state.player.x = x;
    this.state.player.z = z;
    this.state.player.yaw = group.rotation.y;
    return speed;
  }

  updateCamera(dt) {
    const p = this.player.group.position;
    this.tmpTarget.set(p.x, 1.35, p.z);
    this.cameraTarget.lerp(this.tmpTarget, Math.min(1, dt * 9));
    if (this.cameraTarget.lengthSq() === 0) this.cameraTarget.copy(this.tmpTarget);
    const cos = Math.cos(this.cameraPitch);
    this.tmpPos.set(
      this.cameraTarget.x + Math.sin(this.cameraYaw) * cos * this.cameraDistance,
      Math.max(0.8, this.cameraTarget.y + Math.sin(this.cameraPitch) * this.cameraDistance),
      this.cameraTarget.z + Math.cos(this.cameraYaw) * cos * this.cameraDistance
    );
    this.camera.position.lerp(this.tmpPos, Math.min(1, dt * 9));
    this.camera.lookAt(this.cameraTarget);
  }

  // ---------------------------------------------------------------- clock / needs
  advanceTime(hours, decay = true) {
    if (!hours || hours <= 0) return;
    const dayBefore = this.state.day;
    this.state.hour += hours;
    let days = 0;
    while (this.state.hour >= 24) {
      this.state.hour -= 24;
      this.state.day++;
      days++;
    }
    if (decay) this.decayNeeds(hours);
    if (this.state.day !== dayBefore) this.onNewDay(days);
  }

  onNewDay() {
    this.state.weather = this.rollWeather();
    this.state.needWarnings = {};
    this.ui.banner(t('banner.day', { day: this.state.day }), t('banner.newDay'), t('banner.newDayDesc'), 4200);
    this.ui.toast(t('toast.newDay', { day: this.state.day }), 'success');
    window.setTimeout(() => {
      if (this.active) this.ui.toast(t('toast.weather', { weather: weatherName(this.state.weather) }));
    }, 900);
    this.save(false);
  }

  rollWeather() {
    const r = Math.random();
    if (r < 0.2) return 'rain';
    if (r < 0.5) return 'cloudy';
    return 'sunny';
  }

  decayNeeds(hours) {
    const traits = new Set(this.state.traits || []);
    const night = this.state.hour >= 22 || this.state.hour < 6;
    const rates = { ...NEED_RATES };
    if (traits.has('athlete')) rates.energy *= 0.72;
    if (traits.has('nightowl') && night) rates.energy *= 0.5;
    if (traits.has('gourmet')) rates.hunger *= 1.42;
    if (traits.has('social')) rates.social *= 0.62;
    if (traits.has('dreamer')) rates.fun *= 0.68;
    for (const key of Object.keys(rates)) {
      const need = this.state.needs;
      need[key] = clamp(need[key] - rates[key] * hours, 0, 100);
    }
    this.checkNeedWarnings();
    if (this.state.needs.energy <= 0.01) this.collapse();
  }

  checkNeedWarnings() {
    const warnings = this.state.needWarnings || (this.state.needWarnings = {});
    for (const key of Object.keys(this.state.needs)) {
      const v = this.state.needs[key];
      if (v <= 22 && !warnings[key]) {
        warnings[key] = true;
        this.ui.toast(t(`need.${key}.low`), 'warn');
      } else if (v > 34 && warnings[key]) {
        warnings[key] = false;
      }
    }
  }

  collapse() {
    if (!this.active) return;
    const oldDay = this.state.day;
    if (this.state.hour >= 6) this.state.day++;
    this.state.hour = 7;
    this.state.player.x = START.x;
    this.state.player.z = START.z;
    this.state.player.yaw = START.yaw;
    this.state.needs.energy = 58;
    this.state.needs.hunger = Math.max(10, this.state.needs.hunger - 10);
    if (this.player) {
      this.player.group.position.set(START.x, 0, START.z);
      this.player.group.rotation.y = START.yaw;
    }
    this.syncCameraToPlayer(true);
    this.state.needWarnings = {};
    this.ui.toast(t('toast.collapse'), 'warn');
    if (this.state.day !== oldDay) this.onNewDay();
    this.afterChange();
    this.save(false);
  }

  moodKey() {
    const n = this.state.needs;
    const avg = (n.energy + n.hunger + n.hygiene + n.social + n.fun) / 5;
    if (avg >= 82) return 'radiant';
    if (avg >= 68) return 'happy';
    if (avg >= 50) return 'content';
    if (avg >= 34) return 'tired';
    if (avg >= 18) return 'low';
    return 'miserable';
  }

  // ---------------------------------------------------------------- interaction
  refreshPrompt() {
    if (!this.active || this.ui.busy) { this.ui.hidePrompt(); return; }
    const pos = this.state.player;
    let best = null;
    let bestScore = Infinity;

    for (const spot of SPOTS) {
      if (spot.dlc && this.state.dlc[spot.dlc] === false) continue;
      const d = Math.hypot(pos.x - spot.x, pos.z - spot.z);
      if (d <= spot.radius + 1.35 && d - spot.radius < bestScore) {
        bestScore = d - spot.radius;
        best = { type: 'spot', spot };
      }
    }
    for (const npc of NPCS) {
      const live = this.world.ctx.npcs?.find((n) => n.id === npc.id);
      const p = live?.pos || { x: npc.home[0], z: npc.home[1] };
      const d = Math.hypot(pos.x - p.x, pos.z - p.z);
      if (d < 2.7 && d - 1.6 < bestScore) {
        bestScore = d - 1.6;
        best = { type: 'npc', npc };
      }
    }

    if (!best) {
      this.interaction = null;
      this.lastPromptSignature = '';
      this.ui.hidePrompt();
      return;
    }
    const id = best.type === 'spot' ? best.spot.id : best.npc.id;
    const sig = best.type + ':' + id;
    this.interaction = best;
    if (sig !== this.lastPromptSignature) {
      this.lastPromptSignature = sig;
      if (best.type === 'spot') {
        this.ui.showPrompt(best.spot, null);
        if (!this.state.discovered.includes(best.spot.id)) {
          this.state.discovered.push(best.spot.id);
          this.ui.toast(t('location.discovered', { name: t('h.' + best.spot.id) }), 'success');
        }
      } else {
        this.ui.showPrompt(null, best.npc);
      }
    }
  }

  interact() {
    if (!this.active || this.ui.busy) return;
    this.refreshPrompt();
    if (!this.interaction) return;
    this.sfx('open');
    if (this.interaction.type === 'spot') this.ui.openSpot(this.interaction.spot.id);
    else this.ui.openNpc(this.interaction.npc.id);
  }

  // ---------------------------------------------------------------- actions
  actionDef(spotId, actionId) {
    return (SPOT_ACTIONS[spotId] || []).find((a) => a.id === actionId) || null;
  }

  getCareerOptions(spotId) {
    const all = Object.entries(CAREERS).map(([id, c]) => ({
      id, ...c,
      remote: !spotId,
      locked: !!(c.dlc && this.state.dlc[c.dlc] === false)
    }));
    return spotId ? all.filter((c) => c.spot === spotId) : all;
  }

  getCurrentCareerSpot() {
    return this.state.career ? CAREERS[this.state.career.id]?.spot || null : null;
  }

  careerPay(id = this.state.career?.id) {
    if (!id || !CAREERS[id]) return 0;
    const level = this.state.career?.level || 1;
    let pay = CAREERS[id].pay * (1 + 0.12 * (level - 1));
    if ((this.state.traits || []).includes('workaholic')) pay *= 1.15;
    return Math.round(pay);
  }

  canWork() {
    if (!this.state.career) return { ok: false, reason: t('c.needApply') };
    const spot = CAREERS[this.state.career.id]?.spot;
    if (!spot) return { ok: false, reason: t('c.needApply') };
    if (this.state.lastWorkDay === this.state.day) return { ok: false, reason: t('action.alreadyWorked') };
    if (this.state.hour < 9 || this.state.hour >= 17) return { ok: false, reason: t('toast.offDuty') };
    if (CAREERS[this.state.career.id].dlc && this.state.dlc[CAREERS[this.state.career.id].dlc] === false) {
      return { ok: false, reason: t('action.needDlc', { dlc: t('dlc.' + CAREERS[this.state.career.id].dlc + '.name') }) };
    }
    return { ok: true, reason: '' };
  }

  getSpotActions(spotId) {
    const list = [];
    if (this.state.career && CAREERS[this.state.career.id]?.spot === spotId) {
      const check = this.canWork();
      list.push({
        id: 'work', icon: 'briefcase', work: true,
        name: t('common.work'), desc: t('hud.shiftHours'),
        pay: this.careerPay(), time: hoursText(3),
        state: this.state.lastWorkDay === this.state.day ? t('hud.shiftToday') : t('hud.shiftReady'),
        locked: !check.ok, lockNote: check.ok ? '' : check.reason
      });
    }

    for (const def of SPOT_ACTIONS[spotId] || []) {
      const name = this.actionName(def);
      const desc = this.actionDesc(def);
      const meta = this.actionLock(spotId, def);
      list.push({
        ...def,
        name,
        desc,
        time: def.special === 'work' ? '' : hoursText(def.hours),
        locked: meta.locked,
        lockNote: meta.lockNote,
        state: meta.state || ''
      });
    }

    const options = this.getCareerOptions(spotId);
    if (options.length) {
      list.push({
        id: 'apply', icon: 'briefcase', name: t('a.apply'), desc: t('a.apply.desc'),
        locked: false, time: '', state: this.state.career ? t('c.workHere') : ''
      });
    }
    return list;
  }

  actionName(def) {
    if (def.id === 'adoptDog') return `${t('a.adopt')} · ${PETS.dog.name}`;
    if (def.id === 'adoptCat') return `${t('a.adopt')} · ${PETS.cat.name}`;
    if (def.id === 'playPet') return t('a.playPet', { pet: this.petName() || PETS.dog.name });
    if (def.id === 'wedding') return t('r.wedding');
    return t('a.' + def.id);
  }

  actionDesc(def) {
    if (def.id === 'adoptDog' || def.id === 'adoptCat') return t('a.adopt.desc');
    if (def.id === 'wedding') return t('r.weddingToast');
    return t('a.' + def.id + '.desc');
  }

  actionLock(spotId, def) {
    if (def.special === 'wardrobe') return { locked: false, lockNote: '' };
    if (def.requiresDlc && this.state.dlc[def.requiresDlc] === false) {
      return {
        locked: true,
        lockNote: t('action.needDlc', { dlc: t('dlc.' + def.requiresDlc + '.name') })
      };
    }
    if (def.cost && this.state.money < def.cost) {
      return { locked: true, lockNote: t('action.notEnough') };
    }
    if (def.requiresCareer && this.state.career?.id !== def.requiresCareer) {
      return { locked: true, lockNote: t('action.needCareer') };
    }
    if (def.special === 'adopt') {
      if (this.state.pet) return { locked: true, lockNote: t('toast.petAdoptedAlready') };
    }
    if (def.special === 'playPet') {
      if (!this.state.pet) return { locked: true, lockNote: t('toast.petNeeded') };
    }
    if (def.special === 'date') {
      const target = this.dateCandidate();
      if (!target) return { locked: true, lockNote: t('r.dateNeed') };
    }
    if (def.special === 'propose') {
      if (this.state.engagedTo) return { locked: true, lockNote: t('toast.engagedAlready') };
      if (this.state.marriedTo) return { locked: true, lockNote: t('toast.marriedAlready') };
      const target = this.proposeCandidate();
      if (!target) return { locked: true, lockNote: t('r.proposeNeed') };
    }
    if (def.special === 'wedding') {
      if (!this.state.engagedTo) return { locked: true, lockNote: t('r.proposeNeed') };
      if (this.state.money < (def.cost || 0)) return { locked: true, lockNote: t('action.notEnough') };
    }
    return { locked: false, lockNote: '' };
  }

  performAction(spotId, actionId) {
    if (!this.active || !this.state) return;
    if (actionId === 'apply') { this.ui.openCareer(spotId); return; }
    if (actionId === 'changeOutfit') { this.ui.openWardrobe(); return; }
    if (actionId === 'work') { this.workShift(spotId); return; }
    const def = this.actionDef(spotId, actionId);
    if (!def) return;
    const lock = this.actionLock(spotId, def);
    if (lock.locked) {
      this.ui.toast(lock.lockNote || t('action.wrongPlace'), 'warn');
      this.sfx('error');
      return;
    }
    if (def.special === 'sleep') { this.sleep(); return; }
    if (def.special === 'date') { this.autoDate(); return; }
    if (def.special === 'propose') { this.autoPropose(); return; }
    if (def.special === 'wedding') { this.autoWedding(); return; }
    if (def.cost && this.state.money < def.cost) {
      this.ui.toast(t('action.notEnough'), 'warn');
      this.sfx('error');
      return;
    }

    this.ui.showProgress({
      kicker: t('action.started'),
      title: this.actionName(def),
      desc: this.actionDesc(def),
      duration: def.hours >= 3 ? 1850 : def.hours >= 2 ? 1650 : 1350,
      onDone: () => {
        if (def.cost) this.state.money -= def.cost;
        this.advanceTime(def.hours || 0, true);
        this.applyAction(def, spotId);
        if (def.pay) {
          this.state.money += def.pay;
          this.ui.toast(def.toast ? t(def.toast, { pay: def.pay }) : t('action.moneyGain', { n: def.pay }), 'success');
        } else if (def.toast) {
          this.ui.toast(t(def.toast, { pet: this.petName() }), 'success');
        } else {
          this.ui.toast(t('toast.actionDone', { action: this.actionName(def) }), 'success');
        }
        this.sfx('success');
        this.afterChange();
        this.save(false);
      }
    });
  }

  applyAction(def, spotId) {
    const n = this.state.needs;
    if (def.setNeeds) {
      for (const [key, value] of Object.entries(def.setNeeds)) n[key] = clamp(value, 0, 100);
    }
    if (def.needs) {
      for (const [key, value] of Object.entries(def.needs)) n[key] = clamp(n[key] + value, 0, 100);
    }
    if (def.leisure || LEISURE.has(def.id)) this.state.stats.leisure++;
    if (def.photo) this.state.stats.photos++;
    if (def.talk) {
      const met = this.meetRandomNpc();
      if (met) this.state.relationships[met].friendship = clamp((this.state.relationships[met].friendship || 0) + 3, 0, 100);
    }
    if (def.buyOutfit) this.buyRandomOutfit();
    if (def.special === 'adopt') this.adoptPet(def.petType);
    if (def.special === 'playPet' && this.state.pet) {
      this.ui.toast(t('toast.petPlay', { pet: this.petName() }), 'success');
    }
    if (def.groceries) this.state.groceries = true;
  }

  // ---------------------------------------------------------------- work
  workShift(spotId) {
    const check = this.canWork();
    if (!check.ok) {
      this.ui.toast(check.reason || t('toast.offDuty'), 'warn');
      this.sfx('error');
      return;
    }
    const career = this.state.career;
    const previousLevel = career.level;
    const pay = this.careerPay();
    this.ui.showProgress({
      kicker: t('action.working'),
      title: t('c.' + career.id),
      desc: t('hud.shiftHours'),
      duration: 1900,
      onDone: () => {
        this.state.money += pay;
        career.shifts = (career.shifts || 0) + 1;
        career.level = Math.min(3, 1 + Math.floor(career.shifts / 3));
        this.state.lastWorkDay = this.state.day;
        this.advanceTime(3, true);
        this.state.needs.energy = clamp(this.state.needs.energy - 16, 0, 100);
        this.state.needs.hunger = clamp(this.state.needs.hunger - 12, 0, 100);
        this.state.needs.hygiene = clamp(this.state.needs.hygiene - 8, 0, 100);
        this.state.needs.social = clamp(this.state.needs.social + 8, 0, 100);
        this.ui.toast(t('toast.shift', { pay }), 'success');
        if (career.level > previousLevel) {
          this.ui.toast(t('toast.promotion', { title: t('c.level' + career.level) }), 'success');
          this.ui.banner(t('c.careerTitle'), t('c.level' + career.level), t('c.promotion', { title: t('c.level' + career.level) }), 3600);
        }
        this.sfx('success');
        this.afterChange();
        this.save(false);
      }
    });
  }

  applyCareer(id) {
    const def = CAREERS[id];
    if (!def) return;
    if (def.dlc && this.state.dlc[def.dlc] === false) {
      this.ui.toast(t('toast.needDlc', { dlc: t('dlc.' + def.dlc + '.name') }), 'warn');
      return;
    }
    if (this.state.career?.id === id) return;
    this.state.career = { id, shifts: 0, level: 1 };
    this.state.lastWorkDay = -1;
    this.ui.toast(t('toast.hired', { job: t('c.' + id) }), 'success');
    this.afterChange();
    this.save(false);
    this.sfx('success');
  }

  quitCareer() {
    if (!this.state.career) return;
    this.state.career = null;
    this.ui.toast(t('toast.quit'), 'info');
    this.afterChange();
    this.save(false);
  }

  // ---------------------------------------------------------------- pets / outfit
  petName() {
    return this.state.pet ? PETS[this.state.pet]?.name || '' : '';
  }

  adoptPet(type) {
    if (this.state.dlc.pets === false) {
      this.ui.toast(t('toast.needDlc', { dlc: t('dlc.pets.name') }), 'warn');
      return;
    }
    if (this.state.pet) {
      this.ui.toast(t('toast.petAdoptedAlready'), 'warn');
      return;
    }
    if (!PETS[type]) return;
    this.state.pet = type;
    this.world.setPet(type);
    this.ui.toast(t('toast.adopted', { pet: PETS[type].name }), 'success');
    this.ui.banner(t('dlc.pets.name'), PETS[type].name, t('a.adopt.desc'), 3200);
    this.afterChange();
    this.save(false);
  }

  setOutfit(key) {
    if (!OUTFITS[key]) return;
    this.state.appearance.outfit = key;
    this.state.appearance.palette = OUTFITS[key].accent;
    if (!this.state.ownedOutfits.includes(key)) this.state.ownedOutfits.push(key);
    this.rebuildPlayer();
    this.afterChange();
    this.save(false);
  }

  buyRandomOutfit() {
    const current = this.state.appearance.outfit;
    let candidates = OUTFIT_KEYS.filter((k) => !this.state.ownedOutfits.includes(k) && k !== current);
    if (!candidates.length) candidates = OUTFIT_KEYS.filter((k) => k !== current);
    if (!candidates.length) return;
    const key = pick(candidates);
    this.setOutfit(key);
  }

  // ---------------------------------------------------------------- sleep
  sleep() {
    const oldDay = this.state.day;
    this.ui.showProgress({
      kicker: t('action.started'),
      title: t('a.sleep'),
      desc: t('a.sleep.desc'),
      duration: 2000,
      onDone: () => {
        if (this.state.hour >= 7) this.state.day++;
        this.state.hour = 7;
        this.state.needs.energy = 100;
        this.state.needs.hunger = Math.max(0, this.state.needs.hunger - 18);
        this.state.needs.hygiene = Math.max(0, this.state.needs.hygiene - 10);
        this.state.needs.social = Math.max(0, this.state.needs.social - 8);
        this.state.needs.fun = Math.max(0, this.state.needs.fun - 6);
        this.state.needWarnings = {};
        if (this.state.day !== oldDay) this.onNewDay();
        this.ui.banner(t('banner.day', { day: this.state.day }), t('banner.morning', { name: this.state.name }), t('banner.newDayDesc'), 3800);
        this.ui.toast(t('toast.newDay', { day: this.state.day }), 'success');
        this.sfx('success');
        this.afterChange();
        this.save(false);
      }
    });
  }

  // ---------------------------------------------------------------- relationships
  getRelationship(id) {
    if (!this.state.relationships[id]) {
      this.state.relationships[id] = { friendship: 0, romance: 0, met: false };
    }
    return this.state.relationships[id];
  }

  relStatus(id) {
    if (this.state.marriedTo === id) return t('r.spouse');
    if (this.state.engagedTo === id) return t('r.romance');
    const rel = this.getRelationship(id);
    if (rel.friendship >= 70) return t('r.bestFriend');
    if (rel.met) return t('r.met');
    return t('r.single');
  }

  canRelate(id, kind) {
    const rel = this.getRelationship(id);
    const amore = this.state.dlc.amore !== false;
    if (kind === 'chat' || kind === 'compliment') return { ok: true, reason: '' };
    if (kind === 'gift') {
      if (this.state.money < 15) return { ok: false, reason: t('toast.giftNoMoney') };
      return { ok: true, reason: '' };
    }
    if (kind === 'date') {
      if (!amore) return { ok: false, reason: t('r.romanceLocked') };
      if (this.state.money < 20) return { ok: false, reason: t('action.notEnough') };
      if (rel.friendship < 30) return { ok: false, reason: t('r.dateNeed') };
      if (this.state.marriedTo && this.state.marriedTo !== id) return { ok: false, reason: t('r.alreadyMarried', { name: this.nameOf(this.state.marriedTo) }) };
      return { ok: true, reason: '' };
    }
    if (kind === 'propose') {
      if (!amore) return { ok: false, reason: t('r.romanceLocked') };
      if (this.state.marriedTo) return { ok: false, reason: t('toast.marriedAlready') };
      if (this.state.engagedTo) return { ok: false, reason: t('toast.engagedAlready') };
      if (rel.romance < 70) return { ok: false, reason: t('r.proposeNeed') };
      return { ok: true, reason: '' };
    }
    if (kind === 'wedding') {
      if (this.state.engagedTo !== id) return { ok: false, reason: t('r.propose') };
      return { ok: true, reason: '' };
    }
    return { ok: false, reason: '' };
  }

  nameOf(id) {
    return NPCS.find((n) => n.id === id)?.name || '';
  }

  doRel(kind, id) {
    if (!this.state || !this.getRelationship(id)) return;
    const can = this.canRelate(id, kind);
    if (!can.ok) {
      this.ui.toast(can.reason || t('action.wrongPlace'), 'warn');
      this.sfx('error');
      return;
    }
    const rel = this.getRelationship(id);
    const npcName = this.nameOf(id);
    const charmer = (this.state.traits || []).includes('charmer');
    const gain = (v) => Math.round(v * (charmer ? 1.5 : 1));

    if (kind === 'chat') {
      rel.met = true;
      rel.friendship = clamp(rel.friendship + gain(8), 0, 100);
      this.runRelAction(t('r.chat'), 0.5, {
        needs: { social: 20, fun: 4 },
        toast: t('r.talked', { name: npcName })
      });
      return;
    }
    if (kind === 'compliment') {
      rel.met = true;
      rel.friendship = clamp(rel.friendship + gain(4), 0, 100);
      rel.romance = clamp(rel.romance + gain(3), 0, 100);
      this.runRelAction(t('r.compliment'), 0.35, {
        needs: { social: 10, fun: 3 },
        toast: t('r.relationshipUp', { name: npcName, n: gain(4) })
      });
      return;
    }
    if (kind === 'gift') {
      this.state.money -= 15;
      rel.friendship = clamp(rel.friendship + gain(7), 0, 100);
      rel.romance = clamp(rel.romance + gain(6), 0, 100);
      this.runRelAction(t('r.gift'), 0.3, {
        needs: { social: 8, fun: 3 },
        toast: t('r.giftToast', { name: npcName })
      });
      return;
    }
    if (kind === 'date') {
      const good = Math.random() > 0.16;
      this.state.money -= 20;
      this.state.stats.dates++;
      this.state.partner = id;
      rel.friendship = clamp(rel.friendship + gain(good ? 8 : 3), 0, 100);
      rel.romance = clamp(rel.romance + gain(good ? 18 : 10), 0, 100);
      this.runRelAction(t('r.date'), 2, {
        needs: { fun: good ? 26 : 10, social: 25, hunger: 10 },
        toast: good ? t('r.dateGood', { name: npcName }) : t('r.dateBad', { name: npcName }),
        onDone: () => {
          if (good) this.ui.banner(t('r.date'), t('r.romance'), npcName, 3200);
        }
      });
      return;
    }
    if (kind === 'propose') {
      rel.romance = clamp(rel.romance + gain(10), 0, 100);
      this.state.engagedTo = id;
      this.state.partner = id;
      this.runRelAction(t('r.propose'), 1, {
        needs: { fun: 30, social: 20 },
        toast: t('r.engaged', { name: npcName }),
        onDone: () => this.ui.banner(t('r.engaged', { name: npcName }), t('r.wedding'), tr('dialog.engaged')[0], 3600)
      });
      return;
    }
    if (kind === 'wedding') {
      this.state.money = Math.max(0, this.state.money - 120);
      rel.romance = 100;
      this.state.marriedTo = id;
      this.state.engagedTo = null;
      this.state.partner = id;
      this.runRelAction(t('r.wedding'), 2, {
        needs: { fun: 40, social: 30 },
        toast: t('r.weddingToast'),
        onDone: () => this.ui.banner(t('r.wedding'), npcName, tr('dialog.wedding')[0], 4200)
      });
    }
  }

  runRelAction(title, hours, { needs = {}, toast = '', onDone = null } = {}) {
    this.ui.showProgress({
      kicker: t('action.started'),
      title,
      desc: t('r.subtitle'),
      duration: 1450,
      onDone: () => {
        this.advanceTime(hours, true);
        for (const [key, value] of Object.entries(needs)) {
          this.state.needs[key] = clamp(this.state.needs[key] + value, 0, 100);
        }
        if (toast) this.ui.toast(toast, 'success');
        this.sfx('success');
        onDone?.();
        this.afterChange();
        this.save(false);
      }
    });
  }

  meetRandomNpc() {
    let pool = NPCS.filter((n) => !this.state.relationships[n.id]?.met);
    if (!pool.length) pool = NPCS;
    const npc = pick(pool);
    const rel = this.getRelationship(npc.id);
    rel.met = true;
    rel.friendship = clamp(rel.friendship + 4, 0, 100);
    return npc.id;
  }

  dateCandidate() {
    const pool = NPCS.filter((n) => {
      const r = this.getRelationship(n.id);
      return r.met && r.friendship >= 30 && (!this.state.marriedTo || this.state.marriedTo === n.id);
    });
    pool.sort((a, b) => this.getRelationship(b.id).romance - this.getRelationship(a.id).romance);
    return pool[0]?.id || null;
  }

  proposeCandidate() {
    const pool = NPCS.filter((n) => this.getRelationship(n.id).romance >= 70);
    pool.sort((a, b) => this.getRelationship(b.id).romance - this.getRelationship(a.id).romance);
    return pool[0]?.id || null;
  }

  autoDate() {
    if (this.state.dlc.amore === false) {
      this.ui.toast(t('r.romanceLocked'), 'warn');
      return;
    }
    const id = this.dateCandidate();
    if (!id) {
      this.ui.toast(t('r.dateNeed'), 'warn');
      return;
    }
    this.doRel('date', id);
  }

  autoPropose() {
    if (this.state.dlc.amore === false) {
      this.ui.toast(t('r.romanceLocked'), 'warn');
      return;
    }
    if (this.state.engagedTo) { this.ui.toast(t('toast.engagedAlready'), 'warn'); return; }
    if (this.state.marriedTo) { this.ui.toast(t('toast.marriedAlready'), 'warn'); return; }
    const id = this.proposeCandidate();
    if (!id) {
      this.ui.toast(t('r.proposeNeed'), 'warn');
      return;
    }
    this.doRel('propose', id);
  }

  autoWedding() {
    if (!this.state.engagedTo) {
      this.ui.toast(t('r.proposeNeed'), 'warn');
      return;
    }
    if (this.state.money < 120) {
      this.ui.toast(t('toast.noMoney'), 'warn');
      return;
    }
    this.doRel('wedding', this.state.engagedTo);
  }

  // ---------------------------------------------------------------- quests / DLC
  questDefinitions() {
    const s = this.state;
    const maxFriend = Math.max(0, ...NPCS.map((n) => this.getRelationship(n.id).friendship));
    return [
      { id: 'job', name: t('q.job'), desc: t('q.job.desc'), reward: 60, done: !!s.career, current: s.career ? 1 : 0, total: 1, progressText: s.career ? '1/1' : '0/1' },
      { id: 'money', name: t('q.money'), desc: t('q.money.desc'), reward: 50, done: s.money >= 150, current: Math.min(150, s.money), total: 150, progressText: `€${Math.round(Math.min(150, s.money))}/€150` },
      { id: 'friend', name: t('q.friend'), desc: t('q.friend.desc'), reward: 40, done: maxFriend >= 40, current: Math.min(40, maxFriend), total: 40, progressText: `${Math.round(Math.min(40, maxFriend))}/40` },
      { id: 'leisure', name: t('q.leisure'), desc: t('q.leisure.desc'), reward: 35, done: s.stats.leisure >= 3, current: Math.min(3, s.stats.leisure), total: 3, progressText: `${Math.min(3, s.stats.leisure)}/3` },
      { id: 'date', name: t('q.date'), desc: t('q.date.desc'), reward: 55, done: s.stats.dates >= 1, current: Math.min(1, s.stats.dates), total: 1, progressText: `${Math.min(1, s.stats.dates)}/1` },
      { id: 'pet', name: t('q.pet'), desc: t('q.pet.desc'), reward: 25, done: !!s.pet, current: s.pet ? 1 : 0, total: 1, progressText: s.pet ? '1/1' : '0/1', locked: s.dlc.pets === false }
    ];
  }

  getQuests() {
    return this.questDefinitions().map((q) => ({ ...q, done: q.done || !!this.state.questsDone[q.id] }));
  }

  getQuestSummary() {
    const quests = this.getQuests();
    return { done: quests.filter((q) => q.done).length, total: quests.length };
  }

  checkQuests() {
    if (!this.state) return;
    let changed = false;
    for (const quest of this.questDefinitions()) {
      if (quest.locked || this.state.questsDone[quest.id] || !quest.done) continue;
      this.state.questsDone[quest.id] = true;
      this.state.money += quest.reward;
      this.ui.toast(t('toast.quest', { quest: quest.name }), 'success');
      window.setTimeout(() => {
        if (this.active) this.ui.toast(t('toast.questReward', { money: quest.reward }), 'success');
      }, 450);
      changed = true;
    }
    const all = this.getQuests().every((q) => q.done || q.locked);
    if (all && !this.state.allQuests) {
      this.state.allQuests = true;
      this.ui.banner(t('q.title'), t('q.allDone'), t('q.subtitle'), 4400);
      changed = true;
    }
    // A reward can push money over the next quest threshold.
    if (changed) {
      for (const quest of this.questDefinitions()) {
        if (quest.locked || this.state.questsDone[quest.id] || !quest.done) continue;
        this.state.questsDone[quest.id] = true;
        this.state.money += quest.reward;
        this.ui.toast(t('toast.quest', { quest: quest.name }), 'success');
      }
    }
  }

  afterChange() {
    if (!this.state) return;
    this.checkQuests();
    this.ui.renderHUD();
    if (this.ui.modalOpen) this.ui.refreshModal();
    this.refreshPrompt();
  }

  toggleDLC(id) {
    const dlc = DLCS.find((d) => d.id === id);
    if (!dlc) return;
    const on = this.state.dlc[id] !== false;
    const next = !on;
    this.state.dlc[id] = next;
    this.world.setDLC(id, next);
    if (next && id === 'pets' && this.state.pet) this.world.setPet(this.state.pet);
    const name = t('dlc.' + id + '.name');
    if (next) {
      this.ui.toast(t('toast.dlcOn', { name }), 'success');
    } else {
      this.ui.toast(t('toast.dlcOff', { name }), 'warn');
      const careerDlc = this.state.career ? CAREERS[this.state.career.id]?.dlc : null;
      if (careerDlc === id) {
        this.state.career = null;
        this.ui.toast(t('dlc.careerLost'), 'warn');
      }
      if (id === 'pets') this.world.setPet(null);
    }
    this.sfx(next ? 'success' : 'error');
    this.afterChange();
    this.save(false);
  }

  syncWorldDLC() {
    for (const dlc of DLCS) this.world.setDLC(dlc.id, this.state.dlc[dlc.id] !== false);
  }

  // ---------------------------------------------------------------- settings / save
  setSpeed(speed) {
    if (!this.state) return;
    const value = [0, 1, 2, 4].includes(Number(speed)) ? Number(speed) : 1;
    if (value > 0) this.previousSpeed = value;
    this.state.speed = value;
    this.ui.setSpeed(value);
    this.ui.renderHUD();
  }

  togglePause() {
    this.setSpeed(this.state.speed === 0 ? (this.previousSpeed || 1) : 0);
  }

  setVolume(kind, value) {
    if (!this.state.settings) this.state.settings = {};
    this.state.settings[kind] = clamp(Number(value) || 0, 0, 100);
    this.hooks.volume?.(kind, this.state.settings[kind]);
    this.save(false);
  }

  setQuality(quality) {
    if (!['high', 'low'].includes(quality)) return;
    if (!this.state.settings) this.state.settings = {};
    this.state.settings.quality = quality;
    this.hooks.setQuality?.(quality);
    this.save(false);
  }

  save(manual = false) {
    if (!this.state) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
      this.ui.refreshMenuSave();
      if (manual) {
        this.ui.toast(t('toast.saved'), 'success');
        this.sfx('success');
      }
    } catch {
      if (manual) this.ui.toast(t('toast.saved'), 'warn');
    }
  }

  reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    this.stop();
    this.state = null;
  }

  // ---------------------------------------------------------------- map rendering
  currentAreaName() {
    if (!this.state) return DISTRICT_NAMES.base;
    let area = 'base';
    let best = 36;
    for (const spot of SPOTS) {
      if (spot.dlc && this.state.dlc[spot.dlc] === false) continue;
      const d = Math.hypot(this.state.player.x - spot.x, this.state.player.z - spot.z);
      if (d < best) { best = d; area = spot.area; }
    }
    return area === 'base' ? DISTRICT_NAMES.base : t('dlc.' + area + '.name');
  }

  drawMinimap(canvas) {
    this.drawWorldCanvas(canvas, { labels: false, npcs: false, mini: true });
  }

  drawMap(canvas) {
    this.drawWorldCanvas(canvas, { labels: true, npcs: true, mini: false });
  }

  drawWorldCanvas(canvas, { labels = false, npcs = true, mini = false } = {}) {
    if (!canvas || !this.state) return;
    const c = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const pad = mini ? 10 : 22;
    const minX = -96, maxX = 96, minZ = -92, maxZ = 106;
    const sx = (x) => pad + ((x - minX) / (maxX - minX)) * (W - pad * 2);
    const sz = (z) => pad + ((z - minZ) / (maxZ - minZ)) * (H - pad * 2);

    c.clearRect(0, 0, W, H);
    c.fillStyle = mini ? '#1b241c' : '#1f2a21';
    c.fillRect(0, 0, W, H);

    // sea and beach
    const seaTop = sz(94);
    c.fillStyle = '#1d4f59';
    c.fillRect(0, seaTop, W, H - seaTop);
    c.fillStyle = 'rgba(226,205,164,.58)';
    c.fillRect(0, sz(61), W, sz(94) - sz(61));
    c.strokeStyle = 'rgba(240,229,206,.22)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, sz(94));
    c.lineTo(W, sz(94));
    c.stroke();

    // district patches
    for (const dlc of DLCS) {
      if (this.state.dlc[dlc.id] === false) continue;
      c.beginPath();
      c.arc(sx(dlc.x), sz(dlc.z), mini ? 18 : 42, 0, Math.PI * 2);
      c.fillStyle = dlc.color + '18';
      c.fill();
      c.strokeStyle = dlc.color + '40';
      c.lineWidth = 1;
      c.stroke();
      if (labels) {
        c.font = '600 11px Manrope, sans-serif';
        c.fillStyle = 'rgba(246,239,225,.5)';
        c.textAlign = 'center';
        c.fillText(t('dlc.' + dlc.id + '.name'), sx(dlc.x), sz(dlc.z) - (mini ? 8 : 12));
      }
    }

    // canal
    if (this.state.dlc.venezia !== false) {
      c.fillStyle = 'rgba(44,107,116,.75)';
      c.fillRect(sx(-58), sz(-77), sx(38) - sx(-58), sz(-63) - sz(-77));
      c.fillStyle = 'rgba(201,184,153,.6)';
      c.fillRect(sx(-14), sz(-78), sx(-6) - sx(-14), sz(-62) - sz(-78));
    }

    // paths
    const hub = SPOTS.find((s) => s.id === 'piazza');
    c.strokeStyle = 'rgba(244,233,215,.1)';
    c.lineWidth = mini ? 1 : 2;
    for (const spot of SPOTS) {
      if (spot.dlc && this.state.dlc[spot.dlc] === false) continue;
      c.beginPath();
      c.moveTo(sx(hub.x), sz(hub.z));
      c.lineTo(sx(spot.x), sz(spot.z));
      c.stroke();
    }

    // spots
    for (const spot of SPOTS) {
      if (spot.dlc && this.state.dlc[spot.dlc] === false) continue;
      const x = sx(spot.x), z = sz(spot.z);
      c.beginPath();
      c.arc(x, z, mini ? 3.5 : 5, 0, Math.PI * 2);
      c.fillStyle = spot.color;
      c.fill();
      c.strokeStyle = 'rgba(12,17,14,.8)';
      c.lineWidth = 1.5;
      c.stroke();
      if (labels) {
        c.font = '600 10px Manrope, sans-serif';
        c.textAlign = 'center';
        const text = t('h.' + spot.id);
        const tw = c.measureText(text).width;
        c.fillStyle = 'rgba(12,17,14,.72)';
        c.fillRect(x - tw / 2 - 4, z + 8, tw + 8, 15);
        c.fillStyle = 'rgba(246,239,225,.78)';
        c.fillText(text, x, z + 19);
      }
    }

    // NPC dots
    if (npcs) {
      for (const npc of this.world.ctx.npcs || []) {
        c.beginPath();
        c.arc(sx(npc.pos.x), sz(npc.pos.z), 2.4, 0, Math.PI * 2);
        c.fillStyle = 'rgba(240,210,154,.7)';
        c.fill();
      }
    }

    // player arrow
    const px = sx(this.state.player.x);
    const pz = sz(this.state.player.z);
    c.save();
    c.translate(px, pz);
    c.rotate(Math.PI - this.state.player.yaw);
    c.beginPath();
    c.moveTo(0, mini ? -7 : -9);
    c.lineTo(mini ? 4.5 : 6, mini ? 5 : 7);
    c.lineTo(0, mini ? 2.5 : 3.5);
    c.lineTo(mini ? -4.5 : -6, mini ? 5 : 7);
    c.closePath();
    c.fillStyle = '#f0d29a';
    c.fill();
    c.strokeStyle = 'rgba(12,17,14,.8)';
    c.lineWidth = 1;
    c.stroke();
    c.restore();
    if (labels) {
      c.beginPath();
      c.arc(px, pz, 13, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(240,210,154,.35)';
      c.lineWidth = 1;
      c.stroke();
      c.font = '700 9px Manrope, sans-serif';
      c.fillStyle = '#f0d29a';
      c.textAlign = 'center';
      c.fillText(t('map.you'), px, pz + 27);
    }
    if (mini) {
      c.fillStyle = 'rgba(246,239,225,.4)';
      c.font = '700 9px Manrope, sans-serif';
      c.textAlign = 'center';
      c.fillText('N', W / 2, 13);
    }
  }

  // ---------------------------------------------------------------- sound hook
  sfx(kind) {
    this.hooks.sfx?.(kind);
  }
}
