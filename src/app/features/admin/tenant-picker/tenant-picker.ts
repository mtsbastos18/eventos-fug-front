import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth';
import { TenantService } from '../../../core/services/tenant';
import { TenantMembership } from '../../../shared/models/tenant';

@Component({
  selector: 'app-tenant-picker',
  imports: [CommonModule],
  templateUrl: './tenant-picker.html',
})
export class TenantPickerComponent implements OnInit {
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  switchingId: number | null = null;

  get tenants(): TenantMembership[] {
    return this.tenantService.availableTenants();
  }

  ngOnInit(): void {
    if (this.tenants.length === 0) {
      this.router.navigate(['/admin/sem-cliente']);
    }
  }

  select(tenantId: number): void {
    this.switchingId = tenantId;

    this.tenantService.switchTenant(tenantId).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: () => {
        this.switchingId = null;
        this.toastr.error('Não foi possível entrar no cliente.', 'Erro');
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.tenantService.clear();
    this.router.navigate(['/login']);
  }
}
