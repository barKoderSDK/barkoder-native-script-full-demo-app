import { View } from '@nativescript/core';
import { BarkoderView as BaseBarkoderView } from 'barkoder-nativescript/barkoder-nativescript.common';
import { BARKODER_LICENSE_KEY } from '../config';

export class LicensedBarkoderView extends (BaseBarkoderView as typeof View) {
  constructor() {
    super();
    (this as any).setLicenseKey(BARKODER_LICENSE_KEY);
  }
}
