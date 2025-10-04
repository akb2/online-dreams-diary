import { ObjectToFormData, ObjectToParams } from "@_datas/api";
import { AnyToDate } from "@_datas/app";
import { BackgroundImageDatas } from "@_datas/appearance";
import { ClosestHeightNames } from "@_datas/dream-map";
import { DreamObjectElmsValues } from "@_datas/dream-map-settings";
import { JsonDecode } from "@_helpers/app";
import { LocalStorageGet, LocalStorageSet } from "@_helpers/local-storage";
import { ParseFloat, ParseInt } from "@_helpers/math";
import { AnyToString } from "@_helpers/string";
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { Dream, DreamDto, DreamMode, DreamMood, DreamStatus, DreamType, SearchDream, SearchRequestDream } from "@_models/dream";
import { ClosestHeightName, DreamMap, DreamMapCameraPosition, DreamMapCeilDto, DreamMapDto, DreamMapSettings, ReliefType, Water } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { clamp, random } from "@akb2/math";
import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Noise } from "noisejs";
import { Observable, Subject, of } from "rxjs";
import { concatMap, map, switchMap, take, takeUntil } from "rxjs/operators";
import { Settings3DService } from "./3d/settings-3d.service";

@Injectable({
  providedIn: "root"
})

export class DreamService implements OnDestroy {
  private readonly localStorageTtl = 60 * 60 * 24 * 365;
  private dreamMapSettingsLocalStorageKey = "dream_map-settings";

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
  getDefaultCamera(width = this.settings3DService.mapSize, height = this.settings3DService.mapSize): DreamMapCameraPosition {
    return {
      target: {
        x: 0,
        y: ((this.settings3DService.ceilSize / this.settings3DService.ceilParts) * this.settings3DService.maxHeight),
        z: 0,
      },
      position: {
        x: 0,
        y: 0,
        z: -(height * this.settings3DService.ceilSize) / 2,
      }
    };
  }

  // Настройки редактора карт
  get getDreamMapSettings(): DreamMapSettings {
    return LocalStorageGet(
      this.dreamMapSettingsLocalStorageKey,
      settings => ({
        detalization: clamp(ParseInt(settings?.detalization), DreamObjectElmsValues.Awesome, DreamObjectElmsValues.VeryLow),
        shadowQuality: ParseInt(settings?.shadowQuality)
      })
    );
  }

