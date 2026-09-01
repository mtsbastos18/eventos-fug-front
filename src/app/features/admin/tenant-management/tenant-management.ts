import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { TenantAdminService } from '../../../core/services/tenant-admin';
import { Tenant } from '../../../shared/models/tenant';
import { TenantFormModalComponent } from '../tenant-form-modal/tenant-form-modal';

@Component({
  selector: 'app-tenant-management',
  imports: [CommonModule, TenantFormModalComponent],
  templateUrl: './tenant-management.html',
})
export class TenantManagementComponent implements OnInit {
  private tenantAdminService = inject(TenantAdminService);
  private toastr = inject(ToastrService);

  tenants: Tenant[] = [];
  isLoading = false;

  showModal = false;
  tenantToEdit: Tenant | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.tenantAdminService.getTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  openCreate(): void {
    this.tenantToEdit = null;
    this.showModal = true;
  }

  openEdit(tenant: Tenant): void {
    this.tenantToEdit = tenant;
    this.showModal = true;
  }

  onSaved(): void {
    this.showModal = false;
    this.load();
  }

  onClosed(): void {
    this.showModal = false;
  }

  remove(tenant: Tenant): void {
    if (!confirm(`Excluir o cliente "${tenant.name}"? Esta ação não pode ser desfeita.`)) return;

    this.tenantAdminService.deleteTenant(tenant.id).subscribe({
      next: () => {
        this.toastr.success('Cliente excluído.', 'Sucesso');
        this.load();
      },
      error: () => {
        this.toastr.error('Erro ao excluir cliente.', 'Erro');
      },
    });
  }
}
