package ru.akb2.dreams_diary.datas

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.Serializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonTransformingSerializer
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.serializer
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

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
    @Serializable(with = MapSerializer::class)
    val get: Map<String, String>,
    @Serializable(with = MapSerializer::class)
    val post: Map<String, String>,
    @Serializable(with = MapSerializer::class)
    val request: Map<String, String>
)

enum class ApiCode(val value: String) {
    BLOCK_BY_APP("XXXX"),
    UNDEFINED("0000"),
    SUCCESS("0001"),
    USER_NOT_FOUND("9013"),
    WRONG_TOKEN("9015");

    companion object {
        /**
         * Преобразовать текстовый код в модель из набора
         * @param value Текстовый код ответа сервера в формате 0000-9999
         * @returns Преобразованное типизированное значение
         * */
        fun fromValue(value: String): ApiCode? = entries.firstOrNull { it.value == value }

        /**
         * Преобразовать модель из набора в текстовый код
         * @param code Значение из модели
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

@Serializer(forClass = Date::class)
object DateAsStringSerializer : KSerializer<Date> {
    override val descriptor: SerialDescriptor =
        buildClassSerialDescriptor("DateAsStringSerializer") {
            element<String>("date")
        }

    override fun serialize(encoder: Encoder, value: Date) {
        val dateString = DateFormater.format(value)
        encoder.encodeString(dateString)
    }

    override fun deserialize(decoder: Decoder): Date {
        val dateString = decoder.decodeString()
        return DateFormater.parse(dateString) ?: throw SerializationException("Invalid date format")
    }
}

@Serializer(forClass = Date::class)
object DateWithoutTimeZoneSerializer : KSerializer<Date> {
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC") // Игнорируем локальный часовой пояс
    }

    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("DateWithoutTimeZone", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: Date) {
        val formattedDate = dateFormat.format(value)
        encoder.encodeString(formattedDate)
    }

    override fun deserialize(decoder: Decoder): Date {
        val dateString = decoder.decodeString()
        return dateFormat.parse(dateString) ?: throw IllegalArgumentException("Invalid date format: $dateString")
    }
}

object MapSerializer : JsonTransformingSerializer<Map<String, String>>(serializer()) {
    override fun transformDeserialize(element: JsonElement): JsonElement {
        return if (element is JsonArray && element.isEmpty())
            buildJsonObject { } else
            element
    }
}