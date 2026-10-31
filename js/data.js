// Content data: expansions, careers, traits, people and world locations.
export const DLCS = [
  { id: 'mare', icon: 'wave', color: '#4aa8b8', x: 0, z: 72 },
  { id: 'toscana', icon: 'grape', color: '#8f9c4e', x: -62, z: 18 },
  { id: 'roma', icon: 'column', color: '#c79a62', x: 58, z: -24 },
  { id: 'venezia', icon: 'boat', color: '#6f9fb5', x: -10, z: -66 },
  { id: 'moda', icon: 'hanger', color: '#c76a8f', x: 26, z: 14 },
  { id: 'amore', icon: 'heart', color: '#c4576b', x: -30, z: -32 },
  { id: 'pets', icon: 'paw', color: '#b98a54', x: -24, z: 30 }
];

export const CAREERS = {
  barista:    { spot: 'cafe',      pay: 55,  dlc: null,      color: '#b5723b' },
  chef:       { spot: 'cafe',      pay: 85,  dlc: null,      color: '#c4583f' },
  trainer:    { spot: 'gym',       pay: 70,  dlc: null,      color: '#6f8f4e' },
  designer:   { spot: 'boutique',  pay: 120, dlc: 'moda',    color: '#c76a8f' },
  winemaker:  { spot: 'vineyard',  pay: 95,  dlc: 'toscana', color: '#8f9c4e' },
  archaeologist:{ spot: 'colosseum',pay: 110,dlc: 'roma',    color: '#c79a62' },
  gondolier:  { spot: 'canal',     pay: 90,  dlc: 'venezia', color: '#6f9fb5' },
  lifeguard:  { spot: 'beach',     pay: 75,  dlc: 'mare',    color: '#4aa8b8' }
};

export const TRAITS = {
  dreamer:   { decay: { fun: -0.35 }, effects: { creativeFun: 0.2 } },
  gourmet:   { decay: { hunger: 0.45 }, effects: { mealBonus: 0.35 } },
  social:    { decay: { social: -0.4 }, effects: { socialGain: 0.25 } },
  athlete:   { decay: { energy: -0.3 }, effects: { workoutFun: 0.2 } },
  artist:    { decay: {}, effects: { creativeFun: 0.4 } },
  charmer:   { decay: {}, effects: { relationGain: 0.5 } },
  workaholic:{ decay: {}, effects: { wage: 0.15 } },
  nightowl:  { decay: { energyNight: -0.5 }, effects: {} }
};

export const OUTFITS = {
  casual:  { top: '#f3e7d3', bottom: '#3f5b6b', shoes: '#2e2723', accent: '#c4573f', dress: false },
  elegant: { top: '#1f2b3d', bottom: '#1b1d22', shoes: '#241d19', accent: '#c8a86a', dress: false },
  sport:   { top: '#e7e2d8', bottom: '#39424a', shoes: '#d8d2c6', accent: '#7b9a5a', dress: false },
  boho:    { top: '#d9a86c', bottom: '#7d5b46', shoes: '#5a4431', accent: '#a95f5f', dress: true },
  couture: { top: '#9d3f5f', bottom: '#9d3f5f', shoes: '#2c2024', accent: '#d9b87a', dress: true }
};

export const SKIN_TONES = ['#f1c9a8', '#e8b690', '#d79b72', '#b97a52', '#8a5a3b', '#5f3b26'];
export const HAIR_COLORS = ['#2a1c17', '#4b2e1f', '#7a4a28', '#b37840', '#d9b25f', '#8c3d2e', '#6b6b6b', '#e8e1d5'];
export const HAIR_STYLES = ['short', 'long', 'curly'];
export const OUTFIT_KEYS = ['casual', 'elegant', 'sport', 'boho', 'couture'];
export const SKIN_LABELS = [0, 1, 2, 3, 4, 5];

export const NAMES = ['Giulia', 'Marco', 'Sofia', 'Luca', 'Chiara', 'Matteo', 'Elena', 'Davide', 'Alessia', 'Lorenzo', 'Beatrice', 'Andrea', 'Martina', 'Pietro'];

