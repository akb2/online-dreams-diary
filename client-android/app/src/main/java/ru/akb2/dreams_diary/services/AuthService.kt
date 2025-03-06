package ru.akb2.dreams_diary.services

import android.content.Context
import ru.akb2.dreams_diary.datas.ApiCode
import ru.akb2.dreams_diary.datas.AuthOutputData
import ru.akb2.dreams_diary.datas.CheckTokenOutputData

class AuthService(context: Context) {
    private val apiService = ApiService(context)
    private val tokenService = apiService.tokenService

    /**
     * Авторизация на сервере
     * @param login Логин
     * @param password Пароль
     * */
    suspend fun auth(login: String, password: String): ApiCode {
        var code = ApiCode.UNDEFINED
        val authRequest = apiService.post<AuthOutputData>(
            "account", "auth", mapOf(
                "login" to login,
                "password" to password
            )
        )
        // Получен ответ
        if (authRequest !== null) {
            code = authRequest.result.code
            // Сохранить авторизацию
            if (code === ApiCode.SUCCESS) {
                tokenService.saveAuthData(
                    authRequest.result.data.id,
                    authRequest.result.data.token
                )
            }
        }
        // Неизвестная ошибка
        return code
    }

    /**
     * Проверка токена
     * */
    suspend fun checkToken(): ApiCode {
        var code = ApiCode.UNDEFINED
        val authRequest = apiService.get<CheckTokenOutputData>("token", "checkToken")
        // Получен ответ
        if (authRequest !== null) {
            val userId = tokenService.getUserId()
            val token = tokenService.getAuthToken()
            code = authRequest.result.code
            // Обновить или удалить данные о токене
            if (code === ApiCode.SUCCESS)
                tokenService.saveAuthData(userId, token)
            else
                tokenService.clearAuthData()
        }
        // Очистить авторизацию
        else {
            tokenService.clearAuthData()
        }
        // Неизвестная ошибка
        return code
    }
}