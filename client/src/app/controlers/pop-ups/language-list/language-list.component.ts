import { AppMatDialogConfig } from "@_datas/app";
import { Language } from "@_models/translate";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { translateChangeLanguageAction, translateLanguageSelector } from "@app/reducers/translate";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";





@Component({
  selector: "app-popup-language-list",
  templateUrl: "./language-list.component.html",
  styleUrls: ["./language-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupLanguageListComponent {

  static popUpWidth: string = "500px";

  language: Language;
  languages: LanguageData[] = Languages;

  language$: Observable<Language> = this.store.select(translateLanguageSelector);





  constructor(
    private matDialogRef: MatDialogRef<PopupLanguageListComponent, Language>,
    private store: Store
  ) { }





  // Смена языки
  onChangeLanguage(mixedLanguage: string): void {
    const language: Language = mixedLanguage as Language;
    // Смена языка
    this.store.dispatch(translateChangeLanguageAction({ language }));
    // Закрытие окна
    this.matDialogRef.close();
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
