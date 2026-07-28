import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event';
import { EventModel } from '../../../shared/models/event';
import { EventFormModalComponent } from '../event-form-modal/event-form-modal';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-event-management',
  imports: [CommonModule, RouterLink, EventFormModalComponent],
  templateUrl: './event-management.html',
  styleUrl: './event-management.css',
})
export class EventManagementComponent implements OnInit {
  private eventService = inject(EventService);

  events: EventModel[] = [];
  isLoading = true;
  error = '';
  storageUrl = environment.storageUrl;

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
}
