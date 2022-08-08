import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { InformModule } from '@_controlers/inform/inform.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PaginationModule } from '@_controlers/pagination/pagination.module';
import { PeopleRoutingModule } from '@_pages/people/people-routing.module';
import { PeopleComponent } from '@_pages/people/people.component';





@NgModule({
  declarations: [
    PeopleComponent,
  ],
  imports: [
    CommonModule,
    NavMenuModule,
    PeopleRoutingModule,
    InformModule,
    PaginationModule
  ]
})

export class PeopleModule { }
