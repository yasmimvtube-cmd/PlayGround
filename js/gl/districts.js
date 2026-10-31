import * as THREE from 'three';
import { mat, box, cylinder, addCollider, bench, lampPost, signMesh, cypress, olive, pine, flowerBed, rr, pick } from './helpers.js';
import { addBuilding, addAwning, tableSet } from './building.js';
import { makeWater } from './environment.js';
import { buildPet } from '../character.js';

function zone(ctx, id) {
  const g = new THREE.Group();
  ctx.dlcGroup.add(g);
  ctx.dlcGroups[id] = g;
  return g;
}

function zoneSign(ctx, group, text, sub, x, z, rotY = 0) {
  const holder = new THREE.Group();
  for (const s of [-1, 1]) {
    const post = box(0.13, 3.2, 0.13, ctx.materials.wood);
    post.position.set(s * 1.9, 1.6, 0);
    holder.add(post);
  }
  const sign = signMesh(text, { bg: '#e8d3ac', fg: '#43372a', sub }, 5.2, 1.5);
  sign.position.set(0, 3.0, 0.1);
  holder.add(sign);
  holder.position.set(x, 0, z);
  holder.rotation.y = rotY;
  group.add(holder);
}

function mannequin(ctx, x, z, color) {
  const g = new THREE.Group();
  const base = cylinder(0.45, 0.55, 0.12, mat('#2f2b28', 0.7), 12);
  base.position.y = 0.06;
  g.add(base);
  const pole = cylinder(0.04, 0.04, 0.9, mat('#b3a58e', 0.5, 0.4), 6);
  pole.position.y = 0.5;
  g.add(pole);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.38, 5, 10), mat(color, 0.8));
  torso.position.y = 1.25;
  torso.scale.set(1.1, 1, 0.7);
  torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat('#e8d9c3', 0.8));
  head.position.y = 1.72;
  g.add(head);
  g.position.set(x, 0, z);
  return g;
}

export function buildModa(ctx) {
  const g = zone(ctx, 'moda');
  const building = addBuilding(ctx, {
    x: 36, z: 18, w: 10, d: 9, h: 8.5, color: '#e9cbd2', rotY: -Math.PI / 2,
    floors: 3, shutters: false, balconies: true, flowers: true,
    sign: 'BOUTIQUE MILANO', signSub: 'alta moda', signColor: '#f7e9ef',
    roofColor: '#a05252', target: g, dlc: 'moda'
  });
  addAwning(building, ctx, 0, 3.3, 4.55, 6.5, 0, mat('#d98aa5', 0.85));
  g.add(mannequin(ctx, 29.4, 15.4, '#9d3f5f'));
  g.add(mannequin(ctx, 29.4, 19.6, '#e7d7c4'));
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 2.2), new THREE.MeshStandardMaterial({ color: '#a84b69', roughness: 0.95 }));
  carpet.rotation.x = -Math.PI / 2;
  carpet.rotation.z = -Math.PI / 2;
  carpet.position.set(27.2, 0.03, 17.4);
  g.add(carpet);
  for (const z of [15.8, 19.0]) {
    const pot = cylinder(0.3, 0.24, 0.55, mat('#b06a4a', 0.9), 10);
    pot.position.set(30.4, 0.27, z);
    g.add(pot);
    const rose = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), mat('#c4576b', 0.85));
    rose.position.set(30.4, 0.9, z);
    g.add(rose);
  }
  zoneSign(ctx, g, 'MILANO MODA', 'boutique · passerella', 26, 25, -0.5);
}

