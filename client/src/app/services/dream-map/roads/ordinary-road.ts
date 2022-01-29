import { TerrainMaterialCache, TerrainTextureCache, XYCoord } from "@_models/dream-map";
import { Road } from "@_services/dream-map/roads/basic";
import { BackSide, BoxGeometry, BufferAttribute, BufferGeometry, DoubleSide, FrontSide, Group, Matrix4, Mesh, MeshPhongMaterial, PlaneGeometry, Vector3 } from "three";





export class OrdinaryRoad extends Road {


  private borderWeight: number;
  private borderSize: number;
  private borderRadius: number;
  private borderHeight: number;
  private borderSpacing: number;

  private circleQuality: number = 16;
  private circleAngle: number;





  // Координаты точки на элипсе
  private getCoordsOnCircle(radius: number, angle: number): XYCoord {
    const x: number = radius * this.cos(angle);
    const y: number = radius * this.sin(angle);
    // Вернуть координаты
    return { x, y };
  }





  constructor(
    override ceilSizeY: number,
    override sX: number,
    override sY: number,
    override eX: number,
    override eY: number,
    override textureCache: TerrainTextureCache[] = [],
    override materialCache: TerrainMaterialCache[] = []
  ) {
    super(ceilSizeY, sX, sY, eX, eY, textureCache, materialCache);
    // Проверить число граней
    this.circleQuality = Math.round(this.circleQuality / 4) === this.circleQuality / 4 ?
      this.circleQuality :
      Math.floor(this.circleQuality / 8) * 8;
    this.circleQuality = this.circleQuality >= 8 ? this.circleQuality : 8;
    // Свои параметры
    this.borderWeight = ceilSizeY / 25;
    this.borderRadius = (this.ceilSizeY / 2) - this.borderWeight;
    this.borderHeight = this.ceilSizeY / 25;
    this.borderSpacing = this.ceilSizeY / 300;
    this.circleAngle = 360 / this.circleQuality;
    this.borderSize = (this.ceilSizeX / (this.circleQuality / 4)) - (this.borderSpacing * 2);
  }





  // Вернуть группу моделей
  override getObject(): Group {
    const group: Group = new Group();
    const edgeStart: Group = this.createEdge(0);
    const roadBody: Group = this.createBody();
    const endStart: Group = this.createEdge(1);
    // Добавить объекты в группу
    group.add(edgeStart, roadBody, endStart);
    // Настройки
    group.rotateY(this.angleToRad(360 - this.angle));
    // Вернуть группу объектов
    return group;
  }





