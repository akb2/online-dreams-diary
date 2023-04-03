import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { IconColor } from "@_models/app";
import { CompareArrays } from "@_helpers/objects";





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
    if (!!this.keywords?.length) {
      return this.keywords
        .filter(keyword => !!keyword?.length)
        .reduce(
          (text, keyword) => {
            const keywordForms: string[] = Array.from(new Set([keyword, this.getWordStem(keyword), ...this.getWordForms(keyword)]));
            // Замена форм слова
            return keywordForms
              .filter(form => !!form)
              .reduce((text, form) => text.replace(new RegExp("([^a-zа-я0-9<>])(" + form + ")([^a-zа-я0-9<>])", "gmi"), "$1<span class=\"text__highlight\">$2</span>$3"), text);
          },
          this.text
        );
    }
    // Вернуть текст без изменений
    return this.text;
  }

  // Получение базового значения слова
  private getWordStem(word: string): string {
    const vowels = ["а", "е", "ё", "и", "о", "у", "ы", "э", "ю", "я"];
    const perfectiveGerundEndings = ["в", "вши", "вшись", "в", "вши", "вшись"];
    const adjectiveEndings = ["ее", "ие", "ые", "ое", "ими", "ыми", "ей", "ий", "ый", "ой", "ем", "им", "ым", "ом", "его", "ого", "ему", "ому", "их", "ых", "ую", "юю", "ая", "яя", "ою", "ею"];
    const participleEndings = ["ивши", "ывши", "ующи", "емый", "омый", "имый", "ымый"];
    const reflexiveEndings = ["ся", "сь"];
    const verbEndings = ["ла", "на", "ете", "йте", "ли", "й", "л", "ем", "н", "ло", "но", "ет", "ют", "ны", "ть", "ешь", "нно"];
    let stem = word.toLowerCase().trim();
    // Step 1
    let m = stem.match(/([\s\S]*?)(и|а|е(?:йте)?|нн|ть|ешь|л(?:а|о|и)|ю|ут?|ы(?:ть)?)$/);
    // Уже базовая форма
    if (!m) {
      return stem;
    }
    // Поиск
    stem = m[1];
    // Step 2
    for (let i = 0; i < perfectiveGerundEndings.length; i++) {
      if (stem.endsWith(perfectiveGerundEndings[i])) {
        stem = stem.slice(0, -perfectiveGerundEndings[i].length);
        break;
      }
    }
    // Step 3
    m = stem.match(/([\s\S]*?)(ив|ывш|ующ)$/);
    if (m) {
      let mm = m[1].match(/([\s\S]*?)(ат|яч|ь)$/);
      if (mm) {
        stem = mm[1];
      }
    }
    // Step 4
    for (let i = 0; i < adjectiveEndings.length; i++) {
      if (stem.endsWith(adjectiveEndings[i])) {
        stem = stem.slice(0, -adjectiveEndings[i].length);
        break;
      }
    }
    // Step 5
    for (let i = 0; i < participleEndings.length; i++) {
      if (stem.endsWith(participleEndings[i])) {
        stem = stem.slice(0, -participleEndings[i].length);
        break;
      }
    }
    // Step 6
    for (let i = 0; i < reflexiveEndings.length; i++) {
      if (stem.endsWith(reflexiveEndings[i])) {
        stem = stem.slice(0, -reflexiveEndings[i].length);
        break;
      }
    }
    // Step 7
    m = stem.match(/([\s\S]*?)(и)$/);
    if (m) {
      stem = m[1];
    }
    // Step 8
    for (let i = 0; i < verbEndings.length; i++) {
      if (stem.endsWith(verbEndings[i])) {
        stem = stem.slice(0, -verbEndings[i].length);
        break;
      }
    }
    // Вернуть базовую форму
    return stem;
  }

  // Получение форм слова
  private getWordForms(word: string): string[] {
    const stem = this.getWordStem(word);
    const vowels = ["а", "е", "ё", "и", "о", "у", "ы", "э", "ю", "я"];
    const nounEndings = ["а", "у", "ом", "е", "ы", "ов", "ам", "ям", "ами", "ями", "о", "е", "и", "ь", "я", "ю", "ем", "н", "ми", "х"];
    const adjectiveEndings = ["ый", "ого", "ому", "ым", "ом", "ая", "ую", "ою", "ее", "ие", "ые", "ое", "ими", "ыми", "ей", "ий", "ем", "им", "ым", "его", "ому", "их", "ых", "ую", "юю", "яя"];
    const verbEndings = ["ю", "ешь", "ет", "ем", "ете", "ут", "ют", "ишь", "ит", "им", "ите", "ат", "ят", "ал", "ала", "али", "ать", "ят", "ила", "ило", "или", "ыл", "ыла", "ыли", "итесь", "иться", "ишься", "ится", "имся", "омся", "аете", "уются", "яться", "ел", "ело", "ела", "на"];
    const adverbEndings = ["о", "е", "ым", "ую", "ою", "ей", "ий"];
    const participleEndings = ["ший", "его", "ему", "им", "ая", "ую", "яя", "ее", "ие", "ые", "ое", "ими", "ыми", "ей", "ий", "ем", "им", "ым", "ого", "ому", "ых", "их"];
    const gerundEndings = ["в", "вши", "вшись"];
    const reflexiveEndings = ["ся", "сь"];
    let forms: string[] = [];
    // Nouns
    for (let i = 0; i < nounEndings.length; i++) {
      forms.push(stem + nounEndings[i]);
      forms.push(stem + vowels[4] + nounEndings[i]);
    }
    // Adjectives
    for (let i = 0; i < adjectiveEndings.length; i++) {
      forms.push(stem + adjectiveEndings[i]);
      forms.push(stem + vowels[4] + adjectiveEndings[i]);
    }
    // Verbs
    for (let i = 0; i < verbEndings.length; i++) {
      forms.push(stem + verbEndings[i]);
    }
    // Adverbs
    for (let i = 0; i < adverbEndings.length; i++) {
      forms.push(stem + adverbEndings[i]);
    }
    // Participles
    for (let i = 0; i < participleEndings.length; i++) {
      forms.push(stem + participleEndings[i]);
    }
    // Gerunds
    for (let i = 0; i < gerundEndings.length; i++) {
      forms.push(stem + gerundEndings[i]);
    }
    // Reflexives
    for (let i = 0; i < reflexiveEndings.length; i++) {
      forms.push(stem + reflexiveEndings[i]);
    }
    // Вернуть массив форм
    return forms;
  }
}
