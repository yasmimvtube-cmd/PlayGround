import * as THREE from 'three';
import { mat, box, cylinder, addCollider, bench, lampPost, signMesh } from './helpers.js';
import { addBuilding, addDoor, addAwning, tableSet, addStringLights } from './building.js';

export function buildFountain(ctx) {
  const g = new THREE.Group();
  g.position.set(0, 0, 0);
  const stone = mat('#cfc3ab', 0.92);
  const darkStone = mat('#b6a98f', 0.94);

  const basin = cylinder(4.2, 4.35, 0.85, stone, 40);
  basin.position.y = 0.42;
  g.add(basin);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.25, 0.16, 10, 48), darkStone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.88;
  rim.castShadow = true;
  g.add(rim);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(3.95, 40),
    new THREE.MeshPhysicalMaterial({ color: '#6fb9bd', roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.88, transmission: 0.25 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.74;
  g.add(water);

  const coins = new THREE.Group();
  for (let i = 0; i < 20; i++) {
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.07, 8), mat('#d9b25f', 0.3, 0.8));
    c.rotation.x = -Math.PI / 2;
    const a = Math.random() * Math.PI * 2, r = Math.random() * 3.2;
    c.position.set(Math.cos(a) * r, 0.755, Math.sin(a) * r);
    coins.add(c);
  }
  g.add(coins);

  const pedestal = cylinder(0.95, 1.2, 1.3, stone, 20);
  pedestal.position.y = 1.35;
  g.add(pedestal);
  const bowl = cylinder(1.9, 0.4, 0.32, darkStone, 24);
  bowl.position.y = 2.05;
  g.add(bowl);
  const bowlWater = new THREE.Mesh(new THREE.CircleGeometry(1.78, 28), new THREE.MeshPhysicalMaterial({ color: '#7cc6c9', roughness: 0.1, transparent: true, opacity: 0.85 }));
  bowlWater.rotation.x = -Math.PI / 2;
  bowlWater.position.y = 2.2;
  g.add(bowlWater);

  const column = cylinder(0.42, 0.55, 1.7, stone, 16);
  column.position.y = 3.05;
  g.add(column);
  const upper = cylinder(1.05, 0.32, 0.24, darkStone, 20);
  upper.position.y = 3.9;
  g.add(upper);

  // statue
  const figure = new THREE.Group();
  const statueMat = mat('#c5b99f', 0.9);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 5, 10), statueMat);
  torso.position.y = 0.55;
  torso.castShadow = true;
  figure.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), statueMat);
  head.position.y = 1.03;
  figure.add(head);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.55, 4, 8), statueMat);
  arm.position.set(0.32, 0.72, 0.06);
  arm.rotation.z = -0.6;
  figure.add(arm);
  const arm2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.42, 4, 8), statueMat);
  arm2.position.set(-0.25, 0.5, 0.14);
  arm2.rotation.z = 0.5;
  figure.add(arm2);
  const amphora = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), statueMat);
  amphora.position.set(0.55, 0.75, 0.12);
  amphora.scale.set(1, 1.3, 1);
  figure.add(amphora);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.55, 8), statueMat);
  legs.position.y = 0.05;
  figure.add(legs);
  figure.position.y = 4.0;
  figure.scale.setScalar(1.05);
  g.add(figure);

  // water streams
  const streamMat = new THREE.MeshPhysicalMaterial({ color: '#bfe7e8', roughness: 0.15, transparent: true, opacity: 0.55, transmission: 0.2 });
  const streams = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const start = new THREE.Vector3(Math.cos(a) * 0.85, 4.0, Math.sin(a) * 0.85);
    const mid = new THREE.Vector3(Math.cos(a) * 2.0, 2.8, Math.sin(a) * 2.0);
    const end = new THREE.Vector3(Math.cos(a) * 3.35, 0.8, Math.sin(a) * 3.35);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.035, 5, false), streamMat);
    g.add(tube);
    streams.push(tube);
  }
  ctx.fountainStreams = streams;

  ctx.cityGroup.add(g);
  addCollider(ctx, 0, 0, 3.6, 3.6);
  return g;
}

