import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { Constants } from 'src/app/config/constants/constants';
import { Taluk } from 'src/app/models/taluk';
import { User } from 'src/app/models/user';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { TalukService } from '../service/taluk.service';
import { v4 as uuidv4 } from 'uuid';
import { resetFormList } from 'src/app/utils/form-util';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GidValidatorService } from 'src/app/services/gid-validator.service';

@Component({
  selector: 'app-add-taluk',
  templateUrl: './add-taluk.component.html',
  styleUrls: ['./add-taluk.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddTalukComponent implements OnInit, CanComponentDeactivate {

  taluk: Taluk;
  currentUser: User;
  isEdit: boolean;
  title: string;
  isCallInProgress: boolean = false;

  districtList: any;
  filteredDistricts: any = new Subject();

  talukDetails: FormGroup;

  @ViewChild('districtInput') districtInput: ElementRef<HTMLInputElement>;

  isSubmit: boolean = false;

  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   */
   constructor(
    private _formBuilder: FormBuilder,
    private talukService: TalukService,
    private _router: Router,
    private _authService: AuthService,
    private _masterDataService: MasterDataService,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _gidValidator: GidValidatorService,
  ) {
    this.isEdit = false;
    this.title = 'Create Taluk';
  }

  canDeactivate() : boolean | Observable<boolean> | Promise<boolean>{
    if (this.isSubmit) return false;
    else return this.talukDetails.dirty;
  }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_TALUK');

    if (_editObject) {
      this.taluk = JSON.parse(_editObject);
      this.title = 'Edit Taluk';
      this.isEdit = true;

      console.log('Edit taluk | taluk being edited :', this.taluk);
    }

    this.talukDetails = this._formBuilder.group({
      taluk_name: [
        this.taluk ? this.taluk.taluk_name : '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      taluk_local_name: [
        this.taluk ? this.taluk.taluk_local_name : '',
        [Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      taluk_gid: [
        {
          value: this.taluk ? this.taluk.taluk_gid : '',
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
              this.taluk?.taluk_id,
              'TALUK'
            ),
          ],
          updatedOn: 'blur',
        },
      ],
      district: [
        this.taluk && this.taluk.district_id ? this.taluk.district_id[0] : '',
        [Validators.required],
      ],
      taluk_lgd_code: [
        this.taluk ? this.taluk.taluk_lgd_code : '',
        Validators.pattern('[0-9]*'),
      ],
      active: [
        this.taluk ? this.returnYesOrNo(this.taluk.active) : '',
        Validators.required,
      ],
    });

    this.getDistricts();
    this.onChanges();
  }

  onChanges(): void {
    console.log('=> called onChange() 2');
    this.talukDetails.get('district')?.valueChanges.subscribe((val: any) => {
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

  getDistricts() {
    this._masterDataService.getDistrictsList().subscribe((values: Array<any>) => {
      this.districtList = values;

      resetFormList(
        this.talukDetails,
        'district',
        'district_name',
        this.districtList,
        true
      );
        
      this.talukDetails.get('district')?.setValue(
        this.taluk
          ? this.districtList.find(districtItem => this.taluk.district_id && districtItem.district_id == this.taluk.district_id[0])
          : ''
      );
    });
  }

  submitForm(): void {
    if (!this.talukDetails.valid) {
      console.log('Add/Edit Taluk | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    if (!this.isEdit) {
      this.taluk = new Taluk();
      this.taluk.taluk_id = uuidv4();
      this.taluk.taluk_gid = 0;
    } else {
      // In edit mode, GID is editable.
      this.taluk.taluk_gid = +this.talukDetails.value['taluk_gid']
    }

    this.taluk.taluk_name = this.talukDetails.value['taluk_name'];
    this.taluk.taluk_local_name = this.talukDetails.value['taluk_local_name'] ? this.talukDetails.value['taluk_local_name'] : null;
    this.taluk.taluk_lgd_code = this.talukDetails.value['taluk_lgd_code'] ? +this.talukDetails.value['taluk_lgd_code'] : null;
    this.taluk.active =
      this.talukDetails.value['active'] == 'Yes' ? true : false;

    this.taluk.district_id = this.talukDetails.value['district'] ? [this.talukDetails.value['district'].district_id] : [];

    console.log(">>>>> taluk: ", this.taluk);

    this.talukService
      .upsertTaluk(this.currentUser, this.taluk)
      .subscribe((status) => {
        console.log('Add Taluk response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_TALUK');
          this._snackBar.open('Taluk Added/Updated successfully.', 'Dismiss', {
            duration: 4000,
          });

          this.talukService.addTalukToLocalDb(this.taluk);
          this._router.navigateByUrl('/addr/taluks');
        } else {
          this._snackBar.open('Taluk Add/Edit failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  returnYesOrNo(flag: boolean) {
    return flag ? 'Yes' : 'No';
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  openConfirmationPopup() {
    if (!this.talukDetails.valid) {
      console.log('Add/Edit taluk | Form not valid!');
      return;
    }
    //if hieranchy is changed then open confirmation pop up or call submit form
    if (this.isEdit) {
      const isHierarchyChanged: boolean =
        this.taluk.district_id !=
          this.talukDetails.get('district')?.value?.district_id;
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
          'TALUK_DATA': this.taluk
        }
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.submitForm();
    });
  }
}

