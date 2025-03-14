import { AutocompleteInputModule } from "@_controlers/autocomplete-input/autocomplete-input.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { SliderInputModule } from "@_controlers/slider-input/slider-input.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule, Routes } from "@angular/router";
import { PerlinNoiseComponent } from "@app/controlers/dev-tools/perlin-noise/perlin-noise.component";
import { TranslateModule } from "@ngx-translate/core";





const routes: Routes = [{
  path: "",
  component: PerlinNoiseComponent,
  data: { title: "Генерация шума" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class DevToolsRoutingModule { }

@NgModule({
  declarations: [
    PerlinNoiseComponent
  ],
  exports: [
    PerlinNoiseComponent
  ],
  imports: [
    DevToolsRoutingModule,
    CommonModule,
    SliderInputModule,
    NavMenuModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    AutocompleteInputModule
  ]
})
export class DevToolsModule { }
