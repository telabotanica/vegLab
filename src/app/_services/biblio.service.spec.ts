import { TestBed } from '@angular/core/testing';

import { BiblioService } from './biblio.service';

describe('BiblioService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BiblioService = TestBed.get(BiblioService);
    expect(service).toBeTruthy();
  });
});
