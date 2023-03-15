import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TopbarComponent } from './topbar/topbar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { SidenavComponent } from './sidenav/sidenav.component';
import { ContentComponent } from './content/content.component';
import { AngularMaterialModule } from '../angular_material.module';

@NgModule({
  declarations: [
    TopbarComponent,
    SidenavComponent,
    ContentComponent
  ],
  imports: [
    CommonModule,
    RouterModule,

    FormsModule, 
    ReactiveFormsModule,
    FlexLayoutModule,

    AngularMaterialModule,
  ],
  exports: [
    TopbarComponent,
    SidenavComponent,
    ContentComponent
  ]
})
export class LayoutModule { }
