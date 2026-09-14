package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "video_items")
data class VideoItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val url: String,
    val platform: String, // "YouTube", "TikTok", "Vimeo", "Facebook"
    val category: String, // "Education", "Cartoon", "Science", "Rhymes"
    val thumbnailUrl: String = "",
    val duration: String = "3:00",
    val isCustom: Boolean = false
)

@Entity(tableName = "activity_logs")
data class ActivityLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val activityType: String, // "WATCH", "SEARCH", "BLOCKED_ATTEMPT", "TIME_RESET"
    val detail: String,
    val platform: String? = null
)

@Entity(tableName = "parent_configs")
data class ParentConfig(
    @PrimaryKey val id: Int = 1,
    val parentPin: String = "1234",
    val dailyTimeLimitMinutes: Int = 30,
    val elapsedTimeSecondsToday: Int = 0,
    val lastTimeResetTimestamp: Long = System.currentTimeMillis(),
    val blockedKeywords: String = "adult,violence,scary,kill,fight,blood,horror,sexy,bad,weapons",
    val allowedPlatforms: String = "YouTube,TikTok,Vimeo,Facebook",
    val isSafeFiltersEnabled: Boolean = true
)
