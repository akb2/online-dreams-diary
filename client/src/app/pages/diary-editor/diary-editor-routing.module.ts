import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DiaryEditorComponent } from "@_pages/diary-editor/diary-editor.component";





const routes: Routes = [
  // Новое сновидение
  {
    path: "",
    component: DiaryEditorComponent,
    data: { title: "Редактор сновидения" }
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

export class DiaryEditorRoutingModule { }
