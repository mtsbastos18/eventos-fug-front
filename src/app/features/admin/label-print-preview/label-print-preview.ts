import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../../../core/services/event';
import { Participant } from '../../../shared/models/participant';
import { LABEL_PRINT_JOB_STORAGE_KEY, LabelConfig } from '../../../shared/models/label-print';
import { QrCodeComponent } from '../../../shared/components/qr-code/qr-code';

type CheckinStatus = 'skipped' | 'pending' | 'done' | 'failed';

@Component({
  selector: 'app-label-print-preview',
  imports: [CommonModule, QrCodeComponent],
  templateUrl: './label-print-preview.html',
  styleUrl: './label-print-preview.css',
})
export class LabelPrintPreviewComponent implements OnInit {
  private eventService = inject(EventService);

  hasJob = false;
  eventTitle = '';
  participants: Participant[] = [];
  config: LabelConfig | null = null;

  isReady = false;
  checkinStatus: CheckinStatus = 'skipped';

  ngOnInit(): void {
    const raw = sessionStorage.getItem(LABEL_PRINT_JOB_STORAGE_KEY);
    if (!raw) {
      this.hasJob = false;
      return;
    }

    const job = JSON.parse(raw);
    this.hasJob = true;
    this.eventTitle = job.eventTitle;
    this.participants = job.participants;
    this.config = job.config;

    if (!this.config?.checkinOnPrint) {
      this.isReady = true;
      return;
    }

    const pendingIds = this.participants
      .filter((p) => !p.checked_in_at && p.id != null)
      .map((p) => p.id!);

    if (pendingIds.length === 0) {
      this.checkinStatus = 'skipped';
      this.isReady = true;
      return;
    }

    this.checkinStatus = 'pending';
    this.eventService.bulkCheckin(job.eventId, pendingIds).subscribe({
      next: (res) => {
        const doneIds = new Set(res.checked_in);
        this.participants = this.participants.map((p) =>
          p.id != null && doneIds.has(p.id) ? { ...p, checked_in_at: new Date().toISOString() } : p,
        );
        this.checkinStatus = 'done';
        this.isReady = true;
      },
      // Falha no check-in em lote não bloqueia a impressão — a etiqueta já existe
      // independente do check-in ter sido marcado ou não.
      error: () => {
        this.checkinStatus = 'failed';
        this.isReady = true;
      },
    });
  }

  get statusMessage(): string {
    if (!this.isReady) return 'Preparando etiquetas...';
    if (this.checkinStatus === 'failed') {
      return '⚠ Pronto — não foi possível confirmar o check-in automaticamente';
    }
    return '✓ Pronto — clique em Imprimir';
  }

  displayName(participant: Participant): string {
    if (this.config?.nameFormat === 'first') {
      return participant.name.split(' ')[0];
    }
    return participant.name;
  }

  print(): void {
    window.print();
  }

  close(): void {
    window.close();
  }
}
