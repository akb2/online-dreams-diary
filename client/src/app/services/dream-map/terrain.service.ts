import { Injectable } from "@angular/core";
import { AngleToRad, CustomObject, CustomObjectKey } from "@_models/app";
import { DreamMap, DreamMapCeil, MapTerrain, MapTerrains, MapTerrainSplatMapColor, TexturePaths } from "@_models/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamTerrain } from "@_services/dream.service";
import { CanvasTexture, Color, Float32BufferAttribute, IUniform, Mesh, PlaneGeometry, RepeatWrapping, ShaderLib, ShaderMaterial, Texture, TextureLoader, UniformsUtils } from "three";





@Injectable()

export class TerrainService {


  private materialType: keyof typeof ShaderLib = "standard";

  private miniMapTexturesSize: number = 3;
  private miniMapHeightsSize: number = 3;
  private miniMapTexturesBlur: number = 1;
  private miniMapHeightsBlur: number = 1;
  private geometryQuality: number = 2;
  outsideMapSize: number = 1;

  private mapCanvases: HTMLCanvasElement[] = [];
  private displacementCanvas: HTMLCanvasElement;

  private dreamMap: DreamMap;
  private geometry: PlaneGeometry;
  private material: ShaderMaterial;
  private textureMap: ImageData[] = [];
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
    const borderOSize: number = Math.max(oWidth, oHeight);
    const borderSize: number = this.outsideMapSize * borderOSize * DreamCeilSize;
    const width: number = (oWidth * DreamCeilSize) + (borderSize * 2);
    const height: number = (oHeight * DreamCeilSize) + (borderSize * 2);
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const qualityWidth: number = width * this.geometryQuality;
    const qualityHeight: number = height * this.geometryQuality;
    // Создание карт
    this.createMaterials();
    // Создание геометрии
    this.geometry = new PlaneGeometry(width, height, qualityWidth, qualityHeight);
    this.createHeights();
    // Настройки объекта
    const mesh: Mesh = new Mesh(this.geometry, this.getMaterial);
    mesh.rotateX(AngleToRad(-90));
    mesh.position.setY(-heightPart * (DreamMaxHeight - 1));
    mesh.receiveShadow = true;
    mesh.castShadow = true;
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
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const loader: TextureLoader = new TextureLoader();
    // RGBA Маски
    const maskNames: string[] = this.textureMap.map((t, k) => "mask_tex_" + k);
    const maskMapNames: string[] = this.textureMap.map((t, k) => "mask_map_" + k);
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

