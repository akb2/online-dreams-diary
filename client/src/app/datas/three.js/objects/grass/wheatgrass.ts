import { CreateArray } from "@_datas/app";
import { DreamCeilParts, DreamCeilSize, DreamMaxElmsCount, DreamObjectElmsValues, LODMaxDistance } from "@_datas/dream-map-settings";
import { AngleToRad, Cos, IsMultiple, LineFunc, Sin } from "@_helpers/math";
import { ArrayFilter, MapCycle } from "@_helpers/objects";
import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, DreamMapCeil } from "@_models/dream-map";
import { MapObject, ObjectControllerParams, ObjectSetting } from "@_models/dream-map-objects";
import { Uniforms } from "@_models/three.js/base";
import { AddMaterialBeforeCompile } from "@_threejs/base";
import { TriangleGeometry } from "@_threejs/triangle.geometry";
import { random } from "@akb2/math";
import { BufferGeometry, Color, DoubleSide, Matrix4, MeshPhongMaterial, Object3D, Shader, TangentSpaceNormalMap, Texture, Vector2 } from "three";
import { DreamMapObjectTemplate } from "../_base";
import { AnimateNoizeShader, GetHeightByTerrain, GetRandomColorByRange, GetTextures, UpdateHeight } from "../_functions";
import { CreateTerrainTrianglesObject, GetHeightByTerrainObject } from "../_models";
import { CheckCeilForm, GetGrassSubType } from "./_functions";
import { GrassColorRange } from "./_models";





export class DreamMapWheatGrassObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  // Под тип
  static override getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights): string {
    return GetGrassSubType(ceil, neighboringCeils);
  }





  private count: number = 0;
  private lodLevels: number = 10;
  private lodDistance: number = LODMaxDistance / this.lodLevels;

  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;

  private width: number = 0.04;
  private height: number = 5;
  private noize: number = 0.15;
  private countStep: [number, number] = [1, 1];
  private scaleY: number[] = [1, 2];
  private scaleX: number[] = [1.5, 1];
  private noizeRotate: number = 90 * (this.noize / 2);
  private rotationRadiusRange: number = 30;

  private params: Params;





  // Получение объекта
  getObject(): MapObject {
    if (this.count > 0) {
      const params: Params = this.getParams;
      const { dummy, cX, cY, geometry, material } = params;
      let lX: number;
      let lY: number;
      let i: number = -1;
      let countStep: number;
      const lodDistances: number[] = [];
      const color: Color[] = [];
      const LODItemPerStep: number = this.count / this.lodLevels;
      // Цикл по количеству фрагментов
      const matrix: Matrix4[] = ArrayFilter(MapCycle(this.count, key => {
        if ((IsMultiple(i, countStep) && i !== 0) || i === -1) {
          lX = random(0, DreamCeilSize, true, 5);
          lY = random(0, DreamCeilSize, true, 5);
          countStep = random(this.countStep[0], this.countStep[1], false, 0);
          i = 0;
        }
        // Итератор
        i++;
        // Точная координата
        const x: number = cX + lX;
        const y: number = cY + lY;
        const LODStep: number = Math.floor(key / LODItemPerStep) + 1;
        // Проверка вписания в фигуру
        if (CheckCeilForm(cX, cY, x, y, this.neighboringCeils, this.ceil)) {
          const scaleY: number = random(this.scaleY[0], this.scaleY[1], false, 5);
          const scaleX: number = LineFunc(this.scaleX[0], this.scaleX[1], scaleY, this.scaleY[0], this.scaleY[1]);
          const rotationRadius: number = random(0, this.rotationRadiusRange, false, 5);
          const rotationAngle: number = random(0, 360);
          // Настройки
          dummy.rotation.set(0, 0, 0);
          dummy.position.set(x, GetHeightByTerrain(params, x, y), y);
          dummy.rotation.x = AngleToRad((rotationRadius * Sin(rotationAngle)) - this.noizeRotate);
          dummy.rotation.z = AngleToRad(rotationRadius * Cos(rotationAngle));
          dummy.rotation.y = AngleToRad(random(0, 180, false, 1));
          dummy.scale.set(scaleX, scaleY, 0);
          dummy.updateMatrix();
          // Дистанция отрисовки
          lodDistances.push(LODStep * this.lodDistance);
          color.push(GetRandomColorByRange(GrassColorRange));
          // Вернуть геометрию
          return new Matrix4().copy(dummy.matrix);
        }
        // Не отрисовывать геометрию
        return null;
      }, true), instance => !!instance);
      // Вернуть объект
      return {
        type: "wheatgrass",
        subType: DreamMapWheatGrassObject.getSubType(this.ceil, this.neighboringCeils),
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
      const objWidth: number = this.width * this.widthPart;
      const objHeight: number = this.height * this.heightPart;
      const hyp2: number = objWidth / 2;
      const leg: number = Math.sqrt(Math.pow(hyp2, 2) + Math.pow(objHeight, 2));
      const useTextureKeys: (keyof MeshPhongMaterial)[] = ["map", "aoMap", "lightMap"];
      // Данные фигуры
      const geometry: TriangleGeometry = new TriangleGeometry(leg, objWidth, leg);
      const textures: CustomObjectKey<keyof MeshPhongMaterial, Texture> = GetTextures("wheatgrass.png", "grass", useTextureKeys);
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
        normalScale: new Vector2(1, -1)
      });
      const dummy: Object3D = new Object3D();
      // Параметры
      const facesCount: number = Math.pow(geometryDatas.quality - 1, 2) * 2;
      const facesCountI: number[] = CreateArray(facesCount);
      // Запомнить параметры
      this.params = {
        ...geometryDatas,
        ...this.createParamsHelpers(),
        objWidth,
        objHeight,
        hyp2,
        material,
        leg,
        geometry,
        dummy,
        facesCount,
        facesCountI,
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
      DreamMaxElmsCount(this.dreamMapSettings.detalization);
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
    if (!this.params.shader) {
      AddMaterialBeforeCompile(this.params.material, subShader => this.params.shader = subShader);
    }
  }
}





// Интерфейс параметров для расчетов
interface Params extends GetHeightByTerrainObject, CreateTerrainTrianglesObject {
  objWidth: number;
  objHeight: number;
  hyp2: number;
  leg: number;
  geometry: TriangleGeometry;
  material: MeshPhongMaterial;
  dummy: Object3D;
  facesCount: number;
  facesCountI: number[];
  shader?: Shader;
}
