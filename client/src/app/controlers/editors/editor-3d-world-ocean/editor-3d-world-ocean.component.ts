import { CreateArray } from "@_datas/app";
import { DreamCeilParts, DreamCeilSize, DreamMaxHeight, DreamMinHeight } from "@_datas/dream-map-settings";
import { CheckInRange, MathRoundByStep } from "@_helpers/math";
import { LineParamSetting } from "@_helpers/special-inputs-param-settings";
import { CssProperties } from "@_models/nav-menu";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, ViewChild } from "@angular/core";
import { editor3DSetWorldOceanHeightAction, editor3DWorldOceanHeightSelector } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";
import { map } from "rxjs";

@Component({
  selector: "editor-3d-world-ocean",
  templateUrl: "./editor-3d-world-ocean.component.html",
  styleUrls: ["editor-3d-world-ocean.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Editor3DWorldOceanComponent {

  @Output() showOverlay = new EventEmitter<void>();
  @Output() hideOverlay = new EventEmitter<void>();

  @ViewChild("settingsContainer", { read: ElementRef }) settingsContainer: ElementRef<HTMLDivElement>;

  lines = CreateArray(8);

  private maxOceanHeight = DreamMaxHeight;
  private minOceanHeight = DreamMinHeight;

  worldOceanHeightControl = new LineParamSetting(2, 10);

  private worldOceanHeight$ = this.store$.select(editor3DWorldOceanHeightSelector);

  settingsOceanLineStyles$ = this.worldOceanHeight$.pipe(map(worldOceanHeight => this.getSettingsOceanStyles(worldOceanHeight)));
  settingsOceanButtonStyles$ = this.worldOceanHeight$.pipe(map(worldOceanHeight => this.getSettingsOceanStyles(worldOceanHeight, true)));



  // Базовые параметры настроек
  private getSettingsOceanStyles(skyTime: number, invert = false): CssProperties {
    const rulerSize = this.maxOceanHeight - this.minOceanHeight;
    const bottom = (skyTime / rulerSize) * 100;
    const top = 100 - bottom;
    // Вернуть стили
    return invert
      ? { top: top + "%" }
      : { bottom: bottom + "%" };
  }



  constructor(
    private store$: Store
  ) { }



  // Показать затенение
  onShowOverlay() {
    this.showOverlay.emit();
  }

  // Скрыть затенение
  onHideOverlay() {
    this.hideOverlay.emit();
  }

  // Изменение уровня мирового океана
  onWorldOceanTimeChange(event: MouseEvent | TouchEvent) {
    const container = this.settingsContainer?.nativeElement;
    // Вычисление если контейнер существует
    if (!!container) {
      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerHeight = containerRect.height;
      const mouseY = event instanceof MouseEvent
        ? event.clientY
        : 0;
      const positionY = MathRoundByStep(
        CheckInRange(containerHeight - (mouseY - containerTop), containerHeight),
        (this.worldOceanHeightControl.step / (this.worldOceanHeightControl.maxValue - this.worldOceanHeightControl.minValue)) * containerHeight
      );
      const worldOceanHeight = positionY / containerHeight * (this.maxOceanHeight - this.minOceanHeight);
      // Обновить высоту мирового океана
      this.store$.dispatch(editor3DSetWorldOceanHeightAction({ worldOceanHeight }));
    }
  }
}
