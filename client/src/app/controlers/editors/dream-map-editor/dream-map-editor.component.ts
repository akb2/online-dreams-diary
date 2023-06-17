import { PopupDreamMapSettingsComponent } from "@_controlers/dream-map-settings/dream-map-settings.component";
import { DreamMapViewerComponent, ObjectHoverEvent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";
import { ArrayRandom, CreateArray } from "@_datas/app";
import { ClosestHeightNames, MapTerrains, TexturePaths } from "@_datas/dream-map";
import { DreamMapObjectCatalogs, DreamMapObjects } from "@_datas/dream-map-objects";
import { DreamCeilParts, DreamCeilSize, DreamCeilWaterParts, DreamDefHeight, DreamMaxHeight, DreamMinHeight, DreamObjectElmsValues, DreamSkyTime, DreamWaterDefHeight } from "@_datas/dream-map-settings";
import { IsMultiple, LengthByCoords, MathRound, ParseInt } from "@_helpers/math";
import { CustomObjectKey, IconType, SimpleObject } from "@_models/app";
import { ClosestHeightName, DreamMap, DreamMapCeil, DreamMapSettings, MapTerrain, ReliefType } from "@_models/dream-map";
import { DreamMapMixedObject, DreamMapObjectCatalog } from "@_models/dream-map-objects";
import { SliderSettings } from "@_models/form";
import { ImageExtension } from "@_models/screen";
import { DreamService } from "@_services/dream.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Subject, delay, fromEvent, takeUntil, takeWhile, tap, timer } from "rxjs";





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
  loading: boolean = false;
  iconTypes: typeof IconType = IconType;

  private startZ: number = -1;

  oceanMinZ: number = DreamMinHeight;
  oceanMaxZ: number = DreamMaxHeight;
  oceanStepZ: number = DreamCeilSize / DreamCeilParts;
  landMinZ: number = DreamMinHeight;
  landMaxZ: number = DreamMaxHeight;
  landStepZ: number = DreamCeilSize / DreamCeilParts;
  detalizationMin: number = 0;
  detalizationMax: number = (Object.keys(DreamObjectElmsValues).length / 2) - 1;

  // Списки параметров
  toolType: typeof Tool = Tool;
  landscapeToolType: typeof LandscapeTool = LandscapeTool;
  terrainList: MapTerrain[] = MapTerrains;
  waterTypeList: WaterTypeToolListItem[] = WaterTypeTools;
  detaliationLabels: CustomObjectKey<DreamObjectElmsValues, string> = DetaliationLabels;
  objectsCatalogs: DreamMapObjectCatalog[] = DreamMapObjectCatalogs;
  private objects: DreamMapMixedObject[] = DreamMapObjects;
  filteredObjects: DreamMapMixedObject[] = [];

  // * Инструменты: общее
  private tool: Tool = Tool.objects;
  toolSizeLand: number = ToolSizeLand[0];
  private currentCeil: ObjectHoverEvent = null;

  // * Инструменты: ландшафт
  private landscapeTool: LandscapeTool = LandscapeTool.down;
  reliefElmDatas: ReliefElmData[];

  // * Инструменты: местность
  currentTerrain: number = this.terrainList.find(t => t.id === 1).id;

  // * Инструменты: вода
  waterType: WaterTypeTool = WaterTypeTool.sea;

  // * Инструменты: объекты
  currentObjectCatalog: number;
  currentObject: number = 0;
  private currentObjectsByCatalog: CustomObjectKey<number, number> = {};

  // ? Настройки работы редактора
  private toolActive: boolean = false;
  private toolActionTimer: number = 25;
  private terrainChangeStep: number = 5;
  private terrainObjectsUpdateCounter: number = 1;
  timeSettings: SliderSettings = { min: 0, max: 360, step: 1 };
  dreamMapSettings: DreamMapSettings;

  private destroyed$: Subject<void> = new Subject<void>();





  // Координата внутри области редактирования
  private isEditableCeil(x: number, y: number): boolean {
    const cX: number = Math.round(this.currentCeil.ceil.coord.x - x);
    const cY: number = Math.round(this.currentCeil.ceil.coord.y - y);
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
  toolSizeLandFormat(key: number = -1): string {
    const toolSizeLand: number = key >= 0 ? ToolSizeLand[key] : ToolSizeLand[this.getCurrentToolSizeLand];
    // Результат
    return (1 + (toolSizeLand * 2)).toString();
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
      value = MathRound(key / (this.timeSettings.max - 1) * 100).toString();
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
      return TexturePaths.icons + terrain.name + "." + ImageExtension.jpg;
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

  // Выбранная категория
  get getCurrentObjectsCatalog(): DreamMapObjectCatalog {
    return this.objectsCatalogs.find(({ id }) => id === this.currentObjectCatalog) ?? this.objectsCatalogs[0];
  }

  // Выбранный объект
  get getCurrentObject(): DreamMapMixedObject {
    return this.filteredObjects.find(({ id }) => id === this.currentObject) ?? this.filteredObjects[0];
  }





  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private matDialog: MatDialog
  ) {
    this.dreamMapSettings = this.dreamService.getDreamMapSettings;
    // Настройки формы
    this.form = this.formBuilder.group({
      toolSizeLand: this.getCurrentToolSizeLand,
      currentTime: 0,
      worldOceanHeight: 0,
    });
  }

  ngOnInit() {
    const enterEvent = this.isTouchDevice ? "touchend" : "mouseup";
    // События
    fromEvent(document, enterEvent, this.onMouseUp.bind(this)).pipe(takeUntil(this.destroyed$)).subscribe();
    // Создать список управления рельефом
    this.createReliefData();
    this.onObjectsCategoriesChange(-1);
    // Изменение уровня воды
    this.form.get("worldOceanHeight").valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => this.onOceanHeightChange(value));
    // Изменение размера кисти
    this.form.get("toolSizeLand").valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => this.onToolSizeLandChange(value));
    // Изменение положения солнца
    this.form.get("currentTime").valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => this.onTimeChange(value));
  }

  ngOnChanges(): void {
    this.form.get("worldOceanHeight").setValue(this.dreamMap.ocean.z ?? DreamWaterDefHeight);
    this.form.get("currentTime").setValue(this.dreamMap.sky.time ?? DreamSkyTime);
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Нажатие кнопки мыши
  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      const tools: Set<Tool> = new Set([Tool.landscape, Tool.terrain, Tool.objects]);
      // предварительное действие
      if (tools.has(this.tool)) {
        this.toolActive = true;
        this.onToolActionBeforeActive();
      }
      // Цикл по активности
      if (this.toolActive) {
        timer(0, this.toolActionTimer)
          .pipe(
            takeWhile(() => this.toolActive),
            takeUntil(this.destroyed$),
            tap(i => this.onToolActionCycle(i))
          )
          .subscribe();
      }
    }
  }

  // Отпускание кнопки мыши
  private onMouseUp(): void {
    this.onToolActionAfterActive();
    // Окончить действие
    this.toolActive = false;
    this.currentCeil = null;
  }

  // Наведение курсора на объект
  onObjectHover(event: ObjectHoverEvent): void {
    if (this.viewer) {
      const noChangeCoords: Set<Tool> = new Set([Tool.water]);
      const partSize: number = DreamCeilSize / DreamCeilWaterParts;
      const prevZ: number = Math.round((this.currentCeil?.point.z || 0) / partSize) * partSize;
      const currZ: number = Math.round((event.point.z || 0) / partSize) * partSize;
      // Проверка пересечения
      if (
        (
          !noChangeCoords.has(this.tool) && (
            !this.currentCeil ||
            this.currentCeil.ceil.coord.x !== event.ceil.coord.x ||
            this.currentCeil.ceil.coord.y !== event.ceil.coord.y
          )
        ) ||
        (noChangeCoords.has(this.tool) && prevZ !== currZ)
      ) {
        this.currentCeil = event;
        // Пассивные действия
        this.onToolActionPassive();
      }
    }
  }

  // * Активное действие: ЛКМ зажимается
  private onToolActionBeforeActive(): void {
    if (this.currentCeil && this.toolActive) {
      switch (this.tool) {
        // Работа с ландшафтом
        case (Tool.landscape): switch (this.landscapeTool) {
          // Выравнивание
          case (LandscapeTool.align):
            this.startZ = this.viewer.getCeil(this.currentCeil.ceil.coord.x, this.currentCeil.ceil.coord.y).coord.z;
            break;
        }; break;
      }
    }
  }

  // * Активное действие в цикле: ЛКМ зажата
  private onToolActionCycle(itterator: number): void {
    if (this.currentCeil && this.toolActive) {
      // Работа с ландшафтом
      if (this.tool === Tool.landscape) {
        const direction: HeightDirection = this.landscapeTool === LandscapeTool.up ? 1 : this.landscapeTool === LandscapeTool.down ? -1 : 0;
        const updateObjects: boolean = this.terrainObjectsUpdateCounter > 0 ? IsMultiple(itterator, this.terrainObjectsUpdateCounter) : false;
        // Действие с ландшафтом
        this.ceilsHeight(direction, updateObjects);
      }
      // Работа с типом местности
      else if (this.tool === Tool.terrain) {
        this.ceilsTerrain();
      }
      // Работа с объектами
      else if (this.tool === Tool.objects) {
        this.setObject();
      }
    }
  }

  // * Активное действие: ЛКМ отпускается
  private onToolActionAfterActive(): void {
    if (this.currentCeil && this.toolActive) {
      switch (this.tool) {
        // Работа с ландшафтом
        case (Tool.landscape): switch (this.landscapeTool) {
          // Работа с ландшафтом: поднять
          case (LandscapeTool.up): this.ceilsHeight(1, true); break;
          // Работа с ландшафтом: опустить
          case (LandscapeTool.down): this.ceilsHeight(-1, true); break;
          // Работа с ландшафтом: выровнять
          case (LandscapeTool.align): this.ceilsHeight(0, true); break;
        }; break;
      }
    }
  }

  // * Пассивное действие: наведение курсора на объект
  private onToolActionPassive(): void {
    if (!!this.currentCeil) {
      const tools: Set<Tool> = new Set([Tool.landscape, Tool.terrain, Tool.objects]);
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
    if (tool === Tool.settings) {
      this.onOpenConfigModal();
    }
    // Заменить инструмент
    else {
      this.tool = tool;
      // Убрать свечение
      this.lightCeils(true);
    }
  }

  // Изменение инструмента ландшафт
  onLandscapeToolChange(tool: LandscapeTool): void {
    this.landscapeTool = tool;
  }

  // Изменение размера кисти
  onToolSizeLandChange(value: any): void {
    this.toolSizeLand = ToolSizeLand[ParseInt(value)];
  }

  // Изменение высоты мирового океана
  onOceanHeightChange(value: any): void {
    this.dreamMap.ocean.z = ParseInt(value) ?? DreamWaterDefHeight;
    // Установить высоту
    this.setOceanHeight();
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменение времени
  onTimeChange(value: any): void {
    this.dreamMap.sky.time = ParseInt(value) ?? DreamSkyTime;
    this.form.get("currentTime").setValue(this.dreamMap.sky.time, { emitEvent: false });
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

  // Изменение типа рельефа
  onReliefTypeChange(type: ClosestHeightName | "center"): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    // Для центральной ячейки
    if (type === "center") {
      timer(10)
        .pipe(
          takeUntil(this.destroyed$),
          tap(() => this.viewer.setReliefRewrite()),
          delay(500)
        )
        .subscribe(() => {
          this.loading = false;
          // обновить интерфейс
          this.createReliefData();
        });
    }
    // Тип за пределами карты
    else {
      const nextitems: CustomObjectKey<ReliefType, ReliefType> = {
        [ReliefType.flat]: ReliefType.hill,
        [ReliefType.hill]: ReliefType.mountain,
        [ReliefType.mountain]: ReliefType.canyon,
        [ReliefType.canyon]: ReliefType.pit,
        [ReliefType.pit]: ReliefType.flat
      };
      // Заменить тип
      this.dreamMap.relief.types[type] = nextitems[this.dreamMap.relief.types[type]];
      // обновить интерфейс
      this.createReliefData();
      // Перерисовать рельеф
      this.viewer.setReliefType(type)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.loading = false;
          this.changeDetectorRef.detectChanges();
        });
    }
  }

  // Изменение категории объектов
  onObjectsCategoriesChange(catalog: number = 0): void {
    catalog = catalog !== 0 ? this.objectsCatalogs.find(({ id }) => id === catalog)?.id ?? this.objectsCatalogs[0].id : 0;
    // Настройки объектов
    if ((!!catalog || catalog === 0) && this.currentObjectCatalog !== catalog) {
      this.currentObjectCatalog = catalog;
      this.filteredObjects = this.objects.filter(({ catalog: c }) => c === catalog).sort((a, b) => a.sortIndex - b.sortIndex);
      // Обновить текущий объект
      this.onObjectChange(-1);
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }

  // Изменение категории объектов
  onObjectChange(object: number = 0): void {
    object = object !== 0 ?
      (this.filteredObjects.find(({ id }) => id === object)?.id ?? this.currentObjectsByCatalog[this.currentObjectCatalog] ?? this.filteredObjects[0]?.id ?? 0) :
      0;
    // Настройки объектов
    if ((!!object || object === 0) && this.currentObject !== object) {
      this.currentObject = object;
      this.currentObjectsByCatalog[this.currentObjectCatalog] = this.currentObject;
    }
  }

  // Открыть окно настроек
  private onOpenConfigModal(): void {
    PopupDreamMapSettingsComponent.open(this.matDialog, { settings: this.dreamMapSettings }).afterClosed()
      .pipe(
        takeUntil(this.destroyed$),
        takeWhile(settings => !!settings)
      )
      .subscribe(settings => {
        this.dreamMapSettings = settings;
        this.set3DSettings();
      });
  }





  // Свечение ячеек
  private lightCeils(unLight: boolean = false): void {
    const sizedTools: Set<Tool> = new Set([Tool.landscape, Tool.terrain]);
    let toolSize: number = sizedTools.has(this.tool) ? this.toolSizeLand : ToolSizeLand[0];
    // Для объектов
    if (this.tool === Tool.objects) {
      const objectsSetting: DreamMapMixedObject = this.getCurrentObject;
      const multiCeils: boolean = !!objectsSetting?.settings?.multiCeils || this.currentObject === 0;
      // Мультиячейки
      if (multiCeils) {
        toolSize = this.toolSizeLand;
      }
    }
    // Подсветить ячейку
    this.viewer.setTerrainHoverStatus(!!this.currentCeil && !unLight ? this.currentCeil.ceil : null, toolSize);
  }

  // Изменение высоты
  private ceilsHeight(direction: HeightDirection, update: boolean = false): void {
    const size: number = (this.toolSizeLand * 2) + 1;
    const sizes: number[] = CreateArray(size).map(v => v - this.toolSizeLand);
    const z: number = direction === 0 ?
      this.startZ :
      this.viewer.getCeil(this.currentCeil.ceil.coord.x, this.currentCeil.ceil.coord.y).coord.z;
    let change: boolean = false;
    // Обход
    sizes.forEach(cY => sizes.forEach(cX => {
      const x: number = this.currentCeil.ceil.coord.x + cX;
      const y: number = this.currentCeil.ceil.coord.y + cY;
      // Ячейка внутри области выделения
      if (this.isEditableCeil(x, y)) {
        const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
        const currentZ: number = ceil.coord.z;
        const currentRadius: number = LengthByCoords({ x: cX, y: cY });
        let corrDirection: HeightDirection = 0;
        let zChange: number = MathRound(this.terrainChangeStep * ((size - currentRadius) / size));
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
          // Обновить оригинальную высоту
          ceil.coord.originalZ = Math.floor(ceil.coord.originalZ + zChange);
          ceil.coord.originalZ = (corrDirection > 0 && ceil.coord.originalZ > z) || (corrDirection < 0 && ceil.coord.originalZ < z) ? z : ceil.coord.originalZ;
          ceil.coord.originalZ = ceil.coord.originalZ > DreamMaxHeight ? DreamMaxHeight : ceil.coord.originalZ;
          ceil.coord.originalZ = ceil.coord.originalZ < DreamMinHeight ? DreamMinHeight : ceil.coord.originalZ;
          // Обновить высоту
          ceil.coord.z = Math.floor(ceil.coord.z + zChange);
          ceil.coord.z = (corrDirection > 0 && ceil.coord.z > z) || (corrDirection < 0 && ceil.coord.z < z) ? z : ceil.coord.z;
          ceil.coord.z = ceil.coord.z > DreamMaxHeight ? DreamMaxHeight : ceil.coord.z;
          ceil.coord.z = ceil.coord.z < DreamMinHeight ? DreamMinHeight : ceil.coord.z;
          // Значение корректировки
          change = true;
          // Запомнить ячейку
          this.saveCeil(ceil);
        }
      }
    }));
    // Обновить
    if (change) {
      const ceils = sizes
        .map(cY => sizes.map(cX => {
          const x: number = this.currentCeil.ceil.coord.x + cX;
          const y: number = this.currentCeil.ceil.coord.y + cY;
          // Вернуть ячейку
          return [x, y];
        }))
        .reduce((o, c) => ([...o, ...c]), [])
        .filter(([x, y]) => this.isEditableCeil(x, y))
        .map(([x, y]) => this.viewer.getCeil(x, y));
      // Обновить
      this.viewer.setTerrainHeight(ceils, update);
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
        const x: number = this.currentCeil.ceil.coord.x + cX;
        const y: number = this.currentCeil.ceil.coord.y + cY;
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

  // Перерисовка объектов
  private set3DSettings(): void {
    this.loading = true;
    this.dreamService.saveSettings(this.dreamMapSettings);
    this.changeDetectorRef.detectChanges();
    // Обновить объекты
    this.viewer.set3DSettings(this.dreamMapSettings)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      });
  }

  // Изменить время для положения небесных светил
  private setSkyTime(): void {
    this.viewer.setSkyTime(this.dreamMap.sky.time);
  }

  // Изменить объект
  private setObject(): void {
    const objectsSetting: DreamMapMixedObject = this.getCurrentObject;
    const multiCeils: boolean = !!objectsSetting?.settings?.multiCeils || this.currentObject === 0;
    const toolSize: number = multiCeils ? this.toolSizeLand : ToolSizeLand[0];
    const sizes: number[] = multiCeils ? CreateArray(((toolSize + 1) * 2) + 1).map(v => v - (toolSize + 1)) : [0];
    // Цикл по ячейкам
    const ceils: DreamMapCeil[] = sizes
      .map(cY => sizes.map(cX => {
        const x: number = this.currentCeil.ceil.coord.x + cX;
        const y: number = this.currentCeil.ceil.coord.y + cY;
        // Ячейка внутри области выделения
        if (this.isEditableCeil(x, y)) {
          const ceil: DreamMapCeil = this.viewer.getCeil(x, y);
          const newObjects: number[] = this.currentObject === 0 || objectsSetting?.type === "object" ?
            [this.currentObject > 0 ? objectsSetting.id : 0] :
            objectsSetting.ids;
          // Изменить местность
          if (!newObjects.includes(ceil.object)) {
            return ceil;
          }
        }
        // Нередактируемая ячейка
        return null;
      }))
      .reduce((o, c) => ([...o, ...c]), [])
      .filter(c => !!c);
    // Заменить объекты
    if (!!ceils?.length) {
      if (objectsSetting?.type === "object" || this.currentObject === 0) {
        this.viewer.setObject(ceils, this.currentObject);
        // Запомнить объект
        ceils.forEach(ceil => {
          ceil.object = this.currentObject;
          // Запомнить ячейку
          this.saveCeil(ceil);
        });
      }
      // Установить для группы объектов
      else {
        const newObjects: number[] = CreateArray(ceils.length).map(() => ArrayRandom(objectsSetting.ids));
        const objectCeils: DreamMapCeil[] = ceils.map((ceil, k) => ({ ...ceil, object: newObjects[k] }));
        // Перерисовать объекты
        objectsSetting.ids.forEach(objectId => {
          const ceilsByObject: DreamMapCeil[] = objectCeils.filter(({ object }) => object === objectId);
          // Если массив ячеек не пуст
          if (!!ceilsByObject?.length) {
            this.viewer.setObject(ceilsByObject, objectId);
          }
        });
        // Запомнить объекты
        ceils.forEach((ceil, k) => {
          ceil.object = newObjects[k];
          // Запомнить ячейку
          this.saveCeil(ceil);
        });
      }
    }
  }

  // Запомнить ячейку
  private saveCeil(ceil: DreamMapCeil): void {
    const index: number = this.dreamMap.ceils.findIndex(c => c.coord.x === ceil.coord.x && c.coord.y === ceil.coord.y);
    // Удалить имеющуюся ячейку
    if (index >= 0) {
      this.dreamMap.ceils.splice(index, 1);
    }
    // Запомнить ячейку
    this.dreamMap.ceils.push(ceil);
  }

  // Список для управление окружающим лундшафтом
  private createReliefData(): void {
    const outerIcons: CustomObjectKey<ReliefType, string> = {
      [ReliefType.flat]: "horizontal_rule",
      [ReliefType.hill]: "waves",
      [ReliefType.mountain]: "landscape",
      [ReliefType.canyon]: "align_vertical_bottom",
      [ReliefType.pit]: "download",
    };
    const outerDescription: CustomObjectKey<ReliefType, string> = {
      [ReliefType.flat]: "Равнина",
      [ReliefType.hill]: "Холмы",
      [ReliefType.mountain]: "Горы",
      [ReliefType.canyon]: "Каньоны",
      [ReliefType.pit]: "Низина",
    };
    const sideNames: CustomObjectKey<ClosestHeightName, string> = {
      topLeft: "Верхний левый",
      top: "Верхний",
      topRight: "Верхний правый",
      left: "Левый",
      right: "Правый",
      bottomLeft: "Нижний левый",
      bottom: "Нижний",
      bottomRight: "Нижний правый",
    };
    const clickEvent: (type: ClosestHeightName | "center") => void = this.onReliefTypeChange.bind(this);
    // Управление за пределами карты
    this.reliefElmDatas = ClosestHeightNames.map(type => ({
      type,
      clickEvent,
      active: false,
      icon: outerIcons[this.dreamMap.relief.types[type]],
      description: sideNames[type] + " угол: " + outerDescription[this.dreamMap.relief.types[type]],
    }));
    // Добавить для центрального элемента
    this.reliefElmDatas.splice(4, 0, {
      type: "center",
      clickEvent,
      active: false,
      icon: "zoom_in_map",
      description: "Размыть внутренний рельеф с внешним"
    });
    // Обновтиь
    this.changeDetectorRef.detectChanges();
  }
}





