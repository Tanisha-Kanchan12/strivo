import { NotificationsList } from "@/components/notifications/notifications-list";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-strivo-secondary">
          Streak updates, messages, connect requests, and more
        </p>
      </div>
      <NotificationsList />
    </div>
  );
}
