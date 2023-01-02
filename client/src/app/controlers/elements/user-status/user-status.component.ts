import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { User } from "@_models/account";
import { AccountService } from "@_services/account.service";
import { fromEvent, skipWhile, Subject, takeUntil, takeWhile, timer } from "rxjs";





@Component({
  selector: "app-user-status",
  templateUrl: "user-status.component.html",
  styleUrls: ["user-status.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class UserStatusComponent implements OnChanges, OnInit, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;

  @ViewChild("inputField") inputField!: ElementRef;
  @ViewChild("statusBlock") statusBlock!: ElementRef;
  @ViewChild("saveButton", { read: ElementRef }) saveButton!: ElementRef;
  @ViewChild("cancelButton", { read: ElementRef }) cancelButton!: ElementRef;
  @ViewChild("editButton", { read: ElementRef }) editButton!: ElementRef;

  statusForm: FormGroup;
  placeholderText: string = "Напишите, что у вас нового...";

  loader: boolean = false;
  editStatus: boolean = false;

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
    this.statusForm.get("status").setValue(this.user.pageStatus);
  }

  ngOnInit(): void {
    fromEvent(document.body, "mousedown")
      .pipe(takeUntil(this.destroyed$))
      .subscribe(e => this.onCloseEdit(e as PointerEvent));
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
    this.editStatus = true;
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

  // Закрыть редактор
  onCloseEdit(event: PointerEvent): void {
    const elements = [this.statusBlock, this.saveButton, this.cancelButton, this.editButton]
      .filter(e => !!e && !!e?.nativeElement)
      .map(e => e.nativeElement);
    // Вызов события
    if (!event || (!!event && !this.compareElement(event.target, elements))) {
      this.editStatus = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  // Сохранить статус
  onSaveStatus(): void {
    const pageStatus: string = this.statusForm?.get("status")?.value ?? "";
    // Обновить состояния
    this.loader = true;
    this.editStatus = false;
    this.user.pageStatus = pageStatus;
    this.changeDetectorRef.detectChanges();
    // Сохранение статуса
    this.accountService.savePageStatus(pageStatus)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        code => {
          if (code === "0001") {
            this.statusForm.get("status").setValue(pageStatus);
          }
          // Убрать лоадер
          this.onSaveStatusError();
        },
        () => this.onSaveStatusError()
      );
  }

  // Ошибка сохранения статуса
  private onSaveStatusError(): void {
    this.loader = false;
    this.editStatus = false;
    this.changeDetectorRef.detectChanges();
  }
}
