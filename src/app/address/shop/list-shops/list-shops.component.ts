import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
//import { MatPaginator } from '@angular/material/paginator';
//import { MatPaginator } from '@angular/material';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';

import { Shop } from '../../../models/shop';
import { ShopService } from '../service/shop.service';
import { ShopDataSource } from './shop.datasource';
import { exportToExcel } from '../../../utils/exportToExcel.util';
import { isBlockAdmin, isDistrictAdmin } from 'src/app/utils/session.util';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { ShopBulkEditComponent } from '../shop-bulk-edit/shop-bulk-edit.component';
import { disableEdit } from 'src/app/utils/unallocated.util';
import { Subject } from 'rxjs';
import { DistrictMaster } from 'src/app/models/master_district';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { TalukMaster } from 'src/app/models/master_taluk';
import { RevenueVillageService } from '../../revenueVillage/service/revenue-village.service';

@Component({
  selector: 'app-list-shops',
  templateUrl: './list-shops.component.html',
  styleUrls: ['./list-shops.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListShopsComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = [
    'select',
    'district',
    'taluk',
    'village',
    'shop_name',
    'shop_code',
    'street_name',
    'isActive',
    'actions',
  ];
  shop: Shop;
  dataSource: ShopDataSource;
  filters = {
    DISTRICT: null,
    TALUK: null,
    SHOP_NAME: null,
    SHOP_CODE: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;

  user: User;

  selection = new SelectionModel<any>(true, []);

  isExportInProgress: boolean = false;
  street_filter: any;
  rev_village_filters: any;
  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();
  
  talukList: TalukMaster[];
  filteredTaluks: Subject<TalukMaster[]> = new Subject();
  constructor(
    private shopService: ShopService,
    private _authService: AuthService,
    private revVillageService: RevenueVillageService,
    private _masterDataService: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    this.dataSource = new ShopDataSource(this.shopService);

    this.searchPanel = this._formBuilder.group({
      district: ['', Validators.pattern('[0-9a-zA-Z .!()_-]*')],
      taluk: ['', Validators.pattern('[a-zA-Z !()-]*')],
      shop_name: ['', Validators.pattern('[0-9a-zA-Z .!()-]*')],
      shop_code: ['', Validators.pattern('[0-9A-z]*')],
    });

    let shop_filters: any = sessionStorage.getItem('shop_filters');
    if (shop_filters) {
      shop_filters = JSON.parse(shop_filters);
      const { DISTRICT, TALUK, SHOP_NAME, SHOP_CODE } = shop_filters;
      this.filters = {
        DISTRICT: DISTRICT,
        TALUK: TALUK,
        SHOP_NAME: SHOP_NAME,
        SHOP_CODE: SHOP_CODE,
      };
      this.searchPanel.patchValue({
        district: DISTRICT,
        taluk: TALUK,
        shop_name: SHOP_NAME,
        shop_code: SHOP_CODE,
      });
    }

    if (this.user && isBlockAdmin(this.user)) {
      let userDistrictId: any = this.user.district_id;
      this.shopService.getDistrictName(userDistrictId).then((disName: any) => {
        this.searchPanel.get('district')?.setValue(disName);
        this.searchPanel.get('district')?.disable();
      });
    }
    if (sessionStorage.getItem('street_filters'))
      this.street_filter = JSON.parse(sessionStorage.getItem('street_filters')!);
    if (sessionStorage.getItem('rev_village_filters')) {
      this.rev_village_filters = JSON.parse(
        sessionStorage.getItem('rev_village_filters')!
      );
    }
    this.getDistrictList();
    this.getTalukList();
    this.onChanges();
  }
  getDistrictList() {
    this._masterDataService.getDistrictsList().subscribe((districts: any) => {
      this.districtList = districts;
      let disField = this.searchPanel.get('district');
      if (isDistrictAdmin(this.user) || isBlockAdmin(this.user)) {
        let userDistrictObj = this.districtList.find(
          (el: any) => el.district_id == this.user.district_id
        );
        disField?.setValue(userDistrictObj);
        disField?.disable();
      } else {
        disField?.setValidators([
          optionObjectObjectValidator(this.districtList, 'district_name'),
        ]);
        disField?.setValue(
          this.street_filter?.district ? this.street_filter.district : ''
        );
      }
    });
  }
  getTalukList() {
    this._masterDataService.getTalukList().subscribe((values: Array<any>) => {
      console.log('List rev village | taluk list:', values);
      this.talukList = values;
      if (this.rev_village_filters?.district) {
        this.talukList = values.filter(
          (el: any) => el.district_id == this.rev_village_filters.district.district_id
        );
      }
      this.searchPanel
        .get('taluk')
        ?.addValidators([
          optionObjectObjectValidator(this.talukList, 'taluk_name'),
        ]);
      this.searchPanel
        .get('taluk')
        ?.setValue(
          this.rev_village_filters?.taluk ? this.rev_village_filters.taluk : ''
        );
    });
  }
  onChanges() {
    this.searchPanel.get('district')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.district_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((dis: any) =>
        dis.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });

    this.searchPanel.get('taluk')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.taluk_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.talukList.filter((taluk: any) =>
        taluk.taluk_name.toLowerCase().includes(filterValue)
      );
      this.filteredTaluks.next(filteredOne);
    });
  }
  displayDistrictFn(district?: any) {
    return district ? district.district_name : '';
  }
  displayTalukFn(taluk: any) {
    return taluk ? taluk.taluk_name : '';
  }
  async onDistrictBlur() {
    if (
      this.searchPanel.get('district')?.value &&
      this.searchPanel.get('district')?.valid
    ) {
      let selectedDistrict = this.searchPanel.get('district')?.value;
      this.talukList = await this.revVillageService.getTalukListperDistrict(
        selectedDistrict.district_id
      );
    } else {
      console.log('selected district is empty');
      this.talukList = await this.revVillageService.getTalukList();
    }
    this.searchPanel.get('taluk')?.clearValidators();
    this.searchPanel
      .get('taluk')
      ?.addValidators([
        optionObjectObjectValidator(this.talukList, 'taluk_name'),
      ]);
    this.searchPanel.get('taluk')?.updateValueAndValidity();
    this.searchPanel.get('taluk')?.setValue('');
  }
  ngAfterViewInit() {
    console.log('list-shop-ngAfterViewInit:', this.paginator);
    //this.paginator.pageSize = 100;
    this.dataSource.loadShops(
      this.user,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
    this.dataSource.counter$
      .pipe(
        tap((count) => {
          this.paginator.length = count;
        })
      )
      .subscribe();
    // when paginator event is invoked, retrieve the related data
    this.paginator.page.subscribe(() =>
      this.dataSource.loadShops(
        this.user,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      )
    );
  }

  editShop(shop: any) {
    //console.log("In Edit User " + product);
    sessionStorage.setItem('EDIT_SHOP', JSON.stringify(shop));
    this._router.navigateByUrl('/addr/shop/edit');
  }

  addShop() {
    sessionStorage.removeItem('EDIT_SHOP');
    this._router.navigateByUrl('/addr/shop/add');
  }

  getFilteredShopList() {
    // removing the selection for bulk edit
    this.selection.selected.forEach((id: any) => this.selection.deselect(id));
    if (this.searchPanel.valid) {
      console.log('getFilteredShopList()');
      this.isCallInProgress = true;
      // using get method in district bcoz district field can be in disable mode
      let _filters = {
        DISTRICT: this.searchPanel.get('district')?.value
          ? this.searchPanel.get('district')?.value.district_name.toLowerCase()
          : null,
        TALUK: this.searchPanel.value['taluk']
          ? this.searchPanel.value['taluk']['taluk_name'].toLowerCase()
          : null,
        SHOP_NAME: this.searchPanel.value['shop_name']
          ? this.searchPanel.value['shop_name'].toLowerCase()
          : null,
        SHOP_CODE: this.searchPanel.value['shop_code']
          ? this.searchPanel.value['shop_code'].toLowerCase()
          : null,
      };
      console.log('Calling get Usser with Filters: ', _filters);
      this.filters = _filters;
      sessionStorage.setItem('shop_filters', JSON.stringify(this.filters));
      this.paginator.pageIndex = 0;
      this.loadRecords(
        this.user,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      );
    }
  }

  clearSearchFields() {
    this.isCallInProgress = true;
    this.searchPanel.patchValue({
      district: '',
      taluk: '',
      shop_name: '',
      shop_code: '',
    });

    if (this.user && isBlockAdmin(this.user)) {
      let userDistrictId: any = this.user.district_id;
      this.shopService.getDistrictName(userDistrictId).then((disName: any) => {
        this.searchPanel.get('district')?.setValue(disName);
        this.searchPanel.get('district')?.disable();
      });
    }

    this.filters = {
      DISTRICT: null,
      TALUK: null,
      SHOP_NAME: null,
      SHOP_CODE: null,
    };
    // removing the selection for bulk edit
    this.selection.selected.forEach((id: any) => this.selection.deselect(id));

    sessionStorage.removeItem('shop_filters');

    this.paginator.pageIndex = 0;
    this.loadRecords(
      this.user,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  loadRecords(user: User, filters: any, pageIndex: number, pageSize: number) {
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };
    this.dataSource.loadShops(
      user,
      filters,
      pageIndex,
      pageSize,
      stopCallProgress
    );
  }

  async createExportData(data: any) {
    const exportData: any = [];
    for (var i = 0; i < data.length; i++) {
      const elem = data[i];
      const revVillage = elem.rev_village_id
        ? await this.shopService.getRevVillageName(elem.rev_village_id)
        : null;
      exportData.push({
        District: elem.district || '-',
        Taluk: elem.taluk || '-',
        Village: elem.village || '-',
        'Revenue Village': revVillage || '-',
        'Shop Name': elem.shop_name || '-',
        'Shop Code': elem.shop_code || '-',
        'Street Name': elem.street_name || '-',
        'Created On': elem?.date_created
          ? new Date(elem.date_created)?.toLocaleDateString()
          : '-',
        'Last Updated': elem?.last_update_date
          ? new Date(elem.last_update_date)?.toLocaleDateString()
          : '-',
        Active: elem.active || '-',
      });
    }
    this.isExportInProgress = false;
    console.log('shop export data', exportData);
    exportToExcel(exportData, 'Shops.xlsx');
  }

  total_records: any = [];

  downloadRecords(pageInd = 0) {
    this.isExportInProgress = true;
    this.shopService
      .getShops(this.user, this.filters, pageInd, 20000)
      .subscribe(async (result: any) => {
        const data = result?.data || [];
        this.total_records.push(...data);
        if (result?.status == 'SUCCESS-CONTINUE') {
          this.downloadRecords(++pageInd);
        }
        if (result?.status == 'SUCCESS-FINAL') {
          this.createExportData(this.total_records);
        }
      });
  }

  isAllSelected() {
    const selectedRecords = this.selection.selected;
    let records: any = this.dataSource.shopsSubject.value;
    //removing unallocated items from the list
    records = records.filter(
      (elem) => !elem?.shop_name?.toLowerCase().includes('unallocated')
    );
    return !records.some((el) => selectedRecords.indexOf(el.shop_id) == -1);
  }

  masterToggle() {
    let shops = this.dataSource.shopsSubject.value;
    //removing unallocated items from the list
    shops = shops.filter(
      (elem) => !elem?.shop_name?.toLowerCase().includes('unallocated')
    );
    this.isAllSelected()
      ? shops.forEach((shop) => this.selection.deselect(shop.shop_id))
      : shops.forEach((shop) => this.selection.select(shop.shop_id));
  }

  disableMasterToggle() {
    // disable master checkbox when all records are having unallocated name
    const shops = this.dataSource.shopsSubject.value;
    return shops?.every((shop) =>
      shop?.shop_name?.toLowerCase().includes('unallocated')
    );
  }

  bulkEdit() {
    console.log(this.selection.selected);
    const dialogRef = this.dialog.open(ShopBulkEditComponent, {
      data: {
        shopIds: this.selection.selected,
      },
      width: '500px',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('dialog close', result);
      this.selection.selected.forEach((id: any) => this.selection.deselect(id));
      if (result) {
        //this.paginator.pageIndex = 0;
        this.loadRecords(
          this.user,
          this.filters,
          this.paginator.pageIndex,
          this.paginator.pageSize
        );
      }
    });
  }

  disableEdit(data: any): boolean {
    return disableEdit(data?.shop_name);
  }
}
