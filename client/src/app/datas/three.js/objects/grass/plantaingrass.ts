import { CreateArray } from "@_datas/app";
import { DreamCeilSize, DreamMaxElmsCount, DreamObjectElmsValues, LODMaxDistance } from "@_datas/dream-map-settings";
import { AngleToRad, IsMultiple, Random } from "@_helpers/math";
import { ArrayFilter, MapCycle } from "@_helpers/objects";
import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, DreamMapCeil } from "@_models/dream-map";
import { MapObject, ObjectControllerParams, ObjectSetting } from "@_models/dream-map-objects";
import { AddMaterialBeforeCompile } from "@_threejs/base";
import { BufferGeometry, CircleGeometry, Color, DoubleSide, Matrix4, MeshPhongMaterial, Object3D, PlaneGeometry, Shader, TangentSpaceNormalMap, Texture, Vector2 } from "three";
import { DreamMapObjectTemplate } from "../_base";
import { AnimateNoizeShader, GetHeightByTerrain, GetRandomColorByRange, GetTextures, UpdateHeight } from "../_functions";
import { CreateTerrainTrianglesObject, GetHeightByTerrainObject } from "../_models";
import { CheckCeilForm, GetGrassSubType } from "./_functions";
import { GrassColorRange } from "./_models";
import { Uniforms } from "@_models/three.js/base";





export class DreamMapPlantainGrassObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  // Под тип
  static override getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights): string {
    return GetGrassSubType(ceil, neighboringCeils);
  }





  private count: number = 0;
  private lodLevels: number = 10;
  private lodDistance: number = LODMaxDistance / this.lodLevels;

  private widthPart: number = DreamCeilSize;

  private size: number = 0.02;
  private noize: number = 0.08;
  private countStep: [number, number] = [1, 7];
  private itemRotateRange: [number, number] = [-10, 10];
  private scaleRange: [number, number] = [1, 1.6];
  private rotationRadiusRange: [number, number] = [60, 20];

  private params: Params;





  // Получение объекта
  getObject(): MapObject {
    if (this.count > 0) {
      const params: Params = this.getParams;
      const { dummy, cX, cY, geometry, material } = params;
      const lodItemPerStep: number = this.count / this.lodLevels;
      let lX: number;
      let lY: number;
      let i: number = -1;
      let countStep: number;
      const lodDistances: number[] = [];
      const color: Color[] = [];
      // Цикл по количеству фрагментов
      const matrix: Matrix4[] = ArrayFilter(MapCycle(this.count, key => {
        if ((IsMultiple(i, countStep) && i !== 0) || i === -1) {
          lX = Random(0, DreamCeilSize, true, 5);
          lY = Random(0, DreamCeilSize, true, 5);
          countStep = Random(this.countStep[0], this.countStep[1], false, 0);
          i = 0;
        }
        // Итератор
        i++;
        // Точная координата
        const x: number = cX + lX;
        const y: number = cY + lY;
        const stepAngle: number = 360 / countStep;
        const lodStep: number = Math.floor(key / lodItemPerStep) + 1;
        // Проверка вписания в фигуру
        if (CheckCeilForm(cX, cY, x, y, this.neighboringCeils, this.ceil)) {
          const scale: number = Random(this.scaleRange[0], this.scaleRange[1], false, 5);
          const rotateY: number = (stepAngle * i) + Random(this.itemRotateRange[0], this.itemRotateRange[1]);
          // Настройки
          dummy.rotation.set(0, 0, 0);
          dummy.position.set(x, GetHeightByTerrain(params, x, y), y);
          dummy.rotateY(AngleToRad(rotateY));
          dummy.rotateX(AngleToRad(Random(this.rotationRadiusRange[0], this.rotationRadiusRange[1])));
          dummy.scale.setScalar(scale);
          dummy.updateMatrix();
          // Дистанция отрисовки
          lodDistances.unshift(lodStep * this.lodDistance);
          color.unshift(GetRandomColorByRange(GrassColorRange));
          // Вернуть геометрию
          return new Matrix4().copy(dummy.matrix);
        }
        // Не отрисовывать геометрию
        return null;
      }, true), instance => !!instance);
      // Вернуть объект
      return {
        type: "plantaingrass",
        subType: DreamMapPlantainGrassObject.getSubType(this.ceil, this.neighboringCeils),
        splitBySubType: false,
        count: this.count,
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
        castShadow: false,
        recieveShadow: true,
        isDefault: false,
        noize: this.noize
      };
    }
    // Пустой объект
    return null;
  }

  // Определение параметров
  private get getParams(): Params {
    const geometryDatas: CreateTerrainTrianglesObject = this.createTerrainTriangles();
    // Параметры уже существуют
    if (!!this.params) {
      Object.entries(geometryDatas).forEach(([k, v]) => this.params[k] = v);
    }
    // Определить параметры
    else {
      const objSize: number = this.size * this.widthPart;
      const geometryRadius: number = objSize;
      const useTextureKeys: (keyof MeshPhongMaterial)[] = ["map", "aoMap", "lightMap"];
      // Данные фигуры
      const textures: CustomObjectKey<keyof MeshPhongMaterial, Texture> = GetTextures("plantaingrass.png", "grass", useTextureKeys);
      const geometry: CircleGeometry = new CircleGeometry(geometryRadius, 6);
      const material: MeshPhongMaterial = new MeshPhongMaterial({
        fog: true,
        side: DoubleSide,
        transparent: true,
        alphaTest: 0.7,
        flatShading: true,
        ...textures,
        aoMapIntensity: -0.1,
        lightMapIntensity: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1)
      });
      const dummy: Object3D = new Object3D();
      // Параметры
      const facesCount: number = Math.pow(geometryDatas.quality - 1, 2) * 2;
      const facesCountI: number[] = CreateArray(facesCount);
      // Настройки геометрии
      geometry.applyMatrix4(new Matrix4().makeTranslation(0, geometryRadius, 0));
      geometry.scale(1, 1.5, 0);
      geometry.setAttribute("uv2", geometry.getAttribute("uv"));
      // Запомнить параметры
      this.params = {
        ...geometryDatas,
        ...this.createParamsHelpers(),
        objSize,
        material,
        geometry,
        dummy,
        facesCountI
      };
      // Создание шейдера
      this.createShader();
    }
    // Вернуть данные
    return this.params;
  }

  // Вычислить количество элементов
  private setCount(): void {
    this.count = this.dreamMapSettings.detalization === DreamObjectElmsValues.VeryLow ?
      0 :
      Math.ceil(DreamMaxElmsCount(this.dreamMapSettings.detalization) / 4);
  }





  constructor(...params: ObjectControllerParams) {
    super(...params);
    // Обновить
    this.setCount();
  }

  // Обновить сведения уже существующего сервиса
  override updateDatas(...params: ObjectControllerParams) {
    super.updateDatas(...params);
    // Обновить
    this.setCount();
    // Вернуть класс
    return this;
  }

  // Обновить позицию по оси Z
  updateHeight(objectSetting: ObjectSetting): void {
    UpdateHeight(objectSetting, this.getParams);
  }

  // Очистка памяти
  destroy(): void {
    this.params?.dummy?.remove();
    delete this.params;
  }





  // Анимация
  animate(): void {
    AnimateNoizeShader(this.params?.shader?.uniforms as Uniforms, this.clock);
  }

  // Создание шейдера
  private createShader(): void {
    if (!this.params?.shader) {
      AddMaterialBeforeCompile(this.params.material, subShader => this.params.shader = subShader);
    }
  }
}





// Интерфейс параметров для расчетов
interface Params extends GetHeightByTerrainObject, CreateTerrainTrianglesObject {
  objSize: number;
  geometry: CircleGeometry;
  material: MeshPhongMaterial;
  dummy: Object3D;
  terrainGeometry: PlaneGeometry;
  facesCountI: number[];
  shader?: Shader;
}
