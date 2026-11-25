import * as THREE from 'three';
import type { ProceduralTextureSet } from './textures';

export interface AnimatedBannerHandle {
  group: THREE.Group;
  clothGeo: THREE.PlaneGeometry;
  basePositions: Float32Array;
}

export interface PropMaterials {
  darkSteel: THREE.MeshStandardMaterial;
  rustedSteel: THREE.MeshStandardMaterial;
  industrialYellow: THREE.MeshStandardMaterial;
  hazardMat: THREE.MeshStandardMaterial;
  redNeon: THREE.MeshStandardMaterial;
  cyanNeon: THREE.MeshStandardMaterial;
  amberLamp: THREE.MeshStandardMaterial;
  tarpMat: THREE.MeshStandardMaterial;
  woodMat: THREE.MeshStandardMaterial;
}

export function createPropMaterials(textures: ProceduralTextureSet): PropMaterials {
  return {
    darkSteel: new THREE.MeshStandardMaterial({
      color: 0x2a3340,
      roughness: 0.42,
      metalness: 0.82,
    }),
    rustedSteel: new THREE.MeshStandardMaterial({
      color: 0x5c3c2e,
      roughness: 0.78,
      metalness: 0.45,
    }),
    industrialYellow: new THREE.MeshStandardMaterial({
      color: 0xe6a119,
      roughness: 0.36,
      metalness: 0.35,
    }),
    hazardMat: new THREE.MeshStandardMaterial({
      map: textures.hazardAlbedo,
      roughness: 0.44,
      metalness: 0.32,
    }),
    redNeon: new THREE.MeshStandardMaterial({
      color: 0xff2a35,
      emissive: 0xff1e2d,
      emissiveIntensity: 3.2,
      roughness: 0.2,
      metalness: 0.1,
    }),
    cyanNeon: new THREE.MeshStandardMaterial({
      color: 0x38e8ff,
      emissive: 0x00d8ff,
      emissiveIntensity: 2.8,
      roughness: 0.2,
      metalness: 0.1,
    }),
    amberLamp: new THREE.MeshStandardMaterial({
      color: 0xffd58a,
      emissive: 0xffa433,
      emissiveIntensity: 3.4,
      roughness: 0.15,
      metalness: 0.1,
    }),
    tarpMat: new THREE.MeshStandardMaterial({
      color: 0x3b4d63,
      roughness: 0.72,
      metalness: 0.08,
    }),
    woodMat: new THREE.MeshStandardMaterial({
      color: 0x6b4c32,
      roughness: 0.88,
      metalness: 0.02,
    }),
  };
}

/**
 * Key Asset 1: Corrugated Shipping Container (Red or Dark Slate)
 * Multi-part composite with corner castings, locking bars & bottom skid rails
 */
export function createShippingContainer(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
  variant: 'red' | 'slate' = 'red',
  length = 6.0,
): THREE.Group {
  const g = new THREE.Group();
  const w = length;
  const h = 2.6;
  const d = 2.45;

  const bodyMat = new THREE.MeshStandardMaterial({
    map: variant === 'red' ? textures.containerRedAlbedo : textures.containerSlateAlbedo,
    bumpMap: textures.containerBump,
    bumpScale: 0.06,
    roughness: 0.56,
    metalness: 0.42,
  });

  // Main corrugated container hull (raised 0.08 on skid rails)
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.12, d), bodyMat);
  body.position.y = (h - 0.12) / 2 + 0.08;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Bottom steel skid runners
  const skidGeo = new THREE.BoxGeometry(w, 0.1, 0.22);
  for (const sz of [-d / 2 + 0.14, d / 2 - 0.14]) {
    const skid = new THREE.Mesh(skidGeo, mats.darkSteel);
    skid.position.set(0, 0.05, sz);
    g.add(skid);
  }

  // 8 Reinforced steel corner castings
  const cornerGeo = new THREE.BoxGeometry(0.26, 0.24, 0.26);
  for (const cx of [-w / 2 + 0.1, w / 2 - 0.1]) {
    for (const cy of [0.14, h - 0.06]) {
      for (const cz of [-d / 2 + 0.1, d / 2 - 0.1]) {
        const c = new THREE.Mesh(cornerGeo, mats.darkSteel);
        c.position.set(cx, cy, cz);
        g.add(c);
      }
    }
  }

  // Dual vertical locking bars on the +X door end
  const barGeo = new THREE.CylinderGeometry(0.03, 0.03, h - 0.35, 8);
  for (const bz of [-0.55, -0.18, 0.18, 0.55]) {
    const bar = new THREE.Mesh(barGeo, mats.darkSteel);
    bar.position.set(w / 2 + 0.03, h / 2 + 0.04, bz);
    g.add(bar);
  }

  return g;
}

