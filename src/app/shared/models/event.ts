export interface EventModel {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  workload_hours?: number;
  image_path?: string;
  mobile_image_path?: string;
  participants_count?: number;
  checkin_count?: number;
  slug?: string;
  video_url?: string;
  gallery?: string[];
  archived_at?: string | null;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}
