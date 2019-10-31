import { ErrorHandler, Injector, Injectable, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { NotificationService } from '../../_services/notification.service';
import { ErrorService } from '../../_services/error.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorsHandler implements ErrorHandler {

  constructor(private injector: Injector) { } // Because ErrorHandler is created before providers, we have to use ths Injector

  handleError(error: Error | HttpErrorResponse) {

    const notificationService = this.injector.get(NotificationService);
    const errorService = this.injector.get(ErrorService);
    const router = this.injector.get(Router);
    const ngZone = this.injector.get(NgZone);

    if (error instanceof HttpErrorResponse) {
      // Server or connection error
      if (!navigator.onLine) {
        // Handle offline error
        return notificationService.notify('Aucune connexion internet');
      } else {
        // Handle Http Error
        errorService.log(error).subscribe();
        return notificationService.notify(`${error.status} - ${error.message}`);
      }
    } else {
      // Handle client error
      errorService.log(error).subscribe(errorWithContextInfo => {
        ngZone.run(() => {
          router.navigate(['/error'], { queryParams: errorWithContextInfo });
        }
        );
      });
    }
  }

}
