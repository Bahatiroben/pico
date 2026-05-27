import type { models } from '../wailsjs/go/models';

export type ViewTab = 'table' | 'query';
export type Theme = 'dark' | 'light';

export interface TreeNode {
  schema: string;
  tables: models.Table[];
  isOpen: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}
