import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function NifasPage() {
  redirect(ADMIN_ROUTES.spiritual.nifas);
}
