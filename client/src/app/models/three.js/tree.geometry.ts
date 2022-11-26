import { CreateArray, MultiArray, Random } from "@_models/app";
import { BufferGeometry, CatmullRomCurve3, Euler, Float32BufferAttribute, Matrix4, Vector2, Vector3 } from "three";





export class TreeGeometry extends BufferGeometry {


  private tree: Tree;
  private endsOfBranches: Vector3[];

  override type: string = "TreeGeometry";





  // Список окончаний веток
  get getEndsOfBranches(): Vector3[] {
    if (!!this.endsOfBranches?.length) {
      return this.endsOfBranches;
    }
    // Поиск концов веток
    else {
      const points: Vector3[] = [];
      // Функция поиска данных
      const search = (node: TreeBranch) => {
        if (!!node?.children?.length) {
          node.children.forEach(n => search(n));
        }
        // Добавить точки
        if (!!node?.children?.length || node.children.length === 1) {
          points.unshift(node.to);
        }
      };
      // Поиск данных
      search(this.tree.root);
      // Вернуть вершины
      return points;
    }
  }





  constructor(
    private parameters: TreeGeometryParams
  ) {
    super();
    // Определение параметров
    this.parameters = parameters;
    this.parameters.heightSegments = this.parameters.heightSegments > 1 ? this.parameters.heightSegments : 2;
    this.tree = new Tree(this.parameters);
    // Построение геометрии
    const [vertices, faces, faceVertexUvs]: BuildData = this.buildBranches(this.tree.root);
    const position: number[] = vertices.reduce((o, p) => ([...o, p.x, p.y, p.z]), []);
    const uvs: number[] = faceVertexUvs.reduce((o, u) => ([...o, ...u]), []).reduce((o, u) => ([...o, u.x, u.y]), []);
    // Параметры
    this.setIndex(faces);
    this.setAttribute("position", new Float32BufferAttribute(position, 3));
    this.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    this.setAttribute("uv2", new Float32BufferAttribute(uvs, 2));
    this.computeVertexNormals();
  }





  // Создание общей геометрии
  private buildBranches(branch: TreeBranch, offset: number = 0): BuildData {
    const [vertices, faces, faceVertexUvs]: BuildData = this.buildBranch(branch, offset);
    // Цикл по потомкам
    if (!!branch.children?.length) {
      branch.children.forEach(child => {
        const [childVertices, childFaces, childFaceVertexUvs]: BuildData = this.buildBranches(child, offset + vertices.length);
        // Добавить параметры
        childVertices.forEach(v => vertices.push(v));
        childFaces.forEach(f => faces.push(f));
        childFaceVertexUvs.forEach(u => faceVertexUvs.push(u));
      });
    }
    // Вернуть параметры
    return [vertices, faces, faceVertexUvs];
  }

