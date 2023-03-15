import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Constants } from 'src/app/config/constants/constants';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { FacilityService } from '../facility/service/facility.service';

@Component({
  selector: 'app-facility-bulk-edit',
  templateUrl: './facility-bulk-edit.component.html',
  styleUrls: ['./facility-bulk-edit.component.scss'],
})
export class FacilityBulkEditComponent implements OnInit {
  facilityDetails: FormGroup;
  hwcOptions: Array<any>;
  isCallInProgress: boolean = false;
  currentUser: User;
  errMsg: string;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _service: FacilityService,
    private _authService: AuthService,
    private _snackBar: MatSnackBar,
    private _dialogRef: MatDialogRef<FacilityBulkEditComponent>
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.facilityDetails = this.fb.group({
      is_hwc: [''],
      active: [''],
    });

    this.hwcOptions = Constants.HWC_OPTIONS;
  }

  // check if the data is having all "" values
  validateFacilityData(): boolean {
    let fData = this.facilityDetails.value;
    for (let fac in fData) {
      if (fData[fac] != '') {
        return false;
      }
    }
    return true;
  }

  updateFacilities() {
    console.log(this.facilityDetails.value);
    console.log(this.data.facilityIds);
    if (this.validateFacilityData()) {
      this.errMsg = "Please select atleast one value to update";
      return;
    };
    this.errMsg = "";
    let facility_data = {
      is_hwc: this.facilityDetails.get('is_hwc')?.value || null,
      active:
        this.facilityDetails.get('active')?.value != ''
          ? this.facilityDetails.get('active')?.value == 'Yes'
            ? true
            : false
          : null,
    };

    this.isCallInProgress = true;

    this._service
      .bulkEdit(this.currentUser, facility_data, this.data.facilityIds)
      .subscribe((status: any) => {
        if (status === Constants.SUCCESS_FLAG) {
          this._snackBar.open('Facilities Updated successfully.', 'Dismiss', {
            duration: 4000,
          });
          this._dialogRef.close(true);
        } else {
          this._snackBar.open('Facilities Update failed.', 'Dismiss', {
            duration: 4000,
          });
          this._dialogRef.close(false);
        }

        this.isCallInProgress = false;
      });
  }
}
