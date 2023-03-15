import { Component, EventEmitter, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TopbarComponent implements OnInit {
    @Output() sideBarToggle: EventEmitter<any> = new EventEmitter();
    user: User;
    userSubscription: Subscription;
    toggleButton: boolean = false;

    /**
     * Constructor
     *
     * @param {Router} _router
     * @param {UserService} _userService
     */
    constructor(
        private _router: Router,
        private _authService: AuthService,
    )
    {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {      
        this.userSubscription = this._authService.currentUser.subscribe(user => {
            this.user = user;
            this.toggleButton=(!this.user)?true:false;      
        }); 
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this.userSubscription.unsubscribe();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Navigate to Login Page
     */
    navigateToLogin(): void
    {
        this._router.navigateByUrl('/login');
    }

    toggleSidenav() {
        this.sideBarToggle.emit();
    }

    logout(): void
    {
        console.log('User being logged out');
        this._authService.logout();
        this._router.navigateByUrl('/login');
    }

}
