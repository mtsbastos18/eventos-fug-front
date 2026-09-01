export interface TenantColors {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
}

/** Resposta pública de GET /t/{slug}/branding — só campos de apresentação. */
export interface Branding {
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  site_url: string | null;
  colors: TenantColors;
}

/** Registro completo de tenant, usado no admin (CRUD em /admin/tenants). */
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  legal_name: string | null;
  logo_path: string | null;
  favicon_path: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  surface_color: string;
  mail_from_name: string | null;
  mail_reply_to: string | null;
  certificate_prefix: string;
  site_url: string | null;
  custom_domain: string | null;
  status: 'active' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

export type TenantRole = 'master' | 'owner' | 'staff' | 'viewer';

/** Item da lista `tenants` devolvida por /auth/login e /admin/my-tenants. */
export interface TenantMembership {
  id: number;
  name: string;
  slug: string;
  status?: 'active' | 'suspended';
  role: TenantRole;
}

export interface TenantUserSummary {
  id: number;
  name: string;
  email: string;
  role: TenantRole;
}
