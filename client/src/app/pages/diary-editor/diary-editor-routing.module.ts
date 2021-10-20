import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiaryEditorComponent } from '@_pages/diary-editor/diary-editor.component';





const routes: Routes = [
  { path: '', component: DiaryEditorComponent },
  { path: ':dreamId', component: DiaryEditorComponent }
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