export function buildMare(ctx) {
  const g = zone(ctx, 'mare');
  const umbrellaColors = ['#c4576b', '#4aa8b8', '#e0a04c', '#efe4cf'];
  const spots = [[-28, 72], [-16, 76], [-2, 70], [12, 76], [22, 71], [34, 78], [-36, 82]];
  spots.forEach(([x, z], i) => {
    const u = new THREE.Group();
    const pole = cylinder(0.05, 0.06, 2.8, mat('#d8cdb8', 0.8), 8);
    pole.position.y = 1.4;
    u.add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.1, 0.75, 12), mat(umbrellaColors[i % umbrellaColors.length], 0.85));
    canopy.position.y = 2.7;
    canopy.castShadow = true;
    u.add(canopy);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat('#4c4033', 0.7));
    finial.position.y = 3.12;
    u.add(finial);
    u.position.set(x, 0, z);
    u.rotation.y = rr(0, Math.PI);
    g.add(u);
    // lounger
    const lounger = new THREE.Group();
    const base = box(0.75, 0.1, 2.0, mat('#e6dcc8', 0.9));
    base.position.y = 0.3;
    lounger.add(base);
    const back = box(0.75, 0.1, 0.9, mat('#e6dcc8', 0.9));
    back.position.set(0, 0.55, -0.9);
    back.rotation.x = -0.65;
    lounger.add(back);
    for (const s of [-1, 1]) {
      const leg = box(0.06, 0.3, 0.06, mat('#8a7f6a', 0.6, 0.3));
      leg.position.set(s * 0.3, 0.15, 0.6);
      lounger.add(leg);
    }
    lounger.position.set(x + 1.4, 0, z + rr(-0.6, 0.6));
    lounger.rotation.y = rr(-0.3, 0.3);
    g.add(lounger);
    // towel
    const towel = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9), new THREE.MeshStandardMaterial({ color: pick(['#d96f7c', '#4aa8b8', '#e0c486', '#f2ede2']), roughness: 0.95 }));
    towel.rotation.x = -Math.PI / 2;
    towel.position.set(x - 1.5, 0.015, z + rr(-0.6, 0.6));
    g.add(towel);
  });

  // lifeguard tower
  const tower = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = box(0.18, 3.0, 0.18, ctx.materials.wood);
    leg.position.set(sx * 1.0, 1.5, sz * 1.0);
    tower.add(leg);
  }
  const cabin = box(2.5, 1.8, 2.5, mat('#e9dcc4', 0.9));
  cabin.position.y = 3.4;
  tower.add(cabin);
  const roof = box(3.0, 0.14, 3.0, mat('#b6503f', 0.9));
  roof.position.y = 4.35;
  tower.add(roof);
  const window = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), ctx.windowMat);
  window.position.set(0, 3.55, 1.26);
  tower.add(window);
  const flagpole = cylinder(0.03, 0.03, 1.6, mat('#8a7f6a', 0.5, 0.3), 6);
  flagpole.position.set(1.2, 5.1, 0);
  tower.add(flagpole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshStandardMaterial({ color: '#c94b4b', side: THREE.DoubleSide }));
  flag.position.set(1.6, 5.6, 0);
  tower.add(flag);
  tower.position.set(30, 0, 84);
  g.add(tower);
  addCollider(ctx, 30, 84, 1.6, 1.6, 'mare');

  // beach bar
  const bar = new THREE.Group();
  const barBody = box(6, 2.6, 3.2, mat('#e6d3b3', 0.9));
  barBody.position.y = 1.3;
  bar.add(barBody);
  const barRoof = box(6.8, 0.15, 3.8, mat('#4aa8b8', 0.85));
  barRoof.position.y = 2.75;
  bar.add(barRoof);
  const barCounter = box(6.1, 0.15, 0.5, mat('#c7a77d', 0.9));
  barCounter.position.set(0, 1.05, 1.7);
  bar.add(barCounter);
  const barSign = signMesh('BAR DEL MARE', { bg: '#eaf2ef', fg: '#2f6f78' }, 4.2, 0.8);
  barSign.position.set(0, 3.25, 1.2);
  bar.add(barSign);
  bar.position.set(-40, 0, 68);
  bar.rotation.y = 0.2;
  g.add(bar);
  addCollider(ctx, -40, 68, 3.3, 1.9, 'mare');

  // sailboat
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 3.4, 6, 12), mat('#f3efe4', 0.6));
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(0.65, 1, 1.35);
  hull.position.y = 0.35;
  hull.castShadow = true;
  boat.add(hull);
  const mast = cylinder(0.05, 0.07, 5.2, mat('#b09a74', 0.7), 6);
  mast.position.y = 3;
  boat.add(mast);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0); sailShape.lineTo(0, 3.8); sailShape.lineTo(1.9, 0.3); sailShape.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), new THREE.MeshStandardMaterial({ color: '#f4efe1', roughness: 0.9, side: THREE.DoubleSide }));
  sail.position.set(0.08, 1.6, 0);
  boat.add(sail);
  boat.position.set(24, 0.18, 108);
  boat.rotation.y = -0.6;
  g.add(boat);
  ctx.sailboat = boat;

  const dock = new THREE.Group();
  const deck = box(3.0, 0.18, 12, ctx.materials.wood);
  deck.position.y = 0.5;
  dock.add(deck);
  for (let i = 0; i < 5; i++) {
    for (const s of [-1, 1]) {
      const p = box(0.16, 1.2, 0.16, ctx.materials.wood);
      p.position.set(s * 1.3, 0.3, -5 + i * 2.5);
      dock.add(p);
    }
  }
  dock.position.set(-30, 0, 99);
  g.add(dock);

  // sandcastle
  const castle = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const t = cylinder(0.18, 0.28, rr(0.3, 0.7), mat('#d6bd91', 0.95), 8);
    t.position.set(rr(-0.6, 0.6), t.geometry.parameters.height / 2, rr(-0.6, 0.6));
    castle.add(t);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 8), mat('#d6bd91', 0.95));
    top.position.set(t.position.x, t.geometry.parameters.height + 0.1, t.position.z);
    castle.add(top);
  }
  castle.position.set(10, 0, 84);
  g.add(castle);

  // volleyball net
  const net = new THREE.Group();
  for (const s of [-1, 1]) {
    const p = cylinder(0.05, 0.05, 2.2, mat('#d9cdb8', 0.7), 6);
    p.position.set(s * 4, 1.1, 0);
    net.add(p);
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.8), new THREE.MeshStandardMaterial({ color: '#f2ede0', transparent: true, opacity: 0.55, side: THREE.DoubleSide, roughness: 1 }));
  mesh.position.y = 1.8;
  net.add(mesh);
  net.position.set(22, 0, 67);
  g.add(net);

  // buoys
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(i % 2 ? '#d05a4c' : '#f0e6d2', 0.7));
    b.position.set(-40 + i * 16, 0.05, 114 + (i % 2) * 3);
    g.add(b);
  }

  zoneSign(ctx, g, 'MARE ITALIANO', 'spiaggia del faro', 4, 61, Math.PI);
}

