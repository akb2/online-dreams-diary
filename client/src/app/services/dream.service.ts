import { ObjectToFormData, ObjectToParams } from "@_datas/api";
import { ToDate } from "@_datas/app";
import { BackgroundImageDatas } from "@_datas/appearance";
import { ClosestHeightNames } from "@_datas/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamObjectElmsValues, DreamSkyTime, DreamTerrain, DreamWaterDefHeight } from "@_datas/dream-map-settings";
import { LocalStorageGet, LocalStorageSet } from "@_helpers/local-storage";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { Dream, DreamDto, DreamMode, DreamMood, DreamStatus, DreamType, SearchDream, SearchRequestDream } from "@_models/dream";
import { ClosestHeightName, DreamMap, DreamMapCameraPosition, DreamMapCeilDto, DreamMapDto, DreamMapSettings, ReliefType, Water } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Observable, Subject, of } from "rxjs";
import { concatMap, map, mergeMap, switchMap, take, takeUntil } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class DreamService implements OnDestroy {


  private localStorageTtl: number = 60 * 60 * 24 * 365;
  private dreamMapSettingsLocalStorageKey: string = "dream_map-settings";

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
      interpretation: "",
      places: [],
      members: [],
      map: this.dreamMapConverter(),
      mode: DreamMode.mixed,
      status: DreamStatus.draft,
      type: DreamType.Simple,
      mood: DreamMood.Nothing,
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
    return LocalStorageGet(
      this.dreamMapSettingsLocalStorageKey,
      settings => ({
        detalization: CheckInRange(ParseInt(settings?.detalization), DreamObjectElmsValues.Awesome, DreamObjectElmsValues.VeryLow),
        shadowQuality: ParseInt(settings?.shadowQuality)
      })
    );
  }

  // Сведения о владельце сновидения
  private getDreamUsers(userIds: number[], userId: number = 0): Observable<User[]> {
    userIds = Array.from(new Set(userIds));
    // Текущий пользователь
    if (userIds.length === 1 && ((!!this.user && this.user.id === userIds[0]) || userId === userIds[0])) {
      return this.accountService.user$(userId).pipe(
        take(1),
        map(user => ([user]))
      );
    }
    // Список пользователей
    return this.accountService.search({ ids: userIds }, ["0002"])
      .pipe(
        map(({ result }) => result)
      );
  }





  constructor(
    private accountService: AccountService,
    private httpClient: HttpClient,
    private apiService: ApiService
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
  search(search: Partial<SearchDream>, codes: string[] = []): Observable<SearchRequestDream> {
    return this.httpClient.get<ApiResponse>("dream/getList", { params: ObjectToParams(search, "search_") }).pipe(
      switchMap(result => result.result.code === "0001" || codes.some(code => result.result.code === code) ?
        of({ ...result.result.data }) :
        this.apiService.checkResponse(result.result.code, codes)),
      concatMap(
        ({ dreams }: any) => dreams?.length > 0 ?
          this.getDreamUsers(Array.from(new Set(dreams.map((dream: DreamDto) => dream.userId))), search.user ?? 0) :
          of([]),
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
        (d: DreamDto) => this.getDreamUsers([d.userId], d.userId),
        (dreamDto, user) => ({ dreamDto, user: user[0] })
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

  // Создать интерпритацию
  createInterpretation(dreamId: number, codes: string[] = []): Observable<string> {
    const formData: FormData = ObjectToFormData({ id: dreamId });
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("dream/createInterpretation", formData).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(result.result.data) :
          this.apiService.checkResponse(result.result.code, codes)
      )
    );
  }

  // Сохранить настройки карты
  saveSettings(settings: DreamMapSettings): void {
    LocalStorageSet(this.dreamMapSettingsLocalStorageKey, settings, this.localStorageTtl);
  }





  // Конвертер сновидений
  private dreamConverter(dreamDto: DreamDto): Dream {
    let dreamMap: DreamMapDto;
    const keywords: string[] = Array.from(new Set((dreamDto.keywords ?? "").split(",")
      .map(k => k.trim())
      .map(k => k.replace(/[\?\.=:;]/gmi, ""))
      .filter(k => !!k)
    ))
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
      id: ParseInt(dreamDto.id),
      user: null,
      createDate: ToDate(dreamDto?.createDate),
      title: dreamDto?.title ?? "",
      date: ToDate(dreamDto?.date),
      description: dreamDto.description,
      mode: (dreamDto?.mode as DreamMode) ?? DreamMode.mixed,
      status: (dreamDto?.status as DreamStatus) ?? DreamStatus.private,
      type: (dreamDto?.type as DreamType) ?? DreamType.Simple,
      mood: (dreamDto?.mood as DreamMood) ?? DreamMood.Nothing,
      keywords,
      places: null,
      members: null,
      text: dreamDto?.text ?? "",
      interpretation: dreamDto.interpretation ?? "",
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
      title: dream.title ?? "",
      description: dream.description ?? "",
      keywords: Array.from(new Set(dream.keywords ?? []))?.join(",") || "",
      text: dream?.text ?? "",
      interpretation: dream?.interpretation ?? "",
      places: dream.places?.join(",") || "",
      members: dream.members?.join(",") || "",
      map: JSON.stringify(this.cleanMap(dream.map)),
      mode: dream.mode,
      status: dream.status,
      type: dream.type,
      mood: dream.mood,
      headerType: dream.headerType,
      headerBackgroundId: dream.headerBackground.id
    };
  }

  // Конвертер карты
  dreamMapConverter(dreamMapDto: DreamMapDto = null): DreamMap {
    if (dreamMapDto) {
      const width: number = ParseInt(dreamMapDto?.size?.width, DreamMapSize);
      const height: number = ParseInt(dreamMapDto?.size?.height, DreamMapSize);
      const defaultCamera: DreamMapCameraPosition = this.getDefaultCamera(width, height);
      const ocean: Water = {
        z: ParseInt(dreamMapDto?.ocean?.z, DreamWaterDefHeight),
        material: ParseInt(dreamMapDto?.ocean?.material, 1)
      };
      // Вернуть объект
      return {
        size: {
          width: ParseInt(dreamMapDto?.size?.width, DreamMapSize),
          height: ParseInt(dreamMapDto?.size?.height, DreamMapSize),
          zHeight: ParseInt(dreamMapDto?.size?.zHeight, DreamDefHeight)
        },
        ceils: dreamMapDto.ceils.map(c => ({
          place: null,
          terrain: ParseInt(c?.terrain, DreamTerrain),
          object: ParseInt(c?.object, 0),
          coord: {
            ...c.coord,
            originalZ: c.coord.z
          }
        })),
        camera: {
          target: {
            x: ParseInt(dreamMapDto?.camera?.target?.x, defaultCamera.target.x),
            y: ParseInt(dreamMapDto?.camera?.target?.y, defaultCamera.target.y),
            z: ParseInt(dreamMapDto?.camera?.target?.z, defaultCamera.target.z),
          },
          position: {
            x: ParseInt(dreamMapDto?.camera?.position?.x, defaultCamera.position.x),
            y: ParseInt(dreamMapDto?.camera?.position?.y, defaultCamera.position.y),
            z: ParseInt(dreamMapDto?.camera?.position?.z, defaultCamera.position.z),
          }
        },
        sky: {
          time: ParseInt(dreamMapDto?.sky?.time, DreamSkyTime)
        },
        dreamerWay: dreamMapDto.dreamerWay,
        ocean,
        relief: {
          types: ClosestHeightNames.reduce((o, name) => ({
            ...o,
            [name as ClosestHeightName]: dreamMapDto?.relief?.types?.[name] ?? ReliefType.flat
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
          types: ClosestHeightNames.reduce((o, name) => ({ ...o, [name as ClosestHeightName]: ReliefType.flat }), {})
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
}