  // Сведения о владельце сновидения
  private getDreamUsers(userIds: number[], userId = 0): Observable<User[]> {
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

  // Генерация сида
  private get newSeed(): number {
    const maxSeed = Math.pow(2, 16);
    // Новый сид
    return random(1, maxSeed);
  }



  constructor(
    private accountService: AccountService,
    private httpClient: HttpClient,
    private apiService: ApiService,
    private settings3DService: Settings3DService
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
  getById(id: number, edit = true, codes: string[] = []): Observable<Dream> {
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
      switchMap(
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
    const dreamMap = JsonDecode<DreamMapDto>(dreamDto?.map);
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
    // Итоговый массив
    return {
      id: ParseInt(dreamDto.id),
      user: null,
      createDate: AnyToDate(dreamDto?.createDate),
      title: AnyToString(dreamDto?.title),
      date: AnyToDate(dreamDto?.date),
      description: dreamDto.description,
      mode: (dreamDto?.mode as DreamMode) ?? DreamMode.mixed,
      status: (dreamDto?.status as DreamStatus) ?? DreamStatus.private,
      type: (dreamDto?.type as DreamType) ?? DreamType.Simple,
      mood: (dreamDto?.mood as DreamMood) ?? DreamMood.Nothing,
      keywords,
      places: null,
      members: null,
      text: AnyToString(dreamDto?.text),
      interpretation: AnyToString(dreamDto.interpretation),
      map: this.dreamMapConverter(dreamMap),
      headerType: (dreamDto?.headerType as NavMenuType) ?? NavMenuType.short,
      headerBackground: BackgroundImageDatas.find(b => b.id === dreamDto.headerBackgroundId)
    };
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
    if (!!dreamMapDto) {
      const width = ParseInt(dreamMapDto?.size?.width, this.settings3DService.mapSize);
      const height = ParseInt(dreamMapDto?.size?.height, this.settings3DService.mapSize);
      const defaultCamera: DreamMapCameraPosition = this.getDefaultCamera(width, height);
      const ocean: Water = {
        z: ParseInt(dreamMapDto?.ocean?.z, this.settings3DService.waterDefaultHeight),
        material: ParseInt(dreamMapDto?.ocean?.material, 1)
      };
      const noiseSeed = ParseInt(dreamMapDto?.noiseSeed, this.newSeed);
      // Вернуть объект
      return {
        size: {
          width: ParseInt(dreamMapDto?.size?.width, this.settings3DService.mapSize),
          height: ParseInt(dreamMapDto?.size?.height, this.settings3DService.mapSize),
          zHeight: ParseInt(dreamMapDto?.size?.zHeight, this.settings3DService.height)
        },
        ceils: dreamMapDto.ceils.map(c => ({
          place: null,
          terrain: ParseInt(c?.terrain, this.settings3DService.skyTime),
          object: ParseInt(c?.object, 0),
          coord: {
            ...c.coord,
            originalZ: c.coord.z
          }
        })),
        camera: {
          target: {
            x: ParseFloat(dreamMapDto?.camera?.target?.x, defaultCamera.target.x, 16),
            y: ParseFloat(dreamMapDto?.camera?.target?.y, defaultCamera.target.y, 16),
            z: ParseFloat(dreamMapDto?.camera?.target?.z, defaultCamera.target.z, 16),
          },
          position: {
            x: ParseFloat(dreamMapDto?.camera?.position?.x, defaultCamera.position.x, 16),
            y: ParseFloat(dreamMapDto?.camera?.position?.y, defaultCamera.position.y, 16),
            z: ParseFloat(dreamMapDto?.camera?.position?.z, defaultCamera.position.z, 16),
          }
        },
        sky: {
          time: ParseInt(dreamMapDto?.sky?.time, this.settings3DService.skyTime)
        },
        dreamerWay: dreamMapDto.dreamerWay,
        ocean,
        relief: {
          types: ClosestHeightNames.reduce((o, name) => ({
            ...o,
            [name as ClosestHeightName]: dreamMapDto?.relief?.types?.[name] ?? ReliefType.flat
          }), {})
        },
        isNew: false,
        noiseSeed,
        noise: new Noise(noiseSeed),
        land: null
      };
    }
    // Карта по умолчанию
    else {
      const noiseSeed = this.newSeed;
      // Карта
      return {
        size: {
          width: this.settings3DService.mapSize,
          height: this.settings3DService.mapSize,
          zHeight: this.settings3DService.height
        },
        camera: this.getDefaultCamera(),
        ceils: [],
        dreamerWay: [],
        ocean: {
          z: this.settings3DService.waterDefaultHeight,
          material: 1
        },
        land: {
          type: this.settings3DService.terrain,
          z: this.settings3DService.height
        },
        sky: {
          time: this.settings3DService.skyTime
        },
        relief: {
          types: ClosestHeightNames.reduce((o, name) => ({ ...o, [name as ClosestHeightName]: ReliefType.flat }), {})
        },
        isNew: true,
        noiseSeed,
        noise: new Noise(noiseSeed)
      };
    }
  }

  // Очистка карты от лишних данных
  cleanMap(dreamMap: DreamMap): DreamMapDto {
    const ceils: DreamMapCeilDto[] = dreamMap.ceils
      .filter(c => !(
        !c.object &&
        (!c.terrain || c.terrain === this.settings3DService.terrain /* || c.water === null || c.water.z <= c.coord.originalZ */) &&
        c.coord.originalZ === this.settings3DService.height
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
        if (!!c.terrain && c.terrain !== this.settings3DService.terrain) ceil.terrain = c.terrain;
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
      relief: dreamMap.relief,
      noiseSeed: ParseInt(dreamMap?.noiseSeed, this.newSeed)
    };
  }
}
