import { useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Download,
  Image as ImageIcon,
  Layers,
  Moon,
  Sun,
  Users,
  X,
  Cpu,
} from 'lucide-react';
import {
  CAMERA_PRESETS,
  type ArenaControlState,
  type CameraPresetId,
  type LayerKey,
  type LightingMood,
} from '../scene/types';

type DockTab = 'cameras' | 'mood' | 'layers' | 'export';

interface DockOverlayProps {
  state: ArenaControlState;
  dockCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectCamera: (id: CameraPresetId) => void;
  onSelectMood: (mood: LightingMood) => void;
  onToggleRain: () => void;
  onToggleFighters: () => void;
  onToggleAutoSpar: () => void;
  onToggleLayer: (key: LayerKey) => void;
  onExportGLB: () => Promise<void>;
}

const LAYER_ITEMS: { key: LayerKey; label: string }[] = [
  { key: 'sky', label: 'L1 Sky & Rain' },
  { key: 'city', label: 'L2 Distant City' },
  { key: 'harbor', label: 'L3 Harbor & K-37' },
  { key: 'structures', label: 'L4 D-02 & Crane' },
  { key: 'floor', label: 'L5 Fighting Floor' },
];

export function DockOverlay({
  state,
  dockCollapsed,
  onToggleCollapse,
  onSelectCamera,
  onSelectMood,
  onToggleRain,
  onToggleFighters,
  onToggleAutoSpar,
  onToggleLayer,
  onExportGLB,
}: DockOverlayProps) {
  const [activeTab, setActiveTab] = useState<DockTab>('cameras');
  const [exporting, setExporting] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [showStackInfo, setShowStackInfo] = useState(false);

  const activePreset =
    CAMERA_PRESETS.find((p) => p.id === state.cameraPreset) ?? CAMERA_PRESETS[0];

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await onExportGLB();
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Minimal Top-Left Title Lockup — Zero Viewport Occlusion */}
      <header className="pointer-events-none fixed top-5 left-6 z-20 flex flex-col gap-0.5">
        <h1 className="font-display text-lg font-bold tracking-wide text-slate-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
          The Cyber Dockyard
        </h1>
        <p className="font-mono-tech text-xs text-slate-300/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          Arena 02 · 36m × 14m · {activePreset.label}
        </p>
      </header>

      {/* Unified Collapsible Bottom Control Dock (Solid dark rgba surface, no backdrop-filter over WebGL) */}
      <div
        className={`fixed bottom-4 left-1/2 z-20 -translate-x-1/2 transition-transform duration-200 ease-out ${
          dockCollapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
        }`}
        style={{ width: 'min(920px, 95vw)' }}
      >
        {/* Collapse / Expand Handle attached cleanly to top edge of dock */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!dockCollapsed}
            className="flex items-center gap-1.5 rounded-t-lg border border-b-0 border-slate-700/80 bg-[#080e1c]/95 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Panel */}
        <div className="rounded-xl border border-slate-700/80 bg-[#080e1c]/95 px-4 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.65)]">
          {/* Top Row: Tab Navigation + Contextual Hint */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-1" role="tablist" aria-label="Arena Controls">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'cameras'}
                onClick={() => setActiveTab('cameras')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'cameras'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Cameras</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'mood'}
                onClick={() => setActiveTab('mood')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'mood'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                {state.mood === 'sunset' ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
                <span>Mood & Stage</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'layers'}
                onClick={() => setActiveTab('layers')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'layers'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Layers</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'export'}
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'export'
                    ? 'bg-red-500/20 text-red-300'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export & Stack</span>
              </button>
            </div>

            <div className="hidden text-xs text-slate-400 sm:block">
              {state.cameraPreset === 'fighter'
                ? 'Move P1: A / D · Move P2: Arrow Keys · Drag to orbit'
                : 'Drag to orbit · Scroll to zoom · Right-drag to pan · Keys 1–6'}
            </div>
          </div>

          {/* Bottom Row: Active Tab Controls */}
          <div className="pt-2.5">
            {activeTab === 'cameras' && (
              <div className="flex flex-wrap items-center gap-1.5">
                {CAMERA_PRESETS.map((preset, idx) => {
                  const active = state.cameraPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectCamera(preset.id)}
                      title={preset.description}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'border-cyan-400/70 bg-cyan-500/20 text-white'
                          : 'border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <span className="font-mono-tech mr-1.5 text-[11px] text-slate-400">
                        {idx + 1}
                      </span>
                      {preset.shortLabel}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'mood' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-900/90 p-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectMood('night-rainy')}
                    className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                      state.mood === 'night-rainy'
                        ? 'bg-cyan-500/25 text-cyan-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Night – Rainy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMood('sunset')}
                    className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                      state.mood === 'sunset'
                        ? 'bg-amber-500/25 text-amber-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Sunset Variant</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onToggleRain}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    state.rainEnabled
                      ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700/80 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CloudRain className="h-3.5 w-3.5" />
                  <span>Rain: {state.rainEnabled ? 'On' : 'Off'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleFighters}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    state.showFighters
                      ? 'border-red-400/60 bg-red-500/20 text-red-200'
                      : 'border-slate-700/80 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>1.8m Fighters: {state.showFighters ? 'Shown' : 'Hidden'}</span>
                </button>

                {state.showFighters && (
                  <button
                    type="button"
                    onClick={onToggleAutoSpar}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      state.autoSpar
                        ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                        : 'border-slate-700/80 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Auto Footwork: {state.autoSpar ? 'On' : 'Manual'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'layers' && (
              <div className="flex flex-wrap items-center gap-1.5">
                {LAYER_ITEMS.map((item) => {
                  const visible = state.layers[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onToggleLayer(item.key)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                        visible
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-slate-100'
                          : 'border-slate-800 bg-slate-950/90 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'export' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-red-500 disabled:opacity-60"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{exporting ? 'Exporting GLB...' : 'Export 3D Arena (.GLB)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReference(true)}
                  className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 whitespace-nowrap transition-colors hover:border-slate-500 hover:text-white"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Compare Design Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowStackInfo(true)}
                  className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 whitespace-nowrap transition-colors hover:border-slate-500 hover:text-white"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Recommended Tech Stack</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reference Sheet Comparison Modal */}
      {showReference && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setShowReference(false)}
        >
          <div
            className="max-h-[90vh] max-w-5xl overflow-hidden rounded-xl border border-slate-700 bg-[#0a101f] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  Design Reference Sheet — Arena 02
                </h2>
                <p className="text-xs text-slate-400">
                  Original environment blueprint matched across all 5 layers and camera angles
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReference(false)}
                aria-label="Close reference sheet"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <img
                src="/assets/aistudio/image_4ffcc8f5.png"
                alt="The Cyber Dockyard Arena 02 3D Environment Design Sheet"
                className="max-h-[75vh] w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tech Stack Architecture Modal */}
      {showStackInfo && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setShowStackInfo(false)}
        >
          <div
            className="max-w-2xl rounded-xl border border-slate-700 bg-[#0a101f] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  3D Fighting Arena Tech Stack
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Selected for real-time PBR realism, 60 FPS combat pacing, and direct engine portability
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStackInfo(false)}
                aria-label="Close tech stack info"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div>
                <h3 className="font-semibold text-white">
                  1. Real-Time Web & Browser Engine (Active Here)
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Built with <strong className="text-slate-200">Three.js (WebGL2 PBR)</strong>,{' '}
                  <strong className="text-slate-200">GLSL custom shaders</strong> (animated harbor
                  water ripples & dual-mood sky),{' '}
                  <strong className="text-slate-200">ACES Filmic tone mapping + UnrealBloom</strong>,
                  and procedural roughness/bump maps for rain-slicked reflections. Runs natively in
                  any browser without plugins.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  2. Export Directly to Unreal Engine 5, Unity, or Godot
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Use <strong className="text-slate-200">Export 3D Arena (.GLB)</strong> to download
                  the complete layered 3D hierarchy (Layer 5 Floor, Layer 4 Sector D-02 & Crane,
                  Layer 3 Vessel K-37 & Harbor, Layer 2 City) in standard glTF 2.0 binary format:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  <li>
                    <strong className="text-cyan-300">Unreal Engine 5:</strong> Best for AAA
                    photorealistic fighting games (Tekken 8 / Street Fighter 6 workflow) with Lumen
                    GI & Niagara rain.
                  </li>
                  <li>
                    <strong className="text-amber-300">Unity URP/HDRP:</strong> Fast iteration for
                    cross-platform PC/Console/Mobile fighting games with C# rollback netcode (GGPO).
                  </li>
                  <li>
                    <strong className="text-red-300">Godot 4 (Vulkan):</strong> Lightweight open-source
                    alternative with native `.glb` scene import and crisp Forward+ PBR reflections.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
