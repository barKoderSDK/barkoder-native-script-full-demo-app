import {
  Dialogs,
  Frame,
  GridLayout,
  Image,
  ImageSource,
  Label,
  Page,
  Screen,
  StackLayout,
  Utils,
} from '@nativescript/core';
import { BARKODER_LICENSE_KEY } from '../config';
import { ALL_BARCODE_TYPES, BARCODE_TYPES_1D, BARCODE_TYPES_2D, MODES } from '../constants';
import { HistoryService } from '../services/history-service';
import { SettingsService } from '../services/settings-service';
import { HistoryItem, ScannerSettings, SettingDescriptor, SettingOption } from '../types';
import { getInitialEnabledTypes, getInitialSettings } from '../utils/scanner-config';
import { copyToClipboard, getMrzDisplayText, shareCsvText } from '../utils/platform';
import { BarkoderConstants, BarkoderViewInstance } from '../vendor/barkoder';

let pageRef: Page;
let barkoderView: BarkoderViewInstance;
let mode: string = MODES.ANYSCAN;
let enabledTypes: Record<string, boolean> = {};
let settings: ScannerSettings;
let scannedItems: HistoryItem[] = [];
let lastScanCount = 0;
let isFlashOn = false;
let zoomLevel = 1.0;
let selectedCamera = BarkoderConstants.BarkoderCameraPosition.Back;
let isScanningPaused = false;
let openDropdownKey: string | null = null;
let isResultSheetExpanded = false;
let isResultSheetHidden = false;

const ROI_DEFAULT = { x: 22, y: 30, width: 56, height: 20 };
const ROI_VIN = { x: 12, y: 38, width: 76, height: 18 };
const ROI_DPM = { x: 42, y: 42, width: 16, height: 8 };
const ROI_DOTCODE = { x: 34, y: 42, width: 32, height: 8 };
const RESULT_CARD_HEIGHT = 60;
const RESULT_CARD_GAP = 8;
const RESULT_SHEET_BASE_HEIGHT = 130;

const sanitizeEnabledTypes = (types: Record<string, boolean>) => {
  const sanitized = { ...types };

  if (mode !== MODES.VIN) {
    sanitized.ocrText = false;
  }

  sanitized.idDocument = false;

  return sanitized;
};

const setVisible = (view: any, visible: boolean) => {
  view.visibility = visible ? 'visible' : 'collapse';
};

const getEnabledDecoders = () =>
  ALL_BARCODE_TYPES.filter((type) => enabledTypes[type.id]).map((type) => type.decoder);

const getBarcodeTypeLabel = (typeId: string) => ALL_BARCODE_TYPES.find((type) => type.id === typeId)?.label ?? typeId;

const getActiveBarcodeText = () =>
  ALL_BARCODE_TYPES.filter((type) => enabledTypes[type.id])
    .map((type) => type.label)
    .join(', ');

const extractBarcodeType = (result: any) => {
  if (result?.barcodeTypeName) {
    return result.barcodeTypeName;
  }

  if (mode === MODES.MRZ) {
    return 'MRZ';
  }

  const firstEnabled = ALL_BARCODE_TYPES.find((type) => enabledTypes[type.id]);
  return firstEnabled?.label ?? 'Unknown';
};

const saveCurrentSettings = () => {
  SettingsService.saveSettings(mode, {
    enabledTypes,
    scannerSettings: settings,
  });
};

const resetPauseState = () => {
  isScanningPaused = false;
  setVisible(pageRef.getViewById('resumeOverlay'), false);
  const frozenImage = pageRef.getViewById<Image>('frozenImage');
  frozenImage.src = null;
  setVisible(frozenImage, false);
};

const getUniqueItems = () => {
  const seen = new Set<string>();
  const unique: HistoryItem[] = [];

  scannedItems.forEach((item) => {
    if (!seen.has(item.text)) {
      seen.add(item.text);
      unique.push(item);
    }
  });

  return unique;
};

const getItemCount = (text: string) => scannedItems.filter((item) => item.text === text).length;

const getDisplayText = (item: HistoryItem) => (item.type.toLowerCase() === 'mrz' ? getMrzDisplayText(item.text) : item.text);