// Перечисление инструментов: общее
enum Tool {
  sky,
  water,
  landscape,
  terrain,
  objects,
  settings,
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
  hidePreffix?: boolean;
}

// Интерфейс списка инструментов: ландшафт
interface LandscapeToolListItem extends ToolListItemBase {
  type: LandscapeTool;
}

// Интерфейс списка инструментов: вода
interface WaterTypeToolListItem extends ToolListItemBase {
  type: WaterTypeTool;
}

// Интерфейс настроек окружающего ландшафта
interface ReliefElmData {
  type: ClosestHeightName | "center";
  active: boolean;
  icon: string;
  description: string;
  clickEvent: (type: ClosestHeightName | "center") => void;
}





// Типы размеров
const ToolSizeLand: number[] = CreateArray(6);

// Список инструментов: общее
const Tools: ToolListItem[] = [
  // Работа с окружением
  {
    type: Tool.sky,
    name: "Окружением",
    icon: "light_mode"
  },
  // Работа с водой
  {
    type: Tool.water,
    name: "Вода (изменять водные пространства)",
    icon: "water_drop"
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
  // Объекты
  {
    type: Tool.objects,
    name: "Объекты",
    icon: "category"
  },
  // Настройки
  {
    hidePreffix: true,
    type: Tool.settings,
    name: "Настройки",
    icon: "settings"
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

// Список обозначений качества
const DetaliationLabels: CustomObjectKey<DreamObjectElmsValues, string> = {
  [DreamObjectElmsValues.VeryLow]: "Очень низкая",
  [DreamObjectElmsValues.Low]: "Низкая",
  [DreamObjectElmsValues.Middle]: "Средняя",
  [DreamObjectElmsValues.High]: "Высокая",
  [DreamObjectElmsValues.VeryHigh]: "Очень высокая",
  [DreamObjectElmsValues.Ultra]: "Ультра",
  [DreamObjectElmsValues.Awesome]: "Невероятная",
};
