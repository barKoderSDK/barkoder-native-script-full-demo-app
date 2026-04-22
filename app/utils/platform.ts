import { ImageSource, Utils } from '@nativescript/core';
import { File, knownFolders } from '@nativescript/core/file-system';
import { device } from '@nativescript/core/platform';
import { shareText } from '@nativescript/social-share';
import { BARCODE_TYPES_1D } from '../constants';

export const normalizeBarcodeValue = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

export const is1DBarcodeType = (type: string) => {
  const normalized = normalizeBarcodeValue(type);
  return BARCODE_TYPES_1D.some(
    (item) => normalizeBarcodeValue(item.id) === normalized || normalizeBarcodeValue(item.label) === normalized,
  );
};

export const formatHistoryDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${`${date.getDate()}`.padStart(2, '0')}/${`${date.getMonth() + 1}`.padStart(2, '0')}/${date.getFullYear()}`;
};

export const parseMrzData = (text: string) => {
  const rows: Array<{ id: string; label: string; value: string }> = [];
  text.split('\n').forEach((line) => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      return;
    }

    const key = match[1].trim();
    rows.push({
      id: key,
      label: key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      value: match[2].trim(),
    });
  });
  return rows;
};

export const getMrzDisplayText = (text: string) => {
  const fields = parseMrzData(text);
  const name = fields.find((field) =>
    ['name', 'given name', 'given names', 'first name', 'forename'].some((key) =>
      `${field.id} ${field.label}`.toLowerCase().includes(key),
    ),
  );
  const surname = fields.find((field) =>
    ['surname', 'last name', 'family name'].some((key) => `${field.id} ${field.label}`.toLowerCase().includes(key)),
  );
  const values = [name?.value, surname?.value].filter(Boolean);
  return values.length > 0 ? values.join(' ') : 'Name/Surname not found';
};

export const copyToClipboard = async (text: string) => {
  Utils.copyToClipboard(text);
};

export const openExternalUrl = (url: string) => Utils.openUrl(url);

export const shareCsvText = async (csvContent: string) => {
  shareText(csvContent, 'Scanned Barcodes');
};

export const getDeviceId = () => device.uuid;

export const imageSourceToBase64 = (imageSource: ImageSource) => imageSource.toBase64String('jpg', 90);

export const fileFromLocalPath = (path: string) => File.fromPath(path.replace(/^file:\/\//, ''));

export const tempCsvFile = () => knownFolders.temp().getFile('scanned_barcodes.csv');