  // Создание геометрии
  private buildBranch(branch: TreeBranch, offset: number = 0): BuildData {
    const radiusSegments: number = branch.radiusSegments;
    const heightSegments: number = branch.segments.length - 1;
    const faces: number[] = [];
    const faceVertexUvs: Vector2[][] = [];
    const indices: number[][] = [];
    const uvs: Vector2[][] = [];
    const vertices: Vector3[] = [];
    let index: number = 0;
    // Цикл по сегментам высоты
    CreateArray(heightSegments + 1).forEach(y => {
      const indicesRow: number[] = [];
      const segment = branch.segments[y];
      // Добавить параметры
      vertices.push(...segment.vertices);
      uvs.push(segment.uvs);
      // Цикл по сегментам радиуса
      CreateArray(radiusSegments + 1).forEach(() => indicesRow.push(index++));
      // Добавить индексы
      indices.push(indicesRow);
    });
    // Создание сторон
    CreateArray(radiusSegments).forEach(x => CreateArray(heightSegments).forEach(y => {
      const cy: number = y;
      const ny: number = y + 1;
      const cx: number = x;
      const nx: number = x + 1;
      const v1: number = indices[cy][cx] + offset;
      const v2: number = indices[ny][cx] + offset;
      const v3: number = indices[ny][nx] + offset;
      const v4: number = indices[cy][nx] + offset;
      const uv1: Vector2 = uvs[cy][cx];
      const uv2: Vector2 = uvs[ny][cx];
      const uv3: Vector2 = uvs[ny][nx];
      const uv4: Vector2 = uvs[cy][nx];
      // Секция A
      faces.push(v1, v4, v2, v2, v4, v3);
      faceVertexUvs.push([uv1, uv4, uv2], [uv2, uv4, uv3]);
    }));

    // Начальный фрагмент
    if (!branch.from) {
      const bottom: TreeSegment = branch.segments[0]; 4
      // Добавить параметр
      vertices.push(bottom.position);
      // Цикл по сегментам радиуса
      CreateArray(radiusSegments).map(x => {
        const v1: number = indices[0][x] + offset;
        const v2: number = indices[0][x + 1] + offset;
        const v3: number = index + offset;
        const uv1: Vector2 = uvs[0][x];
        const uv2: Vector2 = uvs[0][x + 1];
        const uv3: Vector2 = new Vector2(uv2.x, branch.uvOffset);
        // Записать параметры
        faces.push(v1, v3, v2);
        faceVertexUvs.push([uv1, uv3, uv2]);
      });
    }
    // Остальные фрагменты
    else {
      const from: TreeSegment = branch.from;
      const bottomIndices: number[] = CreateArray(radiusSegments + 1).map(() => (index++) + offset);
      // Добавить индексы
      vertices.push(...from.vertices);
      indices.push(bottomIndices);
      // Цикл по радиальным сегментам
      CreateArray(radiusSegments).forEach(x => {
        const v0: number = indices[0][x] + offset;
        const v1: number = indices[0][x + 1] + offset;
        const v2: number = bottomIndices[x];
        const v3: number = bottomIndices[x + 1];
        const uv0: Vector2 = uvs[0][x];
        const uv1: Vector2 = uvs[0][x + 1];
        const uv2: Vector2 = from.uvs[x];
        const uv3: Vector2 = from.uvs[x + 1];
        // Секции
        faces.push(v0, v3, v1, v0, v2, v3);
        faceVertexUvs.push([uv0, uv3, uv1], [uv0, uv2, uv3]);
      });
    }
    // Вернуть параметры
    return [vertices, faces, faceVertexUvs];
  }
}





// Интерфейс параметров
class Tree {
  private defaultLength: number = 3;
  private defaultUvLength: number = 10;
  private defaultGenerations: number = 5;
  private defaultRadius: number = 0.1;
  private defaultRadiusSegments: number = 8;
  private defaultHeightSegments: number = 8;

  from: Vector3 | TreeSegment;
  rotation: Matrix4 = new Matrix4();
  length: number;
  uvLength: number;
  generation: number = 0;
  generations: number;
  radius: number;
  radiusSegments: number;
  heightSegments: number;

  root: TreeBranch;
  private spawner: TreeSpawner;

  // Получение параметров из класса
  get getTreeGeometryParams(): TreeGeometryParams {
    return {
      generations: this.generations,
      length: this.length,
      uvLength: this.uvLength,
      radius: this.radius,
      radiusSegments: this.radiusSegments,
      heightSegments: this.heightSegments,
      from: this.from,
      rotation: this.rotation
    };
  }

  constructor(parameters: TreeGeometryParams) {
    this.from = parameters.from ?? new Vector3();
    // Поворот из параметров
    if (!!parameters?.rotation) {
      parameters.rotation instanceof Euler ?
        this.rotation.makeRotationFromEuler(parameters.rotation) : parameters.rotation instanceof Matrix4 ?
          this.rotation = parameters.rotation :
          null;
    }
    // Определение параметров
    this.length = parameters.length ?? this.defaultLength;
    this.uvLength = parameters.uvLength ?? this.defaultUvLength;
    this.generations = parameters.generations ?? this.defaultGenerations;
    this.radius = parameters.radius ?? this.defaultRadius;
    this.radiusSegments = parameters.radiusSegments ?? this.defaultRadiusSegments;
    this.heightSegments = parameters.heightSegments ?? this.defaultHeightSegments;
    // Начальная ветка
    this.root = new TreeBranch({ ...this.getTreeGeometryParams, generation: 0, });
    this.spawner = parameters.spawner || new TreeSpawner();
    this.root.branch(this.spawner, this.generations);
    this.grow(this.spawner);
  }

