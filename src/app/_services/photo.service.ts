import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { OccurrenceModel } from '../_models/occurrence.model';
import { PhotoModel } from '../_models/photo.model';


@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  constructor(private http: HttpClient) { }

  public linkPhotoToOccurrence(photo: PhotoModel, occurrence: OccurrenceModel): Observable<any> {
    const headers = { 'Content-Type': 'ld+json' };
    const data = {
      occurrence: {'@id': `/api/occurrences/${occurrence.id}`},
      dateLinkedToOccurrence: Date.now()
    };
    return this.http.patch(`http://localhost/8000/api/photos/${photo.id}`, data, {headers});
  }
}
