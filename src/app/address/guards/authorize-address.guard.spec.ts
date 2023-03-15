import { TestBed } from '@angular/core/testing';

import { AuthorizeAddressGuard } from './authorize-address.guard';

describe('AuthorizeAddressGuard', () => {
  let guard: AuthorizeAddressGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(AuthorizeAddressGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
