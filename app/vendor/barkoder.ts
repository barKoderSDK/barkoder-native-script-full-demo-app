declare const require: any;

const barkoderCommon = require('barkoder-nativescript/barkoder-nativescript.common');
const barkoderConstantsModule = require('barkoder-nativescript/barkoder-nativescript.constants');

export const BarkoderView = barkoderCommon.BarkoderView as any;
export const BarkoderConstants = (barkoderCommon.BarkoderConstants || barkoderConstantsModule.BarkoderConstants) as any;
export type BarkoderViewInstance = any;
