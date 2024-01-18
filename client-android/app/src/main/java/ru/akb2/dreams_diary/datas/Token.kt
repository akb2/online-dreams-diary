package ru.akb2.dreams_diary.datas

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonTransformingSerializer
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.serializer
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Serializable
data class TokenData(
    val id: Int,
    val token: String,
    val user_id: Int,
    @Serializable(with = DateAsStringSerializer::class)
    val last_action_date: Date,
    val ip: String,
    val os: String,
    val browser: String,
    val browser_version: String
)

object TokenDataSerializer : JsonTransformingSerializer<TokenData>(serializer()) {
    override fun transformDeserialize(element: JsonElement): JsonElement {
        return if (element is JsonObject)
            element else
            buildJsonObject {
                put("id", 0)
                put("token", "")
                put("user_id", 0)
                put(
                    "last_action_date",
                    SimpleDateFormat(DateFormat, Locale.getDefault()).format(Date())
                )
                put("ip", "")
                put("os", "")
                put("browser", "")
                put("browser_version", "")
            }
    }
}