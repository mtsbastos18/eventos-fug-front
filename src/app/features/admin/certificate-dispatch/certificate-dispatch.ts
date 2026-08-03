import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, interval } from 'rxjs';
import { EventService } from '../../../core/services/event';
import { CertificateService } from '../../../core/services/certificate';
import { EventModel } from '../../../shared/models/event';
import {
  CertificateDispatchItem,
  CertificateDispatchSummary,
} from '../../../shared/models/certificate';

@Component({
  selector: 'app-certificate-dispatch',
  imports: [CommonModule, RouterLink],
  templateUrl: './certificate-dispatch.html',
  styleUrl: './certificate-dispatch.css',
})
export class CertificateDispatchComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private certificateService = inject(CertificateService);
  private toastr = inject(ToastrService);

  eventId!: number;
  event: EventModel | null = null;

  isLoading = true;
  isPublished = false;
  isIssuing = false;
  isSendingAll = false;
  sendingParticipantId: number | null = null;
  downloadingCertificateId: number | null = null;

  summary: CertificateDispatchSummary = {
    checked_in: 0,
    issued: 0,
    sent: 0,
    failed: 0,
    downloaded: 0,
  };

  items: CertificateDispatchItem[] = [];
  currentPage = 1;
  lastPage = 1;

  private pollSubscription?: Subscription;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.eventId = +idParam;
    this.loadEvent();
    this.load();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (eventData) => (this.event = eventData),
    });
  }

  load(page = this.currentPage): void {
    this.isLoading = true;
    this.certificateService.getDispatchList(this.eventId, page).subscribe({
      next: (response) => {
        this.summary = response.summary;
        this.isPublished = response.template.is_published;
        this.items = response.items.data;
        this.currentPage = response.items.current_page;
        this.lastPage = response.items.last_page;
        this.isLoading = false;
        this.manageQueuePolling();
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Não foi possível carregar a lista de certificados.', 'Erro');
      },
    });
  }

  private manageQueuePolling(): void {
    const hasQueued = this.items.some((item) => item.certificate?.email_status === 'queued');

    if (hasQueued && !this.pollSubscription) {
      this.pollSubscription = interval(5000).subscribe(() => this.load());
    } else if (!hasQueued && this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.load(page);
  }

  issueCertificates(): void {
    if (!confirm(`Emitir certificados para os ${this.summary.checked_in} participantes com check-in?`)) {
      return;
    }

    this.isIssuing = true;
    this.certificateService.issueCertificates(this.eventId).subscribe({
      next: (res) => {
        this.isIssuing = false;
        this.toastr.success(`${res.issued} certificado(s) emitido(s).`, 'Sucesso');
        this.load();
      },
      error: () => {
        this.isIssuing = false;
        this.toastr.error('Erro ao emitir certificados.', 'Erro');
      },
    });
  }

  sendAllPending(): void {
    if (!confirm('Enviar e-mail de certificado para todos os pendentes/com falha?')) {
      return;
    }

    this.isSendingAll = true;
    this.certificateService.sendCertificateEmails(this.eventId).subscribe({
      next: (res) => {
        this.isSendingAll = false;
        this.toastr.success(`${res.queued} e-mail(s) enfileirado(s) para envio.`, 'Sucesso');
        this.load();
      },
      error: (err) => {
        this.isSendingAll = false;
        this.toastr.error(err?.error?.message || 'Erro ao enfileirar envio de e-mails.', 'Erro');
      },
    });
  }

  resendOne(item: CertificateDispatchItem): void {
    if (!item.certificate) return;

    this.sendingParticipantId = item.id;
    this.certificateService.sendCertificateEmails(this.eventId, [item.id]).subscribe({
      next: () => {
        this.sendingParticipantId = null;
        this.toastr.success('E-mail reenfileirado para envio.', 'Sucesso');
        this.load();
      },
      error: (err) => {
        this.sendingParticipantId = null;
        this.toastr.error(err?.error?.message || 'Erro ao reenviar e-mail.', 'Erro');
      },
    });
  }

  downloadOne(item: CertificateDispatchItem, certificateId: number): void {
    this.downloadingCertificateId = certificateId;
    this.certificateService.downloadCertificate(this.eventId, certificateId).subscribe({
      next: (blob) => {
        this.downloadingCertificateId = null;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado-${item.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingCertificateId = null;
        this.toastr.error('Erro ao baixar certificado.', 'Erro');
      },
    });
  }
}
