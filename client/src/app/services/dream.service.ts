import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@_environments/environment";
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamDto, DreamMode, DreamStatus } from "@_models/dream";
import { DreamMap, DreamMapDto } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { SkyBoxes } from "@_services/dream-map/skybox.service";
import { MapTerrains } from "@_services/dream-map/terrain.service";
import { Observable, of, throwError } from "rxjs";
import { map, mergeMap, switchMap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class DreamService {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: SimpleObject = environment.httpHeader;

  private currentUser: User;
  private tempUsers: User[] = [];





  constructor(
    private accountService: AccountService,
    private httpClient: HttpClient,
    private apiService: ApiService
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
      map: this.dreamMapConverter(),
      mode: DreamMode.mixed,
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
        // Ошибка
        return throwError(() => "Сновидение не найдено");
      }),
      mergeMap(dream => this.dreamConverter(dream))
    );
  }

  // Сохранить сновидение
  saveDream(dream: Dream, codes: string[] = []): Observable<number> {
    const formData: FormData = new FormData();
    Object.entries(this.dreamConverterDto(dream)).map(([k, v]) => formData.append(k, v));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "dream/saveDream", formData, this.httpHeader).pipe(
      switchMap(
        result => {
          // Вернуть данные пользователя
          if (result.result.code === "0001" || codes.some(code => code === result.result.code)) {
            return of(result.result.data);
          }
          // Вернуть обработку кодов
          else {
            return this.apiService.checkResponse(result.result.code, codes);
          }
        }
      )
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

  // Конвертер сновидений для сервера
  private dreamConverterDto(dream: Dream): DreamDto {
    return {
      id: dream.id,
      userId: dream.user.id,
      createDate: new Date().toISOString(),
      date: dream.date.toISOString(),
      title: dream.title,
      description: dream.description,
      keywords: dream.keywords.join(","),
      text: dream.text,
      places: dream.places.join(","),
      members: dream.members.join(","),
      map: JSON.stringify(dream.map),
      mode: dream.mode,
      status: dream.status,
      headerType: dream.headerType,
      headerBackgroundId: dream.headerBackground.id
    };
  }

  // Конвертер карты
  dreamMapConverter(dreamMapDto: DreamMapDto | null = null): DreamMap {
    // Преобразование карты
    if (dreamMapDto) {
      return {
        size: {
          width: dreamMapDto.size.width || DreamMapSize,
          height: dreamMapDto.size.height || DreamMapSize
        },
        ceils: dreamMapDto.ceils.map(c => ({
          place: null,
          terrain: c.terrain || DreamTerrain,
          object: null,
          coord: {
            ...c.coord,
            originalZ: c.coord.z
          }
        })),
        dreamerWay: dreamMapDto.dreamerWay,
        skyBox: dreamMapDto.skyBox || DreamSkyBox
      } as DreamMap;
    }
    // Карта по умолчанию
    else {
      return {
        size: {
          width: DreamMapSize,
          height: DreamMapSize,
          zHeight: DreamDefHeight
        },
        ceils: [],
        dreamerWay: [],
        skyBox: DreamSkyBox
      };
    }
  }
}





// Размер карты по умолчанию
export const DreamMapSize: number = 50;

// Размер ячейки по умолчанию
export const DreamCeilSize: number = 1;

// Количество секций по высоте в одной ячейке
export const DreamCeilParts: number = 64;

// Пределы высот
export const DreamMinHeight: number = 1;
export const DreamDefHeight: number = DreamCeilParts * 10;
export const DreamMaxHeight: number = DreamCeilParts * 20;

