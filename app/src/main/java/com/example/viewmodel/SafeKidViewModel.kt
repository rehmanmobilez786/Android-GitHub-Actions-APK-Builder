package com.example.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

sealed class Screen {
    object KidHome : Screen()
    data class VideoPlayer(val video: VideoItem) : Screen()
    object ParentUnlock : Screen()
    object ParentDashboard : Screen()
}

class SafeKidViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: SafeKidRepository

    // Screen state
    private val _currentScreen = MutableStateFlow<Screen>(Screen.KidHome)
    val currentScreen: StateFlow<Screen> = _currentScreen.asStateFlow()

    // Navigation back stack (simplified)
    private val screenStack = mutableListOf<Screen>(Screen.KidHome)

    // Language state: true = Urdu, false = English
    private val _isUrdu = MutableStateFlow(true)
    val isUrdu: StateFlow<Boolean> = _isUrdu.asStateFlow()

    // Database content
    val allVideos: StateFlow<List<VideoItem>>
    val allLogs: StateFlow<List<ActivityLog>>
    val config: StateFlow<ParentConfig>

    // Kid Search / Platform Filter
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedPlatform = MutableStateFlow<String?>("YouTube") // Default starting platform
    val selectedPlatform: StateFlow<String?> = _selectedPlatform.asStateFlow()

    private val _selectedCategory = MutableStateFlow<String?>("All")
    val selectedCategory: StateFlow<String?> = _selectedCategory.asStateFlow()

    // Screen Time Counters
    private val _elapsedSeconds = MutableStateFlow(0)
    val elapsedSeconds: StateFlow<Int> = _elapsedSeconds.asStateFlow()

    private val _isTimeLimitExceeded = MutableStateFlow(false)
    val isTimeLimitExceeded: StateFlow<Boolean> = _isTimeLimitExceeded.asStateFlow()

    // Custom alert warning for search filtering
    private val _searchAlertMessage = MutableStateFlow<String?>(null)
    val searchAlertMessage: StateFlow<String?> = _searchAlertMessage.asStateFlow()

    init {
        val database = AppDatabase.getDatabase(application)
        repository = SafeKidRepository(database.dao())

        // Setup states from repository Flows
        allVideos = repository.allVideos.stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
        )
        allLogs = repository.allLogs.stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
        )

        // Generate base config if it does not exist
        config = repository.config.map { 
            it ?: ParentConfig() 
        }.stateIn(
            viewModelScope, SharingStarted.WhileSubscribed(5000), ParentConfig()
        )

        // Seed default safe kids educational videos if empty
        viewModelScope.launch {
            allVideos.collect { list ->
                if (list.isEmpty()) {
                    seedDefaultVideos()
                }
            }
        }

        // Screen time controller loop
        viewModelScope.launch {
            while (isActive) {
                delay(1000)
                // Increment elapsed time only when kid is actively on kid screen
                val current = _currentScreen.value
                val exceeded = _isTimeLimitExceeded.value
                
                if ((current is Screen.KidHome || current is Screen.VideoPlayer) && !exceeded) {
                    val currentConfig = config.value
                    _elapsedSeconds.update { it + 1 }
                    
                    // Check if time limit hit
                    if (_elapsedSeconds.value >= currentConfig.dailyTimeLimitMinutes * 60) {
                        _isTimeLimitExceeded.value = true
                        logActivity("TIME_OUT", "Child daily time limit reached: ${currentConfig.dailyTimeLimitMinutes} minutes")
                    }
                }
            }
        }
    }

    fun toggleLanguage() {
        _isUrdu.update { !it }
    }

    fun navigateTo(screen: Screen) {
        if (_currentScreen.value != screen) {
            screenStack.add(_currentScreen.value)
            _currentScreen.value = screen
        }
    }

    fun navigateBack() {
        if (screenStack.isNotEmpty()) {
            _currentScreen.value = screenStack.removeLast()
        } else {
            _currentScreen.value = Screen.KidHome
        }
    }

    fun setPlatform(platform: String?) {
        _selectedPlatform.value = platform
        _selectedCategory.value = "All" // Reset category on platform change
        platform?.let {
            logActivity("NAVIGATE", "Browsed platform: $it", it)
        }
    }

    fun setCategory(category: String?) {
        _selectedCategory.value = category
    }

    // Safety checks for Child Search queries
    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
        if (query.isEmpty()) return

        val currentConfig = config.value
        val keywords = currentConfig.blockedKeywords.split(",").map { it.trim().lowercase() }
        val matchedKeyword = keywords.firstOrNull { query.lowercase().contains(it) }

        if (matchedKeyword != null && currentConfig.isSafeFiltersEnabled) {
            // Screened blocked search query
            _searchQuery.value = "" // clear dangerous search query
            val warningUrdu = "یہ تلاش محفوظ نہیں ہے! آئیے کچھ تعلیمی ویڈیوز دیکھیں!"
            val warningEnglish = "This search is blocked! Let's explore science or animals instead!"
            _searchAlertMessage.value = if (_isUrdu.value) warningUrdu else warningEnglish
            
            // Log block attempt in Parent Portal Room Database
            viewModelScope.launch {
                repository.insertLog(ActivityLog(
                    activityType = "BLOCKED_ATTEMPT",
                    detail = "Blocked Search: '$query' (Keyword: '$matchedKeyword')"
                ))
            }
        } else {
            _searchAlertMessage.value = null
        }
    }

    fun clearSearchAlert() {
        _searchAlertMessage.value = null
    }

    fun selectVideo(video: VideoItem) {
        logActivity("WATCH", "Opened Video: ${video.title}", video.platform)
        navigateTo(Screen.VideoPlayer(video))
    }

    // Parental configuration changes
    fun updatePin(newPin: String) {
        viewModelScope.launch {
            repository.saveConfig(config.value.copy(parentPin = newPin))
            logActivity("PIN_CHANGE", "Parent changed entry PIN code")
        }
    }

    fun updateTimeLimit(minutes: Int) {
        viewModelScope.launch {
            val updated = config.value.copy(dailyTimeLimitMinutes = minutes)
            repository.saveConfig(updated)
            // Re-evaluate limit
            _isTimeLimitExceeded.value = _elapsedSeconds.value >= minutes * 60
            logActivity("CONFIG_UPDATE", "Daily screen time limit set to $minutes minutes")
        }
    }

    fun resetDailyTimeUsage() {
        _elapsedSeconds.value = 0
        _isTimeLimitExceeded.value = false
        logActivity("TIME_RESET", "Parent reset the screen timer")
    }

    fun togglePlatformAccess(platform: String, isAllowed: Boolean) {
        viewModelScope.launch {
            val currentPlatforms = config.value.allowedPlatforms.split(",").map { it.trim() }.toMutableList()
            if (isAllowed) {
                if (!currentPlatforms.contains(platform)) currentPlatforms.add(platform)
            } else {
                currentPlatforms.remove(platform)
            }
            val newListString = currentPlatforms.joinToString(",")
            repository.saveConfig(config.value.copy(allowedPlatforms = newListString))
            
            // If currently selected platform got blocked, fallback
            if (!isAllowed && _selectedPlatform.value == platform) {
                _selectedPlatform.value = currentPlatforms.firstOrNull()
            }
            logActivity("CONFIG_UPDATE", "Access to platform $platform set to $isAllowed")
        }
    }

    fun toggleSafeFilters(enabled: Boolean) {
        viewModelScope.launch {
            repository.saveConfig(config.value.copy(isSafeFiltersEnabled = enabled))
            logActivity("CONFIG_UPDATE", "Safe Filters set to: $enabled")
        }
    }

    fun updateBlockedKeywords(keywordsCommaList: String) {
        viewModelScope.launch {
            repository.saveConfig(config.value.copy(blockedKeywords = keywordsCommaList))
            logActivity("CONFIG_UPDATE", "Custom blocked keyword list updated")
        }
    }

    fun addCustomVideo(title: String, url: String, platform: String, category: String) {
        viewModelScope.launch {
            val cleanUrl = formatEmbedUrl(url, platform)
            val newVideo = VideoItem(
                title = title,
                url = cleanUrl,
                platform = platform,
                category = category,
                isCustom = true
            )
            repository.insertVideo(newVideo)
            logActivity("VIDEO_ADD", "Parent whitelisted video: $title", platform)
        }
    }

    fun deleteVideo(video: VideoItem) {
        viewModelScope.launch {
            repository.deleteVideo(video.id)
            logActivity("VIDEO_DELETE", "Parent removed video: ${video.title}", video.platform)
        }
    }

    fun clearAllLogs() {
        viewModelScope.launch {
            repository.clearLogs()
        }
    }

    fun logActivity(type: String, detail: String, platform: String? = null) {
        viewModelScope.launch {
            repository.insertLog(ActivityLog(
                activityType = type,
                detail = detail,
                platform = platform
            ))
        }
    }

    // Helper functions
    private fun formatEmbedUrl(url: String, platform: String): String {
        // Formats regular links to secure embed players to bypass signin screens
        if (platform == "YouTube" && url.contains("watch?v=")) {
            val id = url.substringAfter("watch?v=").substringBefore("&")
            return "https://www.youtube.com/embed/$id"
        } else if (platform == "YouTube" && url.contains("youtu.be/")) {
            val id = url.substringAfter("youtu.be/").substringBefore("?")
            return "https://www.youtube.com/embed/$id"
        } else if (platform == "Vimeo" && !url.contains("player.vimeo.com")) {
            val id = url.substringAfterLast("/")
            return "https://player.vimeo.com/video/$id"
        }
        return url
    }

    private suspend fun seedDefaultVideos() {
        val defaultVideos = listOf(
            VideoItem(
                title = "ہماری کائنات - بچوں کے لیے معلوماتی ویڈیو (Solar System Urdu)",
                url = "https://www.youtube.com/embed/n4p_qV8Uu5c",
                platform = "YouTube",
                category = "Education",
                duration = "6:15"
            ),
            VideoItem(
                title = "Learn Solar System and Planets for Kids",
                url = "https://www.youtube.com/embed/libKVRa01L8",
                platform = "YouTube",
                category = "Education",
                duration = "8:20"
            ),
            VideoItem(
                title = "Urdu Alphabets Song (حروفِ تہجی نظم) - Safe Nursery Rhyme",
                url = "https://www.youtube.com/embed/qg_v03L49YI",
                platform = "YouTube",
                category = "Rhymes",
                duration = "4:30"
            ),
            VideoItem(
                title = "National Geographic Kids: Playful Giant Panda Bears",
                url = "https://player.vimeo.com/video/547281902", // Safe Vimeo fallback for previewing video player
                platform = "YouTube",
                category = "Science",
                duration = "3:45"
            ),
            VideoItem(
                title = "Awesome Volcanoes Erupt Science Lesson",
                url = "https://player.vimeo.com/video/334237912",
                platform = "TikTok",
                category = "Science",
                duration = "1:30"
            ),
            VideoItem(
                title = "TikTok Learn: How Rain and Water Cycle Works",
                url = "https://player.vimeo.com/video/110993096",
                platform = "TikTok",
                category = "Education",
                duration = "2:10"
            ),
            VideoItem(
                title = "Piper - Pixar Award Winning Cute Bird Animation Short",
                url = "https://player.vimeo.com/video/547281902",
                platform = "Vimeo",
                category = "Cartoon",
                duration = "6:00"
            ),
            VideoItem(
                title = "Vimeo Craft: Easy Origami Paper Butterfly Step-by-Step",
                url = "https://player.vimeo.com/video/110993096",
                platform = "Vimeo",
                category = "Science",
                duration = "5:12"
            ),
            VideoItem(
                title = "Facebook Science: DIY Magic Floating Ink Experiment",
                url = "https://player.vimeo.com/video/224237912",
                platform = "Facebook",
                category = "Science",
                duration = "3:50"
            ),
            VideoItem(
                title = "Learn Animals and Birds Sounds for Toddlers",
                url = "https://player.vimeo.com/video/14828114",
                platform = "Facebook",
                category = "Rhymes",
                duration = "4:00"
            )
        )

        for (video in defaultVideos) {
            repository.insertVideo(video)
        }
        
        // Log seeding
        repository.insertLog(ActivityLog(
            activityType = "SYSTEM",
            detail = "Database seeded with 10 safe educational videos"
        ))
    }
}
