import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MainBackgroundModule } from '@_controlers/main-background/main-background.module';

import { AppComponent } from './app.component';
import { AppRoutingModule } from "./app-routing.module";
import { MatSnackBarModule } from '@angular/material/snack-bar';





@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MainBackgroundModule,
    MatSnackBarModule
  ],
  bootstrap: [
    AppComponent
  ]
})





export class AppModule { }
