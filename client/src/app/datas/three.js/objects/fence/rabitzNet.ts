import { DreamCeilSize } from "@_datas/dream-map-settings";
import { ArrayForEach } from "@_helpers/objects";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { BoxGeometry, BufferGeometry, DoubleSide, FrontSide, Matrix4, MeshLambertMaterial, Object3D, PlaneGeometry } from "three";
import { DreamMapObjectTemplate } from "../_base";
import { GetHeightByTerrain, UpdateHeight } from "../_functions";
import { CreateTerrainTrianglesObject, DefaultMatrix, GetHeightByTerrainObject } from "../_models";





export class DreamMapRabitzNetObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {

  private type: string = "fence-rabitz-net";

  private columnRadius: number = 0.01;
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
    const { cX, cY, geometry: { column: geometry }, material: { column: material }, columnHeight } = params;
    const dummy: Object3D = new Object3D();
    const x: number = cX + (DreamCeilSize / 2);
    const y: number = cY + (DreamCeilSize / 2);
    const z: number = GetHeightByTerrain(params, x, y) + (columnHeight / 2);
    // Настройки
    dummy.matrix = DefaultMatrix.clone();
    dummy.position.set(x, z, y);
    dummy.updateMatrix();
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = [dummy.matrix.clone()];
    // Вернуть объект
    return {
      type,
      subType: DreamMapRabitzNetObject.getSubType(this.ceil, this.neighboringCeils),
      splitBySubType: false,
      count: 1,
      matrix,
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

  // Сетка
  private getNetInstance(): MapObject {
    const type: string = this.type + "-net";
    const params: Params = this.getParams;
    const { cX, cY, geometry: { net: geometry }, material: { net: material }, netHeight, netWidth, netPositionTop } = params;
    const dummy: Object3D = new Object3D();
    const x: number = cX + (DreamCeilSize / 2);
    const y: number = cY + (DreamCeilSize / 2);
    const z: number = GetHeightByTerrain(params, x, y) + netPositionTop;
    // Настройки
    dummy.matrix = DefaultMatrix.clone();
    dummy.position.set(x, z, y);
    dummy.translateX(netWidth / 2);
    dummy.translateY(netHeight / 2);
    geometry.applyMatrix4(dummy.matrix);
    dummy.updateMatrix();
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = [dummy.matrix.clone()];
    // Вернуть сетки
    return {
      type,
      subType: DreamMapRabitzNetObject.getSubType(this.ceil, this.neighboringCeils),
      splitBySubType: false,
      count: 1,
      matrix,
      color: [],
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
      raycastBox: true
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
      const columnDiameter: number = (this.columnRadius * DreamCeilSize) * 2;
      const columnHeight: number = this.columnHeight * DreamCeilSize;
      const netHeight: number = this.netHeight * DreamCeilSize;
      const netWidth: number = DreamCeilSize / 2;
      const netPositionTop: number = DreamCeilSize * this.netPositionTop;
      const columnGeometry: BoxGeometry = new BoxGeometry(columnDiameter, columnHeight, columnDiameter);
      const netGeometry: PlaneGeometry = new PlaneGeometry(netWidth, netWidth);
      const columnMeterial: MeshLambertMaterial = new MeshLambertMaterial({ color: 0x888888, side: FrontSide });
      const netMeterial: MeshLambertMaterial = new MeshLambertMaterial({ color: 0x888888, side: DoubleSide });
      // Парамтеры
      this.params = {
        ...geometryDatas,
        ...this.createParamsHelpers(),
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
        },
      };
    }
    // Вернуть данные
    return this.params;
  }





  // Обновить позицию по оси Z
  updateHeight(objectSetting: ObjectSetting): void {
    UpdateHeight(objectSetting, this.getParams);
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
  columnDiameter: number;
  columnHeight: number;
  netWidth: number;
  netHeight: number;
  netPositionTop: number;
  geometry: {
    column: BoxGeometry,
    net: PlaneGeometry
  };
  material: {
    column: MeshLambertMaterial,
    net: MeshLambertMaterial
  };
}
