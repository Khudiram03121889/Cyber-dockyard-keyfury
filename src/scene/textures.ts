import * as THREE from 'three';

export interface ProceduralTextureSet {
  floorAlbedo: THREE.CanvasTexture;
  floorRoughness: THREE.CanvasTexture;
  floorBump: THREE.CanvasTexture;
  d02WallAlbedo: THREE.CanvasTexture;
  d02WallBump: THREE.CanvasTexture;
  concreteAlbedo: THREE.CanvasTexture;
  concreteBump: THREE.CanvasTexture;
  bannerAlbedo: THREE.CanvasTexture;
  bannerAlpha: THREE.CanvasTexture;
  containerRedAlbedo: THREE.CanvasTexture;
  containerSlateAlbedo: THREE.CanvasTexture;
  containerBump: THREE.CanvasTexture;
  vesselHullAlbedo: THREE.CanvasTexture;
  vesselHullBump: THREE.CanvasTexture;
  hazardAlbedo: THREE.CanvasTexture;
  barrelRedAlbedo: THREE.CanvasTexture;
  barrelGreyAlbedo: THREE.CanvasTexture;
  grateAlbedo: THREE.CanvasTexture;
  grateBump: THREE.CanvasTexture;
  cityFacadeAlbedo: THREE.CanvasTexture;
  cityFacadeEmissive: THREE.CanvasTexture;
  hologramTexture: THREE.CanvasTexture;
  moonTexture: THREE.CanvasTexture;
  softGlowTexture: THREE.CanvasTexture;
  cloudTexture: THREE.CanvasTexture;
  dispose: () => void;
}

// Deterministic pseudo-random helper so procedural weathering is consistent
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  } else {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  tex.needsUpdate = true;
  return tex;
}

