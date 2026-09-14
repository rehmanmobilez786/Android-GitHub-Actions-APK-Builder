package com.example.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ActivityLog
import com.example.data.ParentConfig
import com.example.data.VideoItem
import com.example.viewmodel.SafeKidViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ParentPanelScreen(
    viewModel: SafeKidViewModel,
    isUrdu: Boolean,
    onBack: () -> Unit
) {
    val config by viewModel.config.collectAsState()
    val allLogs by viewModel.allLogs.collectAsState()
    val allVideos by viewModel.allVideos.collectAsState()
    val elapsedSeconds by viewModel.elapsedSeconds.collectAsState()

    var isAuthenticated by remember { mutableStateOf(false) }
    var pinInput by remember { mutableStateOf("") }
    var pinError by remember { mutableStateOf<String?>(null) }

    // Tab tracking: 0 = Control, 1 = Video Whitelist, 2 = Activity Logs
    var selectedTab by remember { mutableIntStateOf(0) }

    if (!isAuthenticated) {
        // Render PIN validation
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(text = if (isUrdu) "والدین کی تصدیق" else "Parent Authentication") },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                )
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(MaterialTheme.colorScheme.background),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .background(MaterialTheme.colorScheme.primaryContainer, shape = CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Lock,
                                contentDescription = "Lock",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (isUrdu) "والدین کا پن کوڈ درج کریں" else "Enter Parent Security PIN",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (isUrdu) "پہلا پن کوڈ 1234 ہے" else "Default security code is 1234",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(18.dp))

                        OutlinedTextField(
                            value = pinInput,
                            onValueChange = {
                                if (it.length <= 4) pinInput = it
                            },
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                            label = { Text(text = if (isUrdu) "سیکیورٹی پن" else "4-Digit PIN") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("parent_pin_input"),
                            singleLine = true,
                            isError = pinError != null
                        )

                        if (pinError != null) {
                            Text(
                                text = pinError!!,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = {
                                if (pinInput == config.parentPin) {
                                    isAuthenticated = true
                                    viewModel.logActivity("ADMIN_ENTER", "Admin accessed parent control dashboard")
                                } else {
                                    pinError = if (isUrdu) "غلط پن کوڈ! دوبارہ کوشش کریں" else "Invalid PIN! Please try again"
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("parent_pin_submit")
                        ) {
                            Text(
                                text = if (isUrdu) "تصدیق کریں اور کھولیں" else "Verify & Unlock",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
        return
    }

    // Unlocked Parent Panel
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isUrdu) "سیف کڈ کنٹرول پینل" else "SafeKid View Admin Panel",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "App by Ai Creator studio",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.testTag("parent_panel_back")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Section Tab Header
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { 
                        Text(
                            text = if (isUrdu) "کنٹرول" else "Controls",
                            fontWeight = FontWeight.Bold
                        ) 
                    },
                    modifier = Modifier.testTag("tab_controls")
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { 
                        Text(
                            text = if (isUrdu) "ویڈیوز" else "Whitelists",
                            fontWeight = FontWeight.Bold
                        ) 
                    },
                    modifier = Modifier.testTag("tab_whitelists")
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { 
                        Text(
                            text = if (isUrdu) "سرگرمی" else "Activity Logs",
                            fontWeight = FontWeight.Bold
                        ) 
                    },
                    modifier = Modifier.testTag("tab_logs")
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                when (selectedTab) {
                    0 -> ControlsView(
                        config = config,
                        elapsedSeconds = elapsedSeconds,
                        viewModel = viewModel,
                        isUrdu = isUrdu
                    )
                    1 -> WhitelistView(
                        allVideos = allVideos,
                        viewModel = viewModel,
                        isUrdu = isUrdu
                    )
                    2 -> LogsView(
                        allLogs = allLogs,
                        viewModel = viewModel,
                        isUrdu = isUrdu
                    )
                }
            }

            // AI Creator Studio Footer
            Card(
                shape = RoundedCornerShape(0.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.VerifiedUser,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "SafeKid View - App by Ai Creator studio © 2026",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun ControlsView(
    config: ParentConfig,
    elapsedSeconds: Int,
    viewModel: SafeKidViewModel,
    isUrdu: Boolean
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Today's Status Tracker
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = if (isUrdu) "آج کے استعمال کی رپورٹ" else "Today's Usage Summary",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = if (isUrdu) "آج کا اسکرین وقت" else "Elapsed Screen Time",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${elapsedSeconds / 60}m ${elapsedSeconds % 60}s",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.secondary
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = if (isUrdu) "مختص شدہ روزانہ حد" else "Allocated Limit",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${config.dailyTimeLimitMinutes} mins",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { viewModel.resetDailyTimeUsage() },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("reset_usage_timer_btn"),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Filled.Refresh, contentDescription = "Reset")
                            Text(
                                text = if (isUrdu) "اسکرین کا وقت دوبارہ زیرو کریں" else "Reset Elapsed Timer",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // Daily Time Limit Configurator
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = if (isUrdu) "روزانہ کی حد مقرر کریں (منٹ)" else "Adjust Daily Limits (Minutes)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val limitPresets = listOf(15, 30, 45, 60, 120)
                        limitPresets.forEach { minutes ->
                            val isSelected = config.dailyTimeLimitMinutes == minutes
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.updateTimeLimit(minutes) },
                                label = { Text(text = "$minutes m") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                                    selectedLabelColor = Color.White
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("preset_limit_$minutes")
                            )
                        }
                    }
                }
            }
        }

        // Channels / Social Media Whitelisting switches
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = if (isUrdu) "سوشل میڈیا پلیٹ فارمز کو بند/کھولیں" else "Toggle Allowed Platforms",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = if (isUrdu) "جس پلیٹ فارم کو بند کریں گے، وہ بچے کے مینو سے غائب ہو جائے گا" else "Disabled platforms will disappear completely from kid's selection hub",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    val allPlatforms = listOf("YouTube", "TikTok", "Vimeo", "Facebook")
                    val allowed = config.allowedPlatforms.split(",").map { it.trim() }

                    allPlatforms.forEach { platform ->
                        val isAllowed = allowed.contains(platform)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = when (platform) {
                                        "YouTube" -> Icons.Filled.PlayArrow
                                        "TikTok" -> Icons.Filled.Audiotrack
                                        "Vimeo" -> Icons.Filled.VideoLibrary
                                        else -> Icons.Filled.ThumbUp
                                    },
                                    contentDescription = platform,
                                    tint = MaterialTheme.colorScheme.secondary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = platform,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Switch(
                                checked = isAllowed,
                                onCheckedChange = { viewModel.togglePlatformAccess(platform, it) },
                                modifier = Modifier.testTag("switch_platform_$platform")
                            )
                        }
                    }
                }
            }
        }

        // Custom Block Keywords
        item {
            var keywordInput by remember { mutableStateOf(config.blockedKeywords) }
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = if (isUrdu) "ممنوعہ الفاظ کی فہرست" else "Screened Query Keywords (Comma-separated)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = keywordInput,
                        onValueChange = { keywordInput = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("blocked_keywords_field"),
                        textStyle = MaterialTheme.typography.bodyMedium,
                        label = { Text(text = if (isUrdu) "الفاظ (مثال: adult, bad, horror)" else "Keywords list") }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = { viewModel.updateBlockedKeywords(keywordInput) },
                        modifier = Modifier
                            .align(Alignment.End)
                            .testTag("save_keywords_btn")
                    ) {
                        Text(text = if (isUrdu) "تبدیلی محفوظ کریں" else "Save Blocklist")
                    }
                }
            }
        }

        // Security settings and Change PIN
        item {
            var newPinInput by remember { mutableStateOf("") }
            var pinMessage by remember { mutableStateOf<String?>(null) }
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = if (isUrdu) "پاس ورڈ (پن کوڈ) تبدیل کریں" else "Update Parent Entry PIN Code",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = newPinInput,
                        onValueChange = { if (it.length <= 4) newPinInput = it },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("change_pin_field"),
                        label = { Text(text = if (isUrdu) "نیا 4 ہندسی پن کوڈ" else "New 4-digit PIN") }
                    )

                    if (pinMessage != null) {
                        Text(
                            text = pinMessage!!,
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = {
                            if (newPinInput.length == 4) {
                                viewModel.updatePin(newPinInput)
                                pinMessage = if (isUrdu) "پن کوڈ کامیابی سے تبدیل ہو گیا!" else "PIN updated successfully!"
                                newPinInput = ""
                            } else {
                                pinMessage = if (isUrdu) "پن کوڈ 4 ہندسوں کا ہونا ضروری ہے" else "PIN must be exactly 4 digits"
                            }
                        },
                        modifier = Modifier
                            .align(Alignment.End)
                            .testTag("save_pin_btn")
                    ) {
                        Text(text = if (isUrdu) "پن کوڈ تبدیل کریں" else "Update PIN")
                    }
                }
            }
        }
    }
}

