import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { EventModel } from '../../shared/models/event';
import { Participant } from '../../shared/models/participant';
import { PaginatedResponse } from '../../shared/models/pagination';
import { Observable } from 'rxjs';
import { TenantService } from './tenant';

export interface ParticipantFilters {
  page?: number;
  search?: string;
  filterType?: 'name' | 'cpf' | 'email';
  perPage?: number;
  orderBy?: 'name' | 'latest';
}

export interface BulkCheckinResponse {
  checked_in: number[];
  already_checked_in: number[];
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private tenantService = inject(TenantService);

  /** Rotas públicas passam pelo prefixo /t/{slug} — o tenant já foi resolvido pelo tenantResolver. */
  private get publicBase(): string {
    return `${this.apiUrl}/t/${this.tenantService.currentTenant()?.slug}`;
  }

  getPublicEvents(): Observable<EventModel[]> {
    return this.http.get<EventModel[]>(`${this.publicBase}/events`);
  }

  getPastEvents(): Observable<EventModel[]> {
    return this.http.get<EventModel[]>(`${this.publicBase}/events/past`);
  }

  getPublicEventById(id: string): Observable<EventModel> {
    return this.http.get<EventModel>(`${this.publicBase}/events/${id}`);
  }

  registerParticipant(data: Participant): Observable<any> {
    return this.http.post(`${this.publicBase}/events/register`, data);
  }

  verifyParticipant(data: { email: string; event_id: number; code: string }): Observable<any> {
    return this.http.post(`${this.publicBase}/events/register/verify`, data);
  }

  getDashboardMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/events/dashboard`);
  }

  getAdminEvents(archived = false): Observable<EventModel[]> {
    const params = archived ? new HttpParams().set('archived', '1') : undefined;
    return this.http.get<EventModel[]>(`${this.apiUrl}/admin/events`, { params });
  }

  archiveEvent(id: number): Observable<EventModel> {
    return this.http.post<EventModel>(`${this.apiUrl}/admin/events/${id}/archive`, {});
  }

  unarchiveEvent(id: number): Observable<EventModel> {
    return this.http.post<EventModel>(`${this.apiUrl}/admin/events/${id}/unarchive`, {});
  }

  getEventById(id: number): Observable<EventModel> {
    return this.http.get<EventModel>(`${this.apiUrl}/admin/events/${id}`);
  }

  createEvent(event: EventModel | FormData): Observable<EventModel> {
    return this.http.post<EventModel>(`${this.apiUrl}/admin/events`, event);
  }

  updateEvent(id: number, event: EventModel | FormData): Observable<EventModel> {
    // O PHP só faz parse de corpo multipart em POST, então um PUT com FormData chega
    // sem os arquivos. Usamos o method spoofing do Laravel (_method) para o upload funcionar.
    if (event instanceof FormData) {
      event.append('_method', 'PUT');
      return this.http.post<EventModel>(`${this.apiUrl}/admin/events/${id}`, event);
    }

    return this.http.put<EventModel>(`${this.apiUrl}/admin/events/${id}`, event);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/events/${id}`);
  }

  getEventParticipants(
    id: number,
    filters: ParticipantFilters = {},
  ): Observable<PaginatedResponse<Participant>> {
    let params = new HttpParams().set('page', filters.page ?? 1);

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.filterType) {
      params = params.set('filter_type', filters.filterType);
    }
    if (filters.perPage) {
      params = params.set('per_page', filters.perPage);
    }
    if (filters.orderBy) {
      params = params.set('order_by', filters.orderBy);
    }

    return this.http.get<PaginatedResponse<Participant>>(
      `${this.apiUrl}/admin/events/${id}/participants`,
      { params },
    );
  }

  deleteParticipant(eventId: number, participantId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/events/${eventId}/participants/${participantId}`);
  }

  checkinByToken(eventId: number, token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/events/${eventId}/checkin`, { token });
  }

  confirmParticipantEntry(
    eventId: number,
    participantId: number,
    data: Partial<Participant>,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/events/${eventId}/participants/${participantId}/checkin`,
      data,
    );
  }

  bulkCheckin(eventId: number, participantIds: number[]): Observable<BulkCheckinResponse> {
    return this.http.post<BulkCheckinResponse>(
      `${this.apiUrl}/admin/events/${eventId}/participants/checkin-bulk`,
      { participant_ids: participantIds },
    );
  }

  exportEventParticipants(eventId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/events/${eventId}/participants/export`, {
      responseType: 'blob',
    });
  }

  /** Admin, dentro do tenant já resolvido pelo JWT — sem prefixo de slug. */
  getPostEventDetails(eventId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/events/${eventId}/post-detail`);
  }

  /** Pública, usada pela página de "eventos passados". */
  getPublicPostEventDetails(eventId: string): Observable<any> {
    return this.http.get(`${this.publicBase}/events/${eventId}/post-detail`);
  }

  // Adicione este método dentro da classe EventService
  savePostEventDetail(eventId: number, data: FormData): Observable<any> {
    // Utilizando POST conforme o seu payload. O Angular injeta o Content-Type: multipart/form-data + boundary automaticamente ao receber um FormData
    return this.http.post(`${this.apiUrl}/admin/events/${eventId}/post-detail`, data);
  }
}
