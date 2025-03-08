package ru.akb2.dreams_diary.services

import android.content.Context
import android.util.Log
import ru.akb2.dreams_diary.datas.ApiCode
import ru.akb2.dreams_diary.datas.User

class UserService(context: Context) {
    private val apiService = ApiService(context)

    /**
     * Загрузска сведений о пользователе по ID
     * @param id Идентификатор пользователя
     */
    suspend fun updateFromServerById(id: Int): ApiCode {
        var code = ApiCode.UNDEFINED
        val getFromServerByIdRequest = apiService.get<User>(
            "account", "getUser", mapOf(
                "id" to id.toString()
            )
        )
        // Получен ответ
        if (getFromServerByIdRequest !== null) {
            code = getFromServerByIdRequest.result.code
            // Сохранить сведения о пользователе
            if (code === ApiCode.SUCCESS) {
                Log.i("akb2_test", getFromServerByIdRequest.result.data.toString())
            }
        }
        // Пользователь не найден
        return code
    }
}