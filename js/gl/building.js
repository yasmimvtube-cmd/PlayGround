import * as THREE from 'three';
import { mat, box, addCollider, gableRoofGeometry, roofTexture, signMesh } from '../gl/helpers.js';

const frameMat = mat('#eadfc9', 0.9);
const glassFrameMat = mat('#cdbfa8', 0.85);
const doorMat = mat('#5b3c26', 0.85);
const shutterColors = ['#3f5b53', '#4e6a5b', '#6e7b58', '#7d4b3a', '#39545e', '#8a6b47'];

export function addRotatedCollider(ctx, x, z, w, d, rotY, dlc = null) {
  const c = Math.abs(Math.cos(rotY)), s = Math.abs(Math.sin(rotY));
  const hw = (c * w + s * d) / 2 + 0.35;
  const hd = (s * w + c * d) / 2 + 0.35;
  addCollider(ctx, x, z, hw, hd, dlc);
}

export function addWindow(group, ctx, x, y, z, ry, opts = {}) {
  const win = new THREE.Group();
  win.position.set(x, y, z);
  win.rotation.y = ry;
  const frame = box(1.0, 1.5, 0.09, frameMat);
  frame.position.z = 0.02;
  win.add(frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.26), ctx.windowMat);
  glass.position.z = 0.075;
  win.add(glass);
  const sill = box(1.15, 0.1, 0.22, frameMat);
  sill.position.set(0, -0.8, 0.05);
  win.add(sill);
  const mid = box(0.08, 1.26, 0.05, frameMat);
  mid.position.z = 0.08;
  win.add(mid);
  if (opts.shutters !== false) {
    const sm = mat(opts.shutter || shutterColors[Math.floor(Math.random() * shutterColors.length)], 0.9);
    for (const side of [-1, 1]) {
      const sh = box(0.24, 1.34, 0.06, sm);
      sh.position.set(side * 0.63, 0, 0.03);
      win.add(sh);
    }
  }
  if (opts.flowers && Math.random() > 0.45) {
    const fb = box(1.0, 0.22, 0.24, mat('#7a5638', 0.95));
    fb.position.set(0, -0.92, 0.14);
    win.add(fb);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.085, 6, 5), mat(['#c4576b', '#d9778b', '#e0a04c'][i % 3], 0.85));
      f.position.set(-0.34 + i * 0.22, -0.78, 0.18);
      win.add(f);
    }
  }
  if (opts.balcony) {
    const slab = box(2.15, 0.14, 0.82, mat('#d8c8ad', 0.9));
    slab.position.set(0, -1.0, 0.38);
    win.add(slab);
    const railMat = mat('#32352f', 0.5, 0.4);
    const top = box(2.15, 0.06, 0.06, railMat);
    top.position.set(0, -0.32, 0.76);
    win.add(top);
    for (let i = -4; i <= 4; i++) {
      const bar = box(0.035, 0.68, 0.035, railMat);
      bar.position.set(i * 0.24, -0.66, 0.76);
      win.add(bar);
    }
    if (opts.laundry) {
      const colors = ['#e8e1d3', '#c4576b', '#6f8fa5', '#e0c486'];
      for (let i = 0; i < 3; i++) {
        const cloth = box(0.42, 0.55, 0.03, mat(colors[i % colors.length], 0.9));
        cloth.position.set(-0.55 + i * 0.5, -0.55, 0.82);
        cloth.rotation.z = (i - 1) * 0.04;
        win.add(cloth);
      }
    }
  }
  group.add(win);
}

export function addDoor(group, ctx, x, z, ry, w = 1.5, h = 2.6, opts = {}) {
  const d = new THREE.Group();
  d.position.set(x, 0, z);
  d.rotation.y = ry;
  const frame = box(w + 0.35, h + 0.2, 0.16, frameMat);
  frame.position.y = h / 2;
  d.add(frame);
  const door = box(w, h, 0.1, opts.material || doorMat);
  door.position.set(0, h / 2, 0.08);
  d.add(door);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.12, 16, 1, false, 0, Math.PI), frameMat);
  arch.rotation.x = Math.PI / 2;
  arch.rotation.z = Math.PI / 2;
  arch.position.set(0, h, 0.05);
  arch.scale.z = 0.5;
  d.add(arch);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), mat('#c9a45c', 0.35, 0.8));
  handle.position.set(w * 0.3, h * 0.48, 0.15);
  d.add(handle);
  const step = box(w + 0.9, 0.14, 0.7, mat('#c9bca6', 0.95));
  step.position.set(0, 0.07, 0.45);
  d.add(step);
  if (opts.lamp) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), ctx.lampBulb);
    lamp.position.set(w / 2 + 0.4, h + 0.05, 0.2);
    d.add(lamp);
  }
  group.add(d);
}

export function addAwning(group, ctx, x, y, z, width, rotY = 0, material = ctx.materials.awning) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 2.8), material);
  awning.rotation.x = -0.28;
  awning.position.set(0, 0, 1.2);
  awning.castShadow = true;
  g.add(awning);
  const valance = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, 0.06), material);
  valance.position.set(0, -0.55, 2.4);
  g.add(valance);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), mat('#4a453d', 0.6, 0.4));
    arm.rotation.x = Math.PI / 2.4;
    arm.position.set(side * (width / 2 - 0.2), -0.32, 1.15);
    g.add(arm);
  }
  group.add(g);
  return g;
}

