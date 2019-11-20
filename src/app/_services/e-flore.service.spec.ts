import { TestBed } from '@angular/core/testing';

import { EFloreService } from './e-flore.service';

describe('EFloreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EFloreService = TestBed.get(EFloreService);
    expect(service).toBeTruthy();
  });
});
