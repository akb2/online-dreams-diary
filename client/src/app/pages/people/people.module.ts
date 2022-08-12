import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { InformModule } from '@_controlers/inform/inform.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PaginationModule } from '@_controlers/pagination/pagination.module';
import { PeopleListModule } from '@_controlers/people-list/people-list.module';
import { SearchPanelModule } from '@_controlers/search-panel/search-panel.module';
import { CoreModule } from '@_modules/core.module';
import { PeopleRoutingModule } from '@_pages/people/people-routing.module';
import { PeopleComponent } from '@_pages/people/people.component';





@NgModule({
  declarations: [
    PeopleComponent,
  ],
  imports: [
    CoreModule,
    CommonModule,
    NavMenuModule,
    PeopleRoutingModule,
    InformModule,
    PaginationModule,
    MatButtonModule,
    PeopleListModule,
    SearchPanelModule
  ]
})

export class PeopleModule { }
