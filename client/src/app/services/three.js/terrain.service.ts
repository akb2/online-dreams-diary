import { CreateArray, VoidFunctionVar } from "@_datas/app";
import { MapTerrains, ReliefTexturePath, TerrainTexturePath, TexturePaths } from "@_datas/dream-map";
import { DreamMapTerrainName } from "@_datas/dream-map-objects";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamOutsideSize, DreamTerrain } from "@_datas/dream-map-settings";
import { MapTextureName, MaskNames, MaskTextureNamePreffix, NormalMapTextureName, TerrainColorDepth, TerrainDefines, TerrainFragmentShader, TerrainRepeat, TerrainUniforms, TerrainVertexShader } from "@_datas/three.js/shaders/terrain.shader";
import { AngleToRad, CheckInRange, MathRound } from "@_helpers/math";
import { ArrayFind, ArrayForEach, ArraySome, ForCycle, MapCycle, XYForEach, XYMapEach } from "@_helpers/objects";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { ClosestHeightName, ClosestHeights, Coord, DreamMap, DreamMapCeil, MapTerrain, ReliefType, XYCoord } from "@_models/dream-map";
import { ImageExtension } from "@_models/screen";
import { Uniforms } from "@_models/three.js/base";
import { ScreenService } from "@_services/screen.service";
import { Injectable, OnDestroy } from "@angular/core";
import { Observable, Subject, forkJoin, map, mergeMap, of, takeUntil, tap } from "rxjs";
import { BackSide, CanvasTexture, DataTexture, Float32BufferAttribute, FrontSide, LinearEncoding, LinearFilter, LinearMipmapLinearFilter, Mesh, MirroredRepeatWrapping, PlaneGeometry, RGBAFormat, ShaderMaterial, Texture, TextureLoader, UniformsUtils } from "three";



@Injectable()
export class DreamMapTerrainService implements OnDestroy {
  outsideMapSize = DreamOutsideSize;

  private textureLoader: TextureLoader = new TextureLoader();

  private dreamMap: DreamMap;
  private geometry: PlaneGeometry;
  private material: ShaderMaterial;
  private reliefDatas: ReliefData[] = [];

  displacementTexture: DataTexture;

  private reliefCoords: CustomObjectKey<ReliefName, XYCoord> = {};

  private destroyed$: Subject<void> = new Subject<void>();



  // Получить ячейку
  private getCeil(x: number, y: number): DreamMapCeil {
    return this.isBorder(x, y) || !this.dreamMap?.ceils?.some(c => c.coord.x === x && c.coord.y === y) ?
      this.getDefaultCeil(x, y) :
      this.dreamMap?.ceils?.find(c => c.coord.x === x && c.coord.y === y);
  }

  // Ячейка по умолчанию
  private getDefaultCeil(x: number, y: number): DreamMapCeil {
    let z = DreamDefHeight;
    // Поиск высоты для ячейки за пределами карты
    if (this.isBorder(x, y) && !!this.displacementTexture) {
      const oWidth = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight = this.dreamMap.size.height ?? DreamMapSize;
      const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
      const width = (borderOSize * 2) + oWidth;
      const iX = x + borderOSize;
      const iY = y + borderOSize;
      const index = ((iY * width) + iX) * 4;
      const color = CreateArray(3).map(k => this.displacementTexture.image.data[index + k]).reduce((o, n) => o + n, 0) / 3;
      // Запомнить высоту
      z = (color * DreamMaxHeight) / 255;
    }
    // Вернуть объект
    return {
      place: null,
      terrain: DreamTerrain,
      object: null,
      coord: { x, y, z, originalZ: z }
    };
  }

  // Приграничная ячейка
  private isBorder(x: number, y: number): boolean {
    const width = this.dreamMap?.size?.width || DreamMapSize;
    const height = this.dreamMap?.size?.height || DreamMapSize;
    // Проверка
    return x < 0 || y < 0 || x >= width || y >= height;
  }

