import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function ConfigurationPage() {
  redirect(ADMIN_ROUTES.configuration.objectives);
}
