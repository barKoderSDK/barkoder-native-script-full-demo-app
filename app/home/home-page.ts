import { Dialogs, Frame, GridLayout, Image, ImageSource, Label, Page, StackLayout, Utils, WrapLayout } from '@nativescript/core';
import * as imagePickerPlugin from '@nativescript/imagepicker';
import { ALL_BARCODE_TYPES, MODES, SECTIONS } from '../constants';
import { HistoryService } from '../services/history-service';
import { HomeItem, HomeSection, HistoryItem } from '../types';
import { fileFromLocalPath, imageSourceToBase64 } from '../utils/platform';
import { getInitialEnabledTypes, getInitialSettings } from '../utils/scanner-config';
import { BarkoderViewInstance } from '../vendor/barkoder';

let loadingOverlay: GridLayout;
let galleryBarkoderView: BarkoderViewInstance;

const createSectionTitle = (title: string) => {
  const label = new Label();
  label.className = 'section-title';
  label.text = title;
  return label;
};

const createHomeItem = (item: HomeItem) => {
  const wrapper = new StackLayout();
  wrapper.className = 'home-item';

  const icon = new Image();
  icon.className = 'home-item-icon';
  icon.src = item.icon;
  icon.stretch = 'aspectFit';

  const label = new Label();
  label.className = 'home-item-label';
  label.text = item.label;
  label.textWrap = true;

  wrapper.addChild(icon);
  wrapper.addChild(label);
  return wrapper;
};

const navigateToScanner = (mode: string) => {
  Frame.topmost().navigate({
    moduleName: 'scanner/scanner-page',
    context: { mode, sessionId: Date.now() },
  });
};

const setLoading = (visible: boolean) => {
  loadingOverlay.className = visible ? 'loading-overlay' : 'loading-overlay hidden';
};

const resolveSelectionPath = (selection: any) =>
  selection?.fileUri ||
  selection?.path ||
  selection?.file ||
  selection?.android ||
  selection?.ios ||
  selection?.uri ||
  null;

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
    return !!text;
  });

const extractBarcodeType = (result: any) => {
  if (result?.barcodeTypeName) {
    return result.barcodeTypeName;
  }

  const barcodeType = String(result?.barcodeType ?? result?.decoderType ?? '').trim();
  if (barcodeType) {
    return barcodeType;
  }

  return 'Unknown';
};

const applyGalleryConfiguration = () => {
  const settings = getInitialSettings(MODES.GALLERY);
  const enabledTypes = getInitialEnabledTypes(MODES.GALLERY);
  const enabledDecoders = ALL_BARCODE_TYPES.filter((type) => enabledTypes[type.id]).map((type) => type.decoder);

  galleryBarkoderView.setImageResultEnabled(true);
  galleryBarkoderView.setLocationInImageResultEnabled(true);
  galleryBarkoderView.setLocationInPreviewEnabled(false);
  galleryBarkoderView.setPinchToZoomEnabled(false);
  galleryBarkoderView.setRegionOfInterestVisible(false);
  galleryBarkoderView.setBeepOnSuccessEnabled(settings.beepOnSuccess);
  galleryBarkoderView.setVibrateOnSuccessEnabled(settings.vibrateOnSuccess);
  galleryBarkoderView.setEnabledComposite(0);
  galleryBarkoderView.setUpcEanDeblurEnabled(settings.scanBlurred);
  galleryBarkoderView.setEnableMisshaped1DEnabled(settings.scanDeformed);
  galleryBarkoderView.setDecodingSpeed(settings.decodingSpeed);
  galleryBarkoderView.setBarkoderResolution(settings.resolution as any);
  galleryBarkoderView.setCloseSessionOnResultEnabled(true);
  galleryBarkoderView.setBarcodeThumbnailOnResultEnabled(true);
  galleryBarkoderView.setMaximumResultsCount(200);
  galleryBarkoderView.setThresholdBetweenDuplicatesScans(0);
  galleryBarkoderView.setCustomOption('enable_ocr_functionality', 0);
  galleryBarkoderView.setBarcodeTypeEnabled(enabledDecoders);
};

