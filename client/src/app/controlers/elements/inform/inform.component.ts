import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { IconColor } from "@_models/app";





@Component({
  selector: "app-inform",
  templateUrl: "./inform.component.html",
  styleUrls: ["./inform.component.scss"]
})

export class InformComponent implements OnInit, AfterViewInit {


  @Input() icon: string = "loader";
  @Input() aboveIcon: boolean = false;
  @Input() smallMargins: boolean = false;
  @Input() color: IconColor | "white" = "primary";
  @Input() title: string;
  @Input() subTitle: string;
  @Input() description: string;

  @ViewChild("descriptionPanel") private descriptionPanel: ElementRef;

  showDescriptionPanel: boolean = false;





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.icon = this.icon ? this.icon : "loader"
  }

  ngAfterViewInit(): void {
    this.showDescriptionPanel = !!this.descriptionPanel?.nativeElement?.children?.length;
    this.changeDetectorRef.detectChanges();
  }
}
