import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { EventModel } from '../../shared/models/event';
import { Participant } from '../../shared/models/participant';
import { PaginatedResponse } from '../../shared/models/pagination';
import { Observable } from 'rxjs';

export interface ParticipantFilters {
  page?: number;
  search?: string;
  filterType?: 'name' | 'cpf' | 'email';
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getPublicEvents(): Observable<EventModel[]> {
    return this.http.get<EventModel[]>(`${this.apiUrl}/events`);
  }

  getPastEvents(): Observable<EventModel[]> {
    return this.http.get<EventModel[]>(`${this.apiUrl}/events/past`);
  }

  getPublicEventById(id: string): Observable<EventModel> {
    return this.http.get<EventModel>(`${this.apiUrl}/events/${id}`);
  }

  registerParticipant(data: Participant): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/register`, data);
  }

  verifyParticipant(data: { email: string; event_id: number; code: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/register/verify`, data);
  }

  getDashboardMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/events/dashboard`);
  }

  getAdminEvents(): Observable<EventModel[]> {
    return this.http.get<EventModel[]>(`${this.apiUrl}/admin/events`);
  }

  getEventById(id: number): Observable<EventModel> {
    return this.http.get<EventModel>(`${this.apiUrl}/admin/events/${id}`);
  }

  createEvent(event: EventModel | FormData): Observable<EventModel> {
    return this.http.post<EventModel>(`${this.apiUrl}/admin/events`, event);
  }

  updateEvent(id: number, event: EventModel | FormData): Observable<EventModel> {
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

  exportEventParticipants(eventId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/events/${eventId}/participants/export`, {
      responseType: 'blob',
    });
  }

  getPostEventDetails(eventId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/${eventId}/post-detail`);
  }

  // Adicione este método dentro da classe EventService
  savePostEventDetail(eventId: number, data: FormData): Observable<any> {
    // Utilizando POST conforme o seu payload. O Angular injeta o Content-Type: multipart/form-data + boundary automaticamente ao receber um FormData
    return this.http.post(`${this.apiUrl}/admin/events/${eventId}/post-detail`, data);
  }
}
