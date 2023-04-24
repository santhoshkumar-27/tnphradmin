import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { Constants } from 'src/app/config/constants/constants';
import { RevenueVillage } from 'src/app/models/revenue-village';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { isBlockAdmin, isDistrictAdmin } from 'src/app/utils/session.util';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { RevenueVillageService } from '../service/revenue-village.service';
import { v4 as uuidv4 } from 'uuid';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { resetFormList } from 'src/app/utils/form-util';
import { isUnallocated } from 'src/app/utils/unallocated.util';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GidValidatorService } from 'src/app/services/gid-validator.service';

@Component({
  selector: 'app-add-revenue-village',
  templateUrl: './add-revenue-village.component.html',
  styleUrls: ['./add-revenue-village.component.scss'],
})
export class AddRevenueVillageComponent
  implements OnInit, CanComponentDeactivate
{
  revVillage: RevenueVillage;
  currentUser: User;
  isEdit: boolean;
  title: string;
  isCallInProgress: boolean = false;
  gidHeader: string = '';

  districtList: any;
  filteredDistricts: any = new Subject();
  talukList: any;
  filteredTaluks: any = new Subject();

  revVillageDetails: FormGroup;

  isSubmit: boolean = false;

  constructor(
    private _formBuilder: FormBuilder,
    private revVillageService: RevenueVillageService,
    private _router: Router,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _gidValidator: GidValidatorService,
  ) {
    this.isEdit = false;
    this.title = 'Create Revenue Village';
  }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_REV_VILLAGE');

    if (_editObject) {
      this.revVillage = JSON.parse(_editObject);
      this.title = 'Edit Revenue Village';
      this.isEdit = true;
      this.gidHeader = `(GID: ${this.revVillage.rev_village_gid})`;
    }

    this.revVillageDetails = this._formBuilder.group({
      district: [
        this.revVillage ? this.revVillage.district_id : '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')]
      ],
      taluk: [
        this.revVillage ? this.revVillage.taluk_id : '',
        [Validators.required],
      ],
      rev_village_name: [
        this.revVillage ? this.revVillage.rev_village_name : '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      rev_village_local_name: [
        this.revVillage ? this.revVillage.rev_village_local_name : '',
        [Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      rev_village_gid: [
        {
          value: this.revVillage ? this.revVillage.rev_village_gid : '',
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
              this.revVillage?.rev_village_id,
              'REV_VILLAGE'
            ),
          ],
          updatedOn: 'blur',
        },
      ],
      firka_name: [
        this.revVillage ? this.revVillage.firka_name : '',
        [Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      firka_id: [
        this.revVillage ? this.revVillage.firka_id : '',
        Validators.pattern('[0-9]*'),
      ],
      active: [
        this.revVillage ? (this.revVillage.active == true ? 'Yes' : 'No') : '',
        Validators.required,
      ],
    });

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    if (userString) {
      this.getDistrictList();
      this.getTalukList();
    } else {
      this._router.navigateByUrl('/login');
      return;
    }

    this.onChanges();
  }

  getDistrictList() {
    this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
      // For distric admin or revVillage admin, he should be able to select only his district
      if (isDistrictAdmin(this.currentUser) || isBlockAdmin(this.currentUser)) {
        let operatorDistrict = this.currentUser.district_id;
        console.log('Operator district id:', operatorDistrict);
        this.districtList = [];
        if (!operatorDistrict) {
          console.error(
            'District id not present for District-admin/revVillage-admin operator logged in.'
          );
        } else {
          let userDisObj = values.find((district) => {
            return district.district_id === operatorDistrict;
          });
          this.revVillageDetails.get('district')?.setValue(userDisObj);
          this.revVillageDetails.get('district')?.disable();
        }
      } else {
        // If not a district admin, show full dropdown list.
        this.districtList = values;
        this.revVillageDetails
          .get('district')
          ?.addValidators([
            optionObjectObjectValidator(this.districtList, 'district_name'),
          ]);
        this.revVillageDetails.get('district')?.setValue(
          this.revVillage
            ? {
                district_id: this.revVillage.district_id,
                district_name: this.revVillage.district_name,
              }
            : ''
        );
      }
    });
  }

  getTalukList() {
    this._dataservice.getTalukList().subscribe((values: Array<any>) => {
      if (this.currentUser.district_id) {
        this.talukList = values.filter(
          (el: any) => el.district_id == this.currentUser.district_id
        );
      } else if (this.revVillage?.district_id) {
        this.talukList = values.filter(
          (el: any) => el.district_id == this.revVillage.district_id
        );
      } else {
        this.talukList = values;
      }

      this.revVillageDetails
        .get('taluk')
        ?.addValidators([
          optionObjectObjectValidator(this.talukList, 'taluk_name'),
        ]);
      this.revVillageDetails.get('taluk')?.setValue(
        this.revVillage
          ? {
              taluk_id: this.revVillage.taluk_id,
              taluk_name: this.revVillage.taluk_name,
            }
          : ''
      );
    });
  }

  onChanges(): void {
    this.revVillageDetails
      .get('district')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue =
          typeof val === 'object'
            ? val.district_name?.toLowerCase() || ""
            : val.toLowerCase();
        let filteredOne = this.districtList.filter((district: any) =>
          district.district_name.toLowerCase().includes(filterValue)
        );
        this.filteredDistricts.next(filteredOne);
      });

    this.revVillageDetails.get('taluk')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.taluk_name?.toLowerCase() || ""
          : val.toLowerCase();
      let filteredOne = this.talukList.filter((taluk: any) =>
        taluk.taluk_name.toLowerCase().includes(filterValue)
      );
      this.filteredTaluks.next(filteredOne);
    });
  }

  async onDistrictBlur() {
    if (
      this.revVillageDetails.get('district')?.value &&
      this.revVillageDetails.get('district')?.valid
    ) {
      let selectedDistrict = this.revVillageDetails.get('district')?.value;
      this.talukList = await this.revVillageService.getTalukListperDistrict(
        selectedDistrict.district_id
      );
    } else {
      console.log('selected district is empty');
      this.talukList = await this.revVillageService.getTalukList();
    }
    resetFormList(this.revVillageDetails, 'taluk', 'taluk_name', this.talukList, true);
    this.revVillageDetails.get('taluk')?.setValue('');
  }

  submitForm(): void {
    if (!this.revVillageDetails.valid) {
      console.log('Add/Edit Revenue Village | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    if (!this.isEdit) {
      this.revVillage = new RevenueVillage();
      this.revVillage.rev_village_id = uuidv4();
      this.revVillage.rev_village_gid = 0;
    } else {
      // In edit mode, GID is editable.
      this.revVillage.rev_village_gid =
        +this.revVillageDetails.value['rev_village_gid'];
    }

    this.revVillage.district_id =
      this.revVillageDetails.get('district')?.value.district_id;
    this.revVillage.taluk_id =
      this.revVillageDetails.get('taluk')?.value.taluk_id;
    this.revVillage.rev_village_name =
      this.revVillageDetails.value['rev_village_name'];
    this.revVillage.rev_village_local_name =
      this.revVillageDetails.value['rev_village_local_name'] || null;
    this.revVillage.firka_name = this.revVillageDetails.value['firka_name'] || null;
    this.revVillage.firka_id = this.revVillageDetails.value['firka_id'] || null;

    this.revVillage.active =
      this.revVillageDetails.value['active'] == 'Yes' ? true : false;

    //remove not required fields for upsert request
    delete this.revVillage.district_name;
    delete this.revVillage.taluk_name;

    console.log('>>>>> revVillage: ', this.revVillage);

    this.revVillageService
      .upsertRevVillage(this.currentUser, this.revVillage)
      .subscribe((status) => {
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_REV_VILLAGE');
          this._snackBar.open(
            'Revenue Village Added/Updated successfully.',
            'Dismiss',
            {
              duration: 4000,
            }
          );
          this.revVillageService.addRevVillageToLocalDb(this.revVillage);
          this._router.navigateByUrl('/addr/revenue_village');
        } else {
          this._snackBar.open('Revenue Village Add/Edit failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (this.isSubmit) return false;
    else return this.revVillageDetails.dirty;
  }

  displayDistrictFn(district?: any) {
    return district ? district.district_name : '';
  }

  displayTalukFn(taluk: any) {
    return taluk ? taluk.taluk_name : '';
  }

  isUnallocated(): boolean {
    return isUnallocated(this.revVillageDetails);
  }

  openConfirmationPopup() {
    if (!this.revVillageDetails.valid) {
      console.log('Add/Edit rev village | Form not valid!');
      return;
    }
    //if hieranchy is changed then open confirmation pop up or call submit form
    if (this.isEdit) {
      const isHierarchyChanged: boolean =
        this.revVillage.district_id !=
          this.revVillageDetails.get('district')?.value?.district_id ||
        this.revVillage.taluk_id != this.revVillageDetails.get('taluk')?.value.taluk_id;
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
        showCateringHsc: false,
        payload: {
          'REV_VILLAGE_DATA': this.revVillage
        }
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.submitForm();
    });
  }
  
}
