import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../../core/services/tenant';

@Component({
  selector: 'app-brand-logo',
  imports: [CommonModule],
  templateUrl: './brand-logo.html',
})
export class BrandLogoComponent {
  private tenantService = inject(TenantService);

  /** Classes Tailwind de altura repassadas pelo chamador (ex.: 'h-10'). */
  @Input() heightClass = 'h-10';

  get logoUrl(): string {
    return this.tenantService.currentTenant()?.logo_url ?? 'logo_.png';
  }

  get alt(): string {
    return this.tenantService.currentTenant()?.name ?? 'Storia Eventos';
  }
}