export function buildDuomo(ctx) {
  const g = new THREE.Group();
  const stone = mat('#e2d3b8', 0.92);
  const trim = mat('#cbb896', 0.9);
  const roofMat = mat('#8f5a40', 0.92);

  const body = box(20, 16, 14, stone);
  body.position.set(0, 8, -34);
  g.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(12, 3.5, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 17.6, -34);
  roof.scale.z = 0.72;
  roof.castShadow = true;
  g.add(roof);

  // facade
  const facade = box(20.6, 17, 0.9, trim);
  facade.position.set(0, 8.5, -27.1);
  g.add(facade);

  const doorFrame = box(4.8, 6.2, 0.5, mat('#d8c7ab', 0.9));
  doorFrame.position.set(0, 3.1, -26.55);
  g.add(doorFrame);
  addDoor(g, ctx, 0, -26.4, 0, 2.5, 5.0);
  addDoor(g, ctx, -5.6, -26.4, 0, 1.5, 3.4);
  addDoor(g, ctx, 5.6, -26.4, 0, 1.5, 3.4);

  for (const px of [-8.4, -3.4, 3.4, 8.4]) {
    const pil = box(1.0, 15.5, 0.8, trim);
    pil.position.set(px, 7.75, -26.5);
    g.add(pil);
    const cap = box(1.35, 0.5, 1.1, stone);
    cap.position.set(px, 15.1, -26.5);
    g.add(cap);
  }

  // pediment
  const shape = new THREE.Shape();
  shape.moveTo(-10.5, 0); shape.lineTo(10.5, 0); shape.lineTo(0, 4.6); shape.closePath();
  const pediment = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: false }), trim);
  pediment.position.set(0, 17, -27.4);
  pediment.castShadow = true;
  g.add(pediment);

  // rose window
  const rose = new THREE.Group();
  rose.position.set(0, 12.1, -26.55);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(2.25, 32), new THREE.MeshStandardMaterial({ color: '#3c4a55', emissive: '#8c5a3a', emissiveIntensity: 0.2, roughness: 0.4 }));
  rose.add(glass);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.16, 8, 32), trim);
  rose.add(ring);
  for (let i = 0; i < 8; i++) {
    const spoke = box(0.1, 4.4, 0.08, trim);
    spoke.rotation.z = (i / 8) * Math.PI;
    rose.add(spoke);
  }
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.09, 6, 20), trim);
  rose.add(inner);
  g.add(rose);

  // steps
  for (let i = 0; i < 4; i++) {
    const step = box(23 - i * 1.2, 0.16, 1.2, mat('#d6c8ae', 0.95));
    step.position.set(0, 0.08 + i * 0.15, -25.4 - i * 0.9);
    step.receiveShadow = true;
    g.add(step);
  }

  // dome
  const drum = cylinder(5.2, 5.4, 3.6, stone, 28);
  drum.position.set(0, 19.2, -40);
  g.add(drum);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const win = box(0.9, 1.8, 0.3, ctx.windowMat);
    win.position.set(Math.cos(a) * 5.18, 19.3, -40 + Math.sin(a) * 5.18);
    win.rotation.y = -a + Math.PI / 2;
    g.add(win);
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5.3, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#c9905f', 0.88));
  dome.position.set(0, 21, -40);
  dome.castShadow = true;
  g.add(dome);
  const lantern = cylinder(0.8, 1.0, 2.2, stone, 12);
  lantern.position.set(0, 27, -40);
  g.add(lantern);
  const lanternDome = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#b57a4f', 0.9));
  lanternDome.position.set(0, 28.1, -40);
  g.add(lanternDome);
  const crossV = box(0.1, 1.2, 0.1, mat('#c9a45c', 0.4, 0.7));
  crossV.position.set(0, 29.1, -40);
  g.add(crossV);
  const crossH = box(0.6, 0.1, 0.1, mat('#c9a45c', 0.4, 0.7));
  crossH.position.set(0, 29.35, -40);
  g.add(crossH);

  // bell tower
  const tower = new THREE.Group();
  const towerBase = box(5, 23, 5, stone);
  towerBase.position.y = 11.5;
  tower.add(towerBase);
  for (const side of [0, 1, 2, 3]) {
    const a = (side / 4) * Math.PI * 2;
    const opening = box(1.5, 3.2, 0.3, ctx.windowMat);
    opening.position.set(Math.sin(a) * 2.52, 18, Math.cos(a) * 2.52);
    opening.rotation.y = a;
    tower.add(opening);
  }
  const towerTop = box(6, 0.8, 6, trim);
  towerTop.position.y = 23.2;
  tower.add(towerTop);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 4.4, 4), mat('#8f5a40', 0.9));
  towerRoof.position.y = 25.8;
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.castShadow = true;
  tower.add(towerRoof);
  const towerCross = box(0.08, 1.1, 0.08, mat('#c9a45c', 0.4, 0.7));
  towerCross.position.y = 29;
  tower.add(towerCross);
  tower.position.set(-13, 0, -40);
  g.add(tower);

  const plaque = signMesh('DUOMO DI SAN MARCO', { bg: '#e8dcc2', fg: '#6b5138' }, 4.6, 0.75);
  plaque.position.set(0, 6.35, -26.35);
  g.add(plaque);

  ctx.cityGroup.add(g);
  addCollider(ctx, 0, -34, 10.6, 7.4);
  addCollider(ctx, -13, -40, 3.0, 3.0);
  return g;
}

