import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from './starter/services/auth-guard.service';

const routes: Routes = [

  {
    path: 'addr',
    loadChildren: () => import('./address/address.module').then(m => m.AddressModule),
    canActivate: [AuthGuardService]
  },  
  {
    path: 'users',
    loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
    canActivate: [AuthGuardService]
  },  
  {
    path: 'facility',
    loadChildren: () => import('./facility/facility.module').then(m => m.FacilityModule),
    canActivate: [AuthGuardService]
  },  
  {
    path: 'ftp',
    loadChildren: () => import('./ftp/ftp.module').then(m => m.FtpModule),
    canActivate: [AuthGuardService]
  },
  {
    path: '',
    loadChildren: () => import('./starter/starter.module').then(m => m.StarterModule)
  },
  {
    path: '**',
    redirectTo: ''
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
