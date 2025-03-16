package ru.akb2.dreams_diary.components

import android.app.Activity
import android.content.Context
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.setPadding
import com.google.android.material.appbar.MaterialToolbar
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.qualifiers.ApplicationContext
import ru.akb2.dreams_diary.R

@AndroidEntryPoint
class MainMenuToolbar @JvmOverloads constructor(
    @ApplicationContext context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : MaterialToolbar(context, attrs, defStyleAttr) {
    private val titleView: TextView
    private val subTitleView: TextView
    private val iconView: ImageView
    private val titlesLayoutView: LinearLayout
    private val backButtonView: ImageView
    private val menuButtonView: ImageView

    private var backActivity: Class<out Activity>? = null

    /**
     * Инициализация компонента
     */
    init {
        inflate(context, R.layout.component_menu_toolbar, this)
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
    }

    /**
     * Задать заголовок
     */
    fun setTitle(text: String) {
        titleView.setText(text)
    }

    /**
     * Задать подзаголовок
     */
    fun setSubTitle(text: String) {
        if (text.isNotEmpty()) {
            subTitleView.visibility = VISIBLE
            subTitleView.setText(text)
        }
        // Скрыть подзаголовок
        else {
            subTitleView.visibility = GONE
        }
    }

    /**
     * Отрисовка иконки
     */
    fun setIcon(icon: Drawable?) {
        if (icon != null) {
            iconView.visibility = VISIBLE
            iconView.setImageDrawable(icon)
            // Отступ для заголовка
            titlesLayoutView.setPadding(0)
        }
        // Скрыть иконку
        else {
            iconView.visibility = GONE
            // Отступ для заголовка
            val paddingLeft: Int = resources.getDimension(R.dimen.toolbar_icon_spacing).toInt()
            titlesLayoutView.setPadding(paddingLeft, 0, 0, 0)
        }
    }

    /**
     * Установить класс активити для кнопки назад
     */
    fun setBackActivity(backActivity: Class<out Activity>?) {
        this.backActivity = backActivity

        setBackButtonState()
    }

    /**
     * Показать/скрыть кнопку назад
     */
    private fun setBackButtonState() {
        if (this.backActivity !== null) {
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