import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { Constants } from 'src/app/config/constants/constants';
import { CategoryMaster } from 'src/app/models/category-master';
import { Facility } from 'src/app/models/facility';
import { FacilityLevelMaster } from 'src/app/models/facility-level-master';
import { FacilityTypeMaster } from 'src/app/models/facility-type-master';
import { DirectorateMaster } from 'src/app/models/master-directorate';
import { OwnerMaster } from 'src/app/models/master-owner';
import { StreetMaster } from 'src/app/models/master_street';
import { VillageMaster } from 'src/app/models/master_village';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { FacilityService } from '../service/facility.service';
import { FacilityMaster } from 'src/app/models/master_facility';
import { DistrictMaster } from 'src/app/models/master_district';
import { BlockMaster } from 'src/app/models/master_block';
import {
  isBlockAdmin,
  isDistrictAdmin,
  isStateAdmin,
} from 'src/app/utils/session.util';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { isUnallocated } from 'src/app/utils/unallocated.util';
import { resetFormList } from 'src/app/utils/form-util';

@Component({
  selector: 'app-add-facility',
  templateUrl: './add-facility.component.html',
  styleUrls: ['./add-facility.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddFacilityComponent implements OnInit, CanComponentDeactivate {
  facility: Facility;
  currentUser: User;
  isEdit: boolean;
  title: string;
  isCallInProgress: boolean = false;
  gidHeader: string = '';

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  blockList: BlockMaster[] = [];
  filteredBlocks: Subject<BlockMaster[]> = new Subject();

  ownerList: OwnerMaster[];
  filteredOwners: Subject<OwnerMaster[]> = new Subject();

  directorateList: DirectorateMaster[];
  filteredDirectorates: Subject<DirectorateMaster[]> = new Subject();

  categoryList: CategoryMaster[] = [];
  filteredCategories: Subject<CategoryMaster[]> = new Subject();

  typeList: FacilityTypeMaster[];
  filteredTypes: Subject<FacilityTypeMaster[]> = new Subject();

  levelList: FacilityLevelMaster[];
  filteredLevels: Subject<FacilityLevelMaster[]> = new Subject();

  villageList: VillageMaster[];
  filteredVillages: Subject<VillageMaster[]> = new Subject();

  streetList: StreetMaster[];
  filteredStreets: Subject<StreetMaster[]> = new Subject();

  parentFacilityList: FacilityMaster[] = [];
  filteredParentFacilities: Subject<FacilityMaster[]> = new Subject();

  facilityDetails: FormGroup;

  hwcOptions: Array<any>;

  isSubmit: boolean = false;

  hudList: any;
  filteredHuds: any = new Subject();

  constructor(
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _service: FacilityService,
    private _snackBar: MatSnackBar
  ) {
    this.isEdit = false;
    this.title = 'Create Facility';
  }

  ngOnInit(): void {
    this.hwcOptions = Constants.HWC_OPTIONS;

    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_FACILITY');

    if (_editObject) {
      this.facility = JSON.parse(_editObject);
      this.title = 'Edit Facility';
      this.isEdit = true;
      this.gidHeader = `(GID: ${this.facility.institution_gid})`;

      console.log('Edit Facility | Facility being edited :', this.facility);
    }

    this.facilityDetails = this._formBuilder.group({
      district: ['', [Validators.required, Validators.pattern("[0-9a-zA-Z: -_{},']*")]],
      hud: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      block: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      owner: ['', [Validators.required]],
      directorate: [{ value: '', disabled: true }, Validators.required],
      category: [{ value: '', disabled: true }, Validators.required],
      facility_type: [{ value: '', disabled: true }, Validators.required],
      level: [{ value: '', disabled: true }, Validators.required],
      parent_facility: [{ value: '', disabled: true }, [Validators.required]],
      facility_name: [
        this.facility ? this.facility.facility_name : '',
        Validators.pattern('[0-9A-z .()@-]*'),
      ],
      village: [''],
      street: [
        { value: this.getStreetForEdit(this.facility), disabled: true },
        Validators.pattern('[0-9A-z]*'),
      ],
      mobile_number: [
        this.facility ? this.facility.mobile_number?.toString() || '' : '',
        [
          Validators.maxLength(10),
          Validators.minLength(10),
          Validators.pattern('[0-9]*'),
        ],
      ],
      landline_number: [
        this.facility ? this.facility.landline_number : '',
        [Validators.pattern('[0-9]*'), Validators.maxLength(11)],
      ],
      email: [this.facility ? this.facility.email : '', Validators.email],
      latitude: [
        this.facility ? this.facility.facility_latitude : '',
        [Validators.required, Validators.pattern('([0-9]+[.][0-9]*[1-9]+)')],
      ],
      longitude: [
        this.facility ? this.facility.facility_longtitude : '',
        [Validators.required, Validators.pattern('([0-9]+[.][0-9]*[1-9]+)')],
      ],
      is_hwc: [this.facility ? this.facility.is_hwc : this.hwcOptions[0].name],
      active: [
        this.facility ? this.returnYesOrNo(this.facility.active) : '',
        Validators.required,
      ],
    });

    if (!this.isEdit) {
      this.facilityDetails.get('village')?.setValidators([Validators.required]);
    }

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Add Facility | Current User:', userString);
    if (userString) {
      this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
        console.log('Add Facility | district list:', values);
        this.districtList = values;
        this.facilityDetails
          .get('district')
          ?.addValidators([
            optionObjectObjectValidator(this.districtList, 'district_name'),
          ]);

        if (
          isDistrictAdmin(this.currentUser) ||
          isBlockAdmin(this.currentUser)
        ) {
          let disObj =
            this.districtList.find(
              (el) => el.district_id === this.currentUser?.district_id
            ) || '';
          this.facilityDetails.get('district')?.setValue(disObj);
          this.facilityDetails.get('district')?.disable();
        } else {
          let disObj =
            this.districtList.find(
              (el) => el.district_id === this.facility?.district_id
            ) || '';
          this.facilityDetails.get('district')?.setValue(disObj);
        }
      });

      this.getHudList();

      this.getBlockList();

      this._dataservice.getOwnersList().subscribe((values: Array<any>) => {
        console.log('Add Facility | owners list:', values);
        this.ownerList = values;
        this.facilityDetails
          .get('owner')
          ?.addValidators([
            optionObjectObjectValidator(this.ownerList, 'owner_name'),
          ]);

        // Get name for the id from the local db.
        if (this.facility && this.facility.owner_id) {
          let ownerId = this.facility.owner_id;
          console.log('Getting ownername for ownerId:', ownerId);
          this._service.getOwnerName(ownerId).then((ownerName) => {
            this.facilityDetails
              .get('owner')
              ?.setValue(
                this.facility
                  ? { owner_id: this.facility.owner_id, owner_name: ownerName }
                  : ''
              );
          });
        } else {
          this.facilityDetails.get('owner')?.setValue('');
        }
      });

      this._dataservice
        .getDirectoratesList()
        .subscribe((values: Array<any>) => {
          console.log('Add Facility | owners list:', values);
          this.directorateList = values;
          // filter the directorate list based on hierarchy in edit page
          if (this.facility?.owner_id) {
            this.directorateList = this.directorateList.filter(
              (dl) => dl.owner_id == this.facility.owner_id
            );
            this.facilityDetails.get('directorate')?.enable();
          }
          console.log('directorateList:', this.directorateList);
          this.facilityDetails
            .get('directorate')
            ?.addValidators([
              optionObjectObjectValidator(
                this.directorateList,
                'directorate_name'
              ),
            ]);

          // Get name for the id from the local db.
          if (this.facility && this.facility.directorate_id) {
            let directorateId = this.facility.directorate_id;
            console.log(
              'Getting directoratename for directorateId:',
              directorateId
            );
            this._service
              .getDirectorateName(directorateId)
              .then((directorateName) => {
                this.facilityDetails.get('directorate')?.setValue(
                  this.facility
                    ? {
                        directorate_id: this.facility.directorate_id,
                        directorate_name: directorateName,
                      }
                    : ''
                );
              });
          } else {
            this.facilityDetails.get('directorate')?.setValue('');
          }
        });

      this._dataservice.getCategoriesList().subscribe((values: Array<any>) => {
        console.log('Add Facility | category list:', values);
        this.categoryList = values;
        // filter the category list based on hierarchy in edit page
        if (this.facility?.owner_id && this.facility?.directorate_id) {
          this.categoryList = this.categoryList.filter(
            (cat) =>
              cat.directorate_id == this.facility.directorate_id &&
              cat.owner_id == this.facility.owner_id
          );
          this.facilityDetails.get('category')?.enable();
        }
        this.facilityDetails
          .get('category')
          ?.addValidators([
            optionObjectObjectValidator(this.categoryList, 'category_name'),
          ]);

        // Get name for the id from the local db.
        if (this.facility && this.facility.category_id) {
          let categoryId = this.facility.category_id;
          console.log('Getting categoryname for categoryId:', categoryId);
          this._service.getCategoryName(categoryId).then((categoryName) => {
            this.facilityDetails.get('category')?.setValue(
              this.facility
                ? {
                    category_id: this.facility.category_id,
                    category_name: categoryName,
                  }
                : ''
            );
          });
        } else {
          this.facilityDetails.get('category')?.setValue('');
        }
      });

      this._dataservice
        .getFacilityTypesList()
        .subscribe((values: Array<any>) => {
          console.log('Add Facility | facility type list:', values);
          this.typeList = values;
          // filter the type list based on hierarchy in edit page
          if (
            this.facility?.owner_id &&
            this.facility?.directorate_id &&
            this.facility?.category_id
          ) {
            this.typeList = this.typeList.filter(
              (type) =>
                type.category_id == this.facility.category_id &&
                type.directorate_id == this.facility.directorate_id &&
                type.owner_id == this.facility.owner_id
            );
            this.facilityDetails.get('facility_type')?.enable();
          }
          this.facilityDetails
            .get('facility_type')
            ?.addValidators([
              optionObjectObjectValidator(this.typeList, 'facility_type_name'),
            ]);
          this.facilityDetails.get('facility_type')?.setValue('');

          // Get name for the id from the local db.
          if (this.facility && this.facility.facility_type_id) {
            let typeId = this.facility.facility_type_id;
            console.log('Getting type for typeId:', typeId);
            this._service.getTypeName(typeId).then((typeName) => {
              this.facilityDetails.get('facility_type')?.setValue(
                this.facility
                  ? {
                      facility_type_id: this.facility.facility_type_id,
                      facility_type_name: typeName,
                    }
                  : ''
              );
            });
          } else {
            this.facilityDetails.get('facility_type')?.setValue('');
          }
        });

      this._dataservice
        .getFacilityLevelsList()
        .subscribe((values: Array<any>) => {
          console.log('Add Facility | level list:', values);
          this.levelList = values;
          // filter level list based on hierarchy in edit page
          if (
            this.facility?.owner_id &&
            this.facility?.directorate_id &&
            this.facility?.category_id &&
            this.facility?.facility_type_id
          ) {
            this.levelList = this.levelList.filter(
              (level) =>
                level.category_id == this.facility.category_id &&
                level.directorate_id == this.facility.directorate_id &&
                level.owner_id == this.facility.owner_id &&
                level.facility_type_id == this.facility.facility_type_id
            );
            this.facilityDetails.get('level')?.enable();
          }
          this.facilityDetails
            .get('level')
            ?.addValidators([
              optionObjectObjectValidator(
                this.levelList,
                'facility_level_name'
              ),
            ]);

          // Get name for the id from the local db.
          if (this.facility && this.facility.facility_level_id) {
            let typeId = this.facility.facility_level_id;
            console.log('Getting level for levelId:', typeId);
            this._service.getLevelName(typeId).then((levelName) => {
              this.facilityDetails.get('level')?.setValue(
                this.facility
                  ? {
                      facility_level_id: this.facility.facility_level_id,
                      facility_level_name: levelName,
                    }
                  : ''
              );
              // If level is 'State' disable district and block
              // Else if level is 'District' disable block.
              if (levelName === 'State' || levelName === 'Regional') {
                this.makeDistrictEmptyAndDisabled();
                this.makeHudEmptyAndDisabled();
                this.makeBlockEmptyAndDisabled();
              } else if (levelName === 'District') {
                this.makeHudEmptyAndDisabled();
                this.makeBlockEmptyAndDisabled();
              } else if (levelName === 'HUD') {
                this.makeBlockEmptyAndDisabled();
              }
              // display parent facility list based on hierarchy in edit
              this.handleParentFacility();
            });
          } else {
            this.facilityDetails.get('level')?.setValue('');
          }
        });

      this._dataservice.getVillageList().subscribe((values: Array<any>) => {
        console.log('Add Facility | village list:', values);
        this.villageList = values;
        this.facilityDetails
          .get('village')
          ?.addValidators([
            optionObjectObjectValidator(this.villageList, 'village_name'),
          ]);
        this.facilityDetails.get('village')?.setValue('');
      });
    } else {
      console.log('Add Facility | Navigating to login');
      this._router.navigateByUrl('/login');
      return;
    }

    this.onChanges();
  }

  getHudList() {
    this._dataservice.getHudList().subscribe((values: Array<any>) => {
      console.log('Add facility | hud list:', values);

      if (this.currentUser.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.currentUser.district_id
        );
      } else if (this.facility?.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.facility.district_id
        );
      } else {
        this.hudList = values;
      }

      this.facilityDetails
        .get('hud')
        ?.addValidators([
          optionObjectObjectValidator(this.hudList, 'hud_name'),
        ]);

      if (isBlockAdmin(this.currentUser)) {
        let hud =
          this.hudList.find((el) => el.hud_id === this.currentUser?.hud_id) ||
          '';
        this.facilityDetails.get('hud')?.setValue(hud);
        this.facilityDetails.get('hud')?.disable();
      } else {
        let hud =
          this.hudList.find((el) => el.hud_id === this.facility?.hud_id) || '';
        this.facilityDetails.get('hud')?.setValue(hud);
      }
    });
  }

  getBlockList() {
    this._dataservice.getBlocksList().subscribe((values: Array<any>) => {
      if (this.currentUser.district_id) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.currentUser.district_id
        );
      } else if (this.facility?.district_id) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.facility.district_id
        );
      } else {
        this.blockList = values;
      }

      if (this.facility?.hud_id) {
        this.blockList = values.filter(
          (el: any) => el.hud_id == this.facility.hud_id
        );
      }

      this.facilityDetails
        .get('block')
        ?.addValidators([
          optionObjectObjectValidator(this.blockList, 'block_name'),
        ]);

      if (isBlockAdmin(this.currentUser)) {
        let userBlockObj =
          this.blockList.find(
            (el: any) => el.block_id == this.currentUser?.block_id
          ) || '';
        this.facilityDetails.get('block')?.setValue(userBlockObj);
        this.facilityDetails.get('block')?.disable();
      } else {
        let block =
          this.blockList.find(
            (el: any) => el.block_id == this.facility?.block_id
          ) || '';
        this.facilityDetails.get('block')?.setValue(block);
      }
    });
  }

  handleParentFacility() {
    // handling parent facility

    this.facilityDetails.get('parent_facility')?.enable();

    // get parent facility list in case of edit
    if (
      this.facility?.owner_id &&
      this.facility?.directorate_id &&
      this.facility?.category_id &&
      this.facility?.facility_type_id &&
      this.facility?.facility_level_id
    ) {
      let prom1 = this._service.getLevelName(this.facility?.facility_level_id);
      let prom2 = this._service.getDirectorateName(
        this.facility?.directorate_id
      );
      let prom3 = this._service.getTypeName(this.facility?.facility_type_id);
      Promise.all([prom1, prom2, prom3]).then(
        ([fLevelName, dirName, fTypeName]) => {
          this._service
            .getParentFacilities(
              this.facility.owner_id,
              this.facility.directorate_id,
              this.facility.category_id,
              this.facility.facility_type_id,
              this.facility.facility_level_id,
              fLevelName,
              dirName,
              fTypeName
            )
            .then((parentFacilities: Array<any>) => {
              console.log(
                'Add facility | Received parent facilities:',
                parentFacilities
              );
              this.parentFacilityList = parentFacilities;
              // remove facility which is being edited from parent facility list
              if (this.facility) {
                let ind: number = this.parentFacilityList.findIndex(
                  (el) => el.facility_id == this.facility.facility_id
                );
                if (ind >= 0) this.parentFacilityList.splice(ind, 1);
              }
              this.facilityDetails
                .get('parent_facility')
                ?.addValidators([
                  optionObjectObjectValidator(
                    this.parentFacilityList,
                    'facility_name'
                  ),
                ]);
              if (this.facility?.parent_facility) {
                this.facilityDetails.get('parent_facility')?.setValue({
                  facility_id: this.facility.parent_facility,
                  facility_name: this.facility.parent_facility_name,
                });
              } else {
                this.facilityDetails.get('parent_facility')?.setValue('');
              }
            });
        }
      );
    } else {
      this.parentFacilityList = [];
      if (this.facility?.parent_facility) {
        this.facilityDetails.get('parent_facility')?.setValue({
          facility_id: this.facility.parent_facility,
          facility_name: this.facility.parent_facility_name,
        });
      } else {
        this.facilityDetails.get('parent_facility')?.setValue('');
      }
    }
  }

  onChanges(): void {
    this.facilityDetails.get('district')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Facility| district value:',
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

    this.facilityDetails.get('hud')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.hud_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.hudList.filter((hud: any) =>
        hud.hud_name.toLowerCase().includes(filterValue)
      );
      this.filteredHuds.next(filteredOne);
    });

    this.facilityDetails.get('block')?.valueChanges.subscribe((val: any) => {
      console.log('Add Facility| block value:', val, ' and type:', typeof val);
      console.log('block options list:', this.blockList);
      const filterValue =
        typeof val === 'object'
          ? val.block_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.blockList.filter((block: any) =>
        block.block_name.toLowerCase().includes(filterValue)
      );
      this.filteredBlocks.next(filteredOne);
    });

    this.facilityDetails.get('owner')?.valueChanges.subscribe((val: any) => {
      console.log('Add Facility| owner value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.owner_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.ownerList.filter((owner: any) =>
        owner.owner_name.toLowerCase().includes(filterValue)
      );
      this.filteredOwners.next(filteredOne);
    });

    this.facilityDetails
      .get('directorate')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'Add Facility| directorate value:',
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

    this.facilityDetails.get('category')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Facility| category value:',
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

    this.facilityDetails
      .get('facility_type')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'Add Facility| owner value:',
          val,
          ' and type:',
          typeof val
        );
        const filterValue =
          typeof val === 'object'
            ? val.facility_type_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.typeList.filter((facility_type: any) =>
          facility_type.facility_type_name.toLowerCase().includes(filterValue)
        );
        this.filteredTypes.next(filteredOne);
      });

    this.facilityDetails
      .get('parent_facility')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'Add Facility| level value:',
          val,
          ' and type:',
          typeof val
        );
        const filterValue =
          typeof val === 'object'
            ? val.facility_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.parentFacilityList.filter((facility: any) =>
          facility.facility_name.toLowerCase().includes(filterValue)
        );
        this.filteredParentFacilities.next(
          filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
        );
      });

    this.facilityDetails.get('level')?.valueChanges.subscribe((val: any) => {
      console.log('Add Facility| level value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.facility_level_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.levelList.filter((facility_level: any) =>
        facility_level.facility_level_name.toLowerCase().includes(filterValue)
      );
      this.filteredLevels.next(filteredOne);
    });

    this.facilityDetails.get('village')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Facility| village value:',
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

    this.facilityDetails.get('street')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Facility | street value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.street_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.streetList.filter((street: any) =>
        street.street_name.toLowerCase().includes(filterValue)
      );
      this.filteredStreets.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });
  }

  submitForm(): void {
    if (
      this.isBlockValueRequired() &&
      !this.facilityDetails.getRawValue().block
    ) {
      this.facilityDetails.get('block')?.setErrors([{ required: true }]);
    }

    if (this.isHudValueRequired() && !this.facilityDetails.getRawValue().hud) {
      this.facilityDetails.get('hud')?.setErrors([{ required: true }]);
    }

    if (
      this.isDistrictValueRequired() &&
      !this.facilityDetails.getRawValue().district
    ) {
      this.facilityDetails.get('district')?.setErrors([{ required: true }]);
    }

    this.facilityDetails.markAllAsTouched();

    if (!this.facilityDetails.valid) {
      console.log('Add Facility | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    if (!this.isEdit) {
      this.facility = new Facility();
      this.facility.facility_id = uuidv4();
      this.facility.institution_gid = 0;
    }

    this.facility.owner_id = this.facilityDetails.value['owner'].owner_id;
    if (this.facilityDetails.get('directorate')?.disabled) {
      this.facility.directorate_id =
        this.facilityDetails.getRawValue().directorate.directorate_id;
    } else {
      this.facility.directorate_id =
        this.facilityDetails.value['directorate'].directorate_id;
    }

    if (this.facilityDetails.get('category')?.disabled) {
      this.facility.category_id =
        this.facilityDetails.getRawValue().category.category_id;
    } else {
      this.facility.category_id =
        this.facilityDetails.value['category'].category_id;
    }

    if (this.facilityDetails.get('facility_type')?.disabled) {
      this.facility.facility_type_id =
        this.facilityDetails.getRawValue().facility_type.facility_type_id;
    } else {
      this.facility.facility_type_id =
        this.facilityDetails.value['facility_type'].facility_type_id;
    }

    if (this.facilityDetails.get('level')?.disabled) {
      this.facility.facility_level =
        this.facilityDetails.getRawValue().level.facility_level_name;
      this.facility.facility_level_id =
        this.facilityDetails.getRawValue().level.facility_level_id;
    } else {
      this.facility.facility_level =
        this.facilityDetails.value['level'].facility_level_name;
      this.facility.facility_level_id =
        this.facilityDetails.value['level'].facility_level_id;
    }

    this.facility.facility_name = this.facilityDetails.value['facility_name'];

    if (this.facilityDetails.get('street')?.disabled) {
      this.facility.hq_street =
        this.facilityDetails.getRawValue().street.street_id;
    } else {
      this.facility.hq_street = this.facilityDetails.value['street'].street_id;
    }

    this.facility.mobile_number = +this.facilityDetails.value['mobile_number'];
    this.facility.landline_number =
      this.facilityDetails.value['landline_number'];
    this.facility.email = this.facilityDetails.value['email'];
    this.facility.facility_latitude = parseFloat(
      this.facilityDetails.value['latitude']
    );
    this.facility.facility_longtitude = parseFloat(
      this.facilityDetails.value['longitude']
    );

    if (this.facilityDetails.get('parent_facility')?.disabled) {
      this.facility.parent_facility =
        this.facilityDetails.getRawValue().parent_facility.facility_id;
    } else {
      this.facility.parent_facility =
        this.facilityDetails.value['parent_facility'].facility_id;
    }

    if (this.facilityDetails.get('district')?.disabled) {
      this.facility.district_id = this.facilityDetails.getRawValue().district
        ? this.facilityDetails.getRawValue().district.district_id
        : null;
    } else {
      this.facility.district_id = this.facilityDetails.value['district']
        ? this.facilityDetails.value['district'].district_id
        : null;
    }

    if (this.facilityDetails.get('block')?.disabled) {
      this.facility.block_id = this.facilityDetails.getRawValue().block
        ? this.facilityDetails.getRawValue().block.block_id
        : null;
    } else {
      this.facility.block_id = this.facilityDetails.value['block']
        ? this.facilityDetails.value['block'].block_id
        : null;
    }

    this.facility.is_hwc = this.facilityDetails.value['is_hwc'];
    this.facility.active =
      this.facilityDetails.value['active'] == 'Yes' ? true : false;

    this.facility.hud_id =
      this.facilityDetails.get('hud')?.value?.hud_id || null;

    delete this.facility.parent_facility_name;

    this._service
      .upsertFacility(this.currentUser, this.facility)
      .subscribe((status) => {
        console.log('Add shop response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_FACILITY');
          this._snackBar.open(
            'Facility Added/Updated successfully.',
            'Dismiss',
            { duration: 4000 }
          );
          this._service.addFacilityToLocalDb(this.facility);
          this._router.navigateByUrl('/facility/facilities');
        } else {
          this._snackBar.open('Facility Add/Update failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  onOwnerBlur() {
    if (
      this.facilityDetails.get('owner')?.value &&
      this.facilityDetails.get('owner')?.valid
    ) {
      let selectedOwner = this.facilityDetails.get('owner')?.value;
      console.log('onOwnerBlur : Selected owner:', selectedOwner);
      let currentUserDirectorateId: any = this.currentUser.directorate_id;
      this._service
        .getDirectorates(
          selectedOwner.owner_id,
          currentUserDirectorateId,
          this.currentUser.directorate_name
        )
        .then((directorates: Array<any>) => {
          console.log('Add facility | Received directorates:', directorates);
          this.directorateList = directorates;
          this.facilityDetails
            .get('directorate')
            ?.setValidators([
              optionObjectObjectValidator(
                this.directorateList,
                'directorate_name'
              ),
            ]);
          this.facilityDetails.get('directorate')?.setValue('');
          this.facilityDetails.get('directorate')?.enable();
          this.facilityDetails
            .get('directorate')
            ?.addValidators([Validators.required]);
          this.facilityDetails.get('directorate')?.updateValueAndValidity();
        });
    } else {
      this.directorateList = [];
      this.facilityDetails.get('directorate')?.setValue('');
      this.facilityDetails.get('directorate')?.disable();
    }
  }

  onDirectorateBlur() {
    if (
      this.facilityDetails.get('directorate')?.value &&
      this.facilityDetails.get('directorate')?.valid
    ) {
      let selectedOwner = this.facilityDetails.get('owner')?.value;
      let selectedDirectorate = this.facilityDetails.get('directorate')?.value;
      console.log(
        'onDirectorateBlur : Selected owner:',
        selectedOwner,
        'and Selected directorate:',
        selectedDirectorate
      );
      this._service
        .getCategories(
          selectedOwner.owner_id,
          selectedDirectorate.directorate_id
        )
        .then((categories: Array<any>) => {
          console.log('Add facility | Received categories:', categories);
          this.categoryList = categories;
          this.facilityDetails
            .get('category')
            ?.setValidators([
              optionObjectObjectValidator(this.categoryList, 'category_name'),
            ]);
          this.facilityDetails.get('category')?.setValue('');
          this.facilityDetails.get('category')?.enable();
          this.facilityDetails
            .get('category')
            ?.addValidators([Validators.required]);
          this.facilityDetails.get('category')?.updateValueAndValidity();
        });
    } else {
      this.categoryList = [];
      this.facilityDetails.get('category')?.setValue('');
      this.facilityDetails.get('category')?.disable();
    }
  }

  onCategoryBlur() {
    if (
      this.facilityDetails.get('category')?.value &&
      this.facilityDetails.get('category')?.valid
    ) {
      let selectedOwner = this.facilityDetails.get('owner')?.value;
      let selectedDirectorate = this.facilityDetails.get('directorate')?.value;
      let selectedCategory = this.facilityDetails.get('category')?.value;
      console.log(
        'onCategoryBlur : Selected owner:',
        selectedOwner,
        ',Selected directorate:',
        selectedDirectorate,
        ', Selected category:',
        selectedCategory
      );
      this._service
        .getFacilityTypes(
          selectedOwner.owner_id,
          selectedDirectorate.directorate_id,
          selectedCategory.category_id
        )
        .then((facilityTypes: Array<any>) => {
          console.log('Add facility | Received facility types:', facilityTypes);
          this.typeList = facilityTypes;
          this.facilityDetails
            .get('facility_type')
            ?.setValidators([
              optionObjectObjectValidator(this.typeList, 'facility_type_name'),
            ]);
          this.facilityDetails.get('facility_type')?.setValue('');
          this.facilityDetails.get('facility_type')?.enable();
          this.facilityDetails
            .get('facility_type')
            ?.addValidators([Validators.required]);
          this.facilityDetails.get('facility_type')?.updateValueAndValidity();
        });
    } else {
      this.typeList = [];
      this.facilityDetails.get('facility_type')?.setValue('');
      this.facilityDetails.get('facility_type')?.disable();
    }
  }

  onFacilityTypeBlur() {
    if (
      this.facilityDetails.get('facility_type')?.value &&
      this.facilityDetails.get('facility_type')?.valid
    ) {
      let selectedOwner = this.facilityDetails.get('owner')?.value;
      let selectedDirectorate = this.facilityDetails.get('directorate')?.value;
      let selectedCategory = this.facilityDetails.get('category')?.value;
      let selectedFacilityType =
        this.facilityDetails.get('facility_type')?.value;
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
      this._service
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
          this.facilityDetails
            .get('level')
            ?.setValidators([
              optionObjectObjectValidator(
                this.levelList,
                'facility_level_name'
              ),
            ]);
          this.facilityDetails.get('level')?.setValue('');
          this.facilityDetails.get('level')?.enable();
          this.facilityDetails
            .get('level')
            ?.addValidators([Validators.required]);
          this.facilityDetails.get('level')?.updateValueAndValidity();
        });
    } else {
      this.levelList = [];
      this.facilityDetails.get('level')?.setValue('');
      this.facilityDetails.get('level')?.disable();
    }
  }

  onLevelBlur() {
    if (
      this.facilityDetails.get('level')?.value &&
      this.facilityDetails.get('level')?.valid
    ) {
      let selectedOwner = this.facilityDetails.get('owner')?.value;
      let selectedDirectorate = this.facilityDetails.get('directorate')?.value;
      let selectedCategory = this.facilityDetails.get('category')?.value;
      let selectedFacilityType =
        this.facilityDetails.get('facility_type')?.value;
      let selectedLevel = this.facilityDetails.get('level')?.value;
      console.log(
        'onLevelBlur : Selected owner:',
        selectedOwner,
        ',Selected directorate:',
        selectedDirectorate,
        ', Selected category:',
        selectedCategory,
        ', facilityType:',
        selectedFacilityType,
        ', selected level:',
        selectedLevel
      );

      this._service
        .getParentFacilities(
          selectedOwner.owner_id,
          selectedDirectorate.directorate_id,
          selectedCategory.category_id,
          selectedFacilityType.facility_type_id,
          selectedLevel.facility_level_id,
          selectedLevel.facility_level_name,
          selectedDirectorate.directorate_name,
          selectedFacilityType.facility_type_name
        )
        .then((parentFacilities: Array<any>) => {
          console.log(
            'Add facility | Received parent facilities:',
            parentFacilities
          );
          this.parentFacilityList = parentFacilities;
          // remove facility which is being edited from parent facility list
          if (this.facility) {
            let ind: number = this.parentFacilityList.findIndex(
              (el) => el.facility_id == this.facility.facility_id
            );
            if (ind >= 0) this.parentFacilityList.splice(ind, 1);
          }
          this.facilityDetails.get('parent_facility')?.clearValidators();
          this.facilityDetails
            .get('parent_facility')
            ?.setValidators([
              Validators.required,
              optionObjectObjectValidator(
                this.parentFacilityList,
                'facility_name'
              ),
            ]);
          this.facilityDetails.get('parent_facility')?.setValue('');
          this.facilityDetails.get('parent_facility')?.enable();
          this.facilityDetails.get('parent_facility')?.updateValueAndValidity();
        });

      // If level is 'State' then district, hud and block are optional
      // else if level is 'District' then hud, block are optional
      if (
        selectedLevel.facility_level_name == 'State' ||
        selectedLevel.facility_level_name === 'Regional'
      ) {
        // district field is editable only for state level user
        if (isStateAdmin(this.currentUser)) {
          this.facilityDetails.get('district')?.setValue('');
          this.facilityDetails.get('district')?.disable();
        }
        // hud and block fields are editable for state level and district level user
        if (
          isStateAdmin(this.currentUser) ||
          isDistrictAdmin(this.currentUser)
        ) {
          this.facilityDetails.get('hud')?.setValue('');
          this.facilityDetails.get('hud')?.disable();

          this.facilityDetails.get('block')?.setValue('');
          this.facilityDetails.get('block')?.disable();
        }
      } else if (selectedLevel.facility_level_name == 'District') {
        if (isStateAdmin(this.currentUser)) {
          resetFormList(
            this.facilityDetails,
            'district',
            'district_name',
            this.districtList,
            true,
            ''
          );
          this.facilityDetails.get('district')?.enable();
        }

        if (
          isStateAdmin(this.currentUser) ||
          isDistrictAdmin(this.currentUser)
        ) {
          this.facilityDetails.get('hud')?.setValue('');
          this.facilityDetails.get('hud')?.disable();

          this.facilityDetails.get('block')?.setValue('');
          this.facilityDetails.get('block')?.disable();
        }
      } else if (selectedLevel.facility_level_name == 'HUD') {
        if (isStateAdmin(this.currentUser)) {
          resetFormList(
            this.facilityDetails,
            'district',
            'district_name',
            this.districtList,
            true,
            ''
          );
          this.facilityDetails.get('district')?.enable();
        }

        if (
          isStateAdmin(this.currentUser) ||
          isDistrictAdmin(this.currentUser)
        ) {
          resetFormList(
            this.facilityDetails,
            'hud',
            'hud_name',
            this.hudList,
            true,
            ''
          );
          this.facilityDetails.get('hud')?.enable();

          this.facilityDetails.get('block')?.setValue('');
          this.facilityDetails.get('block')?.disable();
        }
      } else {
        if (isStateAdmin(this.currentUser)) {
          resetFormList(
            this.facilityDetails,
            'district',
            'district_name',
            this.districtList,
            true,
            ''
          );
          this.facilityDetails.get('district')?.enable();
        }

        if (
          isStateAdmin(this.currentUser) ||
          isDistrictAdmin(this.currentUser)
        ) {
          resetFormList(
            this.facilityDetails,
            'hud',
            'hud_name',
            this.hudList,
            true,
            ''
          );
          this.facilityDetails.get('hud')?.enable();

          resetFormList(
            this.facilityDetails,
            'block',
            'block_name',
            this.blockList,
            true,
            ''
          );
          this.facilityDetails.get('block')?.enable();
        }
      }
    } else {
      this.parentFacilityList = [];
      this.facilityDetails.get('parent_facility')?.setValue('');
      this.facilityDetails.get('parent_facility')?.disable();
    }
  }

  onVillageBlur() {
    if (
      this.facilityDetails.get('village')?.value &&
      this.facilityDetails.get('village')?.valid
    ) {
      let selectedVillage = this.facilityDetails.get('village')?.value;
      this._service
        .getStreets(this.currentUser, selectedVillage.village_id)
        .subscribe((streets: Array<any>) => {
          console.log('Add facility | Received streets:', streets);
          this.streetList = streets;
          this.facilityDetails
            .get('street')
            ?.setValidators([
              optionObjectObjectValidator(this.streetList, 'street_name'),
            ]);
          this.facilityDetails.get('street')?.setValue('');
          this.facilityDetails.get('street')?.enable();
          this.facilityDetails
            .get('street')
            ?.addValidators([Validators.required]);
          this.facilityDetails.get('street')?.updateValueAndValidity();
        });
    } else {
      this.streetList = [];
      this.facilityDetails.get('street')?.setValue('');
      this.facilityDetails.get('street')?.disable();
    }
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

  displayTypeFn(facility_type?: any): string {
    return facility_type ? facility_type.facility_type_name : '';
  }

  displayLevelFn(level?: any): string {
    return level ? level.facility_level_name : '';
  }

  displayVillageFn(village?: any): string {
    return village ? village.village_name : '';
  }

  displayStreetFn(street?: any): string {
    return street ? street.street_name : '';
  }

  displayFacilityFn(facility?: any): string {
    return facility ? facility.facility_name : '';
  }

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  displayHudFn(hud?: any): string {
    return hud ? hud.hud_name : '';
  }

  getStreetForEdit(facility: Facility) {
    return facility && facility.hq_street
      ? { street_id: facility.hq_street, street_name: facility.street_name }
      : '';
  }

  isDistrictDisabled(currentUser: User) {
    return (
      currentUser.phr_role != 'WEB_STATE_ADMIN' &&
      currentUser.phr_role != 'STATE_ADMIN'
    );
  }

  isHudDisabled(currentUser: User) {
    return (
      currentUser.phr_role != 'WEB_STATE_ADMIN' &&
      currentUser.phr_role != 'STATE_ADMIN' &&
      currentUser.phr_role != 'WEB_DISTRICT_ADMIN' &&
      currentUser.phr_role != 'DISTRICT_ADMIN'
    );
  }

  isBlockDisabled(currentUser: User) {
    return (
      currentUser.phr_role != 'WEB_STATE_ADMIN' &&
      currentUser.phr_role != 'STATE_ADMIN' &&
      currentUser.phr_role != 'WEB_DISTRICT_ADMIN' &&
      currentUser.phr_role != 'DISTRICT_ADMIN'
    );
  }

  async onDistrictBlur() {
    if (
      this.facilityDetails.get('district')?.value &&
      this.facilityDetails.get('district')?.valid
    ) {
      let selectedDistrict = this.facilityDetails.get('district')?.value;
      this.blockList = await this._service.getBlocksListForDistrict(
        selectedDistrict.district_id
      );
      this.hudList = await this._service.getHudListForDistrict(
        selectedDistrict.district_id
      );
    } else {
      this.blockList = await this._service.getBlocksList();
      this.hudList = await this._service.getHudList();
    }

    this.facilityDetails.get('block')?.clearValidators();
    this.facilityDetails
      .get('block')
      ?.addValidators([
        optionObjectObjectValidator(this.blockList, 'block_name'),
      ]);
    // Add 'required' validator based on level selected.
    if (this.isBlockValueRequired()) {
      this.facilityDetails.get('block')?.addValidators([Validators.required]);
    } else {
      this.facilityDetails.get('block')?.disable();
    }

    this.facilityDetails.get('block')?.setValue('');
    this.facilityDetails.get('block')?.updateValueAndValidity();

    this.facilityDetails.get('hud')?.clearValidators();
    this.facilityDetails
      .get('hud')
      ?.addValidators([optionObjectObjectValidator(this.hudList, 'hud_name')]);
    // Add 'required' validator based on level selected.
    if (this.isHudValueRequired()) {
      this.facilityDetails.get('hud')?.addValidators([Validators.required]);
    } else {
      this.facilityDetails.get('hud')?.disable();
    }
    this.facilityDetails.get('hud')?.setValue('');
    this.facilityDetails.get('hud')?.updateValueAndValidity();
  }

  async onHudBlur() {
    // if (
    //   this.facilityDetails.get('hud')?.value &&
    //   this.facilityDetails.get('hud')?.valid
    // ) {
    //   let selectedHud = this.facilityDetails.get('hud')?.value;
    //   this.blockList = await this._service.getBlocksListForHud(
    //     selectedHud.hud_id
    //   );
    // } else {
      if (this.facilityDetails.get('district')?.value) {
        this.blockList = await this._service.getBlocksListForDistrict(
          this.facilityDetails.get('district')?.value?.district_id
        );
      } else this.blockList = await this._service.getBlocksList();
    // }
    this.facilityDetails.get('block')?.clearValidators();
    this.facilityDetails
      .get('block')
      ?.addValidators([
        optionObjectObjectValidator(this.blockList, 'block_name'),
      ]);
    // Add 'required' validator based on level selected.
    if (this.isBlockValueRequired()) {
      this.facilityDetails.get('block')?.addValidators([Validators.required]);
    } else {
      this.facilityDetails.get('block')?.disable();
    }
    this.facilityDetails.get('block')?.setValue('');
    this.facilityDetails.get('block')?.updateValueAndValidity();
  }

  isBlockValueRequired(): boolean {
    const facilityLevelName =
      this.facilityDetails.getRawValue().level &&
      this.facilityDetails.getRawValue().level.facility_level_name;
    if (
      facilityLevelName === 'State' ||
      facilityLevelName === 'District' ||
      facilityLevelName === 'HUD' ||
      facilityLevelName === 'Regional'
    ) {
      return false;
    }
    return true;
  }

  isHudValueRequired(): boolean {
    const facilityLevelName =
      this.facilityDetails.getRawValue().level &&
      this.facilityDetails.getRawValue().level.facility_level_name;
    if (
      facilityLevelName === 'State' ||
      facilityLevelName === 'District' ||
      facilityLevelName === 'Regional'
    ) {
      return false;
    }
    return true;
  }

  isDistrictValueRequired(): boolean {
    const facilityLevelName =
      this.facilityDetails.getRawValue().level &&
      this.facilityDetails.getRawValue().level.facility_level_name;
    if (facilityLevelName === 'State' || facilityLevelName === 'Regional') {
      return false;
    }
    return true;
  }

  makeDistrictEmptyAndDisabled() {
    this.facilityDetails.get('district')?.setValue('');
    this.facilityDetails.get('district')?.disable();
  }

  makeHudEmptyAndDisabled() {
    this.facilityDetails.get('hud')?.setValue('');
    this.facilityDetails.get('hud')?.disable();
  }

  makeBlockEmptyAndDisabled() {
    this.facilityDetails.get('block')?.setValue('');
    this.facilityDetails.get('block')?.disable();
  }

  returnYesOrNo(flag: boolean) {
    return flag ? 'Yes' : 'No';
  }

  canDeactivate() {
    if (this.isSubmit) return false;
    else return this.facilityDetails.dirty;
  }

  isUnallocated(): boolean {
    return isUnallocated(this.facilityDetails);
  }
}