const scanImage = (base64Image: string) =>
  new Promise<any[]>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      reject(new Error('Gallery scan timed out.'));
    }, 30000);

    galleryBarkoderView.scanImage(base64Image, {
      scanningFinished(results: any) {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeout);
        resolve(getValidResults(results));
      },
    });
  });

const saveGalleryResults = async (results: any[], imageSource: ImageSource) => {
  const savedItems: HistoryItem[] = [];

  for (const result of results) {
    const saved = await HistoryService.addScan({
      text: result.textualData,
      type: extractBarcodeType(result),
      image: imageSource,
    });
    savedItems.push(saved);
  }

  return savedItems;
};

const openGalleryResult = (items: HistoryItem[]) => {
  Utils.executeOnMainThread(() => {
    if (items.length === 1) {
      Frame.topmost().navigate({
        moduleName: 'details/details-page',
        context: { item: items[0] },
      });
      return;
    }

    Frame.topmost().navigate('history/history-page');
  });
};

const handleGalleryScan = async () => {
  try {
    setLoading(true);

    const picker = imagePickerPlugin.create({
      mode: 'single',
      mediaType: imagePickerPlugin.ImagePickerMediaType.Image,
      copyToAppFolder: 'picked-images',
    });

    const authorization = await picker.authorize();
    if (!authorization.authorized) {
      setLoading(false);
      return;
    }

    const selection = await picker.present();
    if (!selection?.length) {
      setLoading(false);
      return;
    }

    const selectedPath = resolveSelectionPath(selection[0]);
    if (!selectedPath) {
      setLoading(false);
      await Dialogs.alert({
        title: 'Error',
        message: 'Could not load the selected image.',
        okButtonText: 'OK',
      });
      return;
    }

    const imageSource = await ImageSource.fromFile(fileFromLocalPath(selectedPath).path);
    if (!imageSource) {
      setLoading(false);
      await Dialogs.alert({
        title: 'Error',
        message: 'Could not process the selected image.',
        okButtonText: 'OK',
      });
      return;
    }

    applyGalleryConfiguration();
    const results = await scanImage(imageSourceToBase64(imageSource));

    if (!results.length) {
      setLoading(false);
      await Dialogs.alert({
        title: 'No barcode found',
        message: 'No barcode could be detected in the selected image.',
        okButtonText: 'OK',
      });
      return;
    }

    const savedItems = await saveGalleryResults(results, imageSource);
    setLoading(false);

    if (savedItems.length > 1) {
      await Dialogs.alert({
        title: 'Gallery Scan',
        message: `${savedItems.length} barcodes were saved to history.`,
        okButtonText: 'OK',
      });
    }

    openGalleryResult(savedItems);
  } catch (error) {
    setLoading(false);
    console.error('Gallery scan failed:', error);
    await Dialogs.alert({
      title: 'Error',
      message: 'An error occurred while processing the image.',
      okButtonText: 'OK',
    });
  }
};

const handleItemTap = async (item: HomeItem) => {
  if (item.action === 'gallery') {
    await handleGalleryScan();
    return;
  }

  if (item.mode) {
    navigateToScanner(item.mode);
  }
};

const renderSections = (page: Page) => {
  const host = page.getViewById<StackLayout>('homeSections');
  host.removeChildren();

  SECTIONS.forEach((section: HomeSection) => {
    host.addChild(createSectionTitle(section.title));
    const grid = new WrapLayout();
    grid.className = 'home-grid';

    section.data.forEach((item) => {
      const itemView = createHomeItem(item);
      itemView.on('tap', () => handleItemTap(item));
      grid.addChild(itemView);
    });

    host.addChild(grid);
  });
};

export function navigatingTo(args: { object: Page }) {
  const page = args.object;
  page.actionBarHidden = true;

  loadingOverlay = page.getViewById<GridLayout>('loadingOverlay');
  galleryBarkoderView = page.getViewById('galleryBarkoderView') as BarkoderViewInstance;

  renderSections(page);

  page.getViewById<StackLayout>('recentTab').on('tap', () => {
    Frame.topmost().navigate('history/history-page');
  });

  page.getViewById<StackLayout>('anyscanTab').on('tap', () => {
    navigateToScanner(MODES.ANYSCAN);
  });

  page.getViewById<StackLayout>('aboutTab').on('tap', () => {
    Frame.topmost().navigate('about/about-page');
  });
}
