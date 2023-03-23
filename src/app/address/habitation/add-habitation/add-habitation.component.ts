import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { BlockMaster } from 'src/app/models/master_block';
import { VillageMaster } from 'src/app/models/master_village';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { DistrictMaster } from 'src/app/models/master_district';
import { HABITATION } from 'src/app/models/habitation';
import { HudMaster } from 'src/app/models/master-hud';
import { HabitationService } from '../service/habitation.service';
import { v4 as uuidv4 } from 'uuid';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { Constants } from 'src/app/config/constants/constants';
import { MatSnackBar } from '@angular/material/snack-bar';
import { resetFormList } from 'src/app/utils/form-util';
import { isUnallocated } from 'src/app/utils/unallocated.util';
import { ConfirmationModalComponent } from '../../confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GidValidatorService } from 'src/app/services/gid-validator.service';

@Component({
  selector: 'app-add-habitation',
  templateUrl: './add-habitation.component.html',
  styleUrls: ['./add-habitation.component.scss'],
})
export class AddHabitationComponent implements OnInit, CanComponentDeactivate {
  habitationDetails: FormGroup;
  isCallInProgress = false;

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  hudList: HudMaster[];
  filteredHuds: Subject<HudMaster[]> = new Subject();

  blockList: BlockMaster[];
  filteredBlocks: Subject<BlockMaster[]> = new Subject();

  villageList: VillageMaster[];
  filteredVillages: Subject<VillageMaster[]> = new Subject();

  currentUser: User;

  habitation: HABITATION;
  isEdit: boolean;
  title: string;
  gidHeader: string;

  isSubmit: boolean = false;

  constructor(
    private habitationService: HabitationService,
    private _authService: AuthService,
    private _masterDataService: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _gidValidator: GidValidatorService
  ) {
    this.isEdit = false;
    this.title = 'Create Habitation';
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (this.isSubmit) return false;
    else return this.habitationDetails.dirty;
  }

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let _editObject = sessionStorage.getItem('EDIT_HABITATION');

    if (_editObject) {
      this.habitation = JSON.parse(_editObject);
      this.title = 'Edit Habitation';
      this.isEdit = true;
      this.gidHeader = `(GID: ${this.habitation.habitation_gid})`;
    }