const normalizeResults = (results: any): any[] => {
  if (!results) {
    return [];
  }

  if (Array.isArray(results)) {
    return results;
  }

  if (Array.isArray(results?.decoderResults)) {
    return results.decoderResults;
  }

  if (typeof results?.length === 'number' && typeof results !== 'string') {
    try {
      return Array.from(results);
    } catch {
      return [];
    }
  }

  if (typeof results?.textualData === 'string') {
    return [results];
  }

  return [];
};

const getValidResults = (results: any) =>
  normalizeResults(results).filter((result) => {
    const text = typeof result?.textualData === 'string' ? result.textualData.trim() : '';
    if (!text) {
      return false;
    }

    const typeName = String(result?.barcodeTypeName ?? '').toLowerCase();
    if (typeName.includes('iddocument') || typeName.includes('id document')) {
      return false;
    }

    return true;
  });

const createFallbackHistoryItem = (result: any): HistoryItem => ({
  text: result.textualData,
  type: extractBarcodeType(result),
  image: undefined,
  timestamp: Date.now(),
  count: 1,
});

const navigateToDetails = (item: HistoryItem) => {
  Frame.topmost().navigate({
    moduleName: 'details/details-page',
    context: { item },
  });
};

const createResultCard = (item: HistoryItem, index: number, highlightedCount: number) => {
  const wrapper = new GridLayout();
  wrapper.className = `result-card ${index < highlightedCount ? 'primary' : 'secondary'}`;
  wrapper.columns = '*,auto';

  const infoWrap = new StackLayout();
  infoWrap.col = 0;

  const type = new Label();
  type.className = 'result-type';
  type.text = item.type;

  const text = new Label();
  text.className = 'result-text';
  text.text = getDisplayText(item);
  text.textWrap = true;

  infoWrap.addChild(type);
  infoWrap.addChild(text);
  wrapper.addChild(infoWrap);

  const rightWrap = new GridLayout();
  rightWrap.col = 1;
  rightWrap.columns = 'auto,auto';
  rightWrap.horizontalAlignment = 'right';
  rightWrap.verticalAlignment = 'middle';

  const count = getItemCount(item.text);
  if (count > 1) {
    const countLabel = new Label();
    countLabel.className = 'result-count';
    countLabel.text = `(${count})`;
    countLabel.col = 0;
    rightWrap.addChild(countLabel);
  }

  const icon = new Image();
  icon.className = 'result-info-icon';
  icon.src = '~/assets/icons/info.png';
  icon.col = count > 1 ? 1 : 0;
  rightWrap.addChild(icon);
  wrapper.addChild(rightWrap);

  wrapper.on('tap', () => navigateToDetails(item));
  return wrapper;
};

const renderResultCards = (host: StackLayout) => {
  host.removeChildren();
  const highlightedCount = Math.min(lastScanCount > 0 ? lastScanCount : 1, getUniqueItems().length);
  getUniqueItems().forEach((item, index) => host.addChild(createResultCard(item, index, highlightedCount)));
};

const updatePauseOverlayPosition = (showSheet: boolean, collapsedSheetHeight: number) => {
  const pauseShell = pageRef.getViewById<GridLayout>('pauseShell');
  if (!pauseShell) {
    return;
  }

  const screenHeight = Screen.mainScreen.heightDIPs || 800;
  pauseShell.horizontalAlignment = 'center';
  pauseShell.verticalAlignment = 'bottom';

  if (showSheet && isResultSheetExpanded) {
    pauseShell.marginBottom = Math.round(screenHeight * 0.7);
  } else if (showSheet) {
    pauseShell.marginBottom = collapsedSheetHeight + 50;
  } else {
    pauseShell.marginBottom = 96;
  }
};

