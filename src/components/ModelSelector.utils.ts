import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ProviderType } from '../services/ModelManagementService';
import { StoredModel, MLXGroup } from './ModelSelector.types';

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B ', 'KB ', 'MB ', 'GB '];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const getDisplayName = (filename: string) => {
  return filename.split('.')[0];
};

export const getModelNameFromPath = (path: string | null, models: StoredModel[]): string => {
  if (!path) return 'Select a Model';
  
  if (path === 'gemini') return 'Gemini';
  if (path === 'chatgpt') return 'ChatGPT';
  if (path === 'deepseek') return 'DeepSeek';
  if (path === 'claude') return 'Claude';
  if (path === 'apple-foundation') return 'Apple Foundation';
  
  const model = models.find(m => m.path === path);
  return model ? getDisplayName(model.name) : getDisplayName(path.split('/').pop() || '');
};

export const getProjectorNameFromPath = (path: string | null, models: StoredModel[]): string => {
  if (!path) return '';
  
  const model = models.find(m => m.path === path);
  return model ? getDisplayName(model.name) : getDisplayName(path.split('/').pop() || '');
};

const remoteProviders = new Set<ProviderType>(['gemini', 'chatgpt', 'deepseek', 'claude']);

const isRemoteProvider = (provider: string | null): boolean => {
  if (!provider) return false;
  return remoteProviders.has(provider as ProviderType);
};

const isAppleProvider = (provider: string | null): boolean => provider === 'apple-foundation';

export const getActiveModelIcon = (provider: string | null): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (!provider) return 'cube-outline';
  if (isAppleProvider(provider)) return 'apple';
  if (isRemoteProvider(provider)) return 'cloud';
  return 'cube';
};

export const getConnectionBadgeConfig = (provider: string | null, currentTheme: 'light' | 'dark') => {
  if (isRemoteProvider(provider)) {
    return {
      backgroundColor: 'rgba(74, 180, 96, 0.15)',
      textColor: '#2a8c42',
      label: 'REMOTE'
    };
  }
  if (isAppleProvider(provider)) {
    return {
      backgroundColor: 'rgba(74, 6, 96, 0.1)',
      textColor: currentTheme === 'dark' ? '#fff' : '#660880',
      label: 'APPLE'
    };
  }
  return {
    backgroundColor: 'rgba(74, 6, 96, 0.1)',
    textColor: currentTheme === 'dark' ? '#fff' : '#660880',
    label: 'LOCAL'
  };
};

export const isMLXModel = (model: StoredModel): boolean => {
  const path = model.path.toLowerCase();
  const name = model.name.toLowerCase();
  return path.includes('/models/mlx/') || 
         name.endsWith('.safetensors') || 
         name.includes('mlx-community') ||
         path.includes('mlx-community');
};

export const groupMLXModels = (items: StoredModel[]): (StoredModel | MLXGroup)[] => {
  const groups: { [key: string]: StoredModel[] } = {};
  const others: StoredModel[] = [];

  items.forEach(model => {
    const parts = model.name.split('_');
    const lower = model.name.toLowerCase();

    if (parts.length >= 2 && (parts[0].includes('/') || lower.includes('mlx'))) {
      const key = parts.slice(0, 2).join('_');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(model);
    } else {
      others.push(model);
    }
  });

  const grouped: (StoredModel | MLXGroup)[] = [];

  Object.entries(groups).forEach(([key, files]) => {
    if (files.length === 1) {
      grouped.push(files[0]);
      return;
    }

    const size = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const first = files[0];
    const name = key.replace(/_/g, '/');

    grouped.push({
      ...first,
      name,
      size,
      path: first.path,
      isMLXGroup: true,
      mlxFiles: files,
      groupKey: key,
    });
  });

  return [...grouped, ...others];
};
