package ru.akb2.dreams_diary.activities

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import ru.akb2.dreams_diary.datas.ApiCode
import ru.akb2.dreams_diary.datas.AuthType
import ru.akb2.dreams_diary.datas.DefaultAuthActivity
import ru.akb2.dreams_diary.datas.DefaultNotAuthActivity
import ru.akb2.dreams_diary.services.AuthService
import ru.akb2.dreams_diary.services.TokenService

open class BaseActivity : AppCompatActivity() {
    open val authType = AuthType.ANYWAY
    open lateinit var mainLayout: View

    lateinit var tokenService: TokenService
    lateinit var authService: AuthService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Создать сервисы
        tokenService = TokenService(this)
        authService = AuthService(this)
    }

    override fun onStart() {
        super.onStart()
        // Проверка авторизации
        checkTokenValidity()
    }

    /**
     * Сделать кнопки управления внизу устройства темными
     * */
    fun setDarkNavigationIconsColor() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.decorView.windowInsetsController?.setSystemBarsAppearance(
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
        }
        // Для более старых версий Android
        else {
            @RequiresApi(Build.VERSION_CODES.O)
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        }
    }

    /**
     * Проверка авторизации
     * */
    private fun checkTokenValidity() {
        lifecycleScope.launch {
            mainLayout.visibility = View.GONE
            // Проверка авторизации
            val isAuthed = tokenService.isAuth()
            val isNeedToCheck = tokenService.isNeedToCheckToken()
            val isValidToken = if (isAuthed)
                if (isNeedToCheck)
                    authService.checkToken() === ApiCode.SUCCESS else
                    true else
                false
            val isValidAuth = isAuthed && isValidToken
            val isAuth = authType === AuthType.AUTH && isValidAuth
            val isNotAuth = authType === AuthType.NOT_AUTH && !isValidAuth
            val isAnyWay = authType === AuthType.ANYWAY
            // Редирект
            if (!isAnyWay && !isAuth && !isNotAuth) {
                startActivity(
                    Intent(
                        this@BaseActivity,
                        if (isValidAuth) DefaultAuthActivity else DefaultNotAuthActivity
                    )
                )
                finish()
            }
            // Показать содержимое
            else {
                mainLayout.visibility = View.VISIBLE
            }
        }
    }
}