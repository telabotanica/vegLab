import { TestBed } from '@angular/core/testing';

import { WsPhytoService } from './ws-phyto.service';

describe('WsPhytoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WsPhytoService = TestBed.get(WsPhytoService);
    expect(service).toBeTruthy();
  });
});
