import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function HijriPage() {
  redirect(ADMIN_ROUTES.spiritual.hijri);
}
