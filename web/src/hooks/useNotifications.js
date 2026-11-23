import { useSyncExternalStore } from "react";
import { notificationsSeed } from "../data/workspace.js";

// Tiny shared store so the header bell and the Notifications page stay in sync.
// Replace with API data (GET /notifications) later.
const state = { vendor: notificationsSeed.vendor, admin: notificationsSeed.admin };
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function useNotifications(role) {
  const items = useSyncExternalStore(subscribe, () => state[role] ?? EMPTY);
  return {
    items,
    unread: items.filter((n) => !n.read).length,
    markRead(id) { state[role] = items.map((n) => (n.id === id ? { ...n, read: true } : n)); emit(); },
    markAllRead() { state[role] = items.map((n) => ({ ...n, read: true })); emit(); }
  };
}
const EMPTY = [];
