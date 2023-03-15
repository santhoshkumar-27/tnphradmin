import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';
import { AddUserComponent } from './add-user/add-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { ListUsersComponent } from './list-users/list-users.component';
import { CanDeactivateGuardService } from '../navigation/services/can-deactivate-guard.service';

const routes: Routes = [
  { path: 'list', component: ListUsersComponent },
  {
    path: 'add',
    component: AddUserComponent,
    canDeactivate: [CanDeactivateGuardService],
  },
  {
    path: 'edit',
    component: AddUserComponent,
    canDeactivate: [CanDeactivateGuardService],
  },
]; 

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})

export class UserRoutingModule { }
