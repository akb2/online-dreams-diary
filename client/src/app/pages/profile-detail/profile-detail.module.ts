import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { ProfileDetailRoutingModule } from '@_pages/profile-detail/profile-detail-routing.module';
import { ProfileDetailComponent } from '@_pages/profile-detail/profile-detail.component';





@NgModule({
  declarations: [
    ProfileDetailComponent,
  ],
  imports: [
    CommonModule,
    NavMenuModule,
    ProfileDetailRoutingModule,
    PageLoaderModule
  ]
})

export class ProfileDetailModule { }
