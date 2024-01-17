package ru.akb2.dreams_diary.services

import android.content.Context
import kotlinx.serialization.Serializable
import ru.akb2.dreams_diary.datas.ApiCode

class AuthService(context: Context) {
    private var apiService: ApiService = ApiService()
    private var tokenService: TokenService

    init {
        tokenService = TokenService(context)
    }

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
}

@Serializable
data class AuthOutputData(
    val token: String,
    val result: Boolean,
    val activateIsAvail: Boolean,
    val id: Int
)