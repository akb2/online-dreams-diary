import { DreamMapTerrainName } from "@_datas/dream-map-objects";
import { DreamCeilSize, DreamMaxHeight, DreamMinHeight } from "@_datas/dream-map-settings";
import { CheckInRange, Cos, MathFloor, Sin } from "@_helpers/math";
import { ForCycle } from "@_helpers/objects";
import { WaitObservable } from "@_helpers/rxjs";
import { CoordDto, DreamMap } from "@_models/dream-map";
import { Injectable, OnDestroy } from "@angular/core";
import { editor3DCursorSizeSelector, editor3DHoverCeilCoordsSelector } from "@app/reducers/viewer-3d";
import { OctreeRaycaster } from "@brakebein/threeoctree";
import { Store } from "@ngrx/store";
import { Subject, combineLatest, concatMap, distinctUntilChanged, merge, takeUntil, tap } from "rxjs";
import { CylinderGeometry, DoubleSide, Mesh, MeshBasicMaterial, Vector3 } from "three";
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

  mesh: Mesh;
  material: MeshBasicMaterial;
  geometry: CylinderGeometry;

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
        // Новая геометрия
        this.createGeometry(size, height);
        // Обновить свойства
        this.mesh.geometry = this.geometry;
        this.mesh.visible = true;
        this.mesh.position.setX(positionX);
        this.mesh.position.setY(positionY);
        this.mesh.position.setZ(positionZ);
      }
      // Скрыть курсор
      else {
        this.mesh.visible = false;
      }
    }
  }
}
