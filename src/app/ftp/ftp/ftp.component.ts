import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DistrictMaster } from 'src/app/models/master_district';
import { BlockMaster } from 'src/app/models/master_block';
import { FacilityMaster } from 'src/app/models/master_facility';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { Subject } from 'rxjs';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { FtpService } from '../ftp.service';
import { AuthService } from 'src/app/starter/services/auth.service';
import { User } from 'src/app/models/user';
import {
  isBlockAdmin,
  isDistrictAdmin,
  isStateAdmin,
} from 'src/app/utils/session.util';
import { FTP_MAPPING } from 'src/app/models/ftp-mapping';

@Component({
  selector: 'app-ftp',
  templateUrl: './ftp.component.html',
  styleUrls: ['./ftp.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FtpComponent implements OnInit {
  searchPanel: FormGroup;
  panelOpenState: boolean = true;

  districtsList: DistrictMaster[] = [];
  filteredDistricts: Subject<DistrictMaster[]> = new Subject();

  blocksList: BlockMaster[] = [];
  filteredBlocks: Subject<BlockMaster[]> = new Subject();

  phcList: FacilityMaster[] = [];
  filteredPhcs: Subject<FacilityMaster[]> = new Subject();

  hscList: FacilityMaster[] = [];
  filteredHscs: Subject<FacilityMaster[]> = new Subject();

  isCallInProgress: boolean = false;

  ftpData: any;

  currentUser: User;

  ftp_filters: any;

  initialValues: any = {
    disList: [],
    blList: [],
    phcList: [],
    hscList: [],
  };

  constructor(
    private formBuilder: FormBuilder,
    private masterService: MasterDataService,
    private ftpService: FtpService,
    private _authService: AuthService
  ) {}

  ngOnInit(): void {
    this.searchPanel = this.formBuilder.group({
      district: ['', Validators.pattern('[0-9A-z .()@-]*')],
      block: ['', Validators.pattern('[0-9A-z .()@-]*')],
      phc: ['', Validators.pattern('[0-9A-z .()@-]*')],
      hsc: ['', [Validators.required, Validators.pattern('[0-9A-z .()@-]*')]],
    });

    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    if (sessionStorage.getItem('ftp_filters'))
      this.ftp_filters = JSON.parse(sessionStorage.getItem('ftp_filters')!);

    this.searchPanel.get('district')?.valueChanges.subscribe((val) => {
      const filterValue =
        typeof val === 'object'
          ? val.district_name.toLowerCase()
          : val.toLowerCase();
      if (this.searchPanel.get('district')?.dirty && filterValue == '')
        this.resetBlock();
      let _filteredDistricts = this.districtsList.filter((district: any) =>
        district.district_name.toLowerCase().includes(filterValue)
      );
      this.filteredDistricts.next(_filteredDistricts);
    });

    this.searchPanel.get('block')?.valueChanges.subscribe((val) => {
      const filterValue =
        typeof val === 'object'
          ? val.block_name.toLowerCase()
          : val.toLowerCase();
      if (this.searchPanel.get('block')?.dirty && filterValue == '')
        this.resetFacilities();
      let _filteredBlocks = this.blocksList.filter((block: any) =>
        block.block_name.toLowerCase().includes(filterValue)
      );
      this.filteredBlocks.next(_filteredBlocks);
    });

    this.searchPanel.get('phc')?.valueChanges.subscribe((val) => {
      const filterValue =
        typeof val === 'object'
          ? val.facility_name.toLowerCase()
          : val.toLowerCase();
      if (this.searchPanel.get('phc')?.dirty && filterValue == '')
        this.resetHsc();
      let _filteredPhcs = this.phcList.filter((phc: any) =>
        phc.facility_name.toLowerCase().includes(filterValue)
      );
      this.filteredPhcs.next(_filteredPhcs);
    });

    this.searchPanel.get('hsc')?.valueChanges.subscribe((val) => {
      const filterValue =
        typeof val === 'object'
          ? val.facility_name.toLowerCase()
          : val.toLowerCase();
      let _filteredHscs = this.hscList.filter((hsc: any) =>
        hsc.facility_name.toLowerCase().includes(filterValue)
      );
      this.filteredHscs.next(_filteredHscs);
    });

    this.getDistricts();
    this.getBlocks();
    if (isDistrictAdmin(this.currentUser) || isBlockAdmin(this.currentUser))
      this.getFacilities();
    else {
      if (this.ftp_filters?.block) {
        this.ftpService
          .getFacilitiesForStateAdmin(
            this.currentUser,
            this.ftp_filters?.block.block_id
          )
          .subscribe((facilities: any) => {
            if (facilities?.data) {
              const { data } = facilities;
              this.phcList = this.ftpService.getPhcList(data);
              this.setFormField(
                'phc',
                this.phcList,
                'facility_name',
                this.ftp_filters?.phc ? this.ftp_filters.phc : ''
              );
              this.hscList = this.ftp_filters?.phc
                ? data.filter(
                    (el: any) =>
                      el.parent_facility == this.ftp_filters.phc.facility_id &&
                      el.facility_level == 'HSC'
                  )
                : this.ftpService.getHscList(data);
              this.setFormField(
                'hsc',
                this.hscList,
                'facility_name',
                this.ftp_filters?.hsc ? this.ftp_filters.hsc : '',
                true
              );
              this.initialValues.hscList = this.ftpService.getHscList(data);
            }
          });
      }
    }
  }

  setFormField(
    field: string,
    list: any,
    key: string,
    value: any,
    isRequired?: boolean
  ) {
    this.searchPanel.get(field)?.clearValidators();
    isRequired
      ? this.searchPanel
          .get(field)
          ?.addValidators([
            optionObjectObjectValidator(list, key),
            Validators.required,
          ])
      : this.searchPanel
          .get(field)
          ?.addValidators([optionObjectObjectValidator(list, key)]);
    this.searchPanel.get(field)?.setValue(value);
  }

  ngAfterContentInit() {
    if (this.ftp_filters?.hsc) {
      let hscFacilityId = this.ftp_filters.hsc.facility_id;
      this.isCallInProgress = true;
      this.ftpService
        .getFtpMappings(this.currentUser, hscFacilityId)
        .subscribe((response: FTP_MAPPING) => {
          this.isCallInProgress = false;
          this.ftpData = response;
        });
    }
  }

  resetFacilities() {
    this.phcList = this.initialValues.phcList;
    this.setFormField('phc', this.phcList, 'facility_name', '');
    this.hscList = this.phcList.length == 0 ? [] : this.initialValues.hscList;
    this.setFormField('hsc', this.hscList, 'facility_name', '', true);
  }

  resetBlock() {
    this.blocksList = this.initialValues.blList;
    this.setFormField('block', this.blocksList, 'block_name', '');
  }

  resetHsc() {
    this.hscList = this.initialValues.hscList;
    this.setFormField('hsc', this.hscList, 'facility_name', '', true);
  }

  getDistricts() {
    this.masterService
      .getDistrictsList()
      .subscribe((districts: DistrictMaster[]) => {
        this.initialValues.disList = districts;
        if (
          isDistrictAdmin(this.currentUser) ||
          isBlockAdmin(this.currentUser)
        ) {
          let operatorDistrict = this.currentUser.district_id;
          console.log('Operator district id:', operatorDistrict);
          if (operatorDistrict) {
            let operDistrictObj: any = districts.find(
              (district) => district.district_id === operatorDistrict
            );
            this.searchPanel.get('district')?.setValue(operDistrictObj);
            this.searchPanel.get('district')?.disable();
            this.districtsList = [];
          }
        } else {
          this.districtsList = districts;
          this.setFormField(
            'district',
            this.districtsList,
            'district_name',
            this.ftp_filters?.district ? this.ftp_filters.district : ''
          );
        }
      });
  }

  getBlocks() {
    this.masterService.getBlocksList().subscribe((blocks: BlockMaster[]) => {
      if (this.currentUser && isDistrictAdmin(this.currentUser)) {
        let operatorDistrictId = this.currentUser.district_id;
        console.log('Operator District for block id:', operatorDistrictId);
        if (operatorDistrictId) {
          let filteredList = blocks.filter((block) => {
            return block.district_id === operatorDistrictId;
          });
          this.blocksList = filteredList;
          this.initialValues.blList = filteredList;
          this.setFormField(
            'block',
            this.blocksList,
            'block_name',
            this.ftp_filters?.block ? this.ftp_filters.block : ''
          );
        }
      } else if (this.currentUser && isBlockAdmin(this.currentUser)) {
        let operatorBlockId = this.currentUser.block_id;
        console.log('Operator block id:', operatorBlockId);
        if (operatorBlockId) {
          let operBlockObj: any = blocks.find(
            (block) => block.block_id === operatorBlockId
          );
          this.searchPanel.get('block')?.setValue(operBlockObj);
          this.searchPanel.get('block')?.disable();
          this.blocksList = [];
          this.initialValues.blList = [];
        }
      } else {
        this.initialValues.blList = blocks;
        this.blocksList = blocks;
        if (this.ftp_filters?.district) {
          this.blocksList = blocks.filter(
            (block) =>
              block.district_id == this.ftp_filters.district.district_id
          );
        }
        this.setFormField(
          'block',
          this.blocksList,
          'block_name',
          this.ftp_filters?.block ? this.ftp_filters.block : ''
        );
      }
    });
  }

  getFacilities() {
    this.masterService
      .getFacilityList()
      .subscribe((facilities: FacilityMaster[]) => {
        let pList = [...facilities];
        let hList = [...facilities];

        this.initialValues.phcList = this.ftpService.getPhcList(facilities);
        this.initialValues.hscList = this.ftpService.getHscList(facilities);

        // if block is present in fiilters in sessionStorage
        if (this.ftp_filters?.block && this.ftp_filters?.phc) {
          pList = facilities.filter(
            (el: any) => el.block_id == this.ftp_filters.block.block_id
          );
          hList = pList.filter(
            (el2: any) =>
              el2.parent_facility == this.ftp_filters.phc.facility_id
          );
        } else if (this.ftp_filters?.block) {
          let temp = facilities.filter(
            (el: any) => el.block_id == this.ftp_filters.block.block_id
          );
          pList = temp;
          hList = temp;
        } else if (this.ftp_filters?.phc) {
          hList = facilities.filter(
            (el3: any) =>
              el3.parent_facility == this.ftp_filters.phc.facility_id
          );
        }

        this.phcList = this.ftpService.getPhcList(pList);
        this.setFormField(
          'phc',
          this.phcList,
          'facility_name',
          this.ftp_filters?.phc ? this.ftp_filters.phc : ''
        );

        this.hscList = this.ftpService.getHscList(hList);
        this.setFormField(
          'hsc',
          this.hscList,
          'facility_name',
          this.ftp_filters?.hsc ? this.ftp_filters.hsc : '',
          true
        );
      });
  }

  onDistrictBlur() {
    if (
      this.searchPanel.get('district')?.value &&
      this.searchPanel.get('district')?.valid
    ) {
      let selectedDistrict = this.searchPanel.get('district')?.value;
      this.ftpService
        .getBlocksListForDistrict(selectedDistrict.district_id)
        .then((blocks: BlockMaster[]) => {
          this.blocksList = blocks;
          this.setFormField('block', this.blocksList, 'block_name', '');
        });
    }
  }

  onBlockBlur() {
    if (
      this.searchPanel.get('block')?.value &&
      this.searchPanel.get('block')?.valid
    ) {
      let selectedBlock = this.searchPanel.get('block')?.value;
      if (this.currentUser && isStateAdmin(this.currentUser)) {
        this.ftpService
          .getFacilitiesForStateAdmin(this.currentUser, selectedBlock?.block_id)
          .subscribe((facilities: any) => {
            if (facilities?.data) {
              const { data } = facilities;
              this.phcList = this.ftpService.getPhcList(data);
              this.setFormField('phc', this.phcList, 'facility_name', '');
              this.hscList = this.ftpService.getHscList(data);
              this.setFormField('hsc', this.hscList, 'facility_name', '', true);
              this.initialValues.hscList = [...this.hscList];
            }
          });
      } else {
        this.ftpService
          .getPhcsForBlock(selectedBlock.block_id)
          .then((pFacilities: FacilityMaster[]) => {
            this.phcList = pFacilities;
            this.setFormField('phc', this.phcList, 'facility_name', '');
          });
        this.ftpService
          .getHscsForBlock(selectedBlock.block_id)
          .then((hFacilities: FacilityMaster[]) => {
            this.hscList = hFacilities;
            this.setFormField('hsc', this.hscList, 'facility_name', '', true);
          });
      }
    }
  }

  async onPHCBlur() {
    if (
      this.searchPanel.get('phc')?.value &&
      this.searchPanel.get('phc')?.valid
    ) {
      let selectedPhc = this.searchPanel.get('phc')?.value;
      if (this.currentUser && isStateAdmin(this.currentUser)) {
        this.hscList = this.initialValues.hscList.filter(
          (el: any) => el.parent_facility == selectedPhc.facility_id
        );
      } else {
        this.hscList = await this.ftpService.getHscsForPhc(
          selectedPhc.facility_id
        );
      }
      this.setFormField('hsc', this.hscList, 'facility_name', '', true);
    }
  }

  getFtpData() {
    if (this.searchPanel.invalid) return;
    let hscFacilityId = this.searchPanel.get('hsc')?.value.facility_id;
    console.log(this.searchPanel.get('hsc')?.value);
    this.isCallInProgress = true;
    this.ftpService
      .getFtpMappings(this.currentUser, hscFacilityId)
      .subscribe((response: FTP_MAPPING) => {
        this.isCallInProgress = false;
        this.ftpData = response;
        console.log('ftp data', this.ftpData);
        let obj = {
          district: this.searchPanel.get('district')?.value,
          block: this.searchPanel.get('block')?.value,
          phc: this.searchPanel.get('phc')?.value,
          hsc: this.searchPanel.get('hsc')?.value,
        };
        sessionStorage.setItem('ftp_filters', JSON.stringify(obj));
      });
  }

  displayDistrictFn(district?: any): string {
    return district ? district.district_name : '';
  }

  displayBlockFn(block?: any): string {
    return block ? block.block_name : '';
  }

  displayPHCFn(facility?: any): string {
    return facility ? facility.facility_name?.trim() : '';
  }

  displayHSCFn(facility?: any): string {
    return facility ? facility.facility_name?.trim() : '';
  }

  clearSearchFields() {
    sessionStorage.removeItem('ftp_filters');
    this.ftp_filters = null;

    this.getDistricts();
    this.getBlocks();
    this.searchPanel.get('hsc')?.markAsUntouched();
    this.searchPanel.patchValue({
      district: '',
      block: '',
      phc: '',
      hsc: '',
    });

    this.ftpData = null;
  }
}
