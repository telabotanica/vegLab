import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'wsLabel'
})
export class WsLabelPipe implements PipeTransform {

  transform(value: string, args?: any): any {
    switch (value) {
      case 'phyto':
        return 'Phyto.';
      default:
        return value;
    }
  }

}
