import { TestBed } from '@angular/core/testing';

import { HabitationService } from './habitation.service';

describe('HabitationService', () => {
  let service: HabitationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HabitationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
