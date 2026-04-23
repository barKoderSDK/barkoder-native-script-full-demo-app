import { ALL_BARCODE_TYPES, BARCODE_TYPES_1D, BARCODE_TYPES_2D, MODES } from '../constants';
import { ScannerSettings } from '../types';
import { BarkoderConstants } from '../vendor/barkoder';

const DEFAULT_ENABLED = ['ean13', 'upcA', 'code128', 'qr', 'datamatrix'];

export const getInitialEnabledTypes = (mode: string): Record<string, boolean> => {
  const types: Record<string, boolean> = {};

  ALL_BARCODE_TYPES.forEach((type) => {
    if (mode === MODES.MRZ) {
      types[type.id] = type.id === 'idDocument';
      return;
    }

    if (type.id === 'idDocument') {
      types[type.id] = false;
      return;
    }

    if (mode === MODES.MODE_1D) {
      types[type.id] = BARCODE_TYPES_1D.some((item) => item.id === type.id);
    } else if (mode === MODES.MODE_2D) {
      types[type.id] = BARCODE_TYPES_2D.some((item) => item.id === type.id) && type.id !== 'ocrText';
    } else if (mode === MODES.CONTINUOUS || mode === MODES.ANYSCAN || mode === MODES.GALLERY) {
      types[type.id] = type.id !== 'ocrText';
    } else if (mode === MODES.DOTCODE) {
      types[type.id] = type.id === 'dotcode';
    } else if (mode === MODES.VIN) {
      types[type.id] = ['code39', 'code128', 'qr', 'datamatrix', 'ocrText'].includes(type.id);
    } else if (mode === MODES.AR_MODE) {
      types[type.id] = ['qr', 'code128', 'code39', 'upcA', 'upcE', 'ean13', 'ean8'].includes(type.id);
    } else {
      types[type.id] = type.id !== 'ocrText' && DEFAULT_ENABLED.includes(type.id);
    }
  });

  return types;
};

export const getInitialSettings = (mode: string): ScannerSettings => {
  const baseSettings: ScannerSettings = {
    compositeMode: false,
    pinchToZoom: true,
    locationInPreview: true,
    regionOfInterest: false,
    beepOnSuccess: true,
    vibrateOnSuccess: true,
    scanBlurred: false,
    scanDeformed: false,
    continuousScanning: false,
    decodingSpeed: BarkoderConstants.DecodingSpeed.Normal,
    resolution: BarkoderConstants.BarkoderResolution.HD,
    continuousThreshold: 0,
    showResultSheet: true,
  };

  switch (mode) {
    case MODES.CONTINUOUS:
      return { ...baseSettings, continuousScanning: true };
    case MODES.MULTISCAN:
      return { ...baseSettings, continuousScanning: true, continuousThreshold: -1 };
    case MODES.VIN:
      return {
        ...baseSettings,
        decodingSpeed: BarkoderConstants.DecodingSpeed.Slow,
        resolution: BarkoderConstants.BarkoderResolution.FHD,
        regionOfInterest: true,
        scanDeformed: true,
      };
    case MODES.DPM:
      return {
        ...baseSettings,
        decodingSpeed: BarkoderConstants.DecodingSpeed.Slow,
        resolution: BarkoderConstants.BarkoderResolution.FHD,
        regionOfInterest: true,
      };
    case MODES.AR_MODE:
      return {
        ...baseSettings,
        resolution: BarkoderConstants.BarkoderResolution.FHD,
        decodingSpeed: BarkoderConstants.DecodingSpeed.Slow,
        continuousScanning: true,
        arMode: BarkoderConstants.BarkoderARMode.InteractiveEnabled,
        arLocationType: BarkoderConstants.BarkoderARLocationType.NONE,
        arHeaderShowMode: BarkoderConstants.BarkoderARHeaderShowMode.ONSELECTED,
        arOverlayRefresh: BarkoderConstants.BarkoderAROverlayRefresh.NORMAL,
        arDoubleTapToFreeze: false,
      };
    case MODES.GALLERY:
      return { ...baseSettings, decodingSpeed: BarkoderConstants.DecodingSpeed.Rigorous };
    case MODES.MRZ:
      return { ...baseSettings, regionOfInterest: true };
    case MODES.DOTCODE:
      return {
        ...baseSettings,
        regionOfInterest: true,
        decodingSpeed: BarkoderConstants.DecodingSpeed.Slow,
        continuousScanning: true,
      };
    case MODES.DEBLUR:
      return { ...baseSettings, scanBlurred: true, scanDeformed: true };
    default:
      return baseSettings;
  }
};
