import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Observable } from 'rxjs';
import { EventService } from '../../../core/services/event';
import { EventModel } from '../../../shared/models/event';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { EVENT_COVER_PLACEHOLDER, EventCoverPipe } from '../../../shared/pipes/event-cover.pipe';
import { TenantService } from '../../../core/services/tenant';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, NavbarComponent, RouterLink, EventCoverPipe],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPageComponent implements OnInit {
  private eventService = inject(EventService);
  private toastr = inject(ToastrService);
  private tenantService = inject(TenantService);

  get tenantSlug(): string {
    return this.tenantService.currentTenant()?.slug ?? '';
  }

  events: EventModel[] = [];
  pastEvents: EventModel[] = [];
  isLoading = true;
  error = '';
  readonly coverPlaceholder = EVENT_COVER_PLACEHOLDER;

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading = true;
    forkJoin({
      publicEvents: this.eventService.getPublicEvents(),
      pastEvents: this.eventService.getPastEvents(),
    }).subscribe({
      next: ({ publicEvents, pastEvents }) => {
        this.events = [...publicEvents];
        this.pastEvents = [...pastEvents];
        console.log('Eventos carregados:', this.events);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Não foi possível carregar os eventos. Tente mais tarde.';
        this.toastr.error('Não foi possível carregar os eventos.', 'Erro de Conexão');
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  getEvents(): Observable<EventModel[]> {
    return this.eventService.getPublicEvents();
  }

  getPastEvents(): Observable<EventModel[]> {
    return this.eventService.getPastEvents();
  }

  stripHtml(html: string, maxLength: number = 10): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = this.cleanDescription(doc.body.textContent || '') || '';
    console.log('Original text:', text.length);
    console.log('size:', maxLength);
    if (text.length > maxLength) {
      console.log('Truncating text:', text);
      return text.substring(0, maxLength).trim() + '...';
    }
    return text;
  }

  cleanDescription(html: string) {
    // Substitui todos os non-breaking spaces por espaços normais
    const text = html.replace(/&nbsp;/g, ' ');
    console.log('Cleaned text:', text);
    console.log('Cleaned text length:', text.length);
    if (text.length > 150) {
      return text.substring(0, 180).trim() + '...';
    }
    return text;
  }
}
