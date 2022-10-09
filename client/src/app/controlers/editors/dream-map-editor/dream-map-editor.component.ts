import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatSliderChange } from "@angular/material/slider";
import { DreamMapViewerComponent, ObjectHoverEvent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";
import { SimpleObject } from "@_models/app";
import { DreamMap, DreamMapCeil, MapTerrain, MapTerrains, TexturePaths, XYCoord } from "@_models/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamCeilWaterParts, DreamDefHeight, DreamMaxHeight, DreamMinHeight, DreamWaterDefHeight } from "@_services/dream.service";
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
  toolSizeRoadLength: number = ToolSizeRoad.length - 1;
  form: FormGroup;

  private startX: number = -1;
  private startY: number = -1;
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
  roadTypeTool: typeof RoadTypeTool = RoadTypeTool;
  terrainList: MapTerrain[] = MapTerrains;
  roadTypeList: RoadTypeToolListItem[] = RoadTypeTools;
  waterTypeList: WaterTypeToolListItem[] = WaterTypeTools;

  // * Инструменты: общее
  private tool: Tool = Tool.landscape;
  toolSizeLand: number = ToolSizeLand[0];
  toolSizeRoad: number = ToolSizeRoad[0];
  private currentObject: ObjectHoverEvent = null;

  // * Инструменты: ландшафт
  private landscapeTool: LandscapeTool = LandscapeTool.up;

  // * Инструменты: местность
  currentTerrain: number = this.terrainList.find(t => t.id === 1).id;

  // * Инструменты: дорога
  roadType: RoadTypeTool = RoadTypeTool.road;

  // * Инструменты: вода
  waterType: WaterTypeTool = WaterTypeTool.sea;

  // ? Настройки работы редактора
  private toolActive: boolean = false;
  private toolActionTimer: number = 30;
  private terrainChangeStep: number = 1;

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

  // Текущий инструмент: дорога
  get getCurrentRoadTypeTool(): RoadTypeToolListItem {
    return this.roadTypeList.find(t => t.type === this.roadType) || this.roadTypeList[0];
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

  // Ключ текущего размера дороги
  private get getCurrentToolSizeRoad(): number {
    return ToolSizeRoad.findIndex(t => t === this.toolSizeRoad);
  }

  // Форматирование слайдера выбора размера дороги
  toolSizeRoadFormat(key: number = -1): number {
    const toolSizeRoad: number = key >= 0 ? ToolSizeRoad[key] : ToolSizeRoad[this.getCurrentToolSizeRoad];
    // Результат
    return toolSizeRoad;
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





  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.form = this.formBuilder.group({
      toolSizeLand: [this.getCurrentToolSizeLand],
      toolSizeRoad: [this.getCurrentToolSizeRoad],
      worldOceanHeight: [0],
      worldLandHeight: [0],
    });
  }

  ngOnInit() {
    fromEvent(document, "mouseup", this.onMouseUp.bind(this)).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnChanges(): void {
    this.form.get("worldOceanHeight").setValue(this.dreamMap.ocean.z ?? DreamWaterDefHeight);
    this.form.get("worldLandHeight").setValue(this.dreamMap.land.z ?? DreamDefHeight);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Нажатие кнопки мыши
  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      if (this.tool === Tool.landscape || this.tool === Tool.terrain || this.tool === Tool.road) {
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
        // Работа с дорогами
        case (Tool.road): {
          this.startX = this.currentObject.ceil.coord.x;
          this.startY = this.currentObject.ceil.coord.y;
          break;
        }
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
        // Вода
        case (Tool.water): {
          break;
        }
        // Дорога
        case (Tool.road): {
          this.startX = -1;
          this.startY = -1;
          break;
        }
      }
    }
  }

  // Пассивное действие: наведение курсора на объект
  private onToolActionPassive(): void {
    if (this.currentObject) {
      const tools: Set<Tool> = new Set([Tool.landscape, Tool.terrain, Tool.water, Tool.road]);
      // Работа с ландшафтом
      if (tools.has(this.tool)) {
        this.lightCeils();
      }
      // Очистить выделение
      else {
        this.unLightCeils();
      }
    }
  }

  // Изменение инструмента
  onToolChange(tool: Tool): void {
    this.tool = tool;
    // Убрать свечение
    this.unLightCeils();
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

  // Изменение высоты окружающего ландшафта
  onLandHeightChange(event: MatSliderChange): void {
    this.dreamMap.land.z = event.value ?? DreamDefHeight;
    // Установить высоту
    this.setLandHeight();
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменение размера кисти
  onToolSizeRoadChange(event: MatSliderChange): void {
    this.toolSizeRoad = ToolSizeRoad[event.value] || ToolSizeRoad[0];
  }

  // Изменение инструмента типа местности
  onTerrainChange(id: number): void {
    this.currentTerrain = this.terrainList.find(t => t.id === id).id || this.terrainList[0].id;
  }

  // Изменение инструмента типа дороги
  onRoadTypeChange(roadType: RoadTypeTool): void {
    this.roadType = roadType;
  }

  // Изменение инструмента типа воды
  onWaterTypeChange(waterType: WaterTypeTool): void {
    this.waterType = waterType;
  }





  // Свечение ячеек
  private lightCeils(): void {
    const circleSize: Set<Tool> = new Set([Tool.landscape, Tool.terrain]);
    const useSizeInput: Set<Tool> = new Set([Tool.landscape, Tool.terrain]);
    const size = useSizeInput.has(this.tool) ? this.toolSizeLand : 0;
    // Очистить карту
    this.unLightCeils();
    // Добавить свечение для инструментов ландшафта
    if (circleSize.has(this.tool)) {
      this.viewer.setTerrainHoverStatus(this.currentObject.ceil.coord.x, this.currentObject.ceil.coord.y, size);
    }
  }

  // Очистить свечение
  private unLightCeils(): void {
    const useSizeInput: Set<Tool> = new Set([Tool.landscape, Tool.terrain]);
    const size = useSizeInput.has(this.tool) ? this.toolSizeLand : 0;
    // Уюрать свечение
    this.viewer.setTerrainHoverStatus(-1, -1, size);
  }

  // Изменение высоты
  private ceilsHeight(direction: HeightDirection): void {
    const sizes: number[] = Array.from(Array(((this.toolSizeLand + 1) * 2) + 1).keys()).map(v => v - (this.toolSizeLand + 1));
    const count: number = sizes
      .map(cY => sizes.map(cX => {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
        // Вернуть значение
        if (this.isEditableCeil(x, y)) {
          const currentZ: number = ceil.coord.z;
          let zChange: number = Math.floor(
            ((this.toolSizeLand * this.terrainChangeStep) + 1 - ((Math.abs(cX) + Math.abs(cY)) * this.terrainChangeStep / 2)) /
            this.terrainChangeStep
          );
          zChange = direction === 0 ? (currentZ < z ? zChange : currentZ > z ? -zChange : 0) : zChange * direction;
          // Высота изменилась
          return zChange !== 0;
        }
        // Пусто
        return false;
      }))
      .filter(y => y.some(x => !!x))
      .map(y => y = y.filter(x => !!x))
      .filter(y => y.length > 0)
      .reduce((o, a) => o + a.length, 0);
    const z: number = direction === 0 ?
      this.startZ :
      this.viewer.getCeil(this.currentObject.ceil.coord.x, this.currentObject.ceil.coord.y).coord.z;
    let change: boolean = false;
    let i: number = 0;
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
          i++;
          // Обновить
          ceil.coord.originalZ = Math.floor(ceil.coord.originalZ + zChange);
          ceil.coord.originalZ = (corrDirection > 0 && ceil.coord.originalZ > z) || (corrDirection < 0 && ceil.coord.originalZ < z) ? z : ceil.coord.originalZ;
          ceil.coord.originalZ = ceil.coord.originalZ > this.viewer.maxCeilHeight ? this.viewer.maxCeilHeight : ceil.coord.originalZ;
          ceil.coord.originalZ = ceil.coord.originalZ < this.viewer.minCeilHeight ? this.viewer.minCeilHeight : ceil.coord.originalZ;
          ceil.coord.z = ceil.coord.originalZ;
          // Запомнить ячейку
          this.saveCeil(ceil);
        }
      }
    }));
    // Обновить
    if (change) {
      sizes.forEach(cY => sizes.forEach(cX => {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
        // Обновить
        this.viewer.setTerrainHeight(ceil, i === count);
      }));
    }
  }

  // Изменение типа местности
  private ceilsTerrain(): void {
    const sizes: number[] = Array.from(Array(((this.toolSizeLand + 1) * 2) + 1).keys()).map(v => v - (this.toolSizeLand + 1));
    const count: number = sizes
      .map(cY => sizes.map(cX => {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
        // Вернуть значение
        if (this.isEditableCeil(x, y)) {
          return ceil.terrain !== this.currentTerrain;
        }
        // Пусто
        return false;
      }))
      .filter(y => y.some(x => !!x))
      .map(y => y = y.filter(x => !!x))
      .filter(y => y.length > 0)
      .reduce((o, a) => o + a.length, 0);
    let i: number = 0;
    // Обход
    sizes.forEach(cY => sizes.forEach(cX => {
      const x: number = this.currentObject.ceil.coord.x + cX;
      const y: number = this.currentObject.ceil.coord.y + cY;
      // Ячейка внутри области выделения
      if (this.isEditableCeil(x, y)) {
        const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
        // Изменить местность
        if (ceil.terrain !== this.currentTerrain) {
          ceil.terrain = this.currentTerrain;
          i++;
          // Запомнить ячейку
          this.saveCeil(ceil);
          // Обновить
          this.viewer.setTerrain(ceil, i === count);
        }
      }
    }));
  }

  // Изменение высоты мирового океана
  private setOceanHeight(): void {
    this.viewer.setOceanHeight(this.dreamMap.ocean.z);
  }

  // Изменение высоты мирового океана
  private setLandHeight(): void {
    this.viewer.setLandHeight(this.dreamMap.land.z);
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





// Интерфейс водной области
interface WaterArea {
  ceils: XYCoord[];
  z: number;
}





// Перечисление инструментов: общее
enum Tool {
  landscape,
  terrain,
  water,
  road
};

// Перечисление инструментов: ландшафт
enum LandscapeTool {
  up,
  down,
  align
};

// Перечисление инструментов: дороги
enum RoadTypeTool {
  square,
  road
}

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

// Интерфейс списка инструментов: дороги
interface RoadTypeToolListItem extends ToolListItemBase {
  type: RoadTypeTool;
}

// Интерфейс списка инструментов: вода
interface WaterTypeToolListItem extends ToolListItemBase {
  type: WaterTypeTool;
}





// Типы размеров
const ToolSizeLand: number[] = [0, 1, 2, 3, 4];
const ToolSizeRoad: number[] = [1, 2, 3, 4, 5, 6];

// Список инструментов: общее
const Tools: ToolListItem[] = [
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
  // Работа с дорогами
  {
    type: Tool.road,
    name: "Дороги (изменять дороги, рельсы, тротуары)",
    icon: "edit_road"
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

// Список инструментов: дороги
const RoadTypeTools: RoadTypeToolListItem[] = [
  // Дорога
  {
    type: RoadTypeTool.road,
    name: "Дорога",
    icon: "add_road"
  },
  // Площадь
  {
    type: RoadTypeTool.square,
    name: "Парковка (площадка)",
    icon: "check_box_outline_blank"
  },
];


// Список инструментов: вода
const WaterTypeTools: WaterTypeToolListItem[] = [
  // Дорога
  {
    type: WaterTypeTool.sea,
    name: "Море (для всей карты)",
    icon: "zoom_out_map"
  },
];
