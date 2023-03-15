import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HabitationMaster } from 'src/app/models/master-habitation';
import { BlockMaster } from 'src/app/models/master_block';
import { FacilityMaster } from 'src/app/models/master_facility';
import { VillageMaster } from 'src/app/models/master_village';
import { Street } from 'src/app/models/street';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { StreetService } from '../service/street.service';
import { StreetDataSource } from './street.datasource';
import {
  isBlockAdmin,
  isDistrictAdmin,
  isStateAdmin,
} from 'src/app/utils/session.util';
import { exportToExcel } from '../../../utils/exportToExcel.util';
import { DistrictMaster } from 'src/app/models/master_district';
import { StreetBulkEditDialogComponent } from '../street-bulk-edit-dialog/street-bulk-edit-dialog.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { disableEdit } from 'src/app/utils/unallocated.util';

@Component({
  selector: 'app-list-streets',
  templateUrl: './list-streets.component.html',
  styleUrls: ['./list-streets.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListStreetsComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = [
    'select',
    'district',
    'hud',
    'block',
    'village',
    'habitation',
    'street',
    'cateringHsc',
    'isActive',
    'actions',
  ];
  street: Street;
  dataSource: StreetDataSource;
  filters = {
    DISTRICT_ID: null,
    BLOCK_ID: null,
    VILLAGE_ID: null,
    HABITATION_ID: null,
    FACILITY_ID: null,
    STREET_NAME: null,
    STREET_GID: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;

  blockList: BlockMaster[];
  filteredBlocks: Subject<BlockMaster[]> = new Subject();

  villageList: VillageMaster[];
  filteredVillages: Subject<VillageMaster[]> = new Subject();

  habitationList: HabitationMaster[] = [];
  filteredHabitations: Subject<HabitationMaster[]> = new Subject();

  facilityList: FacilityMaster[];
  filteredFacilities: Subject<FacilityMaster[]> = new Subject();

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  currentUser: User;

  selection = new SelectionModel<any>(true, []);
  bulkeditStreets: any = [];
  street_filter: any;

  isExportInProgress: boolean = false;

  constructor(
    private streetService: StreetService,
    private _authService: AuthService,
    private _masterDataService: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.dataSource = new StreetDataSource(this.streetService);

    this.searchPanel = this._formBuilder.group({
      district: ['', Validators.pattern('[a-zA-z]*')],
      block: ['', Validators.pattern('[a-zA-z]*')],
      village: ['', Validators.pattern('[a-zA-z]*')],
      habitation: [
        { value: '', disabled: true },
        Validators.pattern('[a-zA-z]*'),
      ],
      facility: [
        { value: '', disabled: true },
        Validators.pattern('[0-9A-z]*'),
      ],
      street_name: ['', Validators.pattern('[0-9A-z ()-]*')],
      street_gid: ['', Validators.pattern('[0-9A-z ()-]*')],
    });

    if (sessionStorage.getItem('street_filters'))
      this.street_filter = JSON.parse(
        sessionStorage.getItem('street_filters')!
      );

    if (this.street_filter) {
      const {
        district,
        block,
        village,
        habitation,
        facility,
        streetName,
        streetGid,
      } = this.street_filter;
      this.searchPanel.patchValue({
        habitation: habitation,
        street_name: streetName,
        street_gid: streetGid,
      });
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        BLOCK_ID: block?.block_id || null,
        VILLAGE_ID: village?.village_id || null,
        HABITATION_ID: habitation?.habitation_id || null,
        FACILITY_ID: facility?.facility_id || null,
        STREET_NAME: streetName ? streetName.toLowerCase() : null,
        STREET_GID: streetGid || null,
      };
    }

    //TODO: habitation
    // This part is done in village blur function
    this.getDistrictList();
    this.getBlockList();
    this.getVillageList();
    this.getCateringHscs();
    this.onChanges();
  }

  getDistrictList() {
    this._masterDataService.getDistrictsList().subscribe((districts: any) => {
      this.districtList = districts;
      let disField = this.searchPanel.get('district');
      console.log('street fil', this.street_filter);
      if (isDistrictAdmin(this.currentUser) || isBlockAdmin(this.currentUser)) {
        let userDistrictObj = this.districtList.find(
          (el: any) => el.district_id == this.currentUser.district_id
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

  getBlockList() {
    this._masterDataService.getBlocksList().subscribe((values: Array<any>) => {
      console.log('list-street | get block list: ', values);
      // If block admin; then only allow his block
      //  Else if district admin; then only allow blocks in his district.
      if (isBlockAdmin(this.currentUser)) {
        const operatorBlockId = this.currentUser.block_id;
        this.blockList = values.filter(
          (block) => block.block_id === operatorBlockId
        );
      } else if (isDistrictAdmin(this.currentUser)) {
        const operatorDistrictId = this.currentUser.district_id;
        this.blockList = values.filter(
          (block) => block.district_id === operatorDistrictId
        );
      } else if (this.street_filter?.district) {
        this.blockList = values.filter(
          (block) => block.district_id === this.street_filter.district.district_id
        );
      } else {
        this.blockList = values;
      }

      if (isBlockAdmin(this.currentUser)) {
        const allowedBlock = this.blockList[0];
        this.searchPanel.get('block')?.setValue(allowedBlock);
        this.searchPanel.get('block')?.disable();
      } else {
        this.searchPanel
          .get('block')
          ?.setValidators([
            optionObjectObjectValidator(this.blockList, 'block_name'),
          ]);
        this.searchPanel
          .get('block')
          ?.setValue(this.street_filter?.block ? this.street_filter.block : '');
      }
    });
  }

  getVillageList() {
    this._masterDataService.getVillageList().subscribe((values: Array<any>) => {
      console.log('list-street | get village list: ', values);
      this.villageList = values;
      if (this.street_filter?.block) {
        this.villageList = values.filter(
          (vilage) => vilage.block_id === this.street_filter.block.block_id
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
          this.street_filter?.village ? this.street_filter.village : ''
        );
    });
  }

  async getCateringHscs() {
    let fList = [];

    if (this.currentUser.district_id) {
      fList = await this.streetService.getDistrictFacilities(
        this.currentUser.district_id
      );
    }

    if (this.currentUser.block_id) {
      fList = await this.streetService.getBlockFacilities(
        this.currentUser.block_id
      );
    }

    if (this.street_filter?.block) {
      fList = await this.streetService.getBlockFacilities(
        this.street_filter.block.block_id
      );
    }

    if (fList.length > 0) {
      console.log('list-street | get facility list: ', fList);
      this.facilityList = fList;
      this.searchPanel
        .get('facility')
        ?.setValidators([
          optionObjectObjectValidator(this.facilityList, 'facility_name'),
        ]);
      this.searchPanel.get('facility')?.enable();
      this.searchPanel
        .get('facility')
        ?.setValue(
          this.street_filter?.facility ? this.street_filter.facility : ''
        );
    } else {
      this.facilityList = [];
      this.searchPanel
        .get('facility')
        ?.setValue(
          this.street_filter?.facility ? this.street_filter.facility : ''
        );
      this.searchPanel.get('facility')?.disable();
    }
  }

  onDistrictBlur() {
    if (this.searchPanel.get('district')?.invalid) return;

    if (this.searchPanel.get('district')?.value) {
      let selectedDis = this.searchPanel.get('district')?.value.district_id;
      this.streetService
        .getBlocksListForDistrict(selectedDis)
        .then((values: any) => {
          this.blockList = values;
          this.searchPanel
            .get('block')
            ?.setValidators([
              optionObjectObjectValidator(this.blockList, 'block_name'),
            ]);
          this.searchPanel.get('block')?.setValue('');
        });
    } else {
      this.getBlockList();
    }

    this.facilityList = [];
    this.searchPanel.get('facility')?.setValue('');
    this.searchPanel.get('facility')?.disable();

    this.getVillageList();
  }

  onBlockBlur() {
    if (this.searchPanel.get('block')?.invalid) return;

    if (this.searchPanel.get('block')?.value) {
      let selectedBlock = this.searchPanel.get('block')?.value.block_id;
      this.streetService
        .getBlockFacilities(selectedBlock)
        .then((values: any) => {
          console.log('list-street | get facility list: ', values);
          if (values?.length == 0) {
            this.streetService
              .getHSCFacilities(this.currentUser, selectedBlock)
              .pipe(
                map((response: any) => {
                  const facilities: Array<any> = response.data;
                  return facilities.filter(
                    (facility) => facility.facility_level === 'HSC'
                  );
                })
              )
              .subscribe((facilities: Array<any>) => {
                this.facilityList = facilities;
                this.searchPanel
                  .get('facility')
                  ?.setValidators([
                    optionObjectObjectValidator(
                      this.facilityList,
                      'facility_name'
                    ),
                  ]);
                this.searchPanel.get('facility')?.enable();
                this.searchPanel.get('facility')?.setValue('');
              });
          } else {
            this.facilityList = values;
            this.searchPanel
              .get('facility')
              ?.setValidators([
                optionObjectObjectValidator(this.facilityList, 'facility_name'),
              ]);
            this.searchPanel.get('facility')?.enable();
            this.searchPanel.get('facility')?.setValue('');
          }
        });

      this.streetService.getVillages(selectedBlock).then((vilList: any) => {
        this.villageList = vilList;
        this.searchPanel
          .get('village')
          ?.setValidators([
            optionObjectObjectValidator(this.villageList, 'village_name'),
          ]);
        this.searchPanel.get('village')?.setValue('');
      });
    } else {
      this.getCateringHscs();
      this.getVillageList();
    }
  }

  ngAfterViewInit() {
    console.log('list-street | ngAfterViewInit()');
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };

    // Show loading icon.
    setTimeout(() => {
      this.isCallInProgress = true;
    }, 0);
    this.dataSource.loadStreets(
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
      this.dataSource.loadStreets(
        this.currentUser,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      )
    );
  }

  onChanges(): void {
    console.log('list-street | onChange()');

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

    this.searchPanel.get('block')?.valueChanges.subscribe((val: any) => {
      console.log('list-street | Block value:', val, ' and type:', typeof val);
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
        'list-street | village value:',
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

    this.searchPanel.get('habitation')?.valueChanges.subscribe((val: any) => {
      console.log(
        'list-street | habitation value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.habitation_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.habitationList.filter((habitation: any) =>
        habitation.habitation_name.toLowerCase().includes(filterValue)
      );
      this.filteredHabitations.next(filteredOne);
    });

    this.searchPanel.get('facility')?.valueChanges.subscribe((val: any) => {
      console.log(
        'list-street | Facility value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.facility_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.facilityList.filter((facility: any) =>
        facility.facility_name.toLowerCase().includes(filterValue)
      );
      this.filteredFacilities.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });
  }

  editStreet(street: any) {
    //console.log("In Edit User " + product);
    sessionStorage.setItem('EDIT_STREET', JSON.stringify(street));
    this._router.navigateByUrl('/addr/street/edit');
  }

  addStreet() {
    sessionStorage.removeItem('EDIT_STREET');
    this._router.navigateByUrl('/addr/street/add');
  }

  getFilteredStreetList() {
    // removing the selection for bulk edit
    this.selection.selected.forEach((id: any) => this.selection.deselect(id));
    if (this.searchPanel.valid) {
      console.log('list-street | getFilteredStreetList()');
      console.log('---->', this.searchPanel.value['block']);
      this.isCallInProgress = true;

      let blockId = null;
      if (this.searchPanel.get('block')?.disabled) {
        let rawBlock = this.searchPanel.getRawValue().block;
        blockId = rawBlock || rawBlock != '' ? rawBlock.block_id : null;
      } else {
        blockId =
          this.searchPanel.value['block'] ||
          this.searchPanel.value['block'] != ''
            ? this.searchPanel.value['block'].block_id
            : null;
      }

      let _filters = {
        DISTRICT_ID:
          this.searchPanel.get('district')?.value ||
          this.searchPanel.get('district')?.value != ''
            ? this.searchPanel.get('district')?.value.district_id
            : null,
        BLOCK_ID: blockId,
        VILLAGE_ID:
          this.searchPanel.value['village'] ||
          this.searchPanel.value['village'] != ''
            ? this.searchPanel.value['village'].village_id
            : null,
        HABITATION_ID:
          this.searchPanel.value['habitation'] &&
          this.searchPanel.value['habitation'] != ''
            ? this.searchPanel.value['habitation'].habitation_id
            : null,
        FACILITY_ID:
          this.searchPanel.get('facility')?.value ||
          this.searchPanel.get('facility')?.value != ''
            ? this.searchPanel.get('facility')?.value.facility_id
            : null,
        STREET_NAME:
          this.searchPanel.value['street_name'] ||
          this.searchPanel.value['street_name'] != ''
            ? this.searchPanel.value['street_name'].toLowerCase()
            : null,
        STREET_GID:
          this.searchPanel.value['street_gid'] != ''
            ? this.searchPanel.value['street_gid']
            : null,
      };
      console.log('list-street | Calling get streets with Filters: ', _filters);
      this.filters = _filters;

      let obj = {
        district: this.searchPanel.get('district')?.value,
        block: this.searchPanel.get('block')?.value,
        village: this.searchPanel.get('village')?.value,
        habitation: this.searchPanel.get('habitation')?.value,
        facility: this.searchPanel.get('facility')?.value,
        streetName: this.searchPanel.get('street_name')?.value,
        streetGid: this.searchPanel.get('street_gid')?.value,
      };
      //store filter values in session storage
      sessionStorage.setItem('street_filters', JSON.stringify(obj));

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
    sessionStorage.removeItem('street_filters');
    this.street_filter = null;
    this.getDistrictList();
    this.getBlockList();
    this.isCallInProgress = true;
    this.searchPanel.patchValue({
      district: '',
      block: '',
      village: '',
      habitation: '',
      facility: '',
      street_name: '',
      street_gid: '',
    });
    this.filters = {
      DISTRICT_ID: null,
      BLOCK_ID: null,
      VILLAGE_ID: null,
      HABITATION_ID: null,
      FACILITY_ID: null,
      STREET_NAME: null,
      STREET_GID: null,
    };
    this.paginator.pageIndex = 0;
    this.loadRecords(
      this.currentUser,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
    // removing the selection for bulk edit
    this.selection.selected.forEach((id: any) => this.selection.deselect(id));
  }

  loadRecords(user: User, filters: any, pageIndex: number, pageSize: number) {
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };
    this.dataSource.loadStreets(
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

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  displayVillageFn(village?: any): string {
    return village ? village.village_name : '';
  }

  displayHabitationFn(habitation?: any): string {
    return habitation ? habitation.habitation_name : '';
  }

  displayFacilityFn(facility?: any): string {
    return facility ? facility.facility_name : '';
  }

  onVillageBlur() {
    console.log('1---> ', this.searchPanel.get('village')?.value);
    console.log('2---> ', this.searchPanel.get('village')?.valid);
    console.log('3---> ', this.filteredVillages);

    if (
      this.searchPanel.get('village')?.value &&
      this.searchPanel.get('village')?.valid
    ) {
      let selectedVillage = this.searchPanel.get('village')?.value;
      this.streetService
        .getHabitations(this.currentUser, selectedVillage.village_id)
        .subscribe((habitaions: Array<any>) => {
          console.log('Received :', habitaions);
          this.habitationList = habitaions;
          this.searchPanel
            .get('habitation')
            ?.setValidators([
              optionObjectObjectValidator(
                this.habitationList,
                'habitation_name'
              ),
            ]);
          this.searchPanel.get('habitation')?.setValue('');
          this.searchPanel.get('habitation')?.enable();
        });
    } else {
      this.habitationList = [];
      this.searchPanel.get('habitation')?.setValue('');
      this.searchPanel.get('habitation')?.disable();
    }
  }

  createExportData(data: any) {
    const exportData: any = [];
    for (var i = 0; i < data?.length; i++) {
      const elem = data[i];
      exportData.push({
        District: elem.district_name || '-',
        HUD: elem.hud_name || '-',
        Block: elem.block_name || '-',
        Village: elem.village_name || '-',
        Habitation: elem.habitation_name || '-',
        Street: elem.street_name || '-',
        'Sreet GID': elem.street_gid || '-',
        'Catering HSC': elem.facility_name || '-',
        'Catering Anganwadi': elem.catering_anganwadi_name || '-',
        'Revenue Village': elem.rev_village_name || '-',
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
    console.log('street export data', exportData);
    exportToExcel(exportData, 'Streets.xlsx');
  }

  total_records: any = [];

  downloadRecords(pageInd = 0) {
    this.isExportInProgress = true;
    this.streetService
      .getStreets(this.currentUser, this.filters, pageInd, 7000)
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

    // if (this.paginator.length <= 5000) {
    //   this.streetService
    //     .getStreets(this.currentUser, this.filters, 0, this.paginator.length)
    //     .subscribe(async (result: any) => {
    //       const data = result?.data || [];
    //       this.createExportData(data);
    //     });
    // } else {
    //   let data1 = this.streetService
    //     .getStreets(this.currentUser, this.filters, 0, 5000)
    //     .toPromise();

    //   let data2 = this.streetService
    //     .getStreets(this.currentUser, this.filters, 1, 5000)
    //     .toPromise();

    //   let promiseObjs = [data1, data2];

    //   if (this.paginator.length > 10000) {
    //     let data3 = this.streetService
    //       .getStreets(this.currentUser, this.filters, 2, 5000)
    //       .toPromise();
    //     promiseObjs = [data1, data2, data3];
    //   }

    //   Promise.all(promiseObjs).then((result: any) => {
    //     let obj = result.map((el) => el.data);
    //     obj = obj.flat();
    //     this.createExportData(obj);
    //   });
    // }

    // getExportData(pageInd) {
    //   console.log(pageInd);
    //   this.streetService
    //     .getStreets(this.currentUser, this.filters, pageInd, 7000)
    //     .subscribe(async (result: any) => {
    //       const data = result?.data || [];
    //       this.total_records.push(...data);
    //       if (result?.status == 'SUCCESS-CONTINUE') {
    //         this.getExportData(++pageInd);
    //       }
    //       if (result?.status == 'SUCCESS-FINAL') {
    //         this.createExportData(this.total_records);
    //       }
    //     });
    // }
  }

  disableEdit(data: any): boolean {
    return disableEdit(data?.street_name);
  }

  isAllSelected() {
    const selectedRecords = this.selection.selected;
    let records = this.dataSource.streetsSubject.value;
    //removing unallocated items from the list
    records = records.filter(
      (elem) => !elem?.street_name?.toLowerCase().includes('unallocated')
    );
    return !records.some((el) => selectedRecords.indexOf(el.street_id) == -1);
  }

  masterToggle() {
    let streets = this.dataSource.streetsSubject.value;
    //removing unallocated items from the list
    streets = streets.filter(
      (elem) => !elem?.street_name?.toLowerCase().includes('unallocated')
    );
    if (this.isAllSelected()) {
      streets.forEach((street) => {
        this.selection.deselect(street.street_id);
        let ind = this.bulkeditStreets.findIndex(
          (el: any) => el.street_id == street.street_id
        );
        if (ind >= 0) {
          this.bulkeditStreets.splice(ind, 1);
        }
      });
    } else {
      streets.forEach((street) => {
        this.selection.select(street.street_id);
        let ind = this.bulkeditStreets.findIndex(
          (el: any) => el.street_id == street.street_id
        );
        if (ind == -1) {
          this.bulkeditStreets.push(street);
        }
      });
    }
  }

  storeSelectedStreets(street: any) {
    let ind = this.bulkeditStreets.findIndex(
      (el: any) => el.street_id == street.street_id
    );
    ind == -1
      ? this.bulkeditStreets.push(street)
      : this.bulkeditStreets.splice(ind, 1);
    this.selection.toggle(street.street_id);
  }

  disableMasterToggle() {
    // disable master checkbox when all records are having unallocated name
    const streets = this.dataSource.streetsSubject.value;
    return streets.every((street) =>
      street?.street_name?.toLowerCase().includes('unallocated')
    );
  }

  bulkEdit() {
    console.log(this.selection.selected);
    console.log(this.bulkeditStreets);
    let blockIds: any = [];
    let villageIds: any = [];
    this.bulkeditStreets.forEach((el: any) => {
      if (blockIds.indexOf(el.block_id) == -1) blockIds.push(el.block_id);
      if (villageIds.indexOf(el.village_id) == -1) villageIds.push(el.village_id);
    });
    const dialogRef = this.dialog.open(StreetBulkEditDialogComponent, {
      data: {
        streetIds: this.selection.selected,
        blockIds: blockIds,
        villageIds: villageIds,
        wardData: this.bulkeditStreets[0]
      },
      width: '1000px',
      height: '500px',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('dialog close', result);
      this.selection.selected.forEach((id: any) => {
        this.selection.deselect(id);
        this.bulkeditStreets = [];
      });
      if (result) {
        // this.paginator.pageIndex = 0;
        this.loadRecords(
          this.currentUser,
          this.filters,
          this.paginator.pageIndex,
          this.paginator.pageSize
        );
      }
    });
  }
}
