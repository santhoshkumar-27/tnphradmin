import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';
import { CanDeactivateGuardService } from '../navigation/services/can-deactivate-guard.service';
import { AddFacilityComponent } from './facility/add-facility/add-facility.component';
import { ListFacilitiesComponent } from './facility/list-facilities/list-facilities.component';

const routes: Routes = [
  { path: 'facilities', component: ListFacilitiesComponent },
  {
    path: 'facility/add',
    component: AddFacilityComponent,
    canDeactivate: [CanDeactivateGuardService],
  },
  {
    path: 'facility/edit',
    component: AddFacilityComponent,
    canDeactivate: [CanDeactivateGuardService],
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})

export class FacilityRoutingModule { }
