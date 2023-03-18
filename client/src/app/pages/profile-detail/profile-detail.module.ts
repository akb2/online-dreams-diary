import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CardModule } from "@_controlers/card/card.module";
import { DreamListModule } from "@_controlers/dream-list/dream-list.module";
import { InformModule } from "@_controlers/inform/inform.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from "@_controlers/page-loader/page-loader.module";
import { TitleModule } from "@_controlers/title/title.module";
import { CoreModule } from "@_modules/core.module";
import { CommentBlockModule } from "@_pages/profile-detail/comment-block/comment-block.module";
import { DreamsBlockComponent } from "@_pages/profile-detail/dreams-block/dreams-block.component";
import { FriendsBlockComponent } from "@_pages/profile-detail/friends-block/friends-block.component";
import { ActionBlockComponent } from "./action-block/action-block.component";
import { AvatarBlockComponent } from "./avatar-block/avatar-block.component";
import { GeneralInfoBlockComponent } from "./general-info-block/general-info-block.component";
import { ProfileDetailRoutingModule } from "./profile-detail-routing.module";
import { ProfileDetailComponent } from "./profile-detail.component";
import { StatusBlockComponent } from "./status-block/status-block.component";





@NgModule({
  declarations: [
    ProfileDetailComponent,
    AvatarBlockComponent,
    StatusBlockComponent,
    ActionBlockComponent,
    GeneralInfoBlockComponent,
    DreamsBlockComponent,
    FriendsBlockComponent
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
    CoreModule,
    CardModule,
    CommentBlockModule
  ]
})

export class ProfileDetailModule { }
