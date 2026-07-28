import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../../../core/services/event';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private eventService = inject(EventService);

  metrics: any = null;
  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics() {
    this.isLoading = true;
    this.eventService.getDashboardMetrics().subscribe({
      next: (data: any[]) => {
        const totalEvents = data.length;
        const totalParticipants = data.reduce(
          (sum, event) => sum + (event.participants_count || 0),
          0,
        );
        const totalCapacity = data.reduce((sum, event) => sum + (event.capacity || 0), 0);
        const occupancyRate =
          totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0;

        this.metrics = {
          totalEvents,
          totalParticipants,
          occupancyRate,
        };
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar métricas.';
        this.isLoading = false;
      },
    });
  }
}