  // Объект для отрисовки
  getObject(dreamMap: DreamMap): Observable<Mesh> {
    this.dreamMap = dreamMap;
    // Параметры
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const borderSize = borderOSize * DreamCeilSize;
    const width = (oWidth * DreamCeilSize) + (borderSize * 2);
    const height = (oHeight * DreamCeilSize) + (borderSize * 2);
    const qualityWidth = width * GeometryQuality;
    const qualityHeight = height * GeometryQuality;
    // Создание геометрии
    this.geometry = new PlaneGeometry(width, height, qualityWidth, qualityHeight);
    this.geometry.setAttribute("uv2", this.geometry.getAttribute("uv"));
    // Вернуть координаты
    this.reliefCoords = ReliefSideNames.map((n, y) => n.map((name, x) => ({ name, x, y })))
      .reduce((o, d) => ([...o, ...d]), [])
      .filter(({ name }) => !!name)
      .map(o => ({ ...o, x: oWidth * o.x, y: oHeight * o.y }))
      .reduce((o, { name, x, y }) => ({ ...o, [name]: { x, y } }), {});
    // Материал
    const material: ShaderMaterial = this.getMaterial;
    // Настройки объекта
    const mesh: Mesh = new Mesh(this.geometry, material);
    mesh.rotateX(AngleToRad(-90));
    mesh.matrixAutoUpdate = false;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.updateMatrix();
    mesh.name = DreamMapTerrainName;
    // Отдать объект
    return this.createRelief().pipe(
      tap(() => this.setDisplacementMap()),
      map(() => mesh),
      takeUntil(this.destroyed$)
    );
  }

  // Загрузить текстуру
  private loadTexture(src: string, ext: ImageExtension, name: string): Texture {
    return this.textureLoader.load(src + "." + ext, texture => {
      texture.format = RGBAFormat;
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.encoding = LinearEncoding;
      texture.wrapS = MirroredRepeatWrapping;
      texture.wrapT = MirroredRepeatWrapping;
      texture.anisotropy = 0;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      // Обновить
      this.material.uniforms[name].value = texture;
      this.material.uniformsNeedUpdate = true;
    })
  }

