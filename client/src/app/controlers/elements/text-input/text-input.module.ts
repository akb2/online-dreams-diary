import { TextFieldModule } from "@angular/cdk/text-field";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DateAdapter, MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CustomDateAdapter } from "@_helpers/custom-date-adapter";
import { CoreModule } from "@_modules/core.module";
import { TextInputComponent } from "./text-input.component";





@NgModule({
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'ru-RU'
    },
    {
      provide: DateAdapter,
      useClass: CustomDateAdapter
    }
  ],
  exports: [
    TextInputComponent,
    MatDatepickerModule
  ],
  declarations: [
    TextInputComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    TextFieldModule
  ]
})

export class TextInputModule { }
