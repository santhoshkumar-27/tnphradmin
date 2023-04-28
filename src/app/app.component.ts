import { Component, ElementRef, HostListener, Inject, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';
import { adminMenu } from './config/navigation';
import { MenuItem } from './models/menu_item';
import { User } from './models/user';
import { AuthService } from './starter/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  userSubscription: Subscription;
  user: User;
  title = 'TNPHR WEB ADMIN';

  @ViewChild('sidenav', { static: true }) sidenav: MatSidenav;
  sideBarOpen: boolean = false;
  /**
   * Constructor
   *
   * @param {AuthService} _authService
   */
  constructor(private _authService: AuthService, private _elementRef: ElementRef) {
    this._elementRef.nativeElement.removeAttribute("ng-version");
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    if (window.innerWidth < 768) {
      this.sideBarOpen = false;
    } else if (this.user) {
      this.sideBarOpen = true;
    }
    //this.setMenu();
    this.userSubscription = this._authService.currentUser.subscribe((user) => {
      this.user = user;
      this.sideBarOpen = !this.user ? false : true;
      if (this.user) {
        this.sideBarOpen = window.innerWidth < 599 ? false : true;
      } else {
        this.sideBarOpen = false;
      }
    });

    console.log('User in app ' + this.user);
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private Methods
  // -----------------------------------------------------------------------------------------------------
  /**
   * Set MenuItems based on the User Role
   *
   * @private
   */
  setMenu(): void {
    //this.menuData = adminMenu;
    /*switch (this.user.phr_role) {
          case Constants.ROLE_ADMIN:
              this.nestedDataSource.data = adminMenu;
              break;
          case Constants.ROLE_STATE_ADMIN:
              this.nestedDataSource.data = stateAdminMenu;;
              break;
          default:
              this.nestedDataSource.data = adminMenu;
              break;
      }*/
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth < 768) {
      this.sideBarOpen = false;
    } else if (this.user) {
      this.sideBarOpen = true;
    }
  }

  isBiggerScreen() {
    const width =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;
    if (width < 768) {
      return false;
    } else {
      return true;
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public Methods
  // -----------------------------------------------------------------------------------------------------

  sideBarToggler() {
    this.sideBarOpen = !this.sideBarOpen;
  }

  closeSideNav() {
    if (!this.isBiggerScreen()) this.sideBarOpen = false;
  }
}
