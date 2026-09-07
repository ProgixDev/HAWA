import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function NotificationsPage() {
  redirect(ADMIN_ROUTES.notifications.new);
}
