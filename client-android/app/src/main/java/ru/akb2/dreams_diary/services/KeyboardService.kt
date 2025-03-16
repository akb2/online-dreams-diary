package ru.akb2.dreams_diary.services

import android.app.Activity
import android.content.Context
import android.view.inputmethod.InputMethodManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class KeyboardService @Inject constructor() {
    /**
     * Скрыть виртуальную клавиатуру Android
     * */
    fun closeKeyboard(activity: Activity) {
        val inputMethodManager =
            activity.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        val currentFocusedView = activity.currentFocus
        // Проверка наличия фокуса
        if (currentFocusedView != null) {
            inputMethodManager.hideSoftInputFromWindow(currentFocusedView.windowToken, 0)
        }
    }
}