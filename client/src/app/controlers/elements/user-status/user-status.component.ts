import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { User } from "@_models/account";
import { AccountService } from "@_services/account.service";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-user-status",
  templateUrl: "user-status.component.html",
  styleUrls: ["user-status.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class UserStatusComponent implements OnChanges {


  @Input() user: User;
  @Input() itsMyPage: boolean;

  statusForm: FormGroup;
  placeholderText: string = "Напишите, что у вас нового...";

  loader: boolean = false;
  editStatus: boolean = false;

  private destroyed$: Subject<void> = new Subject();





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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }




  // Открыть редактор
  onOpenEdit(): void {
    this.editStatus = true;
    this.changeDetectorRef.detectChanges();
  }

  // Закрыть редактор
  onCloseEdit(): void {
    this.editStatus = false;
    this.changeDetectorRef.detectChanges();
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
