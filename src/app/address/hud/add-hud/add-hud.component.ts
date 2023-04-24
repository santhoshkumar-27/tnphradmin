import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Constants } from 'src/app/config/constants/constants';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { HUD } from 'src/app/models/hud';
import { HudService } from '../service/hud.service';
import { isUnallocated } from 'src/app/utils/unallocated.util';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GidValidatorService } from 'src/app/services/gid-validator.service';

@Component({
  selector: 'app-add-hud',
  templateUrl: './add-hud.component.html',
  styleUrls: ['./add-hud.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddHudComponent implements OnInit, CanComponentDeactivate {
  hud: HUD;
  currentUser: User;
  isEdit: boolean;
  title: string;
  gidHeader: string = '';

  isCallInProgress: boolean = false;

  districtList: any;
  filteredDistricts: any = new Subject();

  hudDetails: FormGroup;

  isSubmit: boolean = false;

  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   */

  constructor(
    private _formBuilder: FormBuilder,
    private hudService: HudService,
    private _router: Router,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _gidValidator: GidValidatorService,
  ) {
    this.isEdit = false;
    this.title = 'Create Hud';
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (this.isSubmit) return false;
    else return this.hudDetails.dirty;
  }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_HUD');

    if (_editObject) {
      this.hud = JSON.parse(_editObject);
      this.title = 'Edit Hud';
      this.isEdit = true;
      this.gidHeader = `(GID - ${this.hud.hud_gid})`;
    }

    this.hudDetails = this._formBuilder.group({
      district: ['', [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')]],
      hud_name: [
        this.hud?.hud_name || '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      hud_local_name: [
        this.hud?.hud_local_name || '',
        [Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      hud_gid: [
        {
          value: this.hud ? this.hud.hud_gid : '',
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
              this.hud?.hud_id,
              'HUD'
            ),
          ],
          updatedOn: 'blur',
        },
      ],
      hud_short_code: [
        this.hud ? this.hud.hud_short_code : '',
        Validators.pattern('[0-9]*'),
      ],
      active: [
        this.hud ? (this.hud.active ? 'Yes' : 'No') : '',
        Validators.required,
      ],
    });

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Add hud | Current User:', userString);
    if (userString) {
      this.getDistrictList();
    } else {
      console.log('Add hud | Navigating to login');
      this._router.navigateByUrl('/login');
      return;
    }

    this.onChanges();
  }

  getDistrictList() {
    // add hud is available only for state admins hense not considering district admin scenario here
    this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
      this.districtList = values;
      this.hudDetails
        .get('district')
        ?.addValidators([
          optionObjectObjectValidator(this.districtList, 'district_name'),
        ]);
      this.hudDetails.get('district')?.setValue(
        this.hud
          ? {
              district_id: this.hud.district_id,
              district_name: this.hud.district_name,
            }
          : ''
      );
    });
  }

  onChanges(): void {
    this.hudDetails.get('district')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.district_name?.toLowerCase() || ""
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });
  }

  submitForm(): void {
    if (!this.hudDetails.valid) {
      console.log('Add/Edit Hud | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    if (!this.isEdit) {
      this.hud = new HUD();
      this.hud.hud_id = uuidv4();
      this.hud.hud_gid = 0;
    } else {
      // In edit mode, GID is editable.
      this.hud.hud_gid = +this.hudDetails.value['hud_gid'];
    }

    this.hud.district_id = this.hudDetails.get('district')?.value.district_id;
    this.hud.hud_name = this.hudDetails.value['hud_name'];
    this.hud.hud_local_name = this.hudDetails.value['hud_local_name']
      ? this.hudDetails.value['hud_local_name']
      : null;
    this.hud.hud_short_code = this.hudDetails.value['hud_short_code']
      ? +this.hudDetails.value['hud_short_code']
      : null;
    this.hud.active = this.hudDetails.value['active'] == 'Yes' ? true : false;

    //remove not required fields for upsert api
    delete this.hud.district_name;

    console.log('>>>>> hud: ', this.hud);

    this.hudService
      .upsertHud(this.currentUser, this.hud)
      .subscribe((status) => {
        console.log('Add hud response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_HUD');
          this._snackBar.open('Hud Added/Updated Successfully.', 'Dismiss', {
            duration: 4000,
          });
          this.hudService.addHudToLocalDb(this.hud);
          this._router.navigateByUrl('/addr/hud');
        } else {
          this._snackBar.open('Hud Add/Edit Failed.', 'Dismiss', {
            duration: 4000,
          });
        }
        this.isCallInProgress = false;
      });
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  isUnallocated(): boolean {
    return isUnallocated(this.hudDetails);
  }

  openConfirmationPopup() {
    if (!this.hudDetails.valid) {
      console.log('Add/Edit hud | Form not valid!');
      return;
    }
    //if hieranchy is changed then open confirmation pop up or call submit form
    if (this.isEdit) {
      const isHierarchyChanged: boolean =
        this.hud.district_id !=
        this.hudDetails.get('district')?.value?.district_id;
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
          HUD_DATA: this.hud,
        },
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.submitForm();
    });
  }
}
