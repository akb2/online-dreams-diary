import { SimpleObject } from "@_models/app";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { viewer3DCompassSelector } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";
import { map } from "rxjs";



@Component({
  selector: "viewer-3d-compass",
  templateUrl: "./viewer-3d-compass.component.html",
  styleUrls: ["./viewer-3d-compass.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Viewer3DCompassComponent {
  private readonly compassAzimuthShift = -90;
  private readonly compassRadialShift = 45;

  private compass$ = this.store$.select(viewer3DCompassSelector);

  compassStyles$ = this.compass$.pipe(map(({ radial, azimuth }) => ({
    transform: (
      " rotateX(" + (azimuth - this.compassAzimuthShift) + "deg) " +
      " rotateZ(" + (radial - this.compassRadialShift) + "deg) "
    )
  })));

  compassMarkAreaStyles$ = this.compass$.pipe(map(({ cos, sin }) => {
    const value: number = 50;
    const top: number = (value * sin) + value;
    const left: number = (value * cos) + value;
    // Объект стилей
    return {
      marginTop: top + "%",
      marginLeft: left + "%"
    };
  }));

  compassMarkColumnStyles$ = this.compass$.pipe(map(({ radial }) => ({
    transform: (
      " rotateX(-90deg) " +
      " rotateY(" + radial + "deg) "
    )
  })));

  compassMarkHeadStyles$ = this.compass$.pipe(map(({ azimuth }) => ({
    transform: (
      "rotateX(" + (-azimuth) + "deg)"
    )
  })));



  // Корректировка поворота компаса
  get compassCorrectStyles(): SimpleObject {
    return {
      transform: "rotate(" + this.compassRadialShift + "deg)"
    };
  }



  constructor(
    private store$: Store
  ) { }
}
