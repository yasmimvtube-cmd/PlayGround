import * as THREE from 'three';

const mat = (color, roughness = 0.78, metalness = 0.02) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function capsule(radius, length, material) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function buildCharacter({
  skin = '#e8b690', hair = '#2a1c17', hairStyle = 'short',
  top = '#f3e7d3', bottom = '#3f5b6b', shoes = '#2e2723', accent = '#c4573f',
  dress = false, scale = 1
} = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);

  const skinMat = mat(skin, 0.72);
  const hairMat = mat(hair, 0.82);
  const topMat = mat(top, 0.86);
  const bottomMat = mat(bottom, 0.9);
  const shoeMat = mat(shoes, 0.55, 0.08);
  const accentMat = mat(accent, 0.65);

  // hips / torso
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.178, 0.16, 6, 12), bottomMat);
  hips.position.y = 1.02;
  hips.scale.set(1.12, 0.72, 0.82);
  hips.castShadow = true;
  body.add(hips);

  const torso = capsule(0.165, 0.3, topMat);
  torso.position.y = 1.265;
  torso.scale.set(1.16, 1, 0.82);
  body.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), topMat);
  chest.position.set(0, 1.41, 0.015);
  chest.scale.set(1.12, 0.66, 0.84);
  chest.castShadow = true;
  body.add(chest);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.023, 8, 20), accentMat);
  collar.position.set(0, 1.555, 0.015);
  collar.rotation.x = Math.PI / 2;
  body.add(collar);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.075, 0.1, 10), skinMat);
  neck.position.y = 1.6;
  neck.castShadow = true;
  body.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.73;
  body.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 16), skinMat);
  skull.scale.set(0.92, 1.06, 0.94);
  skull.castShadow = true;
  head.add(skull);

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), skinMat);
  jaw.position.set(0, -0.055, 0.025);
  jaw.scale.set(0.95, 0.85, 0.9);
  head.add(jaw);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.055, 8), skinMat);
  nose.position.set(0, -0.005, 0.14);
  nose.rotation.x = Math.PI / 2.1;
  head.add(nose);

  const eyeMat = mat('#241c18', 0.35);
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#f5eee4', roughness: 0.5 });
  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), whiteMat);
    white.position.set(side * 0.052, 0.015, 0.125);
    white.scale.set(1, 0.72, 0.45);
    head.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), eyeMat);
    pupil.position.set(side * 0.052, 0.013, 0.142);
    head.add(pupil);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.009, 0.014), hairMat);
    brow.position.set(side * 0.052, 0.058, 0.128);
    brow.rotation.z = side * -0.1;
    head.add(brow);
  }

  const lips = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.006, 6, 12, Math.PI), mat('#b65e58', 0.5));
  lips.position.set(0, -0.055, 0.132);
  lips.rotation.set(Math.PI, 0, Math.PI);
  head.add(lips);

  // ears
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), skinMat);
    ear.position.set(side * 0.138, 0, 0);
    ear.scale.set(0.45, 1, 0.7);
    head.add(ear);
  }

  // hair
  const hairGroup = new THREE.Group();
  head.add(hairGroup);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.152, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  cap.position.y = 0.02;
  cap.scale.set(0.98, 1.02, 1.02);
  cap.castShadow = true;
  hairGroup.add(cap);
  if (hairStyle === 'long') {
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.32, 5, 10), hairMat);
    back.position.set(0, -0.14, -0.055);
    back.scale.set(1.05, 1, 0.62);
    back.castShadow = true;
    hairGroup.add(back);
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.06), hairMat);
    fringe.position.set(0, 0.09, 0.115);
    fringe.rotation.x = 0.2;
    hairGroup.add(fringe);
  } else if (hairStyle === 'curly') {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = 0.135 + (i % 3) * 0.012;
      const coil = new THREE.Mesh(new THREE.SphereGeometry(0.055 + (i % 2) * 0.012, 8, 8), hairMat);
      coil.position.set(Math.cos(a) * r, 0.055 + Math.sin(a * 2) * 0.01, Math.sin(a) * r * 0.95);
      coil.castShadow = true;
      hairGroup.add(coil);
    }
  } else {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.05, 0.04), hairMat);
    side.position.set(0, 0.09, 0.115);
    side.rotation.x = 0.18;
    hairGroup.add(side);
  }

  // arms
  const arms = {};
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.218, 1.455, 0);
    body.add(pivot);
    const sleeve = capsule(0.058, 0.16, topMat);
    sleeve.position.y = -0.105;
    pivot.add(sleeve);
    const arm = capsule(0.052, 0.34, skinMat);
    arm.position.y = -0.33;
    pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), skinMat);
    hand.position.y = -0.55;
    hand.scale.set(0.85, 1.05, 0.75);
    hand.castShadow = true;
    pivot.add(hand);
    arms[side < 0 ? 'left' : 'right'] = pivot;
  }

  // legs
  const legs = {};
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.105, 0.94, 0);
    body.add(pivot);
    const leg = capsule(0.075, 0.44, dress ? skinMat : bottomMat);
    leg.position.y = -0.27;
    pivot.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.075, 0.22), shoeMat);
    shoe.position.set(0, -0.55, 0.04);
    shoe.castShadow = true;
    pivot.add(shoe);
    legs[side < 0 ? 'left' : 'right'] = pivot;
  }

  if (dress) {
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.33, 0.62, 18, 1, true), bottomMat);
    skirt.position.y = 0.84;
    skirt.castShadow = true;
    body.add(skirt);
    hips.visible = false;
    for (const k of ['left', 'right']) legs[k].children[0].material = skinMat;
  }

  let phase = 0;
  let currentSpeed = 0;

  function update(dt, speed = 0, sitting = false) {
    currentSpeed += (speed - currentSpeed) * Math.min(1, dt * 8);
    if (sitting) {
      body.position.y = -0.34;
      legs.left.rotation.x = -1.25;
      legs.right.rotation.x = -1.25;
      arms.left.rotation.x = -0.5;
      arms.right.rotation.x = -0.5;
      return;
    }
    body.position.y += (0 - body.position.y) * Math.min(1, dt * 6);
    phase += dt * (2.4 + currentSpeed * 6.2);
    const gait = Math.min(1, currentSpeed / 3.4);
    const swing = Math.sin(phase) * 0.62 * gait;
    legs.left.rotation.x = swing;
    legs.right.rotation.x = -swing;
    arms.left.rotation.x = -swing * 0.85;
    arms.right.rotation.x = swing * 0.85;
    arms.left.rotation.z = 0.08;
    arms.right.rotation.z = -0.08;
    body.position.y += Math.abs(Math.sin(phase)) * 0.025 * gait;
    torso.rotation.z = Math.sin(phase) * 0.022 * gait;
    chest.rotation.y = Math.sin(phase * 0.5) * 0.02;
    head.rotation.y = Math.sin(phase * 0.25) * 0.03 * (1 - gait);
    body.scale.y = 1 + Math.sin(phase * 0.5) * 0.004;
    if (gait < 0.1) {
      arms.left.rotation.x = Math.sin(performance.now() * 0.0012) * 0.02;
      arms.right.rotation.x = -Math.sin(performance.now() * 0.0012) * 0.02;
    }
  }

  function setColors(c) {
    if (c.skin) skinMat.color.set(c.skin);
    if (c.hair) hairMat.color.set(c.hair);
    if (c.top) topMat.color.set(c.top);
    if (c.bottom) bottomMat.color.set(c.bottom);
    if (c.shoes) shoeMat.color.set(c.shoes);
    if (c.accent) accentMat.color.set(c.accent);
  }

  return { group: root, body, head, hairGroup, parts: { arms, legs, torso, chest }, update, setColors };
}

