import { Injectable, OnDestroy } from "@angular/core";
import { AngleToRad, CustomObject, CustomObjectKey, MathRound } from "@_models/app";
import { DreamMap, DreamMapCeil, MapTerrain, MapTerrains, MapTerrainSplatMapColor, TexturePaths } from "@_models/dream-map";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamTerrain } from "@_services/dream.service";
import { BackSide, CanvasTexture, Color, DataTexture, Float32BufferAttribute, IUniform, LinearFilter, LinearMipmapNearestFilter, Mesh, PlaneGeometry, RepeatWrapping, ShaderLib, ShaderMaterial, sRGBEncoding, Texture, TextureLoader, UniformsUtils } from "three";





@Injectable()

export class DreamMapTerrainService implements OnDestroy {


  private materialType: keyof typeof ShaderLib = "standard";

  outsideMapSize: number = 2;
  private mapPixelSize: number = 1;
  private mapPixelBlur: boolean = false;
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
    const maskNames: string[] = mapTextures.map((t, k) => "mask_tex_" + k);
    const maskMapNames: string[] = mapTextures.map((t, k) => "mask_map_" + k);
    // Текстуры
    const texNames: string[] = MapTerrains.map(t => "terrain_tex_" + t.name);
    const repeatNames: string[] = MapTerrains.map(t => "terrain_repeat_" + t.name);
    const vTexNames: string[] = MapTerrains.map(t => "v_terrain_tex_" + t.name);
    // Нормали
    const normalTexNames: string[] = MapTerrains.map(t => "normal_terrain_tex_" + t.name);
    const normalRepeatNames: string[] = MapTerrains.map(t => "normal_terrain_repeat_" + t.name);
    const vNormalTexNames: string[] = MapTerrains.map(t => "v_normal_terrain_tex_" + t.name);
    // Карты AO
    const aoTexNames: string[] = MapTerrains.map(t => "ao_terrain_tex_" + t.name);
    const aoRepeatNames: string[] = MapTerrains.map(t => "ao_terrain_repeat_" + t.name);
    const vAoTexNames: string[] = MapTerrains.map(t => "v_ao_terrain_tex_" + t.name);
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

