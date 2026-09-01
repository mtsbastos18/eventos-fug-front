import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { TenantService } from '../../../core/services/tenant';
import { TenantThemeService } from '../../../core/services/tenant-theme';
import { BrandLogoComponent } from '../brand-logo/brand-logo';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, BrandLogoComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  authService = inject(AuthService);
  tenantService = inject(TenantService);
  private theme = inject(TenantThemeService);
  router = inject(Router);

  get homeLink(): string {
    const tenant = this.tenantService.currentTenant();
    return tenant ? `/e/${tenant.slug}` : '/';
  }

  logout() {
    this.authService.logout();
    this.tenantService.clear();
    this.theme.reset();
    this.router.navigate(['/login']);
  }
}
