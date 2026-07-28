import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { QuillModule } from 'ngx-quill';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { Subject, switchMap } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { EventService } from '../../../core/services/event';
import { Participant } from '../../../shared/models/participant';
import { EventModel } from '../../../shared/models/event';
import { EventFormModalComponent } from '../event-form-modal/event-form-modal';

@Component({
  selector: 'app-participant-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NgxMaskPipe,
    NgxMaskDirective,
    QuillModule,
    EventFormModalComponent,
  ],
  templateUrl: './participant-list.html',
  styleUrl: './participant-list.css',
})
export class ParticipantListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  eventId!: number;
  event: EventModel | null = null;
  participants: Participant[] = [];
  totalParticipants = 0;
  isLoading = true;
  error = '';
  deletingParticipantId: number | null = null;

  showConfirmEntryModal = false;
  participantToConfirm: Participant | null = null;
  isConfirmingEntry = false;

  showEditEventModal = false;

  showPostEventForm = false;
  isSubmittingPostEvent = false;
  selectedVideo: File | null = null;
  selectedImages: File[] = [];

  postEventForm: FormGroup = this.fb.group({
    description: ['', Validators.required],
    flickrUrl: ['', [Validators.pattern('https?://(www.)?flickr.com/.*')]],
    youtube_video_url: ['', [Validators.pattern('https?://(www.)?youtube.com/.*')]],
  });

  filterForm: FormGroup = this.fb.group({
    search: [''],
    filterType: ['all'],
  });

  confirmEntryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    document: ['', Validators.required],
    company: [''],
    position: [''],
    city: [''],
  });

  currentPage = 1;
  lastPage = 1;

  private reload$ = new Subject<void>();

  get cpfMask(): string | null {
    return this.filterForm.get('filterType')?.value === 'cpf' ? '000.000.000-00' : null;
  }

  get visiblePages(): number[] {
    const maxButtons = 7;
    if (this.lastPage <= maxButtons) {
      return Array.from({ length: this.lastPage }, (_, i) => i + 1);
    }
    let start = Math.max(1, this.currentPage - 3);
    const end = Math.min(this.lastPage, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }
    this.eventId = +idParam;

    this.loadEvent();

    this.filterForm
      .get('filterType')!
      .valueChanges.subscribe(() => this.filterForm.get('search')!.setValue(''));

    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        tap(() => (this.currentPage = 1)),
      )
      .subscribe(() => this.reload$.next());

    this.reload$
      .pipe(
        tap(() => (this.isLoading = true)),
        switchMap(() => {
          const { search, filterType } = this.filterForm.value;
          return this.eventService.getEventParticipants(this.eventId, {
            page: this.currentPage,
            search: search?.trim() || undefined,
            filterType: filterType === 'all' ? undefined : filterType,
          });
        }),
      )
      .subscribe({
        next: (response) => {
          this.participants = response.data;
          this.totalParticipants = response.total;
          this.currentPage = response.current_page;
          this.lastPage = response.last_page;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Erro ao carregar lista de inscritos.';
          this.toastr.error('Não foi possível carregar a lista de inscritos.', 'Erro');
          this.isLoading = false;
        },
      });

    this.reload$.next();
  }

  deleteParticipant(participantId: number): void {
    if (confirm('Tem certeza que deseja remover este participante?')) {
      this.deletingParticipantId = participantId;
      this.eventService.deleteParticipant(this.eventId, participantId).subscribe({
        next: () => {
          this.toastr.success('Participante removido com sucesso!', 'Sucesso');
          this.deletingParticipantId = null;
          if (this.participants.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.reload$.next();
        },
        error: () => {
          this.toastr.error('Erro ao remover o participante.', 'Erro');
          this.deletingParticipantId = null;
        },
      });
    }
  }

  openConfirmEntryModal(participant: Participant): void {
    this.participantToConfirm = participant;
    this.confirmEntryForm.reset({
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      document: participant.document,
      company: participant.company ?? '',
      position: participant.position ?? '',
      city: participant.city ?? '',
    });
    this.showConfirmEntryModal = true;
  }

  closeConfirmEntryModal(): void {
    this.showConfirmEntryModal = false;
    this.participantToConfirm = null;
  }

  submitConfirmEntry(): void {
    if (this.confirmEntryForm.invalid || !this.participantToConfirm?.id) {
      return;
    }

    this.isConfirmingEntry = true;
    this.eventService
      .confirmParticipantEntry(this.eventId, this.participantToConfirm.id, this.confirmEntryForm.value)
      .subscribe({
        next: (res) => {
          this.toastr.success(res?.message || 'Entrada confirmada!', 'Sucesso');
          this.isConfirmingEntry = false;
          this.closeConfirmEntryModal();
          this.reload$.next();
          this.loadEvent();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message || 'Erro ao confirmar entrada.', 'Erro');
          this.isConfirmingEntry = false;
        },
      });
  }

  exportParticipants(): void {
    if (!this.eventId) return;
    this.eventService.exportEventParticipants(this.eventId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inscritos-${this.event?.slug}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Erro ao exportar participantes.', 'Erro');
      },
    });
  }

  private loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (eventData) => {
        this.event = eventData;
      },
      error: () => {
        this.error = 'Erro ao carregar detalhes do evento.';
        this.toastr.error('Não foi possível carregar os detalhes do evento.', 'Erro');
      },
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.reload$.next();
  }

  openEditEventModal(): void {
    this.showEditEventModal = true;
  }

  closeEditEventModal(): void {
    this.showEditEventModal = false;
  }

  onEventSaved(): void {
    this.showEditEventModal = false;
    this.loadEvent();
  }

  deleteEventAndExit(): void {
    if (!this.event) return;
    if (!confirm('Tem certeza que deseja excluir este evento? Essa ação não pode ser desfeita.')) {
      return;
    }
    this.eventService.deleteEvent(this.eventId).subscribe({
      next: () => {
        this.toastr.success('Evento excluído com sucesso!', 'Sucesso');
        this.router.navigate(['/admin/events']);
      },
      error: () => this.toastr.error('Erro ao excluir evento.', 'Erro'),
    });
  }

  openPostEventForm(): void {
    if (!this.event) return;
    this.postEventForm.reset();

    this.eventService.getPostEventDetails(this.eventId.toString()).subscribe({
      next: (response) => {
        this.postEventForm.patchValue({
          description: response.description || '',
          flickrUrl: '',
          youtube_video_url: response.youtube_video_url || '',
        });
        this.selectedVideo = null;
        this.selectedImages = [];
        this.showPostEventForm = true;
      },
      error: () => {
        this.selectedVideo = null;
        this.selectedImages = [];
        this.showPostEventForm = true;
      },
    });
  }

  closePostEventForm(): void {
    this.showPostEventForm = false;
    this.selectedVideo = null;
    this.selectedImages = [];
    this.postEventForm.reset();
  }

  onVideoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedVideo = file;
    }
  }

  onImagesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.selectedImages = Array.from(files);
    }
  }

  onSubmitPostEvent(): void {
    if (this.postEventForm.invalid || !this.eventId) return;

    this.isSubmittingPostEvent = true;
    const formData = new FormData();

    formData.append('description', this.postEventForm.get('description')?.value);
    formData.append('flickrUrl', this.postEventForm.get('flickrUrl')?.value);
    if (this.postEventForm.get('youtube_video_url')?.value) {
      formData.append('youtube_video_url', this.postEventForm.get('youtube_video_url')?.value);
    }
    if (this.selectedVideo) {
      formData.append('video', this.selectedVideo);
    }
    this.selectedImages.forEach((image) => {
      formData.append('images[]', image);
    });

    this.eventService.savePostEventDetail(this.eventId, formData).subscribe({
      next: () => {
        this.isSubmittingPostEvent = false;
        this.toastr.success('Detalhes pós-evento salvos com sucesso!', 'Sucesso');
        this.closePostEventForm();
      },
      error: () => {
        this.isSubmittingPostEvent = false;
        this.toastr.error('Erro ao salvar os detalhes do evento.', 'Erro');
      },
    });
  }
}
