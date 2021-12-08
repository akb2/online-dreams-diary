import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MapTerrains } from "@app/controlers/dream-map/terrain/terrain.component";
import { DreamMap, DreamMapCeil } from "@_models/dream";
import { timer } from "rxjs";
import { takeWhile } from "rxjs/operators";
import {
  BoxGeometry,
  DodecahedronGeometry, Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  TorusGeometry,
  WebGLRenderer
} from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';





@Component({
  selector: "app-dream-map-viewer",
  templateUrl: "./viewer.component.html",
  styleUrls: ["./viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapViewerComponent implements OnInit, OnDestroy, AfterViewInit {


  @Input() dreamMap: DreamMap;

  @Input() private cameraZ: number = 400;
  @Input() private fieldOfView: number = 1;
  @Input('nearClipping') private nearClippingPlane: number = 1;
  @Input('farClipping') private farClippingPlane: number = 1000;

  @ViewChild("canvas") private canvas: ElementRef;

  private ceils: DreamMapCeil[] = [];
  private width: number = 0;
  private height: number = 0;
  private sceneColor: number = 0x000000;

  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private control: OrbitControls;

  private rotateSpeed: number = 5;
  private moveSpeed: number = 0.7;
  private zoomSpeed: number = 0.4;
  private zoomMin: number = 15;
  private zoomMax: number = 150;
  private minAngle: number = 0;
  private maxAngle: number = 60;

  private getAngle: (angle: number) => number = (angle: number) => angle * Math.PI / 180;





  ngOnInit() {
    this.ceilsInit();
  }

  ngAfterViewInit() {
    // Создание сцены
    timer(0, 100).pipe(takeWhile(() => !this.canvas, true)).subscribe(() => {
      if (this.canvas) {
        this.createCanvas();
        this.createScene();
        this.createObject();
        this.createLight();
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
  }

  // Объект
  // TODO: Тест
  private createObject(): void {
    if (this.scene) {
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
      // Настройки
      cube.position.x = -15;
      dodecahedron.position.x = 15;
      // Добавить
      this.scene.add(cube, torus, dodecahedron);
    }
  }

  // Освещение
  // TODO: Тест
  private createLight(): void {
    if (this.scene) {
      const lights: PointLight[] = [
        new PointLight(0xFFFFFF),
        new PointLight(0xFFFFFF),
        new PointLight(0xFFFFFF),
        new PointLight(0xFFFFFF)
      ];
      const shift: number = 30;
      // Настройки
      lights[0].position.set(shift, 20, shift);
      lights[1].position.set(-shift, 20, shift);
      lights[2].position.set(-shift, 20, -shift);
      lights[3].position.set(shift, 20, -shift);
      // Добавить
      this.scene.add(...lights);
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
  }
}





// Пустая ячейка
const DefaultCeil: DreamMapCeil = {
  place: null,
  terrain: MapTerrains.find(t => t.id === 1),
  object: null,
  coord: { x: 0, y: 0, z: 8 }
};