import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEY = '@inferra/openai-files';

export type FileRecord = {
  fileId: string;
  filename: string;
  chatId: string;
  provider: string;
  purpose: string;
  bytes: number;
  uploadedAt: number;
};

type StoreData = Record<string, FileRecord[]>;

class OpenAIFileStoreClass {
  private cache: StoreData | null = null;

  private async load(): Promise<StoreData> {
    if (this.cache) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      this.cache = raw ? JSON.parse(raw) : {};
    } catch {
      this.cache = {};
    }
    return this.cache!;
  }

  private async persist(): Promise<void> {
    if (!this.cache) return;
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(this.cache));
  }

  async save(record: FileRecord): Promise<void> {
    const data = await this.load();
    if (!data[record.chatId]) {
      data[record.chatId] = [];
    }
    data[record.chatId].push(record);
    await this.persist();
  }

  async getByChat(chatId: string): Promise<FileRecord[]> {
    const data = await this.load();
    return data[chatId] || [];
  }

  async getByFileId(fileId: string): Promise<FileRecord | null> {
    const data = await this.load();
    for (const records of Object.values(data)) {
      const found = records.find(r => r.fileId === fileId);
      if (found) return found;
    }
    return null;
  }

  async removeByFileId(fileId: string): Promise<void> {
    const data = await this.load();
    for (const chatId of Object.keys(data)) {
      data[chatId] = data[chatId].filter(r => r.fileId !== fileId);
      if (data[chatId].length === 0) {
        delete data[chatId];
      }
    }
    await this.persist();
  }

  async removeByChat(chatId: string): Promise<string[]> {
    const data = await this.load();
    const records = data[chatId] || [];
    const fileIds = records.map(r => r.fileId);
    delete data[chatId];
    await this.persist();
    return fileIds;
  }

  async getAllFileIds(): Promise<string[]> {
    const data = await this.load();
    const ids: string[] = [];
    for (const records of Object.values(data)) {
      ids.push(...records.map(r => r.fileId));
    }
    return ids;
  }
}

export const openAIFileStore = new OpenAIFileStoreClass();
