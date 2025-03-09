package ru.akb2.dreams_diary

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import ru.akb2.dreams_diary.services.TokenService
import javax.inject.Inject

@HiltAndroidApp
class App : Application() {
    @Inject
    lateinit var tokenService: TokenService

    override fun onCreate() {
        super.onCreate()
        // Создать сервисы
        tokenService = TokenService(this)
        // Инициализация
        clearCheckInfo()
    }

    /**
     * Очистка сведений о проверках приложения для инициализации новых проверок
     */
    private fun clearCheckInfo() {
        tokenService.saveAuthDate(true)
    }
}