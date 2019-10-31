import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'momentLocalDate'
})
export class MomentLocalDatePipe implements PipeTransform {

  transform(value: Date|moment.Moment, args?: any): any {
    if (!args) {
      return moment(value).format('LL');
    } else {
      switch (args) {
        case 'day':
          return moment(value).format('LL');
        case 'month':
          return moment(value).format('MMMM YYYY');
        case 'year':
            return moment(value).format('YYYY');
        default:
            return moment(value).format('LL');
      }
    }
  }

}
