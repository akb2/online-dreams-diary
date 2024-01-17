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
        fun fromValue(value: String): ApiCode? {
            return values().firstOrNull { it.value == value }
        }
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