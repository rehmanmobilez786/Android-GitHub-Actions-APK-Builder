package com.example.data

import kotlinx.coroutines.flow.Flow

class SafeKidRepository(private val dao: SafeKidDao) {
    val allVideos: Flow<List<VideoItem>> = dao.getAllVideos()
    val allLogs: Flow<List<ActivityLog>> = dao.getAllLogs()
    val config: Flow<ParentConfig?> = dao.getConfigFlow()

    fun getVideosByPlatform(platform: String): Flow<List<VideoItem>> {
        return dao.getVideosByPlatform(platform)
    }

    suspend fun insertVideo(video: VideoItem) {
        dao.insertVideo(video)
    }

    suspend fun deleteVideo(id: Int) {
        dao.deleteVideo(id)
    }

    suspend fun insertLog(log: ActivityLog) {
        dao.insertLog(log)
    }

    suspend fun clearLogs() {
        dao.clearLogs()
    }

    suspend fun saveConfig(config: ParentConfig) {
        dao.saveConfig(config)
    }

    suspend fun getConfigDirect(): ParentConfig? {
        return dao.getConfigDirect()
    }
}
