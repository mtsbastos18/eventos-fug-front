import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Restringe rotas a usuários master (ex.: /admin/tenants). É só UX — a
 * autorização real é a policy 'manage-tenants' no backend.
 */
export const masterGuard: CanActivateFn = () => {
  const router = inject(Router);

  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;

  if (user?.is_master) {
    return true;
  }

  router.navigate(['/admin/dashboard']);
  return false;
};
