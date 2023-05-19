import { DreamCeilSize, DreamFogFar, LODMaxDistance } from "@_datas/dream-map-settings";
import { AngleToRad } from "@_helpers/math";
import { ArrayForEach, MapCycle } from "@_helpers/objects";
import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, CoordDto, DreamMapCeil } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { BoxGeometry, BufferGeometry, Color, DoubleSide, FrontSide, Matrix4, MeshPhongMaterial, Object3D, PlaneGeometry, Texture, Vector2, Vector3 } from "three";
import { DreamMapObjectTemplate } from "../_base";
import { CreateTerrainTriangles, GetHeightByTerrain, GetTextures } from "../_functions";
import { CreateTerrainTrianglesObject, DefTranslate, DefaultMatrix, GetHeightByTerrainObject } from "../_models";
import { GetFenceSubType, GetFenceWallSettings } from "./_functions";
import { AnglesA } from "./_models";





export class DreamMapRabitzNetObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {

  // Получение подтипа
  static override getSubType(ceil?: DreamMapCeil, neighboringCeils?: ClosestHeights, type: string = "", subType: string = ""): string {
    return GetFenceSubType(ceil, neighboringCeils);
  }





  private type: string = "fence-rabitz-net";

  private columnRadius: number = 0.03;
  private columnHorizontalScale: number = 0.3;
  private columnHeight: number = 0.65;
  private netHeight: number = 0.5;
  private netPositionTop: number = 0.06;

  private params: Params;





  // Получение объекта
  getObject(): MapObject[] {
    // Вернуть массив объектов
    return [
      this.getColumnInstance(),
      this.getNetInstance()
    ];
  }

  // Столб
  private getColumnInstance(): MapObject {
    const type: string = this.type + "-column";
    const params: Params = this.getParams;
    const {
      cX,
      cY,
      geometry: { column: geometry },
      material: { column: material },
      columnHeight,
      dummy: defaultDummy,
      netWidth,
      netHeight,
      netPositionTop,
      columnCount: count,
      horizontalScale
    } = params;
    const wallSettings = GetFenceWallSettings(this.ceil, this.neighboringCeils);
    const columnHeightHalf: number = columnHeight / 2;
    const x: number = cX + (DreamCeilSize / 2);
    const y: number = cY + (DreamCeilSize / 2);
    const z: number = GetHeightByTerrain(params, x, y) + columnHeightHalf;
    const lodDistances: number[] = [];
    const color: Color[] = [];
    // Настройки
    const matrix: Matrix4[] = MapCycle(count, i => {
      const dummy: Object3D = defaultDummy.clone();
      // Дальность прорисовки
      lodDistances.push(DreamFogFar);
      // Горизонтальные опоры
      if (i < wallSettings.length) {
        const setting = wallSettings[i];
        const angle: number = AnglesA[setting.neighboringName];
        const neighboringParams: Params = {
          ...params,
          ...this.createParamsHelpers(),
          ...CreateTerrainTriangles(params.terrainGeometry, setting.coords.x, setting.coords.y)
        };
        const neighboringX: number = neighboringParams.cX + (DreamCeilSize / 2);
        const neighboringY: number = neighboringParams.cY + (DreamCeilSize / 2);
        const neighboringZ: number = GetHeightByTerrain(neighboringParams, neighboringX, neighboringY) + columnHeightHalf;
        const diffZ: number = neighboringZ - z;
        const size: number = Math.sqrt(Math.pow(netWidth, 2) + Math.pow(Math.abs(diffZ) / 2, 2));
        const verticalScale: number = size / columnHeight;
        const correctAngle: number = (Math.atan2(diffZ / 2, netWidth));
        const tempZ: number = z - columnHeightHalf + netPositionTop + netHeight + (diffZ / 4);
        // Левая грань
        if (angle === 180) {
          dummy.position.set(x - (netWidth / 2), tempZ, y);
          dummy.scale.set(horizontalScale * this.columnHorizontalScale, verticalScale, this.columnHorizontalScale);
          dummy.rotateZ(AngleToRad(90) - correctAngle);
        }
        // Правая грань
        else if (angle === 0) {
          dummy.position.set(x + (netWidth / 2), tempZ, y);
          dummy.scale.set(horizontalScale * this.columnHorizontalScale, verticalScale, this.columnHorizontalScale);
          dummy.rotateZ(AngleToRad(90) + correctAngle);
        }
        // Нижняя грань
        else if (angle === 270) {
          dummy.position.set(x, tempZ, y + (netWidth / 2));
          dummy.scale.set(this.columnHorizontalScale, verticalScale, horizontalScale * this.columnHorizontalScale);
          dummy.rotateX(AngleToRad(90) - correctAngle);
        }
        // Верхняя грань
        else if (angle === 90) {
          dummy.position.set(x, tempZ, y - (netWidth / 2));
          dummy.scale.set(this.columnHorizontalScale, verticalScale, horizontalScale * this.columnHorizontalScale);
          dummy.rotateX(AngleToRad(90) + correctAngle);
        }
        // Обновить матрицу
        dummy.updateMatrix();
        color.push(null);
        // Вернуть матрицу
        return dummy.matrix.clone();
      }
      // Основной столб
      else if (i === count - 1) {
        dummy.position.set(x, z, y);
        dummy.updateMatrix();
        color.push(new Color(3, 3, 3));
        // Вернуть матрицу
        return dummy.matrix.clone();
      }
      // Нет фрагмента
      color.push(null);
      return null;
    });
    // Вернуть объект
    return {
      type,
      subType: DreamMapRabitzNetObject.getSubType(this.ceil, this.neighboringCeils),
      splitBySubType: false,
      count,
      matrix,
      skews: [],
      lodDistances,
      color,
      geometry: geometry as BufferGeometry,
      material,
      coords: {
        x: this.ceil.coord.x,
        y: this.ceil.coord.y
      },
      animate: this.animate.bind(this),
      castShadow: true,
      recieveShadow: true,
      isDefault: false,
      raycastBox: true
    };
  }

