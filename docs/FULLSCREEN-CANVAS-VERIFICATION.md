# Fullscreen canvas and tool palette

Implementation: 00b1c4978206b079651820e9b0bf240dd3c30a49.

The canvas toolbar now offers a pencil menu with all existing drawing, measurement and construction tools, grouped by category. Choices route through the existing tool selection and permission checks. The menu supports arrows, Home/End, Escape, outside pointer dismissal and narrow screens.

The fullscreen toggle uses a distinct screen-and-arrow icon. It requests native browser fullscreen where available and retains a viewport-filling canvas fallback. Only the toggle returns the editor to its normal layout. Escape still closes menus or cancels work; leaving native fullscreen does not remove the canvas-filling layout. Instructions remain visible above the canvas. Native text dialogs work while fullscreen.

The axes toolbar button opens the existing properties inspector as a closable overlay in fullscreen, including functioning axis/grid controls.

Validation: final Node suite 286/286 passed. Full Edge suite with 31 modules passed without page errors before the final Escape refinement. The complete targeted fullscreen module passed again after that refinement, including explicit native fullscreen exit, Escape retention, text creation, point creation, all tools, distinct icon, axes properties, normal-layout return and mobile menu bounds. Both fullscreen palette and axes panel were visually reviewed at 1543x884. git diff --check passed.

Saved locally; no remote publication performed.
