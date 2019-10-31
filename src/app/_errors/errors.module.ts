import { NgModule, ErrorHandler } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { ErrorsHandler } from './errors-handler/errors-handler';
import { ServerErrorsInterceptor } from './server-errors-interceptor/server-errors.interceptor';

@NgModule({
  imports: [],
  declarations: [],
  providers: [
    { provide: ErrorHandler, useClass: ErrorsHandler },
    { provide: HTTP_INTERCEPTORS, useClass: ServerErrorsInterceptor, multi: true}
  ]
})
export class ErrorsModule { }
