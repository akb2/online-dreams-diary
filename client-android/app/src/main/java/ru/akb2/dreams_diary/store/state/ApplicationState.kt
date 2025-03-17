package ru.akb2.dreams_diary.store.state

import android.app.Activity

data class ApplicationState(
    val backButtonActivity: Class<out Activity>? = null,
    val activityLoader: Boolean = false
)