import * as THREE from 'three';
import type { ProceduralTextureSet } from './textures';
import {
  type AnimatedBannerHandle,
  type PropMaterials,
  createCargoCrate,
  createCraneHookBlock,
  createFactionBanner,
  createMooringBollard,
  createOilBarrel,
  createSafetyRailing,
  createShippingContainer,
  createTarpPallet,
  createTripodFloodlight,
  createWarningBeacon,
} from './props';

export interface StructuresResult {
  group: THREE.Group;
  banners: AnimatedBannerHandle[];
  craneHookPivot: THREE.Group;
  structureLights: THREE.PointLight[];
}

/**
 * Builds a realistic steel truss beam segment between two 3D points
 */
function addStrut(
  parent: THREE.Group,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  thickness: number,
  mat: THREE.Material,
) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.BoxGeometry(thickness, len, thickness);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

/**
 * Builds Sector D-02 Two-Story Industrial Control Building (Left Arena Flank)
 * Faithfully matches Panels A, B, D, Side View & Back View orthographics!
 */
function buildSectorD02Building(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
): { group: THREE.Group; banners: AnimatedBannerHandle[]; lights: THREE.PointLight[] } {
  const g = new THREE.Group();
  const banners: AnimatedBannerHandle[] = [];
  const lights: THREE.PointLight[] = [];

  const concreteMat = new THREE.MeshStandardMaterial({
    map: textures.concreteAlbedo,
    bumpMap: textures.concreteBump,
    bumpScale: 0.05,
    roughness: 0.78,
    metalness: 0.14,
  });

  const d02FacadeMat = new THREE.MeshStandardMaterial({
    map: textures.d02WallAlbedo,
    bumpMap: textures.d02WallBump,
    bumpScale: 0.05,
    roughness: 0.74,
    metalness: 0.16,
  });

  const grateMat = new THREE.MeshStandardMaterial({
    map: textures.grateAlbedo,
    bumpMap: textures.grateBump,
    bumpScale: 0.04,
    roughness: 0.45,
    metalness: 0.78,
  });

  const darkCladdingMat = new THREE.MeshStandardMaterial({
    color: 0x262e3a,
    roughness: 0.52,
    metalness: 0.65,
  });

  // Main ground floor building volume (X: local -3 to +3, Z: local -6 to +4.2)
  const groundH = 3.85;
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(6.2, groundH, 10.6), concreteMat);
  mainBody.position.set(-1.1, groundH / 2, -0.8);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  g.add(mainBody);

  // Prominent "D-02" stenciled concrete panel facing the arena & front-left (Panels A & B)
  const d02FrontPanel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 3.3), d02FacadeMat);
  d02FrontPanel.position.set(2.04, 1.75, 2.55);
  d02FrontPanel.castShadow = true;
  d02FrontPanel.receiveShadow = true;
  g.add(d02FrontPanel);

  // Also paint "D-02" on the front-facing southern gable end for Panel B angle!
  const d02SouthPanel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.1, 0.18), d02FacadeMat);
  d02SouthPanel.position.set(0.25, 1.7, 4.52);
  g.add(d02SouthPanel);

  // Recessed Cyan-Illuminated Security Doorway Bay on the arena-facing facade (Panel A & B)
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.95, 2.55), mats.darkSteel);
  doorFrame.position.set(2.12, 1.48, -0.85);
  g.add(doorFrame);

  const cyanAlcoveMat = new THREE.MeshStandardMaterial({
    color: 0x164e63,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.65,
    roughness: 0.35,
    metalness: 0.4,
  });
  const doorInner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.55, 1.88), cyanAlcoveMat);
  doorInner.position.set(2.36, 1.32, -0.85);
  g.add(doorInner);

  // Overhead glowing cyan LED bar above doorway
  const cyanTube = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 2.05), mats.cyanNeon);
  cyanTube.position.set(2.42, 2.75, -0.85);
  g.add(cyanTube);

  const cyanDoorLight = new THREE.PointLight(0x00e5ff, 16, 14, 1.7);
  cyanDoorLight.position.set(3.2, 2.4, -0.85);
  g.add(cyanDoorLight);
  lights.push(cyanDoorLight);

  // Second recessed industrial shutter bay (further back along Z)
  const shutterBay = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.75, 2.4), darkCladdingMat);
  shutterBay.position.set(2.08, 1.4, -3.9);
  g.add(shutterBay);
  for (let sy = 0.4; sy < 2.6; sy += 0.28) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 2.18), mats.darkSteel);
    slat.position.set(2.1, sy, -3.9);
    g.add(slat);
  }

  // Heavy structural vertical I-beam columns along arena facade
  const colGeo = new THREE.BoxGeometry(0.38, 7.6, 0.38);
  for (const cz of [-5.8, -2.55, 0.65, 4.35]) {
    const col = new THREE.Mesh(colGeo, mats.darkSteel);
    col.position.set(2.15, 3.8, cz);
    col.castShadow = true;
    g.add(col);
  }

  // 2nd-Floor Cantilevered Steel Catwalk Deck wrapping arena-facing & south sides
  const catwalkSlab = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.28, 11.4), grateMat);
  catwalkSlab.position.set(2.92, groundH, -0.65);
  catwalkSlab.castShadow = true;
  catwalkSlab.receiveShadow = true;
  g.add(catwalkSlab);

  // Yellow safety trim edge along catwalk slab
  const catwalkEdge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 11.44), mats.industrialYellow);
  catwalkEdge.position.set(3.98, groundH, -0.65);
  g.add(catwalkEdge);

  // Steel diagonal support brackets under cantilevered catwalk
  for (const cz of [-5.5, -2.55, 0.65, 4.15]) {
    addStrut(
      g,
      new THREE.Vector3(2.1, groundH - 1.25, cz),
      new THREE.Vector3(3.85, groundH - 0.14, cz),
      0.14,
      mats.darkSteel,
    );
  }

  // 2nd-Floor Upper Control Room Superstructure (recessed behind catwalk)
  const upperH = 3.25;
  const upperCore = new THREE.Mesh(new THREE.BoxGeometry(5.6, upperH, 9.8), darkCladdingMat);
  upperCore.position.set(-1.1, groundH + upperH / 2 + 0.12, -0.8);
  upperCore.castShadow = true;
  upperCore.receiveShadow = true;
  g.add(upperCore);

  // Warm illuminated control room windows along 2nd floor
  const warmWindowMat = new THREE.MeshStandardMaterial({
    color: 0xffd28a,
    emissive: 0xff9a2e,
    emissiveIntensity: 1.9,
    roughness: 0.2,
    metalness: 0.2,
  });
  for (const wz of [-3.6, -0.7, 2.1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.28, 2.0), warmWindowMat);
    win.position.set(1.72, groundH + 1.85, wz);
    g.add(win);
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.34, 0.1), mats.darkSteel);
    mullion.position.set(1.74, groundH + 1.85, wz);
    g.add(mullion);
  }

  // 2nd-Floor Overhanging Roof Canopy with Red Warning LED Strip along fascia (Panels A & B)
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.42, 11.6), darkCladdingMat);
  roofSlab.position.set(-0.1, groundH + upperH + 0.34, -0.65);
  roofSlab.castShadow = true;
  roofSlab.receiveShadow = true;
  g.add(roofSlab);

  // Glowing red neon warning strips along upper roof fascia
  for (const rz of [-4.2, 1.8]) {
    const redBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 2.8), mats.redNeon);
    redBar.position.set(4.24, groundH + upperH + 0.34, rz);
    g.add(redBar);
  }
  const redCornerBeacon = createWarningBeacon(mats, false);
  redCornerBeacon.position.set(4.05, groundH + upperH + 0.55, 4.95);
  g.add(redCornerBeacon);

  // Warm overhead floodlights tucked under the 2nd floor roof canopy illuminating catwalk & banner
  for (const lz of [-3.4, 0.4, 3.4]) {
    const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.28), mats.amberLamp);
    fixture.position.set(3.2, groundH + upperH + 0.08, lz);
    g.add(fixture);
  }
  const warmUpperLight = new THREE.PointLight(0xffa036, 22, 18, 1.6);
  warmUpperLight.position.set(3.8, groundH + 2.6, 0.8);
  g.add(warmUpperLight);
  lights.push(warmUpperLight);

  // Yellow safety railings along 2nd-floor catwalk front edge
  const catwalkRail1 = createSafetyRailing(mats, 5.2, 1.12, true);
  catwalkRail1.rotation.y = Math.PI / 2;
  catwalkRail1.position.set(3.92, groundH + 0.14, -3.5);
  g.add(catwalkRail1);

  const catwalkRail2 = createSafetyRailing(mats, 5.2, 1.12, true);
  catwalkRail2.rotation.y = Math.PI / 2;
  catwalkRail2.position.set(3.92, groundH + 0.14, 2.2);
  g.add(catwalkRail2);

  // Upper Rooftop Observation Watchtower / Guard Penthouse (matching Side & Back Orthographics!)
  const towerH = 2.65;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(4.4, towerH, 4.6), darkCladdingMat);
  tower.position.set(-0.6, groundH + upperH + 0.55 + towerH / 2, -0.6);
  tower.castShadow = true;
  g.add(tower);

  const towerRoof = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.28, 5.2), mats.darkSteel);
  towerRoof.position.set(-0.6, groundH + upperH + 0.55 + towerH + 0.12, -0.6);
  g.add(towerRoof);

  // Rooftop industrial AC units & comms antenna mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 4.2, 8), mats.darkSteel);
  mast.position.set(-1.6, groundH + upperH + towerH + 2.8, -1.8);
  g.add(mast);
  const mastBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mats.redNeon);
  mastBeacon.position.set(-1.6, groundH + upperH + towerH + 4.95, -1.8);
  g.add(mastBeacon);

  // Exterior Angled Steel Staircase on the Front-South Side (Panel B iconic detail!)
  const stairGroup = new THREE.Group();
  const stepCount = 13;
  const stairStartZ = 8.4;
  const stairEndZ = 4.65;
  const stairX = 2.95;

  for (let i = 0; i < stepCount; i++) {
    const t = i / (stepCount - 1);
    const sy = 0.22 + t * (groundH - 0.28);
    const sz = THREE.MathUtils.lerp(stairStartZ, stairEndZ, t);
    const tread = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 0.34), grateMat);
    tread.position.set(stairX, sy, sz);
    tread.castShadow = true;
    tread.receiveShadow = true;
    stairGroup.add(tread);
  }
  // Dual angled stair stringer beams & yellow handrails
  for (const sx of [stairX - 0.72, stairX + 0.72]) {
    addStrut(
      stairGroup,
      new THREE.Vector3(sx, 0.1, stairStartZ + 0.2),
      new THREE.Vector3(sx, groundH, stairEndZ - 0.1),
      0.12,
      mats.darkSteel,
    );
    addStrut(
      stairGroup,
      new THREE.Vector3(sx, 1.15, stairStartZ + 0.2),
      new THREE.Vector3(sx, groundH + 1.08, stairEndZ - 0.1),
      0.075,
      mats.industrialYellow,
    );
  }
  // Red warning beacon on upper stair landing (Panel B!)
  const stairBeacon = createWarningBeacon(mats, false);
  stairBeacon.position.set(stairX + 0.76, groundH + 0.18, stairEndZ + 0.2);
  stairGroup.add(stairBeacon);

  const stairRedLight = new THREE.PointLight(0xff2233, 14, 11, 1.8);
  stairRedLight.position.set(stairX + 1.1, groundH + 0.6, stairEndZ + 0.4);
  stairGroup.add(stairRedLight);
  lights.push(stairRedLight);

  g.add(stairGroup);

  // Exterior industrial pipes running vertically down the facade
  const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 7.2, 8);
  for (const pz of [-5.2, -4.85, 3.75]) {
    const pipe = new THREE.Mesh(pipeGeo, mats.rustedSteel);
    pipe.position.set(2.08, 3.6, pz);
    g.add(pipe);
  }

  // ICONIC CRIMSON FACTION BANNER hanging prominently from the 2nd-floor catwalk (Panels A, B, D!)
  const heroBanner = createFactionBanner(textures, mats, 2.35, 4.75);
  heroBanner.group.position.set(4.14, groundH + 2.45, 1.65);
  heroBanner.group.rotation.y = Math.PI / 2;
  g.add(heroBanner.group);
  banners.push(heroBanner);

  // Secondary smaller crimson banner on rear wall (matching Back View orthographic)
  const backBanner = createFactionBanner(textures, mats, 1.8, 3.6);
  backBanner.group.position.set(-4.32, groundH + 2.2, -0.6);
  backBanner.group.rotation.y = -Math.PI / 2;
  g.add(backBanner.group);
  banners.push(backBanner);

  // Ground-level barrels & cargo crates clustered realistically around Sector D-02 (Panel B!)
  const b1 = createOilBarrel(textures, mats, 'grey');
  b1.position.set(2.65, 0, 5.15);
  g.add(b1);
  const b2 = createOilBarrel(textures, mats, 'grey');
  b2.position.set(1.9, 0, 5.35);
  g.add(b2);
  const b3 = createOilBarrel(textures, mats, 'red');
  b3.position.set(2.85, 0, 3.9);
  g.add(b3);

  const crate1 = createCargoCrate(mats, 1.35);
  crate1.position.set(3.2, 0, 2.2);
  crate1.rotation.y = 0.08;
  g.add(crate1);

  const lowOrangeBeacon = createWarningBeacon(mats, false);
  lowOrangeBeacon.position.set(3.95, 0.05, 1.95);
  g.add(lowOrangeBeacon);

  return { group: g, banners, lights };
}

