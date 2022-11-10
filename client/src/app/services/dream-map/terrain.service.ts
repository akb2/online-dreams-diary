import { Injectable, OnDestroy } from "@angular/core";
import { AngleToRad, CreateArray, CustomObject, CustomObjectKey, MathRound } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, MapTerrain, MapTerrains, MapTerrainSplatMapColor, TexturePaths, XYCoord } from "@_models/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamOutsideSize, DreamTerrain } from "@_models/dream-map-settings";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { ScreenService } from "@_services/screen.service";
import { forkJoin, map, Observable, Subject, takeUntil, tap } from "rxjs";
import { BackSide, CanvasTexture, DataTexture, Float32BufferAttribute, IUniform, LinearFilter, LinearMipmapNearestFilter, Mesh, PlaneGeometry, RepeatWrapping, ShaderLib, ShaderMaterial, sRGBEncoding, Texture, TextureLoader, UniformsUtils } from "three";





@Injectable()

export class DreamMapTerrainService implements OnDestroy {


  private materialType: keyof typeof ShaderLib = "standard";

  private maskTextureNamePreffix: string = "mask_tex_";

  outsideMapSize: number = DreamOutsideSize;
  geometryQuality: number = 1;

  private dreamMap: DreamMap;
  private geometry: PlaneGeometry;
  private material: ShaderMaterial;

