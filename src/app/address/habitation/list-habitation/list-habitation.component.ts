import {
  Component,
  OnInit,
} from '@angular/core';
import { ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BlockMaster } from 'src/app/models/master_block';
import { VillageMaster } from 'src/app/models/master_village';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { exportToExcel } from '../../../utils/exportToExcel.util';
import { DistrictMaster } from 'src/app/models/master_district';
import { HabitationDataSource } from './habitation.datasource';
import { HABITATION, HABITATION_FILTERS } from 'src/app/models/habitation';
import { HudMaster } from 'src/app/models/master-hud';
import { HabitationService } from '../service/habitation.service';
import { disableEdit } from 'src/app/utils/unallocated.util';

@Component({
  selector: 'app-list-habitation',
  templateUrl: './list-habitation.component.html',
  styleUrls: ['./list-habitation.component.scss'],
})
export class ListHabitationComponent implements OnInit {
  displayedColumns: string[] = [
    'district',
    'hud',
    'block',
    'village',
    'habitation',
    'isActive',
    'actions',
  ];
  habitation: HABITATION;
  dataSource: HabitationDataSource;
  filters: HABITATION_FILTERS = {
    DISTRICT_ID: null,
    HUD_ID: null,
    BLOCK_ID: null,
    VILLAGE_ID: null,
    HABITATION_GID: null,
    HABITATION_NAME: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  hudList: HudMaster[];
  filteredHuds: Subject<HudMaster[]> = new Subject();

  blockList: BlockMaster[];
  filteredBlocks: Subject<BlockMaster[]> = new Subject();

  villageList: VillageMaster[];
  filteredVillages: Subject<VillageMaster[]> = new Subject();

  currentUser: User;

  habitation_filters: any;

  isExportInProgress: boolean = false;

  constructor(
    private habitationService: HabitationService,
    private _authService: AuthService,
    private _masterDataService: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.dataSource = new HabitationDataSource(this.habitationService);

    this.searchPanel = this._formBuilder.group({
      district: [''],
      hud: [''],
      block: [''],
      village: [''],
      habitation_name: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      habitation_gid: ['', Validators.pattern('[0-9]*')],
    });

    if (sessionStorage.getItem('habitation_filters')) {
      this.habitation_filters = JSON.parse(
        sessionStorage.getItem('habitation_filters')!
      );
      const { district, hud, block, village, habitation_name, habitation_gid } =
        this.habitation_filters;
      this.searchPanel.patchValue({
        habitation_name: habitation_name,
        habitation_gid: habitation_gid,
      });
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        HUD_ID: hud?.hud_id || null,
        BLOCK_ID: block?.block_id || null,
        VILLAGE_ID: village?.village_id || null,
        HABITATION_NAME: habitation_name ? habitation_name.toLowerCase() : null,
        HABITATION_GID: habitation_gid || null,
      };
    }

    this.getDistrictList();
    this.getHudList();
    this.getBlockList();
    this.getVillageList();
    this.onChanges();
  }

  getDistrictList() {
    this._masterDataService.getDistrictsList().subscribe((districts: any) => {
      this.districtList = districts;
      let disField = this.searchPanel.get('district');
      disField?.setValidators([
        optionObjectObjectValidator(this.districtList, 'district_name'),
      ]);
      disField?.setValue(
        this.habitation_filters?.district
          ? this.habitation_filters.district
          : ''
      );
    });
  }

