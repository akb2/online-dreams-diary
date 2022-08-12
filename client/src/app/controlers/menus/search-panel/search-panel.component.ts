import { Component } from "@angular/core";





@Component({
  selector: "app-search-panel",
  templateUrl: "./search-panel.component.html",
  styleUrls: ["search-panel.component.scss"]
})

export class SearchPanelComponent {


  isShow: boolean = true;





  // Открыть панель
  openPanel(): void {
    this.isShow = true;
  }

  // Закрыть панель
  closePanel(): void {
    this.isShow = false;
  }
}
