import { ParseInt } from "@_helpers/math";
import { IsDreamUrl, SearchUrlRegExp } from "@_helpers/string";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { EmojiData, EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";





export class TextMessage {

  private smileSize: number = 24;





  // Стили смайлика
  private emojiStyles(data: EmojiData): string {
    return Object.entries(this.emojiService.emojiSpriteStyles(data.sheet, data.set, this.smileSize))
      .map(([k, v]) => k + ":" + v)
      .join(";");
  }

  // HTML смайлика
  private getEmojiHTML(mixedEmoji: string, skin: EmojiSkin = 1, set: EmojiSet = ""): string {
    const emoji: EmojiData = this.emojiService.getData(mixedEmoji, skin, set);
    // Вернуть HTML код
    return "<img class='smile' src='/assets/dream-map/transparent.png' alt='" + emoji.name + "' style='" + this.emojiStyles(emoji) + "'/>";
  }

  // Поиск ссылок
  private getLinks(text: string): string {
    const urlRegex: RegExp = SearchUrlRegExp;
    let lastIndex: number = 0;
    let match: RegExpExecArray;
    let result: string = "";
    // Перебираем все совпадения с регулярным выражением
    while ((match = urlRegex.exec(text)) !== null) {
      // Совпадение с регулярным выражением
      const matchedUrl = match[0];
      // Проверяем, находится ли URL внутри HTML- или BB-тега
      if (!this.isInsideTag(text, match.index)) {
        result += text.substring(lastIndex, match.index) + (!IsDreamUrl(matchedUrl) ?
          "<a href='" + matchedUrl + "' target='_blank'>" + matchedUrl + "</a>" :
          ""
        );
        // Обновляем индекс последнего обработанного символа
        lastIndex = match.index + matchedUrl.length;
      }
    }
    // Добавляем оставшийся текст после последнего URL
    result += text.substring(lastIndex);
    // Вернуть исправления
    return result;
  }

  // Проверка ссылки внутри тегов
  private isInsideTag(text: string, position: number = 0) {
    return text.lastIndexOf('<', position) > text.lastIndexOf('>', position) || text.lastIndexOf('[', position) > text.lastIndexOf(']', position);
  }





  constructor(
    private emojiService: EmojiService,
    private domSanitizer: DomSanitizer
  ) { }





  // Трансформация
  textTransform(text: string): SafeHtml {
    const emojiRegExp: RegExp = new RegExp("\\[emoji=([a-z0-9\-_\+]+)(:([0-9]+))?(:([a-z]+))?\\]", "ig");
    const emojies: string[] = text.match(emojiRegExp) ?? [];
    // Замена смайликов
    if (!!emojies?.length) {
      emojies.forEach(textEmoji => {
        const mixedEmoji: string = textEmoji.replace(emojiRegExp, "$1");
        const skin: EmojiSkin = ParseInt(textEmoji.replace(emojiRegExp, "$3"), 1) as EmojiSkin;
        const set: EmojiSet = textEmoji.replace(emojiRegExp, "$5") as EmojiSet;
        const emojiHTML: string = this.getEmojiHTML(mixedEmoji, skin, set);
        // Замена смайлика
        text = text.replace(textEmoji, emojiHTML);
      });
    }
    // Замена тегов
    text = text.replace(new RegExp("\\[br\\]", "ig"), " <br> ");
    // Поиск прочих данных
    text = this.getLinks(text);
    // Убрать лишние пробелы
    text = text.replace(/([\s\t]+)/gi, " ");
    text = text.replace(/([\n\r]+)/gi, "\n");
    text = text.replace(/^([\s\n\r\t]+)$/gi, "");
    text = text.replace(/^([(<br>)\s\n\r\t]+)$/gi, "");
    // Вернуть изначальный текст
    return this.domSanitizer.bypassSecurityTrustHtml(text);
  }
}





// Типы цвета кожи
type EmojiSkin = 1 | 2 | 3 | 4 | 5 | 6;

// Типы наборов
type EmojiSet = "" | "apple" | "google" | "twitter" | "facebook";
