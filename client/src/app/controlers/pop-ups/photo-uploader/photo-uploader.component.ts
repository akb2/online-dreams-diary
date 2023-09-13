import { WaitObservable } from "@_datas/api";
import { AppMatDialogConfig, CompareElementByElement, JpegTypesDefault, PhotoMaxSize } from "@_datas/app";
import { ImageRightRotate, UploadedImage } from "@_helpers/image";
import { LineFunc, ParseInt } from "@_helpers/math";
import { CustomObjectKey, FileTypes } from "@_models/app";
import { MediaFileExtension } from "@_models/media";
import { MediaService } from "@_services/media.service";
import { ScreenService } from "@_services/screen.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { Observable, Subject, catchError, concatMap, fromEvent, map, merge, mergeMap, of, takeUntil, takeWhile, tap } from "rxjs";





@Component({
  selector: "app-photo-uploader",
  templateUrl: "./photo-uploader.component.html",
  styleUrls: ["photo-uploader.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupPhotoUploaderComponent implements OnInit, AfterViewInit, OnDestroy {

  static popUpWidth: string = "600px";

  @ViewChild("dragInputElm", { read: ElementRef }) dragInputElm: ElementRef;

  fileTypes: FileTypes[] = JpegTypesDefault;

  loadErrors: typeof LoadError = LoadError;
  private fileSize: number = PhotoMaxSize;

  private progressBarAnimationTime: number = 0.07;
  private progressBarMultiAnimationTime: number = 0.21;

  uploadedFiles: SelectedFile[] = [];

  multiUpload: boolean = false;
  dragStart: boolean = false;
  dragEnter: boolean = false;
  isMobile: boolean = false;

  private destroyed$: Subject<void> = new Subject();





  // Время анимации
  getAnimationTime(fileType: SelectedFile): string {
    return ((this.multiUpload ? this.progressBarMultiAnimationTime : this.progressBarAnimationTime) * fileType.progress) + "s";
  }

  // Черно-белый цвет в зависимости от прогресса загрузки
  getWBFilter({ progress, uploaded, loadError }: SelectedFile): string {
    const min: number = 0;
    const max: number = 1;
    // Для ошибки
    if (loadError !== LoadError.success) {
      return "grayscale(" + max + ")";
    }
    // Для уже загруженного файла
    else if (uploaded) {
      return "grayscale(" + min + ")";
    }
    // Расчет для загрузчика
    return "grayscale(" + LineFunc(min, max, progress, 0, 100) + ")";
  }

  // Прозрачность в зависимости от прогресса загрузки
  getOpacity({ progress, uploaded, loadError }: SelectedFile): string {
    const min: number = 1;
    const max: number = 0.7;
    // Для ошибки
    if (loadError !== LoadError.success) {
      return "grayscale(" + max + ")";
    }
    // Для уже загруженного файла
    else if (uploaded) {
      return "grayscale(" + min + ")";
    }
    // Расчет для загрузчика
    return LineFunc(min, max, progress, 0, 100)?.toString();
  }

  // Текст ошибки
  getErrorText({ loadError }: SelectedFile): string {
    return !!loadError ? ErrorTexts[loadError] : ErrorTexts[LoadError.unDefined];
  }

  // Файлы готовы к сохранению
  get filesReady(): boolean {
    const noUploaded: boolean = this.uploadedFiles.some(({ uploaded }) => !uploaded);
    const all: number = ParseInt(this.uploadedFiles?.length);
    const errors: number = ParseInt(this.uploadedFiles.filter(({ loadError }) => loadError !== LoadError.success).length);
    // Файлы не готовы к загрузке
    return !(noUploaded || (errors === all && all > 0) || !all);
  }





  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PopupPhotoUploaderData,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private mediaService: MediaService
  ) {
    this.multiUpload = !!this.data?.multiUpload;
  }

  ngOnInit(): void {
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngAfterViewInit(): void {
    WaitObservable(() => !this.dragInputElm?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        mergeMap(() => merge(
          // Файл перемещается по окну
          fromEvent<DragEvent>(window, "dragover").pipe(tap(event => this.onFileInWindow(event))),
          fromEvent<DragEvent>(window, "dragleave").pipe(tap(event => this.onFileOutWindow(event))),
          // Файл перемещается по полю
          fromEvent<DragEvent>(this.dragInputElm.nativeElement, "dragover").pipe(tap(event => this.onFileInInput(event))),
          fromEvent<DragEvent>(this.dragInputElm.nativeElement, "dragleave").pipe(tap(event => this.onFileOutField(event))),
          // Файл перемещен и мышка отпущена
          fromEvent<DragEvent>(window, "drop").pipe(tap(event => this.onFileDrop(event)))
        ))
      )
      .subscribe(() => this.changeDetectorRef.detectChanges());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Файл помещен внутрь окна
  private onFileInWindow(event: DragEvent): void {
    event.preventDefault();
    // Показать поле
    if (!this.dragStart) {
      this.dragStart = true;
    }
  }

  // Файл перемещен внутрь поля
  private onFileInInput(event: DragEvent): void {
    event.preventDefault();
    // Выделить поле
    if (!this.dragEnter) {
      this.dragEnter = true;
    }
  }

  // Файл покинул окно
  private onFileOutWindow(event: DragEvent): void {
    if (this.dragStart && !event.relatedTarget) {
      this.dragStart = false;
    }
  }

  // Файл покинул поле
  private onFileOutField(event: DragEvent): void {
    if (this.dragEnter) {
      const isField: boolean = event.target === this.dragInputElm.nativeElement;
      const isChild: boolean = CompareElementByElement(event.relatedTarget, this.dragInputElm.nativeElement);
      // Проверить доступность
      if (isField && !isChild) {
        this.dragEnter = false;
      }
    }
  }

  // Файл отпущен
  private onFileDrop(event: DragEvent): void {
    event.preventDefault();
    // Убрать поле
    this.dragEnter = false;
    this.dragStart = false;
    // Файл перемещен внутрь поля
    if (CompareElementByElement(event.target, this.dragInputElm.nativeElement) && !!event?.dataTransfer?.files?.length) {
      this.onStartUpload(event.dataTransfer.files);
    }
  }

  // Выбор файла
  onSelectFiles(event: Event): void {
    this.onStartUpload((<HTMLInputElement>event?.target)?.files);
  }

  // Начать загрузку
  private onStartUpload(mixedFiles: FileList): void {
    if (mixedFiles?.length > 0) {
      const files: File[] = this.multiUpload ? Array.from(mixedFiles) : [mixedFiles[0]];
      // Проверить размер
      merge(...files.map(file => ImageRightRotate(file).pipe(
        takeUntil(this.destroyed$),
        concatMap(file => this.addFile(file)),
        takeWhile(result => !!result)
      )))
        .pipe(takeUntil(this.destroyed$))
        .subscribe(file => this.changeDetectorRef.detectChanges());
    }
  }





  // Добавить файл в массив
  private addFile(file: UploadedImage): Observable<SelectedFile> {
    const extensions: MediaFileExtension[] = [MediaFileExtension.jpeg, MediaFileExtension.jpg];
    const extension: MediaFileExtension = file.file?.name?.split(".")?.pop()?.toLowerCase() as MediaFileExtension;
    // Проверка файла
    if (!this.uploadedFiles.some(({ hash }) => hash === file.hash)) {
      if (!!extension && extensions.includes(extension)) {
        if (file.file.size <= this.fileSize) {
          const uploadedFile: SelectedFile = {
            file: file.file,
            progress: 0,
            uploaded: false,
            loadError: LoadError.success,
            src: file.src,
            hash: file.hash
          };
          // Добавить файл
          this.uploadedFiles.push(uploadedFile);
          // Обновить
          this.changeDetectorRef.detectChanges();
          // Начать загрузку
          return this.mediaService.upload(file.file).pipe(
            takeUntil(this.destroyed$),
            map(progress => {
              uploadedFile.progress = progress;
              // Вернуть объект
              return uploadedFile;
            }),
            catchError(() => {
              uploadedFile.progress = 0;
              uploadedFile.uploaded = true;
              uploadedFile.loadError = LoadError.uploadError;
              // Вернуть объект
              return of(uploadedFile);
            })
          );
        }
      }
    }
    // Файл не добавлен
    return of(null);
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data?: PopupPhotoUploaderData): MatDialogRef<PopupPhotoUploaderComponent> {
    const matDialogConfig: MatDialogConfig = AppMatDialogConfig;
    matDialogConfig.width = PopupPhotoUploaderComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupPhotoUploaderComponent, matDialogConfig);
  }
}





export interface PopupPhotoUploaderData {
  multiUpload?: boolean;
}

interface SelectedFile {
  file: File;
  progress: number;
  uploaded: boolean;
  loadError: LoadError;
  src: string;
  hash: string;
}

enum LoadError {
  unDefined,
  success,
  extension,
  fileSize,
  uploadError
}

const ErrorTexts: CustomObjectKey<LoadError, string> = {
  [LoadError.unDefined]: "Неизвестная ошибка",
  [LoadError.success]: "Загружено",
  [LoadError.extension]: "Ошибка расширения",
  [LoadError.fileSize]: "Превышен размер",
  [LoadError.uploadError]: "Ошибка загрузки",
};
