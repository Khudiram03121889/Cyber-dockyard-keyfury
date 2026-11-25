import * as THREE from 'three';
import type { ProceduralTextureSet } from './textures';
import type { PropMaterials } from './props';

export interface FloorLayerResult {
  group: THREE.Group;
  floorMaterial: THREE.MeshPhysicalMaterial;
}

export interface HarborLayerResult {
  group: THREE.Group;
  vesselGroup: THREE.Group;
  waterUniforms: { uTime: { value: number }; uMood: { value: number } };
  trafficPoints: THREE.Points;
  mistSprites: THREE.Sprite[];
}

export interface CityLayerResult {
  group: THREE.Group;
  hologramMesh: THREE.Mesh;
  ringHalo: THREE.Mesh;
  airshipGroup: THREE.Group;
  cityWindowMat: THREE.MeshStandardMaterial;
}

export interface SkyLayerResult {
  group: THREE.Group;
  skyUniforms: {
    uZenithColor: { value: THREE.Color };
    uMidColor: { value: THREE.Color };
    uHorizonColor: { value: THREE.Color };
  };
  moonGroup: THREE.Group;
  sunGroup: THREE.Group;
  rainLines: THREE.LineSegments;
  rainPositions: Float32Array;
  cloudSprites: THREE.Sprite[];
}

/**
 * Layer 5 — Fighting Floor (Ground, Decals, Wet PBR Puddles & Quay Wall)
 * Playable platform: 36m wide (X: -18..18) × 14.5m deep (Z: -7.25..7.25)
 */
export function buildFightingFloorLayer(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
): FloorLayerResult {
  const group = new THREE.Group();
  group.name = 'Layer5_FightingFloor';

  // Main playable fighting deck (top surface flush at Y = 0)
  const floorMaterial = new THREE.MeshPhysicalMaterial({
    map: textures.floorAlbedo,
    roughnessMap: textures.floorRoughness,
    bumpMap: textures.floorBump,
    bumpScale: 0.035,
    roughness: 0.92,
    metalness: 0.28,
    clearcoat: 0.72,
    clearcoatRoughness: 0.14,
    envMapIntensity: 1.35,
  });

  const deckGeo = new THREE.PlaneGeometry(36, 14.5, 1, 1);
  const deckMesh = new THREE.Mesh(deckGeo, floorMaterial);
  deckMesh.rotation.x = -Math.PI / 2;
  deckMesh.position.set(0, 0, 0);
  deckMesh.receiveShadow = true;
  group.add(deckMesh);

  // Extended rear & side concrete quay apron + sea wall dropping down into harbor water (Y = -2.4m)
  const quayMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    bumpMap: textures.concreteBump,
    bumpScale: 0.05,
    roughness: 0.85,
    metalness: 0.12,
  });

  // Heavy pier foundation slab under deck so arena never floats
  const pierSlab = new THREE.Mesh(new THREE.BoxGeometry(58, 3.6, 22), quayMat);
  pierSlab.position.set(0, -1.82, 2.2);
  pierSlab.receiveShadow = true;
  group.add(pierSlab);

  // Left & Right extended industrial apron wings (beyond 36m playable zone for natural outdoor continuity)
  const sideDeckMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    roughness: 0.65,
    metalness: 0.25,
  });
  const leftApron = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 18), sideDeckMat);
  leftApron.position.set(-26, -0.14, 0.5);
  leftApron.receiveShadow = true;
  group.add(leftApron);

  const rightApron = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 18), sideDeckMat);
  rightApron.position.set(26, -0.14, 0.5);
  rightApron.receiveShadow = true;
  group.add(rightApron);

  // Front concrete apron extension toward camera (with steel grate foreground curb from Panel A & D)
  const frontApron = new THREE.Mesh(new THREE.BoxGeometry(44, 0.22, 6.5), sideDeckMat);
  frontApron.position.set(0, -0.13, 10.4);
  frontApron.receiveShadow = true;
  group.add(frontApron);

  // Heavy rubber dockside fenders along the harbor sea wall facing -Z
  const fenderMat = new THREE.MeshStandardMaterial({
    color: 0x171b22,
    roughness: 0.88,
    metalness: 0.08,
  });
  for (let fx = -16; fx <= 16; fx += 4.0) {
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.85, 0.45), fenderMat);
    fender.position.set(fx, -1.25, -8.9);
    group.add(fender);
  }

  // Harbor pier concrete pilings dipping into water
  const pilingGeo = new THREE.CylinderGeometry(0.55, 0.65, 4.0, 10);
  for (let px = -24; px <= 24; px += 6.0) {
    const piling = new THREE.Mesh(pilingGeo, mats.rustedSteel);
    piling.position.set(px, -2.1, -8.85);
    group.add(piling);
  }

  return { group, floorMaterial };
}