      ${ShaderLib.standard.fragmentShader
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
      ...maskNames.reduce((o, name, k) => ({ ...o, [name]: new CanvasTexture(this.mapCanvases[k]) }), {}),
      ...texNames.map((name, k) => ([name, normalTexNames[k], aoTexNames[k]])).reduce((o, [name, nName, aoName], k) => {
        const terrain: MapTerrain = MapTerrains[k];
        const texture: Texture = loader.load(TexturePaths.face + terrain.name + "." + terrain.exts.face, t => onLoad(name, t));
        const normalTexture: Texture = loader.load(TexturePaths.normal + terrain.name + "." + terrain.exts.face, t => onLoad(nName, t));
        // const aoTexture: Texture = loader.load(TexturePaths.ao + terrain.name + "." + terrain.exts.ao, t => onLoad(nName, t));
        // Настройки
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
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
      normalScale: { type: "v2", value: { x: -1, y: -1 } },
      displacementMap: { type: "t", value: new CanvasTexture(this.displacementCanvas) },
      displacementScale: { type: "f", value: heightPart * DreamMaxHeight },
      aoMapIntensity: { type: "f", value: 0.5 },
    }]);
    // Материал
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      lights: true,
      fog: true,
      defines: {
        USE_MAP: true,
        USE_UV: true,
        USE_AOMAP: false,
        USE_NORMALMAP: true,
        USE_BUMPMAP: true,
        USE_DISPLACEMENTMAP: false,
        PHYSICALLY_CORRECT_LIGHTS: true,
        FLAT_SHADED: true,
        USE_TANGENT: true,
        USE_CLEARCOAT: true,
        USE_SHEEN: true,
        USE_ENVMAP: true,
      },
      extensions: {
        derivatives: true,
        fragDepth: false,
        drawBuffers: false,
        shaderTextureLOD: false,
      }
    });
    // Вернуть материал
    return this.material;
  }





  // Отрисовать текстурную карту
  createMaterials(x: number = -1, y: number = -1, bluring: boolean = true): void {
    this.mapCanvases = MapTerrains.filter((t, k) => k / 3 === Math.round(k / 3)).map(() => document.createElement("canvas"));
    // Параметры
    const contexts: CanvasRenderingContext2D[] = this.mapCanvases.map(canvas => canvas.getContext("2d"));
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight);
    const borderSize: number = this.outsideMapSize * borderOSize * this.miniMapTexturesSize;
    const width: number = (oWidth * this.miniMapTexturesSize) + (borderSize * 2);
    const height: number = (oHeight * this.miniMapTexturesSize) + (borderSize * 2);
    const cYs: number[] = Array.from(Array(oHeight).keys());
    const cXs: number[] = Array.from(Array(oWidth).keys());
    const blurs: number[] = Array.from(Array((this.miniMapTexturesBlur * 2) + 1).keys()).map(v => v - this.miniMapTexturesBlur);
    const colors: CustomObjectKey<MapTerrainSplatMapColor, Color> = {
      [MapTerrainSplatMapColor.Red]: new Color(1, 0, 0),
      [MapTerrainSplatMapColor.Green]: new Color(0, 1, 0),
      [MapTerrainSplatMapColor.Blue]: new Color(0, 0, 1)
    };
    // Отрисовка ячейки
    const drawCeil: Function = (x: number, y: number) => {
      const ceil: DreamMapCeil = this.getCeil(x, y);
      const terrain: MapTerrain = MapTerrains.find(({ id }) => id === ceil.terrain) ?? MapTerrains.find(({ id }) => id === 1);
      const layout: number = terrain.splatMap.layout;
      const color: Color = colors[terrain.splatMap.color];
      const sX: number = borderSize + (x * this.miniMapTexturesSize);
      const sY: number = borderSize + (y * this.miniMapTexturesSize);
      const context: CanvasRenderingContext2D = contexts[layout];
      // Вставить карту
      if (!!this.textureMap[layout]) {
        context.putImageData(this.textureMap[layout], 0, 0);
      }
      // Нарисовать квадрат
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "#000000";
      context.fillRect(sX, sY, this.miniMapTexturesSize, this.miniMapTexturesSize);
      context.fillStyle = "#" + color.getHexString();
      context.fillRect(sX, sY, this.miniMapTexturesSize, this.miniMapTexturesSize);
    };
    // Отрисовка одной ячейки
    if (x >= 0 && y >= 0) {
      drawCeil(x, y);
      // Запомнить карту
      this.textureMap = contexts.map(context => context.getImageData(0, 0, width, height));
    }
    // Обход ячеек
    else {
      const terrain: MapTerrain = MapTerrains.find(({ id }) => id === 1);
      const layout: number = terrain.splatMap.layout;
      const color: Color = colors[terrain.splatMap.color];
      const context: CanvasRenderingContext2D = contexts[layout];
      // Свойства
      this.mapCanvases.forEach(canvas => {
        canvas.width = width;
        canvas.height = height;
      });
      contexts.forEach(context => {
        context.imageSmoothingEnabled = false;
        context.fillStyle = "#000000";
        context.fillRect(0, 0, width, height);
      });
      context.fillStyle = "#" + color.getHexString();
      context.fillRect(0, 0, width, height);
      contexts.forEach(context => {
        context.fillStyle = "#000000";
        context.fillRect(borderSize, borderSize, oWidth * this.miniMapTexturesSize, oHeight * this.miniMapTexturesSize);
        context.globalCompositeOperation = "source-over";
      });
      // Обход ячеек
      cYs.forEach(cY => cXs.forEach(cX => drawCeil(cX, cY)));
      // Запомнить карту
      this.textureMap = contexts.map(context => context.getImageData(0, 0, width, height));
    }
    // Размытие карты
    if (bluring) {
      if (this.miniMapTexturesBlur > 0) {
        contexts.forEach((context, k) => {
          context.globalAlpha = 0.5;
          blurs.forEach(y => blurs.forEach(x => context.drawImage(this.mapCanvases[k], x, y)));
          context.globalAlpha = 1;
        });
      }
      // Обновить
      if (!!this.material) {
        const maskNames: string[] = this.textureMap.map((t, k) => "mask_tex_" + k);
        this.mapCanvases.map((canvas, k) => this.material.uniforms[maskNames[k]].value = new CanvasTexture(canvas));
        this.material.uniformsNeedUpdate = true;
      }
    }
  }

  // Отрисовать карту высот
  createHeights(x: number = -1, y: number = -1, bluring: boolean = true): void {
    this.displacementCanvas = document.createElement("canvas");
    // Параметры
    const displacementContext: CanvasRenderingContext2D = this.displacementCanvas.getContext("2d");
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight);
    const borderSize: number = this.outsideMapSize * borderOSize * this.miniMapHeightsSize;
    const width: number = (oWidth * this.miniMapHeightsSize) + (borderSize * 2);
    const height: number = (oHeight * this.miniMapHeightsSize) + (borderSize * 2);
    const cYs: number[] = Array.from(Array(oHeight).keys());
    const cXs: number[] = Array.from(Array(oWidth).keys());
    const blurs: number[] = Array.from(Array((this.miniMapHeightsBlur * 2) + 1).keys()).map(v => v - this.miniMapHeightsBlur);
    // Отрисовка ячейки
    const drawCeil: Function = (x: number, y: number) => {
      const z: number = ((this.getCeil(x, y).coord.z * 255) / DreamMaxHeight) / 255;
      const displacementColor: Color = new Color(z, z, z);
      const bumpColor: Color = new Color(1 - z, 1 - z, 1 - z);
      const sX: number = borderSize + (x * this.miniMapHeightsSize);
      const sY: number = borderSize + (y * this.miniMapHeightsSize);
      // Вставить карту высот
      if (!!this.displacementMap) {
        displacementContext.putImageData(this.displacementMap, 0, 0);
      }
      // Нарисовать квадрат
      displacementContext.fillStyle = "#" + displacementColor.getHexString();
      displacementContext.fillRect(sX, sY, this.miniMapHeightsSize, this.miniMapHeightsSize);
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
      const bumpColor: Color = new Color(1 - z, 1 - z, 1 - z);
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
      if (this.miniMapHeightsBlur > 0) {
        displacementContext.globalAlpha = 0.5;
        blurs.forEach(y => blurs.forEach(x => displacementContext.drawImage(this.displacementCanvas, x, y)));
        displacementContext.globalAlpha = 1;
      }
      // Обновить
      if (!!this.geometry) {
        // this.material.uniforms.displacementMap.value = new CanvasTexture(this.displacementCanvas);
        // this.material.uniformsNeedUpdate = true;
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
