export interface HomeItem {
  id: string;
  label: string;
  icon: string;
  mode?: string;
  action?: 'url' | 'gallery';
  url?: string;
}

export interface HomeSection {
  title: string;
  data: HomeItem[];
}

export interface ScannerSettings {
  compositeMode: boolean;
  pinchToZoom: boolean;
  locationInPreview: boolean;
  regionOfInterest: boolean;
  beepOnSuccess: boolean;
  vibrateOnSuccess: boolean;
  scanBlurred: boolean;
  scanDeformed: boolean;
  continuousScanning: boolean;
  decodingSpeed: number;
  resolution: string;
  arMode?: number;
  arLocationType?: number;
  arHeaderShowMode?: number;
  arOverlayRefresh?: number;
  arDoubleTapToFreeze?: boolean;
  continuousThreshold?: number;
  showResultSheet?: boolean;
}

export interface ScannedItem {
  text: string;
  type: string;
  image?: string;
}

export interface HistoryItem extends ScannedItem {
  timestamp: number;
  count: number;
}

export interface SavedSettings {
  enabledTypes: Record<string, boolean>;
  scannerSettings: ScannerSettings;
}

export interface BarcodeType {
  id: string;
  label: string;
  decoder: number;
}

export interface SettingOption {
  label: string;
  value: number | string;
}

export interface SettingDescriptor {
  kind: 'switch' | 'dropdown';
  key: keyof ScannerSettings;
  label: string;
  options?: SettingOption[];
}
