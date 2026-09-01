import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tenant-not-found',
  imports: [CommonModule, RouterLink],
  templateUrl: './tenant-not-found.html',
})
export class TenantNotFoundComponent {}
