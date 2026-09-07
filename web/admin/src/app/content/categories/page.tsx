import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function CategoriesPage() {
  redirect(ADMIN_ROUTES.content.categories);
}
