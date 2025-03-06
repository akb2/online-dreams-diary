package ru.akb2.dreams_diary.services

import android.content.Context

class UserService(context: Context) {
    private val apiService = ApiService(context)
    private val tokenService = apiService.tokenService
}