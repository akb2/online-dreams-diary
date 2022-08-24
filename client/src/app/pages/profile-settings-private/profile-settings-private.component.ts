import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '@_models/account';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { Subject, takeUntil } from 'rxjs';





@Component({
  selector: 'app-profile-settings-private',
  templateUrl: './profile-settings-private.component.html',
  styleUrls: ['./profile-settings-private.component.scss']
})

export class ProfileSettingsPrivateComponent implements OnInit, OnDestroy {


  user: User;

  navMenuType: NavMenuType = NavMenuType.collapse;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.accountService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
