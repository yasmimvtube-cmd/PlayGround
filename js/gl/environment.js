import * as THREE from 'three';
import { mat, emissiveMat, canvasTexture, grassTexture, cobbleTexture, sandTexture, clamp, rr, rnd } from './helpers.js';

export const SKY_KEYS = [
  { h: 0,    top: '#080f22', hor: '#17233e', sun: '#ffe6c0', sunI: 0.0, hemiSky: '#2c3f63', hemiGround: '#191c1c', hemiI: 0.42, fog: '#131d31' },
  { h: 4.5,  top: '#0b1530', hor: '#283a58', sun: '#ffd2a0', sunI: 0.0, hemiSky: '#31446a', hemiGround: '#1c1e1e', hemiI: 0.45, fog: '#1a2741' },
  { h: 6.2,  top: '#3c5a86', hor: '#e7a77e', sun: '#ffb877', sunI: 1.35, hemiSky: '#7c93bd', hemiGround: '#4f4636', hemiI: 0.7, fog: '#b28a7e' },
  { h: 8.5,  top: '#4d8cbb', hor: '#d8e6e2', sun: '#fff0cf', sunI: 2.15, hemiSky: '#a9c4dd', hemiGround: '#6b634c', hemiI: 0.9, fog: '#c9d8d6' },
  { h: 13,   top: '#3a83bb', hor: '#e2eeee', sun: '#fff6e5', sunI: 2.5, hemiSky: '#b8d3e5', hemiGround: '#75704f', hemiI: 1.0, fog: '#d8e6e4' },
  { h: 17.3, top: '#4c78a8', hor: '#f0d2a6', sun: '#ffe2b0', sunI: 2.2, hemiSky: '#b0bfd0', hemiGround: '#6a6047', hemiI: 0.9, fog: '#d9c3ac' },
  { h: 19.2, top: '#454b7d', hor: '#f09e65', sun: '#ff9b55', sunI: 1.5, hemiSky: '#a98ba0', hemiGround: '#4b3c36', hemiI: 0.7, fog: '#c28c74' },
  { h: 20.8, top: '#1f2a50', hor: '#6f556f', sun: '#ffb077', sunI: 0.2, hemiSky: '#4e587c', hemiGround: '#29241f', hemiI: 0.5, fog: '#3b3a50' },
  { h: 24,   top: '#080f22', hor: '#17233e', sun: '#ffe6c0', sunI: 0.0, hemiSky: '#2c3f63', hemiGround: '#191c1c', hemiI: 0.42, fog: '#131d31' }
];

function lerpColor(a, b, k) {
  return new THREE.Color(a).lerp(new THREE.Color(b), k);
}

export function sampleSky(hour) {
  let a = SKY_KEYS[0], b = SKY_KEYS[1];
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    if (hour >= SKY_KEYS[i].h && hour <= SKY_KEYS[i + 1].h) { a = SKY_KEYS[i]; b = SKY_KEYS[i + 1]; break; }
  }
  const k = (hour - a.h) / Math.max(0.001, b.h - a.h);
  return {
    top: lerpColor(a.top, b.top, k),
    hor: lerpColor(a.hor, b.hor, k),
    sun: lerpColor(a.sun, b.sun, k),
    fog: lerpColor(a.fog, b.fog, k),
    hemiSky: lerpColor(a.hemiSky, b.hemiSky, k),
    hemiGround: lerpColor(a.hemiGround, b.hemiGround, k),
    sunI: a.sunI + (b.sunI - a.sunI) * k,
    hemiI: a.hemiI + (b.hemiI - a.hemiI) * k
  };
}

