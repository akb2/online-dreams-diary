package ru.akb2.dreams_diary.store.reducers

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import ru.akb2.dreams_diary.store.actions.ApplicationAction
import ru.akb2.dreams_diary.store.state.ApplicationState
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApplicationReducer @Inject constructor() {
    val state = MutableStateFlow(ApplicationState())

    fun dispatch(action: ApplicationAction) {
        when (action) {
            // Установить активность для кнопки назад
            is ApplicationAction.AddBackButtonActivity -> state.update {
                it.copy(backButtonActivity = action.activity)
            }
            // Удалить активность для кнопки назад
            is ApplicationAction.RemoveBackButtonActivity -> state.update {
                it.copy(backButtonActivity = null)
            }
            // Включить глобальный лоадер
            is ApplicationAction.EnableGlobalLoader -> state.update {
                it.copy(activityLoader = true)
            }
            // Выключить глобальный лоадер
            is ApplicationAction.DisableGlobalLoader -> state.update {
                it.copy(activityLoader = false)
            }

            else -> {}
        }
    }
}