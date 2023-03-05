import { Component, Inject } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AppMatDialogConfig } from "@_datas/app";





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
    this.data.title = this.data.title ? this.data.title : "Подтвержение действия";
    this.data.text = this.data.text ? this.data.text : "Вы подтверждаете действие на сайте?";
  }





  // Подтверждение
  onConfirm(): void {
    this.matDialogRef.close(true);
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data: PopupConfirmData): MatDialogRef<PopupConfirmComponent> {
    const matDialogConfig: MatDialogConfig = AppMatDialogConfig;
    matDialogConfig.width = PopupConfirmComponent.popUpWidth;
    matDialogConfig.data = data;
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