export function createContext(renderer, scene) {
  const plaster = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const a = rnd() * 0.05;
      ctx.fillStyle = rnd() > 0.5 ? `rgba(70,50,35,${a})` : `rgba(255,255,255,${a})`;
      const s = 1 + rnd() * 3;
      ctx.fillRect(rnd() * w, rnd() * h, s, s);
    }
  }, 2, 2);

  const windowMat = new THREE.MeshStandardMaterial({
    color: '#2b3942', emissive: '#ffb266', emissiveIntensity: 0, roughness: 0.35, metalness: 0.15
  });
  const lampBulb = new THREE.MeshStandardMaterial({
    color: '#ffe3b0', emissive: '#ffc27a', emissiveIntensity: 0.1, roughness: 0.4
  });
  const stringBulb = new THREE.MeshStandardMaterial({
    color: '#ffe8c2', emissive: '#ffbb70', emissiveIntensity: 0.15, roughness: 0.5
  });

  const ctx = {
    renderer, scene,
    colliders: [],
    lampLights: [],
    windowMats: [windowMat],
    glowMats: [lampBulb, stringBulb],
    windowMat, lampBulb, stringBulb,
    materials: {
      plaster,
      trunk: mat('#6c4d34', 0.95),
      palmTrunk: mat('#7c6042', 0.95),
      stone: mat('#c9bca6', 0.9),
      darkStone: mat('#9d917d', 0.9),
      cream: mat('#efe0c8', 0.9),
      terracotta: mat('#b65f38', 0.9),
      path: new THREE.MeshStandardMaterial({ color: '#c9b99d', roughness: 0.96, map: plaster }),
      iron: mat('#333631', 0.55, 0.4),
      wood: mat('#7d5636', 0.9),
      leaf: mat('#5d7a43', 0.95),
      awning: new THREE.MeshStandardMaterial({ map: canvasTexture(256, 64, (c, w, h) => {
        c.fillStyle = '#efe4cf'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#b6503f';
        for (let i = 0; i < 8; i += 2) c.fillRect((i * w) / 8, 0, w / 8, h);
        c.fillStyle = 'rgba(0,0,0,.06)';
        for (let y = 0; y < h; y += 7) c.fillRect(0, y, w, 2);
      }, 2, 1), roughness: 0.85 }),
      windowMat, lampBulb, stringBulb
    },
    sky: null, sunLight: null, hemi: null, waterMats: [], clouds: [], rain: null,
    npcs: [], pet: null, spots: {}, dlcGroups: {},
    playerPos: new THREE.Vector3(),
    hour: 17.5,
    weather: 'sunny',
    nightFactor: 0
  };

  ctx.groundGroup = new THREE.Group();
  ctx.cityGroup = new THREE.Group();
  ctx.dlcGroup = new THREE.Group();
  scene.add(ctx.groundGroup, ctx.cityGroup, ctx.dlcGroup);

  buildSky(ctx);
  buildLights(ctx);
  buildGround(ctx);
  return ctx;
}

