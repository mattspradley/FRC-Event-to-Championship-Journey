import 'package:flutter/material.dart';

class TeamFilter extends StatelessWidget {
  final TextEditingController searchController;
  final String statusFilter;
  final String sortBy;
  final Function(String) onStatusFilterChanged;
  final Function(String) onSortChanged;

  const TeamFilter({
    Key? key,
    required this.searchController,
    required this.statusFilter,
    required this.sortBy,
    required this.onStatusFilterChanged,
    required this.onSortChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      color: Theme.of(context).colorScheme.surface,
      child: Column(
        children: [
          // Search bar
          TextField(
            controller: searchController,
            decoration: InputDecoration(
              hintText: 'Search teams...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              suffixIcon: searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => searchController.clear(),
                    )
                  : null,
            ),
          ),
          
          const SizedBox(height: 12),
          
          // Filter row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                // Status filter dropdown
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: DropdownButton<String>(
                    value: statusFilter,
                    icon: const Icon(Icons.arrow_drop_down),
                    underline: const SizedBox.shrink(),
                    style: TextStyle(
                      color: Theme.of(context).textTheme.bodyLarge?.color,
                      fontSize: 14,
                    ),
                    items: [
                      DropdownMenuItem(
                        value: 'all',
                        child: Row(
                          children: [
                            Icon(
                              Icons.filter_list,
                              size: 16,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            const Text('All Teams'),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'qualified',
                        child: Row(
                          children: [
                            Icon(
                              Icons.check_circle,
                              size: 16,
                              color: Colors.green.shade700,
                            ),
                            const SizedBox(width: 8),
                            const Text('Qualified'),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'waitlist',
                        child: Row(
                          children: [
                            Icon(
                              Icons.hourglass_top,
                              size: 16,
                              color: Colors.amber.shade700,
                            ),
                            const SizedBox(width: 8),
                            const Text('Waitlist'),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'not-qualified',
                        child: Row(
                          children: [
                            Icon(
                              Icons.cancel,
                              size: 16,
                              color: Colors.red.shade700,
                            ),
                            const SizedBox(width: 8),
                            const Text('Not Qualified'),
                          ],
                        ),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        onStatusFilterChanged(value);
                      }
                    },
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Sort dropdown
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: DropdownButton<String>(
                    value: sortBy,
                    icon: const Icon(Icons.arrow_drop_down),
                    underline: const SizedBox.shrink(),
                    style: TextStyle(
                      color: Theme.of(context).textTheme.bodyLarge?.color,
                      fontSize: 14,
                    ),
                    items: [
                      DropdownMenuItem(
                        value: 'number',
                        child: Row(
                          children: [
                            Icon(
                              Icons.sort_by_alpha,
                              size: 16,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            const Text('Number'),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'name',
                        child: Row(
                          children: [
                            Icon(
                              Icons.sort_by_alpha,
                              size: 16,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            const Text('Name'),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'rank',
                        child: Row(
                          children: [
                            Icon(
                              Icons.leaderboard,
                              size: 16,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            const Text('Rank'),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'status',
                        child: Row(
                          children: [
                            Icon(
                              Icons.verified,
                              size: 16,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            const Text('Status'),
                          ],
                        ),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        onSortChanged(value);
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}