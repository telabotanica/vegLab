import { Injectable } from '@angular/core';

import { Sye } from '../_models/sye.model';
import { WorkspaceService } from './workspace.service';

import * as _ from 'lodash';
import { OccurrenceModel } from '../_models/occurrence.model';

@Injectable({
  providedIn: 'root'
})
export class SyeService {

  constructor(private wsService: WorkspaceService) { }

  createSye(id?: number): Sye {
    const sye = {
      id: null,
      userId: null,
      userEmail: null,
      userPseudo: null,
      syeId: typeof(id) === 'number' ? id : null,
      occurrencesCount: 0,
      occurrences: [],
      occurrencesOrder: null,
      syntheticColumn: null,
      onlyShowSyntheticColumn: false,
      vlWorkspace: this.wsService.currentWS.getValue()
    };

    return sye;
  }

  getOccurrencesOrder(sye: Sye): string {
    const order: Array<number> = [];
    for (const occ of sye.occurrences) {
      if (occ.id) { order.push(occ.id); }
    }
    if (order.length > 0) {
      return order.toString();
    } else {
      return null;
    }
  }

  /**
   * Order sye.occurrences according to sye.occurrencesOrder
   * This function alterates sye.occurrences
   */
  orderOccurrences(sye: Sye): void {
    const order = sye.occurrencesOrder;

    /*if (order !== this.getOccurrencesOrder(sye)) {
      // @Todo log error
      // some occurrence may have been removed since the last update ?
      return;
    }*/

    if (!order || order === '') { return; }

    const orderArray = order.split(',');
    const orderedArrayNumber: Array<number> = [];
    _.map(orderArray, oa => orderedArrayNumber.push(Number(oa)));

    const countOccurrences = sye.occurrences.length;

    if (countOccurrences !== orderArray.length) {
      // @Todo log error
      return;
    }

    const orderedOccurrences: Array<OccurrenceModel> = [];
    // Order occurrences according to orderArray
    for (const orderedOccId of orderedArrayNumber) {
      const occ = _.find(sye.occurrences, syeOcc => syeOcc.id === orderedOccId);
      if (occ) { orderedOccurrences.push(occ); }
    }

    if (orderedOccurrences.length === sye.occurrences.length) {
      sye.occurrences = orderedOccurrences;
    }

  }

  /**
   * Remove the Sye ids ('id' and '@id' plus other ld+json values if exists)
   */
  removeIds(sye: Sye): Sye {
    const _sye = _.clone(sye);

    if (_sye == null) {
      throw new Error('Can\'t remove sye ids for a non existing sye !');
    }

    if (_sye !== null && _sye.id !== null) {
      // Remove sye id
      _sye.id = null;
    }

    // Remove '@id' property (ld+json support)
    if (_sye['@id'] !== null) {
      delete _sye['@id'];

      // Remove other ld+json fields
      if (_sye['@context'] !== null) { delete _sye['@context']; }
      if (_sye['@type'] !== null) { delete _sye['@type']; }
    }

    return _sye;
  }
}
