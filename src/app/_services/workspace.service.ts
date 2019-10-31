import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  currentWS = new BehaviorSubject<string>('*');

  constructor() { }
}
