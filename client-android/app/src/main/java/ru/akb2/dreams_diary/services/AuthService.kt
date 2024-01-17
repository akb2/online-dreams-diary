package ru.akb2.dreams_diary.services

import kotlinx.serialization.Serializable
import ru.akb2.dreams_diary.datas.ApiCode

class AuthService {
    companion object {
        suspend fun auth(login: String, password: String): ApiCode {
            var code = ApiCode.UNDEFINED
            val authRequest = ApiService.post<AuthOutputData>(
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
                }
            }
            // Неизвестная ошибка
            return code
        }
    }
}

@Serializable
data class AuthOutputData(
    val token: String,
    val result: Boolean,
    val activateIsAvail: Boolean,
    val id: Int
)