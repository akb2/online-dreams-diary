// Интерфейс картинки фона
export interface BackgroundImageData {
  id: number;
  title: string;
  imageName: string;
  imageNameShort: string;
  positionX: "left" | "center" | "right";
  positionY: "top" | "center" | "bottom";
  imageOverlay: boolean;
}

// Поля по умолчанию
const BackgroundImageDataDefault: BackgroundImageData = {
  id: 0,
  title: "Картинка по умолчанию",
  imageName: "",
  imageNameShort: "",
  positionX: "center",
  positionY: "center",
  imageOverlay: true
};

// Массив картинок фона
export const BackgroundImageDatas: BackgroundImageData[] = [{
  ...BackgroundImageDataDefault,
  id: 1,
  title: "Лестница в небо",
  imageName: "full/1.jpg",
  imageNameShort: "short/1.jpg"
}, {
  ...BackgroundImageDataDefault,
  id: 2,
  title: "По ту сторону иллюминатора",
  imageName: "full/2.jpg",
  imageNameShort: "short/2.jpg",
  positionY: "top",
  imageOverlay: false
}, {
  ...BackgroundImageDataDefault,
  id: 3,
  title: "Побег от НЛО",
  imageName: "full/3.jpg",
  imageNameShort: "short/3.jpg",
  imageOverlay: false
}, {
  ...BackgroundImageDataDefault,
  id: 4,
  title: "В пламени красного дракона",
  imageName: "full/4.jpg",
  imageNameShort: "short/4.jpg",
  imageOverlay: false
}];