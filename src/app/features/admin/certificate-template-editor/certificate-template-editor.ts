import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { EventService } from '../../../core/services/event';
import { CertificateService } from '../../../core/services/certificate';
import { EventModel } from '../../../shared/models/event';
import { CertificateField, CertificateFieldAlign } from '../../../shared/models/certificate';

interface VariableOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-certificate-template-editor',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './certificate-template-editor.html',
  styleUrl: './certificate-template-editor.css',
})
export class CertificateTemplateEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private certificateService = inject(CertificateService);
  private toastr = inject(ToastrService);

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;

  eventId!: number;
  event: EventModel | null = null;

  isLoading = true;
  isSavingDraft = false;
  isPublishing = false;
  isPreviewing = false;
  isDeleting = false;
  isPublished = false;
  updatedAt: string | null = null;

  pageSize = 'A4';
  orientation: 'landscape' | 'portrait' = 'landscape';
  fields: CertificateField[] = [];
  selectedFieldId: string | null = null;

  backgroundUrl: string | null = null;
  backgroundPreviewUrl: string | null = null;
  backgroundFile: File | null = null;

  scaleFactor = 1;

  showCopyModal = false;
  otherEvents: EventModel[] = [];
  isLoadingOtherEvents = false;
  isCopying = false;

  private draggingFieldId: string | null = null;
  private resizeObserver?: ResizeObserver;

  readonly variables: VariableOption[] = [
    { value: 'participante.nome', label: 'Nome do participante' },
    { value: 'participante.documento', label: 'CPF do participante' },
    { value: 'participante.empresa', label: 'Empresa' },
    { value: 'participante.cargo', label: 'Cargo' },
    { value: 'evento.titulo', label: 'Título do evento' },
    { value: 'evento.subtitulo', label: 'Subtítulo do evento' },
    { value: 'evento.data', label: 'Data do evento' },
    { value: 'evento.local', label: 'Local do evento' },
    { value: 'evento.carga_horaria', label: 'Carga horária (horas)' },
    { value: 'certificado.codigo', label: 'Código de autenticidade' },
    { value: 'certificado.data_emissao', label: 'Data de emissão' },
  ];

  readonly fontFamilies = ['helvetica', 'times', 'courier'];

  get selectedField(): CertificateField | undefined {
    return this.fields.find((f) => f.id === this.selectedFieldId);
  }

  get displayBackgroundUrl(): string | null {
    return this.backgroundPreviewUrl || this.backgroundUrl;
  }

  get aspectRatio(): string {
    return this.orientation === 'landscape' ? '297 / 210' : '210 / 297';
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.eventId = +idParam;
    this.loadEvent();
    this.loadTemplate();
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.updateScaleFactor());
    this.resizeObserver.observe(this.canvasRef.nativeElement);
    this.updateScaleFactor();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.backgroundPreviewUrl) {
      URL.revokeObjectURL(this.backgroundPreviewUrl);
    }
  }

  private loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (eventData) => (this.event = eventData),
    });
  }

  private loadTemplate(): void {
    this.isLoading = true;
    this.certificateService.getTemplate(this.eventId).subscribe({
      next: (template) => {
        this.pageSize = template.page_size || 'A4';
        this.orientation = template.orientation || 'landscape';
        this.fields = template.fields || [];
        this.isPublished = template.is_published;
        this.updatedAt = template.updated_at ?? null;
        this.backgroundUrl = template.background_url ?? null;
        this.isLoading = false;
        setTimeout(() => this.updateScaleFactor());
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Não foi possível carregar a matriz do certificado.', 'Erro');
      },
    });
  }

  private updateScaleFactor(): void {
    if (!this.canvasRef) return;
    const widthPx = this.canvasRef.nativeElement.clientWidth;
    const pageWidthMm = this.orientation === 'landscape' ? 297 : 210;
    const pageWidthPt = (pageWidthMm * 72) / 25.4;
    this.scaleFactor = widthPx > 0 ? widthPx / pageWidthPt : 1;
  }

  toggleOrientation(): void {
    this.orientation = this.orientation === 'landscape' ? 'portrait' : 'landscape';
    setTimeout(() => this.updateScaleFactor());
  }

  onBackgroundSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (this.backgroundPreviewUrl) {
      URL.revokeObjectURL(this.backgroundPreviewUrl);
    }

    this.backgroundFile = file;
    this.backgroundPreviewUrl = URL.createObjectURL(file);
  }

  addVariableField(): void {
    const field: CertificateField = {
      id: this.generateId(),
      variable: 'participante.nome',
      x: 50,
      y: 50,
      width: 60,
      font_size: 18,
      font_family: 'helvetica',
      font_weight: 'normal',
      color: '#000000',
      align: 'center',
      uppercase: false,
    };
    this.fields.push(field);
    this.selectedFieldId = field.id;
  }

  addTextField(): void {
    const field: CertificateField = {
      id: this.generateId(),
      variable: null,
      text: 'participou do evento {{evento.titulo}}.',
      x: 50,
      y: 60,
      width: 70,
      font_size: 14,
      font_family: 'helvetica',
      font_weight: 'normal',
      color: '#333333',
      align: 'center',
      uppercase: false,
    };
    this.fields.push(field);
    this.selectedFieldId = field.id;
  }

  removeField(id: string): void {
    this.fields = this.fields.filter((f) => f.id !== id);
    if (this.selectedFieldId === id) {
      this.selectedFieldId = null;
    }
  }

  selectField(id: string): void {
    this.selectedFieldId = id;
  }

  isTextField(field: CertificateField): boolean {
    return field.text !== undefined && field.text !== null;
  }

  setFieldKind(field: CertificateField, kind: 'variable' | 'text'): void {
    if (kind === 'variable') {
      field.text = undefined;
      field.variable = field.variable || 'participante.nome';
    } else {
      field.variable = null;
      field.text = field.text || 'Texto livre com {{evento.titulo}}.';
    }
  }

  onFieldPointerDown(event: PointerEvent, field: CertificateField): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedFieldId = field.id;
    this.draggingFieldId = field.id;
  }

  onCanvasPointerMove(event: PointerEvent): void {
    if (!this.draggingFieldId || !this.canvasRef) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

    const field = this.fields.find((f) => f.id === this.draggingFieldId);
    if (field) {
      field.x = Math.min(100, Math.max(0, Math.round(xPercent * 10) / 10));
      field.y = Math.min(100, Math.max(0, Math.round(yPercent * 10) / 10));
    }
  }

  onCanvasPointerUp(): void {
    this.draggingFieldId = null;
  }

  fieldTransform(align?: CertificateFieldAlign): string {
    switch (align) {
      case 'center':
        return 'translate(-50%, -50%)';
      case 'right':
        return 'translate(-100%, -50%)';
      default:
        return 'translateY(-50%)';
    }
  }

  fieldFontSizePx(field: CertificateField): number {
    return field.font_size * this.scaleFactor;
  }

  fieldPreviewText(field: CertificateField): string {
    if (this.isTextField(field)) {
      return field.text || '';
    }

    const found = this.variables.find((v) => v.value === field.variable);
    return found ? `{{ ${found.label} }}` : '';
  }

  private buildFormData(publish?: boolean): FormData {
    const formData = new FormData();
    formData.append('page_size', this.pageSize);
    formData.append('orientation', this.orientation);
    formData.append('fields', JSON.stringify(this.fields));

    if (this.backgroundFile) {
      formData.append('background', this.backgroundFile);
    }

    if (publish !== undefined) {
      formData.append('is_published', publish ? '1' : '0');
    }

    return formData;
  }

  saveDraft(): void {
    this.isSavingDraft = true;
    const formData = this.buildFormData(this.isPublished);

    this.certificateService.saveTemplate(this.eventId, formData).subscribe({
      next: (template) => this.onSaved(template, 'Rascunho salvo com sucesso!'),
      error: () => {
        this.isSavingDraft = false;
        this.toastr.error('Erro ao salvar a matriz.', 'Erro');
      },
    });
  }

  publish(): void {
    if (this.fields.length === 0) {
      this.toastr.error('Adicione ao menos um campo antes de publicar.', 'Erro');
      return;
    }

    this.isPublishing = true;
    const formData = this.buildFormData(true);

    this.certificateService.saveTemplate(this.eventId, formData).subscribe({
      next: (template) => this.onSaved(template, 'Matriz publicada com sucesso!'),
      error: () => {
        this.isPublishing = false;
        this.toastr.error('Erro ao publicar a matriz.', 'Erro');
      },
    });
  }

  deleteTemplate(): void {
    if (this.fields.length === 0 && !this.backgroundUrl) {
      this.toastr.info('Não há uma matriz salva para excluir.', 'Aviso');
      return;
    }

    if (
      !confirm(
        'Tem certeza que deseja excluir a matriz deste certificado? A arte de fundo e todos os campos serão perdidos. Certificados já emitidos não são afetados.',
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.certificateService.deleteTemplate(this.eventId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.toastr.success('Matriz excluída com sucesso!', 'Sucesso');
        this.resetToBlankTemplate();
      },
      error: () => {
        this.isDeleting = false;
        this.toastr.error('Erro ao excluir a matriz.', 'Erro');
      },
    });
  }

  private resetToBlankTemplate(): void {
    this.pageSize = 'A4';
    this.orientation = 'landscape';
    this.fields = [];
    this.selectedFieldId = null;
    this.isPublished = false;
    this.updatedAt = null;
    this.backgroundFile = null;

    if (this.backgroundPreviewUrl) {
      URL.revokeObjectURL(this.backgroundPreviewUrl);
      this.backgroundPreviewUrl = null;
    }
    this.backgroundUrl = null;

    setTimeout(() => this.updateScaleFactor());
  }

  private onSaved(template: any, message: string): void {
    this.isSavingDraft = false;
    this.isPublishing = false;
    this.isPublished = template.is_published;
    this.updatedAt = template.updated_at ?? null;

    if (this.backgroundPreviewUrl) {
      URL.revokeObjectURL(this.backgroundPreviewUrl);
      this.backgroundPreviewUrl = null;
    }
    this.backgroundFile = null;
    this.backgroundUrl = template.background_url ?? this.backgroundUrl;

    this.toastr.success(message, 'Sucesso');
  }

  preview(): void {
    this.isPreviewing = true;
    const formData = this.buildFormData();

    this.certificateService.previewTemplate(this.eventId, formData).subscribe({
      next: (blob) => {
        this.isPreviewing = false;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => {
        this.isPreviewing = false;
        this.toastr.error('Erro ao gerar a pré-visualização.', 'Erro');
      },
    });
  }

  openCopyModal(): void {
    this.showCopyModal = true;
    this.isLoadingOtherEvents = true;
    this.eventService.getAdminEvents().subscribe({
      next: (events) => {
        this.otherEvents = events.filter((e) => e.id !== this.eventId);
        this.isLoadingOtherEvents = false;
      },
      error: () => {
        this.isLoadingOtherEvents = false;
        this.toastr.error('Erro ao carregar lista de eventos.', 'Erro');
      },
    });
  }

  closeCopyModal(): void {
    this.showCopyModal = false;
  }

  copyFrom(sourceEvent: EventModel): void {
    if (!confirm(`Copiar a matriz de "${sourceEvent.title}"? Isso substitui a matriz atual.`)) {
      return;
    }

    this.isCopying = true;
    this.certificateService.copyTemplateFrom(this.eventId, sourceEvent.id).subscribe({
      next: (template) => {
        this.isCopying = false;
        this.showCopyModal = false;
        this.pageSize = template.page_size;
        this.orientation = template.orientation;
        this.fields = template.fields || [];
        this.isPublished = template.is_published;
        this.updatedAt = template.updated_at ?? null;
        this.backgroundUrl = template.background_url ?? null;
        this.backgroundFile = null;
        if (this.backgroundPreviewUrl) {
          URL.revokeObjectURL(this.backgroundPreviewUrl);
          this.backgroundPreviewUrl = null;
        }
        this.toastr.success('Matriz copiada. Revise e publique quando estiver pronta.', 'Sucesso');
        setTimeout(() => this.updateScaleFactor());
      },
      error: () => {
        this.isCopying = false;
        this.toastr.error('Erro ao copiar a matriz do evento selecionado.', 'Erro');
      },
    });
  }

  private generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : `field-${Date.now()}-${Math.random()}`;
  }
}
