import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { EmojiData, EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { ParseInt } from "@_helpers/math";





@Pipe({ name: "comment" })

export class CommentPipe implements PipeTransform {

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





  constructor(
    private emojiService: EmojiService,
    private domSanitizer: DomSanitizer
  ) { }





  // Трансформация
  transform(text: string): SafeHtml {
    const emojiRegExp: RegExp = new RegExp("\\[emoji=([a-z0-9\-_\+]+)(:([0-9]+))?(:([a-z]+))?\\]", "ig");
    const emojies: string[] = text.match(emojiRegExp) ?? [];
    // Замена смайликов
    emojies.forEach(textEmoji => {
      const mixedEmoji: string = textEmoji.replace(emojiRegExp, "$1");
      const skin: EmojiSkin = ParseInt(textEmoji.replace(emojiRegExp, "$3"), 1) as EmojiSkin;
      const set: EmojiSet = textEmoji.replace(emojiRegExp, "$5") as EmojiSet;
      const emojiHTML: string = this.getEmojiHTML(mixedEmoji, skin, set);
      // Замена смайлика
      text = text.replace(textEmoji, emojiHTML);
    });
    // Замена тегов
    text = text.replace(new RegExp("\\[br\\]", "ig"), "<br>");
    // Вернуть изначальный текст
    return this.domSanitizer.bypassSecurityTrustHtml(text);
  }
}





// Типы цвета кожи
type EmojiSkin = 1 | 2 | 3 | 4 | 5 | 6;

// Типы наборов
type EmojiSet = "" | "apple" | "google" | "twitter" | "facebook";
