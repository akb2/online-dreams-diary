import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiaryViewerComponent } from '@_pages/diary-viewer/diary-viewer.component';





const routes: Routes = [
  { path: '', component: DiaryViewerComponent },
  { path: ':dreamId', component: DiaryViewerComponent }
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
