package ru.akb2.dreams_diary.activities

import android.os.Bundle
import androidx.activity.viewModels
import dagger.hilt.android.AndroidEntryPoint
import ru.akb2.dreams_diary.R
import ru.akb2.dreams_diary.datas.AuthType
import ru.akb2.dreams_diary.store.view_model.UserViewModel

@AndroidEntryPoint
class DiaryActivity : BaseActivity() {
    override val authType = AuthType.AUTH

    private val userViewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_diary)
        // Настройка активности
        setDarkNavigationIconsColor()
        fillData()
    }

    /**
     * Заполнение свойств класса
     * */
    private fun fillData() {
        mainLayout = findViewById(R.id.mainLayout)
    }

    /**
     * Прослушивание данных о пользователе
     */
}