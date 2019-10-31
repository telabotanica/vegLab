import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortLevel'
})
export class ShortLevelPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    switch (value) {
      case 'synusy':
        return `σ`;
      case 'microcenosis':
        return `µC`;
      case 'phytocenosis':
        return `φ`;
      default:
        break;
    }
    return value;
  }

}
