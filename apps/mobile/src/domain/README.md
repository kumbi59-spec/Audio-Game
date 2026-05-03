# Mobile Domain Layer

Domain modules capture reusable session/gameplay rules independent of React state containers.

## Boundaries

- Domain functions should be pure and focused on validation/parsing/formatting.
- Zustand store actions should delegate non-trivial shaping to the domain and stay focused on state transitions.
- UI screens and connections should handle side-effect dispatch (voice capture, networking, TTS) and call domain/store APIs.
