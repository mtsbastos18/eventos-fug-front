import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { CertificateService } from '../../../core/services/certificate';
import { PublicCertificateInfo } from '../../../shared/models/certificate';

type ViewState = 'loading' | 'ready' | 'not-found';

@Component({
  selector: 'app-public-certificate',
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective, NavbarComponent],
  templateUrl: './public-certificate.html',
  styleUrl: './public-certificate.css',
})
export class PublicCertificateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private certificateService = inject(CertificateService);
  private fb = inject(FormBuilder);

  token = '';
  state: ViewState = 'loading';
  info: PublicCertificateInfo | null = null;
  isDownloading = false;
  errorMessage = '';

  documentForm: FormGroup = this.fb.group({
    document: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state = 'not-found';
      return;
    }

    this.token = token;
    this.certificateService.getPublicCertificate(token).subscribe({
      next: (info) => {
        this.info = info;
        this.state = 'ready';
      },
      error: () => {
        this.state = 'not-found';
      },
    });
  }

  onSubmit(): void {
    if (this.documentForm.invalid || this.isDownloading) return;

    this.isDownloading = true;
    this.errorMessage = '';

    this.certificateService
      .downloadPublicCertificate(this.token, this.documentForm.value.document)
      .subscribe({
        next: (blob) => {
          this.isDownloading = false;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'certificado.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.isDownloading = false;

          if (err.status === 429) {
            this.errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
          } else if (err.status === 422) {
            this.errorMessage = 'Os dígitos informados não conferem. Tente novamente.';
          } else {
            this.errorMessage = 'Não foi possível baixar o certificado. Tente novamente mais tarde.';
          }
        },
      });
  }
}
