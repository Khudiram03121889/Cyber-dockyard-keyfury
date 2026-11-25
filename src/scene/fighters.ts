import * as THREE from 'three';

export interface FighterRig {
  root: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  x: number;
  facing: 1 | -1;
}

export interface FightersSystem {
  group: THREE.Group;
  p1: FighterRig;
  p2: FighterRig;
  update: (
    dt: number,
    elapsed: number,
    autoSpar: boolean,
    keys: Set<string>,
  ) => { midX: number; separation: number };
}

/**
 * Builds an articulated 1.8m Cyber-Fighter scale reference rig (12 distinct anatomical parts)
 * Matches the KEY MEASUREMENTS panel (Character Height ~ 1.8m)
 */
function buildFighter(accentHex: number, facing: 1 | -1): FighterRig {
  const root = new THREE.Group();

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x1b2330,
    roughness: 0.38,
    metalness: 0.72,
  });
  const undersuitMat = new THREE.MeshStandardMaterial({
    color: 0x0f1520,
    roughness: 0.78,
    metalness: 0.15,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 2.2,
    roughness: 0.25,
    metalness: 0.2,
  });

  // Ground contact shadow disc (prevents floating look)
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.015;
  root.add(shadowDisc);

  // Subtle fighting ring base indicator on floor
  const ringInd = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.52, 28),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ringInd.rotation.x = -Math.PI / 2;
  ringInd.position.y = 0.022;
  root.add(ringInd);

  // Pelvis / Hip Hub at Y = 0.96m (Total height ~ 1.80m!)
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.24), armorMat);
  pelvis.position.y = 0.96;
  pelvis.castShadow = true;
  root.add(pelvis);

  const makeLeg = (side: -1 | 1) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.14, 0.92, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 6, 10), undersuitMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    leg.add(thigh);

    const shinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.16), armorMat);
    shinGuard.position.set(0, -0.62, 0.02);
    shinGuard.castShadow = true;
    leg.add(shinGuard);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.28), armorMat);
    boot.position.set(0, -0.86, 0.06);
    boot.castShadow = true;
    leg.add(boot);

    return leg;
  };

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  // Dynamic martial-arts fighting stance footwork
  leftLeg.rotation.x = -0.24;
  rightLeg.rotation.x = 0.28;
  root.add(leftLeg, rightLeg);

  // Upper Torso Group
  const torso = new THREE.Group();
  torso.position.y = 1.04;

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.26), armorMat);
  chest.position.y = 0.24;
  chest.castShadow = true;
  torso.add(chest);

  // Glowing chest cyber-core strip
  const coreStrip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.28), accentMat);
  coreStrip.position.y = 0.32;
  torso.add(coreStrip);

  // Head + Glowing Combat Visor (top reaches ~1.80m!)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), undersuitMat);
  neck.position.y = 0.51;
  torso.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.24, 0.24), armorMat);
  head.position.y = 0.65;
  head.castShadow = true;
  torso.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.065, 0.15), accentMat);
  visor.position.set(0, 0.67, 0.065);
  torso.add(visor);

  // Articulated Arms in Guard Stance
  const makeArm = (side: -1 | 1) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.28, 0.42, 0);

    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.2), armorMat);
    pauldron.castShadow = true;
    arm.add(pauldron);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.22, 6, 8), undersuitMat);
    upperArm.position.y = -0.18;
    arm.add(upperArm);

    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.12), armorMat);
    gauntlet.position.set(0, -0.34, 0.16);
    gauntlet.rotation.x = -1.15;
    gauntlet.castShadow = true;
    arm.add(gauntlet);

    const knuckleGlow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.06), accentMat);
    knuckleGlow.position.set(0, -0.38, 0.3);
    arm.add(knuckleGlow);

    return arm;
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  leftArm.rotation.x = -0.82;
  leftArm.rotation.z = 0.18;
  rightArm.rotation.x = -0.56;
  rightArm.rotation.z = -0.18;
  torso.add(leftArm, rightArm);

  root.add(torso);
  root.rotation.y = facing === 1 ? Math.PI / 2 : -Math.PI / 2;

  return {
    root,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    x: facing === 1 ? -4.2 : 4.2,
    facing,
  };
}

export function buildFightersSystem(): FightersSystem {
  const group = new THREE.Group();
  group.name = 'ScaleFighters_1_8m';

  const p1 = buildFighter(0x00e5ff, 1);
  const p2 = buildFighter(0xff2a3c, -1);

  p1.root.position.set(p1.x, 0, 0.4);
  p2.root.position.set(p2.x, 0, 0.4);

  group.add(p1.root, p2.root);

  const ARENA_BOUND = 11.2;
  const MIN_GAP = 1.65;

  function update(dt: number, elapsed: number, autoSpar: boolean, keys: Set<string>) {
    const moveSpeed = 5.4;

    const p1Manual = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    const p2Manual = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);

    if (p1Manual !== 0 || p2Manual !== 0) {
      p1.x = THREE.MathUtils.clamp(p1.x + p1Manual * moveSpeed * dt, -ARENA_BOUND, p2.x - MIN_GAP);
      p2.x = THREE.MathUtils.clamp(p2.x + p2Manual * moveSpeed * dt, p1.x + MIN_GAP, ARENA_BOUND);
    } else if (autoSpar) {
      // Subtle footsies spacing sway so the user can watch the fighting camera track naturally
      const centerDrift = Math.sin(elapsed * 0.45) * 3.8;
      const spacing = 2.6 + Math.sin(elapsed * 1.1) * 1.15;
      p1.x = THREE.MathUtils.damp(p1.x, centerDrift - spacing, 3.0, dt);
      p2.x = THREE.MathUtils.damp(p2.x, centerDrift + spacing, 3.0, dt);
    }

    p1.root.position.x = p1.x;
    p2.root.position.x = p2.x;

    // Breathing & guard bobbing animations
    const bob1 = Math.sin(elapsed * 4.4) * 0.045;
    const bob2 = Math.sin(elapsed * 4.4 + 1.4) * 0.045;
    p1.torso.position.y = 1.04 + bob1;
    p2.torso.position.y = 1.04 + bob2;
    p1.leftArm.rotation.x = -0.82 + Math.sin(elapsed * 4.4) * 0.1;
    p1.rightArm.rotation.x = -0.56 - Math.sin(elapsed * 4.4) * 0.08;
    p2.leftArm.rotation.x = -0.82 + Math.sin(elapsed * 4.4 + 1.4) * 0.1;
    p2.rightArm.rotation.x = -0.56 - Math.sin(elapsed * 4.4 + 1.4) * 0.08;

    return {
      midX: (p1.x + p2.x) * 0.5,
      separation: Math.abs(p2.x - p1.x),
    };
  }

  return { group, p1, p2, update };
}
