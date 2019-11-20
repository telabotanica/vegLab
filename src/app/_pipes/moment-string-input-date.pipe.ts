import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'momentStringInputDate'
})
export class MomentStringInputDatePipe implements PipeTransform {

  transform(value: string, args?: any): any {
    const date = moment(value);
    return moment(date).format('LL');
  }

}
