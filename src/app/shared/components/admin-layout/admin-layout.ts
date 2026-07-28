import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  mobileOpen = false;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
