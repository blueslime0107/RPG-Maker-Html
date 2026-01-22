# RPG-Maker-Html
rpg maker mz editor remade in html/js 

## Features

### Map Editor
- **Player Start Position**: Set player starting position by right-clicking on empty tiles
- **Player Display**: Player is rendered with character sprite and red border on the start map
- **Tile Painting**: Multi-layer tile editing with live preview
- **Event Management**: Create, edit, copy, paste, and delete events on the map

### Event Editor
- **Drag & Drop**: Click and drag events to move them across the map (collision detection enabled)
- **Context Menus**:
  - **Empty Tile Right-Click**: Player / Create Event / Paste
  - **Event Right-Click**: Edit / Copy / Delete
  - **Command Right-Click**: Add / Copy / Paste / Delete

### Keyboard Shortcuts
- **Enter**: Add new command (in command list) or set player position (on map)
- **Ctrl+C**: Copy event or command
- **Ctrl+V**: Paste event or command
- **Delete/Backspace**: Delete event or command
- **Space**: Edit selected command

### Event ID Management
- Automatically reuses null slots when creating new events
- Example: If events [2, 3, null, 5, null, 7] exist, new events will use IDs 4 and 6

### Inspector Features
- Real-time event editing with visual preview
- Multi-page event support with tabs
- Font size adjustment (8-16px)
- Command list with syntax highlighting

## Usage

1. Open `index.html` in a web browser
2. Select a map from the left panel
3. Right-click on the map to:
   - Set player start position
   - Create new events
   - Paste copied events
4. Click events to drag them, or right-click for options
5. Double-click events to edit in the inspector panel

## Technical Details

- Pure HTML/CSS/JavaScript implementation
- Compatible with RPG Maker MZ project structure
- Supports all standard event commands
- Real-time canvas rendering with 48x48 tile system
