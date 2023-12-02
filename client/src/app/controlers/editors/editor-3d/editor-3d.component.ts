import { DreamMap } from "@_models/dream-map";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { editor3DInitialLoaderSelector } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";

@Component({
  selector: "editor-3d",
  templateUrl: "./editor-3d.component.html",
  styleUrls: ["editor-3d.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Editor3DComponent {
  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = true;
  @Input() showCompass: boolean = true;

  showControls$ = this.store$.select(editor3DInitialLoaderSelector);





  constructor(
    private store$: Store
  ) { }
}
