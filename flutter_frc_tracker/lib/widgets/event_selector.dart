import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/models/event.dart';
import 'package:flutter_frc_tracker/services/api_service.dart';

class EventSelector extends StatefulWidget {
  final Function(Event) onEventSelected;
  final Function(int) onYearChanged;

  const EventSelector({
    Key? key,
    required this.onEventSelected,
    required this.onYearChanged,
  }) : super(key: key);

  @override
  State<EventSelector> createState() => _EventSelectorState();
}

class _EventSelectorState extends State<EventSelector> {
  final TextEditingController _searchController = TextEditingController();
  bool _isSearchFocused = false;
  final FocusNode _searchFocusNode = FocusNode();
  List<Event> _filteredEvents = [];
  String _searchQuery = '';
  int _selectedYear = DateTime.now().year;
  OverlayEntry? _overlayEntry;

  @override
  void initState() {
    super.initState();
    _searchFocusNode.addListener(_onSearchFocusChange);
    _searchController.addListener(_onSearchChanged);
    _selectedYear = Provider.of<AppState>(context, listen: false).selectedYear;
  }

  @override
  void dispose() {
    _searchFocusNode.removeListener(_onSearchFocusChange);
    _searchController.removeListener(_onSearchChanged);
    _searchFocusNode.dispose();
    _searchController.dispose();
    _removeOverlay();
    super.dispose();
  }

  void _onSearchFocusChange() {
    if (_searchFocusNode.hasFocus) {
      _showOverlay();
    } else {
      _removeOverlay();
    }
    setState(() {
      _isSearchFocused = _searchFocusNode.hasFocus;
    });
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text;
      _updateFilteredEvents();
    });
  }

  void _updateFilteredEvents() {
    final appState = Provider.of<AppState>(context, listen: false);
    if (_searchQuery.isEmpty) {
      _filteredEvents = List.from(appState.events);
    } else {
      final query = _searchQuery.toLowerCase();
      _filteredEvents = appState.events.where((event) {
        return event.name.toLowerCase().contains(query) ||
            (event.city != null && event.city!.toLowerCase().contains(query)) ||
            (event.stateProv != null && event.stateProv!.toLowerCase().contains(query)) ||
            (event.country != null && event.country!.toLowerCase().contains(query));
      }).toList();
    }
  }

  void _showOverlay() {
    _removeOverlay();
    
    final RenderBox renderBox = context.findRenderObject() as RenderBox;
    final size = renderBox.size;
    final offset = renderBox.localToGlobal(Offset.zero);
    
    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: offset.dy + size.height,
        left: offset.dx,
        width: size.width,
        child: Material(
          elevation: 4.0,
          child: Consumer<AppState>(
            builder: (context, appState, _) {
              _updateFilteredEvents();
              return Container(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.4,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: _filteredEvents.isEmpty
                    ? ListTile(
                        title: Text(
                          appState.events.isEmpty
                              ? 'No events found. Try changing the year.'
                              : 'No events match your search',
                          style: TextStyle(
                            color: Theme.of(context).hintColor,
                          ),
                        ),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: _filteredEvents.length,
                        itemBuilder: (context, index) {
                          final event = _filteredEvents[index];
                          return ListTile(
                            title: Text(event.name),
                            subtitle: Text(
                              '${event.formattedLocation} · ${_getEventTypeName(event.eventType)}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: _getEventStatusIndicator(event),
                            onTap: () {
                              _selectEvent(event);
                            },
                          );
                        },
                      ),
              );
            },
          ),
        ),
      ),
    );
    
    Overlay.of(context).insert(_overlayEntry!);
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  void _selectEvent(Event event) {
    setState(() {
      _searchController.text = event.name;
      _searchFocusNode.unfocus();
    });
    widget.onEventSelected(event);
  }

  Widget _getEventStatusIndicator(Event event) {
    if (event.isOngoing) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.green),
        ),
        child: const Text(
          'Ongoing',
          style: TextStyle(
            fontSize: 12,
            color: Colors.green,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    } else if (event.isFuture) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.blue.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.blue),
        ),
        child: const Text(
          'Upcoming',
          style: TextStyle(
            fontSize: 12,
            color: Colors.blue,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    } else if (event.hasEnded) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey),
        ),
        child: const Text(
          'Completed',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }
    
    return const SizedBox.shrink();
  }

  String _getEventTypeName(int eventType) {
    switch (eventType) {
      case 0: return 'Regional';
      case 1: return 'District';
      case 2: return 'District Championship';
      case 3: return 'Championship Division';
      case 4: return 'Championship Finals';
      case 5: return 'District Championship Division';
      case 6: return 'Festival of Champions';
      case 7: return 'Remote Event';
      case 8: return 'Remote Event Finals';
      case 99: return 'Off-Season';
      case 100: return 'Pre-Season';
      default: return 'Unknown';
    }
  }

  void _onYearChanged(int? year) {
    if (year == null) return;
    
    setState(() {
      _selectedYear = year;
      _searchController.clear();
    });
    
    widget.onYearChanged(year);
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final hasSelectedEvent = appState.selectedEvent != null;
    
    return Container(
      padding: const EdgeInsets.all(16),
      color: Theme.of(context).colorScheme.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Year dropdown
              SizedBox(
                width: 120,
                child: DropdownButtonFormField<int>(
                  decoration: InputDecoration(
                    labelText: 'Year',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                  ),
                  value: _selectedYear,
                  items: [
                    for (int year = DateTime.now().year; year >= 2021; year--)
                      DropdownMenuItem(
                        value: year,
                        child: Text(year.toString()),
                      ),
                  ],
                  onChanged: (year) => _onYearChanged(year),
                ),
              ),
              
              const SizedBox(width: 12),
              
              // Event search box
              Expanded(
                child: TextField(
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  decoration: InputDecoration(
                    labelText: 'Search Events',
                    hintText: hasSelectedEvent
                        ? appState.selectedEvent!.name
                        : 'Select an event',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _searchFocusNode.requestFocus();
                            },
                          )
                        : null,
                  ),
                ),
              ),
            ],
          ),
          
          if (hasSelectedEvent && !_isSearchFocused) ...[
            const SizedBox(height: 12),
            _buildEventChip(appState.selectedEvent!),
          ],
        ],
      ),
    );
  }

  Widget _buildEventChip(Event event) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            event.name,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: () {
              final appState = Provider.of<AppState>(context, listen: false);
              appState.selectedEvent = null;
              appState.teams = [];
              setState(() {
                _searchController.clear();
              });
            },
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(4),
              child: Icon(
                Icons.close,
                size: 16,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}