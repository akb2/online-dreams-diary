package ru.akb2.dreams_diary.datas

import kotlinx.serialization.Serializable

@Serializable
data class AuthOutputData(
    val token: String,
    val result: Boolean,
    val activateIsAvail: Boolean,
    val id: Int
)

@Serializable
data class CheckTokenOutputData(
    val result: Boolean,
    @Serializable(with = TokenDataSerializer::class)
    val tokenData: TokenData
)