import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export const appConfig = {
  providers: [
    importProvidersFrom(BrowserAnimationsModule),
    provideRouter([])
  ]
};
