import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';
import { AddShopComponent } from './shop/add-shop/add-shop.component';
import { ListShopsComponent } from './shop/list-shops/list-shops.component';
import { AddStreetComponent } from './street/add-street/add-street.component';
import { ListStreetsComponent } from './street/list-streets/list-streets.component';
import { ListVillagesComponent } from './village/list-villages/list-villages.component';
import { AddVillageComponent } from './village/add-village/add-village.component';

import { AuthorizeAddressGuard } from './guards/authorize-address.guard';
import { ListBlocksComponent } from './block/list-blocks/list-blocks.component';
import { AddBlockComponent } from './block/add-block/add-block.component';
import { AuthorizeNhmGuard } from './guards/authorize-nhm.guard';
import { CanDeactivateGuardService } from '../navigation/services/can-deactivate-guard.service';
import { ListHudsComponent } from './hud/list-huds/list-huds.component';
import { AddHudComponent } from './hud/add-hud/add-hud.component';
import { ListDistrictsComponent } from './district/list-districts/list-districts.component';
import { AddDistrictComponent } from './district/add-district/add-district.component';
import { ListTaluksComponent } from './taluk/list-taluks/list-taluks.component';
import { AddTalukComponent } from './taluk/add-taluk/add-taluk.component';
import { ListHabitationComponent } from './habitation/list-habitation/list-habitation.component';
import { AddHabitationComponent } from './habitation/add-habitation/add-habitation.component';
import { ListRevenueVillageComponent } from './revenueVillage/list-revenue-village/list-revenue-village.component';
import { AddRevenueVillageComponent } from './revenueVillage/add-revenue-village/add-revenue-village.component';

const routes: Routes = [
  {
    path: 'shops',
    component: ListShopsComponent,
    canActivate: [AuthorizeAddressGuard],
  },
  {
    path: 'shop/add',
    component: AddShopComponent,
    canActivate: [AuthorizeAddressGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  {
    path: 'shop/edit',
    component: AddShopComponent,
    canActivate: [AuthorizeAddressGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  {
    path: 'streets',
    component: ListStreetsComponent,
    canActivate: [AuthorizeAddressGuard],
  },
  {
    path: 'street/add',
    component: AddStreetComponent,
    canActivate: [AuthorizeAddressGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  {
    path: 'street/edit',
    component: AddStreetComponent,
    canActivate: [AuthorizeAddressGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'districts', 
    component: ListDistrictsComponent, 
    canActivate: [AuthorizeNhmGuard],
  },
  { 
    path: 'districts/add', 
    component: AddDistrictComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'districts/edit',
    component: AddDistrictComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'blocks', 
    component: ListBlocksComponent, 
    canActivate: [AuthorizeNhmGuard],
  },
  { 
    path: 'blocks/add', 
    component: AddBlockComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'blocks/edit', 
    component: AddBlockComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'habitations', 
    component: ListHabitationComponent, 
    canActivate: [AuthorizeNhmGuard],
  },
  { 
    path: 'habitations/add', 
    component: AddHabitationComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'habitations/edit', 
    component: AddHabitationComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'taluks', 
    component: ListTaluksComponent, 
    canActivate: [AuthorizeNhmGuard],
  },
  { 
    path: 'taluks/add', 
    component: AddTalukComponent,
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'taluks/edit',
    component: AddTalukComponent,
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'revenue_village', 
    component: ListRevenueVillageComponent, 
    canActivate: [AuthorizeNhmGuard],
  },
  { 
    path: 'revenue_village/add', 
    component: AddRevenueVillageComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'revenue_village/edit', 
    component: AddRevenueVillageComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'hud', 
    component: ListHudsComponent, 
    canActivate: [AuthorizeNhmGuard],
  },
  { 
    path: 'hud/add', 
    component: AddHudComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'hud/edit', 
    component: AddHudComponent, 
    canActivate: [AuthorizeNhmGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'villages', 
    component: ListVillagesComponent, 
    canActivate: [AuthorizeAddressGuard]
  },
  { 
    path: 'village/add', 
    component: AddVillageComponent, 
    canActivate: [AuthorizeAddressGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  { 
    path: 'village/edit', 
    component: AddVillageComponent, 
    canActivate: [AuthorizeAddressGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
]; 

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})

export class AddressRoutingModule { }
