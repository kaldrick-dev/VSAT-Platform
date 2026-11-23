import { useEffect, useSyncExternalStore } from "react";
import { api, auth } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";

// Tiny shared store so the header bell and the Notifications page stay in sync.
let items = [];
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

const load = () =>
  api.notifications()
    .then(({ data }) => { items = data.map((n) => ({ ...n, time: formatDateTime(n.createdAt), tone: "info" })); emit(); })
    .catch(() => { items = []; emit(); });

export function useNotifications() {
  const list = useSyncExternalStore(subscribe, () => items);

  useEffect(() => { if (auth.get()) load(); }, []);

  return {
    items: list,
    unread: list.filter((n) => !n.read).length,
    markRead(id) {
      items = list.map((n) => (n.id === id ? { ...n, read: true } : n));
      emit();
      api.markNotificationRead(id).catch(load);
    },
    markAllRead() {
      items = list.map((n) => ({ ...n, read: true }));
      emit();
      api.markAllNotificationsRead().catch(load);
    }
  };
}
