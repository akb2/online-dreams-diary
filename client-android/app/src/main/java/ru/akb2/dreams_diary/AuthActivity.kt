package ru.akb2.dreams_diary

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.card.MaterialCardView
import com.google.android.material.progressindicator.CircularProgressIndicator
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.launch
import ru.akb2.dreams_diary.datas.ApiCode
import ru.akb2.dreams_diary.datas.LoginMinSize
import ru.akb2.dreams_diary.datas.PasswordMinSize
import ru.akb2.dreams_diary.services.AuthService


class AuthActivity : AppCompatActivity() {
    private lateinit var loginInput: TextInputEditText
    private lateinit var passwordInput: TextInputEditText
    private lateinit var restoreLink: TextView
    private lateinit var registerButton: Button
    private lateinit var authButton: Button
    private lateinit var authCardLayout: MaterialCardView
    private lateinit var formLoader: CircularProgressIndicator

    private var login: String = ""
    private var password: String = ""


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_auth)
        // Настройка активности
        setNavigationIconsColor()
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
        loginInput = findViewById(R.id.loginInput);
        passwordInput = findViewById(R.id.passwordInput);
        restoreLink = findViewById(R.id.restoreLink);
        registerButton = findViewById(R.id.registerButton);
        authButton = findViewById(R.id.authButton);
        authCardLayout = findViewById(R.id.authCardLayout);
        formLoader = findViewById(R.id.formLoader);
    }

    /**
     * Сделать кнопки управления внизу устройства темными
     * */
    private fun setNavigationIconsColor() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR)
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
        passwordInput.setOnEditorActionListener { v, actionId, event ->
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
            toggleLoader(true)
            // Авторизация
            val authResult = AuthService.auth(login, password)
            // Успешная авторизация
            if (authResult === ApiCode.SUCCESS) {
                toggleLoader(false)
            }
            // Ошибка авторизации
            else {
                toggleLoader(false)
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