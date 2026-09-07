export const CURRENT_ADMIN = {
  id: 'admin-demo',
  name: 'Admin',
  email: 'awa@admin.com',
  role: 'super_admin',
  roleLabel: 'Super Admin',
  avatarInitials: 'A',
} as const;

export const ADMIN_DEMO_CREDENTIALS = {
  email: CURRENT_ADMIN.email,
  password: 'admin123',
} as const;
