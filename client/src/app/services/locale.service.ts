import { LanguageLocales } from "@_datas/translate";
import { GetDetectedLanguage } from "@_helpers/translate";
import { Injectable, OnDestroy, Optional, SkipSelf } from "@angular/core";
import { ActivatedRouteSnapshot, Router } from "@angular/router";
import { translateLanguageSelector } from "@app/reducers/translate";
import { Store } from "@ngrx/store";
import { Subject, concatMap, filter, from, map, noop, takeUntil, tap } from "rxjs";





@Injectable({
  providedIn: "root",
})

export class LocaleService implements OnDestroy {

  currentLocale: string = LanguageLocales[GetDetectedLanguage()];

  private destroyed$: Subject<void> = new Subject();





  constructor(
    @Optional() @SkipSelf() otherInstance: LocaleService,
    private store: Store,
    private router: Router
  ) {
    if (!otherInstance) {
      this.store.select(translateLanguageSelector)
        .pipe(
          takeUntil(this.destroyed$),
          filter(language => LanguageLocales[language] !== this.currentLocale),
          map(language => ({
            language,
            shouldReuseRoute: this.router.routeReuseStrategy.shouldReuseRoute
          })),
          tap(() => {
            this.setRouteReuse(() => false);
            this.router.navigated = false;
          }),
          concatMap(() => from(this.router.navigateByUrl(this.router.url).catch(noop)), d => d)
        )
        .subscribe(({ language, shouldReuseRoute }) => {
          this.currentLocale = LanguageLocales[language];
          this.setRouteReuse(shouldReuseRoute);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private setRouteReuse(reuse: ShouldReuseRoute) {
    this.router.routeReuseStrategy.shouldReuseRoute = reuse;
  }
}





// Локаль
export class LocaleId extends String {
  constructor(private localeService: LocaleService) {
    super();
  }

  override toString(): string {
    return this.localeService.currentLocale;
  }

  override  valueOf(): string {
    return this.toString();
  }
}

type ShouldReuseRoute = (future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot) => boolean;
