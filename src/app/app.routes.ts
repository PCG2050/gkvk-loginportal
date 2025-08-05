import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Layout } from './pages/layout/layout';
import { authGuard } from './auth.guard';


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
        path:'',
        component: Layout,
        canActivate:[authGuard],
        children: [
            {
                path: 'dashboard',
                component: Dashboard,
                title: 'Dashboard'
            }
            
        ]
    }
];