/**
 * Builds the Towering Industrial Lattice Gantry Crane (Right-Rear Dockyard)
 * Faithfully matches Panels A, C, D & Front Orthographic!
 */
function buildGantryCrane(mats: PropMaterials): {
  group: THREE.Group;
  hookPivot: THREE.Group;
  lights: THREE.PointLight[];
} {
  const g = new THREE.Group();
  const lights: THREE.PointLight[] = [];

  const craneSteelMat = new THREE.MeshStandardMaterial({
    color: 0x3b3532,
    roughness: 0.62,
    metalness: 0.72,
  });
  const craneRustMat = new THREE.MeshStandardMaterial({
    color: 0x6b3e26,
    roughness: 0.74,
    metalness: 0.56,
  });

  // Base footprint (4 corner bogies on rail beams)
  const baseW = 6.2; // along X
  const baseD = 5.4; // along Z
  const topW = 3.2;
  const topD = 3.0;
  const towerH = 14.5;

  // Concrete / steel rail sill beams & wheeled bogies
  for (const bz of [-baseD / 2, baseD / 2]) {
    const railBeam = new THREE.Mesh(new THREE.BoxGeometry(baseW + 2.8, 0.55, 0.68), mats.darkSteel);
    railBeam.position.set(0, 0.275, bz);
    railBeam.castShadow = true;
    railBeam.receiveShadow = true;
    g.add(railBeam);
  }

  // 4 Tapered Lattice Legs
  const bottomCorners = [
    new THREE.Vector3(-baseW / 2, 0.5, -baseD / 2),
    new THREE.Vector3(baseW / 2, 0.5, -baseD / 2),
    new THREE.Vector3(baseW / 2, 0.5, baseD / 2),
    new THREE.Vector3(-baseW / 2, 0.5, baseD / 2),
  ];
  const topCorners = [
    new THREE.Vector3(-topW / 2, towerH, -topD / 2),
    new THREE.Vector3(topW / 2, towerH, -topD / 2),
    new THREE.Vector3(topW / 2, towerH, topD / 2),
    new THREE.Vector3(-topW / 2, towerH, topD / 2),
  ];

  for (let i = 0; i < 4; i++) {
    addStrut(g, bottomCorners[i], topCorners[i], 0.36, craneRustMat);
  }

  // Horizontal rings & X-bracing along the 5 tower tiers
  const tiers = 5;
  const tierPts = (tierIndex: number) => {
    const t = tierIndex / tiers;
    return bottomCorners.map((bc, idx) => new THREE.Vector3().lerpVectors(bc, topCorners[idx], t));
  };

  for (let t = 0; t < tiers; t++) {
    const low = tierPts(t);
    const high = tierPts(t + 1);
    for (let side = 0; side < 4; side++) {
      const next = (side + 1) % 4;
      // Horizontal tie at top of tier
      addStrut(g, high[side], high[next], 0.22, craneSteelMat);
      // Skip lowest front/back opening so cargo/walkway clearance reads realistically
      if (t >= 1) {
        addStrut(g, low[side], high[next], 0.15, craneSteelMat);
        addStrut(g, low[next], high[side], 0.15, craneSteelMat);
      }
    }
  }

  // Operator Cab & Machinery House mounted at Y = 11.2m
  const cabMat = new THREE.MeshStandardMaterial({
    color: 0x2d3748,
    roughness: 0.5,
    metalness: 0.65,
  });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.2), cabMat);
  cab.position.set(-1.35, 11.4, 1.35);
  cab.castShadow = true;
  g.add(cab);

  const cabWindow = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.05, 0.14),
    mats.amberLamp,
  );
  cabWindow.position.set(-1.35, 11.6, 2.46);
  g.add(cabWindow);

  // Massive Cantilevered Horizontal Truss Jib / Boom (slanted slightly upward toward vessel/right, reaching left over arena)
  const boomY = towerH + 0.8;
  const boomLeftX = -10.5;
  const boomRightX = 14.5;
  const boomH = 2.1;
  const boomD = 2.4;

  // Boom chord rails
  const boomSegments = 9;
  const getBoomPt = (seg: number, top: boolean, zSign: number) => {
    const t = seg / boomSegments;
    const x = THREE.MathUtils.lerp(boomLeftX, boomRightX, t);
    const slopeY = (x / 18) * 2.2; // Slight upward rake matching Panel A & C!
    return new THREE.Vector3(x, boomY + slopeY + (top ? boomH : 0), zSign * (boomD / 2));
  };

  for (let s = 0; s < boomSegments; s++) {
    for (const zs of [-1, 1]) {
      const b0 = getBoomPt(s, false, zs);
      const b1 = getBoomPt(s + 1, false, zs);
      const t0 = getBoomPt(s, true, zs);
      const t1 = getBoomPt(s + 1, true, zs);
      addStrut(g, b0, b1, 0.24, craneRustMat);
      addStrut(g, t0, t1, 0.22, craneRustMat);
      addStrut(g, b0, t0, 0.16, craneSteelMat);
      addStrut(g, b0, t1, 0.14, craneSteelMat);
    }
    // Cross ties between front & back boom faces
    addStrut(g, getBoomPt(s, false, -1), getBoomPt(s, false, 1), 0.16, craneSteelMat);
    addStrut(g, getBoomPt(s, true, -1), getBoomPt(s, true, 1), 0.16, craneSteelMat);
  }
  // End cap ties
  addStrut(g, getBoomPt(boomSegments, false, -1), getBoomPt(boomSegments, true, -1), 0.2, craneRustMat);
  addStrut(g, getBoomPt(boomSegments, false, 1), getBoomPt(boomSegments, true, 1), 0.2, craneRustMat);

  // Upper A-Frame Apex & Steel Tension Stay Cables
  const apexL = new THREE.Vector3(0, towerH + 6.4, -1.1);
  const apexR = new THREE.Vector3(0, towerH + 6.4, 1.1);
  addStrut(g, apexL, apexR, 0.26, craneRustMat);
  addStrut(g, topCorners[0], apexL, 0.26, craneRustMat);
  addStrut(g, topCorners[1], apexL, 0.26, craneRustMat);
  addStrut(g, topCorners[2], apexR, 0.26, craneRustMat);
  addStrut(g, topCorners[3], apexR, 0.26, craneRustMat);

  // Tension stay cables from apex to boom tips
  addStrut(g, apexL, getBoomPt(1, true, -1), 0.08, mats.darkSteel);
  addStrut(g, apexR, getBoomPt(1, true, 1), 0.08, mats.darkSteel);
  addStrut(g, apexL, getBoomPt(boomSegments - 1, true, -1), 0.08, mats.darkSteel);
  addStrut(g, apexR, getBoomPt(boomSegments - 1, true, 1), 0.08, mats.darkSteel);

  // Suspended Crane Trolley & Swaying Hazard Hook Block (hanging toward left-arena side, Panel A!)
  const hookOrigin = getBoomPt(1.3, false, 0);
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), mats.darkSteel);
  trolley.position.copy(hookOrigin);
  g.add(trolley);

  const hookPivot = new THREE.Group();
  hookPivot.position.set(hookOrigin.x, hookOrigin.y - 0.25, hookOrigin.z);

  const cableLen = 5.4;
  const cableGeo = new THREE.CylinderGeometry(0.032, 0.032, cableLen, 6);
  for (const cx of [-0.2, 0.2]) {
    const cable = new THREE.Mesh(cableGeo, mats.darkSteel);
    cable.position.set(cx, -cableLen / 2, 0);
    hookPivot.add(cable);
  }

  const hookBlock = createCraneHookBlock(mats);
  hookBlock.position.y = -cableLen;
  hookBlock.scale.setScalar(1.25);
  hookPivot.add(hookBlock);
  g.add(hookPivot);

  // Bright Red Warning Beacons on Crane Leg Base, Cab & Boom (exact glow spots from Panels A & C!)
  const legBeacon = createWarningBeacon(mats, false);
  legBeacon.position.set(-baseW / 2 + 0.25, 1.35, baseD / 2 + 0.15);
  g.add(legBeacon);

  const midRedLight = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.45), mats.redNeon);
  midRedLight.position.set(0.2, 11.4, 1.9);
  g.add(midRedLight);

  const boomAmberBar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.26), mats.amberLamp);
  boomAmberBar.position.set(6.5, boomY + 0.7, 1.28);
  g.add(boomAmberBar);

  const craneBaseRedLight = new THREE.PointLight(0xff2233, 24, 16, 1.6);
  craneBaseRedLight.position.set(-baseW / 2 + 0.3, 1.9, baseD / 2 + 1.0);
  g.add(craneBaseRedLight);
  lights.push(craneBaseRedLight);

  const craneWarmLight = new THREE.PointLight(0xff9d3b, 26, 22, 1.5);
  craneWarmLight.position.set(2.5, 9.5, 2.5);
  g.add(craneWarmLight);
  lights.push(craneWarmLight);

  return { group: g, hookPivot, lights };
}

