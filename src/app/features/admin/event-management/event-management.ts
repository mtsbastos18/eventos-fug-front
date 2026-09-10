import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EventService } from '../../../core/services/event';
import { EventModel } from '../../../shared/models/event';
import { EventFormModalComponent } from '../event-form-modal/event-form-modal';
import { EventCoverPipe } from '../../../shared/pipes/event-cover.pipe';

@Component({
  selector: 'app-event-management',
  imports: [CommonModule, RouterLink, EventFormModalComponent, EventCoverPipe],
  templateUrl: './event-management.html',
  styleUrl: './event-management.css',
})
export class EventManagementComponent implements OnInit {
  private eventService = inject(EventService);
  private toastr = inject(ToastrService);

  events: EventModel[] = [];
  isLoading = true;
  error = '';

  showCreateModal = false;

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getAdminEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar eventos.';
        this.isLoading = false;
      },
    });
  }

  isPast(event: EventModel): boolean {
    return new Date(event.date) < new Date();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onEventSaved(): void {
    this.showCreateModal = false;
    this.loadEvents();
  }

  archiveEvent(event: EventModel): void {
    if (
      !confirm(
        `Arquivar o evento "${event.title}"? Ele deixará de aparecer na landing page e nesta lista, mas nada é apagado.`,
      )
    ) {
      return;
    }
    this.eventService.archiveEvent(event.id).subscribe({
      next: () => {
        this.toastr.success('Evento arquivado com sucesso.');
        this.loadEvents();
      },
      error: () => this.toastr.error('Erro ao arquivar o evento.'),
    });
  }
}
