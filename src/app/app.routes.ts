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
     {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'Forgot-password',
        component: ForgotPasswordComponent,
        title: 'ForgotPassword'
    },
    {
        path: 'Reset-password',
        component: ResetPasswordComponent,
        title: 'Reset password'
    },
    {
        path: '',
        component: Layout,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'dashboard',
                component: Dashboard,
                title: 'Dashboard'
            },
            {
                path: 'manageAdmins',
                component: ManageadminsComponent,
                title: 'Manage Admins'
            },
            {
                path: 'Edit-Units',
                component: EditUnitsComponent,
                title: 'Units'
            },
            {
                path: 'Edit-Trainers',
                component: EditTrainersComponent,
                title: 'Trainers'
            },
            {
                path: 'Staff',
                component: StaffComponent,
                title: 'Staff Management'
            },
            {
                path: 'Profile',
                component: ProfileComponent,
                title: 'Profile'
            },
        ]

    },
  ];
  


