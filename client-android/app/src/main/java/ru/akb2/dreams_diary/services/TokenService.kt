package ru.akb2.dreams_diary.services

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import ru.akb2.dreams_diary.datas.DateFormater
import java.util.Date
import javax.crypto.AEADBadTagException
import javax.inject.Inject
import javax.inject.Singleton

@SuppressLint("CommitPrefEdits")
@Singleton
class TokenService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey
        .Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = context.getSharedPreferences(
        KEY_PREFERENCES_NAME,
        Context.MODE_PRIVATE
    )

    private val encryptedSharedPreferences: SharedPreferences

    /**
     * Интервал необходимости проверки актуальности токена
     * Значение указывается в секундах
     * */
    private val tokenNeedCheckInterval = 180

    companion object {
        private const val KEY_USER_ID = "userId"
        private const val KEY_AUTH_TOKEN = "authToken"
        private const val KEY_LAST_CHECK = "authTokenLastCheck"
        private const val KEY_PREFERENCES_NAME = "AuthPreferences"
    }

    init {
        encryptedSharedPreferences = try {
            getEncryptedSharedPreferences()
        } catch (e: AEADBadTagException) {
            Log.e("TokenService", "Encryption error, clear encryption data", e)
            sharedPreferences.edit().clear().apply()
            getEncryptedSharedPreferences()
        }
    }

    /**
     * Сохранить данные авторизации пользователя
     * @param userId Идентификатор пользователя
     * @param authToken Токен авторизации
     * */
    fun saveAuthData(userId: Int, authToken: String) {
        sharedPreferences
            .edit()
            .putInt(KEY_USER_ID, userId)
            .apply()
        encryptedSharedPreferences
            .edit()
            .putString(KEY_AUTH_TOKEN, authToken)
            .apply()

        saveAuthDate(false)
    }

    /**
     * Обновить дату последней проверки
     * @param clear При значении TRUE очищает дату проверки
     * */
    fun saveAuthDate(clear: Boolean = false) {
        val date = if (clear)
            Date(0)
        else
            Date()

        sharedPreferences
            .edit()
            .putString(KEY_LAST_CHECK, DateFormater.format(date))
            .apply()
    }

    /**
     * Получить идентификатор пользователя
     * */
    fun getUserId(): Int {
        return sharedPreferences.getInt(KEY_USER_ID, 0)
    }

    /**
     * Получить токен авторизации
     * */
    fun getAuthToken(): String {
        return encryptedSharedPreferences.getString(KEY_AUTH_TOKEN, "") ?: ""
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
     * Получить зашифрованный экземпляр Shared Preferences
     */
    private fun getEncryptedSharedPreferences(): SharedPreferences {
        return EncryptedSharedPreferences.create(
            context,
            KEY_PREFERENCES_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
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
        encryptedSharedPreferences.edit().clear().apply()
    }
}