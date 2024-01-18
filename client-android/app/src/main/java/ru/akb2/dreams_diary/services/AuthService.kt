package ru.akb2.dreams_diary.services

import android.content.Context
import android.util.Log
import kotlinx.serialization.Serializable
import ru.akb2.dreams_diary.datas.ApiCode
import ru.akb2.dreams_diary.datas.TokenData
import ru.akb2.dreams_diary.datas.TokenDataSerializer

class AuthService(context: Context) {
    private val apiService: ApiService
    private val tokenService: TokenService

    init {
        apiService = ApiService(context)
        tokenService = apiService.tokenService
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

    /**
     * Проверка токена
     * */
    suspend fun checkToken(): ApiCode {
        var code = ApiCode.UNDEFINED
        Log.d("akb2_test", "test")
        val authRequest = apiService.get<CheckTokenOutputData>("token", "checkToken")
        // Получен ответ
        if (authRequest !== null) {
            code = authRequest.result.code
            // Удалить токен
            if (code !== ApiCode.SUCCESS) {
                tokenService.clearAuthData()
            }
        }
        // Очистить авторизацию
        else {
            tokenService.clearAuthData()
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

@Serializable
data class CheckTokenOutputData(
    val result: Boolean,
    @Serializable(with = TokenDataSerializer::class)
    val tokenData: TokenData
)