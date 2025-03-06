package ru.akb2.dreams_diary.datas

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.nullable
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

/**
 * Перечисления пола пользователей
 */
@Serializable
enum class UserSex {
    Male,
    Female,
    UnDetected
}

/**
 * Базовые параметры о пользователе
 */
@Serializable
data class UserBase(
    open val name: String,
    open val lastName: String,
    open val birthDate: String,
    open val sex: UserSex,
    open val email: String,
    open val hasAccess: Boolean?
)

/**
 * Интерфейс данных для обновления аккаунта
 */
@Serializable(with = UserSaveSerializer::class)
data class UserSave(
    val userBase: UserBase,
    val patronymic: String,
)

/**
 * Сериализатор: UserSave
 */
object UserSaveSerializer : KSerializer<UserSave> {
    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("UserSave") {
        element("name", PrimitiveSerialDescriptor("name", PrimitiveKind.STRING))
        element("lastName", PrimitiveSerialDescriptor("lastName", PrimitiveKind.STRING))
        element("birthDate", PrimitiveSerialDescriptor("birthDate", PrimitiveKind.STRING))
        element("sex", PrimitiveSerialDescriptor("sex", PrimitiveKind.STRING))
        element("email", PrimitiveSerialDescriptor("email", PrimitiveKind.STRING))
        element("hasAccess", PrimitiveSerialDescriptor("hasAccess", PrimitiveKind.BOOLEAN).nullable)
        element("patronymic", PrimitiveSerialDescriptor("patronymic", PrimitiveKind.STRING))
    }

    override fun serialize(encoder: Encoder, value: UserSave) {
        val compositeEncoder = encoder.beginStructure(descriptor)
        compositeEncoder.encodeStringElement(descriptor, 0, value.userBase.name)
        compositeEncoder.encodeStringElement(descriptor, 1, value.userBase.lastName)
        compositeEncoder.encodeStringElement(descriptor, 2, value.userBase.birthDate)
        compositeEncoder.encodeStringElement(descriptor, 3, value.userBase.sex.name)
        compositeEncoder.encodeStringElement(descriptor, 4, value.userBase.email)
        value.userBase.hasAccess?.let {
            compositeEncoder.encodeBooleanElement(descriptor, 5, it)
        }
        compositeEncoder.encodeStringElement(descriptor, 6, value.patronymic)
        compositeEncoder.endStructure(descriptor)
    }

    override fun deserialize(decoder: Decoder): UserSave {
        val dec = decoder.beginStructure(descriptor)
        var name = ""
        var lastName = ""
        var birthDate = ""
        var sex: UserSex = UserSex.UnDetected
        var email = ""
        var hasAccess: Boolean? = null
        var patronymic = ""

        loop@ while (true) {
            when (val index = dec.decodeElementIndex(descriptor)) {
                0 -> name = dec.decodeStringElement(descriptor, index)
                1 -> lastName = dec.decodeStringElement(descriptor, index)
                2 -> birthDate = dec.decodeStringElement(descriptor, index)
                3 -> sex = UserSex.valueOf(dec.decodeStringElement(descriptor, index))
                4 -> email = dec.decodeStringElement(descriptor, index)
                5 -> hasAccess =
                    dec.decodeNullableSerializableElement(descriptor, index, Boolean.serializer())

                6 -> patronymic = dec.decodeStringElement(descriptor, index)
                CompositeDecoder.DECODE_DONE -> break@loop
                else -> throw SerializationException("Unexpected index $index")
            }
        }
        dec.endStructure(descriptor)

        val userBase = UserBase(name, lastName, birthDate, sex, email, hasAccess)
        return UserSave(userBase, patronymic)
    }
}