import { DreamCeilSize, DreamFogFar, LODMaxDistance } from "@_datas/dream-map-settings";
import { AngleToRad, Cos, GetLengthFromSquareCenter, Sin } from "@_helpers/math";
import { ArrayForEach, MapCycle } from "@_helpers/objects";
import { ClosestHeights, CoordDto, DreamMapCeil } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { CustomObjectKey } from "@akb2/types-tools";
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
      this.getBorderInstance(),
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
      dummy: defaultDummy
    } = params;
    const columnHeightHalf: number = columnHeight / 2;
    const x: number = cX + (DreamCeilSize / 2);
    const y: number = cY + (DreamCeilSize / 2);
    const z: number = GetHeightByTerrain(params, x, y) + columnHeightHalf;
    const lodDistances: number[] = [];
    const dummy: Object3D = defaultDummy.clone();
    // Настройки
    dummy.position.set(x, z, y);
    dummy.updateMatrix();
    // Вернуть матрицу
    const matrix: Matrix4 = dummy.matrix.clone();
    // Вернуть объект
    return {
      type,
      subType: DreamMapRabitzNetObject.getSubType(this.ceil, this.neighboringCeils),
      splitBySubType: false,
      count: 1,
      matrix: [matrix],
      skews: [],
      lodDistances,
      color: [],
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

  // Перегородки
  private getBorderInstance(): MapObject {
    const type: string = this.type + "-border";
    const params: Params = this.getParams;
    const {
      cX,
      cY,
      geometry: { border: geometry },
      material: { border: material },
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
        const width: number = GetLengthFromSquareCenter(netWidth, angle);
        const size: number = Math.sqrt(Math.pow(width * 2, 2) + Math.pow(Math.abs(diffZ) / 2, 2));
        const positionX: number = x + (width * Cos(angle));
        const positionY: number = z - columnHeightHalf + netPositionTop + netHeight + (diffZ / 4);
        const positionZ: number = y - (width * Sin(angle));
        const scaleX: number = horizontalScale * this.columnHorizontalScale;
        const scaleY: number = size / columnHeight;
        const scaleZ: number = this.columnHorizontalScale;
        const rotateY: number = AngleToRad(angle);
        const rotateZ: number = AngleToRad(90) + Math.atan2(diffZ / 2, width * 2);
        // Свойства
        dummy.position.set(positionX, positionY, positionZ);
        dummy.scale.set(scaleX, scaleY, scaleZ);
        dummy.rotateY(rotateY);
        dummy.updateMatrix();
        dummy.rotateZ(rotateZ);
        dummy.updateMatrix();
        color.push(null);
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
        const width: number = GetLengthFromSquareCenter(netWidth, angle);
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
        dummy.scale.set(width / (netWidth / 2), 1, 1);
        dummy.position.set(x, z, y);
        dummy.rotation.set(0, AngleToRad(angle), 0);
        dummy.translateX(width);
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
      const columnCount: number = 8;
      const netCount: number = 8;
      const horizontalScale: number = 0.7;
      const columnTextureRepeat: number = 0.5;
      const netTextureRepeat: number = 12;
      const columnDiameter: number = (this.columnRadius * DreamCeilSize) * 2;
      const columnHeight: number = this.columnHeight * DreamCeilSize;
      const netHeight: number = this.netHeight * DreamCeilSize;
      const netWidth: number = DreamCeilSize / 2;
      const netPositionTop: number = DreamCeilSize * this.netPositionTop;
      const columnGeometry: BoxGeometry = new BoxGeometry(columnDiameter, columnHeight, columnDiameter);
      const netGeometry: PlaneGeometry = new PlaneGeometry(netWidth, netWidth);
      const useTextureKeys: (keyof MeshPhongMaterial)[] = ["map"/* , "aoMap", "normalMap", "lightMap" */];
      const netTextures: CustomObjectKey<keyof MeshPhongMaterial, Texture> = GetTextures("rabitz.png", "fence", useTextureKeys,
        texture => texture.repeat = new Vector2(netTextureRepeat, (netHeight / netWidth) * netTextureRepeat)
      );
      const wallTextures: CustomObjectKey<keyof MeshPhongMaterial, Texture> = GetTextures("wall.jpg", "fence", useTextureKeys,
        texture => texture.repeat = new Vector2(columnTextureRepeat, (columnHeight / columnDiameter) * columnTextureRepeat)
      );
      const columnMeterial: MeshPhongMaterial = new MeshPhongMaterial({
        ...wallTextures,
        color: 0xffffff,
        side: FrontSide,
        transparent: true,
        flatShading: false
      });
      const borderMeterial: MeshPhongMaterial = new MeshPhongMaterial({
        color: 0x888888,
        side: FrontSide,
        transparent: true,
        flatShading: true
      });
      const netMeterial: MeshPhongMaterial = new MeshPhongMaterial({
        ...netTextures,
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
          border: columnGeometry,
          net: netGeometry
        },
        material: {
          column: columnMeterial,
          border: borderMeterial,
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
      // Перегородки
      else if (objectSetting.type === this.type + "-border") {
        this.updateBorderHeight(objectSetting);
      }
      // Сетка
      else if (objectSetting.type === this.type + "-wall") {
        this.updateNetHeight(objectSetting);
      }
    }
  }

  // Обновить позицию по оси Z: столб
  private updateColumnHeight(objectSetting: ObjectSetting): void {
    const params: Params = this.getParams;
    const matrix: Matrix4 = DefaultMatrix.clone();
    const position: Vector3 = new Vector3();
    const columnHeightHalf: number = params.columnHeight / 2;
    // Цикл по фрагментам
    ArrayForEach(objectSetting.indexKeys, (index, i) => {
      objectSetting.mesh.getMatrixAt(index, matrix);
      position.setFromMatrixPosition(matrix);
      // Основной столб
      const translate: CoordDto = objectSetting?.translates?.length > i ? objectSetting.translates[i] ?? DefTranslate : DefTranslate;
      const x: number = position.x - translate.x;
      const z: number = position.z - translate.z;
      const y: number = GetHeightByTerrain(params, x, z) + columnHeightHalf;
      // Обновить свойства
      matrix.setPosition(x + translate.x, y + translate.y, z + translate.z);
      // Запомнить позицию
      objectSetting.mesh.setMatrixAt(index, matrix);
    }, true);
    // Обновить
    objectSetting.mesh.updateMatrix();
    objectSetting.mesh.instanceMatrix.needsUpdate = true;
  }

  // Обновить позицию по оси Z: перегородки
  private updateBorderHeight(objectSetting: ObjectSetting): void {
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
        const width: number = GetLengthFromSquareCenter(params.netWidth, angle);
        const size: number = Math.sqrt(Math.pow(width * 2, 2) + Math.pow(Math.abs(diffZ) / 2, 2));
        const positionX: number = x + (width * Cos(angle));
        const positionY: number = z - columnHeightHalf + params.netPositionTop + params.netHeight + (diffZ / 4);
        const positionZ: number = y - (width * Sin(angle));
        const scaleX: number = params.horizontalScale * this.columnHorizontalScale;
        const scaleY: number = size / params.columnHeight;
        const scaleZ: number = this.columnHorizontalScale;
        const rotateY: Matrix4 = DefaultMatrix.clone().makeRotationY(AngleToRad(angle));
        const rotateZ: Matrix4 = DefaultMatrix.clone().makeRotationZ(AngleToRad(90) + Math.atan2(diffZ / 2, width * 2));
        const scale: Matrix4 = DefaultMatrix.clone().makeScale(scaleX, scaleY, scaleZ);
        // Сбросить матрицу
        matrix.identity();
        matrix.multiply(rotateY);
        matrix.multiply(rotateZ);
        matrix.setPosition(positionX, positionY, positionZ);
        matrix.multiply(scale);
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
        const width: number = GetLengthFromSquareCenter(params.netWidth, angle);
        const diffZ: number = neighboringZ - z;
        const positionX: number = x + (width * Cos(angle));
        const positionY: number = z + (params.netHeight / 2) + (diffZ / 4);
        const positionZ: number = y - (width * Sin(angle));
        // Сбросить матрицу
        objectSetting.mesh.getMatrixAt(index, matrix);
        objectSetting.mesh.getShearAt(index, skews);
        // Настройки
        matrix.setPosition(positionX, positionY, positionZ);
        skews.set(0, diffZ, 0);
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
    border: BoxGeometry,
    net: PlaneGeometry
  };
  material: {
    column: MeshPhongMaterial,
    border: MeshPhongMaterial,
    net: MeshPhongMaterial
  };
}
