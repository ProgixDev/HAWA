import React from 'react';
import { notFound } from 'next/navigation';
import { getUserById, listUsers } from '@/services/users';
import UserDetailsContent from '@/app/admin/utilisatrices/[id]/components/UserDetailsContent';

export async function generateStaticParams() {
  const users = await listUsers();
  return users.map((user) => ({ id: user.id }));
}

export default async function UserDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; action?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const detail = await getUserById(id);
  if (!detail) notFound();

  return (
    <UserDetailsContent
      detail={detail}
      initialTab={query.tab}
      initialAction={query.action === 'edit' ? 'update' : query.action}
    />
  );
}
