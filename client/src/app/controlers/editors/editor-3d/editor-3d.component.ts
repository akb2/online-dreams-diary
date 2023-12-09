import { CreateArray } from "@_datas/app";
import { AngleByCoordsAndRadius, AngleInRange, CheckInRange, Cos, LineFunc, MathRound, MathRoundByStep, Sin } from "@_helpers/math";
import { CustomObjectKey } from "@_models/app";
import { DreamMap } from "@_models/dream-map";
import { NumberDirection } from "@_models/math";
import { CssProperties } from "@_models/nav-menu";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { Editor3DOverlaySettings, editor3DOverlaySettingsSelector, editor3DSetNoneOverlaySettingsStateAction, editor3DSetSkyTimeAction, editor3DShowControlsSelector, editor3DShowOverlaySettingsSelector, editor3DSkyTimeSelector, editor3DUpdateOverlaySettingsStateAction } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";
import { map } from "rxjs";

@Component({
  selector: "editor-3d",
  templateUrl: "./editor-3d.component.html",
  styleUrls: ["editor-3d.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Editor3DComponent implements OnInit {
  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = true;
  @Input() showCompass: boolean = true;

  @ViewChild("settingsTimeContainer", { read: ElementRef }) settingsTimeContainer: ElementRef<HTMLDivElement>;

  settingsTypes = Editor3DOverlaySettings;
  showingOverlay = true;

  skyTimeControl = CircleParamSettings.time;

  private serigRotateCorrect = -45;

  private skyTime$ = this.store$.select(editor3DSkyTimeSelector);
  showControls$ = this.store$.select(editor3DShowControlsSelector);
  showSettings$ = this.store$.select(editor3DShowOverlaySettingsSelector);
  currentSetting$ = this.store$.select(editor3DOverlaySettingsSelector);
  settingsSunStyles$ = this.skyTime$.pipe(map(skyTime => this.getSettingsTimeStyles(skyTime)));
  settingsMoonStyles$ = this.skyTime$.pipe(map(skyTime => this.getSettingsTimeStyles(skyTime, -1)));





  // Настройки засечки
  angleRotate(i: number, angle: number): number {
    return this.serigRotateCorrect + (angle * i);
  }

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
    private store$: Store,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.store$.dispatch(editor3DSetSkyTimeAction({ skyTime: this.dreamMap?.sky?.time }));
  }





  // Изменить настройки времени суток
  onTimeSettingsOpen(): void {
    this.store$.dispatch(editor3DUpdateOverlaySettingsStateAction({ overlaySettings: Editor3DOverlaySettings.time }));
  }

  // Скрыть настройки
  onCloseSettings(): void {
    this.store$.dispatch(editor3DSetNoneOverlaySettingsStateAction());
  }

  // Изменение времени суток
  onSkyTimeChange(event: MouseEvent | TouchEvent, multiplier: NumberDirection = 0): void {
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





  // Показать затенение
  showOverlay(): void {
    this.showingOverlay = true;
    this.changeDetectorRef.detectChanges();
  }

  // Показать затенение
  hideOverlay(): void {
    this.showingOverlay = false;
    this.changeDetectorRef.detectChanges();
  }
}





// Ключ параметра
type CircleParamKey = "time";

// Настройки кругового слайдера
class CircleParamSetting {
  private angles: [number, number] = [180, 360];

  serifItterator: number[];
  largeSerifItterator: number[];

  constructor(
    public step: number,
    public largeStep: number = 90,
    public fullCircle: boolean = false,
    public showSerifs = true,
    public showLargeSerifs = true
  ) {
    const angle = this.angles[fullCircle ? 1 : 0];
    const koof = fullCircle ? 0 : 1;
    // Обновить данные
    this.serifItterator = CreateArray((angle / this.step) + koof);
    this.largeSerifItterator = CreateArray((angle / this.largeStep) + koof);
  }
}

// Все настройки круговых слайдеров
const CircleParamSettings: CustomObjectKey<CircleParamKey, CircleParamSetting> = {
  time: new CircleParamSetting(10, 60)
};