export function buildToscana(ctx) {
  const g = zone(ctx, 'toscana');
  addBuilding(ctx, {
    x: -78, z: 13, w: 16, d: 12, h: 11, color: '#e8d3ae', rotY: Math.PI / 2,
    floors: 3, shutters: true, balconies: true, flowers: true,
    sign: 'VIGNA DEL SOLE', signSub: 'vino e colline', signColor: '#f5e8cd',
    roofColor: '#a65a39', target: g, dlc: 'toscana'
  });

  // vineyard instancing
  const rows = 6, cols = 7;
  const postGeo = new THREE.CylinderGeometry(0.045, 0.06, 1.35, 5);
  const postMat = mat('#6d5138', 0.95);
  const posts = new THREE.InstancedMesh(postGeo, postMat, rows * cols);
  const leafGeo = new THREE.IcosahedronGeometry(0.48, 0);
  const leaf = new THREE.InstancedMesh(leafGeo, mat('#5d7a43', 0.95), rows * cols);
  leaf.castShadow = false;
  posts.castShadow = false;
  const m = new THREE.Matrix4();
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -72 + c * 3.8;
      const z = 21 + r * 3.1;
      m.makeTranslation(x, 0.67, z);
      posts.setMatrixAt(i, m);
      m.makeTranslation(x, 1.3, z);
      m.scale(new THREE.Vector3(1, 0.8, 1));
      leaf.setMatrixAt(i, m);
      i++;
    }
  }
  posts.instanceMatrix.needsUpdate = true;
  leaf.instanceMatrix.needsUpdate = true;
  g.add(posts, leaf);

  // barrels
  for (const [x, z] of [[-62, 9], [-60.5, 9.6], [-63.5, 10.2]]) {
    const barrel = new THREE.Group();
    const body = cylinder(0.5, 0.55, 1.1, mat('#8a5a34', 0.9), 12);
    body.position.y = 0.55;
    barrel.add(body);
    for (const y of [0.3, 0.8]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.035, 5, 16), ctx.materials.iron);
      band.rotation.x = Math.PI / 2;
      band.position.y = y;
      barrel.add(band);
    }
    barrel.position.set(x, 0, z);
    g.add(barrel);
  }

  tableSet(ctx, -64, 12, 0.4, true);
  for (const [x, z] of [[-52, 8], [-48, 30], [-68, 38], [-82, 35], [-56, 42]]) g.add(cypress(ctx, x, z, rr(0.9, 1.25)));
  for (const [x, z] of [[-48, 20], [-84, 26], [-40, 36]]) g.add(olive(ctx, x, z, rr(0.9, 1.2)));
  zoneSign(ctx, g, 'TOSCANA', 'vigna del sole', -52, 15, Math.PI / 2);
}

