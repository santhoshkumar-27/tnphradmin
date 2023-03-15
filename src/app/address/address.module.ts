import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../angular_material.module';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ListShopsComponent } from './shop/list-shops/list-shops.component';
import { AddShopComponent } from './shop/add-shop/add-shop.component';
import { EditShopComponent } from './shop/edit-shop/edit-shop.component';
import { AddressRoutingModule } from './address-routing.module';
import { ShopService } from './shop/service/shop.service';
import { ListStreetsComponent } from './street/list-streets/list-streets.component';
import { AddStreetComponent } from './street/add-street/add-street.component';
import { StreetService } from './street/service/street.service';
import { VillageService } from './village/service/village.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { StreetBulkEditDialogComponent } from './street/street-bulk-edit-dialog/street-bulk-edit-dialog.component';
import { ListVillagesComponent } from './village/list-villages/list-villages.component';
import { AddVillageComponent } from './village/add-village/add-village.component';
import { BlockService } from './block/service/block.service';
import { ListBlocksComponent } from './block/list-blocks/list-blocks.component';
import { AddBlockComponent } from './block/add-block/add-block.component';
import { ShopBulkEditComponent } from './shop/shop-bulk-edit/shop-bulk-edit.component';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { AddHudComponent } from './hud/add-hud/add-hud.component';
import { ListHudsComponent } from './hud/list-huds/list-huds.component';
import { ListDistrictsComponent } from './district/list-districts/list-districts.component';
import { AddDistrictComponent } from './district/add-district/add-district.component';
import { DistrictService } from './district/service/district.service';
import { ListTaluksComponent } from './taluk/list-taluks/list-taluks.component';
import { AddTalukComponent } from './taluk/add-taluk/add-taluk.component';
import { TalukService } from './taluk/service/taluk.service';
import { AddHabitationComponent } from './habitation/add-habitation/add-habitation.component';
import { ListHabitationComponent } from './habitation/list-habitation/list-habitation.component';
import { AddRevenueVillageComponent } from './revenueVillage/add-revenue-village/add-revenue-village.component';
import { ListRevenueVillageComponent } from './revenueVillage/list-revenue-village/list-revenue-village.component';
import { IdToNameModule } from '../pipes/idToName.pipe';

@NgModule({
  declarations: [
    ListShopsComponent,
    AddShopComponent,
    EditShopComponent,
    ListStreetsComponent,
    AddStreetComponent,
    StreetBulkEditDialogComponent,
    ListVillagesComponent,
    AddVillageComponent,
    ListBlocksComponent,
    AddBlockComponent,
    ShopBulkEditComponent,
    ConfirmationModalComponent,
    AddHudComponent,
    ListHudsComponent,
    ListDistrictsComponent,
    AddDistrictComponent,
    ListTaluksComponent,
    AddTalukComponent,
    AddHabitationComponent,
    ListHabitationComponent,
    AddRevenueVillageComponent,
    ListRevenueVillageComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    AddressRoutingModule,
    MatCheckboxModule,
    IdToNameModule,
  ],
  providers: [
    ShopService,
    StreetService,
    VillageService,
    BlockService,
    DistrictService,
    TalukService,
  ]    
})
export class AddressModule { }
