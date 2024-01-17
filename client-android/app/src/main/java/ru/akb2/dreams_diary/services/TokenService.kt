package ru.akb2.dreams_diary.services

import android.content.Context

class TokenService(context: Context) {
    private val sharedPreferences =
        context.getSharedPreferences("AuthPreferences", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_USER_ID = "userId"
        private const val KEY_AUTH_TOKEN = "authToken"
    }

    /**
     * Сохранить данные авторизации пользователя
     * @param userId Идентификатор пользователя
     * @param authToken Токен авторизации
     * */
    fun saveAuthData(userId: Int, authToken: String) {
        sharedPreferences.edit().apply {
            putString(KEY_USER_ID, userId.toString())
            putString(KEY_AUTH_TOKEN, authToken)
            apply()
        }
    }

    /**
     * Получить идентификатор пользователя
     * */
    fun getUserId(): Int {
        return sharedPreferences.getString(KEY_USER_ID, null)?.toInt() ?: 0
    }

    /**
     * Получить токен авторизации
     * */
    fun getAuthToken(): String {
        return sharedPreferences.getString(KEY_AUTH_TOKEN, "") ?: ""
    }

    /**
     * Очистить данные авторизации
     * */
    fun clearAuthData() {
        sharedPreferences.edit().clear().apply()
    }
}