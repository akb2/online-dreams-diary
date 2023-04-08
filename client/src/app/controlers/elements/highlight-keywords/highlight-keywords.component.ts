import { CompareArrays } from "@_helpers/objects";
import { IconColor } from "@_models/app";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import * as snowballFactory from "snowball-stemmers";





@Component({
  selector: "app-highlight-keywords",
  templateUrl: "./highlight-keywords.component.html",
  styleUrls: ["./highlight-keywords.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class HighlightKeywordsComponent implements OnChanges {


  @Input() text: string;
  @Input() keywords: string[];
  @Input() color: IconColor | "default" = "default";
  @Input() invert: boolean = false;

  @Output() foundCount: EventEmitter<number> = new EventEmitter();

  private stemmer: Stemmer = snowballFactory.newStemmer("russian");

  highlightingText: string;





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    const changeText: boolean = !!changes?.text && changes.text.previousValue !== changes.text.currentValue;
    const changeKeywords: boolean = !!changes?.keywords && !CompareArrays(changes.keywords.previousValue, changes.keywords.currentValue);
    // Изменить текст
    if (changeText || changeKeywords) {
      this.highlightingText = this.highlightText();
      this.changeDetectorRef.detectChanges();
    }
  }





  // Форматированный текст
  private highlightText(): string {
    let count: number = 0;
    let text: string = this.text;
    // Ключевые слова найдены
    if (!!this.keywords?.length) {
      text = this.keywords
        .filter(keyword => !!keyword?.length)
        .map(keyword => keyword.toLowerCase().trim())
        .reduce(
          (text, keyword) => {
            const keywords: string[] = keyword.split(" ");
            // Обработка для каждого ключевого слова
            return keywords.reduce((text, keyword) => {
              const keywordForms: string[] = this.getAllWordForms(keyword);
              const regExp: RegExp = new RegExp(
                "(?<!<span class=\"text__highlight\">)([^a-zа-я0-9]|^)(" + keywordForms.join("|") + ")([^a-zа-я0-9]|$)(?<!<\/span>)",
                "gmiu"
              );
              // Подсчет нахождений
              count += text.match(regExp)?.length ?? 0;
              // Замена форм слова
              return text.replace(regExp, "$1<span class=\"text__highlight\">$2</span>$3");
            }, text);
          },
          this.text
        );
    }
    // Отправить найденное количество
    this.foundCount.emit(count);
    // Вернуть текст
    return text;
  }

  private getAllWordForms(word: string, searchExcludes: boolean = true): string[] {
    const verbEnds: string[] = ["ать", "ить", "еть"];
    const baseForm: string = verbEnds.some(e => word.endsWith(e)) ? word : this.stemmer.stem(word);
    // Создаем все возможные варианты окончаний слова для каждого типа слова
    const nounEndings: string[] = [
      "", "а", "у", "ом", "е", "ы", "ов", "ам", "ами", "ах", "ия", "ья", "ии", "ье", "ьи", "и", "ев", "ева", "ов", "ова", "ий", "ым", "иного", "инного",
      "ией", "ей", "ых", "ь", "ого", "о"
    ];
    const verbEndings: string[] = ["", "ю", "ешь", "ет", "ем", "ете", "ут", "ют"];
    const adjectiveEndings: string[] = [
      "", "ый", "ая", "ое", "ые", "ого", "ой", "ую", "ою", "ее", "ие", "ые", "ими", "ей", "их", "ую", "яя", "ее", "ие", "ые", "ими", "ей", "их", "ую", "яя"
    ];
    const pronounEndings: string[] = [
      "", "ый", "ая", "ое", "ые", "ого", "ой", "ую", "ою", "ее", "ие", "ые", "ими", "ей", "их", "ую", "яя", "ее", "ие", "ые", "ими", "ей", "их", "ую", "яя"
    ];
    const pastVerbEndings: string[] = ['', 'л', 'ла', 'ло', 'ли', 'лись', 'ла', 'ло', 'ли', 'ал', 'ел', 'лись'];
    const result: string[] = [];
    const excludeWords: string[][] = [
      ["рынок", "рынк", "рыночн"],
      ["бег", "беж"]
    ];
    // Добавляем в массив базовую форму слова
    result.push(word);
    result.push(baseForm);

    // Добавляем все возможные формы существительных
    if (baseForm.endsWith("ь")) {
      result.push(baseForm.slice(0, -1) + "я");
      result.push(baseForm.slice(0, -1) + "ю");
      result.push(baseForm.slice(0, -1) + "ям");
      result.push(baseForm.slice(0, -1) + "ями");
      result.push(baseForm.slice(0, -1) + "ях");
    }
    // Добавляем все возможные формы существительных А, Я
    else if (baseForm.endsWith("а") || baseForm.endsWith("я")) {
      result.push(...nounEndings.map(ending => baseForm + ending));
    }
    // Добавляем все возможные формы существительных О, Е
    else if (baseForm.endsWith("о") || baseForm.endsWith("е")) {
      result.push(...nounEndings.slice(4).map(ending => baseForm + ending));
    }
    // Остальные буквы
    else {
      result.push(...nounEndings.map(ending => baseForm + ending));
    }

    // Добавляем все возможные формы глаголов АТЬ
    if (baseForm.endsWith("ать")) {
      result.push(...verbEndings.map(ending => baseForm.slice(0, -2) + ending));
      result.push(...pastVerbEndings.map(ending => baseForm.slice(0, -2) + ending));
    }
    // Добавляем все возможные формы глаголов ИТЬ, ЕТЬ
    else if (baseForm.endsWith("ить") || baseForm.endsWith("еть")) {
      result.push(...verbEndings.slice(1).map(ending => baseForm.slice(0, -2) + ending));
      result.push(...pastVerbEndings.slice(1).map(ending => baseForm.slice(0, -2) + ending));
    }

    // Добавляем все возможные формы прилагательных и местоимений ЫЙ, ИЙ, ОЙ
    if (baseForm.endsWith("ый") || baseForm.endsWith("ий") || baseForm.endsWith("ой")) {
      result.push(...adjectiveEndings.map(ending => baseForm.slice(0, -2) + ending));
    }
    // Добавляем все возможные формы прилагательных и местоимений АЯ, ЯЯ
    else if (baseForm.endsWith("ая") || baseForm.endsWith("яя")) {
      result.push(...adjectiveEndings.slice(1, 9).map(ending => baseForm.slice(0, -2) + ending));
    }
    // Добавляем все возможные формы прилагательных и местоимений ОЕ, ЕЕ, ИЕ, ЫЕ
    else if (baseForm.endsWith("ое") || baseForm.endsWith("ее") || baseForm.endsWith("ие") || baseForm.endsWith("ые")) {
      result.push(...adjectiveEndings.slice(9, 18).map(ending => baseForm.slice(0, -2) + ending));
    }
    // Остальные буквы
    else {
      result.push(...pronounEndings.map(ending => baseForm + ending));
    }

    // Формы глаголов
    if (verbEnds.every(e => !baseForm.endsWith(e))) {
      verbEnds.map(e => this.getAllWordForms(baseForm + e, false)).forEach(ws => result.push(...ws));
    }
    // Исключения
    if (searchExcludes && excludeWords.some(ws => ws.includes(baseForm))) {
      const words: string[] = excludeWords
        .find(ws => ws.includes(baseForm))
        .reduce((o, w) => ([...o, w]), [])
        .filter(k => k !== baseForm);
      words.map(word => this.getAllWordForms(word, false)).forEach(ws => result.push(...ws));
    }
    // Возвращаем результат
    return Array.from(new Set(result));
  }
}





// Интерфейс стеммера
interface Stemmer {
  stem: (word: string) => string;
}
