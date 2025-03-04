package ru.akb2.dreams_diary.services

import android.content.Context
import android.util.Log
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.accept
import io.ktor.client.request.forms.submitForm
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.parameters
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import ru.akb2.dreams_diary.BuildConfig
import ru.akb2.dreams_diary.R
import ru.akb2.dreams_diary.datas.ApiRequest

class ApiService(context: Context) {
    companion object {
        val QueryParamTokenUserId = "token_user_id"
        val CookieParamToken = "api-token"
    }

    val isDebug = BuildConfig.DEBUG
    val serverPreffix =
        context.resources.getString(if (isDebug) R.string.server_dev_prefix else R.string.server_prefix)
    val tokenService: TokenService

    val jsonBuilder = Json {
        ignoreUnknownKeys = true
        prettyPrint = true
        isLenient = true
    }

    init {
        tokenService = TokenService(context)
    }

    /**
     * Post запрос
     * @param controller Название Api-контроллера
     * @param method Название метода Api-контроллера
     * @param data Тело заропса
     * @returns Модель с ответом
     * */
    suspend inline fun <reified T> post(
        controller: String,
        method: String,
        data: Map<String, String> = mapOf()
    ): ApiRequest<T>? {
        val url = "$serverPreffix$controller/$method"
        var returnedData: ApiRequest<T>? = null
        val httpClient = HttpClient(CIO) {
            install(ContentNegotiation) {
                json(jsonBuilder)
            }
        }
        Log.i("akb2_test", url)
        // Попытка запроса
        try {
            val token = tokenService.getAuthToken()
            val userId = tokenService.getUserId()
            val request = httpClient.submitForm(
                url,
                formParameters = parameters {
                    data.forEach { (key, value) ->
                        append(key, value)
                    }
                }
            ) {
                url {
                    parameters.append(QueryParamTokenUserId, userId.toString())
                }
                accept(ContentType.Application.Json)
                contentType(ContentType.Application.Json)
                header(HttpHeaders.Cookie, "$CookieParamToken=$token")
            }
            // Успешный запрос
            if (request.status == HttpStatusCode.OK) {
                returnedData = jsonBuilder.decodeFromString(request.body())
            }
        }
        // Ошибка
        catch (e: Exception) {
            Log.e("akb2_test", e.message.toString())
        }
        // Закрыть соединение
        finally {
            httpClient.close()
        }
        // Вернуть полученную модель
        return returnedData
    }

    /**
     * Get запрос
     * @param controller Название Api-контроллера
     * @param method Название метода Api-контроллера
     * @param data Url параметры запроса
     * @returns Модель с ответом
     * */
    suspend inline fun <reified T> get(
        controller: String,
        method: String,
        data: Map<String, String> = mapOf()
    ): ApiRequest<T>? {
        val url = "$serverPreffix$controller/$method"
        var returnedData: ApiRequest<T>? = null
        val httpClient = HttpClient(CIO) {
            install(ContentNegotiation) {
                json(jsonBuilder)
            }
        }
        // Попытка запроса
        try {
            val token = tokenService.getAuthToken()
            val userId = tokenService.getUserId()
            val request = httpClient.get(url) {
                url {
                    data.forEach { (key, value) -> parameters.append(key, value) }
                    parameters.append(QueryParamTokenUserId, userId.toString())
                }
                accept(ContentType.Application.Json)
                contentType(ContentType.Application.Json)
                header(HttpHeaders.Cookie, "$CookieParamToken=$token")
            }
            // Успешный запрос
            if (request.status == HttpStatusCode.OK) {
                returnedData = jsonBuilder.decodeFromString(request.body())
            }
        }
        // Ошибка
        catch (e: Exception) {
            Log.e("akb2_test", e.toString())
        }
        // Закрыть соединение
        finally {
            httpClient.close()
        }
        // Вернуть полученную модель
        return returnedData
    }
}