    this.habitationDetails = this._formBuilder.group({
      district: [
        this.habitation ? this.habitation.district_id : '',
        [Validators.required],
      ],
      hud: [
        this.habitation ? this.habitation.hud_id : '',
        [Validators.required],
      ],
      block: [
        this.habitation ? this.habitation.block_id : '',
        [Validators.required],
      ],
      village: [
        this.habitation ? this.habitation.village_id : '',
        [Validators.required],
      ],
      habitation_name: [
        this.habitation?.habitation_name || '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      habitation_local_name: [
        this.habitation?.habitation_local_name || '',
        Validators.pattern('[0-9a-zA-Z .()_-]*'),
      ],
      habitation_gid: [
        {
          value: this.habitation?.habitation_gid || '',
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
              this.habitation?.habitation_id,
              'HABITATION'
            ),
          ],
          updatedOn: 'blur',
        },
      ],
      active: [
        this.habitation ? (this.habitation?.active ? 'Yes' : 'No') : '',
        Validators.required,
      ],
    });

    this.getDistrictList();
    this.getHudList();
    this.getBlockList();
    this.getVillageList();
    this.onChanges();
  }

  getDistrictList() {
    this._masterDataService.getDistrictsList().subscribe((districts: any) => {
      this.districtList = districts;
      let disField = this.habitationDetails.get('district');
      disField?.addValidators(
        optionObjectObjectValidator(this.districtList, 'district_name')
      );
      disField?.setValue(
        this.habitation
          ? {
              district_id: this.habitation?.district_id,
              district_name: this.habitation.district_name,
            }
          : ''
      );
    });
  }

  getHudList() {
    this._masterDataService.getHudList().subscribe((values: Array<any>) => {
      this.hudList = values;
      //filtering the hud list based on district value in edit
      if (this.habitation?.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.habitation.district_id
        );
      }
      this.habitationDetails
        .get('hud')
        ?.addValidators(optionObjectObjectValidator(this.hudList, 'hud_name'));
      this.habitationDetails.get('hud')?.setValue(
        this.habitation
          ? {
              hud_id: this.habitation.hud_id,
              hud_name: this.habitation.hud_name,
            }
          : ''
      );
    });
  }

  getBlockList() {
    this._masterDataService.getBlocksList().subscribe((values: Array<any>) => {
      console.log('add/edit habitation | get block list: ', values);
      this.blockList = values;
      //filtering the block list based on district value in edit
      if (this.habitation?.district_id) {
        this.blockList = values.filter(
          (el: any) => el.district_id == this.habitation.district_id
        );
      }
      if (this.habitation?.hud_id) {
        this.blockList = values.filter(
          (el: any) => el.hud_id == this.habitation.hud_id
        );
      }
      this.habitationDetails
        .get('block')
        ?.addValidators(
          optionObjectObjectValidator(this.blockList, 'block_name')
        );
      this.habitationDetails.get('block')?.setValue(
        this.habitation
          ? {
              block_id: this.habitation.block_id,
              block_name: this.habitation.block_name,
            }
          : ''
      );
    });
  }

  getVillageList() {
    this._masterDataService.getVillageList().subscribe((values: Array<any>) => {
      console.log('add/edit habitation | get village list: ', values);
      this.villageList = values;
       //filtering the village list based on block value in edit
       if (this.habitation?.block_id) {
         this.villageList = values.filter(
           (el: any) => el.block_id == this.habitation.block_id
         );
       }
      this.habitationDetails
        .get('village')
        ?.addValidators(
          optionObjectObjectValidator(this.villageList, 'village_name')
        );
      this.habitationDetails.get('village')?.setValue(
        this.habitation
          ? {
              village_id: this.habitation.village_id,
              village_name: this.habitation.village_name,
            }
          : ''
      );
    });
  }

  onChanges(): void {
    console.log('add/edit habitation | onChange()');

    this.habitationDetails
      .get('district')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue =
          typeof val === 'object'
            ? val.district_name?.toLowerCase() || ""
            : val.toLowerCase();
        let filteredOne = this.districtList.filter((dis: any) =>
          dis.district_name.toLowerCase().includes(filterValue)
        );
        this.filteredDistricts.next(filteredOne);
      });

    this.habitationDetails.get('hud')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.hud_name?.toLowerCase() || ""
          : val.toLowerCase();
      let filteredOne = this.hudList.filter((hud: any) =>
        hud?.hud_name?.toLowerCase().includes(filterValue)
      );
      this.filteredHuds.next(filteredOne);
    });

    this.habitationDetails.get('block')?.valueChanges.subscribe((val: any) => {
      console.log(
        'add/edit habitation | Block value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.block_name?.toLowerCase() || ""
          : val.toLowerCase();
      let filteredOne = this.blockList.filter((block: any) =>
        block.block_name.toLowerCase().includes(filterValue)
      );
      this.filteredBlocks.next(filteredOne);
    });

    this.habitationDetails
      .get('village')
      ?.valueChanges.subscribe((val: any) => {
        console.log(
          'add/edit habitation | village value:',
          val,
          ' and type:',
          typeof val
        );
        const filterValue =
          typeof val === 'object'
            ? val.village_name?.toLowerCase() || ""
            : val.toLowerCase();
        let filteredOne = this.villageList.filter((village: any) =>
          village.village_name.toLowerCase().includes(filterValue)
        );
        this.filteredVillages.next(
          filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
        );
      });
  }

  async onDistrictBlur() {
    if (
      this.habitationDetails.get('district')?.value &&
      this.habitationDetails.get('district')?.valid
    ) {
      let selectedDistrict = this.habitationDetails.get('district')?.value;
      console.log('the selected deistr is gicen as:', selectedDistrict);
      this.hudList = await this.habitationService.getHudListForDistrict(
        selectedDistrict.district_id
      );
      this.blockList = await this.habitationService.getBlockListForDistrict(
        selectedDistrict.district_id
      );
    } else {
      console.log('selected district is empty');
      this.hudList = await this.habitationService.getHudList();
      this.blockList = await this.habitationService.getBlockList();
    }

    resetFormList(
      this.habitationDetails,
      'hud',
      'hud_name',
      this.hudList,
      true
    );
    this.habitationDetails.get('hud')?.setValue('');

    resetFormList(
      this.habitationDetails,
      'block',
      'block_name',
      this.blockList,
      true
    );
    this.habitationDetails.get('block')?.setValue('');

    //reset the village value also
    this.onBlockBlur();
  }

  async onHudBlur() {
    console.log('the hud is givne as:');
    
    // if (
    //   this.habitationDetails.get('hud')?.value &&
    //   this.habitationDetails.get('hud')?.valid
    // ) {
    //   let selectedHud = this.habitationDetails.get('hud')?.value;
    //   console.log('the selected hd is gicen as:', selectedHud);
    //   this.blockList = await this.habitationService.getBlocksListForHud(
    //     selectedHud.district_id
    //   );
    // } else {
      if (this.habitationDetails.get('district')?.value) {
        this.blockList = await this.habitationService.getBlockListForDistrict(
          this.habitationDetails.get('district')?.value?.district_id
        );
      } else this.blockList = await this.habitationService.getBlockList();
    // }
    resetFormList(
      this.habitationDetails,
      'block',
      'block_name',
      this.blockList,
      true,
      ''
    );
    //reset the village value also
    this.onBlockBlur();
  }

  async onBlockBlur() {
    if (
      this.habitationDetails.get('block')?.value &&
      this.habitationDetails.get('block')?.valid
    ) {
      let selectedBlock = this.habitationDetails.get('block')?.value;
      console.log('the block os given as:', selectedBlock);
      this.villageList = await this.habitationService.getVillageListForBlock(
        selectedBlock.block_id
      );
    } else {
      console.log('selected block is empty');
      this.villageList = await this.habitationService.getVillageList();
    }

    resetFormList(
      this.habitationDetails,
      'village',
      'village_name',
      this.villageList,
      true
    );
    this.habitationDetails.get('village')?.setValue('');
  }

  displayDistrictFn(district?: any) {
    return district ? district.district_name : '';
  }

  displayHudFn(hud?: any) {
    return hud ? hud.hud_name : '';
  }

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  displayVillageFn(village?: any): string {
    return village ? village.village_name : '';
  }

  submitForm(target_hsc = null): void {
    if (!this.habitationDetails.valid) {
      console.log('Add/Edit Habitation | Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    if (!this.isEdit) {
      this.habitation = new HABITATION();
      this.habitation.habitation_id = uuidv4();
      this.habitation.habitation_gid = 0;
    } else {
      // In edit mode, GID is editable.
      this.habitation.habitation_gid =
        +this.habitationDetails.value['habitation_gid'];
    }

    this.habitation.district_id =
      this.habitationDetails.get('district')?.value.district_id;
    this.habitation.hud_id = this.habitationDetails.get('hud')?.value.hud_id;
    this.habitation.block_id =
      this.habitationDetails.get('block')?.value.block_id;
    this.habitation.village_id =
      this.habitationDetails.get('village')?.value.village_id;
    this.habitation.habitation_name =
      this.habitationDetails.value['habitation_name'];
    this.habitation.habitation_local_name = this.habitationDetails.value[
      'habitation_local_name'
    ]
      ? this.habitationDetails.value['habitation_local_name']
      : null;
    this.habitation.active =
      this.habitationDetails.value['active'] == 'Yes' ? true : false;

    // remove non required fields for upsert request body
    delete this.habitation.district_name;
    delete this.habitation.hud_name;
    delete this.habitation.block_name;
    delete this.habitation.village_name;

    console.log('>>>>> habitation: ', this.habitation);

    this.habitationService
      .upsertHabitation(this.currentUser, this.habitation, target_hsc)
      .subscribe((status) => {
        console.log('Add habitation response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_HABITATION');
          this._snackBar.open(
            'Habitation Added/Updated Successfully.',
            'Dismiss',
            {
              duration: 4000,
            }
          );
          this.habitationService.addHabitationToLocalDb(this.habitation);
          this._router.navigateByUrl('/addr/habitations');
        } else {
          this._snackBar.open('Habitation Add/Edit Failed.', 'Dismiss', {
            duration: 4000,
          });
        }
        this.isCallInProgress = false;
      });
  }

  isUnallocated(): boolean {
    return isUnallocated(this.habitationDetails);
  }

  openConfirmationPopup() {
    if (!this.habitationDetails.valid) {
      console.log('Add/Edit habitation | Form not valid!');
      return;
    }
    //if hieranchy is changed then open confirmation pop up or call submit form
    if (this.isEdit) {
      const isHierarchyChanged: boolean =
        this.habitation.district_id !=
          this.habitationDetails.get('district')?.value?.district_id ||
        this.habitation.hud_id !=
          this.habitationDetails.get('hud')?.value.hud_id ||
        this.habitation.block_id !=
          this.habitationDetails.get('block')?.value.block_id ||
        this.habitation.village_id !=
          this.habitationDetails.get('village')?.value.village_id;
      if (!isHierarchyChanged) {
        this.submitForm();
        return;
      }
    } else {
      this.submitForm();
      return;
    }

    const _showCateringHsc =
      this.habitation.district_id !=
        this.habitationDetails.get('district')?.value?.district_id ||
      this.habitation.hud_id !=
        this.habitationDetails.get('hud')?.value.hud_id ||
      this.habitation.block_id !=
        this.habitationDetails.get('block')?.value.block_id;

    const dialogRef = this._dialog.open(ConfirmationModalComponent, {
      data: {
        showCateringHsc: _showCateringHsc,
        payload: {
          HABITATION_DATA: this.habitation,
        },
        blockId: this.habitationDetails.get('block')?.value.block_id,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        _showCateringHsc ? this.submitForm(result) : this.submitForm(null);
      }
    });
  }
}