/**
 * Key Asset 2: Reinforced Industrial Steel Cargo Crate
 */
export function createCargoCrate(mats: PropMaterials, size = 1.45): THREE.Group {
  const g = new THREE.Group();
  const h = size * 0.85;

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x394454,
    roughness: 0.62,
    metalness: 0.58,
  });

  const core = new THREE.Mesh(new THREE.BoxGeometry(size * 0.92, h * 0.88, size * 0.92), panelMat);
  core.position.y = h / 2;
  core.castShadow = true;
  core.receiveShadow = true;
  g.add(core);

  // Heavy outer exoskeleton steel frame rails
  const railT = 0.1;
  const xRailGeo = new THREE.BoxGeometry(size, railT, railT);
  const zRailGeo = new THREE.BoxGeometry(railT, railT, size);
  const yPostGeo = new THREE.BoxGeometry(railT * 1.15, h, railT * 1.15);

  for (const ry of [railT / 2, h - railT / 2]) {
    for (const rz of [-size / 2 + railT / 2, size / 2 - railT / 2]) {
      const xr = new THREE.Mesh(xRailGeo, mats.darkSteel);
      xr.position.set(0, ry, rz);
      g.add(xr);
    }
    for (const rx of [-size / 2 + railT / 2, size / 2 - railT / 2]) {
      const zr = new THREE.Mesh(zRailGeo, mats.darkSteel);
      zr.position.set(rx, ry, 0);
      g.add(zr);
    }
  }
  for (const px of [-size / 2 + railT / 2, size / 2 - railT / 2]) {
    for (const pz of [-size / 2 + railT / 2, size / 2 - railT / 2]) {
      const post = new THREE.Mesh(yPostGeo, mats.darkSteel);
      post.position.set(px, h / 2, pz);
      g.add(post);
    }
  }

  // Yellow latch clasp accent on front
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), mats.industrialYellow);
  clasp.position.set(0, h * 0.64, size / 2);
  g.add(clasp);

  return g;
}

/**
 * Key Asset 3: Weathered Industrial Oil Barrel (Red or Grey)
 */
export function createOilBarrel(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
  variant: 'red' | 'grey' = 'red',
): THREE.Group {
  const g = new THREE.Group();
  const radius = 0.31;
  const height = 0.94;

  const drumMat = new THREE.MeshStandardMaterial({
    map: variant === 'red' ? textures.barrelRedAlbedo : textures.barrelGreyAlbedo,
    roughness: 0.48,
    metalness: 0.65,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 18), drumMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Raised rolling hoops
  const hoopGeo = new THREE.TorusGeometry(radius + 0.012, 0.016, 8, 18);
  for (const hy of [0.05, height * 0.34, height * 0.66, height - 0.05]) {
    const hoop = new THREE.Mesh(hoopGeo, mats.darkSteel);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = hy;
    g.add(hoop);
  }

  // Top filler bung cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), mats.darkSteel);
  cap.position.set(0.14, height + 0.01, 0.06);
  g.add(cap);

  return g;
}

/**
 * Key Asset 4: Tarpaulin-Covered Pallet Cargo
 */
export function createTarpPallet(mats: PropMaterials): THREE.Group {
  const g = new THREE.Group();
  const w = 1.85;
  const d = 1.45;
  const h = 1.15;

  // Wooden pallet base with slats
  const slatGeo = new THREE.BoxGeometry(w, 0.05, 0.18);
  for (const sz of [-0.56, -0.28, 0, 0.28, 0.56]) {
    const slat = new THREE.Mesh(slatGeo, mats.woodMat);
    slat.position.set(0, 0.12, sz);
    g.add(slat);
  }
  const runnerGeo = new THREE.BoxGeometry(0.14, 0.1, d);
  for (const rx of [-w / 2 + 0.1, 0, w / 2 - 0.1]) {
    const runner = new THREE.Mesh(runnerGeo, mats.woodMat);
    runner.position.set(rx, 0.05, 0);
    g.add(runner);
  }

  // Draped tarpaulin cargo volume with organic slight vertices displacement
  const tarpGeo = new THREE.BoxGeometry(w - 0.08, h, d - 0.08, 6, 4, 6);
  const pos = tarpGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const wave = Math.sin(vx * 5.2 + vz * 3.7) * 0.035;
    const pinch = vy < 0 ? 1.03 : 0.96;
    pos.setXYZ(i, vx * pinch + wave * 0.4, vy + (vy > 0 ? wave * 0.5 : 0), vz * pinch + wave * 0.4);
  }
  tarpGeo.computeVertexNormals();

  const tarp = new THREE.Mesh(tarpGeo, mats.tarpMat);
  tarp.position.y = 0.15 + h / 2;
  tarp.castShadow = true;
  tarp.receiveShadow = true;
  g.add(tarp);

  // Strapping bands holding the tarp tight
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x1e2530,
    roughness: 0.75,
    metalness: 0.1,
  });
  for (const sx of [-0.45, 0.45]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, h + 0.04, d - 0.02), strapMat);
    strap.position.set(sx, 0.15 + h / 2, 0);
    g.add(strap);
  }

  return g;
}

