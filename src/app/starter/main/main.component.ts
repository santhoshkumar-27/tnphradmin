import { AfterViewInit, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Constants } from 'src/app/config/constants/constants';
import { User } from 'src/app/models/user';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DistrictMaster } from 'src/app/models/master_district';
import { BlockMaster } from 'src/app/models/master_block';
import { MasterDataService } from '../services/master-data.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';

@Component({
    selector   : 'app-main',
    templateUrl: './main.component.html',
    styleUrls  : ['./main.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MainComponent implements AfterViewInit 
{
    currentUser: User;
    userSubscription: Subscription;
    displayRole: string;

    @ViewChild('facilityPaginator', {static: false}) set facilityPaginator(facilityPaginator: MatPaginator) {
        this.facilityData.paginator = facilityPaginator;
    };

    @ViewChild('blockPaginator') set blockPaginator(blockPaginator: MatPaginator){
        this.blockPopData.paginator = blockPaginator;
    };

    @ViewChild('phcPaginator', {static: false}) set phcPaginator(phcPaginator: MatPaginator) {
        this.phcPopData.paginator = phcPaginator;
    };

    @ViewChild('hscPaginator', {static: false}) set hscPaginator(hscPaginator: MatPaginator) {
        this.hscPopData.paginator = hscPaginator;
    };

    @ViewChild('rolePaginator', {static: false}) set rolePaginator(rolePaginator: MatPaginator) {
        this.roleWise.paginator = rolePaginator;
    };

    @ViewChild('phrRolePaginator', {static: false}) set phrRolePaginator(phrRolePaginator: MatPaginator) {
        this.phrRoleWise.paginator = phrRolePaginator;
    };

    roleColumns: string[] = ['role_name', 'count'];
    roleWise = new MatTableDataSource();

    phrRoleColumns: string[] = ['phr_role', 'count'];
    phrRoleWise = new MatTableDataSource();

    facilityColumns: string[] = ['facility_type_name', 'count'];
    facilityData = new MatTableDataSource();

    villageColumns: string[] = ['village_type', 'count'];
    villageData = new MatTableDataSource();

    villageStrtColumns: string[] = ['village_type', 'count'];
    villageStrtData = new MatTableDataSource();

    blockPopColumns: string[] = ['block_name', 'resident_status', 'count'];
    blockPopData = new MatTableDataSource();

    phcPopColumns: string[] = ['phc_name', 'resident_status',  'count'];
    phcPopData = new MatTableDataSource();

    hscPopColumns: string[] = ['hsc_name', 'resident_status', 'count'];
    hscPopData = new MatTableDataSource();

    HSCMappedCount=0;
    HSCUnMappedCount=0;

    StreetsMappedToHSC=0;
    StreetsUnMappedToHSC=0;
    StreetMappedToReV=0;
    StreetUnMappedToReV=0;

    MappedShopsCount=0;
    UnMappedShopsCount=0;

    TotalPopulation=0;
    AllocatedPopulation=0;
    UnAllocatedPopulation=0;
    PopulationMappedToStreet=0;
    PopulationUnMappedToStreet=0;

    disablePopulation: boolean = false;
    isSearchOpen: boolean = true;
    isVillageCountPanelOpen: boolean = true;
    isVillageStreetPanelOpen: boolean = true;
    isCallInProgress = false;

    searchPanel: FormGroup;

    districtList: DistrictMaster[] = [];
    filteredDistricts: Subject<DistrictMaster[]> = new Subject();

    blockList: BlockMaster[];
    filteredBlocks: Subject<BlockMaster[]> = new Subject();

    private _unsubscribeAll: Subject<any>;

    show_md_progress: boolean = false;

    /**
     * Constructor
     *
     * @param {Router} _router
     * @param {AuthService} _authService
     * @param {DashboardService} _dashService
     */
    constructor(
        private _router: Router,
        private _authService: AuthService,
        private _dashService: DashboardService,
        private _formBuilder: FormBuilder,
        private _masterDataService: MasterDataService,
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this._authService.md_progress_event.subscribe((progress: boolean) => {
            this.show_md_progress = progress;
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {    let phr1 ="WEB_STATE_ADMIN";  
        this.userSubscription = this._authService.currentUser.subscribe(user => {
            this.currentUser = user;
            console.log("User: " + JSON.stringify(this.currentUser));   
            if( this.currentUser.phr_role=== Constants.ROLE_BLOCK_ADMIN || 
                this.currentUser.phr_role === Constants.WEB_BLOCK_ADMIN ||
                this.currentUser.phr_role === Constants.BLOCK_ADMIN){
                this.displayRole = "Block Admin";
            }else if( phr1=== Constants.ROLE_DISTRICT_ADMIN || 
                this.currentUser.phr_role===Constants.WEB_DISTRICT_ADMIN || 
                this.currentUser.phr_role===Constants.DISTRICT_ADMIN){
                this.displayRole = "District Admin";
            }else{
                this.displayRole = "State Admin";
            }
        }); 

        this.searchPanel = this._formBuilder.group({
            district: [{value: '', disabled: this.isDistrictDisabled(this.currentUser)}],
            block: [{value: '', disabled: this.isBlockDisabled(this.currentUser)}],
          });

        this.invokeAggragateApis();

        this._masterDataService
          .getDistrictsList()
          .subscribe((values: Array<any>) => {
               console.log('Dashboard | districts:', values);
              if(this.currentUser && 
                 (this.currentUser.phr_role === Constants.WEB_DISTRICT_ADMIN || 
                 this.currentUser.phr_role === Constants.DISTRICT_ADMIN ||
                 this.currentUser.phr_role === Constants.WEB_BLOCK_ADMIN ||
                 this.currentUser.phr_role === Constants.BLOCK_ADMIN
                 )) {
                   let operatorDistrict = this.currentUser.district_id;
                   console.log('Operator district id:', operatorDistrict);
                   if(operatorDistrict) {
                      let filteredList = values.filter((district) => {
                        return district.district_id === operatorDistrict
                      });
                      this.districtList = filteredList;
                      //this.searchPanel.get('district')?.setValidators([optionObjectObjectValidator(this.districtList, 'district_name')]);
                      this.searchPanel.get('district')?.setValue(this.getDistrictObjectForOperator(operatorDistrict, filteredList));
                    }
                }
                else {
                  this.districtList = values;
                  this.searchPanel.get('district')?.setValidators([optionObjectObjectValidator(this.districtList, 'district_name')]);
                  this.searchPanel.get('district')?.setValue('')
                }
            });

        this._masterDataService.getBlocksList().subscribe((values: Array<BlockMaster>) => {
                console.log('Dashboard | blocks:', values);
                // If he is a block admin; just set his block (and field is disabled)
                if(this.currentUser && (
                    this.currentUser.phr_role === Constants.WEB_BLOCK_ADMIN ||
                    this.currentUser.phr_role === Constants.BLOCK_ADMIN)) {
                        let operatorBlock = this.currentUser.block_id;
                        if(operatorBlock) {
                            this.blockList = [];
                            let block  = values.find((blockItem) => blockItem.block_id === operatorBlock);
                            if(block){
                                this.blockList.push(block);
                                // set the value, and keep the field disabled.
                                this.searchPanel.get('block')?.setValue(block);
                            } else {
                                console.log('Dashboard | block object not foud.');
                            }                            
                        } else {
                            console.log('Dashboard | blockId id empty.');
                        }
                } else if (this.currentUser && (
                    this.currentUser.phr_role === Constants.WEB_DISTRICT_ADMIN || 
                    this.currentUser.phr_role === Constants.DISTRICT_ADMIN)) {
                        // If he is district adming select blocks for his district
                        // And field should be enabled to select required block from the list.
                        let operatorDistrict = this.currentUser.district_id;
                        if(operatorDistrict) {
                            const filteredBlocks = values.filter((block) => block.district_id == operatorDistrict);
                            this.blockList = filteredBlocks;
                            this.searchPanel.get('block')?.setValidators([optionObjectObjectValidator(this.blockList, 'block_name')]);
                            this.searchPanel.get('block')?.setValue('');
                            this.searchPanel.get('block')?.enable();
                        } else {
                            console.log('Dashboard | blockId id empty.');
                        }
                } else {
                    this.blockList = values;
                    this.searchPanel.get('block')?.setValidators([optionObjectObjectValidator(this.blockList, 'block_name')]);
                    
                }     
            });
        
        this.onChanges();
    }

    ngAfterViewInit() {}

    onChanges(): void {
        console.log('Dashboard | onChange()');
        
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
      }

    clearSearchFields() {
        if(!this.searchPanel.get('district')?.disabled){
            this.searchPanel.patchValue({district: ''});
        }

        if(!this.searchPanel.get('block')?.disabled){
            this.searchPanel.patchValue({block: ''});
        }

        //let filter = {DISTRICT_ID: null, BLOCK_ID: null};

        //console.log('Dashboard | Aggregate filter for clear:', filter);
        this.getFilteredData();
    }

    getNonEmptyValue(value : any) {
      return value && value != ''? value: null;
    }

    getFilteredData() {
        let filter = {DISTRICT_ID: null, BLOCK_ID: null};

        if(this.searchPanel.get('district')?.disabled) {
            filter.DISTRICT_ID = this.getNonEmptyValue(this.searchPanel.getRawValue().district.district_id);
        } else {
            filter.DISTRICT_ID = this.getNonEmptyValue(this.searchPanel.get('district')?.value.district_id);
        }

        if(this.searchPanel.get('block')?.disabled) {
            filter.BLOCK_ID = this.getNonEmptyValue(this.searchPanel.getRawValue().block.block_id);
        } else {
            filter.BLOCK_ID = this.getNonEmptyValue(this.searchPanel.get('block')?.value.block_id);
        }

        console.log('Dashboard | Aggregate filter:', filter);
        this.invokeAggragateApis(filter);

    }

    onDistrictBlur(){
        if(this.searchPanel.get('district')?.value && this.searchPanel.get('district')?.valid) {
          let selectedDistrict = this.searchPanel.get('district')?.value;
          this._masterDataService.getBlocksList().subscribe((blocks: Array<BlockMaster>) => {
              const filteredBlocks = blocks.filter((block) => block.district_id === selectedDistrict.district_id);
              console.log('Dashboard | filtered block list:', filteredBlocks);
              this.blockList = filteredBlocks;
              this.searchPanel.get('block')?.clearValidators();
              this.searchPanel.get('block')?.addValidators([ optionObjectObjectValidator(this.blockList, 'block_name')]);
              this.searchPanel.get('block')?.updateValueAndValidity();
      
              // TODO
              this.searchPanel.get('block')?.setValue('');
          });
        }
      }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this.userSubscription.unsubscribe();
        //this._authService.md_progress_event.unsubscribe();
    }

    displayDistrictFn(district?: any): string {
      return district ? district.district_name : '';
    }
    
    displayBlockFn(block?: any): string {
      return block ? block.block_name : '';
    }

    isDistrictDisabled(currentUser: User) {
        return currentUser.phr_role != 'WEB_STATE_ADMIN' && currentUser.phr_role != 'STATE_ADMIN';
    }
      
    isBlockDisabled(currentUser: User) {
        return currentUser.phr_role != 'WEB_STATE_ADMIN' && currentUser.phr_role != 'STATE_ADMIN' && currentUser.phr_role != 'WEB_DISTRICT_ADMIN' && currentUser.phr_role != 'DISTRICT_ADMIN';
    }

    getDistrictObjectForOperator( districtId: string, districtList : Array<DistrictMaster>) {
        if(districtId) {
            const selectedDistrict = districtList.find((district) => district.district_id === districtId);
            return {district_id: selectedDistrict?.district_id, district_name: selectedDistrict?.district_name};
        } else {
            console.log('Dashboard | district id empty.');
            return '';
        }
        
    }

    getBlockObjectForOperator( blockId: string, blockList : Array<BlockMaster>) {
        if(blockId) {
            const selectedBlock = blockList.find((block) => block.block_id === blockId);
            return {block_id: selectedBlock?.block_id, block_name: selectedBlock?.block_name};
        } else {
            console.log('Dashboard | blockId id empty.');
            return '';
        }
        
    }

    invokeAggragateApis(filter: any = null) {
        this.isCallInProgress = true;
        
        this._dashService.getUserAggregate(this.currentUser, filter)
        .pipe(
            takeUntil(this._unsubscribeAll),
        )
        .subscribe((value: any)=>{
            console.log("User Value from Service: " + value['CountByRole']);
            if(value){
                this.roleWise.data = JSON.parse(JSON.stringify(value['CountByRole']));
                this.phrRoleWise.data = JSON.parse(JSON.stringify(value['CountByPHRRole']));
            }
        });        

        this._dashService.getFacilityAggregate(this.currentUser, filter)
        .pipe(
            takeUntil(this._unsubscribeAll),
        )
        .subscribe((value: any)=>{
            console.log("Facility Value from Service: " + JSON.stringify(value));
            if(value){
                this.facilityData.data = value['CountByType'];
                this.HSCMappedCount = value["CountOfMappedHSC"][0]['count']
                this.HSCUnMappedCount = value["CountOfUnMappedHSC"][0]['count']
            }
        });        


        this._dashService.getStreetAggregate(this.currentUser, filter)
        .pipe(
            takeUntil(this._unsubscribeAll),
        )
        .subscribe((value: any)=>{
            console.log("Street Value from Service: " + JSON.stringify(value));
            if(value){
                this.villageData.data = value["CountOfVillageType"];
                this.villageStrtData.data = value["CountByVillageType"]
                this.StreetsMappedToHSC = value["CountMappedToHSC"]
                this.StreetsUnMappedToHSC = value["CountUnMappedToHSC"]
                this.StreetMappedToReV = value["CountMappedToReV"]
                this.StreetUnMappedToReV = value["CountUnMappedToReV"]
               this.isCallInProgress = false;
            }
        });        


        this._dashService.getShopAggregate(this.currentUser, filter)
        .pipe(
            takeUntil(this._unsubscribeAll),
        )
        .subscribe((value: any)=>{
            console.log("Shop Value from Service: " + JSON.stringify(value));
            if(value){
                this.MappedShopsCount = value["CountOfShopMapped"];
                this.UnMappedShopsCount = value["CountOfShopUnMapped"];
            }
        });        
    
        console.log("=================",this.currentUser && ( this.currentUser.phr_role != Constants.STATE_ADMIN && 
            this.currentUser.phr_role != Constants.WEB_STATE_ADMIN ))

        // Disable population aggregate for all, because of spanner performance issue
        this.disablePopulation = false;
       
    //     if(this.currentUser && ( this.currentUser.phr_role != Constants.STATE_ADMIN && 
    //         this.currentUser.phr_role != Constants.WEB_STATE_ADMIN )){
    //     this._dashService.getPopulationAggregate(this.currentUser, filter)
    //     .pipe(
    //         takeUntil(this._unsubscribeAll),
    //     )
    //     .subscribe((value: any)=>{
    //         console.log("Population Value from Service: " + JSON.stringify(value));
    //         this.disablePopulation = true;
    //         // this aggregate function is taking long time, disable the flag after
    //         //  getting this response.
    //         if(value){
    //             this.TotalPopulation = value['TotalPopulation'];
    //             this.UnAllocatedPopulation = value['UnAllocatedPopulation'];
    //             this.AllocatedPopulation = value['AllocatedPopulation'];
    //             this.PopulationMappedToStreet = value['PopulationMappedToStreet'];
    //             this.PopulationUnMappedToStreet = value['TotalPopulation'] - value['PopulationMappedToStreet'];
    //             this.blockPopData.data = value['BlockPopulation'];
    //             this.phcPopData.data = value['PHCPopulation'];
    //             this.hscPopData.data = value['HSCPopulation'];
    //         }
    //     });
    //   }else{
    //        this.disablePopulation = false;
    //   }
    }

    hideProgressBar() {
        this.show_md_progress = false;
    }
    
    
}
