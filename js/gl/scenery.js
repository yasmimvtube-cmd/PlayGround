import * as THREE from 'three';
import { mat, box, cylinder, bench, lampPost, signMesh, cypress, pine, olive, lampPost as lamp, addCollider, bougainvillea, rr, pick } from './helpers.js';
import { addBuilding, addStringLights } from './building.js';
import { buildCharacter } from '../character.js';
import { NPCS } from '../data.js';

export function buildPiazzaProps(ctx) {
  const benchPositions = [[10, 9], [-11, 10], [9, -10], [-12, -8]];
  for (const [x, z] of benchPositions) {
    const b = bench(ctx, x, z, Math.atan2(-x, -z));
    ctx.cityGroup.add(b);
  }

  const lamps = [
    [14, -12, true], [-14, -12, true], [-15, 12, true], [15, 12, false]
  ];
  for (const [x, z, light] of lamps) ctx.cityGroup.add(lampPost(ctx, x, z, light));

  addStringLights(ctx, [-14, 4.5, -12], [14, 4.5, -12], 1.1, 26);
  addStringLights(ctx, [-15, 4.5, 12], [15, 4.5, 12], 1.1, 26);
  addStringLights(ctx, [-14, 4.5, -12], [-15, 4.5, 12], 1.3, 22);
  addStringLights(ctx, [14, 4.5, -12], [15, 4.5, 12], 1.3, 22);

  // olive trees framing the piazza
  for (const [x, z] of [[-12, 16], [12, 16], [-17, -2], [17, -2]]) {
    ctx.cityGroup.add(olive(ctx, x, z, 0.85));
  }

  // Italian flags by the duomo
  const flagColors = ['#2f7d4f', '#f2efe2', '#b23a3a'];
  flagColors.forEach((color, i) => {
    const x = (i - 1) * 7;
    const g = new THREE.Group();
    const pole = cylinder(0.045, 0.06, 5.6, mat('#8a7f6a', 0.6, 0.4), 8);
    pole.position.y = 2.8;
    g.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.9 }));
    flag.position.set(0.78, 4.8, 0);
    flag.rotation.y = 0.25;
    g.add(flag);
    g.position.set(x, 0, -22.6);
    ctx.cityGroup.add(g);
  });

  // big planters
  for (const [x, z] of [[-6, 13], [6, 13], [-6, -15], [6, -15]]) {
    const pot = cylinder(0.6, 0.45, 0.75, mat('#b06a4a', 0.9), 12);
    pot.position.set(x, 0.37, z);
    ctx.cityGroup.add(pot);
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), ctx.materials.leaf);
    plant.position.set(x, 1.15, z);
    plant.scale.y = 1.3;
    plant.castShadow = true;
    ctx.cityGroup.add(plant);
  }

  // a little flock of pigeons
  const pigeonMat = mat('#8d8a82', 0.9);
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), pigeonMat);
    body.scale.set(0.9, 0.8, 1.3);
    p.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), pigeonMat);
    head.position.set(0, 0.09, 0.1);
    p.add(head);
    p.position.set(rr(-8, 8), 0.1, rr(5, 14));
    p.rotation.y = rr(0, Math.PI * 2);
    ctx.cityGroup.add(p);
  }
}

export function buildMarket(ctx) {
  const canopies = [
    { x: -21, z: 9, a: '#b6503f' },
    { x: -15, z: 12, a: '#4f7a63' },
    { x: -11, z: 6, a: '#c9903f' },
    { x: -21, z: 3, a: '#7c5b86' }
  ];
  for (let i = 0; i < canopies.length; i++) {
    const c = canopies[i];
    const g = new THREE.Group();
    const wood = ctx.materials.wood;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const post = box(0.1, 2.5, 0.1, wood);
      post.position.set(sx * 1.7, 1.25, sz * 1.0);
      g.add(post);
    }
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.1, 2.7), new THREE.MeshStandardMaterial({ map: stripeCanvas(c.a), roughness: 0.9 }));
    canopy.position.y = 2.55;
    canopy.rotation.x = -0.09;
    canopy.castShadow = true;
    g.add(canopy);
    const table = box(3.2, 0.1, 1.6, wood);
    table.position.y = 0.92;
    g.add(table);
    for (const sx of [-1, 1]) {
      const leg = box(0.1, 0.9, 0.1, wood);
      leg.position.set(sx * 1.4, 0.45, 0);
      g.add(leg);
    }
    // crates + produce
    const crateMat = mat('#9c7448', 0.95);
    const produce = ['#d56a3f', '#c93c3c', '#d9b23f', '#6e9b4c', '#7c3f66'];
    for (let k = 0; k < 3; k++) {
      const crate = box(0.9, 0.3, 0.65, crateMat);
      crate.position.set(-1 + k * 1.0, 1.1, rr(-0.1, 0.1));
      g.add(crate);
      for (let p = 0; p < 7; p++) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(pick(produce), 0.75));
        fruit.position.set(-1.3 + k + rr(-0.3, 0.3), 1.3 + rr(0, 0.08), rr(-0.2, 0.2));
        g.add(fruit);
      }
    }
    g.position.set(c.x, 0, c.z);
    g.rotation.y = rr(-0.15, 0.15) + (i % 2 ? 0.4 : -0.2);
    ctx.cityGroup.add(g);
  }

  const flowerStall = new THREE.Group();
  const table = box(2.4, 0.9, 1.2, ctx.materials.wood);
  table.position.y = 0.45;
  flowerStall.add(table);
  for (let i = 0; i < 18; i++) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.55, 4), ctx.materials.leaf);
    stem.position.set(rr(-1, 1), 1.1, rr(-0.4, 0.4));
    flowerStall.add(stem);
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), mat(pick(['#c4576b', '#e0a04c', '#d9d0e8', '#c93c3c']), 0.8));
    bloom.position.set(stem.position.x, 1.4, stem.position.z);
    flowerStall.add(bloom);
  }
  flowerStall.position.set(-22, 0, 3.5);
  flowerStall.rotation.y = 0.3;
  ctx.cityGroup.add(flowerStall);

  // market sign
  const post = new THREE.Group();
  for (const sx of [-1, 1]) {
    const p = box(0.12, 3.2, 0.12, ctx.materials.wood);
    p.position.set(sx * 1.8, 1.6, 0);
    post.add(p);
  }
  const sign = signMesh('MERCATO VECCHIO', { bg: '#e8d3ac', fg: '#4c3b28', border: '#4c3b28' }, 4.2, 0.9);
  sign.position.set(0, 3.1, 0.08);
  post.add(sign);
  post.position.set(-16, 0, 16.5);
  post.rotation.y = Math.PI / 2;
  ctx.cityGroup.add(post);

  addStringLights(ctx, [-24, 4, 11], [-9, 4, 8], 0.9, 14);
}

