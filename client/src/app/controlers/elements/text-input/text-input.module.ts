import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { CoreModule } from "@_modules/core.module";

import { CustomDateAdapter } from "@_helpers/custom-date-adapter";

import { TextInputComponent } from "./text-input.component";
import { TextFieldModule } from "@angular/cdk/text-field";





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
