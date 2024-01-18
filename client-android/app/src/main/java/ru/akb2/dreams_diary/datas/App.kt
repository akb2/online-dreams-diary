package ru.akb2.dreams_diary.datas

import android.annotation.SuppressLint
import ru.akb2.dreams_diary.activities.AuthActivity
import ru.akb2.dreams_diary.activities.DiaryActivity
import java.text.SimpleDateFormat
import java.util.Locale

val DateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"

@SuppressLint("ConstantLocale")
val DateFormater = SimpleDateFormat(DateFormat, Locale.getDefault())

val DefaultAuthActivity = DiaryActivity::class.java
val DefaultNotAuthActivity = AuthActivity::class.java