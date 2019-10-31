import { TestBed } from '@angular/core/testing';

import { ObserverService } from './observer.service';

describe('ObserverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ObserverService = TestBed.get(ObserverService);
    expect(service).toBeTruthy();
  });
});
