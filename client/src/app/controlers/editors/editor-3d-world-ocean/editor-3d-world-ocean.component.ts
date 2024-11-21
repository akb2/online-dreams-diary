import { CreateArray } from "@_datas/app";
import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "editor-3d-world-ocean",
  templateUrl: "./editor-3d-world-ocean.component.html",
  styleUrls: ["editor-3d-world-ocean.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Editor3DWorldOceanComponent {
  lines = CreateArray(8);
}
