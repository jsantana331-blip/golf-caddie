# Caddie pilot development policy

- This is a pilot app. Each published merge is an opportunity for real iPhone testing.
- Physical iPhone testing is post-merge validation, never a barrier to publishing a PR, reviewing it, or merging it.
- Before merge, inspect the diff, run automated checks appropriate to the change, and fix verified blockers. Do not skip automated regression coverage for application changes.
- Report unverified device behavior honestly. Treat device checklists as optional post-merge guides and address findings from pilot use in follow-up changes.
- Follow the user's current merge authorization. This policy removes the device-testing gate; it does not independently authorize every merge or override an explicit request to leave a PR unmerged.
