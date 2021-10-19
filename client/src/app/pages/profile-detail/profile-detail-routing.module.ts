import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProfileDetailComponent } from "@_pages/profile-detail/profile-detail.component";





const routes: Routes = [{
  path: '',
  component: ProfileDetailComponent,
  data: { title: "Моя страница" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class ProfileDetailRoutingModule { }
