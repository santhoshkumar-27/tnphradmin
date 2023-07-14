import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Constants } from 'src/app/config/constants/constants';
import { Block } from 'src/app/models/block';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { BlockService } from '../service/block.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import {
  isBlockAdmin,
  isDistrictAdmin,
  isStateAdmin,
} from 'src/app/utils/session.util';
import { resetFormList } from 'src/app/utils/form-util';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';
import { isUnallocated } from 'src/app/utils/unallocated.util';
import { GidValidatorService } from 'src/app/services/gid-validator.service';

@Component({
  selector: 'app-add-block',
  templateUrl: './add-block.component.html',
  styleUrls: ['./add-block.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddBlockComponent implements OnInit, CanComponentDeactivate {
  block: Block;
  currentUser: User;
  isEdit: boolean;
  title: string;
  blockTypes: any = Constants.BLOCK_TYPE;
  isCallInProgress: boolean = false;
  gidHeader: string = '';

  districtList: any;
  filteredDistricts: any = new Subject();
  hudList: any;
  filteredHuds: any = new Subject();

  blockList: any = [];
  filteredBlocks_385: any = new Subject();
  filteredBlocks_mpco: any = new Subject();

  mainPhcList: any = [];
  filteredMainPhcs: any = new Subject();

  blockDetails: FormGroup;

  isSubmit: boolean = false;

  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   */
  constructor(
    private _formBuilder: FormBuilder,
    private blockService: BlockService,
    private _router: Router,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _gidValidator: GidValidatorService
  ) {
    this.isEdit = false;
    this.title = 'Create Block';
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (this.isSubmit) return false;
    else return this.blockDetails.dirty;
  }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_BLOCK');

    if (_editObject) {
      this.block = JSON.parse(_editObject);
      this.title = 'Edit Block';
      this.isEdit = true;

      console.log('Edit Block | Block being edited :', this.block);
    }

    this.blockDetails = this._formBuilder.group({
      district: [
        this.block ? this.block.district_id : '',
        [Validators.required],
      ],
      hud: [this.block ? this.block.hud_id : '', [Validators.required, Validators.pattern("[0-9a-zA-Z: -_{},']*")]],
      block_name: [
        this.block ? this.block.block_name : '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      block_local_name: [
        this.block ? this.block.block_local_name : '',
        [Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      block_gid: [
        {
          value: this.block ? this.block.block_gid : '',
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
              this.block?.block_id,
              'BLOCK'
            ),
          ],
          updateOn: 'blur',
        },
      ],
      block_type: [
        this.block ? this.block.block_type : '',
        Validators.required,
      ],
      block_health_main_phc: [
        {
          value: this.block
            ? {
                facility_name: this.block.block_health_main_phc_name,
              }
            : '',
          disabled: true,
        },
        [Validators.required],
      ],
      block_health_main_phc_local_name: [
        this.block ? this.block.block_health_main_phc_local_name : '',
        [Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      block_385_report_id: [''],
      block_mpco_report_id: [''],
      block_hmis_code: [
        this.block ? this.block.block_hmis_code : '',
        Validators.pattern('[0-9]*'),
      ],
      block_picme_id: [
        this.block ? this.block.block_picme_id : '',
        Validators.pattern('[0-9]*'),
      ],
      block_rd_code: [
        this.block ? this.block.block_rd_code : '',
        Validators.pattern('[0-9]*'),
      ],
      block_lgd_code: [
        this.block ? this.block.block_lgd_code : '',
        Validators.pattern('[0-9]*'),
      ],
      active: [
        this.block ? this.returnYesOrNo(this.block.active) : '',
        Validators.required,
      ],
    });

    this.blockDetails.setValidators((form) =>
      Validators.required(form.get('block_health_main_phc')!)
    );

    if (this.isEdit) {
      this.updateBlockListForReport();
      this.updatedReportIDs('block_385_report_id');
      this.updatedReportIDs('block_mpco_report_id');
    }

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Add Block | Current User:', userString);
    if (userString) {
      this.getDistrictList();
      this.getHudList();
      // this.getBlockList();
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

  async updateBlockListForReport() {
    this.blockList = await this.blockService.getBlocksListForDistrict(
      this.block.district_id
    );
    resetFormList(
      this.blockDetails,
      'block_385_report_id',
      'block_name',
      this.blockList,
      false
    );

    resetFormList(
      this.blockDetails,
      'block_mpco_report_id',
      'block_name',
      this.blockList,
      false
    );
  }

  getDistrictList() {
    this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
      console.log('Add Block | district list:', values);
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
          this.blockDetails.get('district')?.setValue(userDisObj);
          this.blockDetails.get('district')?.disable();
        }
      } else {
        // If not a district admin, show full dropdown list.
        this.districtList = values;
        this.blockDetails
          .get('district')
          ?.addValidators([
            optionObjectObjectValidator(this.districtList, 'district_name'),
          ]);
        this.blockDetails.get('district')?.setValue(
          this.block
            ? {
                district_id: this.block.district_id,
                district_name: this.block.district_name,
              }
            : ''
        );
      }
    });
  }

  getHudList() {
    this._dataservice.getHudList().subscribe((values: Array<any>) => {
      console.log('Add Block | hud list:', values);

      if (this.currentUser.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.currentUser.district_id
        );
      } else if (this.block?.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.block.district_id
        );
      } else {
        this.hudList = values;
      }

      this.blockDetails
        .get('hud')
        ?.addValidators([
          optionObjectObjectValidator(this.hudList, 'hud_name'),
        ]);
      this.blockDetails
        .get('hud')
        ?.setValue(
          this.block
            ? { hud_id: this.block.hud_id, hud_name: this.block.hud_name }
            : ''
        );
    });
  }

  onChanges(): void {
    console.log('Add/Edit Block | onChange()');

    this.blockDetails.get('district')?.valueChanges.subscribe((val: any) => {
      console.log(
        'Add/Edit Block | district value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.district_name?.toLowerCase() || ''
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });

    this.blockDetails.get('hud')?.valueChanges.subscribe((val: any) => {
      console.log('Add/Edit Block | hud value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.hud_name?.toLowerCase() || ''
          : val.toLowerCase();
      let filteredOne = this.hudList.filter((hud: any) =>
        hud?.hud_name?.toLowerCase().includes(filterValue)
      );
      this.filteredHuds.next(filteredOne);
    });

    this.blockDetails
      .get('block_health_main_phc')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'Add/Edit Block | block_health_main_phc value:',
          val,
          ' and type:',
          typeof val
        );
        const filterValue =
          typeof val === 'object'
            ? val.facility_name?.toLowerCase() || ''
            : val.toLowerCase();
        let filteredOne = this.mainPhcList.filter((phc: any) =>
          phc?.facility_name?.toLowerCase().includes(filterValue)
        );
        this.filteredMainPhcs.next(filteredOne);
      });

    this.blockDetails
      .get('block_385_report_id')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'Add Block | block 385 value:',
          val,
          ' and type:',
          typeof val
        );
        const filterValue =
          typeof val === 'object'
            ? val.block_name?.toLowerCase() || ''
            : val.toLowerCase();
        let filteredOne = this.blockList.filter((block: any) =>
          block.block_name.toLowerCase().includes(filterValue)
        );
        this.filteredBlocks_385.next(filteredOne);
      });

    this.blockDetails
      .get('block_mpco_report_id')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'Add Block | block mpco value:',
          val,
          ' and type:',
          typeof val
        );
        const filterValue =
          typeof val === 'object'
            ? val.block_name?.toLowerCase() || ''
            : val.toLowerCase();
        let filteredOne = this.blockList.filter((block: any) =>
          block.block_name.toLowerCase().includes(filterValue)
        );
        this.filteredBlocks_mpco.next(filteredOne);
      });
  }

  submitForm(): void {
    if (!this.blockDetails.valid) {
      console.log('Add/Edit Block | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;

    if (!this.isEdit) {
      this.block = new Block();
      this.block.block_id = uuidv4();
      this.block.block_gid = 0;
    } else {
      // In edit mode, GID is editable.
      this.block.block_gid = +this.blockDetails.value['block_gid'];
    }

    this.block.district_id =
      this.blockDetails.get('district')?.value.district_id;
    this.block.hud_id = this.blockDetails.get('hud')?.value.hud_id;
    this.block.block_name = this.blockDetails.value['block_name'];
    this.block.block_local_name = this.blockDetails.value['block_local_name']
      ? this.blockDetails.value['block_local_name']
      : null;
    this.block.block_health_main_phc_name =
      this.blockDetails.value['block_health_main_phc']?.facility_name;
    // this.block.block_health_main_phc_local_name = this.blockDetails.value[
    //   'block_health_main_phc_local_name'
    // ]
    //   ? this.blockDetails.value['block_health_main_phc_local_name']
    //   : null;
    this.block.block_385_report_id = this.blockDetails.get(
      'block_385_report_id'
    )?.value
      ? this.blockDetails.get('block_385_report_id')?.value.block_gid
      : null;
    this.block.block_mpco_report_id = this.blockDetails.get(
      'block_mpco_report_id'
    )?.value
      ? this.blockDetails.get('block_mpco_report_id')?.value.block_gid
      : null;
    this.block.block_hmis_code = this.blockDetails.value['block_hmis_code']
      ? +this.blockDetails.value['block_hmis_code']
      : null;
    this.block.block_lgd_code = this.blockDetails.value['block_lgd_code']
      ? +this.blockDetails.value['block_lgd_code']
      : null;
    this.block.block_picme_id = this.blockDetails.value['block_picme_id']
      ? +this.blockDetails.value['block_picme_id']
      : null;
    this.block.block_rd_code = this.blockDetails.value['block_rd_code']
      ? +this.blockDetails.value['block_rd_code']
      : null;
    this.block.block_type = this.blockDetails.value['block_type'];

    this.block.active =
      this.blockDetails.value['active'] == 'Yes' ? true : false;

    console.log('>>>>> Block: ', this.block);

    this.blockService
      .upsertBlock(this.currentUser, this.block)
      .subscribe((status) => {
        console.log('Add Block response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_BLOCK');
          this._snackBar.open('Block Added/Updated successfully.', 'Dismiss', {
            duration: 4000,
          });

          this.blockService.addBlockToLocalDb(this.block);
          this._router.navigateByUrl('/addr/blocks');
        } else {
          this._snackBar.open('Block Add/Edit failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  async onDistrictBlur() {
    if (
      this.blockDetails.get('district')?.value &&
      this.blockDetails.get('district')?.valid
    ) {
      let selectedDistrict = this.blockDetails.get('district')?.value;
      this.hudList = await this.blockService.getHudListForDistrict(
        selectedDistrict.district_id
      );

      this.blockList = await this.blockService.getBlocksListForDistrict(
        selectedDistrict.district_id
      );
    } else {
      console.log('selected district is empty');
      this.hudList = await this.blockService.getHudList();

      this.blockList = await this.blockService.getBlocksList();
    }

    this.blockDetails.get('hud')?.clearValidators();
    this.blockDetails
      .get('hud')
      ?.addValidators([
        Validators.required,
        optionObjectObjectValidator(this.hudList, 'hud_name'),
      ]);
    this.blockDetails.get('hud')?.updateValueAndValidity();
    this.blockDetails.get('hud')?.setValue('');

    resetFormList(
      this.blockDetails,
      'block_385_report_id',
      'block_name',
      this.blockList,
      false
    );

    resetFormList(
      this.blockDetails,
      'block_mpco_report_id',
      'block_name',
      this.blockList,
      false
    );

    this.onHudBlur();
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

  onHudBlur() {
    if (
      this.blockDetails.get('hud')?.value &&
      this.blockDetails.get('hud')?.valid
    ) {
      this.blockDetails.get('block_health_main_phc')?.setValue('');
      this.blockDetails.get('block_health_main_phc')?.enable();
      let districtId =
        this.blockDetails.get('district')?.value?.district_id || null;
      let hudId = this.blockDetails.get('hud')?.value?.hud_id || null;
      this.blockService
        .getMainPhcs(this.currentUser, districtId, hudId)
        .subscribe((phcs: any) => {
          this.mainPhcList = phcs;
          resetFormList(
            this.blockDetails,
            'block_health_main_phc',
            'facility_name',
            this.mainPhcList,
            true,
            ''
          );
        });
    } else {
      this.blockDetails.get('block_health_main_phc')?.disable();
    }
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  displayHudFn(hud?: any): string {
    return hud ? hud.hud_name : '';
  }

  displayPhcFn(phc?: any): string {
    return phc ? phc.facility_name : '';
  }

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  returnYesOrNo(flag: boolean) {
    return flag ? 'Yes' : 'No';
  }

  getBlockObject1(id: string) {
    return { block_gid: 1, block_name: 'Hello' };
  }

  async updatedReportIDs(id: string) {
    if (this.block && this.block[id]) {
      let blockLists: Array<any> = await this.blockService.getBlocksByGID(
        this.block[id]
      );
      console.log('blockLists::', blockLists);
      if (blockLists.length > 0) {
        this.blockDetails.patchValue({
          [id]: blockLists[0],
        });
      }
    }
  }

  openConfirmationPopup() {
    if (!this.blockDetails.valid) {
      console.log('Add/Edit Block | Form not valid!');
      return;
    }
    //if hieranchy is changed then open confirmation pop up or call submit form
    if (this.isEdit) {
      const isHierarchyChanged: boolean =
        this.block.district_id !=
          this.blockDetails.get('district')?.value?.district_id ||
        this.block.hud_id != this.blockDetails.get('hud')?.value.hud_id;
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
          BLOCK_DATA: this.block,
        },
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.submitForm();
    });
  }

  isUnallocated(): boolean {
    return isUnallocated(this.blockDetails);
  }
}