/**
 * Layer 4 Assembly: Mid Structures (Sector D-02, Gantry Crane, Containers, Walkways & All 9 Key Assets)
 */
export function buildMidStructuresLayer(
  textures: ProceduralTextureSet,
  mats: PropMaterials,
): StructuresResult {
  const layerGroup = new THREE.Group();
  layerGroup.name = 'Layer4_MidStructures';

  const banners: AnimatedBannerHandle[] = [];
  const structureLights: THREE.PointLight[] = [];

  // 1. Left Side: Sector D-02 Industrial Control Building (aligned to left arena flank)
  const d02 = buildSectorD02Building(textures, mats);
  d02.group.position.set(-16.6, 0, -0.6);
  layerGroup.add(d02.group);
  banners.push(...d02.banners);
  structureLights.push(...d02.lights);

  // 2. Right-Rear: Massive Lattice Gantry Crane
  const crane = buildGantryCrane(mats);
  crane.group.position.set(9.4, 0, -7.2);
  crane.group.rotation.y = -0.14;
  layerGroup.add(crane.group);
  structureLights.push(...crane.lights);

  // 3. Right Side Cargo Zone: Corrugated Shipping Containers (Panels A, C, D)
  const cRed1 = createShippingContainer(textures, mats, 'red', 6.0);
  cRed1.position.set(11.6, 0, -4.7);
  cRed1.rotation.y = 0.06;
  layerGroup.add(cRed1);

  const cSlate1 = createShippingContainer(textures, mats, 'slate', 5.8);
  cSlate1.position.set(15.6, 0, -0.5);
  cSlate1.rotation.y = Math.PI / 2 - 0.08;
  layerGroup.add(cSlate1);

  const cRed2 = createShippingContainer(textures, mats, 'red', 5.6);
  cRed2.position.set(15.8, 2.6, -0.5);
  cRed2.rotation.y = Math.PI / 2 - 0.04;
  layerGroup.add(cRed2);

  // 4. Tarpaulin-covered Cargo Pallets, Crates & Oil Barrels (Right & Rear perimeter)
  const tarp1 = createTarpPallet(mats);
  tarp1.position.set(12.2, 0, 2.5);
  tarp1.rotation.y = -0.22;
  layerGroup.add(tarp1);

  const crateR1 = createCargoCrate(mats, 1.45);
  crateR1.position.set(13.8, 0, -2.5);
  crateR1.rotation.y = 0.15;
  layerGroup.add(crateR1);

  const crateR2 = createCargoCrate(mats, 1.3);
  crateR2.position.set(7.6, 0, -5.8);
  layerGroup.add(crateR2);

  for (const [bx, bz, v] of [
    [6.1, -6.1, 'red'],
    [5.4, -5.9, 'grey'],
    [11.4, -2.6, 'red'],
    [-9.6, -6.0, 'red'],
    [-8.9, -6.2, 'grey'],
  ] as [number, number, 'red' | 'grey'][]) {
    const barrel = createOilBarrel(textures, mats, v);
    barrel.position.set(bx, 0, bz);
    layerGroup.add(barrel);
  }

  // 5. Yellow Mooring Bollards along the Harbor Edge & Foreground Corners
  const bollardCoords: [number, number][] = [
    [-11.8, -6.9],
    [-4.2, -6.9],
    [3.8, -6.9],
    [13.2, -6.9],
    [-11.5, 6.9],
    [11.5, 6.9],
  ];
  for (const [bx, bz] of bollardCoords) {
    const bollard = createMooringBollard(mats);
    bollard.position.set(bx, 0, bz);
    layerGroup.add(bollard);
  }

  // 6. Yellow Industrial Safety Guardrails along the Rear Harbor Edge (with open sightline!) & Foreground Corners
  const rearRailSegments: [number, number][] = [
    [-9.8, 3.8],
    [-6.0, 3.8],
    [-2.0, 3.8],
    [1.9, 3.8],
    [5.8, 3.8],
    [14.2, 3.8],
  ];
  for (const [rx, rLen] of rearRailSegments) {
    const rail = createSafetyRailing(mats, rLen, 1.05, true);
    rail.position.set(rx, 0, -7.15);
    layerGroup.add(rail);
  }

  // Foreground low corner safety barriers & red beacons (visible in Panel A bottom corners & Panel D!)
  const fgLeftRail = createSafetyRailing(mats, 4.4, 0.95, true);
  fgLeftRail.position.set(-14.2, 0, 7.2);
  layerGroup.add(fgLeftRail);

  const fgRightRail = createSafetyRailing(mats, 4.4, 0.95, true);
  fgRightRail.position.set(14.2, 0, 7.2);
  layerGroup.add(fgRightRail);

  const fgLeftBeacon = createWarningBeacon(mats, true);
  fgLeftBeacon.position.set(-11.8, 0, 7.15);
  layerGroup.add(fgLeftBeacon);

  const fgRightBeacon = createWarningBeacon(mats, true);
  fgRightBeacon.position.set(11.8, 0, 7.15);
  layerGroup.add(fgRightBeacon);

  // 7. Tripod Work Floodlights casting warm amber pools onto the wet fighting floor (Panels A & C!)
  const flood1 = createTripodFloodlight(mats);
  flood1.position.set(8.8, 0, -5.0);
  flood1.rotation.y = -0.58;
  layerGroup.add(flood1);

  const flood1Light = new THREE.PointLight(0xffb452, 22, 18, 1.6);
  flood1Light.position.set(8.2, 2.8, -4.1);
  layerGroup.add(flood1Light);
  structureLights.push(flood1Light);

  const flood2 = createTripodFloodlight(mats);
  flood2.position.set(13.6, 0, 5.1);
  flood2.rotation.y = -2.35;
  layerGroup.add(flood2);

  const flood2Light = new THREE.PointLight(0xff9f38, 18, 16, 1.6);
  flood2Light.position.set(12.8, 2.7, 4.4);
  layerGroup.add(flood2Light);
  structureLights.push(flood2Light);

  // Rear dock low amber safety marker posts casting warm reflections on wet floor edge
  for (const lx of [-8.2, 0.0, 5.2]) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), mats.amberLamp);
    marker.position.set(lx, 1.12, -7.15);
    layerGroup.add(marker);
  }

  return {
    group: layerGroup,
    banners,
    craneHookPivot: crane.hookPivot,
    structureLights,
  };
}
