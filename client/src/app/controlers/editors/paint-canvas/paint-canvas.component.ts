import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from "@angular/core";





@Component({
  selector: "app-paint-canvas",
  templateUrl: "paint-canvas.component.html",
  styleUrls: ["paint-canvas.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PaintCanvasComponent {


  @ViewChild('canvas', { static: false, read: ElementRef }) canvasElement: ElementRef;


}