  // Сетка
  private getNetInstance(): MapObject {
    const type: string = this.type + "-wall";
    const params: Params = this.getParams;
    const {
      cX,
      cY,
      geometry: { net: geometry },
      material: { net: material },
      netHeight,
      netWidth,
      netPositionTop,
      dummy: defaultDummy,
      netCount: count
    } = params;
    const wallSettings = GetFenceWallSettings(this.ceil, this.neighboringCeils);
    const x: number = cX + (DreamCeilSize / 2);
    const y: number = cY + (DreamCeilSize / 2);
    const z: number = GetHeightByTerrain(params, x, y) + netPositionTop;
    const skews: Vector3[] = [];
    const lodDistances: number[] = [];
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = MapCycle(count, i => {
      if (i < wallSettings.length) {
        const dummy: Object3D = defaultDummy.clone();
        const setting = wallSettings[i];
        const angle: number = AnglesA[setting.neighboringName];
        const neighboringParams: Params = {
          ...params,
          ...this.createParamsHelpers(),
          ...CreateTerrainTriangles(params.terrainGeometry, setting.coords.x, setting.coords.y)
        };
        const neighboringX: number = neighboringParams.cX + (DreamCeilSize / 2);
        const neighboringY: number = neighboringParams.cY + (DreamCeilSize / 2);
        const neighboringZ: number = GetHeightByTerrain(neighboringParams, neighboringX, neighboringY) + netPositionTop;
        const diffZ: number = neighboringZ - z;
        // Настройки
        dummy.position.set(x, z, y);
        dummy.rotation.set(0, AngleToRad(angle), 0);
        dummy.translateX(netWidth / 2);
        dummy.translateY((netHeight / 2) + (diffZ / 4));
        dummy.updateMatrix();
        skews.push(new Vector3(0, diffZ, 0));
        lodDistances.push(LODMaxDistance);
        // Вернуть матрицу
        return dummy.matrix.clone();
      }
      // Матрица по умолчанию
      return null;
    }, false);
    // Вернуть сетки
    return {
      type,
      subType: DreamMapRabitzNetObject.getSubType(this.ceil, this.neighboringCeils, type),
      splitBySubType: false,
      count,
      matrix,
      color: [],
      lodDistances,
      skews,
      geometry: geometry as BufferGeometry,
      material,
      coords: {
        x: this.ceil.coord.x,
        y: this.ceil.coord.y
      },
      animate: this.animate.bind(this),
      castShadow: false,
      recieveShadow: false,
      isDefault: false,
      raycastBox: true,
      moreClosestsUpdate: true
    };
  }

