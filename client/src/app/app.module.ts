import { PageLoaderModule } from "@_controlers/page-loader/page-loader.module";
import { ForCycle } from "@_helpers/objects";
import { CoreModule } from "@_modules/core.module";
import { ApiInterceptorService } from "@_services/api-interceptor.service";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BrowserModule, DomSanitizer } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
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
    PageLoaderModule,
    MatIconModule
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    MatIconRegistry,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptorService,
      multi: true,
    },
  ]
})

export class AppModule {
  // Регистрация иконок
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    // Балончик с краской
    this.matIconRegistry.addSvgIcon(
      "paint_spray",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/images/icons/material-icons/paint_spray.svg")
    );
    // Уровни детализации графики
    ForCycle(7, i => this.matIconRegistry.addSvgIcon(
      "detalization_level_" + i,
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/images/icons/material-icons/detalization_level_" + i + ".svg")
    ));
    // Забор
    this.matIconRegistry.addSvgIcon(
      "fence",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/images/icons/material-icons/fence.svg")
    );
  }
}
