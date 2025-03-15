package ru.akb2.dreams_diary.activities

import android.os.Build
import android.os.Bundle
import androidx.activity.viewModels
import androidx.annotation.RequiresApi
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import ru.akb2.dreams_diary.R
import ru.akb2.dreams_diary.components.MainMenu
import ru.akb2.dreams_diary.datas.AuthType
import ru.akb2.dreams_diary.store.view_model.UserViewModel

@AndroidEntryPoint
class DiaryActivity : BaseActivity() {
    override val authType = AuthType.AUTH

    private val userViewModel: UserViewModel by viewModels()

    private lateinit var mainMenuView: MainMenu

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_diary)
        // Настройка активности
        setDarkNavigationIconsColor()
        fillData()
        userDataListen()
    }

    /**
     * Заполнение свойств класса
     * */
    private fun fillData() {
        mainMenuView = findViewById(R.id.toolbar)
        mainLayoutView = findViewById(R.id.mainLayout)
    }

    /**
     * Прослушивание данных о пользователе
     */
    private fun userDataListen() {
        lifecycleScope.launch {
            userViewModel.state.collect { state ->
                val title = if (state.isLoading)
                    getString(R.string.loading)
                else if (state.user !== null)
                    "${state.user.name} ${state.user.lastName}"
                else
                    getString(R.string.user_no_name)

                mainMenuView.setToolbarTitle(title)
            }
        }
    }
}