      ${ShaderLib[this.materialType].fragmentShader
        // Заполнение текстурных карт
        .replace("#include <map_fragment>", `
          #ifdef USE_MAP
            ${maskMapNames.map((n, k) => `vec4 ${n} = texture2D(${maskNames[k]}, vUv);`).join("\n")}
            ${vTexNames.map((n, k) => `vec4 ${n} = texture2D(${texNames[k]}, vUv * ${repeatNames[k]});`).join("\n")}

            vec4 texelColor = (
              ${MapTerrains.map((t, k) => "(" + vTexNames[k] + " * " + getMapVarColor(t) + " * " + getMapVar(t) + ".a)").join(" + ")}
            );
            vec4 diffuseColor = LinearToLinear(texelColor);
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
            uniform vec2 ${normalRepeatNames.join(", ")};
            uniform sampler2D ${normalTexNames.join(", ")};
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
    // Код шейдераЖ вершины
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
      ...texNames.map((name, k) => ([name, normalTexNames[k], aoTexNames[k]])).reduce((o, [name, nName, aoName], k) => {
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
      ...[...repeatNames, ...normalRepeatNames].reduce((o, name) => ({ ...o, [name]: { type: "v2", value: { x: width / 2, y: height / 2 } } }), {}),
      // Прочее
      normalScale: { type: "v2", value: { x: -1, y: 1 } },
      displacementScale: { type: "f", value: DreamCeilParts * DreamMaxHeight },
      aoMapIntensity: { type: "f", value: 0.5 },
    }]);
    // Свойства шейдера
    const defines: CustomObject<boolean> = {
      USE_MAP: true,
      USE_UV: true,
      USE_AOMAP: false,
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
    const realSize: number = width * height;
    const blurMap: boolean = this.mapPixelBlur && this.mapPixelSize > 1 ? true : false;
    const pixelSize: number = blurMap ? this.mapPixelSize : 1;
    const size: number = realSize * Math.pow(pixelSize, 2);
    const depth: number = MapTerrains.filter((t, k) => k / 3 === Math.round(k / 3)).length;
    // Получить данные о местности
    const getTerrain: Function = (x: number = -1, y: number = -1): MapTerrain =>
      MapTerrains.find(({ id }) => id === this.getCeil(x - borderOSize, y - borderOSize).terrain) ?? MapTerrains.find(({ id }) => id === 1);
    // Получить сведения о цвете
    const getColor: Function = (layout: number, color: 0 | 1 | 2, terrain: MapTerrain) => terrain.splatMap.layout === layout && terrain.splatMap.color === color ? 255 : 0;
    // Цикл по слоям
    return Array.from(Array(depth).keys()).map(d => {
      const data: Uint8Array = new Uint8Array(4 * size);
      // Цикл по размеру
      Array.from(Array(size).keys()).forEach(s => {
        const stride: number = s * 4;
        const realX: number = MathRound((s - (Math.floor(s / (width * pixelSize)) * (width * pixelSize))) / pixelSize, 2);
        const realY: number = MathRound(height - 1 - Math.floor(s / (width * pixelSize)) / pixelSize, 2);
        const x: number = Math.floor(realX);
        const y: number = Math.ceil(realY);
        // Включено размытие
        if (blurMap) {
          const blurYA: number = MathRound(realY + 1 - y, 2);
          const blurYB: number = MathRound(1 - blurYA, 2);
          const blurXB: number = MathRound(realX - x, 2);
          const blurXA: number = MathRound(1 - blurXB, 2);
          const blurLB: number = MathRound(blurXA * blurYA, 2);
          const blurLT: number = MathRound(blurXA * blurYB, 2);
          const blurRB: number = MathRound(blurXB * blurYA, 2);
          const blurRT: number = MathRound(blurXB * blurYB, 2);
          // Данные о типе местности
          const terrainLB: MapTerrain = getTerrain(x, y);
          const terrainLT: MapTerrain = getTerrain(x, y - 1);
          const terrainRB: MapTerrain = getTerrain(x + 1, y);
          const terrainRT: MapTerrain = getTerrain(x + 1, y - 1);
          // Цвета
          Array.from(Array(3).keys()).forEach(k => {
            let color: number = (
              (getColor(d, k, terrainLB) * blurLB) +
              (getColor(d, k, terrainLT) * blurLT) +
              (getColor(d, k, terrainRB) * blurRB) +
              (getColor(d, k, terrainRT) * blurRT)
            );
            color = color < 0 ? 0 : color;
            color = color > 255 ? 255 : color;
            // Запомнить данные
            data[stride + k] = color;
          });
        }
        // Без размытия
        else {
          // Данные о типе местности
          const terrain: MapTerrain = getTerrain(x, y);
          // Цвета
          Array.from(Array(3).keys()).forEach(k => data[stride + k] = getColor(d, k, terrain));
        }
        // Прозрачный канал
        data[stride + 3] = 255;
      });
      // Настройки
      const texture: DataTexture = new DataTexture(data, width * pixelSize, height * pixelSize);
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
    const cYs: number[] = Array.from(Array(oHeight).keys());
    const cXs: number[] = Array.from(Array(oWidth).keys());
    const blurs: number[] = Array.from(Array((this.displacementPixelBlur * 2) + 1).keys()).map(v => v - this.displacementPixelBlur);
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
    const wdthArray: number[] = Array.from(Array(wdth).keys());
    const hghtArray: number[] = Array.from(Array(hght).keys());
    const context: CanvasRenderingContext2D = this.displacementCanvas.getContext("2d");
    const vertexes: Float32BufferAttribute = this.geometry.getAttribute("position") as Float32BufferAttribute;
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const scale: number = heightPart * DreamMaxHeight;
    // Цикл по вершинам
    hghtArray.forEach(h => wdthArray.forEach(w => {
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

  // Обновить карту
  updateDreamMap(dreamMap: DreamMap): void {
    this.dreamMap = dreamMap;
  }
}





// Интерфейс соседних блоков
export interface ClosestHeights {
  top: ClosestHeight;
  left: ClosestHeight;
  right: ClosestHeight;
  bottom: ClosestHeight;
  topLeft: ClosestHeight;
  topRight: ClosestHeight;
  bottomLeft: ClosestHeight;
  bottomRight: ClosestHeight;
}

// Интерфейс для соседних блоков
export interface ClosestHeight {
  height: number;
  terrain: number;
}
