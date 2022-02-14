import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@_environments/environment";
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { CustomObject, SimpleObject } from "@_models/app";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamDto, DreamMode, DreamStatus } from "@_models/dream";
import { DreamMap, DreamMapDto } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { SkyBoxes } from "@_services/dream-map/skybox.service";
import { MapTerrains } from "@_services/dream-map/terrain.service";
import { TokenService } from "@_services/token.service";
import { forkJoin, Observable, of } from "rxjs";
import { map, mergeMap, switchMap, tap } from "rxjs/operators";





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

  // Сформировать параметры URL
  getHttpHeader(params?: any, paramsPreffix: string = ""): CustomObject<any> {
    return {
      ...this.httpHeader,
      params: new HttpParams({
        fromObject: {
          ...(!!params ? Object.entries(params).reduce((o, [k, v]) => ({ ...o, [paramsPreffix + k]: v }), {}) : {}),
          user_id: this.tokenService.id,
          token: this.tokenService.token
        }
      })
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





  // Список сновидений
  getList(search: SearchDream, codes: string[] = []): Observable<{ count: number, dreams: Dream[] }> {
    const url: string = this.baseUrl + "dream/getList";
    let count: number = 0;
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(url, this.getHttpHeader(search, "search_")).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(result.result.data) :
          this.apiService.checkResponse(result.result.code, codes)
      ),
      tap(r => count = r.count),
      mergeMap(r => r.dreams?.length > 0 ? forkJoin([...r.dreams.map(d => this.dreamConverter(d as DreamDto))]) : of([])),
      mergeMap((dreams: Dream[]) => of({ count, dreams }))
    );
  }

  // Данные о сновидении
  getById(id: number, edit: boolean = true, codes: string[] = []): Observable<Dream> {
    const url: string = this.baseUrl + "dream/getById";
    const params: SimpleObject = {
      id: id.toString(),
      edit: edit ? "true" : "false"
    };
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(url, this.getHttpHeader(params)).pipe(
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
    const url: string = this.baseUrl + "dream/save";
    const formData: FormData = new FormData();
    Object.entries(this.dreamConverterDto(dream)).map(([k, v]) => formData.append(k, v));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(url, formData, this.getHttpHeader()).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(result.result.data || 0) :
          this.apiService.checkResponse(result.result.code, codes)
      )
    );
  }

  // Удалить сновидение
  delete(dreamId: number, codes: string[] = []): Observable<boolean> {
    const url: string = this.baseUrl + "dream/delete";
    const params: SimpleObject = { id: dreamId.toString() };
    // Вернуть подписку
    return this.httpClient.delete<ApiResponse>(url, this.getHttpHeader(params)).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(!!result.result.data.isDelete) :
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





// Интерфейс данных поиска по сновидениям
export interface SearchDream {
  page?: number;
  user?: number;
  status?: DreamStatus;
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

// Заголовок по умолчанию
export const DreamTitle: string = "*** Новое сновидение ***";
export const DreamDescription: string = "*** Без описания ***";