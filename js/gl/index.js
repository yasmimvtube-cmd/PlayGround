import * as THREE from 'three';
import { createContext, updateEnvironment } from './environment.js';
import { buildFountain, buildDuomo, buildCafe, buildHome, buildGym } from './landmarks.js';
import { buildPiazzaProps, buildMarket, buildPromenade, buildFillerBuildings, buildTreesAndProps, buildNPCs } from './scenery.js';
import { buildMare, buildToscana, buildRoma, buildVenezia, buildModa, buildAmore, buildPets } from './districts.js';
import { addPath, makeWater } from './environment.js';
import { SPOTS, DLCS } from '../data.js';
import { isBlocked as blocked, rr } from './helpers.js';
import { buildPet } from '../character.js';

export function createWorld(renderer, scene) {
  scene.fog = new THREE.Fog('#d8e6e4', 70, 300);
  const ctx = createContext(renderer, scene);
  ctx.dlcEnabled = Object.fromEntries(DLCS.map((d) => [d.id, true]));

  buildBase(ctx);
  buildMare(ctx);
  buildToscana(ctx);
  buildRoma(ctx);
  buildVenezia(ctx);
  buildModa(ctx);
  buildAmore(ctx);
  buildPets(ctx);
  buildNPCs(ctx);
  buildParticles(ctx);
  buildSpotMarkers(ctx);

  function setDLC(id, on) {
    ctx.dlcEnabled[id] = !!on;
    if (ctx.dlcGroups[id]) ctx.dlcGroups[id].visible = !!on;
    if (id === 'pets' && !on && ctx.pet) {
      ctx.pet.model.group.visible = false;
    } else if (id === 'pets' && on && ctx.pet) {
      ctx.pet.model.group.visible = true;
    }
  }

  function setPet(type) {
    if (ctx.pet) {
      scene.remove(ctx.pet.model.group);
      ctx.pet = null;
    }
    if (!type) return;
    const model = buildPet(type, type === 'cat' ? '#6b6b6b' : '#c79a62');
    model.group.visible = ctx.dlcEnabled.pets;
    scene.add(model.group);
    ctx.pet = { type, model, pos: new THREE.Vector3(0, 0, 12), phase: 0 };
  }

  function update(dt, info) {
    const { hour, weather, playerPos, camera, playerSpeed = 0 } = info;
    ctx.hour = hour;
    ctx.weather = weather;
    ctx.playerPos.copy(playerPos);
    updateEnvironment(ctx, hour, weather, dt, camera, playerPos);
    updateNPCs(ctx, dt);
    updatePet(ctx, dt, playerPos);
    updateMarkers(ctx, dt, playerPos);
    updateParticles(ctx, dt, hour);
    updateAmbientProps(ctx, dt);
  }

  return {
    ctx, scene, renderer,
    update, setDLC, setPet,
    isBlocked: (x, z) => blocked(ctx, x, z),
    spots: SPOTS,
    dlcs: DLCS
  };
}

function buildBase(ctx) {
  buildFountain(ctx);
  buildDuomo(ctx);
  buildCafe(ctx);
  buildHome(ctx);
  buildGym(ctx);
  buildPiazzaProps(ctx);
  buildMarket(ctx);
  buildPromenade(ctx);
  buildFillerBuildings(ctx);
  buildTreesAndProps(ctx);
}

function buildSpotMarkers(ctx) {
  ctx.spotMarkers = {};
  for (const spot of SPOTS) {
    const g = new THREE.Group();
    g.position.set(spot.x, 0.04, spot.z);
    const ringMat = new THREE.MeshBasicMaterial({ color: spot.color, transparent: true, opacity: 0.65, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.055, 6, 40), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.58, 40), new THREE.MeshBasicMaterial({ color: spot.color, transparent: true, opacity: 0.2, depthWrite: false }));
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.045;
    g.add(ring2);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), new THREE.MeshBasicMaterial({ color: spot.color }));
    gem.position.y = 2.1;
    g.add(gem);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.1, 6),
      new THREE.MeshBasicMaterial({ color: spot.color, transparent: true, opacity: 0.18, depthWrite: false })
    );
    beam.position.y = 1.1;
    g.add(beam);
    const parent = spot.dlc ? ctx.dlcGroups[spot.dlc] : ctx.scene;
    parent.add(g);
    ctx.spotMarkers[spot.id] = { group: g, ring, ring2, gem, beam, color: spot.color, t: rr(0, 6) };
  }
}

