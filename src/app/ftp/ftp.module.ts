import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FtpComponent } from './ftp/ftp.component';
import { Routes, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../angular_material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CalenderViewComponent } from './calender-view/calender-view.component';
import { FormsModule  } from '@angular/forms';
import { MultiStreetsUiComponent } from './multi-streets-ui/multi-streets-ui.component';

const routes: Routes = [
  {
    path: '',
    component: FtpComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  declarations: [FtpComponent, CalenderViewComponent, MultiStreetsUiComponent],
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class FtpModule {}
