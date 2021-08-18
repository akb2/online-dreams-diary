import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainBackgroundModule } from '@_controlers/main-background/main-background.module';
import { CoreModule } from '@_modules/core.module';
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from './app.component';







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
    MatSnackBarModule,
    CoreModule
  ],
  bootstrap: [
    AppComponent
  ]
})





export class AppModule { }