const updateResultsUi = () => {
  const shouldShow = scannedItems.length > 0 && !isResultSheetHidden && ((settings.showResultSheet ?? true) || isScanningPaused);
  const resultSheet = pageRef.getViewById<GridLayout>('resultSheet');
  const expandedOverlay = pageRef.getViewById<GridLayout>('expandedSheetOverlay');
  const bottomControls = pageRef.getViewById<StackLayout>('bottomControls');
  const resultItemsScroll = pageRef.getViewById<any>('resultItemsScroll');
  const uniqueItems = getUniqueItems();
  const visibleCount = Math.min(uniqueItems.length, 3);
  const scrollHeight =
    visibleCount > 0 ? visibleCount * RESULT_CARD_HEIGHT + Math.max(visibleCount - 1, 0) * RESULT_CARD_GAP : 0;
  const collapsedSheetHeight = RESULT_SHEET_BASE_HEIGHT + scrollHeight;

  resultItemsScroll.height = scrollHeight;

  setVisible(resultSheet, shouldShow && !isResultSheetExpanded);
  setVisible(expandedOverlay, shouldShow && isResultSheetExpanded);
  setVisible(bottomControls, !shouldShow);
  updatePauseOverlayPosition(shouldShow, collapsedSheetHeight);

  if (!shouldShow) {
    return;
  }

  const totalCount = scannedItems.length;
  const uniqueCount = uniqueItems.length;
  const scanCount = lastScanCount > 0 ? lastScanCount : uniqueCount;
  const header = `${scanCount} found (${totalCount} total)`;

  pageRef.getViewById<Label>('resultHeaderText').text = header;
  pageRef.getViewById<Label>('expandedHeaderText').text = header;
  pageRef.getViewById<Label>('expandButtonLabel').text = isResultSheetExpanded ? 'Collapse' : 'Expand';

  renderResultCards(pageRef.getViewById<StackLayout>('resultItems'));
  renderResultCards(pageRef.getViewById<StackLayout>('expandedResultItems'));
};

const updateBottomControls = () => {
  const chip = pageRef.getViewById<StackLayout>('typesChip');
  const chipText = pageRef.getViewById<Label>('typesChipText');
  const zoomIcon = pageRef.getViewById<Image>('zoomIcon');
  const flashIcon = pageRef.getViewById<Image>('flashIcon');

  const activeText = getActiveBarcodeText();
  chipText.text = activeText;
  setVisible(chip, !!activeText);

  zoomIcon.src = zoomLevel === 1.0 ? '~/assets/icons/zoom_out.png' : '~/assets/icons/zoom_in.png';
  flashIcon.src = isFlashOn ? '~/assets/icons/flash_off.png' : '~/assets/icons/flash_on.png';
};

const applyEnabledTypes = () => {
  barkoderView.setBarcodeTypeEnabled(getEnabledDecoders());
};

const applyScannerConfiguration = () => {
  barkoderView.setLicenseKey(BARKODER_LICENSE_KEY);
  barkoderView.setImageResultEnabled(true);
  barkoderView.setLocationInImageResultEnabled(true);
  barkoderView.setPinchToZoomEnabled(settings.pinchToZoom);
  barkoderView.setLocationInPreviewEnabled(settings.locationInPreview);
  barkoderView.setRegionOfInterestVisible(settings.regionOfInterest);
  barkoderView.setBeepOnSuccessEnabled(settings.beepOnSuccess);
  barkoderView.setVibrateOnSuccessEnabled(settings.vibrateOnSuccess);
  barkoderView.setEnabledComposite(mode === MODES.ANYSCAN && settings.compositeMode ? 1 : 0);
  barkoderView.setUpcEanDeblurEnabled(settings.scanBlurred);
  barkoderView.setEnableMisshaped1DEnabled(settings.scanDeformed);
  barkoderView.setDecodingSpeed(settings.decodingSpeed);
  barkoderView.setBarkoderResolution(settings.resolution as any);
  barkoderView.setCloseSessionOnResultEnabled(!settings.continuousScanning);
  barkoderView.setBarcodeThumbnailOnResultEnabled(true);
  barkoderView.setMaximumResultsCount(200);
  barkoderView.setThresholdBetweenDuplicatesScans(settings.continuousScanning ? settings.continuousThreshold ?? 0 : 0);
  applyEnabledTypes();

  if (settings.regionOfInterest && mode !== MODES.VIN && mode !== MODES.DPM) {
    barkoderView.setRegionOfInterest(ROI_DEFAULT.x, ROI_DEFAULT.y, ROI_DEFAULT.width, ROI_DEFAULT.height);
  }

  if (mode !== MODES.VIN) {
    barkoderView.setCustomOption('enable_ocr_functionality', 0);
  }

  if (mode === MODES.MULTISCAN) {
    barkoderView.setMulticodeCachingDuration(3000);
    barkoderView.setMulticodeCachingEnabled(true);
  } else if (mode === MODES.VIN) {
    barkoderView.setEnableVINRestrictions(true);
    barkoderView.setRegionOfInterest(ROI_VIN.x, ROI_VIN.y, ROI_VIN.width, ROI_VIN.height);
    barkoderView.setCustomOption('enable_ocr_functionality', enabledTypes.ocrText ? 1 : 0);
  } else if (mode === MODES.DPM) {
    barkoderView.setDatamatrixDpmModeEnabled(true);
    barkoderView.setRegionOfInterest(ROI_DPM.x, ROI_DPM.y, ROI_DPM.width, ROI_DPM.height);
  } else if (mode === MODES.AR_MODE) {
    barkoderView.setBarkoderARMode(settings.arMode ?? BarkoderConstants.BarkoderARMode.InteractiveEnabled);
    barkoderView.setBarkoderARLocationType(settings.arLocationType ?? BarkoderConstants.BarkoderARLocationType.NONE);
    barkoderView.setBarkoderARHeaderShowMode(
      settings.arHeaderShowMode ?? BarkoderConstants.BarkoderARHeaderShowMode.ONSELECTED,
    );
    barkoderView.setBarkoderARoverlayRefresh(
      settings.arOverlayRefresh ?? BarkoderConstants.BarkoderAROverlayRefresh.NORMAL,
    );
    barkoderView.setARDoubleTapToFreezeEnabled(!!settings.arDoubleTapToFreeze);
    barkoderView.setARSelectedLocationLineColor('#00FF00');
    barkoderView.setARNonSelectedLocationLineColor('#FF0000');
  } else if (mode === MODES.DOTCODE) {
    barkoderView.setRegionOfInterest(ROI_DOTCODE.x, ROI_DOTCODE.y, ROI_DOTCODE.width, ROI_DOTCODE.height);
  }
};

