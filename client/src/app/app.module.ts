import { PageLoaderModule } from "@_controlers/page-loader/page-loader.module";
import { ArrayForEach, MapCycle } from "@_helpers/objects";
import { CustomMaterialIcon } from "@_models/app";
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





const materialIcons: CustomMaterialIcon[] = [
  // Логотип
  {
    keys: ["dreams_diary_logo", "main_logo", "site_logo"],
    path: "assets/images/icons/logos/logo-flower.svg"
  },
  // Балончик с краской
  {
    keys: ["paint_spray"],
    path: "assets/images/icons/material-icons/paint_spray.svg"
  },
  // Забор
  {
    keys: ["fence"],
    path: "assets/images/icons/material-icons/fence.svg"
  },
  // Уровни детализации графики
  ...MapCycle(7, i => ({
    keys: ["detalization_level_" + i],
    path: "assets/images/icons/material-icons/detalization_level_" + i + ".svg"
  }))
];





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
    ArrayForEach(materialIcons, ({ keys, path }) => ArrayForEach(keys, key => this.matIconRegistry.addSvgIcon(
      key,
      this.domSanitizer.bypassSecurityTrustResourceUrl(path)
    )));
  }
}
