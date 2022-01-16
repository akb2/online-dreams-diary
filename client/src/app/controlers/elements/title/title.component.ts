import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { CustomObject } from "@_models/app";





@Component({
  selector: "app-title",
  templateUrl: "./title.component.html",
  styleUrls: ["./title.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TitleComponent implements OnInit {
  @Input() type: TitleType = 1;
  @Input() icon: string;
  @Input() title: string = "Заголовок";
  @Input() subTitle: string;

  class: CustomObject<boolean>;

  ngOnInit() {
    this.class = {
      image: !!this.icon,
      subtitle: !!this.subTitle
    };
  }
}





// Типы заголовка
type TitleType = 1 | 2 | 3 | 4 | 5;
