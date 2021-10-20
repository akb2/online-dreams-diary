import { NgModule } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { NavMenuSettingsModule } from '@_controlers/nav-menu-settings/nav-menu-settings.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { CoreModule } from '@_modules/core.module';
import { DiaryEditorRoutingModule } from '@_pages/diary-editor/diary-editor-routing.module';
import { DiaryEditorComponent } from '@_pages/diary-editor/diary-editor.component';
import { CKEditorModule } from 'ckeditor4-angular';





@NgModule({
  declarations: [
    DiaryEditorComponent
  ],
  imports: [
    CoreModule,
    DiaryEditorRoutingModule,
    NavMenuModule,
    PageLoaderModule,
    CKEditorModule,
    MatTabsModule,
    NavMenuSettingsModule
  ]
})

export class DiaryEditorModule { }
