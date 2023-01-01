import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { PageLoaderModule } from "@_controlers/page-loader/page-loader.module";
import { CoreModule } from "@_modules/core.module";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";





@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    PageLoaderModule,
    MatSnackBarModule,
    CoreModule,
    PageLoaderModule
  ],
  bootstrap: [
    AppComponent
  ]
})

export class AppModule { }
