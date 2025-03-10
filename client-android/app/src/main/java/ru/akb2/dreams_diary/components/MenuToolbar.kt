package ru.akb2.dreams_diary.components

import android.content.Context
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.setPadding
import com.google.android.material.appbar.MaterialToolbar
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.qualifiers.ApplicationContext
import ru.akb2.dreams_diary.R

@AndroidEntryPoint
class MenuToolbar @JvmOverloads constructor(
    @ApplicationContext context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : MaterialToolbar(context, attrs, defStyleAttr) {
    private val titleView: TextView
    private val subTitleView: TextView
    private val iconView: ImageView
    private val titlesLayout: LinearLayout

    private val titleText: String
    private val subTitleText: String
    private var iconSrc: Drawable? = null

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
        titlesLayout = findViewById(R.id.titlesLayout)
        iconView = findViewById(R.id.iconView)
        titleText = typedArray.getString(R.styleable.ComponentMenuToolbar_title)
            ?: resources.getString(R.string.app_name)
        subTitleText = typedArray.getString(R.styleable.ComponentMenuToolbar_subtitle) ?: ""
        // Отрисовка базового слоя
        setContentInsetsRelative(0, 0)
        setContentInsetsAbsolute(0, 0)
        // Отрисовка вложенных компонентов
        setTitle(titleText)
        setSubTitle()
        //
        context.theme.obtainStyledAttributes(
            attrs,
            R.styleable.ComponentMenuToolbar,
            defStyleAttr, 0
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
            titlesLayout.setPadding(0)
        }
        // Скрыть иконку
        else {
            iconView.visibility = View.GONE
            // Отступ для заголовка
            val paddingLeft: Int = resources.getDimension(R.dimen.toolbar_icon_spacing).toInt()
            titlesLayout.setPadding(paddingLeft, 0, 0, 0)
        }
    }
}