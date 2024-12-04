import { Viewer3DComponent } from "@_controlers/viewer-3d/viewer-3d.component";
import { DreamMap } from "@_models/dream-map";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from "@angular/core";
import { appSetUserSelectAction } from "@app/reducers/app";
import { Editor3DOverlaySettings, editor3DOverlaySettingsSelector, editor3DSetNoneOverlaySettingsStateAction, editor3DSetSkyTimeAction, editor3DSetWorldOceanHeightAction, editor3DShowControlsSelector, editor3DShowOverlaySettingsSelector, editor3DUpdateOverlaySettingsStateAction } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";

@Component({
  selector: "editor-3d",
  templateUrl: "./editor-3d.component.html",
  styleUrls: ["editor-3d.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Editor3DComponent implements OnInit {
  @Input() dreamMap: DreamMap;
  @Input() debugInfo = true;
  @Input() showCompass = true;

  @ViewChild("viewerComponent", { read: Viewer3DComponent }) viewerComponent!: Viewer3DComponent;

  showingOverlay = true;
  settingsTypes = Editor3DOverlaySettings;

  showControls$ = this.store$.select(editor3DShowControlsSelector);
  showSettings$ = this.store$.select(editor3DShowOverlaySettingsSelector);
  currentSetting$ = this.store$.select(editor3DOverlaySettingsSelector);



  // Данные карты
  get getMap(): DreamMap {
    return this.viewerComponent?.getMap;
  }



  constructor(
    private store$: Store,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.store$.dispatch(editor3DSetSkyTimeAction({ skyTime: this.dreamMap?.sky?.time }));
    this.store$.dispatch(editor3DSetWorldOceanHeightAction({ worldOceanHeight: this.dreamMap?.ocean?.z }));
  }



  // Изменить настройки времени суток
  onTimeSettingsOpen() {
    this.store$.dispatch(editor3DUpdateOverlaySettingsStateAction({ overlaySettings: Editor3DOverlaySettings.time }));
  }

  // Изменить настройки мирового океана
  onWorldOceanSettingsOpen() {
    this.store$.dispatch(editor3DUpdateOverlaySettingsStateAction({ overlaySettings: Editor3DOverlaySettings.worldOcean }));
  }

  // Скрыть настройки
  onCloseSettings() {
    this.store$.dispatch(editor3DSetNoneOverlaySettingsStateAction());
  }



  // Показать затенение
  showOverlay() {
    this.showingOverlay = true;
    this.store$.dispatch(appSetUserSelectAction({ userSelect: true }));
    this.changeDetectorRef.detectChanges();
  }

  // Скрыть затенение
  hideOverlay() {
    this.showingOverlay = false;
    this.store$.dispatch(appSetUserSelectAction({ userSelect: false }));
    this.changeDetectorRef.detectChanges();
  }
}