  // Определение параметров
  private get getParams(): Params {
    const geometryDatas: CreateTerrainTrianglesObject = this.createTerrainTriangles();
    // Параметры уже существуют
    if (!!this.params) {
      ArrayForEach(Object.entries(geometryDatas), ([k, v]) => this.params[k] = v, true);
    }
    // Определить параметры
    else {
      const columnCount: number = 5;
      const netCount: number = 4;
      const horizontalScale: number = 0.7;
      const textureRepeat: number = 12;
      const columnDiameter: number = (this.columnRadius * DreamCeilSize) * 2;
      const columnHeight: number = this.columnHeight * DreamCeilSize;
      const netHeight: number = this.netHeight * DreamCeilSize;
      const netWidth: number = DreamCeilSize / 2;
      const netPositionTop: number = DreamCeilSize * this.netPositionTop;
      const columnGeometry: BoxGeometry = new BoxGeometry(columnDiameter, columnHeight, columnDiameter);
      const netGeometry: PlaneGeometry = new PlaneGeometry(netWidth, netWidth);
      const useTextureKeys: (keyof MeshPhongMaterial)[] = ["map"/* , "aoMap", "normalMap", "lightMap" */];
      const textures: CustomObjectKey<keyof MeshPhongMaterial, Texture> = GetTextures("rabitz.png", "fence", useTextureKeys, texture => {
        texture.repeat = new Vector2(textureRepeat, (netHeight / netWidth) * textureRepeat);
      });
      const columnMeterial: MeshPhongMaterial = new MeshPhongMaterial({ color: 0x888888, side: FrontSide, transparent: true, flatShading: true });
      const netMeterial: MeshPhongMaterial = new MeshPhongMaterial({
        ...textures,
        side: DoubleSide,
        flatShading: true,
        transparent: true,
        alphaTest: 0.5
      });
      const dummy: Object3D = new Object3D();
      // Парамтеры
      this.params = {
        ...geometryDatas,
        ...this.createParamsHelpers(),
        columnCount,
        netCount,
        horizontalScale,
        dummy,
        columnDiameter,
        columnHeight,
        netHeight,
        netWidth,
        netPositionTop,
        geometry: {
          column: columnGeometry,
          net: netGeometry
        },
        material: {
          column: columnMeterial,
          net: netMeterial
        }
      };
    }
    // Вернуть данные
    return this.params;
  }





  // Обновить позицию по оси Z
  updateHeight(objectSetting: ObjectSetting): void {
    if (objectSetting.count > 0) {
      if (objectSetting.type === this.type + "-column") {
        this.updateColumnHeight(objectSetting);
      }
      // Сетка
      else if (objectSetting.type === this.type + "-wall") {
        this.updateNetHeight(objectSetting);
      }
    }
  }

  // Обновить позицию по оси Z: опоры
  private updateColumnHeight(objectSetting: ObjectSetting): void {
    const params: Params = this.getParams;
    const matrix: Matrix4 = DefaultMatrix.clone();
    const position: Vector3 = new Vector3();
    const columnHeightHalf: number = params.columnHeight / 2;
    const wallSettings = GetFenceWallSettings(this.ceil, this.neighboringCeils);
    // Цикл по фрагментам
    ArrayForEach(objectSetting.indexKeys, (index, i) => {
      objectSetting.mesh.getMatrixAt(index, matrix);
      position.setFromMatrixPosition(matrix);
      // Горизонтальные опоры
      if (i < wallSettings.length) {
        const x: number = params.cX + (DreamCeilSize / 2);
        const y: number = params.cY + (DreamCeilSize / 2);
        const z: number = GetHeightByTerrain(params, x, y) + columnHeightHalf;
        const setting = wallSettings[i];
        const angle: number = AnglesA[setting.neighboringName];
        const neighboringParams: Params = {
          ...params,
          ...this.createParamsHelpers(),
          ...CreateTerrainTriangles(params.terrainGeometry, setting.coords.x, setting.coords.y)
        };
        const neighboringX: number = neighboringParams.cX + (DreamCeilSize / 2);
        const neighboringY: number = neighboringParams.cY + (DreamCeilSize / 2);
        const neighboringZ: number = GetHeightByTerrain(neighboringParams, neighboringX, neighboringY) + columnHeightHalf;
        const diffZ: number = neighboringZ - z;
        const size: number = Math.sqrt(Math.pow(params.netWidth, 2) + Math.pow(Math.abs(diffZ) / 2, 2));
        const verticalScale: number = size / params.columnHeight;
        const correctAngle: number = (Math.atan2(diffZ / 2, params.netWidth));
        const tempZ: number = z - columnHeightHalf + params.netPositionTop + params.netHeight + (diffZ / 4);
        // Сбросить матрицу
        matrix.identity();
        // Левая грань
        if (angle === 180) {
          matrix.makeRotationZ(AngleToRad(90) - correctAngle);
          matrix.setPosition(x - (params.netWidth / 2), tempZ, y);
          matrix.scale(new Vector3(params.horizontalScale * this.columnHorizontalScale, verticalScale, this.columnHorizontalScale));
        }
        // Правая грань
        else if (angle === 0) {
          matrix.makeRotationZ(AngleToRad(90) + correctAngle);
          matrix.setPosition(x + (params.netWidth / 2), tempZ, y);
          matrix.scale(new Vector3(params.horizontalScale * this.columnHorizontalScale, verticalScale, this.columnHorizontalScale));
        }
        // Нижняя грань
        else if (angle === 270) {
          matrix.makeRotationX(AngleToRad(90) - correctAngle);
          matrix.setPosition(x, tempZ, y + (params.netWidth / 2));
          matrix.scale(new Vector3(this.columnHorizontalScale, verticalScale, params.horizontalScale * this.columnHorizontalScale));
        }
        // Верхняя грань
        else if (angle === 90) {
          matrix.makeRotationX(AngleToRad(90) + correctAngle);
          matrix.setPosition(x, tempZ, y - (params.netWidth / 2));
          matrix.scale(new Vector3(this.columnHorizontalScale, verticalScale, params.horizontalScale * this.columnHorizontalScale));
        }
      }
      // Основной столб
      else if (i === params.columnCount - 1) {
        const translate: CoordDto = objectSetting?.translates?.length > i ? objectSetting.translates[i] ?? DefTranslate : DefTranslate;
        const x: number = position.x - translate.x;
        const z: number = position.z - translate.z;
        const y: number = GetHeightByTerrain(params, x, z) + columnHeightHalf;
        // Обновить свойства
        matrix.setPosition(x + translate.x, y + translate.y, z + translate.z);
      }
      // Запомнить позицию
      objectSetting.mesh.setMatrixAt(index, matrix);
    }, true);
    // Обновить
    objectSetting.mesh.updateMatrix();
    objectSetting.mesh.instanceMatrix.needsUpdate = true;
  }

