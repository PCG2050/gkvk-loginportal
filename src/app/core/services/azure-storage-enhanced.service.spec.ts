import { TestBed } from '@angular/core/testing';

import { AzureStorageEnhancedService } from './azure-storage-enhanced.service';

describe('AzureStorageEnhancedService', () => {
  let service: AzureStorageEnhancedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AzureStorageEnhancedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
