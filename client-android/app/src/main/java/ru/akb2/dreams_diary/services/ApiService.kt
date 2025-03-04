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
import java.security.KeyStore
import java.security.SecureRandom
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

class ApiService(private val context: Context) {
    companion object {
        val QueryParamTokenUserId = "token_user_id"
        val CookieParamToken = "api-token"
    }

    val isDebug = BuildConfig.DEBUG
    val serverPreffix = context.resources.getString(
        if (isDebug) R.string.server_dev_prefix
        else R.string.server_prefix
    )
    val tokenService: TokenService

    val jsonBuilder = Json {
        ignoreUnknownKeys = true
        prettyPrint = true
        isLenient = true
    }

    init {
        tokenService = TokenService(context)
    }

    private fun httpClient(): HttpClient {
        val trustManager = getCustomTrustManager()

        val sslContext = SSLContext.getInstance("TLS").apply {
            init(null, arrayOf(trustManager), SecureRandom())
        }

        return HttpClient(CIO) {
            engine {
                customizeClient {
                }
            }
            install(ContentNegotiation) {
                json(jsonBuilder)
            }
        }
    }

    /**
     * Post запрос
     * @param controller Название Api-контроллера
     * @param method Название метода Api-контроллера
     * @param data Тело заропса
     * @returns Модель с ответом
     * */
    suspend fun <T> post(
        controller: String,
        method: String,
        data: Map<String, String> = mapOf()
    ): ApiRequest<T>? {
        val url = "$serverPreffix$controller/$method"
        var returnedData: ApiRequest<T>? = null
        val httpClient = httpClient()
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
    suspend fun <T> get(
        controller: String,
        method: String,
        data: Map<String, String> = mapOf()
    ): ApiRequest<T>? {
        val url = "$serverPreffix$controller/$method"
        var returnedData: ApiRequest<T>? = null
        val httpClient = httpClient()
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

    private fun getCustomTrustManager(): X509TrustManager {
        val certificateFactory = CertificateFactory.getInstance("X.509")
        val inputStream = context.resources.openRawResource(R.raw.localhost)
        val certificate = certificateFactory.generateCertificate(inputStream) as X509Certificate
        inputStream.close()

        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
            load(null, null)
            setCertificateEntry("server", certificate)
        }

        val trustManagerFactory =
            TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()).apply {
                init(keyStore)
            }

        return trustManagerFactory.trustManagers.filterIsInstance<X509TrustManager>().first()
    }
}