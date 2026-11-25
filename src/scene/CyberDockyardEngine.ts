import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

import {
  CAMERA_PRESETS,
  type ArenaControlState,
  type CameraPresetId,
  type LightingMood,
} from './types';
import { createProceduralTextures } from './textures';
import { createPropMaterials } from './props';
import { buildMidStructuresLayer } from './structures';
import {
  buildCityLayer,
  buildFightingFloorLayer,
  buildHarborLayer,
  buildSkyWeatherLayer,
} from './harborAndCity';
import { buildFightersSystem } from './fighters';

// Module-scope reusable scratch objects (zero GC in render loop)
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _zenithTarget = new THREE.Color();
const _midTarget = new THREE.Color();
const _horizonTarget = new THREE.Color();
const _fogTarget = new THREE.Color();
const _keyColorTarget = new THREE.Color();
const _hemiSkyTarget = new THREE.Color();
const _hemiGroundTarget = new THREE.Color();
const _rimColorTarget = new THREE.Color();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export interface CyberDockyardEngineHandle {
  applyState: (state: ArenaControlState) => void;
  focusCameraPreset: (preset: CameraPresetId) => void;
  exportGLB: () => Promise<void>;
  dispose: () => void;
}

export function mountCyberDockyardEngine(
  container: HTMLElement,
  initialState: ArenaControlState,
  onContextLostChange?: (lost: boolean) => void,
): CyberDockyardEngineHandle {
  const isSoftwareGl = detectSoftwareWebGL();
  let state: ArenaControlState = { ...initialState, layers: { ...initialState.layers } };

  // 1. Renderer setup
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 2. Scene & Studio IBL (RoomEnvironment on every device for consistent PBR reflections)
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071022);
  const fog = new THREE.FogExp2(0x0c1b36, 0.0046);
  scene.fog = fog;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnvTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = roomEnvTex;
  scene.environmentIntensity = 0.58;
  pmremGenerator.dispose();

  // 3. Camera & OrbitControls
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const frontPreset = CAMERA_PRESETS[0];
  const camera = new THREE.PerspectiveCamera(frontPreset.fov, width / height, 0.2, 520);
  camera.position.set(...frontPreset.position);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...frontPreset.target);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.065;
  controls.maxPolarAngle = Math.PI * 0.492; // Stay above harbor water plane
  controls.minDistance = 4.5;
  controls.maxDistance = 62;
  controls.update();

  // 4. Lighting Rig (<= 3 shadow-casting lights, balanced warm/cool color temperature)
  const hemiLight = new THREE.HemisphereLight(0x4b79b8, 0x1e202c, 0.95);
  scene.add(hemiLight);

  // Main Moonlight / Sunset Key Directional Light
  const keyLight = new THREE.DirectionalLight(0xa5cfff, 1.85);
  keyLight.position.set(16, 28, -24);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 90;
  keyLight.shadow.camera.left = -24;
  keyLight.shadow.camera.right = 24;
  keyLight.shadow.camera.top = 18;
  keyLight.shadow.camera.bottom = -18;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.025;
  scene.add(keyLight);

  // Warm industrial front-fill light (illuminates fighters & arena markings clearly)
  const frontFill = new THREE.DirectionalLight(0xffb677, 0.72);
  frontFill.position.set(-10, 12, 22);
  scene.add(frontFill);

  // Cool cyan city rim bounce from harbor side
  const cityRimLight = new THREE.DirectionalLight(0x22d3ee, 0.65);
  cityRimLight.position.set(-6, 10, -32);
  scene.add(cityRimLight);

  // Dedicated arena floor bounce lights (mimicking wet reflection pools from Panel A!)
  const centerCyanGlow = new THREE.PointLight(0x16d2ff, 14, 24, 1.6);
  centerCyanGlow.position.set(-1.5, 2.2, -3.5);
  scene.add(centerCyanGlow);

  const rightWarmGlow = new THREE.PointLight(0xff8e2b, 18, 22, 1.5);
  rightWarmGlow.position.set(9.5, 4.2, 1.2);
  scene.add(rightWarmGlow);

  const leftRedAccent = new THREE.PointLight(0xff253a, 14, 16, 1.6);
  leftRedAccent.position.set(-10.8, 2.2, 4.2);
  scene.add(leftRedAccent);

  // 5. Build All 5 Environment Layers + 1.8m Scale Fighters
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const textures = createProceduralTextures(maxAniso);
  const propMats = createPropMaterials(textures);

  const layer1Sky = buildSkyWeatherLayer(textures);
  const layer2City = buildCityLayer(textures, propMats);
  const layer3Harbor = buildHarborLayer(textures, propMats);
  const layer4Structures = buildMidStructuresLayer(textures, propMats);
  const layer5Floor = buildFightingFloorLayer(textures, propMats);
  const fighters = buildFightersSystem();

  const arenaExportRoot = new THREE.Group();
  arenaExportRoot.name = 'CyberDockyard_Arena02';
  arenaExportRoot.add(
    layer5Floor.group,
    layer4Structures.group,
    layer3Harbor.group,
    layer2City.group,
  );
  scene.add(layer1Sky.group);
  scene.add(arenaExportRoot);
  scene.add(fighters.group);

  // 6. GPU Post-Processing (Selective/Controlled Bloom + OutputPass; skipped on software WebGL)
  let composer: EffectComposer | null = null;
  let bloomPass: UnrealBloomPass | null = null;
  if (!isSoftwareGl) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.55, 0.88);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    renderer.compile(scene, camera);
  }

  // 7. Camera Transition & Input State
  let transitionActive = false;
  let goalFov = frontPreset.fov;
  _camGoalPos.set(...frontPreset.position);
  _camGoalTarget.set(...frontPreset.target);

  const pressedKeys = new Set<string>();
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    pressedKeys.add(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    pressedKeys.delete(e.code);
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Cancel scripted camera fly-to whenever the user grabs OrbitControls
  const onControlsStart = () => {
    transitionActive = false;
  };
  controls.addEventListener('start', onControlsStart);

  // Handle WebGL context loss gracefully
  const onContextLost = (e: Event) => {
    e.preventDefault();
    onContextLostChange?.(true);
  };
  const onContextRestored = () => {
    onContextLostChange?.(false);
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

  // Handle resize cleanly
  const onResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) {
      composer.setSize(w, h);
    }
    if (bloomPass) {
      bloomPass.resolution.set(w, h);
    }
  };
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);
  window.addEventListener('resize', onResize);

  // Apply initial layer & fighter visibility
  const syncImmediateVisibility = () => {
    layer1Sky.group.visible = state.layers.sky;
    layer2City.group.visible = state.layers.city;
    layer3Harbor.group.visible = state.layers.harbor;
    layer4Structures.group.visible = state.layers.structures;
    layer5Floor.group.visible = state.layers.floor;
    fighters.group.visible = state.showFighters;
    layer1Sky.rainLines.visible = state.layers.sky && state.rainEnabled;
  };
  syncImmediateVisibility();

  // Mood transition scalar (0 = Night-Rainy, 1 = Sunset Variant)
  let moodBlend = state.mood === 'sunset' ? 1 : 0;

  const setCameraTargetFromPreset = (presetId: CameraPresetId) => {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId) ?? CAMERA_PRESETS[0];
    _camGoalPos.set(...preset.position);
    _camGoalTarget.set(...preset.target);
    goalFov = preset.fov;
    transitionActive = presetId !== 'fighter';
  };

  // 8. Animation Loop (GPU: rAF | Software WebGL: fenceSync afterDraw pacing)
  let disposed = false;
  let frameId = 0;
  let lastTime = performance.now();
  let elapsed = 0;

  function afterDraw(cb: () => void) {
    if (disposed) return;
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function updateMoodAtmosphere(dt: number, targetMood: LightingMood) {
    const goal = targetMood === 'sunset' ? 1 : 0;
    moodBlend = THREE.MathUtils.damp(moodBlend, goal, 3.2, dt);

    // Sky gradient colors
    _zenithTarget.setHex(0x050b18).lerp(new THREE.Color(0x1b1026), moodBlend);
    _midTarget.setHex(0x0f2042).lerp(new THREE.Color(0x8c2d19), moodBlend);
    _horizonTarget.setHex(0x1f3a66).lerp(new THREE.Color(0xf59e0b), moodBlend);

    layer1Sky.skyUniforms.uZenithColor.value.copy(_zenithTarget);
    layer1Sky.skyUniforms.uMidColor.value.copy(_midTarget);
    layer1Sky.skyUniforms.uHorizonColor.value.copy(_horizonTarget);

    // Horizon-matched atmospheric fog
    _fogTarget.setHex(0x0c1b36).lerp(new THREE.Color(0x4a2318), moodBlend);
    fog.color.copy(_fogTarget);
    fog.density = THREE.MathUtils.lerp(0.0046, 0.0038, moodBlend);

    // Moon vs Sunset Sun visibility & position
    layer1Sky.moonGroup.visible = moodBlend < 0.55;
    layer1Sky.sunGroup.visible = moodBlend > 0.25;

    // Cloud tint
    const cloudCol = _midTarget.clone().lerp(new THREE.Color(0xffb066), moodBlend * 0.7);
    for (const sp of layer1Sky.cloudSprites) {
      sp.material.color.copy(cloudCol);
    }

    // Mist tint
    const mistCol = new THREE.Color(0x6ea8d8).lerp(new THREE.Color(0xff9a52), moodBlend);
    for (const sp of layer3Harbor.mistSprites) {
      sp.material.color.copy(mistCol);
    }

    // Water shader mood uniform
    layer3Harbor.waterUniforms.uMood.value = moodBlend;

    // Directional Key Light (Cool Moonlight vs Warm Low Golden Sun)
    _keyColorTarget.setHex(0xa5cfff).lerp(new THREE.Color(0xff8c3a), moodBlend);
    keyLight.color.copy(_keyColorTarget);
    keyLight.intensity = THREE.MathUtils.lerp(1.85, 2.65, moodBlend);
    keyLight.position.set(
      THREE.MathUtils.lerp(16, 4, moodBlend),
      THREE.MathUtils.lerp(28, 12, moodBlend),
      THREE.MathUtils.lerp(-24, -36, moodBlend),
    );

    // Hemisphere Fill
    _hemiSkyTarget.setHex(0x4b79b8).lerp(new THREE.Color(0xff9e5e), moodBlend);
    _hemiGroundTarget.setHex(0x1e202c).lerp(new THREE.Color(0x2e1b18), moodBlend);
    hemiLight.color.copy(_hemiSkyTarget);
    hemiLight.groundColor.copy(_hemiGroundTarget);
    hemiLight.intensity = THREE.MathUtils.lerp(0.95, 1.15, moodBlend);

    // City Rim Light
    _rimColorTarget.setHex(0x22d3ee).lerp(new THREE.Color(0xff6b2b), moodBlend);
    cityRimLight.color.copy(_rimColorTarget);

    // Wet clearcoat sheen adjusts subtly with rain toggle
    const targetCoat = state.rainEnabled ? 0.78 : 0.34;
    layer5Floor.floorMaterial.clearcoat = THREE.MathUtils.damp(
      layer5Floor.floorMaterial.clearcoat,
      targetCoat,
      3.0,
      dt,
    );

    // City window emissive dims slightly during golden sunset
    layer2City.cityWindowMat.emissiveIntensity = THREE.MathUtils.lerp(1.55, 0.95, moodBlend);
  }

  function animateDynamicElements(dt: number) {
    // 1. Harbor Water Ripples
    layer3Harbor.waterUniforms.uTime.value = elapsed;

    // 2. Cargo Vessel K-37 subtle ocean swell heave & roll
    layer3Harbor.vesselGroup.position.y = -2.2 + Math.sin(elapsed * 0.72) * 0.14;
    layer3Harbor.vesselGroup.rotation.z = Math.sin(elapsed * 0.55) * 0.012;

    // 3. Swaying Hazard Crane Hook Block in coastal wind
    layer4Structures.craneHookPivot.rotation.z = Math.sin(elapsed * 1.15) * 0.065;
    layer4Structures.craneHookPivot.rotation.x = Math.cos(elapsed * 0.85) * 0.032;

    // 4. Crimson Faction Banners realistic cloth wind ripple
    for (const banner of layer4Structures.banners) {
      const posAttr = banner.clothGeo.attributes.position as THREE.BufferAttribute;
      const base = banner.basePositions;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const pinFactor = Math.min(1, Math.abs(by) / 4.2); // Top anchored at Y = 0
        const waveZ =
          Math.sin(elapsed * 3.4 + by * 1.45 + bx * 0.9) * 0.14 * pinFactor +
          Math.cos(elapsed * 2.1 + by * 2.2) * 0.05 * pinFactor;
        posAttr.setZ(i, waveZ);
      }
      posAttr.needsUpdate = true;
    }

    // 5. Holographic Billboard subtle shimmer & Ring Megastructure rotation
    const holoMat = layer2City.hologramMesh.material as THREE.MeshBasicMaterial;
    holoMat.opacity = 0.82 + Math.sin(elapsed * 6.5) * 0.06 + Math.sin(elapsed * 19.0) * 0.025;
    layer2City.ringHalo.rotation.z = elapsed * 0.18;

    // 6. Cyberpunk Airship slow patrol cruise across upper sky
    layer2City.airshipGroup.position.x = -28 + Math.sin(elapsed * 0.08) * 18;
    layer2City.airshipGroup.position.y = 38 + Math.sin(elapsed * 0.45) * 1.1;

    // 7. Distant Harbor Bridge moving traffic lights
    const tPos = layer3Harbor.trafficPoints.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < tPos.count; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      let nx = tPos.getX(i) + dir * dt * (8 + (i % 5) * 2.2);
      if (nx > 115) nx = -115;
      if (nx < -115) nx = 115;
      tPos.setX(i, nx);
    }
    tPos.needsUpdate = true;

    // 8. 3D Falling Rain Streaks
    if (layer1Sky.rainLines.visible) {
      const rArr = layer1Sky.rainPositions;
      const count = rArr.length / 6;
      const fallSpeed = 24.0 * dt;
      const windX = -3.4 * dt;
      for (let i = 0; i < count; i++) {
        const idx = i * 6;
        rArr[idx] += windX;
        rArr[idx + 1] -= fallSpeed;
        rArr[idx + 3] += windX;
        rArr[idx + 4] -= fallSpeed;

        if (rArr[idx + 1] < -0.5) {
          const resetY = 24 + (i % 17) * 0.25;
          const dx = rArr[idx + 3] - rArr[idx];
          const dy = rArr[idx + 4] - rArr[idx + 1];
          rArr[idx] = ((i * 37.13) % 54) - 27;
          rArr[idx + 1] = resetY;
          rArr[idx + 3] = rArr[idx] + dx;
          rArr[idx + 4] = resetY + dy;
        }
      }
      (layer1Sky.rainLines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    // 9. 1.8m Scale Fighters + Dynamic 2.5D Fighting Game Tracking Camera
    const fighterTelemetry = fighters.update(dt, elapsed, state.autoSpar, pressedKeys);

    if (state.cameraPreset === 'fighter') {
      const zoomZ = THREE.MathUtils.clamp(9.8 + fighterTelemetry.separation * 0.72, 10.6, 17.5);
      _camGoalPos.set(fighterTelemetry.midX * 0.85, 2.38, zoomZ);
      _camGoalTarget.set(fighterTelemetry.midX * 0.85, 1.82, 0.2);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, 4.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, 4.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, 4.5, dt);
      controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, 5.2, dt);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, 5.2, dt);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, 5.2, dt);
    } else if (transitionActive) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, 5.2, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, 5.2, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, 5.2, dt);
      controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, 5.2, dt);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, 5.2, dt);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, 5.2, dt);

      if (Math.abs(camera.fov - goalFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, goalFov, 5.0, dt);
        camera.updateProjectionMatrix();
      }

      if (
        camera.position.distanceToSquared(_camGoalPos) < 0.002 &&
        controls.target.distanceToSquared(_camGoalTarget) < 0.002
      ) {
        transitionActive = false;
      }
    }
  }

  function tick() {
    if (disposed) return;

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    elapsed += dt;

    updateMoodAtmosphere(dt, state.mood);
    animateDynamicElements(dt);
    controls.update();

    if (isSoftwareGl || !composer) {
      renderer.render(scene, camera);
    } else {
      composer.render();
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  // Kick off render loop
  tick();

  // Real glTF/GLB Export for Unity / Unreal / Godot game pipelines
  async function exportGLB(): Promise<void> {
    const exporter = new GLTFExporter();
    return new Promise((resolve, reject) => {
      exporter.parse(
        arenaExportRoot,
        (result) => {
          if (result instanceof ArrayBuffer) {
            const blob = new Blob([result], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cyber_dockyard_arena02.glb';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.setTimeout(() => URL.revokeObjectURL(url), 1500);
          }
          resolve();
        },
        (err) => reject(err),
        { binary: true },
      );
    });
  }

  return {
    applyState(nextState: ArenaControlState) {
      const presetChanged = nextState.cameraPreset !== state.cameraPreset;
      state = { ...nextState, layers: { ...nextState.layers } };
      syncImmediateVisibility();
      if (presetChanged) {
        setCameraTargetFromPreset(state.cameraPreset);
      }
    },
    focusCameraPreset(preset: CameraPresetId) {
      state = { ...state, cameraPreset: preset };
      setCameraTargetFromPreset(preset);
    },
    exportGLB,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      controls.removeEventListener('start', onControlsStart);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      controls.dispose();
      textures.dispose();
      roomEnvTex.dispose();
      if (composer) composer.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
