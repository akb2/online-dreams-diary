import { Component, ViewChild, ElementRef, OnInit, OnDestroy, Input } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";





@Component({
  selector: "app-recaptcha",
  templateUrl: "./app-recaptcha.component.html",
  styleUrls: ["./app-recaptcha.component.scss"]
})





export class AppRecaptchaComponent extends BaseInputDirective implements OnInit, OnDestroy {


  @ViewChild('container') layout: ElementRef;

  public siteKey: string = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  public scale: number = 0;
  public baseWidth: number = 304;
  public baseHeight: number = 78;
  public layoutWidth: number = 0;
  public layoutHeight: number = 0;





  // Конструктор
  public ngOnInit(): void {
    window.addEventListener("resize", this.onResize.bind(this), true);
    setTimeout(() => this.calculateWidth());
  }

  // Конец класса
  public ngOnDestroy(): void {
    window.removeEventListener("resize", this.onResize.bind(this), true);
  }

  // Капча пройдена
  public onResolved(code: string): void {
    this.control.setValue(code);
  }

  // Капча непройдена
  public onError(): void {
    this.control.setValue(null);
  }

  // Изменение размеров экрана
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
