import { environment } from "@_environments/environment";





// Получить полную ссылку на базовый домен приложения
export const GetBaseUrl = () => environment.baseUrl[window.location.hostname] ?? environment.baseUrl.default;

// Получить полную ссылку на Api домен приложения
export const GetBaseApiUrl = () => environment.baseApiUrl[window.location.hostname] ?? environment.baseApiUrl.default;
