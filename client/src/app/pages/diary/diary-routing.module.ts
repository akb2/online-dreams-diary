import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DiaryComponent } from "@_pages/diary/diary.component";





const routes: Routes = [{
  path: "",
  component: DiaryComponent,
  data: { title: "Список сновидений" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class DiaryRoutingModule { }
