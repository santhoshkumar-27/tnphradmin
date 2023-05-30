import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { tap } from 'rxjs/internal/operators/tap';
import { Subject } from 'rxjs/internal/Subject';
import { DistrictMaster } from 'src/app/models/master_district';
import { TalukMaster } from 'src/app/models/master_taluk';
import { RevenueVillage, RevenueVillageFilters } from 'src/app/models/revenue-village';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { exportToExcel } from 'src/app/utils/exportToExcel.util';
import { disableEdit } from 'src/app/utils/unallocated.util';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { RevenueVillageService } from '../service/revenue-village.service';
import { RevenueVillageDataSource } from './revenue-village.datasource';
import { isBlockAdmin, isDistrictAdmin } from 'src/app/utils/session.util';

@Component({
  selector: 'app-list-revenue-village',
  templateUrl: './list-revenue-village.component.html',
  styleUrls: ['./list-revenue-village.component.scss'],
})
export class ListRevenueVillageComponent implements OnInit {
  displayedColumns: string[] = [
    'district',
    'taluk',
    'revenue_village',
    'isActive',
    'actions',
  ];
  dataSource: RevenueVillageDataSource;
  filters: RevenueVillageFilters = {
    DISTRICT_ID: null,
    TALUK_ID: null,
    REV_VILLAGE_NAME: null,
    REV_VILLAGE_GID: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;

  user: User;
  rev_village_filters: any;
  isExportInProgress: boolean = false;

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  talukList: TalukMaster[];
  filteredTaluks: Subject<TalukMaster[]> = new Subject();
  constructor(
    private revVillageService: RevenueVillageService,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    this.dataSource = new RevenueVillageDataSource(this.revVillageService, this._snackBar);

    this.searchPanel = this._formBuilder.group({
      district: ['', Validators.pattern('[0-9a-zA-Z .!()_-]*')],
      taluk: ['', Validators.pattern('[0-9a-zA-Z .!()_-]*')],
      rev_village_name: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      rev_village_gid: ['', Validators.pattern('[0-9]*')],
    });

    if (sessionStorage.getItem('rev_village_filters')) {
      this.rev_village_filters = JSON.parse(
        sessionStorage.getItem('rev_village_filters')!
      );
      const { rev_village_name, rev_village_gid, district, taluk } =
        this.rev_village_filters;
      this.searchPanel.patchValue({
        rev_village_name: rev_village_name
          ? rev_village_name.toLowerCase()
          : '',
        rev_village_gid: rev_village_gid || null,
      });
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        TALUK_ID: taluk?.taluk_id || null,
        REV_VILLAGE_NAME: rev_village_name
          ? rev_village_name.toLowerCase()
          : '',
        REV_VILLAGE_GID: rev_village_gid || null,
      };
    }
    this.getDistrictList();
    this.getTalukList();
    this.onChanges();
  }

  getDistrictList() {
    this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
      console.log('List rev village | district list:', values);
      // This feature applicable only for state admin
      this.districtList = values;
      let disField = this.searchPanel.get('district');
      // this.searchPanel
      //   .get('district')
      //   ?.addValidators([
      //     optionObjectObjectValidator(this.districtList, 'district_name'),
      //   ]);
      // this.searchPanel
      //   .get('district')
      //   ?.setValue(
      //     this.rev_village_filters?.district
      //       ? this.rev_village_filters.district
      //       : ''
      //   );
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
          this.rev_village_filters?.district ? this.rev_village_filters.district : ''
        );
      }
    });
  }

  getTalukList() {
    this._dataservice.getTalukList().subscribe((values: Array<any>) => {
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

  onChanges(): void {
    console.log('List rev village | onChange()');

    this.searchPanel.get('district')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.district_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
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

  ngAfterViewInit() {
    //this.paginator.pageSize = 100;
    this.dataSource.loadRevenueVillages(
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
      this.dataSource.loadRevenueVillages(
        this.user,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      )
    );
  }

  addRevVillage() {
    sessionStorage.removeItem('EDIT_REV_VILLAGE');
    this._router.navigateByUrl('/addr/revenue_village/add');
  }

  editRevVillage(revVillage: any) {
    sessionStorage.setItem('EDIT_REV_VILLAGE', JSON.stringify(revVillage));
    this._router.navigateByUrl('/addr/revenue_village/edit');
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

  getFilteredRevVillageList() {
    if (this.searchPanel.valid) {
      this.isCallInProgress = true;

      let _filters: RevenueVillageFilters = {
        DISTRICT_ID:
          // this.searchPanel.get('district')?.value ||
          // this.searchPanel.get('district')?.value != ''
          //   ? this.searchPanel.get('district')?.value.district_id
          //   : null,
          this.searchPanel.get('district')?.value?.district_id || null,
        TALUK_ID:
          this.searchPanel.get('taluk')?.value ||
            this.searchPanel.get('taluk')?.value != ''
            ? this.searchPanel.get('taluk')?.value.taluk_id
            : null,
        REV_VILLAGE_NAME:
          this.searchPanel.value['rev_village_name']?.toLowerCase() || null,
        REV_VILLAGE_GID:
          this.searchPanel.value['rev_village_gid'] != ''
            ? +this.searchPanel.value['rev_village_gid']
            : null,
      };
      this.filters = _filters;
      let obj = {
        district: this.searchPanel.get('district')?.value,
        taluk: this.searchPanel.get('taluk')?.value,
        rev_village_name: this.searchPanel.get('rev_village_name')?.value,
        rev_village_gid: +this.searchPanel.get('rev_village_gid')?.value,
      };
      sessionStorage.setItem('rev_village_filters', JSON.stringify(obj));

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
    sessionStorage.removeItem('rev_village_filters');
    this.rev_village_filters = null;
    this.isCallInProgress = true;
    this.getTalukList();
    this.searchPanel.patchValue({
      district: '',
      taluk: '',
      rev_village_name: '',
      rev_village_gid: '',
    });
    this.filters = {
      DISTRICT_ID: null,
      TALUK_ID: null,
      REV_VILLAGE_NAME: null,
      REV_VILLAGE_GID: null,
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
    this.dataSource.loadRevenueVillages(
      user,
      filters,
      pageIndex,
      pageSize,
      stopCallProgress
    );
  }

  displayDistrictFn(district?: any) {
    return district ? district.district_name : '';
  }

  displayTalukFn(taluk: any) {
    return taluk ? taluk.taluk_name : '';
  }

  downloadRecords() {
    this.isExportInProgress = true;
    this.revVillageService
      .getRevenueVillages(this.user, this.filters, 0, this.paginator.length)
      .subscribe(
        async (result: any) => {
          const data = result?.data || [];
          const exportData: any = [];
          for (var i = 0; i < data.length; i++) {
            const elem = data[i];
            exportData.push({
              District: elem.district_name,
              Taluk: elem.taluk_name,
              Revenue_Village: elem.rev_village_name,
              rev_village_gid: elem.rev_village_gid,
              Active: elem.active,
            });
          }
          this.isExportInProgress = false;
          console.log('rev village export data', exportData);
          exportToExcel(exportData, 'Revenue_Village.xlsx');
        },
        (error) => {
          this.isExportInProgress = false;
          console.log('Failed to export data.');
        }
      );
  }

  disableEdit(data: RevenueVillage): boolean {
    return disableEdit(data?.rev_village_name);
  }

}
