import { Injectable } from '@angular/core';

import { Sye } from '../_models/sye.model';
import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root'
})
export class SyeService {

  constructor(private wsService: WorkspaceService) { }

  createSye(id?: number): Sye {
    const sye = {
      id: null,
      syeId: typeof(id) === 'number' ? id : null,
      occurrencesCount: 0,
      occurrences: [],
      syntheticColumn: null,
      vlWorkspace: this.wsService.currentWS.getValue()
    };

    return sye;
  }
}
