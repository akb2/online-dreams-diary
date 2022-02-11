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
import { TokenService } from "@_services/token.service";
import { Observable, of } from "rxjs";
import { map, mergeMap, switchMap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class DreamService {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: SimpleObject = environment.httpHeader;

  private currentUser: User;
  private tempUsers: User[] = [];





  // Сформировать объект нового сновидения
  get newDream(): Dream {
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





  constructor(
    private accountService: AccountService,
    private httpClient: HttpClient,
    private apiService: ApiService,
    private tokenService: TokenService
  ) {
    this.currentUser = this.accountService.getCurrentUser();
    // Подписка на актуальные сведения о пользователе
    this.accountService.user$.subscribe(user => user ? this.currentUser = user : null);
  }





  // Данные о сновидении
  getById(id: number, codes: string[] = []): Observable<Dream> {
    const url: string = this.baseUrl + "dream/getById?id=" + id + "&user_id=" + this.tokenService.id + "&token=" + this.tokenService.token;
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(url, this.httpHeader).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(result.result.data) :
          this.apiService.checkResponse(result.result.code, codes)
      ),
      mergeMap(dreamDto => this.dreamConverter(dreamDto))
    );
  }

  // Сохранить сновидение
  save(dream: Dream, codes: string[] = []): Observable<number> {
    const url: string = this.baseUrl + "dream/save?user_id=" + this.tokenService.id + "&token=" + this.tokenService.token;
    const formData: FormData = new FormData();
    Object.entries(this.dreamConverterDto(dream)).map(([k, v]) => formData.append(k, v));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(url, formData, this.httpHeader).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(result.result.data || 0) :
          this.apiService.checkResponse(result.result.code, codes)
      )
    );
  }





  // Конвертер сновидений
  private dreamConverter(dreamDto: DreamDto): Observable<Dream> {
    let dreamMap: DreamMapDto;
    // Обработка параметров
    dreamDto.headerBackgroundId = BackgroundImageDatas.some(b => b.id === dreamDto.headerBackgroundId) ? dreamDto.headerBackgroundId : 11;
    dreamDto.headerType = NavMenuType[dreamDto.headerType] ? dreamDto.headerType : NavMenuType.short;
    dreamDto.mode = DreamMode[dreamDto.mode] ? dreamDto.mode : DreamMode.mixed;
    dreamDto.status = DreamStatus[dreamDto.status] ? dreamDto.status : DreamStatus.draft;
    // Попытка прочитать карту
    try { dreamMap = JSON.parse(dreamDto.map) as DreamMapDto; }
    catch (e) { }
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
      map: this.dreamMapConverter(dreamMap),
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
      keywords: dream.keywords?.join(",") || "",
      text: dream.text,
      places: dream.places?.join(",") || "",
      members: dream.members?.join(",") || "",
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
  map: "",
  headerType: NavMenuType.collapse,
  headerBackgroundId: 9
}];