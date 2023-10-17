import { AppMatDialogConfig } from "@_datas/app";
import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";





@Component({
  selector: "app-popup-confirm",
  templateUrl: "./confirm.component.html",
  styleUrls: ["./confirm.component.scss"]
})

export class PopupConfirmComponent {


  static popUpWidth: string = "420px";





  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopupConfirmData,
    private matDialogRef: MatDialogRef<PopupConfirmComponent, boolean>
  ) {
    this.data.title = this.data.title
      ? this.data.title
      : "popups.confirmation.title";
    this.data.text = this.data.text
      ? this.data.text
      : "popups.confirmation.text";
  }





  // Подтверждение
  onConfirm(): void {
    this.matDialogRef.close(true);
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data: PopupConfirmData): MatDialogRef<PopupConfirmComponent> {
    const matDialogConfig: MatDialogConfig = {
      ...AppMatDialogConfig,
      data,
      width: PopupConfirmComponent.popUpWidth
    };
    // Вернуть диалог
    return matDialog.open(PopupConfirmComponent, matDialogConfig);
  }
}





// Интерфейс входящих данных
export interface PopupConfirmData {
  title?: string;
  subTitle?: string;
  text?: string;
}
