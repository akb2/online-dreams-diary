import { WaitObservable } from "@_datas/api";
import { AppMatDialogConfig, CompareElementByElement } from "@_datas/app";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { CustomObjectKey } from "@_models/app";
import { CommentMaterialType } from "@_models/comment";
import { MediaFile } from "@_models/media";
import { ScreenService } from "@_services/screen.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { Subject, concatMap, filter, fromEvent, takeUntil, timer } from "rxjs";





@Component({
  selector: "app-photo-viewer",
  templateUrl: "./photo-viewer.component.html",
  styleUrls: ["photo-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupPhotoViewerComponent implements OnInit, OnDestroy {

  static popUpWidth: string = "100vw";

  @ViewChild("imageElm", { read: ElementRef }) imageElm: ElementRef;
  @ViewChild("viewerTemplateContainer", { read: ElementRef }) viewerTemplateContainer: ElementRef;
  @ViewChild("viewerTemplate", { read: ElementRef }) viewerTemplate: ElementRef;
  @ViewChild("commentBlock", { read: ElementRef }) commentBlock: ElementRef;
  @ViewChild("commentEditor", { read: ElementRef }) commentEditor: ElementRef;

  mediaFiles: MediaFileView[] = [];
  private mediaFileId: number = 0;

  private showCommentsTypes: CustomObjectKey<MediaFileViewType, boolean> = {
    [MediaFileViewType.graffity]: true,
    [MediaFileViewType.media]: true,
    [MediaFileViewType.photo]: true,
  };

  private commentTypes: CustomObjectKey<MediaFileViewType, CommentMaterialType> = {
    [MediaFileViewType.graffity]: CommentMaterialType.Media,
    [MediaFileViewType.media]: CommentMaterialType.Media,
    [MediaFileViewType.photo]: CommentMaterialType.Photo,
  };

  togglerSpacing: number = 0;

  loading: boolean = true;

  replyUser: User;

  commentListMinHeight: number = 0;
  commentListMaxHeight: number = 0;

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

  // Тип комментариев
  get commentType(): CommentMaterialType {
    return this.commentTypes?.[this.getCurrentMediaFile?.viewType] ?? null;
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
    this.viewerTemplateResizeEvent();
    this.viewerTemplateContainerResizeEvent();
    this.keyboardEvents();
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
    timer(1)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.loading = false;
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }

  // Закрыть окно
  onClose(): void {
    this.matDialogRef.close();
  }

  // Был выбран пользователеь для ответа
  onReplyUserChange(replyUser: User): void {
    this.replyUser = replyUser;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }





  // Изменение размеров шаблона отображения
  private viewerTemplateResizeEvent(): void {
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
  }

  // Изменение размеров шаблона отображения
  private viewerTemplateContainerResizeEvent(): void {
    WaitObservable(() => !this.viewerTemplateContainer?.nativeElement || !this.imageElm?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => this.screenService.elmResize([this.viewerTemplateContainer.nativeElement])),
        filter(() => !!this.commentBlock?.nativeElement)
      )
      .subscribe(([{ element }]) => {
        const editorHeight: number = ParseInt(this.commentEditor?.nativeElement?.getBoundingClientRect()?.height);
        this.commentListMaxHeight = ParseInt(window.getComputedStyle(element).maxHeight) - editorHeight;
        this.commentListMinHeight = CheckInRange(this.imageElm.nativeElement.getBoundingClientRect().height - editorHeight, this.commentListMaxHeight, 0);
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }

  // Изменение размеров шаблона отображения
  private keyboardEvents(): void {
    fromEvent<KeyboardEvent>(window, "keyup")
      .pipe(
        takeUntil(this.destroyed$),
        filter(() => this.getTotalCount > 1),
        filter(({ code }) => this.prevControlKeys.includes(code) || this.nextControlKeys.includes(code)),
        filter(({ target }) => !this.commentBlock?.nativeElement || (!!this.commentBlock?.nativeElement && CompareElementByElement(this.commentBlock.nativeElement, target)))
      )
      .subscribe(({ code, target }) => {
        console.log(target);
        if (this.prevControlKeys.includes(code)) {
          this.onPrev();
        }
        // Следующая странциа
        else if (this.nextControlKeys.includes(code)) {
          this.onNext();
        }
      });
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data?: PopupPhotoViewerData): MatDialogRef<PopupPhotoViewerComponent, PopupPhotoViewerResult> {
    const matDialogConfig: MatDialogConfig = { ...AppMatDialogConfig };
    matDialogConfig.width = PopupPhotoViewerComponent.popUpWidth;
    matDialogConfig.data = data;
    matDialogConfig.panelClass = "popup-photo-viewer";
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
