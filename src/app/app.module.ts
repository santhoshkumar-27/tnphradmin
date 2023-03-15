import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from './angular_material.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutModule } from './layout/layout.module';
import { StarterModule } from './starter/starter.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthService } from './starter/services/auth.service';
import { AdminGuardService, AuthGuardService } from './starter/services/auth-guard.service';
import { UsersModule } from './users/users.module';
import { AddressModule } from './address/address.module';
import { FacilityModule } from './facility/facility.module';
import { MomentDateModule } from '@angular/material-moment-adapter';
import { UtilService } from './services/util.service';
import { NavigationModule } from './navigation/navigation.module';
import { EntityService } from './services/entity.service';
import { GlobalInterceptor } from './shared/Interceptor/global.interceptor';


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    RouterModule,
    HttpClientModule,

    FormsModule, 
    ReactiveFormsModule,
    FlexLayoutModule,

    AngularMaterialModule,

    LayoutModule,
    StarterModule,
    UsersModule,
    AddressModule,
    MomentDateModule,
    FacilityModule,
    NavigationModule
  ],
  providers: [
    AuthService,
    AuthGuardService,
    AdminGuardService,
    UtilService,
    EntityService,
    { provide: HTTP_INTERCEPTORS, useClass: GlobalInterceptor, multi: true } 
  ],
  bootstrap: [AppComponent],
  schemas:[
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AppModule { }
