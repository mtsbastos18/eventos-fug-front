import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-set-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './set-password.html',
})
export class SetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  form: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  });

  token = '';
  email = '';
  isSubmitting = false;
  linkIsValid = true;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.token = params.get('token') ?? '';
    this.email = params.get('email') ?? '';
    this.linkIsValid = !!this.token && !!this.email;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    if (this.form.value.password !== this.form.value.password_confirmation) {
      this.toastr.error('As senhas não coincidem.', 'Erro');
      return;
    }

    this.isSubmitting = true;

    this.authService
      .setPassword({
        token: this.token,
        email: this.email,
        password: this.form.value.password,
        password_confirmation: this.form.value.password_confirmation,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastr.success('Senha definida com sucesso! Faça login.', 'Sucesso');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toastr.error(err.error?.message || 'Link inválido ou expirado.', 'Erro');
        },
      });
  }
}