export function buildRoma(ctx) {
  const g = zone(ctx, 'roma');
  const arena = new THREE.Mesh(new THREE.CircleGeometry(15, 48), mat('#d9c69c', 0.98));
  arena.rotation.x = -Math.PI / 2;
  arena.position.set(58, 0.02, -24);
  arena.scale.set(1, 0.72, 1);
  g.add(arena);

  const stone = mat('#c5a97e', 0.94);
  const dark = mat('#b39669', 0.95);
  const modules = 18;
  for (let i = 0; i < modules; i++) {
    if ([3, 4, 5, 9, 12].includes(i)) continue;
    const a = (i / modules) * Math.PI * 2;
    const x = 58 + Math.cos(a) * 17;
    const z = -24 + Math.sin(a) * 11.5;
    const yaw = Math.atan2(-Math.sin(a) * 17, Math.cos(a) * 11.5);
    const mod = new THREE.Group();
    for (const s of [-1, 1]) {
      const col = cylinder(0.42, 0.52, 6.4, stone, 10);
      col.position.set(s * 2.0, 3.2, 0);
      mod.add(col);
      const cap = box(1.2, 0.4, 1.2, dark);
      cap.position.set(s * 2.0, 6.5, 0);
      mod.add(cap);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.36, 7, 20, Math.PI), stone);
    arch.position.y = 6.7;
    arch.castShadow = true;
    mod.add(arch);
    const top = box(5.5, 1.1, 1.1, stone);
    top.position.y = 9.0;
    mod.add(top);
    if (i % 3 === 0) {
      const upper = box(4.6, 1.2, 0.9, dark);
      upper.position.y = 10.1;
      mod.add(upper);
    }
    mod.position.set(x, 0, z);
    mod.rotation.y = yaw;
    g.add(mod);
    if (i % 2 === 0) {
      const wall = box(6.0, 9.0, 0.8, dark);
      wall.position.set(x, 4.5, z);
      wall.rotation.y = yaw;
      wall.castShadow = true;
      g.add(wall);
      addCollider(ctx, x, z, 2.6, 0.9, 'roma');
    }
  }

  // broken columns and stones
  for (const [x, z, h] of [[44, -19, 2.2], [47, -32, 3.8], [70, -18, 1.4], [68, -33, 2.8], [52, -12, 1.9]]) {
    const col = cylinder(0.45, 0.55, h, stone, 10);
    col.position.set(x, h / 2, z);
    col.rotation.z = rr(-0.08, 0.08);
    g.add(col);
    const cap = box(1.1, 0.22, 1.1, dark);
    cap.position.set(x, h + 0.1, z);
    cap.rotation.z = rr(-0.12, 0.12);
    g.add(cap);
  }
  for (let i = 0; i < 14; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rr(0.3, 0.8), 0), dark);
    rock.position.set(58 + rr(-13, 13), rr(0.2, 0.5), -24 + rr(-9, 9));
    rock.rotation.set(rr(0, 3), rr(0, 3), rr(0, 3));
    g.add(rock);
  }

  // laurel and cypress
  for (const [x, z] of [[38, -14], [76, -8], [78, -38], [40, -38]]) g.add(cypress(ctx, x, z, rr(1.0, 1.3)));
  for (const [x, z] of [[34, -28], [80, -22], [46, -42]]) g.add(olive(ctx, x, z, rr(1, 1.3)));

  zoneSign(ctx, g, 'ROMA ANTICA', 'foro antico', 46, -17, -Math.PI / 2);

  // info stele
  const stele = box(1.1, 2.4, 0.5, dark);
  stele.position.set(58, 1.2, -37);
  g.add(stele);
  const plaque = signMesh('FORO ANTICO', { bg: '#d8c39c', fg: '#5a4530' }, 2.8, 0.7);
  plaque.position.set(58, 2.2, -36.7);
  g.add(plaque);
}

