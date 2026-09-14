package com.example.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ParentConfig
import com.example.data.VideoItem
import com.example.viewmodel.SafeKidViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KidHomeScreen(
    viewModel: SafeKidViewModel,
    isUrdu: Boolean,
    onNavigateToParentUnlock: () -> Unit
) {
    val allVideos by viewModel.allVideos.collectAsState()
    val config by viewModel.config.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedPlatform by viewModel.selectedPlatform.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val elapsedSeconds by viewModel.elapsedSeconds.collectAsState()
    val searchAlertMessage by viewModel.searchAlertMessage.collectAsState()
    val isTimeLimitExceeded by viewModel.isTimeLimitExceeded.collectAsState()

    // Determine allowed platforms from config
    val allowedPlatforms = remember(config.allowedPlatforms) {
        config.allowedPlatforms.split(",").map { it.trim() }.filter { it.isNotEmpty() }
    }

    // Filter videos based on platform, category, and search query
    val filteredVideos = remember(allVideos, selectedPlatform, selectedCategory, searchQuery, allowedPlatforms) {
        allVideos.filter { video ->
            // Platform visible
            val isPlatformAllowed = allowedPlatforms.contains(video.platform)
            val matchesPlatform = selectedPlatform == null || video.platform == selectedPlatform
            
            // Category matches
            val matchesCategory = selectedCategory == "All" || selectedCategory == null || video.category == selectedCategory
            
            // Search string matches
            val matchesSearch = searchQuery.isEmpty() || video.title.lowercase().contains(searchQuery.lowercase()) ||
                    video.category.lowercase().contains(searchQuery.lowercase())
            
            isPlatformAllowed && matchesPlatform && matchesCategory && matchesSearch
        }
    }

    // Lock screen overlay when Screen Time expires
    if (isTimeLimitExceeded) {
        TimeLimitExceededOverlay(
            isUrdu = isUrdu,
            onUnlock = onNavigateToParentUnlock,
            viewModel = viewModel
        )
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.SentimentSatisfiedAlt,
                                contentDescription = null,
                                tint = Color.White
                            )
                        }
                        Column {
                            Text(
                                text = "SafeKid View",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "App by Ai Creator studio",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                },
                actions = {
                    // Language Switcher
                    TextButton(
                        onClick = { viewModel.toggleLanguage() },
                        modifier = Modifier.testTag("language_toggle_button")
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(imageVector = Icons.Filled.Language, contentDescription = "Language", modifier = Modifier.size(18.dp))
                            Text(
                                text = if (isUrdu) "English" else "اردو",
                                style = MaterialTheme.typography.labelLarge
                            )
                        }
                    }

                    // Parent Lock Entrance
                    IconButton(
                        onClick = onNavigateToParentUnlock,
                        modifier = Modifier
                            .testTag("parent_unlock_button")
                            .background(
                                color = MaterialTheme.colorScheme.secondaryContainer,
                                shape = CircleShape
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Settings,
                            contentDescription = if (isUrdu) "والدین کا سیکشن" else "Parent Portal",
                            tint = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surface,
                            MaterialTheme.colorScheme.background
                        )
                    )
                )
        ) {
            // Timer & Search Banner
            TimerAndSearchSection(
                elapsedSeconds = elapsedSeconds,
                totalLimitMinutes = config.dailyTimeLimitMinutes,
                searchQuery = searchQuery,
                onSearchChanged = { viewModel.onSearchQueryChanged(it) },
                isUrdu = isUrdu,
                searchAlertMessage = searchAlertMessage,
                onClearSearchAlert = { viewModel.clearSearchAlert() }
            )

            // Social Media Platform Selection Row (With individual toggles)
            PlatformSelectionRow(
                allowedPlatforms = allowedPlatforms,
                selectedPlatform = selectedPlatform,
                onPlatformSelected = { viewModel.setPlatform(it) },
                isUrdu = isUrdu
            )

            // Category Selection Badges (All, Science, Education, Cartoon, Rhymes)
            CategorySelectionRow(
                selectedCategory = selectedCategory,
                onCategorySelected = { viewModel.setCategory(it) },
                isUrdu = isUrdu
            )

            // Safe Videos list grid
            if (filteredVideos.isEmpty()) {
                EmptyVideosState(isUrdu = isUrdu, hasSearch = searchQuery.isNotEmpty())
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(minSize = 160.dp),
                    contentPadding = PaddingValues(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredVideos, key = { it.id }) { video ->
                        VideoCardItem(
                            video = video,
                            isUrdu = isUrdu,
                            onClick = { viewModel.selectVideo(video) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TimerAndSearchSection(
    elapsedSeconds: Int,
    totalLimitMinutes: Int,
    searchQuery: String,
    onSearchChanged: (String) -> Unit,
    isUrdu: Boolean,
    searchAlertMessage: String?,
    onClearSearchAlert: () -> Unit
) {
    val totalLimitSeconds = totalLimitMinutes * 60
    val remainingSeconds = (totalLimitSeconds - elapsedSeconds).coerceAtLeast(0)
    val minutesLeft = remainingSeconds / 60
    val secondsLeft = remainingSeconds % 60
    val timerString = String.format("%02d:%02d", minutesLeft, secondsLeft)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        // Countdown clock
        Card(
            colors = CardDefaults.cardColors(
                containerColor = if (remainingSeconds < 120) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.primaryContainer
            ),
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.HourglassTop,
                        contentDescription = "Timer",
                        tint = if (remainingSeconds < 120) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isUrdu) "اسکرین کا وقت باقی:" else "Screen Time Remaining:",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (remainingSeconds < 120) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                Text(
                    text = timerString,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (remainingSeconds < 120) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.testTag("remaining_timer")
                )
            }
        }

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChanged,
            placeholder = {
                Text(
                    text = if (isUrdu) "بچوں کے لیے محفوظ ویڈیوز تلاش کریں..." else "Search safe videos...",
                    style = MaterialTheme.typography.bodyMedium
                )
            },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Filled.Search,
                    contentDescription = "Search"
                )
            },
            trailingIcon = if (searchQuery.isNotEmpty()) {
                {
                    IconButton(onClick = { onSearchChanged("") }) {
                        Icon(imageVector = Icons.Filled.Close, contentDescription = "Clear")
                    }
                }
            } else null,
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("kid_search_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f),
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White
            ),
            singleLine = true
        )

        // Safety Trigger alert dialog/warning banner
        if (searchAlertMessage != null) {
            AlertDialog(
                onDismissRequest = onClearSearchAlert,
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Shield,
                            contentDescription = "Shield",
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isUrdu) "محفوظ فلٹر الرٹ" else "Safety Filter Alert",
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                text = {
                    Text(
                        text = searchAlertMessage,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                },
                confirmButton = {
                    Button(
                        onClick = onClearSearchAlert,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text(text = if (isUrdu) "ٹھیک ہے" else "Okay")
                    }
                },
                shape = RoundedCornerShape(20.dp)
            )
        }
    }
}

