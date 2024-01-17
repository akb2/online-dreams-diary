package ru.akb2.dreams_diary.services

import android.util.Log
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.accept
import io.ktor.client.request.forms.submitForm
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.parameters
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import ru.akb2.dreams_diary.datas.ApiRequest
import ru.akb2.dreams_diary.datas.ApiServerPreffix

class ApiService {
    companion object {
        val jsonBuilder = Json {
            ignoreUnknownKeys = true
            prettyPrint = true
            isLenient = true
        }

        /**
         * Post responce
         * @param controller Api controller name
         * @param method Method name of a controller
         * @param data Input post data
         * @returns Output model
         * */
        suspend inline fun <reified T> post(
            controller: String,
            method: String,
            data: Map<String, String>
        ): ApiRequest<T>? {
            val url = "$ApiServerPreffix$controller/$method"
            var returnedData: ApiRequest<T>? = null
            val httpClient = HttpClient(CIO) {
                install(ContentNegotiation) {
                    json(jsonBuilder)
                }
            }
            // Попытка запроса
            try {
                val request = httpClient.submitForm(
                    url,
                    formParameters = parameters {
                        data.forEach { (key, value) ->
                            append(key, value)
                        }
                    }
                ) {
                    accept(ContentType.Application.Json)
                    contentType(ContentType.Application.Json)
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
}