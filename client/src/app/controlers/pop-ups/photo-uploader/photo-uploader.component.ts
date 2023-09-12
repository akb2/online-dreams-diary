import { WaitObservable } from "@_datas/api";
import { AppMatDialogConfig, CompareElementByElement, FileTypesDefault, PhotoMaxSize } from "@_datas/app";
import { ImageRightRotate } from "@_helpers/image";
import { FileTypes } from "@_models/app";
import { ScreenService } from "@_services/screen.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { Subject, fromEvent, merge, mergeMap, takeUntil, tap } from "rxjs";





@Component({
  selector: "app-photo-uploader",
  templateUrl: "./photo-uploader.component.html",
  styleUrls: ["photo-uploader.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupPhotoUploaderComponent implements OnInit, AfterViewInit, OnDestroy {

  static popUpWidth: string = "800px";

  @ViewChild("dragInputElm", { read: ElementRef }) dragInputElm: ElementRef;

  fileTypes: FileTypes[] = FileTypesDefault;
  multiUpload: boolean = false;
  private fileSize: number = PhotoMaxSize;

  dragStart: boolean = false;
  dragEnter: boolean = false;

  isMobile: boolean = false;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PopupPhotoUploaderData,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService
  ) {
    this.multiUpload = !!data?.multiUpload;
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
      ImageRightRotate(files[0])
        .pipe(takeUntil(this.destroyed$))
        .subscribe(data => console.log(data));
    }
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
  loading: boolean;
  uploaded: boolean;
  loadError: LoadError;
}

enum LoadError {
  extension,
  fileSize
}
