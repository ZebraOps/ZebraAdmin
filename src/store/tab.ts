import { create } from 'zustand';
import { localStg } from '@/utils/storage';

export interface TabItem {
  id: string;
  label: string;
  routeKey: string;
  fullPath: string;
  icon?: string;
  fixed?: boolean;
}

interface TabState {
  tabs: TabItem[];
  activeTabId: string;

  addTab: (tab: Omit<TabItem, 'id'> & { id?: string }) => void;
  removeTab: (tabId: string) => void;
  removeActiveTab: () => void;
  setActiveTabId: (id: string) => void;
  clearTabs: (excludes?: string[]) => void;
  clearLeftTabs: (tabId: string) => void;
  clearRightTabs: (tabId: string) => void;
  cacheTabs: () => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: '',

  addTab: (tabData) => {
    const id = tabData.id || tabData.fullPath;
    const tab: TabItem = { ...tabData, id };

    set(state => {
      const exists = state.tabs.some(t => t.id === id);
      if (exists) {
        return { activeTabId: id };
      }
      return { tabs: [...state.tabs, tab], activeTabId: id };
    });
  },

  removeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    const newTabs = tabs.filter(t => t.id !== tabId);
    let newActiveId = activeTabId;

    if (activeTabId === tabId) {
      const next = tabs[idx + 1] || tabs[idx - 1];
      newActiveId = next?.id || '';
    }

    set({ tabs: newTabs, activeTabId: newActiveId });

    // Navigate if active tab was removed
    if (activeTabId === tabId && newActiveId) {
      const nextTab = newTabs.find(t => t.id === newActiveId);
      if (nextTab) {
        window.history.pushState({}, '', nextTab.fullPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  },

  removeActiveTab: () => {
    get().removeTab(get().activeTabId);
  },

  setActiveTabId: (id) => {
    set({ activeTabId: id });
  },

  clearTabs: (excludes = []) => {
    const { tabs } = get();
    const fixedIds = tabs.filter(t => t.fixed).map(t => t.id);
    const keepIds = new Set([...fixedIds, ...excludes]);
    const newTabs = tabs.filter(t => keepIds.has(t.id));

    const { activeTabId } = get();
    const isActiveRemoved = !keepIds.has(activeTabId);
    const newActiveId = isActiveRemoved
      ? (newTabs[newTabs.length - 1]?.id || '')
      : activeTabId;

    set({ tabs: newTabs, activeTabId: newActiveId });
  },

  clearLeftTabs: (tabId) => {
    const { tabs } = get();
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;
    const keepIds = tabs.slice(idx).map(t => t.id);
    get().clearTabs(keepIds);
  },

  clearRightTabs: (tabId) => {
    const { tabs } = get();
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;
    const keepIds = tabs.slice(0, idx + 1).map(t => t.id);
    get().clearTabs(keepIds);
  },

  cacheTabs: () => {
    localStg.set('globalTabs', get().tabs);
  }
}));

// Cache tabs on page close
window.addEventListener('beforeunload', () => {
  useTabStore.getState().cacheTabs();
});