// Параметры по умолчанию
export const DreamSkyBox: number = SkyBoxes[0].id;
export const DreamTerrain: number = MapTerrains[0].id;

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
    size: { width: DreamMapSize, height: DreamMapSize },
    ceils: [{ coord: { x: 25, y: 18, z: 728 } }, { coord: { x: 24, y: 18, z: 728 } }, { coord: { x: 23, y: 18, z: 728 } }, { coord: { x: 23, y: 19, z: 728 } }, { coord: { x: 24, y: 19, z: 736 } }, { coord: { x: 25, y: 19, z: 728 } }, { coord: { x: 26, y: 19, z: 728 } }, { coord: { x: 27, y: 19, z: 720 } }, { coord: { x: 28, y: 20, z: 720 } }, { coord: { x: 26, y: 20, z: 728 } }, { coord: { x: 27, y: 20, z: 728 } }, { coord: { x: 28, y: 21, z: 728 } }, { coord: { x: 24, y: 20, z: 736 } }, { coord: { x: 25, y: 20, z: 736 } }, { coord: { x: 24, y: 21, z: 744 } }, { coord: { x: 25, y: 21, z: 736 } }, { coord: { x: 26, y: 21, z: 736 } }, { coord: { x: 27, y: 21, z: 728 } }, { coord: { x: 25, y: 22, z: 744 } }, { coord: { x: 26, y: 22, z: 736 } }, { coord: { x: 27, y: 22, z: 736 } }, { coord: { x: 28, y: 22, z: 728 } }, { coord: { x: 29, y: 22, z: 728 } }, { coord: { x: 27, y: 23, z: 736 } }, { coord: { x: 28, y: 23, z: 736 } }, { coord: { x: 29, y: 23, z: 728 } }, { coord: { x: 22, y: 19, z: 728 } }, { coord: { x: 23, y: 20, z: 736 } }, { coord: { x: 23, y: 21, z: 736 } }, { coord: { x: 24, y: 22, z: 744 } }, { coord: { x: 26, y: 23, z: 744 } }, { coord: { x: 21, y: 19, z: 720 } }, { coord: { x: 22, y: 20, z: 728 } }, { coord: { x: 22, y: 21, z: 736 } }, { coord: { x: 23, y: 22, z: 744 } }, { coord: { x: 25, y: 23, z: 744 } }, { coord: { x: 21, y: 20, z: 728 } }, { coord: { x: 21, y: 21, z: 728 } }, { coord: { x: 22, y: 22, z: 736 } }, { coord: { x: 24, y: 23, z: 752 } }, { coord: { x: 20, y: 20, z: 720 } }, { coord: { x: 20, y: 21, z: 728 } }, { coord: { x: 21, y: 22, z: 758 } }, { coord: { x: 23, y: 23, z: 797 } }, { coord: { x: 20, y: 22, z: 750 } }, { coord: { x: 22, y: 23, z: 799 } }, { coord: { x: 19, y: 22, z: 750 } }, { coord: { x: 17, y: 23, z: 660 } }, { coord: { x: 18, y: 23, z: 717 } }, { coord: { x: 19, y: 23, z: 827 } }, { coord: { x: 20, y: 23, z: 837 } }, { coord: { x: 21, y: 23, z: 813 } }, { coord: { x: 18, y: 24, z: 739 } }, { coord: { x: 19, y: 24, z: 864 } }, { coord: { x: 20, y: 24, z: 864 } }, { coord: { x: 21, y: 24, z: 870 } }, { coord: { x: 22, y: 24, z: 866 } }, { coord: { x: 23, y: 24, z: 819 } }, { coord: { x: 24, y: 24, z: 797 } }, { coord: { x: 25, y: 24, z: 774 } }, { coord: { x: 26, y: 24, z: 736 } }, { coord: { x: 27, y: 24, z: 736 } }, { coord: { x: 28, y: 24, z: 728 } }, { coord: { x: 29, y: 24, z: 728 } }, { coord: { x: 20, y: 25, z: 871 } }, { coord: { x: 21, y: 25, z: 867 } }, { coord: { x: 22, y: 25, z: 873 } }, { coord: { x: 23, y: 25, z: 866 } }, { coord: { x: 24, y: 25, z: 819 } }, { coord: { x: 25, y: 25, z: 769 } }, { coord: { x: 26, y: 25, z: 766 } }, { coord: { x: 27, y: 25, z: 728 } }, { coord: { x: 28, y: 25, z: 728 } }, { coord: { x: 20, y: 26, z: 868 } }, { coord: { x: 21, y: 26, z: 874 } }, { coord: { x: 22, y: 26, z: 870 } }, { coord: { x: 23, y: 26, z: 873 } }, { coord: { x: 24, y: 26, z: 816 } }, { coord: { x: 25, y: 26, z: 791 } }, { coord: { x: 26, y: 26, z: 761 } }, { coord: { x: 27, y: 26, z: 728 } }, { coord: { x: 28, y: 26, z: 720 } }, { coord: { x: 21, y: 27, z: 871 } }, { coord: { x: 22, y: 27, z: 877 } }, { coord: { x: 23, y: 27, z: 870 } }, { coord: { x: 24, y: 27, z: 873 } }, { coord: { x: 25, y: 27, z: 808 } }, { coord: { x: 26, y: 27, z: 761 } }, { coord: { x: 27, y: 27, z: 753 } }, { coord: { x: 23, y: 28, z: 875 } }, { coord: { x: 24, y: 28, z: 868 } }, { coord: { x: 25, y: 28, z: 808 } }, { coord: { x: 19, y: 25, z: 781 } }, { coord: { x: 20, y: 27, z: 795 } }, { coord: { x: 21, y: 28, z: 796 } }, { coord: { x: 22, y: 28, z: 792 } }, { coord: { x: 26, y: 28, z: 676 } }, { coord: { x: 27, y: 28, z: 673 } }, { coord: { x: 23, y: 29, z: 780 } }, { coord: { x: 24, y: 29, z: 775 } }, { coord: { x: 25, y: 29, z: 698 } }, { coord: { x: 19, y: 26, z: 788 } }, { coord: { x: 20, y: 28, z: 798 } }, { coord: { x: 21, y: 29, z: 789 } }, { coord: { x: 22, y: 29, z: 787 } }, { coord: { x: 26, y: 29, z: 673 } }, { coord: { x: 27, y: 29, z: 673 } }, { coord: { x: 23, y: 30, z: 775 } }, { coord: { x: 24, y: 30, z: 718 } }, { coord: { x: 25, y: 30, z: 673 } }, { coord: { x: 19, y: 27, z: 793 } }, { coord: { x: 20, y: 29, z: 793 } }, { coord: { x: 21, y: 30, z: 784 } }, { coord: { x: 22, y: 30, z: 780 } }, { coord: { x: 26, y: 30, z: 673 } }, { coord: { x: 23, y: 31, z: 768 } }, { coord: { x: 24, y: 31, z: 693 } }, { coord: { x: 25, y: 31, z: 673 } }, { coord: { x: 19, y: 28, z: 798 } }, { coord: { x: 19, y: 29, z: 791 } }, { coord: { x: 20, y: 30, z: 786 } }, { coord: { x: 20, y: 31, z: 781 } }, { coord: { x: 21, y: 31, z: 777 } }, { coord: { x: 22, y: 31, z: 775 } }, { coord: { x: 26, y: 31, z: 670 } }, { coord: { x: 21, y: 32, z: 772 } }, { coord: { x: 22, y: 32, z: 748 } }, { coord: { x: 23, y: 32, z: 693 } }, { coord: { x: 24, y: 32, z: 673 } }, { coord: { x: 25, y: 32, z: 670 } }, { coord: { x: 23, y: 33, z: 673 } }, { coord: { x: 16, y: 24, z: 710 } }, { coord: { x: 17, y: 24, z: 737 } }, { coord: { x: 15, y: 25, z: 690 } }, { coord: { x: 16, y: 25, z: 737 } }, { coord: { x: 17, y: 25, z: 739 } }, { coord: { x: 18, y: 25, z: 776 } }, { coord: { x: 15, y: 26, z: 717 } }, { coord: { x: 16, y: 26, z: 739 } }, { coord: { x: 17, y: 26, z: 746 } }, { coord: { x: 14, y: 27, z: 695 } }, { coord: { x: 15, y: 27, z: 739 } }, { coord: { x: 16, y: 27, z: 746 } }, { coord: { x: 14, y: 28, z: 695 } }, { coord: { x: 15, y: 28, z: 744 } }, { coord: { x: 17, y: 27, z: 781 } }, { coord: { x: 16, y: 28, z: 746 } }, { coord: { x: 14, y: 29, z: 695 } }, { coord: { x: 18, y: 26, z: 781 } }, { coord: { x: 18, y: 27, z: 788 } }, { coord: { x: 17, y: 28, z: 786 } }, { coord: { x: 18, y: 28, z: 791 } }, { coord: { x: 15, y: 29, z: 717 } }, { coord: { x: 16, y: 29, z: 744 } }, { coord: { x: 17, y: 29, z: 779 } }, { coord: { x: 18, y: 29, z: 786 } }, { coord: { x: 15, y: 30, z: 695 } }, { coord: { x: 16, y: 30, z: 737 } }, { coord: { x: 17, y: 30, z: 744 } }, { coord: { x: 18, y: 30, z: 779 } }, { coord: { x: 15, y: 31, z: 690 } }, { coord: { x: 16, y: 31, z: 715 } }, { coord: { x: 19, y: 30, z: 786 } }, { coord: { x: 17, y: 31, z: 737 } }, { coord: { x: 18, y: 31, z: 774 } }, { coord: { x: 19, y: 31, z: 779 } }, { coord: { x: 16, y: 32, z: 690 } }, { coord: { x: 17, y: 32, z: 715 } }, { coord: { x: 18, y: 32, z: 717 } }, { coord: { x: 19, y: 32, z: 774 } }, { coord: { x: 20, y: 32, z: 774 } }, { coord: { x: 22, y: 33, z: 673 } }, { coord: { x: 21, y: 33, z: 695 } }, { coord: { x: 18, y: 33, z: 695 } }, { coord: { x: 19, y: 33, z: 717 } }, { coord: { x: 20, y: 33, z: 717 } },],
    skyBox: 1
  } as DreamMapDto),
  headerType: NavMenuType.collapse,
  headerBackgroundId: 9
}];