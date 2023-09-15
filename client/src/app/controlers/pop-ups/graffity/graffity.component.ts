import { PaintCanvasComponent } from "@_controlers/paint-canvas/paint-canvas.component";
import { AppMatDialogConfig } from "@_datas/app";
import { GraffityDrawData } from "@_models/comment";
import { ChangeDetectionStrategy, Component, Inject, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";





@Component({
  selector: "app-popup-graffity",
  templateUrl: "./graffity.component.html",
  styleUrls: ["./graffity.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupGraffityComponent {


  static popUpWidth: string = "500px";

  @ViewChild("paintCanvas", { read: PaintCanvasComponent }) private paintCanvas: PaintCanvasComponent;

  drawData: GraffityDrawData;
  saveAvail: boolean = false;
  deleteAvail: boolean = false;





  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopupGraffityData,
    private matDialogRef: MatDialogRef<PopupGraffityComponent, GraffityDrawData>
  ) {
    this.drawData = data?.graffityData;
    this.saveAvail = !!this.drawData?.objects?.length;
    this.deleteAvail = !!this.drawData?.objects?.length;
  }





  // Изменение объекта
  onChangeCanvas(data: GraffityDrawData): void {
    this.drawData = data;
    this.saveAvail = !!this.drawData?.objects?.length;
  }

  // Сохранить данные
  onSave(clear: boolean = false): void {
    if (!clear && this.saveAvail) {
      this.paintCanvas.onSave().subscribe(data => {
        this.onChangeCanvas(data);
        this.matDialogRef.close(this.drawData);
      });
    }
    // Удалить графити
    else if (clear && this.deleteAvail) {
      this.onChangeCanvas(null);
      this.matDialogRef.close(null);
    }
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data: PopupGraffityData): MatDialogRef<PopupGraffityComponent> {
    const matDialogConfig: MatDialogConfig = { ...AppMatDialogConfig };
    // Настройки
    matDialogConfig.width = PopupGraffityComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupGraffityComponent, matDialogConfig);
  }
}





// Интерфейс входящих данных
export interface PopupGraffityData {
  graffityData?: GraffityDrawData;
}
