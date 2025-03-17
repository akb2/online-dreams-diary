package ru.akb2.dreams_diary.activities

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.activity.viewModels
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
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
import ru.akb2.dreams_diary.store.actions.ApplicationAction
import ru.akb2.dreams_diary.store.view_model.ApplicationViewModel
import javax.inject.Inject

@AndroidEntryPoint
open class BaseActivity : AppCompatActivity() {
    open val authType = AuthType.ANYWAY

    @Inject
    lateinit var userService: UserService

    @Inject
    lateinit var tokenService: TokenService

    @Inject
    lateinit var authService: AuthService

    protected val applicationViewModel: ApplicationViewModel by viewModels()

    private var isLeftMenuAvail = false

    protected lateinit var baseActivityLayoutView: DrawerLayout
    private lateinit var mainLayoutView: LinearLayout
    protected lateinit var toolbarMenuView: ToolbarMenu
    private lateinit var activityLoaderView: LinearLayout

    private val isLeftMenuOpen
        get() = baseActivityLayoutView.isDrawerOpen(GravityCompat.START)

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_base)

        baseActivityLayoutView = findViewById(R.id.baseActivityLayout)
        mainLayoutView = findViewById(R.id.mainLayout)
        toolbarMenuView = findViewById(R.id.toolbarMenu)
        activityLoaderView = findViewById(R.id.activityLoader)

        applicationViewModel.dispatch(ApplicationAction.EnableGlobalLoader)
        applicationStoreListener()
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
     * Проверка авторизации
     * */
    private fun checkTokenValidity() {
        lifecycleScope.launch {
            applicationViewModel.dispatch(ApplicationAction.EnableGlobalLoader)
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
                applicationViewModel.dispatch(ApplicationAction.DisableGlobalLoader)
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

    /**
     * Открыть меню слева
     */
    private fun closeLeftMenu() {
        if (isLeftMenuOpen) {
            baseActivityLayoutView.closeDrawer(GravityCompat.START)
        }
    }

    /**
     * Показать или скрыть лоадер
     * */
    private fun setLoaderState(showState: Boolean) {
        if (showState) {
            mainLayoutView.visibility = View.GONE
            activityLoaderView.visibility = View.VISIBLE
            setNavigationBarColor(R.color.primary_500, true)
        }
        // Скрыть
        else {
            mainLayoutView.visibility = View.VISIBLE
            activityLoaderView.visibility = View.GONE
            setNavigationBarColor(R.color.background, false)
        }
    }

    /**
     * Заблокировать или разблокировать меню слева
     */
    private fun setLeftMenuAvailability(availableState: Boolean) {
        val lockMode = if (availableState)
            DrawerLayout.LOCK_MODE_UNLOCKED
        else
            DrawerLayout.LOCK_MODE_LOCKED_CLOSED

        if (!availableState) {
            closeLeftMenu()
        }

        isLeftMenuAvail = availableState
        baseActivityLayoutView.setDrawerLockMode(lockMode, GravityCompat.START)
    }

    /**
     * Установить цвет нижней панели
     */
    @Suppress("DEPRECATION")
    private fun setNavigationBarColor(color: Int, lightIcons: Boolean) {
        // Android 11+ (API 30+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val iconMode = if (lightIcons)
                0
            else
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS

            window.navigationBarColor = getColor(color)
            window.setNavigationBarContrastEnforced(false)

            window.insetsController?.setSystemBarsAppearance(
                iconMode,
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
        }
        // Android 8-10 (API 26-29)
        else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val decorView = window.decorView
            val flags = decorView.systemUiVisibility
            val iconMode = if (lightIcons)
                flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            else
                flags and View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()


            window.navigationBarColor = ContextCompat.getColor(this, color)
            decorView.systemUiVisibility = iconMode
        }
        // Android 6-7 (API 23-25), без изменения иконок, но можно задать цвет
        else {
            window.navigationBarColor = ContextCompat.getColor(this, color)
        }
    }

    /**
     * Прослушивание данных стора
     */
    private fun applicationStoreListener() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    applicationViewModel.state.collect { state ->
                        // Лоадер
                        setLoaderState(state.activityLoader)
                        // Активность для кнопки назад
                        toolbarMenuView.setBackActivity(state.backButtonActivity)
                    }
                }
                // Доступность меню слева
                launch {
                    applicationViewModel.isLeftMenuAvailable.collect { isAvailable ->
                        setLeftMenuAvailability(isAvailable)
                    }
                }
            }
        }
    }
}
