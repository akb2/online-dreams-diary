import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DiaryViewerComponent } from "@_pages/diary-viewer/diary-viewer.component";





const routes: Routes = [
  // Просмотр сновидения
  {
    path: "",
    component: DiaryViewerComponent,
    data: { title: "Просмотр сновидения" }
  }
];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class DiaryViewerRoutingModule { }
