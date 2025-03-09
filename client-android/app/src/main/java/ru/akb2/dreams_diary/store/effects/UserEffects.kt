package ru.akb2.dreams_diary.store.effects

import ru.akb2.dreams_diary.store.reducers.UserReducer
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserEffects @Inject constructor(
    private val reducer: UserReducer,
) {
}