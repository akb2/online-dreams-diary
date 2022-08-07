import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PeopleComponent } from '@_pages/people/people.component';





@NgModule({
  declarations: [
    PeopleComponent,
  ],
  imports: [
    CommonModule,
    NavMenuModule,
  ]
})

export class PeopleModule { }