export function buildVenezia(ctx) {
  const g = zone(ctx, 'venezia');
  const water = makeWater('#2c6b74', '#7fb4b4', -0.25);
  const canal = new THREE.Mesh(new THREE.PlaneGeometry(94, 14), water);
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(-10, -0.3, -70);
  g.add(canal);
  ctx.waterMats.push(water);

  const bank = mat('#c9b899', 0.95);
  for (const z of [-63, -77]) {
    const wall = box(94, 0.6, 0.8, ctx.materials.stone);
    wall.position.set(-10, 0.05, z);
    g.add(wall);
    const edge = box(94, 0.08, 0.3, bank);
    edge.position.set(-10, 0.36, z + (z > -70 ? -0.3 : 0.3));
    g.add(edge);
  }

  // bridge
  const bridge = new THREE.Group();
  const deck = box(8, 0.3, 15, ctx.materials.stone);
  deck.position.y = 0.15;
  bridge.add(deck);
  for (const sx of [-1, 1]) {
    for (let i = -3; i <= 3; i++) {
      const post = box(0.12, 1.0, 0.12, ctx.materials.stone);
      post.position.set(sx * 3.8, 0.7, i * 2.2);
      bridge.add(post);
    }
    const rail = box(0.1, 0.12, 14.5, ctx.materials.stone);
    rail.position.set(sx * 3.8, 1.1, 0);
    bridge.add(rail);
  }
  const lamp1 = lampPost(ctx, -3.8, -4, false);
  lamp1.position.y = 0.3;
  bridge.add(lamp1);
  bridge.position.set(-10, 0, -70);
  g.add(bridge);

  // gondola
  const gondola = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#1d2222', roughness: 0.35, metalness: 0.15 });
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 3.4, 8, 16), hullMat);
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(0.5, 1, 1.4);
  hull.position.y = 0.25;
  hull.castShadow = true;
  gondola.add(hull);
  const prow = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 6), mat('#c9a45c', 0.4, 0.7));
  prow.rotation.z = -Math.PI / 2;
  prow.position.set(2.3, 0.45, 0);
  gondola.add(prow);
  for (const s of [-1, 1]) {
    const seat = box(0.8, 0.2, 0.7, mat('#8c2f3d', 0.85));
    seat.position.set(s * 0.5, 0.65, 0);
    gondola.add(seat);
  }
  // gondolier
  const man = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 5, 8), mat('#e7e1d2', 0.9));
  body.position.y = 1.2;
  man.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat('#d79b72', 0.8));
  head.position.y = 1.72;
  man.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 12), mat('#d9c48e', 0.9));
  hat.position.y = 1.85;
  man.add(hat);
  const oar = cylinder(0.04, 0.04, 3.2, mat('#b09a74', 0.8), 6);
  oar.position.set(0.6, 1.3, 0.6);
  oar.rotation.z = -0.8;
  oar.rotation.x = 0.3;
  man.add(oar);
  man.position.set(-1.6, 0, 0);
  gondola.add(man);
  gondola.position.set(5, 0.06, -69.5);
  gondola.rotation.y = 0.1;
  g.add(gondola);
  ctx.gondola = gondola;

  // striped mooring poles
  for (const [x, z] of [[-20, -74], [18, -66.5], [-34, -66], [28, -74]]) {
    for (let i = 0; i < 4; i++) {
      const seg = cylinder(0.13, 0.15, 0.7, mat(i % 2 ? '#c9453f' : '#efe7d5', 0.8), 8);
      seg.position.set(x, 0.5 + i * 0.7, z);
      g.add(seg);
    }
  }

  // Venetian houses across the canal
  const colors = ['#d7a57a', '#c88772', '#b9a06d', '#d6b8a0', '#c98b73', '#e0c09a'];
  colors.forEach((color, i) => {
    addBuilding(ctx, {
      x: -38 + i * 12, z: -85, w: 9, d: 8, h: rr(13, 17), color,
      rotY: 0, floors: 4, shutters: true, balconies: true, flowers: true,
      door: true, roofColor: '#a35a3c', target: g, dlc: 'venezia'
    });
  });

  // bridge lamps
  const bl1 = lampPost(ctx, -15, -79, false);
  const bl2 = lampPost(ctx, -5, -61, false);
  g.add(bl1, bl2);

  zoneSign(ctx, g, 'VENEZIA', 'canale sereno', -24, -57, 0);
}

