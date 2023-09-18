import { WaitObservable } from "@_datas/api";
import { AppMatDialogConfig, CompareElementByElement, FirstPrevBySelector, FrontDialogClass } from "@_datas/app";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { CustomObjectKey } from "@_models/app";
import { CommentMaterialType } from "@_models/comment";
import { MediaFile } from "@_models/media";
import { ScreenKeys } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { ScreenService } from "@_services/screen.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { BehaviorSubject, Subject, concatMap, filter, forkJoin, fromEvent, map, merge, of, pairwise, switchMap, takeUntil, timer } from "rxjs";





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

  private mobileBreakpoints: ScreenKeys[] = ["xxsmall", "xsmall", "small", "middle"];

  togglerSpacing: number = 0;

  loading: boolean = true;

  replyUser: User;
  readAccess: boolean = false;
  isMobile: boolean = false;

  commentListMinHeight: number = 0;
  commentListMaxHeight: number = 0;

  prevControlKeys: string[] = ["ArrowLeft"];
  nextControlKeys: string[] = ["ArrowRight", "Space"];

  writeAccess$: BehaviorSubject<boolean> = new BehaviorSubject(false);
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
    return (
      !!this.showCommentsTypes?.[this.getCurrentMediaFile?.viewType] &&
      !!this.commentType &&
      !this.loading &&
      this.readAccess
    );
  }

  // Тип комментариев
  get commentType(): CommentMaterialType {
    return this.commentTypes?.[this.getCurrentMediaFile?.viewType] ?? null;
  }





  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PopupPhotoViewerData,
    private matDialogRef: MatDialogRef<PopupPhotoViewerComponent, PopupPhotoViewerResult>,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private accountService: AccountService
  ) {
    this.mediaFiles = data?.mediaFiles ?? [];
    this.mediaFileId = ParseInt(data?.mediaFileId);
    this.mediaFileId = !!this.getCurrentMediaFile?.id ? this.mediaFileId : (!!this.mediaFiles?.length ? this.mediaFiles[0].id : 0);
  }

  ngOnInit(): void {
    this.viewerTemplateResizeEvent();
    this.viewerTemplateContainerResizeEvent();
    this.keyboardEvents();
    this.checkCommentPrivate();
    this.mobileViewChange();
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
        // Проверка доступа к комментариям
        this.checkCommentPrivate();
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
        // Проверка доступа к комментариям
        this.checkCommentPrivate();
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
    WaitObservable(() => !this.viewerTemplateContainer?.nativeElement || !this.imageElm?.nativeElement || this.loading)
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => merge(
          this.screenService.elmResize([this.viewerTemplateContainer.nativeElement, this.imageElm.nativeElement]),
          this.writeAccess$.pipe(
            pairwise(),
            filter(([p, v]) => p !== v),
            map(writeAccess => writeAccess),
            concatMap(() => WaitObservable(() => !this.commentEditor?.nativeElement), writeAccess => writeAccess),
            switchMap(writeAccess => writeAccess ? this.screenService.elmResize([this.commentEditor.nativeElement]) : of(null))
          )
        )),
        filter(() => !!this.commentBlock?.nativeElement)
      )
      .subscribe(() => {
        const element: HTMLElement = this.viewerTemplateContainer.nativeElement;
        const editorHeight: number = ParseInt(this.commentEditor?.nativeElement?.getBoundingClientRect()?.height);
        const elementMaxHeight: number = ParseInt(window.getComputedStyle(element).maxHeight);
        const imageHeight: number = this.imageElm.nativeElement.getBoundingClientRect().height;
        // Обновить параметры
        this.commentListMaxHeight = elementMaxHeight - editorHeight;
        this.commentListMinHeight = CheckInRange(imageHeight - editorHeight, this.commentListMaxHeight, 0);
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
        if (this.prevControlKeys.includes(code)) {
          this.onPrev();
        }
        // Следующая странциа
        else if (this.nextControlKeys.includes(code)) {
          this.onNext();
        }
      });
  }

  // Мобильный вид
  private mobileViewChange(): void {
    this.screenService.breakpoint$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(breakpoint => {
        this.isMobile = this.mobileBreakpoints.includes(breakpoint);
        this.changeDetectorRef.detectChanges();
      });
  }

  // Проверка доступа к коммнтариям
  private checkCommentPrivate(): void {
    const mediaFile: MediaFile = this.getCurrentMediaFile;
    // Обновить состояния комментариев
    this.readAccess = false;
    this.writeAccess$.next(false);
    // Обновить
    this.changeDetectorRef.detectChanges();
    // Медиа файл существует
    if (!!mediaFile) {
      forkJoin({
        writeAccess: this.accountService.checkPrivate("myCommentsWrite", mediaFile.user.id, ["8100"]),
        readAccess: this.accountService.checkPrivate("myCommentsRead", mediaFile.user.id, ["8100"])
      })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(({ readAccess, writeAccess }) => {
          this.readAccess = readAccess;
          this.writeAccess$.next(writeAccess);
          // Обновить
          this.changeDetectorRef.detectChanges();
        });
    }
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data?: PopupPhotoViewerData): MatDialogRef<PopupPhotoViewerComponent, PopupPhotoViewerResult> {
    const matDialogConfig: MatDialogConfig = { ...AppMatDialogConfig };
    const mediaFiles: number[] = (data?.mediaFiles ?? []).map(({ id }) => id);
    const mediaFileId: number = ParseInt(data?.mediaFileId);
    const dialogId: string = "popup-photo-viewer--files-" + (mediaFiles.join("-")) + "--file-" + (mediaFileId);
    const existsDialog: MatDialogRef<PopupPhotoViewerComponent, PopupPhotoViewerResult> = matDialog.getDialogById(dialogId);
    // Настройки окна
    matDialogConfig.width = PopupPhotoViewerComponent.popUpWidth;
    matDialogConfig.data = data;
    matDialogConfig.panelClass = "popup-photo-viewer";
    matDialogConfig.id = dialogId;
    // Открыть существующий
    if (!!existsDialog) {
      const existsElm: HTMLElement = document.getElementById(dialogId).closest(".cdk-global-overlay-wrapper");
      const existsBackdrop: HTMLElement = FirstPrevBySelector(existsElm, ".cdk-overlay-backdrop");
      // Убрать отметки о верхнем уровне
      matDialog.openDialogs.forEach(({ id }) => {
        const elm: HTMLElement = document.getElementById(id).closest(".cdk-global-overlay-wrapper");
        const backdrop: HTMLElement = FirstPrevBySelector(elm, ".cdk-overlay-backdrop");
        // Удалить классы
        elm.classList.remove(FrontDialogClass);
        backdrop.classList.remove(FrontDialogClass);
      });
      // Добавить классы
      existsElm.classList.add(FrontDialogClass);
      existsBackdrop.classList.add(FrontDialogClass);
      // Вернуть диалог
      return existsDialog;
    }
    // Вернуть новый диалог
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
