import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { ObjectHoverEvent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";
import { DreamMap } from "@_models/dream-map";





@Component({
  selector: "app-dream-map-editor",
  templateUrl: "./dream-map-editor.component.html",
  styleUrls: ["./dream-map-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapEditorComponent {


  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = false;





  // Наведение курсора на объект
  onObjectHover(event: ObjectHoverEvent): void {
    console.log(event);
  }
}