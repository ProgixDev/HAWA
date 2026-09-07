import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function PremiumPage() {
  redirect(ADMIN_ROUTES.content.premium);
}
