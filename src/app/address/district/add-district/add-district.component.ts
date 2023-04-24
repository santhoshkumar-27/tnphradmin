import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { Constants } from 'src/app/config/constants/constants';
import { District } from 'src/app/models/district';
import { User } from 'src/app/models/user';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { DistrictService } from '../service/district.service';
import { v4 as uuidv4 } from 'uuid';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { resetFormList } from 'src/app/utils/form-util';
import { GidValidatorService } from 'src/app/services/gid-validator.service';


@Component({
  selector: 'app-add-district',
  templateUrl: './add-district.component.html',
  styleUrls: ['./add-district.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddDistrictComponent implements OnInit,CanComponentDeactivate  {

  district: District;
  currentUser: User;
  isEdit: boolean;
  title: string;
  isCallInProgress: boolean = false;

  stateList: Array<any> = [];
  filteredStates: any = new Subject();

  districtsList: Array<any>;
  filteredDistricts: Subject<any[]> = new Subject();
  selectedDistricts: Array<any> = [];

  districtDetails: FormGroup;

  @ViewChild('districtInput') districtInput: ElementRef<HTMLInputElement>;

  isSubmit: boolean = false;

  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   */
   constructor(
    private _formBuilder: FormBuilder,
    private districtService: DistrictService,
    private _router: Router,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _snackBar: MatSnackBar,
    private _gidValidator: GidValidatorService,
  ) {
    this.isEdit = false;
    this.title = 'Create District';
  }

  canDeactivate() : boolean | Observable<boolean> | Promise<boolean>{
    if (this.isSubmit) return false;
    else return this.districtDetails.dirty;
  }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_DISTRICT');

    if (_editObject) {
      this.district = JSON.parse(_editObject);
      this.title = 'Edit District';
      this.isEdit = true;

      console.log('Edit district | district being edited :', this.district);
    }

    this.districtDetails = this._formBuilder.group({
      state: [
        this.district ? this.district.state_id : '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')]
      ],
      district_name: [
        this.district ? this.district.district_name : '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      district_local_name: [
        this.district ? this.district.district_local_name : '',
        [Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      district_gid: [
        {
          value: this.district ? this.district.district_gid : '',
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
              this.district?.district_id,
              'DISTRICT'
            ),
          ],
          updatedOn: 'blur',
        },
      ],
      districts: [[]],
      district_lgd_code: [
        this.district ? this.district.district_lgd_code : '',
        Validators.pattern('[0-9]*'),
      ],
      district_picme_code: [
        this.district ? this.district.district_picme_code : '',
        Validators.pattern('[0-9]*'),
      ],
      district_rd_code: [
        this.district ? this.district.district_rd_code : '',
        Validators.pattern('[0-9]*'),
      ],
      district_rev_code: [
        this.district ? this.district.district_rev_code : '',
        Validators.pattern('[0-9]*'),
      ],
      district_short_code: [
        this.district ? this.district.district_short_code : '',
        Validators.pattern('[a-zA-Z]*'),
      ],
      active: [
        this.district ? this.returnYesOrNo(this.district.active) : '',
        Validators.required,
      ],
    });

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Add/Edit District | Current User:', userString);
    if (userString) {
      this.getStateList();
    } else {
      console.log('Add/Edit District | Navigating to login');
      this._router.navigateByUrl('/login');
      return;
    }

    this.onChanges();
  }

  onChanges(): void {
    this.districtDetails.get('state')?.valueChanges.subscribe((val: any) => {
      console.log('Add/Edit District | state value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.state_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.stateList.filter((state: any) =>
        state.state_name.toLowerCase().includes(filterValue)
      );
      this.filteredStates.next(filteredOne);
    });
  }

  getStateList() {
    this._dataservice.getStateList().subscribe((values: Array<any>) => {
      console.log('Add/Edit District | state list:', values);
      this.stateList = values;

      // Update field valiation with new list. 
      resetFormList(this.districtDetails, 'state', 'state_name', this.stateList, true);

      // Set field value
      this.districtDetails
        .get('state')
        ?.setValue(
          this.district
            ? { state_id: this.district.state_id, state_name: this.district.state_name }
            : ''
        );
    });
  }

  submitForm(): void {
    if (!this.districtDetails.valid) {
      console.log('Add/Edit district | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    if (!this.isEdit) {
      this.district = new District();
      this.district.district_id = uuidv4();
      this.district.district_gid = 0;
    } else {
      // In edit mode, GID is editable.
      this.district.district_gid = +this.districtDetails.value['district_gid']
    }

    this.district.state_id = this.districtDetails.get('state')?.value.state_id;
    this.district.district_name = this.districtDetails.value['district_name'];
    this.district.district_local_name = this.districtDetails.value['district_local_name'] ? this.districtDetails.value['district_local_name'] : null;
    this.district.district_lgd_code = this.districtDetails.value['district_lgd_code'] ? +this.districtDetails.value['district_lgd_code'] : null;
    this.district.district_picme_code = this.districtDetails.value['district_picme_code'] ? +this.districtDetails.value['district_picme_code'] : null;
    this.district.district_rd_code = this.districtDetails.value['district_rd_code'] ? +this.districtDetails.value['district_rd_code'] : null;
    this.district.district_rev_code = this.districtDetails.value['district_rev_code'] ? +this.districtDetails.value['district_rev_code'] : null;
    this.district.district_short_code = this.districtDetails.value['district_short_code'] ? this.districtDetails.value['district_short_code'] : null;
    this.district.active =
      this.districtDetails.value['active'] == 'Yes' ? true : false;

    console.log(">>>>> district: ", this.district);

    this.districtService
      .upsertDistrict(this.currentUser, this.district)
      .subscribe((status) => {
        console.log('Add District response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_DISTRICT');
          this._snackBar.open('District Added/Updated successfully.', 'Dismiss', {
            duration: 4000,
          });

          this.districtService.addDistrictToLocalDb(this.district);
          this._router.navigateByUrl('/addr/districts');
        } else {
          this._snackBar.open('District Add/Edit failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  returnYesOrNo(flag: boolean) {
    return flag ? 'Yes' : 'No';
  }

  displayStateFn(state?: any): string {
    return state ? state.state_name : '';
  }
}
