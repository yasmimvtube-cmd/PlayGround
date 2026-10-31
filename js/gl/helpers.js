import * as THREE from 'three';

let seed = 20261031;
export const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
export const rr = (a, b) => a + rnd() * (b - a);
export const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const mat = (color, roughness = 0.85, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export const emissiveMat = (color, emissive, intensity = 1, roughness = 0.6) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness });

export function canvasTexture(w, h, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function plasterTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) {
      const a = Math.random() * 0.05;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(70,50,35,${a})` : `rgba(255,255,255,${a})`;
      const s = 1 + Math.random() * 4;
      ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = 'rgba(90,70,50,0.045)';
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, 0);
      ctx.lineTo(Math.random() * w, h);
      ctx.stroke();
    }
  }, 2, 2);
}

export function cobbleTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#8e806c';
    ctx.fillRect(0, 0, w, h);
    const rows = 12;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * 0.5;
      const cols = 10;
      for (let c = -1; c < cols + 1; c++) {
        const x = (c + offset) * (w / cols) + rr(-4, 4);
        const y = r * rh + rr(-2, 2);
        const sw = w / cols - rr(3, 8);
        const sh = rh - rr(3, 6);
        const v = rr(-16, 14);
        ctx.fillStyle = `rgb(${188 + v},${176 + v},${156 + v})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, sw, sh, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(70,60,45,${Math.random() * 0.08})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, 7, 7);
}

export function roofTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b65f38';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 18) {
      for (let x = -10; x < w; x += 24) {
        const ox = (y / 18) % 2 ? 12 : 0;
        ctx.fillStyle = `rgba(${150 + Math.random() * 50},${74 + Math.random() * 30},${44 + Math.random() * 20},1)`;
        ctx.beginPath();
        ctx.roundRect(x + ox, y, 22, 16, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(90,40,20,0.25)';
        ctx.stroke();
      }
    }
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(255,190,140,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2);
    }
  }, 3, 2);
}

export function grassTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#7c8b52';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      const g = 90 + Math.random() * 70;
      ctx.fillStyle = `rgba(${g - 30},${g},${g - 50},${0.35 + Math.random() * 0.4})`;
      const x = Math.random() * w, y = Math.random() * h;
      ctx.fillRect(x, y, 1, 2 + Math.random() * 3);
    }
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = 'rgba(120,120,70,0.10)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 25, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 40, 40);
}

export function sandTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d8c39b';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) {
      const v = rr(-18, 18);
      ctx.fillStyle = `rgba(${200 + v},${180 + v},${145 + v},0.5)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1);
    }
    for (let i = 0; i < 24; i++) {
      ctx.strokeStyle = 'rgba(180,158,120,0.25)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 20, 0, Math.PI);
      ctx.stroke();
    }
  }, 16, 16);
}

export function stripeTexture(a = '#efe4cf', b = '#b6503f', count = 8) {
  return canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = b;
    const sw = w / count;
    for (let i = 0; i < count; i += 2) ctx.fillRect(i * sw, 0, sw, h);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 2);
  }, 2, 1);
}

export function signTexture(text, { bg = '#f3e8d2', fg = '#2f2a24', border = '#2f2a24', sub = '' } = {}) {
  return canvasTexture(768, sub ? 256 : 192, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${sub ? 88 : 92}px Georgia, 'Times New Roman', serif`;
    ctx.fillText(text, w / 2, sub ? h * 0.42 : h * 0.52);
    if (sub) {
      ctx.font = "500 36px Manrope, 'Helvetica Neue', sans-serif";
      ctx.globalAlpha = 0.75;
      ctx.fillText(sub, w / 2, h * 0.72);
    }
  });
}

export function signMesh(text, opts = {}, width = 3.6, height = 0.9) {
  const tex = signTexture(text, opts);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  m.castShadow = false;
  return m;
}

export function box(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function cylinder(rt, rb, h, material, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function gableRoofGeometry(w, d, h, overhang = 0.55) {
  const ow = w / 2 + overhang, od = d / 2 + overhang;
  const positions = [
    -w / 2, h, 0, w / 2, h, 0,
    -ow, 0, od, ow, 0, od,
    ow, 0, -od, -ow, 0, -od
  ];
  const uvs = [0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0];
  const indices = [
    0, 2, 3, 0, 3, 1,
    1, 3, 4, 1, 4, 5,
    0, 1, 5, 0, 5, 2,
    0, 4, 3, 0, 5, 4,
    0, 1, 3, 0, 4, 1
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function addCollider(ctx, x, z, hw, hd, dlc = null) {
  ctx.colliders.push({ x, z, hw, hd, dlc });
}

export function isBlocked(ctx, x, z) {
  if (Math.abs(x) > 92 || z < -92 || z > 94) return true;
  for (const c of ctx.colliders) {
    if (c.dlc && ctx.dlcEnabled[c.dlc] === false) continue;
    if (Math.abs(x - c.x) < c.hw + 0.35 && Math.abs(z - c.z) < c.hd + 0.35) return true;
  }
  // canal water, except the bridge corridor
  if (ctx.dlcEnabled.venezia !== false && z < -63 && z > -77 && x > -58 && x < 38) {
    if (!(x > -14.2 && x < -6.2)) return true;
  }
  return false;
}

export function cypress(ctx, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = cylinder(0.09, 0.14, 1.2, ctx.materials.trunk, 8);
  trunk.position.y = 0.6;
  g.add(trunk);
  const dark = mat('#3f5a35', 0.95);
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.75, 5.6, 9), dark);
  body.position.y = 3.4;
  body.castShadow = true;
  g.add(body);
  const body2 = new THREE.Mesh(new THREE.ConeGeometry(0.52, 2.4, 8), mat('#4b683c', 0.95));
  body2.position.y = 5.9;
  body2.castShadow = true;
  g.add(body2);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  g.rotation.y = rr(0, Math.PI * 2);
  return g;
}

export function pine(ctx, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = cylinder(0.14, 0.24, 3.6, ctx.materials.trunk, 8);
  trunk.position.y = 1.8;
  trunk.rotation.z = rr(-0.08, 0.08);
  g.add(trunk);
  const foliage = mat('#4f663f', 0.95);
  for (let i = 0; i < 4; i++) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.5 - i * 0.16, 10, 7), foliage);
    ball.position.set(rr(-0.9, 0.9), 4.2 + i * 0.45, rr(-0.9, 0.9));
    ball.scale.set(1.2, 0.55, 1.2);
    ball.castShadow = true;
    g.add(ball);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  return g;
}

