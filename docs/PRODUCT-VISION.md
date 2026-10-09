# From Zero 2 Infinity — Mathematical Illustration Platform

Version: 1.0.0
Status: proposed product specification (not yet implemented)
Date: 2026-10-09

## Purpose
A reusable mathematical illustration and construction platform serving three contexts:
1. Authoring editor for constructing and configuring figures.
2. Interactive course viewer for guided exploration, demonstrations, and manipulable learning objects.
3. Assessment runtime for construction tasks, constrained tools, feedback, and mathematical validation.

The same mathematical document and geometric semantics should power all three contexts. The authoring UI, learner UI, and assessment evaluator remain separate modules. Do not couple assessment trust to browser-side UI alone.

## Architectural principles
- A shared mathematical model and geometry engine, independent of DOM and rendering.
- Deterministic geometry, explicit coordinate transforms, snapping and constraints.
- Dependency graph for dynamic constructions; detect cycles and invalid/degenerate cases.
- Distinguish authored construction semantics from rendered coordinates and UI state.
- Author-configurable permissions for objects, tools and interactions.
- Non-destructive preview and explicit commit/cancel for edits and transforms.
- Separate answer validator supporting result-based and method-based assessment.
- Versioned document, activity and assessment schemas; migration and compatibility policies.
- Export static SVG/PNG and interactive embeddable course/assessment artifacts.
- Accessible keyboard interaction, responsive layout and eventually touch support.
- Regression tests and real browser acceptance tests for each milestone.

## Current state and caveat
User reports stabilization milestones 0A–0D completed and functionality including angle bisectors, parallel/perpendicular constructions, circumference/area and tangents already present. This document is a future product specification, not a claim that any listed feature has been implemented or verified. Audit the current repository before creating implementation tasks; avoid rebuilding existing features.

## Definition of done for every feature
Mathematical specification and edge cases; interaction specification; unit/regression tests; browser tests; document serialization where relevant; author/course/assessment permission behavior; performance and accessibility considerations; documentation and migration notes.
