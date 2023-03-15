import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { Subscription } from 'rxjs';

import { Constants } from 'src/app/config/constants/constants';
import { User } from 'src/app/models/user';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuardService implements CanActivate {
    userSubscription: Subscription;
    user: User;

    /**
     * Constructor
     * @param { AuthService } _authService
     * @param { Router } _router
     */
    constructor(public _authService: AuthService, public _router: Router) {}

    canActivate(): boolean {
        console.log("In Auth Guard")
        this.userSubscription = this._authService.currentUser.subscribe(user => {
            this.user = user;
        }); 
        //console.log("User in Auth Guard", this.user)
        //&& this.user.phr_role.indexOf("admin")<0)
        if (!this.user) {
            this._router.navigateByUrl('/login');
            return false;
        } else if (this.user.phr_role.indexOf("ADMIN") < 0){
            this._authService.logout("INVALID_LOGIN");
            this._router.navigateByUrl('/error');
            return false;
        }

        return true;
    }
}

@Injectable()
export class AdminGuardService implements CanActivate {
    userSubscription: Subscription;
    user: User;

    constructor(public _authService: AuthService, public router: Router) {}

    canActivate(): boolean {
    
        this.userSubscription = this._authService.currentUser.subscribe(user => {
            this.user = user;
        }); 

        /*if (this.user && this.user.phr_role != Constants.ROLE_ADMIN) {
            this.router.navigateByUrl('/dashboard');
            return false;
        }*/

        return true;
    }
}