package ru.akb2.dreams_diary.datas

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.Serializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

val ApiServerPreffix = "https://api-test.dreams-diary.ru/"

@Serializable
data class ApiRequest<T>(
    val error: Boolean,
    val controller: String,
    val method: String,
    val result: ApiRequestResult<T>,
    val echo: String,
    val queryParams: ApiRequestQueryParams
)

@Serializable
data class ApiRequestResult<T>(
    @Serializable(with = ApiCodeSerializer::class)
    val code: ApiCode,
    val message: String,
    val data: T
)

@Serializable
data class ApiRequestQueryParams(
    val get: Map<String, String>,
    val post: Map<String, String>,
    val request: Map<String, String>
)

enum class ApiCode(val value: String) {
    BLOCK_BY_APP("XXXX"),
    UNDEFINED("0000"),
    SUCCESS("0001"),
    USER_NOT_FOUND("9013");

    companion object {
        /**
         * Преобразовать текстовый код в модель из набора
         * @param value Текстовый код ответа сервера в формате 0000-9999
         * @returns Преобразованное типизированное значение
         * */
        fun fromValue(value: String): ApiCode? = entries.firstOrNull { it.value == value }

        /**
         * Преобразовать модель из набора в текстовый код
         * @param value Значение из модели
         * returns Текстовое представление в виде кода в формате 0000-9999
         * */
        fun toValue(code: ApiCode): String = code.value

        /**
         * Получить ключ ресурсов для кода
         * @param code код в формате модели класса
         * */
        fun getResourceKey(code: ApiCode): String = getResourceKey(toValue(code))

        /**
         * Получить ключ ресурсов для кода
         * @param code код в виде строки
         * */
        fun getResourceKey(code: String): String = "api_error_code_message_$code"
    }
}

@Serializer(forClass = ApiCode::class)
object ApiCodeSerializer : KSerializer<ApiCode> {
    override val descriptor = PrimitiveSerialDescriptor("ApiCode", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: ApiCode) {
        encoder.encodeString(value.value)
    }

    override fun deserialize(decoder: Decoder): ApiCode {
        val value = decoder.decodeString()
        return ApiCode.fromValue(value)
            ?: throw SerializationException("Неизвестный ApiCode: $value")
    }
}