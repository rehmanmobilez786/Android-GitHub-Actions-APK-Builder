package com.github.apkbuilder

import android.app.Activity
import android.os.Bundle
import android.widget.TextView
import android.view.Gravity

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val textView = TextView(this).apply {
            text = "🚀 Built Successfully via GitHub Actions!\n\nAndroid APK Studio"
            textSize = 22f
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
        }
        setContentView(textView)
    }
}
