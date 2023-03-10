import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";
import { DreamListModule } from "@_controlers/dream-list/dream-list.module";
import { InformModule } from "@_controlers/inform/inform.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PeopleListModule } from "@_controlers/people-list/people-list.module";
import { SearchInputModule } from "@_controlers/search-input/search-input.module";
import { TitleModule } from "@_controlers/title/title.module";
import { CoreModule } from "@_modules/core.module";
import { SearchRoutingModule } from "./search-routing.module";
import { SearchComponent } from "./search.component";





@NgModule({
  declarations: [
    SearchComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    SearchRoutingModule,
    NavMenuModule,
    InformModule,
    SearchInputModule,
    PeopleListModule,
    DreamListModule,
    TitleModule,
    MatButtonModule,
    RouterModule
  ]
})

export class SearchModule { }
