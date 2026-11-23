import { Button, Card, Chip, EmptyState, Page, PageHeader } from "../components/ui.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNotifications } from "../hooks/useNotifications.js";

export function NotificationsPage() {
  const { role } = useAuth();
  const { items, unread, markRead, markAllRead } = useNotifications(role);
  return (
    <Page>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up."}
        actions={<Button variant="secondary" disabled={!unread} onClick={markAllRead}>Mark all as read</Button>}
      />
      <Card className="overflow-hidden">
        {items.map((n) => (
          <article key={n.id} className={`flex items-start gap-4 border-t border-line px-5 py-4 first:border-t-0 ${n.read ? "" : "bg-sunken/50"}`}>
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-accent"}`} aria-label={n.read ? "Read" : "Unread"} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[14px] font-semibold">{n.title}</h2>
                <Chip tone={n.tone}>{n.time}</Chip>
              </div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-mute">{n.body}</p>
            </div>
            {!n.read && <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>Mark read</Button>}
          </article>
        ))}
        {!items.length && <EmptyState title="No notifications">Updates about your work will appear here.</EmptyState>}
      </Card>
    </Page>
  );
}
