import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { IconColor } from "@_models/app";





@Component({
  selector: "app-highlight-keywords",
  templateUrl: "./highlight-keywords.component.html",
  styleUrls: ["./highlight-keywords.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class HighlightKeywordsComponent {


  @Input() text: string;
  @Input() keywords: string[];
  @Input() color: IconColor | "default" = "default";
  @Input() invert: boolean = false;





  // Форматированный текст
  get getText(): string {
    if (!!this.keywords?.length) {
      return this.keywords.reduce(
        (text, keyword) => text.replace(new RegExp("(" + keyword + ")", "gmi"), "<span class=\"text__highlight\">$1</span>"),
        this.text
      );
    }
    // Вернуть текст без изменений
    return this.text;
  }
}
