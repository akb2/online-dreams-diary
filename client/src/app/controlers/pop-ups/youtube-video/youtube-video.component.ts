import { AppMatDialogConfig } from "@_datas/app";
import { GetYouTubeEmbedLink } from "@_helpers/comment";
import { WaitObservable } from "@_helpers/rxjs";
import { YouTubeVideo } from "@_models/comment";
import { ScreenService } from "@_services/screen.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Subject, switchMap, takeUntil } from "rxjs";



@Component({
  selector: "popup-youtube-video",
  templateUrl: "./youtube-video.component.html",
  styleUrls: ["youtube-video.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupYoutubeVideoComponent implements AfterViewInit, OnDestroy {
  static readonly popUpWidth: string = "1600px";

  @ViewChild("sectionHelper", { read: ElementRef }) sectionHelper: ElementRef<HTMLDivElement>;

  iframeLink: SafeResourceUrl;
  iframeWidth = 0;
  iframeHeight = 0;
  readonly iframeAspectX = 16;
  readonly iframeAspectY = 9;

  private destroyed$ = new Subject<void>();



  constructor(
    @Inject(MAT_DIALOG_DATA) private youTubeVideo: YouTubeVideo,
    private screenService: ScreenService,
    private domSanitizer: DomSanitizer,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.iframeLink = this.domSanitizer.bypassSecurityTrustResourceUrl(GetYouTubeEmbedLink(this.youTubeVideo, true));
  }

  ngAfterViewInit(): void {
    this.elmResizeListener();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }



  // Изменение размера окна
  private elmResizeListener() {
    WaitObservable(() => !this.sectionHelper?.nativeElement)
      .pipe(
        switchMap(() => this.screenService.elmResize(this.sectionHelper.nativeElement)),
        takeUntil(this.destroyed$)
      )
      .subscribe(([{ width, height }]) => {
        const aspectWidth = height / this.iframeAspectY * this.iframeAspectX;
        const aspectHeight = width / this.iframeAspectX * this.iframeAspectY;
        // Запомнить свойства
        this.iframeWidth = aspectWidth < width
          ? aspectWidth
          : width;
        this.iframeHeight = aspectHeight < height
          ? aspectHeight
          : height;
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }



  // Открыть текущее окно
  static open(matDialog: MatDialog, data: YouTubeVideo): MatDialogRef<PopupYoutubeVideoComponent> {
    const matDialogConfig: MatDialogConfig = {
      ...AppMatDialogConfig,
      width: PopupYoutubeVideoComponent.popUpWidth,
      data,
      panelClass: "clear-styles"
    };
    // Вернуть диалог
    return matDialog.open(PopupYoutubeVideoComponent, matDialogConfig);
  }
}
