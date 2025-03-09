package ru.akb2.dreams_diary.store.view_model

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import ru.akb2.dreams_diary.store.actions.UserAction
import ru.akb2.dreams_diary.store.effects.UserEffects
import ru.akb2.dreams_diary.store.reducers.UserReducer
import ru.akb2.dreams_diary.store.state.UserState
import javax.inject.Inject

@HiltViewModel
class UserViewModel @Inject constructor(
    private val reducer: UserReducer,
    private val effects: UserEffects
) : ViewModel() {
    val state: StateFlow<UserState> = reducer.state

    fun dispatch(action: UserAction) {
        reducer.dispatch(action)
    }
}