import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/public/landing-page/landing-page';
import { EventDetailsComponent } from './features/public/event-details/event-details';
import { LoginComponent } from './features/admin/login/login';
import { DashboardComponent } from './features/admin/dashboard/dashboard';
import { EventManagementComponent } from './features/admin/event-management/event-management';
import { ParticipantListComponent } from './features/admin/participant-list/participant-list';
import { CheckinComponent } from './features/admin/checkin/checkin';
import { LabelPrintSelectionComponent } from './features/admin/label-print-selection/label-print-selection';
import { LabelPrintPreviewComponent } from './features/admin/label-print-preview/label-print-preview';
import { authGuard } from './core/guards/auth-guard';
import { PastEventComponent } from './features/public/past-event/past-event';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'inscricao/:id', component: EventDetailsComponent },
  { path: 'eventos-passados/:id', component: PastEventComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'events', component: EventManagementComponent },
      { path: 'events/:id/participants', component: ParticipantListComponent },
      { path: 'events/:id/checkin', component: CheckinComponent },
      { path: 'events/:id/labels', component: LabelPrintSelectionComponent },
      { path: 'events/:id/labels/print', component: LabelPrintPreviewComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
