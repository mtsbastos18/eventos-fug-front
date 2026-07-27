import { Participant } from './participant';

export interface LabelConfig {
  fields: { company: boolean; position: boolean };
  fontSizeMm: { name: number; extra: number; eventName: number };
  align: 'left' | 'center' | 'right';
  nameFormat: 'full' | 'first';
  checkinOnPrint: boolean;
}

export interface LabelPrintJob {
  eventId: number;
  eventTitle: string;
  participants: Participant[];
  config: LabelConfig;
}

export const LABEL_PRINT_CONFIG_STORAGE_KEY = 'label-print-config';
export const LABEL_PRINT_JOB_STORAGE_KEY = 'label-print-job';

export const DEFAULT_LABEL_CONFIG: LabelConfig = {
  fields: { company: false, position: false },
  fontSizeMm: { name: 4.5, extra: 2.5, eventName: 2 },
  align: 'center',
  nameFormat: 'full',
  checkinOnPrint: true,
};
