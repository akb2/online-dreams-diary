import { CustomDateAdapter } from "@_helpers/custom-date-adapter";
import { CoreModule } from "@_modules/core.module";
import { TextFieldModule } from "@angular/cdk/text-field";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Store } from "@ngrx/store";
import { TranslateModule } from "@ngx-translate/core";
import { TextInputComponent } from "./text-input.component";





@NgModule({
  providers: [
    CustomDateAdapter,
    {
      provide: DateAdapter,
      deps: [CustomDateAdapter, Store, MAT_DATE_LOCALE],
      useClass: CustomDateAdapter
    },
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
    TextFieldModule,
    MatButtonModule,
    TranslateModule
  ]
})

export class TextInputModule { }
