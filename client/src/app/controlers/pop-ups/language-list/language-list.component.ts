import { AppMatDialogConfig } from "@_datas/app";
import { IsInEnum } from "@_helpers/app";
import { Language } from "@_models/translate";
import { LanguageService } from "@_services/language.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-popup-language-list",
  templateUrl: "./language-list.component.html",
  styleUrls: ["./language-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupLanguageListComponent implements OnInit, OnDestroy {

  static popUpWidth: string = "500px";

  language: Language;
  languages: LanguageData[] = Languages;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private matDialogRef: MatDialogRef<PopupLanguageListComponent, Language>,
    private languageService: LanguageService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.languageService.language$.asObservable()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(language => {
        this.language = language;
        // Обновить
        this.changeDetectorRef.detectChanges();
      })
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Смена языки
  onChangeLanguage(mixedLanguage: string): void {
    const language: Language = IsInEnum(mixedLanguage, Language) ?
      mixedLanguage as Language :
      this.languageService.getFromDomainSetting();
    // Смена языка
    this.languageService.setLanguage(language)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.matDialogRef.close());
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog): MatDialogRef<PopupLanguageListComponent, Language> {
    const matDialogConfig: MatDialogConfig = { ...AppMatDialogConfig };
    // Настройки
    matDialogConfig.width = PopupLanguageListComponent.popUpWidth;
    // Вернуть диалог
    return matDialog.open(PopupLanguageListComponent, matDialogConfig);
  }
}





// Данные о языке
interface LanguageData {
  language: Language;
  name: string;
}





// Список языков
const Languages: LanguageData[] = [
  // Русский
  {
    language: Language.ru,
    name: "Русский"
  },
  // Английский
  {
    language: Language.en,
    name: "English"
  }
];