export function addBuilding(ctx, opts) {
  const {
    x, z, w = 10, d = 8, h = 9, color = '#e2c9a4', roofColor = '#b65f38',
    rotY = 0, floors = Math.max(2, Math.round(h / 3)), shutters = true,
    balconies = false, flowers = false, laundry = false, sign = null, signSub = '',
    signColor = '#f3e8d2', roofHeight = null, door = true, doorFace = 1,
    target = null, dlc = null
  } = opts;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  const wallMat = new THREE.MeshStandardMaterial({
    color, roughness: 0.92, map: ctx.materials.plaster
  });
  const walls = box(w, h, d, wallMat);
  walls.position.y = h / 2;
  group.add(walls);

  const base = box(w + 0.12, 0.5, d + 0.12, mat('#b8a78d', 0.95));
  base.position.y = 0.25;
  group.add(base);

  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.9, map: roofTexture() });
  const roof = new THREE.Mesh(gableRoofGeometry(w, d, roofHeight || Math.max(1.8, w * 0.18)), roofMat);
  roof.position.y = h;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const chimney = box(0.7, 1.4, 0.7, mat('#c7a58a', 0.95));
  chimney.position.set(w * 0.27, h + 1.1, -d * 0.18);
  group.add(chimney);

  const floorH = h / floors;
  for (let f = 0; f < floors; f++) {
    const y = f * floorH + floorH * 0.55;
    if (f === 0) continue;
    const count = Math.max(2, Math.floor(w / 2.6));
    for (let i = 0; i < count; i++) {
      const px = -w / 2 + (w / (count + 1)) * (i + 1);
      const bal = balconies && f === 1 && i % 2 === 0;
      addWindow(group, ctx, px, y, d / 2 + 0.05, 0, { shutters, flowers, balcony: bal, laundry: bal && laundry });
      if (w > 7) addWindow(group, ctx, px, y, -d / 2 - 0.05, Math.PI, { shutters, flowers: false });
    }
    if (w > 8) {
      const sideCount = Math.max(2, Math.floor(d / 3));
      for (const side of [-1, 1]) {
        for (let i = 0; i < sideCount; i++) {
          const pz = -d / 2 + (d / (sideCount + 1)) * (i + 1);
          addWindow(group, ctx, side * (w / 2 + 0.05), y, pz, side * Math.PI / 2, { shutters, flowers: false });
        }
      }
    }
  }

  // ground floor windows
  const groundCount = Math.max(2, Math.floor(w / 3.4));
  for (let i = 0; i < groundCount; i++) {
    const px = -w / 2 + (w / (groundCount + 1)) * (i + 1);
    if (door && Math.abs(px) < 1.4) continue;
    addWindow(group, ctx, px, 1.75, d / 2 + 0.05, 0, { shutters, flowers, balcony: false });
  }

  if (door) {
    const doorOffset = doorFace === 0 ? 0 : w * 0.26;
    addDoor(group, ctx, doorOffset, d / 2 + 0.04, 0, 1.4, 2.5, { lamp: true });
  }

  if (sign) {
    const s = signMesh(sign, { bg: signColor, sub: signSub }, Math.min(w - 2, 5.4), signSub ? 1.7 : 0.95);
    s.position.set(0, h + 0.02, d / 2 + 0.1);
    s.rotation.x = -0.05;
    // place sign against facade just above the door
    s.position.set(doorFace === 0 ? 0 : w * 0.26, 2.95, d / 2 + 0.12);
    group.add(s);
  }

  (target || ctx.cityGroup).add(group);
  addRotatedCollider(ctx, x, z, w, d, rotY, dlc);
  return group;
}

export function tableSet(ctx, x, z, rotY = 0, umbrella = false) {
  const g = new THREE.Group();
  const metal = mat('#4c4a44', 0.55, 0.4);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 16), mat('#e7dcc8', 0.8));
  top.position.y = 0.75;
  top.castShadow = true;
  g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8), metal);
  leg.position.y = 0.38;
  g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.05, 12), metal);
  foot.position.y = 0.03;
  g.add(foot);
  for (const s of [-1, 1]) {
    const chair = new THREE.Group();
    chair.position.set(s * 0.98, 0, 0);
    chair.rotation.y = s * Math.PI / 2;
    const seat = box(0.5, 0.06, 0.5, ctx.materials.wood);
    seat.position.y = 0.46;
    chair.add(seat);
    const back = box(0.5, 0.55, 0.05, ctx.materials.wood);
    back.position.set(0, 0.73, -0.22);
    chair.add(back);
    for (const cs of [-1, 1]) for (const cz of [-1, 1]) {
      const l = box(0.04, 0.46, 0.04, metal);
      l.position.set(cs * 0.2, 0.23, cz * 0.2);
      chair.add(l);
    }
    g.add(chair);
  }
  if (umbrella) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), metal);
    pole.position.y = 1.25;
    g.add(pole);
    const can = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.6, 10), mat('#efe4cf', 0.9));
    can.position.y = 2.5;
    can.castShadow = true;
    g.add(can);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  ctx.cityGroup.add(g);
  return g;
}

export function addStringLights(ctx, p1, p2, sag = 1.4, count = 16) {
  const a = new THREE.Vector3(p1[0], p1[1], p1[2]);
  const b = new THREE.Vector3(p2[0], p2[1], p2[2]);
  const mid = a.clone().lerp(b, 0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const points = curve.getPoints(40);
  const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#2d2d2a' }));
  ctx.cityGroup.add(wire);
  for (let i = 1; i < count; i++) {
    const p = curve.getPoint(i / count);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), ctx.stringBulb);
    bulb.position.copy(p);
    ctx.cityGroup.add(bulb);
  }
}
