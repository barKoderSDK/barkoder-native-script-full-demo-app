import { Frame, GridLayout, Image, Label, Page, ScrollView, StackLayout } from '@nativescript/core';
import { HistoryService } from '../services/history-service';
import { HistoryItem } from '../types';
import { formatHistoryDate, is1DBarcodeType } from '../utils/platform';

const createSectionHeader = (title: string) => {
  const wrapper = new StackLayout();
  wrapper.className = 'history-section-header';

  const label = new Label();
  label.className = 'section-label';
  label.text = title;

  wrapper.addChild(label);
  return wrapper;
};

const createHistoryRow = (item: HistoryItem) => {
  const row = new GridLayout();
  row.className = 'history-item';
  row.columns = 'auto,*,auto,auto';
  row.verticalAlignment = 'middle';

  if (item.image) {
    const image = new Image();
    image.className = 'history-thumb';
    image.src = item.image;
    image.stretch = 'aspectFill';
    image.col = 0;
    row.addChild(image);
  } else {
    const placeholder = new GridLayout();
    placeholder.className = 'history-thumb';
    placeholder.col = 0;

    const icon = new Image();
    icon.className = 'history-thumb-icon';
    icon.src = is1DBarcodeType(item.type) ? '~/assets/icons/icon_1d.png' : '~/assets/icons/icon_2d.png';
    icon.stretch = 'aspectFit';
    placeholder.addChild(icon);
    row.addChild(placeholder);
  }

  const textWrap = new StackLayout();
  textWrap.col = 1;
  textWrap.marginLeft = 16;

  const text = new Label();
  text.className = 'history-text';
  text.text = item.text;
  text.textWrap = false;

  const type = new Label();
  type.className = 'history-type';
  type.text = item.type;

  textWrap.addChild(text);
  textWrap.addChild(type);
  row.addChild(textWrap);

  if (item.count > 1) {
    const count = new Label();
    count.className = 'history-count';
    count.col = 2;
    count.text = `(${item.count})`;
    count.verticalAlignment = 'middle';
    row.addChild(count);
  }

  const info = new Image();
  info.className = 'history-info-icon';
  info.col = 3;
  info.src = '~/assets/icons/info.png';
  info.stretch = 'aspectFit';
  row.addChild(info);

  row.on('tap', () => {
    Frame.topmost().navigate({
      moduleName: 'details/details-page',
      context: { item },
    });
  });

  return row;
};

const groupHistory = (items: HistoryItem[]) => {
  const grouped = new Map<string, HistoryItem[]>();

  items.forEach((item) => {
    const key = formatHistoryDate(item.timestamp);
    const current = grouped.get(key) ?? [];
    current.push(item);
    grouped.set(key, current);
  });

  return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
};

const renderHistory = async (page: Page) => {
  const host = page.getViewById<StackLayout>('historySections');
  const loading = page.getViewById('loadingIndicator');
  const scroll = page.getViewById<ScrollView>('historyScroll');

  host.removeChildren();
  const history = await HistoryService.getHistory();

  groupHistory(history).forEach((section) => {
    host.addChild(createSectionHeader(section.title));
    section.data.forEach((item) => host.addChild(createHistoryRow(item)));
  });

  (loading as any).visibility = 'collapse';
  (scroll as any).visibility = 'visible';
};

export function navigatingTo(args: { object: Page }) {
  const page = args.object;
  page.actionBarHidden = true;

  page.getViewById<GridLayout>('backButton').on('tap', () => Frame.topmost().goBack());

  renderHistory(page);
}
