import { Injectable, OnDestroy } from "@angular/core";
import { AngleToRad, CreateArray, CustomObject, CustomObjectKey, MathRound } from "@_models/app";
import { DreamMap, DreamMapCeil, MapTerrain, MapTerrains, MapTerrainSplatMapColor, TexturePaths } from "@_models/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamOutsideSize, DreamTerrain } from "@_models/dream-map-settings";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { BackSide, CanvasTexture, Color, DataTexture, Float32BufferAttribute, IUniform, LinearFilter, LinearMipmapNearestFilter, Mesh, PlaneGeometry, RepeatWrapping, ShaderLib, ShaderMaterial, sRGBEncoding, Texture, TextureLoader, UniformsUtils } from "three";





@Injectable()

export class DreamMapTerrainService implements OnDestroy {


  private materialType: keyof typeof ShaderLib = "standard";

  private maskTextureNamePreffix: string = "mask_tex_";

  outsideMapSize: number = DreamOutsideSize;
  private displacementPixelSize: number = 2;
  private displacementPixelBlur: number = 1;
  geometryQuality: number = 1;

  private dreamMap: DreamMap;
  private geometry: PlaneGeometry;
  private material: ShaderMaterial;

  displacementCanvas: HTMLCanvasElement;
  private displacementMap: ImageData;





  // Получить ячейку
  private getCeil(x: number, y: number): DreamMapCeil {
    return this.dreamMap?.ceils?.find(c => c.coord.x === x && c.coord.y === y) || this.getDefaultCeil(x, y);
  }

  // Ячейка по умолчанию
  private getDefaultCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: DreamTerrain,
      object: null,
      coord: {
        x,
        y,
        z: DreamDefHeight,
        originalZ: DreamDefHeight
      }
    };
  }

  // Объект для отрисовки
  getObject(dreamMap: DreamMap): Mesh {
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
    this.createHeights();
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
    return mesh;
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





  constructor(
    private alphaFogService: DreamMapAlphaFogService
  ) { }

  ngOnDestroy(): void {
    this.displacementCanvas.remove();
    delete this.displacementMap;
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

  // Генерация карты высот
  createHeights(x: number = -1, y: number = -1, bluring: boolean = true): void {
    this.displacementCanvas = document.createElement("canvas");
    // Параметры
    const displacementContext: CanvasRenderingContext2D = this.displacementCanvas.getContext("2d");
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = this.outsideMapSize * Math.max(oWidth, oHeight);
    const borderSize: number = borderOSize * this.displacementPixelSize;
    const width: number = (oWidth * this.displacementPixelSize) + (borderSize * 2);
    const height: number = (oHeight * this.displacementPixelSize) + (borderSize * 2);
    const cYs: number[] = CreateArray(oHeight);
    const cXs: number[] = CreateArray(oWidth);
    const blurs: number[] = CreateArray((this.displacementPixelBlur * 2) + 1).map(v => v - this.displacementPixelBlur);
    // Отрисовка ячейки
    const drawCeil: Function = (x: number, y: number) => {
      const z: number = ((this.getCeil(x, y).coord.z * 255) / DreamMaxHeight) / 255;
      const displacementColor: Color = new Color(z, z, z);
      const sX: number = borderSize + (x * this.displacementPixelSize);
      const sY: number = borderSize + (y * this.displacementPixelSize);
      // Вставить карту высот
      if (!!this.displacementMap) {
        displacementContext.putImageData(this.displacementMap, 0, 0);
      }
      // Нарисовать квадрат
      displacementContext.fillStyle = "#" + displacementColor.getHexString();
      displacementContext.fillRect(sX, sY, this.displacementPixelSize, this.displacementPixelSize);
    };
    // Отрисовка одной ячейки
    if (x >= 0 && y >= 0) {
      drawCeil(x, y);
      // Запомнить карту
      this.displacementMap = displacementContext.getImageData(0, 0, width, height);
    }
    // Обход ячеек
    else {
      const z: number = ((this.dreamMap.land.z * 255) / DreamMaxHeight) / 255;
      const displacementColor: Color = new Color(z, z, z);
      // Свойства
      this.displacementCanvas.width = width;
      this.displacementCanvas.height = height;
      displacementContext.imageSmoothingEnabled = false;
      displacementContext.fillStyle = "#" + displacementColor.getHexString();
      displacementContext.fillRect(0, 0, width, height);
      // Обход ячеек
      cYs.forEach(cY => cXs.forEach(cX => drawCeil(cX, cY)));
      // Запомнить карту
      this.displacementMap = displacementContext.getImageData(0, 0, width, height);
    }
    // Размытие карты
    if (bluring) {
      if (this.displacementPixelBlur > 0) {
        displacementContext.globalAlpha = 0.5;
        blurs.forEach(y => blurs.forEach(x => displacementContext.drawImage(this.displacementCanvas, x, y)));
        displacementContext.globalAlpha = 1;
      }
      // Обновить
      if (!!this.geometry) {
        this.setDisplacementMap();
      }
    }
  }

  // Выставить вершины по карте высот
  private setDisplacementMap(): void {
    const wdth: number = this.geometry.parameters.widthSegments + 1;
    const hght: number = this.geometry.parameters.heightSegments + 1;
    const widthStep: number = this.displacementMap.width / wdth;
    const heightStep: number = this.displacementMap.height / hght;
    const context: CanvasRenderingContext2D = this.displacementCanvas.getContext("2d");
    const vertexes: Float32BufferAttribute = this.geometry.getAttribute("position") as Float32BufferAttribute;
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const scale: number = heightPart * DreamMaxHeight;
    // Цикл по вершинам
    CreateArray(hght).forEach(h => CreateArray(wdth).forEach(w => {
      const imgData: Uint8ClampedArray = context.getImageData(Math.round(w * widthStep), Math.round(h * heightStep), 1, 1).data;
      const index = (h * wdth) + w;
      const z: number = (imgData[0] / 255) * scale;
      // Установить высоту
      vertexes.setZ(index, z);
    }));
    // Обновить геометрию
    this.geometry.setAttribute("position", vertexes);
    this.geometry.computeVertexNormals();
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

  // Обновить карту
  updateDreamMap(dreamMap: DreamMap): void {
    this.dreamMap = dreamMap;
  }
}