function createArenaFloorTextures(maxAniso: number) {
  const W = 2048;
  const H = 1024;
  const rng = mulberry32(40291);

  const [albedoC, aCtx] = makeCanvas(W, H);
  const [roughC, rCtx] = makeCanvas(W, H);
  const [bumpC, bCtx] = makeCanvas(W, H);

  // Base dark damp concrete-steel deck
  aCtx.fillStyle = '#252c37';
  aCtx.fillRect(0, 0, W, H);

  // Base roughness: damp concrete ~0.58 (148)
  rCtx.fillStyle = 'rgb(148,148,148)';
  rCtx.fillRect(0, 0, W, H);

  // Base bump neutral
  bCtx.fillStyle = 'rgb(128,128,128)';
  bCtx.fillRect(0, 0, W, H);

  // Concrete aggregate & oil weathering blotches
  for (let i = 0; i < 650; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const rad = 18 + rng() * 110;
    const shade = Math.floor(26 + rng() * 34);
    const blueBias = Math.floor(rng() * 12);
    const alpha = 0.06 + rng() * 0.14;
    const grad = aCtx.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, `rgba(${shade}, ${shade + 4}, ${shade + 8 + blueBias}, ${alpha})`);
    grad.addColorStop(1, 'rgba(30,36,44,0)');
    aCtx.fillStyle = grad;
    aCtx.beginPath();
    aCtx.arc(x, y, rad, 0, Math.PI * 2);
    aCtx.fill();

    // Matching slight roughness variation
    const rv = Math.floor(110 + rng() * 85);
    const rGrad = rCtx.createRadialGradient(x, y, 2, x, y, rad);
    rGrad.addColorStop(0, `rgba(${rv},${rv},${rv},0.22)`);
    rGrad.addColorStop(1, 'rgba(148,148,148,0)');
    rCtx.fillStyle = rGrad;
    rCtx.beginPath();
    rCtx.arc(x, y, rad, 0, Math.PI * 2);
    rCtx.fill();
  }

  // Subtle rust stains near left/right structure zones
  for (let i = 0; i < 90; i++) {
    const side = rng() < 0.5 ? rng() * 440 : W - rng() * 440;
    const y = rng() * H;
    const rad = 16 + rng() * 70;
    const grad = aCtx.createRadialGradient(side, y, 2, side, y, rad);
    grad.addColorStop(0, `rgba(115, 58, 32, ${0.12 + rng() * 0.18})`);
    grad.addColorStop(1, 'rgba(115, 58, 32, 0)');
    aCtx.fillStyle = grad;
    aCtx.beginPath();
    aCtx.arc(side, y, rad, 0, Math.PI * 2);
    aCtx.fill();
  }

  // Heavy industrial concrete / steel plate panel grid
  const cols = 16;
  const rows = 8;
  const cw = W / cols;
  const ch = H / rows;

  aCtx.strokeStyle = 'rgba(10, 14, 20, 0.72)';
  aCtx.lineWidth = 3;
  bCtx.strokeStyle = 'rgb(45,45,45)';
  bCtx.lineWidth = 4;

  for (let c = 0; c <= cols; c++) {
    const x = Math.round(c * cw);
    aCtx.beginPath();
    aCtx.moveTo(x, 0);
    aCtx.lineTo(x, H);
    aCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(x, 0);
    bCtx.lineTo(x, H);
    bCtx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * ch);
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(W, y);
    aCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(W, y);
    bCtx.stroke();
  }

  // Corner bolts and subtle plate luminance shifts
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const px = c * cw;
      const py = r * ch;
      const delta = (rng() - 0.5) * 16;
      aCtx.fillStyle = delta > 0 ? `rgba(180,200,220,${delta * 0.004})` : `rgba(0,0,0,${-delta * 0.005})`;
      aCtx.fillRect(px + 2, py + 2, cw - 4, ch - 4);

      // Corner rivets
      bCtx.fillStyle = 'rgb(195,195,195)';
      const inset = 10;
      const corners = [
        [px + inset, py + inset],
        [px + cw - inset, py + inset],
        [px + inset, py + ch - inset],
        [px + cw - inset, py + ch - inset],
      ];
      for (const [bx, by] of corners) {
        bCtx.beginPath();
        bCtx.arc(bx, by, 3, 0, Math.PI * 2);
        bCtx.fill();
      }
    }
  }

  // Drainage steel grates along front (bottom) and rear (top) borders
  const drawGrateStrip = (yStart: number, stripH: number) => {
    aCtx.fillStyle = '#181e27';
    aCtx.fillRect(140, yStart, W - 280, stripH);
    bCtx.fillStyle = 'rgb(75,75,75)';
    bCtx.fillRect(140, yStart, W - 280, stripH);
    aCtx.fillStyle = '#0c1017';
    bCtx.fillStyle = 'rgb(20,20,20)';
    for (let gx = 152; gx < W - 152; gx += 14) {
      aCtx.fillRect(gx, yStart + 6, 7, stripH - 12);
      bCtx.fillRect(gx, yStart + 6, 7, stripH - 12);
    }
  };
  drawGrateStrip(36, 40);
  drawGrateStrip(H - 76, 40);

  // Perimeter yellow/black hazard border stripes along top and bottom edge
  const drawHazardBand = (yStart: number, bandH: number) => {
    aCtx.save();
    aCtx.beginPath();
    aCtx.rect(140, yStart, W - 280, bandH);
    aCtx.clip();
    aCtx.fillStyle = '#d49419';
    aCtx.fillRect(140, yStart, W - 280, bandH);
    aCtx.fillStyle = '#161a21';
    for (let sx = 80; sx < W; sx += 44) {
      aCtx.beginPath();
      aCtx.moveTo(sx, yStart + bandH);
      aCtx.lineTo(sx + 20, yStart + bandH);
      aCtx.lineTo(sx + 38, yStart);
      aCtx.lineTo(sx + 18, yStart);
      aCtx.closePath();
      aCtx.fill();
    }
    aCtx.restore();
  };
  drawHazardBand(84, 20);
  drawHazardBand(H - 104, 20);

  // Signature Center Helipad / Fighting Arena Concentric Yellow Markings (Panels A, D, Top Overview)
  const cx = W * 0.5;
  const cy = H * 0.5;

  // Slightly darker circular steel center deck plate
  aCtx.save();
  aCtx.beginPath();
  aCtx.arc(cx, cy, 330, 0, Math.PI * 2);
  aCtx.fillStyle = 'rgba(20, 26, 36, 0.45)';
  aCtx.fill();

  // Outer industrial yellow double ring
  aCtx.strokeStyle = '#e5a01d';
  aCtx.lineWidth = 14;
  aCtx.beginPath();
  aCtx.arc(cx, cy, 316, 0, Math.PI * 2);
  aCtx.stroke();

  // Dashed mid ring
  aCtx.strokeStyle = '#d4911a';
  aCtx.lineWidth = 6;
  aCtx.setLineDash([42, 22]);
  aCtx.beginPath();
  aCtx.arc(cx, cy, 278, 0, Math.PI * 2);
  aCtx.stroke();
  aCtx.setLineDash([]);

  // Inner ring
  aCtx.strokeStyle = '#e5a01d';
  aCtx.lineWidth = 8;
  aCtx.beginPath();
  aCtx.arc(cx, cy, 178, 0, Math.PI * 2);
  aCtx.stroke();

  // Subtle cyan/steel innermost accent ring
  aCtx.strokeStyle = 'rgba(130, 175, 205, 0.35)';
  aCtx.lineWidth = 4;
  aCtx.beginPath();
  aCtx.arc(cx, cy, 94, 0, Math.PI * 2);
  aCtx.stroke();

  // Radial alignment ticks (N, E, S, W & 45 deg)
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const isCardinal = i % 4 === 0;
    const r0 = isCardinal ? 186 : 284;
    const r1 = isCardinal ? 310 : 308;
    aCtx.strokeStyle = isCardinal ? '#e5a01d' : 'rgba(229, 160, 29, 0.72)';
    aCtx.lineWidth = isCardinal ? 10 : 5;
    aCtx.beginPath();
    aCtx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
    aCtx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    aCtx.stroke();
  }

  // Subtle horizontal fighting lane center guide lines extending left & right
  aCtx.strokeStyle = 'rgba(229, 160, 29, 0.48)';
  aCtx.lineWidth = 5;
  aCtx.setLineDash([28, 18]);
  aCtx.beginPath();
  aCtx.moveTo(280, cy);
  aCtx.lineTo(cx - 340, cy);
  aCtx.moveTo(cx + 340, cy);
  aCtx.lineTo(W - 280, cy);
  aCtx.stroke();
  aCtx.setLineDash([]);

  // Subtle stencil "02" in center
  aCtx.fillStyle = 'rgba(229, 160, 29, 0.25)';
  aCtx.font = '700 84px "Chakra Petch", sans-serif';
  aCtx.textAlign = 'center';
  aCtx.textBaseline = 'middle';
  aCtx.fillText('02', cx, cy + 4);
  aCtx.restore();

  // Scuff / tire / combat wear marks over painted yellow rings so they look realistic, never flat vector
  for (let i = 0; i < 420; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const w = 8 + rng() * 34;
    const h = 3 + rng() * 14;
    aCtx.save();
    aCtx.translate(x, y);
    aCtx.rotate(rng() * Math.PI);
    aCtx.fillStyle = `rgba(26, 32, 42, ${0.15 + rng() * 0.35})`;
    aCtx.fillRect(-w / 2, -h / 2, w, h);
    aCtx.restore();
  }

  // Organic RAIN PUDDLES in Roughness Map (dark = glossy wet reflection!) and subtle darkening in Albedo
  const puddles = [
    { x: W * 0.24, y: H * 0.56, rx: 190, ry: 95 },
    { x: W * 0.36, y: H * 0.42, rx: 165, ry: 85 },
    { x: W * 0.52, y: H * 0.53, rx: 245, ry: 125 },
    { x: W * 0.67, y: H * 0.45, rx: 200, ry: 105 },
    { x: W * 0.77, y: H * 0.60, rx: 185, ry: 90 },
    { x: W * 0.44, y: H * 0.72, rx: 170, ry: 72 },
    { x: W * 0.58, y: H * 0.28, rx: 160, ry: 75 },
    { x: W * 0.18, y: H * 0.35, rx: 140, ry: 70 },
    { x: W * 0.84, y: H * 0.36, rx: 145, ry: 75 },
  ];

  for (const p of puddles) {
    // Glossy mirror-wet puddle core in roughness map (rgb 16 -> roughness ~0.06)
    rCtx.save();
    rCtx.translate(p.x, p.y);
    rCtx.scale(1, p.ry / p.rx);
    const rg = rCtx.createRadialGradient(0, 0, p.rx * 0.15, 0, 0, p.rx);
    rg.addColorStop(0, 'rgba(14, 14, 14, 0.96)');
    rg.addColorStop(0.62, 'rgba(24, 24, 24, 0.88)');
    rg.addColorStop(0.88, 'rgba(90, 90, 90, 0.4)');
    rg.addColorStop(1, 'rgba(148, 148, 148, 0)');
    rCtx.fillStyle = rg;
    rCtx.beginPath();
    rCtx.arc(0, 0, p.rx, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.restore();

    // Slightly darker wet concrete tint inside puddle
    aCtx.save();
    aCtx.translate(p.x, p.y);
    aCtx.scale(1, p.ry / p.rx);
    const ag = aCtx.createRadialGradient(0, 0, p.rx * 0.1, 0, 0, p.rx);
    ag.addColorStop(0, 'rgba(10, 15, 24, 0.38)');
    ag.addColorStop(0.75, 'rgba(10, 15, 24, 0.22)');
    ag.addColorStop(1, 'rgba(10, 15, 24, 0)');
    aCtx.fillStyle = ag;
    aCtx.beginPath();
    aCtx.arc(0, 0, p.rx, 0, Math.PI * 2);
    aCtx.fill();
    aCtx.restore();

    // Smooth flat bump inside standing water
    bCtx.save();
    bCtx.translate(p.x, p.y);
    bCtx.scale(1, p.ry / p.rx);
    const bg = bCtx.createRadialGradient(0, 0, p.rx * 0.1, 0, 0, p.rx);
    bg.addColorStop(0, 'rgba(128, 128, 128, 0.92)');
    bg.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bCtx.fillStyle = bg;
    bCtx.beginPath();
    bCtx.arc(0, 0, p.rx, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.restore();
  }

  return {
    floorAlbedo: finalizeTexture(albedoC, true, maxAniso),
    floorRoughness: finalizeTexture(roughC, false, maxAniso),
    floorBump: finalizeTexture(bumpC, false, maxAniso),
  };
}

function createConcreteTextures(maxAniso: number, withD02Stencil: boolean) {
  const W = 1024;
  const H = 1024;
  const rng = mulberry32(withD02Stencil ? 9921 : 5513);

  const [albedoC, aCtx] = makeCanvas(W, H);
  const [bumpC, bCtx] = makeCanvas(W, H);

  aCtx.fillStyle = '#4c5460';
  aCtx.fillRect(0, 0, W, H);
  bCtx.fillStyle = 'rgb(128,128,128)';
  bCtx.fillRect(0, 0, W, H);

  // Concrete noise & weathering
  for (let i = 0; i < 500; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = 10 + rng() * 64;
    const v = Math.floor(55 + rng() * 48);
    aCtx.fillStyle = `rgba(${v},${v + 3},${v + 7},${0.08 + rng() * 0.14})`;
    aCtx.beginPath();
    aCtx.arc(x, y, r, 0, Math.PI * 2);
    aCtx.fill();

    const bv = Math.floor(95 + rng() * 65);
    bCtx.fillStyle = `rgba(${bv},${bv},${bv},0.22)`;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 0.6, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Horizontal formwork seam lines
  aCtx.strokeStyle = 'rgba(20, 24, 30, 0.55)';
  aCtx.lineWidth = 4;
  bCtx.strokeStyle = 'rgb(50,50,50)';
  bCtx.lineWidth = 5;
  for (let y = 128; y < H; y += 128) {
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(W, y);
    aCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(W, y);
    bCtx.stroke();
  }

  // Vertical rain & rust streaks dripping from top ledges
  for (let i = 0; i < 65; i++) {
    const x = rng() * W;
    const y = rng() * H * 0.4;
    const h = 80 + rng() * 420;
    const w = 6 + rng() * 24;
    const isRust = rng() < 0.45;
    const grad = aCtx.createLinearGradient(x, y, x, y + h);
    if (isRust) {
      grad.addColorStop(0, 'rgba(115, 58, 28, 0.46)');
      grad.addColorStop(1, 'rgba(115, 58, 28, 0)');
    } else {
      grad.addColorStop(0, 'rgba(16, 20, 28, 0.42)');
      grad.addColorStop(1, 'rgba(16, 20, 28, 0)');
    }
    aCtx.fillStyle = grad;
    aCtx.fillRect(x, y, w, h);
  }

  // Dark moisture grime near ground contact (bottom)
  const gGrad = aCtx.createLinearGradient(0, H * 0.72, 0, H);
  gGrad.addColorStop(0, 'rgba(15, 19, 25, 0)');
  gGrad.addColorStop(1, 'rgba(15, 19, 25, 0.65)');
  aCtx.fillStyle = gGrad;
  aCtx.fillRect(0, H * 0.72, W, H * 0.28);

  if (withD02Stencil) {
    // Crisp industrial "D-02" stencil matching Panels A & B!
    aCtx.save();
    aCtx.fillStyle = 'rgba(228, 234, 242, 0.88)';
    aCtx.font = '700 220px "Chakra Petch", sans-serif';
    aCtx.textAlign = 'center';
    aCtx.textBaseline = 'middle';
    aCtx.fillText('D-02', W * 0.5, H * 0.54);

    // Subtle warning bar below D-02
    aCtx.fillStyle = 'rgba(229, 160, 29, 0.82)';
    aCtx.fillRect(W * 0.24, H * 0.71, W * 0.52, 16);

    // Subtle weathering scratches across stencil
    for (let i = 0; i < 40; i++) {
      aCtx.fillStyle = 'rgba(72, 80, 92, 0.42)';
      aCtx.fillRect(
        W * 0.18 + rng() * W * 0.64,
        H * 0.42 + rng() * H * 0.24,
        6 + rng() * 28,
        3 + rng() * 10,
      );
    }
    aCtx.restore();
  }

  return {
    albedo: finalizeTexture(albedoC, true, maxAniso),
    bump: finalizeTexture(bumpC, false, maxAniso),
  };
}

function createBannerTextures(maxAniso: number) {
  const W = 512;
  const H = 1024;
  const [albedoC, ctx] = makeCanvas(W, H);
  const [alphaC, alCtx] = makeCanvas(W, H);

  // Swallowtail V-cut pennant silhouette in alpha mask
  alCtx.fillStyle = '#000000';
  alCtx.fillRect(0, 0, W, H);
  alCtx.fillStyle = '#ffffff';
  alCtx.beginPath();
  alCtx.moveTo(24, 0);
  alCtx.lineTo(W - 24, 0);
  alCtx.lineTo(W - 24, H * 0.82);
  alCtx.lineTo(W * 0.5, H * 0.98);
  alCtx.lineTo(24, H * 0.82);
  alCtx.closePath();
  alCtx.fill();

  // Rich crimson fabric gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#a8141c');
  grad.addColorStop(0.5, '#8c0e15');
  grad.addColorStop(1, '#5d090e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle vertical cloth weave folds
  for (let x = 0; x < W; x += 6) {
    const shade = Math.sin((x / W) * Math.PI * 10) * 14;
    ctx.fillStyle = shade > 0 ? `rgba(255,180,180,${shade * 0.005})` : `rgba(0,0,0,${-shade * 0.008})`;
    ctx.fillRect(x, 0, 6, H);
  }

  // Gold-amber inner trim border matching the reference sheet banner
  ctx.strokeStyle = '#d49a38';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(52, 26);
  ctx.lineTo(W - 52, 26);
  ctx.lineTo(W - 52, H * 0.79);
  ctx.lineTo(W * 0.5, H * 0.93);
  ctx.lineTo(52, H * 0.79);
  ctx.closePath();
  ctx.stroke();

  // Crisp White Futuristic Winged-Blade Emblem (exact motif from Panels A, B, D & Key Assets)
  ctx.save();
  ctx.translate(W * 0.5, H * 0.43);
  ctx.fillStyle = '#f4f7fb';

  // Central sharp vertical spear/blade
  ctx.beginPath();
  ctx.moveTo(0, -185);
  ctx.lineTo(26, -65);
  ctx.lineTo(14, 155);
  ctx.lineTo(0, 195);
  ctx.lineTo(-14, 155);
  ctx.lineTo(-26, -65);
  ctx.closePath();
  ctx.fill();

  // Upper swept outer wings (left & right symmetric)
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * 24, -45);
    ctx.lineTo(dir * 148, -112);
    ctx.lineTo(dir * 104, -18);
    ctx.lineTo(dir * 136, 12);
    ctx.lineTo(dir * 42, 48);
    ctx.lineTo(dir * 72, -16);
    ctx.closePath();
    ctx.fill();

    // Lower secondary wing blades
    ctx.beginPath();
    ctx.moveTo(dir * 26, 48);
    ctx.lineTo(dir * 92, 66);
    ctx.lineTo(dir * 48, 128);
    ctx.lineTo(dir * 18, 92);
    ctx.closePath();
    ctx.fill();
  }

  // Small diamond crown above blade
  ctx.beginPath();
  ctx.moveTo(0, -238);
  ctx.lineTo(22, -206);
  ctx.lineTo(0, -190);
  ctx.lineTo(-22, -206);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Subtle grime at bottom tip
  const tipGrad = ctx.createLinearGradient(0, H * 0.75, 0, H);
  tipGrad.addColorStop(0, 'rgba(15,5,5,0)');
  tipGrad.addColorStop(1, 'rgba(15,5,5,0.45)');
  ctx.fillStyle = tipGrad;
  ctx.fillRect(0, H * 0.75, W, H * 0.25);

  return {
    bannerAlbedo: finalizeTexture(albedoC, true, maxAniso),
    bannerAlpha: finalizeTexture(alphaC, false, maxAniso),
  };
}

function createContainerTextures(maxAniso: number) {
  const W = 1024;
  const H = 512;
  const rng = mulberry32(7331);

  const buildVariant = (baseHex: string, darkHex: string, code: string) => {
    const [c, ctx] = makeCanvas(W, H);
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, W, H);

    // Corrugated steel vertical ribs
    const ribW = 28;
    for (let x = 0; x < W; x += ribW) {
      const g = ctx.createLinearGradient(x, 0, x + ribW, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.34)');
      g.addColorStop(0.28, 'rgba(255,255,255,0.12)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.03)');
      g.addColorStop(1, 'rgba(0,0,0,0.38)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 34, ribW, H - 68);
    }

    // Top and bottom steel header rails
    ctx.fillStyle = darkHex;
    ctx.fillRect(0, 0, W, 36);
    ctx.fillRect(0, H - 36, W, 36);

    // Rust & salt-spray weathering
    for (let i = 0; i < 80; i++) {
      const x = rng() * W;
      const y = rng() * H;
      const rad = 8 + rng() * 34;
      const g = ctx.createRadialGradient(x, y, 1, x, y, rad);
      g.addColorStop(0, `rgba(110, 48, 22, ${0.18 + rng() * 0.24})`);
      g.addColorStop(1, 'rgba(110, 48, 22, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shipping stencil markings
    ctx.fillStyle = 'rgba(235, 240, 245, 0.72)';
    ctx.font = '700 44px "JetBrains Mono", monospace';
    ctx.fillText(code, 68, 108);
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.fillText('MAX GROSS 30,480 KG', 68, 146);

    return finalizeTexture(c, true, maxAniso);
  };

  // Corrugation bump map
  const [bC, bCtx] = makeCanvas(W, H);
  bCtx.fillStyle = 'rgb(128,128,128)';
  bCtx.fillRect(0, 0, W, H);
  const ribW = 28;
  for (let x = 0; x < W; x += ribW) {
    const g = bCtx.createLinearGradient(x, 0, x + ribW, 0);
    g.addColorStop(0, 'rgb(40,40,40)');
    g.addColorStop(0.35, 'rgb(225,225,225)');
    g.addColorStop(0.65, 'rgb(225,225,225)');
    g.addColorStop(1, 'rgb(40,40,40)');
    bCtx.fillStyle = g;
    bCtx.fillRect(x, 34, ribW, H - 68);
  }

  return {
    containerRedAlbedo: buildVariant('#8b2320', '#581614', 'CYB-0248'),
    containerSlateAlbedo: buildVariant('#364152', '#222a36', 'DOCK-K37'),
    containerBump: finalizeTexture(bC, false, maxAniso),
  };
}

function createVesselHullTextures(maxAniso: number) {
  const W = 1024;
  const H = 512;
  const rng = mulberry32(3701);

  const [aC, aCtx] = makeCanvas(W, H);
  const [bC, bCtx] = makeCanvas(W, H);

  // Dark weathered naval steel hull
  const hullGrad = aCtx.createLinearGradient(0, 0, 0, H);
  hullGrad.addColorStop(0, '#2e3846');
  hullGrad.addColorStop(0.68, '#232c38');
  hullGrad.addColorStop(0.72, '#4a2320'); // Reddish anti-fouling waterline boot
  hullGrad.addColorStop(1, '#311614');
  aCtx.fillStyle = hullGrad;
  aCtx.fillRect(0, 0, W, H);

  bCtx.fillStyle = 'rgb(128,128,128)';
  bCtx.fillRect(0, 0, W, H);

  // Steel plate weld grid
  aCtx.strokeStyle = 'rgba(15, 20, 28, 0.5)';
  aCtx.lineWidth = 3;
  bCtx.strokeStyle = 'rgb(170,170,170)';
  bCtx.lineWidth = 3;
  for (let y = 0; y < H; y += 64) {
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(W, y);
    aCtx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(W, y);
    bCtx.stroke();
  }
  for (let x = 0; x < W; x += 128) {
    aCtx.beginPath();
    aCtx.moveTo(x, 0);
    aCtx.lineTo(x, H);
    aCtx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(x, 0);
    bCtx.lineTo(x, H);
    bCtx.stroke();
  }

  // Heavy maritime rust streaks running vertically down from scuppers
  for (let i = 0; i < 85; i++) {
    const x = rng() * W;
    const y = 10 + rng() * 140;
    const h = 110 + rng() * 260;
    const w = 6 + rng() * 20;
    const g = aCtx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(128, 56, 26, ${0.26 + rng() * 0.25})`);
    g.addColorStop(1, 'rgba(128, 56, 26, 0)');
    aCtx.fillStyle = g;
    aCtx.fillRect(x, y, w, h);
  }

  // Iconic bold white stenciled hull number "K-37" (Panels A, C, D!)
  aCtx.save();
  aCtx.fillStyle = 'rgba(222, 230, 238, 0.85)';
  aCtx.font = '700 132px "Chakra Petch", sans-serif';
  aCtx.textAlign = 'center';
  aCtx.textBaseline = 'middle';
  aCtx.fillText('K-37', W * 0.38, H * 0.44);
  aCtx.fillText('K-37', W * 0.78, H * 0.44);

  // Subtle weathering scuffs over letters
  for (let i = 0; i < 30; i++) {
    aCtx.fillStyle = 'rgba(40, 48, 60, 0.35)';
    aCtx.fillRect(rng() * W, H * 0.32 + rng() * 110, 8 + rng() * 24, 3 + rng() * 8);
  }
  aCtx.restore();

  return {
    vesselHullAlbedo: finalizeTexture(aC, true, maxAniso),
    vesselHullBump: finalizeTexture(bC, false, maxAniso),
  };
}

function createHazardStripeTexture(maxAniso: number) {
  const S = 512;
  const [c, ctx] = makeCanvas(S, S);
  ctx.fillStyle = '#e6a419';
  ctx.fillRect(0, 0, S, S);

  ctx.fillStyle = '#181c22';
  for (let i = -S; i < S * 2; i += 96) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 48, 0);
    ctx.lineTo(i + 48 - S, S);
    ctx.lineTo(i - S, S);
    ctx.closePath();
    ctx.fill();
  }

  // Light industrial grime overlay
  const rng = mulberry32(411);
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(25, 22, 18, ${0.08 + rng() * 0.14})`;
    ctx.fillRect(rng() * S, rng() * S, 6 + rng() * 24, 4 + rng() * 12);
  }

  return finalizeTexture(c, true, maxAniso, 1, 1);
}

function createBarrelTexture(maxAniso: number, baseColor: string, stripeColor: string) {
  const W = 512;
  const H = 512;
  const rng = mulberry32(baseColor.charCodeAt(1) * 19);
  const [c, ctx] = makeCanvas(W, H);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, H);

  // Center band
  ctx.fillStyle = stripeColor;
  ctx.fillRect(0, H * 0.38, W, H * 0.24);

  // Rust & oil drip wear
  for (let i = 0; i < 90; i++) {
    const x = rng() * W;
    const y = rng() * H;
    ctx.fillStyle = `rgba(58, 28, 16, ${0.14 + rng() * 0.22})`;
    ctx.fillRect(x, y, 4 + rng() * 16, 12 + rng() * 54);
  }

  // Small hazard diamond on band
  ctx.save();
  ctx.translate(W * 0.5, H * 0.5);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#c81e24';
  ctx.fillRect(-22, -22, 44, 44);
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 4;
  ctx.strokeRect(-22, -22, 44, 44);
  ctx.restore();

  return finalizeTexture(c, true, maxAniso);
}

function createGrateTextures(maxAniso: number) {
  const S = 256;
  const [aC, aCtx] = makeCanvas(S, S);
  const [bC, bCtx] = makeCanvas(S, S);

  aCtx.fillStyle = '#1e242e';
  aCtx.fillRect(0, 0, S, S);
  bCtx.fillStyle = 'rgb(70,70,70)';
  bCtx.fillRect(0, 0, S, S);

  aCtx.strokeStyle = '#384354';
  aCtx.lineWidth = 6;
  bCtx.strokeStyle = 'rgb(210,210,210)';
  bCtx.lineWidth = 6;

  for (let i = 0; i <= S; i += 32) {
    aCtx.beginPath();
    aCtx.moveTo(i, 0);
    aCtx.lineTo(i, S);
    aCtx.moveTo(0, i);
    aCtx.lineTo(S, i);
    aCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(i, 0);
    bCtx.lineTo(i, S);
    bCtx.moveTo(0, i);
    bCtx.lineTo(S, i);
    bCtx.stroke();
  }

  return {
    grateAlbedo: finalizeTexture(aC, true, maxAniso, 4, 4),
    grateBump: finalizeTexture(bC, false, maxAniso, 4, 4),
  };
}

function createCityFacadeTextures(maxAniso: number) {
  const W = 512;
  const H = 1024;
  const rng = mulberry32(2077);

  const [aC, aCtx] = makeCanvas(W, H);
  const [eC, eCtx] = makeCanvas(W, H);

  aCtx.fillStyle = '#0d1526';
  aCtx.fillRect(0, 0, W, H);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, W, H);

  const palette = [
    '#38e8ff',
    '#0ea5e9',
    '#60a5fa',
    '#e879f9',
    '#f43f5e',
    '#fbbf24',
    '#dbeafe',
  ];

  const rows = 48;
  const cols = 16;
  const cellW = W / cols;
  const cellH = H / rows;

  for (let r = 1; r < rows - 1; r++) {
    const floorLitChance = 0.2 + rng() * 0.55;
    const floorAccent = palette[Math.floor(rng() * palette.length)];
    for (let c = 1; c < cols - 1; c++) {
      if (rng() < floorLitChance) {
        const col = rng() < 0.72 ? floorAccent : palette[Math.floor(rng() * palette.length)];
        const alpha = 0.45 + rng() * 0.55;
        aCtx.fillStyle = col;
        aCtx.globalAlpha = alpha;
        aCtx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8);

        eCtx.fillStyle = col;
        eCtx.globalAlpha = alpha;
        eCtx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8);
      }
    }
  }
  aCtx.globalAlpha = 1;
  eCtx.globalAlpha = 1;

  return {
    cityFacadeAlbedo: finalizeTexture(aC, true, maxAniso),
    cityFacadeEmissive: finalizeTexture(eC, true, maxAniso),
  };
}

