import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function DashboardPage() {
  redirect(ADMIN_ROUTES.dashboard);
}
