package ru.akb2.dreams_diary.helpers

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import com.google.android.material.snackbar.Snackbar
import ru.akb2.dreams_diary.R

class SnackBarService(private val context: Context, private val view: View) {
    private val defaultDuration = Snackbar.LENGTH_SHORT

    /**
     * Получить идентификатор ресурса по названию
     * @param resourceKey Название ресурса
     * */
    @SuppressLint("DiscouragedApi")
    private fun getResourceId(resourceKey: String): Int =
        context.resources.getIdentifier(
            resourceKey,
            "string",
            context.packageName
        )

    /**
     * Получить текст перевода по ид
     * @param resourceId Идентификатор ресурса
     * */
    private fun getMessage(resourceId: Int): String {
        if (resourceId != 0) {
            return context.getString(resourceId)
        }
        // Пустое сообщение
        return "";
    }

    /**
     * Уведомление об ошибке
     * @param resourceKey Название ресурса
     * */
    fun error(resourceKey: String) = error(getResourceId(resourceKey))

    /**
     * Уведомление об ошибке
     * @param resourceId Идентификатор ресурса
     * */
    fun error(resourceId: Int) {
        val message = getMessage(resourceId)
        // Вывести сообщение
        if (message.isNotEmpty()) {
            val background = context.resources.getColor(R.color.status_warn_700, context.theme)
            val color = context.resources.getColor(R.color.status_warn_contrast, context.theme)
            // Вызов сообщения
            Snackbar
                .make(view, message, defaultDuration)
                .setBackgroundTint(background)
                .setTextColor(color)
                .show()
        }
    }
}