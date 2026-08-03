import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CertificateDispatchResponse,
  CertificateTemplate,
  PublicCertificateInfo,
} from '../../shared/models/certificate';

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTemplate(eventId: number): Observable<CertificateTemplate> {
    return this.http.get<CertificateTemplate>(
      `${this.apiUrl}/admin/events/${eventId}/certificate-template`,
    );
  }

  saveTemplate(eventId: number, data: FormData): Observable<CertificateTemplate> {
    return this.http.post<CertificateTemplate>(
      `${this.apiUrl}/admin/events/${eventId}/certificate-template`,
      data,
    );
  }

  previewTemplate(eventId: number, data: FormData): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/admin/events/${eventId}/certificate-template/preview`, data, {
      responseType: 'blob',
    });
  }

  copyTemplateFrom(eventId: number, sourceEventId: number): Observable<CertificateTemplate> {
    return this.http.post<CertificateTemplate>(
      `${this.apiUrl}/admin/events/${eventId}/certificate-template/copy-from/${sourceEventId}`,
      {},
    );
  }

  deleteTemplate(eventId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/admin/events/${eventId}/certificate-template`,
    );
  }

  getDispatchList(
    eventId: number,
    page = 1,
    perPage = 20,
  ): Observable<CertificateDispatchResponse> {
    const params = new HttpParams().set('page', page).set('per_page', perPage);

    return this.http.get<CertificateDispatchResponse>(
      `${this.apiUrl}/admin/events/${eventId}/certificates`,
      { params },
    );
  }

  issueCertificates(eventId: number): Observable<{ issued: number; total_certificates: number }> {
    return this.http.post<{ issued: number; total_certificates: number }>(
      `${this.apiUrl}/admin/events/${eventId}/certificates/issue`,
      {},
    );
  }

  sendCertificateEmails(
    eventId: number,
    participantIds?: number[],
  ): Observable<{ queued: number }> {
    return this.http.post<{ queued: number }>(
      `${this.apiUrl}/admin/events/${eventId}/certificates/send`,
      participantIds ? { participant_ids: participantIds } : {},
    );
  }

  downloadCertificate(eventId: number, certificateId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/admin/events/${eventId}/certificates/${certificateId}/download`,
      { responseType: 'blob' },
    );
  }

  getPublicCertificate(token: string): Observable<PublicCertificateInfo> {
    return this.http.get<PublicCertificateInfo>(`${this.apiUrl}/certificates/${token}`);
  }

  downloadPublicCertificate(token: string, document: string): Observable<Blob> {
    return this.http.post(
      `${this.apiUrl}/certificates/${token}/download`,
      { document },
      { responseType: 'blob' },
    );
  }
}
