import { DreamMap } from "@_models/dream-map";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Editor3DOverlaySettings, editor3DOverlaySettingsSelector, editor3DSetNoneOverlaySettingsState, editor3DShowControlsSelector, editor3DShowOverlaySettingsSelector, editor3DUpdateOverlaySettingsState } from "@app/reducers/viewer-3d";
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

  showControls$ = this.store$.select(editor3DShowControlsSelector);
  showSettings$ = this.store$.select(editor3DShowOverlaySettingsSelector);
  currentSetting$ = this.store$.select(editor3DOverlaySettingsSelector);





  constructor(
    private store$: Store
  ) { }





  // Изменить настройки времени суток
  onTimeSettingsOpen(): void {
    this.store$.dispatch(editor3DUpdateOverlaySettingsState({ overlaySettings: Editor3DOverlaySettings.time }));
  }

  // Скрыть настройки
  onCloseSettings(): void {
    this.store$.dispatch(editor3DSetNoneOverlaySettingsState());
  }
}
