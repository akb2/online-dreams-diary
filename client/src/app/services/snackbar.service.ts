import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SnackbarProps } from "@_models/app";





@Injectable({
  providedIn: "root"
})

export class SnackbarService {


  constructor(
    private snackBar: MatSnackBar
  ) { }





  // Раскрыть сообщение
  open({ message, action, mode }: SnackbarProps): void {
    const actionMsg: string = action ?? "Закрыть";
    this.snackBar.open(message, actionMsg, {
      duration: message.length * 3000,
      horizontalPosition: "right",
      verticalPosition: "bottom",
      ...(mode && { panelClass: `snackbar-${mode}` })
    });
  }
}
