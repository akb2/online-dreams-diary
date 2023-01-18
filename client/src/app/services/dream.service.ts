import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { ObjectToFormData, ObjectToParams } from "@_datas/api";
import { BackgroundImageDatas } from "@_datas/appearance";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamObjectDetalization, DreamObjectElmsValues, DreamSkyTime, DreamTerrain, DreamWaterDefHeight } from "@_datas/dream-map-settings";
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { Dream, DreamDto, DreamMode, DreamStatus, SearchRequestDream } from "@_models/dream";
import { ClosestHeightName, DreamMap, DreamMapCameraPosition, DreamMapCeilDto, DreamMapDto, DreamMapSettings, ReliefType, Water } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { forkJoin, Observable, of, Subject } from "rxjs";
import { concatMap, map, mergeMap, switchMap, take, takeUntil } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class DreamService implements OnDestroy {


  private cookieKey: string = "dream_service";
  private cookieLifeTime: number = 60 * 60 * 24 * 365;

  private user: User;

  private destroyed$: Subject<void> = new Subject();





  // Сформировать объект нового сновидения
  get newDream(): Dream {
    return {
      id: 0,
      user: this.user,
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

  // Позиция камеры по умолчанию
  getDefaultCamera(width: number = DreamMapSize, height: number = DreamMapSize): DreamMapCameraPosition {
    return {
      target: {
        x: 0,
        y: ((DreamCeilSize / DreamCeilParts) * DreamMaxHeight),
        z: 0,
      },
      position: {
        x: 0,
        y: 0,
        z: -(height * DreamCeilSize) / 2,
      }
    };
  }

  // Настройки редактора карт
  get getDreamMapSettings(): DreamMapSettings {
    this.configLocalStorage();
    // Параметры
    const detalizationString: string = this.localStorageService.getCookie("settings_detalization");
    // Параметры
    const detalization: DreamObjectElmsValues = parseInt(!!detalizationString ? detalizationString : DreamObjectDetalization.toString()) as DreamObjectElmsValues;
    // Настройки
    return { detalization };
  }

  // Сведения о владельце сновидения
  private getDreamUser(userId: number): Observable<User> {
    return this.accountService.user$(userId, false)
      .pipe(
        takeUntil(this.destroyed$),
        take(1),
        map(u => u as User)
      );
  }





  constructor(
    private accountService: AccountService,
    private httpClient: HttpClient,
    private apiService: ApiService,
    private localStorageService: LocalStorageService
  ) {
    // Подписка на актуальные сведения о пользователе
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Список сновидений
  search(search: SearchDream, codes: string[] = []): Observable<SearchRequestDream> {
    return this.httpClient.get<ApiResponse>("dream/getList", { params: ObjectToParams(search, "search_") }).pipe(
      switchMap(result => result.result.code === "0001" || codes.some(code => result.result.code === code) ?
        of({ ...result.result.data }) :
        this.apiService.checkResponse(result.result.code, codes)),
      concatMap(
        ({ dreams }: any) => {
          if (dreams?.length > 0) {
            const users: number[] = Array.from(new Set(dreams.map((dream: DreamDto) => dream.userId)));
            // Найдены уникальные ID пользователей
            return forkJoin(users.map(u => this.getDreamUser(u)));
          }
          // Не искать пользователей
          return of([]);
        },
        ({ dreams, count, limit, hasAccess }: any, users: User[]) => ({ dreams: dreams as DreamDto[], count, limit, hasAccess, users })
      ),
      map(response => ({
        ...response,
        result: response?.dreams?.length > 0 ? response.dreams.map(d => ({
          ...this.dreamConverter(d as DreamDto),
          user: response.users.find(u => u.id === d.userId)!
        })) : []
      }))
    );
  }

  // Данные о сновидении
  getById(id: number, edit: boolean = true, codes: string[] = []): Observable<Dream> {
    const params: SimpleObject = {
      id: id.toString(),
      edit: edit ? "true" : "false"
    };
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>("dream/getById", { params: ObjectToParams(params) }).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(result.result.data) :
          this.apiService.checkResponse(result.result.code, codes)
      ),
      mergeMap(
        (d: DreamDto) => this.getDreamUser(d.userId),
        (dreamDto, user) => ({ dreamDto, user })
      ),
      map(({ dreamDto, user }) => ({ ...this.dreamConverter(dreamDto), user })),
    );
  }

  // Сохранить сновидение
  save(dream: Dream, codes: string[] = []): Observable<number> {
    const formData: FormData = new FormData();
    Object.entries(this.dreamConverterDto(dream)).map(([k, v]) => formData.append(k, v));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("dream/save", formData).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(result.result.data || 0) :
          this.apiService.checkResponse(result.result.code, codes)
      )
    );
  }

  // Удалить сновидение
  delete(dreamId: number, codes: string[] = []): Observable<boolean> {
    const formData: FormData = ObjectToFormData({ id: dreamId });
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("dream/delete", formData).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(!!result.result.data.isDelete) :
          this.apiService.checkResponse(result.result.code, codes)
      )
    );
  }

  // Сохранить настройки карты
  saveSettings(settings: DreamMapSettings): void {
    this.configLocalStorage();
    // Сохранение параметров
    this.localStorageService.setCookie("settings_detalization", settings.detalization.toString());
  }





  // Конвертер сновидений
  private dreamConverter(dreamDto: DreamDto): Dream {
    let dreamMap: DreamMapDto;
    // Обработка параметров
    dreamDto.headerBackgroundId = BackgroundImageDatas.some(b => b.id === dreamDto.headerBackgroundId) ? dreamDto.headerBackgroundId : 11;
    dreamDto.headerType = NavMenuType[dreamDto.headerType] ? dreamDto.headerType : NavMenuType.short;
    dreamDto.mode = DreamMode[dreamDto.mode] ? dreamDto.mode : DreamMode.mixed;
    dreamDto.status = DreamStatus[dreamDto.status] ? dreamDto.status : DreamStatus.draft;
    dreamDto.keywords = dreamDto.keywords.trim()?.length > 0 ? dreamDto.keywords.trim() : "";
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
      keywords: dreamDto.keywords?.length > 0 ? dreamDto.keywords.split(",").filter(k => !!k.trim()) : [],
      places: null,
      members: null,
      text: dreamDto.text,
      map: this.dreamMapConverter(dreamMap),
      headerType: dreamDto.headerType as NavMenuType,
      headerBackground: BackgroundImageDatas.find(b => b.id === dreamDto.headerBackgroundId)
    };
    // Текущий пользователь
    return dream;
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
      map: JSON.stringify(this.cleanMap(dream.map)),
      mode: dream.mode,
      status: dream.status,
      headerType: dream.headerType,
      headerBackgroundId: dream.headerBackground.id
    };
  }

  // Конвертер карты
  dreamMapConverter(dreamMapDto: DreamMapDto | null = null): DreamMap {
    const reliefNames: ClosestHeightName[] = ["topLeft", "top", "topRight", "left", "right", "bottomLeft", "bottom", "bottomRight"];
    // Преобразование карты
    if (dreamMapDto) {
      const width: number = dreamMapDto.size.width ?? DreamMapSize;
      const height: number = dreamMapDto.size.height ?? DreamMapSize;
      const defaultCamera: DreamMapCameraPosition = this.getDefaultCamera(width, height);
      const ocean: Water = {
        z: dreamMapDto?.ocean?.z ?? DreamWaterDefHeight,
        material: dreamMapDto?.ocean?.material ?? 1
      };
      // Вернуть объект
      return {
        size: {
          width: dreamMapDto.size.width ?? DreamMapSize,
          height: dreamMapDto.size.height ?? DreamMapSize,
          zHeight: dreamMapDto.size.zHeight ?? DreamDefHeight
        },
        ceils: dreamMapDto.ceils.map(c => ({
          place: null,
          terrain: c.terrain ?? DreamTerrain,
          object: c.object ?? 0,
          coord: {
            ...c.coord,
            originalZ: c.coord.z
          }
        })),
        camera: {
          target: {
            x: dreamMapDto?.camera?.target?.x ?? defaultCamera.target.x,
            y: dreamMapDto?.camera?.target?.y ?? defaultCamera.target.y,
            z: dreamMapDto?.camera?.target?.z ?? defaultCamera.target.z,
          },
          position: {
            x: dreamMapDto?.camera?.position?.x ?? defaultCamera.position.x,
            y: dreamMapDto?.camera?.position?.y ?? defaultCamera.position.y,
            z: dreamMapDto?.camera?.position?.z ?? defaultCamera.position.z,
          }
        },
        sky: {
          time: dreamMapDto?.sky?.time ?? DreamSkyTime
        },
        dreamerWay: dreamMapDto.dreamerWay,
        ocean,
        relief: {
          types: reliefNames.reduce((o, name) => ({
            ...o,
            [name as ClosestHeightName]: !!dreamMapDto?.relief?.types?.hasOwnProperty(name) ? dreamMapDto.relief.types[name] : ReliefType.flat
          }), {})
        },
        isNew: false
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
        camera: this.getDefaultCamera(),
        ceils: [],
        dreamerWay: [],
        ocean: {
          z: DreamWaterDefHeight,
          material: 1
        },
        land: {
          type: DreamTerrain,
          z: DreamDefHeight
        },
        sky: {
          time: DreamSkyTime
        },
        relief: {
          types: reliefNames.reduce((o, name) => ({ ...o, [name as ClosestHeightName]: ReliefType.flat }), {})
        },
        isNew: true
      };
    }
  }

  // Очистка карты от лишних данных
  cleanMap(dreamMap: DreamMap): DreamMapDto {
    const ceils: DreamMapCeilDto[] = dreamMap.ceils
      .filter(c => !(
        !c.object &&
        (!c.terrain || c.terrain === DreamTerrain /* || c.water === null || c.water.z <= c.coord.originalZ */) &&
        c.coord.originalZ === DreamDefHeight
      ))
      .map(c => {
        const ceil: DreamMapCeilDto = {};
        // Добавление данных
        ceil.coord = {
          x: c.coord.x,
          y: c.coord.y,
          z: c.coord.z
        };
        // if (!!c.water && c.water.z > c.coord.originalZ) ceil.water = c.water;
        if (!!c.place) ceil.place = c.place.id;
        if (!!c.terrain && c.terrain !== DreamTerrain) ceil.terrain = c.terrain;
        if (!!c.object) ceil.object = c.object;
        // Ячейка
        return ceil;
      });
    // Вернуть карту
    return {
      ceils,
      camera: dreamMap.camera,
      size: dreamMap.size,
      dreamerWay: dreamMap.dreamerWay,
      ocean: dreamMap.ocean,
      sky: dreamMap.sky,
      relief: dreamMap.relief
    };
  }





  // Инициализация Local Storage
  private configLocalStorage(): void {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }
}





// Поиск: входящие данные
export interface SearchDream {
  page?: number;
  user?: number;
  limit?: number;
  status?: DreamStatus;
}
