import { AppMatDialogConfig } from "@_datas/app";
import { DefaultDreamMapSettings, DreamMapMaxShadowQuality, DreamMapMinShadowQuality, DreamObjectElmsValues } from "@_datas/dream-map-settings";
import { DreamMapSettings } from "@_models/dream-map";
import { SliderSettings } from "@_models/form";
import { clamp } from "@akb2/math";
import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";





@Component({
  selector: "app-popup-dream-map-settings",
  templateUrl: "./dream-map-settings.component.html",
  styleUrls: ["./dream-map-settings.component.scss"]
})

export class PopupDreamMapSettingsComponent {


  static popUpWidth: string = "560px";

  settings: DreamMapSettings;





  // Иконка уровня детализации
  get getDetalizationInputData(): SliderSettings {
    return {
      min: DreamObjectElmsValues.VeryLow,
      max: DreamObjectElmsValues.Awesome,
      step: 1,
      icon: "detalization_level_" + (this.settings?.detalization ?? 0)
    };
  }

  // Иконка качества теней
  get getShadowQualityInputData(): SliderSettings {
    return {
      min: DreamMapMinShadowQuality,
      max: DreamMapMaxShadowQuality,
      step: 1,
      icon: "detalization_level_" + (this.getShadowQualityValue - 1)
    };
  }

  // Поле детализации определено
  get getDetalizationInitState(): boolean {
    return !!this.settings?.detalization || this.settings?.detalization === DreamObjectElmsValues.VeryLow;
  }

  // Получить качество теней
  get getShadowQualityValue(): number {
    return clamp(this.settings?.shadowQuality, DreamMapMaxShadowQuality, DreamMapMinShadowQuality);
  }

  // Установить качество теней
  set getShadowQualityValue(shadowQuality: number) {
    if (!!this.settings) {
      this.settings.shadowQuality = clamp(shadowQuality, DreamMapMaxShadowQuality, DreamMapMinShadowQuality);
    }
  }





  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopupDreamMapSettingsData,
    private matDialogRef: MatDialogRef<PopupDreamMapSettingsComponent, DreamMapSettings>
  ) {
    this.settings = data.settings ?? DefaultDreamMapSettings;
  }





  // Подтверждение
  onConfirm(): void {
    this.matDialogRef.close(this.settings);
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data: PopupDreamMapSettingsData): MatDialogRef<PopupDreamMapSettingsComponent> {
    const matDialogConfig: MatDialogConfig = { ...AppMatDialogConfig };
    matDialogConfig.width = PopupDreamMapSettingsComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupDreamMapSettingsComponent, matDialogConfig);
  }
}





// Интерфейс входящих данных
export interface PopupDreamMapSettingsData {
  settings: DreamMapSettings;
}
