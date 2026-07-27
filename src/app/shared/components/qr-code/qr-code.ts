import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  template: `<canvas #canvas [width]="sizePx" [height]="sizePx"></canvas>`,
})
export class QrCodeComponent implements OnChanges, AfterViewInit {
  @Input({ required: true }) value = '';
  @Input() sizePx = 80;

  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  ngOnChanges(): void {
    this.draw();
  }

  ngAfterViewInit(): void {
    this.draw();
  }

  private draw(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;

    if (!this.value) {
      // Participante sem checkin_token (dado legado) — mostra um aviso visível em
      // vez de deixar a etiqueta com um espaço em branco silencioso onde o QR entraria.
      this.drawMissingTokenWarning(canvas);
      return;
    }

    QRCode.toCanvas(canvas, this.value, { width: this.sizePx, margin: 0 }).catch(() => {
      this.drawMissingTokenWarning(canvas);
    });
  }

  private drawMissingTokenWarning(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#d1d5db';
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    ctx.fillStyle = '#9ca3af';
    ctx.font = `${Math.round(canvas.width * 0.12)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('sem QR', canvas.width / 2, canvas.height / 2);
  }
}
