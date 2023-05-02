import { CreateArray, VoidFunctionVar } from "@_datas/app";
import { MapTerrains, TexturePaths } from "@_datas/dream-map";
import { DreamMapTerrainName } from "@_datas/dream-map-objects";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamOutsideSize, DreamTerrain } from "@_datas/dream-map-settings";
import { AngleToRad, MathRound } from "@_helpers/math";
import { ArrayForEach, ArraySome, ForCycle, XYForEach, XYMapEach } from "@_helpers/objects";
import { CapitalizeFirstLetter } from "@_helpers/string";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { ClosestHeightName, ClosestHeights, Coord, DreamMap, DreamMapCeil, MapTerrain, MapTerrainSplatMapColor, ReliefType, XYCoord } from "@_models/dream-map";
import { ImageExtension } from "@_models/screen";
import { ScreenService } from "@_services/screen.service";
import { Injectable, OnDestroy } from "@angular/core";
import { Observable, Subject, forkJoin, map, mergeMap, of, takeUntil, tap } from "rxjs";
import { BackSide, CanvasTexture, ClampToEdgeWrapping, DataTexture, Float32BufferAttribute, FrontSide, IUniform, LinearFilter, Mesh, NearestMipMapNearestFilter, PlaneGeometry, ShaderLib, ShaderMaterial, Texture, TextureLoader, UniformsUtils, sRGBEncoding } from "three";
import { DreamMapAlphaFogService } from "./alphaFog.service";





@Injectable()

export class DreamMapTerrainService implements OnDestroy {


  private materialType: keyof typeof ShaderLib = "standard";

  private maskTextureNamePreffix: string = "maskTex";

  outsideMapSize: number = DreamOutsideSize;

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
    let z: number = DreamDefHeight;
    // Поиск высоты для ячейки за пределами карты
    if (this.isBorder(x, y) && !!this.displacementTexture) {
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
      const width: number = (borderOSize * 2) + oWidth;
      const iX: number = x + borderOSize;
      const iY: number = y + borderOSize;
      const index: number = ((iY * width) + iX) * 4;
      const color: number = CreateArray(3).map(k => this.displacementTexture.image.data[index + k]).reduce((o, n) => o + n, 0) / 3;
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
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    // Проверка
    return x < 0 || y < 0 || x >= width || y >= height;
  }