  // Шейдер смешивания текстур (Splat Map)
  private get getMaterial(): ShaderMaterial {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = this.outsideMapSize * Math.max(oWidth, oHeight);
    const width = oWidth + (borderOSize * 2);
    const height = oHeight + (borderOSize * 2);
    const repeatX = MathRound(TerrainRepeat * width);
    const repeatY = MathRound(TerrainRepeat * height);
    const colorTextures: DataTexture[] = this.createMaterials();
    const fragmentShader = TerrainFragmentShader;
    const vertexShader = TerrainVertexShader;
    // Текстуры
    const textures: CustomObject<Texture | CanvasTexture> = {
      ...MaskNames.reduce((o, name, k) => ({ ...o, [name]: colorTextures[k] }), {}),
      [MapTextureName]: this.loadTexture(TexturePaths(TerrainTexturePath).face, ImageExtension.png, MapTextureName),
      [NormalMapTextureName]: this.loadTexture(TexturePaths(TerrainTexturePath).normal, ImageExtension.png, NormalMapTextureName),
      // [AoMapTextureName]: this.loadTexture(TexturePaths.ao, ImageExtension.png, AoMapTextureName, true),
      // [LightMapTextureName]: this.loadTexture(TexturePaths.light, ImageExtension.png, LightMapTextureName, true)
    };
    // Значения
    const uniforms: Uniforms = UniformsUtils.merge([TerrainUniforms, {
      ...Object.entries(textures).reduce((o, [name, value]) => ({ ...o, [name]: { type: "t", value } }), {}),
      mapRepeat: { type: "v2", value: { x: repeatX, y: repeatY } }
    }]);
    // Материал
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      lights: true,
      transparent: true,
      defines: TerrainDefines,
      side: FrontSide,
      wireframe: false,
      extensions: {
        derivatives: true,
        fragDepth: false,
        drawBuffers: false,
        shaderTextureLOD: false,
      }
    });
    // Настройки
    this.material.clipShadows = true;
    this.material.dithering = true;
    this.material.shadowSide = BackSide;
    this.material.needsUpdate = true;
    this.material.alphaTest = 0;
    this.material.depthTest = true;
    this.material.depthWrite = true;
    // Вернуть материал
    return this.material;
  }

  // Получить данные о местности
  private getTerrain(x = -1, y = -1): MapTerrain {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
    // Вернуть данные
    return ArrayFind(MapTerrains, ({ id }) => id === this.getCeil(x - borderOSize, y - borderOSize).terrain) ?? MapTerrains.find(({ id }) => id === 1);
  }

  // Получить сведения о цвете
  private getColor(layout: number, color: number, terrain: MapTerrain): number {
    return terrain.splatMap.layout === layout && terrain.splatMap.color === color ? 255 : 0;
  }

  // Получение данных о типе рельефа
  private getRelief(type: ReliefType = ReliefType.flat): Observable<ReliefData> {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const context: CanvasRenderingContext2D = canvas.getContext("2d", { willReadFrequently: true });
    // Запрос картинки
    return this.screenService.loadImage(ReliefTexturePath + type + "." + ImageExtension.png).pipe(
      tap(({ image }) => context.drawImage(image, 0, 0)),
      map(({ width, height }) => {
        const top = Math.floor((height - DreamMapSize) / 2);
        const left = Math.floor((width - DreamMapSize) / 2);
        const right = width - DreamMapSize - left;
        const bottom = height - DreamMapSize - top;
        const correctSize: ReliefDataCorrect = { top, left, right, bottom };
        const data: number[] = Array.from(context.getImageData(0, 0, width, height).data);
        // Вернуть массив
        return { correctSize, type, data, size: { width, height } };
      }),
      tap(datas => !this.reliefDatas.some(({ type: t }) => type === t) ? this.reliefDatas.push(datas) : null),
      takeUntil(this.destroyed$)
    );
  }

  // Корректировка цвета
  private correctColor(color: number): number {
    return CheckInRange(color, 255, 0);
  }



  constructor(
    private screenService: ScreenService
  ) { }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    // Очистить объекты
    this.displacementTexture?.dispose();
    delete this.displacementTexture;
  }



  // Создание текстурной карты
  private createMaterials(): DataTexture[] {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width = (borderOSize * 2) + oWidth;
    const height = (borderOSize * 2) + oHeight;
    const size = width * height;
    const depth = TerrainColorDepth;
    // Цикл по слоям
    return MapCycle(depth, d => {
      const data: Uint8Array = new Uint8Array(4 * size);
      // Цикл по размеру
      CreateArray(size).forEach(s => {
        const stride = s * 4;
        const realX = MathRound((s - (Math.floor(s / width) * width)), 2);
        const realY = MathRound(height - 1 - Math.floor(s / width), 2);
        const x = Math.floor(realX);
        const y = Math.ceil(realY);
        const terrain: MapTerrain = this.getTerrain(x, y);
        // Цвета
        ForCycle(3, k => data[stride + k] = this.getColor(d, k, terrain));
        // Прозрачный канал
        data[stride + 3] = 255;
      });
      // Настройки
      const texture: DataTexture = new DataTexture(data, width, height);
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearFilter;
      texture.needsUpdate = true;
      // Вернуть текстуру
      return texture;
    });
  }

  // Выстроение фонового рельефа
  private createRelief(createTexture = true): Observable<void> {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width = (borderOSize * 2) + oWidth;
    const height = (borderOSize * 2) + oHeight;
    const size = width * height;
    const types: CustomObjectKey<ReliefName, ReliefType> = this.dreamMap.relief.types;
    const filterTypes: ReliefType[] = Array.from(new Set(Object.values(types)));
    // Создать текстуру
    if (createTexture) {
      this.displacementTexture = new DataTexture(new Uint8Array(4 * size), width, height);
      this.displacementTexture.magFilter = LinearFilter;
      this.displacementTexture.minFilter = LinearFilter;
      this.displacementTexture.flipY = true;
    }
    // Запрос к данным
    return forkJoin(filterTypes.map(type => this.getRelief(type))).pipe(
      tap(() => ReliefSideNames.forEach(yNames => yNames.forEach(name => this.setReliefSection(
        name,
        this.displacementTexture.image.data
      )))),
      map(() => ReliefSideNames
        .reduce((o, n) => ([...o, ...n]), [])
        .filter(name => name !== "center")
        .sort((nameA, nameB) => {
          const indexA = ReliefSideNamesSort.findIndex(n => n === nameA);
          const indexB = ReliefSideNamesSort.findIndex(n => n === nameB);
          // Сортировка
          return indexA < indexB ? -1 : indexA > indexB ? 1 : 0;
        })
        .forEach(name => this.setReliefSmooth(name, this.displacementTexture.image.data))
      ),
      tap(() => this.setReliefSmooth(
        "center",
        this.displacementTexture.image.data,
        CreateArray(oHeight).map(y => CreateArray(oWidth).map(x => ({ x, y })))
          .reduce((o, v) => ([...o, ...v]), [])
          .reduce((o, { x, y }) => ([...o, this.getCeil(x, y)]), []),
        !!this.dreamMap?.isNew
      )),
      tap(() => this.dreamMap.isNew = false),
      takeUntil(this.destroyed$)
    );
  }

  // Выставить высоту рельефа за пределами карты
  private setReliefSection(name: ReliefName, mapData: Uint8Array | Uint8ClampedArray): void {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width = (borderOSize * 2) + oWidth;
    // Область карты
    if (name === "center") {
      CreateArray(oHeight).forEach(y => CreateArray(oWidth).forEach(x => {
        const { coord: { z } }: DreamMapCeil = this.getCeil(x, y);
        const colorZ = (z * 255) / DreamMaxHeight;
        const textureX = x + borderOSize;
        const textureY = y + borderOSize;
        const index = ((textureY * width) + textureX) * 4;
        // Обновить цвета
        CreateArray(3).forEach(k => mapData[index + k] = this.correctColor(colorZ));
      }));
    }
    // Область за пределами карты
    else {
      const type: ReliefType = this.dreamMap.relief.types[name];
      const rData: ReliefData = this.reliefDatas.find(({ type: dataType }) => dataType === type);
      const { data, correctSize, size: { width: imgWidth } }: ReliefData = rData;
      const coord = this.reliefCoords[name];
      CreateArray(oWidth).map(dY => dY + correctSize.top).forEach(dY =>
        CreateArray(oHeight).map(dX => dX + correctSize.left).forEach(dX => {
          const x = dX - correctSize.top + coord.x;
          const y = dY - correctSize.left + coord.y;
          // Индексы
          const index = ((y * width) + x) * 4;
          const dIndex = ((dY * imgWidth) + dX) * 4;
          // Записать значения в общий массив
          CreateArray(4).map(k => mapData[index + k] = this.correctColor(data[dIndex + k]));
        })
      );
    }
  }

  // Сгладить границы секторов рельефа за пределами карты
  private setReliefSmooth(name: ReliefName, mapData: Uint8Array | Uint8ClampedArray, ceils: DreamMapCeil[] = [], rewrite = true): void {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width = (borderOSize * 2) + oWidth;
    const closestName: CustomObjectKey<ReliefName, ReliefName> = ReliefSideClosestsNames[name];
    const coord = this.reliefCoords[name];
    // Область карты
    if (name === "center") {
      const closestNames: ReliefName[] = Object.values(closestName);
      const reliefDatas: CustomObjectKey<ReliefName, ReliefData> = closestNames
        .map(name => ([name, this.reliefDatas.find(({ type }) => type === this.dreamMap.relief.types[name])!]))
        .reduce((o, [name, data]) => ({ ...o, [name as ReliefName]: data as ReliefData }), {});
      // Цикл по ячейкам
      ArrayForEach(ceils, ceil => {
        if (!this.isBorder(ceil.coord.x, ceil.coord.y)) {
          const { coord: { x, y, originalZ: z } }: DreamMapCeil = ceil;
          const textureX = x + borderOSize;
          const textureY = y + borderOSize;
          const index = ((textureY * width) + textureX) * 4;
          // Не перезаписывать
          if (!rewrite) {
            const color = MathRound(this.correctColor((ceil.coord.z * 255) / DreamMaxHeight), 5);
            ForCycle(3, k => mapData[index + k] = color, true);
          }
          // Перезаписать высоты
          else {
            let color = MathRound(this.correctColor((z * 255) / DreamMaxHeight), 5);
            const topY = y < reliefDatas.top.correctSize.bottom ? reliefDatas.top.size.height - reliefDatas.top.correctSize.bottom + y : -1;
            const rightX = (oWidth - 1) - x < reliefDatas.right.correctSize.left ? (oWidth - 1) - x : -1;
            const leftX = x < reliefDatas.left.correctSize.right ? reliefDatas.left.size.width - reliefDatas.left.correctSize.right + x : -1;
            const bottomY = (oHeight - 1) - y < reliefDatas.bottom.correctSize.top ? (oHeight - 1) - y : -1;
            const coords: CustomObjectKey<ReliefName, Coord> = {
              top: {
                x,
                y: topY,
                z: reliefDatas.top.correctSize.bottom,
                originalZ: y
              },
              right: {
                x: rightX,
                y,
                z: reliefDatas.right.correctSize.left,
                originalZ: x - (oWidth - reliefDatas.right.correctSize.left)
              },
              bottom: {
                x,
                y: bottomY,
                z: reliefDatas.bottom.correctSize.top,
                originalZ: y - (oHeight - reliefDatas.top.correctSize.bottom)
              },
              left: {
                x: leftX,
                y,
                z: reliefDatas.left.correctSize.right,
                originalZ: x
              }
            };
            // Цикл по координатам
            ArrayForEach(Object.entries(coords), ([name, { x, y, z: length, originalZ: i }]) => {
              if (x >= 0 && y >= 0) {
                const step = 1 / length;
                const koof = step * (name === "left" || name === "top" ? i + 1 : length - i);
                const cKoof = 1 - koof;
                const cIndex = ((y * reliefDatas[name].size.width) + x) * 4;
                const cValue = reliefDatas[name].data[cIndex];
                color = this.correctColor((color * koof) + (cValue * cKoof));
              }
            });
            // Записать значения в общий массив
            ForCycle(3, k => mapData[index + k] = color, true)
            ceil.coord.z = MathRound((color * DreamMaxHeight) / 255, 5);
            ceil.coord.originalZ = ceil.coord.z;
            // Запомнить значения
            if (!ArraySome(this.dreamMap.ceils, ({ coord: { x: cX, y: cY } }) => cX === x && cY === y)) {
              this.dreamMap.ceils.push(ceil);
            }
          }
        }
      });
    }
    // область за пределами карты
    else {
      const smoothValue = (imgIndex: number, index: number, length: number, i: number, name: ReliefName, cNameType: ReliefName, reliefData: ReliefData) => {
        const step = 1 / length / 2;
        const koof = (step * (cNameType === name ? i + 1 : length - i)) + 0.5;
        const cKoof = 1 - koof;
        // Записать значения в общий массив
        CreateArray(4).map(k => {
          const value = mapData[index + k];
          const cValue = reliefData.data[imgIndex + k];
          const newValue = (value * koof) + (cValue * cKoof);
          // Запомнить значение
          mapData[index + k] = this.correctColor(newValue);
        });
      };
      // Цикл по сторонам
      Object.entries(closestName).forEach(([cNameType, cName]) => {
        const cType: ReliefType = this.dreamMap.relief.types[cName];
        const reliefData: ReliefData = this.reliefDatas.find(({ type: dataType }) => dataType === cType);
        const sX = cNameType === "left" ? reliefData.size.width - reliefData.correctSize.right : 0;
        const lX = cNameType === "left" ? reliefData.correctSize.right : cNameType === "right" ? reliefData.correctSize.left : 0;
        const sY = cNameType === "top" ? reliefData.size.height - reliefData.correctSize.bottom : 0;
        const lY = cNameType === "top" ? reliefData.correctSize.bottom : cNameType === "bottom" ? reliefData.correctSize.top : 0;
        // Горизонтальное смешивание
        if (lX > 0) {
          CreateArray(lX).map(cX => cX + sX).forEach((cX, i) => {
            const x = (cNameType === "left" ? i : oWidth - lX + i) + coord.x;
            // Цикл по координатам Y
            CreateArray(oHeight).map(y => y + coord.y).forEach(y => {
              const cY = y - coord.y + reliefData.correctSize.top;
              const index = ((y * width) + x) * 4;
              const cIndex = ((cY * reliefData.size.width) + cX) * 4;
              // Записать значения в общий массив
              smoothValue(cIndex, index, lX, i, "left", cNameType as ReliefName, reliefData);
            });
          });
        }
        // Вертикальное смешивание
        if (lY > 0) {
          CreateArray(lY).map(cY => cY + sY).forEach((cY, i) => {
            const y = (cNameType === "top" ? i : oHeight - lY + i) + coord.y;
            // Цикл по координатам X
            CreateArray(oWidth).map(x => x + coord.x).forEach(x => {
              const cX = x - coord.x + reliefData.correctSize.left;
              const index = ((y * width) + x) * 4;
              const cIndex = ((cY * reliefData.size.width) + cX) * 4;
              // Записать значения в общий массив
              smoothValue(cIndex, index, lY, i, "top", cNameType as ReliefName, reliefData);
            });
          });
        }
      });
    }
  }

  // Выставить вершины по карте высот
  private setDisplacementMap(): void {
    const wdth = this.geometry.parameters.widthSegments + 1;
    const hght = this.geometry.parameters.heightSegments + 1;
    const vertexes: Float32BufferAttribute = this.geometry.getAttribute("position") as Float32BufferAttribute;
    const heightPart = DreamCeilSize / DreamCeilParts;
    const scale = heightPart * DreamMaxHeight;
    const width = this.displacementTexture.image.width;
    const height = this.displacementTexture.image.height;
    // Цикл по вершинам
    XYForEach(wdth, hght, VoidFunctionVar, (i, w, h) => {
      const indexes: number[] = XYMapEach(2, 2, (w2, h2) => {
        w2 = w + w2 - 1;
        h2 = h + h2 - 1;
        // Координаты
        const iH = h2 < 0 ? 0 : (h2 >= height - 1 ? height - 1 : h2);
        const iW = w2 < 0 ? 0 : (w2 >= width - 1 ? width - 1 : w2);
        // Индекс
        return ((iH * width) + iW) * 4;
      });
      const indexV = (h * wdth) + w;
      // Поиск среднего Z
      const z = indexes
        .map(index => (this.displacementTexture.image.data[index] / 255) * scale)
        .reduce((o, z) => o + z, 0) / indexes.length;
      // Установить высоту
      vertexes.setZ(indexV, z);
    });
    // Установить позиции
    this.geometry.setAttribute("position", vertexes);
    this.geometry.computeVertexNormals();
    this.geometry.computeTangents();
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.displacementTexture.needsUpdate = true;
  }



  // Обновить карту
  updateDreamMap(dreamMap: DreamMap): void {
    this.dreamMap = dreamMap;
  }

  // Обновить материалы
  updateMaterials(ceils: DreamMapCeil[]): void {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width = oWidth + (borderOSize * 2);
    const depth = MapTerrains.filter((t, k) => k / 3 === Math.round(k / 3)).length;
    // Цикл по данным
    ceils.forEach(ceil => {
      const dataX = borderOSize + ceil.coord.x;
      const dataY = borderOSize + (oHeight - 1 - ceil.coord.y);
      const stride = ((dataY * width) + dataX) * 4;
      const terrain: MapTerrain = this.getTerrain(ceil.coord.x + borderOSize, ceil.coord.y + borderOSize);
      // Уровни
      CreateArray(depth).forEach(d => {
        CreateArray(3).forEach(k => this.material.uniforms[MaskTextureNamePreffix + d].value.image.data[stride + k] = this.getColor(d, k, terrain));
        // Прозрачный канал
        this.material.uniforms[MaskTextureNamePreffix + d].value.image.data[stride + 3] = 255;
        // Обновить текстуру
        this.material.uniforms[MaskTextureNamePreffix + d].value.needsUpdate = true;
      });
    });
    // Обновить общую текстуру
    this.material.uniformsNeedUpdate = true;
  }

  // Обновить высоту
  updateHeights(ceils: DreamMapCeil[]): void {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width = this.displacementTexture.image.width;
    const height = this.displacementTexture.image.height;
    const wdth = this.geometry.parameters.widthSegments + 1;
    const vertexes: Float32BufferAttribute = this.geometry.getAttribute("position") as Float32BufferAttribute;
    const heightPart = DreamCeilSize / DreamCeilParts;
    const scale = heightPart * DreamMaxHeight;
    // Сглаживание
    this.setReliefSmooth("center", this.displacementTexture.image.data, ceils, false);
    // Цикл по ячейкам
    ArrayForEach(ceils, ({ coord: { x, y } }) => {
      const ceil: DreamMapCeil = this.getCeil(x, y);
      const textureX = ceil.coord.x + borderOSize;
      const textureY = ceil.coord.y + borderOSize;
      // Обновить вершины
      XYForEach(2, 2, VoidFunctionVar, (i, w, h) => {
        h = textureY + h;
        w = textureX + w;
        // Параметры
        const heights: number[] = XYMapEach(2, 2, (w2, h2) => {
          w2 = w + w2 - 1;
          h2 = h + h2 - 1;
          // Координаты
          const iH = h2 < 0 ? 0 : (h2 >= height - 1 ? height - 1 : h2);
          const iW = w2 < 0 ? 0 : (w2 >= width - 1 ? width - 1 : w2);
          const index = ((iH * width) + iW) * 4;
          // Индекс
          return (this.displacementTexture.image.data[index] / 255) * scale;
        });
        const indexV = (h * wdth) + w;
        const z = heights.reduce((o, z) => o + z, 0) / heights.length;
        // Установить высоту
        vertexes.setZ(indexV, z);
      });
    });
    // Обновить геометрию
    this.geometry.setAttribute("position", vertexes);
    this.geometry.computeVertexNormals();
    this.geometry.attributes.position.needsUpdate = true;
    this.displacementTexture.needsUpdate = true;
  }

  // Обновить фоновый рельеф
  updateRelief(type: ClosestHeightName): Observable<void> {
    const closestName: CustomObjectKey<ReliefName, ReliefName> = ReliefSideClosestsNames[type];
    const names: ReliefName[] = [...Object.values(closestName), type, "center"];
    // Загрузить типы
    const types: Observable<ReliefData>[] = names
      .map(name => this.dreamMap.relief.types[name])
      .map(type => this.reliefDatas.some(({ type: t }) => type === t) ?
        of(this.reliefDatas.find(({ type: t }) => type === t)) :
        this.getRelief(type));
    // Обновить вершины
    return forkJoin(types).pipe(
      mergeMap(() => this.createRelief(false)),
      tap(() => this.setDisplacementMap()),
      takeUntil(this.destroyed$)
    );
  }

  // Смазывание рельефа
  updateReliefRewrite(): void {
    const oWidth = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight = this.dreamMap.size.height ?? DreamMapSize;
    // Смазать
    this.setReliefSmooth(
      "center",
      this.displacementTexture.image.data,
      XYMapEach(oWidth, oHeight, (x, y) => this.getCeil(x, y)),
      true
    )
    // Обновить геометрию
    this.setDisplacementMap();
  }
}



