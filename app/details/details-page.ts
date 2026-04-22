import { Dialogs, Frame, GridLayout, Image, Label, Page, StackLayout } from '@nativescript/core';
import { HistoryItem } from '../types';
import { copyToClipboard, is1DBarcodeType, openExternalUrl, parseMrzData } from '../utils/platform';

let currentItem: HistoryItem;

const createInfoCard = (labelText: string, valueText: string) => {
  const card = new GridLayout();
  card.className = 'info-card';
  card.columns = '*,*';

  const label = new Label();
  label.className = 'info-label';
  label.text = labelText;
  label.col = 0;

  const value = new Label();
  value.className = 'info-value';
  value.text = valueText;
  value.textWrap = true;
  value.horizontalAlignment = 'right';
  value.col = 1;

  card.addChild(label);
  card.addChild(value);

  return card;
};

const renderDetails = (page: Page) => {
  const image = page.getViewById<Image>('barcodeImage');
  const placeholder = page.getViewById<StackLayout>('barcodePlaceholder');
  const placeholderIcon = page.getViewById<Image>('placeholderIcon');
  const host = page.getViewById<StackLayout>('detailsContent');
  host.removeChildren();

  if (currentItem.image) {
    image.src = currentItem.image;
    image.className = 'barcode-preview';
    placeholder.className = 'hidden';
  } else {
    image.className = 'barcode-preview hidden';
    placeholder.className = '';
    placeholderIcon.src = is1DBarcodeType(currentItem.type)
      ? '~/assets/icons/icon_1d.png'
      : '~/assets/icons/icon_2d.png';
  }

  host.addChild(createInfoCard('Barcode Type', currentItem.type));

  if (currentItem.type.toLowerCase() === 'mrz') {
    parseMrzData(currentItem.text).forEach((field) => host.addChild(createInfoCard(field.label, field.value)));
  } else {
    host.addChild(createInfoCard('Value', currentItem.text));
  }
};

export function navigatingTo(args: { object: Page }) {
  const page = args.object;
  page.actionBarHidden = true;
  currentItem = (page.navigationContext as { item: HistoryItem }).item;

  page.getViewById<GridLayout>('backButton').on('tap', () => Frame.topmost().goBack());
  page.getViewById<StackLayout>('copyButton').on('tap', async () => {
    await copyToClipboard(currentItem.text);
    await Dialogs.alert({
      title: 'Copied',
      message: 'Barcode copied to clipboard',
      okButtonText: 'OK',
    });
  });
  page.getViewById<StackLayout>('searchButton').on('tap', () => {
    openExternalUrl(`https://www.google.com/search?q=${encodeURIComponent(currentItem.text)}`);
  });

  renderDetails(page);
}
