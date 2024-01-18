package ru.akb2.dreams_diary.services

import android.content.Context
import ru.akb2.dreams_diary.datas.DateFormater
import java.util.Date

class TokenService(context: Context) {
    private val sharedPreferences =
        context.getSharedPreferences("AuthPreferences", Context.MODE_PRIVATE)

    /**
     * Интервал необходимости проверки актуальности токена
     * Значение указывается в секундах
     * */
    private val tokenNeedCheckInterval = 300

    companion object {
        private const val KEY_USER_ID = "userId"
        private const val KEY_AUTH_TOKEN = "authToken"
        private const val KEY_LAST_CHECK = "authTokenLastCheck"
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
            putString(KEY_LAST_CHECK, DateFormater.format(Date()))
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
     * Получить дату последней проверки актуальности токена
     * */
    private fun getLastCheckDate(): Date {
        val stringDate = sharedPreferences.getString(KEY_LAST_CHECK, "") ?: ""
        val defaultDate = Date(0)
        // Вернуть дату
        return if (stringDate.isNotEmpty())
            DateFormater.parse(stringDate) ?: defaultDate else
            defaultDate
    }

    /**
     * Требуется ли проверка токена
     * */
    fun isNeedToCheckToken(): Boolean {
        if (isAuth()) {
            val lastCheckDate = getLastCheckDate()
            val currentTime = Date()
            val differenceInMillis = currentTime.time - lastCheckDate.time

            return differenceInMillis > tokenNeedCheckInterval * 1000
        }
        // Пользователь неавторизован
        return false
    }

    /**
     * Предварительная проверка существования данных авторизации
     * */
    fun isAuth(): Boolean {
        return getAuthToken().isNotEmpty() && getUserId() > 0
    }

    /**
     * Очистить данные авторизации
     * */
    fun clearAuthData() {
        sharedPreferences.edit().clear().apply()
    }
}