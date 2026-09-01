export interface User {
  id: number;
  name: string;
  email: string;
  is_master?: boolean;
  last_tenant_id?: number | null;
}
