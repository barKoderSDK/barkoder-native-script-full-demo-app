import { ImageSource } from '@nativescript/core';
import { File, Folder, knownFolders } from '@nativescript/core/file-system';
import { HistoryItem, ScannedItem } from '../types';

const historyFile = knownFolders.documents().getFile('scan_history.json');
const imagesFolder = knownFolders.documents().getFolder('scan_images');

const readHistory = async (): Promise<HistoryItem[]> => {
  try {
    if (!File.exists(historyFile.path)) {
      return [];
    }

    const content = await historyFile.readText();
    return content ? JSON.parse(content) : [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
};

const writeHistory = async (items: HistoryItem[]) => {
  try {
    await historyFile.writeText(JSON.stringify(items));
  } catch (error) {
    console.error('Error writing history:', error);
    throw error;
  }
};

const saveImage = async (image?: string | ImageSource) => {
  if (!image) {
    return undefined;
  }

  if (typeof image === 'string') {
    if (image.startsWith('file://')) {
      return image;
    }
    if (image.startsWith('/')) {
      return `file://${image}`;
    }
    return image;
  }

  try {
    const file = imagesFolder.getFile(`scan_${Date.now()}.jpg`);
    await image.saveToFileAsync(file.path, 'jpg');
    return `file://${file.path}`;
  } catch (error) {
    console.error('Error saving scan image:', error);
    return undefined;
  }
};

const deleteImages = async (folder: Folder) => {
  const entities = await folder.getEntities();
  await Promise.all(
    entities.map(async (entity) => {
      try {
        await entity.remove();
      } catch (error) {
        console.error('Error deleting history asset:', error);
      }
    }),
  );
};

export const HistoryService = {
  async getHistory(): Promise<HistoryItem[]> {
    return readHistory();
  },

  async addScan(item: Omit<ScannedItem, 'image'> & { image?: string | ImageSource }): Promise<HistoryItem> {
    try {
      const imagePath = await saveImage(item.image);
      const history = await readHistory();
      const existingIndex = history.findIndex((entry) => entry.text === item.text && entry.type === item.type);

      let storedItem: HistoryItem;

      if (existingIndex >= 0) {
        const existing = history[existingIndex];
        storedItem = {
          ...existing,
          timestamp: Date.now(),
          count: existing.count + 1,
          image: imagePath || existing.image,
        };
        history.splice(existingIndex, 1);
        history.unshift(storedItem);
      } else {
        storedItem = {
          text: item.text,
          type: item.type,
          image: imagePath,
          timestamp: Date.now(),
          count: 1,
        };
        history.unshift(storedItem);
      }

      await writeHistory(history);
      return storedItem;
    } catch (error) {
      console.error('Error storing scan history entry:', error);
      return {
        text: item.text,
        type: item.type,
        image: undefined,
        timestamp: Date.now(),
        count: 1,
      };
    }
  },

  async clearHistory() {
    try {
      await deleteImages(imagesFolder);
      if (File.exists(historyFile.path)) {
        await historyFile.remove();
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },
};
