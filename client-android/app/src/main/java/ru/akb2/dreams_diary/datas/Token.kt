package ru.akb2.dreams_diary.datas

import android.annotation.SuppressLint
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
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
    val ip: String,
    val os: String,
    val browser: String,

    @SerialName("user_id")
    val userId: Int,

    @Serializable(with = DateAsStringSerializer::class)
    @SerialName("last_action_date")
    val lastActionDate: Date,

    @SerialName("browser_version")
    val browserVersion: String
)


object TokenDataSerializer : JsonTransformingSerializer<TokenData>(serializer()) {
    @SuppressLint("ConstantLocale")
    private val defaultDate = SimpleDateFormat(DateFormat, Locale.getDefault()).format(Date())

    override fun transformDeserialize(element: JsonElement): JsonElement {
        return if (element is JsonArray && element.isEmpty())
            buildJsonObject {
                put("id", 0)
                put("token", "")
                put("user_id", 0)
                put("last_action_date", defaultDate)
                put("ip", "")
                put("os", "")
                put("browser", "")
                put("browser_version", "")
            }
        else
            element
    }
}