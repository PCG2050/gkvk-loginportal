import { TestBed } from '@angular/core/testing';

import { UnitHeadService } from './unit-head.service';

describe('UnitHeadService', () => {
  let service: UnitHeadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnitHeadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
