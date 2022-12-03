import { CreateArray, CustomObjectKey, IsEven, IsMultiple, Random } from "@_models/app";
import { CoordDto } from "@_models/dream-map";
import { ObjectSetting } from "@_models/dream-map-objects";
import { DreamCeilSize, DreamMapSize } from "@_models/dream-map-settings";
import { ColorRange, CreateTerrainTrianglesObject, DefTranslate, GetHeightByTerrainObject, GetTextureLoader, MaxHeight, ShaderUniforms, TextureKeys } from "@_services/dream-map/objects/_models";
import { NoizeShader } from "@_services/dream-map/shaders/noise";
import { GeometryQuality } from "@_services/dream-map/terrain.service";
import { Clock, Color, Float32BufferAttribute, LinearFilter, Material, Matrix4, MeshStandardMaterial, PlaneGeometry, Shader, sRGBEncoding, Texture, Triangle, Vector3 } from "three";





// Функция определения положения объекта на координате Y
export const GetHeightByTerrain = (params: GetHeightByTerrainObject, x: number, y: number) => {
  const step: number = DreamCeilSize;
  let { qualityHelper, hyp, v1, v2, dir, ray, intersect, triangle, faces, cX, cY, terrainGeometry }: GetHeightByTerrainObject = params;
  let lX: number = x - cX;
  let lY: number = y - cY;
  // Корректировка координат
  if (lX > step || lY > step || lX < 0 || lY < 0) {
    const oWidth: number = ((terrainGeometry.parameters.width / ((GeometryQuality * 2) + 1)) / DreamCeilSize) ?? DreamMapSize;
    const oHeight: number = ((terrainGeometry.parameters.height / ((GeometryQuality * 2) + 1)) / DreamCeilSize) ?? DreamMapSize;
    const widthCorrect: number = -(oWidth * DreamCeilSize) / 2;
    const heightCorrect: number = -(oHeight * DreamCeilSize) / 2;
    const xCorr: number = Math.floor(lX / step);
    const yCorr: number = Math.floor(lY / step);
    const ceilX: number = (Math.floor(x + xCorr) / DreamCeilSize) - widthCorrect;
    const ceilY: number = (Math.floor(y + yCorr) / DreamCeilSize) - heightCorrect;
    // Новые параметры
    const terrainParams: CreateTerrainTrianglesObject = CreateTerrainTriangles(terrainGeometry, ceilX, ceilY);
    // Обновить координаты
    faces = terrainParams.faces;
    cX = terrainParams.cX;
    cY = terrainParams.cY;
    lX = x + xCorr - cX;
    lY = y + yCorr - cY;
  }
  // Параметры
  const xSeg: number = Math.floor(lX * qualityHelper);
  const ySeg: number = Math.floor(lY * qualityHelper);
  const locHyp: number = Math.sqrt(Math.pow((lX - (xSeg / qualityHelper)) + (lY - (ySeg / qualityHelper)), 2) * 2);
  const seg: number = locHyp >= hyp ? 1 : 0;
  const faceIndex: number = (((ySeg * qualityHelper) + xSeg) * 2) + seg;
  // Поиск координаты Z
  v1.set(x, y, 0);
  v2.set(x, y, MaxHeight);
  dir.subVectors(v2, v1).normalize();
  dir.normalize();
  ray.set(v1, dir);
  ray.intersectTriangle(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c, false, intersect);
  triangle.set(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c);
  // Координата Z
  return intersect.z;
};

// Функция обновлеия высоты
export const UpdateHeight = (objectSetting: ObjectSetting, params: GetHeightByTerrainObject) => {
  if (objectSetting.count > 0) {
    const matrix: Matrix4 = new Matrix4();
    const position: Vector3 = new Vector3();
    // Цикл по фрагментам
    objectSetting.indexKeys.forEach((index, i) => {
      objectSetting.mesh.getMatrixAt(index, matrix);
      position.setFromMatrixPosition(matrix);
      // Координаты
      const translate: CoordDto = objectSetting?.translates?.length > i ? objectSetting.translates[i] ?? DefTranslate : DefTranslate;
      const x: number = position.x - translate.x;
      const z: number = position.z - translate.z;
      const y: number = GetHeightByTerrain(params, x, z);
      // Запомнить позицию
      matrix.setPosition(x + translate.x, y + translate.y, z + translate.z);
      objectSetting.mesh.setMatrixAt(index, matrix);
    });
    // Обновить
    objectSetting.mesh.updateMatrix();
    objectSetting.mesh.instanceMatrix.needsUpdate = true;
  }
};

