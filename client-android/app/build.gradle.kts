plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    kotlin("plugin.serialization") version "1.9.21"
}

android {
    namespace = "ru.akb2.dreams_diary"
    compileSdk = 34
    flavorDimensions += "environment"

    defaultConfig {
        applicationId = "ru.akb2.dreams_diary"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    productFlavors {
        create("dev") {
            dimension = "environment"
        }
        create("prod") {
            dimension = "environment"
        }
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("Boolean", "DEBUG", "false")
            resValue("string", "config_path", "\"@xml/config\"")
        }
        debug {
            buildConfigField("Boolean", "DEBUG", "true")
            resValue("string", "config_path", "\"@xml/config\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.10.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.9.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("com.google.android.material:material:1.11.0")
    implementation("io.ktor:ktor-client-core:3.0.0-beta-1")
    implementation("io.ktor:ktor-client-cio:3.0.0-beta-1")
    implementation("io.ktor:ktor-client-serialization:3.0.0-beta-1")
    implementation("io.ktor:ktor-serialization-kotlinx-json:3.0.0-beta-1")
    implementation("io.ktor:ktor-client-content-negotiation:3.0.0-beta-1")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}