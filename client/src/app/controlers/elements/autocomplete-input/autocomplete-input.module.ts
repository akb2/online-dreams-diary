import { AutocompleteInputComponent } from "@_controlers/autocomplete-input/autocomplete-input.component";
import { ScrollModule } from "@_controlers/scroll/scroll.module";
import { CoreModule } from "@_modules/core.module";
import { TextFieldModule } from "@angular/cdk/text-field";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TranslateModule } from "@ngx-translate/core";





@NgModule({
  declarations: [
    AutocompleteInputComponent
  ],
  exports: [
    AutocompleteInputComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    TextFieldModule,
    MatAutocompleteModule,
    ScrollModule,
    TranslateModule
  ]
})

export class AutocompleteInputModule { }
