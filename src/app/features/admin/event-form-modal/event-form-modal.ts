import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { ToastrService } from 'ngx-toastr';
import { EventService } from '../../../core/services/event';
import { EventModel } from '../../../shared/models/event';

@Component({
  selector: 'app-event-form-modal',
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './event-form-modal.html',
  styleUrl: './event-form-modal.css',
})
export class EventFormModalComponent implements OnChanges {
  private eventService = inject(EventService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  @Input() show = false;
  @Input() eventToEdit: EventModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isSubmitting = false;

  eventForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    subtitle: ['', [Validators.maxLength(255)]],
    description: ['', Validators.required],
    date: ['', Validators.required],
    location: ['', Validators.required],
    capacity: ['', [Validators.required, Validators.min(1)]],
    image: [null],
  });

  get isEditing(): boolean {
    return !!this.eventToEdit;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    if (this.eventToEdit) {
      const dateFormatted = this.eventToEdit.date
        ? new Date(this.eventToEdit.date).toISOString().slice(0, 16)
        : '';
      this.eventForm.reset({
        title: this.eventToEdit.title,
        subtitle: this.eventToEdit.subtitle || '',
        description: this.eventToEdit.description,
        date: dateFormatted,
        location: this.eventToEdit.location,
        capacity: this.eventToEdit.capacity,
        image: null,
      });
    } else {
      this.eventForm.reset();
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.eventForm.patchValue({ image: file });
    }
  }

  close(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.eventForm.invalid) return;

    this.isSubmitting = true;

    const formData = new FormData();
    const formValue = this.eventForm.value;

    Object.keys(formValue).forEach((key) => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const request = this.isEditing
      ? this.eventService.updateEvent(this.eventToEdit!.id, formData)
      : this.eventService.createEvent(formData);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success(
          this.isEditing ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!',
          'Sucesso',
        );
        this.saved.emit();
      },
      error: () => {
        this.isSubmitting = false;
        this.toastr.error(
          this.isEditing ? 'Erro ao atualizar evento.' : 'Erro ao criar evento.',
          'Erro',
        );
      },
    });
  }
}
