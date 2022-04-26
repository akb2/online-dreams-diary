import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";





@Component({
  selector: "app-inform",
  templateUrl: "./inform.component.html",
  styleUrls: ["./inform.component.scss"]
})

export class InformComponent implements OnInit, AfterViewInit {


  @Input() public icon: string = "loader";
  @Input() public title: string;
  @Input() public subTitle: string;
  @Input() public description: string;

  @ViewChild("descriptionPanel") private descriptionPanel: ElementRef;

  showDescriptionPanel: boolean = false;





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.icon = this.icon ? this.icon : "loader"
  }

  ngAfterViewInit(): void {
    this.showDescriptionPanel = this.descriptionPanel?.nativeElement?.children.length > 0;
    this.changeDetectorRef.detectChanges();
  }
}
