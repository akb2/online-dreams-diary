import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from "@angular/core";
import { CustomObject } from "@_models/app";





@Component({
  selector: "app-title",
  templateUrl: "./title.component.html",
  styleUrls: ["./title.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TitleComponent implements AfterViewChecked {
  @Input() type: TitleType = 1;
  @Input() icon: string;
  @Input() title: string = "Заголовок";
  @Input() subTitle: string;
  @Input() noMargin: boolean = false;

  @ViewChild("actionsPanel") private actionsPanel: ElementRef;

  showActionsPanel: boolean = false;





  // Класс поля
  get getClass(): CustomObject<boolean> {
    return {
      "no-margin": this.noMargin,
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