export function buildAmore(ctx) {
  const g = zone(ctx, 'amore');
  const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 40), new THREE.MeshStandardMaterial({ color: '#c9bca0', roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(-30, 0.02, -32);
  g.add(ground);

  // rose arch
  const arch = new THREE.Group();
  for (const s of [-1, 1]) {
    const col = cylinder(0.16, 0.2, 2.4, mat('#efe4cf', 0.9), 8);
    col.position.set(s * 2.2, 1.2, 0);
    arch.add(col);
  }
  const top = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.19, 8, 28, Math.PI), mat('#efe4cf', 0.9));
  top.position.y = 2.4;
  arch.add(top);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI;
    const rose = new THREE.Mesh(new THREE.SphereGeometry(rr(0.12, 0.2), 6, 5), mat(pick(['#c4576b', '#d9778b', '#e8b7c2', '#b64c4c']), 0.85));
    rose.position.set(Math.cos(a) * 2.2 + rr(-0.15, 0.15), 2.4 + Math.sin(a) * 2.2 + rr(-0.12, 0.12), rr(-0.15, 0.15));
    arch.add(rose);
  }
  arch.position.set(-30, 0, -37);
  g.add(arch);

  // pergola
  const pergola = new THREE.Group();
  for (const s of [-1, 1]) {
    const post = box(0.12, 2.8, 0.12, mat('#efe4cf', 0.9));
    post.position.set(s * 3.2, 1.4, 0);
    pergola.add(post);
  }
  for (let i = -3; i <= 3; i++) {
    const beam = box(0.12, 2.4, 0.08, mat('#efe4cf', 0.9));
    beam.position.set(i, 3.4, 0);
    beam.rotation.x = Math.PI / 2;
    pergola.add(beam);
  }
  pergola.position.set(-36, 0, -31);
  g.add(pergola);
  for (let i = 0; i < 12; i++) {
    const rose = new THREE.Mesh(new THREE.SphereGeometry(rr(0.1, 0.18), 6, 5), mat('#c4576b', 0.85));
    rose.position.set(-36 + rr(-3, 3), 2.6 + rr(0, 0.7), -31 + rr(-0.6, 0.6));
    g.add(rose);
  }

  for (const [x, z] of [[-24, -36], [-36, -36], [-24, -28], [-36, -28]]) {
    g.add(flowerBed(ctx, x, z, rr(0.9, 1.5)));
  }
  for (const [x, z, r] of [[-34, -34, 0.8], [-26, -34, 0.7], [-34, -26, 0.6]]) {
    const b = bench(ctx, x, z, Math.PI);
    g.add(b);
  }

  // small fountain
  const f = new THREE.Group();
  const basin = cylinder(1.5, 1.6, 0.5, mat('#cfc3ab', 0.92), 22);
  basin.position.y = 0.25;
  f.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.35, 22), new THREE.MeshPhysicalMaterial({ color: '#7cc6c9', transparent: true, opacity: 0.8, roughness: 0.1 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.49;
  f.add(water);
  const spout = cylinder(0.2, 0.28, 0.8, mat('#c5b99f', 0.9), 10);
  spout.position.y = 0.8;
  f.add(spout);
  f.position.set(-30, 0, -33);
  g.add(f);
  addCollider(ctx, -30, -33, 1.2, 1.2, 'amore');

  // lanterns and petals
  for (const [x, z] of [[-22, -26], [-38, -26], [-22, -38], [-38, -38]]) {
    const pole = cylinder(0.04, 0.05, 2.2, ctx.materials.iron, 6);
    pole.position.set(x, 1.1, z);
    g.add(pole);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), ctx.lampBulb);
    lantern.position.set(x, 2.2, z);
    g.add(lantern);
  }
  for (let i = 0; i < 60; i++) {
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.06, 5), new THREE.MeshStandardMaterial({ color: '#c4576b', roughness: 0.8, side: THREE.DoubleSide }));
    petal.rotation.x = -Math.PI / 2;
    petal.position.set(-30 + rr(-10, 10), 0.04, -32 + rr(-9, 9));
    g.add(petal);
  }

  zoneSign(ctx, g, 'GIARDINO DEGLI INNAMORATI', 'amore & nozze', -30, -24, 0);
}

