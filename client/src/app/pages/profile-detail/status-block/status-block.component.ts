import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { AccountService } from "@_services/account.service";
import { anyToInt } from "@akb2/types-tools";
import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Subject, fromEvent, skipWhile, takeUntil, takeWhile, timer } from "rxjs";





@Component({
  selector: "app-status-block",
  templateUrl: "status-block.component.html",
  styleUrls: ["status-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class StatusBlockComponent implements OnChanges, OnInit, AfterViewChecked, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;

  @ViewChild("inputField") inputField!: ElementRef;
  @ViewChild("inputHelperText", { static: false }) inputHelperText!: ElementRef;
  @ViewChild("statusBlock") statusBlock!: ElementRef;
  @ViewChild("statusBlockHelper") statusBlockHelper!: ElementRef;
  @ViewChild("statusOverlay") statusOverlay!: ElementRef;
  @ViewChild("saveButton", { read: ElementRef }) saveButton!: ElementRef;
  @ViewChild("cancelButton", { read: ElementRef }) cancelButton!: ElementRef;
  @ViewChild("editButton", { read: ElementRef }) editButton!: ElementRef;

  statusForm: FormGroup;

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
    return this.statusForm?.get('status')?.value?.toString() ?? "";
  }

  // Убрать отступ справа
  get noPaddingRight(): boolean {
    const overlay: HTMLElement = this.statusOverlay?.nativeElement as HTMLElement;
    const form: HTMLElement = this.statusBlock?.nativeElement as HTMLElement;
    const formHelper: HTMLElement = this.statusBlockHelper?.nativeElement as HTMLElement;
    const input: HTMLTextAreaElement = this.inputField?.nativeElement as HTMLTextAreaElement;
    // Только если есть элемент
    if (!!overlay && !!form && !!input) {
      const maxWidth = anyToInt(formHelper.getBoundingClientRect()?.width);
      const width: number = anyToInt(this.editInputStyles?.width);
      // Вернуть результат
      return width < maxWidth;
    }
    // Есть отступ справа
    return false;
  }

  // Вспомогательный текст
  get helperText(): string {
    return !!this.getEditorText
      ? this.getEditorText
      : 'pages.profile.blocks.status.placeholder'
  }





  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService
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

  ngAfterViewChecked(): void {
    if (this.inputHelperText?.nativeElement) {
      this.editInputStyles = {
        width: (this.inputHelperText.nativeElement.getBoundingClientRect().width) + "px",
        height: (this.inputHelperText.nativeElement.getBoundingClientRect().height) + "px"
      };
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
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
          takeWhile(() => !this.inputField?.nativeElement, true),
          skipWhile(() => !this.inputField?.nativeElement),
          takeUntil(this.destroyed$)
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
