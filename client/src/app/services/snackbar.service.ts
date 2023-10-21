import { SnackbarProps } from "@_models/app";
import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";





@Injectable({
  providedIn: "root"
})

export class SnackbarService {


  private timerForReadASymbol: number = 150;





  constructor(
    private snackBar: MatSnackBar
  ) { }





  // Раскрыть сообщение
  open({ message, action, mode }: SnackbarProps): void {
    const actionMsg: string = action ?? "Закрыть";
    const duration: number = message.length * this.timerForReadASymbol;
    // Открыть сообщение
    this.snackBar.open(message, actionMsg, {
      duration,
      horizontalPosition: "right",
      verticalPosition: "bottom",
      ...(mode && { panelClass: `snackbar-${mode}` })
    });
  }
}