export function buildCafe(ctx) {
  const g = addBuilding(ctx, {
    x: 25, z: 4, w: 13, d: 10, h: 7.5, color: '#e8c9a0', rotY: -Math.PI / 2,
    floors: 2, shutters: true, flowers: true, balconies: true, laundry: false,
    sign: 'TRATTORIA SOLE', signSub: 'cucina · caffè · vino', signColor: '#f6ead3'
  });
  addAwning(g, ctx, 0, 3.4, 5.05, 10.5, 0);
  const cafeLamp = box(1.6, 1.0, 0.3, ctx.lampBulb);
  cafeLamp.position.set(25 - 6.55, 3.8, 4);
  ctx.cityGroup.add(cafeLamp);
  for (const [x, z] of [[15.5, -1], [14.6, 3.2], [16.2, 7.2], [14.4, 10.4]]) {
    tableSet(ctx, x, z, Math.random() * Math.PI, false);
  }
  addStringLights(ctx, [18.6, 4.2, -0.5], [18.6, 4.2, 9], 0.8, 10);
  const lamp = lampPost(ctx, 18.2, 11, false);
  ctx.cityGroup.add(lamp);
  return g;
}

export function buildHome(ctx) {
  const g = addBuilding(ctx, {
    x: -38, z: 20, w: 14, d: 11, h: 13, color: '#d4ded7', rotY: Math.PI / 2,
    floors: 4, shutters: true, flowers: true, balconies: true, laundry: true,
    sign: 'CASA AZZURRA', signSub: 'il tuo rifugio', signColor: '#e7efe9',
    roofColor: '#a85d3d', door: false
  });
  addDoor(g, ctx, -1.4, 5.55, 0, 1.6, 2.7, { lamp: true });
  // bicycle
  const bike = new THREE.Group();
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#232323', roughness: 0.7 });
  for (const s of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 20), wheelMat);
    wheel.position.set(s * 0.55, 0.38, 0);
    bike.add(wheel);
  }
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 5, 12, Math.PI), mat('#7c9c8c', 0.5, 0.2));
  frame.position.set(0, 0.55, 0);
  frame.rotation.z = Math.PI;
  bike.add(frame);
  const seat = box(0.22, 0.06, 0.12, mat('#3a2b22', 0.8));
  seat.position.set(-0.22, 0.92, 0);
  bike.add(seat);
  const bar = box(0.42, 0.04, 0.04, mat('#4d4a44', 0.5, 0.3));
  bar.position.set(0.42, 0.98, 0);
  bike.add(bar);
  bike.position.set(-32.8, 0, 12.3);
  bike.rotation.y = 0.4;
  ctx.cityGroup.add(bike);
  // potted plants
  for (const [x, z] of [[-31.3, 14.2], [-32.6, 22.2]]) {
    const pot = cylinder(0.35, 0.28, 0.5, mat('#a6573c', 0.9), 10);
    pot.position.set(x, 0.25, z);
    ctx.cityGroup.add(pot);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), ctx.materials.leaf);
    bush.position.set(x, 0.9, z);
    bush.scale.y = 1.4;
    bush.castShadow = true;
    ctx.cityGroup.add(bush);
  }
  return g;
}

export function buildGym(ctx) {
  const g = addBuilding(ctx, {
    x: 36, z: -18, w: 15, d: 12, h: 9, color: '#cbb59a', rotY: -Math.PI / 2,
    floors: 2, shutters: false, balconies: false, flowers: false,
    sign: 'PALESTRA FORZA', signSub: 'forza · movimento · vita', signColor: '#e9dfcb',
    roofColor: '#7d5b45'
  });
  addAwning(g, ctx, 0, 3.1, 6.05, 8, 0, mat('#3f4a44', 0.9));
  for (const [x, z] of [[33.2, -23.5], [33.2, -12.5]]) {
    const rack = new THREE.Group();
    for (const s of [-1, 1]) {
      const post = box(0.12, 2.2, 0.12, mat('#2f3330', 0.6, 0.4));
      post.position.set(s * 0.55, 1.1, 0);
      rack.add(post);
    }
    const bar = box(1.4, 0.08, 0.08, mat('#2f3330', 0.6, 0.4));
    bar.position.y = 2.0;
    rack.add(bar);
    rack.position.set(x, 0, z);
    ctx.cityGroup.add(rack);
  }
  return g;
}
