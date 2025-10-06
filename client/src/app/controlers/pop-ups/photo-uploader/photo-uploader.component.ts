import { AppMatDialogConfig, CompareElementByElement, JpegTypesDefault, PhotoMaxSize } from "@_datas/app";
import { ImageRightRotate, UploadedImage } from "@_helpers/image";
import { LineFunc } from "@_helpers/math";
import { WaitObservable } from "@_helpers/rxjs";
import { FileTypes } from "@_models/app";
import { MediaFile, MediaFileExtension } from "@_models/media";
import { MediaService } from "@_services/media.service";
import { ScreenService } from "@_services/screen.service";
import { clamp } from "@akb2/math";
import { anyToInt, CustomObjectKey } from "@akb2/types-tools";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { catchError, fromEvent, map, merge, mergeMap, Observable, of, Subject, switchMap, takeUntil, takeWhile, tap } from "rxjs";



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
      return max?.toString();
    }
    // Для уже загруженного файла
    else if (uploaded) {
      return min?.toString();
    }
    // Расчет для загрузчика
    return LineFunc(min, max, progress, 0, 100)?.toString();
  }

  // Текст ошибки
  getErrorText({ loadError }: SelectedFile): string {
    return !!loadError
      ? ErrorTexts[loadError]
      : ErrorTexts[LoadError.unDefined];
  }

  // Файлы готовы к сохранению
  get filesReady(): boolean {
    const noUploaded: boolean = this.uploadedFiles.some(({ uploaded }) => !uploaded);
    const all: number = anyToInt(this.uploadedFiles?.length);
    const errors: number = this.errorUploadedFiles.length;
    // Файлы не готовы к загрузке
    return !(noUploaded || (errors === all && all > 0) || !all);
  }

  // Незагруженные файлы
  get errorUploadedFiles(): SelectedFile[] {
    return this.uploadedFiles.filter(({ uploaded, loadError }) => uploaded && loadError !== LoadError.success) ?? [];
  }



  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PopupPhotoUploaderData,
    private matDialogRef: MatDialogRef<PopupPhotoUploaderComponent, PopupPhotoUploaderResult>,
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
        mergeMap(() => merge(
          // Файл перемещается по окну
          fromEvent<DragEvent>(window, "dragover").pipe(tap(event => this.onFileInWindow(event))),
          fromEvent<DragEvent>(window, "dragleave").pipe(tap(event => this.onFileOutWindow(event))),
          // Файл перемещается по полю
          fromEvent<DragEvent>(this.dragInputElm.nativeElement, "dragover").pipe(tap(event => this.onFileInInput(event))),
          fromEvent<DragEvent>(this.dragInputElm.nativeElement, "dragleave").pipe(tap(event => this.onFileOutField(event))),
          // Файл перемещен и мышка отпущена
          fromEvent<DragEvent>(window, "drop").pipe(tap(event => this.onFileDrop(event)))
        )),
        takeUntil(this.destroyed$)
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

  // Повторить загрузку файла
  onFileRetryUpload(selectedFile: SelectedFile) {
    if (selectedFile.loadError !== LoadError.success) {
      selectedFile.progress = 0;
      selectedFile.uploaded = false;
      selectedFile.loadError = LoadError.success;
      selectedFile.mediaData = null;
      // Загрузка
      this.upload(selectedFile)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => this.changeDetectorRef.detectChanges());
    }
  }

  // Повторить загрузку файлов
  onFilesRetryUpload() {
    const files = this.errorUploadedFiles;
    // Повторить загрузку
    if (files.length > 0) {
      merge(...files.map(selectedFile => {
        selectedFile.progress = 0;
        selectedFile.uploaded = false;
        selectedFile.loadError = LoadError.success;
        selectedFile.mediaData = null;
        // Загрузка
        return this.upload(selectedFile);
      }))
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => this.changeDetectorRef.detectChanges());
    }
  }

  // Начать загрузку
  private onStartUpload(mixedFiles: FileList): void {
    if (mixedFiles?.length > 0) {
      const files: File[] = this.multiUpload
        ? Array.from(mixedFiles)
        : [mixedFiles[0]];
      // Проверить размер
      merge(...files.map(file => ImageRightRotate(file).pipe(
        switchMap(file => this.addFile(file)),
        takeWhile(result => !!result)
      )))
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => this.changeDetectorRef.detectChanges());
    }
  }

  // Сохранить и закрыть окно
  onSave(): void {
    if (this.filesReady) {
      const mediaFiles: MediaFile[] = this.uploadedFiles
        .filter(({ mediaData, uploaded, loadError }) => !!mediaData && uploaded && loadError === LoadError.success)
        .map(({ mediaData }) => mediaData);
      // Файлы загружены
      if (!!mediaFiles?.length) {
        this.matDialogRef.close({ mediaFiles });
      }
    }
  }



  // Загрузка файла
  private upload(selectedFile: SelectedFile): Observable<SelectedFile> {
    return this.mediaService.upload(selectedFile.file).pipe(
      map(result => {
        if (typeof result === "number") {
          const progress: number = clamp(result, 100, 0);
          // Установить свойства файла
          selectedFile.progress = progress;
        }
        // Файл загружен
        else {
          selectedFile.progress = 100;
          selectedFile.uploaded = true;
          selectedFile.mediaData = result;
        }
        // Вернуть объект
        return selectedFile;
      }),
      catchError(() => {
        selectedFile.progress = 0;
        selectedFile.uploaded = true;
        selectedFile.loadError = LoadError.uploadError;
        // Вернуть объект
        return of(selectedFile);
      }),
      takeUntil(this.destroyed$)
    );
  }

  // Добавить файл в массив
  addFile(uploadedImage: UploadedImage): Observable<SelectedFile> {
    const extensions: MediaFileExtension[] = [MediaFileExtension.jpeg, MediaFileExtension.jpg];
    const extension: MediaFileExtension = uploadedImage.file?.name?.split(".")?.pop()?.toLowerCase() as MediaFileExtension;
    // Проверка файла
    if (!this.uploadedFiles.some(({ hash }) => hash === uploadedImage.hash)) {
      if (!!extension && extensions.includes(extension)) {
        if (uploadedImage.file.size <= this.fileSize) {
          const selectedFile: SelectedFile = {
            file: uploadedImage.file,
            progress: 0,
            uploaded: false,
            loadError: LoadError.success,
            src: uploadedImage.src,
            hash: uploadedImage.hash,
            mediaData: null
          };
          // Добавить файл
          this.uploadedFiles.push(selectedFile);
          // Обновить
          this.changeDetectorRef.detectChanges();
          // Начать загрузку
          return this.upload(selectedFile);
        }
      }
    }
    // Файл не добавлен
    return of(null);
  }



  // Открыть текущее окно
  static open(matDialog: MatDialog, data?: PopupPhotoUploaderData): MatDialogRef<PopupPhotoUploaderComponent, PopupPhotoUploaderResult> {
    const matDialogConfig: MatDialogConfig = { ...AppMatDialogConfig };
    matDialogConfig.width = PopupPhotoUploaderComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupPhotoUploaderComponent, matDialogConfig);
  }
}



export interface PopupPhotoUploaderData {
  multiUpload?: boolean;
}

export interface PopupPhotoUploaderResult {
  mediaFiles: MediaFile[];
}

interface SelectedFile {
  file: File;
  progress: number;
  uploaded: boolean;
  loadError: LoadError;
  src: string;
  hash: string;
  mediaData: MediaFile;
}

enum LoadError {
  unDefined,
  success,
  extension,
  fileSize,
  uploadError
}

const ErrorTexts: CustomObjectKey<LoadError, string> = {
  [LoadError.unDefined]: "Неизвестная ошибка. Нажмите, чтобы повторить.",
  [LoadError.success]: "Загружено",
  [LoadError.extension]: "Ошибка расширения. Нажмите, чтобы повторить.",
  [LoadError.fileSize]: "Превышен размер. Нажмите, чтобы повторить.",
  [LoadError.uploadError]: "Ошибка загрузки. Нажмите, чтобы повторить.",
};
