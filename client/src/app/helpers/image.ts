import { Observable, Subscriber, concatMap, from, map } from "rxjs";





// Интерфейс загруженной картинки
interface UploadedImage {
  file: File;
  blob: Blob;
  htmlImage: HTMLImageElement;
  orientation: number;
  imageBuffer: ArrayBuffer;
  src: string;
  hash: string;
}





// Преобразовать в буффер
export const MixedBufferToArrayBuffer = (mixedBuffer: string | ArrayBuffer): ArrayBuffer => {
  let buffer: ArrayBuffer;
  // Поулчена строка
  if (typeof mixedBuffer === "string") {
    const encoder = new TextEncoder();
    // Преобразовать строку в буффер
    buffer = encoder.encode(mixedBuffer).buffer;
  }
  // Вернуть буффер
  return buffer;
}

// Хэш файла
const ImageHash = (buffer: ArrayBuffer): Observable<string> => from(crypto.subtle.digest("SHA-256", buffer)).pipe(
  map(hashBuffer => Array.from(new Uint8Array(hashBuffer))),
  map(hashArray => hashArray.map(b => b.toString(16).padStart(2, "0")).join(""))
);

// Преобразование данных в поворот
const ExtractImageOrientation = (buffer: ArrayBuffer): number => {
  const view: DataView = new DataView(buffer);
  // Формат JPEG
  if (view.getUint16(0, false) === 0xFFD8) {
    const length: number = view.byteLength;
    let offset: number = 2;
    // Чтение байтов
    while (offset < length) {
      const marker: number = view.getUint16(offset, false);
      // Увеличить сдвиг
      offset += 2;
      // Считывание
      if (marker === 0xFFE1) {
        if (view.getUint32(offset += 2, false) === 0x45786966) {
          const little: boolean = view.getUint16(offset += 6, false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          //
          const tags = view.getUint16(offset, little);
          offset += 2;
          //
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
              return view.getUint16(offset + (i * 12) + 8, little);
            }
          }
        }
      }
      //
      else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      }
      //
      else {
        offset += view.getUint16(offset, false);
      }
    }
    //
    return -1;
  }
  //
  return -2;
}

// Определить ориентацию картинки
export const GetImageData = (file: File): Observable<UploadedImage> => {
  const fileReader: FileReader = new FileReader();
  // Подписчик
  const observable: Observable<UploadedImage> = new Observable(observer => {
    fileReader.readAsDataURL(file);
    // Загрузка
    fileReader.onload = event => {
      const imageBuffer: ArrayBuffer = MixedBufferToArrayBuffer(event?.target?.result);
      const orientation: number = ExtractImageOrientation(imageBuffer);
      const src: string = URL.createObjectURL(file);
      const blob: Blob = new Blob([imageBuffer], { type: "image/jpeg" });
      // Получение хэша
      ImageHash(imageBuffer).subscribe(hash => {
        const htmlImage: HTMLImageElement = document.createElement("img");
        // Путь к картинке
        htmlImage.src = src;
        // Загрузка картинки
        htmlImage.onload = () => {
          const uploadedImage: UploadedImage = { file, orientation, imageBuffer, src, hash, blob, htmlImage };
          // Передать значение
          observer.next(uploadedImage);
          observer.complete();
        };
        // Ошибка загрузки
        htmlImage.onerror = error => {
          observer.error(error);
          observer.complete();
        };
      });
    };
    // Ошибка
    fileReader.onerror = error => {
      observer.error(error);
      observer.complete();
    };
  });
  // Вернуть подписчик
  return observable;
}

// Повернуть
export const ImageRightRotate = (file: File): Observable<UploadedImage> => GetImageData(file).pipe(
  concatMap(uploadedImage => new Observable((observer: Subscriber<UploadedImage>) => {
    let rotatedBlob: Blob = new Blob([file], { type: file.type });
    // Картинка повернута устройством
    if (uploadedImage.orientation > 1) {
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
      canvas.width = uploadedImage.orientation >= 5 ? uploadedImage.htmlImage.height : uploadedImage.htmlImage.width;
      canvas.height = uploadedImage.orientation >= 5 ? uploadedImage.htmlImage.width : uploadedImage.htmlImage.height;
      // Поиск по ориентациям
      switch (uploadedImage.orientation) {
        case 2: ctx.transform(-1, 0, 0, 1, canvas.width, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, canvas.height); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, canvas.height, 0); break;
        case 7: ctx.transform(0, -1, -1, 0, canvas.height, canvas.width); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, canvas.width); break;
        default: break;
      }
      // Преобразование
      ctx.drawImage(uploadedImage.htmlImage, 0, 0, uploadedImage.htmlImage.width, uploadedImage.htmlImage.height);
      canvas.toBlob((blob) => {
        rotatedBlob = blob!;
        uploadedImage.file = new File([rotatedBlob], file.name, { type: file.type })
        observer.next(uploadedImage);
        observer.complete();
      }, file.type, 1);
    }
    // Правильная ориентация
    else {
      observer.next(uploadedImage);
      observer.complete();
    }
  }))
);
