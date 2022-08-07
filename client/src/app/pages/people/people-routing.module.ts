import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PeopleComponent } from "@_pages/people/people.component";





const routes: Routes = [{
  path: "",
  component: PeopleComponent,
  data: { title: "Поиск людей" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class PeopleRoutingModule { }