  // Обновить позицию по оси Z: сетка
  private updateNetHeight(objectSetting: ObjectSetting): void {
    const params: Params = this.getParams;
    const matrix: Matrix4 = DefaultMatrix.clone();
    const skews: Vector3 = new Vector3();
    const x: number = params.cX + (DreamCeilSize / 2);
    const y: number = params.cY + (DreamCeilSize / 2);
    const z: number = GetHeightByTerrain(params, x, y) + params.netPositionTop;
    const wallSettings = GetFenceWallSettings(this.ceil, this.neighboringCeils);
    // Цикл по фрагментам
    ArrayForEach(objectSetting.indexKeys, (index, i) => {
      if (i < wallSettings.length) {
        const setting = wallSettings[i];
        const angle: number = AnglesA[setting.neighboringName];
        const neighboringParams: Params = {
          ...params,
          ...this.createParamsHelpers(),
          ...CreateTerrainTriangles(params.terrainGeometry, setting.coords.x, setting.coords.y)
        };
        const neighboringX: number = neighboringParams.cX + (DreamCeilSize / 2);
        const neighboringY: number = neighboringParams.cY + (DreamCeilSize / 2);
        const neighboringZ: number = GetHeightByTerrain(neighboringParams, neighboringX, neighboringY) + params.netPositionTop;
        const diffZ: number = neighboringZ - z;
        // Сбросить матрицу
        objectSetting.mesh.getMatrixAt(index, matrix);
        objectSetting.mesh.getShearAt(index, skews);
        matrix.identity();
        // Настройки
        matrix.makeRotationY(AngleToRad(angle));
        skews.set(0, diffZ, 0);
        // Левая стена
        if (setting.neighboringName === "left") {
          matrix.setPosition(x - (params.netWidth / 2), z + (params.netHeight / 2) + (diffZ / 4), y);
        }
        // Правая стена
        if (setting.neighboringName === "right") {
          matrix.setPosition(x + (params.netWidth / 2), z + (params.netHeight / 2) + (diffZ / 4), y);
        }
        // Верхняя стена
        if (setting.neighboringName === "top") {
          matrix.setPosition(x, z + (params.netHeight / 2) + (diffZ / 4), y - (params.netWidth / 2));
        }
        // Нижняя стена
        if (setting.neighboringName === "bottom") {
          matrix.setPosition(x, z + (params.netHeight / 2) + (diffZ / 4), y + (params.netWidth / 2));
        }
        // Запомнить позицию
        objectSetting.mesh.setMatrixAt(index, matrix);
        objectSetting.mesh.setShearAt(index, skews);
      }
    }, true);
    // Обновить
    objectSetting.mesh.updateMatrix();
    objectSetting.mesh.instanceMatrix.needsUpdate = true;
    objectSetting.mesh.instanceShear.needsUpdate = true;
  }

  // Очистка памяти
  destroy(): void {
  }





  // Анимация
  animate(): void {
  }
}





// Интерфейс параметров для расчетов
interface Params extends GetHeightByTerrainObject, CreateTerrainTrianglesObject {
  columnCount: number;
  netCount: number;
  horizontalScale: number;
  columnDiameter: number;
  columnHeight: number;
  netWidth: number;
  netHeight: number;
  netPositionTop: number;
  dummy: Object3D;
  geometry: {
    column: BoxGeometry,
    net: PlaneGeometry
  };
  material: {
    column: MeshPhongMaterial,
    net: MeshPhongMaterial
  };
}
