import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/services/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:package_info_plus/package_info_plus.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _apiKeyController = TextEditingController();
  String? _currentApiKey;
  String? _appVersion;
  bool _isDarkMode = false;
  bool _isSavingApiKey = false;
  String? _apiKeyError;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _loadAppVersion();
  }

  @override
  void dispose() {
    _apiKeyController.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    final prefs = Provider.of<SharedPreferences>(context, listen: false);
    final appState = Provider.of<AppState>(context, listen: false);
    final secureStorage = const FlutterSecureStorage();
    
    // Load theme setting
    final isDarkMode = prefs.getBool('isDarkMode') ?? false;
    setState(() {
      _isDarkMode = isDarkMode;
    });
    appState.isDarkMode = isDarkMode;
    
    // Load API key
    final apiKey = await secureStorage.read(key: 'TBA_API_KEY');
    if (apiKey != null) {
      setState(() {
        _currentApiKey = apiKey;
        // Show masked version of key
        final masked = apiKey.length > 8
            ? apiKey.substring(0, 4) +
                '****' +
                apiKey.substring(apiKey.length - 4)
            : '****';
        _apiKeyController.text = masked;
      });
    }
  }

  Future<void> _loadAppVersion() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() {
          _appVersion = packageInfo.version;
        });
      }
    } catch (e) {
      // Ignore errors loading app version
    }
  }

  Future<void> _saveApiKey() async {
    if (_apiKeyController.text.isEmpty) {
      setState(() {
        _apiKeyError = 'API key cannot be empty';
      });
      return;
    }
    
    setState(() {
      _isSavingApiKey = true;
      _apiKeyError = null;
    });
    
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final appState = Provider.of<AppState>(context, listen: false);
      
      // Validate the API key
      final isValid = await apiService.validateApiKey(_apiKeyController.text);
      
      if (isValid) {
        setState(() {
          _currentApiKey = _apiKeyController.text;
          // Show masked version of key
          final masked = _apiKeyController.text.length > 8
              ? _apiKeyController.text.substring(0, 4) +
                  '****' +
                  _apiKeyController.text.substring(_apiKeyController.text.length - 4)
              : '****';
          _apiKeyController.text = masked;
        });
        
        appState.hasApiKey = true;
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('API key saved successfully')),
        );
      } else {
        setState(() {
          _apiKeyError = 'Invalid API key, please check and try again';
        });
      }
    } catch (e) {
      setState(() {
        _apiKeyError = 'Error saving API key: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSavingApiKey = false;
        });
      }
    }
  }

  Future<void> _toggleDarkMode(bool value) async {
    final prefs = Provider.of<SharedPreferences>(context, listen: false);
    final appState = Provider.of<AppState>(context, listen: false);
    
    setState(() {
      _isDarkMode = value;
    });
    
    await prefs.setBool('isDarkMode', value);
    appState.isDarkMode = value;
  }
  
  void _openTbaWebsite() {
    launchUrl(Uri.parse('https://www.thebluealliance.com/'));
  }
  
  void _openApiKeyHelp() {
    launchUrl(Uri.parse('https://www.thebluealliance.com/account'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // App Appearance Section
          _buildSectionHeader(context, 'App Appearance'),
          _buildSettingTile(
            context,
            icon: Icons.dark_mode,
            title: 'Dark Mode',
            trailing: Switch(
              value: _isDarkMode,
              onChanged: _toggleDarkMode,
            ),
          ),
          const Divider(),
          
          // API Key Section
          _buildSectionHeader(context, 'API Settings'),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'The Blue Alliance API Key',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Required to fetch data from The Blue Alliance API',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _apiKeyController,
                  decoration: InputDecoration(
                    labelText: 'API Key',
                    hintText: _currentApiKey == null ? 'Enter your Blue Alliance API Key' : null,
                    border: const OutlineInputBorder(),
                    errorText: _apiKeyError,
                    suffixIcon: _isSavingApiKey
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                            ),
                          )
                        : IconButton(
                            icon: const Icon(Icons.save),
                            onPressed: _saveApiKey,
                            tooltip: 'Save API Key',
                          ),
                  ),
                ),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: _openApiKeyHelp,
                  child: const Text(
                    'Need an API key? Tap here to get one from The Blue Alliance',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.blue,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          
          // About Section
          _buildSectionHeader(context, 'About'),
          _buildSettingTile(
            context,
            icon: Icons.public,
            title: 'The Blue Alliance Website',
            subtitle: 'Visit the official TBA website',
            onTap: _openTbaWebsite,
          ),
          if (_appVersion != null)
            _buildSettingTile(
              context,
              icon: Icons.info_outline,
              title: 'App Version',
              subtitle: 'v$_appVersion',
            ),
          _buildSettingTile(
            context,
            icon: Icons.code,
            title: 'Developer',
            subtitle: 'Created using Flutter',
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }

  Widget _buildSettingTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle) : null,
      trailing: trailing,
      onTap: onTap,
    );
  }
}