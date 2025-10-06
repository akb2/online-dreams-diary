import { IconBackground, IconColor } from "@_models/app";
import { SimpleObject } from "@akb2/types-tools";
import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, ViewChild } from "@angular/core";





@Component({
  selector: "app-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CardComponent implements AfterViewChecked, OnChanges {


  @Input() mainTitle: string;
  @Input() subTitle: string;
  @Input() avatar: string;
  @Input() avatarIcon: string;
  @Input() avatarColor: IconColor = "primary";
  @Input() avatarBackground: IconBackground = "transparent";
  @Input() fullHeight: boolean = false;
  @Input() routerLink: string;
  @Input() queryParams: SimpleObject;
  @Input() changeDetection: boolean;

  @ViewChild("contentPanel") private contentPanel: ElementRef;
  @ViewChild("actionsPanel") private actionsPanel: ElementRef;
  @ViewChild("menuPanelHelper") private menuPanelHelper: ElementRef;

  showContentPanel: boolean = false;
  showActionsPanel: boolean = false;
  showMenuPanel: boolean = false;
  changeDetectionHelper: boolean;





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnChanges(): void {
    if (this.changeDetection != this.changeDetectionHelper) {
      this.changeDetectorRef.detectChanges();
    }
  }

  ngAfterViewChecked(): void {
    this.showContentPanel = !!this.contentPanel?.nativeElement?.children.length;
    this.showActionsPanel = !!this.actionsPanel?.nativeElement?.children.length;
    this.showMenuPanel = !!this.menuPanelHelper?.nativeElement?.children.length;
    this.changeDetectorRef.detectChanges();
  }
}
