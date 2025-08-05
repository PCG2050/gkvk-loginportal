import { TestBed } from '@angular/core/testing';

import { InstituteThemeService } from './institute-theme.service';

describe('InstituteThemeService', () => {
  let service: InstituteThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstituteThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
