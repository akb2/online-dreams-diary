// Интерфейс картинки фона
export interface BackgroundImageData {
  id: number;
  title: string;
  imageName: string;
  positionX: "left" | "center" | "right";
  positionY: "top" | "center" | "bottom";
  imageOverlay: boolean;
}

// Массив картинок фона
export const BackgroundImageDatas: BackgroundImageData[] = [{
  id: 2,
  title: "Лестница в небо",
  imageName: "2.jpg",
  positionX: "center",
  positionY: "center",
  imageOverlay: true
}, {
  id: 3,
  title: "Космическая станция на орбите",
  imageName: "3.jpg",
  positionX: "center",
  positionY: "center",
  imageOverlay: true
}, {
  id: 4,
  title: "Странник на краю скалы у моря",
  imageName: "4.jpg",
  positionX: "center",
  positionY: "center",
  imageOverlay: true
}, {
  id: 5,
  title: "Волк в тумане хвойного леса",
  imageName: "5.jpg",
  positionX: "center",
  positionY: "bottom",
  imageOverlay: true
}, {
  id: 6,
  title: "Карманные часы на песке",
  imageName: "6.jpg",
  positionX: "center",
  positionY: "center",
  imageOverlay: true
}, {
  id: 7,
  title: "Зимняя ночь большого города",
  imageName: "7.jpg",
  positionX: "center",
  positionY: "top",
  imageOverlay: true
}];