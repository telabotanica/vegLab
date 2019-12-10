import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable({
  providedIn: 'root'
})
export class MatPaginatorIntlService extends MatPaginatorIntl {

  constructor() {
    super();
  }

  itemsPerPageLabel = 'Nombre par page';
  lastPageLabel = 'Dernière page';
  nextPageLabel = 'Page suivante';
  previousPageLabel = 'Page précédente';

  getRangeLabel = (page: number, pageSize: number, length: number) => {
    console.log('GET RANGE LABEL');
    console.log(`page ${page}, pageSize ${pageSize}, length ${length}`);
    if (length === 0 || pageSize === 0) { return `0 sur ${length}`; }

    length = Math.max(length, 0);

    const startIndex = page * pageSize;

    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;

    return `de ${startIndex + 1} à ${endIndex} sur ${length}`;
  }
}
