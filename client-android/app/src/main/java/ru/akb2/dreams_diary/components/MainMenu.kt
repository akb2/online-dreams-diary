package ru.akb2.dreams_diary.components

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.widget.FrameLayout
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.qualifiers.ApplicationContext
import ru.akb2.dreams_diary.R

@Suppress("DEPRECATION")
@AndroidEntryPoint
class MainMenu @JvmOverloads constructor(
    @ApplicationContext context: Context,
    private val attrs: AttributeSet? = null,
    private val defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    private val mainMenuToolbarView: MainMenuToolbar

    init {
        inflate(context, R.layout.component_menu, this)

        mainMenuToolbarView = findViewById(R.id.menuToolbar)

        titlesDetect()
        iconOrDrawableDetect()
        backActivityDetect()
    }

    /**
     * Установить заголовок тулбара
     */
    fun setToolbarTitle(text: String) {
        mainMenuToolbarView.setTitle(text)
    }

    /**
     * Установить подзаголовок тулбара
     */
    fun setToolbarSubTitle(text: String) {
        mainMenuToolbarView.setSubTitle(text)
    }

    /**
     * Установить иконку тулбара
     */
    fun setToolbarIcon(icon: Drawable?) {
        mainMenuToolbarView.setIcon(icon)
    }

    /**
     * Установить класс активити для кнопки назад
     */
    fun setToolbarBackActivity(backActivity: Class<out Activity>?) {
        mainMenuToolbarView.setBackActivity(backActivity)
    }

    /**
     * Передача параметров атрибутов
     */
    private fun titlesDetect() {
        val typedArray = context.theme.obtainStyledAttributes(
            attrs, R.styleable.ComponentMenu, defStyleAttr, 0
        )
        val titleText = typedArray.getString(R.styleable.ComponentMenu_title)
            ?: resources.getString(R.string.app_name)
        val subTitleText = typedArray.getString(R.styleable.ComponentMenu_subtitle) ?: ""
        // Отрисовка
        setToolbarTitle(titleText)
        setToolbarSubTitle(subTitleText)
    }

    /**
     * Детектирование иконки или картинки
     */
    @SuppressLint("UseCompatLoadingForDrawables")
    private fun iconOrDrawableDetect() {
        val typedArray = context.theme.obtainStyledAttributes(
            attrs, R.styleable.ComponentMenu, defStyleAttr, 0
        )

        typedArray.apply {
            try {
                val resourceId = getResourceId(R.styleable.ComponentMenu_icon, 0)
                // Получена ссылка на ресурс
                if (resourceId != 0) {
                    setToolbarIcon(resources.getDrawable(resourceId))
                }
            } finally {
                setToolbarIcon(null)
            }
        }
    }

    /**
     * Детектирование активности для кнопки назад
     */
    private fun backActivityDetect() {
        val typedArray = context.theme.obtainStyledAttributes(
            attrs, R.styleable.ComponentMenu, defStyleAttr, 0
        )
        val backActivityName = typedArray.getString(R.styleable.ComponentMenu_backActivity)

        if (backActivityName.isNullOrEmpty()) {
            setToolbarBackActivity(null)
        } else {
            backActivityName?.let {
                try {
                    setToolbarBackActivity(Class.forName(it) as Class<out Activity>)
                } catch (e: ClassNotFoundException) {
                    setToolbarBackActivity(null)
                }
            }
        }
    }
}