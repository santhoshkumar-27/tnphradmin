import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { District, DistrictFilterType } from 'src/app/models/district';
import { DistrictDataSource } from './district.datasource';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';
import { User } from 'src/app/models/user';
import { DistrictService } from '../service/district.service';
import { AuthService } from 'src/app/starter/services/auth.service';
import { tap } from 'rxjs/operators';
import { exportToExcel } from 'src/app/utils/exportToExcel.util';
import { isBlockAdmin, isDistrictAdmin } from 'src/app/utils/session.util';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { DistrictMaster } from 'src/app/models/master_district';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-list-districts',
  templateUrl: './list-districts.component.html',
  styleUrls: ['./list-districts.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListDistrictsComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'district',
    'district_gid',
    'isActive',
    'actions',
  ];
  district: District;

  dataSource: DistrictDataSource;

  filters: DistrictFilterType = {
    DISTRICT_NAME: null,
    DISTRICT_GID: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;
  //blockTypes: any = Constants.BLOCK_TYPE;

  // districtList: DistrictMaster[];
  // filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  // hudList: HudMaster[];
  // filteredHuds: Subject<HudMaster[]> = new Subject();

  user: User;

  district_filters: any;
  isExportInProgress: boolean = false;
  street_filter: any;
  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  constructor(
    private districtService: DistrictService,
    private _authService: AuthService,
    //private _dataservice: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _snackBar: MatSnackBar,
    private _masterDataService: MasterDataService,
  ) { }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    this.dataSource = new DistrictDataSource(this.districtService, this._snackBar);

    this.searchPanel = this._formBuilder.group({
      district_name: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      district_gid: ['', Validators.pattern('[0-9]*')],
    });

    if (sessionStorage.getItem("district_filters"))
      this.district_filters = JSON.parse(sessionStorage.getItem("district_filters")!);

    if (this.district_filters) {
      const {
        district_name,
        district_gid,
      } = this.district_filters;
      this.searchPanel.patchValue({
        district_name: district_name ? district_name.toLowerCase() : '',
        district_gid: district_gid || null,
      });
      this.filters = {
        DISTRICT_NAME: district_name ? district_name.toLowerCase() : '',
        DISTRICT_GID: district_gid || null
      }
    }

    // this.getDistrictList();
    // this.getHudList();
    // this.onChanges();
    if (sessionStorage.getItem('street_filters'))
      this.street_filter = JSON.parse(
        sessionStorage.getItem('street_filters')!
      );
    this.getDistrictList();
    this.onChanges();
  }

  ngAfterViewInit() {
    console.log('list-district-ngAfterViewInit:', this.paginator);
    //this.paginator.pageSize = 100;
    this.dataSource.loadDistricts(
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
    this.paginator.page
      .subscribe(
        () =>
          this.dataSource.loadDistricts(
            this.user,
            this.filters,
            this.paginator.pageIndex,
            this.paginator.pageSize
          )
      );
  }

  addDistrict() {
    sessionStorage.removeItem('EDIT_DISTRICT');
    this._router.navigateByUrl('/addr/districts/add');
  }

  editDistrict(district: any) {
    sessionStorage.setItem('EDIT_DISTRICT', JSON.stringify(district));
    this._router.navigateByUrl('/addr/districts/edit');
  }

  getFilteredDistrictList() {
    if (this.searchPanel.valid) {
      console.log('list-district | getFilteredDistrictList()');
      this.isCallInProgress = true;

      let _filters: DistrictFilterType = {
        DISTRICT_NAME:
          this.searchPanel.value['district_name'] ||
            this.searchPanel.value['district_name'] != ''
            ? this.searchPanel.value['district_name']['district_name'].toLowerCase()
            : null,
        DISTRICT_GID:
          this.searchPanel.value['district_gid'] != ''
            ? +this.searchPanel.value['district_gid']
            : null,
      };
      console.log('list-district | Calling get districts with Filters: ', _filters);
      this.filters = _filters;

      let obj = {
        district_name: this.searchPanel.get('district_name')?.value,
        district_gid: +this.searchPanel.get('district_gid')?.value,
      }
      sessionStorage.setItem("district_filters", JSON.stringify(obj));

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
    sessionStorage.removeItem("district_filters");
    this.district_filters = null;
    this.isCallInProgress = true;
    //this.getHudList();
    this.searchPanel.patchValue({
      district_name: '',
      district_gid: '',
    });
    this.filters = {
      DISTRICT_NAME: null,
      DISTRICT_GID: null,
    };
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
    this.dataSource.loadDistricts(
      user,
      filters,
      pageIndex,
      pageSize,
      stopCallProgress
    );
  }

  downloadRecords() {
    this.isExportInProgress = true;
    this.districtService
      .getDistricts(this.user, this.filters, 0, this.paginator.length)
      .subscribe(async (result: any) => {
        const data = result?.data || [];
        const exportData: any = [];
        for (var i = 0; i < data.length; i++) {
          const elem = data[i];
          exportData.push({
            District: elem.district_name,
            District_GID: elem.district_gid,
            Status: elem.active ? 'Active' : 'Inactive',
            Active: elem.active,
          });
        }
        this.isExportInProgress = false;
        console.log('districts export data', exportData);
        exportToExcel(exportData, 'Districts.xlsx');
      }, (error) => {
        this.isExportInProgress = false;
        console.log('Failed to export data.');
        this._snackBar.open('Export failed.', 'Dismiss', {
          duration: 4000,
        });
      });
      
  }
  getDistrictList() {
    this._masterDataService.getDistrictsList().subscribe((districts: any) => {
      this.districtList = districts;
      let disField = this.searchPanel.get('district_name');
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
  onChanges() {
    this.searchPanel.get('district_name')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.district_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((dis: any) =>
        dis.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });
  }
  displayDistrictFn(district?: any) {
    return district ? district.district_name : '';
  }
}
