import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TenantAdminService } from '../../../core/services/tenant-admin';
import { Tenant, TenantUserSummary } from '../../../shared/models/tenant';

@Component({
  selector: 'app-tenant-form-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tenant-form-modal.html',
  styleUrl: './tenant-form-modal.css',
})
export class TenantFormModalComponent implements OnChanges {
  private tenantAdminService = inject(TenantAdminService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  @Input() show = false;
  @Input() tenantToEdit: Tenant | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isSubmitting = false;
  logoFile: File | null = null;

  users: TenantUserSummary[] = [];
  loadingUsers = false;

  inviteForm: FormGroup = this.fb.group({
    name: [''],
    email: ['', [Validators.email]],
    role: ['staff', Validators.required],
  });

  tenantForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    legal_name: [''],
    mail_from_name: [''],
    mail_reply_to: ['', Validators.email],
    certificate_prefix: [''],
    site_url: [''],
    status: ['active', Validators.required],
    primary_color: ['#7a3468'],
    secondary_color: ['#f0b429'],
    accent_color: ['#a94f84'],
    surface_color: ['#f6eef3'],
  });

  get isEditing(): boolean {
    return !!this.tenantToEdit;
  }

  get preview() {
    return this.tenantForm.value;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show) {
      this.resetForm();
      this.loadUsers();
    }
  }

  onNameInput(): void {
    if (this.isEditing) return;

    const name: string = this.tenantForm.value.name ?? '';
    const slug = name
      .normalize('NFD')
      .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    this.tenantForm.patchValue({ slug }, { emitEvent: false });
  }

  onLogoSelected(event: Event): void {
    this.logoFile = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  close(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.tenantForm.invalid) return;

    this.isSubmitting = true;
    const payload = this.tenantForm.value;

    const request = this.isEditing
      ? this.tenantAdminService.updateTenant(this.tenantToEdit!.id, payload)
      : this.tenantAdminService.createTenant(payload);

    request.subscribe({
      next: (tenant) => {
        if (this.logoFile) {
          this.tenantAdminService.uploadLogo(tenant.id, this.logoFile).subscribe();
        }
        this.isSubmitting = false;
        this.toastr.success(
          this.isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!',
          'Sucesso',
        );
        this.saved.emit();
      },
      error: () => {
        this.isSubmitting = false;
        this.toastr.error(this.isEditing ? 'Erro ao atualizar cliente.' : 'Erro ao criar cliente.', 'Erro');
      },
    });
  }

  private resetForm(): void {
    this.logoFile = null;

    if (this.tenantToEdit) {
      this.tenantForm.reset({
        name: this.tenantToEdit.name,
        slug: this.tenantToEdit.slug,
        legal_name: this.tenantToEdit.legal_name ?? '',
        mail_from_name: this.tenantToEdit.mail_from_name ?? '',
        mail_reply_to: this.tenantToEdit.mail_reply_to ?? '',
        certificate_prefix: this.tenantToEdit.certificate_prefix ?? '',
        site_url: this.tenantToEdit.site_url ?? '',
        status: this.tenantToEdit.status,
        primary_color: this.tenantToEdit.primary_color,
        secondary_color: this.tenantToEdit.secondary_color,
        accent_color: this.tenantToEdit.accent_color,
        surface_color: this.tenantToEdit.surface_color,
      });
    } else {
      this.tenantForm.reset({
        status: 'active',
        primary_color: '#7a3468',
        secondary_color: '#f0b429',
        accent_color: '#a94f84',
        surface_color: '#f6eef3',
      });
    }
  }

  private loadUsers(): void {
    this.users = [];
    if (!this.isEditing) return;

    this.loadingUsers = true;
    this.tenantAdminService.getTenantUsers(this.tenantToEdit!.id).subscribe({
      next: (users) => {
        this.users = users;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
      },
    });
  }

  invite(): void {
    if (this.inviteForm.invalid || !this.tenantToEdit) return;

    const { name, email, role } = this.inviteForm.value;

    this.tenantAdminService
      .inviteTenantUser(this.tenantToEdit.id, { name, email, role: role as 'owner' | 'staff' | 'viewer' })
      .subscribe({
        next: (user) => {
          this.users = [...this.users, user];
          this.inviteForm.reset({ role: 'staff' });
          this.toastr.success(
            user.invited
              ? 'Convite enviado por e-mail — o usuário vai definir a própria senha.'
              : 'Usuário vinculado ao cliente.',
            'Sucesso',
          );
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Erro ao convidar usuário.', 'Erro');
        },
      });
  }

  removeUser(userId: number): void {
    if (!this.tenantToEdit) return;

    this.tenantAdminService.removeTenantUser(this.tenantToEdit.id, userId).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== userId);
      },
      error: () => {
        this.toastr.error('Erro ao remover usuário.', 'Erro');
      },
    });
  }
}