const startScanning = () => {
  barkoderView.stopScanning();
  barkoderView.startScanning({
    async scanningFinished(results: any[], thumbnails: ImageSource[], resultImage: ImageSource) {
      try {
        const validResults = getValidResults(results);
        if (!validResults.length) {
          return;
        }

        const shouldPause = !settings.continuousScanning;
        if (shouldPause) {
          barkoderView.stopScanning();
          isScanningPaused = true;
          setVisible(pageRef.getViewById('resumeOverlay'), true);
        }

        const newItems: HistoryItem[] = [];

        for (const result of validResults) {
          try {
            const saved = await HistoryService.addScan({
              text: result.textualData,
              type: extractBarcodeType(result),
              image: thumbnails?.[0] || resultImage,
            });
            newItems.push(saved);
          } catch (error) {
            console.error('Error saving individual scan result:', error);
            newItems.push(createFallbackHistoryItem(result));
          }
        }

        Utils.executeOnMainThread(() => {
          scannedItems = [...newItems, ...scannedItems];
          lastScanCount = validResults.length;
          isResultSheetHidden = false;

          if (shouldPause && resultImage) {
            const frozen = pageRef.getViewById<Image>('frozenImage');
            frozen.src = resultImage;
            setVisible(frozen, true);
          }

          updateResultsUi();
        });
      } catch (error) {
        console.error('Error handling Barkoder scan callback:', error);
      }
    },
  });
};

const resumeScanning = () => {
  resetPauseState();
  startScanning();
};

const persistAndRefresh = (restart = false) => {
  saveCurrentSettings();
  applyScannerConfiguration();
  buildSettingsContent();
  updateBottomControls();
  updateResultsUi();

  if (restart) {
    startScanning();
  }
};

const updateSetting = (key: keyof ScannerSettings, value: any) => {
  settings = { ...settings, [key]: value };
  const shouldRestart = key === 'continuousScanning' || key === 'continuousThreshold';

  if (shouldRestart) {
    resetPauseState();
  }

  persistAndRefresh(shouldRestart);
};

const getFilteredBarcodeTypes = (category: '1D' | '2D') => {
  let currentTypes = category === '1D' ? BARCODE_TYPES_1D : BARCODE_TYPES_2D;

  if (mode === MODES.DPM) {
    currentTypes = currentTypes.filter((type) => ['datamatrix', 'qr', 'qrMicro'].includes(type.id));
  } else if (mode === MODES.DOTCODE) {
    currentTypes = currentTypes.filter((type) => type.id === 'dotcode');
  } else if (mode === MODES.VIN) {
    currentTypes = currentTypes.filter((type) => ['code39', 'code128', 'datamatrix', 'qr', 'ocrText'].includes(type.id));
  } else if (mode === MODES.MRZ) {
    return [];
  } else if (mode === MODES.MODE_1D && category === '2D') {
    return [];
  } else if (mode === MODES.MODE_2D && category === '1D') {
    return [];
  }

  if (mode !== MODES.VIN) {
    currentTypes = currentTypes.filter((type) => type.id !== 'ocrText');
  }

  currentTypes = currentTypes.filter((type) => type.id !== 'idDocument');

  return currentTypes;
};

