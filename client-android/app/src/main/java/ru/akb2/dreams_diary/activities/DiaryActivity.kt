package ru.akb2.dreams_diary.activities

import android.os.Bundle
import androidx.activity.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import ru.akb2.dreams_diary.R
import ru.akb2.dreams_diary.datas.AuthType
import ru.akb2.dreams_diary.store.actions.ApplicationAction
import ru.akb2.dreams_diary.store.view_model.UserViewModel

@AndroidEntryPoint
class DiaryActivity : BaseActivity() {
    override val authType = AuthType.AUTH

    private val userViewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Шаблон
        setActivityLayout(R.layout.activity_diary)
        fillData()
        // Настройка активности
        userStoreListener()
    }

    /**
     * Заполнение свойств класса
     * */
    private fun fillData() {
        toolbarMenuView.setTitle(R.string.user_no_name)
        toolbarMenuView.setSubTitle(R.string.activity_diary_sub_title)
        toolbarMenuView.setIcon(R.drawable.round_book_48)
        applicationViewModel.dispatch(ApplicationAction.RemoveBackButtonActivity)
    }

    /**
     * Прослушивание данных о пользователе
     */
    private fun userStoreListener() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    userViewModel.state.collect { state ->
                        if (!state.isLoading) {
                            applicationViewModel.dispatch(ApplicationAction.DisableGlobalLoader)
                        }

                        val title = if (state.isLoading)
                            getString(R.string.loading)
                        else if (state.user !== null)
                            "${state.user.name} ${state.user.lastName}"
                        else
                            getString(R.string.user_no_name)

                        toolbarMenuView.setTitle(title)
                    }
                }
            }
        }
    }
}