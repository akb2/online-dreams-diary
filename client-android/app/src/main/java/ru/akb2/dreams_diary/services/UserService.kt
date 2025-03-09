package ru.akb2.dreams_diary.services

import ru.akb2.dreams_diary.datas.ApiCode
import ru.akb2.dreams_diary.datas.User
import ru.akb2.dreams_diary.store.actions.UserAction
import ru.akb2.dreams_diary.store.reducers.UserReducer
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserService @Inject constructor(
    private val userReducer: UserReducer,
    private val apiService: ApiService
) {
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
                userReducer.dispatch(UserAction.UserLoaded(getFromServerByIdRequest.result.data))
            }
        }
        // Пользователь не найден
        return code
    }
}