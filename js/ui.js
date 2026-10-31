// VITA — interface layer. All screens, modals and HUD rendering live here.
import { t, tr, setLang, getLang, LANGS } from './i18n.js';
import {
  DLCS, CAREERS, TRAITS, OUTFITS, OUTFIT_KEYS, SKIN_TONES,
  HAIR_COLORS, HAIR_STYLES, NAMES, NPCS, PETS, SPOTS, DISTRICT_NAMES
} from './data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PALETTE = ['#c4573f', '#c8a86a', '#7b9a5a', '#4aa8b8', '#c76a8f', '#efe4cf', '#2f3b4a'];
const SAVE_KEY = 'vita.save.v1';

function price(n) {
  return '€' + Math.round(n).toLocaleString('it-IT');
}

function clockText(hour) {
  const h = Math.floor(((hour % 24) + 24) % 24);
  const m = Math.floor((hour % 1) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function durationText(hours) {
  if (!hours) return '';
  if (hours < 1) return `${Math.round(hours * 60)} ${t('common.min')}`;
  const h = Math.round(hours * 10) / 10;
  return `${h.toLocaleString('it-IT')} ${t('common.hours')}`;
}

export class UI {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.game = null;
    this.screen = 'boot';
    this.modalOpen = false;
    this.progressOpen = false;
    this._modalRender = null;
    this._modalClass = '';
    this._modalLocked = false;
    this._creator = null;
    this._ccTab = 'look';
    this._bannerTimer = 0;
    this._toastTimers = new Set();
    this._progressRaf = 0;
    this._lastHud = 0;
    this._bindGlobal();
    this._bindMenu();
    this._bindCreator();
    this._bindHud();
    this._bindModalLayer();
    this.setDraft(this._defaultDraft());
    this.renderStatic();
  }

  setGame(game) {
    this.game = game;
  }

  get busy() {
    return this.modalOpen || this.progressOpen;
  }

  // ---------------------------------------------------------------- globals
  _bindGlobal() {
    const langMenu = $('#lang-menu');
    const closeLangMenu = () => { if (langMenu) langMenu.hidden = true; };
    document.addEventListener('pointerdown', (event) => {
      if (langMenu && !langMenu.hidden && !langMenu.contains(event.target)) closeLangMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLangMenu();
    });
    window.addEventListener('blur', closeLangMenu);
  }

  // ---------------------------------------------------------------- screens
  showScreen(name) {
    this.screen = name;
    for (const screen of $$('.screen')) screen.hidden = screen.id !== name;
    if (name !== 'boot') {
      const boot = $('#boot');
      if (boot && !boot.hidden) boot.hidden = true;
    }
  }

  showMenu() {
    const boot = $('#boot');
    if (boot && !boot.hidden && !boot.classList.contains('out')) {
      boot.classList.add('out');
      window.setTimeout(() => { boot.hidden = true; }, 850);
    }
    $('#menu').hidden = false;
    $('#creator').hidden = true;
    $('#game').hidden = true;
    this.screen = 'menu';
    this.refreshMenuSave();
    this.renderStaticText();
  }

  finishBoot() {
    const boot = $('#boot');
    if (!boot) return;
    boot.classList.add('out');
    window.setTimeout(() => { boot.hidden = true; }, 850);
  }

  showCreator() {
    this.screen = 'creator';
    $('#boot').hidden = true;
    $('#menu').hidden = true;
    $('#game').hidden = true;
    $('#creator').hidden = false;
    this.renderCreator();
    window.setTimeout(() => { this.callbacks.onCreatorChange?.(this._creator, this.getAppearance()); }, 0);
  }

  showGame() {
    this.screen = 'game';
    $('#boot').hidden = true;
    $('#menu').hidden = true;
    $('#creator').hidden = true;
    $('#game').hidden = false;
    this.renderHUD();
    this.drawMinimap();
  }

  // ---------------------------------------------------------------- i18n / static
  renderStatic() {
    document.documentElement.lang = LANGS[getLang()]?.html || 'pt';
    document.title = t('meta.title');
    const meta = $('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('meta.sub'));

    for (const el of $$('[data-i18n]')) {
      const key = el.dataset.i18n;
      const value = t(key);
      if (typeof value === 'string') el.textContent = value;
    }
    for (const el of $$('[data-i18n-ph]')) el.setAttribute('placeholder', t(el.dataset.i18nPh));
    for (const el of $$('[data-tip]')) {
      if (!el.dataset.tipKey) el.dataset.tipKey = el.dataset.tip;
      const tip = t(el.dataset.tipKey);
      if (typeof tip === 'string') el.dataset.tip = tip;
      el.setAttribute('aria-label', typeof tip === 'string' ? tip : el.dataset.tipKey);
    }

    this.renderLangSwitch($('#menu-langs'));
    this.renderLangSwitch($('#creator-langs'));
    this.renderMenuDLC();
    this.refreshMenuSave();
    this.refreshLangMenu();

    if (this.screen === 'creator') this.renderCreator();
    if (this.screen === 'game') {
      this.renderHUD();
      this.refreshPromptText();
    }
    if (this.modalOpen) this.renderModal();
  }

  renderStaticText() {
    // A light pass used when returning to the menu; avoids rebuilding creator swatches.
    for (const el of $$('#menu [data-i18n]')) {
      const value = t(el.dataset.i18n);
      if (typeof value === 'string') el.textContent = value;
    }
    this.renderLangSwitch($('#menu-langs'));
    this.refreshMenuSave();
  }

  renderLangSwitch(el) {
    if (!el) return;
    el.innerHTML = Object.values(LANGS).map((lang) =>
      `<button type="button" data-lang="${lang.code}" class="${lang.code === getLang() ? 'active' : ''}" aria-pressed="${lang.code === getLang()}">${lang.short}</button>`
    ).join('');
  }

  refreshLangMenu() {
    const menu = $('#lang-menu');
    if (!menu) return;
    for (const btn of $$('button', menu)) btn.classList.toggle('active', btn.dataset.lang === getLang());
  }

  setLanguage(lang, { silent = false } = {}) {
    if (!LANGS[lang]) return;
    setLang(lang);
    try { localStorage.setItem('vita.lang', lang); } catch { /* private mode */ }
    this.renderStatic();
    this.game?.refreshPrompt?.();
    if (!silent) this.toast(t('toast.langChanged', { lang: LANGS[lang].label }));
  }

  // ---------------------------------------------------------------- menu
  _bindMenu() {
    $('#btn-new')?.addEventListener('click', () => this.callbacks.onNewGame?.());
    $('#btn-continue')?.addEventListener('click', () => this.callbacks.onContinue?.());

    for (const el of [$('#menu-langs'), $('#creator-langs')]) {
      el?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-lang]');
        if (btn) this.setLanguage(btn.dataset.lang);
      });
    }

    const langMenu = $('#lang-menu');
    langMenu?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-lang]');
      if (btn) {
        this.setLanguage(btn.dataset.lang);
        langMenu.hidden = true;
      }
    });
  }

  renderMenuDLC() {
    const list = $('#menu-dlc-list');
    if (!list) return;
    list.innerHTML = DLCS.map((dlc) => {
      const name = t(`dlc.${dlc.id}.name`);
      const tag = t(`dlc.${dlc.id}.tag`);
      return `<div class="dlc-mini">
        <div class="dlc-ico" style="background:${dlc.color}22;color:${dlc.color};border-color:${dlc.color}55">${icon(dlc.icon)}</div>
        <div class="dlc-txt"><b>${esc(name)}</b><span>${esc(tag)}</span></div>
        <span class="dlc-check">${icon('check')}</span>
      </div>`;
    }).join('');
  }

  refreshMenuSave() {
    let save = null;
    try { save = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { save = null; }
    const button = $('#btn-continue');
    const info = $('#save-info');
    if (!button) return;
    button.hidden = !save;
    if (save) {
      const label = t('menu.saveInfo', { day: save.day ?? 1, money: Math.round(save.money ?? 0) });
      if (info) info.textContent = label;
      button.title = t('menu.continueHint');
    }
  }

  // ---------------------------------------------------------------- creator
  _defaultDraft() {
    return {
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      skin: SKIN_TONES[1],
      hair: HAIR_COLORS[1],
      hairStyle: HAIR_STYLES[1],
      outfit: 'casual',
      palette: OUTFITS.casual.accent,
      traits: ['dreamer', 'social']
    };
  }

  setDraft(draft) {
    this._creator = { ...this._defaultDraft(), ...draft };
    if (!Array.isArray(this._creator.traits)) this._creator.traits = [];
    if (!OUTFITS[this._creator.outfit]) this._creator.outfit = 'casual';
  }

  getAppearance(draft = this._creator) {
    const outfit = OUTFITS[draft.outfit] || OUTFITS.casual;
    return {
      skin: draft.skin,
      hair: draft.hair,
      hairStyle: draft.hairStyle,
      top: outfit.top,
      bottom: outfit.bottom,
      shoes: outfit.shoes,
      accent: draft.palette || outfit.accent,
      dress: outfit.dress
    };
  }

  openCreator(draft = null) {
    this._ccTab = 'look';
    this.setDraft(draft || this._defaultDraft());
    this.showCreator();
  }

  _bindCreator() {
    $('#cc-name')?.addEventListener('input', (event) => {
      this._creator.name = event.target.value;
      this._nameChanged();
    });
    $('#cc-random')?.addEventListener('click', () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      this._creator.name = name;
      const input = $('#cc-name');
      if (input) input.value = name;
      this._nameChanged();
    });
    $('#cc-back')?.addEventListener('click', () => this.callbacks.onCreatorBack?.());
    $('#cc-cancel')?.addEventListener('click', () => this.callbacks.onCreatorBack?.());
    $('#cc-begin')?.addEventListener('click', () => this._beginCreator());

    for (const tab of $$('[data-cc-tab]')) {
      tab.addEventListener('click', () => {
        this._ccTab = tab.dataset.ccTab;
        this.renderCreator();
      });
    }

    const setSkin = (event) => {
      const btn = event.target.closest('[data-skin]');
      if (!btn) return;
      this._creator.skin = btn.dataset.skin;
      this._changed();
    };
    const setHair = (event) => {
      const btn = event.target.closest('[data-hair]');
      if (!btn) return;
      this._creator.hair = btn.dataset.hair;
      this._changed();
    };
    const setHairStyle = (event) => {
      const btn = event.target.closest('[data-hair-style]');
      if (!btn) return;
      this._creator.hairStyle = btn.dataset.hairStyle;
      this._changed();
    };
    const setOutfit = (event) => {
      const btn = event.target.closest('[data-outfit]');
      if (!btn) return;
      this._creator.outfit = btn.dataset.outfit;
      this._creator.palette = OUTFITS[this._creator.outfit].accent;
      this._changed();
    };
    const setPalette = (event) => {
      const btn = event.target.closest('[data-palette]');
      if (!btn) return;
      this._creator.palette = btn.dataset.palette;
      this._changed();
    };
    const toggleTrait = (event) => {
      const btn = event.target.closest('[data-trait]');
      if (!btn) return;
      const id = btn.dataset.trait;
      const at = this._creator.traits.indexOf(id);
      if (at >= 0) this._creator.traits.splice(at, 1);
      else if (this._creator.traits.length >= 2) {
        this.toast(t('cc.traitsLimit'), 'warn');
        return;
      } else this._creator.traits.push(id);
      this._changed();
    };

    $('#cc-skin')?.addEventListener('click', setSkin);
    $('#cc-hair-color')?.addEventListener('click', setHair);
    $('#cc-hair-style')?.addEventListener('click', setHairStyle);
    $('#cc-outfit')?.addEventListener('click', setOutfit);
    $('#cc-palette')?.addEventListener('click', setPalette);
    $('#cc-traits')?.addEventListener('click', toggleTrait);
  }

  _nameChanged() {
    const display = $('#cc-name-display');
    if (display) {
      const name = this._creator.name.trim() || t('common.none');
      display.innerHTML = `${esc(name.charAt(0))}<span>${esc(name.slice(1))}</span>`;
    }
    this.callbacks.onCreatorChange?.(this._creator, this.getAppearance());
  }

  _changed() {
    this.renderCreator();
    this.callbacks.onCreatorChange?.(this._creator, this.getAppearance());
  }

  renderCreator() {
    if (!this._creator) return;
    const draft = this._creator;
    const input = $('#cc-name');
    if (input && document.activeElement !== input) input.value = draft.name;
    const display = $('#cc-name-display');
    if (display) {
      const name = draft.name.trim() || t('common.none');
      display.innerHTML = `${esc(name.charAt(0))}<span>${esc(name.slice(1))}</span>`;
    }

    for (const tab of $$('[data-cc-tab]')) tab.classList.toggle('active', tab.dataset.ccTab === this._ccTab);
    for (const panel of $$('[data-cc-panel]')) panel.hidden = panel.dataset.ccPanel !== this._ccTab;

    const skin = $('#cc-skin');
    if (skin) {
      skin.innerHTML = SKIN_TONES.map((color) =>
        `<button type="button" class="swatch large ${draft.skin === color ? 'active' : ''}" style="background:${color}" data-skin="${color}" aria-label="${color}"></button>`
      ).join('');
    }
    const hair = $('#cc-hair-color');
    if (hair) {
      hair.innerHTML = HAIR_COLORS.map((color) =>
        `<button type="button" class="swatch ${draft.hair === color ? 'active' : ''}" style="background:${color}" data-hair="${color}" aria-label="${color}"></button>`
      ).join('');
    }
    const styles = $('#cc-hair-style');
    if (styles) {
      styles.innerHTML = HAIR_STYLES.map((style) =>
        `<button type="button" class="${draft.hairStyle === style ? 'active' : ''}" data-hair-style="${style}">${esc(t('hair.' + style))}</button>`
      ).join('');
    }
    const outfits = $('#cc-outfit');
    if (outfits) {
      outfits.innerHTML = OUTFIT_KEYS.map((key) => {
        const o = OUTFITS[key];
        return `<button type="button" class="outfit-card ${draft.outfit === key ? 'active' : ''}" data-outfit="${key}">
          <span class="outfit-swatch" style="background:linear-gradient(145deg,${o.top} 0 55%,${o.bottom} 55% 100%)"></span>
          <span>${esc(t('outfit.' + key))}</span>
        </button>`;
      }).join('');
    }
    const palette = $('#cc-palette');
    if (palette) {
      palette.innerHTML = PALETTE.map((color) =>
        `<button type="button" class="swatch ${draft.palette === color ? 'active' : ''}" style="background:${color}" data-palette="${color}" aria-label="${color}"></button>`
      ).join('');
    }
    const traits = $('#cc-traits');
    if (traits) {
      traits.innerHTML = Object.keys(TRAITS).map((key) => {
        const active = draft.traits.includes(key);
        return `<button type="button" class="trait-card ${active ? 'active' : ''}" data-trait="${key}" aria-pressed="${active}">
          <span class="trait-name">${esc(t('trait.' + key))}</span>
          <p>${esc(t('trait.' + key + '.desc'))}</p>
        </button>`;
      }).join('');
    }
    const count = $('#cc-trait-count');
    if (count) count.textContent = `${draft.traits.length}/2`;
  }

  _beginCreator() {
    if (!this._creator.name.trim()) {
      this.toast(t('cc.nameRequired'), 'warn');
      $('#cc-name')?.focus();
      return;
    }
    this._creator.name = this._creator.name.trim().slice(0, 20);
    this.callbacks.onCreatorBegin?.(this._creator, this.getAppearance());
  }

  // ---------------------------------------------------------------- game buttons
  _bindHud() {
    $('#btn-diary')?.addEventListener('click', () => this.openDiary());
    $('#btn-relations')?.addEventListener('click', () => this.openRelations());
    $('#btn-dlc')?.addEventListener('click', () => this.openDLC());
    $('#btn-map')?.addEventListener('click', () => this.openMap());
    $('#btn-map-expand')?.addEventListener('click', () => this.openMap());
    $('#btn-save')?.addEventListener('click', () => this.game?.save(true));
    $('#btn-settings')?.addEventListener('click', () => this.openSettings());
    $('#btn-help')?.addEventListener('click', () => this.openHelp());
    $('#btn-career')?.addEventListener('click', () => this.openCareer(null));
    $('#btn-quests')?.addEventListener('click', () => this.openDiary());
    $('#prompt-go')?.addEventListener('click', () => this.game?.interact());
    $('#touch-interact')?.addEventListener('click', () => this.game?.interact());

    for (const btn of $$('[data-speed]')) {
      btn.addEventListener('click', () => {
        const speed = Number(btn.dataset.speed);
        this.game?.setSpeed(speed);
        if (speed === 0) this.game?.sfx?.('pause');
      });
    }
  }

  setSpeed(speed) {
    for (const btn of $$('[data-speed]')) btn.classList.toggle('active', Number(btn.dataset.speed) === speed);
  }

  // ---------------------------------------------------------------- HUD
  renderHUD() {
    const game = this.game;
    if (!game?.state) return;
    const s = game.state;

    const time = $('#hud-time');
    if (time) time.textContent = clockText(s.hour);
    const day = $('#hud-day');
    if (day) day.textContent = `${t('common.day')} ${s.day}`;
    const weather = $('#hud-weather');
    if (weather) weather.textContent = t('hud.weather.' + (s.weather || 'sunny'));
    const money = $('#hud-money');
    if (money) money.textContent = price(s.money);

    const career = s.career ? CAREERS[s.career.id] : null;
    const careerEl = $('#hud-career');
    if (careerEl) careerEl.textContent = career ? t('c.' + s.career.id) : t('hud.unemployed');
    const careerLevel = $('#hud-career-level');
    if (careerLevel) careerLevel.textContent = career ? t('hud.level', { n: s.career.level || 1 }) : '';

    for (const row of $$('.need-row')) {
      const key = row.dataset.need;
      const value = clamp(Number(s.needs?.[key] ?? 0), 0, 100);
      const bar = $('.need-bar i', row);
      if (bar) bar.style.width = value + '%';
      const num = $('.need-top b', row);
      if (num) num.textContent = String(Math.round(value));
      row.classList.toggle('low', value <= 25);
    }
    const mood = $('#hud-mood');
    if (mood) mood.textContent = t('mood.' + game.moodKey());

    const summary = $('#quest-summary');
    if (summary) {
      const q = game.getQuestSummary();
      summary.textContent = `${q.done}/${q.total}`;
    }

    const badge = $('#btn-dlc .badge');
    if (badge) badge.textContent = String(DLCS.filter((d) => s.dlc?.[d.id] !== false).length);

    const loc = $('#game-footer-loc');
    if (loc) loc.textContent = game.currentAreaName();

    this.setSpeed(s.speed ?? 1);
    this.drawMinimap();
  }

  // ---------------------------------------------------------------- prompt
  showPrompt(spot, npc) {
    const prompt = $('#prompt');
    if (!prompt) return;
    prompt.hidden = false;
    const name = $('#prompt-name');
    const action = $('#prompt-action');
    if (npc) {
      this._prompt = { type: 'npc', id: npc.id };
      if (name) name.textContent = npc.name;
      if (action) action.textContent = t('r.chat');
    } else if (spot) {
      this._prompt = { type: 'spot', id: spot.id };
      if (name) name.textContent = t('h.' + spot.id);
      if (action) action.textContent = t('action.panel');
    }
    const touch = $('#touch-interact');
    if (touch) touch.disabled = false;
  }

  hidePrompt() {
    this._prompt = null;
    const prompt = $('#prompt');
    if (prompt) prompt.hidden = true;
    const touch = $('#touch-interact');
    if (touch) touch.disabled = true;
  }

  refreshPromptText() {
    if (!this._prompt) return;
    if (this._prompt.type === 'npc') {
      const npc = NPCS.find((n) => n.id === this._prompt.id);
      if (npc) this.showPrompt(null, npc);
    } else {
      const spot = SPOTS.find((s) => s.id === this._prompt.id);
      if (spot) this.showPrompt(spot, null);
    }
  }

  // ---------------------------------------------------------------- modal shell
  _bindModalLayer() {
    $('#modal-backdrop')?.addEventListener('click', () => this.closeModal());
    $('#modal-content')?.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) this.closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (this.progressOpen) return;
      if (this.modalOpen) {
        event.preventDefault();
        this.closeModal();
      }
    });
  }

  openModal(render, { locked = false, wide = false } = {}) {
    this._modalRender = render;
    this._modalLocked = locked;
    this._modalClass = wide ? 'wide' : '';
    this.renderModal();
    const layer = $('#modal');
    if (layer) layer.hidden = false;
    this.modalOpen = true;
    this.hidePrompt();
    document.body.classList.add('modal-active');
    this.callbacks.onModalChange?.(true);
  }

  renderModal() {
    if (!this._modalRender) return;
    let def;
    try { def = this._modalRender(); } catch (err) { console.error(err); return; }
    if (!def) return;
    const content = $('#modal-content');
    if (!content) return;
    const card = $('#modal-card');
    if (card) card.classList.toggle('wide', !!def.wide || this._modalClass === 'wide');
    const kickerIcon = def.icon || 'sparkle';
    const head = `<div class="modal-head">
      <div class="modal-kicker">${icon(kickerIcon)}<span>${esc(def.kicker || t('menu.edition'))}</span></div>
      <h3 id="modal-title">${esc(def.title || '')}</h3>
      ${def.subtitle ? `<p>${esc(def.subtitle)}</p>` : ''}
      <button class="modal-close" type="button" data-close aria-label="${esc(t('common.close'))}">${icon('close')}</button>
    </div>`;
    const body = `<div class="modal-body">${def.body || ''}</div>`;
    const foot = def.foot === null ? '' : `<div class="modal-foot">${def.foot || `<button class="btn btn-ghost" type="button" data-close>${esc(t('common.close'))}</button>`}</div>`;
    content.innerHTML = head + body + foot;
    def.onMount?.(content);
  }

  closeModal(force = false) {
    if (this._modalLocked && !force) return;
    this.modalOpen = false;
    this._modalRender = null;
    this._modalLocked = false;
    const layer = $('#modal');
    if (layer) layer.hidden = true;
    const card = $('#modal-card');
    if (card) card.classList.remove('wide');
    document.body.classList.remove('modal-active');
    this.callbacks.onModalChange?.(false);
    this.game?.refreshPrompt?.();
  }

  refreshModal() {
    if (this.modalOpen) this.renderModal();
  }

  askConfirm(title, message, onYes, onNo = null) {
    this.openModal(() => ({
      kicker: t('common.confirm'),
      title,
      subtitle: message,
      icon: 'help',
      body: '',
      foot: `<button class="btn btn-ghost" type="button" data-no>${esc(t('common.cancel'))}</button>
             <button class="btn btn-primary" type="button" data-yes>${esc(t('common.confirm'))}</button>`,
      onMount: (root) => {
        $('[data-no]', root)?.addEventListener('click', () => {
          this.closeModal(true);
          onNo?.();
        });
        $('[data-yes]', root)?.addEventListener('click', () => {
          this.closeModal(true);
          onYes?.();
        });
      }
    }));
  }

  // ---------------------------------------------------------------- spot actions
  openSpot(spotId) {
    const spot = SPOTS.find((s) => s.id === spotId);
    if (!spot || !this.game) return;
    this.openModal(() => {
      const actions = this.game.getSpotActions(spotId);
      const rows = actions.map((action) => this._actionRow(action)).join('');
      return {
        kicker: t('action.panel'),
        title: t('h.' + spot.id),
        subtitle: t('h.' + spot.id + '.desc'),
        icon: spot.icon,
        body: `${this._spotBanner(spot)}<div class="action-list">${rows || `<div class="empty-state">${icon('sparkle')}<div>${esc(t('action.empty'))}</div></div>`}</div>`,
        foot: `<button class="btn btn-ghost" type="button" data-close>${esc(t('common.close'))}</button>`,
        onMount: (root) => {
          for (const btn of $$('[data-action]', root)) {
            btn.addEventListener('click', () => {
              const action = btn.dataset.action;
              if (btn.disabled) return;
              if (action === 'apply') {
                this.openCareer(spotId);
                return;
              }
              if (action === 'changeOutfit') {
                this.openWardrobe();
                return;
              }
              this.closeModal(true);
              this.game.performAction(spotId, action);
            });
          }
        }
      };
    });
  }

  _spotBanner(spot) {
    const dlc = spot.dlc ? DLCS.find((d) => d.id === spot.dlc) : null;
    const active = !spot.dlc || this.game?.state?.dlc?.[spot.dlc] !== false;
    const pill = dlc
      ? `<span class="pill ${active ? 'gold' : ''}">${esc(active ? t('dlc.active') : t('dlc.inactive'))}</span>`
      : `<span class="pill gold">${esc(t('common.included'))}</span>`;
    return `<div class="spot-banner">
      <div class="spot-ico" style="background:${spot.color}1f;color:${spot.color};border-color:${spot.color}55">${icon(spot.icon)}</div>
      <div><b>${esc(t('h.' + spot.id))}</b><span>${esc(t('h.' + spot.id + '.desc'))}</span></div>
      ${pill}
    </div>`;
  }

  _actionRow(action) {
    const disabled = !!action.locked;
    const meta = [];
    if (action.pay) meta.push(`<span class="cost">+${price(action.pay)}</span>`);
    else if (action.cost) meta.push(`<span class="cost negative">−${price(action.cost)}</span>`);
    if (action.time) meta.push(`<span class="time">${esc(action.time)}</span>`);
    const state = action.state ? `<span class="action-state">${esc(action.state)}</span>` : '';
    const lock = action.lockNote ? `<span class="lock-note">${esc(action.lockNote)}</span>` : '';
    return `<button class="action-row ${disabled ? 'disabled locked' : ''}" type="button" data-action="${esc(action.id)}" ${disabled ? 'disabled' : ''}>
      <span class="action-ico">${icon(action.icon || 'sparkle')}</span>
      <span class="action-txt"><b>${esc(action.name)}</b><span>${esc(action.desc || '')}</span>${lock}${state}</span>
      <span class="action-meta">${meta.join('')}</span>
    </button>`;
  }

  // ---------------------------------------------------------------- NPC / relationships
  openNpc(npcId) {
    const npc = NPCS.find((n) => n.id === npcId);
    if (!npc || !this.game) return;
    this.openModal(() => {
      const rel = this.game.getRelationship(npcId);
      const line = tr('dialog.hello')[Math.floor(Math.random() * tr('dialog.hello').length)];
      return {
        kicker: t('r.title'),
        title: npc.name,
        subtitle: this.game.relStatus(npcId),
        icon: 'heart',
        body: `${this._npcBanner(npc, rel)}<div class="modal-note">“${esc(line)}”</div>
          <div class="rel-actions" style="justify-content:flex-start;margin-top:14px">${this._relChips(npcId)}</div>`,
        foot: `<button class="btn btn-ghost" type="button" data-close>${esc(t('common.close'))}</button>`,
        onMount: (root) => this._bindRelChips(root)
      };
    });
  }

  _npcBanner(npc, rel) {
    return `<div class="spot-banner">
      <div class="rel-avatar" style="background:${npc.top}">${esc(npc.name.charAt(0))}</div>
      <div style="flex:1">
        <b>${esc(npc.name)}</b>
        <span>${esc(this.game.relStatus(npc.id))}</span>
        <div class="rel-bars" style="margin-top:5px">
          ${this._relBar(t('r.friendship'), rel.friendship, '')}
          ${this._relBar(t('r.romance'), rel.romance, 'romance')}
        </div>
      </div>
    </div>`;
  }

  _relBar(label, value, cls) {
    const v = clamp(Number(value) || 0, 0, 100);
    return `<div class="rel-bar ${cls}"><em>${esc(label)}</em><i><b style="width:${v}%"></b></i></div>`;
  }

  _relChips(npcId) {
    const kinds = [
      ['chat', 'users', 'r.chat'],
      ['compliment', 'sparkle', 'r.compliment'],
      ['gift', 'flower', 'r.gift'],
      ['date', 'heart', 'r.date'],
      ['propose', 'heart', 'r.propose']
    ];
    const rel = this.game.getRelationship(npcId);
    if (this.game.state.engagedTo === npcId) kinds.push(['wedding', 'church', 'r.wedding']);
    return kinds.map(([kind, ico, key]) => {
      const can = this.game.canRelate(npcId, kind);
      return `<button class="chip-btn" type="button" data-npc="${esc(npcId)}" data-rel="${kind}" ${can.ok ? '' : 'disabled'} title="${esc(can.reason || '')}">${icon(ico, 'chip-ico')} ${esc(t(key))}</button>`;
    }).join('') + (rel.romance > 0 ? '' : '');
  }

  _bindRelChips(root) {
    for (const btn of $$('[data-rel]', root)) {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const id = btn.dataset.npc;
        const kind = btn.dataset.rel;
        this.closeModal(true);
        this.game.doRel(kind, id);
      });
    }
  }

  openRelations() {
    if (!this.game) return;
    this.openModal(() => {
      const rows = NPCS.map((npc) => {
        const rel = this.game.getRelationship(npc.id);
        return `<div class="rel-row">
          <div class="rel-avatar" style="background:${npc.top}">${esc(npc.name.charAt(0))}</div>
          <div class="rel-info">
            <div class="rel-top"><b>${esc(npc.name)}</b><span>${esc(this.game.relStatus(npc.id))}</span></div>
            <div class="rel-bars">
              ${this._relBar(t('r.friendship'), rel.friendship, '')}
              ${this._relBar(t('r.romance'), rel.romance, 'romance')}
            </div>
            <div class="rel-actions">${this._relChips(npc.id)}</div>
          </div>
        </div>`;
      }).join('');
      const partner = this.game.state.marriedTo || this.game.state.engagedTo;
      return {
        kicker: t('hud.relations'),
        title: t('r.title'),
        subtitle: partner ? `${t('r.spouse')}: ${NPCS.find((n) => n.id === partner)?.name || ''}` : t('r.subtitle'),
        icon: 'heart',
        body: `<div>${rows}</div>`,
        foot: `<button class="btn btn-ghost" type="button" data-close>${esc(t('common.close'))}</button>`,
        onMount: (root) => this._bindRelChips(root)
      };
    });
  }

  // ---------------------------------------------------------------- careers
  openCareer(spotId = null) {
    if (!this.game) return;
    const currentSpot = this.game.getCurrentCareerSpot();
    const targetSpot = spotId || currentSpot;
    this.openModal(() => {
      const s = this.game.state;
      const options = this.game.getCareerOptions(targetSpot);
      let current = '';
      if (s.career) {
        const def = CAREERS[s.career.id];
        const pay = this.game.careerPay(s.career.id);
        current = `<div class="career-head">
          <div class="career-seal" style="color:${def.color}">${esc(t('c.' + s.career.id).charAt(0))}</div>
          <div><b>${esc(t('c.' + s.career.id))}</b><span>${esc(t('c.salaryLine', { pay, level: s.career.level }))}</span></div>
        </div>
        <div class="career-stats">
          <div class="career-stat"><span>${esc(t('hud.salary'))}</span><b class="gold">${price(pay)}</b></div>
          <div class="career-stat"><span>${esc(t('common.level'))}</span><b>${s.career.level}/3</b></div>
          <div class="career-stat"><span>${esc(t('common.progress'))}</span><b>${s.career.shifts || 0}</b></div>
          <div class="career-stat"><span>${esc(t('hud.quests'))}</span><b>${esc(t('hud.nextLevel', { n: Math.max(0, 3 - ((s.career.shifts || 0) % 3)) }))}</b></div>
        </div>`;
      }

      const rows = options.map((opt) => {
        const isCurrent = s.career?.id === opt.id;
        return `<div class="dlc-row">
          <div class="dlc-badge" style="background:${opt.color}1f;color:${opt.color};border-color:${opt.color}55">${icon('briefcase')}</div>
          <div class="dlc-info">
            <b>${esc(t('c.' + opt.id))} ${isCurrent ? `<span class="pill gold">${esc(t('common.applied'))}</span>` : ''}</b>
            <span>${esc(t('c.' + opt.id + '.desc'))}</span>
            <div class="dlc-features"><em>${price(opt.pay)} ${esc(t('common.perShift'))}</em><em>${esc(t('h.' + opt.spot))}</em></div>
          </div>
          <button class="chip-btn" type="button" data-career="${opt.id}" ${isCurrent || opt.remote ? 'disabled' : ''} title="${esc(opt.remote ? t('c.workHere') : '')}">${icon('check', 'chip-ico')} ${esc(isCurrent ? t('common.applied') : opt.remote ? t('c.workHere') : t('common.apply'))}</button>
        </div>`;
      }).join('');

      const note = !s.career ? `<div class="modal-note">${esc(t('c.noCareer'))}</div>` : '';
      const body = current + note + (rows
        ? `<div class="tabs-mini" style="margin-top:${current ? '8px' : '0'}"><button class="active">${esc(t('c.workHere'))}</button></div>${rows}`
        : (s.career ? '' : `<div class="empty-state">${icon('briefcase')}<div>${esc(t('c.noCareer'))}</div></div>`));
      const foot = `${s.career ? `<button class="danger-link" type="button" data-quit>${esc(t('common.quit'))}</button>` : ''}
        <button class="btn btn-ghost" type="button" data-close>${esc(t('common.close'))}</button>`;

      return {
        kicker: t('c.careerTitle'),
        title: targetSpot ? t('h.' + targetSpot) : t('c.careerTitle'),
        subtitle: t('c.hoursHint'),
        icon: 'briefcase',
        body,
        foot,
        onMount: (root) => {
          for (const btn of $$('[data-career]', root)) {
            btn.addEventListener('click', () => {
              if (btn.disabled) return;
              this.game.applyCareer(btn.dataset.career);
              this.refreshModal();
            });
          }
          $('[data-quit]', root)?.addEventListener('click', () => {
            this.game.quitCareer();
            this.refreshModal();
          });
        }
      };
    });
  }

  // ---------------------------------------------------------------- diary / quests
  openDiary() {
    if (!this.game) return;
    this.openModal(() => {
      const quests = this.game.getQuests();
      const done = quests.filter((q) => q.done).length;
      const rows = quests.map((q) => {
        const pct = q.total ? clamp((q.current / q.total) * 100, 0, 100) : (q.done ? 100 : 0);
        return `<div class="quest-row ${q.done ? 'done' : ''}">
          <div class="quest-check">${icon('check')}</div>
          <div class="quest-main">
            <b>${esc(q.name)}</b>
            <p>${esc(q.desc)}</p>
            <div class="quest-progress"><i><b style="width:${pct}%"></b></i><span>${esc(q.progressText)}</span></div>
            <div class="quest-reward">${icon('coin')} ${esc(t('common.reward'))}: ${price(q.reward)}</div>
          </div>
        </div>`;
      }).join('');
      const s = this.game.state;
      const friends = NPCS.filter((n) => (s.relationships?.[n.id]?.friendship || 0) >= 40).length;
      const dlcCount = DLCS.filter((d) => s.dlc?.[d.id] !== false).length;
      return {
        kicker: t('hud.quests'),
        title: t('q.title'),
        subtitle: t('q.subtitle'),
        icon: 'book',
        body: `<div class="career-stats">
            <div class="career-stat"><span>${esc(t('common.day'))}</span><b>${s.day}</b></div>
            <div class="career-stat"><span>${esc(t('hud.money'))}</span><b class="gold">${price(s.money)}</b></div>
            <div class="career-stat"><span>${esc(t('hud.friends'))}</span><b>${friends}</b></div>
            <div class="career-stat"><span>${esc(t('dlc.title'))}</span><b>${dlcCount}/7</b></div>
          </div>
          <div class="tabs-mini"><button class="active">${esc(t('q.title'))} ${done}/${quests.length}</button></div>
          ${rows}`,
        foot: `<button class="btn btn-ghost" type="button" data-close>${esc(t('common.close'))}</button>`
      };
    });
  }

  // ---------------------------------------------------------------- DLC
  openDLC() {
    if (!this.game) return;
    this.openModal(() => {
      const rows = DLCS.map((dlc) => {
        const on = this.game.state.dlc?.[dlc.id] !== false;
        const name = t('dlc.' + dlc.id + '.name');
        return `<div class="dlc-row">
          <div class="dlc-badge" style="background:${dlc.color}1f;color:${dlc.color};border-color:${dlc.color}55">${icon(dlc.icon)}</div>
          <div class="dlc-info">
            <b>${esc(name)} <span class="pill ${on ? 'gold' : ''}">${esc(on ? t('dlc.active') : t('dlc.inactive'))}</span></b>
            <span>${esc(t('dlc.' + dlc.id + '.desc'))}</span>
            <div class="dlc-features">
              <em>${esc(t('dlc.' + dlc.id + '.f1'))}</em>
              <em>${esc(t('dlc.' + dlc.id + '.f2'))}</em>
              <em>${esc(t('dlc.' + dlc.id + '.f3'))}</em>
            </div>
          </div>
          <button class="switch ${on ? 'on' : ''}" type="button" data-dlc="${dlc.id}" aria-pressed="${on}" aria-label="${esc(name)}"></button>
        </div>`;
      }).join('');
      return {
        kicker: t('dlc.manage'),
        title: t('dlc.title'),
        subtitle: `${t('dlc.subtitle')} · ${t('dlc.allIncluded')}`,
        icon: 'suitcase',
        body: `${rows}<div class="modal-note">${esc(t('dlc.warning'))}</div>`,
        foot: `<button class="btn btn-ghost" type="button" data-close>${esc(t('common.close'))}</button>`,
        onMount: (root) => {
          for (const btn of $$('[data-dlc]', root)) {
            btn.addEventListener('click', () => {
              this.game.toggleDLC(btn.dataset.dlc);
              this.refreshModal();
            });
          }
        }
      };
    });
  }

  // ---------------------------------------------------------------- map
  openMap() {
    if (!this.game) return;
    this.openModal(() => {
      const enabled = SPOTS.filter((s) => !s.dlc || this.game.state.dlc?.[s.dlc] !== false);
      const legend = enabled.map((spot) =>
        `<span class="lg"><i style="background:${spot.color}"></i>${esc(t('h.' + spot.id))}</span>`
      ).join('');
      return {
        kicker: t('map.legend'),
        title: t('map.title'),
        subtitle: t('map.subtitle'),
        icon: 'map',
        wide: true,
        body: `<div class="map-canvas-wrap"><canvas id="map-canvas" width="720" height="500" aria-label="${esc(t('map.title'))}"></canvas></div>
          <div class="tabs-mini"><button class="active">${esc(t('map.legend'))}</button></div>
          <div class="map-legend">${legend}</div>
          <div class="map-hint">${esc(t('map.subtitle'))}</div>`,
        foot: `<button class="btn btn-ghost" type="button" data-close>${esc(t('map.close'))}</button>`,
        onMount: () => {
          const canvas = $('#map-canvas');
          if (canvas) this.game.drawMap(canvas, true);
        }
      };
    }, { wide: true });
  }

  drawMinimap() {
    const canvas = $('#minimap');
    if (canvas && this.game) this.game.drawMinimap(canvas);
  }

  // ---------------------------------------------------------------- wardrobe
  openWardrobe() {
    if (!this.game) return;
    this.openModal(() => {
      const owned = this.game.state.ownedOutfits || [this.game.state.appearance?.outfit || 'casual'];
      const cards = owned.map((key) => {
        const o = OUTFITS[key];
        const active = this.game.state.appearance?.outfit === key;
        return `<button class="outfit-card ${active ? 'active' : ''}" type="button" data-wear="${key}">
          <span class="outfit-swatch" style="background:linear-gradient(145deg,${o.top} 0 55%,${o.bottom} 55% 100%)"></span>
          <span>${esc(t('outfit.' + key))}</span>
        </button>`;
      }).join('');
      return {
        kicker: t('a.changeOutfit'),
        title: t('a.changeOutfit'),
        subtitle: t('a.changeOutfit.desc'),
        icon: 'hanger',
        body: `<div class="outfit-grid">${cards}</div>`,
        foot: `<button class="btn btn-ghost" type="button" data-close>${esc(t('common.close'))}</button>`,
        onMount: (root) => {
          for (const btn of $$('[data-wear]', root)) {
            btn.addEventListener('click', () => {
              this.game.setOutfit(btn.dataset.wear);
              this.closeModal(true);
              this.toast(t('toast.actionDone', { action: t('a.changeOutfit') }), 'success');
            });
          }
        }
      };
    });
  }

  // ---------------------------------------------------------------- settings
  openSettings() {
    if (!this.game) return;
    this.openModal(() => {
      const s = this.game.state;
      const settings = s.settings || {};
      const langButtons = Object.values(LANGS).map((lang) =>
        `<button type="button" data-lang="${lang.code}" class="${lang.code === getLang() ? 'active' : ''}">${lang.short}</button>`
      ).join('');
      return {
        kicker: t('settings.title'),
        title: t('settings.title'),
        subtitle: t('settings.autosave'),
        icon: 'gear',
        body: `
          <div class="tabs-mini"><button class="active">${esc(t('settings.audio'))}</button></div>
          <div class="setting-row">
            <div class="setting-label">${esc(t('settings.music'))}<span>0 — 100</span></div>
            <input type="range" min="0" max="100" value="${settings.music ?? 65}" data-volume="music">
          </div>
          <div class="setting-row">
            <div class="setting-label">${esc(t('settings.sfx'))}<span>0 — 100</span></div>
            <input type="range" min="0" max="100" value="${settings.sfx ?? 75}" data-volume="sfx">
          </div>
          <div class="tabs-mini" style="margin-top:16px"><button class="active">${esc(t('settings.quality'))}</button></div>
          <div class="setting-row">
            <div class="setting-label">${esc(t('settings.quality'))}<span>${esc(t('settings.qualityNote'))}</span></div>
            <div class="segment-sm">
              <button type="button" data-quality="high" class="${(settings.quality || 'high') === 'high' ? 'active' : ''}">${esc(t('settings.qualityHigh'))}</button>
              <button type="button" data-quality="low" class="${settings.quality === 'low' ? 'active' : ''}">${esc(t('settings.qualityLow'))}</button>
            </div>
          </div>
          <div class="tabs-mini" style="margin-top:16px"><button class="active">${esc(t('settings.language'))}</button></div>
          <div class="setting-row">
            <div class="setting-label">${esc(t('common.language'))}<span>Italiano · Português · English</span></div>
            <div class="segment-sm">${langButtons}</div>
          </div>
          <div class="tabs-mini" style="margin-top:16px"><button class="active">${esc(t('common.version'))}</button></div>
          <div class="setting-row">
            <div class="setting-label">${esc(t('settings.fullscreen'))}</div>
            <button class="btn-mini" type="button" data-fullscreen>${icon('camera')} ${esc(t('settings.fullscreen'))}</button>
          </div>
          <div class="setting-row">
            <div class="setting-label">${esc(t('hud.help'))}</div>
            <button class="btn-mini" type="button" data-help>${icon('help')} ${esc(t('hud.help'))}</button>
          </div>
          <div class="modal-note">${esc(t('settings.about'))}</div>
          <div class="setting-actions">
            <button class="danger-link" type="button" data-reset>${esc(t('settings.reset'))}</button>
          </div>`,
        foot: `<button class="btn btn-ghost" type="button" data-close>${esc(t('settings.close'))}</button>`,
        onMount: (root) => {
          for (const btn of $$('[data-lang]', root)) {
            btn.addEventListener('click', () => this.setLanguage(btn.dataset.lang));
          }
          for (const input of $$('[data-volume]', root)) {
            input.addEventListener('input', () => this.game.setVolume(input.dataset.volume, Number(input.value)));
          }
          for (const btn of $$('[data-quality]', root)) {
            btn.addEventListener('click', () => {
              this.game.setQuality(btn.dataset.quality);
              this.refreshModal();
            });
          }
          $('[data-fullscreen]', root)?.addEventListener('click', () => this.callbacks.onFullscreen?.());
          $('[data-help]', root)?.addEventListener('click', () => this.openHelp());
          $('[data-reset]', root)?.addEventListener('click', () => {
            this.askConfirm(t('settings.reset'), t('settings.resetConfirm'), () => this.callbacks.onReset?.());
          });
        }
      };
    });
  }

  openHelp() {
    const steps = [
      ['walk', 'help.move', 'hint.move'],
      ['sparkle', 'help.interact', 'hint.interact'],
      ['camera', 'help.camera', 'hint.close'],
      ['droplet', 'help.needs', 'need.energy.low'],
      ['clock', 'help.speed', 'hud.speed'],
      ['book', 'help.quests', 'hint.quests'],
      ['suitcase', 'help.dlc', 'hint.dlc'],
      ['map', 'help.map', 'map.subtitle'],
      ['gear', 'help.lang', 'settings.language']
    ];
    this.openModal(() => ({
      kicker: t('help.title'),
      title: t('help.title'),
      subtitle: t('menu.controls'),
      icon: 'help',
      body: `<div>${steps.map(([ico, titleKey, descKey]) => `<div class="help-step">
        <div class="hs-ico">${icon(ico)}</div>
        <div><b>${esc(t(titleKey))}</b><p>${esc(t(descKey))}</p></div>
      </div>`).join('')}</div>`,
      foot: `<button class="btn btn-primary" type="button" data-close>${esc(t('help.close'))}</button>`
    }));
  }

  // ---------------------------------------------------------------- progress / toast / banner
  showProgress({ kicker = t('action.started'), title = '', desc = '', duration = 1500, onDone = null, skipLabel = null } = {}) {
    if (this.progressOpen) return;
    this.progressOpen = true;
    const layer = $('#progress');
    if (!layer) { onDone?.(); this.progressOpen = false; return; }
    layer.hidden = false;
    const eyebrow = $('#progress-eyebrow');
    const titleEl = $('#progress-title');
    const descEl = $('#progress-desc');
    const bar = $('#progress-bar');
    const ring = $('#progress-ring');
    const skip = $('#progress-skip');
    if (eyebrow) eyebrow.textContent = kicker;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (skip) skip.textContent = skipLabel || t('common.next');
    if (bar) bar.style.width = '0%';
    if (ring) ring.style.strokeDashoffset = '169.6';

    const start = performance.now();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (this._progressRaf) cancelAnimationFrame(this._progressRaf);
      this._progressRaf = 0;
      layer.hidden = true;
      this.progressOpen = false;
      if (bar) bar.style.width = '100%';
      onDone?.();
    };
    if (skip) skip.onclick = finish;

    const step = (now) => {
      if (finished) return;
      const k = clamp((now - start) / Math.max(120, duration), 0, 1);
      if (bar) bar.style.width = `${k * 100}%`;
      if (ring) ring.style.strokeDashoffset = String(169.6 * (1 - k));
      if (k >= 1) finish();
      else this._progressRaf = requestAnimationFrame(step);
    };
    this._progressRaf = requestAnimationFrame(step);
  }

  toast(message, type = 'info') {
    const stack = $('#toasts');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const ico = type === 'success' ? 'check' : type === 'warn' ? 'close' : 'sparkle';
    el.innerHTML = `<span class="toast-ico">${icon(ico)}</span><span>${esc(message)}</span>`;
    stack.appendChild(el);
    const timer = window.setTimeout(() => {
      el.classList.add('out');
      window.setTimeout(() => el.remove(), 380);
      this._toastTimers.delete(timer);
    }, 4200);
    this._toastTimers.add(timer);
  }

  banner(eyebrow, title, sub = '', duration = 4200) {
    const banner = $('#banner');
    if (!banner) return;
    const eb = $('#banner-eyebrow');
    const ti = $('#banner-title');
    const su = $('#banner-sub');
    if (eb) eb.textContent = eyebrow;
    if (ti) ti.textContent = title;
    if (su) su.textContent = sub;
    banner.hidden = false;
    window.clearTimeout(this._bannerTimer);
    this._bannerTimer = window.setTimeout(() => { banner.hidden = true; }, duration);
  }
}

export { SAVE_KEY };
