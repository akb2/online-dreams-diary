import { AutocompleteInputModule } from '@_controlers/autocomplete-input/autocomplete-input.module';
import { CardModule } from '@_controlers/card/card.module';
import { ChipsInputModule } from '@_controlers/chips-input/chips-input.module';
import { Editor3DModule } from "@_controlers/editor-3d/editor-3d.module";
import { InformModule } from "@_controlers/inform/inform.module";
import { NavMenuSettingsModule } from '@_controlers/nav-menu-settings/nav-menu-settings.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { SliderInputModule } from "@_controlers/slider-input/slider-input.module";
import { TextEditorModule } from "@_controlers/text-editor/text-editor.module";
import { TextInputModule } from '@_controlers/text-input/text-input.module';
import { CoreModule } from '@_modules/core.module';
import { DiaryEditorRoutingModule } from '@_pages/diary-editor/diary-editor-routing.module';
import { DiaryEditorComponent } from '@_pages/diary-editor/diary-editor.component';
import { NgModule } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [
    DiaryEditorComponent
  ],
  imports: [
    CoreModule,
    DiaryEditorRoutingModule,
    NavMenuModule,
    PageLoaderModule,
    MatTabsModule,
    NavMenuSettingsModule,
    ChipsInputModule,
    CardModule,
    TextInputModule,
    AutocompleteInputModule,
    SliderInputModule,
    InformModule,
    TextEditorModule,
    Editor3DModule,
    TranslateModule
  ]
})
export class DiaryEditorModule { }
