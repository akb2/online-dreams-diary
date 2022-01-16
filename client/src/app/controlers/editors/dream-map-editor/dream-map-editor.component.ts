import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatSliderChange } from "@angular/material/slider";
import { DreamMapViewerComponent, ObjectHoverEvent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";
import { DreamMap, DreamMapCeil } from "@_models/dream-map";
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
  toolSizeLength: number = ToolSize.length - 1;
  form: FormGroup;

  ToolType: typeof Tool = Tool;
  LandscapeToolType: typeof LandscapeTool = LandscapeTool;

  private tool: Tool = Tool.landscape;
  private landscapeTool: LandscapeTool = LandscapeTool.up;
  toolSize: number = ToolSize[2];
  private toolActive: boolean = false;
  private currentObject: ObjectHoverEvent = null;

  private toolActionTimer: number = 30;
  private terrainChangeStep: number = 1;

  private destroy$: Subject<void> = new Subject<void>();





  // Координата внутри области редактирования
  private isEditableCeil(x: number, y: number): boolean {
    const cX: number = this.currentObject.ceil.coord.x - x;
    const cY: number = this.currentObject.ceil.coord.y - y;
    // Вернуть результат проверки
    return cX * cX + cY * cY <= this.toolSize * 2 &&
      x >= 0 &&
      y >= 0 &&
      x < this.dreamMap.size.width &&
      y < this.dreamMap.size.height;
  }

  // Получить ячейку
  private getCeil(x: number, y: number): DreamMapCeil {
    return this.dreamMap.ceils.find(c => c.coord.x === x && c.coord.y === y) || this.viewer.getDefaultCeil(x, y);
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
  private get getCurrentToolSize(): number {
    return ToolSize.findIndex(t => t === this.toolSize);
  }

  // Форматирование слайдера выбора размера кисти
  toolSizeFormat(key: number = -1): number {
    const toolSize: number = key >= 0 ? ToolSize[key] : ToolSize[this.getCurrentToolSize];
    // Результат
    return 1 + (toolSize * 2);
  }





  constructor(
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      toolSize: [this.getCurrentToolSize]
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
      if (this.tool === Tool.landscape) {
        this.toolActive = true;
      }
      // Цикл по активности
      if (this.toolActive) {
        timer(0, this.toolActionTimer).pipe(tap(this.onToolActionActive.bind(this)))
          .pipe(takeWhile(() => this.toolActive), takeUntil(this.destroy$))
          .subscribe();
      }
    }
  }

  // Отпускание кнопки мыши
  private onMouseUp(): void {
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

  // Активное действие в цикле
  private onToolActionActive(): void {
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
        }
      }
    }
  }

  // Пассивное действие
  private onToolActionPassive(): void {
    if (this.currentObject) {
      // Работа с ландшафтом
      if (this.tool === Tool.landscape) {
        this.lightCeils();
      }
    }
  }

  // Изменение инструмента
  onToolChange(tool: Tool): void {
    this.tool = tool;
  }

  // Изменение инструмента ландшафт
  onLandscapeToolChange(tool: LandscapeTool): void {
    this.landscapeTool = tool;
  }

  // Изменение размера кисти
  onToolSizeChange(event: MatSliderChange): void {
    this.toolSize = ToolSize[event.value] || ToolSize[0];
  }





  // Свечение ячеек
  private lightCeils(): void {
    // Убрать свечение
    this.dreamMap.ceils.filter(c => c.highlight).map(c => {
      c.highlight = false;
      // Обновить
      this.viewer.setTerrainHoverStatus(c);
    });
    // Добавить свечение
    for (let cY = -this.toolSize; cY <= this.toolSize; cY++) {
      for (let cX = -this.toolSize; cX <= this.toolSize; cX++) {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        // Ячейка внутри области выделения
        if (this.isEditableCeil(x, y)) {
          const ceil: DreamMapCeil = this.getCeil(x, y);
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

  // Изменение высоты
  private ceilsHeight(direction: HeightDirection): void {
    const z: number = this.getCeil(this.currentObject.ceil.coord.x, this.currentObject.ceil.coord.y).coord.z;
    // Цикл по прилегающим блокам
    for (let cY = -this.toolSize - 1; cY <= this.toolSize + 1; cY++) {
      for (let cX = -this.toolSize - 1; cX <= this.toolSize + 1; cX++) {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        // Ячейка внутри области выделения
        if (this.isEditableCeil(x, y)) {
          const ceil: DreamMapCeil = this.getCeil(x, y);
          const currentZ: number = ceil.coord.z;
          let corrDirection: HeightDirection = 0;
          let zChange: number = Math.floor(
            ((this.toolSize * this.terrainChangeStep) + 1 - ((Math.abs(cX) + Math.abs(cY)) * this.terrainChangeStep / 2)) /
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
    for (let cY = -this.toolSize - 1; cY <= this.toolSize + 1; cY++) {
      for (let cX = -this.toolSize - 1; cX <= this.toolSize + 1; cX++) {
        const x: number = this.currentObject.ceil.coord.x + cX;
        const y: number = this.currentObject.ceil.coord.y + cY;
        const ceil: DreamMapCeil = this.dreamMap.ceils.find(c => c.coord.x === x && c.coord.y === y) || this.viewer.getDefaultCeil(x, y);
        // Обновить
        this.viewer.setTerrainHeight(ceil);
      }
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
  landscape
};

// Перечисление инструментов: ландшафт
enum LandscapeTool {
  up,
  down,
  align
};

// Типы размеров
const ToolSize: number[] = [0, 1, 3, 5, 9, 13];

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





// Список инструментов: общее
const Tools: ToolListItem[] = [
  // Работа с ландшафтом
  {
    type: Tool.landscape,
    name: "Ландшафт (изменять рельеф)",
    icon: "landscape"
  }
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