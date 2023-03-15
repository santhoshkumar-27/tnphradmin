import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';
import { MainComponent } from './main/main.component';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuardService } from './services/auth-guard.service';
import { ErrorComponent } from './error/error.component';

const routes: Routes = [
  { path: '', component: MainComponent, canActivate: [AuthGuardService] },
  { path: 'login', component: AuthComponent },
  { path: 'error', component: ErrorComponent },
  //{ path: '', component: DashboardComponent, canActivate: [AuthGuardService] },
  //{ path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: '' }
]; 

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})

export class StarterRoutingModule { }
