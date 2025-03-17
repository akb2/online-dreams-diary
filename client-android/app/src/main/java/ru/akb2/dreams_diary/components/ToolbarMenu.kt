package ru.akb2.dreams_diary.components

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.core.view.setPadding
import com.google.android.material.appbar.MaterialToolbar
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.qualifiers.ApplicationContext
import ru.akb2.dreams_diary.R

@AndroidEntryPoint
class ToolbarMenu @JvmOverloads constructor(
    @ApplicationContext context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : MaterialToolbar(context, attrs, defStyleAttr) {
    private val titleView: TextView
    private val subTitleView: TextView
    private val iconView: ImageView
    private val titlesLayoutView: LinearLayout
    private val backButtonView: ImageView

    val menuButtonView: ImageView

    private var backActivityClass: Class<out Activity>? = null

    /**
     * Инициализация компонента
     */
    init {
        inflate(context, R.layout.component_toolbar_menu, this)
        // Свойства класса
        titleView = findViewById(R.id.titleView)
        subTitleView = findViewById(R.id.subTitleView)
        titlesLayoutView = findViewById(R.id.titlesLayout)
        iconView = findViewById(R.id.iconView)
        backButtonView = findViewById(R.id.backButtonView)
        menuButtonView = findViewById(R.id.menuButtonView)
        // Отрисовка базового слоя
        setContentInsetsRelative(0, 0)
        setContentInsetsAbsolute(0, 0)
        // Базовый вид
        setTitle(R.string.app_name)
        setSubTitle("")
        setIcon(null)
        setBackActivity(null)
    }

    /**
     * Задать заголовок из ресурса
     */
    override fun setTitle(@StringRes resourceId: Int) = setTitle(context.getString(resourceId))
    fun setTitle(text: String) {
        titleView.text = text
    }

    /**
     * Задать подзаголовок
     */
    fun setSubTitle(@StringRes resourceId: Int) = setSubTitle(context.getString(resourceId))
    private fun setSubTitle(text: String?) {
        if (text.isNullOrEmpty()) {
            subTitleView.visibility = GONE
        }
        // Показать подзаголовок
        else {
            subTitleView.visibility = VISIBLE
            subTitleView.text = text
        }
    }

    /**
     * Отрисовка иконки
     */
    @SuppressLint("UseCompatLoadingForDrawables")
    fun setIcon(@DrawableRes resourceId: Int) = setIcon(resources.getDrawable(resourceId))
    private fun setIcon(icon: Drawable?) {
        if (icon === null) {
            iconView.visibility = GONE
            // Отступ для заголовка
            val paddingLeft: Int = resources.getDimension(R.dimen.toolbar_icon_spacing).toInt()
            titlesLayoutView.setPadding(paddingLeft, 0, 0, 0)
        }
        // Скрыть иконку
        else {
            iconView.visibility = VISIBLE
            iconView.setImageDrawable(icon)
            // Отступ для заголовка
            titlesLayoutView.setPadding(0)
        }
    }

    /**
     * Установить класс активити для кнопки назад
     */
    fun setBackActivity(activity: Class<out Activity>?) {
        backActivityClass = activity

        if (backActivityClass !== null) {
            backButtonView.visibility = VISIBLE
            menuButtonView.visibility = GONE
        }
        // Скрыть кнопку назад и показать главное меню
        else {
            menuButtonView.visibility = VISIBLE
            backButtonView.visibility = GONE
        }
    }
}