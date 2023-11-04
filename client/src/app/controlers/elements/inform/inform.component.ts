import { IconColor } from "@_models/app";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subject, filter, takeUntil, timer } from "rxjs";





@Component({
  selector: "app-inform",
  templateUrl: "./inform.component.html",
  styleUrls: ["./inform.component.scss"]
})

export class InformComponent implements OnInit, AfterViewInit, OnDestroy {


  @Input() icon: string = "loader";
  @Input() aboveIcon: boolean = false;
  @Input() smallMargins: boolean = false;
  @Input() color: IconColor | "white" = "primary";
  @Input() mainTitle: string;
  @Input() subTitle: string;
  @Input() description: string;
  @Input() waitPointers: boolean = false;

  @ViewChild("descriptionPanel") private descriptionPanel: ElementRef;

  showDescriptionPanel: boolean = false;

  currentPointers: number = 0;
  private maxPointers: number = 3;
  private pointersTimer: number = 450;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.icon = this.icon ? this.icon : "loader";
    // Анимация точек
    timer(0, this.pointersTimer)
      .pipe(
        filter(() => this.waitPointers),
        takeUntil(this.destroyed$)
      )
      .subscribe(() => {
        this.currentPointers = this.currentPointers < this.maxPointers ? this.currentPointers + 1 : 0;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngAfterViewInit(): void {
    this.showDescriptionPanel = !!this.descriptionPanel?.nativeElement?.children?.length;
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
