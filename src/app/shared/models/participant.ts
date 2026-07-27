export interface Participant {
  id?: number;
  event_id: number;
  name: string;
  email: string;
  document: string;
  phone: string;
  company?: string;
  position?: string;
  city?: string;
  created_at?: string;
  checked_in_at?: string | null;
  checkin_token?: string;
}
