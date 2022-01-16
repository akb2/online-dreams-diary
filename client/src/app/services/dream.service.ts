import { Injectable } from "@angular/core";
import { User } from "@_models/account";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamDto, DreamMode, DreamStatus } from "@_models/dream";
import { DreamMap, DreamMapDto } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { Observable, of, throwError } from "rxjs";
import { map, mergeMap, switchMap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class DreamService {


  private currentUser: User;
  private tempUsers: User[] = [];

  private dreamMapWidth: number = 32;
  private dreamMapHeight: number = 32;





  constructor(
    private accountService: AccountService
  ) {
    this.currentUser = this.accountService.getCurrentUser();
    // Подписка на актуальные сведения о пользователе
    this.accountService.user$.subscribe(user => user ? this.currentUser = user : null);
  }





  // Сформировать объект нового сновидения
  newDream(): Dream {
    return {
      id: 0,
      user: this.currentUser,
      createDate: null,
      date: new Date(),
      title: "",
      description: "",
      keywords: [],
      text: "",
      places: [],
      members: [],
      map: null,
      mode: DreamMode.map,
      status: DreamStatus.draft,
      headerType: NavMenuType.short,
      headerBackground: BackgroundImageDatas.find(b => b.id === 11)
    };
  }

  // Данные о сновидении
  getDream(id: number): Observable<Dream> {
    // Вернуть подписку
    return of(Dreams).pipe(
      switchMap(dreams => {
        if (dreams.some(d => d.id === id)) {
          return of(dreams.find(d => d.id === id));
        }
        return throwError(() => "Сновидение не найдено");
      }),
      mergeMap(dream => this.dreamConverter(dream))
    );
  }





  // Конвертер сновидений
  private dreamConverter(dreamDto: DreamDto): Observable<Dream> {
    dreamDto.headerBackgroundId = BackgroundImageDatas.some(b => b.id === dreamDto.headerBackgroundId) ? dreamDto.headerBackgroundId : 11;
    dreamDto.headerType = NavMenuType[dreamDto.headerType] ? dreamDto.headerType : NavMenuType.short;
    dreamDto.mode = DreamMode[dreamDto.mode] ? dreamDto.mode : DreamMode.mixed;
    dreamDto.status = DreamStatus[dreamDto.status] ? dreamDto.status : DreamStatus.draft;
    // Итоговый массив
    const dream: Dream = {
      id: dreamDto.id,
      user: null,
      createDate: new Date(dreamDto.createDate),
      title: dreamDto.title,
      date: new Date(dreamDto.date),
      description: dreamDto.description,
      mode: dreamDto.mode as DreamMode,
      status: dreamDto.status as DreamStatus,
      keywords: dreamDto.keywords.split(","),
      places: null,
      members: null,
      text: dreamDto.text,
      map: this.dreamMapConverter(JSON.parse(dreamDto.map)),
      headerType: dreamDto.headerType as NavMenuType,
      headerBackground: BackgroundImageDatas.find(b => b.id === dreamDto.headerBackgroundId)
    };
    // Текущий пользователь
    if (dreamDto.userId === this.currentUser.id) {
      return of({
        ...dream,
        user: this.currentUser
      });
    }
    // Пользователь есть во временном массиве
    else if (this.tempUsers.some(u => u.id === dreamDto.userId)) {
      return of({
        ...dream,
        user: this.tempUsers.find(u => u.id === dreamDto.userId)
      });
    }
    // Загрузка данных с сервера
    else {
      return this.accountService.getUser(dreamDto.userId).pipe(map(user => ({
        ...dream,
        user
      })));
    }
  }

  // Конвертер карты
  dreamMapConverter(dreamMapDto: DreamMapDto | null): DreamMap {
    // Преобразование карты
    if (dreamMapDto) {
      return {
        size: {
          width: dreamMapDto.size.width || this.dreamMapWidth,
          height: dreamMapDto.size.height || this.dreamMapHeight
        },
        ceils: dreamMapDto.ceils.map(c => ({
          place: null,
          terrain: c.terrain,
          object: null,
          coord: c.coord
        })),
        dreamerWay: dreamMapDto.dreamerWay,
        skyBox: dreamMapDto.skyBox || 1
      } as DreamMap;
    }
    // Карта по умолчанию
    else {
      return {
        size: { width: this.dreamMapWidth, height: this.dreamMapHeight },
        ceils: [],
        dreamerWay: [],
        skyBox: 1
      };
    }
  }
}





// ! Временный массив сновидений
const Dreams: DreamDto[] = [{
  id: 1,
  userId: 1,
  createDate: "2021-09-27T13:10:21",
  title: "Полет по миру",
  status: DreamStatus.draft,
  date: "2017-03-12",
  description: "Я ходил по заброшенному зданию. Это не был мой дом. В какой-то момент я понял что сплю.",
  mode: DreamMode.mixed,
  keywords: "полет,город,руины,море,поляна,лес,черти,ложное пробуждение,преисподняя",
  places: "",
  members: "",
  text: "<p>Я ходил по заброшенному зданию. Это не был мой дом. В какой-то момент я понял что сплю.</p><p>После осознания я решил узнать насколько большим является мир сновидений. Я полетел его осматривать в одном из направлений.</p><p>Я пролетал над полями, лесами, все было достаточно ярко и реалистично. Но за лесами было место похожее на ад. Во мне появилось чувство страха из-за которого я потерял <a href=\"https://dreams.online-we.ru/all-dreams/7\">осознанность</a>.</p><p>Моя голова \"пробила потолок\" мира. Было пустое пространство небольшой комнаты. Я начал чувствовать приближение демона и еле слышал не отчетливые переговоры. Из-за страха проснулся.</p>",
  map: JSON.stringify({
    dreamerWay: null,
    size: { width: 70, height: 70 },
    ceils: [],
    skyBox: 1
  } as DreamMapDto),
  headerType: NavMenuType.collapse,
  headerBackgroundId: 9
}];