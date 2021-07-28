import { Component, HostListener, OnInit } from "@angular/core";
import { ScreenService } from "@app/services/screen.service";





@Component({
  selector: "app-cube",
  templateUrl: "./cube.component.html",
  styleUrls: ["./cube.component.scss"]
})





export class CubeComponent implements OnInit {


  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private min: number = 90;
  private max: number = -90;

  public rotateX: number = 0;
  public rotateY: number = 0;





  public ngOnInit(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    window.addEventListener("mousemove", this.onRotate.bind(this), true);
  }

  private onRotate(event: MouseEvent): void {
    this.rotateX = this.dataCalculateFormula(this.min, this.max, this.screenWidth, event.pageX);
    this.rotateY = this.dataCalculateFormula(this.max, this.min, this.screenHeight, event.pageY);
  }

  @HostListener("window:resize", ["$event"])
  public onResize(event?: Event): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  // Формула расчета параметров
  private dataCalculateFormula(min: number, max: number, size: number, pos: number): number {
    return (((min - max) / size) * pos) + max;
  }
}
