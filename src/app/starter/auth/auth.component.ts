import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  validateOTPForm: FormGroup;
  error: string;
  OTPForm: boolean = false;
  mobileNumber: number;
  isCallInProgress: boolean = false;

  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   * @param {AuthService} _authService
   * @param {Router} _router
   */
  constructor(
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private _router: Router,
    private recaptchaV3Service: ReCaptchaV3Service
  ) {
    this.error = '';
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this.loginForm = this._formBuilder.group({
      mobile: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern('[0-9]*'),
        ],
      ],
    });

    this.validateOTPForm = this._formBuilder.group({
      mobile_otp: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern('[0-9]*'),
        ],
      ],
    });
  }

  /**
   * Login User
   */
  loginUser(): void {
    this.error = '';
    this.isCallInProgress = true;
    // this.recaptchaV3Service.execute('LOGIN').subscribe((token) => {
      // console.log('token', token);
      let success = this._authService.loginWithMobile(
        this.loginForm.value['mobile'],
        // token
      );
      success.subscribe((value) => {
        console.log('Value from login: ' + value);
        this.isCallInProgress = false;
        if (value && value.status === 'SUCCESS') {
          this.OTPForm = true;
          this.mobileNumber = this.loginForm.value['mobile'];
        } else {
          //this.error = "Error while logging in. Please contact your system administrator."
          this.error = value && value.message;
        }
      });
    // });
  }

  /**
   * Validate OTP
   */
  validateOTP(): void {
    this.error = '';
    this.isCallInProgress = true;
    let success = this._authService.ValidateOTP(
      this.mobileNumber,
      this.validateOTPForm.value['mobile_otp']
    );
    success.subscribe((value) => {
      this.isCallInProgress = false;
      if (value && value.status === 'SUCCESS') {
        this._router.navigateByUrl('/');
      } else {
        //this.error = "Error while logging in. Please contact your system administrator."
        this.error = value && value.message;
      }
    });
  }

  ngAfterViewInit() {
    document.getElementsByTagName('body')[0].classList.add('captcha-show');
  }

  ngOnDestroy() {
    document.getElementsByTagName('body')[0].classList.remove('captcha-show');
  }
}
