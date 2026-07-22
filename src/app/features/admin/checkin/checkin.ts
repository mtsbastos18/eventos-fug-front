import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { EventService } from '../../../core/services/event';
import { EventModel } from '../../../shared/models/event';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-checkin',
  imports: [CommonModule, FormsModule, RouterLink, ZXingScannerModule, NavbarComponent],
  templateUrl: './checkin.html',
  styleUrl: './checkin.css',
})
export class CheckinComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private toastr = inject(ToastrService);

  eventId!: number;
  event: EventModel | null = null;

  allowedFormats = [BarcodeFormat.QR_CODE];
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  hasCameraPermission = true;
  hasDevices = true;

  /** Bloqueia novas leituras enquanto uma requisição está em andamento ou em cooldown. */
  isProcessing = false;

  lastCheckin: { name: string; success: boolean } | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }
    this.eventId = +idParam;

    this.eventService.getEventById(this.eventId).subscribe({
      next: (eventData) => (this.event = eventData),
      error: () => this.toastr.error('Não foi possível carregar os detalhes do evento.', 'Erro'),
    });
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    const backCamera = devices.find((d) => /back|tras/i.test(d.label));
    this.currentDevice = backCamera ?? devices[devices.length - 1];
  }

  onCamerasNotFound(): void {
    this.hasDevices = false;
    this.toastr.error('Nenhuma câmera foi encontrada neste dispositivo.', 'Câmera indisponível');
  }

  onPermissionResponse(hasPermission: boolean): void {
    this.hasCameraPermission = hasPermission;
    if (!hasPermission) {
      this.toastr.error(
        'Permissão de câmera negada. Utilize o check-in manual pela listagem de inscritos.',
        'Câmera bloqueada',
      );
    }
  }

  onScanSuccess(token: string): void {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    this.eventService.checkinByToken(this.eventId, token).subscribe({
      next: (res) => {
        this.lastCheckin = { name: res?.participant?.name ?? 'Participante', success: true };
        this.toastr.success(res?.message || 'Check-in realizado com sucesso!', 'Entrada confirmada');
        this.armCooldown();
      },
      error: (err) => {
        const message = err?.error?.message || 'Não foi possível confirmar o check-in.';
        this.lastCheckin = { name: err?.error?.participant?.name ?? '', success: false };
        this.toastr.error(message, 'Check-in inválido');
        this.armCooldown();
      },
    });
  }

  private armCooldown(): void {
    setTimeout(() => {
      this.isProcessing = false;
    }, 2000);
  }
}
