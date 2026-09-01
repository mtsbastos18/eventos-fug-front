import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { TenantService } from '../../../core/services/tenant';

@Component({
  selector: 'app-no-tenant',
  imports: [CommonModule],
  templateUrl: './no-tenant.html',
})
export class NoTenantComponent {
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.tenantService.clear();
    this.router.navigate(['/login']);
  }
}