export function buildPets(ctx) {
  const g = zone(ctx, 'pets');
  addBuilding(ctx, {
    x: -30, z: 34, w: 9, d: 7, h: 4.5, color: '#e6cfa8', rotY: Math.PI,
    floors: 1, shutters: true, balconies: false, flowers: true,
    sign: 'RIFUGIO CUCCIOLI', signSub: 'adotta un amico', signColor: '#f4e8d3',
    target: g, dlc: 'pets', roofColor: '#a85d3d'
  });
  // fence
  const fenceMat = ctx.materials.wood;
  const yard = { x1: -26, x2: -14, z1: 26, z2: 35 };
  for (let x = yard.x1; x <= yard.x2; x += 1.5) {
    for (const z of [yard.z1, yard.z2, x === yard.x1 || x === yard.x2 ? 0 : null]) {
      if (z === null) continue;
      const p = box(0.08, 1.0, 0.08, fenceMat);
      p.position.set(x, 0.5, z);
      g.add(p);
    }
  }
  for (let z = yard.z1; z <= yard.z2; z += 1.5) {
    for (const x of [yard.x1, yard.x2]) {
      const p = box(0.08, 1.0, 0.08, fenceMat);
      p.position.set(x, 0.5, z);
      g.add(p);
    }
  }
  for (const z of [yard.z1, yard.z2]) {
    const rail = box(yard.x2 - yard.x1, 0.08, 0.08, fenceMat);
    rail.position.set((yard.x1 + yard.x2) / 2, 0.75, z);
    g.add(rail);
  }
  for (const x of [yard.x1, yard.x2]) {
    const rail = box(0.08, 0.08, yard.z2 - yard.z1, fenceMat);
    rail.position.set(x, 0.75, (yard.z1 + yard.z2) / 2);
    g.add(rail);
  }

  // doghouse
  const house = new THREE.Group();
  const base = box(1.8, 1.4, 1.6, mat('#b06a4a', 0.95));
  base.position.y = 0.7;
  house.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 4), mat('#7c4a34', 0.95));
  roof.position.y = 1.7;
  roof.rotation.y = Math.PI / 4;
  house.add(roof);
  const doorHole = new THREE.Mesh(new THREE.CircleGeometry(0.38, 12), mat('#2c211a', 0.9));
  doorHole.position.set(0, 0.62, 0.81);
  house.add(doorHole);
  house.position.set(-18, 0, 33.5);
  g.add(house);

  // bowls and toys
  for (const [x, z, c] of [[-21, 31.8, '#c4576b'], [-20, 31.8, '#4aa8b8']]) {
    const bowl = cylinder(0.2, 0.15, 0.1, mat(c, 0.7), 10);
    bowl.position.set(x, 0.05, z);
    g.add(bowl);
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat('#d9b25f', 0.8));
  ball.position.set(-19, 0.18, 29);
  g.add(ball);

  const dog = buildPet('dog', '#c79a62');
  dog.group.position.set(-23, 0, 29.5);
  dog.group.rotation.y = 1.2;
  g.add(dog.group);
  ctx.shelterPets = [dog];

  const cat = buildPet('cat', '#6b6b6b');
  cat.group.position.set(-16, 0, 31);
  cat.group.rotation.y = -1.3;
  g.add(cat.group);
  ctx.shelterPets.push(cat);

  for (const [x, z] of [[-12, 36], [-34, 22], [-10, 25]]) {
    const t = olive(ctx, x, z, rr(0.9, 1.2));
    g.add(t);
  }

  zoneSign(ctx, g, 'CUCCIOLI & CASA', 'rifugio cuccioli', -24, 24, Math.PI / 2);
}
