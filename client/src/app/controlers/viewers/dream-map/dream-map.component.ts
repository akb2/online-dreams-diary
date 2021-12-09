import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DreamMap, DreamMapCeil } from "@_models/dream";
import { SkyBoxResult, SkyBoxService } from "@_services/skybox.service";
import { timer } from "rxjs";
import { takeWhile } from "rxjs/operators";
import {
  BoxGeometry,
  DodecahedronGeometry, Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PerspectiveCamera, Scene,
  TorusGeometry,
  WebGLRenderer
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";





@Component({
  selector: "app-dream-map-viewer",
  templateUrl: "./dream-map.component.html",
  styleUrls: ["./dream-map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapViewerComponent implements OnInit, OnDestroy, AfterViewInit {


  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = false;

  @ViewChild("canvas") private canvas: ElementRef;
  @ViewChild("statsBlock") private statsBlock: ElementRef;

  private ceils: DreamMapCeil[] = [];
  private width: number = 0;
  private height: number = 0;
  private sceneColor: number = 0x000000;

  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private control: OrbitControls;
  stats: Stats;

  private rotateSpeed: number = 5;
  private moveSpeed: number = 0.7;
  private zoomSpeed: number = 0.4;
  private zoomMin: number = 15;
  private zoomMax: number = 150;
  private minAngle: number = 0;
  private maxAngle: number = 80;

  private getAngle: (angle: number) => number = (angle: number) => angle * Math.PI / 180;





  constructor(private skyBoxService: SkyBoxService) { }

  ngOnInit() {
    this.ceilsInit();
  }

  ngAfterViewInit() {
    // Создание сцены
    timer(0, 100).pipe(takeWhile(() => !this.canvas && !(!this.debugInfo || this.statsBlock), true)).subscribe(() => {
      if (this.canvas && (!this.debugInfo || this.statsBlock)) {
        this.createCanvas();
        this.createScene();
        this.createObject();
        // Рендер
        this.animate();
        // События
        this.control.addEventListener("change", (event) => this.onCameraChange(event.target));
        this.control.update();
      }
    });
  }

  ngOnDestroy() {
    this.control.removeEventListener("change", (event) => this.onCameraChange(event.target));
  }





  // Изменение позиции камеры
  onCameraChange(event: OrbitControls): void {
  }





  // Инициализация объектов карты
  private ceilsInit(): void {
    this.ceils = [];
    // Цикл по координатам
    for (let y = 0; y < this.dreamMap.size.height; y++) {
      for (let x = 0; x < this.dreamMap.size.width; x++) {
        this.ceils.push(this.dreamMap.ceils.some(c => c.coord.y === y && c.coord.x === x) ?
          this.dreamMap.ceils.find(c => c.coord.y === y && c.coord.x === x) :
          DefaultCeil
        );
      }
    }
  }

  // Инициализация блока рендера
  private createCanvas(): void {
    this.width = this.canvas.nativeElement.getBoundingClientRect().width || 0;
    this.height = this.canvas.nativeElement.getBoundingClientRect().height || 0;
  }

  // Создание сцены
  private createScene(): void {
    this.renderer = new WebGLRenderer({ canvas: this.canvas.nativeElement, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.sceneColor, 1);
    // Сцена
    this.scene = new Scene();
    // Камера
    this.camera = new PerspectiveCamera(70, this.width / this.height);
    this.camera.position.z = 50;
    this.scene.add(this.camera);
    // Управление
    this.control = new OrbitControls(this.camera, this.canvas.nativeElement);
    this.control.screenSpacePanning = false;
    this.control.rotateSpeed = this.rotateSpeed;
    this.control.panSpeed = this.moveSpeed;
    this.control.zoomSpeed = this.zoomSpeed;
    this.control.minDistance = this.zoomMin;
    this.control.maxDistance = this.zoomMax;
    this.control.minPolarAngle = this.getAngle(this.minAngle);
    this.control.maxPolarAngle = this.getAngle(this.maxAngle);
    // Статистика
    this.stats = Stats();
    this.statsBlock.nativeElement.appendChild(this.stats.dom);
  }

  // Объект
  private createObject(): void {
    if (this.scene) {
      // TODO: Удалить
      // Куб
      const boxGeometry: BoxGeometry = new BoxGeometry(10, 10, 10);
      const basicMaterial: MeshPhongMaterial = new MeshPhongMaterial({ color: 0x0095DD });
      const cube: Mesh = new Mesh(boxGeometry, basicMaterial);
      // Тор
      const torusGeometry: TorusGeometry = new TorusGeometry(5, 1.2, 6, 12);
      const phongMaterial: MeshPhongMaterial = new MeshPhongMaterial({ color: 0xFF9500 });
      const torus: Mesh = new Mesh(torusGeometry, phongMaterial);
      // Додекаидр
      const dodecahedronGeometry: DodecahedronGeometry = new DodecahedronGeometry(5, 0);
      const lambertMaterial: MeshLambertMaterial = new MeshLambertMaterial({ color: 0xEAEFF2 });
      const dodecahedron: Mesh = new Mesh(dodecahedronGeometry, lambertMaterial);
      // Скайбокс
      const skyBox: SkyBoxResult = this.skyBoxService.getObject(this.dreamMap.skyBox);
      // Настройки
      cube.position.x = -15;
      dodecahedron.position.x = 15;
      this.scene.background = skyBox.skyBox;
      // Добавить
      this.scene.add(cube, torus, dodecahedron, ...skyBox.light);
      // Рендер
      this.render();
    }
  }

  // Рендер сцены
  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  // Обновление сцены
  private animate(): void {
    window.requestAnimationFrame(this.animate.bind(this));
    this.control.update();
    this.render();
    this.stats.update();
  }
}





// Пустая ячейка
const DefaultCeil: DreamMapCeil = {
  place: null,
  terrain: null,
  object: null,
  coord: { x: 0, y: 0, z: 8 }
};