/**
 * Hero Cargo Vessel "K-37" moored alongside right-rear pier (Panels A, C, D!)
 */
function buildCargoVesselK37(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
): THREE.Group {
  const ship = new THREE.Group();
  ship.name = 'Vessel_K37';

  const hullMat = new THREE.MeshStandardMaterial({
    map: textures.vesselHullAlbedo,
    bumpMap: textures.vesselHullBump,
    bumpScale: 0.06,
    roughness: 0.54,
    metalness: 0.64,
  });

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a26,
    roughness: 0.72,
    metalness: 0.35,
  });

  const superMat = new THREE.MeshStandardMaterial({
    color: 0x455264,
    roughness: 0.58,
    metalness: 0.48,
  });

  // Sculpted Flared Ship Hull using ExtrudeGeometry for authentic pointed bow silhouette!
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-16, 0); // Pointed bow tip (facing left-front toward arena!)
  hullShape.quadraticCurveTo(-11, 4.4, -3, 5.1);
  hullShape.lineTo(18, 5.1);
  hullShape.lineTo(20, 3.6);
  hullShape.lineTo(20, -3.6);
  hullShape.lineTo(18, -5.1);
  hullShape.lineTo(-3, -5.1);
  hullShape.quadraticCurveTo(-11, -4.4, -16, 0);

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 7.4,
    bevelEnabled: true,
    bevelThickness: 0.45,
    bevelSize: 0.35,
    bevelSegments: 2,
  });
  hullGeo.rotateX(-Math.PI / 2);

  // Normalize UVs on extruded hull sides so "K-37" reads crisply along the starboard bow!
  const pos = hullGeo.attributes.position;
  const uv = hullGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const u = (vx + 16) / 36;
    const v = vy / 7.8;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;

  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.position.y = -1.6;
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  ship.add(hullMesh);

  // Dedicated high-clarity bow nameplate plane curved slightly on the front-facing bow side for crystal-clear "K-37" readability!
  const deck = new THREE.Mesh(new THREE.BoxGeometry(28, 0.35, 9.2), deckMat);
  deck.position.set(4.5, 5.95, 0);
  ship.add(deck);

  // Raised forecastle bow deck & bulwark lip
  const forecastle = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.35, 7.6), superMat);
  forecastle.position.set(-8.5, 6.45, 0);
  ship.add(forecastle);

  // Anchor hawsepipe & heavy dark iron anchor on the visible bow flank
  const anchorRecess = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), mats.darkSteel);
  anchorRecess.rotation.x = Math.PI / 2;
  anchorRecess.position.set(-10.8, 4.2, 3.65);
  ship.add(anchorRecess);

  // Forward Mast & Radar Crossbar on bow
  const bowMast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 6.2, 8), mats.darkSteel);
  bowMast.position.set(-9.6, 9.8, 0);
  ship.add(bowMast);
  const bowCross = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 3.4), mats.darkSteel);
  bowCross.position.set(-9.6, 11.4, 0);
  ship.add(bowCross);

  // Red Port Navigation Beacon on Bow Rail (clearly visible in Panel A & C!)
  const navLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), mats.redNeon);
  navLight.position.set(-11.2, 7.35, 3.3);
  ship.add(navLight);

  // Mid-ship Cargo Hatch Covers & Deck Containers
  for (const hx of [-2.0, 3.6]) {
    const hatch = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.2, 6.8), mats.darkSteel);
    hatch.position.set(hx, 6.65, 0);
    ship.add(hatch);
  }

  // Multi-Tier Bridge Superstructure (Aft-Right) with Warm Illuminated Bridge Windows
  const bridgeBase = new THREE.Mesh(new THREE.BoxGeometry(8.5, 5.2, 8.6), superMat);
  bridgeBase.position.set(12.2, 8.6, 0);
  bridgeBase.castShadow = true;
  ship.add(bridgeBase);

  const bridgeUpper = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.2, 9.6), superMat);
  bridgeUpper.position.set(12.6, 12.6, 0);
  ship.add(bridgeUpper);

  // Bridge windows glowing warm amber
  const bridgeWindow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 7.8), mats.amberLamp);
  bridgeWindow.position.set(9.15, 13.0, 0);
  ship.add(bridgeWindow);

  for (const wy of [7.8, 9.8]) {
    for (const wz of [-2.4, 0, 2.4]) {
      const porthole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 1.15), mats.amberLamp);
      porthole.position.set(7.9, wy, wz);
      ship.add(porthole);
    }
  }

  // Ship Smokestack Funnel & Radar Array
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.35, 4.4, 12), mats.rustedSteel);
  funnel.position.set(15.2, 15.8, 0);
  ship.add(funnel);

  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.25, 5.4, 8), mats.darkSteel);
  radarMast.position.set(11.6, 16.5, 0);
  ship.add(radarMast);
  const radarBar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 3.8), mats.darkSteel);
  radarBar.position.set(11.6, 18.2, 0);
  ship.add(radarBar);

  return ship;
}

