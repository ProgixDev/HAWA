import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function RootPage() {
  redirect(ADMIN_ROUTES.login);
}
