import { DreamMapTerrainName } from "@_datas/dream-map-objects";
import { DreamCeilSize, DreamMaxHeight, DreamMinHeight } from "@_datas/dream-map-settings";
import { CheckInRange, Cos, MathFloor, Sin, SinCosToRad } from "@_helpers/math";
import { ForCycle } from "@_helpers/objects";
import { WaitObservable } from "@_helpers/rxjs";
import { CoordDto, DreamMap } from "@_models/dream-map";
import { Injectable, OnDestroy } from "@angular/core";
import { editor3DCursorSizeSelector, editor3DHoverCeilCoordsSelector } from "@app/reducers/viewer-3d";
import { OctreeRaycaster } from "@brakebein/threeoctree";
import { Store } from "@ngrx/store";
import { Subject, combineLatest, concatMap, distinctUntilChanged, merge, takeUntil, tap } from "rxjs";
import { Color, CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, SpotLight, SpotLightHelper, Vector3 } from "three";
import { Landscape3DService } from "./landscape-3d.service";





@Injectable()

export class Cursor3DService implements OnDestroy {
  dreamMap: DreamMap;

  // ? Размер ячейки умножается на этот множитель
  private heightMultiplier = 0.3;
  // ? Ширина сигмента для цилиндра будет примерно равнятся этому числу
  private radialSigmentsDelimiter = 0.2;
  // ? Количество точек для поиска пересечений с ландшафтом
  private intersectionPoints = 5;
  private lightMaxDistance = DreamCeilSize * 7;
  private lightColor = new Color("white");
  private lightSizeMultiplier = 0.5;
  private lightIntensity = 30;

  group: Group;

  private mesh: Mesh;
  private material: MeshBasicMaterial;
  private geometry: CylinderGeometry;
  private light: SpotLight;
  private lightHelper: SpotLightHelper;

  hoverItems = [
    DreamMapTerrainName
  ];

  private lastSize: number;
  private lastHeight: number;
  private intersectionCache: [number, number, number][] = [];

  private rayCaster = new OctreeRaycaster(new Vector3(), new Vector3(), 0, DreamMaxHeight - DreamMinHeight);
  private rayCasterOrigin = new Vector3();
  private rayCasterDirection = new Vector3(0, -1, 0);

  // Текущий размер
  private cursorSize$ = this.store$.select(editor3DCursorSizeSelector).pipe(
    distinctUntilChanged((prev, next) => prev === next)
  );

  // Текущая ячейка
  private cursorPosition$ = this.store$.select(editor3DHoverCeilCoordsSelector).pipe(
    distinctUntilChanged((prev, next) => prev.x === next.x && prev.y === next.y)
  );

  private destroyed$ = new Subject<void>();





  // Получить размер
  private getGeometryRadius(size: number): number {
    return (((CheckInRange(size - 1) * 2) + 1) * DreamCeilSize) / 2;
  }

  // Получение точки пересечения
  private getIntersectedPoint(landX: number, landZ: number): CoordDto {
    const cacheIndex = this.intersectionCache.findIndex(([x, , z]) => x === landX && z === landZ);
    // Результат из кеша
    if (cacheIndex >= 0) {
      const [x, y, z] = this.intersectionCache[cacheIndex];
      // Пересечение
      return { x, y, z };
    }
    // Расчет пересечения
    else {
      this.rayCasterOrigin.set(landX, DreamMaxHeight + DreamCeilSize, landZ);
      this.rayCaster.set(this.rayCasterOrigin, this.rayCasterDirection);
      // Объекты в фокусе
      const intersects = this.rayCaster.intersectObject(this.landscape3DService.mesh, false);
      const { x, y, z } = intersects?.[0]?.point ?? { x: 0, y: 0, z: 0 };
      // Добавить в кеш
      this.intersectionCache.push([x, y, z]);
      // Пересечение
      return { x, y, z };
    }
  }





