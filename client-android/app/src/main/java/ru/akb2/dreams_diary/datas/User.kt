package ru.akb2.dreams_diary.datas

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.Date

/**
 * Перечисления пола пользователей
 */
@Serializable
enum class UserSex {
    Male,
    Female,
    UnDetected,
}

/**
 * Интерфейс массива аватарок
 */
@Serializable
data class UserAvatars(
    val full: String,
    val crop: String,
    val middle: String,
    val small: String,
)

/**
 * Интерфейс данных о пользователе
 */
@Serializable
data class User(
    val id: Int,
    val online: Boolean? = false,
    val pageStatus: String,
    val name: String,
    val lastName: String,
    val patronymic: String,
    val email: String,
    val hasAccess: Boolean? = false,
    val avatars: UserAvatars,

    @Serializable(with = UserSexSerializer::class)
    val sex: UserSex,

    @Serializable(with = DateWithoutTimeZoneSerializer::class)
    val birthDate: Date,

    @Serializable(with = DateAsStringSerializer::class)
    val registerDate: Date,

    @Serializable(with = DateAsStringSerializer::class)
    val lastActionDate: Date,

    @Serializable(with = DateAsStringSerializer::class)
    val lastEditDate: Date,
)

/**
 * Сериализатор: UserSex
 */
object UserSexSerializer : KSerializer<UserSex> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("UserSex", PrimitiveKind.INT)

    override fun serialize(encoder: Encoder, value: UserSex) {
        val intValue = when (value) {
            UserSex.Male -> 0
            UserSex.Female -> 1
            UserSex.UnDetected -> -1
        }
        encoder.encodeInt(intValue)
    }

    override fun deserialize(decoder: Decoder): UserSex {
        return when (val value = decoder.decodeInt()) {
            0 -> UserSex.Male
            1 -> UserSex.Female
            else -> UserSex.UnDetected
        }
    }
}