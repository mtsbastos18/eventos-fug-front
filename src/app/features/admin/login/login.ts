import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth';
import { TenantService } from '../../../core/services/tenant';
import { TenantThemeService } from '../../../core/services/tenant-theme';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private theme = inject(TenantThemeService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = false;

  ngOnInit(): void {
    // A tela de login é da plataforma, não de um cliente — nunca mostra
    // branding de um tenant visitado anteriormente na mesma sessão (SDD 1.2).
    this.tenantService.currentTenant.set(null);
    this.theme.reset();
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toastr.success('Login bem-sucedido!', 'Bem-vindo');
        this.routeAfterLogin(res.tenants ?? []);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error(err.error?.message || 'E-mail ou senha inválidos.', 'Erro no Login');
      },
    });
  }

  private routeAfterLogin(tenants: { id: number }[]): void {
    if (tenants.length === 0) {
      this.router.navigate(['/admin/sem-cliente']);
      return;
    }

    if (tenants.length === 1) {
      this.tenantService.switchTenant(tenants[0].id).subscribe({
        next: () => this.router.navigate(['/admin/dashboard']),
        error: () => this.toastr.error('Não foi possível entrar no cliente.', 'Erro'),
      });
      return;
    }

    this.router.navigate(['/admin/select-tenant']);
  }
}
