# RPG Maker MZ HTML Editor - AI Coding Instructions

## Project Overview
A web-based editor for RPG Maker MZ projects using pure HTML/CSS/JavaScript. No frameworks, no build system - runs directly in the browser by opening `index.html`.

## Architecture

### Core Singleton Pattern
The entire application runs through two global singletons initialized in `script/_main.js`:
- `main` (EditorMain): Central data store and initialization
- `em` (EventManager): Event/command editing operations

```javascript
window.onload = () => {
    window.main = new EditorMain();
    window.em = main.eventManager;
};
```

**Critical**: Always access these via `main.` or `em.` - never create new instances.

### Module Structure (script/)
1. **_main.js**: EditorMain (data/images) + EditorUI (UI controls/rendering)
2. **TileManager.js**: MapManager (tile operations) + MapLoader (tile rendering via autotile tables)
3. **EventManager.js**: Event CRUD, inspector panel, display logic
4. **EventEditor.js**: Command editing UI, modal dialogs, Command helper class
5. **EventCommandDef.js**: EVENT_COMMAND_DEFINITIONS - command metadata, field schemas
6. **FieldEditor.js**: Field type classes (NumberFieldEditor, SelectFieldEditor, etc.)

### Data Flow
```
Load: project/data/*.json → main.{systemData, actorsData, ...} → render
Edit: User action → modify main.map/events → renderMap() → canvas redraw
Save: Serialize data → download JSON files
```

## Key Conventions

### No Wrapper Functions
**Forbidden**: Creating delegation methods that only call another class's method
```javascript
// ❌ WRONG
copyCommand(cmd, index) {
    this.editor.copyCommand(cmd, index);
}
```
**Required**: Direct method calls
```javascript
// ✅ CORRECT
em.editor.copyCommand(cmd, index);
```

### Command Definition System
Commands are defined once in `EventCommandDef.js` with:
- `name`, `category`, `defaultParm`: Metadata
- `getDisplayText(params, cmd)`: How command appears in inspector
- `editorFields`: Field configuration for editing UI
- `endCode`: Paired closing command (e.g., 111 → 412 for conditionals)

**Pattern**: When adding commands, define ALL behavior in EVENT_COMMAND_DEFINITIONS first, then use `definition.editorFields` to auto-generate UI.

### Event Manager Responsibilities
- Inspector panel lifecycle (loadEventToInspector, displayCommandList)
- Canvas rendering (drawCharacter, drawPlayer)
- Data access helpers (getSwitchName, getVariableName, getActorName, etc.)
- Context menus and keyboard shortcuts

### Event Editor Responsibilities  
- Command editing modals (showCommandList, editCommand)
- Command operations (copyCommand, pasteCommand, deleteCommand, insertCommand)
- Selection management (selectCommand, selectCommandRange)
- Field editors via FieldEditor classes

### Tile System
- Tile IDs: B=0-255, C=256-511, D=512-767, E=768-1535, A5=1536+, A1-A4=2048+
- Autotiles use lookup tables: `FLOOR_AUTOTILE_TABLE`, `WALL_AUTOTILE_TABLE`
- Canvas size: 48px per tile (hardcoded `TILE_SIZE`)

## Development Patterns

### Adding New Event Commands
1. Add to `EVENT_COMMAND_DEFINITIONS` in EventCommandDef.js
2. Define `editorFields` using existing field types (text, number, select, switch, variable, etc.)
3. Implement `getDisplayText` for inspector display
4. Use `Command` class helpers: `findNextCode()`, `collectCodes()`, `countConsecutiveCodes()`

### Canvas Rendering
All map/event rendering goes through:
```javascript
main.mapManager.renderMap() → {
    loader.render() // Tiles via MapLoader
    em.render()     // Events + player
}
```
Never directly modify canvas - always call renderMap() after data changes.

### Modal Dialogs
Follow EventEditor pattern:
1. Create overlay div (z-index: 10000+)
2. Build modal container with close handlers
3. Use CSS-in-JS for styling
4. Remove on ESC key or background click
5. Call cleanup on close (removeEventListener, removeChild)

### File Organization
- `script/`: Editor logic only
- `project/`: Actual RPG Maker MZ game runtime (js/, data/, img/, audio/)
- No mixing: Editor files don't depend on project/js/rmmz_*.js

## Common Pitfalls

1. **Image Loading**: Always check `img.complete` and `img.naturalWidth` before drawing to canvas
2. **Event ID Reuse**: System reuses null slots - never assume sequential IDs
3. **Character Images**: Handle both single-chip ($prefix) and 8-character sheets differently
4. **Command Indices**: When inserting/deleting commands, indices shift - update references immediately
5. **Page Data**: Events have multiple pages - always work with `event.pages[pageIndex]`

## Testing Workflow
1. Open `index.html` in browser (no build step)
2. Console logs extensively used - check browser DevTools
3. LocalStorage used for settings persistence
4. Save downloads JSON files - manually copy to project/data/

## Code Style
- Korean comments and UI text
- No semicolons enforced but commonly used
- Arrow functions preferred
- Template literals for strings
- Direct DOM manipulation (no jQuery/React)

## Data Access Patterns
```javascript
// ✅ Correct
const switchName = em.getSwitchName(switchId);
const mapName = em.getMapName(mapId);
const actor = main.actorsData[actorId];

// ❌ Wrong - don't access DataManager or $gameXXX (those are for game runtime)
const actor = $dataActors[actorId]; // This is project/js code, not editor
```
