import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SyntheticColumnService {

  constructor() { }

  getReadableCoef(type: string, sum: number, nbItems: number, minCoef: string, maxCoef: string): string {
    const freq = (nbItems * 100) / sum;

    switch (type) {
      case 'roman':
        return this.getRomanCoef(freq);
      case 'romanMinMax':
        return this.getRomanCoef(freq) + (minCoef === maxCoef ? minCoef : minCoef + maxCoef);
      case 'percent':
        return Math.round(freq).toString() + '%';
      default:
        return nbItems.toString();
    }
  }

  private getRomanCoef(frequency: number): string {
    switch (true) {
      case (frequency < 5):
        return '.';
      case (frequency >= 5 && frequency < 10):
        return '+';
      case (frequency >= 10 && frequency < 20):
        return 'I';
      case (frequency >= 20 && frequency < 40):
        return 'II';
      case (frequency >= 40 && frequency < 60):
        return 'III';
      case (frequency >= 60 && frequency < 80):
        return 'IV';
      case (frequency >= 80 && frequency <= 100):
        return 'V';
      default:
        return '?';
    }
  }

}
