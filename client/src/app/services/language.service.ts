import { DefaultLanguage, DefaultLanguageSetting, LanguageSettings } from "@_datas/translate";
import { IsInEnum } from "@_helpers/app";
import { LocalStorageGet, LocalStorageSet } from "@_helpers/local-storage";
import { Language, LanguageSetting } from "@_models/translate";
import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject, filter, map, pairwise, startWith, take, takeUntil } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class LanguageService implements OnDestroy {

  private languageLocalStorageKey: string = "language";
  private localStorageTtl: number = 0;

  language$: BehaviorSubject<Language> = new BehaviorSubject(null);
  private destroyed$: Subject<void> = new Subject();





  // Получить язык из хранилища
  private getFromLocalStorage(): Language {
    const mixedLanguage: string = LocalStorageGet(this.languageLocalStorageKey);
    // Вернуть язык
    return IsInEnum(mixedLanguage, Language) ?
      mixedLanguage as Language :
      null;
  }

  // Получить из информации о браузере
  private getFromBrowser(): Language {
    const mixedLanguage: string = navigator.language.split('-')[0];
    // Вернуть язык
    return IsInEnum(mixedLanguage, Language) ?
      mixedLanguage as Language :
      null;
  }

  // Язык для сайта по домену по умолчанию
  getFromDomainSetting(): Language {
    const domain: string = window.location.hostname;
    const languageSettings: LanguageSetting = LanguageSettings?.[domain] ?? DefaultLanguageSetting;
    // Вернуть язык
    return languageSettings?.defaultLanguage ?? DefaultLanguage;
  }

  // Определить текущий язык
  private getDetectedLanguage(): Language {
    const localStorageLanguage: Language = this.getFromLocalStorage();
    const browserLanguage: Language = this.getFromBrowser();
    const siteDefaultLanguage: Language = this.getFromDomainSetting();
    // Определение языка
    return localStorageLanguage ?? browserLanguage ?? siteDefaultLanguage;
  }





  constructor() {
    const language: Language = this.getDetectedLanguage();
    // Сохранить язык
    this.setLanguage(language)
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
    // Стриггерить язык
    this.language$.next(language);
  }

  ngOnDestroy(): void {
    this.language$.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Событие изменения языка
  onLanguageChange(): Observable<Language> {
    return this.language$.asObservable().pipe(
      takeUntil(this.destroyed$),
      startWith(null),
      pairwise(),
      filter(([prev, next]) => prev !== next),
      map(([, language]) => language)
    );
  }





  // Изменить язык
  setLanguage(language: Language): Observable<boolean> {
    return this.language$.pipe(
      takeUntil(this.destroyed$),
      take(1),
      map(currentLanguage => {
        if (currentLanguage !== language) {
          LocalStorageSet(this.languageLocalStorageKey, language, this.localStorageTtl);
          this.language$.next(language);
          // Результат
          return true;
        }
        // Язык не сменился
        return false;
      })
    );
  }
}
