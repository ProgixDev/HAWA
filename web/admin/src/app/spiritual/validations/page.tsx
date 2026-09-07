import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function SpiritualValidationsPage() {
  redirect(ADMIN_ROUTES.spiritual.validations);
}