// Создание массива треугольников для рельефа
export const CreateTerrainTriangles = (terrainGeometry: PlaneGeometry, x: number, y: number) => {
  const quality: number = (terrainGeometry.parameters.widthSegments / terrainGeometry.parameters.width) + 1;
  const qualityHelper: number = quality - 1;
  const hyp: number = Math.sqrt(Math.pow(DreamCeilSize / qualityHelper, 2) * 2);
  const vertexItterator: number[] = CreateArray(quality);
  const facesCount: number = Math.pow(qualityHelper, 2) * 2;
  const facesCountItterator: number[] = CreateArray(facesCount);
  const vertexes: Float32BufferAttribute = terrainGeometry.getAttribute("position") as Float32BufferAttribute;
  const wdth: number = terrainGeometry.parameters.widthSegments + 1;
  const oWidth: number = ((terrainGeometry.parameters.width / ((GeometryQuality * 2) + 1)) / DreamCeilSize) ?? DreamMapSize;
  const oHeight: number = ((terrainGeometry.parameters.height / ((GeometryQuality * 2) + 1)) / DreamCeilSize) ?? DreamMapSize;
  const borderOSize: number = (terrainGeometry.parameters.width - oWidth) / 2;
  const widthCorrect: number = -(oWidth * DreamCeilSize) / 2;
  const heightCorrect: number = -(oHeight * DreamCeilSize) / 2;
  const facesTriangle: Triangle[] = facesCountItterator.map(() => new Triangle());
  const vertexVector3: Vector3[] = vertexItterator.map(() => vertexItterator.map(() => 0)).reduce((o, v) => ([...o, ...v]), []).map(() => new Vector3());
  const cX: number = widthCorrect + (x * DreamCeilSize);
  const cY: number = heightCorrect + (y * DreamCeilSize);
  let vertexStart: number = 0;
  // Поиск вершин ячейки
  const vertex: Vector3[] = vertexItterator
    .map(h => borderOSize + (cY - widthCorrect) + h)
    .map(h => vertexItterator.map(w => (h * wdth) + (borderOSize + (cX - widthCorrect) + w)))
    .reduce((o, v) => ([...o, ...v]), [])
    .map((i, k) => vertexVector3[k].set(vertexes.getX(i), -vertexes.getY(i), vertexes.getZ(i)))
    .sort((a, b) => {
      const rA: number = a.y * quality + a.x;
      const rB: number = b.y * quality + b.x;
      // Проверка
      return rA > rB ? 1 : rA < rB ? -1 : 0
    });
  // Поиск фрагментов ячейки
  const faces: Triangle[] = facesCountItterator.map(i => {
    const isOdd: boolean = IsEven(i);
    const isEnd: boolean = IsMultiple(i + 1, quality) && i > 0;
    const a: number = vertexStart;
    const b: number = isOdd ? vertexStart + 1 : vertexStart + qualityHelper;
    const c: number = vertexStart + qualityHelper + 1;
    // Увеличить инкримент
    vertexStart = isOdd || isEnd ? vertexStart + 1 : vertexStart;
    // Вернуть сторону
    return facesTriangle[i].set(vertex[a], vertex[b], vertex[c]);
  });
  // Вернуть данные
  return {
    terrainGeometry,
    oWidth,
    oHeight,
    widthCorrect,
    heightCorrect,
    borderOSize,
    quality,
    qualityHelper,
    wdth,
    vertexItterator,
    vertexVector3,
    vertexes,
    facesCount,
    facesCountItterator,
    facesTriangle,
    vertex,
    faces,
    hyp,
    cX,
    cY
  } as CreateTerrainTrianglesObject;
};

// Случайный цвет из диапазона
export const GetRandomColorByRange = ([rA, rB, gA, gB, bA, bB]: ColorRange, afterDotNum: number = 5) => new Color(
  Random(rA, rB, false, afterDotNum),
  Random(gA, gB, false, afterDotNum),
  Random(bA, bB, false, afterDotNum)
);

// Создание анимации ветра
export const CreateNoizeShader = (shader: Shader, material: Material, noize: number, defineVuV: boolean = false, callback: (shader: Shader) => void) => {
  if (!shader) {
    material.onBeforeCompile = subShader => {
      NoizeShader(material, subShader, noize, defineVuV);
      callback(subShader);
    };
  }
  // Вернуть шейдер
  return shader;
};

// Анимация для шейдера ветра
export const AnimateNoizeShader = (uniforms: ShaderUniforms, clock: Clock) => {
  if (!!uniforms?.time) {
    uniforms.time.value = clock.getElapsedTime();
  }
};

// Пакет текстур
type GetTexturesType = (name: string, path: string, useKeys?: (keyof MeshStandardMaterial)[], callback?: (texture: Texture) => void) =>
  CustomObjectKey<keyof MeshStandardMaterial, Texture>;
export const GetTextures: GetTexturesType = (name: string, path: string, useKeys: (keyof MeshStandardMaterial)[] = null, callback: (texture: Texture) => void = null) => TextureKeys
  .filter(([key]) => !useKeys || useKeys.includes(key))
  .map(([key, type]) => ([key, GetTextureLoader.load("/assets/dream-map/object/" + path + "/" + type + "/" + name, texture => {
    texture.encoding = sRGBEncoding;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    // Доп обработка
    if (!!callback) {
      callback(texture);
    }
  })]))
  .reduce((o, [key, texture]) => ({ ...o, [key as keyof MeshStandardMaterial]: texture as Texture }), {});