/**
 * Key Asset 5: Yellow/Black Hazard Crane Hook & Pulley Block
 * Pivot at top shackle so it can swing smoothly on cables
 */
export function createCraneHookBlock(mats: PropMaterials): THREE.Group {
  const g = new THREE.Group();

  // Upper twin pulley cheek block with hazard stripes
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.05, 0.46), mats.hazardMat);
  block.position.y = -0.55;
  block.castShadow = true;
  g.add(block);

  // Dark steel side reinforcement plates & axle bolts
  const sidePlateGeo = new THREE.BoxGeometry(0.94, 0.24, 0.52);
  const topPlate = new THREE.Mesh(sidePlateGeo, mats.darkSteel);
  topPlate.position.y = -0.14;
  g.add(topPlate);

  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.58, 12), mats.darkSteel);
  axle.rotation.x = Math.PI / 2;
  axle.position.y = -0.58;
  g.add(axle);

  // Swivel stem beneath pulley block
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.36, 12), mats.rustedSteel);
  stem.position.y = -1.24;
  g.add(stem);

  // Forged J-Hook curved tube
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -1.38, 0),
    new THREE.Vector3(0.02, -1.68, 0),
    new THREE.Vector3(0.28, -2.02, 0),
    new THREE.Vector3(0.04, -2.32, 0),
    new THREE.Vector3(-0.32, -2.26, 0),
    new THREE.Vector3(-0.42, -1.96, 0),
    new THREE.Vector3(-0.28, -1.78, 0),
  ]);
  const hookGeo = new THREE.TubeGeometry(hookCurve, 22, 0.095, 10, false);
  const hookMesh = new THREE.Mesh(hookGeo, mats.rustedSteel);
  hookMesh.castShadow = true;
  g.add(hookMesh);

  return g;
}

/**
 * Key Asset 6: Heavy Industrial Yellow Mooring Bollard
 */
export function createMooringBollard(mats: PropMaterials): THREE.Group {
  const g = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.12, 8), mats.darkSteel);
  base.position.y = 0.06;
  base.receiveShadow = true;
  g.add(base);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.62, 16),
    mats.industrialYellow,
  );
  post.position.y = 0.42;
  post.castShadow = true;
  post.receiveShadow = true;
  g.add(post);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.25, 0.18, 16),
    mats.industrialYellow,
  );
  cap.position.y = 0.78;
  cap.castShadow = true;
  g.add(cap);

  // Horizontal mooring cross-horn
  const horn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.78, 12),
    mats.industrialYellow,
  );
  horn.rotation.z = Math.PI / 2;
  horn.position.y = 0.56;
  g.add(horn);

  return g;
}

/**
 * Key Asset 7: Tripod Industrial Work Floodlight Tower
 */
export function createTripodFloodlight(mats: PropMaterials): THREE.Group {
  const g = new THREE.Group();

  // 3 Tripod legs
  const legGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.35, 8);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(legGeo, mats.industrialYellow);
    leg.position.set(Math.cos(angle) * 0.34, 0.56, Math.sin(angle) * 0.34);
    leg.rotation.z = Math.cos(angle) * 0.48;
    leg.rotation.x = -Math.sin(angle) * 0.48;
    leg.castShadow = true;
    g.add(leg);
  }

  // Central mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 2.35, 10), mats.darkSteel);
  mast.position.y = 1.48;
  mast.castShadow = true;
  g.add(mast);

  // Lamp crossbar housing
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.68, 0);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.42, 0.16), mats.darkSteel);
  housing.castShadow = true;
  headGroup.add(housing);

  // 4 Bright warm LED work lamp lenses
  const lensGeo = new THREE.PlaneGeometry(0.32, 0.14);
  const offsets: [number, number][] = [
    [-0.2, 0.09],
    [0.2, 0.09],
    [-0.2, -0.09],
    [0.2, -0.09],
  ];
  for (const [ox, oy] of offsets) {
    const lens = new THREE.Mesh(lensGeo, mats.amberLamp);
    lens.position.set(ox, oy, 0.085);
    headGroup.add(lens);
  }
  g.add(headGroup);

  return g;
}