const getGeneralSettings = (): SettingDescriptor[] => {
  const items: SettingDescriptor[] = [];

  if (mode === MODES.ANYSCAN) {
    items.push({ kind: 'switch', label: 'Composite Mode', key: 'compositeMode' });
  }

  items.push({ kind: 'switch', label: 'Allow Pinch to Zoom', key: 'pinchToZoom' });

  if (![MODES.DPM, MODES.AR_MODE, MODES.VIN, MODES.MRZ].includes(mode as any)) {
    items.push({ kind: 'switch', label: 'Location in Preview', key: 'locationInPreview' });
  }

  if (![MODES.DPM, MODES.AR_MODE, MODES.MRZ].includes(mode as any)) {
    items.push({
      kind: 'switch',
      label: mode === MODES.VIN ? 'Narrow Viewfinder' : 'Region of Interest',
      key: 'regionOfInterest',
    });
  }

  items.push({ kind: 'switch', label: 'Beep on Success', key: 'beepOnSuccess' });
  items.push({ kind: 'switch', label: 'Vibrate on Success', key: 'vibrateOnSuccess' });
  items.push({ kind: 'switch', label: 'Show Result Sheet', key: 'showResultSheet' });

  if (![MODES.DPM, MODES.AR_MODE, MODES.VIN, MODES.MRZ, MODES.DOTCODE].includes(mode as any)) {
    items.push({ kind: 'switch', label: 'Scan Blurred UPC/EAN', key: 'scanBlurred' });
    items.push({ kind: 'switch', label: 'Scan Deformed Codes', key: 'scanDeformed' });
  }

  if (mode !== MODES.AR_MODE) {
    items.push({ kind: 'switch', label: 'Continuous Scanning', key: 'continuousScanning' });
    if (settings.continuousScanning) {
      const options: SettingOption[] = Array.from({ length: 11 }, (_, index) => ({
        label: `${index}s`,
        value: index,
      }));
      items.push({ kind: 'dropdown', label: 'Duplicate Threshold', key: 'continuousThreshold', options });
    }
  } else {
    items.push({ kind: 'switch', label: 'Double Tap to Freeze', key: 'arDoubleTapToFreeze' });
    items.push({
      kind: 'dropdown',
      label: 'AR Mode',
      key: 'arMode',
      options: [
        { label: 'Disabled', value: BarkoderConstants.BarkoderARMode.InteractiveDisabled },
        { label: 'Enabled', value: BarkoderConstants.BarkoderARMode.InteractiveEnabled },
        { label: 'Always', value: BarkoderConstants.BarkoderARMode.NonInteractive },
      ],
    });
    items.push({
      kind: 'dropdown',
      label: 'Location Type',
      key: 'arLocationType',
      options: [
        { label: 'None', value: BarkoderConstants.BarkoderARLocationType.NONE },
        { label: 'Tight', value: BarkoderConstants.BarkoderARLocationType.TIGHT },
        { label: 'Box', value: BarkoderConstants.BarkoderARLocationType.BOUNDINGBOX },
      ],
    });
    items.push({
      kind: 'dropdown',
      label: 'Header Show Mode',
      key: 'arHeaderShowMode',
      options: [
        { label: 'Never', value: BarkoderConstants.BarkoderARHeaderShowMode.NEVER },
        { label: 'Always', value: BarkoderConstants.BarkoderARHeaderShowMode.ALWAYS },
        { label: 'Selected', value: BarkoderConstants.BarkoderARHeaderShowMode.ONSELECTED },
      ],
    });
    items.push({
      kind: 'dropdown',
      label: 'Overlay Refresh',
      key: 'arOverlayRefresh',
      options: [
        { label: 'Smooth', value: BarkoderConstants.BarkoderAROverlayRefresh.SMOOTH },
        { label: 'Normal', value: BarkoderConstants.BarkoderAROverlayRefresh.NORMAL },
      ],
    });
  }

  return items;
};