  displacementTexture: DataTexture;

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
    const qualityWidth: number = width * this.geometryQuality;
    const qualityHeight: number = height * this.geometryQuality;
    // Создание геометрии
    this.geometry = new PlaneGeometry(width, height, qualityWidth, qualityHeight);
    this.geometry.setAttribute("uv2", this.geometry.getAttribute("uv"));
    // Материал
    const material: ShaderMaterial = this.getMaterial;
    // Настройки объекта
    const mesh: Mesh = new Mesh(this.geometry, material);
    mesh.rotateX(AngleToRad(-90));
    mesh.matrixAutoUpdate = false;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.updateMatrix();
    // Отдать объект
    return this.createRelief().pipe(
      takeUntil(this.destroyed$),
      tap(() => this.createHeights()),
      tap(() => this.setDisplacementMap()),
      map(() => mesh)
    );
  }

  // Шейдер смешивания текстур (Splat Map)
  private get getMaterial(): ShaderMaterial {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = this.outsideMapSize * Math.max(oWidth, oHeight);
    const width: number = oWidth + (borderOSize * 2);
    const height: number = oHeight + (borderOSize * 2);
    const loader: TextureLoader = new TextureLoader();
    // Базовые ткустуры
    const mapTextures: DataTexture[] = this.createMaterials();
    // RGBA Маски
    const maskNames: string[] = mapTextures.map((t, k) => this.maskTextureNamePreffix + k);
    const maskMapNames: string[] = mapTextures.map((t, k) => "mask_map_" + k);
    // Текстуры
    const texNames: string[] = MapTerrains.map(t => "terrain_tex_" + t.name);
    const repeatNames: string[] = MapTerrains.map(t => "terrain_repeat_" + t.name);
    const vTexNames: string[] = MapTerrains.map(t => "v_terrain_tex_" + t.name);
    // Нормали
    const normalTexNames: string[] = MapTerrains.map(t => "normal_terrain_tex_" + t.name);
    const normalRepeatNames: string[] = MapTerrains.map(t => "normal_terrain_repeat_" + t.name);
    const vNormalTexNames: string[] = MapTerrains.map(t => "v_normal_terrain_tex_" + t.name);
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
      uniform sampler2D ${maskNames.join(", ")};
      uniform sampler2D ${texNames.join(", ")};
      uniform vec2 ${repeatNames.join(", ")};

      #if defined( USE_AOMAP ) || defined( USE_NORMALMAP )
        uniform vec2 ${normalRepeatNames.join(", ")};
        uniform sampler2D ${normalTexNames.join(", ")};
      #endif

      ${ShaderLib[this.materialType].fragmentShader
        // Общие переменные
        .replace("void main() {", `
          void main() {

          ${vNormalTexNames.map((n, k) => `vec4 ${n} = texture2D(${normalTexNames[k]}, vUv * ${normalRepeatNames[k]});`).join("\n")}
          ${maskMapNames.map((n, k) => `vec4 ${n} = texture2D(${maskNames[k]}, vUv);`).join("\n")}
        `)
        // Заполнение текстурных карт
        .replace("#include <map_fragment>", `
          #ifdef USE_MAP
            ${vTexNames.map((n, k) => `vec4 ${n} = texture2D(${texNames[k]}, vUv * ${repeatNames[k]});`).join("\n")}

            vec4 texelColor = (
              ${MapTerrains.map((t, k) => "(" + vTexNames[k] + " * " + getMapVarColor(t) + " * " + getMapVar(t) + ".a)").join(" + ")}
            );
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
            float ambientOcclusion = (
              ${MapTerrains.map((t, k) => "(" + vNormalTexNames[k] + ".r * " + getMapVarColor(t) + " * " + getMapVar(t) + ".a)").join(" + ")}
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
              ${vNormalTexNames.map((n, k) => `vec4 ${n} = texture2D(${normalTexNames[k]}, vUv * ${normalRepeatNames[k]});`).join("\n")}

              vec4 full_normal = (
                ${MapTerrains.map((t, k) => "(" + vNormalTexNames[k] + " * " + getMapVarColor(t) + " * " + getMapVar(t) + ".a)").join(" + ")}
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
      }
    `;
    // Код шейдера: вершины
    const vertexShader: string = ShaderLib[this.materialType].vertexShader;
    // Обновление текстур после загрузки
    const onLoad: Function = (name: string, texture: Texture) => {
      if (!!this.material && !!this.material?.uniforms[name]) {
        this.material.uniforms[name].value = texture;
        this.material.uniformsNeedUpdate = true;
      }
    };
    // Текстуры
    const textures: CustomObject<Texture | CanvasTexture> = {
      ...maskNames.reduce((o, name, k) => ({ ...o, [name]: mapTextures[k] }), {}),
      ...texNames.map((name, k) => ([name, normalTexNames[k]])).reduce((o, [name, nName, aoName], k) => {
        const terrain: MapTerrain = MapTerrains[k];
        const texture: Texture = loader.load(TexturePaths.face + terrain.name + "." + terrain.exts.face, t => onLoad(name, t));
        const normalTexture: Texture = loader.load(TexturePaths.normal + terrain.name + "." + terrain.exts.face, t => onLoad(nName, t));
        // const aoTexture: Texture = loader.load(TexturePaths.ao + terrain.name + "." + terrain.exts.ao, t => onLoad(nName, t));
        // Настройки
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.encoding = sRGBEncoding;
        normalTexture.wrapS = RepeatWrapping;
        normalTexture.wrapT = RepeatWrapping;
        // Запомнить текстуры
        return {
          ...o,
          [name]: texture,
          [nName]: normalTexture,
          // [aoName]: aoTexture,
        };
      }, {})
    };
    // Значения
    const uniforms: { [uniform: string]: IUniform } = UniformsUtils.merge([ShaderLib[this.materialType].uniforms, {
      // Текстуры
      ...Object.entries(textures).reduce((o, [name, value]) => ({ ...o, [name]: { type: "t", value } }), {}),
      // Повторы
      b_one_repeat: { type: "v2", value: { x: 1, y: 1 } },
      ...[...repeatNames, ...normalRepeatNames].reduce((o, name) => ({ ...o, [name]: { type: "v2", value: { x: width, y: height } } }), {}),
      // Прочее
      displacementScale: { type: "f", value: DreamCeilParts * DreamMaxHeight },
      normalScale: { type: "v2", value: { x: -1, y: 1 } },
      aoMapIntensity: { type: "f", value: 2 },
    }]);
    // Свойства шейдера
    const defines: CustomObject<boolean> = {
      USE_MAP: true,
      USE_UV: true,
      USE_AOMAP: true,
      USE_NORMALMAP: true,
      USE_BUMPMAP: false,
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
      })
    );
  }





  constructor(
    private alphaFogService: DreamMapAlphaFogService,
    private screenService: ScreenService
  ) { }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    // Очистить объекты
    this.displacementTexture.dispose();
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
      texture.minFilter = LinearMipmapNearestFilter;
      // Вернуть текстуру
      return texture;
    });
  }

  // Выстроение фонового рельефа
  private createRelief(): Observable<void> {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width: number = (borderOSize * 2) + oWidth;
    const height: number = (borderOSize * 2) + oHeight;
    const size: number = width * height;
    const mapData: Uint8Array = new Uint8Array(4 * size);
    const types: CustomObjectKey<keyof ClosestHeights, ReliefType> = ReliefTypes;
    const filterTypes: ReliefType[] = Array.from(new Set(Object.values(types)));
    const coords: CustomObjectKey<keyof ClosestHeights, XYCoord> = ReliefSideNames.map((n, y) => n.map((name, x) => ({ name, x, y })))
      .reduce((o, d) => ([...o, ...d]), [])
      .filter(({ name }) => !!name)
      .map(o => ({ ...o, x: DreamMapSize * o.x, y: DreamMapSize * o.y }))
      .reduce((o, { name, x, y }) => ({ ...o, [name]: { x, y } }), {});
    // Запрос к данным
    return forkJoin(filterTypes.map(type => this.getRelief(type))).pipe(
      takeUntil(this.destroyed$),
      map(datas => Object.entries(coords).forEach(([name, coord]) => {
        const type: ReliefType = types[name];
        const { data, correctSize, size: { width: imgWidth } }: ReliefData = datas.find(({ type: dataType }) => dataType === type);
        const closestName: CustomObjectKey<keyof ClosestHeights, keyof ClosestHeights> = ReliefSideClosestsNames[name];
        // Цикл по координатам
        CreateArray(DreamMapSize).map(dY => dY + correctSize.top).forEach(dY =>
          CreateArray(DreamMapSize).map(dX => dX + correctSize.left).forEach(dX => {
            const x: number = dX - correctSize.top + coord.x;
            const y: number = dY - correctSize.left + coord.y;
            // Индексы
            const index: number = ((y * width) + x) * 4;
            const dIndex: number = ((dY * imgWidth) + dX) * 4;
            // Записать значения в общий массив
            CreateArray(4).map(k => mapData[index + k] = data[dIndex + k]);
          }));
        // Цикл по соседним ячейкам
        Object.entries(closestName).forEach(([cNameType, cName]) => {
          const cType: ReliefType = types[cName];
          const reliefData: ReliefData = datas.find(({ type: dataType }) => dataType === cType);
          const sX: number = cNameType === "left" ? reliefData.size.width - reliefData.correctSize.right : 0;
          const lX: number = cNameType === "left" ? reliefData.correctSize.right : cNameType === "right" ? reliefData.correctSize.left : 0;
          const sY: number = cNameType === "top" ? reliefData.size.height - reliefData.correctSize.bottom : 0;
          const lY: number = cNameType === "top" ? reliefData.correctSize.bottom : cNameType === "bottom" ? reliefData.correctSize.top : 0;
          // Функция смазывания высот
          const smoothValue = (imgIndex, index, length, i, name) => {
            const step: number = 1 / length / 2;
            const koof: number = (step * (cNameType === name ? i + 1 : length - i)) + 0.5;
            const cKoof: number = 1 - koof;
            // Записать значения в общий массив
            CreateArray(4).map(k => {
              const value: number = mapData[index + k];
              const cValue: number = reliefData.data[imgIndex + k];
              const newValue: number = (value * koof) + (cValue * cKoof);
              // Запомнить значение
              mapData[index + k] = newValue;
            });
          };
          // горизонтальное смешивание
          if (lX > 0) {
            CreateArray(lX).map(cX => cX + sX).forEach((cX, i) => {
              const x: number = (cNameType === "left" ? i : DreamMapSize - lX + i) + coord.x;
              // Цикл по координатам Y
              CreateArray(DreamMapSize).map(y => y + coord.y).forEach(y => {
                const cY: number = y - coord.y + reliefData.correctSize.top;
                const index: number = ((y * width) + x) * 4;
                const cIndex: number = ((cY * imgWidth) + cX) * 4;
                // Записать значения в общий массив
                smoothValue(cIndex, index, lX, i, "left");
              });
            });
          }
          // Вертикальное смешивание
          if (lY > 0) {
            CreateArray(lY).map(cY => cY + sY).forEach((cY, i) => {
              const y: number = (cNameType === "top" ? i : DreamMapSize - lY + i) + coord.y;
              // Цикл по координатам Y
              CreateArray(DreamMapSize).map(x => x + coord.x).forEach(x => {
                const cX: number = x - coord.x + reliefData.correctSize.left;
                const index: number = ((y * width) + x) * 4;
                const cIndex: number = ((cY * imgWidth) + cX) * 4;
                // Записать значения в общий массив
                smoothValue(cIndex, index, lY, i, "top");
              });
            });
          }
        });
      })),
      tap(() => {
        const texture: DataTexture = new DataTexture(mapData, width, height);
        // Параметры текстуры
        texture.magFilter = LinearFilter;
        texture.minFilter = LinearMipmapNearestFilter;
        texture.flipY = true;
        this.displacementTexture = texture;
      })
    );
  }

  // Генерация карты высот
  private createHeights(): void {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.outsideMapSize;
    const width: number = this.displacementTexture.image.width;
    // Цикл по ячейкам
    CreateArray(oHeight).forEach(y => CreateArray(oWidth).forEach(x => {
      const { coord: { z } }: DreamMapCeil = this.getCeil(x, y);
      const colorZ: number = (z * 255) / DreamMaxHeight;
      const textureX: number = x + borderOSize;
      const textureY: number = y + borderOSize;
      const index: number = ((textureY * width) + textureX) * 4;
      // Обновить цвета
      CreateArray(3).forEach(k => this.displacementTexture.image.data[index + k] = colorZ);
    }));
    // Обновить геометрию
    this.displacementTexture.needsUpdate = true;
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
    CreateArray(hght).forEach(h => CreateArray(wdth).forEach(w => {
      const indexes: number[] = CreateArray(2).map(h2 => h + h2 - 1).map(iH => iH < 0 ? 0 : (iH >= height - 1 ? height - 1 : iH))
        .map(iH => CreateArray(2).map(w2 => w + w2 - 1).map(iW => iW < 0 ? 0 : (iW >= width - 1 ? width - 1 : iW)).map(iW => ((iH * width) + iW) * 4))
        .reduce((o, i) => ([...o, ...i]), []);
      const indexV: number = (h * wdth) + w;
      // Поиск среднего Z
      const z: number = indexes
        .map(index => (this.displacementTexture.image.data[index] / 255) * scale)
        .reduce((o, z) => o + z, 0) / indexes.length;
      // Установить высоту
      vertexes.setZ(indexV, z);
    }));
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
    // Цикл по ячейкам
    ceils.forEach(({ coord: { x, y } }) => {
      const ceil: DreamMapCeil = this.getCeil(x, y);
      // Параметры
      const colorZ: number = (ceil.coord.z * 255) / DreamMaxHeight;
      const textureX: number = ceil.coord.x + borderOSize;
      const textureY: number = ceil.coord.y + borderOSize;
      const index: number = ((textureY * width) + textureX) * 4;
      // Обновить цвета
      CreateArray(3).forEach(k => this.displacementTexture.image.data[index + k] = colorZ);
      // Обновить вершины
      CreateArray(2).map(h => textureY + h).forEach(h => CreateArray(2).map(w => textureX + w).forEach(w => {
        const indexes: number[] = CreateArray(2).map(h2 => h + h2 - 1).map(iH => iH < 0 ? 0 : (iH >= height - 1 ? height - 1 : iH))
          .map(iH => CreateArray(2).map(w2 => w + w2 - 1).map(iW => iW < 0 ? 0 : (iW >= width - 1 ? width - 1 : iW)).map(iW => ((iH * width) + iW) * 4))
          .reduce((o, i) => ([...o, ...i]), []);
        const indexV: number = (h * wdth) + w;
        // Поиск среднего Z
        const z: number = indexes
          .map(index => (this.displacementTexture.image.data[index] / 255) * scale)
          .reduce((o, z) => o + z, 0) / indexes.length;
        // Установить высоту
        vertexes.setZ(indexV, z);
      }));
    });
    // Обновить геометрию
    this.geometry.setAttribute("position", vertexes);
    this.geometry.computeVertexNormals();
    this.geometry.attributes.position.needsUpdate = true;
    this.displacementTexture.needsUpdate = true;
  }
}





