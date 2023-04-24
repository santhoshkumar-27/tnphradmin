import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  Form,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as _moment from 'moment';

import { User } from 'src/app/models/user';
import { UserService } from 'src/app/users/service/user.service';
import { Constants } from 'src/app/config/constants/constants';
import {
  optionObjectObjectValidator,
  selectedOptionObjectValidator,
  selectedOptionValidator,
} from 'src/app/validators/searchSelect.validator';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { ValidateUniqueMoileNumber } from 'src/app/validators/uniqueNumber.validator';
import { ValidationApiService } from 'src/app/starter/services/validation.service';
import {
  ClinicEntity,
  ClinicTypeEntity,
  DepartmentEntity,
  FacilityEntiry,
  OptionEntity,
} from 'src/app/models/common-entities';
import { facilityRoleValidator } from 'src/app/validators/facilityRole.validator';
import {
  isBlockAdmin,
  isDistrictAdmin,
  isStateAdmin,
} from 'src/app/utils/session.util';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';

const moment = _moment;

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddUserComponent implements OnInit, CanComponentDeactivate {
  _user: User;
  currentUser: User;
  isEdit: boolean;
  title: string;
  isCallInProgress: boolean = false;
  /** To limit the max value of datepicker to today */
  today = new Date();

  facilityDetails: string = '';
  detailsShow: boolean = false;

  facilityList: any;
  subFacilityList: any;
  roleList: any;
  facilityRoleList: Array<any>;
  workNatures: any = Constants.NATURE_OF_WORK;
  empTypes: any = Constants.EMPLOYEE_TYPE;
  empIdTypes: any;
  status: any = Constants.STATUS;
  hierarchy: any;
  phrRoles: OptionEntity[];
  blockList: any;
  departmentList: Array<any>;
  clinicList: Array<any>;
  clinicTypetList: Array<any>;

  titleOptions: string[] = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Er.'];
  titleFilteredOptions: Subject<string[]> = new Subject();
  genderOptions: string[] = ['Male', 'Female', 'Transgender', 'Others'];
  genderFilteredOptions: Subject<string[]> = new Subject();
  // facilityOptions are dynamically loaded
  primaryFacilityFilteredOptions: Subject<FacilityEntiry[]> = new Subject();
  phrRoleFiltedOptions: Subject<OptionEntity[]> = new Subject();
  facilityRoleFilteredOption: Subject<OptionEntity[]> = new Subject();
  departmentFilteredOptions: Subject<DepartmentEntity[]> = new Subject();
  clinicFilteredOptions: Subject<ClinicEntity[]> = new Subject();
  clinicTypeFilteredOptions: Subject<ClinicTypeEntity[]> = new Subject();

  employeeRoleList: Array<any>;
  filteredEmployeeRoles: Subject<any[]> = new Subject();

  // Vertical Stepper
  personalDetails: FormGroup;
  employeeDetails: FormGroup;

  // Private
  private _unsubscribeAll: Subject<any>;

  isSubmit: boolean = false;

  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   */
  constructor(
    private _formBuilder: FormBuilder,
    private _service: UserService,
    private _router: Router,
    private _snackBar: MatSnackBar,
    private _dataservice: MasterDataService,
    private _validationService: ValidationApiService
  ) {
    this.isEdit = false;
    this.title = 'Create User';

    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    let _editObject = sessionStorage.getItem('EDIT_USER');

    if (_editObject) {
      this._user = JSON.parse(_editObject);
      this.title = 'Edit User';
      this.isEdit = true;
    }

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Current User:', userString);
    if (userString) {
      let currentUser = User.mapJsonToUser(JSON.parse(userString));
      this.currentUser = currentUser;
      if (
        this.currentUser.phr_role === 'WEB_STATE_ADMIN' ||
        this.currentUser.phr_role === 'STATE_ADMIN'
      ) {
        this.phrRoles = Constants.PHR_ROLE_STATE;
        this.facilityRoleList = Constants.ROLE_IN_FACILITY_ADMIN;
      } else if (
        this.currentUser.phr_role === 'WEB_DISTRICT_ADMIN' ||
        this.currentUser.phr_role === 'DISTRICT_ADMIN'
      ) {
        this.phrRoles = Constants.PHR_ROLE_DISTRICT;
        this.facilityRoleList = Constants.ROLE_IN_FACILITY_ADMIN;
      } else {
        this.phrRoles = Constants.PHR_ROLE_BLOCK;
        this.facilityRoleList = Constants.ROLE_IN_FACILITY_USER;
      }
      

      this._dataservice.getEmpRoleList().subscribe((values: Array<any>) => {
        console.log('Add User | employee role type:', values);
        this.employeeRoleList = values;
        //this.employeeDetails.get('role')?.setValue('');
        if (this._user && this._user.role) {
          let roleId = this._user.role;
          console.log('Getting rolename for id:', roleId);
          this._service.getRoleName(roleId).then((roleName) => {
            this.employeeDetails
              .get('role')
              ?.setValue({ role_id: roleId, role_name: roleName });

            // updating phrRoles dropdown based on role value in case of edit user
            let role_vs_phrrole_mapping: any = [];
            if (isStateAdmin(this.currentUser)) {
              role_vs_phrrole_mapping = Constants.ROLE_VS_PHRROLE_MAPPING_STATE;
            } else if (isDistrictAdmin(this.currentUser)) {
              role_vs_phrrole_mapping =
                Constants.ROLE_VS_PHRROLE_MAPPING_DISTRICT;
            } else {
              role_vs_phrrole_mapping = Constants.ROLE_VS_PHRROLE_MAPPING_BLOCK;
            }
            for (let mapping of role_vs_phrrole_mapping.entries()) {
              if (mapping[0].indexOf(roleName) != -1) {
                this.phrRoles = mapping[1];
              }
            }
          });
        } else {
          this.employeeDetails.get('role')?.setValue('');
        }
        this.employeeDetails
          .get('role')
          ?.addValidators([
            optionObjectObjectValidator(this.employeeRoleList, 'role_name'),
          ]);
      });

      let facilityDetailObj:any = {
        department: '',
        clinic: '',
        clinic_type: '',
      };

      if (this._user && this._user.sub_facility_details) {
        facilityDetailObj = this._user.sub_facility_details;
      }

      this._dataservice.getDepartmentList().subscribe((values: Array<any>) => {
        console.log('value-department:', values);
        this.departmentList = values;
        this.employeeDetails
          .get('department')
          ?.setValue(facilityDetailObj['department']);
        this.employeeDetails
          .get('department')
          ?.addValidators([
            optionObjectObjectValidator(this.departmentList, 'department_name'),
          ]);
      });

      this._dataservice.getClinicList().subscribe((values: Array<any>) => {
        console.log('value-clinic:', values);
        this.clinicList = values;
        this.employeeDetails
          .get('clinic')
          ?.setValue(facilityDetailObj['clinic']);
        this.employeeDetails
          .get('clinic')
          ?.addValidators([
            optionObjectObjectValidator(this.clinicList, 'clinic_name'),
          ]);
      });

      this._dataservice.getClinicTypeList().subscribe((values: Array<any>) => {
        console.log('value-clinic type:', values);
        this.clinicTypetList = values;
        this.employeeDetails
          .get('clinic_type')
          ?.setValue(facilityDetailObj['clinic_type']);
        this.employeeDetails
          .get('clinic_type')
          ?.addValidators([
            optionObjectObjectValidator(
              this.clinicTypetList,
              'clinic_type_name'
            ),
          ]);
      });
    } else {
      console.log('Routing to login');
      this._router.navigateByUrl('/login');
      return;
    }

    console.log('Edit User:', this._user);

    // Vertical Stepper form stepper
    this.personalDetails = this._formBuilder.group(
      {
        user_first_name: [
          this._user ? this._user.user_first_name : '',
          [Validators.required, Validators.pattern('[A-Za-z ]*')],
        ],
        user_last_name: [
          this._user ? this._user.user_last_name : '',
          [Validators.required, Validators.pattern('[A-Za-z ]*')],
        ],
        user_title: [
          this._user ? this._user.user_title : '',
          [Validators.required, selectedOptionValidator(this.titleOptions)],
        ],
        gender: [
          this._user ? this._user.gender : '',
          [Validators.required, selectedOptionValidator(this.genderOptions)],
        ],
        mobile_number: [
          this._user ? this._user.mobile_number : '',
          [
            Validators.required,
            Validators.maxLength(10),
            Validators.minLength(10),
            Validators.pattern('[0-9]*'),
          ],
        ],
        email: [
          this._user ? this._user.email : '',
          [
            Validators.required,
            Validators.email,
            Validators.pattern(Constants.EMAIL_PATTERN),
          ],
        ],
        // alt_mobile_number: [
        //   this._user ? this._user.alt_mobile_number : '',
        //   [
        //     Validators.pattern('[0-9]*'),
        //     Validators.maxLength(10),
        //     Validators.minLength(10),
        //   ],
        // ],
        // alt_email: [this._user ? this._user.alt_email : '', Validators.email],
        postal_address: [
          this._user ? this._user.postal_address : '',
          [Validators.pattern('[a-zA-z0-9 ,/-:.]*')],
        ],
      },
      {
        asyncValidators: [
          ValidateUniqueMoileNumber.checkMobile(
            this._validationService,
            this.currentUser,
            this.isEdit,
            this._user
          ),
        ],
      }
    );

    this.personalDetails.addControl(
      'birth_date',
      new FormControl(
        this._user ? this._user.birth_date : '',
        Validators.required
      )
    );

    this.employeeDetails = this._formBuilder.group(
      {
        //status: [this._user ? this._user.status : '', Validators.required],
        //esign_required: [this._user ? this._user.esign_required : ''],
        employee_id: [
          this._user ? this._user.employee_id : '',
          [
            Validators.required,
            Validators.pattern('[A-Z0-9]*'),
            Validators.maxLength(15),
          ],
        ],
        //employee_id_type: [this._user ? this._user.employee_id_type : ''],
        employee_type: [
          this._user ? this._user.employee_type : '',
          Validators.required,
        ],
        nature_of_work: [
          this._user ? this._user.nature_of_work : '',
          Validators.required,
        ],
        //promotion_hierarchy: [this._user ? this._user.promotion_hierarchy : ''],
        // seniority_id: [
        //   this._user ? this._user.seniority_id : '',
        //   Validators.pattern('[a-zA-Z0-9]*'),
        // ],
        // pay_matrix_number: [
        //   this._user ? this._user.pay_matrix_number : '',
        //   Validators.pattern('[a-zA-Z0-9]*'),
        // ],
        // has_displinary_action: [
        //   this._user ? this._user.has_displinary_action : '',
        // ],
        phr_role: [
          this._user ? this._user.phr_role : '',
          [
            Validators.required,
            selectedOptionObjectValidator(this.phrRoles, 'name'),
          ],
        ],
        active: [
          this._user ? this.returnYesOrNo(this._user.active) : '',
          Validators.required,
        ],
        designation: [this._user ? this._user.designation : ''],
        role: [this._user ? this._user.role : ''],
        facility_id: [
          this._user ? this._user.facility_id : '',
          [Validators.required],
        ],
        // primary_block: [this._user ? this.getPrimaryBlock(this._user.assigned_jurisdiction) : ''],
        // additional_blocks: [this._user ? this.getPrimaryBlock(this._user.assigned_jurisdiction) : []],
        // sub_facility_id: [this._user ? this._user.sub_facility_id : ''],
        role_in_facility: [
          this._user ? this._user.role_in_facility : '',
          [
            Validators.required,
            selectedOptionObjectValidator(this.facilityRoleList, 'name'),
          ],
        ],
        //incharge_facility: [this._user ? this._user.incharge_facility : []], //This will be an array
        //TODO: check sub_faciliy_details and set value for Edit
        department: [{ value: '', disabled: true }, Validators.required], //This will be an array
        clinic: [{ value: '', disabled: true }, Validators.required],
        clinic_type: [{ value: '', disabled: true }, Validators.required],
      },
      {
        validators: [facilityRoleValidator()],
      }
    );

    this.employeeDetails.addControl(
      'date_of_joining',
      new FormControl(
        this._user ? this._user.date_of_joining : '',
        Validators.required
      )
    );

    this._dataservice.getFacilityList().subscribe((values: Array<any>) => {
      console.log('value-2:', values);
      this.facilityList = values;
      this.employeeDetails.get('facility_id')?.setValue(
        this._user
          ? {
              facility_id: this._user.facility_id,
              facility_name: this._user.facility_name,
            }
          : ''
      );
      this.employeeDetails
        .get('facility_id')
        ?.addValidators([
          optionObjectObjectValidator(this.facilityList, 'facility_name'),
        ]);
      this.employeeDetails.get('facility_id')?.updateValueAndValidity();
    });

    //let selectedFailictyRole = this.employeeDetails.value['phr_role'];
    //this.employeeDetails.get('role_in_facility')?.addValidators([facilityRoleValidator(selectedFailictyRole)]);
    this.onChanges();
  }

  ngAfterViewInit(): void {
    // set empty value for all drop downs
    setTimeout(() => {
      this.personalDetails
        .get('user_title')
        ?.setValue(
          this._user && this._user.user_title ? this._user.user_title : ''
        );
      this.personalDetails
        .get('gender')
        ?.setValue(this._user && this._user.gender ? this._user.gender : '');
      this.employeeDetails
        .get('phr_role')
        ?.setValue(
          this._user && this._user.phr_role ? this._user.phr_role : ''
        );
      this.employeeDetails
        .get('role_in_facility')
        ?.setValue(
          this._user && this._user.role_in_facility
            ? this._user.role_in_facility
            : ''
        );
    }, 0);
  }

  onChanges(): void {
    console.log('=> called onChange() 2');
    this.personalDetails
      .get('user_title')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue = val.toLowerCase();
        let filteredOne = this.titleOptions.filter((option) =>
          option.toLowerCase().includes(filterValue)
        );
        this.titleFilteredOptions.next(filteredOne);
        console.log('Done');
      });

    this.personalDetails.get('gender')?.valueChanges.subscribe((val: any) => {
      const filterValue = val.toLowerCase();
      let filteredOne = this.genderOptions.filter((option) =>
        option.toLowerCase().includes(filterValue)
      );
      this.genderFilteredOptions.next(filteredOne);
    });

    this.employeeDetails
      .get('facility_id')
      ?.valueChanges.subscribe((val: any) => {
        console.log('facility value:', val, ' and type:', typeof val);
        const filterValue =
          typeof val === 'object'
            ? val.facility_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.facilityList.filter((facility: any) =>
          facility.facility_name.toLowerCase().includes(filterValue)
        );
        this.primaryFacilityFilteredOptions.next(
          filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
        );
      });

    this.employeeDetails.get('role')?.valueChanges.subscribe((val: any) => {
      console.log('values change for role:', val);
      const filterValue =
        typeof val === 'object'
          ? val.role_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.employeeRoleList.filter((empRole: any) =>
        empRole.role_name.toLowerCase().includes(filterValue)
      );
      this.filteredEmployeeRoles.next(filteredOne);
    });

    this.employeeDetails.get('phr_role')?.valueChanges.subscribe((val: any) => {
      const filterValue = val.toLowerCase();
      let filteredOne = this.phrRoles.filter((phrRole: any) =>
        phrRole.name.toLowerCase().includes(filterValue)
      );
      this.phrRoleFiltedOptions.next(filteredOne);
    });

    this.employeeDetails
      .get('role_in_facility')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue = val.toLowerCase();
        let filteredOne = this.facilityRoleList.filter((facilityRole: any) =>
          facilityRole.name.toLowerCase().includes(filterValue)
        );
        this.facilityRoleFilteredOption.next(filteredOne);
      });

    this.employeeDetails
      .get('department')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue =
          typeof val === 'object'
            ? val.department_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.departmentList.filter((department: any) =>
          department.department_name.toLowerCase().includes(filterValue)
        );
        this.departmentFilteredOptions.next(filteredOne);
      });

    this.employeeDetails.get('clinic')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.clinic_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.clinicList.filter((clinic: any) =>
        clinic.clinic_name.toLowerCase().includes(filterValue)
      );
      this.clinicFilteredOptions.next(filteredOne);
    });

    this.employeeDetails
      .get('clinic_type')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue =
          typeof val === 'object'
            ? val.clinic_type_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.clinicTypetList.filter((clinicType: any) =>
          clinicType.clinic_type_name.toLowerCase().includes(filterValue)
        );
        this.clinicTypeFilteredOptions.next(filteredOne);
      });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  getPrimaryBlock(jury: JSON): any {
    //return jury.parse() .['primary_block'];
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Finish the vertical stepper
   */
  async finishUserStepper(): Promise<void> {
    this.checkForEmployeeDetailErrors();

    if (!this.employeeDetails.valid) {
      console.log('Employee details form not valid.');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;

    if (!this.isEdit) {
      this._user = new User();
      this._user.user_id = uuidv4();
    }

    this._user.user_first_name = this.personalDetails.value['user_first_name'];
    this._user.user_last_name = this.personalDetails.value['user_last_name'];
    this._user.user_title = this.personalDetails.value['user_title'];
    this._user.gender = this.personalDetails.value['gender'];

    this._user.mobile_number = this.personalDetails.value['mobile_number'];
    this._user.email = this.personalDetails.value['email'];
    // In edit mode, dob will come as string if not modifed.
    let birth_date_val = this.personalDetails.value['birth_date'];
    console.log('birth_date_val:', birth_date_val);
    this._user.birth_date =
      typeof birth_date_val === 'object'
        ? birth_date_val.format('YYYY-MM-DD')
        : birth_date_val;
    //this._user.birth_date = this.personalDetails.value['birth_date'].format('YYYY-MM-DD');
    // this._user.alt_mobile_number =
    //   this.personalDetails.value['alt_mobile_number'] == ''
    //     ? 0
    //     : this.personalDetails.value['alt_mobile_number'];
    // this._user.alt_email = this.personalDetails.value['alt_email'];
    this._user.postal_address = this.personalDetails.value['postal_address'];

    this._user.employee_id = this.employeeDetails.value['employee_id'];
    //this._user.employee_id_type = this.employeeDetails.value['employee_id_type'];
    this._user.employee_type = this.employeeDetails.value['employee_type'];
    this._user.nature_of_work = this.employeeDetails.value['nature_of_work'];
    //this._user.status = this.employeeDetails.value['status'];
    this._user.status = 'Original Station';
    this._user.esign_required = false;
    this._user.designation = this.employeeDetails.value['designation'];
    this._user.role = this.employeeDetails.value['role'].role_id;

    this._user.facility_id =
      this.employeeDetails.value['facility_id'].facility_id;
    //this._user.assigned_jurisdiction = this.getAssignedJurisdiction(this.facilityMapping.value['primary_block'], this.facilityMapping.value['secondary_block']);
    this._user.assigned_jurisdiction = await this.getAssignedJurisdiction(
      this._user.facility_id
    );
    console.log(
      'Assinged juri: facility_id:',
      this._user.facility_id,
      ', assingned:',
      this._user.assigned_jurisdiction
    );

    let department;
    let clinic;
    let clinicType;
    if (this.employeeDetails.get('department')?.disabled) {
      department = this.employeeDetails.getRawValue().department;
    } else {
      department = this.employeeDetails.value['department'];
    }

    if (this.employeeDetails.get('clinic')?.disabled) {
      clinic = this.employeeDetails.getRawValue().clinic;
    } else {
      clinic = this.employeeDetails.value['clinic'];
    }

    if (this.employeeDetails.get('clinic_type')?.disabled) {
      clinicType = this.employeeDetails.getRawValue().clinic_type;
    } else {
      clinicType = this.employeeDetails.value['clinic_type'];
    }

    this._user.sub_facility_details = JSON.parse(
      JSON.stringify({
        department: department,
        clinic: clinic,
        clinic_type: clinicType,
      })
    );
    //this._user.sub_facility_id = this.facilityMapping.value['sub_facility_id'];
    this._user.role_in_facility =
      this.employeeDetails.value['role_in_facility'];
    // this._user.incharge_facility =
    //   this.employeeDetails.value['incharge_facility'];
    this._user.phr_role = this.employeeDetails.value['phr_role'];
    console.log(' user status: ', this.employeeDetails.value['active']);
    this._user.active =
      this.employeeDetails.value['active'] == 'Yes' ? true : false;

    let date_of_joining_value = this.employeeDetails.value['date_of_joining'];
    this._user.date_of_joining =
      typeof date_of_joining_value === 'object'
        ? date_of_joining_value.format('YYYY-MM-DD')
        : date_of_joining_value;
    // this._user.promotion_hierarchy =
    //   this.employeeDetails.value['promotion_hierarchy'];
    // this._user.seniority_id = this.employeeDetails.value['seniority_id'];
    // this._user.pay_matrix_number =
    //   this.employeeDetails.value['pay_matrix_number'];
    this._user.has_displinary_action = false;

    // If mobile number has change, then set auth_token to null.
    let _originalRecord = sessionStorage.getItem('EDIT_USER');
    if (this.isEdit && _originalRecord) {
      let _originalUserRecord: User = JSON.parse(_originalRecord);
      let orgMobileNo = _originalUserRecord.mobile_number;
      // if (orgMobileNo != this._user.mobile_number) {
      //   this._user.auth_token = null;
      // }
    }

    this._service
      .upsertUser(this.currentUser, this._user)
      .subscribe((status) => {
        console.log('Add user response:', status);
        // Incase of status SUCCESS navigate to list else stay here
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_USER');
          this._snackBar.open('User Added/Updated successfully.', 'Dismiss', {
            duration: 4000,
          });
          this._router.navigateByUrl('/users/list');
        } else {
          this._snackBar.open('User Add failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  async getAssignedJurisdiction(facility_id: string) {
    let juri = {
      primary_block: await this._service.getBlockId(facility_id),
    };
    return JSON.parse(JSON.stringify(juri));
  }

  displayFn(facility?: any): string {
    return facility ? facility.facility_name : '';
  }

  displayDepartmentFn(department?: DepartmentEntity): string {
    return department ? department.department_name : '';
  }

  displayClinicFn(clinic?: ClinicEntity): string {
    return clinic ? clinic.clinic_name : '';
  }

  displayClinicTypeFn(clinicType?: ClinicTypeEntity): string {
    return clinicType ? clinicType.clinic_type_name : '';
  }

  displayRoleFn(empRole: any): string {
    return empRole ? empRole.role_name : '';
  }

  checkForPersonalDetailsError() {
    console.log('Checking for errors', this.personalDetails);
    if (this.personalDetails.getError('number_exists')) {
      this.personalDetails.controls['mobile_number'].setErrors({
        number_exists: true,
      });
    }
  }

  checkForEmployeeDetailErrors() {
    console.log('Checking for errors', this.employeeDetails);
    if (this.employeeDetails.getError('admin_not_allwed_for_phr_user_role')) {
      this.employeeDetails.controls['role_in_facility'].setErrors({
        admin_not_allwed_for_phr_user_role: true,
      });
    }
    if (this.employeeDetails.getError('user_not_allwed_for_phr_admin_role')) {
      this.employeeDetails.controls['role_in_facility'].setErrors({
        user_not_allwed_for_phr_admin_role: true,
      });
    }
  }

  onFacilityBlur() {
    console.log('Blur called.');
    this.employeeDetails.controls['department'].enable();
    this.employeeDetails.controls['clinic'].enable();
    this.employeeDetails.controls['clinic_type'].enable();

    let facility = this.employeeDetails.value['facility_id'];
    console.log('facility:', facility);
    if (facility) {
      this.detailsShow = true;
      this.facilityDetails =
        'Directorate: ' +
        facility.directorate_name +
        ', Category: ' +
        facility.category_name +
        ', Type: ' +
        facility.facility_type_name +
        ', Level: ' +
        facility.facility_level;
      this.updateSubFaciltyDropdowns(facility);
    } else {
      this.detailsShow = false;
    }
  }

  onPhrRoleBlur() {
    let phrRole: string = this.employeeDetails.value['phr_role'];
    console.log('On blur phr role: ', phrRole);
    if (phrRole.indexOf('ADMIN') < 0) {
      //let filteredOne
      this.facilityRoleList = [{ name: 'User' }];
      this.facilityRoleFilteredOption.next([{ name: 'User' }]);
    } else {
      this.facilityRoleList = [{ name: 'Admin' }];
      this.facilityRoleFilteredOption.next([{ name: 'Admin' }]);
    }
    this.employeeDetails.patchValue({ role_in_facility: '' });
    //this.employeeDetails.get('role_in_facility')?.reset();
  }

  returnYesOrNo(flag: boolean) {
    return flag ? 'Yes' : 'No';
  }

  updateSubFaciltyDropdowns(facility: any) {
    if (facility.facility_level === 'HSC') {
      //if(true) {
      let filteredDepts = this.departmentList.filter(
        (department: any) =>
          Constants.HSC_FILTERED_SUB_FACILITIES.departments.indexOf(
            department.department_name
          ) > -1
      );
      this.departmentList = filteredDepts;
      this.departmentFilteredOptions.next(filteredDepts);
      this.checkAndDisableDepartment(filteredDepts);
      let filteredClinics = this.clinicList.filter(
        (clinic: any) =>
          Constants.HSC_FILTERED_SUB_FACILITIES.clinics.indexOf(
            clinic.clinic_name
          ) > -1
      );
      this.clinicList = filteredClinics;
      this.clinicFilteredOptions.next(filteredClinics);
      this.checkAndDisableClinics(filteredClinics);
      let filteredClinicTypes = this.clinicTypetList.filter(
        (clinicType: any) =>
          Constants.HSC_FILTERED_SUB_FACILITIES.clinic_types.indexOf(
            clinicType.clinic_type_name
          ) > -1
      );
      this.clinicTypetList = filteredClinicTypes;
      this.clinicTypeFilteredOptions.next(filteredClinicTypes);
      this.checkAndDisableClinicTypes(filteredClinicTypes);
    } else if (facility.facility_level === 'PHC') {
      // get the list
      let filteredDepts = this.departmentList.filter(
        (department: any) =>
          Constants.PHC_FILTERED_SUB_FACILITIES.departments.indexOf(
            department.department_name
          ) > -1
      );
      console.log('Filtered depts.', filteredDepts);
      this.departmentList = filteredDepts;
      this.departmentFilteredOptions.next(filteredDepts);
      this.checkAndDisableDepartment(filteredDepts);
      let filteredClinics = this.clinicList.filter(
        (clinic: any) =>
          Constants.PHC_FILTERED_SUB_FACILITIES.clinics.indexOf(
            clinic.clinic_name
          ) > -1
      );
      this.clinicList = filteredClinics;
      this.clinicFilteredOptions.next(filteredClinics);
      this.checkAndDisableClinics(filteredClinics);
      let filteredClinicTypes = this.clinicTypetList.filter(
        (clinicType: any) =>
          Constants.PHC_FILTERED_SUB_FACILITIES.clinic_types.indexOf(
            clinicType.clinic_type_name
          ) > -1
      );
      this.clinicTypetList = filteredClinicTypes;
      this.clinicTypeFilteredOptions.next(filteredClinicTypes);
      this.checkAndDisableClinicTypes(filteredClinicTypes);
    } else {
      this._dataservice.getDepartmentList().subscribe((values: Array<any>) => {
        console.log('Add user | get department list from db');
        this.departmentList = values;
        this.departmentFilteredOptions.next(values);
      });

      this._dataservice.getClinicList().subscribe((values: Array<any>) => {
        console.log('Add user | get clinic list from db');
        this.clinicList = values;
        this.clinicFilteredOptions.next(values);
      });

      this._dataservice.getClinicTypeList().subscribe((values: Array<any>) => {
        console.log('Add user | get clinic types list from db');
        this.clinicTypetList = values;
        this.clinicTypeFilteredOptions.next(values);
      });
    }
  }

  checkAndDisableDepartment(departmentList: Array<string>) {
    if (departmentList && departmentList.length === 1) {
      this.employeeDetails.get('department')?.setValue(departmentList[0]);
      this.employeeDetails.get('department')?.disable();
    }
  }

  checkAndDisableClinics(clinicList: Array<string>) {
    if (clinicList && clinicList.length === 1) {
      this.employeeDetails.get('clinic')?.setValue(clinicList[0]);
      this.employeeDetails.get('clinic')?.disable();
    }
  }

  checkAndDisableClinicTypes(clinicTypeList: Array<string>) {
    if (clinicTypeList && clinicTypeList.length === 1) {
      this.employeeDetails.get('clinic_type')?.setValue(clinicTypeList[0]);
      this.employeeDetails.get('clinic_type')?.disable();
    }
  }

  getPhrRoles() {
    const userRole = this.employeeDetails.value['role'].role_name || '';
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
        this.employeeDetails.get('phr_role')?.setValue('');
        this.employeeDetails
          .get('phr_role')
          ?.setValidators([
            Validators.required,
            selectedOptionObjectValidator(this.phrRoles, 'name'),
          ]);
        this.employeeDetails.get('phr_role')?.updateValueAndValidity();
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
      this.employeeDetails.get('phr_role')?.setValue('');
      this.employeeDetails
        .get('phr_role')
        ?.setValidators([
          Validators.required,
          selectedOptionObjectValidator(this.phrRoles, 'name'),
        ]);
      this.employeeDetails.get('phr_role')?.updateValueAndValidity();
    }
    console.log(this.phrRoles);
  }

  canDeactivate() {
    if (this.isSubmit) return false;
    else
      return this.personalDetails.dirty || this.employeeDetails.dirty
        ? true
        : false;
  }
}