const getDecodingSettings = (): SettingDescriptor[] => {
  if ([MODES.DPM, MODES.AR_MODE, MODES.VIN, MODES.MRZ, MODES.DOTCODE].includes(mode as any)) {
    return [];
  }

  return [
    {
      kind: 'dropdown',
      label: 'Decoding Speed',
      key: 'decodingSpeed',
      options: [
        { label: 'Fast', value: BarkoderConstants.DecodingSpeed.Fast },
        { label: 'Normal', value: BarkoderConstants.DecodingSpeed.Normal },
        { label: 'Slow', value: BarkoderConstants.DecodingSpeed.Slow },
      ],
    },
    {
      kind: 'dropdown',
      label: 'Resolution',
      key: 'resolution',
      options: [
        { label: 'HD', value: BarkoderConstants.BarkoderResolution.HD },
        { label: 'FHD', value: BarkoderConstants.BarkoderResolution.FHD },
      ],
    },
  ];
};

const addSectionHeader = (host: StackLayout, title: string) => {
  const wrapper = new StackLayout();
  wrapper.className = 'settings-section';

  const label = new Label();
  label.className = 'settings-section-text';
  label.text = title;
  wrapper.addChild(label);
  host.addChild(wrapper);
};

const createSettingsGroup = () => {
  const group = new StackLayout();
  group.className = 'settings-group';
  return group;
};

const createToggleControl = (checked: boolean) => {
  const toggle = new GridLayout();
  toggle.className = checked ? 'settings-toggle on' : 'settings-toggle off';
  toggle.width = 38;
  toggle.height = 24;
  toggle.borderRadius = 12;
  toggle.horizontalAlignment = 'right';
  toggle.verticalAlignment = 'middle';

  const thumb = new GridLayout();
  thumb.className = checked ? 'settings-toggle-thumb on' : 'settings-toggle-thumb off';
  thumb.width = 18;
  thumb.height = 18;
  thumb.borderRadius = 9;
  thumb.horizontalAlignment = checked ? 'right' : 'left';
  thumb.verticalAlignment = 'middle';
  thumb.marginLeft = 3;
  thumb.marginRight = 3;

  toggle.addChild(thumb);
  return toggle;
};

const addToggleRow = (
  group: StackLayout,
  labelText: string,
  checked: boolean,
  isLast: boolean,
  onToggle: () => void,
) => {
  const row = new GridLayout();
  row.className = isLast ? 'settings-row' : 'settings-row border';
  row.columns = '*,auto';

  const label = new Label();
  label.className = 'settings-label';
  label.text = labelText;
  label.textWrap = true;
  label.col = 0;

  const control = createToggleControl(checked);
  control.col = 1;

  row.addChild(label);
  row.addChild(control);
  row.on('tap', onToggle);
  group.addChild(row);
};

const addSwitchRow = (group: StackLayout, descriptor: SettingDescriptor, isLast: boolean) => {
  addToggleRow(group, descriptor.label, !!settings[descriptor.key], isLast, () => {
    updateSetting(descriptor.key, !settings[descriptor.key]);
  });
};

const addDropdownRow = (group: StackLayout, descriptor: SettingDescriptor, isLast: boolean) => {
  const row = new GridLayout();
  row.className = isLast ? 'settings-row' : 'settings-row border';
  row.columns = '*,auto,auto';

  const label = new Label();
  label.className = 'settings-label';
  label.text = descriptor.label;
  label.col = 0;

  const selected = descriptor.options?.find((option) => option.value === settings[descriptor.key]);
  const value = new Label();
  value.className = 'settings-value';
  value.text = selected?.label ?? 'Select';
  value.col = 1;

  const chevron = new Image();
  chevron.src = '~/assets/icons/chevron_right.png';
  chevron.width = 14;
  chevron.height = 14;
  chevron.col = 2;

  row.addChild(label);
  row.addChild(value);
  row.addChild(chevron);
  row.on('tap', () => {
    openDropdownKey = openDropdownKey === descriptor.key ? null : String(descriptor.key);
    buildSettingsContent();
  });
  group.addChild(row);

  if (openDropdownKey === descriptor.key) {
    descriptor.options?.forEach((option) => {
      const optionRow = new GridLayout();
      optionRow.className = 'dropdown-option';
      optionRow.columns = '*,auto';

      const optionLabel = new Label();
      optionLabel.className = option.value === settings[descriptor.key] ? 'dropdown-option-text selected' : 'dropdown-option-text';
      optionLabel.text = option.label;
      optionLabel.col = 0;

      optionRow.addChild(optionLabel);
      if (option.value === settings[descriptor.key]) {
        const check = new Label();
        check.className = 'dropdown-check';
        check.text = '✓';
        check.col = 1;
        optionRow.addChild(check);
      }

      optionRow.on('tap', () => {
        openDropdownKey = null;
        updateSetting(descriptor.key, option.value);
      });
      group.addChild(optionRow);
    });
  }
};

