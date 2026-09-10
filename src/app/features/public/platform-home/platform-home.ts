import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '../../../core/services/tenant';
import { TenantThemeService } from '../../../core/services/tenant-theme';

/**
 * Página institucional da raiz do site — único lugar público onde a marca da
 * Storia aparece (ver SDD 1.2/10.6). Conteúdo/arte definitivos são insumo de
 * design ainda pendente; isto é um placeholder consciente, fácil de trocar.
 */
@Component({
  selector: 'app-platform-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './platform-home.html',
  styleUrl: './platform-home.css',
})
export class PlatformHomeComponent implements OnInit {
  private tenantService = inject(TenantService);
  private theme = inject(TenantThemeService);

  ngOnInit(): void {
    this.tenantService.currentTenant.set(null);
    this.theme.reset();
  }
}
