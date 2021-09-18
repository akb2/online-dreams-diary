import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { User } from '@_models/account';
import { BackgroundImageData, BackgroundImageDatas } from '@_models/appearance';
import { AccountService } from '@_services/account.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';





@Component({
  selector: 'app-settings-appearance',
  templateUrl: './appearance.component.html',
  styleUrls: ['./appearance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingsAppearanceComponent {


  user: User;
  backgroundImageDatas: BackgroundImageData[] = BackgroundImageDatas;
  backgroundImageData: BackgroundImageData = BackgroundImageDatas[0];

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.subscribeUser().subscribe(() => this.changeDetectorRef.detectChanges());
    this.accountService.syncCurrentUser().subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Изменить фон
  changeImage(data: BackgroundImageData): void {
    this.backgroundImageData = data;
  }





  // Подписка на пользователя
  private subscribeUser(): Observable<User> {
    return this.accountService.user$.pipe(takeUntil(this.destroy$), map(user => this.user = user));
  }
}