const renderSettingGroup = (host: StackLayout, title: string, descriptors: SettingDescriptor[]) => {
  if (!descriptors.length) {
    return;
  }

  addSectionHeader(host, title);
  const group = createSettingsGroup();
  descriptors.forEach((descriptor, index) => {
    const isLast = index === descriptors.length - 1;
    if (descriptor.kind === 'switch') {
      addSwitchRow(group, descriptor, isLast);
    } else {
      addDropdownRow(group, descriptor, isLast);
    }
  });
  host.addChild(group);
};

const toggleBarcodeType = (typeId: string, enabled: boolean) => {
  if ((typeId === 'ocrText' && mode !== MODES.VIN) || typeId === 'idDocument') {
    return;
  }

  enabledTypes = sanitizeEnabledTypes({ ...enabledTypes, [typeId]: enabled });
  persistAndRefresh(false);
};

const setCategoryEnabled = (category: '1D' | '2D', enabled: boolean) => {
  const types = getFilteredBarcodeTypes(category);
  enabledTypes = { ...enabledTypes };
  types.forEach((type) => {
    enabledTypes[type.id] = enabled;
  });
  enabledTypes = sanitizeEnabledTypes(enabledTypes);
  persistAndRefresh(false);
};

const renderBarcodeGroup = (host: StackLayout, category: '1D' | '2D') => {
  const types = getFilteredBarcodeTypes(category);
  if (!types.length) {
    return;
  }

  addSectionHeader(host, `${category} Barcodes`);
  const group = createSettingsGroup();
  const allEnabled = types.every((type) => enabledTypes[type.id]);

  addToggleRow(group, 'Enable All', allEnabled, false, () => setCategoryEnabled(category, !allEnabled));

  types.forEach((type, index) => {
    addToggleRow(group, type.label, !!enabledTypes[type.id], index === types.length - 1, () => {
      toggleBarcodeType(type.id, !enabledTypes[type.id]);
    });
  });

  host.addChild(group);
};

const buildSettingsContent = () => {
  const host = pageRef.getViewById<StackLayout>('settingsContent');
  host.removeChildren();

  renderSettingGroup(host, 'General Settings', getGeneralSettings());
  renderSettingGroup(host, 'Decoding Settings', getDecodingSettings());
  renderBarcodeGroup(host, '1D');
  renderBarcodeGroup(host, '2D');

  const resetWrap = new StackLayout();
  resetWrap.className = 'reset-button';
  const resetLabel = new Label();
  resetLabel.className = 'reset-button-text';
  resetLabel.text = 'Reset All Settings';
  resetWrap.addChild(resetLabel);
  resetWrap.on('tap', () => {
    settings = getInitialSettings(mode);
    enabledTypes = getInitialEnabledTypes(mode);
    openDropdownKey = null;
    persistAndRefresh(true);
  });

  host.addChild(resetWrap);
};

const openSettings = () => {
  barkoderView.stopScanning();
  setVisible(pageRef.getViewById('settingsOverlay'), true);
  openDropdownKey = null;
  buildSettingsContent();
};

const closeSettings = () => {
  setVisible(pageRef.getViewById('settingsOverlay'), false);
  if (!isScanningPaused) {
    startScanning();
  }
};

const applyCameraOrientation = () => {
  const preview = (barkoderView as any)?.nativeViewProtected ?? (barkoderView as any)?.android ?? null;
  const rotation = selectedCamera === BarkoderConstants.BarkoderCameraPosition.Front ? 180 : 0;

  if (preview?.setRotation) {
    preview.setRotation(rotation);
  } else {
    (barkoderView as any).rotate = rotation;
  }

  pageRef.getViewById<Image>('frozenImage').rotate = rotation;
};

