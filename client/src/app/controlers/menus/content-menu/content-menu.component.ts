import { Component, Input } from "@angular/core";
import { MenuItem } from "@_models/menu";





// Декоратор компонента
@Component({
  selector: "app-content-menu",
  templateUrl: "./content-menu.component.html",
  styleUrls: ["./content-menu.component.scss"]
})

// Основной класс
export class ContentMenuComponent {
  @Input() public menuItems: MenuItem[];
}