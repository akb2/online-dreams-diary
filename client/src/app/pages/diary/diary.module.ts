import { AutocompleteInputModule } from "@_controlers/autocomplete-input/autocomplete-input.module";
import { DreamListModule } from "@_controlers/dream-list/dream-list.module";
import { InformModule } from "@_controlers/inform/inform.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from "@_controlers/page-loader/page-loader.module";
import { PaginationModule } from "@_controlers/pagination/pagination.module";
import { SearchGroupModule } from "@_controlers/search-group/search-group.module";
import { SearchPanelModule } from "@_controlers/search-panel/search-panel.module";
import { TextInputModule } from "@_controlers/text-input/text-input.module";
import { CoreModule } from "@_modules/core.module";
import { DiaryRoutingModule } from "@_pages/diary/diary-routing.module";
import { DiaryComponent } from "@_pages/diary/diary.component";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TranslateModule } from "@ngx-translate/core";





@NgModule({
  declarations: [
    DiaryComponent
  ],
  imports: [
    CoreModule,
    DiaryRoutingModule,
    NavMenuModule,
    PageLoaderModule,
    DreamListModule,
    InformModule,
    PaginationModule,
    MatButtonModule,
    SearchPanelModule,
    SearchGroupModule,
    TextInputModule,
    MatTooltipModule,
    AutocompleteInputModule,
    MatCheckboxModule,
    MatFormFieldModule,
    TranslateModule
  ]
})

export class DiaryModule { }
