import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';
import { DistrictMaster } from 'src/app/models/master_district';
import { HudMaster } from 'src/app/models/master-hud';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BlockDataSource } from './block.datasource';
import { Block, BlockFilterType } from 'src/app/models/block';
import { User } from 'src/app/models/user';
import { BlockService } from '../service/block.service';
import { AuthService } from 'src/app/starter/services/auth.service';
import { Constants } from 'src/app/config/constants/constants';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { isBlockAdmin, isDistrictAdmin } from 'src/app/utils/session.util';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { exportToExcel } from 'src/app/utils/exportToExcel.util';
import { MatDialog } from '@angular/material/dialog';
import { disableEdit } from 'src/app/utils/unallocated.util';

@Component({
  selector: 'app-list-blocks',
  templateUrl: './list-blocks.component.html',
  styleUrls: ['./list-blocks.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListBlocksComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = [
    'district',
    'hud',
    'block',
    'blockType',
    'isActive',
    'actions',
  ];
  block: Block;

  dataSource: BlockDataSource;
  
  filters : BlockFilterType = {
    DISTRICT_ID: null,
    HUD_ID: null,
    BLOCK_NAME: null,
    BLOCK_GID: null,
    BLOCK_TYPE: null,
  };

  @ViewChild(MatPaginator, { static: false })
  paginator: MatPaginator;

  searchPanel: FormGroup;
  panelOpenState = true;
  isCallInProgress = false;
  blockTypes: any = Constants.BLOCK_TYPE;

  districtList: DistrictMaster[];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  hudList: HudMaster[];
  filteredHuds: Subject<HudMaster[]> = new Subject();

  user: User;

  block_filters: any;
  isExportInProgress: boolean = false;
  
  constructor(
    private blockService: BlockService,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    this.dataSource = new BlockDataSource(this.blockService, this._snackBar);

    this.searchPanel = this._formBuilder.group({
      district: ['', Validators.pattern('[0-9a-zA-Z .!()_-]*')],
      hud: ['', Validators.pattern('[0-9a-zA-Z .!()_-]*')],
      block_name: ['', Validators.pattern('[0-9a-zA-Z .()_-]*')],
      block_gid: ['', Validators.pattern('[0-9]*')],
      block_type: [''],
    });

    if (sessionStorage.getItem("block_filters"))
      this.block_filters = JSON.parse(sessionStorage.getItem("block_filters")!);

    if (this.block_filters) {
      const {
        block_type,
        block_name,
        district,
        hud,
        block_gid,
      } = this.block_filters;
      this.searchPanel.patchValue({
        block_name: block_name ? block_name.toLowerCase() : '',
        block_gid: block_gid || null,
        block_type: block_type || null,
      });
      this.filters = {
        DISTRICT_ID: district?.district_id || null,
        HUD_ID: hud?.hud_id || null,
        BLOCK_TYPE: block_type || null,
        BLOCK_NAME: block_name ? block_name.toLowerCase() : '',
        BLOCK_GID: block_gid || null
      }
    }

    this.getDistrictList();
    this.getHudList();
    this.onChanges();
  }

  getDistrictList() {
    this._dataservice.getDistrictsList().subscribe((values: Array<any>) => {
      console.log('List block | district list:', values);
      // This feature applicable only for state admin
      this.districtList = values;
      this.searchPanel
        .get('district')
        ?.addValidators([
          optionObjectObjectValidator(this.districtList, 'district_name'),
        ]);
      // this.searchPanel.get('district')?.setValue(
      //   this.block
      //     ? {
      //         district_id: this.block.district_id,
      //         district_name: this.block.district_name,
      //       }
      //     : ''
      // );
      this.searchPanel.get('district')?.setValue(
        this.block_filters?.district ? this.block_filters.district : ''
      );
    });
  }

  getHudList() {
    this._dataservice.getHudList().subscribe((values: Array<any>) => {
      console.log('List block | hud list:', values);

      if (this.user.district_id) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.user.district_id
        );
      } else if (this.block_filters?.district) {
        this.hudList = values.filter(
          (el: any) => el.district_id == this.block_filters.district.district_id
        );
      } else {
        this.hudList = values;
      }

      this.searchPanel
        .get('hud')
        ?.addValidators([
          optionObjectObjectValidator(this.hudList, 'hud_name'),
        ]);
      // this.searchPanel
      //   .get('hud')
      //   ?.setValue(
      //     this.block
      //       ? { hud_id: this.block.hud_id, hud_name: this.block.hud_name }
      //       : ''
      //   );
      this.searchPanel.get('hud')?.setValue(
        this.block_filters?.hud ? this.block_filters.hud : ''
      );
    });
  }

  onChanges(): void {
    console.log('List Block | onChange()');

    this.searchPanel.get('district')?.valueChanges.subscribe((val: any) => {
      console.log(
        'List Block | district value:',
        val,
        ' and type:',
        typeof val
      );
      const filterValue =
        typeof val === 'object'
          ? val.district_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.districtList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(filteredOne);
    });

    this.searchPanel.get('hud')?.valueChanges.subscribe((val: any) => {
      console.log('List Block | hud value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.hud_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.hudList.filter((hud: any) =>
        hud.hud_name.toLowerCase().includes(filterValue)
      );
      this.filteredHuds.next(filteredOne);
    });
  }

  ngAfterViewInit() {
    console.log('list-block-ngAfterViewInit:', this.paginator);
    //this.paginator.pageSize = 100;
    this.dataSource.loadBlocks(
      this.user,
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
    this.paginator.page
      .subscribe(
        () =>
          this.dataSource.loadBlocks(
            this.user,
            this.filters,
            this.paginator.pageIndex,
            this.paginator.pageSize
          )
      );
  }

  addBlock() {
    sessionStorage.removeItem('EDIT_BLOCK');
    this._router.navigateByUrl('/addr/blocks/add');
  }

  editBlock(block: any) {
    sessionStorage.setItem('EDIT_BLOCK', JSON.stringify(block));
    this._router.navigateByUrl('/addr/blocks/edit');
  }

  async onDistrictBlur() {
    if (
      this.searchPanel.get('district')?.value &&
      this.searchPanel.get('district')?.valid
    ) {
      let selectedDistrict = this.searchPanel.get('district')?.value;
      this.hudList = await this.blockService.getHudListForDistrict(
        selectedDistrict.district_id
      );

    } else {
      console.log('selected district is empty');
      this.hudList = await this.blockService.getHudList();
    }

    this.searchPanel.get('hud')?.clearValidators();
    this.searchPanel
      .get('hud')
      ?.addValidators([
        optionObjectObjectValidator(this.hudList, 'hud_name'),
      ]);
    this.searchPanel.get('hud')?.updateValueAndValidity();
    this.searchPanel.get('hud')?.setValue('');
  }

  onHudBlur() {}

  getFilteredBlockList() {
    if (this.searchPanel.valid) {
      console.log('list-block | getFilteredBlockList()');
      this.isCallInProgress = true;

      let _filters : BlockFilterType = {
        DISTRICT_ID:
          this.searchPanel.get('district')?.value ||
          this.searchPanel.get('district')?.value != ''
            ? this.searchPanel.get('district')?.value.district_id
            : null,
        HUD_ID: this.searchPanel.get('hud')?.value ||
          this.searchPanel.get('hud')?.value != ''
          ? this.searchPanel.get('hud')?.value.hud_id
          : null,
        BLOCK_NAME:
          this.searchPanel.value['block_name'] ||
          this.searchPanel.value['block_name'] != ''
            ? this.searchPanel.value['block_name'].toLowerCase()
            : null,
        BLOCK_GID:
          this.searchPanel.value['block_gid'] != ''
            ? +this.searchPanel.value['block_gid']
            : null,
        BLOCK_TYPE:
          this.searchPanel.value['block_type'] != ''
            ? this.searchPanel.value['block_type']
            : null,
      };
      console.log('list-block | Calling get blocks with Filters: ', _filters);
      this.filters = _filters;

      let obj = {
        district: this.searchPanel.get('district')?.value,
        hud: this.searchPanel.get('hud')?.value,
        block_name: this.searchPanel.get('block_name')?.value,
        block_gid: this.searchPanel.get('block_gid')?.value,
        block_type: this.searchPanel.get('block_type')?.value,
      }
      sessionStorage.setItem("block_filters", JSON.stringify(obj));

      this.paginator.pageIndex = 0;
      this.loadRecords(
        this.user,
        this.filters,
        this.paginator.pageIndex,
        this.paginator.pageSize
      );
    }
  }

  clearSearchFields() {
    sessionStorage.removeItem("block_filters");
    this.block_filters = null;
    this.isCallInProgress = true;
    this.getHudList();
    this.searchPanel.patchValue({
      district: '',
      hud: '',
      block_name: '',
      block_gid: '',
      block_type: '',
    });
    this.filters = {
      DISTRICT_ID: null,
      HUD_ID: null,
      BLOCK_NAME: null,
      BLOCK_GID: null,
      BLOCK_TYPE: null,
    };
    this.paginator.pageIndex = 0;
    this.loadRecords(
      this.user,
      this.filters,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  loadRecords(user: User, filters: any, pageIndex: number, pageSize: number) {
    let stopCallProgress = () => {
      this.isCallInProgress = false;
    };
    this.dataSource.loadBlocks(
      user,
      filters,
      pageIndex,
      pageSize,
      stopCallProgress
    );
  }

  displayDistrictFn(district?: any) {
    return district ? district.district_name : '';
  }

  displayHudFn(hud) {
    return hud ? hud.hud_name : '';
  }

  downloadRecords() {
    this.isExportInProgress = true;
    this.blockService
      .getBlocks(this.user, this.filters, 0, this.paginator.length)
      .subscribe(async (result: any) => {
        const data = result?.data || [];
        const exportData: any = [];
        for (var i = 0; i < data.length; i++) {
          const elem = data[i];
          exportData.push({
            District: elem.district_name,
            HUD: elem.hud_name,
            Block: elem.block_name,
            Block_GID: elem.block_gid,
            Block_Type: elem.block_type,
            Active: elem.active,
          });
        }
        this.isExportInProgress = false;
        console.log('blocks export data', exportData);
        exportToExcel(exportData, 'Blocks.xlsx');
      }, (error) => {
        this.isExportInProgress = false;
        console.log('Failed to export data.');
        this._snackBar.open('Export failed.', 'Dismiss', {
          duration: 4000,
        });
      });
  }

  disableEdit(data: any): boolean {
    return disableEdit(data?.block_name);
  }

}