  // Смазывание
  private grow(spawner: TreeSpawner) {
    spawner = spawner ?? this.spawner;
    // Запомнить параметры
    this.generation++;
  }

  branchlets(): MultiArray<TreeBranch> {
    return this.root.branchlets();
  }
}

// Спаунер
class TreeSpawner {
  constructor(
    private theta: number = Math.PI * 0.5,
    private attenuation: number = 0.75,
    private rootRange: Vector2 = new Vector2(0.75, 1.0)
  ) { }

  // Генерация дерева
  spawn(branch: TreeBranch, extension: boolean = false): TreeBranch {
    const htheta: number = this.theta * 0.5;
    const x: number = Random(0, 1, false, 5) * this.theta - htheta;
    const z: number = Random(0, 1, false, 5) * this.theta - htheta;
    const len: number = branch.length * this.attenuation;
    const rot: Matrix4 = new Matrix4();
    const euler: Euler = new Euler(x, 0, z);
    const segmentIndex: number = extension ?
      branch.segments.length - 1 :
      Math.floor((Math.random() * (this.rootRange.y - this.rootRange.x) + this.rootRange.x) * branch.segments.length);
    const segment = branch.segments[segmentIndex];
    // Преобразования
    rot.makeRotationFromEuler(euler);
    rot.multiply(branch.rotation);
    // Ветка
    return new TreeBranch({
      from: segment,
      rotation: rot,
      length: len,
      uvOffset: segment.uvOffset,
      uvLength: branch.uvLength,
      generation: branch.generation + 1,
      generations: branch.generations,
      radius: branch.radius,
      radiusSegments: branch.radiusSegments,
      heightSegments: branch.heightSegments
    });
  }
}

// Ветка
class TreeBranch {
  rotation: Matrix4;
  length: number = 0;
  generation: number = 0;
  generations: number;
  uvLength: number = 10.0;
  uvOffset: number = 0.0;
  radius: number = 0.1;
  radiusSegments: number;
  heightSegments: number;
  from: TreeSegment;
  to: Vector3;
  position: Vector3;
  segments: TreeSegment[];
  children: TreeBranch[];

  constructor(parameters: TreeGeometryParams) {
    const from: TreeSegment | Vector3 = parameters.from;
    // Параметры класса
    this.rotation = parameters.rotation;
    this.length = parameters.length;
    this.generation = parameters.generation ?? this.generation;
    this.generations = parameters.generations;
    this.uvLength = parameters.uvLength ?? this.uvLength;
    this.uvOffset = parameters.uvOffset ?? this.uvOffset;
    this.radius = parameters.radius ?? this.radius;
    this.radiusSegments = parameters.radiusSegments;
    this.heightSegments = parameters.heightSegments;
    // Параметры
    const direction: Vector3 = (new Vector3(0, 1, 0)).applyMatrix4(this.rotation);
    // Начало и позиция
    if (from instanceof TreeSegment) {
      this.from = from;
      this.position = from.position.clone().add(new Vector3(0, 1, 0).applyMatrix4(from.rotation).setLength(0.05));
    }
    // Начальная позиция
    else if (from instanceof Vector3) {
      this.from = null;
      this.position = from;
    }
    // Прочие параметры
    this.to = this.position.clone().add(direction.setLength(this.length));
    this.segments = this.buildTreeSegments(this.radius, this.radiusSegments, direction, this.heightSegments);
    this.children = [];
  }