// Качество геометрии
export const GeometryQuality = 1;

// Имена сторон
type ReliefName = keyof ClosestHeights | "center";

// Интерфейс данных окружающего рельефа
interface ReliefData {
  correctSize: ReliefDataCorrect;
  type: ReliefType;
  data: number[];
  size: {
    width: number;
    height: number;
  }
}

// Интерфейс координат обрезки
interface ReliefDataCorrect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

// Список имен областей рельефа
const ReliefSideNames: ReliefName[][] = [
  ["topLeft", "top", "topRight"],
  ["left", "center", "right"],
  ["bottomLeft", "bottom", "bottomRight"]
];

// Список сортировки секций
const ReliefSideNamesSort: ReliefName[] = [
  "top",
  "left",
  "right",
  "bottom",
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight"
];

// Список соседних имен областей рельефа
const ReliefSideClosestsNames: CustomObjectKey<ReliefName, CustomObjectKey<ReliefName, ReliefName>> = {
  topLeft: { bottom: "left", right: "top" },
  top: { left: "topLeft", right: "topRight" },
  topRight: { left: "top", bottom: "right" },
  left: { top: "topLeft", bottom: "bottomLeft" },
  center: { top: "top", right: "right", bottom: "bottom", left: "left" },
  right: { top: "topRight", bottom: "bottomRight" },
  bottomLeft: { top: "left", right: "bottom" },
  bottom: { left: "bottomLeft", right: "bottomRight" },
  bottomRight: { top: "right", left: "bottom" },
};