export const NPCS = [
  { id: 'giulia',  name: 'Giulia',  skin: '#e8b690', hair: '#4b2e1f', style: 'long',  top: '#c4576b', bottom: '#2f3b4a', home: [4, -4],    path: [[4, -4], [12, 6], [3, 14], [-8, 6]] },
  { id: 'marco',   name: 'Marco',   skin: '#d79b72', hair: '#2a1c17', style: 'short', top: '#3f6470', bottom: '#3a3430', home: [14, 10],   path: [[14, 10], [20, 2], [8, -2], [2, 8]] },
  { id: 'sofia',   name: 'Sofia',   skin: '#f1c9a8', hair: '#b37840', style: 'curly', top: '#d9a86c', bottom: '#6d4f3c', home: [-10, 12], path: [[-10, 12], [-16, 2], [-6, -6], [5, 3]] },
  { id: 'luca',    name: 'Luca',    skin: '#b97a52', hair: '#2a1c17', style: 'short', top: '#7d8d56', bottom: '#2f3b4a', home: [20, -8],   path: [[20, -8], [10, -12], [0, -6], [8, 2]] },
  { id: 'chiara',  name: 'Chiara',  skin: '#f1c9a8', hair: '#8c3d2e', style: 'long',  top: '#e7d7c4', bottom: '#9d3f5f', home: [-18, -12], path: [[-18, -12], [-8, -16], [2, -10], [-5, 4]] },
  { id: 'matteo',  name: 'Matteo',  skin: '#8a5a3b', hair: '#2a1c17', style: 'curly', top: '#b5723b', bottom: '#39424a', home: [12, 20],   path: [[12, 20], [20, 14], [10, 10], [0, 14]] }
];

export const PETS = {
  dog: { name: 'Cocco', type: 'dog', coat: '#c79a62' },
  cat: { name: 'Luna', type: 'cat', coat: '#6b6b6b' }
};

export const SPOTS = [
  { id: 'home',      x: -32, z: 18,  radius: 3.6, icon: 'home',    area: 'base',     color: '#c4573f' },
  { id: 'cafe',      x: 19,  z: 2,   radius: 3.6, icon: 'cup',     area: 'base',     color: '#b5723b' },
  { id: 'piazza',    x: 0,   z: 6,   radius: 4.0, icon: 'fountain',area: 'base',     color: '#6f9fb5' },
  { id: 'market',    x: -16, z: 6,   radius: 3.4, icon: 'basket',  area: 'base',     color: '#8f9c4e' },
  { id: 'gym',       x: 31,  z: -14, radius: 3.4, icon: 'dumbbell',area: 'base',     color: '#6f8f4e' },
  { id: 'duomo',     x: 0,   z: -26, radius: 4.0, icon: 'church',  area: 'base',     color: '#c79a62' },
  { id: 'promenade', x: 0,   z: 48,  radius: 3.6, icon: 'wave',    area: 'base',     color: '#4aa8b8' },
  { id: 'boutique',  x: 30,  z: 16,  radius: 3.4, icon: 'hanger',  area: 'moda',     color: '#c76a8f', dlc: 'moda' },
  { id: 'vineyard',  x: -62, z: 18,  radius: 4.0, icon: 'grape',   area: 'toscana',  color: '#8f9c4e', dlc: 'toscana' },
  { id: 'colosseum', x: 58,  z: -24, radius: 4.0, icon: 'column',  area: 'roma',     color: '#c79a62', dlc: 'roma' },
  { id: 'canal',     x: -10, z: -62, radius: 4.0, icon: 'boat',    area: 'venezia',  color: '#6f9fb5', dlc: 'venezia' },
  { id: 'beach',     x: 0,   z: 72,  radius: 4.2, icon: 'sun',     area: 'mare',     color: '#4aa8b8', dlc: 'mare' },
  { id: 'garden',    x: -30, z: -32, radius: 3.8, icon: 'heart',   area: 'amore',    color: '#c4576b', dlc: 'amore' },
  { id: 'shelter',   x: -24, z: 30,  radius: 3.6, icon: 'paw',     area: 'pets',     color: '#b98a54', dlc: 'pets' }
];

export const DISTRICT_NAMES = {
  base: 'Centro Storico',
  mare: 'Mare Italiano',
  toscana: 'Toscana',
  roma: 'Roma Antica',
  venezia: 'Venezia',
  moda: 'Milano Moda',
  amore: 'Amore & Nozze',
  pets: 'Cuccioli & Casa'
};
