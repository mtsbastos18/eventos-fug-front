import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Branding } from '../../shared/models/tenant';
import { TenantService } from '../services/tenant';

/**
 * Resolve o tenant pelo slug do path (/e/:tenantSlug/...) antes de renderizar
 * a página pública, e já aplica o tema — evita o flash das cores default.
 */
export const tenantResolver: ResolveFn<Branding | null> = (route) => {
  const tenantService = inject(TenantService);
  const router = inject(Router);
  const slug = route.paramMap.get('tenantSlug');

  if (!slug) {
    router.navigateByUrl('/');
    return of(null);
  }

  return tenantService.getBranding(slug).pipe(
    map((branding) => {
      tenantService.setCurrentTenant(branding);
      return branding;
    }),
    catchError(() => {
      router.navigateByUrl('/cliente-nao-encontrado');
      return of(null);
    }),
  );
};
