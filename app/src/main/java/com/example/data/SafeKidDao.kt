package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface SafeKidDao {
    // Videos
    @Query("SELECT * FROM video_items ORDER BY id DESC")
    fun getAllVideos(): Flow<List<VideoItem>>

    @Query("SELECT * FROM video_items WHERE platform = :platform ORDER BY id DESC")
    fun getVideosByPlatform(platform: String): Flow<List<VideoItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVideo(video: VideoItem)

    @Query("DELETE FROM video_items WHERE id = :id")
    suspend fun deleteVideo(id: Int)

    // Activity Logs
    @Query("SELECT * FROM activity_logs ORDER BY timestamp DESC")
    fun getAllLogs(): Flow<List<ActivityLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: ActivityLog)

    @Query("DELETE FROM activity_logs")
    suspend fun clearLogs()

    // Parent Config
    @Query("SELECT * FROM parent_configs WHERE id = 1 LIMIT 1")
    fun getConfigFlow(): Flow<ParentConfig?>

    @Query("SELECT * FROM parent_configs WHERE id = 1 LIMIT 1")
    suspend fun getConfigDirect(): ParentConfig?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveConfig(config: ParentConfig)
}
