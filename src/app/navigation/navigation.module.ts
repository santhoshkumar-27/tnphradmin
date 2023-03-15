import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationConfirmModalComponent } from './navigation-confirm-modal/navigation-confirm-modal.component';
import { AngularMaterialModule } from '../angular_material.module';

@NgModule({
  declarations: [NavigationConfirmModalComponent],
  imports: [CommonModule, AngularMaterialModule],
})
export class NavigationModule {}
