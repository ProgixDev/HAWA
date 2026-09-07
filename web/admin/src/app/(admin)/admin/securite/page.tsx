import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function SecurityPage() {
  redirect(ADMIN_ROUTES.security.admins);
}
