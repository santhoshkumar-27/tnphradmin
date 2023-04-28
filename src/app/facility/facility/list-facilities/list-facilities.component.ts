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
import { tap } from 'rxjs/operators';
import { Facility } from 'src/app/models/facility';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { FacilityService } from '../service/facility.service';
import { FacilityDataSource } from './facility.datasource';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { FacilityMaster } from 'src/app/models/master_facility';
import { OwnerMaster } from 'src/app/models/master-owner';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { FacilityLevelMaster } from 'src/app/models/facility-level-master';
import { FacilityTypeMaster } from 'src/app/models/facility-type-master';
import { BlockMaster } from 'src/app/models/master_block';
import { DistrictMaster } from 'src/app/models/master_district';
import { Constants } from 'src/app/config/constants/constants';
import { isBlockAdmin, isDistrictAdmin } from 'src/app/utils/session.util';
import { exportToExcel } from '../../../utils/exportToExcel.util';
import { FacilityBulkEditComponent } from '../../facility-bulk-edit/facility-bulk-edit.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { disableEdit } from 'src/app/utils/unallocated.util';

@Component({
  selector: 'app-list-facilities',
  templateUrl: './list-facilities.component.html',
  styleUrls: ['./list-facilities.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListFacilitiesComponent implements OnInit {
  displayedColumns: string[] = [
    'select',
    'district',
    'hud',
    'block',
    'owner',
    'directorate',
    'category',
    'type',
    'level',
    'facility',
    'isActive',
    'actions',
  ];
  facility: Facility;
  dataSource: FacilityDataSource;
  filters = {
    OWNER_ID: null,
    DIRECTORATE_ID: null,
    CATEGORY_ID: null,
    FACILITY_TYPE_ID: null,
    FACILITY_LEVEL_ID: null,
    FACILITY_NAME: null,
    DISTRICT_ID: null,
    BLOCK_ID: null,
    INSTITUTION_GID: null,
  };
  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;

  ownerList: OwnerMaster[];
  filteredOwners: Subject<OwnerMaster[]> = new Subject();

  directorateList: FacilityMaster[];
  filteredDirectorates: Subject<FacilityMaster[]> = new Subject();

  categoryList: FacilityMaster[] = [];
  filteredCategories: Subject<FacilityMaster[]> = new Subject();

  typeList: FacilityTypeMaster[];
  filteredTypes: Subject<FacilityTypeMaster[]> = new Subject();

  levelList: FacilityLevelMaster[];
  filteredLevels: Subject<FacilityLevelMaster[]> = new Subject();

  districtList: DistrictMaster[] = [];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  blockList: BlockMaster[] = [];
  filteredBlocks: Subject<BlockMaster[]> = new Subject();

  currentUser: User;

  totalDistricts: DistrictMaster[] = [];
  totalBlocks: BlockMaster[] = [];

  selection = new SelectionModel<any>(true, []);
  facility_filters: any;

  isExportInProgress: boolean = false;

  constructor(
    private facilityService: FacilityService,
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

    this.dataSource = new FacilityDataSource(this.facilityService);

    this.searchPanel = this._formBuilder.group({
      owner: ['', Validators.pattern('[a-zA-z ]*')],
      directorate: [
        { value: '', disabled: true },
        Validators.pattern('[a-zA-z ]*'),
      ],
      category: [
        { value: '', disabled: true },
        Validators.pattern('[a-zA-z ]*'),
      ],
      type: [{ value: '', disabled: true }, Validators.pattern('[0-9A-z ]*')],
      level: [{ value: '', disabled: true }, Validators.pattern('[0-9A-z ]*')],
      facility_name: ['', Validators.pattern('[0-9A-z .()@-]*')],
      district: ['', Validators.pattern('[0-9a-zA-Z .!()_-]*')],
      block: ['', Validators.pattern('[0-9a-zA-Z .!()_-]*')],
      institution_gid: ['',Validators.pattern('[0-9a-zA-Z .!()_-]*')],
    });

    if (sessionStorage.getItem('facility_filters'))
      this.facility_filters = JSON.parse(
        sessionStorage.getItem('facility_filters')!
      );

    if (this.facility_filters) {
      const {
        owner,
        directorate,
        category,
        facilityType,
        facilityLevel,
        facilityName,
        district,
        block,
        insGid,
      } = this.facility_filters;
      this.searchPanel.patchValue({
        facility_name: facilityName ? facilityName.toLowerCase() : '',
        institution_gid: insGid || null,
      });
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        BLOCK_ID: block?.block_id || null,
        OWNER_ID: owner?.owner_id || null,
        CATEGORY_ID: category?.category_id || null,
        DIRECTORATE_ID: directorate?.directorate_id || null,
        FACILITY_LEVEL_ID: facilityLevel?.facility_level_id || null,
        FACILITY_TYPE_ID: facilityType?.facility_type_id || null,
        FACILITY_NAME: facilityName ? facilityName.toLowerCase() : '',
        INSTITUTION_GID: insGid,
      };
    }

    this._masterDataService.getOwnersList().subscribe((values: Array<any>) => {
      console.log('list-facility | get owner list: ', values);
      this.ownerList = values;
      this.searchPanel
        .get('owner')
        ?.setValidators([
          optionObjectObjectValidator(this.ownerList, 'owner_name'),
        ]);
      this.searchPanel
        .get('owner')
        ?.setValue(
          this.facility_filters?.owner ? this.facility_filters.owner : ''
        );
    });

    this._masterDataService
      .getDirectoratesList()
      .subscribe((values: Array<any>) => {
        console.log('list-facility | get directorate list: ', values);
        this.directorateList = values;
        this.searchPanel
          .get('directorate')
          ?.setValidators([
            optionObjectObjectValidator(
              this.directorateList,
              'directorate_name'
            ),
          ]);
        this.searchPanel
          .get('directorate')
          ?.setValue(
            this.facility_filters?.directorate
              ? this.facility_filters.directorate
              : ''
          );
      });

    this._masterDataService
      .getCategoriesList()
      .subscribe((values: Array<any>) => {
        console.log('list-facility | get category list: ', values);
        this.categoryList = values;
        this.searchPanel
          .get('category')
          ?.setValidators([
            optionObjectObjectValidator(this.categoryList, 'category_name'),
          ]);
        this.searchPanel
          .get('category')
          ?.setValue(
            this.facility_filters?.category
              ? this.facility_filters.category
              : ''
          );
      });

    this._masterDataService
      .getFacilityTypesList()
      .subscribe((values: Array<any>) => {
        console.log('list-facility | get type list: ', values);
        this.typeList = values;
        this.searchPanel
          .get('type')
          ?.setValidators([
            optionObjectObjectValidator(this.typeList, 'facility_type_name'),
          ]);
        this.searchPanel
          .get('type')
          ?.setValue(
            this.facility_filters?.facilityType
              ? this.facility_filters.facilityType
              : ''
          );
      });

    this._masterDataService
      .getFacilityLevelsList()
      .subscribe((values: Array<any>) => {
        console.log('list-facility | get level list: ', values);
        this.levelList = values;
        this.searchPanel
          .get('level')
          ?.setValidators([
            optionObjectObjectValidator(this.levelList, 'facility_level_name'),
          ]);
        this.searchPanel
          .get('level')
          ?.setValue(
            this.facility_filters?.facilityLevel
              ? this.facility_filters.facilityLevel
              : ''
          );
      });

    this.getDistrictList();
    this.getBlockList();

    this.onChanges();
  }

  getDistrictList() {
    this._masterDataService
      .getDistrictsList()
      .subscribe((values: Array<any>) => {
        console.log('value-3:', values);
        this.totalDistricts = values;
        if (
          this.currentUser &&
          (isDistrictAdmin(this.currentUser) || isBlockAdmin(this.currentUser))
        ) {
          let operatorDistrict = this.currentUser.district_id;
          console.log('Operator district id:', operatorDistrict);
          if (operatorDistrict) {
            let operDistrictObj: any = values.find(
              (district) => district.district_id === operatorDistrict
            );
            this.searchPanel.get('district')?.setValue(operDistrictObj);
            this.searchPanel.get('district')?.disable();
            this.districtList = [];
          }
        } else {
          this.districtList = values;
          this.searchPanel
            .get('district')
            ?.setValidators([
              optionObjectObjectValidator(this.districtList, 'district_name'),
            ]);
          this.searchPanel
            .get('district')
            ?.setValue(
              this.facility_filters?.district
                ? this.facility_filters.district
                : ''
            );
        }
      });
  }

  getBlockList() {
    this._masterDataService.getBlocksList().subscribe((values: Array<any>) => {
      console.log('value-3:', values);
      this.totalBlocks = values;
      if (this.currentUser && isDistrictAdmin(this.currentUser)) {
        let operatorDistrictId = this.currentUser.district_id;
        console.log('Operator District for block id:', operatorDistrictId);
        if (operatorDistrictId) {
          let filteredList = values.filter((block) => {
            return block.district_id === operatorDistrictId;
          });
          this.blockList = filteredList;
          this.searchPanel
            .get('block')
            ?.setValidators([
              optionObjectObjectValidator(this.blockList, 'block_name'),
            ]);
          this.searchPanel
            .get('block')
            ?.setValue(
              this.facility_filters?.block ? this.facility_filters.block : ''
            );
        }
      } else if (this.currentUser && isBlockAdmin(this.currentUser)) {
        let operatorBlockId = this.currentUser.block_id;
        console.log('Operator block id:', operatorBlockId);
        if (operatorBlockId) {
          let operBlockObj: any = values.find(
            (block) => block.block_id === operatorBlockId
          );
          this.searchPanel.get('block')?.setValue(operBlockObj);
          this.searchPanel.get('block')?.disable();
          this.blockList = [];
        }
      } else {
        if (this.facility_filters?.district) {
          this.blockList = values.filter(
            (block) => block.district_id === this.facility_filters.district.district_id
          );
        } else {
          this.blockList = values;
        }
        this.searchPanel
          .get('block')
          ?.setValidators([
            optionObjectObjectValidator(this.blockList, 'block_name'),
          ]);
        this.searchPanel
          .get('block')
          ?.setValue(
            this.facility_filters?.block ? this.facility_filters.block : ''
          );
      }
    });
  }

  ngAfterViewInit() {
    console.log('list-facility| ngAfterViewInit()');
    this.dataSource.loadFacilities(
      this.currentUser,
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
      this.dataSource.loadFacilities(
        this.currentUser,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      )
    );
  }
  onChanges(): void {
    console.log('list-facility | onChange()');

    this.searchPanel.get('owner')?.valueChanges.subscribe((val: any) => {
      console.log(
        'list-facility | Owner value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.owner_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.ownerList.filter((owner: any) =>
        owner.owner_name.toLowerCase().includes(filterValue)
      );
      this.filteredOwners.next(filteredOne);
    });

    this.searchPanel.get('directorate')?.valueChanges.subscribe((val: any) => {
      console.log(
        'list-facility | directorate value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.directorate_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.directorateList.filter((directorate: any) =>
        directorate.directorate_name.toLowerCase().includes(filterValue)
      );
      this.filteredDirectorates.next(filteredOne);
    });

    this.searchPanel.get('category')?.valueChanges.subscribe((val: any) => {
      console.log(
        'list-facility | category value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.category_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.categoryList.filter((category: any) =>
        category.category_name.toLowerCase().includes(filterValue)
      );
      this.filteredCategories.next(filteredOne);
    });

    this.searchPanel.get('type')?.valueChanges.subscribe((val: any) => {
      console.log('list-facility | Type value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.facility_type_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.typeList.filter((type: any) =>
        type.facility_type_name.toLowerCase().includes(filterValue)
      );
      this.filteredTypes.next(filteredOne);
    });

    this.searchPanel.get('level')?.valueChanges.subscribe((val: any) => {
      console.log(
        'list-facility | Level value:',
        val,
        ' and type:',
        typeof val
      );
      console.log('level list' + this.levelList);
      const filterValue =
        typeof val === 'object'
          ? val.facility_level_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.levelList.filter((level: any) =>
        level.facility_level_name.toLowerCase().includes(filterValue)
      );
      this.filteredLevels.next(filteredOne);
    });

    this.searchPanel.get('district')?.valueChanges.subscribe((val: any) => {
      console.log('district value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.district_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });

    this.searchPanel.get('block')?.valueChanges.subscribe((val: any) => {
      console.log('Block value:', val, ' and type:', typeof val);
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

  onDistrictBlur() {
    if (
      this.searchPanel.get('district')?.value &&
      this.searchPanel.get('district')?.valid
    ) {
      let selectedDistrict = this.searchPanel.get('district')?.value;
      this.facilityService
        .getBlocksListForDistrict(selectedDistrict.district_id)
        .then((blocks: Array<any>) => {
          console.log('Add Street | block list:', blocks);
          this.blockList = blocks;
          this.searchPanel.get('block')?.clearValidators();
          this.searchPanel
            .get('block')
            ?.addValidators([
              optionObjectObjectValidator(this.blockList, 'block_name'),
            ]);
          this.searchPanel.get('block')?.updateValueAndValidity();

          // TODO
          this.searchPanel.get('block')?.setValue('');
        });
    }
  }
  onOwnerBlur() {
    if (
      this.searchPanel.get('owner')?.value &&
      this.searchPanel.get('owner')?.valid
    ) {
      let selectedOwner = this.searchPanel.get('owner')?.value;
      console.log('onLevelBlur : Selected owner:', selectedOwner);
      let currentUserDirectorateId: any = this.currentUser.directorate_id;
      this.facilityService
        .getDirectorates(
          selectedOwner.owner_id,
          currentUserDirectorateId,
          this.currentUser.directorate_name
        )
        .then((directorates: Array<any>) => {
          console.log('Add facility | Received directorates:', directorates);
          this.directorateList = directorates;
          this.searchPanel
            .get('directorate')
            ?.setValidators([
              optionObjectObjectValidator(
                this.directorateList,
                'directorate_name'
              ),
            ]);
          this.searchPanel.get('directorate')?.setValue('');
          this.searchPanel.get('directorate')?.enable();
          this.searchPanel.get('directorate')?.updateValueAndValidity();
        });
    } else {
      this.directorateList = [];
      this.searchPanel.get('directorate')?.setValue('');
      this.searchPanel.get('directorate')?.disable();
    }
  }

  onDirectorateBlur() {
    if (
      this.searchPanel.get('directorate')?.value &&
      this.searchPanel.get('directorate')?.valid
    ) {
      let selectedOwner = this.searchPanel.get('owner')?.value;
      let selectedDirectorate = this.searchPanel.get('directorate')?.value;
      console.log(
        'onDirectorateBlur : Selected owner:',
        selectedOwner,
        'and Selected directorate:',
        selectedDirectorate
      );
      this.facilityService
        .getCategories(
          selectedOwner.owner_id,
          selectedDirectorate.directorate_id
        )
        .then((categories: Array<any>) => {
          console.log('Add facility | Received categories:', categories);
          this.categoryList = categories;
          this.searchPanel
            .get('category')
            ?.setValidators([
              optionObjectObjectValidator(this.categoryList, 'category_name'),
            ]);
          this.searchPanel.get('category')?.setValue('');
          this.searchPanel.get('category')?.enable();
          this.searchPanel.get('category')?.updateValueAndValidity();
        });
    } else {
      this.categoryList = [];
      this.searchPanel.get('category')?.setValue('');
      this.searchPanel.get('category')?.disable();
    }
  }

  onCategoryBlur() {
    if (
      this.searchPanel.get('category')?.value &&
      this.searchPanel.get('category')?.valid
    ) {
      let selectedOwner = this.searchPanel.get('owner')?.value;
      let selectedDirectorate = this.searchPanel.get('directorate')?.value;
      let selectedCategory = this.searchPanel.get('category')?.value;
      console.log(
        'onCategoryBlur : Selected owner:',
        selectedOwner,
        ',Selected directorate:',
        selectedDirectorate,
        ', Selected category:',
        selectedCategory
      );
      this.facilityService
        .getFacilityTypes(
          selectedOwner.owner_id,
          selectedDirectorate.directorate_id,
          selectedCategory.category_id
        )
        .then((facilityTypes: Array<any>) => {
          console.log('Add facility | Received facility types:', facilityTypes);
          this.typeList = facilityTypes;
          this.searchPanel
            .get('type')
            ?.setValidators([
              optionObjectObjectValidator(this.typeList, 'facility_type_name'),
            ]);
          this.searchPanel.get('type')?.setValue('');
          this.searchPanel.get('type')?.enable();
          this.searchPanel.get('type')?.updateValueAndValidity();
        });
    } else {
      this.typeList = [];
      this.searchPanel.get('type')?.setValue('');
      this.searchPanel.get('type')?.disable();
    }
  }

  onFacilityTypeBlur() {
    if (
      this.searchPanel.get('type')?.value &&
      this.searchPanel.get('type')?.valid
    ) {
      let selectedOwner = this.searchPanel.get('owner')?.value;
      let selectedDirectorate = this.searchPanel.get('directorate')?.value;
      let selectedCategory = this.searchPanel.get('category')?.value;
      let selectedFacilityType = this.searchPanel.get('type')?.value;
      console.log(
        'onCategoryBlur : Selected owner:',
        selectedOwner,
        ',Selected directorate:',
        selectedDirectorate,
        ', Selected category:',
        selectedCategory,
        ', facilityType:',
        selectedFacilityType
      );
      this.facilityService
        .getFacilityLevels(
          selectedOwner.owner_id,
          selectedDirectorate.directorate_id,
          selectedCategory.category_id,
          selectedFacilityType.facility_type_id
        )
        .then((facilityLevels: Array<any>) => {
          console.log(
            'Add facility | Received facility levels:',
            facilityLevels
          );
          this.levelList = facilityLevels;
          this.searchPanel
            .get('level')
            ?.setValidators([
              optionObjectObjectValidator(
                this.levelList,
                'facility_level_name'
              ),
            ]);
          this.searchPanel.get('level')?.setValue('');
          this.searchPanel.get('level')?.enable();
          this.searchPanel.get('level')?.updateValueAndValidity();
        });
    } else {
      this.levelList = [];
      this.searchPanel.get('level')?.setValue('');
      this.searchPanel.get('level')?.disable();
    }
  }
  editFacility(facility: any) {
    //console.log("In Edit User " + product);
    sessionStorage.setItem('EDIT_FACILITY', JSON.stringify(facility));
    this._router.navigateByUrl('/facility/facility/edit');
  }

  addFacility() {
    sessionStorage.removeItem('EDIT_FACILITY');
    this._router.navigateByUrl('/facility/facility/add');
  }

  getFilteredFacilityList() {
    // removing the selection for bulk edit
    this.selection.selected.forEach((id: any) => this.selection.deselect(id));
    console.log('get filters in facilities', this.searchPanel);
    if (this.searchPanel.valid) {
      console.log('list-facility | getFilteredfacilityList()');
      this.isCallInProgress = true;

      let district = null;
      if (this.searchPanel.get('district')?.disabled) {
        district = this.searchPanel.getRawValue().district?.district_id;
      } else {
        district =
          this.searchPanel.value['district'] ||
          this.searchPanel.value['district'] != ''
            ? this.searchPanel.value['district'].district_id
            : null;
      }

      let block = null;
      if (this.searchPanel.get('block')?.disabled) {
        block = this.searchPanel.getRawValue().block?.block_id;
      } else {
        block =
          this.searchPanel.value['block'] ||
          this.searchPanel.value['block'] != ''
            ? this.searchPanel.value['block'].block_id
            : null;
      }

      let _filters = {
        OWNER_ID:
          this.searchPanel.value['owner'] &&
          this.searchPanel.value['owner'] != ''
            ? this.searchPanel.value['owner'].owner_id
            : null,
        DIRECTORATE_ID:
          this.searchPanel.value['directorate'] &&
          this.searchPanel.value['directorate'] != ''
            ? this.searchPanel.value['directorate'].directorate_id
            : null,
        CATEGORY_ID:
          this.searchPanel.value['category'] &&
          this.searchPanel.value['category'] != ''
            ? this.searchPanel.value['category'].category_id
            : null,
        FACILITY_TYPE_ID:
          this.searchPanel.value['type'] && this.searchPanel.value['type'] != ''
            ? this.searchPanel.value['type'].facility_type_id
            : null,
        FACILITY_LEVEL_ID:
          this.searchPanel.value['level'] &&
          this.searchPanel.value['level'] != ''
            ? this.searchPanel.value['level'].facility_level_id
            : null,
        FACILITY_NAME:
          this.searchPanel.value['facility_name'] &&
          this.searchPanel.value['facility_name'] != ''
            ? this.searchPanel.value['facility_name'].toLowerCase()
            : null,
        DISTRICT_ID: district,
        BLOCK_ID: block,
        INSTITUTION_GID:
          this.searchPanel.value['institution_gid'] &&
          this.searchPanel.value['institution_gid'] != ''
            ? this.searchPanel.value['institution_gid']
            : null,
      };
      console.log(
        'list-facility | Calling get facilitys with Filters: ',
        _filters
      );
      this.filters = _filters;

      let obj = {
        district: this.searchPanel.get('district')?.value,
        block: this.searchPanel.get('block')?.value,
        owner: this.searchPanel.get('owner')?.value,
        directorate: this.searchPanel.get('directorate')?.value,
        category: this.searchPanel.get('category')?.value,
        facilityType: this.searchPanel.get('type')?.value,
        facilityLevel: this.searchPanel.get('level')?.value,
        facilityName: this.searchPanel.get('facility_name')?.value,
        insGid: this.searchPanel.get('institution_gid')?.value,
      };
      sessionStorage.setItem('facility_filters', JSON.stringify(obj));

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
    sessionStorage.removeItem('facility_filters');
    this.facility_filters = null;
    this.isCallInProgress = true;
    this.getDistrictList();
    this.getBlockList();
    this.searchPanel.patchValue({
      owner: '',
      directorate: '',
      category: '',
      type: '',
      level: '',
      facility_name: '',
      district: '',
      block: '',
      institution_gid: '',
    });
    this.searchPanel.get('directorate')?.disable();
    this.searchPanel.get('category')?.disable();
    this.searchPanel.get('type')?.disable();
    this.searchPanel.get('level')?.disable();
    this.filters = {
      OWNER_ID: null,
      DIRECTORATE_ID: null,
      CATEGORY_ID: null,
      FACILITY_TYPE_ID: null,
      FACILITY_LEVEL_ID: null,
      FACILITY_NAME: null,
      DISTRICT_ID: null,
      BLOCK_ID: null,
      INSTITUTION_GID: null,
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
    this.dataSource.loadFacilities(
      user,
      filters,
      pageIndex,
      pageSize,
      stopCallProgress
    );
  }

  displayOwnerFn(owner?: any): string {
    return owner ? owner.owner_name : '';
  }

  displayDirectorateFn(directorate?: any): string {
    return directorate ? directorate.directorate_name : '';
  }

  displayCategoryFn(category?: any): string {
    return category ? category.category_name : '';
  }

  displayTypeFn(type?: any): string {
    return type ? type.facility_type_name : '';
  }
  displayLevelFn(level?: any): string {
    return level ? level.facility_level_name : '';
  }
  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  async createExportData(data: any) {
    let exportData: any = [];
    for (var i = 0; i < data?.length; i++) {
      let elem = data[i];
      const districtName =
        this.totalDistricts?.find((dis) => dis.district_id == elem.district_id)
          ?.district_name || 'None';
      const blockName =
        this.totalBlocks?.find((blc) => blc.block_id == elem.block_id)
          ?.block_name || 'None';
      const categoryName =
        this.categoryList?.find((cat) => cat.category_id == elem.category_id)
          ?.category_name || 'None';
      const typeName =
        this.typeList?.find(
          (tyc) => tyc.facility_type_id == elem.facility_type_id
        )?.facility_type_name || 'None';
      const ownerName =
        this.ownerList?.find((ow) => ow.owner_id == elem.owner_id)
          ?.owner_name || 'None';
      const directorateName =
        this.directorateList?.find(
          (dir) => dir.directorate_id == elem.directorate_id
        )?.directorate_name || 'None';
      const hud = elem.hud_id
        ? await this.facilityService.getHudName(elem.hud_id)
        : null;

      exportData.push({
        District: districtName || '-',
        HUD: hud || '-',
        Block: blockName || '-',
        Owner: ownerName || '-',
        Directorate: directorateName || '-',
        Category: categoryName || '-',
        Type: typeName || '-',
        Level: elem.facility_level || '-',
        Facility: elem.facility_name || '-',
        'Facility GID': elem.institution_gid || '-',
        'Parent facility': elem.parent_facility_name || '-',
        'Whether HWC': elem.is_hwc || '-',
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
    console.log('facility export data', exportData);
    exportToExcel(exportData, 'Facilities.xlsx');
  }

  total_records: any = [];

  downloadRecords(pageInd = 0) {
    this.isExportInProgress = true;
    this.facilityService
      .getFacilities(this.currentUser, this.filters, pageInd, 10000)
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
    //   this.facilityService
    //     .getFacilities(this.currentUser, this.filters, 0, this.paginator.length)
    //     .subscribe(async (result: any) => {
    //       const data = result?.data || [];
    //       this.createExportData(data);
    //     });
    // } else {
    //   let data1 = this.facilityService
    //     .getFacilities(this.currentUser, this.filters, 0, 5000)
    //     .toPromise();

    //   let data2 = this.facilityService
    //     .getFacilities(this.currentUser, this.filters, 1, 5000)
    //     .toPromise();
    //   let promiseObjs = [data1, data2];
    //   if (this.paginator.length > 10000) {
    //     let data3 = this.facilityService
    //       .getFacilities(this.currentUser, this.filters, 2, 5000)
    //       .toPromise();
    //     promiseObjs = [data1, data2, data3];
    //   }
    //   Promise.all(promiseObjs).then((result: any) => {
    //     let obj = result.map((el) => el.data);
    //     obj = obj.flat();
    //     this.createExportData(obj);
    //   });
    // }
  }

  isAllSelected() {
    const selectedRecords = this.selection.selected;
    let records = this.dataSource.facilitiesSubject.value;
    //removing unallocated items from the list
    records = records.filter(
      (elem) => !elem?.facility_name?.toLowerCase().includes('unallocated')
    );
    return !records.some((el) => selectedRecords.indexOf(el.facility_id) == -1);
  }

  masterToggle() {
    let facilities = this.dataSource.facilitiesSubject.value;
    //removing unallocated items from the list
    facilities = facilities.filter(
      (elem) => !elem?.facility_name?.toLowerCase().includes('unallocated')
    );
    this.isAllSelected()
      ? facilities.forEach((facility) =>
          this.selection.deselect(facility.facility_id)
        )
      : facilities.forEach((facility) =>
          this.selection.select(facility.facility_id)
        );
  }

  disableMasterToggle() {
    // disable master checkbox when all records are having unallocated name
    const facilities = this.dataSource.facilitiesSubject.value;
    return facilities.every((el) =>
      el?.facility_name?.toLowerCase().includes('unallocated')
    );
  }

  bulkEdit() {
    console.log(this.selection.selected);
    const dialogRef = this.dialog.open(FacilityBulkEditComponent, {
      data: {
        facilityIds: this.selection.selected,
      },
      width: '1000px',
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
          this.currentUser,
          this.filters,
          this.paginator.pageIndex,
          this.paginator.pageSize
        );
      }
    });
  }

  disableEdit(data: any): boolean {
    return disableEdit(data?.facility_name);
  }
}