// Интерфейс данных окружающего рельефа
interface ReliefData {
  correctSize: ReliefDataCorrect;
  type: string;
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

// Тип рельефов
enum ReliefType {
  flat = "flat",
  hill = "hill",
  mountain = "mountain",
  canyon = "canyon",
  pit = "pit",
}

// Список имен областей рельефа
const ReliefSideNames: (keyof ClosestHeights)[][] = [
  ["topLeft", "top", "topRight"],
  ["left", null, "right"],
  ["bottomLeft", "bottom", "bottomRight"]
];

// Список соседних имен областей рельефа
const ReliefSideClosestsNames: CustomObjectKey<keyof ClosestHeights, CustomObjectKey<keyof ClosestHeights, keyof ClosestHeights>> = {
  topLeft: { bottom: "left", right: "top" },
  top: { left: "topLeft", right: "topRight" },
  topRight: { left: "top", bottom: "right" },
  left: { top: "topLeft", bottom: "bottomLeft" },
  right: { top: "topRight", bottom: "bottomRight" },
  bottomLeft: { top: "left", right: "bottom" },
  bottom: { left: "bottomLeft", right: "bottomRight" },
  bottomRight: { top: "right", left: "bottom" },
};

// Типы местностей
const ReliefTypes: CustomObjectKey<keyof ClosestHeights, ReliefType> = {
  topLeft: ReliefType.mountain,
  top: ReliefType.mountain,
  topRight: ReliefType.mountain,
  left: ReliefType.mountain,
  right: ReliefType.mountain,
  bottomLeft: ReliefType.mountain,
  bottom: ReliefType.mountain,
  bottomRight: ReliefType.mountain,
};
