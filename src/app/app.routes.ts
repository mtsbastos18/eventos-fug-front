import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/public/landing-page/landing-page';
import { EventDetailsComponent } from './features/public/event-details/event-details';
import { LoginComponent } from './features/admin/login/login';
import { DashboardComponent } from './features/admin/dashboard/dashboard';
import { EventManagementComponent } from './features/admin/event-management/event-management';
import { EventArchiveComponent } from './features/admin/event-archive/event-archive';
import { ParticipantListComponent } from './features/admin/participant-list/participant-list';
import { CheckinComponent } from './features/admin/checkin/checkin';
import { LabelPrintSelectionComponent } from './features/admin/label-print-selection/label-print-selection';
import { LabelPrintPreviewComponent } from './features/admin/label-print-preview/label-print-preview';
import { CertificateTemplateEditorComponent } from './features/admin/certificate-template-editor/certificate-template-editor';
import { CertificateDispatchComponent } from './features/admin/certificate-dispatch/certificate-dispatch';
import { PublicCertificateComponent } from './features/public/public-certificate/public-certificate';
import { authGuard } from './core/guards/auth-guard';
import { masterGuard } from './core/guards/master-guard';
import { PastEventComponent } from './features/public/past-event/past-event';
import { AdminLayoutComponent } from './shared/components/admin-layout/admin-layout';
import { PlatformHomeComponent } from './features/public/platform-home/platform-home';
import { TenantNotFoundComponent } from './features/public/tenant-not-found/tenant-not-found';
import { TenantPickerComponent } from './features/admin/tenant-picker/tenant-picker';
import { NoTenantComponent } from './features/admin/no-tenant/no-tenant';
import { TenantManagementComponent } from './features/admin/tenant-management/tenant-management';
import { tenantResolver } from './core/resolvers/tenant.resolver';

export const routes: Routes = [
  {
    path: 'e/:tenantSlug',
    resolve: { tenant: tenantResolver },
    children: [
      { path: '', component: LandingPageComponent },
      { path: 'inscricao/:id', component: EventDetailsComponent },
      { path: 'eventos-passados/:id', component: PastEventComponent },
      { path: 'certificado/:token', component: PublicCertificateComponent },
    ],
  },
  { path: '', component: PlatformHomeComponent },
  { path: 'cliente-nao-encontrado', component: TenantNotFoundComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: 'select-tenant', component: TenantPickerComponent },
      { path: 'sem-cliente', component: NoTenantComponent },
      {
        path: '',
        component: AdminLayoutComponent,
        children: [
          { path: 'dashboard', component: DashboardComponent },
          { path: 'events', component: EventManagementComponent },
          { path: 'events/archived', component: EventArchiveComponent },
          { path: 'events/:id/participants', component: ParticipantListComponent },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'events/:id/checkin', component: CheckinComponent },
          { path: 'events/:id/labels', component: LabelPrintSelectionComponent },
          { path: 'events/:id/certificate', component: CertificateTemplateEditorComponent },
          { path: 'events/:id/certificates', component: CertificateDispatchComponent },
          { path: 'tenants', component: TenantManagementComponent, canActivate: [masterGuard] },
        ],
      },

      { path: 'events/:id/labels/print', component: LabelPrintPreviewComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
