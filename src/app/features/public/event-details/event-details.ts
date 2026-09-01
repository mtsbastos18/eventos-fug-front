import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxMaskDirective } from 'ngx-mask';
import { EventService } from '../../../core/services/event';
import { EventModel } from '../../../shared/models/event';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { environment } from '../../../../environments/environment';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { TenantService } from '../../../core/services/tenant';

@Component({
  selector: 'app-event-details',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    RouterLink,
    NgxMaskDirective,
    SafeHtmlPipe,
  ],
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private tenantService = inject(TenantService);

  get tenantSlug(): string {
    return this.tenantService.currentTenant()?.slug ?? '';
  }

  event: EventModel | null = null;
  isLoading = true;
  error = '';
  storageUrl = environment.storageUrl;

  registrationForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
    company: ['', [Validators.required]],
    position: ['', [Validators.required]],
    city: ['', [Validators.required]],
    additional_info: ['', [Validators.maxLength(300)]],
  });

  verifyForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  isSubmitting = false;
  isVerifying = false;
  registrationStep: 'form' | 'verification' | 'confirmation' = 'form';
  registeredEmail = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadEventDetails(idParam);
    } else {
      this.error = 'ID do evento não fornecido.';
      this.isLoading = false;
    }
  }

  loadEventDetails(id: string) {
    this.isLoading = true;
    this.eventService.getPublicEventById(id).subscribe({
      next: (data) => {
        this.event = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Não foi possível carregar os detalhes do evento.';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  get isSoldOut(): boolean {
    if (!this.event) return false;
    return (this.event.participants_count || 0) >= this.event.capacity;
  }

  onSubmit() {
    if (this.registrationForm.invalid || !this.event) return;

    this.isSubmitting = true;

    // Converte os dados do formulário para bater com o esperado pela API
    const formData = this.registrationForm.value;
    const participantData = {
      name: formData.name,
      email: formData.email,
      document: formData.cpf, // cpf renomeado para document
      phone: formData.phone,
      event_id: this.event.id,
      company: formData.company,
      position: formData.position,
      city: formData.city,
      additional_info: formData.additional_info,
    };

    this.eventService.registerParticipant(participantData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.registeredEmail = participantData.email;
        this.registrationStep = 'confirmation';

        this.registrationForm.reset();
      },
      error: (err) => {
        console.log('Erro na inscrição:', err);
        this.isSubmitting = false;
        this.toastr.error(
          err.error?.message || 'Erro ao realizar pré-inscrição. Tente novamente.',
          'Erro',
        );
      },
    });
  }

  onVerify() {
    if (this.verifyForm.invalid || !this.event) return;

    this.isVerifying = true;
    const verifyData = {
      email: this.registeredEmail,
      event_id: this.event.id,
      code: this.verifyForm.value.code,
    };

    this.eventService.verifyParticipant(verifyData).subscribe({
      next: () => {
        this.isVerifying = false;
        this.toastr.success('Sua inscrição foi confirmada com sucesso!', 'Inscrição Confirmada', {
          timeOut: 10000,
        });
        this.registrationStep = 'form';
        this.registrationForm.reset();
        this.verifyForm.reset();

        // Atualiza a contagem localmente após confirmar
        if (this.event) {
          this.event.participants_count = (this.event.participants_count || 0) + 1;
        }
      },
      error: (err) => {
        this.isVerifying = false;
        this.toastr.error(
          err.error?.message || 'Código inválido ou expirado.',
          'Erro na Verificação',
        );
      },
    });
  }

  // Crie uma função para limpar o HTML
  cleanDescription(html: string) {
    if (!html) return '';
    // Substitui todos os non-breaking spaces por espaços normais, quebras de linha por <br> e parágrafos vazios por <p><br></p>
    return html
      .replace(/&nbsp;/g, ' ')
      .replace(/\n/g, '<br>')
      .replace(/<p[^>]*><\/p>/g, '<p><br></p>');
  }
}