  // Объект для отрисовки
  getObject(dreamMap: DreamMap): Observable<Mesh> {
    this.dreamMap = dreamMap;
    // Параметры
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const borderSize: number = borderOSize * DreamCeilSize;
    const width: number = (oWidth * DreamCeilSize) + (borderSize * 2);
    const height: number = (oHeight * DreamCeilSize) + (borderSize * 2);
    const qualityWidth: number = width * GeometryQuality;
    const qualityHeight: number = height * GeometryQuality;
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
      takeUntil(this.destroyed$),
      tap(() => this.setDisplacementMap()),
      map(() => mesh)
    );
  }

  // Загрузить текстуру
  private loadTexture(src: string, name: string): Texture {
    return this.textureLoader.load(src, texture => {
      if (!!this.material && !!this.material?.uniforms[name]) {
        this.material.uniforms[name].value = texture;
        this.material.uniformsNeedUpdate = true;
        // Настройки
        texture.wrapS = ClampToEdgeWrapping;
        texture.wrapT = ClampToEdgeWrapping;
        texture.encoding = sRGBEncoding;
        texture.minFilter = NearestMipMapNearestFilter;
        texture.magFilter = NearestMipMapNearestFilter;
      }
    });
  }

  // Шейдер смешивания текстур (Splat Map)
  private get getMaterial(): ShaderMaterial {
    const repeat: number = 1.5;
    const tileSize: number = 512;
    const tileSetSize: number = tileSize * 4;
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = this.outsideMapSize * Math.max(oWidth, oHeight);
    const width: number = oWidth + (borderOSize * 2);
    const height: number = oHeight + (borderOSize * 2);
    const repeatX: number = MathRound(repeat * width);
    const repeatY: number = MathRound(repeat * height);
    const createNamedArray = (key: string) => MapTerrains.map(t => key + CapitalizeFirstLetter(t.name));
    // Базовые ткустуры
    const colorTextures: DataTexture[] = this.createMaterials();
    const mapTexturesItterator: number[] = CreateArray(colorTextures.length);
    // RGBA Маски
    const maskNames: string[] = mapTexturesItterator.map(k => this.maskTextureNamePreffix + k);
    const maskMapNames: string[] = mapTexturesItterator.map(k => "maskMap" + k);
    const mapTileCoords: string[] = createNamedArray("mapTileCoords");
    const mapRepeats: string[] = createNamedArray("terrainRepeat");
    // Текстуры
    const mapTexture: string[] = createNamedArray("mapTexture");
    const normalMapTexture: string[] = createNamedArray("normalMapTexture");
    const aoMapTexture: string[] = createNamedArray("aoMapTexture");
    const lightMap: string[] = createNamedArray("lightMap");
    // Имена цветов
    const colorsNames: CustomObjectKey<MapTerrainSplatMapColor, string> = {
      [MapTerrainSplatMapColor.Red]: "r",
      [MapTerrainSplatMapColor.Green]: "g",
      [MapTerrainSplatMapColor.Blue]: "b"
    };
    const getMapVar: Function = (t: MapTerrain) => maskMapNames[t.splatMap.layout];
    const getMapVarColor: Function = (t: MapTerrain) => getMapVar(t) + "." + colorsNames[t.splatMap.color];
    // Код шейдера: фрагменты
    const fragmentShader: string = `
      uniform vec2 tileSize;
      uniform vec2 tileSetSize;
      uniform vec2 mapRepeat;
      uniform vec2 ${mapTileCoords.join(", ")};
      uniform vec2 ${mapRepeats.join(", ")};

      uniform sampler2D ${maskNames.join(", ")};
      uniform sampler2D mapTexture;

      vec2 vec2LineFunc (vec2 min, vec2 max, vec2 value, vec2 valueMin, vec2 valueMax) {
        return clamp((((min - max) / valueMax) * (value - valueMin)) + max, max, min);
      }

      vec4 getTileTexture (sampler2D texture, vec2 tileCoords, vec2 uv) {
        vec2 allTiles = floor((tileSetSize / tileSize) + vec2(0.5, 0.5)) - vec2(1, 1);
        vec2 coords = vec2(tileCoords.x, allTiles.y - tileCoords.y);
        vec2 uvMin = vec2(0.0, 0.0);
        vec2 uvMax = vec2(1.0, 1.0);
        vec2 tilingUV = (uv - uvMin) * mapRepeat;
        vec2 epsilon = vec2(0.0001);
        vec2 offset = (tileSize * coords) + (tileSize * (fract(tilingUV) - epsilon));
        vec2 textureUV = vec2LineFunc(uvMax, uvMin, offset, uvMin, tileSetSize);

        return texture2D(texture, textureUV);
      }

      vec4 lightMapTexelToLinear(vec4 texel) {
        return vec4(pow(texel.rgb, vec3(2.2)), texel.a);
      }

      #if defined( USE_NORMALMAP )
        uniform sampler2D normalMapTexture;
      #endif

      #if defined( USE_AOMAP )
        uniform sampler2D aoMapTexture;
      #endif

      ${ShaderLib[this.materialType].fragmentShader
        // Общие переменные
        .replace("void main() {", `
          void main() {
            ${maskMapNames.map((n, k) => `vec4 ${n} = texture2D(${maskNames[k]}, vUv);`).join("\n")}
        `)
        // Заполнение текстурных карт
        .replace("#include <map_fragment>", `
          #ifdef USE_MAP
            ${mapTexture.map((n, k) => `vec4 ${n} = getTileTexture(mapTexture, ${mapTileCoords[k]}, vUv);`).join("\n")}
            vec4 texelColor = (${MapTerrains.map((t, k) => "(" + mapTexture[k] + " * " + getMapVarColor(t) + " * " + getMapVar(t) + ".a)").join(" + ")});
            vec4 diffuseColor = LinearToLinear(texelColor);
          #endif
        `)
        // Заполнение карт атмосферного свечения: фрагмент 1
        .replace("#include <aomap_pars_fragment>", `
          #ifdef USE_AOMAP
            uniform float aoMapIntensity;
          #endif
        `)
        // Заполнение карт атмосферного свечения: фрагмент 2
        .replace("#include <aomap_fragment>", `
          #ifdef USE_AOMAP
            ${aoMapTexture.map((n, k) => `vec4 ${n} = getTileTexture(aoMapTexture, ${mapTileCoords[k]}, vUv);`).join("\n")}
            float ambientOcclusion = (
              ${MapTerrains.map((t, k) => "(" + aoMapTexture[k] + ".r * " + getMapVarColor(t) + " * " + getMapVar(t) + ".a)").join(" + ")}
            ) * aoMapIntensity + 1.0;
            reflectedLight.indirectDiffuse *= ambientOcclusion;

            #if defined( USE_ENVMAP ) && defined( STANDARD )
              float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
          		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
            #endif
          #endif
        `)
        // Удаление лишней закраски
        .replace("vec4 diffuseColor = vec4( diffuse, opacity );", `
          #ifdef USE_MAP
          #endif
        `)
        // Карта нормалей: фрагмент 1
        .replace("#include <normalmap_pars_fragment>", `
          #ifdef USE_NORMALMAP
            uniform vec2 normalScale;

            vec3 perturbNormal2Arb (vec3 eye_pos, vec3 surf_norm) {
              vec3 q0 = vec3(dFdx(eye_pos.x), dFdx(eye_pos.y), dFdx(eye_pos.z));
              vec3 q1 = vec3(dFdy(eye_pos.x), dFdy(eye_pos.y), dFdy(eye_pos.z));
              vec2 st0 = dFdx(vUv.st);
              vec2 st1 = dFdy(vUv.st);
              vec3 S = normalize(q0 * st1.t - q1 * st0.t);
              vec3 T = normalize(-q0 * st1.s + q1 * st0.s);
              vec3 N = normalize(surf_norm);

              ${maskMapNames.map((n, k) => `vec4 ${n} = texture2D(${maskNames[k]}, vUv);`).join("\n")}
              ${normalMapTexture.map((n, k) => `vec4 ${n} = getTileTexture(normalMapTexture, ${mapTileCoords[k]}, vUv);`).join("\n")}

              vec4 full_normal = (
                ${MapTerrains.map((t, k) => "(" + normalMapTexture[k] + " * " + getMapVarColor(t) + " * " + getMapVar(t) + ".a)").join(" + ")}
              );

              vec3 mapN = full_normal.xyz * 2.0 - 1.0;
              mapN.xy = normalScale * mapN.xy;
              mat3 tsn = mat3(S, T, N);

              return normalize(tsn * mapN);
            }
          #endif
        `)
        // Карта нормалей: фрагмент 2
        .replace("#include <normal_fragment_maps>", `
          #ifdef USE_NORMALMAP
            normal = perturbNormal2Arb(-vViewPosition, normal);
          #endif
        `)
        // Карта освещения: фрагмент 1
        .replace("#include <lightmap_pars_fragment>", `
          uniform sampler2D lightMap;
          uniform float lightMapIntensity;
        `)
        // Карта освещения: фрагмент 2
        // gl_FragColor = gl_FragColor * texture2D(lightMap, vUv2);
        .replace("#include <lightmap_fragment>", `
          #ifdef USE_LIGHTMAP
            ${lightMap.map((n, k) => `vec4 ${n} = getTileTexture(lightMap, ${mapTileCoords[k]}, vUv2);`).join("\n")}
            vec4 lightMapTexel = (${MapTerrains.map((t, k) => "(" + lightMap[k] + " * " + getMapVarColor(t) + " * " + getMapVar(t) + ".a)").join(" + ")});
            vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
            reflectedLight.indirectDiffuse += lightMapIrradiance;
          #endif
        `)
      }
    `;
    // Код шейдера: вершины
    const vertexShader: string = ShaderLib[this.materialType].vertexShader;
    // Текстуры
    const textures: CustomObject<Texture | CanvasTexture> = {
      ...maskNames.reduce((o, name, k) => ({ ...o, [name]: colorTextures[k] }), {}),
      mapTexture: this.loadTexture(TexturePaths.face + "." + ImageExtension.jpg, "mapTexture"),
      normalMapTexture: this.loadTexture(TexturePaths.normal + "." + ImageExtension.jpg, "normalMapTexture"),
      aoMapTexture: this.loadTexture(TexturePaths.ao + "." + ImageExtension.jpg, "aoMapTexture"),
      lightMap: this.loadTexture(TexturePaths.light + "." + ImageExtension.jpg, "lightMap")
    };
    // Значения
    const uniforms: { [uniform: string]: IUniform } = UniformsUtils.merge([ShaderLib[this.materialType].uniforms, {
      // Текстуры
      ...Object.entries(textures).reduce((o, [name, value]) => ({ ...o, [name]: { type: "t", value } }), {}),
      // Координаты текстур
      ...mapTileCoords.reduce((o, name, k) => {
        const terrain: MapTerrain = MapTerrains[k];
        // Запомнить координаты
        return {
          ...o,
          [name]: { type: "v2", value: terrain.tileCoords }
        };
      }, {}),
      // Повторы
      b_one_repeat: { type: "v2", value: { x: 1, y: 1 } },
      // Прочее
      mapRepeat: { type: "v2", value: { x: repeatX, y: repeatY } },
      tileSize: { type: "v2", value: { x: tileSize, y: tileSize } },
      tileSetSize: { type: "v2", value: { x: tileSetSize, y: tileSetSize } },
      normalScale: { type: "v2", value: { x: -1, y: 1 } },
      aoMapIntensity: { type: "f", value: 1 },
      lightMapIntensity: { type: "f", value: 1 }
    }]);
    // Свойства шейдера
    const defines: CustomObject<boolean> = {
      USE_MAP: true,
      USE_UV: true,
      USE_AOMAP: true,
      USE_NORMALMAP: true,
      USE_BUMPMAP: false,
      USE_LIGHTMAP: true,
      USE_DISPLACEMENTMAP: true,
      PHYSICALLY_CORRECT_LIGHTS: false,
      FLAT_SHADED: false,
      USE_TANGENT: true,
      DOUBLE_SIDED: true,
      USE_CLEARCOAT: true,
      USE_SHEEN: true,
      USE_ENVMAP: true,
    };
    // Материал
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      lights: true,
      fog: true,
      defines,
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
    // Вернуть материал
    return this.alphaFogService.getShaderMaterial(this.material);
  }

  // Получить данные о местности
  private getTerrain(x: number = -1, y: number = -1): MapTerrain {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    // Вернуть данные
    return MapTerrains.find(({ id }) => id === this.getCeil(x - borderOSize, y - borderOSize).terrain) ?? MapTerrains.find(({ id }) => id === 1);
  }

  // Получить сведения о цвете
  private getColor(layout: number, color: number, terrain: MapTerrain): number {
    return terrain.splatMap.layout === layout && terrain.splatMap.color === color ? 255 : 0;
  }

  // Получение данных о типе рельефа
  private getRelief(type: ReliefType = ReliefType.flat): Observable<ReliefData> {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    // Запрос картинки
    return this.screenService.loadImage("/assets/dream-map/relief/" + type + ".png").pipe(
      takeUntil(this.destroyed$),
      tap(({ image }) => context.drawImage(image, 0, 0)),
      map(({ width, height }) => {
        const top: number = Math.floor((height - DreamMapSize) / 2);
        const left: number = Math.floor((width - DreamMapSize) / 2);
        const right: number = width - DreamMapSize - left;
        const bottom: number = height - DreamMapSize - top;
        const correctSize: ReliefDataCorrect = { top, left, right, bottom };
        const data: number[] = Array.from(context.getImageData(0, 0, width, height).data);
        // Вернуть массив
        return { correctSize, type, data, size: { width, height } };
      }),
      tap(datas => !this.reliefDatas.some(({ type: t }) => type === t) ? this.reliefDatas.push(datas) : null),
    );
  }

  // Корректировка цвета
  private correctColor(color: number): number {
    color = color < 0 ? 0 : color;
    color = color > 255 ? 255 : color;
    // Вернуть цвет
    return color;
  }





  constructor(
    private alphaFogService: DreamMapAlphaFogService,
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
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width: number = (borderOSize * 2) + oWidth;
    const height: number = (borderOSize * 2) + oHeight;
    const size: number = width * height;
    const depth: number = MapTerrains.filter((t, k) => k / 3 === Math.round(k / 3)).length;
    // Цикл по слоям
    return CreateArray(depth).map(d => {
      const data: Uint8Array = new Uint8Array(4 * size);
      // Цикл по размеру
      CreateArray(size).forEach(s => {
        const stride: number = s * 4;
        const realX: number = MathRound((s - (Math.floor(s / width) * width)), 2);
        const realY: number = MathRound(height - 1 - Math.floor(s / width), 2);
        const x: number = Math.floor(realX);
        const y: number = Math.ceil(realY);
        const terrain: MapTerrain = this.getTerrain(x, y);
        // Цвета
        CreateArray(3).forEach(k => data[stride + k] = this.getColor(d, k, terrain));
        // Прозрачный канал
        data[stride + 3] = 255;
      });
      // Настройки
      const texture: DataTexture = new DataTexture(data, width, height);
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearFilter;
      // Вернуть текстуру
      return texture;
    });
  }

  // Выстроение фонового рельефа
  private createRelief(createTexture: boolean = true): Observable<void> {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width: number = (borderOSize * 2) + oWidth;
    const height: number = (borderOSize * 2) + oHeight;
    const size: number = width * height;
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
      takeUntil(this.destroyed$),
      tap(() => ReliefSideNames.forEach(yNames => yNames.forEach(name => this.setReliefSection(
        name,
        this.displacementTexture.image.data
      )))),
      map(() => ReliefSideNames
        .reduce((o, n) => ([...o, ...n]), [])
        .filter(name => name !== "center")
        .sort((nameA, nameB) => {
          const indexA: number = ReliefSideNamesSort.findIndex(n => n === nameA);
          const indexB: number = ReliefSideNamesSort.findIndex(n => n === nameB);
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
      tap(() => this.dreamMap.isNew = false)
    );
  }

  // Выставить высоту рельефа за пределами карты
  private setReliefSection(name: ReliefName, mapData: Uint8Array | Uint8ClampedArray): void {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width: number = (borderOSize * 2) + oWidth;
    // Область карты
    if (name === "center") {
      CreateArray(oHeight).forEach(y => CreateArray(oWidth).forEach(x => {
        const { coord: { z } }: DreamMapCeil = this.getCeil(x, y);
        const colorZ: number = (z * 255) / DreamMaxHeight;
        const textureX: number = x + borderOSize;
        const textureY: number = y + borderOSize;
        const index: number = ((textureY * width) + textureX) * 4;
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
          const x: number = dX - correctSize.top + coord.x;
          const y: number = dY - correctSize.left + coord.y;
          // Индексы
          const index: number = ((y * width) + x) * 4;
          const dIndex: number = ((dY * imgWidth) + dX) * 4;
          // Записать значения в общий массив
          CreateArray(4).map(k => mapData[index + k] = this.correctColor(data[dIndex + k]));
        })
      );
    }
  }

  // Сгладить границы секторов рельефа за пределами карты
  private setReliefSmooth(name: ReliefName, mapData: Uint8Array | Uint8ClampedArray, ceils: DreamMapCeil[] = [], rewrite: boolean = true): void {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width: number = (borderOSize * 2) + oWidth;
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
          const textureX: number = x + borderOSize;
          const textureY: number = y + borderOSize;
          const index: number = ((textureY * width) + textureX) * 4;
          // Не перезаписывать
          if (!rewrite) {
            const color: number = MathRound(this.correctColor((ceil.coord.z * 255) / DreamMaxHeight), 5);
            ForCycle(3, k => mapData[index + k] = color, true);
          }
          // Перезаписать высоты
          else {
            let color: number = MathRound(this.correctColor((z * 255) / DreamMaxHeight), 5);
            const topY: number = y < reliefDatas.top.correctSize.bottom ? reliefDatas.top.size.height - reliefDatas.top.correctSize.bottom + y : -1;
            const rightX: number = (oWidth - 1) - x < reliefDatas.right.correctSize.left ? (oWidth - 1) - x : -1;
            const leftX: number = x < reliefDatas.left.correctSize.right ? reliefDatas.left.size.width - reliefDatas.left.correctSize.right + x : -1;
            const bottomY: number = (oHeight - 1) - y < reliefDatas.bottom.correctSize.top ? (oHeight - 1) - y : -1;
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
                const step: number = 1 / length;
                const koof: number = step * (name === "left" || name === "top" ? i + 1 : length - i);
                const cKoof: number = 1 - koof;
                const cIndex: number = ((y * reliefDatas[name].size.width) + x) * 4;
                const cValue: number = reliefDatas[name].data[cIndex];
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
        const step: number = 1 / length / 2;
        const koof: number = (step * (cNameType === name ? i + 1 : length - i)) + 0.5;
        const cKoof: number = 1 - koof;
        // Записать значения в общий массив
        CreateArray(4).map(k => {
          const value: number = mapData[index + k];
          const cValue: number = reliefData.data[imgIndex + k];
          const newValue: number = (value * koof) + (cValue * cKoof);
          // Запомнить значение
          mapData[index + k] = this.correctColor(newValue);
        });
      };
      // Цикл по сторонам
      Object.entries(closestName).forEach(([cNameType, cName]) => {
        const cType: ReliefType = this.dreamMap.relief.types[cName];
        const reliefData: ReliefData = this.reliefDatas.find(({ type: dataType }) => dataType === cType);
        const sX: number = cNameType === "left" ? reliefData.size.width - reliefData.correctSize.right : 0;
        const lX: number = cNameType === "left" ? reliefData.correctSize.right : cNameType === "right" ? reliefData.correctSize.left : 0;
        const sY: number = cNameType === "top" ? reliefData.size.height - reliefData.correctSize.bottom : 0;
        const lY: number = cNameType === "top" ? reliefData.correctSize.bottom : cNameType === "bottom" ? reliefData.correctSize.top : 0;
        // Горизонтальное смешивание
        if (lX > 0) {
          CreateArray(lX).map(cX => cX + sX).forEach((cX, i) => {
            const x: number = (cNameType === "left" ? i : oWidth - lX + i) + coord.x;
            // Цикл по координатам Y
            CreateArray(oHeight).map(y => y + coord.y).forEach(y => {
              const cY: number = y - coord.y + reliefData.correctSize.top;
              const index: number = ((y * width) + x) * 4;
              const cIndex: number = ((cY * reliefData.size.width) + cX) * 4;
              // Записать значения в общий массив
              smoothValue(cIndex, index, lX, i, "left", cNameType as ReliefName, reliefData);
            });
          });
        }
        // Вертикальное смешивание
        if (lY > 0) {
          CreateArray(lY).map(cY => cY + sY).forEach((cY, i) => {
            const y: number = (cNameType === "top" ? i : oHeight - lY + i) + coord.y;
            // Цикл по координатам X
            CreateArray(oWidth).map(x => x + coord.x).forEach(x => {
              const cX: number = x - coord.x + reliefData.correctSize.left;
              const index: number = ((y * width) + x) * 4;
              const cIndex: number = ((cY * reliefData.size.width) + cX) * 4;
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
    const wdth: number = this.geometry.parameters.widthSegments + 1;
    const hght: number = this.geometry.parameters.heightSegments + 1;
    const vertexes: Float32BufferAttribute = this.geometry.getAttribute("position") as Float32BufferAttribute;
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const scale: number = heightPart * DreamMaxHeight;
    const width: number = this.displacementTexture.image.width;
    const height: number = this.displacementTexture.image.height;
    // Цикл по вершинам
    XYForEach(wdth, hght, VoidFunctionVar, (i, w, h) => {
      const indexes: number[] = XYMapEach(2, 2, (w2, h2) => {
        w2 = w + w2 - 1;
        h2 = h + h2 - 1;
        // Координаты
        const iH: number = h2 < 0 ? 0 : (h2 >= height - 1 ? height - 1 : h2);
        const iW: number = w2 < 0 ? 0 : (w2 >= width - 1 ? width - 1 : w2);
        // Индекс
        return ((iH * width) + iW) * 4;
      });
      const indexV: number = (h * wdth) + w;
      // Поиск среднего Z
      const z: number = indexes
        .map(index => (this.displacementTexture.image.data[index] / 255) * scale)
        .reduce((o, z) => o + z, 0) / indexes.length;
      // Установить высоту
      vertexes.setZ(indexV, z);
    });
    // Обновить геометрию
    this.geometry.setAttribute("position", vertexes);
    this.geometry.computeVertexNormals();
    this.geometry.attributes.position.needsUpdate = true;
    this.displacementTexture.needsUpdate = true;
  }





  // Обновить карту
  updateDreamMap(dreamMap: DreamMap): void {
    this.dreamMap = dreamMap;
  }

  // Обновить материалы
  updateMaterials(ceils: DreamMapCeil[]): void {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width: number = oWidth + (borderOSize * 2);
    const depth: number = MapTerrains.filter((t, k) => k / 3 === Math.round(k / 3)).length;
    // Цикл по данным
    ceils.forEach(ceil => {
      const dataX: number = borderOSize + ceil.coord.x;
      const dataY: number = borderOSize + (oHeight - 1 - ceil.coord.y);
      const stride: number = ((dataY * width) + dataX) * 4;
      const terrain: MapTerrain = this.getTerrain(ceil.coord.x + borderOSize, ceil.coord.y + borderOSize);
      // Уровни
      CreateArray(depth).forEach(d => {
        CreateArray(3).forEach(k => this.material.uniforms[this.maskTextureNamePreffix + d].value.image.data[stride + k] = this.getColor(d, k, terrain));
        // Прозрачный канал
        this.material.uniforms[this.maskTextureNamePreffix + d].value.image.data[stride + 3] = 255;
        // Обновить текстуру
        this.material.uniforms[this.maskTextureNamePreffix + d].value.needsUpdate = true;
      });
    });
    // Обновить общую текстуру
    this.material.uniformsNeedUpdate = true;
  }

  // Обновить высоту
  updateHeights(ceils: DreamMapCeil[]): void {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width: number = this.displacementTexture.image.width;
    const height: number = this.displacementTexture.image.height;
    const wdth: number = this.geometry.parameters.widthSegments + 1;
    const vertexes: Float32BufferAttribute = this.geometry.getAttribute("position") as Float32BufferAttribute;
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const scale: number = heightPart * DreamMaxHeight;
    // Сглаживание
    this.setReliefSmooth("center", this.displacementTexture.image.data, ceils, false);
    // Цикл по ячейкам
    ArrayForEach(ceils, ({ coord: { x, y } }) => {
      const ceil: DreamMapCeil = this.getCeil(x, y);
      const textureX: number = ceil.coord.x + borderOSize;
      const textureY: number = ceil.coord.y + borderOSize;
      // Обновить вершины
      XYForEach(2, 2, VoidFunctionVar, (i, w, h) => {
        h = textureY + h;
        w = textureX + w;
        // Параметры
        const heights: number[] = XYMapEach(2, 2, (w2, h2) => {
          w2 = w + w2 - 1;
          h2 = h + h2 - 1;
          // Координаты
          const iH: number = h2 < 0 ? 0 : (h2 >= height - 1 ? height - 1 : h2);
          const iW: number = w2 < 0 ? 0 : (w2 >= width - 1 ? width - 1 : w2);
          const index: number = ((iH * width) + iW) * 4;
          // Индекс
          return (this.displacementTexture.image.data[index] / 255) * scale;
        });
        const indexV: number = (h * wdth) + w;
        const z: number = heights.reduce((o, z) => o + z, 0) / heights.length;
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
      takeUntil(this.destroyed$),
      mergeMap(() => this.createRelief(false)),
      tap(() => this.setDisplacementMap())
    );
  }

  // Смазывание рельефа
  updateReliefRewrite(): void {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
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
export const GeometryQuality: number = 1;

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
