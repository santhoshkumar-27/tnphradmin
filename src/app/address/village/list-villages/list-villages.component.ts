import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';
import { DistrictMaster } from 'src/app/models/master_district';
import { HudMaster } from 'src/app/models/master-hud';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { VillageDataSource } from './village.datasource';
import { Village, VillageFilterType } from 'src/app/models/village';
import { User } from 'src/app/models/user';
import { VillageService } from '../service/village.service';
import { AuthService } from 'src/app/starter/services/auth.service';
import { Constants } from 'src/app/config/constants/constants';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { exportToExcel } from 'src/app/utils/exportToExcel.util';
import { BlockMaster } from 'src/app/models/master_block';
import { resetFormList } from 'src/app/utils/form-util';
import { disableEdit } from 'src/app/utils/unallocated.util';

@Component({
  selector: 'app-list-villages',
  templateUrl: './list-villages.component.html',
  styleUrls: ['./list-villages.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListVillagesComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = [
    'district',
    'hud',
    'block',
    'village',
    'villageType',
    'isActive',
    'actions',
  ];
  village: Village;

  dataSource: VillageDataSource;
  filters : VillageFilterType = {
    DISTRICT_ID: null,
    HUD_ID: null,
    BLOCK_ID: null,
    VILLAGE_NAME: null,
    VILLAGE_GID: null,
    VILLAGE_TYPE: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;
  villageTypes: any = Constants.VILLAGE_TYPE;

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  hudList: HudMaster[];
  filteredHuds: Subject<HudMaster[]> = new Subject();

  blockList: BlockMaster[];
  filteredBlocks: Subject<BlockMaster[]> = new Subject();

  user: User;
  
  village_filters: any;
  isExportInProgress: boolean = false;

  constructor(
    private villageService: VillageService,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    this.dataSource = new VillageDataSource(this.villageService, this._snackBar);

    this.searchPanel = this._formBuilder.group({
      district: ['', Validators.pattern('[a-zA-z ]*')],
      hud: ['', Validators.pattern('[a-zA-z ]*')],
      block: ['', Validators.pattern('[a-zA-z ]*')],
      village_name: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      village_gid: ['', Validators.pattern('[0-9]*')],
      village_type: [''],
    });

    if (sessionStorage.getItem("village_filters"))
      this.village_filters = JSON.parse(sessionStorage.getItem("village_filters")!);

    if (this.village_filters) {
      const {
        village_type,
        village_name,
        district,
        hud,
        block,
        village_gid,
      } = this.village_filters;
      this.searchPanel.patchValue({
        village_name: village_name ? village_name.toLowerCase() : '',
        village_gid: village_gid || null,
        village_type: village_type || null,
      });
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        HUD_ID: hud?.hud_id || null,
        BLOCK_ID: block?.block_id || null,
        VILLAGE_TYPE: village_type || null,
        VILLAGE_NAME: village_name ? village_name.toLowerCase() : '',
        VILLAGE_GID: village_gid || null
      }
    }

    this.getDistrictList();
    this.getHudList();
    this.getBlockList();
    this.onChanges();
  }

  getDistrictList() {
    this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
      console.log('List village | district list:', values);
      // This feature applicable only for state admin
      this.districtList = values;
      this.searchPanel
        .get('district')
        ?.addValidators([
          optionObjectObjectValidator(this.districtList, 'district_name'),
        ]);
      // this.searchPanel.get('district')?.setValue(
      //   this.village
      //     ? {
      //         district_id: this.village.district_id,
      //         district_name: this.village.district_name,
      //       }
      //     : ''
      // );
      this.searchPanel.get('district')?.setValue(
        this.village_filters?.district ? this.village_filters.district : ''
      );
    });
  }

  getHudList() {
    this._dataservice.getHudList().subscribe((values: Array<any>) => {
      console.log('List village | hud list:', values);

      if (this.user.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.user.district_id
        );
      } else if (this.village_filters?.district) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.village_filters.district.district_id
        );
      } else {
        this.hudList = values;
      }

      resetFormList(
        this.searchPanel,
        'hud',
        'hud_name',
        this.hudList,
        false,
        this.village_filters?.hud ? this.village_filters.hud : ''
      );
      
    });
  }

  getBlockList() {
    this._dataservice.getBlocksList().subscribe((values: Array<any>) => {
      console.log('List village | block list:', values);

      if (this.user.district_id) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.user.district_id
        );
      } else if (this.village_filters?.district) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.village_filters.district.district_id
        );
      } else {
        this.blockList = values;
      }

      if (this.village_filters?.hud) {
        this.blockList = values.filter(
          (el: any) => el.hud_id == this.village_filters.hud.hud_id
        );
      }

      resetFormList(
        this.searchPanel,
        'block',
        'block_name',
        this.blockList,
        false,
        this.village_filters?.block ? this.village_filters.block : ''
      );
    });
  }

  onChanges(): void {
    console.log('List village | onChange()');

    this.searchPanel.get('district')?.valueChanges.subscribe((val: any) => {
      console.log(
        'List village | district value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.district_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });

    this.searchPanel.get('hud')?.valueChanges.subscribe((val: any) => {
      console.log('List village | hud value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.hud_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.hudList.filter((hud: any) =>
        hud.hud_name.toLowerCase().includes(filterValue)
      );
      this.filteredHuds.next(filteredOne);
    });

    this.searchPanel.get('block')?.valueChanges.subscribe((val: any) => {
      console.log('List village | block value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.block_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.blockList.filter((block: any) =>
        block.block_name.toLowerCase().includes(filterValue)
      );
      this.filteredBlocks.next(filteredOne);
    });
  }

  ngAfterViewInit() {
    console.log('list-village-ngAfterViewInit:', this.paginator);
    //this.paginator.pageSize = 100;
    this.dataSource.loadVillages(
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
          this.dataSource.loadVillages(
            this.user,
            this.filters,
            this.paginator.pageIndex,
            this.paginator.pageSize
          )
      );
  }

  addVillage() {
    sessionStorage.removeItem('EDIT_VILLAGE');
    this._router.navigateByUrl('/addr/village/add');
  }

  editVillage(village: any) {
    sessionStorage.setItem('EDIT_VILLAGE', JSON.stringify(village));
    this._router.navigateByUrl('/addr/village/edit');
  }

  async onDistrictBlur() {
    if (
      this.searchPanel.get('district')?.value &&
      this.searchPanel.get('district')?.valid
    ) {
      let selectedDistrict = this.searchPanel.get('district')?.value;
      this.hudList = await this.villageService.getHudListForDistrict(
        selectedDistrict.district_id
      );

      this.blockList = await this.villageService.getBlocksListForDistrict(
        selectedDistrict.district_id
      );

    } else {
      console.log('selected district is empty');
      this.hudList = await this.villageService.getHudList();
      this.blockList = await this.villageService.getBlocksList();
    }

    resetFormList(
      this.searchPanel,
      'hud',
      'hud_name',
      this.hudList,
      false,
      ""
    );
    
    resetFormList(
      this.searchPanel,
      'block',
      'block_name',
      this.blockList,
      false,
      ""
    );
  }

  async onHudBlur() {
    // if (
    //   this.searchPanel.get('hud')?.value &&
    //   this.searchPanel.get('hud')?.valid
    // ) {
    //   let selectedHud = this.searchPanel.get('hud')?.value;
    //   this.blockList = await this.villageService.getBlocksListForHud(
    //     selectedHud.hud_id
    //   );
    // } else {
      if (this.searchPanel.get('district')?.value) {
        this.blockList = await this.villageService.getBlocksListForDistrict(
          this.searchPanel.get('district')?.value?.district_id
        );
      } else this.blockList = await this.villageService.getBlocksList();
    // }
    resetFormList(
      this.searchPanel,
      'block',
      'block_name',
      this.blockList,
      false,
      ""
    );
  }

  getFilteredVillageList() {
    if (this.searchPanel.valid) {
      console.log('list-village | getFilteredVillageList()');
      this.isCallInProgress = true;

      let _filters = {
        DISTRICT_ID:
          this.searchPanel.get('district')?.value ||
          this.searchPanel.get('district')?.value != ''
            ? this.searchPanel.get('district')?.value.district_id
            : null,
        HUD_ID: this.searchPanel.get('hud')?.value ||
          this.searchPanel.get('hud')?.value != ''
          ? this.searchPanel.get('hud')?.value.hud_id
          : null,
        BLOCK_ID: this.searchPanel.get('block')?.value ||
          this.searchPanel.get('block')?.value != ''
          ? this.searchPanel.get('block')?.value.block_id
          : null,
        VILLAGE_NAME:
          this.searchPanel.value['village_name'] ||
          this.searchPanel.value['village_name'] != ''
            ? this.searchPanel.value['village_name'].toLowerCase()
            : null,
        VILLAGE_GID:
          this.searchPanel.value['village_gid'] != ''
            ? this.searchPanel.value['village_gid']
            : null,
        VILLAGE_TYPE:
          this.searchPanel.value['village_type'] != ''
            ? this.searchPanel.value['village_type']
            : null,
      };
      console.log('list-village | Calling get villages with Filters: ', _filters);
      this.filters = _filters;

      let obj = {
        district: this.searchPanel.get('district')?.value,
        hud: this.searchPanel.get('hud')?.value,
        block: this.searchPanel.get('block')?.value,
        village_name: this.searchPanel.get('village_name')?.value,
        village_gid: this.searchPanel.get('village_gid')?.value,
        village_type: this.searchPanel.get('village_type')?.value,
      }
      sessionStorage.setItem("village_filters", JSON.stringify(obj));

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
    sessionStorage.removeItem("village_filters");
    this.village_filters = null;
    this.isCallInProgress = true;
    this.searchPanel.patchValue({
      district: '',
      hud: '',
      block: '',
      village_name: '',
      village_gid: '',
      village_type: '',
    });
    this.filters = {
      DISTRICT_ID: null,
      HUD_ID: null,
      BLOCK_ID: null,
      VILLAGE_NAME: null,
      VILLAGE_GID: null,
      VILLAGE_TYPE: null,
    };
    this.paginator.pageIndex = 0;
    this.loadRecords(
      this.user,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
    this.getHudList();
    this.getBlockList();
  }

  loadRecords(user: User, filters: any, pageIndex: number, pageSize: number) {
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };
    this.dataSource.loadVillages(
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

  displayHudFn(hud) {
    return hud ? hud.hud_name : '';
  }

  displayBlockFn(block) {
    return block ? block.block_name : '';
  }

  downloadRecords() {
    this.isExportInProgress = true;
    this.villageService
      .getVillages(this.user, this.filters, 0, this.paginator.length)
      .subscribe(async (result: any) => {
        const data = result?.data || [];
        const exportData: any = [];
        for (var i = 0; i < data.length; i++) {
          const elem = data[i];
          exportData.push({
            District: elem.district_name,
            HUD: elem.hud_name,
            Block: elem.block_name,
            Village: elem.village_name,
            Village_GID: elem.village_gid,
            Village_Type: elem.village_type,
            Active: elem.active,
          });
        }
        this.isExportInProgress = false;
        console.log('villages export data', exportData);
        exportToExcel(exportData, 'Villages.xlsx');
      }, (error) => {
        this.isExportInProgress = false;
        console.log('Failed to export data.');
        this._snackBar.open('Export failed.', 'Dismiss', {
          duration: 4000,
        });
      });
  }

  disableEdit(data: any): boolean {
    return disableEdit(data?.village_name);
  }

}