  getHudList() {
    this._masterDataService.getHudList().subscribe((values: Array<any>) => {
      this.hudList = values;
      if (this.habitation_filters?.district) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.habitation_filters.district.district_id
        );
      }
      this.searchPanel
        .get('hud')
        ?.addValidators([
          optionObjectObjectValidator(this.hudList, 'hud_name'),
        ]);
      this.searchPanel
        .get('hud')
        ?.setValue(
          this.habitation_filters?.hud ? this.habitation_filters.hud : ''
        );
    });
  }

  getBlockList() {
    this._masterDataService.getBlocksList().subscribe((values: Array<any>) => {
      console.log('list-habitation | get block list: ', values);
      this.blockList = values;
      if (this.habitation_filters?.district) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.habitation_filters.district.district_id
        );
      }
      if (this.habitation_filters?.hud) {
        this.blockList = values.filter(
          (el: any) => el.hud_id == this.habitation_filters.hud.hud_id
        );
      }
      this.searchPanel
        .get('block')
        ?.setValidators([
          optionObjectObjectValidator(this.blockList, 'block_name'),
        ]);
      this.searchPanel
        .get('block')
        ?.setValue(
          this.habitation_filters?.block ? this.habitation_filters.block : ''
        );
    });
  }

  getVillageList() {
    this._masterDataService.getVillageList().subscribe((values: Array<any>) => {
      console.log('list-habitation | get village list: ', values);
      this.villageList = values;
      if (this.habitation_filters?.block) {
        this.villageList = values.filter(
          (el: any) => el.block_id == this.habitation_filters.block.block_id
        );
      }
      this.searchPanel
        .get('village')
        ?.setValidators([
          optionObjectObjectValidator(this.villageList, 'village_name'),
        ]);
      this.searchPanel
        .get('village')
        ?.setValue(
          this.habitation_filters?.village
            ? this.habitation_filters.village
            : ''
        );
    });
  }

  onChanges(): void {
    console.log('list-habitation | onChange()');

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

    this.searchPanel.get('hud')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.hud_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.hudList.filter((dis: any) =>
        dis.hud_name.toLowerCase().includes(filterValue)
      );
      this.filteredHuds.next(filteredOne);
    });

    this.searchPanel.get('block')?.valueChanges.subscribe((val: any) => {
      console.log(
        'list-habitation | Block value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.block_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.blockList.filter((block: any) =>
        block.block_name.toLowerCase().includes(filterValue)
      );
      this.filteredBlocks.next(filteredOne);
    });

    this.searchPanel.get('village')?.valueChanges.subscribe((val: any) => {
      console.log(
        'list-habitation | village value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.village_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.villageList.filter((village: any) =>
        village.village_name.toLowerCase().includes(filterValue)
      );
      this.filteredVillages.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });
  }

  async onDistrictBlur() {
    if (
      this.searchPanel.get('district')?.value &&
      this.searchPanel.get('district')?.valid
    ) {
      let selectedDistrict = this.searchPanel.get('district')?.value;
      this.hudList = await this.habitationService.getHudListForDistrict(
        selectedDistrict.district_id
      );
      this.blockList = await this.habitationService.getBlockListForDistrict(
        selectedDistrict.district_id
      );
    } else {
      console.log('selected district is empty');
      this.hudList = await this.habitationService.getHudList();
      this.blockList = await this.habitationService.getBlockList();
    }

    this.searchPanel.get('hud')?.clearValidators();
    this.searchPanel
      .get('hud')
      ?.addValidators([optionObjectObjectValidator(this.hudList, 'hud_name')]);
    this.searchPanel.get('hud')?.setValue('');
    this.searchPanel.get('hud')?.updateValueAndValidity();

    this.searchPanel.get('block')?.clearValidators();
    this.searchPanel
      .get('block')
      ?.addValidators([
        optionObjectObjectValidator(this.blockList, 'block_name'),
      ]);
    this.searchPanel.get('block')?.setValue('');
    this.searchPanel.get('block')?.updateValueAndValidity();

    //reset the village value also
    this.onBlockBlur();
  }

  async onHudBlur() {
    if (
      this.searchPanel.get('hud')?.value &&
      this.searchPanel.get('hud')?.valid
    ) {
      let selectedHud = this.searchPanel.get('hud')?.value;
      this.blockList = await this.habitationService.getBlocksListForHud(
        selectedHud.hud_id
      );
    } else {
      if (this.searchPanel.get('district')?.value) {
        this.blockList = await this.habitationService.getBlockListForDistrict(
          this.searchPanel.get('district')?.value?.district_id
        );
      } else this.blockList = await this.habitationService.getBlockList();
    }
    this.searchPanel.get('block')?.clearValidators();
    this.searchPanel
      .get('block')
      ?.addValidators([
        optionObjectObjectValidator(this.blockList, 'block_name'),
      ]);
    this.searchPanel.get('block')?.setValue('');
    this.searchPanel.get('block')?.updateValueAndValidity();
    //reset the village value also
    this.onBlockBlur();
  }

  async onBlockBlur() {
    if (
      this.searchPanel.get('block')?.value &&
      this.searchPanel.get('block')?.valid
    ) {
      let selectedBlock = this.searchPanel.get('block')?.value;
      this.villageList = await this.habitationService.getVillageListForBlock(
        selectedBlock.block_id
      );
    } else {
      console.log('selected block is empty');
      this.villageList = await this.habitationService.getVillageList();
    }

    this.searchPanel.get('village')?.clearValidators();
    this.searchPanel
      .get('village')
      ?.addValidators([
        optionObjectObjectValidator(this.villageList, 'village_name'),
      ]);
    this.searchPanel.get('village')?.setValue('');
    this.searchPanel.get('village')?.updateValueAndValidity();
  }

  ngAfterViewInit() {
    console.log('list-habitation | ngAfterViewInit()');
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };

    // Show loading icon.
    setTimeout(() => {
      this.isCallInProgress = true;
    }, 0);
    this.dataSource.loadHabitations(
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
      this.dataSource.loadHabitations(
        this.currentUser,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      )
    );
  }

  addHabitation() {
    sessionStorage.removeItem('EDIT_HABITATION');
    this._router.navigateByUrl('/addr/habitations/add');
  }

  editHabitation(habitation: any) {
    //console.log("In Edit User " + product);
    sessionStorage.setItem('EDIT_HABITATION', JSON.stringify(habitation));
    this._router.navigateByUrl('/addr/habitations/edit');
  }

  getFilteredHabitationList() {
    if (this.searchPanel.valid) {
      console.log('list-habitation');
      this.isCallInProgress = true;
      let _filters: HABITATION_FILTERS = {
        DISTRICT_ID:
          this.searchPanel.get('district')?.value?.district_id || null,
        HUD_ID: this.searchPanel.get('hud')?.value?.hud_id || null,
        BLOCK_ID: this.searchPanel.get('block')?.value?.block_id || null,
        VILLAGE_ID: this.searchPanel.get('village')?.value?.village_id || null,
        HABITATION_NAME:
          this.searchPanel.get('habitation_name')?.value?.toLowerCase() || null,
        HABITATION_GID: +this.searchPanel.get('habitation_gid')?.value || null,
      };
      this.filters = _filters;

      let obj = {
        district: this.searchPanel.get('district')?.value,
        hud: this.searchPanel.get('hud')?.value,
        block: this.searchPanel.get('block')?.value,
        village: this.searchPanel.get('village')?.value,
        habitation_name: this.searchPanel.get('habitation_name')?.value,
        habitation_gid: +this.searchPanel.get('habitation_gid')?.value || null,
      };
      //store filter values in session storage
      sessionStorage.setItem('habitation_filters', JSON.stringify(obj));

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
    sessionStorage.removeItem('habitation_filters');
    this.habitation_filters = null;
    this.getDistrictList();
    this.getHudList();
    this.getBlockList();
    this.getVillageList();
    this.isCallInProgress = true;
    this.searchPanel.patchValue({
      district: '',
      hud: '',
      block: '',
      village: '',
      habitation_name: '',
      habitation_gid: '',
    });
    this.filters = {
      DISTRICT_ID: null,
      HUD_ID: null,
      BLOCK_ID: null,
      VILLAGE_ID: null,
      HABITATION_GID: null,
      HABITATION_NAME: null,
    };
    this.paginator.pageIndex = 0;
    this.loadRecords(
      this.currentUser,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  loadRecords(user: User, filters: any, pageIndex: number, pageSize: number) {
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };
    this.dataSource.loadHabitations(
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

  displayHudFn(hud?: any) {
    return hud ? hud.hud_name : '';
  }

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  displayVillageFn(village?: any): string {
    return village ? village.village_name : '';
  }

  createExportData(data: any) {
    const exportData: any = [];
    for (var i = 0; i < data?.length; i++) {
      const elem = data[i];
      exportData.push({
        District: elem.district_name,
        HUD: elem.hud_name,
        Block: elem.block_name,
        Village: elem.village_name,
        Habitation: elem.habitation_name,
        Habitation_GID: elem.habitation_gid,
        Active: elem.active,
      });
    }
    this.isExportInProgress = false;
    console.log('habitation export data', exportData);
    exportToExcel(exportData, 'Habitations.xlsx');
  }

  downloadRecords() {
    this.isExportInProgress = true;
    if (this.paginator.length <= 5000) {
      this.habitationService
        .getHabitations(
          this.currentUser,
          this.filters,
          0,
          this.paginator.length
        )
        .subscribe(async (result: any) => {
          const data = result?.data || [];
          this.createExportData(data);
        });
    } else {
      let data1 = this.habitationService
        .getHabitations(this.currentUser, this.filters, 0, 5000)
        .toPromise();

      let data2 = this.habitationService
        .getHabitations(this.currentUser, this.filters, 1, 5000)
        .toPromise();

      let promiseObjs = [data1, data2];

      if (this.paginator.length > 10000) {
        let data3 = this.habitationService
          .getHabitations(this.currentUser, this.filters, 2, 5000)
          .toPromise();
        promiseObjs = [data1, data2, data3];
      }

      Promise.all(promiseObjs).then((result: any) => {
        let obj = result.map((el) => el.data);
        obj = obj.flat();
        this.createExportData(obj);
      });
    }
  }

  disableEdit(data: HABITATION): boolean {
    return disableEdit(data?.habitation_name);
  }
  
}
