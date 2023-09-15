import { WaitObservable } from "@_datas/api";
import { AppMatDialogConfig } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { CustomObjectKey } from "@_models/app";
import { MediaFile } from "@_models/media";
import { ScreenService } from "@_services/screen.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { Subject, concatMap, filter, fromEvent, takeUntil } from "rxjs";





@Component({
  selector: "app-photo-viewer",
  templateUrl: "./photo-viewer.component.html",
  styleUrls: ["photo-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupPhotoViewerComponent implements OnInit, OnDestroy {

  static popUpWidth: string = "100vw";

  @ViewChild("viewerTemplate", { read: ElementRef }) viewerTemplate: ElementRef;

  mediaFiles: MediaFileView[] = [];
  private mediaFileId: number = 0;

  private showCommentsTypes: CustomObjectKey<MediaFileViewType, boolean> = {
    [MediaFileViewType.graffity]: false,
    [MediaFileViewType.media]: false,
    [MediaFileViewType.photo]: false,
  };

  togglerSpacing: number = 0;

  loading: boolean = true;

  prevControlKeys: string[] = ["ArrowLeft"];
  nextControlKeys: string[] = ["ArrowRight", "Space"];

  private destroyed$: Subject<void> = new Subject();





  // Текущий медиафайл
  get getCurrentMediaFile(): MediaFileView {
    const mediaFile: MediaFileView = !!this.mediaFileId ? this.mediaFiles.find(({ id }) => id === this.mediaFileId) : null;
    // Вернуть медиа файл
    return mediaFile ?? null;
  }

  // Номер текущего файла
  get getCurrentPosition(): number {
    return this.mediaFiles.findIndex(({ id }) => id === this.mediaFileId) + 1;
  }

  // Общее число файлов
  get getTotalCount(): number {
    return this.mediaFiles?.length ?? 0;
  }

  // Показать комментарии
  get getShowComments(): boolean {
    return !!this.showCommentsTypes?.[this.getCurrentMediaFile?.viewType];
  }





  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PopupPhotoViewerData,
    private matDialogRef: MatDialogRef<PopupPhotoViewerComponent, PopupPhotoViewerResult>,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService
  ) {
    this.mediaFiles = data?.mediaFiles ?? [];
    this.mediaFileId = ParseInt(data?.mediaFileId);
    this.mediaFileId = !!this.getCurrentMediaFile?.id ? this.mediaFileId : (!!this.mediaFiles?.length ? this.mediaFiles[0].id : 0);
  }

  ngOnInit(): void {
    WaitObservable(() => !this.viewerTemplate?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => this.screenService.elmResize([this.viewerTemplate.nativeElement]))
      )
      .subscribe(([{ width }]) => {
        this.togglerSpacing = width / 2;
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
    // Перелистывание клавиатурой
    fromEvent<KeyboardEvent>(window, "keyup")
      .pipe(
        takeUntil(this.destroyed$),
        filter(() => this.getTotalCount > 1),
        filter(({ code }) => this.prevControlKeys.includes(code) || this.nextControlKeys.includes(code))
      )
      .subscribe(({ code }) => {
        if (this.prevControlKeys.includes(code)) {
          this.onPrev();
        }
        // Следующая странциа
        else if (this.nextControlKeys.includes(code)) {
          this.onNext();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Следующий файл
  onPrev(): void {
    if (this.getTotalCount > 1) {
      const index: number = this.getCurrentPosition - 1;
      // Массив в порядке
      if (index >= 0) {
        this.loading = true;
        this.mediaFileId = index > 0 ?
          this.mediaFiles[index - 1].id :
          this.mediaFiles[this.getTotalCount - 1].id;
        // Обновить
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  // Следующий файл
  onNext(): void {
    if (this.getTotalCount > 1) {
      const index: number = this.getCurrentPosition - 1;
      // Массив в порядке
      if (index >= 0) {
        this.loading = true;
        this.mediaFileId = index + 1 < this.getTotalCount ?
          this.mediaFiles[index + 1].id :
          this.mediaFiles[0].id;
        // Обновить
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  // Фото загружено
  onPhotoLoaded(): void {
    this.loading = false;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Закрыть окно
  onClose(): void {
    this.matDialogRef.close();
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data?: PopupPhotoViewerData): MatDialogRef<PopupPhotoViewerComponent, PopupPhotoViewerResult> {
    const matDialogConfig: MatDialogConfig = AppMatDialogConfig;
    matDialogConfig.width = PopupPhotoViewerComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupPhotoViewerComponent, matDialogConfig);
  }
}





interface PopupPhotoViewerData {
  mediaFiles: MediaFileView[];
  mediaFileId?: number;
}

interface PopupPhotoViewerResult {
}

export interface MediaFileView extends MediaFile {
  viewType: MediaFileViewType;
}

export enum MediaFileViewType {
  graffity,
  media,
  photo
}
