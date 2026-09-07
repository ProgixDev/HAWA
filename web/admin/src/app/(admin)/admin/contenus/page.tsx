import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function ContentPage() {
  redirect(ADMIN_ROUTES.content.articles);
}
