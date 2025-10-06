import { IconBackground, IconColor } from "@_models/app";
import { CustomObject } from "@akb2/types-tools";
import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from "@angular/core";





@Component({
  selector: "app-title",
  templateUrl: "./title.component.html",
  styleUrls: ["./title.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TitleComponent implements AfterViewChecked {


  @Input() type: TitleType = 1;
  @Input() icon: string;
  @Input() iconColor: IconColor | "basic" = "basic";
  @Input() iconBackground: IconBackground = "transparent";
  @Input() mainTitle: string = "Заголовок";
  @Input() subTitle: string;
  @Input() noMargin: boolean = false;
  @Input() revertTitles: boolean = false;
  @Input() oneLine: boolean = false;

  @ViewChild("actionsPanel") private actionsPanel: ElementRef;

  showActionsPanel: boolean = false;





  // Класс поля
  get getClass(): CustomObject<boolean> {
    return {
      "revert-titles": this.revertTitles,
      "no-margin": this.noMargin,
      "one-line": this.oneLine,
      image: !!this.icon,
      subtitle: !!this.subTitle,
      actions: this.showActionsPanel
    };
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngAfterViewChecked(): void {
    this.checkPanels();
  }





  // Проверить наличие панелей
  private checkPanels(): void {
    this.showActionsPanel = !!this.actionsPanel?.nativeElement?.children?.length;
    this.changeDetectorRef.detectChanges();
  }
}





// Типы заголовка
type TitleType = 1 | 2 | 3 | 4 | 5;