  // Создание сегментов
  private buildTreeSegments(radius: number, radiusSegments: number, direction: Vector3, heightSegments: number): TreeSegment[] {
    const theta: number = Math.PI * 0.25;
    const htheta: number = theta * 0.5;
    const x: number = Math.random() * theta - htheta;
    const z: number = Math.random() * theta - htheta;
    const rot: Matrix4 = new Matrix4();
    const euler: Euler = new Euler(x, 0, z);
    // Применить параметры
    rot.makeRotationFromEuler(euler);
    direction.applyMatrix4(rot);
    // Прочие параметры
    const controlPoint: Vector3 = this.position.clone().add(direction.setLength(this.length * 0.5));
    const curve: CatmullRomCurve3 = new CatmullRomCurve3([this.position, controlPoint, this.to]);
    const fromRatio: number = this.generation == 0 ? 1 : 1 - (this.generation / (this.generations + 1));
    const toRatio: number = 1.0 - ((this.generation + 1) / (this.generations + 1));
    const fromRadius: number = radius * fromRatio;
    const toRadius: number = radius * toRatio;
    const rotation: Matrix4 = this.rotation;
    const segments: TreeSegment[] = [];
    const uvLength: number = this.uvLength;
    const points: Vector3[] = curve.getPoints(heightSegments);
    let uvOffset: number = this.uvOffset;
    // Для всех кроме начальной ветки
    if (!!this.from) {
      uvOffset += this.from.position.distanceTo(points[0]) / uvLength;
    }
    // Добавить сегмент
    segments.push(new TreeSegment(points[0], rotation, uvOffset, fromRadius, radiusSegments));
    // Цикл по сегментам
    CreateArray(heightSegments - 1).map(i => i + 1).forEach(i => {
      const p0: Vector3 = points[i];
      const p1: Vector3 = points[i + 1];
      const ry: number = i / (heightSegments - 1);
      const radius: number = fromRadius + ((toRadius - fromRadius) * ry);
      const d: number = p1.distanceTo(p0);
      // Прибавить к смещению
      uvOffset += d / uvLength;
      // Запомнить сегмент
      segments.push(new TreeSegment(p0, rotation, uvOffset, radius, radiusSegments));
    });
    // Вернуть сегменты
    return segments;
  }

  // Ветка
  branch(spawner: TreeSpawner, count: number): void {
    CreateArray(count).forEach(i => this.spawn(spawner, i == 0));
    this.children.forEach(child => child.branch(spawner, count - 1));
  }

  // Растягивание
  grow(spawner: TreeSpawner): void {
    !!this.children?.length ?
      this.children.forEach(child => child.grow(spawner)) :
      this.branch(spawner, 1);
  }

  // Спаун
  private spawn(spawner: TreeSpawner, extension: boolean): void {
    const child: TreeBranch = spawner.spawn(this, extension);
    // Добавить потомка
    this.children.push(child);
  }

  // Структура веток
  branchlets(): MultiArray<TreeBranch> {
    return !!this.children.length ?
      this.children.map(child => child.branchlets()) :
      [this as TreeBranch];
  }

  // Вычислить высоту
  private calculateLength(): number {
    const segments: TreeSegment[] = this.segments;
    let length: number = 0;
    // Цикл по сегментам
    CreateArray(segments.length).forEach(i => {
      const p0: Vector3 = segments[i].position;
      const p1: Vector3 = segments[i + 1].position;
      //  Добавить длину
      length += p0.distanceTo(p1);
    });
    // Вернуть длину
    return length;
  }
}

// Сегмент ветки
class TreeSegment {
  vertices: Vector3[] = [];
  uvs: Vector2[] = [];


  constructor(
    public position: Vector3,
    public rotation: Matrix4,
    public uvOffset: number,
    private radius: number,
    private radiusSegments: number
  ) {
    const thetaLength: number = Math.PI * 2;
    // Цикл по сегментам
    CreateArray(this.radiusSegments + 1).forEach(x => {
      const u: number = x / this.radiusSegments;
      const uv: Vector2 = new Vector2(u, this.uvOffset);
      const vertex: Vector3 = new Vector3(this.radius * Math.sin(u * thetaLength), 0, this.radius * Math.cos(u * thetaLength))
        .applyMatrix4(this.rotation)
        .add(this.position);
      // Добавить в массив вершин и сеток
      this.vertices.push(vertex);
      this.uvs.push(uv);
    });
  }
}





// Интерфейс параметров
export interface TreeGeometryParams {
  generations: number;
  length: number;
  uvLength: number;
  radius: number;
  radiusSegments: number;
  heightSegments: number;
  from?: TreeSegment | Vector3;
  rotation?: Matrix4;
  uvOffset?: number;
  generation?: number;
  spawner?: TreeSpawner;
}

// Тип данных для построения геометрии
type BuildData = [Vector3[], number[], Vector2[][]];
