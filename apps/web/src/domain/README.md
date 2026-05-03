# Web Domain Layer

Domain modules contain pure game rules and normalization logic that can be reused across hooks, stores, and UI.

## Boundaries

- Keep domain functions deterministic and side-effect free.
- Store handlers should call domain functions for shaping/validation and then only persist state updates.
- Hooks/UI can orchestrate async effects (network, audio, announcements) but should not duplicate domain rules.