@Composable
fun WhitelistView(
    allVideos: List<VideoItem>,
    viewModel: SafeKidViewModel,
    isUrdu: Boolean
) {
    var title by remember { mutableStateOf("") }
    var url by remember { mutableStateOf("") }
    var platform by remember { mutableStateOf("YouTube") }
    var category by remember { mutableStateOf("Science") }
    var formMessage by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Form to Whitelist/Add New Video Link
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = if (isUrdu) "محفوظ ویڈیو شامل کریں" else "Whitelist/Embed Safe Video Link",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("add_video_title"),
                        label = { Text(text = if (isUrdu) "ویڈیو کا عنوان" else "Video Title") }
                    )

                    OutlinedTextField(
                        value = url,
                        onValueChange = { url = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("add_video_url"),
                        label = { Text(text = if (isUrdu) "ویڈیو لنک (URL)" else "Video Embed URL (YouTube/Vimeo)") }
                    )

                    // Platform Selection Radio
                    Column {
                        Text(
                            text = if (isUrdu) "پلیٹ فارم منتخب کریں:" else "Platform:",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("YouTube", "TikTok", "Vimeo", "Facebook").forEach { plat ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.clickable { platform = plat }
                                ) {
                                    RadioButton(
                                        selected = platform == plat,
                                        onClick = { platform = plat },
                                        modifier = Modifier.testTag("radio_plat_$plat")
                                    )
                                    Text(text = plat, fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    // Category Selection Radio
                    Column {
                        Text(
                            text = if (isUrdu) "کیٹیگری منتخب کریں:" else "Category:",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("Education", "Science", "Cartoon", "Rhymes").forEach { cat ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.clickable { category = cat }
                                ) {
                                    RadioButton(
                                        selected = category == cat,
                                        onClick = { category = cat },
                                        modifier = Modifier.testTag("radio_cat_$cat")
                                    )
                                    Text(text = cat, fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    if (formMessage != null) {
                        Text(
                            text = formMessage!!,
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }

                    Button(
                        onClick = {
                            if (title.isNotEmpty() && url.isNotEmpty()) {
                                viewModel.addCustomVideo(title, url, platform, category)
                                formMessage = if (isUrdu) "ویڈیو کامیابی سے شامل ہو گئی!" else "Video successfully whitelisted!"
                                title = ""
                                url = ""
                            } else {
                                formMessage = if (isUrdu) "براہ کرم تمام خانے پُر کریں" else "Please complete all fields"
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("submit_video_btn"),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = if (isUrdu) "ویڈیو شامل کریں" else "Whitelist Video",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Whitelisted Videos Management List
        item {
            Text(
                text = if (isUrdu) "موجودہ ویڈیوز کی فہرست" else "Currently Whitelisted Videos",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        items(allVideos, key = { it.id }) { video ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("manage_video_item_${video.id}")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = video.title,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(top = 2.dp)
                        ) {
                            Badge(containerColor = MaterialTheme.colorScheme.secondaryContainer) {
                                Text(text = video.platform, style = MaterialTheme.typography.labelSmall)
                            }
                            Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) {
                                Text(text = video.category, style = MaterialTheme.typography.labelSmall)
                            }
                            if (video.isCustom) {
                                Badge(containerColor = MaterialTheme.colorScheme.tertiaryContainer) {
                                    Text(text = if (isUrdu) "والدین" else "Added", style = MaterialTheme.typography.labelSmall)
                                }
                            }
                        }
                    }

                    IconButton(
                        onClick = { viewModel.deleteVideo(video) },
                        modifier = Modifier.testTag("delete_video_btn_${video.id}")
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Delete",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun LogsView(
    allLogs: List<ActivityLog>,
    viewModel: SafeKidViewModel,
    isUrdu: Boolean
) {
    val formatter = remember { SimpleDateFormat("hh:mm:ss a, dd MMM", Locale.getDefault()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (isUrdu) "بچے کی سرگرمیوں کا ریکارڈ" else "Live Activity Logs",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )

            Button(
                onClick = { viewModel.clearAllLogs() },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("clear_logs_btn")
            ) {
                Text(text = if (isUrdu) "ریکارڈ صاف کریں" else "Clear Logs", fontSize = 11.sp)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (allLogs.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (isUrdu) "ابھی کوئی سرگرمی ریکارڈ نہیں ہوئی ہے" else "No activities logged yet",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(allLogs, key = { it.id }) { log ->
                    val color = when (log.activityType) {
                        "BLOCKED_ATTEMPT" -> MaterialTheme.colorScheme.errorContainer
                        "WATCH" -> MaterialTheme.colorScheme.primaryContainer
                        "TIME_OUT" -> MaterialTheme.colorScheme.tertiaryContainer
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    }

                    val icon = when (log.activityType) {
                        "BLOCKED_ATTEMPT" -> Icons.Filled.Shield
                        "WATCH" -> Icons.Filled.PlayCircle
                        "TIME_OUT" -> Icons.Filled.AccessTime
                        else -> Icons.Filled.Info
                    }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = color),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color.White.copy(alpha = 0.5f), shape = CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = log.detail,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = formatter.format(Date(log.timestamp)),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
