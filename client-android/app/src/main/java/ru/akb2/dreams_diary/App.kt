package ru.akb2.dreams_diary

import android.app.Application
import ru.akb2.dreams_diary.services.TokenService

class App : Application() {
    private lateinit var tokenService: TokenService

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