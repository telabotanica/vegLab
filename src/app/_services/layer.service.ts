import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { LayerEnum, layerList } from '../_enums/layer-list';

@Injectable({
  providedIn: 'root'
})
export class LayerService {

  constructor() { }

  getLayers(): Array<{name: string, enum: LayerEnum, description: string}> {
    return layerList;
  }

  getLayerEnumByStr(str: string): LayerEnum {

    try {
      const e = _.filter(layerList, l => l.name === str)[0];
      console.log(str, e);
      return e !== undefined ? e.enum : null;
    } catch (error) {
      console.log('ERROR', str, error);
    }
    return ;
  }
}
