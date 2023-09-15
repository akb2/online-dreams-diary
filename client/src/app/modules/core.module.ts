import { ScrollDetectorDirective } from "@_directives/scroll-detector.directive";
import { SwipeDirective } from "@_directives/swipe.directive";
import { VarDirective } from "@_directives/var.directive";
import { NotificationTextPipe } from "@_pipes/notification-text.pipe";
import { PetrovichPipe } from "@_pipes/petrovich.pipe";
import { ShortCounterPipe } from "@_pipes/short-counter.pipe";
import { StringTemplatePipe } from "@_pipes/string-template.pipe";
import { CommonModule, DatePipe, I18nPluralPipe } from "@angular/common";
import "@angular/common/locales/global/ru";
import { LOCALE_ID, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";





// Компоненты
const components = [
];

// Директивы
const directives = [
  VarDirective,
  ScrollDetectorDirective,
  SwipeDirective
];

// Пайпы
const pipes = [
  PetrovichPipe,
  NotificationTextPipe,
  StringTemplatePipe,
  ShortCounterPipe
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
