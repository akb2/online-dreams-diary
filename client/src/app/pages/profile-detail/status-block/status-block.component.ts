import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { AccountService } from "@_services/account.service";
import { ScreenService } from "@_services/screen.service";
import { delay, filter, fromEvent, map, merge, concatMap, skipWhile, Subject, takeUntil, takeWhile, timer, of } from "rxjs";





@Component({
  selector: "app-status-block",
  templateUrl: "status-block.component.html",
  styleUrls: ["status-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class StatusBlockComponent implements OnChanges, OnInit, AfterContentInit, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;

  @ViewChild("inputField") inputField!: ElementRef;
  @ViewChild("inputHelper") inputHelper!: ElementRef;
  @ViewChild("inputHelperText") inputHelperText!: ElementRef;
  @ViewChild("statusBlock") statusBlock!: ElementRef;
  @ViewChild("statusOverlay") statusOverlay!: ElementRef;
  @ViewChild("saveButton", { read: ElementRef }) saveButton!: ElementRef;
  @ViewChild("cancelButton", { read: ElementRef }) cancelButton!: ElementRef;
  @ViewChild("editButton", { read: ElementRef }) editButton!: ElementRef;

  statusForm: UntypedFormGroup;
  placeholderText: string = "Напишите, что у вас нового...";

  loader: boolean = false;
  editHelperStyles: SimpleObject = {};
  editHelperTextStyles: SimpleObject = {};
  editInputStyles: SimpleObject = {};

  editStatus$: Subject<boolean> = new Subject();
  private destroyed$: Subject<void> = new Subject();





  // Пересечение элемента
  private compareElement(target: any, elements: any[]): boolean {
    if (!!target && !!elements?.length) {
      let element: any = target;
      // Поиск пересечения
      while (element.parentNode && !elements.includes(element)) {
        element = element.parentNode;
      }
      // Проверка
      return elements.includes(element);
    }
    // Нет пересечения
    return false;
  }

  // Текст для помощника редактора
  get getEditorText(): string {
    const text: string = this.statusForm?.get('status')?.value;
    // Вернуть текст
    return !!text ? text : this.placeholderText;
  }





  constructor(
    private formBuilder: UntypedFormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService,
    private screenService: ScreenService
  ) {
    this.statusForm = this.formBuilder.group({
      status: null
    });
  }

  ngOnChanges(): void {
    this.statusForm.get("status").setValue(this.user?.pageStatus ?? null);
  }

  ngOnInit(): void {
    fromEvent(document.body, "mousedown")
      .pipe(takeUntil(this.destroyed$))
      .subscribe(e => this.onCloseEdit(e as PointerEvent));
  }

  ngAfterContentInit(): void {
    timer(0, 50)
      .pipe(
        takeUntil(this.destroyed$),
        takeWhile(() => !this.inputHelperText || !this.statusOverlay || !this.statusForm?.get("status"), true),
        skipWhile(() => !this.inputHelperText || !this.statusOverlay || !this.statusForm?.get("status")),
        concatMap(() => merge(
          this.editStatus$.asObservable(),
          this.statusForm.get("status").valueChanges.pipe(delay(1)),
          this.screenService.elmResize([this.statusOverlay.nativeElement])
        )),
        map(() => ([this.inputHelperText?.nativeElement])),
        filter(elms => elms.every(e => !!e))
      )
      .subscribe(([helperText]) => {
        this.editInputStyles = {
          width: (helperText.getBoundingClientRect().width) + "px",
          height: (helperText.getBoundingClientRect().height) + "px"
        };
        // Обновить
        this.changeDetectorRef.detectChanges();
      })
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }




  // Сохранение статуса по нажатию Enter
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === "NumPadEnter") {
      this.onSaveStatus();
    }
  }

  // Открыть редактор
  onOpenEdit(): void {
    if (this.itsMyPage) {
      this.editStatus$.next(true);
      this.changeDetectorRef.detectChanges();
      // Фокус на элементе
      timer(0, 1)
        .pipe(
          takeUntil(this.destroyed$),
          takeWhile(() => !this.inputField?.nativeElement, true),
          skipWhile(() => !this.inputField?.nativeElement)
        )
        .subscribe(() => this.inputField?.nativeElement.focus());
    }
  }

  // Закрыть редактор
  onCloseEdit(event: PointerEvent): void {
    const elements = [this.statusBlock, this.saveButton, this.cancelButton, this.editButton]
      .filter(e => !!e && !!e?.nativeElement)
      .map(e => e.nativeElement);
    // Вызов события
    if (!event || (!!event && !this.compareElement(event.target, elements))) {
      this.editStatus$.next(false);
      this.statusForm.get("status").setValue(this.user.pageStatus);
      this.changeDetectorRef.detectChanges();
    }
  }

  // Сохранить статус
  onSaveStatus(): void {
    if (this.itsMyPage) {
      const pageStatus: string = this.statusForm?.get("status")?.value ?? "";
      // Обновить состояния
      this.loader = true;
      this.editStatus$.next(false);
      this.changeDetectorRef.detectChanges();
      // Сохранение статуса
      this.accountService.savePageStatus(pageStatus)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          code => {
            if (code === "0001") {
              this.user.pageStatus = pageStatus;
              this.statusForm.get("status").setValue(pageStatus);
            }
            // Убрать лоадер
            this.onSaveStatusEnd();
          },
          () => this.onSaveStatusEnd()
        );
    }
  }

  // Ошибка сохранения статуса
  private onSaveStatusEnd(): void {
    this.loader = false;
    this.editStatus$.next(false);
    this.changeDetectorRef.detectChanges();
  }
}
