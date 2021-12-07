import { NgModule, LOCALE_ID } from "@angular/core";
import { CommonModule, DatePipe, I18nPluralPipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import "@angular/common/locales/global/ru";





// Компоненты
const components = [
];

// Директивы
const directives = [
];

// Пайпы
const pipes = [
];

// Модули
const modules = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  MatIconModule
];





@NgModule({
  declarations: [
    ...directives,
    ...components,
    ...pipes
  ],
  imports: [
    ...modules,
    RouterModule.forChild([]),
  ],
  providers: [
    DatePipe,
    I18nPluralPipe,
    { provide: LOCALE_ID, useValue: "ru" }
  ],
  exports: [
    ...modules,
    ...directives,
    ...components,
    ...pipes
  ]
})

export class CoreModule { }
