import { Component, OnDestroy, OnInit, Output, ViewEncapsulation, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';


import { Constants } from 'src/app/config/constants/constants';
import { adminMenu, stateAdminMenu } from 'src/app/config/navigation';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MenuItem } from 'src/app/models/menu_item';
import buildInfo from '../../../build';
import { UtilService } from 'src/app/services/util.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidenavComponent implements OnInit {

    private _unsubscribeAll: Subject<any>;
    userSubscription: Subscription;
    user: User;
    showAddress: boolean = true;
    isNhmAdmin: Promise<boolean>;
    appVersion: any = buildInfo.version;
    panelOpenState: boolean;

    @Output() closeSideNav: EventEmitter<any> = new EventEmitter();
    facilitySubsciption: Subscription;

    /**
     * Constructor
     * @param {AuthService} _authService
     * @param {Router} _route
     */
    constructor(
        private _authService: AuthService,
        private _masterDataService: MasterDataService,
        private _utilService: UtilService,
        private _route: Router  
    )
    {
        this._unsubscribeAll = new Subject();
        this.facilitySubsciption  = this._masterDataService.isFacilityData.subscribe((facilityData: any) => {
            if (facilityData !== null) {
                console.log('the data is triggrd');
                this.isNhmAdmin = this._utilService.isNhmAdmin(this.user);
            }
        })
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        //this.setMenu()
        this.panelOpenState = false;
        this.userSubscription = this._authService.currentUser.subscribe(user => {
            //console.log("Got User in layout " + user);
            this.user = user;
            if (this.user) {
                //this.setMenu();
                this.user.directorate_name == 'DPH' || this.user.directorate_name == 'NHM' 
                    ? this.showAddress = true 
                    : this.showAddress = false;
                
                this.isNhmAdmin = this._utilService.isNhmAdmin(this.user);
                this._route.navigateByUrl('/dashboard');
            }
  
        });
  
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this.userSubscription.unsubscribe();
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.facilitySubsciption.unsubscribe();
    }

    close() {
        this.closeSideNav.emit();
    }

}
