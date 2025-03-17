package ru.akb2.dreams_diary.store.view_model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import ru.akb2.dreams_diary.store.actions.ApplicationAction
import ru.akb2.dreams_diary.store.reducers.ApplicationReducer
import ru.akb2.dreams_diary.store.state.ApplicationState
import javax.inject.Inject

@HiltViewModel
class ApplicationViewModel @Inject constructor(
    private val reducer: ApplicationReducer
) : ViewModel() {
    val state: StateFlow<ApplicationState> = reducer.state

    val isLeftMenuAvailable: StateFlow<Boolean> = state
        .map { it.backButtonActivity === null && !it.activityLoader }
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    fun dispatch(action: ApplicationAction) {
        reducer.dispatch(action)
    }
}