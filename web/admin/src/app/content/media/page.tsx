import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function MediaPage() {
  redirect(ADMIN_ROUTES.content.media);
}