function stripeCanvas(color) {
  return new THREE.CanvasTexture((() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = color;
    for (let i = 0; i < 8; i += 2) ctx.fillRect((i * 256) / 8, 0, 32, 64);
    return c;
  })());
}

export function buildPromenade(ctx) {
  const railMat = mat('#3d423c', 0.55, 0.4);
  const makeRail = (x1, x2) => {
    for (let x = x1; x <= x2; x += 3.6) {
      const post = box(0.09, 1.1, 0.09, railMat);
      post.position.set(x, 0.55, 54.6);
      ctx.cityGroup.add(post);
    }
    for (const y of [0.55, 1.0]) {
      const bar = box(x2 - x1, 0.06, 0.06, railMat);
      bar.position.set((x1 + x2) / 2, y, 54.6);
      ctx.cityGroup.add(bar);
    }
  };
  makeRail(-50, -7);
  makeRail(7, 50);

  for (const [x, z] of [[-44, 57], [-28, 57.5], [28, 57.5], [44, 57]]) {
    ctx.cityGroup.add(pine(ctx, x, z, rr(0.9, 1.15)));
  }
  for (const [x, z] of [[-30, 56], [30, 56], [-10, 56]]) {
    ctx.cityGroup.add(cypress(ctx, x, z, 1.1));
  }

  for (const x of [-22, 22, -38, 38]) {
    const b = bench(ctx, x, 50.5, Math.PI);
    ctx.cityGroup.add(b);
  }
  ctx.cityGroup.add(lampPost(ctx, -16, 51.5, false));
  ctx.cityGroup.add(lampPost(ctx, 16, 51.5, false));

  // gelato kiosk
  const kiosk = new THREE.Group();
  const body = box(4.2, 2.8, 2.8, mat('#efe3cc', 0.9));
  body.position.y = 1.4;
  kiosk.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 3.4), mat('#b6503f', 0.9));
  roof.position.y = 2.9;
  kiosk.add(roof);
  const counter = box(4.3, 0.15, 0.5, mat('#d8c8ac', 0.9));
  counter.position.set(0, 1.1, 1.5);
  kiosk.add(counter);
  const sign = signMesh('GELATERIA', { bg: '#f2e5cf', fg: '#8c3d4b' }, 3.4, 0.8);
  sign.position.set(0, 3.4, 1.0);
  kiosk.add(sign);
  kiosk.position.set(-40, 0, 55.5);
  ctx.cityGroup.add(kiosk);
  addCollider(ctx, -40, 55.5, 2.3, 1.7);

  // beach path opening and shower
  for (const x of [-4, 4]) {
    const pole = box(0.12, 3.2, 0.12, ctx.materials.wood);
    pole.position.set(x, 1.6, 57.5);
    ctx.cityGroup.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), ctx.lampBulb);
    lamp.position.set(x, 3.3, 57.5);
    ctx.cityGroup.add(lamp);
  }

  // seaside notice board
  const board = new THREE.Group();
  const panel = box(2.6, 1.6, 0.12, mat('#e8dcc2', 0.9));
  panel.position.y = 1.9;
  board.add(panel);
  for (const s of [-1, 1]) {
    const post = box(0.11, 2.6, 0.11, ctx.materials.wood);
    post.position.set(s * 1.1, 1.3, 0);
    board.add(post);
  }
  board.position.set(8, 0, 51.2);
  board.rotation.y = 0.2;
  ctx.cityGroup.add(board);
}

