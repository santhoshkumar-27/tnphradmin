import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { combineLatest, Subject, Subscription } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { Constants } from 'src/app/config/constants/constants';
import { BlockMaster } from 'src/app/models/master_block';
import { DistrictMaster } from 'src/app/models/master_district';
import { FacilityMaster } from 'src/app/models/master_facility';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { isBlockAdmin, isDistrictAdmin } from 'src/app/utils/session.util';

import {
  optionObjectObjectValidator,
  selectedOptionObjectValidator,
  multiSelectedOptionObjectValidator,
} from 'src/app/validators/searchSelect.validator';
import { UserService } from '../service/user.service';
import { UserDataSource } from './user.datasource';
import { exportToExcel } from '../../utils/exportToExcel.util';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { UserDialog } from '../bulk-edit/user-dialog';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListUsersComponent implements OnInit {
  currentUser: User;
  userSubscription: Subscription;
  displayedColumns: string[] = [
    'select',
    'district_id',
    'block_id',
    'facilty_name',
    'user_name',
    'mobile_number',
    'phr_role',
    'isActive',
    'actions',
  ];
  //data: Subject<any>;
  dataSource: UserDataSource;
  filters = {
    USER_NAME: null,
    MOBILE_NUMBER: null,
    DISTRICT_ID: null,
    BLOCK_ID: null,
    PHR_ROLE: null,
    FACILITY_ID: null,
    ROLE: null,
  };

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  @ViewChild(MatSort, { static: true })
  sort: MatSort;

  // Private
  private _unsubscribeAll: Subject<any>;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;

  districtList: DistrictMaster[] = [];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  blockList: BlockMaster[] = [];
  filteredBlocks: Subject<BlockMaster[]> = new Subject();

  facilityList: FacilityMaster[];
  filteredFacilities: Subject<FacilityMaster[]> = new Subject();

  phrRoles: any[];
  filteredPHRRole: Subject<any[]> = new Subject();

  totalDistricts: DistrictMaster[] = [];
  totalBlocks: BlockMaster[] = [];

  employeeRoleList: Array<any>;
  filteredEmployeeRoles: Subject<any[]> = new Subject();

  selectedRole: Array<any> = [];

  @ViewChild('roleInput') roleInput: ElementRef<HTMLInputElement>;

  selection = new SelectionModel<any>(true, []);
  user_filters: any;

  isExportInProgress: boolean = false;

  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private _service: UserService,
    private _masterDataService: MasterDataService,
    private _router: Router,
    private dialog: MatDialog
  ) {
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
    console.log('In List User');
    this.userSubscription = this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      console.log('Setting phr roles base on User');
      if (
        this.currentUser.phr_role === 'WEB_STATE_ADMIN' ||
        this.currentUser.phr_role === 'STATE_ADMIN'
      ) {
        this.phrRoles = Constants.PHR_ROLE_STATE;
      } else if (
        this.currentUser.phr_role === 'WEB_DISTRICT_ADMIN' ||
        this.currentUser.phr_role === 'DISTRICT_ADMIN'
      ) {
        this.phrRoles = Constants.PHR_ROLE_DISTRICT;
      } else {
        this.phrRoles = Constants.PHR_ROLE_BLOCK;
      }
      console.log('PHR Roles: ', this.phrRoles);
    });

    this.dataSource = new UserDataSource(this._service);

    this.searchPanel = this._formBuilder.group({
      district: [''],
      block: [''],
      facility: [''],
      phr_role: ['', [selectedOptionObjectValidator(this.phrRoles, 'name')]],
      user_name: ['', Validators.pattern('[a-zA-z]*')],
      mobile_number: [
        '',
        [Validators.pattern('[0-9]*'), Validators.maxLength(10)],
      ],
      role: [[]],
    });

    if (sessionStorage.getItem('user_filters'))
      this.user_filters = JSON.parse(sessionStorage.getItem('user_filters')!);

    if (this.user_filters) {
      const {
        district,
        block,
        facility,
        phrRole,
        userName,
        mobileNumber,
        role,
      } = this.user_filters;
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        BLOCK_ID: block?.block_id || null,
        FACILITY_ID: facility?.facility_id || null,
        PHR_ROLE: phrRole || null,
        ROLE: role?.map((el) => el.role_id) || null,
        USER_NAME: userName ? userName.toLowerCase() : null,
        MOBILE_NUMBER: mobileNumber || null,
      };
      this.searchPanel.patchValue({
        user_name: userName,
        mobile_number: mobileNumber,
      });
    }

    this.getDistrictList();
    // Get master data (district etc)
    this.getBlockList();
    this.getFacilityList();
    this.getEmployeeRoles();

    this.onChanges();
  }

  ngAfterViewInit() {
    console.log('paginator-ngAfterViewInit:', this.paginator);
    //this.paginator.pageSize = 100;
    this.dataSource.loadUsers(
      this.currentUser,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
    this.dataSource.counter$
      .pipe(
        tap((count) => {
          this.paginator.length = count;
        })
      )
      .subscribe();
    // when paginator event is invoked, retrieve the related data
    this.paginator.page.subscribe(() =>
      this.dataSource.loadUsers(
        this.currentUser,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      )
    );

    setTimeout(() => {
      this.searchPanel
        .get('phr_role')
        ?.setValue(this.user_filters?.phrRole ? this.user_filters.phrRole : '');
    }, 0);
  }

  onChanges(): void {
    console.log('=> called onChange() 2');

    this.searchPanel.get('district')?.valueChanges.subscribe((val: any) => {
      console.log('district value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.district_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });

    this.searchPanel.get('block')?.valueChanges.subscribe((val: any) => {
      console.log('Block value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.block_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.blockList.filter((block: any) =>
        block.block_name.toLowerCase().includes(filterValue)
      );
      this.filteredBlocks.next(filteredOne);
    });

    this.searchPanel.get('facility')?.valueChanges.subscribe((val: any) => {
      console.log('Facility value:', val, ' and type:', typeof val);
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

    this.searchPanel.get('phr_role')?.valueChanges.subscribe((val: any) => {
      console.log('PHR Role value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object' ? val.name.toLowerCase() : val.toLowerCase();
      let filteredOne = this.phrRoles.filter((phrRole: any) =>
        phrRole.name.toLowerCase().includes(filterValue)
      );
      console.log('Selected PHR:', filteredOne);
      this.filteredPHRRole.next(filteredOne);
    });

    this.searchPanel.get('role')?.valueChanges.subscribe((value: any) => {
      console.log('values change for role:', value);

      if (value && value.length == 0) {
        this.filteredEmployeeRoles.next(this.employeeRoleList);
      }

      if (typeof value === 'string') {
        const filterValue = value.toLowerCase();
        let filteredOne = this.employeeRoleList.filter((empRole: any) =>
          empRole.role_name.toLowerCase().includes(filterValue)
        );
        this.filteredEmployeeRoles.next(filteredOne);
      }
    });
  }

  getDistrictList() {
    this._masterDataService
      .getDistrictsList()
      .subscribe((values: Array<any>) => {
        console.log('List users | District list:', values);
        this.totalDistricts = values;
        // If district admin or block admin, then pre-fill district and disable the field
        if (
          this.currentUser &&
          (isDistrictAdmin(this.currentUser) || isBlockAdmin(this.currentUser))
        ) {
          let operatorDistrict = this.currentUser.district_id;
          console.log('Operator district id:', operatorDistrict);
          if (operatorDistrict) {
            let operDistrictObj: any = values.find(
              (district) => district.district_id === operatorDistrict
            );
            this.searchPanel.get('district')?.setValue(operDistrictObj);
            this.searchPanel.get('district')?.disable();
            this.districtList = [];
          }
        } else {
          this.districtList = values;
          this.searchPanel
            .get('district')
            ?.setValidators([
              optionObjectObjectValidator(this.districtList, 'district_name'),
            ]);
          this.searchPanel
            .get('district')
            ?.setValue(
              this.user_filters?.district ? this.user_filters.district : ''
            );
        }
      });
  }

  getBlockList() {
    this._masterDataService.getBlocksList().subscribe((values: Array<any>) => {
      console.log('List users | Block list:', values);
      this.totalBlocks = values;
      if (this.currentUser && isDistrictAdmin(this.currentUser)) {
        let operatorDistrictId = this.currentUser.district_id;
        console.log('Operator District for block id:', operatorDistrictId);
        if (operatorDistrictId) {
          let filteredList = values.filter((block) => {
            return block.district_id === operatorDistrictId;
          });
          this.blockList = filteredList;
          this.searchPanel
            .get('block')
            ?.setValidators([
              optionObjectObjectValidator(this.blockList, 'block_name'),
            ]);
          this.searchPanel
            .get('block')
            ?.setValue(this.user_filters?.block ? this.user_filters.block : '');
        }
      } else if (this.currentUser && isBlockAdmin(this.currentUser)) {
        let operatorBlockId = this.currentUser.block_id;
        console.log('Operator block id:', operatorBlockId);
        if (operatorBlockId) {
          let operBlockObj: any = values.find(
            (block) => block.block_id === operatorBlockId
          );
          this.searchPanel.get('block')?.setValue(operBlockObj);
          this.searchPanel.get('block')?.disable();
          this.blockList = [];
        }
      } else {
        this.blockList = values;
        this.searchPanel
          .get('block')
          ?.setValidators([
            optionObjectObjectValidator(this.blockList, 'block_name'),
          ]);
        this.searchPanel
          .get('block')
          ?.setValue(this.user_filters?.block ? this.user_filters.block : '');
      }
    });
  }

  getFacilityList() {
    this._masterDataService
      .getFacilityList()
      .subscribe((values: Array<any>) => {
        console.log('value-3:', values);
        this.facilityList = values;
        this.searchPanel
          .get('facility')
          ?.setValidators([
            optionObjectObjectValidator(this.facilityList, 'facility_name'),
          ]);
        this.searchPanel
          .get('facility')
          ?.setValue(
            this.user_filters?.facility ? this.user_filters.facility : ''
          );
      });
  }

  getEmployeeRoles() {
    this._masterDataService.getEmpRoleList().subscribe((values: Array<any>) => {
      this.employeeRoleList = values;
      if (this.user_filters?.role) {
        this.selectedRole = this.user_filters.role;
        this.selectedRole.forEach((item: any) => {
          const checkboxInd = this.employeeRoleList.findIndex(
            (elm) => elm.role_id == item.role_id
          );
          if (checkboxInd >= 0) {
            this.employeeRoleList[checkboxInd].selected = true;
          }
        });
      }
      this.searchPanel
        .get('role')
        ?.setValidators(
          multiSelectedOptionObjectValidator(this.employeeRoleList, 'role_name')
        );
      this.searchPanel
        .get('role')
        ?.setValue(this.user_filters?.role ? this.user_filters.role : []);
    });
  }

  onDistrictBlur() {
    console.log('inside ondistrictBlur');
    if (
      this.searchPanel.get('district')?.value &&
      this.searchPanel.get('district')?.valid
    ) {
      let selectedDistrict = this.searchPanel.get('district')?.value;
      this._service
        .getBlocksListForDistrict(selectedDistrict.district_id)
        .then((blocks: Array<any>) => {
          console.log('list user | block list:', blocks);
          this.blockList = blocks;
          this.searchPanel.get('block')?.clearValidators();
          this.searchPanel
            .get('block')
            ?.addValidators([
              optionObjectObjectValidator(this.blockList, 'block_name'),
            ]);
          this.searchPanel.get('block')?.updateValueAndValidity();

          // TODO
          this.searchPanel.get('block')?.setValue('');
        });
    }
  }

  onBlockBlur() {
    console.log('list user | facility list:>>>>>>>>>>>');
    if (
      this.searchPanel.get('block')?.value &&
      this.searchPanel.get('block')?.valid
    ) {
      let selectedBlock = this.searchPanel.get('block')?.value;
      this._service
        .getFacilityNameForBlock(selectedBlock.block_id)
        .then((facilities: Array<any>) => {
          console.log('list user | facility list:', facilities);
          this.facilityList = facilities;
          this.searchPanel.get('facility')?.clearValidators();
          this.searchPanel
            .get('facility')
            ?.addValidators([
              optionObjectObjectValidator(this.facilityList, 'facility_name'),
            ]);
          this.searchPanel.get('facility')?.updateValueAndValidity();

          // TODO
          this.searchPanel.get('facility')?.setValue('');
        });
    }
  }

  editUser(product: any) {
    //console.log("In Edit User " + product);
    sessionStorage.setItem('EDIT_USER', JSON.stringify(product));
    this._router.navigateByUrl('/users/edit');
  }

  addUser() {
    sessionStorage.removeItem('EDIT_USER');
    this._router.navigateByUrl('/users/add');
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  displayFacilityFn(facility?: any): string {
    return facility ? facility.facility_name : '';
  }

  displayRoleFn(empRole: any): string {
    console.log(empRole);
    let roleNames =
      typeof empRole == 'object' ? empRole?.map((role) => role.role_name) : '';
    return roleNames;
  }

  getFilteredUserList() {
    // removing the selection for bulk edit
    this.selection.selected.forEach((id: any) => this.selection.deselect(id));
    if (this.searchPanel.valid) {
      this.isCallInProgress = true;

      let district = null;
      if (this.searchPanel.get('district')?.disabled) {
        district = this.searchPanel.getRawValue().district?.district_id;
      } else {
        district =
          this.searchPanel.value['district'] ||
          this.searchPanel.value['district'] != ''
            ? this.searchPanel.value['district'].district_id
            : null;
      }

      let block = null;
      if (this.searchPanel.get('block')?.disabled) {
        block = this.searchPanel.getRawValue().block?.block_id;
      } else {
        block =
          this.searchPanel.value['block'] ||
          this.searchPanel.value['block'] != ''
            ? this.searchPanel.value['block'].block_id
            : null;
      }

      let roleIds: any = null;
      if (this.selectedRole.length > 0) {
        roleIds = this.selectedRole.map((role: any) => role.role_id);
      }

      //console.log('Get filtered list:', this.searchPanel.value);
      let _filters = {
        DISTRICT_ID: district,
        BLOCK_ID: block,
        FACILITY_ID:
          this.searchPanel.value['facility'] ||
          this.searchPanel.value['facility'] != ''
            ? this.searchPanel.value['facility'].facility_id
            : null,
        PHR_ROLE:
          this.searchPanel.value['phr_role'] ||
          this.searchPanel.value['phr_role'] != ''
            ? this.searchPanel.value['phr_role']
            : null,
        USER_NAME:
          this.searchPanel.value['user_name'] ||
          this.searchPanel.value['user_name'] != ''
            ? this.searchPanel.value['user_name'].toLowerCase()
            : null,
        MOBILE_NUMBER:
          this.searchPanel.value['mobile_number'] ||
          this.searchPanel.value['mobile_number'] != ''
            ? this.searchPanel.value['mobile_number']
            : null,
        ROLE: roleIds,
      };
      console.log('Calling get Usser with Filters: ', _filters);
      this.filters = _filters;

      let obj = {
        district: this.searchPanel.get('district')?.value,
        block: this.searchPanel.get('block')?.value,
        facility: this.searchPanel.get('facility')?.value,
        phrRole: this.searchPanel.get('phr_role')?.value,
        userName: this.searchPanel.get('user_name')?.value,
        mobileNumber: this.searchPanel.get('mobile_number')?.value,
        role: this.searchPanel.get('role')?.value,
      };

      sessionStorage.setItem('user_filters', JSON.stringify(obj));

      this.paginator.pageIndex = 0;
      this.loadRecords(
        this.currentUser,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      );
    }
  }

  clearSearchFields() {
    sessionStorage.removeItem('user_filters');
    this.user_filters = null;
    this.isCallInProgress = true;
    this.getDistrictList();
    this.getBlockList();
    this.getFacilityList();
    this.searchPanel.patchValue({
      district: '',
      block: '',
      facility: '',
      phr_role: '',
      user_name: '',
      mobile_number: '',
      role: [],
    });
    // clearing the role selection
    this.employeeRoleList.map((el) => (el.selected = false));
    this.selectedRole = [];

    this.filters = {
      USER_NAME: null,
      MOBILE_NUMBER: null,
      DISTRICT_ID: null,
      BLOCK_ID: null,
      PHR_ROLE: null,
      FACILITY_ID: null,
      ROLE: null,
    };
    this.paginator.pageIndex = 0;
    this.loadRecords(
      this.currentUser,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
    // removing the selection for bulk edit
    this.selection.selected.forEach((id: any) => this.selection.deselect(id));
  }

  loadRecords(user: User, filters: any, pageIndex: number, pageSize: number) {
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };
    this.dataSource.loadUsers(
      this.currentUser,
      filters,
      pageIndex,
      pageSize,
      stopCallProgress
    );
  }

  async createExportData(data: any) {
    const exportData: any = [];
    for (var i = 0; i < data?.length; i++) {
      const elem = data[i];
      const districtName =
        this.totalDistricts?.find((dis) => dis.district_id == elem.district_id)
          ?.district_name || 'None';
      const blockName =
        this.totalBlocks?.find((blc) => blc.block_id == elem.block_id)
          ?.block_name || 'None';
      const role =
        this.employeeRoleList?.find((role) => role.role_id == elem.role)
          ?.role_name || 'None';
      const hud = elem.hud_id
        ? await this._service.getHudName(elem?.hud_id)
        : null;
      exportData.push({
        'User Id': elem.user_id || '-',
        District: districtName || '-',
        HUD: hud || '-',
        Block: blockName || '-',
        Facility: elem.facility_name || '-',
        Name: elem.user_first_name + ' ' + elem.user_last_name || '-',
        'Mobile Number': elem.mobile_number || '-',
        'PHR Role': elem.phr_role || '-',
        Role: role || '-',
        Department: elem.department_name,
        'Created On': elem?.date_created
          ? new Date(elem.date_created)?.toLocaleDateString()
          : '-',
        'Last Updated': elem?.last_update_date
          ? new Date(elem.last_update_date)?.toLocaleDateString()
          : '-',
        Active: elem.active || '-',
      });
    }
    this.isExportInProgress = false;
    console.log('user export data', exportData);
    if (exportData.length > 0) exportToExcel(exportData, 'Users.xlsx');
  }

  total_records: any = [];

  downloadRecords(pageInd = 0) {
    this.isExportInProgress = true;

    this._service
      .getUsers(this.currentUser, this.filters, pageInd, 5000)
      .subscribe(async (result: any) => {
        const data = result?.data || [];
        this.total_records.push(...data);
        if (result?.status == 'SUCCESS-CONTINUE') {
          this.downloadRecords(++pageInd);
        }
        if (result?.status == 'SUCCESS-FINAL') {
          this.createExportData(this.total_records);
        }
      });
  }

  selectRoles(evt: any, role: any) {
    console.log('selected role', role);
    role.selected = !role.selected;
    if (role.selected) {
      this.selectedRole.push(role);
    } else {
      let ind = this.selectedRole.findIndex(
        (item: any) => role.role_id == item.role_id
      );
      console.log('index', ind);
      this.selectedRole.splice(ind, 1);
    }

    this.searchPanel.get('role')?.setValue(this.selectedRole);
    this.roleInput.nativeElement.value = '';
  }

  resetFilteredEmployeeRoles() {
    this.filteredEmployeeRoles.next(this.employeeRoleList);
  }

  removeRole(role: any): void {
    const index = this.selectedRole.findIndex(
      (item) => item.role_id == role.role_id
    );
    const checkboxInd = this.employeeRoleList.findIndex(
      (elm) => elm.role_id == role.role_id
    );
    if (checkboxInd >= 0) {
      this.employeeRoleList[checkboxInd].selected = false;
    }
    if (index >= 0) {
      this.selectedRole.splice(index, 1);
    }
  }

  isAllSelected() {
    const selectedRecords = this.selection.selected;
    const records = this.dataSource.usersSubject.value;
    return !records.some((el) => selectedRecords.indexOf(el.user_id) == -1);
  }

  masterToggle() {
    let users = this.dataSource.usersSubject.value;
    this.isAllSelected()
      ? users.forEach((user) => this.selection.deselect(user.user_id))
      : users.forEach((user) => this.selection.select(user.user_id));
  }

  bulkEdit() {
    console.log(this.selection.selected);
    const dialogRef = this.dialog.open(UserDialog, {
      data: {
        userIds: this.selection.selected,
      },
      width: '1000px',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('dialog close', result);
      this.selection.selected.forEach((id: any) => this.selection.deselect(id));
      if (result) {
        //this.paginator.pageIndex = 0;
        this.loadRecords(
          this.currentUser,
          this.filters,
          this.paginator.pageIndex,
          this.paginator.pageSize
        );
      }
    });
  }
}
