import { SnackbarProps } from "@_models/app";
import { Injectable, OnDestroy } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslateService } from "@ngx-translate/core";
import { Subject, takeUntil } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class SnackbarService implements OnDestroy {


  private timerForReadASymbol: number = 150;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private snackBar: MatSnackBar,
    private translateService: TranslateService
  ) { }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Раскрыть сообщение
  open({ message: mixedMessage, action, mode }: SnackbarProps): void {
    const mixedActionMsg: string = action ?? "general.buttons.close";
    // Загрузка текстов
    this.translateService.get([mixedMessage, mixedActionMsg])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        const message: string = data?.[mixedMessage] ?? "";
        const actionMsg: string = data?.[mixedActionMsg] ?? "";
        const duration: number = message.length * this.timerForReadASymbol;
        // Открыть сообщение
        this.snackBar.open(message, actionMsg, {
          duration,
          horizontalPosition: "right",
          verticalPosition: "bottom",
          ...(mode && { panelClass: `snackbar-${mode}` })
        });
      });
  }
}