export function buildPet(type = 'dog', coat = '#c79a62') {
  const root = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: coat, roughness: 0.92 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2b2420', roughness: 0.8 });
  const eye = new THREE.MeshStandardMaterial({ color: '#1c1713', roughness: 0.3 });
  const scale = type === 'cat' ? 0.7 : 1;
  const body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(type === 'cat' ? 0.12 : 0.17, type === 'cat' ? 0.26 : 0.36, 6, 10), fur);
  torso.rotation.z = Math.PI / 2;
  torso.position.set(0, 0.36, 0);
  torso.castShadow = true;
  body.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(type === 'cat' ? 0.13 : 0.16, 14, 12), fur);
  head.position.set(0, type === 'cat' ? 0.46 : 0.5, 0.28);
  head.castShadow = true;
  body.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(type === 'cat' ? 0.055 : 0.075, 10, 8), fur);
  snout.position.set(0, type === 'cat' ? 0.42 : 0.46, type === 'cat' ? 0.39 : 0.42);
  body.add(snout);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), dark);
  nose.position.set(0, type === 'cat' ? 0.44 : 0.48, type === 'cat' ? 0.435 : 0.47);
  body.add(nose);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(type === 'cat' ? 0.05 : 0.06, type === 'cat' ? 0.1 : 0.08, 4), fur);
    ear.position.set(side * (type === 'cat' ? 0.075 : 0.08), type === 'cat' ? 0.58 : 0.62, 0.27);
    ear.rotation.z = side * -0.2;
    body.add(ear);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), eye);
    e.position.set(side * 0.052, type === 'cat' ? 0.49 : 0.53, 0.39);
    body.add(e);
    const paw = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.16, 4, 6), fur);
    paw.position.set(side * 0.11, 0.13, 0.2);
    body.add(paw);
    const paw2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.15, 4, 6), fur);
    paw2.position.set(side * 0.11, 0.13, -0.18);
    body.add(paw2);
  }

  const tail = new THREE.Group();
  tail.position.set(0, 0.4, -0.3);
  body.add(tail);
  const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.24, 4, 6), fur);
  tailMesh.position.y = 0.1;
  tailMesh.rotation.x = -0.6;
  tail.add(tailMesh);
  if (type === 'cat') {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), fur);
    tip.position.set(0, 0.24, 0.05);
    tail.add(tip);
  }

  let phase = 0;
  function update(dt, moving = false, jump = 0) {
    phase += dt * (moving ? 9 : 3);
    if (moving) {
      body.position.y = Math.abs(Math.sin(phase)) * 0.045;
      body.rotation.z = Math.sin(phase) * 0.04;
    } else {
      body.position.y *= 0.9;
    }
    tail.rotation.z = Math.sin(phase * 0.9) * 0.5;
    root.position.y = jump;
  }

  return { group: root, update };
}
