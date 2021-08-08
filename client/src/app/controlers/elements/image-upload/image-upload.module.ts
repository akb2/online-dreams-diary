import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { CoreModule } from "@_modules/core.module";
import { ImageUploadComponent } from "./image-upload.component";





// Декоратор
@NgModule({
  exports: [
    ImageUploadComponent
  ],
  declarations: [
    ImageUploadComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule
  ]
})

// Класс
export class ImageUploadModule { }
