import { BackgroundImageDatas } from "@_datas/appearance";
import { User } from "@_models/account";
import { BackgroundHorizontalPosition, BackgroundImageData, BackgroundVerticalPosition } from "@_models/appearance";
import { Component, EventEmitter, Input, Output } from "@angular/core";





@Component({
  selector: "app-panels-header",
  templateUrl: "panels-header.component.html",
  styleUrls: ["./panels-header.component.scss"]
})

export class PanelsHeaderComponent {


  @Input() backgroundImageId: number = 0;

  @Input() imageSrc: string;
  @Input() positionX: BackgroundHorizontalPosition;
  @Input() positionY: BackgroundVerticalPosition;
  @Input() imageOverlay: boolean;

  @Input() avatarImage: string = "";
  @Input() avatarBlink: boolean = false;
  @Input() avatarIcon: string = "";
  @Input() avatarCustomIcon: string = "";
  @Input() mainTitle: string = "";
  @Input() subTitle: string = "";
  @Input() lastSeenUser: User;

  @Output() closeClick: EventEmitter<void> = new EventEmitter<void>();

  imagePrefix: string = "../../../../assets/images/backgrounds/";





  // Данные для фона
  get getBackgroundImageData(): LocalBackgroundImageData {
    // Переданы данные
    if (!!this.imageSrc) {
      return {
        src: this.imageSrc,
        id: 0,
        title: "",
        imageName: "",
        imageNameShort: "",
        positionX: this.positionX,
        positionY: this.positionY,
        imageOverlay: this.imageOverlay
      };
    }
    // Передан ID данных
    else {
      const data: BackgroundImageData = BackgroundImageDatas.find(({ id }) => id === this.backgroundImageId) ?? BackgroundImageDatas[0];
      // Дополнить и вернуть данные
      return {
        ...data,
        src: this.imagePrefix + data.imageNameShort
      };
    }
  }

  // Проверить есть ли аватарка
  get hasAvatar(): boolean {
    return !!this.avatarImage || !!this.avatarIcon || !!this.avatarCustomIcon;
  }





  // Нажатие на кнопку закрыть
  onCloseClick(): void {
    this.closeClick.emit();
  }
}





// Расширенный интерфейс данных фонового изображения
interface LocalBackgroundImageData extends BackgroundImageData {
  src: string;
}
