import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor3DWorldOceanComponent } from './editor-3d-world-ocean.component';
import { MatIconModule } from "@angular/material/icon";
import { CoreModule } from "@_modules/core.module";

@NgModule({
  declarations: [
    Editor3DWorldOceanComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    CoreModule
  ],
  exports: [
    Editor3DWorldOceanComponent
  ]
})
export class Editor3DWorldOceanModule { }
