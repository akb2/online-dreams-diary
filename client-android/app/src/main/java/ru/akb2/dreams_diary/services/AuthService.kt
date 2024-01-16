package ru.akb2.dreams_diary.services

import android.util.Log
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.accept
import io.ktor.client.request.forms.submitForm
import io.ktor.client.statement.request
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.parameters
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import ru.akb2.dreams_diary.datas.ApiServerPreffix

class AuthService {
    companion object {
        suspend fun auth(login: String, password: String) {
            val jsonBuilder = Json {
                ignoreUnknownKeys = true
                prettyPrint = true
                isLenient = true
            };
            val httpClient = HttpClient(CIO) {
                install(ContentNegotiation) {
                    json(jsonBuilder)
                }

            }
            // Попытка запроса
            try {
                val request = httpClient.submitForm(
                    url = ApiServerPreffix + "account/auth",
                    formParameters = parameters {
                        append("login", login)
                        append("password", password)
                    }
                ) {
                    accept(ContentType.Application.Json)
                    contentType(ContentType.Application.Json)
                }
                Log.i("akb2_test", request.request.headers.toString())
                // Успешный запрос
                if (request.status == HttpStatusCode.OK) {
                    val response: ApiRequest<String> = jsonBuilder.decodeFromString(request.body())
                    Log.d("akb2_test", response.toString())
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
        }
    }
}

@Serializable
data class AuthResponce(
    val login: String,
    val password: String
)

@Serializable
data class ApiRequest<T>(
    val error: Boolean,
    val controller: String,
    val method: String,
    val result: ApiRequestResult<T>,
    val echo: String
)

@Serializable
data class ApiRequestResult<T>(
    val code: String,
    val message: String,
)