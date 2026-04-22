import { BarcodeType, HomeSection } from './types';
import { BarkoderConstants } from './vendor/barkoder';

const icon = (name: string) => `~/assets/icons/${name}.png`;

export const BARCODE_TYPES_1D: BarcodeType[] = [
  { id: 'australianPost', label: 'Australian Post', decoder: BarkoderConstants.DecoderType.AustralianPost },
  { id: 'codabar', label: 'Codabar', decoder: BarkoderConstants.DecoderType.Codabar },
  { id: 'code11', label: 'Code 11', decoder: BarkoderConstants.DecoderType.Code11 },
  { id: 'code128', label: 'Code 128', decoder: BarkoderConstants.DecoderType.Code128 },
  { id: 'code25', label: 'Code 2 of 5 Standard', decoder: BarkoderConstants.DecoderType.Code25 },
  { id: 'code32', label: 'Code 32', decoder: BarkoderConstants.DecoderType.Code32 },
  { id: 'code39', label: 'Code 39', decoder: BarkoderConstants.DecoderType.Code39 },
  { id: 'code93', label: 'Code 93', decoder: BarkoderConstants.DecoderType.Code93 },
  { id: 'coop25', label: 'COOP 25', decoder: BarkoderConstants.DecoderType.COOP25 },
  { id: 'datalogic25', label: 'Code 2 of 5 Datalogic', decoder: BarkoderConstants.DecoderType.Datalogic25 },
  { id: 'databar14', label: 'GS1 Databar 14', decoder: BarkoderConstants.DecoderType.Databar14 },
  { id: 'databarExpanded', label: 'GS1 Databar Expanded', decoder: BarkoderConstants.DecoderType.DatabarExpanded },
  { id: 'databarLimited', label: 'GS1 Databar Limited', decoder: BarkoderConstants.DecoderType.DatabarLimited },
  { id: 'ean13', label: 'EAN 13', decoder: BarkoderConstants.DecoderType.Ean13 },
  { id: 'ean8', label: 'EAN 8', decoder: BarkoderConstants.DecoderType.Ean8 },
  { id: 'iata25', label: 'IATA 25', decoder: BarkoderConstants.DecoderType.IATA25 },
  { id: 'interleaved25', label: 'Interleaved 2 of 5', decoder: BarkoderConstants.DecoderType.Interleaved25 },
  { id: 'itf14', label: 'ITF 14', decoder: BarkoderConstants.DecoderType.ITF14 },
  { id: 'japanesePost', label: 'Japanese Post', decoder: BarkoderConstants.DecoderType.JapanesePost },
  { id: 'kix', label: 'KIX', decoder: BarkoderConstants.DecoderType.KIX },
  { id: 'matrix25', label: 'Matrix 25', decoder: BarkoderConstants.DecoderType.Matrix25 },
  { id: 'msi', label: 'MSI', decoder: BarkoderConstants.DecoderType.Msi },
  { id: 'planet', label: 'Planet', decoder: BarkoderConstants.DecoderType.Planet },
  { id: 'postalIMB', label: 'Postal IMB', decoder: BarkoderConstants.DecoderType.PostalIMB },
  { id: 'postnet', label: 'Postnet', decoder: BarkoderConstants.DecoderType.Postnet },
  { id: 'royalMail', label: 'Royal Mail', decoder: BarkoderConstants.DecoderType.RoyalMail },
  { id: 'telepen', label: 'Telepen', decoder: BarkoderConstants.DecoderType.Telepen },
  { id: 'upcA', label: 'UPC-A', decoder: BarkoderConstants.DecoderType.UpcA },
  { id: 'upcE', label: 'UPC-E', decoder: BarkoderConstants.DecoderType.UpcE },
  { id: 'upcE1', label: 'UPC-E1', decoder: BarkoderConstants.DecoderType.UpcE1 },
];

export const BARCODE_TYPES_2D: BarcodeType[] = [
  { id: 'aztec', label: 'Aztec', decoder: BarkoderConstants.DecoderType.Aztec },
  { id: 'aztecCompact', label: 'Aztec Compact', decoder: BarkoderConstants.DecoderType.AztecCompact },
  { id: 'datamatrix', label: 'Datamatrix', decoder: BarkoderConstants.DecoderType.Datamatrix },
  { id: 'dotcode', label: 'Dotcode', decoder: BarkoderConstants.DecoderType.Dotcode },
  { id: 'idDocument', label: 'ID Document', decoder: BarkoderConstants.DecoderType.IDDocument },
  { id: 'maxiCode', label: 'MaxiCode', decoder: BarkoderConstants.DecoderType.MaxiCode },
  { id: 'ocrText', label: 'OCR Text', decoder: BarkoderConstants.DecoderType.OCRText },
  { id: 'pdf417', label: 'PDF 417', decoder: BarkoderConstants.DecoderType.PDF417 },
  { id: 'pdf417Micro', label: 'PDF 417 Micro', decoder: BarkoderConstants.DecoderType.PDF417Micro },
  { id: 'qr', label: 'QR', decoder: BarkoderConstants.DecoderType.QR },
  { id: 'qrMicro', label: 'QR Micro', decoder: BarkoderConstants.DecoderType.QRMicro },
];

export const MODES = {
  MODE_1D: 'mode_1d',
  MODE_2D: 'mode_2d',
  CONTINUOUS: 'continuous',
  MULTISCAN: 'multiscan',
  VIN: 'vin',
  DPM: 'dpm',
  DEBLUR: 'deblur',
  DOTCODE: 'dotcode',
  AR_MODE: 'ar_mode',
  MRZ: 'mrz',
  GALLERY: 'gallery',
  ANYSCAN: 'v1',
} as const;

export const SECTIONS: HomeSection[] = [
  {
    title: 'General Barcodes',
    data: [
      { id: '1d', label: '1D', icon: icon('icon_1d'), mode: MODES.MODE_1D },
      { id: '2d', label: '2D', icon: icon('icon_2d'), mode: MODES.MODE_2D },
      { id: 'continuous', label: 'Continuous', icon: icon('icon_continuous'), mode: MODES.CONTINUOUS },
    ],
  },
  {
    title: 'Showcase',
    data: [
      { id: 'multiscan', label: 'MultiScan', icon: icon('icon_multiscan'), mode: MODES.MULTISCAN },
      { id: 'vin', label: 'VIN', icon: icon('icon_vin'), mode: MODES.VIN },
      { id: 'dpm', label: 'DPM', icon: icon('icon_dpm'), mode: MODES.DPM },
      { id: 'deblur', label: 'DeBlur', icon: icon('icon_blur'), mode: MODES.DEBLUR },
      { id: 'dotcode', label: 'DotCode', icon: icon('icon_dotcode'), mode: MODES.DOTCODE },
      { id: 'ar_mode', label: 'AR Mode', icon: icon('icon_ar'), mode: MODES.AR_MODE },
      { id: 'mrz', label: 'MRZ', icon: icon('icon_mrz'), mode: MODES.MRZ },
      { id: 'gallery', label: 'Gallery Scan', icon: icon('icon_gallery'), action: 'gallery' },
    ],
  },
];

export const ALL_BARCODE_TYPES = [...BARCODE_TYPES_1D, ...BARCODE_TYPES_2D];
