# [1.6.0](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.5.2...v1.6.0) (2026-06-24)


### Features

* **screenshot:** redact health/PII regions from feedback captures (GDPR Art.9) ([#10](https://github.com/jplannnou/gundo-feedback-sdk/issues/10)) ([53eaa32](https://github.com/jplannnou/gundo-feedback-sdk/commit/53eaa326322c5aeeb6e1087ddb2e26f6ab984be6))

## [1.5.2](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.5.1...v1.5.2) (2026-06-08)


### Bug Fixes

* **review-mode:** force dark color-scheme + text contrast on inputs ([#9](https://github.com/jplannnou/gundo-feedback-sdk/issues/9)) ([b2cfad9](https://github.com/jplannnou/gundo-feedback-sdk/commit/b2cfad97baa3ee1db20c3060d4dd185f92849454)), closes [#24](https://github.com/jplannnou/gundo-feedback-sdk/issues/24) [#24](https://github.com/jplannnou/gundo-feedback-sdk/issues/24) [#F2F4F3](https://github.com/jplannnou/gundo-feedback-sdk/issues/F2F4F3) [#F2F4F3](https://github.com/jplannnou/gundo-feedback-sdk/issues/F2F4F3)

## [1.5.1](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.5.0...v1.5.1) (2026-05-29)


### Bug Fixes

* **ci:** propagate — auto-detect consumer pnpm version (mirror gundo-ui [#24](https://github.com/jplannnou/gundo-feedback-sdk/issues/24)) ([#8](https://github.com/jplannnou/gundo-feedback-sdk/issues/8)) ([a5b86c2](https://github.com/jplannnou/gundo-feedback-sdk/commit/a5b86c2f292680045a2a8b6a0f974ecf47662641))

# [1.5.0](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.4.5...v1.5.0) (2026-05-29)


### Features

* **FeedbackPanel:** in-app feedback CTA + context-backed review state ([#7](https://github.com/jplannnou/gundo-feedback-sdk/issues/7)) ([da0579e](https://github.com/jplannnou/gundo-feedback-sdk/commit/da0579efccc75c62b5f4f392a88f01283b95f575))

## [1.4.5](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.4.4...v1.4.5) (2026-05-04)


### Bug Fixes

* **FeedbackToggle:** align aria-label with visible text (WCAG 2.5.3) ([dbcef0a](https://github.com/jplannnou/gundo-feedback-sdk/commit/dbcef0a8aff86db250b4f4ed0590873636a2b7b6))

## [1.4.4](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.4.3...v1.4.4) (2026-04-21)


### Bug Fixes

* **ci:** parse SR stdout to capture released/version outputs ([4e90736](https://github.com/jplannnou/gundo-feedback-sdk/commit/4e90736b05343b6cd373512fdd82ba64c6bec6ab))

## [1.4.3](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.4.2...v1.4.3) (2026-04-21)


### Bug Fixes

* **ci:** capture semantic-release output via git tag comparison ([357a6b9](https://github.com/jplannnou/gundo-feedback-sdk/commit/357a6b9664b2f3e2747742cf3b5a038084f3d8cb))

## [1.4.2](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.4.1...v1.4.2) (2026-04-21)


### Bug Fixes

* **ci:** use GITHUB_TOKEN for publish (write:packages scope) ([c46bc28](https://github.com/jplannnou/gundo-feedback-sdk/commit/c46bc28a396c952bd70a37917ab93e8692aeece7))

## [1.4.1](https://github.com/jplannnou/gundo-feedback-sdk/compare/v1.4.0...v1.4.1) (2026-04-21)


### Bug Fixes

* **ci:** fix YAML syntax in publish workflow (PR body, step name, secret refs) ([760cda2](https://github.com/jplannnou/gundo-feedback-sdk/commit/760cda296ec6add954129fc81bf8d119f9d9538b))
* **ci:** run semantic-release in isolated npm dir to avoid pnpm conflict ([90beb79](https://github.com/jplannnou/gundo-feedback-sdk/commit/90beb79b91bcd1e190d4bd7159bcd6e45dd99020))
