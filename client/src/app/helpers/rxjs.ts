import { CreateArray } from "@_datas/app";
import { ceil } from "@akb2/math";
import { Observable, concatMap, map, mergeMap, of, skipWhile, take, takeWhile, timer } from "rxjs";
import { CheckInRange } from "./math";





// Подписка ожидания условия
export const WaitObservable = (callback: () => boolean, limit: number = Infinity): Observable<void> => timer(0, 50).pipe(
  takeWhile(i => callback() && i < limit, true),
  skipWhile(i => callback() && i < limit),
  map(() => { })
);

// RXJS цикл
export const TakeCycle = (limit: number, grouping: number = 1, delayTime: number = 1): Observable<number> => timer(delayTime, delayTime).pipe(
  take(ceil(limit / grouping)),
  mergeMap(n => {
    const before: number = n * grouping;
    const length: number = CheckInRange(grouping, limit - before);
    const group: number[] = CreateArray(length).map(i => before + i);
    // Вернуть группу
    return of(...group);
  })
);

// Последовательные запросы из массива
export const ConsistentResponses = <T>(requests: Observable<T>[]): Observable<T[]> => requests.reduce(
  (accObservable, currentObservable) => accObservable.pipe(
    concatMap((results) => currentObservable.pipe(
      concatMap((result) => of([...results, result]))
    )),
  ),
  of([] as T[])
);
