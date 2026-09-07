import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function ReligiousArticlesPage() {
  redirect(ADMIN_ROUTES.spiritual.articles);
}
