package ru.akb2.dreams_diary.store.actions

import ru.akb2.dreams_diary.datas.User

sealed class UserAction {
    data object LoadUser : UserAction()
    data class UserLoaded(val user: User) : UserAction()
    data class Error(val message: String) : UserAction()
}