import { Participant } from './participant';

export type LabelSize = '29x90' | '38x90';

export interface LabelConfig {
  labelSize: LabelSize;
  fields: { company: boolean; position: boolean; city: boolean };
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
  labelSize: '29x90',
  fields: { company: false, position: false, city: false },
  fontSizeMm: { name: 4.5, extra: 2.5, eventName: 2 },
  align: 'center',
  nameFormat: 'full',
  checkinOnPrint: true,
};

export function loadLabelPrintConfig(): LabelConfig {
  const raw = localStorage.getItem(LABEL_PRINT_CONFIG_STORAGE_KEY);
  if (!raw) return { ...DEFAULT_LABEL_CONFIG };
  try {
    const saved = JSON.parse(raw);
    return {
      labelSize: saved.labelSize ?? DEFAULT_LABEL_CONFIG.labelSize,
      fields: { ...DEFAULT_LABEL_CONFIG.fields, ...saved.fields },
      fontSizeMm: { ...DEFAULT_LABEL_CONFIG.fontSizeMm, ...saved.fontSizeMm },
      align: saved.align ?? DEFAULT_LABEL_CONFIG.align,
      nameFormat: saved.nameFormat ?? DEFAULT_LABEL_CONFIG.nameFormat,
      checkinOnPrint: saved.checkinOnPrint ?? DEFAULT_LABEL_CONFIG.checkinOnPrint,
    };
  } catch {
    // Preferências corrompidas no localStorage: ignora e mantém os defaults.
    return { ...DEFAULT_LABEL_CONFIG };
  }
}
