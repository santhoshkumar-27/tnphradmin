import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddFacilityComponent } from './facility/add-facility/add-facility.component';
import { ListFacilitiesComponent } from './facility/list-facilities/list-facilities.component';
import { AngularMaterialModule } from '../angular_material.module';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FacilityRoutingModule } from './facility-routing.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FacilityService } from './facility/service/facility.service';
import { FacilityBulkEditComponent } from './facility-bulk-edit/facility-bulk-edit.component';
import { IdToNameModule } from '../pipes/idToName.pipe';

@NgModule({
  declarations: [
    AddFacilityComponent,
    ListFacilitiesComponent,
    FacilityBulkEditComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FacilityRoutingModule,
    MatCheckboxModule,
    IdToNameModule,
  ],
  providers: [
    FacilityService,
    
  ]  
})
export class FacilityModule { }
