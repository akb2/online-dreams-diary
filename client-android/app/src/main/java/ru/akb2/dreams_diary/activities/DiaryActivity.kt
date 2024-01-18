package ru.akb2.dreams_diary.activities

import android.os.Bundle
import ru.akb2.dreams_diary.R
import ru.akb2.dreams_diary.datas.AuthType

class DiaryActivity : BaseActivity() {
    override val authType = AuthType.AUTH

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
}