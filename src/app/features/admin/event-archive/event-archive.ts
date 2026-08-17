import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EventService } from '../../../core/services/event';
import { EventModel } from '../../../shared/models/event';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-event-archive',
  imports: [CommonModule, RouterLink],
  templateUrl: './event-archive.html',
  styleUrl: './event-archive.css',
})
export class EventArchiveComponent implements OnInit {
  private eventService = inject(EventService);
  private toastr = inject(ToastrService);

  events: EventModel[] = [];
  isLoading = true;
  error = '';
  storageUrl = environment.storageUrl;

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getAdminEvents(true).subscribe({
      next: (data) => {
        this.events = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar eventos arquivados.';
        this.isLoading = false;
      },
    });
  }

  restoreEvent(event: EventModel): void {
    if (
      !confirm(
        `Restaurar o evento "${event.title}"? Ele voltará a aparecer em Meus Eventos e na landing page.`,
      )
    ) {
      return;
    }
    this.eventService.unarchiveEvent(event.id).subscribe({
      next: () => {
        this.toastr.success('Evento restaurado com sucesso.');
        this.loadEvents();
      },
      error: () => this.toastr.error('Erro ao restaurar o evento.'),
    });
  }
}