export function buildFillerBuildings(ctx) {
  const fills = [
    { x: -46, z: -6, w: 12, d: 10, h: 11, color: '#d9b992', sign: 'FARMACIA' },
    { x: 34, z: -42, w: 10, d: 8, h: 10, color: '#e6cba6', sign: 'LIBRERIA' },
    { x: -50, z: -26, w: 10, d: 9, h: 9, color: '#d8b28c', sign: 'ENOTECA' },
    { x: 45, z: 30, w: 11, d: 9, h: 11, color: '#e4c7a0', sign: 'SARTORIA' },
    { x: -50, z: 40, w: 12, d: 10, h: 10, color: '#cfa77d', sign: 'PANIFICIO' },
    { x: -20, z: -52, w: 12, d: 8, h: 10, color: '#e2c49e', sign: 'TABACCHI' },
    { x: 14, z: 42, w: 10, d: 8, h: 9, color: '#d9b388', sign: 'ALIMENTARI' },
    { x: 44, z: 6, w: 9, d: 8, h: 8, color: '#efd9b8', sign: 'GALLERIA' },
    { x: 30, z: -54, w: 12, d: 8, h: 11, color: '#d5ae83', sign: 'TEATRO' },
    { x: -34, z: -50, w: 11, d: 9, h: 10, color: '#e8d0ad', sign: 'SCUOLA' }
  ];
  const colors = ['#3f5b53', '#4e6a5b', '#7d4b3a', '#39545e', '#8a6b47'];
  for (const f of fills) {
    addBuilding(ctx, {
      ...f, rotY: rr(-0.25, 0.25), floors: Math.max(2, Math.round(f.h / 3.2)),
      shutters: true, flowers: true, balconies: f.h > 9, laundry: Math.random() > 0.5,
      sign: f.sign, signColor: '#f1e5d0', doorFace: rr() > 0.5 ? 1 : 0
    });
  }
}

export function buildTreesAndProps(ctx) {
  const cypresses = [
    [-9, 19], [9, 19], [-16, -12], [16, -12], [-24, 18], [24, 26], [-44, 6], [46, 4],
    [-36, 36], [36, 36], [-58, -8], [52, 12], [-44, -16], [50, -48], [-30, -18], [30, -8],
    [-12, 26], [12, 26], [-60, 34], [54, 40]
  ];
  for (const [x, z] of cypresses) ctx.cityGroup.add(cypress(ctx, x, z, rr(0.8, 1.3)));

  for (const [x, z] of [[-27, 44], [27, 44], [-20, -46], [20, -46]]) {
    ctx.cityGroup.add(pine(ctx, x, z, rr(0.8, 1.1)));
  }

  // vespa by the cafe
  const vespa = new THREE.Group();
  const mint = mat('#8fb8a6', 0.55, 0.25);
  const dark = mat('#2b2924', 0.7);
  const wheel = new THREE.TorusGeometry(0.32, 0.075, 8, 18);
  for (const x of [-0.62, 0.62]) {
    const w = new THREE.Mesh(wheel, dark);
    w.position.set(x, 0.33, 0);
    w.rotation.y = Math.PI / 2;
    vespa.add(w);
  }
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), mint);
  body.position.set(0.1, 0.72, 0);
  body.scale.set(1.25, 0.7, 0.55);
  body.castShadow = true;
  vespa.add(body);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.3), mat('#4a3428', 0.85));
  seat.position.set(-0.18, 1.0, 0);
  vespa.add(seat);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.55), mint);
  shield.position.set(0.78, 0.9, 0);
  shield.rotation.z = -0.15;
  vespa.add(shield);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), ctx.lampBulb);
  lamp.position.set(0.88, 1.12, 0);
  vespa.add(lamp);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), dark);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0.72, 1.2, 0);
  vespa.add(bar);
  vespa.position.set(14.5, 0, 12.8);
  vespa.rotation.y = 0.5;
  ctx.cityGroup.add(vespa);
  addCollider(ctx, 14.5, 12.8, 0.9, 0.5);

  // cafe planters and bougainvillea
  ctx.cityGroup.add(bougainvillea(ctx, 18.1, 3.6, 9.5, 1.2));
  ctx.cityGroup.add(bougainvillea(ctx, -31.2, 4.3, 22.8, 1.1));
}

export function buildNPCs(ctx) {
  for (const n of NPCS) {
    const model = buildCharacter({
      skin: n.skin, hair: n.hair, hairStyle: n.style,
      top: n.top, bottom: n.bottom, shoes: '#3a312a', accent: '#c9a45c', scale: 0.97
    });
    model.group.position.set(n.home[0], 0, n.home[1]);
    model.group.rotation.y = Math.atan2(4 - n.home[0], 4 - n.home[1]);
    ctx.scene.add(model.group);
    ctx.npcs.push({
      ...n,
      model,
      index: 0,
      pos: new THREE.Vector3(n.home[0], 0, n.home[1]),
      walking: true,
      pause: rr(0, 2)
    });
  }
}
