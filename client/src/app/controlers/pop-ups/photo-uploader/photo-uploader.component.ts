import { AppMatDialogConfig } from "@_datas/app";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";





@Component({
  selector: "app-photo-uploader",
  templateUrl: "./photo-uploader.component.html",
  styleUrls: ["photo-uploader.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupPhotoUploaderComponent {
  static popUpWidth: string = "";

  // Открыть текущее окно
  static open(matDialog: MatDialog, data: PopupPhotoUploaderData): MatDialogRef<PopupPhotoUploaderComponent> {
    const matDialogConfig: MatDialogConfig = AppMatDialogConfig;
    matDialogConfig.width = PopupPhotoUploaderComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupPhotoUploaderComponent, matDialogConfig);
  }
}





export interface PopupPhotoUploaderData {
}
