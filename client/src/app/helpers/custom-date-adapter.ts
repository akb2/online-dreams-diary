import { DefaultLanguage, LanguageFirstDayOfWeek, LanguageLocales } from "@_datas/translate";
import { Inject, Injectable, OnDestroy } from "@angular/core";
import { MAT_DATE_LOCALE, NativeDateAdapter } from "@angular/material/core";
import { translateLanguageSelector } from "@app/reducers/translate";
import { Store } from "@ngrx/store";
import { Subject, takeUntil } from "rxjs";





@Injectable()

export class CustomDateAdapter extends NativeDateAdapter implements OnDestroy {

  private firstDay: number = LanguageFirstDayOfWeek[DefaultLanguage];

  private destroyed$: Subject<void> = new Subject();





  constructor(
    @Inject(MAT_DATE_LOCALE) matDateLocale: string,
    private store$: Store
  ) {
    super(matDateLocale);
    // Переключение первого дня недели
    this.store$.select(translateLanguageSelector)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(language => {
        this.firstDay = LanguageFirstDayOfWeek[language];
        this.setLocale(LanguageLocales[language]);
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Разобрать строку
  override parse(value: any): Date {
    const timestamp: number = typeof value === "number" ? value : Date.parse(value);
    // Разбить значение для слеша
    if (typeof value === "string" && value.indexOf("/") > -1) {
      const str: string[] = value.split("/");
      const year: number = Number(str[2]);
      const month: number = Number(str[1]) - 1;
      const date: number = Number(str[0]);
      // Новая дата
      return new Date(year, month, date);
    }
    // Вернуть дату
    return isNaN(timestamp)
      ? null :
      new Date(timestamp);
  }


  // Первый день недели
  override getFirstDayOfWeek(): number {
    return this.firstDay;
  }
}