/**
 * Key Asset 8: Crimson Faction Vertical Banner (with vertex-animated cloth!)
 */
export function createFactionBanner(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
  width = 2.35,
  height = 4.6,
): AnimatedBannerHandle {
  const g = new THREE.Group();

  // Horizontal metal hanger bar with finials
  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, width + 0.45, 10),
    mats.darkSteel,
  );
  bar.rotation.z = Math.PI / 2;
  g.add(bar);

  const finialGeo = new THREE.ConeGeometry(0.09, 0.22, 8);
  for (const dir of [-1, 1]) {
    const fin = new THREE.Mesh(finialGeo, mats.industrialYellow);
    fin.rotation.z = -dir * Math.PI / 2;
    fin.position.x = dir * (width / 2 + 0.28);
    g.add(fin);
  }

  // Subdivided banner plane (anchored at top Y = 0, hanging down to -height)
  const clothGeo = new THREE.PlaneGeometry(width, height, 10, 18);
  clothGeo.translate(0, -height / 2 - 0.04, 0);
  const basePositions = new Float32Array(clothGeo.attributes.position.array);

  const clothMat = new THREE.MeshStandardMaterial({
    map: textures.bannerAlbedo,
    alphaMap: textures.bannerAlpha,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    roughness: 0.72,
    metalness: 0.08,
  });

  const clothMesh = new THREE.Mesh(clothGeo, clothMat);
  clothMesh.castShadow = true;
  clothMesh.receiveShadow = true;
  g.add(clothMesh);

  return { group: g, clothGeo, basePositions };
}

/**
 * Key Asset 9: Yellow Industrial Safety Railing Section
 */
export function createSafetyRailing(
  mats: PropMaterials,
  length = 4.0,
  height = 1.12,
  withKickplate = true,
): THREE.Group {
  const g = new THREE.Group();
  const postCount = Math.max(2, Math.round(length / 1.8) + 1);

  const postGeo = new THREE.CylinderGeometry(0.038, 0.042, height, 8);
  const footGeo = new THREE.BoxGeometry(0.16, 0.04, 0.16);

  for (let i = 0; i < postCount; i++) {
    const px = -length / 2 + (i / (postCount - 1)) * length;
    const post = new THREE.Mesh(postGeo, mats.industrialYellow);
    post.position.set(px, height / 2, 0);
    post.castShadow = true;
    g.add(post);

    const foot = new THREE.Mesh(footGeo, mats.darkSteel);
    foot.position.set(px, 0.02, 0);
    g.add(foot);
  }

  // Top & mid horizontal tubular rails
  const railGeo = new THREE.CylinderGeometry(0.036, 0.036, length + 0.06, 8);
  for (const ry of [height - 0.05, height * 0.56]) {
    const rail = new THREE.Mesh(railGeo, mats.industrialYellow);
    rail.rotation.z = Math.PI / 2;
    rail.position.y = ry;
    rail.castShadow = true;
    g.add(rail);
  }

  if (withKickplate) {
    const kick = new THREE.Mesh(new THREE.BoxGeometry(length, 0.18, 0.045), mats.hazardMat);
    kick.position.y = 0.11;
    g.add(kick);
  }

  return g;
}

/**
 * Red Industrial Warning Beacon Post (seen on D-02 stairs, crane base & foreground corners)
 */
export function createWarningBeacon(mats: PropMaterials, withPost = true): THREE.Group {
  const g = new THREE.Group();
  const baseY = withPost ? 0.95 : 0;

  if (withPost) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.14), mats.darkSteel);
    post.position.y = 0.475;
    post.castShadow = true;
    g.add(post);
  }

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 12), mats.darkSteel);
  collar.position.y = baseY + 0.05;
  g.add(collar);

  const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.22, 12), mats.redNeon);
  bulb.position.y = baseY + 0.2;
  g.add(bulb);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12), mats.darkSteel);
  cap.position.y = baseY + 0.32;
  g.add(cap);

  return g;
}
