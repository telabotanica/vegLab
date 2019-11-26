import { TestBed } from '@angular/core/testing';

import { EcologicalTraitsService } from './ecological-traits.service';

describe('EcologicalTraitsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EcologicalTraitsService = TestBed.get(EcologicalTraitsService);
    expect(service).toBeTruthy();
  });
});
