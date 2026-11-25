export type CameraPresetId =
  | 'front'
  | 'left'
  | 'right'
  | 'depth'
  | 'top'
  | 'fighter';

export type LightingMood = 'night-rainy' | 'sunset';

export type LayerKey = 'sky' | 'city' | 'harbor' | 'structures' | 'floor';

export interface LayerVisibility {
  sky: boolean;
  city: boolean;
  harbor: boolean;
  structures: boolean;
  floor: boolean;
}

export interface ArenaControlState {
  cameraPreset: CameraPresetId;
  mood: LightingMood;
  rainEnabled: boolean;
  showFighters: boolean;
  autoSpar: boolean;
  layers: LayerVisibility;
}

export interface CameraPresetConfig {
  id: CameraPresetId;
  label: string;
  shortLabel: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export const CAMERA_PRESETS: CameraPresetConfig[] = [
  {
    id: 'front',
    label: 'A. Front View',
    shortLabel: 'A. Front',
    description: 'In-game 16:9 fighting arena perspective',
    position: [0, 3.15, 16.4],
    target: [0, 2.55, -2.5],
    fov: 46,
  },
  {
    id: 'left',
    label: 'B. Left Side Angle',
    shortLabel: 'B. Left',
    description: 'Sector D-02 control building, stairs & banner',
    position: [-2.8, 3.1, 13.8],
    target: [-13.5, 3.3, -1.6],
    fov: 48,
  },
  {
    id: 'right',
    label: 'C. Right Side Angle',
    shortLabel: 'C. Right',
    description: 'Gantry crane, cargo containers & vessel K-37',
    position: [-0.8, 3.4, 14.5],
    target: [12.5, 4.2, -7.2],
    fov: 48,
  },
  {
    id: 'depth',
    label: 'D. Depth 3/4 View',
    shortLabel: 'D. 3/4 Depth',
    description: 'Elevated corner view showing arena depth & city',
    position: [-15.8, 5.2, 13.2],
    target: [4.5, 2.3, -6.0],
    fov: 50,
  },
  {
    id: 'top',
    label: 'Map Overview (Top)',
    shortLabel: 'Top Map',
    description: '36m × 14m playable arena overview',
    position: [0, 34.5, 4.5],
    target: [0, 0, -1.5],
    fov: 46,
  },
  {
    id: 'fighter',
    label: 'Fighting Camera',
    shortLabel: 'Fight Cam',
    description: 'Dynamic 2.5D stage tracking (A/D & Arrow keys)',
    position: [0, 2.35, 11.8],
    target: [0, 1.85, 0],
    fov: 44,
  },
];
