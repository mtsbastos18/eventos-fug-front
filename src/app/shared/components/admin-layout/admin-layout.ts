import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { TenantService } from '../../../core/services/tenant';
import { TenantThemeService } from '../../../core/services/tenant-theme';
import { BrandLogoComponent } from '../brand-logo/brand-logo';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, BrandLogoComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  tenantService = inject(TenantService);
  private theme = inject(TenantThemeService);
  private router = inject(Router);

  mobileOpen = false;
  tenantMenuOpen = false;
  switching = false;

  get isMaster(): boolean {
    return this.authService.isMaster();
  }

  switchTenant(tenantId: number): void {
    if (this.switching) return;

    const current = this.tenantService.currentTenant();
    if (current && 'id' in current && current.id === tenantId) {
      this.tenantMenuOpen = false;
      return;
    }

    this.switching = true;
    this.tenantService.switchTenant(tenantId).subscribe({
      next: () => this.tenantService.reload(),
      error: () => {
        this.switching = false;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.tenantService.clear();
    this.theme.reset();
    this.router.navigate(['/login']);
  }
}
