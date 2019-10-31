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
    return _.filter(layerList, l => l.name === str)[0].enum;
  }
}
