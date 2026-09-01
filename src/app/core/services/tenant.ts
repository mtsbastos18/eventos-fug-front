import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Branding, Tenant, TenantMembership } from '../../shared/models/tenant';
import { AuthService } from './auth';
import { TenantThemeService } from './tenant-theme';

interface SwitchTenantResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  tenant: Tenant;
}

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private authService = inject(AuthService);
  private theme = inject(TenantThemeService);

  /** Tenant ativo — Branding (páginas públicas) ou Tenant completo (admin, após switch). */
  readonly currentTenant = signal<Branding | Tenant | null>(this.readCachedTenant());

  /** Clientes aos quais o usuário logado tem acesso (preenchido no login/my-tenants). */
  readonly availableTenants = signal<TenantMembership[]>(this.readCachedMemberships());

  /** Dados públicos de apresentação de um tenant, pelo slug — sem autenticação. */
  getBranding(slug: string): Observable<Branding> {
    return this.http.get<Branding>(`${this.apiUrl}/t/${slug}/branding`);
  }

  /** Recarrega a lista de clientes do usuário logado (todos, se master). */
  loadMyTenants(): Observable<TenantMembership[]> {
    return this.http.get<TenantMembership[]>(`${this.apiUrl}/admin/my-tenants`).pipe(
      tap((tenants) => {
        this.availableTenants.set(tenants);
        localStorage.setItem('tenants', JSON.stringify(tenants));
      }),
    );
  }

  /**
   * Troca o tenant ativo: pede um token novo com o claim atualizado, aplica o
   * tema e recarrega a página — mais simples e robusto que propagar um evento
   * de refresh por cada componente que já tem dados carregados.
   */
  switchTenant(tenantId: number): Observable<SwitchTenantResponse> {
    return this.http.post<SwitchTenantResponse>(`${this.apiUrl}/admin/switch-tenant/${tenantId}`, {}).pipe(
      tap((res) => {
        this.authService.setToken(res.access_token);
        this.setCurrentTenant(res.tenant);
      }),
    );
  }

  setCurrentTenant(tenant: Branding | Tenant): void {
    this.currentTenant.set(tenant);
    localStorage.setItem('tenant', JSON.stringify(tenant));
    this.theme.apply(tenant);
  }

  reload(): void {
    window.location.reload();
  }

  clear(): void {
    this.currentTenant.set(null);
    this.availableTenants.set([]);
    localStorage.removeItem('tenant');
    localStorage.removeItem('tenants');
  }

  private readCachedTenant(): Branding | Tenant | null {
    const raw = localStorage.getItem('tenant');
    return raw ? JSON.parse(raw) : null;
  }

  private readCachedMemberships(): TenantMembership[] {
    const raw = localStorage.getItem('tenants');
    return raw ? JSON.parse(raw) : [];
  }
}
