import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Constants } from 'src/app/config/constants/constants';
import { Street } from 'src/app/models/street';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { StreetService } from '../service/street.service';
import { map } from 'rxjs/operators';
import { resetFormList } from 'src/app/utils/form-util';
import {
  isBlockAdmin,
  isDistrictAdmin,
  isStateAdmin,
} from 'src/app/utils/session.util';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { isUnallocated } from 'src/app/utils/unallocated.util';

@Component({
  selector: 'app-add-street',
  templateUrl: './add-street.component.html',
  styleUrls: ['./add-street.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddStreetComponent implements OnInit, CanComponentDeactivate {
  street: Street;
  currentUser: User;
  isEdit: boolean;
  title: string;
  isCallInProgress: boolean = false;
  gidHeader: string = '';

  districtList: any;
  filteredDistricts: any = new Subject();
  hudList: any;
  filteredHuds: any = new Subject();
  blockList: any;
  filteredBlocks: any = new Subject();
  villageList: any;
  filteredVillages: any = new Subject();
  habitationList: any;
  filteredHabitations: any = new Subject();
  facilityList: any;
  filteredFacilities: any = new Subject();
  revVillageList: any;
  filteredRevVillages: any = new Subject();
  AssemblyList: any;
  filteredAssConstituency: any = new Subject();
  ParliamentList: any;
  filteredParConstituency: any = new Subject();

  hscUnits = Constants.HSC_UNIT_LIST;
  anganwadiList: any = [];
  filteredAnganwadis: any = new Subject();

  // Vertical Stepper
  streetDetails: FormGroup;

  isSubmit: boolean = false;

  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   */
  constructor(
    private _formBuilder: FormBuilder,
    private streetService: StreetService,
    private _router: Router,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _snackBar: MatSnackBar,
    private _dataService: DataStoreService
  ) {
    this.isEdit = false;
    this.title = 'Create Street';
  }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_STREET');

    if (_editObject) {
      this.street = JSON.parse(_editObject);
      this.title = 'Edit Street';
      this.isEdit = true;
      this.gidHeader = `(GID: ${this.street.street_gid})`;

      console.log('Add Street | Street being edited :', this.street);
    }

    this.streetDetails = this._formBuilder.group({
      district: ['', [Validators.required, Validators.pattern("[0-9a-zA-Z: -_{},']*")]],
      hud: ['', [Validators.required, Validators.pattern("[0-9a-zA-Z: -_{},']*")]],
      block: ['', [Validators.required, Validators.pattern("[0-9a-zA-Z: -_{},']*")]],
      village: [
        {
          value: '',
          disabled: true,
        },
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')
      ]],
      habitation: [
        {
          value: '',
          disabled: true,
        },
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')
      ]],
      facility: [
        {
          value: '',
          disabled: true,
        },
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')]
      ],
      street: [this.street ? this.street.street_name : '', [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')]],
      pincode: [
        this.street ? this.street.pincode : 0.0,
        [Validators.required, Validators.pattern('[1-9][0-9]{5}')],
      ],
      latitude: [
        this.street ? this.street.street_latitude : '0',
        [Validators.pattern('[0-9]*.?[0-9]*')],
      ],
      longitude: [
        this.street ? this.street.street_longitude : '0',
        [Validators.pattern('[0-9]*.?[0-9]*')],
      ],
      isCoastalArea: [this.street ? this.street.coastal_area : false],
      isHillyArea: [this.street ? this.street.hilly_area : false],
      isForestArea: [this.street ? this.street.forest_area : false],
      isTribalArea: [this.street ? this.street.tribal_area : false],
      revVillage: ['', [Validators.required]],
      assConstituency: ['', [Validators.required]],
      parConstituency: ['', [Validators.required]],
      hsc_unit_name: [this.street ? this.street.hsc_unit_name : ''],
      anganwadi: [
        {
          value: '',
          disabled: true,
        },
        [Validators.required],
      ],
      ward_number: [
        this.street ? this.street.ward_number : '',
        [Validators.pattern('[1-9]{1}[0-9]{0,3}[a-zA-Z]{0,1}')],
      ],
      active: [
        this.street ? this.returnYesOrNo(this.street.active) : '',
        Validators.required,
      ],
    });

    //this.streetDetails.setValidators((form) => Validators.required(form.get('anganwadi')!));

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Add Street | Current User:', userString);
    if (userString) {
      this.getDistrictList();
      this.getHudList();
      this.getBlockList();
      this.getAssemblyConsList();
      this.getParlimentaryConsList();
      this.getRevVillageList();
    } else {
      console.log('Add Street | Navigating to login');
      this._router.navigateByUrl('/login');
      return;
    }

    this.onChanges();
  }

  getDistrictList() {
    this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
      console.log('Add Street | district list:', values);
      // For distric admin or block admin, he should be able to select only his district
      if (isDistrictAdmin(this.currentUser) || isBlockAdmin(this.currentUser)) {
        let operatorDistrict = this.currentUser.district_id;
        console.log('Operator district id:', operatorDistrict);
        this.districtList = [];
        if (!operatorDistrict) {
          console.error(
            'District id not present for District-admin/Block-admin operator logged in.'
          );
        } else {
          let userDisObj = values.find((district) => {
            return district.district_id === operatorDistrict;
          });
          this.streetDetails.get('district')?.setValue(userDisObj);
          this.streetDetails.get('district')?.disable();
        }
      } else {
        // If not a district admin, show full dropdown list.
        this.districtList = values;
        this.streetDetails
          .get('district')
          ?.addValidators([
            optionObjectObjectValidator(this.districtList, 'district_name'),
          ]);
        this.streetDetails.get('district')?.setValue(
          this.street?.district_id
            ? {
                district_id: this.street.district_id,
                district_name: this.street.district_name,
              }
            : ''
        );
      }
    });
  }

  getHudList() {
    this._dataservice.getHudList().subscribe((values: Array<any>) => {
      console.log('Add Street | hud list:', values);

      if (this.currentUser.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.currentUser.district_id
        );
      } else if (this.street?.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.street.district_id
        );
      } else {
        this.hudList = values;
      }

      this.streetDetails
        .get('hud')
        ?.addValidators([
          optionObjectObjectValidator(this.hudList, 'hud_name'),
        ]);
      this.streetDetails
        .get('hud')
        ?.setValue(
          this.street
            ? { hud_id: this.street.hud_id, hud_name: this.street.hud_name }
            : ''
        );
    });
  }

  getBlockLowerEntities(blockId: string) {
    //fetching villages
    this.streetService.getVillages(blockId).then((villages: Array<any>) => {
      console.log('Street Add | Received villages:', villages);
      this.villageList = villages;
      //assign village value in case of edit or assign "" in case of add
      let villageValue = this.street?.village_id
        ? {
            village_id: this.street.village_id,
            village_name: this.street.village_name,
          }
        : '';
      resetFormList(
        this.streetDetails,
        'village',
        'village_name',
        this.villageList,
        true,
        villageValue
      );
      this.streetDetails.get('village')?.enable();
    });
    // fetch habitations based on village value in edit
    if (this.street?.village_id) {
      this.streetService
        .getHabitations(this.currentUser, this.street.village_id)
        .subscribe((habitaions: Array<any>) => {
          this.habitationList = habitaions;
          let habVal = this.street?.habitation_id
            ? {
                habitation_id: this.street.habitation_id,
                habitation_name: this.street.habitation_name,
              }
            : '';
          resetFormList(
            this.streetDetails,
            'habitation',
            'habitation_name',
            this.habitationList,
            true,
            habVal
          );
          this.streetDetails.get('habitation')?.enable();
        });
    }
    // fetching catering hscs
    this.streetService
      .getHSCFacilities(this.currentUser, blockId)
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
        let cHSCValue = this.street?.facility_id
          ? {
              facility_id: this.street.facility_id,
              facility_name: this.street.facility_name,
            }
          : '';
        resetFormList(
          this.streetDetails,
          'facility',
          'facility_name',
          this.facilityList,
          true,
          cHSCValue
        );
        this.streetDetails.get('facility')?.enable();
      });
    // fetching catering anganwadies
    this.streetService
      .getAnganwadis(this.currentUser, blockId)
      .pipe(
        map((response: any) => {
          const anganwadis: Array<any> = response.data;
          return anganwadis;
        })
      )
      .subscribe((anganwadis: Array<any>) => {
        this.anganwadiList = anganwadis;
        let anganwadiVal = this.street?.catering_anganwadi_id
          ? {
              facility_id: this.street.catering_anganwadi_id,
              facility_name: this.street.catering_anganwadi_name,
            }
          : '';
        resetFormList(
          this.streetDetails,
          'anganwadi',
          'facility_name',
          this.anganwadiList,
          true,
          anganwadiVal
        );
        this.streetDetails.get('anganwadi')?.enable();
      });
  }

  getBlockList() {
    this._dataservice.getBlocksList().subscribe((values: Array<any>) => {
      console.log('Add Street | block list:', values);

      if (this.currentUser.district_id) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.currentUser.district_id
        );
      } else if (this.street?.district_id) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.street.district_id
        );
      } else {
        this.blockList = values;
      }

      // if (this.street?.hud_id) {
      //   this.blockList = values.filter(
      //     (el: any) => el.hud_id == this.street.hud_id
      //   );
      // }

      if (isBlockAdmin(this.currentUser)) {
        let userBlockId = this.currentUser.block_id;
        let userBlockObj = this.blockList.find(
          (el: any) => el.block_id == userBlockId
        );
        this.streetDetails.get('block')?.setValue(userBlockObj);
        this.streetDetails.get('block')?.disable();
        // fetching lower entities of the block for block admin in both add & edit pages
        if (userBlockId) this.getBlockLowerEntities(userBlockId);
      } else {
        this.streetDetails
          .get('block')
          ?.addValidators([
            optionObjectObjectValidator(this.blockList, 'block_name'),
          ]);
        this.streetDetails.get('block')?.setValue(
          this.street
            ? {
                block_id: this.street.block_id,
                block_name: this.street.block_name,
              }
            : ''
        );
        // fetching lower entities of the block in case of edit
        if (this.street?.block_id)
          this.getBlockLowerEntities(this.street.block_id);
      }
    });
  }

  getAssemblyConsList() {
    this._dataservice
      .getAssemblyConstituencyList()
      .subscribe((values: Array<any>) => {
        console.log('Add Street | assConstituency list:', values);
        this.AssemblyList = values;
        this.streetDetails
          .get('assConstituency')
          ?.addValidators([
            optionObjectObjectValidator(
              this.AssemblyList,
              'assembly_constituency_name'
            ),
          ]);
        if (this.street && this.street.assembly_constituency_name) {
          this.streetDetails.get('assConstituency')?.setValue(
            this.street?.assembly_constituency_id
              ? {
                  assembly_constituency_id:
                    this.street.assembly_constituency_id,
                  assembly_constituency_name:
                    this.street.assembly_constituency_name,
                }
              : ''
          );
        } else {
          this.streetDetails.get('assConstituency')?.setValue('');
        }
      });
  }

  getParlimentaryConsList() {
    this._dataservice
      .getParliamentConstituencyList()
      .subscribe((values: Array<any>) => {
        console.log('Add Street | parConstituency list:', values);
        this.ParliamentList = values;
        this.streetDetails
          .get('parConstituency')
          ?.addValidators([
            optionObjectObjectValidator(
              this.ParliamentList,
              'parlimentary_constituency_name'
            ),
          ]);
        if (this.street && this.street.parlimentary_constituency_name) {
          this.streetDetails.get('parConstituency')?.setValue(
            this.street?.parlimentary_constituency_id
              ? {
                  parlimentary_constituency_id:
                    this.street.parlimentary_constituency_id,
                  parlimentary_constituency_name:
                    this.street.parlimentary_constituency_name,
                }
              : ''
          );
        } else {
          this.streetDetails.get('parConstituency')?.setValue('');
        }
      });
  }

  getRevVillageList() {
    this._dataservice.getRevVillageList().subscribe((values: Array<any>) => {
      console.log('Add Street | rev village list:', values);
      this.revVillageList = values;
      this.streetDetails
        .get('revVillage')
        ?.addValidators([
          optionObjectObjectValidator(this.revVillageList, 'rev_village_name'),
        ]);
      this.streetDetails.get('revVillage')?.setValue(
        this.street?.rev_village_id
          ? {
              rev_village_id: this.street.rev_village_id,
              rev_village_name: this.street.rev_village_name,
            }
          : ''
      );
    });
  }

  onChanges(): void {
    console.log('Add Street | onChange()');

    this.streetDetails.get('district')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Street | district value:',
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

    this.streetDetails.get('hud')?.valueChanges.subscribe((val: any) => {
      console.log('Add Street | hud value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.hud_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.hudList.filter((hud: any) =>
        hud.hud_name.toLowerCase().includes(filterValue)
      );
      this.filteredHuds.next(filteredOne);
    });

    this.streetDetails.get('block')?.valueChanges.subscribe((val: any) => {
      console.log('Add Street | block value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.block_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.blockList.filter((block: any) =>
        block.block_name.toLowerCase().includes(filterValue)
      );
      this.filteredBlocks.next(filteredOne);
    });

    this.streetDetails.get('village')?.valueChanges.subscribe((val: any) => {
      console.log('---> before: ', Date.now());
      console.log('Add Street | village value:', val, ' and type:', typeof val);
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
      console.log('---> after: ', Date.now());
    });

    this.streetDetails.get('habitation')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Street | habitation value:',
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

    this.streetDetails.get('facility')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Street | facility value:',
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

    this.streetDetails.get('anganwadi')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Street | anganwadi value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.facility_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.anganwadiList.filter((anganwadi: any) =>
        anganwadi.facility_name.toLowerCase().includes(filterValue)
      );
      this.filteredAnganwadis.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });

    this.streetDetails.get('revVillage')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add Street | revVillage value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.rev_village_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.revVillageList.filter((revVillage: any) =>
        revVillage.rev_village_name.toLowerCase().includes(filterValue)
      );
      this.filteredRevVillages.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });

    this.streetDetails
      .get('assConstituency')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'Add Street | assConstituency value:',
          val,
          ' and type:',
          typeof val
        );
        const filterValue =
          typeof val === 'object'
            ? val.assembly_constituency_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.AssemblyList.filter((assConstituency: any) =>
          assConstituency.assembly_constituency_name
            .toLowerCase()
            .includes(filterValue)
        );
        this.filteredAssConstituency.next(
          filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
        );
      });

    this.streetDetails
      .get('parConstituency')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'Add Street | parConstituency value:',
          val,
          ' and type:',
          typeof val
        );
        const filterValue =
          typeof val === 'object'
            ? val.parlimentary_constituency_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.ParliamentList.filter((parConstituency: any) =>
          parConstituency.parlimentary_constituency_name
            .toLowerCase()
            .includes(filterValue)
        );
        this.filteredParConstituency.next(
          filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
        );
      });
  }

  submitForm(): void {
    if (!this.streetDetails.valid) {
      console.log('Add Street | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    //alert('You have finished the vertical stepper!');
    if (!this.isEdit) {
      this.street = new Street();
      this.street.street_id = uuidv4();
      this.street.street_gid = 0;
    }

    this.street.district_id =
      this.streetDetails.get('district')?.value.district_id;
    this.street.hud_id = this.streetDetails.get('hud')?.value.hud_id;
    this.street.block_id = this.streetDetails?.get('block')?.value.block_id;

    if (this.streetDetails.get('village')?.disabled) {
      this.street.village_id =
        this.streetDetails.getRawValue().village.village_id;
    } else {
      this.street.village_id = this.streetDetails.value['village'].village_id;
    }
    if (this.streetDetails.get('habitation')?.disabled) {
      this.street.habitation_id =
        this.streetDetails.getRawValue().habitation.habitation_id;
    } else {
      this.street.habitation_id =
        this.streetDetails.value['habitation'].habitation_id;
    }
    if (this.streetDetails.get('facility')?.disabled) {
      this.street.facility_id =
        this.streetDetails.getRawValue().facility.facility_id;
    } else {
      this.street.facility_id =
        this.streetDetails.value['facility'].facility_id;
    }
    this.street.rev_village_id =
      this.streetDetails.value['revVillage'].rev_village_id;
    this.street.street_name = this.streetDetails.value['street'];
    this.street.pincode = +this.streetDetails.value['pincode'];
    this.street.street_latitude = this.streetDetails.value['latitude'];
    this.street.street_longitude = this.streetDetails.value['longitude'];
    this.street.coastal_area = this.streetDetails.value['isCoastalArea'];
    this.street.hilly_area = this.streetDetails.value['isHillyArea'];
    this.street.forest_area = this.streetDetails.value['isForestArea'];
    this.street.tribal_area = this.streetDetails.value['isTribalArea'];
    //this.street.assembly_constituency_id = this.streetDetails.value['assConstituency'];
    this.street.assembly_constituency_id =
      this.streetDetails.value['assConstituency'].assembly_constituency_id;
    this.street.assembly_constituency_name =
      this.streetDetails.value['assConstituency'].assembly_constituency_name;
    //this.street.parlimentary_constituency_id = this.streetDetails.value['parConstituency'];
    this.street.parlimentary_constituency_id =
      this.streetDetails.value['parConstituency'].parlimentary_constituency_id;
    this.street.parlimentary_constituency_name =
      this.streetDetails.value[
        'parConstituency'
      ].parlimentary_constituency_name;

    this.street.hsc_unit_name = this.streetDetails.value['hsc_unit_name'];

    // Handle anganwadi in request payload
    if (this.streetDetails.get('anganwadi')?.disabled) {
      this.street.catering_anganwadi_id =
        this.streetDetails.getRawValue().anganwadi.facility_id;
    } else {
      this.street.catering_anganwadi_id =
        this.streetDetails.value['anganwadi'].facility_id;
    }

    this.street.ward_number = this.streetDetails.value['ward_number']
      ? this.streetDetails.value['ward_number']
      : null;
    this.street.active =
      this.streetDetails.value['active'] == 'Yes' ? true : false;

    this.streetService
      .upsertStreet(this.currentUser, this.street)
      .subscribe((status) => {
        console.log('Add street response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_STREET');
          this._snackBar.open('Street Added/Updated successfully.', 'Dismiss', {
            duration: 4000,
          });
          this._router.navigateByUrl('/addr/streets');
        } else {
          this._snackBar.open('Street Add failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  async onDistrictBlur() {
    if (
      this.streetDetails.get('district')?.value &&
      this.streetDetails.get('district')?.valid
    ) {
      let selectedDistrict = this.streetDetails.get('district')?.value;
      this.hudList = await this.streetService.getHudListForDistrict(
        selectedDistrict.district_id
      );

      this.blockList = await this.streetService.getBlocksListForDistrict(
        selectedDistrict.district_id
      );
    } else {
      console.log('selected district is empty');
      this.hudList = await this.streetService.getHudList();

      this.blockList = await this.streetService.getBlocksList();
    }

    this.streetDetails.get('hud')?.clearValidators();
    this.streetDetails
      .get('hud')
      ?.addValidators([
        Validators.required,
        optionObjectObjectValidator(this.hudList, 'hud_name'),
      ]);
    this.streetDetails.get('hud')?.updateValueAndValidity();
    this.streetDetails.get('hud')?.setValue('');

    this.streetDetails.get('block')?.clearValidators();
    this.streetDetails
      .get('block')
      ?.addValidators([
        Validators.required,
        optionObjectObjectValidator(this.blockList, 'block_name'),
      ]);
    this.streetDetails.get('block')?.updateValueAndValidity();
    this.streetDetails.get('block')?.setValue('');
    this.onBlockBlur();
  }

  async onHudBlur() {
    // if (
    //   this.streetDetails.get('hud')?.value &&
    //   this.streetDetails.get('hud')?.valid
    // ) {
    //   let selectedHud = this.streetDetails.get('hud')?.value;
    //   this.blockList = await this.streetService.getBlocksListForHud(
    //     selectedHud.hud_id
    //   );
    // } else {
      if (this.streetDetails.get('district')?.value) {
        this.blockList = await this.streetService.getBlocksListForDistrict(
          this.streetDetails.get('district')?.value?.district_id
        );
      } else this.blockList = await this.streetService.getBlocksList();
    // }
    this.streetDetails.get('block')?.clearValidators();
    this.streetDetails
      .get('block')
      ?.addValidators([
        Validators.required,
        optionObjectObjectValidator(this.blockList, 'block_name'),
      ]);
    this.streetDetails.get('block')?.updateValueAndValidity();
    if (!isBlockAdmin(this.currentUser)) {
      this.streetDetails.get('block')?.setValue('');
    }
    this.onBlockBlur();
  }

  getVillageList(blockId) {
    this.streetService.getVillages(blockId).then((villages: Array<any>) => {
      console.log('Street Add | Received villages:', villages);
      this.villageList = villages;
      this.streetDetails.get('village')?.clearValidators();
      this.streetDetails
        .get('village')
        ?.setValidators([
          Validators.required,
          optionObjectObjectValidator(this.villageList, 'village_name'),
        ]);
      this.streetDetails.get('village')?.setValue('');
      this.streetDetails.get('village')?.enable();
      this.streetDetails.get('village')?.updateValueAndValidity();
    });
  }

  getCateringHscs(blockId) {
    this.streetService
      .getBlockFacilities(blockId)
      .then((facilities: Array<any>) => {
        console.log('Street Add | Received facilities:', facilities);
        this.facilityList = facilities;
        resetFormList(
          this.streetDetails,
          'facility',
          'facility_name',
          this.facilityList,
          true
        );
        this.streetDetails.get('facility')?.enable();
      });
  }

  getCateringHscsForStateAdmin(blockId: any) {
    this.streetService
      .getHSCFacilities(this.currentUser, blockId)
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
        resetFormList(
          this.streetDetails,
          'facility',
          'facility_name',
          this.facilityList,
          true
        );
        this.streetDetails.get('facility')?.enable();
      });
  }

  getAnganwadies(blockId: any) {
    this.streetService
      .getAnganwadis(this.currentUser, blockId)
      .pipe(
        map((response: any) => {
          const anganwadis: Array<any> = response.data;
          return anganwadis;
        })
      )
      .subscribe((anganwadis: Array<any>) => {
        this.anganwadiList = anganwadis;
        resetFormList(
          this.streetDetails,
          'anganwadi',
          'facility_name',
          this.anganwadiList,
          true
        );
        this.streetDetails.get('anganwadi')?.setValue('');
        this.streetDetails.get('anganwadi')?.enable();
      });
  }

  onBlockBlur() {
    console.log('Street Add | onBlockBlur()');

    if (
      this.streetDetails.get('block')?.value &&
      this.streetDetails.get('block')?.valid
    ) {
      let selectedBlock = this.streetDetails.get('block')?.value.block_id;

      this.getVillageList(selectedBlock);

      if (isStateAdmin(this.currentUser)) {
        this.getCateringHscsForStateAdmin(selectedBlock);
      } else {
        this.getCateringHscs(selectedBlock);
      }

      // Fetch Anganwadis
      this.getAnganwadies(selectedBlock);
    } else {
      if (!isBlockAdmin(this.currentUser)) {
        this.villageList = [];
        this.streetDetails.get('village')?.setValue('');
        this.streetDetails.get('village')?.disable();
        this.facilityList = [];
        this.streetDetails.get('facility')?.setValue('');
        this.streetDetails.get('facility')?.disable();
  
        this.anganwadiList = [];
        this.streetDetails.get('anganwadi')?.setValue('');
        this.streetDetails.get('anganwadi')?.disable();
      }

    }
  }

  onVillageBlur() {
    console.log('Street Add | onVillageBur()');
    if (
      this.streetDetails.get('village')?.value &&
      this.streetDetails.get('village')?.valid
    ) {
      let selectedVillage = this.streetDetails.get('village')?.value;
      this.streetService
        .getHabitations(this.currentUser, selectedVillage.village_id)
        .subscribe((habitaions: Array<any>) => {
          console.log('Received :', habitaions);
          this.habitationList = habitaions;
          resetFormList(
            this.streetDetails,
            'habitation',
            'habitation_name',
            this.habitationList,
            true,
            ''
          );
          this.streetDetails.get('habitation')?.enable();
        });
    } else {
      this.habitationList = [];
      this.streetDetails.get('habitation')?.setValue('');
      this.streetDetails.get('habitation')?.disable();
    }
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

  displayAnganwadiFn(anganwadi?: any): string {
    return anganwadi ? anganwadi.facility_name : '';
  }

  displayRevVillageFn(revVillage?: any): string {
    return revVillage ? revVillage.rev_village_name : '';
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  displayHudFn(hud?: any): string {
    return hud ? hud.hud_name : '';
  }

  displayAssemblyConstituencyFn(assConstituency?: any): string {
    return assConstituency ? assConstituency.assembly_constituency_name : '';
  }

  displayParliamentConstituencyFn(parConstituency?: any): string {
    return parConstituency
      ? parConstituency.parlimentary_constituency_name
      : '';
  }

  returnYesOrNo(flag: boolean) {
    return flag ? 'Yes' : 'No';
  }

  canDeactivate() {
    console.log('street add');
    if (this.isSubmit) return false;
    else return this.streetDetails.dirty;
  }

  isUnallocated(): boolean {
    return isUnallocated(this.streetDetails);
  }
}
