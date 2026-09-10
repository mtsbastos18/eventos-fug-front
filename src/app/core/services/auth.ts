import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user';
import { TenantMembership } from '../../shared/models/tenant';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface LoginResponse {
  access_token?: string;
  token?: string;
  user?: User;
  tenants?: TenantMembership[];
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/auth';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        // Verifica diferentes formatos comuns de retorno de API
        const token = res?.token || res?.access_token || (res as any)?.data?.token;
        const user = res?.user || (res as any)?.data?.user;

        if (token) {
          this.setToken(token);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
          if (res?.tenants) {
            localStorage.setItem('tenants', JSON.stringify(res.tenants));
          }
        } else {
          console.warn('Login bem-sucedido, mas o token não foi encontrado na resposta da API:', res);
        }
      }),
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem('tenants');
    this.currentUserSubject.next(null);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isMaster(): boolean {
    return !!this.currentUserSubject.value?.is_master;
  }

  setPassword(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/set-password`, payload);
  }
}