export function olive(ctx, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = cylinder(0.1, 0.22, 1.5, ctx.materials.trunk, 7);
  trunk.position.y = 0.75;
  g.add(trunk);
  const foliage = mat('#77855a', 0.95);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rr(0.5, 0.8), 1), foliage);
    b.position.set(rr(-0.5, 0.5), 1.7 + rr(0, 0.7), rr(-0.5, 0.5));
    b.castShadow = true;
    g.add(b);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  return g;
}

export function palm(ctx, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = cylinder(0.12, 0.22, 5, ctx.materials.palmTrunk, 8);
  trunk.position.y = 2.5;
  trunk.rotation.z = rr(-0.1, 0.1);
  g.add(trunk);
  const leafMat = mat('#5d7c42', 0.9);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.6, 4), leafMat);
    leaf.position.set(Math.cos(a) * 1.0, 5.1, Math.sin(a) * 1.0);
    leaf.rotation.z = Math.PI / 2;
    leaf.rotation.y = -a;
    leaf.scale.set(1, 1, 0.35);
    leaf.castShadow = true;
    g.add(leaf);
  }
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat('#6d5a35', 0.9));
  crown.position.y = 5.1;
  g.add(crown);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  g.rotation.y = rr(0, Math.PI * 2);
  return g;
}

export function bougainvillea(ctx, x, y, z, scale = 1) {
  const g = new THREE.Group();
  const leafMat = mat('#5f7a45', 0.9);
  const flowerMat = mat('#c34f78', 0.85);
  for (let i = 0; i < 18; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(rr(0.12, 0.24), 6, 5), i % 3 === 0 ? flowerMat : leafMat);
    leaf.position.set(rr(-0.8, 0.8), rr(-0.4, 0.8), rr(-0.2, 0.2));
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  return g;
}

export function flowerBed(ctx, x, z, r = 1.6) {
  const g = new THREE.Group();
  const soil = cylinder(r, r, 0.22, mat('#5c4632', 0.95), 18);
  soil.position.y = 0.11;
  g.add(soil);
  const leaf = mat('#5e7b43', 0.9);
  const colors = ['#c4576b', '#e0a04c', '#d9d0e8', '#b64c4c', '#e8c45c'];
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (r - 0.2);
    const px = Math.cos(a) * d, pz = Math.sin(a) * d;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.45, 4), leaf);
    stem.position.set(px, 0.4, pz);
    g.add(stem);
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 5), mat(pick(colors), 0.8));
    bloom.position.set(px, 0.63, pz);
    g.add(bloom);
  }
  g.position.set(x, 0, z);
  return g;
}

export function bench(ctx, x, z, rotY = 0) {
  const g = new THREE.Group();
  const wood = mat('#8a6240', 0.85);
  const iron = mat('#3c3a36', 0.6, 0.3);
  for (let i = -2; i <= 2; i++) {
    const slat = box(2.2, 0.08, 0.13, wood);
    slat.position.set(0, 0.48, i * 0.14);
    g.add(slat);
  }
  for (let i = 0; i < 3; i++) {
    const slat = box(2.2, 0.13, 0.07, wood);
    slat.position.set(0, 0.72 + i * 0.17, -0.32);
    g.add(slat);
  }
  for (const s of [-1, 1]) {
    const leg = box(0.09, 0.5, 0.5, iron);
    leg.position.set(s * 0.85, 0.24, 0);
    g.add(leg);
    const back = box(0.07, 0.6, 0.07, iron);
    back.position.set(s * 0.85, 0.75, -0.32);
    g.add(back);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  return g;
}

export function lampPost(ctx, x, z, withLight = false) {
  const g = new THREE.Group();
  const metal = mat('#2e3230', 0.55, 0.45);
  const base = cylinder(0.22, 0.28, 0.35, metal, 10);
  base.position.y = 0.17;
  g.add(base);
  const pole = cylinder(0.055, 0.075, 4.3, metal, 8);
  pole.position.y = 2.4;
  g.add(pole);
  const arm = box(0.7, 0.06, 0.06, metal);
  arm.position.set(0.3, 4.5, 0);
  g.add(arm);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), ctx.materials.lampBulb);
  bulb.position.set(0.6, 4.4, 0);
  g.add(bulb);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.24, 10, 1, true), metal);
  shade.position.set(0.6, 4.52, 0);
  g.add(shade);
  if (withLight) {
    const light = new THREE.PointLight('#ffb46a', 0, 16, 2);
    light.position.set(0.6, 4.2, 0);
    light.userData.lamp = true;
    g.add(light);
    ctx.lampLights.push(light);
  }
  g.position.set(x, 0, z);
  return g;
}
