package ru.akb2.dreams_diary.activities

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.TextView
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.card.MaterialCardView
import com.google.android.material.progressindicator.CircularProgressIndicator
import com.google.android.material.textfield.TextInputEditText
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import ru.akb2.dreams_diary.R
import ru.akb2.dreams_diary.datas.ApiCode
import ru.akb2.dreams_diary.datas.AuthType
import ru.akb2.dreams_diary.datas.DefaultNotAuthActivity
import ru.akb2.dreams_diary.datas.LoginMinSize
import ru.akb2.dreams_diary.datas.PasswordMinSize
import ru.akb2.dreams_diary.services.KeyboardService
import ru.akb2.dreams_diary.services.SnackBarService
import ru.akb2.dreams_diary.services.UserService

@AndroidEntryPoint
class AuthActivity: BaseActivity() {
    override val authType = AuthType.NOT_AUTH

    private lateinit var activityLayout: CoordinatorLayout
    private lateinit var loginInput: TextInputEditText
    private lateinit var passwordInput: TextInputEditText
    private lateinit var restoreLink: TextView
    private lateinit var registerButton: Button
    private lateinit var authButton: Button
    private lateinit var authCardLayout: MaterialCardView
    private lateinit var formLoader: CircularProgressIndicator

    private lateinit var snackBarService: SnackBarService
    private lateinit var keyboardService: KeyboardService

    private var login: String = ""
    private var password: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_auth)
        // Настройка активности
        setDarkNavigationIconsColor()
        fillData()
        // Запуск событий
        loginInputKeyListener()
        passwordInputKeyListener()
        authButtonTapListener()
    }

    /**
     * Заполнение свойств класса
     * */
    private fun fillData() {
        activityLayout = findViewById(R.id.activityLayout)
        mainLayout = findViewById(R.id.mainLayout)
        loginInput = findViewById(R.id.loginInput)
        passwordInput = findViewById(R.id.passwordInput)
        restoreLink = findViewById(R.id.restoreLink)
        registerButton = findViewById(R.id.registerButton)
        authButton = findViewById(R.id.authButton)
        authCardLayout = findViewById(R.id.authCardLayout)
        formLoader = findViewById(R.id.formLoader)
        // Запуск служб
        snackBarService = SnackBarService(this@AuthActivity, activityLayout)
        keyboardService = KeyboardService(this@AuthActivity)
    }


    /**
     * Прослушивание событий изменений значения в поле логина
     * */
    private fun loginInputKeyListener() {
        loginInput.addAfterTextChangedListener { editable ->
            login = editable?.toString() ?: ""
            authButtonEnabledStateListener()
        }
    }

    /**
     * Прослушивание событий изменений значения в поле пароля
     * */
    private fun passwordInputKeyListener() {
        passwordInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
            }

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
            }

            override fun afterTextChanged(value: Editable?) {
                password = value?.toString() ?: ""
                // Определить доступность
                authButtonEnabledStateListener()
            }
        })
        // Нажатие "Enter"
        passwordInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                tryAuth()
            }
            false
        }
    }

    /**
     * Прослушивание событий нажатий на кнопку входа
     * */
    private fun authButtonTapListener() {
        authButton.setOnClickListener {
            tryAuth()
        }
    }

    /**
     * Изменение доступности кнопки
     * */
    private fun authButtonEnabledStateListener() {
        val authButtonEnabled = login.length >= LoginMinSize && password.length >= PasswordMinSize
        authButton.setEnabled(authButtonEnabled)
    }

    /**
     * Авторизация
     * */
    private fun tryAuth() {
        lifecycleScope.launch {
            keyboardService.closeKeyboard()
            toggleLoader(true)
            // Авторизация
            val authResult = authService.auth(login, password)
            // Успешная авторизация
            if (authResult === ApiCode.SUCCESS) {
                startActivity(Intent(this@AuthActivity, DefaultNotAuthActivity))
                finish()
            }
            // Ошибка авторизации
            else {
                toggleLoader(false)
                snackBarService.error(ApiCode.getResourceKey(authResult))
            }
        }
    }

    /**
     * Показать или скрыть лоадер
     * */
    private fun toggleLoader(showState: Boolean) {
        if (showState) {
            authCardLayout.visibility = View.GONE
            formLoader.visibility = View.VISIBLE
        }
        // Скрыть
        else {
            authCardLayout.visibility = View.VISIBLE
            formLoader.visibility = View.GONE
        }
    }
}

/**
 * Расширение для использования только события в конце изменения ввода
 * */
fun TextView.addAfterTextChangedListener(afterTextChanged: (Editable?) -> Unit) {
    this.addTextChangedListener(object : TextWatcher {
        override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
        }

        override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
        }

        override fun afterTextChanged(editable: Editable?) {
            afterTextChanged(editable)
        }
    })
}