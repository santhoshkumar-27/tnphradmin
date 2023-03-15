import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Constants } from 'src/app/config/constants/constants';
import { isDistrictAdmin, isStateAdmin } from 'src/app/utils/session.util';
import { User } from 'src/app/models/user';
import { FacilityEntiry, OptionEntity } from 'src/app/models/common-entities';
import {
  optionObjectObjectValidator,
  selectedOptionObjectValidator,
} from 'src/app/validators/searchSelect.validator';
import { Subject } from 'rxjs';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { UserService } from '../service/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'user-dialog',
  templateUrl: './user-dialog.html',
})
export class UserDialog {
  userDetails: FormGroup;
  empTypes: any = Constants.EMPLOYEE_TYPE;
  workNatures: any = Constants.NATURE_OF_WORK;
  currentUser: User;
  phrRoles: OptionEntity[];
  facilityRoleList: Array<any>;
  employeeRoleList: Array<any>;
  filteredEmployeeRoles: Subject<any[]> = new Subject();
  phrRoleFiltedOptions: Subject<OptionEntity[]> = new Subject();
  facilityRoleFilteredOption: Subject<OptionEntity[]> = new Subject();
  primaryFacilityFilteredOptions: Subject<FacilityEntiry[]> = new Subject();
  facilityList: any;
  isCallInProgress: boolean;
  errMsg: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private _masterDataService: MasterDataService,
    private _service: UserService,
    private _snackBar: MatSnackBar,
    private _dialogRef: MatDialogRef<UserDialog>
  ) {}

  ngOnInit() {
    console.log('User Ids in dialog', this.data);

    this.userDetails = this.fb.group({
      employee_type: [''],
      nature_of_work: [''],
      role: [''],
      phr_role: [''],
      active: [''],
      primary_facility: [''],
      role_in_facility: [''],
    });

    this.onChanges();

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Current User:', userString);
    if (userString) {
      let currentUser = User.mapJsonToUser(JSON.parse(userString));
      this.currentUser = currentUser;
      if (isStateAdmin(this.currentUser)) {
        this.phrRoles = Constants.PHR_ROLE_STATE;
        this.facilityRoleList = Constants.ROLE_IN_FACILITY_ADMIN;
      } else if (isDistrictAdmin(this.currentUser)) {
        this.phrRoles = Constants.PHR_ROLE_DISTRICT;
        this.facilityRoleList = Constants.ROLE_IN_FACILITY_ADMIN;
      } else {
        this.phrRoles = Constants.PHR_ROLE_BLOCK;
        this.facilityRoleList = Constants.ROLE_IN_FACILITY_USER;
      }

      setTimeout(() => {
        this.userDetails.get('phr_role')?.setValue('');
        this.userDetails
          .get('phr_role')
          ?.addValidators([
            selectedOptionObjectValidator(this.phrRoles, 'name'),
          ]);
        this.userDetails.get('role_in_facility')?.setValue('');
        this.userDetails
          .get('role_in_facility')
          ?.addValidators([
            selectedOptionObjectValidator(this.facilityRoleList, 'name'),
          ]);
      }, 0);
    }

    this.getEmployeeRoleList();
    this.getFacilityList();
  }

  onChanges() {
    this.userDetails.get('role')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.role_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.employeeRoleList.filter((empRole: any) =>
        empRole.role_name.toLowerCase().includes(filterValue)
      );
      this.filteredEmployeeRoles.next(filteredOne);

      console.log(this.filteredEmployeeRoles);
    });

    this.userDetails.get('phr_role')?.valueChanges.subscribe((val: any) => {
      const filterValue = val.toLowerCase();
      let filteredOne = this.phrRoles.filter((phrRole: any) =>
        phrRole.name.toLowerCase().includes(filterValue)
      );
      this.phrRoleFiltedOptions.next(filteredOne);
      console.log(this.phrRoleFiltedOptions);
    });

    this.userDetails
      .get('role_in_facility')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue = val.toLowerCase();
        let filteredOne = this.facilityRoleList.filter((facilityRole: any) =>
          facilityRole.name.toLowerCase().includes(filterValue)
        );
        this.facilityRoleFilteredOption.next(filteredOne);
      });

    this.userDetails
      .get('primary_facility')
      ?.valueChanges.subscribe((val: any) => {
        console.log('facility value:', val, ' and type:', typeof val);
        const filterValue =
          typeof val === 'object'
            ? val.facility_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.facilityList.filter((facility: any) =>
          facility.facility_name.toLowerCase().includes(filterValue)
        );
        this.primaryFacilityFilteredOptions.next(filteredOne);
      });
  }

  // check if the data is having all "" values
  validateUserData(): boolean {
    let uData = this.userDetails.value;
    for (let key in uData) {
      if (uData[key] != '') {
        return false;
      }
    }
    return true;
  }

  updateUsers() {
    console.log(this.userDetails.value);
    console.log(this.data.userIds);
    if (this.validateUserData()) {
      this.errMsg = "Please select atleast one value to update";
      return;
    };
    this.errMsg = "";

    let user_data = {
      employee_type: this.userDetails.get('employee_type')?.value || null,
      nature_of_work: this.userDetails.get('nature_of_work')?.value || null,
      role: this.userDetails.get('role')?.value?.role_id || null,
      phr_role: this.userDetails.get('phr_role')?.value || null,
      facility_id:
        this.userDetails.get('primary_facility')?.value?.facility_id || null,
      role_in_facility: this.userDetails.get('role_in_facility')?.value || null,
      active:
        this.userDetails.get('active')?.value != ''
          ? this.userDetails.get('active')?.value == 'Yes'
            ? true
            : false
          : null,
    };

    this.isCallInProgress = true;

    this._service
      .bulkEdit(this.currentUser, user_data, this.data.userIds)
      .subscribe((status: any) => {
        if (status === Constants.SUCCESS_FLAG) {
          this._snackBar.open('Users Updated successfully.', 'Dismiss', {
            duration: 4000,
          });
          this._dialogRef.close(true);
        } else {
          this._snackBar.open('Users Update failed.', 'Dismiss', {
            duration: 4000,
          });
          this._dialogRef.close(false);
        }
        this.isCallInProgress = false;
      }, error => {
        this.isCallInProgress = false;
        this._snackBar.open('Users Update failed.', 'Dismiss', {
          duration: 4000,
        });
        this._dialogRef.close(false);
      });
  }

  getEmployeeRoleList() {
    this._masterDataService.getEmpRoleList().subscribe((values: Array<any>) => {
      console.log('bulk edit | employee role type:', values);
      this.employeeRoleList = values;
      this.userDetails.get('role')?.setValue('');
      this.userDetails
        .get('role')
        ?.addValidators([
          optionObjectObjectValidator(this.employeeRoleList, 'role_name'),
        ]);
    });
  }

  getFacilityList() {
    this._masterDataService
      .getFacilityList()
      .subscribe((values: Array<any>) => {
        console.log('parent facilities', values);
        this.facilityList = values;
        this.userDetails.get('primary_facility')?.setValue('');
        this.userDetails
          .get('primary_facility')
          ?.addValidators([
            optionObjectObjectValidator(this.facilityList, 'facility_name'),
          ]);
      });
  }

  onRoleBlur() {
    const userRole = this.userDetails.value['role'].role_name || '';
    console.log(userRole);
    let role_vs_phrrole_mapping: any = [];
    if (isStateAdmin(this.currentUser)) {
      role_vs_phrrole_mapping = Constants.ROLE_VS_PHRROLE_MAPPING_STATE;
    } else if (isDistrictAdmin(this.currentUser)) {
      role_vs_phrrole_mapping = Constants.ROLE_VS_PHRROLE_MAPPING_DISTRICT;
    } else {
      role_vs_phrrole_mapping = Constants.ROLE_VS_PHRROLE_MAPPING_BLOCK;
    }
    let mapped = false;

    // updating phrRoles dropdown based on role value
    for (let mapping of role_vs_phrrole_mapping.entries()) {
      if (mapping[0].indexOf(userRole) != -1) {
        mapped = true;
        this.phrRoles = mapping[1];
        this.userDetails.get('phr_role')?.setValue('');
        this.userDetails
          .get('phr_role')
          ?.setValidators([
            selectedOptionObjectValidator(this.phrRoles, 'name'),
          ]);
        this.userDetails.get('phr_role')?.updateValueAndValidity();
        break;
      }
    }
    // reset phrRoles dropdown when no mapping of role is found
    if (!mapped) {
      if (isStateAdmin(this.currentUser)) {
        this.phrRoles = Constants.PHR_ROLE_STATE;
      } else if (isDistrictAdmin(this.currentUser)) {
        this.phrRoles = Constants.PHR_ROLE_DISTRICT;
      } else {
        this.phrRoles = Constants.PHR_ROLE_BLOCK;
      }
      this.userDetails.get('phr_role')?.setValue('');
      this.userDetails
        .get('phr_role')
        ?.setValidators([
          selectedOptionObjectValidator(this.phrRoles, 'name'),
        ]);
      this.userDetails.get('phr_role')?.updateValueAndValidity();
    }
    console.log(this.phrRoles);
  }

  onPhrRoleBlur() {
    let phrRole: string = this.userDetails.value['phr_role'];
    if (phrRole.indexOf('ADMIN') < 0) {
      this.facilityRoleList = [{ name: 'User' }];
      this.facilityRoleFilteredOption.next([{ name: 'User' }]);
    } else {
      this.facilityRoleList = [{ name: 'Admin' }];
      this.facilityRoleFilteredOption.next([{ name: 'Admin' }]);
    }
    this.userDetails.patchValue({ role_in_facility: '' });
  }

  displayRoleFn(empRole: any): string {
    return empRole ? empRole.role_name : '';
  }

  displayFacilityFn(facility?: any): string {
    return facility ? facility.facility_name : '';
  }
}
