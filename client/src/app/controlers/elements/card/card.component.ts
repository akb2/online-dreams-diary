import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from "@angular/core";
import { IconBackground, IconColor } from "@_models/app";





// Декоратор
@Component({
  selector: "app-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.scss"]
})

// Класс
export class CardComponent implements AfterViewInit {


  @Input() public title: string | null;
  @Input() public subTitle: string | null;
  @Input() public avatar: string | null;
  @Input() public avatarIcon: string | null;
  @Input() public avatarColor: IconColor = "primary";
  @Input() public avatarBackground: IconBackground = "transparent";
  @Input() public fullHeight: boolean = false;
  @Input() public routerLink: string | null;
  @Input() public queryParams: { [key: string]: string } | null;

  @ViewChild('contentPanel') private contentPanel: ElementRef;
  @ViewChild('actionsPanel') private actionsPanel: ElementRef;
  @ViewChild('menuPanelHelper') private menuPanelHelper: ElementRef;

  public showContentPanel: boolean = false;
  public showActionsPanel: boolean = false;
  public showMenuPanel: boolean = false;

  // Конструктор
  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) {
  }





  // После проверки элементов
  public ngAfterViewInit(): void {
    this.showContentPanel = this.contentPanel?.nativeElement?.children.length > 0;
    this.showActionsPanel = this.actionsPanel?.nativeElement?.children.length > 0;
    this.showMenuPanel = this.menuPanelHelper?.nativeElement?.children.length > 0;
    this.changeDetectorRef.detectChanges();
  }
}
