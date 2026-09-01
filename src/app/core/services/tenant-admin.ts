import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tenant, TenantUserSummary } from '../../shared/models/tenant';

export interface InviteTenantUserPayload {
  name?: string;
  email?: string;
  user_id?: number;
  role: 'owner' | 'staff' | 'viewer';
}

@Injectable({
  providedIn: 'root',
})
export class TenantAdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.apiUrl}/admin/tenants`);
  }

  createTenant(payload: Partial<Tenant>): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.apiUrl}/admin/tenants`, payload);
  }

  updateTenant(id: number, payload: Partial<Tenant>): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/admin/tenants/${id}`, payload);
  }

  deleteTenant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/tenants/${id}`);
  }

  uploadLogo(id: number, file: File): Observable<Tenant> {
    const form = new FormData();
    form.append('logo', file);
    return this.http.post<Tenant>(`${this.apiUrl}/admin/tenants/${id}/logo`, form);
  }

  getTenantUsers(id: number): Observable<TenantUserSummary[]> {
    return this.http.get<TenantUserSummary[]>(`${this.apiUrl}/admin/tenants/${id}/users`);
  }

  inviteTenantUser(id: number, payload: InviteTenantUserPayload): Observable<TenantUserSummary & { generated_password?: string }> {
    return this.http.post<TenantUserSummary & { generated_password?: string }>(
      `${this.apiUrl}/admin/tenants/${id}/users`,
      payload,
    );
  }

  removeTenantUser(tenantId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/tenants/${tenantId}/users/${userId}`);
  }
}