@Composable
fun PlatformSelectionRow(
    allowedPlatforms: List<String>,
    selectedPlatform: String?,
    onPlatformSelected: (String?) -> Unit,
    isUrdu: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        Text(
            text = if (isUrdu) "سوشل میڈیا پلیٹ فارمز" else "Social Media Channels",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Platform Buttons
            val platforms = listOf("YouTube", "TikTok", "Vimeo", "Facebook")
            platforms.forEach { platform ->
                val isAllowed = allowedPlatforms.contains(platform)
                if (isAllowed) {
                    val isSelected = selectedPlatform == platform
                    val badgeColor = when (platform) {
                        "YouTube" -> Color(0xFFEF5350)
                        "TikTok" -> Color(0xFF212121)
                        "Vimeo" -> Color(0xFF29B6F6)
                        else -> Color(0xFF1E88E5)
                    }

                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) badgeColor else MaterialTheme.colorScheme.surface,
                            contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                        ),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onPlatformSelected(platform) }
                            .testTag("platform_btn_$platform"),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp, horizontal = 4.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .background(
                                        color = if (isSelected) Color.White.copy(alpha = 0.2f) else badgeColor.copy(alpha = 0.1f),
                                        shape = CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = when (platform) {
                                        "YouTube" -> Icons.Filled.PlayArrow
                                        "TikTok" -> Icons.Filled.Audiotrack
                                        "Vimeo" -> Icons.Filled.VideoLibrary
                                        else -> Icons.Filled.ThumbUp
                                    },
                                    contentDescription = platform,
                                    tint = if (isSelected) Color.White else badgeColor,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = platform,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CategorySelectionRow(
    selectedCategory: String?,
    onCategorySelected: (String?) -> Unit,
    isUrdu: Boolean
) {
    val categories = listOf("All", "Science", "Education", "Cartoon", "Rhymes")
    val urduCategories = mapOf(
        "All" to "تمام",
        "Science" to "سائنس",
        "Education" to "تعلیم",
        "Cartoon" to "کارٹون",
        "Rhymes" to "نظمیں"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        categories.forEach { category ->
            val isSelected = selectedCategory == category
            val label = if (isUrdu) urduCategories[category] ?: category else category

            FilterChip(
                selected = isSelected,
                onClick = { onCategorySelected(category) },
                label = { 
                    Text(
                        text = label,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    ) 
                },
                shape = RoundedCornerShape(20.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                    selectedLabelColor = Color.White
                ),
                modifier = Modifier.weight(1f).testTag("category_chip_$category")
            )
        }
    }
}

@Composable
fun VideoCardItem(
    video: VideoItem,
    isUrdu: Boolean,
    onClick: () -> Unit
) {
    val platformColor = when (video.platform) {
        "YouTube" -> Color(0xFFEF5350)
        "TikTok" -> Color(0xFF212121)
        "Vimeo" -> Color(0xFF29B6F6)
        else -> Color(0xFF1E88E5)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("video_item_${video.id}"),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column {
            // Visual Banner mimicking thumbnail
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp)
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                platformColor.copy(alpha = 0.8f),
                                platformColor.copy(alpha = 0.4f)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                // Large play button overlay
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(Color.White, shape = CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.PlayArrow,
                        contentDescription = "Play",
                        tint = platformColor,
                        modifier = Modifier.size(24.dp)
                    )
                }

                // Platform pill at top left
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(8.dp)
                        .background(Color.Black.copy(alpha = 0.6f), shape = RoundedCornerShape(8.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = video.platform,
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Duration badge at bottom right
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(8.dp)
                        .background(Color.Black.copy(alpha = 0.6f), shape = RoundedCornerShape(8.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = video.duration,
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }

            // Text Info
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(10.dp)
            ) {
                // Category Tag
                Box(
                    modifier = Modifier
                        .background(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(6.dp)
                        )
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    val catLabel = if (isUrdu) {
                        when (video.category) {
                            "Education" -> "تعلیم"
                            "Science" -> "سائنس"
                            "Cartoon" -> "کارٹون"
                            "Rhymes" -> "نظمیں"
                            else -> video.category
                        }
                    } else video.category

                    Text(
                        text = catLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = video.title,
                    style = MaterialTheme.typography.titleSmall,
                    maxLines = 2,
                    minLines = 2,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    lineHeight = 16.sp,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun EmptyVideosState(isUrdu: Boolean, hasSearch: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp, horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(MaterialTheme.colorScheme.secondaryContainer, shape = CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (hasSearch) Icons.Filled.SearchOff else Icons.Filled.VideoLibrary,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSecondaryContainer,
                modifier = Modifier.size(36.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = if (isUrdu) {
                if (hasSearch) "اس نام کی کوئی ویڈیو نہیں ملی!" else "اس کیٹیگری میں کوئی ویڈیو دستیاب نہیں ہے"
            } else {
                if (hasSearch) "No videos found matching search!" else "No videos in this channel/category yet"
            },
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = if (isUrdu) {
                "والدین مانیٹرنگ پینل سے نئی ویڈیوز شامل کر سکتے ہیں۔"
            } else {
                "Parents can add whitelist links inside the Parent Portal settings."
            },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun TimeLimitExceededOverlay(
    isUrdu: Boolean,
    onUnlock: () -> Unit,
    viewModel: SafeKidViewModel
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF004D40),
                        Color(0xFF00241E)
                    )
                )
            )
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .background(Color.White.copy(alpha = 0.15f), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Bedtime,
                    contentDescription = "Sleep Time",
                    tint = Color(0xFFFFD54F),
                    modifier = Modifier.size(54.dp)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = if (isUrdu) "سونے کا وقت ہو گیا ہے! 💤" else "Bedtime! Screen Time Finished! 💤",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (isUrdu) {
                    "آپ کے آج کا دیکھنے کا وقت ختم ہو چکا ہے۔ پیارے بچوں، اب آرام کریں اور کھیلیں!"
                } else {
                    "You have exhausted your whitelisted daily view limit. Time to play outside or sleep!"
                },
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White.copy(alpha = 0.8f),
                textAlign = TextAlign.Center,
                lineHeight = 22.sp
            )
            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = onUnlock,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFD54F), contentColor = Color.Black),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("expired_unlock_button")
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(imageVector = Icons.Filled.Lock, contentDescription = "Unlock", tint = Color.Black)
                    Text(
                        text = if (isUrdu) "والدین کا سیکشن (پن کوڈ درج کریں)" else "Parent Entry (Enter PIN)",
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Language switch inside timeout
            TextButton(
                onClick = { viewModel.toggleLanguage() }
            ) {
                Text(
                    text = if (isUrdu) "English" else "اردو",
                    color = Color.White,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}
