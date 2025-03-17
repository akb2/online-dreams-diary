package ru.akb2.dreams_diary.store.reducers

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import ru.akb2.dreams_diary.store.actions.UserAction
import ru.akb2.dreams_diary.store.state.UserState
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserReducer @Inject constructor() {
    val state = MutableStateFlow(UserState())

    fun dispatch(action: UserAction) {
        when (action) {
            // Попытка загрузить данные с сервера
            is UserAction.LoadUser -> state.update {
                it.copy(isLoading = true)
            }
            // Получены данные с сервера
            is UserAction.UserLoaded -> state.update {
                it.copy(user = action.user, isLoading = false)
            }
            // Ошибка получения данных с сервера
            is UserAction.Error -> state.update {
                it.copy(error = action.message, isLoading = false)
            }

            else -> {}
        }
    }
}