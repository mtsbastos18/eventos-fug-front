import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Branding, Tenant } from '../../shared/models/tenant';

@Injectable({
  providedIn: 'root',
})
export class TenantThemeService {
  private title = inject(Title);

  /**
   * Aplica logo/cores/título/favicon do tenant ativo em runtime. Chamado pelo
   * tenantResolver (páginas públicas) e depois de login/switch-tenant (admin).
   */
  apply(branding: Branding | Tenant): void {
    const root = document.documentElement.style;
    const colors = this.colorsOf(branding);

    root.setProperty('--primary-dark', colors.primary);
    root.setProperty('--primary-bright', colors.secondary);
    root.setProperty('--primary-medium', colors.accent);
    root.setProperty('--surface-light', colors.surface);

    this.title.setTitle(`Eventos ${branding.name}`);
    this.setFavicon(branding.favicon_url ?? branding.logo_url ?? undefined);
  }

  /** Restaura o título/tema padrão da plataforma (raiz, login, "cliente não encontrado"). */
  reset(): void {
    const root = document.documentElement.style;

    root.removeProperty('--primary-dark');
    root.removeProperty('--primary-bright');
    root.removeProperty('--primary-medium');
    root.removeProperty('--surface-light');

    this.title.setTitle('Storia Eventos');
    this.setFavicon(undefined);
  }

  private colorsOf(branding: Branding | Tenant) {
    if ('colors' in branding) {
      return branding.colors;
    }

    return {
      primary: branding.primary_color,
      secondary: branding.secondary_color,
      accent: branding.accent_color,
      surface: branding.surface_color,
    };
  }

  private setFavicon(url?: string): void {
    const href = url ?? 'logo.png';
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = href;
  }
}
