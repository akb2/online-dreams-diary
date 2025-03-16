package ru.akb2.dreams_diary.activities

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import ru.akb2.dreams_diary.R
import ru.akb2.dreams_diary.components.ToolbarMenu
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

    open lateinit var baseActivityLayoutView: DrawerLayout
    open lateinit var mainLayoutView: LinearLayout
    open lateinit var toolbarMenuView: ToolbarMenu

    @Inject
    lateinit var userService: UserService

    @Inject
    lateinit var tokenService: TokenService

    @Inject
    lateinit var authService: AuthService

    val isLeftMenuAvail: Boolean
        get() = toolbarMenuView.backActivity === null

    val isLeftMenuOpen
        get() = baseActivityLayoutView.isDrawerOpen(GravityCompat.START)

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_base)

        baseActivityLayoutView = findViewById(R.id.baseActivityLayout)
        mainLayoutView = findViewById(R.id.mainLayout)
        toolbarMenuView = findViewById(R.id.toolbarMenu)

        setDarkNavigationIconsColor()
    }

    override fun onStart() {
        super.onStart()
        // События
        menuButtonClickListener()
        checkTokenValidity()
    }

    /**
     * Устанавливает разметку дочерней Activity
     */
    protected fun setActivityLayout(layoutResID: Int) {
        val contentContainer = findViewById<FrameLayout>(R.id.activityContainer)

        layoutInflater.inflate(layoutResID, contentContainer, true)
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

    /**
     * Прослушивание нажатий кнопки меню
     */
    private fun menuButtonClickListener() {
        toolbarMenuView.menuButtonView.setOnClickListener {
            openLeftMenu()
        }
    }

    /**
     * Открыть меню слева
     */
    private fun openLeftMenu() {
        if (isLeftMenuAvail && !isLeftMenuOpen) {
            baseActivityLayoutView.openDrawer(GravityCompat.START)
        }
    }
}