function createHologramTexture(maxAniso: number) {
  const W = 512;
  const H = 768;
  const [c, ctx] = makeCanvas(W, H);

  // Deep translucent cyan screen backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
  bg.addColorStop(0.45, 'rgba(34, 211, 238, 0.55)');
  bg.addColorStop(1, 'rgba(14, 116, 144, 0.25)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Outer glowing cyber frame
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Stylized futuristic holographic face & shoulders (Panel A center-right hologram!)
  ctx.save();
  ctx.translate(W * 0.5, H * 0.48);

  // Soft aura behind head
  const aura = ctx.createRadialGradient(0, -40, 20, 0, -40, 210);
  aura.addColorStop(0, 'rgba(165, 243, 252, 0.9)');
  aura.addColorStop(0.55, 'rgba(34, 211, 238, 0.45)');
  aura.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -40, 210, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders & neck
  ctx.fillStyle = 'rgba(207, 250, 254, 0.78)';
  ctx.beginPath();
  ctx.moveTo(-175, 290);
  ctx.quadraticCurveTo(-135, 165, -48, 138);
  ctx.lineTo(-34, 72);
  ctx.lineTo(34, 72);
  ctx.lineTo(48, 138);
  ctx.quadraticCurveTo(135, 165, 175, 290);
  ctx.closePath();
  ctx.fill();

  // Sculpted head silhouette
  const faceGrad = ctx.createLinearGradient(-90, -190, 90, 80);
  faceGrad.addColorStop(0, 'rgba(236, 254, 255, 0.95)');
  faceGrad.addColorStop(0.5, 'rgba(103, 232, 249, 0.85)');
  faceGrad.addColorStop(1, 'rgba(8, 145, 178, 0.88)');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.ellipse(0, -58, 96, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cyber facial contours (brow, eyes, nose bridge, mouth)
  ctx.fillStyle = 'rgba(8, 51, 68, 0.65)';
  // Left & right eye sockets
  ctx.beginPath();
  ctx.ellipse(-36, -68, 22, 9, -0.08, 0, Math.PI * 2);
  ctx.ellipse(36, -68, 22, 9, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Glowing pupils
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-36, -68, 5, 0, Math.PI * 2);
  ctx.arc(36, -68, 5, 0, Math.PI * 2);
  ctx.fill();

  // Nose bridge & chin contour lines
  ctx.strokeStyle = 'rgba(14, 116, 144, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -78);
  ctx.lineTo(-5, -16);
  ctx.lineTo(5, -16);
  ctx.stroke();

  // Lips
  ctx.fillStyle = 'rgba(14, 116, 144, 0.62)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle holographic circuit lines on cheeks
  ctx.strokeStyle = 'rgba(236, 254, 255, 0.72)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-78, -32);
  ctx.lineTo(-48, -18);
  ctx.lineTo(-48, 20);
  ctx.moveTo(78, -32);
  ctx.lineTo(48, -18);
  ctx.lineTo(48, 20);
  ctx.stroke();

  ctx.restore();

  // Horizontal holographic scanlines
  ctx.fillStyle = 'rgba(2, 24, 38, 0.34)';
  for (let y = 0; y < H; y += 8) {
    ctx.fillRect(0, y, W, 3);
  }

  return finalizeTexture(c, true, maxAniso);
}

function createMoonTexture(maxAniso: number) {
  const S = 512;
  const rng = mulberry32(1969);
  const [c, ctx] = makeCanvas(S, S);

  const g = ctx.createRadialGradient(S * 0.44, S * 0.42, S * 0.05, S * 0.5, S * 0.5, S * 0.5);
  g.addColorStop(0, '#f8fbff');
  g.addColorStop(0.65, '#d6e4f7');
  g.addColorStop(1, '#9ab4d9');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  // Lunar maria dark patches
  for (let i = 0; i < 45; i++) {
    const x = S * 0.15 + rng() * S * 0.7;
    const y = S * 0.15 + rng() * S * 0.7;
    const r = 14 + rng() * 58;
    const mg = ctx.createRadialGradient(x, y, 2, x, y, r);
    mg.addColorStop(0, `rgba(90, 114, 148, ${0.18 + rng() * 0.25})`);
    mg.addColorStop(1, 'rgba(90, 114, 148, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeTexture(c, true, maxAniso);
}

function createSoftGlowTexture() {
  const S = 256;
  const [c, ctx] = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(220,238,255,0.55)');
  g.addColorStop(0.62, 'rgba(150,195,255,0.16)');
  g.addColorStop(1, 'rgba(100,150,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createCloudTexture() {
  const W = 512;
  const H = 256;
  const rng = mulberry32(8088);
  const [c, ctx] = makeCanvas(W, H);
  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i < 26; i++) {
    const x = W * 0.2 + rng() * W * 0.6;
    const y = H * 0.35 + rng() * H * 0.32;
    const r = 42 + rng() * 72;
    const g = ctx.createRadialGradient(x, y, 5, x, y, r);
    g.addColorStop(0, 'rgba(205, 222, 245, 0.26)');
    g.addColorStop(0.55, 'rgba(130, 155, 195, 0.12)');
    g.addColorStop(1, 'rgba(40, 60, 95, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const floor = createArenaFloorTextures(maxAnisotropy);
  const d02 = createConcreteTextures(maxAnisotropy, true);
  const concrete = createConcreteTextures(maxAnisotropy, false);
  const banner = createBannerTextures(maxAnisotropy);
  const containers = createContainerTextures(maxAnisotropy);
  const vessel = createVesselHullTextures(maxAnisotropy);
  const hazardAlbedo = createHazardStripeTexture(maxAnisotropy);
  const barrelRedAlbedo = createBarrelTexture(maxAnisotropy, '#991b1b', '#e2e8f0');
  const barrelGreyAlbedo = createBarrelTexture(maxAnisotropy, '#334155', '#cbd5e1');
  const grate = createGrateTextures(maxAnisotropy);
  const city = createCityFacadeTextures(maxAnisotropy);
  const hologramTexture = createHologramTexture(maxAnisotropy);
  const moonTexture = createMoonTexture(maxAnisotropy);
  const softGlowTexture = createSoftGlowTexture();
  const cloudTexture = createCloudTexture();

  const all: THREE.Texture[] = [
    floor.floorAlbedo,
    floor.floorRoughness,
    floor.floorBump,
    d02.albedo,
    d02.bump,
    concrete.albedo,
    concrete.bump,
    banner.bannerAlbedo,
    banner.bannerAlpha,
    containers.containerRedAlbedo,
    containers.containerSlateAlbedo,
    containers.containerBump,
    vessel.vesselHullAlbedo,
    vessel.vesselHullBump,
    hazardAlbedo,
    barrelRedAlbedo,
    barrelGreyAlbedo,
    grate.grateAlbedo,
    grate.grateBump,
    city.cityFacadeAlbedo,
    city.cityFacadeEmissive,
    hologramTexture,
    moonTexture,
    softGlowTexture,
    cloudTexture,
  ];

  return {
    ...floor,
    d02WallAlbedo: d02.albedo,
    d02WallBump: d02.bump,
    concreteAlbedo: concrete.albedo,
    concreteBump: concrete.bump,
    ...banner,
    ...containers,
    ...vessel,
    hazardAlbedo,
    barrelRedAlbedo,
    barrelGreyAlbedo,
    ...grate,
    ...city,
    hologramTexture,
    moonTexture,
    softGlowTexture,
    cloudTexture,
    dispose: () => {
      for (const t of all) t.dispose();
    },
  };
}
