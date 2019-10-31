import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'level'
})
export class LevelPipe implements PipeTransform {

  transform(value: string, args?: any): any {
    switch (value) {
      case 'synusy':
        return `σ rel. synusial`;
      case 'microcenosis':
        return `µC rel. sigmatiste`;
      case 'phytocenosis':
        return `φ rel. de phytocénose`;
      default:
        break;
    }
    return value;
  }

}
