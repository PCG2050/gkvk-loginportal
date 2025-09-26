import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Layout } from './pages/layout/layout';
import { AuthGuard } from './core/guards/auth.guard';
import { EditUnitsComponent } from './pages/edit-units/edit-units.component';
import { EditTrainersComponent } from './pages/edit-trainers/edit-trainers.component';
import { ManageadminsComponent } from './pages/manageadmins/manageadmins.component';
import { StaffComponent } from './pages/staff/staff.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ForgotPasswordComponent } from './pages/password/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/password/reset-password/reset-password.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Forgot Password' },
  { path: 'reset-password', component: ResetPasswordComponent, title: 'Reset Password' },
  {
    path: '',
    component: Layout,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'manage-admins', component: ManageadminsComponent },
      { path: 'edit-units', component: EditUnitsComponent },
      { path: 'edit-trainers', component: EditTrainersComponent },
      { path: 'staff', component: StaffComponent },
      { path: 'profile', component: ProfileComponent },
    ]
  },
  { path: '**', redirectTo: 'login' }
];


