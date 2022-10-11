import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@_environments/environment";
import { User } from "@_models/account";
import { ApiResponse, Search } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamDto, DreamMode, DreamStatus } from "@_models/dream";
import { DreamMap, DreamMapCameraPosition, DreamMapCeilDto, DreamMapDto, MapTerrains, Water, WaterType, WorldLand } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { TokenService } from "@_services/token.service";
import { forkJoin, Observable, of } from "rxjs";
import { map, mergeMap, switchMap, tap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class DreamService {


  private baseUrl: string = environment.baseUrl;

  private user: User;





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
  private getDefaultCamera(width: number = DreamMapSize, height: number = DreamMapSize): DreamMapCameraPosition {
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





  constructor(
    private accountService: AccountService,
    private httpClient: HttpClient,
    private apiService: ApiService,
    private tokenService: TokenService
  ) {
    this.user = this.accountService.getCurrentUser();
    // Подписка на актуальные сведения о пользователе
    this.accountService.user$.subscribe(user => this.user = user);
  }





  // Список сновидений
  search(search: SearchDream, codes: string[] = []): Observable<Search<Dream>> {
    const url: string = this.baseUrl + "dream/getList";
    let count: number = 0;
    let limit: number = 0;
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(url, this.tokenService.getHttpHeader(search, "search_")).pipe(
      switchMap(result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
        of(result.result.data) :
        this.apiService.checkResponse(result.result.code, codes)
      ),
      tap(r => {
        count = r.count ?? 0;
        limit = r.limit ?? 0;
      }),
      mergeMap(
        ({ dreams }: any) => {
          if (dreams?.length > 0) {
            const users: number[] = Array.from(new Set(dreams.map((dream: DreamDto) => dream.userId)));
            // Найдены уникальные ID пользователей
            return forkJoin(users.map(u => !!this.user && u === this.user.id ? of(this.user) : this.accountService.getUser(u)));
          }
          // Не искать пользователей
          return of([]);
        },
        ({ dreams }: any, users: User[]) => ({ dreams: dreams as DreamDto[], users })
      ),
      map(({ dreams, users }) => dreams?.length > 0 ? dreams.map(d => ({
        ...this.dreamConverter(d as DreamDto),
        user: users.find(u => u.id === d.userId)!
      })) : []),
      mergeMap((result: Dream[]) => of({ count, result, limit }))
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
    return this.httpClient.get<ApiResponse>(url, this.tokenService.getHttpHeader(params)).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(result.result.data) :
          this.apiService.checkResponse(result.result.code, codes)
      ),
      mergeMap(
        (d: DreamDto) => !!this.user && d.userId === this.user.id ? of(this.user) : this.accountService.getUser(d.userId),
        (dreamDto, user) => ({ dreamDto, user })
      ),
      map(({ dreamDto, user }) => ({ ...this.dreamConverter(dreamDto), user })),
    );
  }

  // Сохранить сновидение
  save(dream: Dream, codes: string[] = []): Observable<number> {
    const url: string = this.baseUrl + "dream/save";
    const formData: FormData = new FormData();
    Object.entries(this.dreamConverterDto(dream)).map(([k, v]) => formData.append(k, v));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(url, formData, this.tokenService.getHttpHeader()).pipe(
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
    return this.httpClient.delete<ApiResponse>(url, this.tokenService.getHttpHeader(params)).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(code => code === result.result.code) ?
          of(!!result.result.data.isDelete) :
          this.apiService.checkResponse(result.result.code, codes)
      )
    );
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
    // Преобразование карты
    if (dreamMapDto) {
      const width: number = dreamMapDto.size.width ?? DreamMapSize;
      const height: number = dreamMapDto.size.height ?? DreamMapSize;
      const defaultCamera: DreamMapCameraPosition = this.getDefaultCamera(width, height);
      const ocean: Water = {
        type: dreamMapDto?.ocean?.type ?? WaterType.pool,
        z: dreamMapDto?.ocean?.z ?? DreamWaterDefHeight,
        material: dreamMapDto?.ocean?.material ?? 1
      };
      const land: WorldLand = {
        type: dreamMapDto?.land?.type ?? DreamTerrain,
        z: dreamMapDto?.land?.z ?? DreamDefHeight
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
          object: null,
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
        land
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
          type: WaterType.pool,
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
        if (!!c.object) ceil.object = c.object.id;
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
      land: dreamMap.land,
      sky: dreamMap.sky,
    };
  }
}





// Поиск: входящие данные
export interface SearchDream {
  page?: number;
  user?: number;
  limit?: number;
  status?: DreamStatus;
}





// Размер карты по умолчанию
export const DreamMapSize: number = 80;

// Размер ячейки по умолчанию
export const DreamCeilSize: number = 1;

// Количество секций по высоте в одной ячейке
export const DreamCeilParts: number = 64;

// Количество секций по высоте воды в одной ячейке
export const DreamCeilWaterParts: number = 1;

// Время для положения небесных тел по умолчанию
// * 0-360 соответствует времени 00:00 - 23:59
export const DreamSkyTime: number = 130;

// Пределы высот
export const DreamMinHeight: number = 1;
export const DreamDefHeight: number = DreamCeilParts * 10;
export const DreamMaxHeight: number = DreamCeilParts * 20;
export const DreamWaterDefHeight: number = DreamCeilParts * 9;

// Вода по умолчанию
export const DreamWater: Water = {
  z: 0,
  type: WaterType.pool,
  material: 0
};

// Параметры по умолчанию
export const DreamSkyType: number = 1;
export const DreamTerrain: number = MapTerrains[0].id;

// Заголовок по умолчанию
export const DreamTitle: string = "*** Новое сновидение ***";
export const DreamDescription: string = "*** Без описания ***";

// Настройки камеры
export const DreamCameraMinZoom: number = DreamCeilSize;
export const DreamCameraMaxZoom: number = DreamCeilSize * DreamMaxHeight / DreamCeilParts;
