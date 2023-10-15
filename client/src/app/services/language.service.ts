import { Language } from "@_models/translate";
import { Injectable, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class LanguageService implements OnDestroy {

  language$: Subject<Language> = new Subject();
  private destroyed$: Subject<void> = new Subject();





  constructor() {
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
