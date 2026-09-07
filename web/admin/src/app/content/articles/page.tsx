import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function ArticlesPage() {
  redirect(ADMIN_ROUTES.content.articles);
}