function updateMarkers(ctx, dt, playerPos) {
  for (const id in ctx.spotMarkers) {
    const m = ctx.spotMarkers[id];
    m.t += dt;
    m.ring.rotation.z += dt * 0.35;
    m.gem.rotation.y += dt * 1.2;
    m.gem.position.y = 2.1 + Math.sin(m.t * 1.6) * 0.12;
    const near = playerPos.distanceTo(m.group.position) < 8;
    m.ring.material.opacity = 0.45 + Math.sin(m.t * 2) * 0.12 + (near ? 0.2 : 0);
    m.ring2.material.opacity = near ? 0.3 : 0.12;
    m.gem.scale.setScalar(near ? 1.35 : 1);
    m.beam.material.opacity = near ? 0.3 : 0.12;
  }
}

function updateNPCs(ctx, dt) {
  for (const npc of ctx.npcs) {
    if (npc.pause > 0) {
      npc.pause -= dt;
      npc.model.update(dt, 0);
      continue;
    }
    const target = npc.path[npc.index];
    const dx = target[0] - npc.pos.x;
    const dz = target[1] - npc.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.5) {
      npc.index = (npc.index + 1) % npc.path.length;
      npc.pause = rr(1.5, 5);
      continue;
    }
    const speed = 1.05;
    npc.pos.x += (dx / dist) * speed * dt;
    npc.pos.z += (dz / dist) * speed * dt;
    const yaw = Math.atan2(dx, dz);
    npc.model.group.rotation.y += (yaw - npc.model.group.rotation.y) * Math.min(1, dt * 6);
    npc.model.group.position.copy(npc.pos);
    npc.model.update(dt, speed);
  }
}

function updatePet(ctx, dt, playerPos) {
  const pet = ctx.pet;
  if (!pet) return;
  if (!ctx.dlcEnabled.pets) return;
  const targetX = playerPos.x - Math.sin(ctx.playerYaw || 0) * 1.4 + 0.7;
  const targetZ = playerPos.z - Math.cos(ctx.playerYaw || 0) * 1.4 + 0.5;
  const dx = targetX - pet.pos.x, dz = targetZ - pet.pos.z;
  const dist = Math.hypot(dx, dz);
  const moving = dist > 1.6;
  if (moving) {
    const speed = Math.min(3.2, 1.6 + dist * 1.4);
    pet.pos.x += (dx / dist) * speed * dt;
    pet.pos.z += (dz / dist) * speed * dt;
    const yaw = Math.atan2(dx, dz);
    pet.model.group.rotation.y += (yaw - pet.model.group.rotation.y) * Math.min(1, dt * 8);
  }
  pet.model.group.position.set(pet.pos.x, 0, pet.pos.z);
  pet.model.update(dt, moving);
  if (ctx.shelterPets) for (const p of ctx.shelterPets) p.update(dt, false);
}

function updateAmbientProps(ctx, dt) {
  const t = performance.now() * 0.001;
  if (ctx.gondola) {
    ctx.gondola.position.y = 0.06 + Math.sin(t * 0.9) * 0.035;
    ctx.gondola.rotation.z = Math.sin(t * 0.7) * 0.012;
  }
  if (ctx.sailboat) {
    ctx.sailboat.position.y = 0.18 + Math.sin(t * 0.6) * 0.06;
    ctx.sailboat.rotation.z = Math.sin(t * 0.5) * 0.018;
  }
  if (ctx.foam) ctx.foam.position.z = 100.5 + Math.sin(t * 0.4) * 0.8;
  if (ctx.fountainStreams) {
    const o = 0.45 + Math.sin(t * 2.2) * 0.1;
    for (const s of ctx.fountainStreams) s.material.opacity = o;
  }
}

function buildParticles(ctx) {
  const geo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 260; i++) {
    pts.push(rr(-45, 45), rr(0.4, 6), rr(-45, 45));
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.PointsMaterial({ color: '#ffe7b0', size: 0.055, transparent: true, opacity: 0.35, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  ctx.scene.add(points);
  ctx.dust = { points, mat, base: pts.slice() };
}

function updateParticles(ctx, dt, hour) {
  const dust = ctx.dust;
  if (!dust) return;
  const night = ctx.nightFactor;
  dust.mat.opacity = 0.1 + (1 - night) * 0.28;
  const pos = dust.points.geometry.attributes.position;
  const t = performance.now() * 0.0002;
  for (let i = 0; i < pos.count; i++) {
    const bx = dust.base[i * 3];
    const by = dust.base[i * 3 + 1];
    const bz = dust.base[i * 3 + 2];
    pos.setX(i, bx + Math.sin(t * 4 + i) * 0.8);
    pos.setY(i, by + Math.sin(t * 3 + i * 0.7) * 0.4);
    pos.setZ(i, bz + Math.cos(t * 3.6 + i) * 0.8);
  }
  pos.needsUpdate = true;
}
