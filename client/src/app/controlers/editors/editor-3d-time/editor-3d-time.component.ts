import { AngleByCoordsAndRadius, AngleInRange, CheckInRange, Cos, LineFunc, MathRound, MathRoundByStep, Sin } from "@_helpers/math";
import { CircleParamSetting } from "@_helpers/special-inputs-param-settings";
import { NumberDirection } from "@_models/math";
import { CssProperties } from "@_models/nav-menu";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, ViewChild } from "@angular/core";
import { editor3DSetSkyTimeAction, editor3DSkyTimeSelector } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";
import { map } from "rxjs";

@Component({
  selector: "editor-3d-time",
  templateUrl: "./editor-3d-time.component.html",
  styleUrls: ["editor-3d-time.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Editor3DTimeComponent {

  @Output() showOverlay = new EventEmitter<void>();
  @Output() hideOverlay = new EventEmitter<void>();

  @ViewChild("settingsTimeContainer", { read: ElementRef }) settingsTimeContainer: ElementRef<HTMLDivElement>;

  private serigRotateCorrect = -45;

  skyTimeControl = new CircleParamSetting(10, 60);

  private skyTime$ = this.store$.select(editor3DSkyTimeSelector);

  settingsSunStyles$ = this.skyTime$.pipe(map(skyTime => this.getSettingsTimeStyles(skyTime)));
  settingsMoonStyles$ = this.skyTime$.pipe(map(skyTime => this.getSettingsTimeStyles(skyTime, -1)));





  // Базовые параметры настроек
  private getSettingsTimeStyles(skyTime: number, multiplier: NumberDirection = 1): CssProperties {
    const angle = AngleInRange(skyTime);
    const sin = Sin(angle) * multiplier;
    const cos = Cos(angle) * multiplier;
    const show = cos < 0 || (sin < 0 && cos === 0);
    const left = LineFunc(0, 100, sin, -1, 1) + "%";
    const top = LineFunc(0, 100, cos, -1, 1) + "%";
    const opacity = show ? 1 : 0.1;
    // Вернуть стили
    return { left, top, opacity };
  }





  constructor(
    private store$: Store
  ) { }





  // Настройки засечки
  angleRotate(i: number, angle: number): number {
    return this.serigRotateCorrect + (angle * i);
  }





  // Показать затенение
  onShowOverlay() {
    this.showOverlay.emit();
  }

  // Скрыть затенение
  onHideOverlay() {
    this.hideOverlay.emit();
  }

  // Изменение времени суток
  onSkyTimeChange(event: MouseEvent | TouchEvent, multiplier: NumberDirection = 0) {
    if (!!this.settingsTimeContainer?.nativeElement) {
      const container = this.settingsTimeContainer.nativeElement;
      const containerRect = container.getBoundingClientRect();
      const containerLeft = containerRect.left;
      const containerTop = containerRect.top;
      const containerWidth = containerRect.width / 2;
      const containerHeight = containerRect.height / 2;
      const mouseX = event instanceof MouseEvent ? event.clientX : 0;
      const mouseY = event instanceof MouseEvent ? event.clientY : 0;
      const positionX = CheckInRange(mouseX - containerLeft - containerWidth, containerWidth, -containerWidth);
      const positionY = CheckInRange(mouseY - containerTop - containerHeight, containerHeight, -containerHeight);
      const sin = MathRound(positionX / containerWidth, 5);
      const cos = MathRound(positionY / containerHeight, 5);
      const skyTime = MathRoundByStep(AngleInRange(AngleByCoordsAndRadius(sin, -cos) + (180 * multiplier) + 90), this.skyTimeControl.step);
      // Обновить время
      this.store$.dispatch(editor3DSetSkyTimeAction({ skyTime }));
    }
  }
}
