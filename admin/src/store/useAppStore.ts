import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface AppState {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  unreadCount: number;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: false,
  sidebarCollapsed: false,
  notifications: [],
  unreadCount: 0,

  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.darkMode;
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', newDarkMode);
      localStorage.setItem('darkMode', newDarkMode.toString());
    }
    return { darkMode: newDarkMode };
  }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  addNotification: (notification) => set((state) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      read: false,
    };
    return {
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
