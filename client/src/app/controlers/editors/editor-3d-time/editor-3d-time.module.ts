import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor3DTimeComponent } from './editor-3d-time.component';
import { CoreModule } from "@_modules/core.module";

@NgModule({
  declarations: [
    Editor3DTimeComponent
  ],
  imports: [
    CommonModule,
    CoreModule
  ],
  exports: [
    Editor3DTimeComponent
  ]
})

export class Editor3DTimeModule { }
