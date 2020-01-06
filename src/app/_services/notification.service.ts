import { Injectable } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  globalNotificationOptions = {
    timeOut: 8000,
    showProgressBar: true,
    pauseOnHover: true,
    clickToClose: true
  };

  constructor(private simpleNotification: NotificationsService) { }

  notify(message: string) {
    // console.info(message);
    this.simpleNotification.info(null, message, this.globalNotificationOptions);
  }

  warn(message: string) {
    // console.warn(message);
    this.simpleNotification.warn(null, message, this.globalNotificationOptions);
  }

  error(message: string) {
    // console.error(message);
    this.simpleNotification.error(null, message, this.globalNotificationOptions);
  }
}
