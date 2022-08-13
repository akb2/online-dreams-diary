import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from "@angular/core";
import { BackgroundImageDatas } from "@_models/appearance";





@Component({
  selector: "app-search-panel",
  templateUrl: "./search-panel.component.html",
  styleUrls: ["search-panel.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SearchPanelComponent {


  @Input() backgroundImageId: number = BackgroundImageDatas[0].id;
  @Input() headerTitle: string = "";
  @Input() headerSubTitle: string = "";
  @Input() avatarImage: string = "";
  @Input() avatarIcon: string = "";

  isShow: boolean = true;





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }





  // Открыть панель
  openPanel(): void {
    this.isShow = true;
    document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
    this.changeDetectorRef.detectChanges();
  }

  // Закрыть панель
  closePanel(): void {
    this.isShow = false;
    document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
    this.changeDetectorRef.detectChanges();
  }
}
