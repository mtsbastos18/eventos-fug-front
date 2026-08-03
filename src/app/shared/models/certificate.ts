export type CertificateFieldAlign = 'left' | 'center' | 'right';

export interface CertificateField {
  id: string;
  variable?: string | null;
  text?: string;
  x: number;
  y: number;
  width: number;
  font_size: number;
  font_family?: string;
  font_weight?: string;
  color?: string;
  align?: CertificateFieldAlign;
  uppercase?: boolean;
}

export interface CertificateTemplate {
  event_id: number;
  background_path?: string | null;
  background_url?: string | null;
  page_size: string;
  orientation: 'landscape' | 'portrait';
  fields: CertificateField[];
  is_published: boolean;
  updated_at?: string | null;
}

export interface CertificateInfo {
  id: number;
  code: string;
  email_status: 'pending' | 'queued' | 'sent' | 'failed';
  email_sent_at?: string | null;
  email_error?: string | null;
  download_count: number;
  first_downloaded_at?: string | null;
}

export interface CertificateDispatchItem {
  id: number;
  name: string;
  email: string;
  document: string;
  checked_in_at: string;
  certificate: CertificateInfo | null;
}

export interface CertificateDispatchSummary {
  checked_in: number;
  issued: number;
  sent: number;
  failed: number;
  downloaded: number;
}

export interface CertificateDispatchResponse {
  summary: CertificateDispatchSummary;
  template: {
    is_published: boolean;
    updated_at: string | null;
  };
  items: {
    data: CertificateDispatchItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface PublicCertificateInfo {
  event: {
    title: string;
    date: string;
    location: string;
  };
  participant_name_masked: string;
  code: string;
}
