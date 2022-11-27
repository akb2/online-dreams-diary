import { Component, Input } from "@angular/core";
import { MenuItem } from "@_models/menu";





@Component({
  selector: "app-content-menu",
  templateUrl: "./content-menu.component.html",
  styleUrls: ["./content-menu.component.scss"]
})

export class ContentMenuComponent {
  @Input() public menuItems: MenuItem[];
}
