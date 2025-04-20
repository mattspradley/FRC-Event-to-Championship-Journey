import 'package:flutter/material.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/services/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  bool _isLoading = true;
  String? _errorMessage;
  final TextEditingController _apiKeyController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(_animationController);
    _animationController.forward();

    // Check if API key exists and validate it
    _checkApiKey();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _apiKeyController.dispose();
    super.dispose();
  }

  Future<void> _checkApiKey() async {
    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final apiService = Provider.of<ApiService>(context, listen: false);
      final secureStorage = const FlutterSecureStorage();
      
      // Check if we have an API key stored
      final apiKey = await secureStorage.read(key: 'TBA_API_KEY');
      
      if (apiKey != null && apiKey.isNotEmpty) {
        // Validate the API key
        final isValid = await apiService.validateApiKey(apiKey);
        if (isValid) {
          appState.hasApiKey = true;
          
          // Fetch initial data
          await _fetchInitialData();
          
          // Navigate to home screen
          if (mounted) {
            _navigateToHome();
          }
          return;
        }
      }
      
      // No valid API key found, show API key input
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error initializing app: $e';
        });
      }
    }
  }

  Future<void> _fetchInitialData() async {
    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      // Set loading state
      appState.isLoading = true;
      
      // Fetch available years
      final years = await apiService.fetchYears();
      if (years.isNotEmpty) {
        appState.selectedYear = years.first; // Set to most recent year
        
        // Fetch events for the selected year
        final events = await apiService.searchEvents(year: appState.selectedYear);
        appState.events = events;
      }
      
      // Clear loading state
      appState.isLoading = false;
    } catch (e) {
      final appState = Provider.of<AppState>(context, listen: false);
      appState.isLoading = false;
      appState.errorMessage = 'Error loading initial data: $e';
    }
  }

  void _navigateToHome() {
    Navigator.pushReplacementNamed(context, '/home');
  }

  Future<void> _submitApiKey() async {
    if (_apiKeyController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter an API key';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final appState = Provider.of<AppState>(context, listen: false);
      
      // Validate the API key
      final isValid = await apiService.validateApiKey(_apiKeyController.text);
      
      if (isValid) {
        appState.hasApiKey = true;
        
        // Fetch initial data
        await _fetchInitialData();
        
        // Navigate to home screen
        if (mounted) {
          _navigateToHome();
        }
      } else {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'Invalid API key, please check and try again';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error validating API key: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF3949AB), Color(0xFF1A237E)],
          ),
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.sports_score_rounded,
                    size: 80,
                    color: Colors.white,
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'FRC Championship Tracker',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Track team performance and championship qualification',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  if (_isLoading)
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    )
                  else
                    Column(
                      children: [
                        TextField(
                          controller: _apiKeyController,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            hintText: 'Enter your Blue Alliance API Key',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide.none,
                            ),
                            prefixIcon: const Icon(Icons.vpn_key_rounded),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _submitApiKey,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: Theme.of(context).primaryColor,
                            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            'Continue',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        if (_errorMessage != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 16),
                            child: Text(
                              _errorMessage!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.red,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        const SizedBox(height: 24),
                        GestureDetector(
                          onTap: () {
                            // TODO: Open a help dialog or webview explaining how to get an API key
                          },
                          child: const Text(
                            'Need an API key? Tap here to learn how to get one',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white70,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}