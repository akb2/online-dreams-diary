import { Component, Output, EventEmitter, HostListener, ViewChild, ElementRef, OnInit } from "@angular/core";





@Component({
  selector: "app-recaptcha",
  templateUrl: "./app-recaptcha.component.html",
  styleUrls: ["./app-recaptcha.component.scss"]
})





export class AppRecaptchaComponent implements OnInit {


  @Output() public resolvedCallback: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('container') layout: ElementRef;

  public siteKey: string = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  public scale: number = 0;
  public baseWidth: number = 304;
  public baseHeight: number = 78;
  private layoutWidth: number = 0;
  public layoutHeight: number = 0;





  // Конструктор
  public ngOnInit(): void {
    setTimeout(() => this.calculateWidth());
  }

  // Капча пройдена
  public onResolved(code: string): void {
    this.resolvedCallback.emit(code);
  }

  // Изменение размеров экрана
  @HostListener("window:resize", ["$event"])
  public onResize(event?: Event): void {
    this.calculateWidth();
  }





  // Подсчитать ширину капчи
  public calculateWidth(): void {
    this.layoutWidth = this.layout.nativeElement.clientWidth;
    this.scale = this.layoutWidth / this.baseWidth;
    this.layoutHeight = this.baseHeight * this.scale;
  }
}