function buildSky(ctx) {
  const uniforms = {
    topColor: { value: new THREE.Color('#4d8cbb') },
    horizonColor: { value: new THREE.Color('#d8e6e2') },
    sunColor: { value: new THREE.Color('#fff0cf') },
    sunDirection: { value: new THREE.Vector3(0.3, 0.7, 0.2).normalize() },
    sunStrength: { value: 1 },
    haze: { value: 0.25 }
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(520, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 sunColor;
        uniform vec3 sunDirection; uniform float sunStrength; uniform float haze;
        varying vec3 vDir;
        void main(){
          vec3 dir = normalize(vDir);
          float h = clamp(dir.y, 0.0, 1.0);
          vec3 col = mix(horizonColor, topColor, pow(h, 0.52));
          float sunDot = max(dot(dir, normalize(sunDirection)), 0.0);
          float disc = pow(sunDot, 900.0);
          float glow = pow(sunDot, 14.0);
          col += sunColor * (disc * 1.8 + glow * 0.20) * sunStrength;
          float hazeBand = exp(-pow((h - 0.01) * 14.0, 2.0)) * haze;
          col = mix(col, horizonColor * 1.04, hazeBand);
          gl_FragColor = vec4(col, 1.0);
        }`
    })
  );
  sky.frustumCulled = false;
  ctx.scene.add(sky);
  uniforms.sunDirection.value = new THREE.Vector3(0.45, 0.38, 0.2).normalize();

  const starGeo = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < 900; i++) {
    const a = rnd() * Math.PI * 2;
    const y = 0.12 + rnd() * 0.85;
    const r = Math.sqrt(1 - y * y);
    positions.push(Math.cos(a) * r * 480, y * 480, Math.sin(a) * r * 480);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: '#f4ecd6', size: 1.8, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  ctx.scene.add(stars);

  ctx.sky = { mesh: sky, uniforms, stars, starMat };

  // clouds
  const cloudMat = new THREE.MeshBasicMaterial({ color: '#f7f2e9', transparent: true, opacity: 0.32, depthWrite: false });
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const count = 4 + Math.floor(rnd() * 4);
    for (let j = 0; j < count; j++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(rr(5, 11), 8, 6), cloudMat);
      p.position.set(rr(-12, 12), rr(-1.5, 1.5), rr(-5, 5));
      p.scale.y = rr(0.35, 0.55);
      g.add(p);
    }
    g.position.set(rr(-180, 180), rr(55, 85), rr(-150, 90));
    g.visible = false;
    ctx.scene.add(g);
    ctx.clouds.push(g);
  }

  // rain
  const rainGeo = new THREE.BufferGeometry();
  const rp = [];
  for (let i = 0; i < 1400; i++) rp.push(rr(-30, 30), rr(0, 26), rr(-30, 30));
  rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  const rainMat = new THREE.PointsMaterial({ color: '#cfe1e8', size: 0.075, transparent: true, opacity: 0.5, depthWrite: false });
  const rain = new THREE.Points(rainGeo, rainMat);
  rain.frustumCulled = false;
  rain.visible = false;
  ctx.scene.add(rain);
  ctx.rain = rain;
}

function buildLights(ctx) {
  const hemi = new THREE.HemisphereLight('#a9c4dd', '#6b634c', 0.9);
  ctx.scene.add(hemi);
  ctx.hemi = hemi;

  const sun = new THREE.DirectionalLight('#fff0cf', 2.4);
  sun.position.set(48, 62, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -75;
  sun.shadow.camera.right = 75;
  sun.shadow.camera.top = 75;
  sun.shadow.camera.bottom = -75;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 220;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  ctx.scene.add(sun);
  ctx.scene.add(sun.target);
  ctx.sunLight = sun;
}

function buildGround(ctx) {
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTexture(), color: '#a9b07a', roughness: 1 });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.03, 0);
  grass.receiveShadow = true;
  ctx.groundGroup.add(grass);

  const pathMat = ctx.materials.path;

  const piazza = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({ map: cobbleTexture(), color: '#efe7d6', roughness: 0.95 })
  );
  piazza.rotation.x = -Math.PI / 2;
  piazza.position.y = 0.02;
  piazza.receiveShadow = true;
  ctx.groundGroup.add(piazza);

  const border = new THREE.Mesh(new THREE.RingGeometry(20.1, 21.6, 72), mat('#d7c9b1', 0.95));
  border.rotation.x = -Math.PI / 2;
  border.position.y = 0.035;
  ctx.groundGroup.add(border);

  const road = new THREE.Mesh(new THREE.RingGeometry(22, 27, 72), pathMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.015;
  road.receiveShadow = true;
  ctx.groundGroup.add(road);

  addPath(ctx, 0, -20, 0, -29, 7);
  addPath(ctx, 20, 0, 25, 1, 6);
  addPath(ctx, -20, 2, -30, 6, 6.5);
  addPath(ctx, 0, 20, 0, 50, 7.5);
  addPath(ctx, 20, -10, 30, -14, 5);
  addPath(ctx, 20, 14, 30, 17, 5);
  addPath(ctx, -20, 8, -30, 16, 5.5);
  addPath(ctx, -26, 0, -27, -26, 4.5);
  addPath(ctx, -27, -26, -30, -30, 4);
  addPath(ctx, -26, 4, -46, 16, 5);
  addPath(ctx, -46, 16, -58, 18, 5);
  addPath(ctx, 30, -14, 48, -22, 5);
  addPath(ctx, 48, -22, 56, -24, 5);
  addPath(ctx, 0, -32, 0, -50, 5);
  addPath(ctx, 0, -50, -8, -61, 4.5);
  addPath(ctx, 8, -50, 28, -50, 4);
  addPath(ctx, -8, 20, -20, 28, 5);
  addPath(ctx, -8, 8, -12, 26, 4.5);
  addPath(ctx, 30, 17, 44, 30, 4);
  addPath(ctx, -46, 16, -50, 30, 4);

  // promenade boardwalk
  const promenade = new THREE.Mesh(new THREE.BoxGeometry(112, 0.08, 8), mat('#cbb28a', 0.95));
  promenade.position.set(0, 0.02, 52);
  promenade.receiveShadow = true;
  ctx.groundGroup.add(promenade);

  // beach
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(150, 46), new THREE.MeshStandardMaterial({ map: sandTexture(), color: '#e6d2ab', roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.01, 79);
  sand.receiveShadow = true;
  ctx.groundGroup.add(sand);

  // sea
  const water = makeWater('#2f7f8c', '#8dc4c4', 0.0);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(680, 380), water);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.38, 285);
  ctx.groundGroup.add(sea);
  ctx.waterMats.push(water);

  const foam = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 3.2),
    new THREE.MeshBasicMaterial({ color: '#f5f3e8', transparent: true, opacity: 0.4, depthWrite: false })
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(0, 0.005, 100.5);
  ctx.groundGroup.add(foam);
  ctx.foam = foam;

  // distant hills and island
  const hillMat = mat('#7c8557', 1);
  for (let i = 0; i < 8; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(rr(18, 34), 14, 10), hillMat);
    hill.position.set(-110 + i * 32 + rr(-8, 8), rr(-9, -2), -175 + rr(-20, 10));
    hill.scale.set(rr(1.1, 1.7), rr(0.5, 0.75), 1);
    ctx.groundGroup.add(hill);
  }
  for (let i = 0; i < 3; i++) {
    const island = new THREE.Mesh(new THREE.SphereGeometry(rr(22, 40), 12, 8), mat('#6f7b58', 1));
    island.position.set(rr(-180, 180), rr(-8, -3), 300 + rr(-30, 40));
    island.scale.set(rr(1.5, 2.4), rr(0.15, 0.3), 1);
    ctx.groundGroup.add(island);
  }

  // little distant town silhouette
  for (let i = 0; i < 16; i++) {
    const h = rr(5, 12);
    const b = new THREE.Mesh(new THREE.BoxGeometry(rr(4, 9), h, rr(4, 8)), mat(pickColor(), 0.95));
    b.position.set(rr(-92, 92), h / 2, -112 + rr(-18, 8));
    ctx.groundGroup.add(b);
    const r = new THREE.Mesh(new THREE.ConeGeometry(rr(3, 6), rr(2, 3.4), 4), mat('#a35a3c', 0.95));
    r.position.set(b.position.x, h + 1, b.position.z);
    r.rotation.y = Math.PI / 4;
    ctx.groundGroup.add(r);
  }
}

function pickColor() {
  const palette = ['#d8bb92', '#e2c9a4', '#c99c74', '#e8d4b5', '#c8a07d', '#dbb894'];
  return palette[Math.floor(rnd() * palette.length)];
}

export function addPath(ctx, x1, z1, x2, z2, width = 5) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(x2 - x1, z2 - z1);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, len), ctx.materials.path);
  mesh.position.set((x1 + x2) / 2, 0.012, (z1 + z2) / 2);
  mesh.rotation.y = angle;
  mesh.receiveShadow = true;
  ctx.groundGroup.add(mesh);
  return mesh;
}

export function makeWater(deep = '#2f7f8c', light = '#8dc4c4', y = -0.2) {
  const uniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color(deep) },
    uLight: { value: new THREE.Color(light) },
    uSunColor: { value: new THREE.Color('#ffd9a0') },
    uSunGlow: { value: 0.8 },
    uFogColor: { value: new THREE.Color('#d8e6e4') },
    uFogNear: { value: 60 },
    uFogFar: { value: 260 }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: false, fog: false,
    vertexShader: `
      varying vec3 vWorld;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uDeep; uniform vec3 uLight; uniform vec3 uSunColor;
      uniform float uSunGlow; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar;
      varying vec3 vWorld; varying vec2 vUv;
      void main(){
        float w1 = sin(vWorld.x * 0.16 + uTime * 0.55) * 0.5 + 0.5;
        float w2 = sin(vWorld.z * 0.21 - uTime * 0.4 + vWorld.x * 0.05) * 0.5 + 0.5;
        float w3 = sin((vWorld.x + vWorld.z) * 0.5 + uTime * 1.1) * 0.5 + 0.5;
        float waves = w1 * 0.45 + w2 * 0.35 + w3 * 0.2;
        vec3 col = mix(uDeep, uLight, waves * 0.42);
        float glint = pow(clamp(sin(vWorld.x * 0.62 + uTime * 1.4) * sin(vWorld.z * 0.57 - uTime * 1.0), 0.0, 1.0), 14.0);
        col += uSunColor * glint * 0.55 * uSunGlow;
        float flick = pow(w3, 22.0) * 0.22;
        col += vec3(1.0, 0.94, 0.82) * flick;
        float dist = distance(cameraPosition, vWorld);
        float fog = smoothstep(uFogNear, uFogFar, dist);
        col = mix(col, uFogColor, fog);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  return mat;
}

export function updateEnvironment(ctx, hour, weather, dt, camera, playerPos) {
  const sky = sampleSky(hour);
  const u = ctx.sky.uniforms;
  u.topColor.value.copy(sky.top);
  u.horizonColor.value.copy(sky.hor);
  u.sunColor.value.copy(sky.sun);
  u.sunStrength.value = clamp(sky.sunI / 2.5, 0.06, 1.2);

  const angle = ((hour - 6) / 12) * Math.PI;
  const sunY = Math.sin(angle);
  const sunDir = new THREE.Vector3(Math.cos(angle) * 0.85, Math.max(-0.6, sunY), 0.28).normalize();
  u.sunDirection.value.copy(sunDir);

  const day = clamp(sunY, 0, 1);
  const night = 1 - clamp((sunY + 0.08) * 5.5, 0, 1);
  ctx.nightFactor = night;

  if (weather === 'rain') {
    u.topColor.value.lerp(new THREE.Color('#5b6673'), 0.55);
    u.horizonColor.value.lerp(new THREE.Color('#9aa3aa'), 0.5);
    u.sunStrength.value *= 0.2;
    sky.fog.lerp(new THREE.Color('#8b949b'), 0.5);
  } else if (weather === 'cloudy') {
    u.topColor.value.lerp(new THREE.Color('#7d94ac'), 0.35);
    u.horizonColor.value.lerp(new THREE.Color('#c2c7c8'), 0.25);
    u.sunStrength.value *= 0.55;
  }

  ctx.sunLight.position.set(sunDir.x * 100, Math.max(4, sunDir.y * 100), sunDir.z * 100);
  ctx.sunLight.target.position.set(0, 0, 0);
  if (sunY > 0.02) {
    ctx.sunLight.color.copy(sky.sun);
    ctx.sunLight.intensity = sky.sunI * (weather === 'rain' ? 0.45 : weather === 'cloudy' ? 0.7 : 1);
  } else {
    ctx.sunLight.color.set('#91a8d8');
    ctx.sunLight.intensity = 0.35 * (weather === 'rain' ? 0.4 : 1);
    ctx.sunLight.position.set(-sunDir.x * 80, 55, -sunDir.z * 80);
  }

  ctx.hemi.color.copy(sky.hemiSky);
  ctx.hemi.groundColor.copy(sky.hemiGround);
  ctx.hemi.intensity = sky.hemiI * (weather === 'rain' ? 0.8 : 1);

  ctx.scene.fog.color.copy(sky.fog);
  ctx.scene.fog.near = weather === 'rain' ? 35 : 70;
  ctx.scene.fog.far = weather === 'rain' ? 190 : 300;

  for (const w of ctx.waterMats) {
    w.uniforms.uTime.value += dt;
    w.uniforms.uFogColor.value.copy(sky.fog);
    w.uniforms.uSunGlow.value = clamp(sky.sunI / 2.4, 0.08, 1.2);
    w.uniforms.uSunColor.value.copy(sky.sun);
    w.uniforms.uFogNear.value = ctx.scene.fog.near;
    w.uniforms.uFogFar.value = ctx.scene.fog.far;
  }
  if (ctx.foam) {
    ctx.foam.material.opacity = 0.28 + Math.sin(performance.now() * 0.001) * 0.1;
  }

  ctx.sky.starMat.opacity = night * (weather === 'sunny' ? 0.9 : 0.1);
  ctx.sky.stars.visible = night > 0.05;
  ctx.windowMat.emissiveIntensity = night * 1.5;
  ctx.lampBulb.emissiveIntensity = 0.15 + night * 2.2;
  ctx.stringBulb.emissiveIntensity = 0.1 + night * 2.6;
  for (const l of ctx.lampLights) l.intensity = night * 9;
  for (const c of ctx.clouds) {
    c.visible = weather !== 'sunny';
    c.position.x += dt * 0.7;
    if (c.position.x > 200) c.position.x = -200;
    c.children.forEach((p) => { p.material.color.set(weather === 'rain' ? '#aeb6bc' : '#f7f2e9'); p.material.opacity = weather === 'rain' ? 0.5 : 0.32; });
  }
  const rain = ctx.rain;
  rain.visible = weather === 'rain';
  if (rain.visible) {
    rain.position.set(playerPos.x, 0, playerPos.z);
    const pos = rain.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - dt * 26;
      if (y < 0) y += 26;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }
  ctx.sky.mesh.position.copy(camera.position);
  ctx.sky.stars.position.copy(camera.position);
}