/**
 * Layer 3 — Harbor Water, Cargo Vessel K-37, Elevated Harbor Bridge & Low Mist
 */
export function buildHarborLayer(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
): HarborLayerResult {
  const group = new THREE.Group();
  group.name = 'Layer3_HarborAndShip';

  // 1. Expansive Harbor Water Plane with Real-Time Animated Normal Ripples (onBeforeCompile on MeshPhysicalMaterial)
  const waterUniforms = {
    uTime: { value: 0 },
    uMood: { value: 0 }, // 0 = Night-Rainy, 1 = Sunset
  };

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1a2e,
    roughness: 0.14,
    metalness: 0.72,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5,
  });

  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.uTime;
    shader.uniforms.uMood = waterUniforms.uMood;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        varying vec3 vWorldPos;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        float w1 = sin(wp.x * 0.22 + uTime * 1.15) * cos(wp.z * 0.18 + uTime * 0.9) * 0.14;
        float w2 = sin(wp.x * 0.55 - uTime * 1.8 + wp.z * 0.42) * 0.05;
        transformed.z += (w1 + w2);
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform float uMood;
        varying vec3 vWorldPos;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        // Animated city neon & moon/sun shimmer bands reflected across harbor water
        float ripple = sin(vWorldPos.x * 0.9 + uTime * 2.4 + sin(vWorldPos.z * 0.35)) * 0.5 + 0.5;
        float fineRipple = sin(vWorldPos.z * 1.6 - uTime * 3.1 + vWorldPos.x * 0.35) * 0.5 + 0.5;
        float distFade = smoothstep(-8.0, -78.0, vWorldPos.z);
        float centerBand = exp(-pow(vWorldPos.x * 0.032, 2.0));
        vec3 nightRefl = mix(vec3(0.03, 0.24, 0.36), vec3(0.28, 0.08, 0.32), smoothstep(-35.0, 25.0, vWorldPos.x));
        nightRefl += vec3(0.18, 0.45, 0.65) * centerBand * pow(ripple * fineRipple, 1.6);
        vec3 sunsetRefl = vec3(0.95, 0.42, 0.12) * (0.28 + 0.85 * centerBand * pow(ripple * fineRipple, 1.4));
        vec3 reflCol = mix(nightRefl, sunsetRefl, uMood);
        totalEmissiveRadiance += reflCol * (0.35 + 0.65 * distFade) * (0.55 + 0.45 * ripple);`,
      );
  };

  const waterGeo = new THREE.PlaneGeometry(460, 290, 96, 64);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(0, -2.4, -135);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // 2. Hero Moored Cargo Vessel "K-37" (right-rear harbor, bow angled cleanly into view!)
  const vesselGroup = buildCargoVesselK37(textures, mats);
  vesselGroup.position.set(27.5, -2.2, -19.5);
  vesselGroup.rotation.y = 0.24;
  group.add(vesselGroup);

  // 3. Distant Multi-Span Harbor Bridge spanning across the bay (Z = -68m, Panel A!)
  const bridgeGroup = new THREE.Group();
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0x202b3d,
    roughness: 0.72,
    metalness: 0.45,
  });

  // Main upper & lower bridge decks
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(240, 1.8, 5.5), bridgeMat);
  bridgeDeck.position.set(0, 6.2, -68);
  bridgeGroup.add(bridgeDeck);

  // Bridge piers resting in harbor water + connecting steel arches
  for (let px = -96; px <= 96; px += 16) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(2.4, 9.6, 5.2), bridgeMat);
    pier.position.set(px, 1.8, -68);
    bridgeGroup.add(pier);

    // Streetlight pole & glowing lamp along bridge top
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6), mats.darkSteel);
    pole.position.set(px, 8.6, -65.5);
    bridgeGroup.add(pole);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.35), mats.cyanNeon);
    lamp.position.set(px, 10.2, -65.5);
    bridgeGroup.add(lamp);
  }
  group.add(bridgeGroup);

  // Animated Moving Vehicle Headlights / Taillights crossing the bridge!
  const carCount = 36;
  const carPos = new Float32Array(carCount * 3);
  const carColors = new Float32Array(carCount * 3);
  for (let i = 0; i < carCount; i++) {
    const eastbound = i % 2 === 0;
    carPos[i * 3] = -110 + (i / carCount) * 220;
    carPos[i * 3 + 1] = 7.45;
    carPos[i * 3 + 2] = eastbound ? -65.6 : -66.6;
    if (eastbound) {
      carColors[i * 3] = 1.0;
      carColors[i * 3 + 1] = 0.88;
      carColors[i * 3 + 2] = 0.65;
    } else {
      carColors[i * 3] = 1.0;
      carColors[i * 3 + 1] = 0.22;
      carColors[i * 3 + 2] = 0.28;
    }
  }
  const carGeo = new THREE.BufferGeometry();
  carGeo.setAttribute('position', new THREE.BufferAttribute(carPos, 3));
  carGeo.setAttribute('color', new THREE.BufferAttribute(carColors, 3));
  const carMat = new THREE.PointsMaterial({
    size: 0.95,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const trafficPoints = new THREE.Points(carGeo, carMat);
  group.add(trafficPoints);

  // 4. Low-Lying Harbor Mist Sprites drifting gently above the water in front of the bridge (Panel A!)
  const mistSprites: THREE.Sprite[] = [];
  for (let i = 0; i < 12; i++) {
    const smat = new THREE.SpriteMaterial({
      map: textures.cloudTexture,
      color: 0x6ea8d8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(smat);
    sprite.position.set(-72 + i * 13.5, 1.4 + (i % 3) * 0.9, -56 - (i % 2) * 8);
    sprite.scale.set(28, 9.5, 1);
    group.add(sprite);
    mistSprites.push(sprite);
  }

  return { group, vesselGroup, waterUniforms, trafficPoints, mistSprites };
}

/**
 * Layer 2 — Distant Cyberpunk Metropolis Skyline, Ring Megastructure, Giant Hologram & Airship
 */
export function buildCityLayer(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
): CityLayerResult {
  const group = new THREE.Group();
  group.name = 'Layer2_DistantCity';

  const cityWindowMat = new THREE.MeshStandardMaterial({
    map: textures.cityFacadeAlbedo,
    emissiveMap: textures.cityFacadeEmissive,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 1.55,
    roughness: 0.45,
    metalness: 0.5,
  });

  // 1. Dense Instanced Skyscraper Skyline across the far shore (Z = -105 to -168)
  const bldgCount = 72;
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const instancedTowers = new THREE.InstancedMesh(boxGeo, cityWindowMat, bldgCount);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  let seed = 2099;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < bldgCount; i++) {
    const bx = -135 + (i / bldgCount) * 270 + (nextRand() - 0.5) * 14;
    const bz = -102 - nextRand() * 68;
    const bw = 5.5 + nextRand() * 10.5;
    const bd = 6.0 + nextRand() * 11.0;
    // Taller downtown cluster in center (-35..+35) matching Panel A silhouette!
    const centerBoost = Math.exp(-Math.pow((bx + 6) / 48, 2));
    const bh = 16 + nextRand() * 34 + centerBoost * 34;

    dummy.position.set(bx, bh / 2 - 2.5, bz);
    dummy.scale.set(bw, bh, bd);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    instancedTowers.setMatrixAt(i, dummy.matrix);

    // Subtle cool/magenta tint variation per tower
    const tintPick = nextRand();
    if (tintPick < 0.55) color.setHex(0xbdeeff);
    else if (tintPick < 0.8) color.setHex(0xd8c8ff);
    else color.setHex(0xffd6e7);
    instancedTowers.setColorAt(i, color);
  }
  instancedTowers.instanceMatrix.needsUpdate = true;
  if (instancedTowers.instanceColor) instancedTowers.instanceColor.needsUpdate = true;
  instancedTowers.computeBoundingSphere();
  group.add(instancedTowers);

  // Vertical Neon Accent Billboards on selected mid-shore towers (magenta, cyan, crimson)
  const neonColors = [0x00e5ff, 0xff2a7a, 0x3b82f6, 0xff2e3b, 0x22d3ee];
  const billboardPositions: [number, number, number, number, number][] = [
    [-46, 20, -104, 2.2, 16],
    [-34, 26, -108, 2.6, 20],
    [-12, 32, -112, 2.4, 22],
    [14, 24, -108, 2.2, 18],
    [28, 22, -106, 2.5, 16],
    [-58, 17, -110, 2.0, 14],
    [44, 19, -110, 2.4, 15],
  ];
  billboardPositions.forEach(([nx, ny, nz, nw, nh], idx) => {
    const bMat = new THREE.MeshBasicMaterial({ color: neonColors[idx % neonColors.length] });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(nw, nh), bMat);
    strip.position.set(nx, ny, nz);
    group.add(strip);
  });

  // 2. HERO LANDMARK 1: Circular Ring Megastructure (left-center skyline, Panel A!)
  const ringGroup = new THREE.Group();
  ringGroup.position.set(-22, 0, -118);

  const supportMat = new THREE.MeshStandardMaterial({
    color: 0x162238,
    roughness: 0.45,
    metalness: 0.65,
  });
  // Twin curved-silhouette support pylons
  for (const sx of [-4.2, 4.2]) {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.4, 34, 10), supportMat);
    pylon.position.set(sx, 14, 0);
    ringGroup.add(pylon);
  }
  const coreSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.8, 42, 10), supportMat);
  coreSpire.position.set(0, 19, 0);
  ringGroup.add(coreSpire);

  // Massive Glowing Cyan Saucer Ring Halo
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x38e8ff });
  const ringHalo = new THREE.Mesh(new THREE.TorusGeometry(11.5, 0.85, 12, 48), ringMat);
  ringHalo.rotation.x = Math.PI / 2 - 0.16;
  ringHalo.position.set(0, 29.5, 0);
  ringGroup.add(ringHalo);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(8.2, 0.35, 10, 36),
    new THREE.MeshBasicMaterial({ color: 0xa5f3fc }),
  );
  innerRing.rotation.x = Math.PI / 2 - 0.16;
  innerRing.position.set(0, 28.4, 0);
  ringGroup.add(innerRing);

  group.add(ringGroup);

  // 3. HERO LANDMARK 2: Giant Holographic Portrait Billboard (center-right skyline, Panel A!)
  const holoMat = new THREE.MeshBasicMaterial({
    map: textures.hologramTexture,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const hologramMesh = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 20.5), holoMat);
  hologramMesh.position.set(2.5, 21.5, -104);
  group.add(hologramMesh);

  // 4. HERO LANDMARK 3: Cyberpunk Dirigible / Airship cruising in upper-left sky (Panel A!)
  const airshipGroup = new THREE.Group();
  airshipGroup.position.set(-28, 38, -94);

  const hullDark = new THREE.MeshStandardMaterial({
    color: 0x1b263b,
    roughness: 0.55,
    metalness: 0.4,
  });
  const blimpBody = new THREE.Mesh(new THREE.SphereGeometry(4.5, 18, 12), hullDark);
  blimpBody.scale.set(2.4, 0.72, 0.72);
  airshipGroup.add(blimpBody);

  const gondola = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.3, 1.4), mats.darkSteel);
  gondola.position.set(0, -3.5, 0);
  airshipGroup.add(gondola);

  // Glowing side accent strip & red nose beacon
  const blimpStrip = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.35, 0.15), mats.cyanNeon);
  blimpStrip.position.set(0, -0.4, 3.25);
  airshipGroup.add(blimpStrip);

  const blimpNose = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), mats.redNeon);
  blimpNose.position.set(10.8, 0, 0);
  airshipGroup.add(blimpNose);

  // Tail fins
  const finGeo = new THREE.BoxGeometry(3.2, 3.6, 0.18);
  const topFin = new THREE.Mesh(finGeo, hullDark);
  topFin.position.set(-8.8, 1.6, 0);
  airshipGroup.add(topFin);
  group.add(airshipGroup);

  return { group, hologramMesh, ringHalo, airshipGroup, cityWindowMat };
}

/**
 * Layer 1 — Sky Dome (Dual Mood Shader), Luminous Full Moon / Sunset Sun, Clouds & 3D Rain
 */
export function buildSkyWeatherLayer(textures: ProceduralTextureSet): SkyLayerResult {
  const group = new THREE.Group();
  group.name = 'Layer1_SkyAndWeather';

  // 1. Custom Gradient Sky Dome Shader
  const skyUniforms = {
    uZenithColor: { value: new THREE.Color(0x050b18) },
    uMidColor: { value: new THREE.Color(0x0f2042) },
    uHorizonColor: { value: new THREE.Color(0x1f3a66) },
  };

  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uZenithColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      varying vec3 vLocalPos;
      void main() {
        float h = clamp(vLocalPos.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
        col = mix(col, uZenithColor, smoothstep(0.24, 0.85, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(280, 32, 20), skyMat);
  group.add(skyDome);

  // 2. Huge Luminous Full Moon + Atmospheric Halo (Panel A top-center!)
  const moonGroup = new THREE.Group();
  moonGroup.position.set(14, 52, -165);

  const moonMat = new THREE.MeshBasicMaterial({
    map: textures.moonTexture,
    color: 0xeaf4ff,
    fog: false,
  });
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(12.5, 36), moonMat);
  moonGroup.add(moonDisc);

  const moonHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textures.softGlowTexture,
      color: 0x7ec0ff,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  moonHalo.scale.set(62, 62, 1);
  moonHalo.position.z = -1;
  moonGroup.add(moonHalo);
  group.add(moonGroup);

  // 3. Glowing Setting Sun (for Sunset Variant alternate theme!)
  const sunGroup = new THREE.Group();
  sunGroup.position.set(4, 24, -172);
  sunGroup.visible = false;

  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(15.5, 36),
    new THREE.MeshBasicMaterial({ color: 0xffd27d, fog: false }),
  );
  sunGroup.add(sunDisc);

  const sunHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textures.softGlowTexture,
      color: 0xff7b29,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  sunHalo.scale.set(95, 72, 1);
  sunHalo.position.z = -1;
  sunGroup.add(sunHalo);
  group.add(sunGroup);

  // 4. Dramatic Storm / Sunset Clouds across upper sky
  const cloudSprites: THREE.Sprite[] = [];
  const cloudConfigs: [number, number, number, number, number][] = [
    [-75, 48, -145, 72, 26],
    [-25, 58, -155, 84, 30],
    [35, 54, -150, 78, 28],
    [82, 46, -142, 68, 25],
    [-5, 42, -138, 64, 22],
    [-52, 36, -135, 58, 20],
  ];
  for (const [cx, cy, cz, sx, sy] of cloudConfigs) {
    const cMat = new THREE.SpriteMaterial({
      map: textures.cloudTexture,
      color: 0x5c7aa8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      fog: false,
    });
    const sp = new THREE.Sprite(cMat);
    sp.position.set(cx, cy, cz);
    sp.scale.set(sx, sy, 1);
    group.add(sp);
    cloudSprites.push(sp);
  }

  // 5. 3D Falling Rain Streaks System (2,200 streaks across arena & midground)
  const dropCount = 2200;
  const rainPositions = new Float32Array(dropCount * 6);
  let rSeed = 9182;
  const rRand = () => {
    rSeed = (rSeed * 16807) % 2147483647;
    return (rSeed - 1) / 2147483646;
  };
  for (let i = 0; i < dropCount; i++) {
    const x = (rRand() - 0.5) * 54;
    const y = rRand() * 26;
    const z = -14 + rRand() * 34;
    const len = 0.65 + rRand() * 0.55;
    const tiltX = -0.14;
    rainPositions[i * 6] = x;
    rainPositions[i * 6 + 1] = y;
    rainPositions[i * 6 + 2] = z;
    rainPositions[i * 6 + 3] = x + tiltX;
    rainPositions[i * 6 + 4] = y - len;
    rainPositions[i * 6 + 5] = z;
  }

  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0x99ccff,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.frustumCulled = false;
  group.add(rainLines);

  return {
    group,
    skyUniforms,
    moonGroup,
    sunGroup,
    rainLines,
    rainPositions,
    cloudSprites,
  };
}
