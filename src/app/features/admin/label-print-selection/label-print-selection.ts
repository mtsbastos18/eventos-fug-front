import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, switchMap } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { EventService } from '../../../core/services/event';
import { Participant } from '../../../shared/models/participant';
import { EventModel } from '../../../shared/models/event';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { QrCodeComponent } from '../../../shared/components/qr-code/qr-code';
import {
  DEFAULT_LABEL_CONFIG,
  LABEL_PRINT_CONFIG_STORAGE_KEY,
  LABEL_PRINT_JOB_STORAGE_KEY,
  LabelConfig,
  LabelPrintJob,
  loadLabelPrintConfig,
} from '../../../shared/models/label-print';

const EXAMPLE_PARTICIPANT: Participant = {
  event_id: 0,
  name: 'João Pedro da Silva Souza',
  email: 'joao@exemplo.com',
  document: '',
  phone: '',
  company: 'Empresa Exemplo',
  position: 'Analista',
  city: 'Belo Horizonte',
  checkin_token: 'exemplo-token',
};

@Component({
  selector: 'app-label-print-selection',
  imports: [CommonModule, FormsModule, NavbarComponent, RouterLink, QrCodeComponent],
  templateUrl: './label-print-selection.html',
  styleUrl: './label-print-selection.css',
})
export class LabelPrintSelectionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private toastr = inject(ToastrService);

  eventId!: number;
  event: EventModel | null = null;
  participants: Participant[] = [];
  totalParticipants = 0;
  isLoading = true;

  search = '';
  orderBy: 'name' | 'latest' = 'latest';
  currentPage = 1;
  lastPage = 1;

  // Mapeado por id (não só um Set de ids) porque a seleção precisa sobreviver
  // à troca de página — o payload de impressão usa os dados guardados aqui,
  // não a página atualmente carregada em `participants`.
  private selectedParticipants = new Map<number, Participant>();
  config: LabelConfig = { ...DEFAULT_LABEL_CONFIG };

  private reload$ = new Subject<void>();
  private search$ = new Subject<void>();

  readonly examplePreviewParticipant = EXAMPLE_PARTICIPANT;

  get selectedCount(): number {
    return this.selectedParticipants.size;
  }

  get allOnPageSelected(): boolean {
    return (
      this.participants.length > 0 &&
      this.participants.every((p) => p.id != null && this.selectedParticipants.has(p.id))
    );
  }

  get previewParticipant(): Participant {
    const [first] = this.selectedParticipants.values();
    return first ?? this.examplePreviewParticipant;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;
    this.eventId = +idParam;

    this.loadConfig();

    this.eventService.getEventById(this.eventId).subscribe({
      next: (eventData) => (this.event = eventData),
      error: () => this.toastr.error('Não foi possível carregar os detalhes do evento.', 'Erro'),
    });

    this.search$.pipe(debounceTime(400), tap(() => (this.currentPage = 1))).subscribe(() => this.reload$.next());

    this.reload$
      .pipe(
        tap(() => (this.isLoading = true)),
        switchMap(() =>
          this.eventService.getEventParticipants(this.eventId, {
            page: this.currentPage,
            search: this.search.trim() || undefined,
            perPage: 50,
            orderBy: this.orderBy,
          }),
        ),
      )
      .subscribe({
        next: (response) => {
          this.participants = response.data;
          this.totalParticipants = response.total;
          this.currentPage = response.current_page;
          this.lastPage = response.last_page;
          this.isLoading = false;
        },
        error: () => {
          this.toastr.error('Não foi possível carregar a lista de inscritos.', 'Erro');
          this.isLoading = false;
        },
      });

    this.reload$.next();
  }

  onSearchChange(): void {
    this.search$.next();
  }

  onOrderChange(): void {
    this.currentPage = 1;
    this.reload$.next();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.reload$.next();
  }

  toggleSelection(participant: Participant): void {
    if (participant.id == null) return;
    if (this.selectedParticipants.has(participant.id)) {
      this.selectedParticipants.delete(participant.id);
    } else {
      this.selectedParticipants.set(participant.id, participant);
    }
  }

  isSelected(participant: Participant): boolean {
    return participant.id != null && this.selectedParticipants.has(participant.id);
  }

  toggleSelectAllOnPage(): void {
    if (this.allOnPageSelected) {
      this.participants.forEach((p) => p.id != null && this.selectedParticipants.delete(p.id));
    } else {
      this.participants.forEach((p) => p.id != null && this.selectedParticipants.set(p.id, p));
    }
  }

  saveConfig(): void {
    localStorage.setItem(LABEL_PRINT_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
  }

  private loadConfig(): void {
    this.config = loadLabelPrintConfig();
  }

  openPrintPreview(): void {
    if (this.selectedParticipants.size === 0 || !this.event) return;

    this.saveConfig();

    const job: LabelPrintJob = {
      eventId: this.eventId,
      eventTitle: this.event.title,
      participants: Array.from(this.selectedParticipants.values()),
      config: this.config,
    };
    sessionStorage.setItem(LABEL_PRINT_JOB_STORAGE_KEY, JSON.stringify(job));

    window.open(`/admin/events/${this.eventId}/labels/print`, '_blank');
  }
}
