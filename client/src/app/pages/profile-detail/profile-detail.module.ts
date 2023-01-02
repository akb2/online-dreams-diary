import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CardModule } from '@_controlers/card/card.module';
import { DreamListModule } from '@_controlers/dream-list/dream-list.module';
import { InformModule } from '@_controlers/inform/inform.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { TitleModule } from '@_controlers/title/title.module';
import { UserAvatarModule } from '@_controlers/user-avatar/user-avatar.module';
import { UserStatusModule } from '@_controlers/user-status/user-status.module';
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
    PageLoaderModule,
    InformModule,
    TitleModule,
    MatButtonModule,
    DreamListModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    UserAvatarModule,
    UserStatusModule
  ]
})

export class ProfileDetailModule { }
