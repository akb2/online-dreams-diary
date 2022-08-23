import { Component, Input } from "@angular/core";
import { SimpleObject } from "@_models/app";





@Component({
  selector: "app-card-menu",
  templateUrl: "./card-menu.component.html",
  styleUrls: ["./card-menu.component.scss"]
})

export class CardMenuComponent {


  @Input() menuIcon: string = "more_vert";
  @Input() menuItems: CardMenuItem[];





  // Убрать лишнее из пунктов
  get getMenuItems(): CardMenuItem[] {
    return this.menuItems.filter(item => !!item);
  }


}





// Интерфейс меню
export interface CardMenuItem {
  delimeter?: boolean;
  icon?: string;
  title?: string;
  subTitle?: string;
  routerLink?: string;
  queryParams?: SimpleObject;
  callback?: Function;
}
