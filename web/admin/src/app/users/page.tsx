import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function UsersPage() {
  redirect(ADMIN_ROUTES.users);
}
