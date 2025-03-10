package ru.akb2.dreams_diary.activities

import android.content.Intent
import android.os.Build
import android.view.View
import android.view.WindowInsetsController
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import ru.akb2.dreams_diary.datas.ApiCode
import ru.akb2.dreams_diary.datas.AuthType
import ru.akb2.dreams_diary.datas.DefaultAuthActivity
import ru.akb2.dreams_diary.datas.DefaultNotAuthActivity
import ru.akb2.dreams_diary.services.AuthService
import ru.akb2.dreams_diary.services.TokenService
import ru.akb2.dreams_diary.services.UserService
import javax.inject.Inject

@AndroidEntryPoint
open class BaseActivity : AppCompatActivity() {
    open val authType = AuthType.ANYWAY
    open lateinit var mainLayoutView: View

    @Inject
    lateinit var userService: UserService

    @Inject
    lateinit var tokenService: TokenService

    @Inject
    lateinit var authService: AuthService

    override fun onStart() {
        super.onStart()
        // Проверка авторизации
        checkTokenValidity()
    }

    /**
     * Сделать кнопки управления внизу устройства темными
     * */
    @RequiresApi(Build.VERSION_CODES.O)
    fun setDarkNavigationIconsColor() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.decorView.windowInsetsController?.setSystemBarsAppearance(
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
        }
        // Для более старых версий Android
        else {
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        }
    }

    /**
     * Проверка авторизации
     * */
    private fun checkTokenValidity() {
        lifecycleScope.launch {
            mainLayoutView.visibility = View.GONE
            // Проверка авторизации
            val isAuthed = tokenService.isAuth()
            val isNeedToCheck = tokenService.isNeedToCheckToken()
            var isValidToken = false
            // Проверка валидности токена
            if (isAuthed) {
                isValidToken = if (isNeedToCheck)
                    authService.checkToken() === ApiCode.SUCCESS
                else
                    true
            }
            // Загрузка сведений текущего пользователя
            if (isAuthed && isValidToken) {
                userService.updateFromServerById(tokenService.getUserId())
            }
            // Определение доступа
            val isValidAuth = isAuthed && isValidToken
            val isAuth = authType === AuthType.AUTH && isValidAuth
            val isNotAuth = authType === AuthType.NOT_AUTH && !isValidAuth
            val isAnyWay = authType === AuthType.ANYWAY
            // Показать содержимое
            if (isAnyWay || isAuth || isNotAuth) {
                mainLayoutView.visibility = View.VISIBLE
            }
            // Редирект
            else {
                startActivity(
                    Intent(
                        this@BaseActivity,
                        if (isValidAuth)
                            DefaultAuthActivity
                        else
                            DefaultNotAuthActivity
                    )
                )
                finish()
            }
        }
    }
}