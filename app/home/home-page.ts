import { Dialogs, Frame, GridLayout, Image, ImageSource, Label, Page, StackLayout, WrapLayout } from '@nativescript/core';
import * as imagePickerPlugin from '@nativescript/imagepicker';
import { BARKODER_LICENSE_KEY } from '../config';
import { ALL_BARCODE_TYPES, MODES, SECTIONS } from '../constants';
import { HistoryService } from '../services/history-service';
import { HomeItem, HomeSection } from '../types';
import { fileFromLocalPath, imageSourceToBase64 } from '../utils/platform';
let loadingOverlay: GridLayout;

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

    setLoading(false);
    await Dialogs.alert({
      title: 'Not available',
      message: 'Gallery image scanning is temporarily disabled while the NativeScript Barkoder view initialization is being stabilized.',
      okButtonText: 'OK',
    });
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
