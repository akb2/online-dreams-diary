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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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
 * Интерфейс массива аватарок
 */
@Serializable
data class UserAvatars(
    val full: String,
    val crop: String,
    val middle: String,
    val small: String
)

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
 * Интерфейс данных о пользователе
 */
@Serializable(with = UserSerializer::class)
data class User(
    val userSave: UserSave,
    val id: Int,
    val online: Boolean,
    val pageStatus: String,
    val registerDate: Date,
    val lastActionDate: Date,
    val lastEditDate: Date,
    val avatars: UserAvatars,
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

/**
 * Сериализатор: User
 */
object UserSerializer : KSerializer<User> {
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)

    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("User") {
        element("userSave", UserSaveSerializer.descriptor)
        element("id", PrimitiveSerialDescriptor("id", PrimitiveKind.INT))
        element("online", PrimitiveSerialDescriptor("online", PrimitiveKind.BOOLEAN))
        element("pageStatus", PrimitiveSerialDescriptor("pageStatus", PrimitiveKind.STRING))
        element("registerDate", PrimitiveSerialDescriptor("registerDate", PrimitiveKind.STRING))
        element("lastActionDate", PrimitiveSerialDescriptor("lastActionDate", PrimitiveKind.STRING))
        element("lastEditDate", PrimitiveSerialDescriptor("lastEditDate", PrimitiveKind.STRING))
        element("avatars", UserAvatars.serializer().descriptor)
    }

    override fun serialize(encoder: Encoder, value: User) {
        val compositeEncoder = encoder.beginStructure(descriptor)
        compositeEncoder.encodeSerializableElement(
            descriptor,
            0,
            UserSaveSerializer,
            value.userSave
        )
        compositeEncoder.encodeIntElement(descriptor, 1, value.id)
        compositeEncoder.encodeBooleanElement(descriptor, 2, value.online)
        compositeEncoder.encodeStringElement(descriptor, 3, value.pageStatus)
        compositeEncoder.encodeStringElement(descriptor, 4, dateFormat.format(value.registerDate))
        compositeEncoder.encodeStringElement(descriptor, 5, dateFormat.format(value.lastActionDate))
        compositeEncoder.encodeStringElement(descriptor, 6, dateFormat.format(value.lastEditDate))
        compositeEncoder.encodeSerializableElement(
            descriptor,
            7,
            UserAvatars.serializer(),
            value.avatars
        )
        compositeEncoder.endStructure(descriptor)
    }

    override fun deserialize(decoder: Decoder): User {
        val dec = decoder.beginStructure(descriptor)

        var userSave: UserSave? = null
        var id = 0
        var online = false
        var pageStatus = ""
        var registerDate: Date? = null
        var lastActionDate: Date? = null
        var lastEditDate: Date? = null
        var avatars: UserAvatars? = null

        loop@ while (true) {
            when (val index = dec.decodeElementIndex(descriptor)) {
                0 -> userSave = dec.decodeSerializableElement(descriptor, index, UserSaveSerializer)
                1 -> id = dec.decodeIntElement(descriptor, index)
                2 -> online = dec.decodeBooleanElement(descriptor, index)
                3 -> pageStatus = dec.decodeStringElement(descriptor, index)
                4 -> registerDate = dateFormat.parse(dec.decodeStringElement(descriptor, index))
                5 -> lastActionDate = dateFormat.parse(dec.decodeStringElement(descriptor, index))
                6 -> lastEditDate = dateFormat.parse(dec.decodeStringElement(descriptor, index))
                7 -> avatars =
                    dec.decodeSerializableElement(descriptor, index, UserAvatars.serializer())

                CompositeDecoder.DECODE_DONE -> break@loop
                else -> throw SerializationException("Unexpected index $index")
            }
        }
        dec.endStructure(descriptor)

        return User(
            userSave ?: throw SerializationException("Missing userSave"),
            id,
            online,
            pageStatus,
            registerDate ?: throw SerializationException("Missing registerDate"),
            lastActionDate ?: throw SerializationException("Missing lastActionDate"),
            lastEditDate ?: throw SerializationException("Missing lastEditDate"),
            avatars ?: throw SerializationException("Missing avatars"),
        )
    }
}