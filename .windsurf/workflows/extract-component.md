---
description: Extract large components from route files into separate files
---

# Extract Component

Extract a large component from a route file into its own file, along with its styles.

## Usage

Run `/extract-component` with the component name. Example:

```
/extract-component KitItemCard
```

## Steps

1. **Identify the component to extract**
   - Ask user which component to extract if not specified
   - Component must be defined in the current route file
   - Check if component has props that are local to the file or shared

2. **Analyze component dependencies**
   - List all props the component receives
   - Identify which props come from:
     - Parent component state (pass down as props)
     - Store/hooks (can be used directly in extracted component)
     - Loader/action data (can be used directly)
   - Identify all imports the component uses

3. **Create the new component file**
   - File name: `{route}.{component-name}.tsx` (kebab-case)
     - Example: `edit.kit-item-card.tsx`
   - Location: Same directory as the route file
   - Move the component interface and function
   - Add necessary imports at the top
   - Export the component as named export

4. **Handle props decision**
   - If props are simple and passed from parent → keep as props
   - If props come from store/hook → use store/hook directly in extracted component
   - Document the decision in the component file

5. **Extract styles (if component has significant styles)**
   - Check if `.style.scss` file exists for the route
   - Identify component-specific BEM classes (e.g., `.kit__item`, `.kit__item__content`)
   - If styles are substantial (>20 lines):
     - Create new file: `{route}.{component-name}.style.scss`
     - Move component styles to new file
     - Add `@forward "{component-name}"` in main style file
   - If styles are minimal → leave in main file

6. **Update the route file**
   - Import the extracted component
   - Replace component definition with import
   - Remove any unused imports that were only for the extracted component

7. **Verify the extraction**
   - Ensure all imports are correct
   - Check that component still receives needed props
   - Verify styles are still applied

## File Naming Convention

```
app/routes/main/kit/
├── edit.tsx                    # Main route (imports extracted components)
├── edit.kit-item-card.tsx      # Extracted KitItemCard component
├── edit.kit-action-menubar.tsx # Extracted KitActionMenubar component
├── edit.style.scss             # Main styles (forwards component styles)
├── edit.kit-item-card.style.scss   # KitItemCard styles
└── edit.kit-action-menubar.style.scss  # KitActionMenubar styles
```

## Style File Structure

Main style file (`edit.style.scss`):

```scss
@use "@abstracts" as *;

// Forward component styles
@forward "./edit.kit-item-card.style.scss";
@forward "./edit.kit-action-menubar.style.scss";

// Route-specific styles remain here
.kit-edit {
  // ...
}
```

Component style file (`edit.kit-item-card.style.scss`):

```scss
@use "@abstracts" as *;

.kit__item {
  // Component styles
}
```

## Important Notes

- **Keep shared components** in `app/components/` if used across multiple routes
- **Route-specific components** stay in the route directory
- **Store usage**: Extracted components can use stores directly, reducing prop drilling
- **Type imports**: Move interface definitions to the component file if not shared
