import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { exportToExcel } from '../../../utils/exportToExcel.util';
import { DistrictMaster } from 'src/app/models/master_district';
import { HudDataSource } from './hud.datasource';
import { HUD, HUD_FILTERS } from 'src/app/models/hud';
import { HudService } from '../service/hud.service';
import { disableEdit } from 'src/app/utils/unallocated.util';

@Component({
  selector: 'app-list-huds',
  templateUrl: './list-huds.component.html',
  styleUrls: ['./list-huds.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListHudsComponent implements OnInit {
  displayedColumns: string[] = ['district', 'hud', 'isActive', 'actions'];
  dataSource: HudDataSource;
  filters: HUD_FILTERS = {
    DISTRICT_ID: null,
    HUD_NAME: null,
    HUD_GID: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  currentUser: User;

  hud_filters: any;

  isExportInProgress: boolean = false;

  constructor(
    private hudService: HudService,
    private _authService: AuthService,
    private _masterDataService: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.dataSource = new HudDataSource(this.hudService);

    this.searchPanel = this._formBuilder.group({
      district: ['', Validators.pattern('[0-9a-zA-Z .!()_-]*')],
      hud_name: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      hud_gid: ['', Validators.pattern('[0-9]*')],
    });

    if (sessionStorage.getItem('hud_filters')) {
      this.hud_filters = JSON.parse(sessionStorage.getItem('hud_filters')!);

      const { district, hudName, hudGid } = this.hud_filters;
      this.searchPanel.patchValue({
        hud_name: hudName,
        hud_gid: hudGid,
      });
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        HUD_GID: hudGid || null,
        HUD_NAME: hudName?.toLowerCase() || null,
      };
    }

    this.getDistrictList();
    this.onChanges();
  }

  getDistrictList() {
    // hud mgmt is available only for state admin
    this._masterDataService.getDistrictsList().subscribe((districts: any) => {
      this.districtList = districts;
      let disField = this.searchPanel.get('district');
      disField?.setValidators([
        optionObjectObjectValidator(this.districtList, 'district_name'),
      ]);
      disField?.setValue(
        this.hud_filters?.district ? this.hud_filters.district : ''
      );
    });
  }

  onChanges(): void {
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
  }

  ngAfterViewInit() {
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };
    // Show loading icon.
    setTimeout(() => {
      this.isCallInProgress = true;
    }, 0);
    this.dataSource.loadHuds(
      this.currentUser,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize,
      stopCallProgress
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
      this.dataSource.loadHuds(
        this.currentUser,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      )
    );
  }

  editHud(hud: HUD) {
    sessionStorage.setItem('EDIT_HUD', JSON.stringify(hud));
    this._router.navigateByUrl('/addr/hud/edit');
  }

  addHud() {
    sessionStorage.removeItem('EDIT_HUD');
    this._router.navigateByUrl('/addr/hud/add');
  }

  getFilteredHudList() {
    if (this.searchPanel.valid) {
      this.isCallInProgress = true;

      let _filters: HUD_FILTERS = {
        DISTRICT_ID:
          this.searchPanel.get('district')?.value ||
          this.searchPanel.get('district')?.value != ''
            ? this.searchPanel.get('district')?.value.district_id
            : null,
        HUD_NAME:
          this.searchPanel.value['hud_name'] ||
          this.searchPanel.value['hud_name'] != ''
            ? this.searchPanel.value['hud_name'].toLowerCase()
            : null,
        HUD_GID:
          this.searchPanel.value['hud_gid'] != ''
            ? +this.searchPanel.value['hud_gid']
            : null,
      };

      this.filters = _filters;

      let obj = {
        district: this.searchPanel.get('district')?.value,
        hudName: this.searchPanel.get('hud_name')?.value,
        hudGid: +this.searchPanel.get('hud_gid')?.value || null,
      };
      //store filter values in session storage
      sessionStorage.setItem('hud_filters', JSON.stringify(obj));

      this.paginator.pageIndex = 0;
      this.loadRecords(
        this.currentUser,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      );
    }
  }

  clearSearchFields() {
    sessionStorage.removeItem('hud_filters');
    this.hud_filters = null;
    this.isCallInProgress = true;
    this.searchPanel.patchValue({
      district: '',
      hud_name: '',
      hud_gid: '',
    });
    this.filters = {
      DISTRICT_ID: null,
      HUD_GID: null,
      HUD_NAME: null,
    };
    this.paginator.pageIndex = 0;
    this.loadRecords(
      this.currentUser,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  loadRecords(
    user: User,
    filters: HUD_FILTERS,
    pageIndex: number,
    pageSize: number
  ) {
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };
    this.dataSource.loadHuds(
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

  downloadRecords() {
    this.isExportInProgress = true;
    this.hudService
      .getHuds(this.currentUser, this.filters, 0, this.paginator.length)
      .subscribe(async (result: any) => {
        const data = result?.data || [];
        const exportData: any = [];
        for (var i = 0; i < data.length; i++) {
          const elem = data[i];
          exportData.push({
            District: elem.district_name,
            HUD: elem.hud_name,
            'HUD GID': elem.hud_gid,
            Active: elem.active,
          });
        }
        this.isExportInProgress = false;
        exportToExcel(exportData, 'huds.xlsx');
      });
  }

  disableEdit(data: any): boolean {
    return disableEdit(data?.hud_name);
  }

}
