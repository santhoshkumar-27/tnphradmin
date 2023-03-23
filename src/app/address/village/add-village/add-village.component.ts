import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Constants } from 'src/app/config/constants/constants';
import { Village } from 'src/app/models/village';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { VillageService } from '../service/village.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { resetFormList } from 'src/app/utils/form-util';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { isUnallocated } from 'src/app/utils/unallocated.util';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GidValidatorService } from 'src/app/services/gid-validator.service';


@Component({
  selector: 'app-add-village',
  templateUrl: './add-village.component.html',
  styleUrls: ['./add-village.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddVillageComponent implements OnInit, CanComponentDeactivate {
  village: Village;
  currentUser: User;
  isEdit: boolean;
  title: string;
  villageTypes: any = Constants.VILLAGE_TYPE;
  isCallInProgress: boolean = false;
  gidHeader: string = '';

  districtList: any;
  filteredDistricts: any = new Subject();
  hudList: any;
  filteredHuds: any = new Subject();
  blockList: any;
  filteredBlocks: any = new Subject();

  villageDetails: FormGroup;

  isSubmit: boolean = false;
  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   */
  constructor(
    private _formBuilder: FormBuilder,
    private villageService: VillageService,
    private _router: Router,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _gidValidator: GidValidatorService,
  ) {
    this.isEdit = false;
    this.title = 'Create Village';
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (this.isSubmit) return false;
    else return this.villageDetails.dirty;
  }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_VILLAGE');

    if (_editObject) {
      this.village = JSON.parse(_editObject);
      this.title = 'Edit Village';
      this.isEdit = true;

      console.log('Edit Village | Village being edited :', this.village);
    }

    this.villageDetails = this._formBuilder.group({
      district: [
        this.village ? this.village.district_id : '',
        [Validators.required],
      ],
      hud: [this.village ? this.village.hud_id : '', [Validators.required]],
      block: [this.village ? this.village.block_id : '', [Validators.required]],
      village_name: [
        this.village ? this.village.village_name : '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      village_local_name: [
        this.village ? this.village.village_local_name : '',
        [Validators.pattern('[0-9a-zA-Z .()_-]*'), Validators.maxLength(50)],
      ],
      village_gid: [
        {
          value: this.village ? this.village.village_gid : '',
          disabled: !this.isEdit,
        },
        {
          validators: [
            Validators.required,
            Validators.pattern('[0-9]*'),
            Validators.min(1),
          ],
          asyncValidators: [
            this._gidValidator.checkGid(
              this.currentUser,
              this.village?.village_id,
              'VILLAGE'
            ),
          ],
          updatedOn: 'blur',
        },
      ],
      village_type: [
        this.village ? this.village.village_type : '',
        Validators.required,
      ],
      village_lgd_code: [
        this.village ? this.village.village_lgd_code : '',
        [Validators.pattern('[0-9]*'), Validators.maxLength(10)],
      ],
      village_local_body_code: [
        this.village ? this.village.village_local_body_code : '',
        [Validators.pattern('[0-9]*'), Validators.maxLength(10)],
      ],
      active: [
        this.village ? this.returnYesOrNo(this.village.active) : '',
        Validators.required,
      ],
    });

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Add Village | Current User:', userString);
    if (userString) {
      this.getDistrictList();
      this.getHudList();
      this.getBlockList();
      // this.getAssemblyConsList();
      // this.getParlimentaryConsList();
      // this.getRevVillageList();
    } else {
      console.log('Add Block | Navigating to login');
      this._router.navigateByUrl('/login');
      return;
    }

    this.onChanges();
  }

  getDistrictList() {
    this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
      console.log('Add Village | district list:', values);

      this.districtList = values;
      this.villageDetails
        .get('district')
        ?.addValidators([
          optionObjectObjectValidator(this.districtList, 'district_name'),
        ]);
      this.villageDetails.get('district')?.setValue(
        this.village
          ? {
              district_id: this.village.district_id,
              district_name: this.village.district_name,
            }
          : ''
      );
    });
  }

  getHudList() {
    this._dataservice.getHudList().subscribe((values: Array<any>) => {
      console.log('Add Village | hud list:', values);

      if (this.currentUser.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.currentUser.district_id
        );
      } else if (this.village?.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.village.district_id
        );
      } else {
        this.hudList = values;
      }

      this.villageDetails
        .get('hud')
        ?.addValidators([
          optionObjectObjectValidator(this.hudList, 'hud_name'),
        ]);
      this.villageDetails
        .get('hud')
        ?.setValue(
          this.village
            ? { hud_id: this.village.hud_id, hud_name: this.village.hud_name }
            : ''
        );
    });
  }

  getBlockList() {
    this._dataservice.getBlocksList().subscribe((values: Array<any>) => {
      console.log('Add Village | block list:', values);

      if (this.currentUser.district_id) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.currentUser.district_id
        );
      } else if (this.village?.district_id) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.village.district_id
        );
      } else {
        this.blockList = values;
      }

      if (this.village?.hud_id) {
        this.blockList = values.filter(
          (el: any) => el.hud_id == this.village.hud_id
        );
      }

      this.villageDetails
        .get('block')
        ?.addValidators([
          optionObjectObjectValidator(this.blockList, 'block_name'),
        ]);
      this.villageDetails
        .get('block')
        ?.setValue(
          this.village
            ? {
                block_id: this.village.block_id,
                block_name: this.village.block_name,
              }
            : ''
        );
    });
  }

  onChanges(): void {
    console.log('Add/Edit Block | onChange()');

    this.villageDetails.get('district')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add/Edit Block | district value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.district_name?.toLowerCase() || ""
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });

    this.villageDetails.get('hud')?.valueChanges.subscribe((val: any) => {
      console.log('Add/Edit Block | hud value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.hud_name?.toLowerCase() || ""
          : val.toLowerCase();
      let filteredOne = this.hudList.filter((hud: any) =>
        hud?.hud_name?.toLowerCase().includes(filterValue)
      );
      this.filteredHuds.next(filteredOne);
    });

    this.villageDetails.get('block')?.valueChanges.subscribe((val: any) => {
      console.log('Add vilage | block value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.block_name?.toLowerCase() || ""
          : val.toLowerCase();
      let filteredOne = this.blockList.filter((block: any) =>
        block.block_name.toLowerCase().includes(filterValue)
      );
      this.filteredBlocks.next(filteredOne);
    });
  }

  submitForm(target_hsc = null): void {
    if (!this.villageDetails.valid) {
      console.log('Add/Edit Village | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    if (!this.isEdit) {
      this.village = new Village();
      this.village.village_id = uuidv4();
      this.village.village_gid = 0;
    } else {
      // In edit mode, GID is editable.
      this.village.village_gid = +this.villageDetails.value['village_gid'];
    }

    this.village.district_id =
      this.villageDetails.get('district')?.value.district_id;
    this.village.hud_id = this.villageDetails.get('hud')?.value.hud_id;
    this.village.block_id = this.villageDetails.get('block')?.value.block_id;
    this.village.village_name = this.villageDetails.value['village_name'];
    this.village.village_local_name = this.villageDetails.value[
      'village_local_name'
    ]
      ? this.villageDetails.value['village_local_name']
      : null;
    this.village.village_lgd_code = this.villageDetails.value[
      'village_lgd_code'
    ]
      ? +this.villageDetails.value['village_lgd_code']
      : null;
    this.village.village_local_body_code = this.villageDetails.value[
      'village_local_body_code'
    ]
      ? +this.villageDetails.value['village_local_body_code']
      : null;
    this.village.village_type = this.villageDetails.value['village_type'];
    this.village.active =
      this.villageDetails.value['active'] == 'Yes' ? true : false;

    this.villageService
      .upsertVillage(this.currentUser, this.village, target_hsc)
      .subscribe((status) => {
        console.log('Upsert village response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_VILLAGE');
          this._snackBar.open(
            'Village Added/Updated successfully.',
            'Dismiss',
            {
              duration: 4000,
            }
          );

          this.villageService.addVillageToLocalDb(this.village);
          this._router.navigateByUrl('/addr/villages');
        } else {
          this._snackBar.open('Village Add/Edit failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  async onDistrictBlur() {
    if (
      this.villageDetails.get('district')?.value &&
      this.villageDetails.get('district')?.valid
    ) {
      let selectedDistrict = this.villageDetails.get('district')?.value;
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

    // this.villageDetails.get('hud')?.clearValidators();
    // this.villageDetails
    //   .get('hud')
    //   ?.addValidators([
    //     Validators.required,
    //     optionObjectObjectValidator(this.hudList, 'hud_name'),
    //   ]);
    // this.villageDetails.get('hud')?.updateValueAndValidity();
    // this.villageDetails.get('hud')?.setValue('');

    resetFormList(this.villageDetails, 'hud', 'nud_name', this.hudList, true);
    this.villageDetails.get('hud')?.setValue('');

    resetFormList(
      this.villageDetails,
      'block',
      'block_name',
      this.blockList,
      true
    );
    this.villageDetails.get('block')?.setValue('');

    // this.blockDetails.get('block')?.clearValidators();
    // this.blockDetails
    //   .get('block')
    //   ?.addValidators([
    //     Validators.required,
    //     optionObjectObjectValidator(this.blockList, 'block_name'),
    //   ]);
    // this.blockDetails.get('block')?.updateValueAndValidity();
    // this.blockDetails.get('block')?.setValue('');
    //this.onBlockBlur();
  }

  async onHudBlur() {
    // if (
    //   this.villageDetails.get('hud')?.value &&
    //   this.villageDetails.get('hud')?.valid
    // ) {
    //   let selectedHud = this.villageDetails.get('hud')?.value;
    //   this.blockList = await this.villageService.getBlocksListForHud(
    //     selectedHud.hud_id
    //   );
    // } else {
      if (this.villageDetails.get('district')?.value) {
        this.blockList = await this.villageService.getBlocksListForDistrict(
          this.villageDetails.get('district')?.value?.district_id
        );
      } else this.blockList = await this.villageService.getBlocksList();
    // }
    resetFormList(
      this.villageDetails,
      'block',
      'block_name',
      this.blockList,
      true,
      ""
    );
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  displayHudFn(hud?: any): string {
    return hud ? hud.hud_name : '';
  }

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  returnYesOrNo(flag: boolean) {
    return flag ? 'Yes' : 'No';
  }

  isUnallocated(): boolean {
    return isUnallocated(this.villageDetails);
  }

  openConfirmationPopup() {
    if (!this.villageDetails.valid) {
      console.log('Add/Edit village | Form not valid!');
      return;
    }
    //if hieranchy is changed then open confirmation pop up or call submit form
    if (this.isEdit) {
      const isHierarchyChanged: boolean =
        this.village.district_id !=
          this.villageDetails.get('district')?.value?.district_id ||
        this.village.hud_id != this.villageDetails.get('hud')?.value.hud_id ||
        this.village.block_id !=
          this.villageDetails.get('block')?.value.block_id;
      if (!isHierarchyChanged) {
        this.submitForm();
        return;
      }
    } else {
      this.submitForm();
      return;
    }

    const dialogRef = this._dialog.open(ConfirmationModalComponent, {
      data: {
        showCateringHsc: true,
        payload: {
          'VILLAGE_DATA': this.village
        },
        blockId: this.villageDetails.get('block')?.value.block_id,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.submitForm(result);
    });
  }
}

