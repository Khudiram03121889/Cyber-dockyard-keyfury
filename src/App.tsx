import { useCallback, useEffect, useRef, useState } from 'react';
import {
  mountCyberDockyardEngine,
  type CyberDockyardEngineHandle,
} from './scene/CyberDockyardEngine';
import {
  CAMERA_PRESETS,
  type ArenaControlState,
  type CameraPresetId,
  type LayerKey,
  type LightingMood,
} from './scene/types';
import { DockOverlay } from './components/DockOverlay';

const INITIAL_STATE: ArenaControlState = {
  cameraPreset: 'front',
  mood: 'night-rainy',
  rainEnabled: true,
  showFighters: true,
  autoSpar: true,
  layers: {
    sky: true,
    city: true,
    harbor: true,
    structures: true,
    floor: true,
  },
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CyberDockyardEngineHandle | null>(null);

  const [state, setState] = useState<ArenaControlState>(INITIAL_STATE);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Mount Three.js engine once inside isolated container ref
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const handle = mountCyberDockyardEngine(mountEl, INITIAL_STATE, setContextLost);
    engineRef.current = handle;

    return () => {
      handle.dispose();
      engineRef.current = null;
    };
  }, []);

  // Push UI state updates cleanly into engine without tearing down WebGL
  useEffect(() => {
    engineRef.current?.applyState(state);
  }, [state]);

  // Global keyboard shortcuts (1-6 camera presets, H toggle HUD, M switch lighting mood)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setState((prev) => ({
          ...prev,
          mood: prev.mood === 'night-rainy' ? 'sunset' : 'night-rainy',
        }));
      } else {
        const num = Number(e.key);
        if (num >= 1 && num <= CAMERA_PRESETS.length) {
          const preset = CAMERA_PRESETS[num - 1].id;
          setState((prev) => ({ ...prev, cameraPreset: preset }));
          engineRef.current?.focusCameraPreset(preset);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectCamera = useCallback((id: CameraPresetId) => {
    setState((prev) => ({ ...prev, cameraPreset: id }));
    engineRef.current?.focusCameraPreset(id);
  }, []);

  const handleSelectMood = useCallback((mood: LightingMood) => {
    setState((prev) => ({
      ...prev,
      mood,
      rainEnabled: mood === 'night-rainy',
    }));
  }, []);

  const handleToggleRain = useCallback(() => {
    setState((prev) => ({ ...prev, rainEnabled: !prev.rainEnabled }));
  }, []);

  const handleToggleFighters = useCallback(() => {
    setState((prev) => ({ ...prev, showFighters: !prev.showFighters }));
  }, []);

  const handleToggleAutoSpar = useCallback(() => {
    setState((prev) => ({ ...prev, autoSpar: !prev.autoSpar }));
  }, []);

  const handleToggleLayer = useCallback((key: LayerKey) => {
    setState((prev) => ({
      ...prev,
      layers: { ...prev.layers, [key]: !prev.layers[key] },
    }));
  }, []);

  const handleExportGLB = useCallback(async () => {
    await engineRef.current?.exportGLB();
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#060b16]">
      {/* Dedicated Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D Fighting Game Arena Viewport: The Cyber Dockyard Arena 02"
      />

      {/* Graceful WebGL Context Loss Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#060b16]/95 p-6">
          <div className="max-w-md rounded-xl border border-slate-700 bg-[#0b1326] p-6 text-center">
            <h2 className="font-display text-lg font-bold text-white">
              WebGL Context Interrupted
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Your graphics driver reset the 3D viewport. Reload the page to restore the arena.
            </p>
          </div>
        </div>
      )}

      {/* Ergonomic Collapsible Bottom HUD Overlay */}
      <DockOverlay
        state={state}
        dockCollapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((c) => !c)}
        onSelectCamera={handleSelectCamera}
        onSelectMood={handleSelectMood}
        onToggleRain={handleToggleRain}
        onToggleFighters={handleToggleFighters}
        onToggleAutoSpar={handleToggleAutoSpar}
        onToggleLayer={handleToggleLayer}
        onExportGLB={handleExportGLB}
      />
    </main>
  );
}