  constructor(
    private landscape3DService: Landscape3DService,
    private store$: Store
  ) {
    WaitObservable(() => !this.dreamMap)
      .pipe(
        concatMap(() => merge(
          combineLatest([this.cursorPosition$, this.cursorSize$]).pipe(tap(([{ x, y }, size]) => this.onPositionChange(x, y, size)))
        )),
        takeUntil(this.destroyed$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Создание курсора
  create(): void {
    this.createGeometry(1, 0);
    this.createMaterial();
    this.createMesh();
    this.createLight();
    this.createGroup();
  }

  // Создание геометрии
  private createGeometry(size: number, height: number): void {
    if (this.lastSize !== size || this.lastHeight !== height) {
      const radius = this.getGeometryRadius(size);
      const circleLength = radius * 2 * Math.PI;
      const radialSegments = MathFloor(circleLength / this.radialSigmentsDelimiter);
      // Новая геометрия
      this.lastSize = size;
      this.lastHeight = height;
      this.geometry = new CylinderGeometry(radius, radius, height, radialSegments, 1, true);
    }
  }

  // Создание материала
  private createMaterial(): void {
    this.material = new MeshBasicMaterial({
      color: 0x2265ff,
      opacity: 0.5,
      transparent: true,
      side: DoubleSide,
      fog: false
    });
  }

  // Создание объекта
  private createMesh(): void {
    this.mesh = new Mesh(this.geometry, this.material);
    // Свойства объекта
    this.mesh.renderOrder = 2;
  }

  // Создание освещения
  private createLight(): void {
    const minDistance = DreamCeilSize * 0.1;
    const maxDistance = this.lightMaxDistance;
    // Создание объектов
    this.light = new SpotLight(this.lightColor);
    this.lightHelper = new SpotLightHelper(this.light);
    // Свойства света
    this.light.castShadow = true;
    this.light.penumbra = 1;
    this.light.distance = maxDistance * 2;
    this.light.shadow.mapSize.width = 1024;
    this.light.shadow.mapSize.height = 1024;
    this.light.shadow.camera.near = minDistance;
    this.light.shadow.camera.far = maxDistance * 2;
    this.light.target = this.mesh;
  }

  // Создание группы
  private createGroup(): void {
    this.group = new Group();
    // Добавить объекты в группу
    this.group.add(this.mesh, this.light);
  }





  // Изменение размера
  private onPositionChange(ceilX: number, ceilY: number, size: number): void {
    if (!!this.mesh) {
      if (ceilX >= 0 && ceilY >= 0) {
        const radius = this.getGeometryRadius(size);
        const halfCeil = 0.5;
        const halfMapWidth = this.dreamMap.size.width / 2;
        const halfMapHeight = this.dreamMap.size.height / 2;
        const positionX = (ceilX - halfMapWidth + halfCeil) * DreamCeilSize;
        const positionZ = (ceilY - halfMapHeight + halfCeil) * DreamCeilSize;
        const stepAngle = 360 / this.intersectionPoints;
        const underHeight = DreamCeilSize * this.heightMultiplier;
        let minPositionY = Infinity;
        let maxPositionY = -Infinity;
        // Поиск высот
        ForCycle(this.intersectionPoints, i => {
          const angle = stepAngle * i;
          const x = positionX + (radius * Cos(angle));
          const z = positionZ + (radius * Sin(angle));
          const y = this.getIntersectedPoint(x, z).y;
          // Обновить свойства
          maxPositionY = Math.max(y, maxPositionY);
          minPositionY = Math.min(y, minPositionY);
        }, true);
        // Свойства
        const height = (maxPositionY - minPositionY) + underHeight;
        const positionY = minPositionY + (height / 2);
        const angle = SinCosToRad(radius, this.lightMaxDistance) * (1 + this.lightSizeMultiplier);
        // Новая геометрия
        this.createGeometry(size, height);
        // Обновить свойства
        this.light.angle = angle;
        this.light.intensity = this.lightIntensity * this.lightMaxDistance * radius;
        this.mesh.geometry = this.geometry;
        this.mesh.position.set(positionX, positionY, positionZ);
        this.light.position.set(positionX, positionY + this.lightMaxDistance, positionZ);
        this.lightHelper.update();
        this.group.visible = true;
      }
      // Скрыть курсор
      else {
        this.group.visible = false;
      }
    }
  }
}
