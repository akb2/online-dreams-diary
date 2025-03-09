package ru.akb2.dreams_diary.store.state

import ru.akb2.dreams_diary.datas.User

data class UserState(
    val user: User? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)