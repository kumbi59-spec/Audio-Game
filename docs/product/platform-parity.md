# Web ↔ Mobile Feature Parity Matrix

Last updated: 2026-05-03

## Legend
- ✅ Full parity
- 🟡 Partial parity (intentional or temporary)
- ❌ Not available

## Core Gameplay
| Capability | Web | Mobile | Notes |
|---|---|---|---|
| Campaign session play | ✅ | ✅ | Shared session transport contract via API websocket. |
| Choice-based turns | ✅ | ✅ | Choice list events consumed on both clients. |
| Freeform input | ✅ | ✅ | Text input on web, voice-first affordance on mobile. |
| Turn recap request | ✅ | ✅ | Both clients can request recap through session event. |
| Save/leave flow | ✅ | ✅ | Session close semantics shared. |

## Audio & Voice
| Capability | Web | Mobile | Notes |
|---|---|---|---|
| TTS narration | ✅ | ✅ | Web supports browser/ElevenLabs routes; mobile uses app audio pipeline. |
| Voice command input | ✅ | ✅ | Browser support is engine-dependent; mobile supports app command path. |
| Per-NPC voice routing | ✅ | ✅ | Server emits voice plans for compatible clients. |
| Haptics for cues | ❌ | ✅ | Mobile-only hardware capability. |
| Ambient sound toggle | ✅ | ✅ | UX differs by surface but behavior target is equivalent. |

## Account, Commerce, and Notifications
| Capability | Web | Mobile | Notes |
|---|---|---|---|
| Email/password auth | ✅ | ✅ | Shared backend auth contract. |
| Subscription checkout | ✅ | 🟡 | Stripe checkout is web-native today; mobile routes users to web flow. |
| Entitlement enforcement | ✅ | ✅ | Server-side gate, consistent across clients. |
| Push notifications | ✅ | ✅ | Web VAPID + Expo transport differ by implementation. |

## Creation & Content
| Capability | Web | Mobile | Notes |
|---|---|---|---|
| Browse prebuilt library | ✅ | ✅ | Same world catalog intent. |
| Upload Game Bible | ✅ | ✅ | Surface UX differs; backend parsing path shared. |
| Spoken world wizard | 🟡 | ✅ | Mobile has first-class spoken flow; web support is functional but less voice-centric. |
| Admin dashboard | ✅ | ❌ | Web-only operational UI. |
| Creator analytics view | ✅ | ❌ | Web-only at present. |

## Accessibility
| Capability | Web | Mobile | Notes |
|---|---|---|---|
| Keyboard-first navigation | ✅ | ❌ | Mobile relies on touch + screen reader gestures instead. |
| Screen-reader labels/announcements | ✅ | ✅ | Required parity target. |
| Large tap targets | ✅ | ✅ | 44px-equivalent target policy. |
| Reduced motion/high contrast toggles | ✅ | ✅ | Surface-specific implementation details. |

## Planned parity work
1. Mobile-native subscription purchase/management flow parity with web checkout.
2. Web spoken wizard UX improvements to match mobile-first voice guidance.
3. Analytics visibility path for creators on mobile (read-only first).

## Ownership and review cadence
- **Owners:** product + web + mobile + API
- **Cadence:** review every sprint; update status before each release cut.
- **Release gate:** unresolved ❌ entries in core gameplay require explicit sign-off.
