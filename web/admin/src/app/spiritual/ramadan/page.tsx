import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function RamadanPage() {
  redirect(ADMIN_ROUTES.spiritual.ramadan);
}
