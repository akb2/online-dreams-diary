import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-account-confirmation",
  templateUrl: "./account-confirmation.component.html",
  styleUrls: ["./account-confirmation.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AccountConfirmationComponent implements OnInit, OnDestroy {


  navMenuType: NavMenuType = NavMenuType.collapse;

  activationLoader: boolean = false;
  activationSuccess: boolean = false;
  alreadyActivate: boolean = false;

  private activationUser: number;
  private activationCode: string;

  private destroy$: Subject<void> = new Subject();





  constructor(
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.activationUser = parseInt(this.activatedRoute?.snapshot?.params?.userId) ?? 0;
    this.activationCode = this.activatedRoute?.snapshot?.params?.activationCode?.toString() ?? "";
  }

  ngOnInit(): void {
    this.activationLoader = true;
    this.alreadyActivate = false;
    // Попытка активации
    if (this.activationUser > 0 && !!this.activationCode?.length) {
      this.accountService.activateAccount(this.activationUser, this.activationCode, ["9026"])
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          code => {
            if (code === "0001") {
              this.activationLoader = false;
              this.activationSuccess = true;
              this.changeDetectorRef.detectChanges();
            }
            // Аккаунт уже активирован
            else if (code === "9026") {
              this.alreadyActivate = true;
              this.onActivationError();
            }
          },
          () => this.onActivationError()
        );
    }
    // Не получены данные
    else {
      this.onActivationError();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Ошибка активации аккаунта
  private onActivationError(): void {
    this.activationLoader = false;
    this.activationSuccess = false;
    this.changeDetectorRef.detectChanges();
  }
}
