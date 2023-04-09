import { AppMatDialogConfig } from "@_datas/app";
import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";





@Component({
  selector: "app-popup-graffity",
  templateUrl: "./graffity.component.html",
  styleUrls: ["./graffity.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupGraffityComponent {


  static popUpWidth: string = "560px";





  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopupGraffityData,
    private matDialogRef: MatDialogRef<PopupGraffityComponent, boolean>
  ) { }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data: PopupGraffityData): MatDialogRef<PopupGraffityComponent> {
    const matDialogConfig: MatDialogConfig = AppMatDialogConfig;
    matDialogConfig.width = PopupGraffityComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupGraffityComponent, matDialogConfig);
  }
}





// Интерфейс входящих данных
export interface PopupGraffityData {
}
