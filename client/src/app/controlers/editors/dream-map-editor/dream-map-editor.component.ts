import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatSliderChange } from "@angular/material/slider";
import { DreamMapViewerComponent, ObjectHoverEvent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";
import { SimpleObject } from "@_models/app";
import { DreamMap, DreamMapCeil, MapTerrain, MapTerrainSettings, XYCoord } from "@_models/dream-map";
import { MapTerrains } from "@_services/dream-map/terrain.service";
import { DreamCeilSize, DreamCeilWaterParts, DreamMapSize } from "@_services/dream.service";
import { fromEvent, Subject, takeUntil, takeWhile, tap, timer } from "rxjs";





@Component({
  selector: "app-dream-map-editor",
  templateUrl: "./dream-map-editor.component.html",
  styleUrls: ["./dream-map-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapEditorComponent implements OnInit, OnDestroy {


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

  // Списки параметров
  toolType: typeof Tool = Tool;
  landscapeToolType: typeof LandscapeTool = LandscapeTool;
  roadTypeTool: typeof RoadTypeTool = RoadTypeTool;
  terrainList: MapTerrain[] = MapTerrains;
  roadTypeList: RoadTypeToolListItem[] = RoadTypeTools;

  // * Инструменты: общее
  private tool: Tool = Tool.water;
  toolSizeLand: number = ToolSizeLand[0];
  toolSizeRoad: number = ToolSizeRoad[0];
  private currentObject: ObjectHoverEvent = null;

  // * Инструменты: ландшафт
  private landscapeTool: LandscapeTool = LandscapeTool.up;

  // * Инструменты: местность
  currentTerrain: number = this.terrainList.find(t => t.id === 1).id;

  // * Инструменты: дорога
  roadType: RoadTypeTool = RoadTypeTool.road;

  // ? Настройки работы редактора
  private toolActive: boolean = false;
  private toolActionTimer: number = 30;
  private terrainChangeStep: number = 1;
  private roadSquareMaxSize: number = 20;

  private destroy$: Subject<void> = new Subject<void>();

  terrainsSettingsKeys: MapTerrainSettingsData[] = [
    { key: "colorR", title: "Красный", step: 1, min: 0, max: 255 },
    { key: "colorG", title: "Зеленый", step: 1, min: 0, max: 255 },
    { key: "colorB", title: "Синий", step: 1, min: 0, max: 255 },
    { key: "metalness", title: "Металличность", step: 0.01, min: 0, max: 1 },
    { key: "roughness", title: "Шероховатость", step: 0.01, min: 0, max: 1 },
    { key: "aoMapIntensity", title: "Интенсивность (AO)", step: 0.5, min: 0, max: 10 },
    { key: "normalScale", title: "Уровень нормалей", step: 0.1, min: -1, max: 1 },
  ];





  // Координата внутри области редактирования
  private isEditableCeil(x: number, y: number): boolean {
    const cX: number = Math.round(this.currentObject.ceil.coord.x - x);
    const cY: number = Math.round(this.currentObject.ceil.coord.y - y);
    // Вернуть результат проверки
    return (
      cX * cX + cY * cY < (this.toolSizeLand + 0.5) * 2 &&
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

  // Текущий инструмент: ландшафт
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
      return "../../../../../assets/dream-map/terrain/top/face/" + terrain.name + "." + terrain.exts.face;
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

  // Сканирование ячеек для воды
  private getWaterCeils(object: ObjectHoverEvent, waterZ: number = 0): WaterArea {
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    const partSize: number = DreamCeilSize / DreamCeilWaterParts;
    const ceils: XYCoord[] = [];
    const z: number = waterZ > 0 ? waterZ : Math.round(object.point.z / partSize) * partSize;
    let { x, y, z: maxZ } = object.ceil.coord;
    // Функция поиска ячеек
    const findCeils: (x: number, y: number) => void = (x: number, y: number) => {
      if (!ceils.some(c => c.x === x && c.y === y) && this.viewer.getCeil(x, y).coord.z < z) {
        ceils.push({ x, y });
        // Обзор соседних ячеек
        for (let yN = y - 1; yN <= y + 1; yN++) {
          for (let xN = x - 1; xN <= x + 1; xN++) {
            if (
              (yN !== y || xN !== x) &&
              xN >= 0 && xN < width &&
              yN >= 0 && yN < height &&
              !ceils.some(c => c.x === xN && c.y === yN) &&
              this.viewer.getCeil(xN, yN).coord.z < z
            ) {
              findCeils(xN, yN);
            }
          }
        }
      }
    };
    // Поиск первой ячейки
    if (maxZ !== z) {
      let firstCeil: DreamMapCeil = object.ceil;
      // Поиск соседней ячейки, если вода ниже высоты
      if (z < maxZ) {
        const x2: number = x + object.point.xDimen;
        const y2: number = y + object.point.yDimen;
        for (let yN: number = Math.min(y, y2); yN <= Math.max(y, y2); yN++) {
          for (let xN: number = Math.min(x, x2); xN <= Math.max(x, x2); xN++) {
            if (
              (xN !== x || yN !== y) &&
              xN >= 0 && xN < width &&
              yN >= 0 && yN < height &&
              this.viewer.getCeil(xN, yN).coord.z < z
            ) {
              firstCeil = this.viewer.getCeil(xN, yN);
            }
          }
        }
      }
      // Переопределить параметры
      x = firstCeil.coord.x;
      y = firstCeil.coord.y;
    }
    // Поиск соседних ячеек
    findCeils(x, y);
    // Вернуть объект
    return { ceils, z };
  }





  constructor(
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      toolSizeLand: [this.getCurrentToolSizeLand],
      toolSizeRoad: [this.getCurrentToolSizeRoad],
    });
  }

  ngOnInit() {
    fromEvent(document, "mouseup", this.onMouseUp.bind(this)).pipe(takeUntil(this.destroy$)).subscribe();
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

  // Изменение размера кисти
  onToolSizeRoadChange(event: MatSliderChange): void {
    this.toolSizeRoad = ToolSizeRoad[event.value] || ToolSizeRoad[0];
  }

  // Изменение свойств материала
  onTerrainSettingsChange(key: keyof MapTerrainSettings, event: MatSliderChange): void {
    this.terrainInfo = {
      ...this.terrainInfo,
      settings: {
        ...this.terrainInfo.settings,
        [key]: event.value
      }
    };
    // Обновить материалы
    this.viewer.setTerrainSettings(this.currentTerrain);
  }

  // Изменение инструмента типа местности
  onTerrainChange(id: number): void {
    this.currentTerrain = this.terrainList.find(t => t.id === id).id || this.terrainList[0].id;
  }

  // Изменение инструмента типа дороги
  onRoadTypeChange(roadType: RoadTypeTool): void {
    this.roadType = roadType;
  }





  // Свечение ячеек
  private lightCeils(): void {
    const circleSize: Set<Tool> = new Set([Tool.landscape, Tool.terrain]);
    // Добавить свечение для инструментов ландшафта
    if (circleSize.has(this.tool)) {
      const useSizeInput: Set<Tool> = new Set([Tool.landscape, Tool.terrain]);
      const size = useSizeInput.has(this.tool) ? this.toolSizeLand : 0;
      const oldArea: DreamMapCeil[] = this.dreamMap?.ceils.filter(c => c.highlight);
      // Размерный цикл
      for (let cY = -size; cY <= size; cY++) {
        for (let cX = -size; cX <= size; cX++) {
          const x: number = this.currentObject.ceil.coord.x + cX;
          const y: number = this.currentObject.ceil.coord.y + cY;
          // Ячейка внутри области выделения
          if (this.isEditableCeil(x, y)) {
            const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
            const deleteIndex: number = oldArea.findIndex(({ coord: { x: fX, y: fY } }) => fX === x && fY === y);
            // Удалить из массива предыдущей воды
            deleteIndex >= 0 ? oldArea.splice(deleteIndex, 1) : null;
            // Настройки
            ceil.highlight = true;
            // Запомнить ячейку
            this.saveCeil(ceil);
            // Обновить
            this.viewer.setTerrainHoverStatus(ceil);
          }
        }
      }
      // Убрать свечение
      this.unLightCeils(oldArea, "terrain");
    }
    // Свечение воды
    else if (this.tool === Tool.water) {
      const area: WaterArea = this.getWaterCeils(this.currentObject);
      const oldArea: DreamMapCeil[] = this.dreamMap?.ceils
        .filter(({ coord: { x, y } }) => !area.ceils.some(({ x: aX, y: aY }) => aX === x && aY === y))
        .filter(({ waterHightlight }) => waterHightlight > 0);
      // Подсветка
      area.ceils.forEach(({ x, y }) => {
        const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
        // Настройки
        ceil.waterHightlight = area.z;
        // Запомнить ячейку
        this.saveCeil(ceil);
        // Обновить
        this.viewer.setTerrainHoverStatus(ceil);
      });
      // Убрать свечение
      this.unLightCeils(oldArea, "water");
    }
    // Добавить свечение для дорог
    else if (this.tool === Tool.road) {
      // Наметить область
      if (this.startX >= 0 || this.startY >= 0) {
        const toolSize: number = this.roadType === RoadTypeTool.square ? 1 : this.toolSizeRoad;
        const isEven: boolean = Math.round(toolSize / 2) === toolSize / 2;
        let endX: number = this.currentObject.ceil.coord.x;
        let endY: number = this.currentObject.ceil.coord.y;
        endX = Math.abs(this.startX - endX) >= this.roadSquareMaxSize && this.roadType === RoadTypeTool.square ?
          this.startX > endX ?
            this.startX - this.roadSquareMaxSize + 1 :
            this.startX + this.roadSquareMaxSize - 1 :
          endX;
        endY = Math.abs(this.startY - endY) >= this.roadSquareMaxSize && this.roadType === RoadTypeTool.square ?
          this.startY > endY ?
            this.startY - this.roadSquareMaxSize + 1 :
            this.startY + this.roadSquareMaxSize - 1 :
          endY;
        const dimension: "x" | "y" = Math.abs(this.startX - endX) > Math.abs(this.startY - endY) ? "x" : "y";
        const start: number = isEven ? -Math.floor(toolSize / 2) + 1 : -Math.floor(toolSize / 2);
        const end: number = Math.floor(toolSize / 2);
        const fromX: number = (dimension === "x" || this.roadType === RoadTypeTool.square ? Math.min(this.startX, endX) : this.startX) + start;
        const fromY: number = (dimension === "y" || this.roadType === RoadTypeTool.square ? Math.min(this.startY, endY) : this.startY) + start;
        const toX: number = (dimension === "x" || this.roadType === RoadTypeTool.square ? Math.max(this.startX, endX) : this.startX) + end;
        const toY: number = (dimension === "y" || this.roadType === RoadTypeTool.square ? Math.max(this.startY, endY) : this.startY) + end;
        // Цикл по координатам
        for (let y = fromY; y <= toY; y++) {
          for (let x = fromX; x <= toX; x++) {
            if (x >= 0 && y >= 0 && x < this.dreamMap.size.width && y < this.dreamMap.size.height) {
              const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
              // Настройки
              ceil.highlight = true;
              // Запомнить ячейку
              this.saveCeil(ceil);
              // Обновить
              this.viewer.setTerrainHoverStatus(ceil);
            }
          }
        }
      }
      // Подсветить одну ячейку
      else {
        // Для дороги
        if (this.roadType === RoadTypeTool.road) {
          const isEven: boolean = Math.round(this.toolSizeRoad / 2) === this.toolSizeRoad / 2;
          const start: number = isEven ? -Math.floor(this.toolSizeRoad / 2) + 1 : -Math.floor(this.toolSizeRoad / 2);
          const end: number = Math.floor(this.toolSizeRoad / 2);
          // Цикл по координатам
          for (let cY = start; cY <= end; cY++) {
            for (let cX = start; cX <= end; cX++) {
              const ceil: DreamMapCeil = this.viewer.getCeil(this.currentObject.ceil.coord.x + cX, this.currentObject.ceil.coord.y + cY);
              // Настройки
              ceil.highlight = true;
              // Запомнить ячейку
              this.saveCeil(ceil);
              // Обновить
              this.viewer.setTerrainHoverStatus(ceil);
            }
          }
        }
        // Для площади
        else if (this.roadType === RoadTypeTool.square) {
          const ceil: DreamMapCeil = this.viewer.getCeil(this.currentObject.ceil.coord.x, this.currentObject.ceil.coord.y);
          // Настройки
          ceil.highlight = true;
          // Запомнить ячейку
          this.saveCeil(ceil);
          // Обновить
          this.viewer.setTerrainHoverStatus(ceil);
        }
      }
    }
  }

  // Очистить свечение
  private unLightCeils(ceils: DreamMapCeil[] = null, type: "terrain" | "water" = "terrain"): void {
    const tHighLight: DreamMapCeil[] = this.dreamMap?.ceils.filter(c => c.highlight);
    const wHighLight: DreamMapCeil[] = this.dreamMap?.ceils.filter(c => (c?.waterHightlight || 0) > 0);
    // Убрать свечение ячеек
    if ((!!ceils && type === "terrain") || tHighLight.length > 0) {
      (!!ceils ? ceils : tHighLight).map(c => {
        c.highlight = false;
        // Обновить
        this.viewer.setTerrainHoverStatus(c);
      });
    }
    // Убрать свечение воды
    if ((!!ceils && type === "water") || wHighLight.length > 0) {
      (!!ceils ? ceils : wHighLight).map(c => {
        c.waterHightlight = 0;
        // Запомнить ячейку
        this.saveCeil(c);
        // Обновить
        this.viewer.setTerrainHoverStatus(c);
      });
    }
  }

  // Изменение высоты
  private ceilsHeight(direction: HeightDirection): void {
    const z: number = direction === 0 ?
      this.startZ :
      this.viewer.getCeil(this.currentObject.ceil.coord.x, this.currentObject.ceil.coord.y).coord.z;
    let change: boolean = false;
    // Цикл по прилегающим блокам
    for (let cY = -this.toolSizeLand - 1; cY <= this.toolSizeLand + 1; cY++) {
      for (let cX = -this.toolSizeLand - 1; cX <= this.toolSizeLand + 1; cX++) {
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
            ceil.coord.originalZ = ceil.coord.originalZ > this.viewer.maxCeilHeight ? this.viewer.maxCeilHeight : ceil.coord.originalZ;
            ceil.coord.originalZ = ceil.coord.originalZ < this.viewer.minCeilHeight ? this.viewer.minCeilHeight : ceil.coord.originalZ;
            ceil.coord.z = ceil.coord.originalZ;
            // Запомнить ячейку
            this.saveCeil(ceil);
          }
        }
      }
    }
    // Обновить
    if (change) {
      for (let cY = -this.toolSizeLand - 1; cY <= this.toolSizeLand + 1; cY++) {
        for (let cX = -this.toolSizeLand - 1; cX <= this.toolSizeLand + 1; cX++) {
          const x: number = this.currentObject.ceil.coord.x + cX;
          const y: number = this.currentObject.ceil.coord.y + cY;
          const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
          // Обновить
          this.viewer.setTerrainHeight(ceil);
        }
      }
      // Проверка геометрии дорог
      this.viewer.setTerrainHeight(null);
    }
  }

  // Изменение типа местности
  private ceilsTerrain(): void {
    for (let cY = -this.toolSizeLand - 1; cY <= this.toolSizeLand + 1; cY++) {
      for (let cX = -this.toolSizeLand - 1; cX <= this.toolSizeLand + 1; cX++) {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        // Ячейка внутри области выделения
        if (this.isEditableCeil(x, y)) {
          const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
          // Изменить местность
          if (ceil.terrain !== this.currentTerrain) {
            ceil.terrain = this.currentTerrain;
            // Запомнить ячейку
            this.saveCeil(ceil);
            // Обновить
            this.viewer.setTerrain(ceil);
          }
        }
      }
    }
  }

  // Добавление дороги
  private addRoad(): void {
  }





  // Запомнить ячейку
  private saveCeil(ceil: DreamMapCeil): void {
    this.dreamMap.ceils.some(c => c.coord.x === ceil.coord.x && c.coord.y === ceil.coord.y) ?
      this.dreamMap.ceils.find(c => c.coord.x === ceil.coord.x && c.coord.y === ceil.coord.y) != ceil :
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

// Направления высоты
type HeightDirection = - 1 | 0 | 1;





// Интерфейс списка инструментов: общее
interface ToolListItem {
  type: Tool;
  name: string;
  icon: string;
}

// Интерфейс списка инструментов: ландшафт
interface LandscapeToolListItem {
  type: LandscapeTool;
  name: string;
  icon: string;
}

// Интерфейс списка инструментов: дороги
interface RoadTypeToolListItem {
  type: RoadTypeTool;
  title: string;
  icon: string;
}

// Интерфейс данных настроек материалов
interface MapTerrainSettingsData {
  key: keyof MapTerrainSettings;
  title: string;
  step: number;
  min: number;
  max: number;
}





// Типы размеров
const ToolSizeLand: number[] = [0, 1, 3, 5, 9, 13];
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
    title: "Дорога",
    icon: "add_road"
  },
  // Площадь
  {
    type: RoadTypeTool.square,
    title: "Парковка (площадка)",
    icon: "check_box_outline_blank"
  },
];