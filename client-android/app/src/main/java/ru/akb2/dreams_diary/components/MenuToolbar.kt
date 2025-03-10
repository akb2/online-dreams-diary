package ru.akb2.dreams_diary.components

import android.app.Activity
import android.content.Context
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.GestureDetectorCompat
import androidx.core.view.setPadding
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.appbar.MaterialToolbar
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.qualifiers.ApplicationContext
import ru.akb2.dreams_diary.R

@Suppress("DEPRECATION")
@AndroidEntryPoint
class MenuToolbar @JvmOverloads constructor(
    @ApplicationContext context: Context,
    private val attrs: AttributeSet? = null,
    private val defStyleAttr: Int = 0
) : MaterialToolbar(context, attrs, defStyleAttr) {
    private val titleView: TextView
    private val subTitleView: TextView
    private val iconView: ImageView
    private val titlesLayoutView: LinearLayout
    private val backButtonView: ImageView
    private val menuButtonView: ImageView

    private val titleText: String
    private val subTitleText: String
    private var iconSrc: Drawable? = null
    private var backActivity: Class<out Activity>? = null

    /**
     * Инициализация компонента
     */
    init {
        inflate(context, R.layout.component_menu_toolbar, this)
        val typedArray =
            context.theme.obtainStyledAttributes(attrs, R.styleable.ComponentMenuToolbar, 0, 0)
        // Свойства класса
        titleView = findViewById(R.id.titleView)
        subTitleView = findViewById(R.id.subTitleView)
        titlesLayoutView = findViewById(R.id.titlesLayout)
        iconView = findViewById(R.id.iconView)
        backButtonView = findViewById(R.id.backButtonView)
        menuButtonView = findViewById(R.id.menuButtonView)
        // Тексты
        titleText = typedArray.getString(R.styleable.ComponentMenuToolbar_title)
            ?: resources.getString(R.string.app_name)
        subTitleText = typedArray.getString(R.styleable.ComponentMenuToolbar_subtitle) ?: ""
        // Отрисовка базового слоя
        setContentInsetsRelative(0, 0)
        setContentInsetsAbsolute(0, 0)
        // Отрисовка вложенных компонентов
        setTitle(titleText)
        setSubTitle()
        iconOrDrawableDetect()
        setBackButtonState(backActivity !== null)
    }

    /**
     * Отрисовка заголовка
     */
    fun setTitle(text: String) {
        titleView.setText(text)
    }

    /**
     * Отрисовка подзаголовка
     */
    private fun setSubTitle() {
        if (subTitleText.isNotEmpty()) {
            subTitleView.visibility = View.VISIBLE
            subTitleView.setText(subTitleText)
        }
        // Скрыть подзаголовок
        else {
            subTitleView.visibility = View.GONE
        }
    }

    /**
     * Отрисовка иконки
     */
    private fun setIcon() {
        if (iconSrc != null) {
            iconView.visibility = View.VISIBLE
            iconView.setImageDrawable(iconSrc)
            // Отступ для заголовка
            titlesLayoutView.setPadding(0)
        }
        // Скрыть иконку
        else {
            iconView.visibility = View.GONE
            // Отступ для заголовка
            val paddingLeft: Int = resources.getDimension(R.dimen.toolbar_icon_spacing).toInt()
            titlesLayoutView.setPadding(paddingLeft, 0, 0, 0)
        }
    }

    /**
     * Показать/скрыть кнопку назад
     */
    private fun setBackButtonState(state: Boolean) {
        if (state) {
            backButtonView.visibility = View.VISIBLE
            menuButtonView.visibility = View.GONE
        }
        // Скрыть кнопку назад и показать главное меню
        else {
            menuButtonView.visibility = View.VISIBLE
            backButtonView.visibility = View.GONE
        }
    }

    /**
     * Детектирование иконки или картинки
     */
    private fun iconOrDrawableDetect() {
        context.theme.obtainStyledAttributes(
            attrs,
            R.styleable.ComponentMenuToolbar,
            defStyleAttr,
            0
        ).apply {
            try {
                val resourceId = getResourceId(R.styleable.ComponentMenuToolbar_icon, 0)
                // Получена ссылка на ресурс
                if (resourceId != 0) {
                    iconSrc = resources.getDrawable(resourceId)
                }
            } finally {
                setIcon()
            }
        }
    }
}