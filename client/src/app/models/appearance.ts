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
export const BackgroundImageDatas: BackgroundImageData[] = [
  {
    id: 1,
    title: "Лестница в небо"
  }, {
    id: 2,
    title: "По ту сторону иллюминатора",
    positionY: "top",
    imageOverlay: false
  }, {
    id: 3,
    title: "Побег от НЛО",
    imageOverlay: false
  }, {
    id: 4,
    title: "В пламени красного дракона",
    imageOverlay: false
  }, {
    id: 5,
    title: "Солнечный день над зелеными холмами"
  }, {
    id: 6,
    title: "Визуализация потоков времени"
  }, {
    id: 7,
    title: "Разбитое зазеркалье"
  }, {
    id: 8,
    title: "Вечный фрактальный механизм"
  }, {
    id: 9,
    title: "Полет над солнечным городом"
  }, {
    id: 10,
    title: "Все еще впереди",
    imageOverlay: false,
    positionY: "bottom"
  }, {
    id: 11,
    title: "Кладезь познаний",
    imageOverlay: false,
    positionY: "bottom"
  }
].map(d => ({
  ...BackgroundImageDataDefault,
  ...d,
  imageName: "full/" + d.id + ".jpg",
  imageNameShort: "short/" + d.id + ".jpg"
} as BackgroundImageData));