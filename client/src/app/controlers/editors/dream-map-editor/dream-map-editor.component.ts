import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatSliderChange } from "@angular/material/slider";
import { DreamMapViewerComponent, ObjectHoverEvent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";
import { DreamMap, DreamMapCeil, MapTerrain } from "@_models/dream-map";
import { MapTerrains } from "@_services/dream-map/terrain.service";
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
  form: FormGroup;

  // Списки параметров
  ToolType: typeof Tool = Tool;
  LandscapeToolType: typeof LandscapeTool = LandscapeTool;
  terrainList: MapTerrain[] = MapTerrains;

  // * Инструменты: общее
  private tool: Tool = Tool.landscape;
  toolSizeLand: number = ToolSizeLand[2];
  private currentObject: ObjectHoverEvent = null;

  // * Инструменты: ландшафт
  private landscapeTool: LandscapeTool = LandscapeTool.up;

  // * Инструменты: тип местности
  currentTerrain: number = this.terrainList.find(t => t.id === 4).id;

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
      cX * cX + cY * cY < (this.toolSizeLand + 0.5) * 2 &&
      x >= 0 &&
      y >= 0 &&
      x < this.dreamMap.size.width &&
      y < this.dreamMap.size.height
    );
  }

  // Текущий инструмент
  get getCurrentTool(): ToolListItem {
    return this.toolList.find(t => t.type === this.tool) || this.toolList[0];
  }

  // Текущий инструмент
  get getCurrentLandscapeTool(): LandscapeToolListItem {
    return this.landscapeToolList.find(t => t.type === this.landscapeTool) || this.landscapeToolList[0];
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

  // Сведения о текущем материале
  get getTerrainInfo(): MapTerrain {
    return this.terrainList[this.currentTerrain] || this.terrainList[0];
  }

  // Ссылка на тип местности
  getTerrainImage(id: number): string {
    if (this.terrainList.some(t => t.id === id)) {
      const terrain: MapTerrain = this.terrainList.find(t => t.id === id)!;
      // Ссылка на картинку
      return "../../../../../assets/dream-map/terrain/top/" + terrain.name + ".jpg";
    }
    // Картинка не найдена
    return "";
  }





  constructor(
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      toolSizeLand: [this.getCurrentToolSizeLand]
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
      if (this.tool === Tool.landscape || this.tool === Tool.terrain) {
        this.toolActive = true;
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
    this.onToolActionActive();
    // Окончить действие
    this.toolActive = false;
    this.currentObject = null;
  }

  // Наведение курсора на объект
  onObjectHover(event: ObjectHoverEvent): void {
    if (this.viewer) {
      if (!this.currentObject || this.currentObject.ceil.coord.x !== event.ceil.coord.x || this.currentObject.ceil.coord.y !== event.ceil.coord.y) {
        this.currentObject = event;
        // Пассивные действия
        this.onToolActionPassive();
      }
    }
  }

  // Активное действие
  private onToolActionActive(): void {
    if (this.currentObject && this.toolActive) {
      switch (this.tool) {
      }
    }
  }

  // Активное действие в цикле
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

  // Пассивное действие
  private onToolActionPassive(): void {
    if (this.currentObject) {
      // Работа с ландшафтом
      if (this.tool === Tool.landscape || this.tool === Tool.terrain) {
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

  // Изменение инструмента типа местности
  onTerrainChange(id: number): void {
    this.currentTerrain = this.terrainList.find(t => t.id === id).id || this.terrainList[0].id;
  }





  // Свечение ячеек
  private lightCeils(): void {
    // Убрать свечение
    this.unLightCeils();
    // Добавить свечение
    for (let cY = -this.toolSizeLand; cY <= this.toolSizeLand; cY++) {
      for (let cX = -this.toolSizeLand; cX <= this.toolSizeLand; cX++) {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        // Ячейка внутри области выделения
        if (this.isEditableCeil(x, y)) {
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

  // Очистить свечение
  private unLightCeils(): void {
    if (this.dreamMap.ceils.some(c => c.highlight)) {
      this.dreamMap.ceils.filter(c => c.highlight).map(c => {
        c.highlight = false;
        // Обновить
        this.viewer.setTerrainHoverStatus(c);
      });
    }
  }

  // Изменение высоты
  private ceilsHeight(direction: HeightDirection): void {
    const z: number = this.viewer.getCeil(this.currentObject.ceil.coord.x, this.currentObject.ceil.coord.y).coord.z;
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
            ceil.coord.z = Math.floor(ceil.coord.z + zChange);
            ceil.coord.z = (corrDirection > 0 && ceil.coord.z > z) || (corrDirection < 0 && ceil.coord.z < z) ? z : ceil.coord.z;
            ceil.coord.z = ceil.coord.z > this.viewer.maxCeilHeight ? this.viewer.maxCeilHeight : ceil.coord.z;
            ceil.coord.z = ceil.coord.z < this.viewer.minCeilHeight ? this.viewer.minCeilHeight : ceil.coord.z;
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
    let change: boolean = false;
    // Цикл по прилегающим блокам
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
            change = true;
            // Запомнить ячейку
            this.saveCeil(ceil);
            // Обновить
            this.viewer.setTerrain(ceil);
          }
        }
      }
    }
    // Обновить геометрию
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





  // Запомнить ячейку
  private saveCeil(ceil: DreamMapCeil): void {
    this.dreamMap.ceils.some(c => c.coord.x === ceil.coord.x && c.coord.y === ceil.coord.y) ?
      this.dreamMap.ceils.find(c => c.coord.x === ceil.coord.x && c.coord.y === ceil.coord.y) != ceil :
      this.dreamMap.ceils.push(ceil);
  }
}





// Перечисление инструментов: общее
enum Tool {
  landscape,
  terrain,
  road
};

// Перечисление инструментов: ландшафт
enum LandscapeTool {
  up,
  down,
  align
};

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





// Типы размеров
const ToolSizeLand: number[] = [0, 1, 3, 5, 9, 13];

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