const swapCamera = () => {
  selectedCamera =
    selectedCamera === BarkoderConstants.BarkoderCameraPosition.Back
      ? BarkoderConstants.BarkoderCameraPosition.Front
      : BarkoderConstants.BarkoderCameraPosition.Back;

  const shouldResumeScanning = !isScanningPaused;

  barkoderView.stopScanning();
  barkoderView.setCamera(selectedCamera);
  applyCameraOrientation();

  if (shouldResumeScanning) {
    setTimeout(() => {
      startScanning();
    }, 150);
  }
};

const bindUi = () => {
  pageRef.getViewById<Label>('closeButton').on('tap', () => Frame.topmost().goBack());
  pageRef.getViewById<Label>('settingsButton').on('tap', openSettings);
  pageRef.getViewById<GridLayout>('resumeOverlay').on('tap', resumeScanning);
  pageRef.getViewById<GridLayout>('settingsBackButton').on('tap', closeSettings);

  pageRef.getViewById<GridLayout>('zoomButton').on('tap', () => {
    zoomLevel = zoomLevel === 1.0 ? 1.5 : 1.0;
    barkoderView.setZoomFactor(zoomLevel);
    updateBottomControls();
  });

  pageRef.getViewById<GridLayout>('flashButton').on('tap', () => {
    isFlashOn = !isFlashOn;
    barkoderView.setFlashEnabled(isFlashOn);
    updateBottomControls();
  });

  pageRef.getViewById<GridLayout>('cameraButton').on('tap', () => {
    swapCamera();
  });

  const copyHandler = async () => {
    if (!scannedItems.length) {
      return;
    }
    await copyToClipboard(scannedItems.map((item) => item.text).join('\n'));
    await Dialogs.alert({
      title: 'Copied',
      message: `${scannedItems.length} barcode(s) copied to clipboard`,
      okButtonText: 'OK',
    });
  };

  const csvHandler = async () => {
    if (!scannedItems.length) {
      return;
    }

    const header = 'Barcode,Type\n';
    const rows = scannedItems.map((item) => `"${item.text.replace(/"/g, '""')}","${item.type}"`).join('\n');
    await shareCsvText(header + rows);
  };

  pageRef.getViewById<StackLayout>('copyButton').on('tap', copyHandler);
  pageRef.getViewById<StackLayout>('csvButton').on('tap', csvHandler);
  pageRef.getViewById<StackLayout>('expandedCopyButton').on('tap', copyHandler);
  pageRef.getViewById<StackLayout>('expandedCsvButton').on('tap', csvHandler);

  pageRef.getViewById<Label>('resultCloseButton').on('tap', () => {
    isResultSheetHidden = true;
    updateResultsUi();
  });

  pageRef.getViewById<Label>('expandedCloseButton').on('tap', () => {
    isResultSheetExpanded = false;
    updateResultsUi();
  });

  pageRef.getViewById<StackLayout>('expandButton').on('tap', () => {
    isResultSheetExpanded = true;
    updateResultsUi();
  });

  pageRef.getViewById<StackLayout>('collapseButton').on('tap', () => {
    isResultSheetExpanded = false;
    updateResultsUi();
  });
};

export function navigatingTo(args: { object: Page }) {
  pageRef = args.object;
  pageRef.actionBarHidden = true;

  const context = (pageRef.navigationContext as { mode?: string; sessionId?: number }) ?? {};
  mode = context.mode ?? MODES.ANYSCAN;
  barkoderView = pageRef.getViewById('barkoderView') as BarkoderViewInstance;

  scannedItems = [];
  lastScanCount = 0;
  isFlashOn = false;
  zoomLevel = 1.0;
  selectedCamera = BarkoderConstants.BarkoderCameraPosition.Back;
  isScanningPaused = false;
  openDropdownKey = null;
  isResultSheetExpanded = false;
  isResultSheetHidden = false;

  enabledTypes = sanitizeEnabledTypes(getInitialEnabledTypes(mode));
  settings = getInitialSettings(mode);

  const saved = SettingsService.getSettings(mode);
  if (saved) {
    enabledTypes = sanitizeEnabledTypes({ ...enabledTypes, ...saved.enabledTypes });
    settings = { ...settings, ...saved.scannerSettings };
  }

  bindUi();
  buildSettingsContent();
  updateBottomControls();
  updateResultsUi();
  resetPauseState();
  applyCameraOrientation();

  setTimeout(() => {
    applyScannerConfiguration();
    startScanning();
  }, 250);
}

export function navigatingFrom() {
  saveCurrentSettings();
  barkoderView?.stopScanning();
}
