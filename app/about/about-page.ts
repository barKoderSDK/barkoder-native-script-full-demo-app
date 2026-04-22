import { Button, Frame, GridLayout, Label, Page } from '@nativescript/core';
import { APP_VERSION, BARKODER_SDK_VERSION, NATIVESCRIPT_LIB_VERSION } from '../config';
import { getDeviceId, openExternalUrl } from '../utils/platform';

const ABOUT_TEXT = `Barcode Scanner Demo by barKoder showcases the enterprise-grade performance of the barKoder Barcode Scanner SDK along with most of its features in a wide variety of scanning scenarios.

Whether from One-Dimensional or Two-Dimensional barcodes, the barKoder API can capture the data reliably, accurately and surprisingly fast, even under very challenging conditions and environments.

You can test the barKoder Barcode Scanner SDK at your own convenience by signing up for a free trial.`;

export function navigatingTo(args: { object: Page }) {
  const page = args.object;
  page.actionBarHidden = true;

  page.getViewById<GridLayout>('backButton').on('tap', () => Frame.topmost().goBack());
  page.getViewById<Button>('trialButton').on('tap', () => openExternalUrl('https://barkoder.com/trial'));

  const description = page.getViewById<Label>('aboutDescription');
  description.text = ABOUT_TEXT;

  page.getViewById<Label>('deviceIdValue').text = getDeviceId();
  page.getViewById<Label>('appVersionValue').text = APP_VERSION;
  page.getViewById<Label>('sdkVersionValue').text = BARKODER_SDK_VERSION;
  page.getViewById<Label>('libVersionValue').text = NATIVESCRIPT_LIB_VERSION;
}
