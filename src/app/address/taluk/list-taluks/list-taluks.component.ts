import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Taluk, TalukFilterType } from 'src/app/models/taluk';
import { TalukDataSource } from './taluk.datasource';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';
import { User } from 'src/app/models/user';
import { TalukService } from '../service/taluk.service';
import { AuthService } from 'src/app/starter/services/auth.service';
import { tap } from 'rxjs/operators';
import { exportToExcel } from 'src/app/utils/exportToExcel.util';
import { DistrictMaster } from 'src/app/models/master_district';
import { Subject } from 'rxjs';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { resetFormList } from 'src/app/utils/form-util';

@Component({
  selector: 'app-list-taluks',
  templateUrl: './list-taluks.component.html',
  styleUrls: ['./list-taluks.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListTaluksComponent implements OnInit {
  displayedColumns: string[] = [
    'district',
    'taluk',
    'taluk_gid',
    'isActive',
    'actions',
  ];
  taluk: Taluk;

  dataSource: TalukDataSource;

  filters: TalukFilterType = {
    DISTRICT_ID: null,
    TALUK_NAME: null,
    TALUK_GID: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  // hudList: HudMaster[];
  // filteredHuds: Subject<HudMaster[]> = new Subject();

  user: User;

  taluk_filters: any;
  isExportInProgress: boolean = false;

  constructor(
    private talukService: TalukService,
    private _authService: AuthService,
    private _masterDataService: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    this.dataSource = new TalukDataSource(this.talukService, this._snackBar);

    this.searchPanel = this._formBuilder.group({
      district: [''],
      taluk_name: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      taluk_gid: ['', Validators.pattern('[0-9]*')],
    });

    if (sessionStorage.getItem('taluk_filters'))
      this.taluk_filters = JSON.parse(sessionStorage.getItem('taluk_filters')!);

    if (this.taluk_filters) {
      const { district, taluk_name, taluk_gid } = this.taluk_filters;
      this.searchPanel.patchValue({
        taluk_name: taluk_name ? taluk_name.toLowerCase() : '',
        taluk_gid: taluk_gid || null,
      });
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        TALUK_NAME: taluk_name ? taluk_name.toLowerCase() : '',
        TALUK_GID: taluk_gid || null,
      };
    }
    this.onChanges();
    this.getDistricts();
  }

  onChanges(): void {
    this.searchPanel.get('district')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.district_name?.toLowerCase() || ""
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });
  }

  getDistricts() {
    this._masterDataService
      .getDistrictsList()
      .subscribe((values: Array<any>) => {
        this.districtList = values;

        resetFormList(
          this.searchPanel,
          'district',
          'district_name',
          this.districtList,
          false
        );

        this.searchPanel
          .get('district')
          ?.setValue(
            this.taluk_filters ? this.taluk_filters.district : ''
          );
      });
  }

  ngAfterViewInit() {
    console.log('list-taluk-ngAfterViewInit:', this.paginator);
    //this.paginator.pageSize = 100;
    this.dataSource.loadTaluks(
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
      this.dataSource.loadTaluks(
        this.user,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      )
    );
  }

  addTaluk() {
    sessionStorage.removeItem('EDIT_TALUK');
    this._router.navigateByUrl('/addr/taluks/add');
  }

  editTaluk(taluk: any) {
    sessionStorage.setItem('EDIT_TALUK', JSON.stringify(taluk));
    this._router.navigateByUrl('/addr/taluks/edit');
  }

  getFilteredTalukList() {
    if (this.searchPanel.valid) {
      console.log('list-taluk | getFilteredTalukList()');
      this.isCallInProgress = true;

      let _filters: TalukFilterType = {
        DISTRICT_ID: this.searchPanel.value['district']?.district_id || null,
        TALUK_NAME:
          this.searchPanel.value['taluk_name'] ||
          this.searchPanel.value['taluk_name'] != ''
            ? this.searchPanel.value['taluk_name'].toLowerCase()
            : null,
        TALUK_GID:
          this.searchPanel.value['taluk_gid'] != ''
            ? +this.searchPanel.value['taluk_gid']
            : null,
      };
      console.log('list-taluk | Calling get taluks with Filters: ', _filters);
      this.filters = _filters;

      let obj = {
        district: this.searchPanel.get('district')?.value,
        taluk_name: this.searchPanel.get('taluk_name')?.value,
        taluk_gid: +this.searchPanel.get('taluk_gid')?.value,
      };
      sessionStorage.setItem('taluk_filters', JSON.stringify(obj));

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
    sessionStorage.removeItem('taluk_filters');
    this.taluk_filters = null;
    this.isCallInProgress = true;
    //this.getHudList();
    this.searchPanel.patchValue({
      district: '',
      taluk_name: '',
      taluk_gid: '',
    });
    this.filters = {
      DISTRICT_ID: null,
      TALUK_NAME: null,
      TALUK_GID: null,
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
    this.dataSource.loadTaluks(
      user,
      filters,
      pageIndex,
      pageSize,
      stopCallProgress
    );
  }

  downloadRecords() {
    this.isExportInProgress = true;
    this.talukService
      .getTaluks(this.user, this.filters, 0, this.paginator.length)
      .subscribe(
        async (result: any) => {
          const data = result?.data || [];
          const exportData: any = [];
          for (var i = 0; i < data.length; i++) {
            const elem = data[i];
            const disName: string =
              this.districtList.find((dis) => dis.district_id == elem.district_id[0])
                ?.district_name || '-';
            exportData.push({
              District: disName,
              Taluk: elem.taluk_name,
              Taluk_GID: elem.taluk_gid,
              Active: elem.active,
            });
          }
          this.isExportInProgress = false;
          console.log('talukss export data', exportData);
          exportToExcel(exportData, 'Taluks.xlsx');
        },
        (error) => {
          this.isExportInProgress = false;
          console.log('Failed to export data.');
          this._snackBar.open('Export failed.', 'Dismiss', {
            duration: 4000,
          });
        }
      );
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

}
