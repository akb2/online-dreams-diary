import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatSliderChange } from "@angular/material/slider";
import { DreamMapViewerComponent, ObjectHoverEvent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";
import { CreateArray, SimpleObject } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, MapTerrain, MapTerrains, TexturePaths } from "@_models/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamCeilWaterParts, DreamDefHeight, DreamMaxHeight, DreamMinHeight, DreamSkyTime, DreamWaterDefHeight } from "@_models/dream-map-settings";
import { fromEvent, Subject, takeUntil, takeWhile, tap, timer } from "rxjs";





@Component({
  selector: "app-dream-map-editor",
  templateUrl: "./dream-map-editor.component.html",
  styleUrls: ["./dream-map-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapEditorComponent implements OnInit, OnChanges, OnDestroy {


  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = false;

  @ViewChild(DreamMapViewerComponent) private viewer: DreamMapViewerComponent;

  toolList: ToolListItem[] = Tools;
  landscapeToolList: LandscapeToolListItem[] = LandscapeTools;
  toolSizeLandLength: number = ToolSizeLand.length - 1;
  form: FormGroup;

  private startZ: number = -1;

  oceanMinZ: number = DreamMinHeight;
  oceanMaxZ: number = DreamMaxHeight;
  oceanStepZ: number = DreamCeilSize / DreamCeilParts;
  landMinZ: number = DreamMinHeight;
  landMaxZ: number = DreamMaxHeight;
  landStepZ: number = DreamCeilSize / DreamCeilParts;

  // Списки параметров
  toolType: typeof Tool = Tool;
  landscapeToolType: typeof LandscapeTool = LandscapeTool;
  terrainList: MapTerrain[] = MapTerrains;
  waterTypeList: WaterTypeToolListItem[] = WaterTypeTools;

  // * Инструменты: общее
  private tool: Tool = Tool.landscape;
  toolSizeLand: number = ToolSizeLand[2];
  private currentObject: ObjectHoverEvent = null;

  // * Инструменты: ландшафт
  private landscapeTool: LandscapeTool = LandscapeTool.up;

  // * Инструменты: местность
  currentTerrain: number = this.terrainList.find(t => t.id === 2).id;

  // * Инструменты: вода
  waterType: WaterTypeTool = WaterTypeTool.sea;

  // ? Настройки работы редактора
  private toolActive: boolean = false;
  private toolActionTimer: number = 20;
  private terrainChangeStep: number = 1;
  timeSettings: SliderSettings = { min: 0, max: 360, step: 1 };

  private destroy$: Subject<void> = new Subject<void>();





  // Координата внутри области редактирования
  private isEditableCeil(x: number, y: number): boolean {
    const cX: number = Math.round(this.currentObject.ceil.coord.x - x);
    const cY: number = Math.round(this.currentObject.ceil.coord.y - y);
    // Вернуть результат проверки
    return (
      (
        ((cX * cX) + (cY * cY) < (this.toolSizeLand * 2) + 1 && this.toolSizeLand === 0) ||
        ((cX * cX) + (cY * cY) <= Math.pow(this.toolSizeLand + 0.5, 2) && this.toolSizeLand > 0)
      ) &&
      x >= 0 &&
      y >= 0 &&
      x < this.dreamMap.size.width &&
      y < this.dreamMap.size.height
    );
  }

  // Текущий инструмент: общее
  get getCurrentTool(): ToolListItem {
    return this.toolList.find(t => t.type === this.tool) || this.toolList[0];
  }

  // Текущий инструмент: ландшафт
  get getCurrentLandscapeTool(): LandscapeToolListItem {
    return this.landscapeToolList.find(t => t.type === this.landscapeTool) || this.landscapeToolList[0];
  }

  // Текущий инструмент: вода
  get getCurrentWaterTypeTool(): WaterTypeToolListItem {
    return this.waterTypeList.find(t => t.type === this.waterType) || this.waterTypeList[0];
  }

  // Ключ текущего размера кисти
  private get getCurrentToolSizeLand(): number {
    return ToolSizeLand.findIndex(t => t === this.toolSizeLand);
  }

  // Форматирование слайдера выбора размера кисти
  toolSizeLandFormat(key: number = -1): number {
    const toolSizeLand: number = key >= 0 ? ToolSizeLand[key] : ToolSizeLand[this.getCurrentToolSizeLand];
    // Результат
    return 1 + (toolSizeLand * 2);
  }

  // Форматирование слайдера выбора высоты мирового океана
  get oceanHeightFormat(): number {
    let key: number = this.dreamMap.ocean.z ?? this.form.get("worldOceanHeight")?.value ?? DreamWaterDefHeight;
    key = key > this.oceanMaxZ ? this.oceanMaxZ : key;
    key = key < this.oceanMinZ ? this.oceanMinZ : key;
    // В процентах
    const value: number = Math.round(key / this.oceanMaxZ * 100);
    // Результат
    return value;
  }

  // Форматирование слайдера выбора высоты ландшафта
  get landHeightFormat(): number {
    let key: number = this.dreamMap.land.z ?? this.form.get("worldLandHeight")?.value ?? DreamDefHeight;
    key = key > this.landMaxZ ? this.landMaxZ : key;
    key = key < this.landMinZ ? this.landMinZ : key;
    // В процентах
    const value: number = Math.round(key / this.landMaxZ * 100);
    // Результат
    return value;
  }

  // Форматирование слайдера выбора высоты ландшафта
  timeFormat(asPercent: boolean = false): string {
    let value: string;
    let key: number = this.form.get("currentTime")?.value ?? 90;
    key = key >= this.timeSettings.max ? this.timeSettings.max - 1 : key;
    key = key < this.timeSettings.min ? this.timeSettings.min : key;
    // В процентах
    if (asPercent) {
      value = Math.round(key / (this.timeSettings.max - 1) * 100).toString();
    }
    // В формате 24 часов
    else {
      const hours: number = 24;
      const minutes: number = 60;
      const minutesInADay: number = hours * minutes;
      const allMinutes: number = key / this.timeSettings.max * minutesInADay;
      const hour: number = Math.floor(allMinutes / minutes);
      const minute: number = Math.floor(allMinutes - (hour * minutes));
      // Записать значение
      value = ("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2);
    }
    // Результат
    return value;
  }

  // Сведения о текущем материале
  get terrainInfo(): MapTerrain {
    return this.terrainList.find(t => t.id === this.currentTerrain)! || this.terrainList[0];
  }

  // Сведения о текущем материале
  set terrainInfo(data: MapTerrain) {
    MapTerrains[MapTerrains.findIndex(t => t.id === this.currentTerrain)] = { ...data };
  }

  // Ссылка на тип местности
  getTerrainImage(id: number): string {
    if (this.terrainList.some(t => t.id === id)) {
      const terrain: MapTerrain = this.terrainList.find(t => t.id === id)!;
      // Ссылка на картинку
      return TexturePaths.face + terrain.name + "." + terrain.exts.face;
    }
    // Картинка не найдена
    return "";
  }

  // Данные карты
  get getMap(): DreamMap {
    return this.viewer.getMap;
  }

  // Стили размера кисти
  get toolSizeStyles(): SimpleObject {
    return {
      width: this.toolSizeLandFormat() + "px",
      height: this.toolSizeLandFormat() + "px"
    };
  }

  // Проверка сенсорного экрана
  private get isTouchDevice(): boolean {
    return "ontouchstart" in window || !!navigator?.maxTouchPoints;
  }





  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.form = this.formBuilder.group({
      toolSizeLand: [this.getCurrentToolSizeLand],
      currentTime: [0],
      worldOceanHeight: [0],
    });
  }

  ngOnInit() {
    const enterEvent = this.isTouchDevice ? "touchend" : "mouseup";
    // События
    fromEvent(document, enterEvent, this.onMouseUp.bind(this)).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnChanges(): void {
    this.form.get("worldOceanHeight").setValue(this.dreamMap.ocean.z ?? DreamWaterDefHeight);
    this.form.get("currentTime").setValue(this.dreamMap.sky.time ?? DreamSkyTime);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Нажатие кнопки мыши
  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      if (this.tool === Tool.landscape || this.tool === Tool.terrain) {
        this.toolActive = true;
        this.onToolActionBeforeActive();
      }
      // Цикл по активности
      if (this.toolActive) {
        timer(0, this.toolActionTimer).pipe(tap(this.onToolActionCycle.bind(this)))
          .pipe(takeWhile(() => this.toolActive), takeUntil(this.destroy$))
          .subscribe();
      }
    }
  }

  // Отпускание кнопки мыши
  private onMouseUp(): void {
    this.onToolActionAfterActive();
    // Окончить действие
    this.toolActive = false;
    this.currentObject = null;
  }

  // Наведение курсора на объект
  onObjectHover(event: ObjectHoverEvent): void {
    if (this.viewer) {
      const noChangeCoords: Set<Tool> = new Set([Tool.water]);
      const partSize: number = DreamCeilSize / DreamCeilWaterParts;
      const prevZ: number = Math.round((this.currentObject?.point.z || 0) / partSize) * partSize;
      const currZ: number = Math.round((event.point.z || 0) / partSize) * partSize;
      // Проверка пересечения
      if (
        (
          !noChangeCoords.has(this.tool) && (
            !this.currentObject ||
            this.currentObject.ceil.coord.x !== event.ceil.coord.x ||
            this.currentObject.ceil.coord.y !== event.ceil.coord.y
          )
        ) ||
        (noChangeCoords.has(this.tool) && prevZ !== currZ)
      ) {
        this.currentObject = event;
        // Пассивные действия
        this.onToolActionPassive();
      }
    }
  }

  // Активное действие: ЛКМ зажимается
  private onToolActionBeforeActive(): void {
    if (this.currentObject && this.toolActive) {
      switch (this.tool) {
        // Работа с ландшафтом
        case (Tool.landscape): switch (this.landscapeTool) {
          // Выравнивание
          case (LandscapeTool.align):
            this.startZ = this.viewer.getCeil(this.currentObject.ceil.coord.x, this.currentObject.ceil.coord.y).coord.z;
            break;
        }; break;
      }
    }
  }

  // Активное действие в цикле: ЛКМ зажата
  private onToolActionCycle(): void {
    if (this.currentObject && this.toolActive) {
      switch (this.tool) {
        // Работа с ландшафтом
        case (Tool.landscape): switch (this.landscapeTool) {
          // Работа с ландшафтом: поднять
          case (LandscapeTool.up): this.ceilsHeight(1); break;
          // Работа с ландшафтом: опустить
          case (LandscapeTool.down): this.ceilsHeight(-1); break;
          // Работа с ландшафтом: выровнять
          case (LandscapeTool.align): this.ceilsHeight(0); break;
        }; break;
        // Работа с типом местности
        case (Tool.terrain):
          this.ceilsTerrain(); break;
      }
    }
  }

  // Активное действие: ЛКМ отпускается
  private onToolActionAfterActive(): void {
    if (this.currentObject && this.toolActive) {
      switch (this.tool) {
      }
    }
  }

  // Пассивное действие: наведение курсора на объект
  private onToolActionPassive(): void {
    if (!!this.currentObject) {
      const tools: Set<Tool> = new Set([Tool.landscape, Tool.terrain]);
      // Работа с ландшафтом
      if (tools.has(this.tool)) {
        this.lightCeils();
      }
      // Очистить выделение
      else {
        this.lightCeils(true);
      }
    }
    // Очистить выделение
    else {
      this.lightCeils(true);
    }
  }

  // Изменение инструмента
  onToolChange(tool: Tool): void {
    this.tool = tool;
    // Убрать свечение
    this.lightCeils(true);
  }

  // Изменение инструмента ландшафт
  onLandscapeToolChange(tool: LandscapeTool): void {
    this.landscapeTool = tool;
  }

  // Изменение размера кисти
  onToolSizeLandChange(event: MatSliderChange): void {
    this.toolSizeLand = ToolSizeLand[event.value] || ToolSizeLand[0];
  }

  // Изменение высоты мирового океана
  onOceanHeightChange(event: MatSliderChange): void {
    this.dreamMap.ocean.z = event.value ?? DreamWaterDefHeight;
    // Установить высоту
    this.setOceanHeight();
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменение времени
  onTimeChange(event: MatSliderChange): void {
    this.dreamMap.sky.time = event.value ?? DreamSkyTime;
    this.form.get("currentTime").setValue(this.dreamMap.sky.time);
    // Установить высоту
    this.setSkyTime();
    // Обновить
    this.changeDetectorRef.detectChanges();

  }

  // Изменение инструмента типа местности
  onTerrainChange(id: number): void {
    this.currentTerrain = this.terrainList.find(t => t.id === id).id || this.terrainList[0].id;
  }

  // Изменение инструмента типа воды
  onWaterTypeChange(waterType: WaterTypeTool): void {
    this.waterType = waterType;
  }





  // Свечение ячеек
  private lightCeils(unLight: boolean = false): void {
    this.viewer.setTerrainHoverStatus(!!this.currentObject && !unLight ? this.currentObject.ceil : null, this.toolSizeLand);
  }

  // Изменение высоты
  private ceilsHeight(direction: HeightDirection): void {
    const sizes: number[] = CreateArray((this.toolSizeLand * 2) + 1).map(v => v - this.toolSizeLand);
    const z: number = direction === 0 ?
      this.startZ :
      this.viewer.getCeil(this.currentObject.ceil.coord.x, this.currentObject.ceil.coord.y).coord.z;
    let change: boolean = false;
    // Обход
    sizes.forEach(cY => sizes.forEach(cX => {
      const x: number = this.currentObject.ceil.coord.x + cX;
      const y: number = this.currentObject.ceil.coord.y + cY;
      // Ячейка внутри области выделения
      if (this.isEditableCeil(x, y)) {
        const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
        const currentZ: number = ceil.coord.z;
        let corrDirection: HeightDirection = 0;
        let zChange: number = Math.floor(
          ((this.toolSizeLand * this.terrainChangeStep) + 1 - ((Math.abs(cX) + Math.abs(cY)) * this.terrainChangeStep / 2)) /
          this.terrainChangeStep
        );
        // Изменение высоты: выравнивание
        if (direction === 0) {
          corrDirection = currentZ < z ? 1 : currentZ > z ? -1 : 0;
          zChange = currentZ < z ? zChange : currentZ > z ? -zChange : 0;
        }
        // Изменение высоты: вверх / вниз
        else {
          zChange *= direction;
        }
        // Корректировка высоты
        if (zChange !== 0) {
          change = true;
          // Обновить
          ceil.coord.originalZ = Math.floor(ceil.coord.originalZ + zChange);
          ceil.coord.originalZ = (corrDirection > 0 && ceil.coord.originalZ > z) || (corrDirection < 0 && ceil.coord.originalZ < z) ? z : ceil.coord.originalZ;
          ceil.coord.originalZ = ceil.coord.originalZ > DreamMaxHeight ? DreamMaxHeight : ceil.coord.originalZ;
          ceil.coord.originalZ = ceil.coord.originalZ < DreamMinHeight ? DreamMinHeight : ceil.coord.originalZ;
          ceil.coord.z = ceil.coord.originalZ;
          // Запомнить ячейку
          this.saveCeil(ceil);
        }
      }
    }));
    // Обновить
    if (change) {
      const ceils = sizes.map(cY => sizes.map(cX => {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        // Вернуть ячейку
        return this.viewer.getCeil(x, y);
      })).reduce((o, c) => ([...o, ...c]), []);
      // Обновить
      this.viewer.setTerrainHeight(ceils);
    }
  }

  // Изменение типа местности
  private ceilsTerrain(): void {
    const sizes: number[] = CreateArray(((this.toolSizeLand + 1) * 2) + 1).map(v => v - (this.toolSizeLand + 1));
    const oldTerrains: number[] = [];
    let i: number = 0;
    // Обход
    const ceils: DreamMapCeil[] = sizes
      .map(cY => sizes.map(cX => {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        // Ячейка внутри области выделения
        if (this.isEditableCeil(x, y)) {
          const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
          // Изменить местность
          if (ceil.terrain !== this.currentTerrain) {
            oldTerrains[i] = ceil.terrain;
            // Заменить тип местности
            ceil.terrain = this.currentTerrain;
            i++;
            // Запомнить ячейку
            this.saveCeil(ceil);
            // Вернуть обновленную ячейку
            return ceil;
          }
        }
        // Нередактируемая ячейка
        return null;
      }))
      .reduce((o, c) => ([...o, ...c]), [])
      .filter(c => !!c);
    // Обновить
    this.viewer.setTerrain(ceils, oldTerrains);
  }

  // Изменение высоты мирового океана
  private setOceanHeight(): void {
    this.viewer.setOceanHeight(this.dreamMap.ocean.z);
  }

  // Изменить время для положения небесных светил
  private setSkyTime(): void {
    this.viewer.setSkyTime(this.dreamMap.sky.time);
  }





  // Запомнить ячейку
  private saveCeil(ceil: DreamMapCeil): void {
    const findCeil: (c: DreamMapCeil) => boolean = (c: DreamMapCeil) => c.coord.x === ceil.coord.x && c.coord.y === ceil.coord.y;
    // Удалить имеющуюся ячейку
    if (this.dreamMap.ceils.some(findCeil)) {
      this.dreamMap.ceils.splice(this.dreamMap.ceils.findIndex(findCeil), 1);
    }
    // Запомнить ячейку
    this.dreamMap.ceils.push(ceil);
  }
}





// Перечисление инструментов: общее
enum Tool {
  sky,
  landscape,
  terrain,
  water,
};

// Перечисление инструментов: ландшафт
enum LandscapeTool {
  up,
  down,
  align
};

// Перечисление инструментов: вода
enum WaterTypeTool {
  sea
}

// Направления высоты
type HeightDirection = - 1 | 0 | 1;





// Интерфейс списка инструментов: базовый интерфейс
interface ToolListItemBase {
  name: string;
  icon: string;
}

// Интерфейс списка инструментов: общее
interface ToolListItem extends ToolListItemBase {
  type: Tool;
}

// Интерфейс списка инструментов: ландшафт
interface LandscapeToolListItem extends ToolListItemBase {
  type: LandscapeTool;
}

// Интерфейс списка инструментов: вода
interface WaterTypeToolListItem extends ToolListItemBase {
  type: WaterTypeTool;
}

// Интерфейс параметров слайдера
interface SliderSettings {
  min: number;
  max: number;
  step: number;
}

// Интерфейс данных о фоновом ландшафте
interface OutMapReliefData {
  key: keyof ClosestHeights | "center";
}





// Типы размеров
const ToolSizeLand: number[] = [0, 1, 2, 3, 4, 5, 6, 7];

// Список инструментов: общее
const Tools: ToolListItem[] = [
  // Работа с окружением
  {
    type: Tool.sky,
    name: "Окружением",
    icon: "light_mode"
  },
  // Работа с ландшафтом
  {
    type: Tool.landscape,
    name: "Ландшафт (изменять рельеф)",
    icon: "landscape"
  },
  // Работа с типами местности
  {
    type: Tool.terrain,
    name: "Материалы (изменять тип местности)",
    icon: "grass"
  },
  // Работа с водой
  {
    type: Tool.water,
    name: "Вода (изменять водные пространства)",
    icon: "water_drop"
  },
];

// Список инструментов: ландшафт
const LandscapeTools: LandscapeToolListItem[] = [
  // Поднять землю
  {
    type: LandscapeTool.up,
    name: "Горы (поднять рельеф)",
    icon: "vertical_align_top"
  },
  // Опустить землю
  {
    type: LandscapeTool.down,
    name: "Ямы (опустить рельеф)",
    icon: "vertical_align_bottom"
  },
  // Выровнять землю
  {
    type: LandscapeTool.align,
    name: "Равнина (выровнять рельеф)",
    icon: "vertical_align_center"
  },
];

// Список инструментов: вода
const WaterTypeTools: WaterTypeToolListItem[] = [
  // Общая вода
  {
    type: WaterTypeTool.sea,
    name: "Море (для всей карты)",
    icon: "zoom_out_map"
  },
];
