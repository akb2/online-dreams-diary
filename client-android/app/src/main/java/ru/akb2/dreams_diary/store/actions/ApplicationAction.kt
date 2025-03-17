package ru.akb2.dreams_diary.store.actions

import android.app.Activity

sealed class ApplicationAction {
    data class AddBackButtonActivity(val activity: Class<out Activity>) : ApplicationAction()
    data object RemoveBackButtonActivity : ApplicationAction()
    data object EnableGlobalLoader : ApplicationAction()
    data object DisableGlobalLoader : ApplicationAction()
}