  // Край дороги
  private createEdge(dimension: 0 | 1): Group {
    const zeroPosition: number = this.ceilSizeX - this.ceilSizeY;
    const startX: number = dimension === 1 ? zeroPosition + (this.ceilSizeX * (this.ceils - 1)) : 0;
    const group: Group = new Group();
    const koofAngle: number = dimension === 0 ? 0 : 180;
    const radius: number = this.borderRadius;
    const pointsMap: number[] = [...Array((this.circleQuality + 2) / 2).keys()]
      .map(k => k + (this.circleQuality / 4))
      .map(k => this.circleAngle * k);
    let circleBorderSize: number = (2 * radius * this.sin(this.circleAngle / 2)) - (this.borderSpacing * 2);
    // Дорожное полотно
    const geometry: BufferGeometry = this.edgeGeometry(dimension);
    const roadMaterial: MeshPhongMaterial = this.getMaterial(100001, BackSide);
    const mesh: Mesh = new Mesh(geometry, roadMaterial);
    // Тротуары полукруга
    pointsMap.forEach((a, k) => {
      if (k > 0) {
        const mesh: Mesh = this.getBorder(circleBorderSize);
        const { x: x1, y: y1 } = this.getCoordsOnCircle(radius, a + koofAngle);
        const { x: x2, y: y2 } = this.getCoordsOnCircle(radius, (a - this.circleAngle) + koofAngle);
        const x: number = startX + ((x1 + x2) / 2);
        const y: number = (y1 + y2) / 2;
        // Настройки
        mesh.position.set(x, 0, y);
        mesh.rotateY(this.angleToRad(-a - 90 + (90 - ((180 - this.circleAngle) / 2)) + koofAngle));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Добавить в группу
        group.add(mesh);
      }
    });
    // Основные тротуары
    const borderCount: number = (this.circleQuality / 4) - Math.round(radius / this.borderSize);
    const borderSkip: number = this.ceilSizeX - radius - this.borderWeight;
    const koofSkip: number = dimension === 0 ? 0 : -borderSkip;
    const borderSizeArea: number = borderSkip / borderCount;
    const borderSize: number = borderSizeArea - (this.borderSpacing * 2);
    for (let cY: number = 0; cY < 2; cY++) {
      const y: number = (cY === 0 ? this.borderWeight : this.borderWeight + (radius * 2)) - (this.ceilSizeY / 2);
      const rotate: number = cY === 0 ? 0 : 180;
      // Цикл по X
      for (let cX: number = 0; cX < borderCount; cX++) {
        const x: number = startX + koofSkip + (borderSizeArea * cX) + (borderSizeArea / 2);
        const mesh: Mesh = this.getBorder(borderSize);
        // Настройки
        mesh.position.set(x, 0, y);
        mesh.rotateY(this.angleToRad(rotate));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Добавить в группу
        group.add(mesh);
      }
    }
    // Настройки
    geometry.computeVertexNormals();
    mesh.position.set(startX, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Добавить в группу
    group.add(mesh);
    // Вернуть фигуру
    return group;
  }

  // Геометрия края дороги
  private edgeGeometry(dimension: 0 | 1): BufferGeometry {
    const koof: number = dimension === 0 ? 1 : -1;
    const koofUV: number = dimension;
    const koofAngle: number = dimension === 0 ? 0 : 180;
    const pointsMap: number[] = [...Array((this.circleQuality + 2) / 2).keys()].map(k => k + (this.circleQuality / 4));
    const flatSizeX: number = (this.ceilSizeX - this.borderRadius - this.borderWeight) * koof;
    const flatSizeY: number = this.borderRadius * koof;
    const firstCirclePoint: number = 3;
    const lastCirclePoint: number = firstCirclePoint + (this.circleQuality / 2);
    // Координаты точек
    const coords: XYCoord[] = [
      { x: 0, y: 0 },
      { x: flatSizeX, y: -flatSizeY },
      { x: flatSizeX, y: flatSizeY },
      ...pointsMap.map(k => this.getCoordsOnCircle(this.borderRadius, (this.circleAngle * k) + koofAngle))
    ];
    // Создать точки
    const t: Vector3[] = coords.map(c => new Vector3(c.x, this.startY, c.y));
    // Геометрия
    const circlePoints: Vector3[] = [];
    pointsMap.forEach((v, k) => k < this.circleQuality / 2 ? circlePoints.push(...[t[0], t[k + firstCirclePoint], t[k + firstCirclePoint + 1]]) : null);
    const points: Vector3[] = [
      // Правая сторона
      t[0], t[lastCirclePoint], t[1],
      t[0], t[1], t[2],
      t[0], t[2], t[firstCirclePoint],
      // Полукруг
      ...circlePoints
    ];
    // Координаты UV текстуры
    const getUVCoord: (a: number) => [number, number] = (a: number) => {
      const coord: XYCoord = this.getCoordsOnCircle(0.5, a);
      return [coord.x + 0.5, Math.abs(coord.y - 0.5)];
    };
    // Точки текстурирования
    const tt: [number, number][] = [
      [0.5, 0.5],
      [1, Math.abs(1 - koofUV)],
      [1, Math.abs(0 - koofUV)],
      ...pointsMap.map(k => getUVCoord((this.circleAngle * k) + koofAngle))
    ];
    // Геометрия текстур
    const circleUVMap: number[] = [];
    pointsMap.forEach((v, k) => k < this.circleQuality / 2 ? circleUVMap.push(...[
      ...tt[0],
      ...tt[k + firstCirclePoint],
      ...tt[k + firstCirclePoint + 1]]
    ) : null);
    const UVMap: Float32Array = new Float32Array([
      // Правая сторона
      ...tt[0], ...tt[lastCirclePoint], ...tt[1],
      ...tt[0], ...tt[1], ...tt[2],
      ...tt[0], ...tt[2], ...tt[firstCirclePoint],
      // Полукруг
      ...circleUVMap
    ]);
    // Геометрия
    const geometry: BufferGeometry = new BufferGeometry().setFromPoints(points);
    // Настройки
    geometry.setAttribute("uv", new BufferAttribute(UVMap, 2));
    // Вернуть геометрию
    return geometry;
  }





  // Тело дороги
  private createBody(): Group {
    const group: Group = new Group();
    const endCeils: number = this.ceils - 1;
    const zeroPosition: number = (this.ceilSizeX - this.ceilSizeY) / 2;
    // Цикл по длине дороги
    [...Array(this.ceils).keys()].map(i => {
      if (i > 0 && i < endCeils) {
        const geometry: PlaneGeometry = new PlaneGeometry(this.ceilSizeX, this.ceilSizeY - (this.borderWeight * 2));
        const material: MeshPhongMaterial = this.getMaterial(100001, BackSide);
        const mesh: Mesh = new Mesh(geometry, material);
        const positionX: number = zeroPosition + (this.ceilSizeX * i);
        // Настройки
        mesh.position.set(positionX, this.startY, 0);
        mesh.rotateX(this.angleToRad(90));
        mesh.receiveShadow = true;
        // Добавить в группу
        group.add(mesh);
        // Тротуары
        const borderCount: number = Math.round(this.ceilSizeX / this.borderSize);
        const borderSizeArea: number = this.borderSize + (this.borderSpacing * 2);
        const radius: number = (this.ceilSizeY / 2) - this.borderWeight;
        const borderZeroPosition: number = positionX - ((borderSizeArea * borderCount) / 2) + (borderSizeArea / 2);
        for (let cY: number = 0; cY < 2; cY++) {
          const y: number = (cY === 0 ? this.borderWeight : this.borderWeight + (radius * 2)) - (this.ceilSizeY / 2);
          const rotate: number = cY === 0 ? 0 : 180;
          // Цикл по X
          for (let cX: number = 0; cX < borderCount; cX++) {
            const x: number = borderZeroPosition + (borderSizeArea * cX);
            const mesh: Mesh = this.getBorder(this.borderSize);
            // Настройки
            mesh.position.set(x, 0, y);
            mesh.rotateY(this.angleToRad(rotate));
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Добавить в группу
            group.add(mesh);
          }
        }
      }
    });
    // Вернуть группу
    return group;
  }





  // Бордюр
  private getBorder(size: number): Mesh {
    const geometry = new BoxGeometry(size, this.borderHeight, this.borderWeight);
    const material: MeshPhongMaterial = this.getMaterial(100002, FrontSide);
    const mesh: Mesh = new Mesh(geometry, material);
    // Настройки
    geometry.applyMatrix4(new Matrix4().makeTranslation(0, this.borderHeight / 2, -this.borderWeight / 2));
    // Вернуть объект
    return mesh;
  }
}