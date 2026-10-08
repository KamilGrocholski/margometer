# Names

Every name this tree spells, composed off it by `tests/repository/name-register.test.ts`, which
fails while this file and the tree disagree; `deno task names` writes it again. A name is listed by
what declares it and where it stands, and whether it is the right name is `AGENTS.md`'s to say. A
name standing in more than 3 files is given as a count and the layers it stands in. The files under
`captures/` are evidence rather than names of ours: only the paths the code spells to them are
listed.

## Functions

By the verb a name opens with, and the purity N2 states for that verb.

### `init` — none

- `initBrowserClock` — `src/ports/browser-time.ts`
- `initBrowserConsole` — `src/ports/browser-console.ts`
- `initBrowserFile` — `src/ports/browser-file.ts`
- `initBrowserFrames` — `src/ports/browser-time.ts`
- `initBrowserInterval` — `src/ports/browser-time.ts`
- `initBrowserStore` — `src/ports/browser-store.ts`
- `initBrowserSurroundings` — `src/ports/browser-surroundings.ts`
- `initCardHandle` — `src/ui/panel-element.ts`
- `initCeilingStore` — `tests/runtime/shelf-keeper.test.ts`
- `initDefectLedger` — `src/runtime/defect-ledger.ts`
- `initHeldStore` — `tests/runtime-world.ts`
- `initKeeper` — `tests/runtime/shelf-keeper.test.ts`
- `initLiveFight` — `src/runtime/live-fight.ts`
- `initMargonemClientBuild` — `src/ports/margonem-client-build.ts`
- `initMargonemClientDictionary` — `src/ports/margonem-client-dictionary.ts`
- `initMargonemEngineBattle` — `src/ports/margonem-engine-battle.ts`
- `initMargonemEngineHero` — `src/ports/margonem-engine-hero.ts`
- `initMargonemEnginePlace` — `src/ports/margonem-engine-place.ts`
- `initMargonemEngineSearch` — `src/runtime/margometer-runtime.ts`
- `initMargonemEngineTooltip` — `src/ports/margonem-engine-tooltip.ts`
- `initMemoryStore` — `src/ports/browser-store.ts`
- `initPanelDrag` — `src/ui/panel-drag.ts`
- `initPanelDragIfPlaced` — `src/ui/panel-element.ts`
- `initPanelView` — `src/ui/panel-element.ts`
- `initPreviewServer` — `tools/preview-server.ts`
- `initRefusingStore` — `tests/runtime-world.ts`
- `initRuntime` — `src/runtime/margometer-runtime.ts`
- `initRuntimeWorld` — `tests/runtime-world.ts`
- `initSearchingWorld` — `tests/runtime/margometer-runtime.test.ts`
- `initShelfKeeper` — `src/runtime/shelf-keeper.ts`
- `initShelfStore` — in 5 files: `src/`, `tests/`
- `initStoreRefusingOnce` — `tests/runtime/margometer-runtime.test.ts`
- `initTestServer` — `tests/tools/preview-server.test.ts`
- `initTestView` — `tests/panel-view.ts`

### `deinit` — none

- `deinit` — `src/runtime/margometer-runtime.ts`, `tests/runtime-world.ts`
- `deinitSearchTimer` — `src/runtime/margometer-runtime.ts`

### `open` — none

- `open` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `openFirstRow` — `tests/ui/panel-element.test.ts`
- `openOptions` — `tests/runtime/margometer-runtime.test.ts`
- `openPanelPage` — `tests/e2e/panel-camera.ts`
- `openShelf` — `src/runtime/shelf.ts`
- `openShelfRowCard` — `tests/runtime/margometer-runtime.test.ts`
- `openShelfScreen` — `tests/runtime/margometer-runtime.test.ts`

### `on` — none

- `onAbandoned` — `src/runtime/margometer-runtime.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `onAttached` — `src/runtime/margometer-runtime.ts`, `tests/runtime/margonem-engine-search.test.ts`
- `onBeforeCall` — in 4 files: `src/ports/`, `src/runtime/`, `tests/`
- `onDragEnd` — `src/ui/panel-drag.ts`
- `onDrawn` — `src/ui/panel-drag.ts`
- `onFailure` — in 8 files: `src/runtime/`, `tests/`
- `onFightKept` — `src/runtime/margometer-runtime.ts`, `tests/runtime/live-fight.test.ts`
- `onFightOpened` — `src/runtime/margometer-runtime.ts`, `tests/runtime/live-fight.test.ts`
- `onFrame` — `src/runtime/margometer-runtime.ts`
- `onHover` — `src/ui/panel-element.ts`
- `onIntent` — in 7 files: `src/runtime/`, `tests/`
- `onListen` — `tools/preview-server.ts`
- `onLookFailed` — `src/runtime/margometer-runtime.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `onLookFailure` — `src/runtime/margometer-runtime.ts`
- `onMargonemEngineSearchFailed` — `src/runtime/margometer-runtime.ts`
- `onPageCall` — `tests/simulation.ts`
- `onPayload` — in 4 files: `src/ports/`, `src/runtime/`, `tests/`
- `onRefused` — `src/runtime/margometer-runtime.ts`, `tests/runtime/margonem-engine-search.test.ts`
- `onRuntimeIntent` — `src/runtime/margometer-runtime.ts`
- `onStoodDown` — `src/runtime/margometer-runtime.ts`,
  `tests/runtime/margonem-engine-search.test.ts`

### `prepare` — strong

- `prepareCapture` — `src/ports/fight-capture.ts`
- `prepareCarriedStatusWalk` — `src/core/carried-status.ts`
- `prepareChargedSkills` — `src/core/charged-skill.ts`
- `prepareCutKeys` — `src/core/fight-session.ts`
- `prepareEventsAtSeating` — `src/core/fight-session.ts`
- `prepareLegendaryWalk` — `src/core/legendary-standing.ts`
- `prepareLightingTurnByBit` — `src/core/carried-status.ts`
- `prepareNamedCombatantIds` — `src/core/fight-session.ts`
- `preparePayload` — `src/core/fight-session.ts`
- `preparePayloadCombatants` — `src/core/fight-session.ts`
- `preparePayloadStanding` — `src/core/fight-session.ts`
- `preparePayloadUnread` — `src/core/fight-session.ts`
- `prepareSkillNames` — `src/core/fight-session.ts`
- `prepareStoreWrite` — `src/ports/browser-store.ts`
- `prepareTurn` — `tools/fabricated-fight.ts`

### `commit` — weak

- `commitCapture` — `src/ports/fight-capture.ts`
- `commitPayload` — `src/core/fight-session.ts`

### `execute` — none

- `executeLiveReading` — `src/runtime/live-fight.ts`
- `executeLiveStep` — `src/runtime/live-fight.ts`
- `executeLookFailed` — `src/runtime/margometer-runtime.ts`
- `executeRegionStep` — `src/ui/panel-element.ts`
- `executeScreenIntent` — `src/runtime/margometer-runtime.ts`
- `executeSearchBound` — `src/runtime/margometer-runtime.ts`
- `executeSearchLook` — `src/runtime/margometer-runtime.ts`
- `executeSearchReport` — `src/runtime/margometer-runtime.ts`
- `executeShelvedFightReplays` — `src/runtime/shelf-keeper.ts`

### `verify` — strong

- `verifyDefenceMechanisms` — `src/core/fight-statistics.ts`
- `verifyFightFigures` — `src/core/fight-figures.ts`
- `verifyFightStatistics` — `src/core/fight-statistics.ts`
- `verifyQueueHolders` — `tools/turn-count.ts`
- `verifyScreenState` — `src/runtime/margometer-runtime.ts`

### `get` — strong

- `get` — in 6 files: `tests/`
- `getAirAround` — `tests/ui/panel-look.test.ts`
- `getAllComments` — `tests/source-tree.ts`
- `getAlly` — `tools/fabricated-fight.ts`
- `getAnswers` — `src/runtime/shelf-keeper.ts`, `tests/runtime/panel-frame.test.ts`
- `getAttribute` — `src/ui/panel-document.ts`, `tests/fake-document.ts`,
  `tests/ui/panel-intent.test.ts`
- `getAuraSkill` — `tools/fabricated-fight.ts`
- `getBar` — `tests/runtime/margometer-runtime.test.ts`
- `getBarFill` — `src/ui/panel-content.ts`
- `getBarHeight` — `src/ui/panel-look.ts`
- `getBlocks` — `tests/runtime/carried-tooltip.test.ts`
- `getBlowKeysFromRecordings` — `tests/ui/blow-vocabulary.test.ts`
- `getBlowsForAnnouncement` — `src/core/fight-decoder.ts`
- `getCardHeight` — `src/ui/panel-look.ts`
- `getCardHeightAvailable` — `src/ui/panel-look.ts`
- `getCardLineCost` — `src/ui/panel-element.ts`
- `getCardLinesForCharacters` — `src/ui/panel-element.ts`
- `getCardWidthAvailable` — `src/ui/panel-look.ts`
- `getCardWidthForColumns` — `src/ui/panel-look.ts`
- `getCaveatForKind` — `src/ui/panel-words.ts`
- `getCaveatForNamedPart` — `src/ui/panel-element.ts`
- `getCaveatForUnannounced` — `src/ui/panel-words.ts`
- `getCellsBeforeMarks` — `tests/ui/panel-element.test.ts`
- `getCellsBeforeName` — `tests/ui/panel-element.test.ts`
- `getChoice` — `src/runtime/shelf-keeper.ts`, `tests/runtime/panel-frame.test.ts`
- `getChosenTexts` — `tests/ui/panel-element.test.ts`
- `getClassesByPrefix` — `tests/ui/card-window.test.ts`
- `getColourForCharge` — `src/ui/panel-helper.ts`
- `getColouredProfessions` — `tests/ui/panel-palette.test.ts`
- `getContrastRatio` — `src/ui/panel-look.ts`
- `getControlHeightPixels` — `src/ui/panel-look.ts`
- `getControlWidthPixels` — `src/ui/panel-look.ts`
- `getCords` — `tests/ports/margonem-engine-place.test.ts`
- `getCorpusTally` — `tests/core/fight-decoder.test.ts`
- `getCountedTotal` — `src/ui/panel-content.ts`
- `getCounts` — `src/runtime/defect-ledger.ts`
- `getCrumbWordsForUnnamedCut` — `src/ui/panel-element.ts`
- `getCutsForMetric` — `src/ui/panel-content.ts`
- `getDate` — `src/ports/browser-time.ts`, `tests/ui/panel-words.test.ts`
- `getDealt` — `tools/fight-figures.ts`
- `getDeclaration` — `tests/style-sheet.ts`
- `getDefenceMechanism` — `src/core/protocol-key.ts`
- `getDirectionForMetric` — `src/ui/panel-screen.ts`
- `getDirectionWordsForMetric` — `src/ui/panel-words.ts`
- `getEdgesDown` — `tests/ui/panel-look.test.ts`
- `getElement` — `tools/fabricated-fight.ts`
- `getElementsAbsorbed` — `src/core/protocol-key.ts`
- `getElementsWithin` — `tests/fake-document.ts`
- `getEndForPinned` — `src/ui/panel-content.ts`
- `getEndOfRun` — `libs/text-walk.ts`
- `getEndingFaults` — `tests/ui/panel-words.test.ts`
- `getEngine` — in 4 files: `tests/`
- `getEnglishWords` — `tests/ui/panel-words.test.ts`
- `getFailureCount` — `src/ports/margonem-engine-battle.ts`
- `getFieldValue` — `libs/unknown-value.ts`
- `getFightOutcomeForReaderSide` — `src/ui/panel-content.ts`
- `getFightSuspicions` — `src/runtime/panel-frame.ts`
- `getFights` — `src/runtime/shelf-keeper.ts`, `tests/runtime/panel-frame.test.ts`
- `getFigureForMetric` — `src/ui/panel-content.ts`
- `getFiguresUnreadable` — `tests/ui/level-drawn.test.ts`
- `getFirstFailure` — `src/ports/margonem-engine-battle.ts`
- `getGivenSourceCut` — `src/ui/panel-content.ts`
- `getGrabbedElement` — `src/ui/panel-drag.ts`
- `getGrades` — `tests/tools/turn-count.test.ts`
- `getHalfNamedByKind` — `src/ui/panel-content.ts`
- `getHeadingCells` — `tests/ui/panel-element.test.ts`
- `getHealthPercent` — `tools/fabricated-fight.ts`
- `getHealthPercentsFromEvent` — `src/core/combatant-health.ts`
- `getHolderName` — `tests/ui/panel-words.test.ts`
- `getHost` — `tests/runtime-world.ts`
- `getHours` — `src/ports/browser-time.ts`, `tests/ui/panel-words.test.ts`
- `getId` — `tests/ports/margonem-engine-hero.test.ts`
- `getInkForBar` — `src/ui/panel-look.ts`
- `getItem` — in 9 files: `src/ports/`, `tests/`
- `getKeptFightStates` — `src/runtime/shelf-keeper.ts`, `tests/runtime/panel-frame.test.ts`
- `getKeyForNamedPart` — `src/ui/panel-element.ts`
- `getKeyTallyOrder` — `tools/turn-reading.ts`
- `getKeysShared` — `tests/ui/level-drawn.test.ts`
- `getLargestFigure` — `src/ui/panel-content.ts`
- `getLeadingStatuses` — `src/ui/panel-words.ts`
- `getLetterForShelfOutcome` — `src/ui/panel-words.ts`
- `getLineAt` — `tests/source-tree.ts`
- `getLineHeights` — `tests/ui/panel-look.test.ts`
- `getLineTexts` — `tests/ui/panel-words.test.ts`
- `getListField` — `libs/unknown-value.ts`
- `getLuminance` — `src/ui/panel-look.ts`
- `getMargonemClientWordsForKey` — `src/ui/panel-words.ts`
- `getMarkForNamedPart` — `src/ui/panel-element.ts`
- `getMedian` — `tools/card-height.ts`
- `getMetricForPinned` — `src/ui/panel-content.ts`
- `getMinutes` — `src/ports/browser-time.ts`, `tests/ui/panel-words.test.ts`
- `getMonth` — `src/ports/browser-time.ts`, `tests/ui/panel-words.test.ts`
- `getMovedHealth` — `tests/core/health-witness.test.ts`
- `getNamedCombatantIds` — `src/core/fight-decoder.ts`
- `getNeitherEndForPinned` — `src/ui/panel-content.ts`
- `getNoteForCaveat` — `src/ui/panel-words.ts`
- `getNoteForNoKind` — `src/ui/panel-words.ts`
- `getNoteForOpenedUnnamedStanding` — `src/ui/panel-words.ts`
- `getNoteForUnnamedEnd` — `src/ui/panel-words.ts`
- `getNounForMetric` — `src/ui/panel-screen.ts`
- `getNumberField` — `libs/unknown-value.ts`
- `getOccurrence` — `tests/core/last-heal-rule.test.ts`
- `getOccurrences` — `tests/core/last-heal-rule.test.ts`
- `getOccurrencesOfMessage` — `tests/core/last-heal-rule.test.ts`
- `getOnlyAttack` — `tests/core/fight-decoder.test.ts`
- `getOnlyUnread` — `tests/core/fight-decoder.test.ts`
- `getOnlyUnreadAfterAttack` — `tests/core/fight-decoder.test.ts`
- `getOperatorsAtDepth` — `tests/ui/panel-look.test.ts`
- `getOtherEndKey` — `src/core/fight-statistics.ts`
- `getOutcomeForReaderSide` — `src/ui/panel-content.ts`
- `getOutcomeOfReading` — `src/runtime/panel-frame.ts`
- `getOwnValue` — `libs/unknown-value.ts`
- `getPairGivingEnd` — `src/ui/panel-content.ts`
- `getPairKinds` — `src/ui/panel-content.ts`
- `getPairTotal` — `src/ui/panel-content.ts`
- `getPanelDefects` — `src/runtime/panel-frame.ts`
- `getPanelFight` — `tools/drill-report.ts`
- `getPanelWithin` — `tests/fake-document.ts`
- `getParsedMessages` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/core/skill-announcement-rule.test.ts`
- `getPartTotal` — `src/ui/panel-content.ts`
- `getPersonRows` — `tests/ui/helper-window.test.ts`
- `getPixels` — `tests/ui/panel-look.test.ts`
- `getPlaceForClosing` — `src/ui/panel-content.ts`
- `getPlacesMismarked` — `tests/ui/level-drawn.test.ts`
- `getPlacesOutOfOrder` — `tests/ui/level-drawn.test.ts`
- `getPlacesWrongfullyHeld` — `tests/ui/level-drawn.test.ts`
- `getPlainSkill` — `tools/fabricated-fight.ts`
- `getPointsFromShares` — `tests/ui/panel-words.test.ts`
- `getPosition` — `src/ui/panel-drag.ts`
- `getPositionWithin` — `src/ui/panel-drag.ts`
- `getPurity` — `tests/repository/purity.test.ts`
- `getRankedOrder` — `src/ui/ranked-order.ts`
- `getRankingTexts` — `tests/runtime/margometer-runtime.test.ts`
- `getRecordField` — `libs/unknown-value.ts`
- `getRecordingsCarryingKey` — `tests/core/npc-heal-rule.test.ts`
- `getRegion` — `tests/runtime/margometer-runtime.test.ts`
- `getRegionShortfall` — `tests/ui/level-drawn.test.ts`
- `getReports` — `tests/core/absorption-destruction-rule.test.ts`
- `getRepositoryRoot` — `tests/e2e/build-once.ts`
- `getRowOrderByFigureThenId` — `src/ui/panel-content.ts`
- `getRowsWithoutCard` — `tests/ui/helper-window.test.ts`
- `getRuleBody` — `tests/style-sheet.ts`
- `getSaid` — `tests/ui/panel-words.test.ts`
- `getSaidFromChoices` — `tests/ui/panel-words.test.ts`
- `getScreenAfterNoun` — `src/ui/panel-screen.ts`
- `getScreensForNoun` — `src/ui/panel-screen.ts`
- `getSentences` — `tests/ui/panel-words.test.ts`
- `getSentencesFromSuspicions` — `tests/ui/panel-words.test.ts`
- `getSentencesFromTooltip` — `tests/ui/panel-words.test.ts`
- `getSessionPhase` — `src/core/fight-session.ts`
- `getShareGroupHead` — `src/ui/panel-words.ts`
- `getShareSum` — `tests/ui/share-column.test.ts`
- `getShelf` — `tests/runtime-world.ts`, `tests/runtime/shelf-keeper.test.ts`
- `getShorteningMissing` — `tests/ui/panel-look.test.ts`
- `getShorthandParts` — `tests/ui/panel-look.test.ts`
- `getSideRelation` — `src/ui/panel-content.ts`
- `getSideRelationCharged` — `src/ui/panel-content.ts`
- `getSideRelationListed` — `src/ui/panel-content.ts`
- `getSkillOwnerId` — `src/core/fight-statistics.ts`
- `getSkillRowOrder` — `src/ui/panel-content.ts`
- `getStandingOnSide` — `tools/fabricated-fight.ts`
- `getStandingTurnNow` — `src/ui/panel-helper.ts`
- `getStandingTurnState` — `src/ui/panel-helper.ts`
- `getStatedCombatants` — `tools/fabricated-fight.ts`
- `getStatedTextField` — `libs/unknown-value.ts`
- `getStorageChosen` — `tests/runtime/margometer-runtime.test.ts`
- `getSubWordsForBlowKey` — `src/ui/panel-words.ts`
- `getTermPixels` — `tests/ui/panel-look.test.ts`
- `getTextField` — `libs/unknown-value.ts`
- `getTextForNamedPart` — `src/ui/panel-content.ts`
- `getTextsByClass` — `tests/fake-document.ts`
- `getTipData` — `src/ports/margonem-engine-tooltip.ts`,
  `tests/ports/margonem-engine-tooltip.test.ts`, `tests/rebuilding-battle.ts`
- `getTokenSpelling` — `tests/ui/panel-look.test.ts`
- `getTop` — `src/ui/panel-element.ts`
- `getTrailingStatuses` — `src/ui/panel-words.ts`
- `getTurnOutcome` — `tools/turn-count.ts`
- `getTurnPlacing` — `tools/turn-count.ts`
- `getTurnVerdict` — `tools/turn-count.ts`
- `getTurnsLost` — `tests/core/fight-statistics.test.ts`
- `getTurnsTaken` — `tests/core/fight-statistics.test.ts`
- `getTypeStep` — `src/ui/panel-element.ts`
- `getTypeTokens` — `src/ui/panel-element.ts`
- `getUndressedRegions` — `tests/ui/panel-element.test.ts`
- `getUnmistakableKeys` — `tests/ui/panel-words.test.ts`
- `getUnnamedEndForMetric` — `src/ui/panel-element.ts`
- `getUnpairedProfessions` — `tests/ui/panel-palette.test.ts`
- `getVerdictForTally` — `tools/drill-report.ts`
- `getWalks` — `tests/tools/turn-reading.test.ts`
- `getWholeTextsByClass` — `tests/fake-document.ts`
- `getWindow` — `tests/ui/helper-window.test.ts`
- `getWindowWidthPixels` — `src/ui/panel-drag.ts`
- `getWordHolders` — `tests/ui/panel-words.test.ts`
- `getWordsForBlowKey` — `src/ui/panel-words.ts`
- `getWordsForCardMetric` — `src/ui/panel-words.ts`
- `getWordsForChargedSkill` — `src/ui/panel-words.ts`
- `getWordsForDamageKind` — `src/ui/panel-words.ts`
- `getWordsForDestroyed` — `src/ui/panel-words.ts`
- `getWordsForHalfNamedCut` — `src/ui/panel-element.ts`
- `getWordsForHealthSource` — `src/ui/panel-words.ts`
- `getWordsForHelperAbsence` — `src/ui/panel-words.ts`
- `getWordsForKind` — `src/ui/panel-element.ts`
- `getWordsForKindCut` — `src/ui/panel-screen.ts`
- `getWordsForLegendaryBonus` — `src/ui/panel-words.ts`
- `getWordsForMetric` — `src/ui/panel-screen.ts`
- `getWordsForNamedPart` — `src/ui/panel-element.ts`
- `getWordsForNothing` — `src/ui/panel-words.ts`
- `getWordsForNoun` — `src/ui/panel-words.ts`
- `getWordsForOpponentCut` — `src/ui/panel-screen.ts`
- `getWordsForOutcome` — `src/ui/panel-words.ts`
- `getWordsForPin` — `src/ui/panel-words.ts`
- `getWordsForPinnedScope` — `src/ui/panel-words.ts`
- `getWordsForPinnedStanding` — `src/ui/panel-words.ts`
- `getWordsForProfession` — `src/ui/panel-words.ts`
- `getWordsForShelfOutcome` — `src/ui/panel-words.ts`
- `getWordsForSide` — `src/ui/panel-words.ts`
- `getWordsForStatusBit` — `src/ui/panel-words.ts`
- `getWordsForStorage` — `src/ui/panel-words.ts`
- `getWordsForStorageMeaning` — `src/ui/panel-words.ts`
- `getWordsForTurnState` — `src/ui/panel-words.ts`
- `getWordsForTypeStep` — `src/ui/panel-words.ts`
- `getWordsForUnannounced` — `src/ui/panel-words.ts`
- `getWordsForUnnamedRow` — `src/ui/panel-element.ts`
- `getWordsForWindow` — `src/ui/panel-words.ts`
- `getWordsTheArticleDoesNotPrint` — `tests/ui/panel-words.test.ts`

### `set` — weak

- `set` — `tests/ports/margonem-engine-battle.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`, `tests/ui/panel-look.test.ts`
- `setAttribute` — `src/ui/panel-document.ts`, `tests/fake-document.ts`
- `setBuiltOnce` — `tests/e2e/build-once.ts`
- `setCardHidden` — `src/ui/panel-element.ts`
- `setCardPosition` — `src/ui/panel-element.ts`
- `setDragged` — `tests/e2e/panel-probe.ts`
- `setFocusedBy` — `tests/rebuilding-battle.ts`
- `setGripMark` — `src/ui/panel-drag.ts`
- `setInterval` — in 5 files: `src/ports/`, `tests/`
- `setItem` — in 9 files: `src/ports/`, `tests/`
- `setOverflowingLevelOpened` — `tests/e2e/panel-scroll.spec.ts`
- `setPageServed` — `tests/e2e/panel-fixture.ts`
- `setPointerCapture` — `src/ui/panel-document.ts`, `tests/fake-document.ts`
- `setPosition` — `src/ui/panel-drag.ts`
- `setRebuilt` — `tests/rebuilding-battle.ts`
- `setRollName` — `tools/capture-intake.ts`
- `setRowMarks` — `src/ui/panel-element.ts`
- `setScreenFight` — `src/runtime/margometer-runtime.ts`
- `setSecondFightKept` — `tests/e2e/panel-shelf.spec.ts`
- `setShelfCardOpen` — `tests/e2e/panel-card.spec.ts`
- `setShelfWritten` — `src/runtime/shelf-keeper.ts`
- `setSize` — `src/ui/panel-drag.ts`
- `setStatusBit` — `tools/fabricated-fight.ts`
- `setTimeout` — in 4 files: `src/`, `src/ports/`, `tests/`
- `setTop` — `src/ui/panel-element.ts`
- `setTypeStep` — `src/ui/panel-element.ts`

### `lookup` — strong

- `lookup` — `src/ui/panel-element.ts`
- `lookupAmbientWaysOut` — `tools/build-userscript.ts`
- `lookupAnnouncedForMessage` — `src/core/fight-decoder.ts`
- `lookupAnnouncedWound` — `src/core/fight-statistics.ts`
- `lookupApartCase` — `src/ui/panel-content.ts`
- `lookupAsynchronousCode` — `tests/repository/synchronous-bundle.test.ts`
- `lookupAuraCast` — `src/core/aura-standing.ts`
- `lookupAuraTurnsStated` — `src/core/aura-standing.ts`
- `lookupBareReachEntries` — `tests/core/aura-standing.test.ts`
- `lookupBareVerbs` — `tests/repository/name-shapes.test.ts`
- `lookupBarrelAsserts` — `tests/repository/assert-imports.test.ts`
- `lookupBodiesOnOneLine` — `tests/repository/control-flow.test.ts`
- `lookupBrowserGlobals` — `tests/repository/browser-globals.test.ts`
- `lookupCallBreach` — `tests/repository/purity.test.ts`
- `lookupCalledOnce` — `tests/repository/called-once.test.ts`
- `lookupCallerDeclaration` — `tests/source-tree.ts`
- `lookupCallerName` — `tests/repository/event-entries.test.ts`
- `lookupCardColumnSplit` — `src/ui/panel-element.ts`
- `lookupCastsOverBearer` — `src/core/carried-figure.ts`
- `lookupCatchPlaces` — `tests/repository/broad-catches.test.ts`
- `lookupChangelogSection` — `tools/changelog.ts`
- `lookupColourForProfession` — `src/ui/panel-palette.ts`
- `lookupCombatantIdByName` — `src/core/combatant-roster.ts`
- `lookupDeclarationOpenerKey` — `src/core/turn-clock.ts`
- `lookupDeclarationsOutOfOrder` — `tests/repository/declaration-order.test.ts`
- `lookupDecodedCause` — `tests/repository/protocol-keys.test.ts`
- `lookupDeepBodies` — `tests/repository/nesting-depth.test.ts`
- `lookupDirectives` — `tests/repository/type-assertions.test.ts`
- `lookupDisagreements` — `tests/repository/design-tokens.test.ts`
- `lookupEnclosingFunction` — `tests/source-tree.ts`
- `lookupEndOfRun` — `libs/text-walk.ts`
- `lookupEndedState` — `src/core/charged-skill.ts`
- `lookupErrorClasses` — `tests/repository/throws.test.ts`
- `lookupEventBreaches` — `tests/repository/event-entries.test.ts`
- `lookupFightReader` — `src/runtime/panel-frame.ts`
- `lookupFirstDifference` — `tests/repository/name-register.test.ts`
- `lookupFragments` — `tools/help-article.ts`
- `lookupGiverId` — `src/core/fight-statistics.ts`
- `lookupGuardingNames` — `tests/repository/handed-callbacks.test.ts`
- `lookupHandedChanges` — `tests/repository/purity.test.ts`
- `lookupHeadingName` — `tools/develop-reports.ts`
- `lookupHeldDate` — `tools/frozen-files.ts`
- `lookupHelpLine` — `tests/tools/aura-lifetime.test.ts`
- `lookupHelpersOutOfPlace` — `tests/repository/declaration-order.test.ts`
- `lookupHurtAlly` — `tools/fabricated-fight.ts`
- `lookupImportedPath` — `tests/source-tree.ts`
- `lookupImportsUpward` — `tests/repository/layers.test.ts`
- `lookupKeyMeaning` — `src/core/protocol-key.ts`
- `lookupKeyReach` — `src/core/protocol-key.ts`
- `lookupKindOrderFaults` — `tests/repository/changelog.test.ts`
- `lookupLayer` — `tests/repository/name-register.test.ts`
- `lookupLayerReach` — `tests/repository/layers.test.ts`
- `lookupLegendaryBonus` — `src/core/protocol-key.ts`
- `lookupMargonemEngineBattle` — `src/ports/margonem-engine-battle.ts`
- `lookupMargonemValue` — `src/runtime/live-fight.ts`
- `lookupMessageIndexAfter` — `tools/turn-count.ts`
- `lookupMisnamedExports` — `tests/repository/names.test.ts`
- `lookupMisnamedFile` — `tests/repository/names.test.ts`
- `lookupMisspeltImports` — `tests/repository/import-paths.test.ts`
- `lookupModuleStates` — `tests/repository/purity.test.ts`
- `lookupNamedCombatantId` — `src/core/fight-decoder.ts`
- `lookupNamedReference` — `libs/html-text.ts`
- `lookupNewestFight` — `src/runtime/fight-state.ts`
- `lookupNonNullAssertions` — `tests/repository/non-null-assertions.test.ts`
- `lookupNumericReference` — `libs/html-text.ts`
- `lookupOpeners` — `tests/core/turn-clock.test.ts`
- `lookupOpponent` — `tools/fabricated-fight.ts`
- `lookupOutboundCalls` — `tools/build-userscript.ts`
- `lookupOwnAsserts` — `tests/repository/assert-imports.test.ts`
- `lookupPinnedCase` — `src/ui/panel-content.ts`
- `lookupPlaceholders` — `tests/repository/name-shapes.test.ts`
- `lookupProcEnd` — `tests/ui/blow-vocabulary.test.ts`
- `lookupProvokedIds` — `src/core/aura-standing.ts`
- `lookupPurityBreaches` — `tests/repository/purity.test.ts`
- `lookupQuotedLiteral` — `libs/text-walk.ts`
- `lookupRawTextClosing` — `libs/html-text.ts`
- `lookupRawTextOpening` — `libs/html-text.ts`
- `lookupReachOfEffects` — `src/core/aura-standing.ts`
- `lookupReaderAsserts` — `tests/repository/reader-layer.test.ts`
- `lookupRecordedFight` — `tests/recorded-fights.ts`
- `lookupRecordingPaths` — `tools/recorded-material.ts`
- `lookupRecursiveNames` — `tests/repository/control-flow.test.ts`
- `lookupRefused` — `src/ui/panel-element.ts`
- `lookupRegisteredStatusName` — `tools/status-bit-table.ts`
- `lookupRegularExpressions` — `tests/repository/regular-expressions.test.ts`
- `lookupReportKey` — `tests/runtime/fight-file.test.ts`
- `lookupRetiredWords` — `tests/repository/names.test.ts`
- `lookupScopeRange` — `tests/repository/browser-globals.test.ts`
- `lookupScriptNameSpan` — `src/ports/margonem-client-build.ts`
- `lookupSectionsOutOfOrder` — `tests/repository/declaration-order.test.ts`
- `lookupSentenceEnds` — `tests/repository/changelog.test.ts`
- `lookupSentenceFaults` — `tests/repository/changelog.test.ts`
- `lookupServedFight` — `tools/preview-server.ts`
- `lookupSetDisagreements` — `tests/tools/panel-shots.test.ts`
- `lookupShapeChanges` — `tests/repository/record-shapes.test.ts`
- `lookupShapeFields` — `tools/protocol-key-table.ts`
- `lookupShotEntry` — `tools/panel-shots.ts`
- `lookupShownFight` — `src/runtime/fight-state.ts`
- `lookupShownKeptFight` — `src/runtime/fight-state.ts`
- `lookupSingleImported` — `tests/repository/single-importer.test.ts`
- `lookupStyleFetches` — `tools/build-userscript.ts`
- `lookupSwitchSubjectStart` — `tools/protocol-key-table.ts`
- `lookupTagClose` — `libs/html-text.ts`
- `lookupTagEnd` — `libs/html-text.ts`
- `lookupTagsCreated` — `tools/build-userscript.ts`
- `lookupThrows` — `tests/repository/throws.test.ts`
- `lookupTopDeclaration` — `tests/repository/nesting-depth.test.ts`
- `lookupTurnLostBy` — `src/core/fight-decoder.ts`
- `lookupTurnOpener` — `src/core/turn-clock.ts`
- `lookupTypeAssertions` — `tests/repository/type-assertions.test.ts`
- `lookupUnderFloor` — `tests/repository/assertion-density.test.ts`
- `lookupUnderwayObjections` — `tests/tools/panel-shots.test.ts`
- `lookupUnguardedCallbacks` — `tests/repository/handed-callbacks.test.ts`
- `lookupUnguardedCallbacksBody` — `tests/repository/handed-callbacks.test.ts`
- `lookupUnnamedCutLevel` — `src/runtime/panel-frame.ts`
- `lookupUnnamedCutPress` — `src/runtime/panel-frame.ts`
- `lookupUnnamedFailures` — `tests/repository/throws.test.ts`
- `lookupUnnamedLevel` — `src/runtime/panel-frame.ts`
- `lookupUnnamedPairLevel` — `src/runtime/panel-frame.ts`
- `lookupUnplacedNames` — `tests/repository/redacted-names.test.ts`
- `lookupWholeNameAt` — `tools/capture-intake.ts`
- `lookupWindowPartMissing` — `src/userscript-entry.ts`
- `lookupWoundActorId` — `src/core/fight-statistics.ts`
- `lookupWritableParameters` — `tests/repository/purity.test.ts`

### `read` — either

- `read` — `src/ports/browser-store.ts`
- `readAll` — `tests/tools/preview-state.test.ts`
- `readAnnouncedSkills` — `tests/repository/skill-durations.test.ts`
- `readAstNodes` — `tests/source-tree.ts`
- `readAt` — `tests/e2e/panel-layer.spec.ts`, `tests/ui/panel-words.test.ts`
- `readBar` — `tests/ui/panel-element.test.ts`
- `readBattle` — `src/ports/margonem-engine-battle.ts`, `tests/ports/margonem-engine-battle.test.ts`
- `readBattleOn` — `tests/ports/margonem-engine-battle.test.ts`
- `readBindingNames` — `tests/repository/name-shapes.test.ts`
- `readBindings` — `tests/repository/browser-globals.test.ts`
- `readBoldRuleNames` — `tests/repository/documents.test.ts`
- `readBoundNames` — `tests/source-tree.ts`
- `readBrowserStorage` — `src/userscript-entry.ts`
- `readBrowserText` — `src/ports/browser-surroundings.ts`
- `readBuildId` — `src/ports/margonem-client-build.ts`, `tests/runtime-world.ts`,
  `tests/runtime/live-fight.test.ts`
- `readBuiltUserscript` — `tests/e2e/build-once.ts`
- `readBuiltVersion` — `tests/e2e/build-once.ts`
- `readBundle` — `tests/tools/preview-server.test.ts`, `tools/panel-giving-way.ts`,
  `tools/preview-server.ts`
- `readBundleFiles` — `tests/source-tree.ts`
- `readCachedArticleText` — `tools/help-article.ts`
- `readCachedBuild` — `tools/margonem-client-source.ts`
- `readCachedBundle` — `tools/margonem-client-source.ts`
- `readCachedHelpArticle` — `tools/help-article.ts`
- `readCachedMargonemClientSource` — `tools/margonem-client-source.ts`
- `readCachedSkillTable` — `tools/skill-table.ts`
- `readCachedSkills` — `tools/skill-table.ts`
- `readCalleeName` — `tests/repository/handed-callbacks.test.ts`
- `readCapturedCombatant` — `src/ports/margonem-engine-warriors.ts`
- `readCard` — `tests/drawn-card.ts`
- `readCardAcross` — `src/ui/panel-element.ts`
- `readCardByKey` — `tests/ui/panel-element.test.ts`
- `readCardCounts` — `tests/runtime/margometer-runtime.test.ts`
- `readCardHeight` — `tests/e2e/panel-card.spec.ts`
- `readCardKey` — `src/ui/panel-element.ts`
- `readCardName` — `tests/e2e/panel-card.spec.ts`
- `readCardOf` — `tests/ui/panel-card.test.ts`
- `readCardWindowPlace` — `src/ui/panel-element.ts`, `tests/ui/panel-drag.test.ts`
- `readCarriedCount` — `tools/capture-intake.ts`
- `readCell` — `tests/e2e/panel-helper.spec.ts`
- `readCentreOf` — `tests/e2e/panel-probe.ts`
- `readChangedByAssignment` — `tests/repository/purity.test.ts`
- `readChangedByMethod` — `tests/repository/purity.test.ts`
- `readChangedNodes` — `tests/repository/purity.test.ts`
- `readCharge` — `tests/ports/warrior-entries.test.ts`
- `readChildNode` — `tests/source-tree.ts`
- `readChosenFights` — `tests/runtime/margometer-runtime.test.ts`
- `readCitations` — `tests/repository/cited-paths.test.ts`
- `readCitationsSpan` — `tests/repository/cited-paths.test.ts`
- `readCitationsSpanHistory` — `tests/repository/cited-paths.test.ts`
- `readClass` — `tests/repository/name-register.test.ts`
- `readCommentLineText` — `tests/repository/comment-share.test.ts`
- `readCommentShare` — `tests/repository/comment-share.test.ts`
- `readCommentTexts` — `tests/source-tree.ts`
- `readCoordinate` — `src/ui/panel-drag.ts`
- `readCorpus` — `tests/tools/drill-report.test.ts`
- `readCutSentences` — `tests/e2e/panel-helper.spec.ts`
- `readDecisionRecord` — `tests/repository/decisions.test.ts`
- `readDecisionRecordField` — `tests/repository/decisions.test.ts`
- `readDecisionRecords` — `tests/repository/decisions.test.ts`
- `readDeclaratorNames` — `tests/repository/name-register.test.ts`
- `readDeclaredFunction` — `tests/repository/purity.test.ts`
- `readDeclaredFunctionName` — `tests/source-tree.ts`
- `readDeclaredNames` — `tests/repository/protocol-keys.test.ts`
- `readDevelopReport` — `tools/develop-reports.ts`
- `readDevelopStyleSheet` — `tests/ui/panel-look.test.ts`
- `readDevelopmentVersion` — `tools/build-userscript.ts`
- `readEdgesOf` — `tests/e2e/panel-probe.ts`
- `readEndingFlag` — `tools/fabricated-fight.ts`
- `readEnvelopeText` — `tests/repository/captured-fight-register.test.ts`
- `readEnvelopeVersion` — `tools/capture-intake.ts`
- `readErrorClasses` — `tests/repository/throws.test.ts`
- `readEventEntries` — `tests/repository/event-entries.test.ts`
- `readEveryCitation` — `tests/repository/cited-paths.test.ts`
- `readFabricatedFight` — `tests/tools/fabricated-fight.test.ts`
- `readFabricatedPaths` — `tools/preview-server.ts`
- `readFight` — `tests/ui/panel-element.test.ts`, `tests/ui/view-failure.test.ts`
- `readFightCard` — `tests/runtime/margometer-runtime.test.ts`
- `readFightLine` — `tests/e2e/panel-card.spec.ts`
- `readFigure` — `tests/core/carried-figure.test.ts`
- `readFiguresDrawn` — `tests/ui/level-drawn.test.ts`
- `readFiguresSaid` — `tests/runtime/panel-frame.test.ts`
- `readFile` — `tests/runtime/fight-file.test.ts`
- `readFileEvents` — `tools/preview-server.ts`
- `readFileNames` — `tests/repository/name-register.test.ts`
- `readFileSurroundings` — `src/runtime/fight-handover.ts`
- `readFirstCodeSpan` — `tests/repository/event-entries.test.ts`
- `readFoldSetting` — `src/runtime/margometer-runtime.ts`
- `readFrozenFiles` — `tools/frozen-files.ts`
- `readFrozenHelpCounts` — `tools/help-article.ts`
- `readFrozenKeyTable` — `tools/protocol-key-table.ts`
- `readFrozenSkillTable` — `tools/skill-table.ts`
- `readFrozenStatusBits` — `tools/status-bit-table.ts`
- `readFunctionNode` — `tests/repository/called-once.test.ts`
- `readGapTo` — `tests/e2e/panel-card.spec.ts`
- `readGitLines` — `tests/repository/cited-paths.test.ts`
- `readGitText` — `tools/panel-shots.ts`
- `readGivingWayBundle` — `tools/panel-giving-way.ts`
- `readGivingWayFlags` — `tools/panel-giving-way.ts`
- `readGripPressOffset` — `src/ui/panel-drag.ts`
- `readGroup` — `tests/ui/panel-card.test.ts`
- `readHandedOver` — `tests/e2e/panel-save.spec.ts`
- `readHeaders` — `tests/ui/view-failure.test.ts`
- `readHeadingDepths` — `tests/repository/readmes.test.ts`
- `readHeadings` — `tests/ui/panel-card.test.ts`
- `readHeight` — `tests/ui/panel-element.test.ts`
- `readHeldDate` — `tests/tools/frozen-files.test.ts`
- `readHeldString` — `tests/repository/name-register.test.ts`
- `readHeldText` — `tools/frozen-files.ts`
- `readHelpersMentions` — `tests/repository/declaration-order.test.ts`
- `readHeroCoordinate` — `src/ports/margonem-engine-place.ts`
- `readHeroId` — `src/ports/margonem-engine-hero.ts`, `tests/runtime/live-fight.test.ts`
- `readHeroIdOf` — `tests/ports/margonem-engine-hero.test.ts`
- `readHildur` — `tests/tools/drill-report.test.ts`
- `readHostStyle` — `tests/e2e/panel-probe.ts`
- `readIdentity` — `tools/capture-intake.ts`
- `readIdsLookedUp` — `tests/tools/preview-site.test.ts`
- `readImportSources` — `tests/source-tree.ts`
- `readInstallBand` — `tests/tools/preview-site.test.ts`
- `readKeptFights` — `tests/runtime-world.ts`
- `readKeyName` — `tests/repository/name-register.test.ts`
- `readKeysReadByName` — `tests/repository/protocol-keys.test.ts`
- `readLabel` — `src/ports/margonem-client-dictionary.ts`, `tests/ui/panel-element.test.ts`
- `readLayerStacks` — `tests/e2e/panel-layer.spec.ts`
- `readLegendary` — `tests/ui/panel-card.test.ts`
- `readLevel` — `tests/e2e/panel-level.spec.ts`
- `readLine` — `tests/repository/called-once.test.ts`
- `readLineHeightDrawn` — `tests/repository/design-tokens.test.ts`
- `readLinesForFigure` — `tests/ui/panel-card.test.ts`
- `readList` — `tests/ui/panel-element.test.ts`
- `readListedDocuments` — `tests/repository/documents.test.ts`
- `readLiveFileSurroundings` — `src/runtime/fight-handover.ts`
- `readLiveMargonemEngineWarriors` — `src/runtime/live-fight.ts`
- `readLoadedMarks` — `tests/tools/preview-site.test.ts`
- `readMargonemAnswerText` — `tools/margonem-client-source.ts`
- `readMargonemEngineAnswer` — `src/ports/margonem-engine-battle.ts`
- `readMargonemEngineBattle` — `src/ports/margonem-engine-battle.ts`
- `readMargonemEngineHeroId` — `src/ports/margonem-engine-hero.ts`
- `readMargonemEnginePlace` — `src/ports/margonem-engine-place.ts`
- `readMargonemEngineRecord` — `src/ports/margonem-engine-battle.ts`
- `readMargonemEngineWarriorSnapshot` — `src/ports/margonem-engine-warriors.ts`
- `readMargonemEngineWarriorsNamed` — `src/ports/margonem-engine-warriors.ts`
- `readMargonemWorldPage` — `tools/margonem-client-source.ts`
- `readMark` — `tests/ui/panel-intent.test.ts`
- `readMasks` — `tests/ports/warrior-entries.test.ts`
- `readMessageIndices` — `tools/turn-count.ts`
- `readMethodName` — `tests/repository/event-entries.test.ts`
- `readMoment` — in 5 files: `src/ports/`, `tests/`
- `readMomentPart` — `src/ports/browser-time.ts`
- `readMomentWith` — `tests/ports/browser-clock.test.ts`
- `readNameVersion` — `tests/repository/captured-fight-register.test.ts`
- `readNameWords` — `tests/repository/names.test.ts`
- `readNamed` — `tests/core/last-heal-rule.test.ts`
- `readNames` — `tests/ports/margonem-engine-warriors.test.ts`
- `readNamesUsedBy` — `tests/ui/panel-look.test.ts`
- `readNestedNodes` — `tests/source-tree.ts`
- `readNodeName` — `tests/repository/name-register.test.ts`
- `readNotes` — `tests/ui/panel-card.test.ts`
- `readNowMilliseconds` — in 5 files: `src/ports/`, `tests/`
- `readNowWith` — `tests/ports/browser-clock.test.ts`
- `readOfferedFight` — `tools/capture-intake.ts`
- `readOk` — `tests/ports/payload-envelope.test.ts`
- `readOne` — `tests/ports/warrior-entries.test.ts`
- `readOpenedAt` — `tests/runtime/shelf.test.ts`
- `readPanelBoxes` — `tests/e2e/panel-camera.ts`
- `readPanelDragSize` — `src/ui/panel-drag.ts`
- `readPanelIntent` — `src/ui/panel-intent.ts`
- `readPanelShape` — `tests/e2e/panel-probe.ts`
- `readParameterNames` — `tests/repository/purity.test.ts`
- `readPatternNames` — `tests/repository/purity.test.ts`
- `readPayloadCosts` — `tools/payload-cost.ts`
- `readPayloadEnvelope` — `src/ports/payload-envelope.ts`
- `readPayloadEnvelopeInteger` — `src/ports/payload-envelope.ts`
- `readPayloadWarriorEntries` — `src/ports/payload-envelope.ts`
- `readPayloadWarriorHealth` — `src/ports/payload-envelope.ts`
- `readPictures` — `tests/repository/readmes.test.ts`
- `readPinned` — `tests/ui/panel-element.test.ts`
- `readPinnedCard` — `tests/ui/panel-element.test.ts`
- `readPinnedFight` — `tests/ui/panel-element.test.ts`
- `readPins` — `tests/repository/workflows.test.ts`
- `readPlace` — `src/ports/margonem-engine-place.ts`, `tests/runtime/live-fight.test.ts`
- `readPlaceOf` — `tests/ports/margonem-engine-place.test.ts`
- `readPlaceholders` — `tests/repository/name-shapes.test.ts`
- `readPlacementSetting` — `src/runtime/margometer-runtime.ts`
- `readPointerFromEvent` — `src/ui/panel-drag.ts`
- `readPointsAlongBar` — `tests/e2e/panel-probe.ts`
- `readPreviewBundle` — `tools/preview-server.ts`
- `readPreviewFlags` — `tools/preview-server.ts`
- `readPropertyName` — `tests/repository/name-register.test.ts`
- `readProvokedAtClose` — `tests/tools/fabricated-fight.test.ts`
- `readQuoted` — `tests/verb-purities.ts`
- `readQuotedSpans` — `tests/repository/design-tokens.test.ts`
- `readReachEntryKey` — `tests/core/aura-standing.test.ts`
- `readReaderSide` — `tests/repository/captured-fight-register.test.ts`
- `readRecordKeys` — `tests/repository/name-register.test.ts`
- `readRecordedAfter` — `tests/runtime/live-fight.test.ts`
- `readRecordedCalls` — `tests/e2e/panel-page.ts`
- `readRecordedCombatant` — `tests/recorded-fights.ts`
- `readRecordedField` — `tests/recorded-fights.ts`
- `readRecordedFight` — `tests/recorded-fights.ts`
- `readRecordedFights` — `tests/recorded-fights.ts`
- `readRecordedHealth` — `tests/recorded-fights.ts`
- `readRecordedMaterial` — `tools/recorded-material.ts`
- `readRecordedText` — `tests/ports/margonem-engine-warriors.test.ts`
- `readRecordingCalls` — `tools/capture-intake.ts`
- `readRecordingFile` — `tools/recorded-material.ts`
- `readRecordingNames` — `tests/tools/preview-server.test.ts`
- `readRecordingPaths` — `tests/e2e/panel-crawl.spec.ts`
- `readRecordingRows` — `tests/repository/captured-fight-register.test.ts`
- `readRecordingTableRows` — `tests/repository/captured-fight-register.test.ts`
- `readRecordingText` — `tests/runtime/fight-file.test.ts`
- `readRegionDrawn` — `tests/ui/level-drawn.test.ts`
- `readRegisterGuards` — `tests/repository/documents.test.ts`
- `readReleaseFile` — `tools/changelog.ts`
- `readRootName` — `tests/repository/purity.test.ts`
- `readRow` — `tests/ui/panel-content.test.ts`
- `readRowCells` — `tests/repository/captured-fight-register.test.ts`
- `readRowKeys` — `tests/ui/level-drawn.test.ts`
- `readRowPlaces` — `tests/ui/level-drawn.test.ts`
- `readRows` — `tests/ui/panel-content.test.ts`
- `readRowsDrawn` — `tests/e2e/panel-marks.spec.ts`
- `readRuleName` — `tests/repository/documents.test.ts`
- `readRuleNameText` — `tests/repository/documents.test.ts`
- `readRules` — `tests/style-sheet.ts`
- `readRunBlows` — `tests/core/granted-blow-rule.test.ts`
- `readRunsFromPayload` — `tests/core/granted-blow-rule.test.ts`
- `readRunsFromRecordings` — `tests/core/granted-blow-rule.test.ts`
- `readRuntimePorts` — `src/userscript-entry.ts`
- `readSavedFile` — `tests/runtime/margometer-runtime.test.ts`
- `readScreen` — `tests/ui/panel-card.test.ts`
- `readScrollers` — `tests/e2e/panel-scroll.spec.ts`
- `readServedBuild` — `tools/margonem-client-source.ts`
- `readServedFiles` — `tools/preview-server.ts`
- `readShapeFlag` — `tools/fabricated-fight.ts`
- `readSheetVariable` — `tests/ui/panel-look.test.ts`
- `readSheetVariables` — `tests/ui/panel-look.test.ts`
- `readShelf` — `tests/runtime/panel-frame.test.ts`
- `readShelfAnswers` — `tests/runtime/margometer-runtime.test.ts`
- `readShelfHeight` — `tests/ui/panel-element.test.ts`
- `readShotPaths` — `tests/repository/readmes.test.ts`
- `readSidecar` — `tests/tools/panel-shots.test.ts`
- `readSimulationKinds` — `tests/simulation.ts`
- `readSimulationRanking` — `tests/simulation.ts`
- `readSiteVersion` — `tools/preview-site.ts`
- `readSizeSetting` — `src/runtime/margometer-runtime.ts`
- `readSkillHeader` — `tests/repository/documents.test.ts`
- `readSkillHeaderField` — `tests/repository/documents.test.ts`
- `readSourceFiles` — `tests/source-tree.ts`
- `readStacksUnder` — `tests/e2e/panel-layer.spec.ts`
- `readStanding` — `tests/core/legendary-standing.test.ts`
- `readStateFromHash` — `tests/tools/preview-state.test.ts`
- `readStatedName` — `tests/repository/throws.test.ts`
- `readStepPixels` — `tests/repository/design-tokens.test.ts`
- `readStorageChoice` — `src/runtime/settings.ts`
- `readStrikingProcs` — `tests/ui/panel-card.test.ts`
- `readStructurePaths` — `tests/repository/documents.test.ts`
- `readSuiteKeys` — `tests/repository/browser-suite-keys.test.ts`
- `readSuspicions` — `tests/ui/panel-content.test.ts`
- `readTestBattle` — `tests/runtime-world.ts`
- `readTextInClassName` — `tests/tools/preview-site.test.ts`
- `readTextWithin` — `tests/fake-document.ts`
- `readTimestampText` — in 4 files: `src/ports/`, `tests/`
- `readTipsHeadingRule` — `tests/tools/preview-page.test.ts`
- `readTokensSpent` — `tests/repository/design-tokens.test.ts`
- `readTold` — `tests/e2e/panel-tooltip.spec.ts`
- `readTooltips` — `tests/e2e/panel-tooltip.spec.ts`
- `readTopItems` — `tests/repository/declaration-order.test.ts`
- `readTopItemsDerivedNames` — `tests/repository/declaration-order.test.ts`
- `readTopItemsStatement` — `tests/repository/declaration-order.test.ts`
- `readTopOfList` — `src/ui/panel-element.ts`
- `readTrackedPaths` — `tests/repository/cited-paths.test.ts`, `tests/repository/documents.test.ts`,
  `tests/repository/name-register.test.ts`
- `readTurnLines` — `tests/ui/panel-card.test.ts`
- `readTurnsAtCast` — `tests/core/aura-standing.test.ts`
- `readTypeStep` — `src/runtime/settings.ts`
- `readUnderPoint` — `tests/e2e/panel-probe.ts`
- `readUpdates` — `tests/runtime/margometer-runtime.test.ts`
- `readUserAgent` — `src/ports/browser-surroundings.ts`, `tests/runtime-world.ts`
- `readUserscriptFiles` — `tools/build-userscript.ts`
- `readVerb` — `tests/verb-purities.ts`
- `readVerbPurities` — `tests/verb-purities.ts`
- `readViewport` — in 7 files: `src/`, `src/ui/`, `tests/`
- `readVocabularyKeys` — `tests/repository/name-register.test.ts`
- `readWarriors` — `src/ports/margonem-engine-battle.ts`
- `readWidthPixels` — `src/ui/panel-drag.ts`
- `readWindowCollapsed` — `src/runtime/settings.ts`
- `readWindowPosition` — `src/runtime/settings.ts`
- `readWindowSize` — `src/runtime/settings.ts`
- `readWindowWidths` — `src/ui/panel-element.ts`
- `readWorld` — `src/ports/browser-surroundings.ts`, `tests/runtime-world.ts`

### `write` — none

- `write` — `src/ports/browser-store.ts`
- `writeBrandedLine` — in 9 files: `src/ports/`, `tests/`
- `writeCarriedTooltips` — `src/runtime/carried-tooltip.ts`
- `writeDevelopmentPreview` — `tools/margonem-readings.ts`
- `writeFabricatedFight` — `tools/fabricated-fight.ts`
- `writeFile` — in 4 files: `src/ports/`, `tests/`
- `writeFrozenFiles` — `tools/frozen-files.ts`
- `writeFrozenHelpCounts` — `tools/help-article.ts`
- `writeFrozenKeyTable` — `tools/protocol-key-table.ts`
- `writeFrozenSkillTable` — `tools/skill-table.ts`
- `writeFrozenStatusBits` — `tools/status-bit-table.ts`
- `writeGivingWayShots` — `tools/panel-giving-way.ts`
- `writeHelpArticleCache` — `tools/help-article.ts`
- `writeHelpSearchReport` — `tools/help-article.ts`
- `writeHostStyle` — `src/ui/panel-drag.ts`
- `writeIntake` — `tools/capture-intake.ts`
- `writeKeptFight` — `src/runtime/shelf.ts`
- `writeKeptFightPin` — `src/runtime/shelf.ts`
- `writeLiveCallsFallback` — `src/runtime/margometer-runtime.ts`
- `writeLiveCallsFile` — `src/runtime/fight-handover.ts`
- `writeMargonemClientSourceCache` — `tools/margonem-client-source.ts`
- `writeMargonemClientStatusReport` — `tools/margonem-client-source.ts`
- `writeMargonemEngineWarriorBlock` — `src/ports/margonem-engine-tooltip.ts`
- `writePanelPicture` — `tests/e2e/panel-camera.ts`
- `writePanelShots` — `tools/panel-shots.ts`
- `writePointerCapture` — `src/ui/panel-drag.ts`
- `writeReadingsStatus` — `tools/margonem-readings.ts`
- `writeRefreshedReadings` — `tools/margonem-readings.ts`
- `writeRows` — `src/ports/margonem-engine-tooltip.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/runtime/panel-frame.test.ts`
- `writeShelf` — `src/runtime/shelf.ts`
- `writeShelfContents` — `src/runtime/shelf.ts`
- `writeShot` — `tools/panel-shots.ts`
- `writeShownFightFile` — `src/runtime/fight-handover.ts`
- `writeSkillTableCache` — `tools/skill-table.ts`
- `writeStoodDownLine` — `src/userscript-entry.ts`
- `writeStorageChoice` — `src/runtime/settings.ts`
- `writeTopOfList` — `src/ui/panel-element.ts`
- `writeTypeStep` — `src/runtime/settings.ts`
- `writeUserscript` — `tools/build-userscript.ts`
- `writeWindowCollapsed` — `src/runtime/settings.ts`
- `writeWindowPosition` — `src/runtime/settings.ts`
- `writeWindowSize` — `src/runtime/settings.ts`

### `parse` — strong

- `parseAbsentKeys` — `tests/repository/protocol-keys.test.ts`
- `parseBackticked` — `tests/tools/drill-report.test.ts`
- `parseBacktickedPhrases` — `tools/help-claim-register.ts`
- `parseBareCell` — `tests/tools/drill-report.test.ts`
- `parseBitRows` — `tests/tools/aura-lifetime.test.ts`
- `parseCardArguments` — `tools/card-height.ts`
- `parseCaseLabels` — `tools/protocol-key-table.ts`
- `parseCellEffects` — `tools/skill-table.ts`
- `parseChangelogEntries` — `tests/repository/changelog.test.ts`
- `parseCitedHelpPhrases` — `tools/help-claim-register.ts`
- `parseClauseRows` — `tests/tools/aura-lifetime.test.ts`
- `parseDecimal` — `libs/number-text.ts`
- `parseDeclarations` — `tests/repository/browser-support.test.ts`
- `parseDeclaredVersion` — `tools/build-userscript.ts`
- `parseDrillArguments` — `tools/drill-report.ts`
- `parseEffect` — `tools/skill-table.ts`
- `parseExplainedCells` — `tests/tools/drill-report.test.ts`
- `parseFloorRows` — `tests/repository/browser-support.test.ts`
- `parseFunctionNames` — `tests/repository/browser-support.test.ts`
- `parseHealthPercent` — `src/core/protocol-number.ts`
- `parseHelpClaim` — `tools/help-claim-register.ts`
- `parseHelpClaims` — `tools/help-claim-register.ts`
- `parseHoldingRows` — `tests/tools/shout-holding.test.ts`
- `parseInteger` — `libs/number-text.ts`
- `parseJson` — `libs/json-text.ts`
- `parseKeyToken` — `src/core/fight-decoder.ts`
- `parseKindsSaidShut` — `tests/tools/drill-report.test.ts`
- `parseLabel` — `src/ports/margonem-client-dictionary.ts`
- `parseLabelClaims` — `tests/repository/protocol-keys.test.ts`
- `parseMargonemClientBuildId` — `src/ports/margonem-client-build.ts`
- `parseMargonemClientBundleName` — `src/ports/margonem-client-build.ts`
- `parseMessageKeys` — `tests/tools/fabricated-fight.test.ts`
- `parseMomentDay` — `tools/capture-intake.ts`
- `parseNamedTarget` — `src/core/fight-decoder.ts`
- `parseOrFail` — in 4 files: `tests/`
- `parsePaletteStated` — `tests/repository/design-tokens.test.ts`
- `parseProseCountClaims` — `tools/protocol-key-shape.ts`
- `parseProtocolMessage` — `src/core/fight-decoder.ts`
- `parseProtocolMessageEnd` — `src/core/fight-decoder.ts`
- `parseProtocolMessageSegments` — `src/core/fight-decoder.ts`
- `parseQuotedNames` — `tests/repository/browser-support.test.ts`
- `parseReach` — `tests/tools/aura-standing.test.ts`
- `parseReadingArguments` — `tools/turn-reading.ts`
- `parseRecordingsNamed` — `tools/protocol-key-shape.ts`
- `parseReferencedCodePoint` — `libs/html-text.ts`
- `parseRegisterHeading` — `tools/protocol-key-shape.ts`
- `parseRegisterRows` — in 4 files: `tests/`
- `parseRegisteredKeys` — `tools/protocol-key-shape.ts`
- `parseReportLines` — `tools/develop-reports.ts`
- `parseRowCells` — `tests/tools/drill-report.test.ts`, `tools/skill-table.ts`
- `parseRowsUnder` — `tests/tools/turn-reading.test.ts`
- `parseScriptFloorRows` — `tests/repository/browser-support.test.ts`
- `parseSection` — `tests/markdown-document.ts`
- `parseSectionLines` — `tests/tools/drill-report.test.ts`, `tests/tools/turn-reading.test.ts`
- `parseSelectorNames` — `tests/repository/browser-support.test.ts`
- `parseSettledConstructs` — `tests/repository/browser-support.test.ts`
- `parseShapeFields` — `tools/protocol-key-table.ts`
- `parseShapeLine` — `tools/protocol-key-shape.ts`
- `parseShapeLineOccurrences` — `tools/protocol-key-shape.ts`
- `parseShapeLinePlacement` — `tools/protocol-key-shape.ts`
- `parseShapeLineValue` — `tools/protocol-key-shape.ts`
- `parseShareCells` — `tests/tools/shout-holding.test.ts`
- `parseSharePoints` — `tests/share-text.ts`
- `parseSharedCells` — `tests/tools/aura-lifetime.test.ts`
- `parseSheetColour` — `tests/ui/panel-look.test.ts`
- `parseSheetColourRgb` — `tests/ui/panel-look.test.ts`
- `parseShoutNames` — `src/core/aura-standing.ts`
- `parseShoutRows` — `tests/tools/aura-standing.test.ts`
- `parseSourceRows` — `tests/tools/aura-standing.test.ts`
- `parseStatedCountRule` — `tools/protocol-key-shape.ts`
- `parseStatedFloor` — `tests/repository/browser-support.test.ts`
- `parseStatedVerdicts` — `tools/protocol-key-shape.ts`
- `parseStyleConstructs` — `tests/repository/browser-support.test.ts`
- `parseStyleTableConstructs` — `tests/repository/browser-support.test.ts`
- `parseTableCells` — `tests/markdown-document.ts`
- `parseTableCellsBare` — `tests/markdown-document.ts`
- `parseTableInteger` — `tests/register-table.ts`
- `parseTableRows` — `tests/register-table.ts`
- `parseTokenRows` — `tests/repository/design-tokens.test.ts`
- `parseTurnArguments` — `tools/turn-count.ts`
- `parseUnwrapped` — `tests/tools/drill-report.test.ts`
- `parseUnwrappedText` — `tests/markdown-document.ts`
- `parseValueWords` — `tests/repository/browser-support.test.ts`
- `parseWholePair` — `src/runtime/settings.ts`
- `parseWordFrom` — `tests/repository/browser-support.test.ts`
- `parseWorld` — `src/ports/browser-surroundings.ts`

### `decode` — strong

- `decode` — `tests/core/fight-decoder.test.ts`, `tests/core/fight-statistics.test.ts`
- `decodeAnnouncedSkill` — `src/core/fight-decoder.ts`
- `decodeAttackEvent` — `src/core/fight-decoder.ts`
- `decodeCharacterReferences` — `libs/html-text.ts`
- `decodeDeclaration` — `src/core/fight-decoder.ts`
- `decodeFightMessages` — `tests/ui/panel-content.test.ts`
- `decodeFightOutcome` — `src/core/fight-decoder.ts`
- `decodeFledOutcome` — `src/core/fight-decoder.ts`
- `decodeHealthChange` — `src/core/fight-decoder.ts`
- `decodeHtmlText` — `libs/html-text.ts`
- `decodeKeyPlacements` — `tools/protocol-key-shape.ts`
- `decodeKeyValue` — `tools/protocol-key-shape.ts`
- `decodeMessage` — `src/core/fight-decoder.ts`
- `decodeMessageEvents` — `src/core/fight-decoder.ts`
- `decodeMessageParameters` — `src/core/fight-decoder.ts`
- `decodeNamedDamage` — `src/core/fight-decoder.ts`
- `decodeNamedHealing` — `src/core/fight-decoder.ts`
- `decodePayloadMessages` — `src/core/fight-decoder.ts`
- `decodeRecordedFight` — `tests/recorded-fights.ts`
- `decodeSkillUsedEvent` — `src/core/fight-decoder.ts`
- `decodeTwoAppliers` — `tests/core/anguish-rule.test.ts`
- `decodeUnaccountedShare` — `src/core/fight-decoder.ts`
- `decodeUnknownMessageEvent` — `src/core/fight-decoder.ts`
- `decodeWithTable` — `tests/core/granted-blow-rule.test.ts`

### `encode` — strong

- `encodeAnnouncement` — `tools/fabricated-fight.ts`
- `encodeArmour` — `tools/fabricated-fight.ts`
- `encodeCombatantsById` — `tools/fabricated-fight.ts`
- `encodeFabricatedFight` — `tools/fabricated-fight.ts`
- `encodeFamilyText` — `tools/protocol-key-table.ts`
- `encodeFightFile` — `src/runtime/fight-file.ts`
- `encodeFightFileName` — `src/runtime/fight-file.ts`
- `encodeFightReport` — `src/runtime/fight-file.ts`
- `encodeFigure` — `tools/fabricated-fight.ts`
- `encodeFigureRecord` — `tools/fabricated-fight.ts`
- `encodeFledClosing` — `tools/fabricated-fight.ts`
- `encodeFrozenHelpModule` — `tools/help-article.ts`
- `encodeFrozenKeyModule` — `tools/protocol-key-table.ts`
- `encodeFrozenSkillTexts` — `tools/skill-table.ts`
- `encodeFrozenSkills` — `tools/skill-table.ts`
- `encodeFrozenStatusModule` — `tools/status-bit-table.ts`
- `encodeHealthChange` — `tools/fabricated-fight.ts`
- `encodeHealthPercent` — `src/core/protocol-number.ts`
- `encodeHealthRecord` — `tools/fabricated-fight.ts`
- `encodeJson` — `libs/json-text.ts`
- `encodeKeptFight` — `src/runtime/shelf.ts`
- `encodeMessage` — `tools/fabricated-fight.ts`
- `encodeMovedHealth` — `tools/fabricated-fight.ts`
- `encodeNamedText` — `tools/fabricated-fight.ts`
- `encodeOpeningCombatant` — `tools/fabricated-fight.ts`
- `encodeOpeningDeclarations` — `tools/fabricated-fight.ts`
- `encodeProtocolMessage` — `src/core/fight-decoder.ts`
- `encodeProtocolMessageEnd` — `src/core/fight-decoder.ts`
- `encodeReportCombatants` — `src/runtime/fight-file.ts`
- `encodeReportCut` — `src/runtime/fight-file.ts`
- `encodeReportPairCut` — `src/runtime/fight-file.ts`
- `encodeReportRow` — `src/runtime/fight-file.ts`
- `encodeReportSkills` — `src/runtime/fight-file.ts`
- `encodeReportTotals` — `src/runtime/fight-file.ts`
- `encodeRequiredJson` — `tools/capture-intake.ts`
- `encodeRequiredText` — `tools/help-article.ts`, `tools/protocol-key-table.ts`,
  `tools/status-bit-table.ts`
- `encodeSample` — `tests/tools/frozen-files.test.ts`
- `encodeSettledClosing` — `tools/fabricated-fight.ts`
- `encodeSide` — `tools/fabricated-fight.ts`
- `encodeSideNames` — `tools/fabricated-fight.ts`
- `encodeSnapshot` — `tools/fabricated-fight.ts`
- `encodeStandingCombatant` — `tools/fabricated-fight.ts`
- `encodeTooltipBlock` — `src/ports/margonem-engine-tooltip.ts`
- `encodeTurnQueue` — `tools/fabricated-fight.ts`
- `encodeUserscriptBanner` — `tools/build-userscript.ts`
- `encodeUserscriptBannerDirectives` — `tools/build-userscript.ts`
- `encodeValued` — `tools/fabricated-fight.ts`
- `encodeValueless` — `tools/fabricated-fight.ts`
- `encodeWholePair` — `src/runtime/settings.ts`
- `encodeWrittenShelf` — `tests/runtime/shelf.test.ts`

### `tally` — strong

- `tally` — `tests/core/fight-statistics.test.ts`
- `tallyAuraRows` — `tools/aura-standing.ts`
- `tallyBitRows` — `tools/aura-lifetime.ts`
- `tallyBitRowsCommonTurns` — `tools/aura-lifetime.ts`
- `tallyBlowFigures` — `src/core/fight-statistics.ts`
- `tallyCardHeight` — `tools/card-height.ts`
- `tallyCardHeights` — `tools/card-height.ts`
- `tallyCardLayoutSize` — `src/ui/panel-element.ts`
- `tallyCardSize` — `src/ui/panel-element.ts`
- `tallyCarriedFigures` — `src/core/carried-figure.ts`
- `tallyCut` — `src/ui/panel-content.ts`
- `tallyCutImbalance` — `src/core/fight-statistics.ts`
- `tallyDamageAmounts` — `src/core/fight-statistics.ts`
- `tallyDamagePartsImbalance` — `src/core/fight-statistics.ts`
- `tallyDealtTakenImbalance` — `src/core/fight-statistics.ts`
- `tallyDecodingStatus` — `tools/decoding-status.ts`
- `tallyDefenceCutsImbalance` — `src/core/fight-statistics.ts`
- `tallyDrillCases` — `tools/drill-report.ts`
- `tallyEveryRecording` — `tests/ui/panel-content.test.ts`
- `tallyExpectedTicks` — `tests/core/injure-rule.test.ts`
- `tallyFightCardHeights` — `tools/card-height.ts`
- `tallyFightFigures` — `src/core/fight-figures.ts`
- `tallyFightState` — `src/runtime/fight-state.ts`
- `tallyFightStatistics` — `src/core/fight-statistics.ts`
- `tallyFightWithTick` — `tests/core/injure-rule.test.ts`
- `tallyHalfNamedCutsImbalance` — `src/core/fight-statistics.ts`
- `tallyHalfNamedRowsImbalance` — `src/core/fight-statistics.ts`
- `tallyHoldingReading` — `tools/shout-holding.ts`
- `tallyKeyShapes` — `tools/protocol-key-shape.ts`
- `tallyKeyShapesPlacement` — `tools/protocol-key-shape.ts`
- `tallyKeyShapesValue` — `tools/protocol-key-shape.ts`
- `tallyLegendaryBonuses` — `src/core/legendary-standing.ts`
- `tallyListedTotal` — `src/ui/panel-content.ts`
- `tallyPercentForBearer` — `src/core/carried-figure.ts`
- `tallyPinnedFigure` — `src/ui/panel-content.ts`
- `tallyProvocationRows` — `tools/aura-standing.ts`
- `tallyRecordedFight` — `tests/recorded-fights.ts`
- `tallyRestoredGivenImbalance` — `src/core/fight-statistics.ts`
- `tallyRowShare` — `tests/tools/shout-holding.test.ts`
- `tallySkillUses` — `src/ui/panel-content.ts`
- `tallySourceRows` — `tools/aura-standing.ts`
- `tallyStruck` — `tests/tools/shout-holding.test.ts`
- `tallyStruckShare` — `tools/shout-holding.ts`
- `tallyTakenByKind` — `tests/core/fight-statistics.test.ts`
- `tallyTotals` — `src/core/fight-statistics.ts`
- `tallyTurnDelta` — `tools/turn-count.ts`
- `tallyUnsharedPairParts` — `src/ui/panel-content.ts`

### `count` — strong

- `countAssertions` — `tests/repository/assertion-density.test.ts`
- `countBlockHeadings` — `tests/repository/comment-share.test.ts`
- `countBlocksInText` — `tests/runtime/carried-tooltip.test.ts`
- `countCardGroupsColumned` — `src/ui/panel-element.ts`
- `countDocblockProse` — `tests/repository/comment-share.test.ts`
- `countDrillRows` — `tests/ui/panel-element.test.ts`
- `countElementCutRows` — `src/ui/panel-element.ts`
- `countEnclosingBlocks` — `tests/source-tree.ts`
- `countEvent` — `tests/core/fight-decoder.test.ts`
- `countHeld` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `countListRows` — `tests/runtime/margometer-runtime.test.ts`
- `countMessagesLost` — `src/core/fight-session.ts`
- `countOccurrences` — `tools/help-article.ts`
- `countPairingsClearing` — `tests/ui/panel-look.test.ts`
- `countParametersRead` — `src/core/fight-decoder.ts`
- `countPhrases` — `tools/help-article.ts`
- `countPropertyDeclarations` — `tests/repository/browser-support.test.ts`
- `countProtocolMessageSegments` — `src/core/fight-decoder.ts`
- `countRows` — `tests/runtime/margometer-runtime.test.ts`
- `countRowsForOpenedLevel` — `src/ui/panel-element.ts`
- `countRowsForPairLevel` — `src/ui/panel-element.ts`
- `countRowsThatOpen` — `tests/runtime/margometer-runtime.test.ts`
- `countUnreadMessages` — `src/core/fight-statistics.ts`

### `clamp` — strong

- `clampNumber` — `libs/number-range.ts`
- `clampPosition` — `src/ui/panel-drag.ts`
- `clampSize` — `src/ui/panel-drag.ts`

### `index` — strong

- `indexAmountByKey` — `src/core/aura-standing.ts`
- `indexAnnouncedNamesByActor` — `src/core/charged-skill.ts`
- `indexAuraTurnsBySkillId` — `src/core/aura-standing.ts`
- `indexBlowsGrantedBySkillId` — `src/core/fight-decoder.ts`
- `indexCallableNames` — `tests/source-tree.ts`
- `indexCalls` — `tests/repository/control-flow.test.ts`
- `indexChargeBrokenIds` — `src/core/charged-skill.ts`
- `indexCombatantRoll` — `tools/capture-intake.ts`
- `indexCombatantRoster` — `src/core/combatant-roster.ts`
- `indexDefences` — `src/core/protocol-key.ts`
- `indexFightEntryHealth` — `src/core/combatant-health.ts`
- `indexImportReach` — `tests/repository/name-shapes.test.ts`
- `indexKeyByStatusBit` — `src/core/carried-figure.ts`
- `indexKeyMeanings` — `src/core/protocol-key.ts`
- `indexMembersBySide` — `tools/fight-figures.ts`
- `indexNameSubstitutions` — `tools/capture-intake.ts`
- `indexNamedBySkillId` — `tools/aura-standing.ts`
- `indexRecordedRoster` — `tests/core/fight-decoder.test.ts`
- `indexRecordedWarriors` — `tests/repository/captured-fight-register.test.ts`
- `indexReducedSides` — `src/core/combatant-health.ts`
- `indexReportSections` — `tools/develop-reports.ts`
- `indexShoutsBySkillId` — `src/core/aura-standing.ts`
- `indexSideHeals` — `src/core/combatant-health.ts`
- `indexTurnsByCombatantId` — `tools/turn-count.ts`

### `replay` — strong

- `replayAuraStandings` — `src/core/aura-standing.ts`
- `replayClocks` — `tools/shout-holding.ts`
- `replayEach` — `tests/ports/recorded-session.test.ts`
- `replayEpisodes` — `tools/shout-holding.ts`
- `replayFabricatedFight` — `tests/tools/fabricated-fight.test.ts`
- `replayFightPayloads` — `src/runtime/fight-state.ts`
- `replayFrostFigure` — `tests/core/carried-figure.test.ts`
- `replayKeptFight` — `src/runtime/fight-state.ts`
- `replayLightingRows` — `tools/aura-lifetime.ts`
- `replayMaterialSteps` — `tools/recorded-material.ts`
- `replayMessageTurn` — `tools/turn-reading.ts`
- `replayRecordedCalls` — `tools/recorded-material.ts`
- `replayRecordedFight` — `tests/core/fight-figures.test.ts`, `tests/recorded-fights.ts`
- `replayRecordedMaterial` — `tools/recorded-material.ts`
- `replayRecordedSteps` — `tools/recorded-material.ts`
- `replayShort` — `tests/tools/decoding-status.test.ts`
- `replayStandings` — `tests/core/aura-standing.test.ts`
- `replayStatusRuns` — `tools/aura-lifetime.ts`

### `present` — strong

- `presentCard` — `src/ui/panel-element.ts`
- `presentCardCounterLines` — `src/ui/panel-element.ts`
- `presentCardCriticalText` — `src/ui/panel-element.ts`
- `presentCardDealtLines` — `src/ui/panel-element.ts`
- `presentCardDestroyedLines` — `src/ui/panel-element.ts`
- `presentCardFigureLines` — `src/ui/panel-element.ts`
- `presentCardFigures` — `src/ui/panel-element.ts`
- `presentCardLegendaryLines` — `src/ui/panel-element.ts`
- `presentCardNoteLines` — `src/ui/panel-element.ts`
- `presentCardPartsMergedByWord` — `src/ui/panel-element.ts`
- `presentCardProcLines` — `src/ui/panel-element.ts`
- `presentCardProcSubParts` — `src/ui/panel-element.ts`
- `presentCardRawLine` — `src/ui/panel-element.ts`
- `presentCardReachedLines` — `src/ui/panel-element.ts`
- `presentCardRunGroups` — `src/ui/panel-element.ts`
- `presentCardSubLine` — `src/ui/panel-element.ts`
- `presentCardTakenLines` — `src/ui/panel-element.ts`
- `presentCardTurnLine` — `src/ui/panel-element.ts`
- `presentCarriedTooltip` — `src/runtime/carried-tooltip.ts`
- `presentCaveatNoteLines` — `src/ui/panel-element.ts`
- `presentChargedSkillCard` — `src/ui/panel-element.ts`
- `presentCombatantRow` — `src/ui/panel-element.ts`
- `presentCrumbCard` — `src/ui/panel-element.ts`
- `presentDirectionStrips` — `src/ui/panel-screen.ts`
- `presentElementRow` — `src/ui/panel-element.ts`
- `presentFightCard` — `src/ui/panel-element.ts`
- `presentFightCardContent` — `src/runtime/panel-frame.ts`
- `presentFrameScreen` — `src/runtime/panel-frame.ts`
- `presentHalfNamedForEveryone` — `tools/drill-report.ts`
- `presentHelper` — `src/ui/panel-helper.ts`
- `presentHelperForFrame` — `src/runtime/panel-frame.ts`
- `presentHelperPersonCard` — `src/ui/panel-element.ts`
- `presentKeptShelfRow` — `src/runtime/panel-frame.ts`
- `presentKindCutParts` — `src/ui/panel-element.ts`
- `presentMetricScreen` — `tests/ui/panel-content.test.ts`
- `presentNounStrips` — `src/ui/panel-screen.ts`
- `presentOpenedLevel` — `src/ui/panel-content.ts`
- `presentOpenedLevels` — `src/runtime/panel-frame.ts`
- `presentOptions` — `src/runtime/panel-frame.ts`
- `presentPairLevel` — `src/ui/panel-content.ts`
- `presentPartLevel` — `src/ui/panel-content.ts`
- `presentRowCard` — `src/ui/panel-element.ts`
- `presentRowCardCutLines` — `src/ui/panel-element.ts`
- `presentScreen` — `src/ui/panel-content.ts`
- `presentScreenForEveryone` — `tools/drill-report.ts`
- `presentShelfAnswers` — `src/runtime/panel-frame.ts`
- `presentShelfHeadcount` — `src/runtime/panel-frame.ts`
- `presentShelfRows` — `src/runtime/panel-frame.ts`
- `presentSideScreen` — `tests/ui/panel-content.test.ts`
- `presentSideStrips` — `src/ui/panel-screen.ts`
- `presentSkillRow` — `src/ui/panel-element.ts`
- `presentStandingChargedSkill` — `src/ui/panel-helper.ts`
- `presentStandingChargedSkills` — `src/ui/panel-helper.ts`
- `presentStandingProvocations` — `src/ui/panel-helper.ts`
- `presentStandingProvoked` — `src/ui/panel-helper.ts`
- `presentTooltipRows` — `src/ui/panel-words.ts`
- `presentUnnamedCut` — `tools/drill-report.ts`
- `presentUnnamedCutLevel` — `src/ui/panel-content.ts`
- `presentUnnamedLevel` — `src/ui/panel-content.ts`
- `presentUnnamedPairLevel` — `src/ui/panel-content.ts`
- `presentUnnamedRow` — `src/ui/panel-element.ts`
- `presentUnreadShelfRow` — `src/runtime/panel-frame.ts`
- `presentUntouchedCard` — `tests/ui/panel-card.test.ts`

### `render` — none

- `render` — `src/ui/panel-element.ts`, `tests/runtime/panel-frame.test.ts`
- `renderBarControl` — `src/ui/panel-element.ts`
- `renderCard` — `src/ui/panel-element.ts`
- `renderCardCaveat` — `src/ui/panel-element.ts`
- `renderCardFor` — `src/ui/panel-element.ts`
- `renderClosingRowAtPlace` — `src/ui/panel-element.ts`
- `renderCrumb` — `src/ui/panel-element.ts`
- `renderCrumbRegion` — `src/ui/panel-element.ts`
- `renderDefects` — `src/ui/panel-element.ts`
- `renderDirectionStrips` — `src/ui/panel-element.ts`
- `renderElement` — `src/ui/panel-element.ts`
- `renderElementSection` — `src/ui/panel-element.ts`
- `renderEmptyNote` — `src/ui/panel-element.ts`
- `renderEmptySlot` — `src/ui/panel-element.ts`
- `renderFold` — `src/ui/panel-element.ts`
- `renderFrame` — `src/runtime/panel-frame.ts`
- `renderHalfNamedRows` — `src/ui/panel-element.ts`
- `renderHeaderRegion` — `src/ui/panel-element.ts`
- `renderHelper` — `src/ui/panel-element.ts`, `tests/runtime/panel-frame.test.ts`
- `renderHelperBar` — `src/ui/panel-element.ts`
- `renderHelperBody` — `src/ui/panel-element.ts`
- `renderHelperPerson` — `src/ui/panel-element.ts`
- `renderInPlace` — `src/ui/panel-element.ts`
- `renderListContainer` — `src/ui/panel-element.ts`
- `renderListLevel` — `src/ui/panel-element.ts`
- `renderListRegion` — `src/ui/panel-element.ts`
- `renderListRows` — `src/ui/panel-element.ts`
- `renderNounStrips` — `src/ui/panel-element.ts`
- `renderOpen` — `src/ui/panel-element.ts`
- `renderOptionsQuestion` — `src/ui/panel-element.ts`
- `renderOutsideRegion` — `src/ui/panel-element.ts`
- `renderPanelFolded` — `src/ui/panel-element.ts`
- `renderPanelOptions` — `src/ui/panel-element.ts`
- `renderPanelSettled` — `src/ui/panel-element.ts`
- `renderPersonRow` — `src/ui/panel-element.ts`
- `renderPinnedRows` — `src/ui/panel-element.ts`
- `renderRegion` — `src/ui/panel-element.ts`
- `renderRestRow` — `src/ui/panel-element.ts`
- `renderRow` — `src/ui/panel-element.ts`
- `renderScreen` — `src/ui/panel-element.ts`
- `renderSection` — `src/ui/panel-element.ts`
- `renderSideRules` — `src/ui/panel-element.ts`
- `renderSidesRegion` — `src/ui/panel-element.ts`
- `renderSizeGrip` — `src/ui/panel-element.ts`
- `renderSlot` — `src/ui/panel-element.ts`
- `renderStrip` — `src/ui/panel-element.ts`
- `renderSuspicions` — `src/ui/panel-element.ts`
- `renderText` — `src/ui/panel-element.ts`
- `renderWaiting` — `src/ui/panel-element.ts`, `tests/runtime/panel-frame.test.ts`
- `renderWaitingList` — `src/ui/panel-element.ts`

### `format` — strong

- `formatAuraReport` — `tools/aura-standing.ts`
- `formatAuraReportLine` — `tools/aura-standing.ts`
- `formatAuraReportShouts` — `tools/aura-standing.ts`
- `formatAuraReportSources` — `tools/aura-standing.ts`
- `formatAuraReportStanding` — `tools/aura-standing.ts`
- `formatBitReport` — `tools/aura-lifetime.ts`
- `formatBitShift` — `tools/margonem-readings.ts`
- `formatBlowLines` — `tools/fight-figures.ts`
- `formatBuiltAt` — `tests/tools/build-userscript.test.ts`
- `formatCardSubtitle` — `src/ui/panel-words.ts`
- `formatCaseReport` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `formatCastText` — `tests/repository/captured-fight-register.test.ts`
- `formatChargedSkillSubtitle` — `src/ui/panel-words.ts`
- `formatChargedSkillTurnsLeft` — `src/ui/panel-element.ts`
- `formatCitation` — `tests/repository/cited-paths.test.ts`
- `formatCodeSpan` — `tests/repository/name-register.test.ts`
- `formatColour` — `src/ui/panel-palette.ts`
- `formatColumnsLine` — `tools/fight-figures.ts`
- `formatComparison` — `tools/develop-reports.ts`
- `formatCostReport` — `tools/payload-cost.ts`
- `formatCountedNoun` — `src/ui/panel-words.ts`
- `formatCutText` — `tools/fight-figures.ts`
- `formatDatedDevelopmentVersion` — `tools/build-userscript.ts`
- `formatDecimal` — `libs/number-text.ts`
- `formatDecisionName` — `tests/repository/decisions.test.ts`
- `formatDecisionNumber` — `tests/repository/decisions.test.ts`
- `formatDefect` — `src/ui/panel-words.ts`
- `formatDestroyed` — `src/ui/panel-words.ts`
- `formatDetailLines` — `tools/fight-figures.ts`
- `formatDifferenceLines` — `tools/develop-reports.ts`
- `formatDisputeReport` — `tools/turn-reading.ts`
- `formatDrillReport` — `tools/drill-report.ts`
- `formatDumpAge` — `tools/help-article.ts`
- `formatEntry` — `tests/repository/name-register.test.ts`
- `formatFabricationShape` — `tools/fabricated-fight.ts`
- `formatFightPlace` — `src/runtime/panel-frame.ts`
- `formatFightPlaceWords` — `src/runtime/panel-frame.ts`
- `formatFigure` — `src/ui/panel-words.ts`
- `formatFigureReport` — `tools/fight-figures.ts`
- `formatGradeRegister` — `tools/turn-count.ts`
- `formatGradeRegisterBounded` — `tools/turn-count.ts`
- `formatGradeRegisterStretch` — `tools/turn-count.ts`
- `formatGrammarRefusedSuspicion` — `src/ui/panel-words.ts`
- `formatGrouped` — `tests/tools/drill-report.test.ts`
- `formatHeightReport` — `tools/card-height.ts`
- `formatHoldingLine` — `tools/shout-holding.ts`
- `formatHoldingReport` — `tools/shout-holding.ts`
- `formatInteger` — `libs/number-text.ts`
- `formatJoinedInProgressSuspicion` — `src/ui/panel-words.ts`
- `formatKeptUnread` — `src/ui/panel-words.ts`
- `formatKeyReport` — `tools/turn-reading.ts`
- `formatLightingCases` — `tools/aura-lifetime.ts`
- `formatLostMessageSuspicion` — `src/ui/panel-words.ts`
- `formatMarkdown` — `tests/repository/name-register.test.ts`
- `formatMaterialFigures` — `tools/fight-figures.ts`
- `formatMaterialStatus` — `tools/decoding-status.ts`
- `formatMeasuredKey` — `tests/tools/turn-count.test.ts`, `tests/tools/turn-reading.test.ts`
- `formatMicroseconds` — `tools/payload-cost.ts`
- `formatNamesReachedByGap` — `src/ui/panel-words.ts`
- `formatNoParameterRowSuspicion` — `src/ui/panel-words.ts`
- `formatNoParameterSuspicion` — `src/ui/panel-words.ts`
- `formatNodePlace` — `tests/source-tree.ts`
- `formatOpenedLines` — `tools/drill-report.ts`
- `formatOpenedUnnamedNotes` — `src/ui/panel-element.ts`
- `formatOpenerKey` — `tests/tools/turn-reading.test.ts`
- `formatOpenerReport` — `tools/turn-reading.ts`
- `formatOutOf` — `src/ui/panel-words.ts`
- `formatOutcomeLines` — `tools/fight-figures.ts`
- `formatPinnedNotes` — `src/ui/panel-element.ts`
- `formatPlace` — `src/ui/panel-words.ts`
- `formatPlaceWords` — `src/ui/panel-words.ts`
- `formatPreviewKeys` — `tools/margonem-readings.ts`
- `formatReadingLine` — `tools/margonem-readings.ts`
- `formatReadingLines` — `tools/fight-figures.ts`
- `formatReadingWalk` — `tools/turn-reading.ts`
- `formatReadingWalkLine` — `tools/turn-reading.ts`
- `formatRecordingName` — `tools/recorded-material.ts`
- `formatRefreshLine` — `tools/margonem-readings.ts`
- `formatRegisterKey` — `tests/tools/drill-report.test.ts`, `tests/tools/turn-count.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `formatRgbColour` — `src/ui/panel-look.ts`
- `formatRowLines` — `tools/fight-figures.ts`
- `formatRowSuspicions` — `src/ui/panel-content.ts`
- `formatRowsReachedByGap` — `src/ui/panel-content.ts`
- `formatRuleName` — `tests/repository/documents.test.ts`
- `formatShapeLine` — `tools/protocol-key-shape.ts`
- `formatShapeReport` — `tools/protocol-key-shape.ts`
- `formatShapeReportNote` — `tools/protocol-key-shape.ts`
- `formatSharePoints` — `src/ui/panel-words.ts`
- `formatShareRounded` — `src/ui/panel-words.ts`
- `formatSharesApportioned` — `src/ui/panel-words.ts`
- `formatShelfSize` — `src/ui/panel-words.ts`
- `formatShelfTime` — `src/ui/panel-words.ts`
- `formatSideCounts` — `src/ui/panel-words.ts`
- `formatSideLines` — `tools/fight-figures.ts`
- `formatSidesLabel` — `src/ui/panel-element.ts`
- `formatSkillText` — `tools/fight-figures.ts`
- `formatSourceLine` — `tools/aura-standing.ts`
- `formatStatusCountLine` — `tools/decoding-status.ts`
- `formatStatusReport` — `tools/decoding-status.ts`
- `formatStatusTallyLines` — `tools/decoding-status.ts`
- `formatStruckShare` — `tools/shout-holding.ts`
- `formatTallestReport` — `tools/card-height.ts`
- `formatTallyKey` — `tests/tools/turn-reading.test.ts`
- `formatTickExpected` — `tests/core/injure-rule.test.ts`
- `formatTooltipFraction` — `src/ui/panel-words.ts`
- `formatTurnOrdinal` — `src/ui/panel-words.ts`
- `formatTurnWalk` — `tools/turn-count.ts`
- `formatTurnWalkLine` — `tools/turn-count.ts`
- `formatTurns` — `src/ui/panel-words.ts`
- `formatTurnsLeft` — `src/ui/panel-words.ts`
- `formatTwoDigits` — `src/ui/panel-words.ts`
- `formatUndrawn` — `src/ui/panel-words.ts`
- `formatUnknownKeyRowSuspicion` — `src/ui/panel-words.ts`
- `formatUnknownKeySuspicion` — `src/ui/panel-words.ts`
- `formatUnnamedLines` — `tools/drill-report.ts`
- `formatUnnamedPairLines` — `tools/drill-report.ts`
- `formatUnplacedHealRowSuspicion` — `src/ui/panel-words.ts`
- `formatUnplacedHealSuspicion` — `src/ui/panel-words.ts`
- `formatUses` — `src/ui/panel-words.ts`
- `formatWholeUngrouped` — `src/ui/panel-words.ts`

### `add` — weak

- `add` — `src/runtime/defect-ledger.ts`, `src/ui/panel-element.ts`, `tests/ui/panel-words.test.ts`
- `addAbsorbedBlow` — `tools/fabricated-fight.ts`
- `addAlliesCast` — `tools/fabricated-fight.ts`
- `addAnnouncedName` — `src/core/charged-skill.ts`
- `addArmourBreakingBlow` — `tools/fabricated-fight.ts`
- `addAuraCast` — `tools/fabricated-fight.ts`
- `addAuxiliaryWound` — `tools/fabricated-fight.ts`
- `addBandage` — `tools/fabricated-fight.ts`
- `addBardSong` — `tools/fabricated-fight.ts`
- `addBlow` — `tools/fabricated-fight.ts`
- `addBlowAtNobody` — `tools/fabricated-fight.ts`
- `addBlowDealt` — `src/core/fight-statistics.ts`
- `addBlowFromNobody` — `tools/fabricated-fight.ts`
- `addBlowProcs` — `src/core/fight-statistics.ts`
- `addBlowTaken` — `src/core/fight-statistics.ts`
- `addBlowWithNoTarget` — `src/core/fight-statistics.ts`
- `addCall` — `tools/fabricated-fight.ts`
- `addCardHeight` — `tools/card-height.ts`
- `addCaseToTally` — `tools/drill-report.ts`
- `addCombatantFigures` — `src/core/fight-statistics.ts`
- `addComparison` — `tests/core/health-witness.test.ts`
- `addCriticalBlow` — `tools/fabricated-fight.ts`
- `addCriticalPierce` — `tools/fabricated-fight.ts`
- `addCursedBlow` — `tools/fabricated-fight.ts`
- `addCutForOtherEnd` — `src/core/fight-statistics.ts`
- `addDamageDealtApplied` — `src/core/fight-statistics.ts`
- `addDamageFiguresToCut` — `src/core/fight-statistics.ts`
- `addDamageFiguresToOtherEndCut` — `src/core/fight-statistics.ts`
- `addDamageTakenApplied` — `src/core/fight-statistics.ts`
- `addEnemiesCast` — `tools/fabricated-fight.ts`
- `addEvadedBlow` — `tools/fabricated-fight.ts`
- `addEventListener` — `src/ui/panel-document.ts`, `tests/fake-document.ts`,
  `tests/tools/preview-state.test.ts`
- `addEventTurns` — `src/core/turn-clock.ts`
- `addFightCardLine` — `src/ui/panel-element.ts`
- `addFiguresDisagreed` — `src/runtime/panel-frame.ts`
- `addFileDefect` — `src/runtime/margometer-runtime.ts`
- `addFoldedCut` — `src/ui/panel-content.ts`
- `addGuardedListener` — `src/ui/panel-listener.ts`
- `addHealAlly` — `tools/fabricated-fight.ts`
- `addHealSelf` — `tools/fabricated-fight.ts`
- `addHealToNobody` — `tools/fabricated-fight.ts`
- `addHealth` — `tools/fabricated-fight.ts`
- `addHealthGiven` — `src/core/fight-statistics.ts`, `tools/fabricated-fight.ts`
- `addHealthLost` — `src/core/fight-statistics.ts`
- `addHealthRestored` — `src/core/fight-statistics.ts`
- `addHealthRestoredBySource` — `src/core/fight-statistics.ts`
- `addHealthTaken` — `tools/fabricated-fight.ts`
- `addHolyTouch` — `tools/fabricated-fight.ts`
- `addKeyMeaning` — `src/core/protocol-key.ts`
- `addLastHeal` — `tools/fabricated-fight.ts`
- `addLegendaryBonuses` — `tools/fabricated-fight.ts`
- `addLevel` — `tests/ui/level-drawn.test.ts`
- `addLightTick` — `tools/fabricated-fight.ts`
- `addLoot` — `tools/fabricated-fight.ts`
- `addLossToNobody` — `tools/fabricated-fight.ts`
- `addMessageIndexes` — `tools/fabricated-fight.ts`
- `addName` — `tests/repository/name-register.test.ts`
- `addNamedDamage` — `tools/fabricated-fight.ts`
- `addNamedDamageTaken` — `src/core/fight-statistics.ts`
- `addOffhandBlow` — `tools/fabricated-fight.ts`
- `addOpenedLevelToTally` — `tools/drill-report.ts`
- `addOpenedRungs` — `tests/ui/level-drawn.test.ts`
- `addParameterRead` — `src/core/fight-decoder.ts`
- `addPartRungToTally` — `tools/drill-report.ts`
- `addPiercingBlow` — `tools/fabricated-fight.ts`
- `addPinnedLevelToTally` — `tools/drill-report.ts`
- `addPinnedRungs` — `tests/ui/level-drawn.test.ts`
- `addPlainBlow` — `tools/fabricated-fight.ts`
- `addPoisonTick` — `tools/fabricated-fight.ts`
- `addPrepare` — `tools/fabricated-fight.ts`
- `addProseCountClaims` — `tools/protocol-key-shape.ts`
- `addRegionDefect` — `src/runtime/panel-frame.ts`
- `addResources` — `tools/fabricated-fight.ts`
- `addRestoredToNobody` — `src/core/fight-statistics.ts`
- `addRootListener` — `src/ui/panel-drag.ts`
- `addShout` — `tools/fabricated-fight.ts`
- `addSideHeal` — `tools/fabricated-fight.ts`
- `addSkillDealt` — `src/core/fight-statistics.ts`
- `addSkillFigures` — `src/core/fight-statistics.ts`
- `addSkillRestored` — `src/core/fight-statistics.ts`
- `addStance` — `tools/fabricated-fight.ts`
- `addStandingStatuses` — `tools/fabricated-fight.ts`
- `addStatedPercent` — `src/core/combatant-health.ts`
- `addStatusRows` — `src/ui/panel-words.ts`
- `addStep` — `tools/fabricated-fight.ts`
- `addStruck` — `tools/shout-holding.ts`
- `addStunningBlow` — `tools/fabricated-fight.ts`
- `addThirdAttack` — `tools/fabricated-fight.ts`
- `addToCut` — `src/core/fight-statistics.ts`
- `addTurn` — `src/core/turn-clock.ts`
- `addTurnCall` — `tools/fabricated-fight.ts`
- `addTurnLost` — `tools/fabricated-fight.ts`
- `addTurnStatement` — `tools/fabricated-fight.ts`
- `addUndrawnDefects` — `src/runtime/panel-frame.ts`
- `addUnplacedCast` — `src/core/fight-statistics.ts`
- `addValuedKey` — `src/core/fight-decoder.ts`
- `addViewFailureGuarded` — `src/ui/view-failure.ts`
- `addWeakenedWound` — `tools/fabricated-fight.ts`
- `addWoundTick` — `tools/fabricated-fight.ts`
- `addWoundingBlow` — `tools/fabricated-fight.ts`

### `remove` — weak

- `remove` — `src/ports/browser-file.ts`, `tests/fake-window.ts`, `tests/ports/browser-file.test.ts`
- `removeHealth` — `tools/fabricated-fight.ts`
- `removeItem` — in 8 files: `src/ports/`, `tests/`
- `removeSkillDescriptions` — `tools/capture-intake.ts`

### `create` — strong

- `create` — `tests/source-tree.ts`
- `createAnchor` — `src/ports/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/ports/browser-file.test.ts`
- `createBlob` — `src/ports/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/ports/browser-file.test.ts`
- `createCaptureCopy` — `src/ports/fight-capture.ts`
- `createCardRegister` — `src/ui/panel-element.ts`
- `createCombatantFigures` — `src/core/fight-statistics.ts`
- `createElement` — in 4 files: `src/`, `src/ui/`, `tests/`
- `createEnvelopeFailure` — `src/ports/payload-envelope.ts`
- `createFabricatedCombatant` — `tools/fabricated-fight.ts`
- `createFabricatedCombatants` — `tools/fabricated-fight.ts`
- `createFabricatedFight` — `tools/fabricated-fight.ts`
- `createFightCapture` — `src/ports/fight-capture.ts`
- `createFightSession` — `src/core/fight-session.ts`
- `createObjectURL` — `src/ports/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/ports/browser-file.test.ts`
- `createOpenPartIntent` — `src/ui/panel-intent.ts`
- `createScreenState` — `src/ui/panel-screen.ts`
- `createScrollMemo` — `src/ui/panel-element.ts`

### `delete` — none

- `delete` — `src/ports/browser-store.ts`
- `deleteShelf` — `src/runtime/shelf.ts`
- `deleteWindowSize` — `src/runtime/settings.ts`

### `reset` — weak

- `reset` — `src/ui/panel-element.ts`
- `resetScreenFightDropped` — `src/runtime/margometer-runtime.ts`
- `resetScreenOpened` — `src/runtime/margometer-runtime.ts`

### `require` — strong

- `requireBlockBody` — `tools/protocol-key-table.ts`
- `requireBundleInBrowser` — `tools/build-userscript.ts`
- `requireCachedHelpArticle` — `tools/help-article.ts`
- `requireCachedMargonemClientSource` — `tools/margonem-client-source.ts`
- `requireCachedSkillTable` — `tools/skill-table.ts`
- `requireCallsCarried` — `tools/capture-intake.ts`
- `requireComputedKeyFamily` — `tools/protocol-key-table.ts`
- `requireEndOfRun` — `tools/protocol-key-table.ts`
- `requireEndOfWhitespace` — `tools/status-bit-table.ts`
- `requireEveryCombatantDecided` — `tools/capture-intake.ts`
- `requireFabricationShape` — `tools/fabricated-fight.ts`
- `requireHelpArticleText` — `tools/help-article.ts`
- `requireMargonemChannel` — `tools/margonem-client-source.ts`
- `requireMargonemWorldPageBuild` — `tools/margonem-client-source.ts`
- `requireMargonemWorldPageBundleAddress` — `tools/margonem-client-source.ts`
- `requireNoNameInsideAnother` — `tools/capture-intake.ts`
- `requirePageInsideBound` — `tools/skill-table.ts`
- `requireProtocolKeys` — `tools/protocol-key-table.ts`
- `requireQuotedLiteral` — `tools/protocol-key-table.ts`, `tools/status-bit-table.ts`
- `requireRecordingFought` — `tools/capture-intake.ts`
- `requireRecordingIsNew` — `tools/capture-intake.ts`
- `requireScreens` — `tools/drill-report.ts`
- `requireSkillsOfMargonemApi` — `tools/skill-table.ts`
- `requireSnapshotsCarried` — `tools/capture-intake.ts`
- `requireStatusBits` — `tools/status-bit-table.ts`

### `expect` — strong

- `expectAbsent` — `tests/ports/margonem-client-dictionary.test.ts`,
  `tests/ports/margonem-engine-hero.test.ts`, `tests/ports/margonem-engine-place.test.ts`
- `expectHonest` — `tests/e2e/panel-fixture.ts`
- `expectMalformed` — `tests/ports/payload-envelope.test.ts`
- `expectRefused` — `tests/ports/browser-store.test.ts`, `tests/tools/recorded-material.test.ts`
- `expectSettingUnreadable` — `tests/runtime/settings.test.ts`
- `expectShareTellsNothingFromSomething` — `tests/ui/share-column.test.ts`
- `expectSideUnreadable` — `tests/core/message-grammar.test.ts`
- `expectStoreRefused` — `tests/runtime/settings.test.ts`
- `expectTooLong` — `tests/libs/unknown-value.test.ts`, `tests/ports/browser-store.test.ts`,
  `tests/ports/payload-envelope.test.ts`
- `expectWrongType` — `tests/libs/unknown-value.test.ts`

### `attempt` — none

- `attempt` — `libs/errors.ts`

### `compose` — strong

- `compose` — `tests/ui/card-window.test.ts`
- `composeAnnouncedHeal` — `tests/ui/panel-content.test.ts`
- `composeAnnouncementStanding` — `src/core/fight-decoder.ts`
- `composeAnsweringStorage` — `tests/ports/browser-store.test.ts`
- `composeAuraSkills` — `tools/skill-table.ts`
- `composeBarColour` — `src/ui/panel-look.ts`
- `composeBarIconClass` — `src/ui/panel-look.ts`
- `composeBarIconRules` — `src/ui/panel-look.ts`
- `composeBattlePage` — `tests/runtime/margometer-runtime.test.ts`
- `composeBitShifts` — `tools/margonem-readings.ts`
- `composeBlow` — `tests/core/aura-standing.test.ts`, `tests/core/carried-status.test.ts`,
  `tests/core/turn-clock.test.ts`
- `composeBlowBy` — `tests/core/carried-figure.test.ts`
- `composeBlowLargest` — `src/core/fight-statistics.ts`
- `composeBlowsOfKinds` — `tests/core/fight-statistics.test.ts`
- `composeBodyWithout` — `tests/ui/panel-look.test.ts`
- `composeCachedMargonemClient` — `tests/tools/margonem-readings.test.ts`
- `composeCaptureShapeKey` — `src/ports/fight-capture.ts`
- `composeCaptureStateKey` — `src/ports/fight-capture.ts`
- `composeCardAcross` — `src/ui/panel-drag.ts`
- `composeCardAcrossStyle` — `src/ui/panel-element.ts`
- `composeCardClass` — `src/ui/panel-element.ts`
- `composeCardLayout` — `src/ui/panel-element.ts`
- `composeCardLineClass` — `src/ui/panel-element.ts`
- `composeCardLookup` — `src/ui/panel-element.ts`
- `composeCardRules` — `src/ui/panel-look.ts`
- `composeCardTop` — `src/ui/panel-look.ts`
- `composeCardTrimmed` — `src/ui/panel-element.ts`
- `composeCarriedStatuses` — `src/core/carried-status.ts`
- `composeCast` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`
- `composeCastPastItsBound` — `tests/runtime/margometer-runtime.test.ts`
- `composeCaveatMarkRule` — `src/ui/panel-look.ts`
- `composeCharge` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `composeChargingStanding` — `src/core/charged-skill.ts`
- `composeClashing` — `tests/ui/card-window.test.ts`
- `composeClock` — `tests/runtime/margonem-engine-search.test.ts`
- `composeClosingRow` — `src/ui/panel-content.ts`
- `composeCodeOutsideStrings` — `tools/build-userscript.ts`
- `composeCollapsedWhitespace` — `libs/html-text.ts`
- `composeColourOver` — `src/ui/panel-look.ts`
- `composeColourOverChannel` — `src/ui/panel-look.ts`
- `composeCombatant` — `tests/core/aura-standing.test.ts`, `tests/core/fight-session.test.ts`
- `composeCrawlCheck` — `tests/e2e/panel-crawler.ts`
- `composeCrawlFirst` — `tests/e2e/panel-crawler.ts`
- `composeCrawlHelpers` — `tests/e2e/panel-crawler.ts`
- `composeCrawlScreens` — `tests/e2e/panel-crawler.ts`
- `composeCrawlScript` — `tests/e2e/panel-crawler.ts`
- `composeCrawlSecond` — `tests/e2e/panel-crawler.ts`
- `composeCutCharge` — `tests/ui/helper-window.test.ts`
- `composeCutParts` — `src/ui/panel-content.ts`
- `composeCutPlace` — `src/ui/panel-element.ts`
- `composeCutShares` — `tests/ui/share-column.test.ts`
- `composeCutWithoutZeros` — `src/ui/panel-content.ts`
- `composeDate` — `tests/ports/browser-clock.test.ts`
- `composeDatedCasts` — `src/core/aura-standing.ts`
- `composeDecidedFreeze` — `tests/tools/margonem-readings.test.ts`
- `composeDeclaration` — `tests/core/turn-clock.test.ts`
- `composeDeclaringBlow` — `tests/core/legendary-standing.test.ts`
- `composeDefaultPosition` — `src/ui/panel-drag.ts`
- `composeDisputeRegister` — `tools/turn-reading.ts`
- `composeDisputedReadings` — `tools/turn-reading.ts`
- `composeDownloads` — `tests/ports/browser-file.test.ts`
- `composeDraggedPosition` — `src/ui/panel-drag.ts`
- `composeDraggedSize` — `src/ui/panel-drag.ts`
- `composeDriver` — `tests/e2e/margonem-page.ts`
- `composeDumpState` — `tools/margonem-readings.ts`
- `composeElementCut` — `src/ui/panel-content.ts`
- `composeElementOfClass` — `tests/ui/panel-scroll.test.ts`
- `composeEmptySubject` — `tests/runtime/fight-file.test.ts`
- `composeEntryLines` — `tests/repository/name-register.test.ts`
- `composeEscapedJson` — `tools/preview-page.ts`
- `composeEventsAndShout` — `tests/core/aura-standing.test.ts`
- `composeFakeDocument` — `tests/fake-document.ts`
- `composeFakeWindow` — `tests/fake-window.ts`
- `composeFakeWindowAnchor` — `tests/fake-window.ts`
- `composeFakeWindowClocks` — `tests/fake-window.ts`
- `composeFakeWindowDocument` — `tests/fake-window.ts`
- `composeFakeWindowStorage` — `tests/fake-window.ts`
- `composeFight` — `tests/runtime/shelf-keeper.test.ts`, `tests/runtime/shelf.test.ts`,
  `tests/tools/capture-intake.test.ts`
- `composeFightLinks` — `tools/preview-server.ts`
- `composeFightMessages` — `tools/turn-reading.ts`
- `composeFightSuspicions` — `src/ui/panel-content.ts`
- `composeFightView` — `src/core/fight-session.ts`
- `composeFigure` — `tools/fabricated-fight.ts`
- `composeFileSubject` — `src/runtime/fight-handover.ts`
- `composeFloorVersions` — `tests/repository/browser-support.test.ts`
- `composeFoldsJoined` — `src/ui/panel-content.ts`
- `composeFontBody` — `src/ui/panel-look.ts`
- `composeFontTitle` — `src/ui/panel-look.ts`
- `composeFoughtSubject` — `tests/runtime/fight-file.test.ts`
- `composeFrameRules` — `src/ui/panel-look.ts`
- `composeFrameWorld` — `tests/runtime/panel-frame.test.ts`
- `composeFrames` — `tests/ports/browser-frame.test.ts`
- `composeFromLeft` — `tests/ui/panel-drag.test.ts`
- `composeFromRight` — `tests/ui/panel-drag.test.ts`
- `composeFrostCast` — `tests/core/carried-figure.test.ts`
- `composeFrozenFiles` — `tools/frozen-files.ts`
- `composeFrozenFilesMoved` — `tools/frozen-files.ts`
- `composeFrozenState` — `tools/margonem-readings.ts`
- `composeFullCast` — `tests/core/fight-session.test.ts`
- `composeFullCastScreen` — `tests/ui/full-cast-bound.test.ts`
- `composeFullShelf` — `tests/ui/shelf-bound.test.ts`
- `composeFunctionLines` — `tests/repository/name-register.test.ts`
- `composeGenitiveNoun` — `src/ui/panel-words.ts`
- `composeGivingWayShot` — `tools/panel-giving-way.ts`
- `composeGivingWaySource` — `tools/panel-giving-way.ts`
- `composeGrantedBlows` — `tools/skill-table.ts`
- `composeGroupsWithout` — `src/ui/panel-element.ts`
- `composeHalfNamedForKind` — `src/ui/panel-content.ts`
- `composeHalfNamedForPerson` — `src/ui/panel-content.ts`
- `composeHalfNamedKinds` — `src/ui/panel-content.ts`
- `composeHalfNamedListing` — `src/ui/panel-content.ts`
- `composeHalfNamedParts` — `src/ui/panel-content.ts`
- `composeHalfNamedRows` — `src/ui/panel-content.ts`
- `composeHandleUnderTest` — `tests/ui/card-window.test.ts`
- `composeHashOfShown` — `tests/tools/preview-state.test.ts`
- `composeHeadcount` — `src/ui/panel-content.ts`
- `composeHeal` — `tests/core/legendary-standing.test.ts`
- `composeHealthCeiling` — `tools/fabricated-fight.ts`
- `composeHealthFromPercent` — `src/core/combatant-health.ts`
- `composeHealthTolerance` — `src/core/combatant-health.ts`
- `composeHeight` — `tests/tools/card-height.test.ts`
- `composeHeld` — `tests/ports/margonem-engine-battle.test.ts`
- `composeHelperOpeningPosition` — `src/ui/panel-drag.ts`
- `composeHelperPositionAfterTypeStep` — `src/ui/panel-drag.ts`
- `composeHelperRules` — `src/ui/panel-look.ts`
- `composeHostStyle` — `src/ui/panel-drag.ts`
- `composeInsetUnderRows` — `src/ui/panel-look.ts`
- `composeIntake` — `tools/capture-intake.ts`
- `composeIntakeName` — `tools/capture-intake.ts`
- `composeKeptShelfRow` — `tests/ui/panel-element.test.ts`
- `composeKeyDifference` — `tools/margonem-readings.ts`
- `composeKeyTally` — `tools/turn-reading.ts`
- `composeKeyedPayload` — `tests/ports/fight-capture.test.ts`
- `composeKeysAddingTurn` — `tools/turn-reading.ts`
- `composeKindAbsorbed` — `src/core/fight-statistics.ts`
- `composeKindsAbsorbed` — `src/core/fight-statistics.ts`
- `composeLandingPage` — `tests/tools/preview-site.test.ts`
- `composeLastheal` — `tests/core/legendary-standing.test.ts`
- `composeLayeredLines` — `tests/repository/name-register.test.ts`
- `composeLedger` — `tests/runtime/defect-ledger.test.ts`
- `composeLegendaryStandings` — `src/core/legendary-standing.ts`
- `composeLevelScreen` — `tests/ui/level-drawn.test.ts`
- `composeLightingRow` — `tools/aura-lifetime.ts`
- `composeLightingRows` — `tools/aura-lifetime.ts`
- `composeLineChanges` — `tools/develop-reports.ts`
- `composeListName` — `src/ui/panel-screen.ts`
- `composeListRules` — `src/ui/panel-look.ts`
- `composeListener` — `tests/ports/margonem-engine-battle.test.ts`
- `composeManifestPath` — `tools/help-article.ts`, `tools/margonem-client-source.ts`
- `composeMappedValue` — `tools/capture-intake.ts`
- `composeMargonem` — `tests/e2e/margonem-page.ts`, `tests/runtime/live-fight.test.ts`
- `composeMargonemClientState` — `tools/margonem-readings.ts`
- `composeMargonemEngine` — `tests/ports/margonem-engine-hero.test.ts`,
  `tests/ports/margonem-engine-place.test.ts`
- `composeMargonemLate` — `tests/e2e/margonem-page.ts`
- `composeMask` — `tests/core/carried-status.test.ts`
- `composeMessageReadings` — `tools/turn-reading.ts`
- `composeMessageReadingsOfStep` — `tools/turn-reading.ts`
- `composeNameForPart` — `src/ui/panel-screen.ts`
- `composeNameRegister` — `tests/repository/name-register.test.ts`
- `composeNamed` — `tests/ui/card-window.test.ts`
- `composeNotesForOpenedRow` — `tests/ui/panel-element.test.ts`
- `composeOne` — `tests/ports/margonem-engine-tooltip.test.ts`
- `composeOneCombatantRoster` — `tests/core/fight-statistics.test.ts`
- `composeOpened` — `tests/runtime/shelf.test.ts`
- `composeOpenedParts` — `tests/ui/level-drawn.test.ts`
- `composeOpenedPaths` — `tools/preview-server.ts`
- `composeOpenerTally` — `tools/turn-reading.ts`
- `composeOpeningPosition` — `src/ui/panel-drag.ts`
- `composeOpeningReplay` — `tools/preview-site.ts`
- `composeOpeningWatched` — `tools/preview-site.ts`
- `composeOpponentCut` — `src/ui/panel-content.ts`
- `composeOptions` — `tests/runtime/live-fight.test.ts`, `tests/tools/preview-page.test.ts`
- `composeOptionsRules` — `src/ui/panel-look.ts`
- `composeOptionsStepClass` — `src/ui/panel-look.ts`
- `composeOwnScope` — `tools/preview-page.ts`
- `composePage` — `tests/ports/margonem-engine-tooltip.test.ts`
- `composePairPartFigures` — `src/ui/panel-content.ts`
- `composePairParts` — `src/ui/panel-content.ts`
- `composePanelDragGrab` — `src/ui/panel-drag.ts`
- `composePanelHandle` — `tests/e2e/panel-fixture.ts`
- `composePanelPage` — `tests/e2e/margonem-page.ts`
- `composePanelShots` — `tools/panel-shots.ts`
- `composePanelSides` — `src/ui/panel-content.ts`
- `composePeopleForKey` — `src/ui/panel-content.ts`
- `composePeopleForPart` — `src/ui/panel-content.ts`
- `composePeopleForSkill` — `src/ui/panel-content.ts`
- `composePersonCard` — `src/ui/panel-element.ts`
- `composePinnedFigures` — `src/ui/panel-content.ts`
- `composePinnedRows` — `src/ui/panel-content.ts`
- `composePlacedPage` — `tests/runtime/margometer-runtime.test.ts`
- `composePositionStyle` — `src/ui/panel-drag.ts`
- `composePreviewBody` — `tools/preview-page.ts`
- `composePreviewDriver` — `tools/preview-page.ts`
- `composePreviewInstall` — `tools/preview-page.ts`
- `composePreviewInstallNeeds` — `tools/preview-page.ts`
- `composePreviewPage` — `tools/preview-page.ts`
- `composePreviewPicks` — `tools/preview-page.ts`
- `composePreviewPicksBindings` — `tools/preview-page.ts`
- `composePreviewPicksHandlers` — `tools/preview-page.ts`
- `composePreviewPicksShown` — `tools/preview-page.ts`
- `composePreviewSiteFiles` — `tools/preview-site.ts`
- `composePreviewStateBare` — `tools/preview-state.ts`
- `composePreviewStateHash` — `tools/preview-state.ts`
- `composePreviewStatePanel` — `tools/preview-state.ts`
- `composePreviewStateParser` — `tools/preview-state.ts`
- `composePreviewStateReading` — `tools/preview-state.ts`
- `composePreviewStateWatch` — `tools/preview-state.ts`
- `composePreviewStateWriting` — `tools/preview-state.ts`
- `composePreviewStore` — `tools/preview-page.ts`
- `composePreviewStrip` — `tools/preview-page.ts`
- `composePreviewStyle` — `tools/preview-page.ts`
- `composePreviewTipsCardStyle` — `tools/preview-page.ts`
- `composePreviewTipsDriver` — `tools/preview-page.ts`
- `composePreviewTooltips` — `tools/preview-page.ts`
- `composePreviewTooltipsPlacedStyle` — `tools/preview-page.ts`
- `composePreviewTooltipsStyle` — `tools/preview-page.ts`
- `composeProbe` — `tests/e2e/margonem-page.ts`
- `composeProvocation` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `composeProvocationStandings` — `src/core/aura-standing.ts`
- `composePseudonymisedRecording` — `tools/capture-intake.ts`
- `composeRankedTally` — `tools/decoding-status.ts`
- `composeRebuildingBattle` — `tests/rebuilding-battle.ts`
- `composeRecordingBattle` — `tests/runtime/margometer-runtime.test.ts`
- `composeRecordingInEnglish` — `tools/capture-intake.ts`
- `composeReduction` — `tools/fabricated-fight.ts`
- `composeRefusingStorage` — `tests/ports/browser-store.test.ts`
- `composeRefusingStore` — `tests/runtime/settings.test.ts`
- `composeRegionRules` — `src/ui/panel-look.ts`
- `composeRegistry` — `tests/ports/margonem-engine-tooltip.test.ts`
- `composeReleaseNotes` — `tools/changelog.ts`
- `composeRenamedRecord` — `tools/capture-intake.ts`
- `composeReport` — `tests/runtime/margonem-engine-search.test.ts`
- `composeRestRow` — `src/ui/panel-content.ts`
- `composeRoster` — `tests/core/aura-standing.test.ts`
- `composeRosterRecording` — `tests/tools/capture-intake.test.ts`
- `composeRow` — `tests/tools/skill-table.test.ts`
- `composeRowDetail` — `src/ui/panel-content.ts`
- `composeRowDetailFor` — `src/ui/panel-content.ts`
- `composeRowRules` — `src/ui/panel-look.ts`
- `composeRowsBeforeShares` — `src/ui/panel-content.ts`
- `composeRuntimePorts` — `tests/runtime-world.ts`
- `composeRuntimeTables` — `src/userscript-entry.ts`
- `composeRuntimeWorld` — `tests/runtime-world.ts`
- `composeSample` — `tests/source-tree.ts`
- `composeScaled` — `tools/fabricated-fight.ts`
- `composeScrolledPanel` — `tests/ui/panel-element.test.ts`
- `composeSection` — `tests/ui/share-column.test.ts`
- `composeSectionsForScreen` — `tests/ui/share-column.test.ts`
- `composeSectionsForScreenRow` — `tests/ui/share-column.test.ts`
- `composeServedFight` — `tools/preview-server.ts`
- `composeServedFights` — `tools/preview-server.ts`
- `composeShareGroups` — `src/ui/panel-words.ts`
- `composeSharesInPoints` — `src/ui/panel-words.ts`
- `composeSheetColour` — `tests/ui/panel-look.test.ts`
- `composeSheetConstructs` — `tests/repository/browser-support.test.ts`
- `composeShelfRow` — `tests/ui/shelf-bound.test.ts`
- `composeShotClip` — `tools/panel-shots.ts`
- `composeShotPage` — `tools/panel-shots.ts`
- `composeShoutSkills` — `tools/skill-table.ts`
- `composeShoutedFight` — `tests/tools/shout-holding.test.ts`
- `composeShownScreen` — `tests/shown-screen.ts`
- `composeSideHeal` — `src/core/combatant-health.ts`
- `composeSideRoster` — `tests/core/combatant-health.test.ts`
- `composeSightings` — `tests/repository/name-register.test.ts`
- `composeSimulationDictionary` — `tests/simulation.ts`
- `composeSiteInstall` — `tools/preview-site.ts`
- `composeSitePage` — `tools/preview-site.ts`
- `composeSiteWindows` — `tools/preview-site.ts`
- `composeSizeBounds` — `src/ui/panel-drag.ts`
- `composeSizeGripRules` — `src/ui/panel-look.ts`
- `composeSizedPanelStyle` — `src/ui/panel-look.ts`
- `composeSkillCut` — `src/ui/panel-content.ts`
- `composeSkillRows` — `src/ui/panel-content.ts`
- `composeSkillRowsReceived` — `src/ui/panel-content.ts`
- `composeSkillRowsStated` — `src/ui/panel-content.ts`
- `composeSmall` — `tools/fabricated-fight.ts`
- `composeSmallHealth` — `tools/fabricated-fight.ts`
- `composeSmallShelf` — `tests/runtime/margometer-runtime.test.ts`
- `composeSourceRows` — `src/ui/panel-content.ts`
- `composeSplitStyle` — `tools/preview-page.ts`
- `composeStated` — `tests/core/aura-standing.test.ts`
- `composeStatisticsWithSkills` — `tests/ui/panel-content.test.ts`
- `composeStemPhrases` — `tests/repository/protocol-keys.test.ts`
- `composeStoreHolding` — `tests/runtime/shelf.test.ts`
- `composeStoreWithCeiling` — `tests/runtime/shelf.test.ts`
- `composeStringLines` — `tests/repository/name-register.test.ts`
- `composeStripAtTop` — `tools/preview-site.ts`
- `composeStripStyle` — `tools/preview-page.ts`
- `composeStructureEntry` — `tests/repository/documents.test.ts`
- `composeStyleSheet` — `src/ui/panel-look.ts`
- `composeSubstitutionOrder` — `tools/capture-intake.ts`
- `composeSuspicions` — `src/ui/panel-content.ts`
- `composeSuspicionsOfReading` — `src/runtime/panel-frame.ts`
- `composeSwap` — `tests/ui/card-window.test.ts`
- `composeTarget` — `tests/ui/panel-intent.test.ts`
- `composeTestCast` — `tests/core/combatant-roster.test.ts`
- `composeTestCombatant` — `tests/core/combatant-roster.test.ts`
- `composeThrowingPage` — `tests/runtime/margonem-engine-search.test.ts`
- `composeTimers` — `tests/ports/browser-interval.test.ts`
- `composeTipHolder` — `tests/rebuilding-battle.ts`
- `composeTipsPlaced` — `tools/preview-site.ts`
- `composeTreeLines` — `tests/repository/name-register.test.ts`
- `composeTurn` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `composeTurnBoundaries` — `tools/turn-count.ts`
- `composeTurnBoundary` — `tools/turn-count.ts`
- `composeTurnDelta` — `tools/turn-count.ts`
- `composeTurnGrade` — `tools/turn-count.ts`
- `composeTurnGrades` — `tools/turn-count.ts`
- `composeTurnStanding` — `src/core/turn-clock.ts`
- `composeTurnStretch` — `tools/turn-count.ts`
- `composeTurns` — `tests/core/aura-standing.test.ts`
- `composeTurnsAtCast` — `src/core/aura-standing.ts`
- `composeTwoSided` — `tests/core/fight-statistics.test.ts`
- `composeUnaskedMargonemClientState` — `tools/margonem-readings.ts`
- `composeUnbalanced` — `tests/core/fight-statistics.test.ts`
- `composeUnderListRules` — `src/ui/panel-look.ts`
- `composeUnfoughtFight` — `tests/tools/turn-reading.test.ts`
- `composeUnlistedPayload` — `tests/runtime/live-fight.test.ts`
- `composeValues` — `tests/tools/capture-intake.test.ts`
- `composeVariable` — `src/ui/panel-look.ts`
- `composeVariables` — `src/ui/panel-look.ts`
- `composeView` — `tests/core/aura-standing.test.ts`
- `composeVocabularyLines` — `tests/repository/name-register.test.ts`
- `composeWarrior` — `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/ports/margonem-engine-warriors.test.ts`, `tests/tools/shout-holding.test.ts`
- `composeWidestFight` — `tests/ui/full-cast-bound.test.ts`
- `composeWidthsBySelector` — `tests/tools/preview-site.test.ts`
- `composeWindowDragging` — `tools/preview-site.ts`
- `composeWindowRight` — `src/ui/panel-drag.ts`
- `composeWindowsCornered` — `tools/preview-site.ts`
- `composeWindowsSeeded` — `tools/panel-shots.ts`

### `is` — strong

- `isAlphanumericAt` — `tests/repository/names.test.ts`
- `isAnnouncement` — `tests/core/granted-blow-rule.test.ts`,
  `tests/core/skill-announcement-rule.test.ts`
- `isAsciiUpperCase` — `libs/html-text.ts`
- `isBindingOver` — `tests/repository/browser-globals.test.ts`
- `isBlowCritical` — `src/core/fight-statistics.ts`
- `isBuildCharacterAt` — `src/ports/margonem-client-build.ts`
- `isCallableOn` — `src/userscript-entry.ts`
- `isCamelCase` — `tests/repository/names.test.ts`
- `isCanonicalPlace` — `tests/repository/documents.test.ts`
- `isCardLayoutWithin` — `src/ui/panel-element.ts`
- `isCardWidthWithin` — `src/ui/panel-element.ts`
- `isCarryingKey` — `tests/core/npc-heal-rule.test.ts`
- `isCasterHalved` — `src/core/carried-figure.ts`
- `isCaughtRangeError` — `tests/ui/view-failure.test.ts`
- `isCharacterWithin` — `tools/protocol-key-table.ts`
- `isClearOf` — `tests/e2e/panel-helper.spec.ts`
- `isCollectionMade` — `tests/repository/purity.test.ts`
- `isCommentLine` — `tests/ui/panel-words.test.ts`
- `isConstAssertion` — `tests/repository/type-assertions.test.ts`
- `isCountText` — `tests/repository/captured-fight-register.test.ts`
- `isCountWord` — `tools/protocol-key-shape.ts`
- `isCountingSentence` — `tools/protocol-key-shape.ts`
- `isCutFromText` — `tests/ports/margonem-engine-tooltip.test.ts`
- `isDefence` — `src/core/protocol-key.ts`
- `isDigitAt` — `libs/text-walk.ts`
- `isDigitRun` — `libs/text-walk.ts`
- `isDocumentedByFamily` — `tools/protocol-key-shape.ts`
- `isDone` — `src/runtime/margometer-runtime.ts`
- `isDumpStale` — `tools/help-article.ts`
- `isEdgedBy` — `tests/repository/name-register.test.ts`
- `isEndAtTheClose` — `tests/repository/changelog.test.ts`
- `isEntryAnswerableByClient` — `tests/repository/protocol-keys.test.ts`
- `isEveryCharacter` — `tests/repository/names.test.ts`
- `isExpressionArrow` — `tests/source-tree.ts`
- `isFabricatedEnvelope` — `tools/fabricated-fight.ts`
- `isFabricatedPath` — `tools/fabricated-fight.ts`
- `isFightOver` — `tools/fabricated-fight.ts`
- `isGuardedBody` — `tests/repository/handed-callbacks.test.ts`
- `isHealingAnnouncerOnly` — `src/core/fight-decoder.ts`
- `isHelperFiguresDisagreed` — `src/runtime/panel-frame.ts`
- `isHexadecimalDigitAt` — `libs/html-text.ts`
- `isImportSpeltForItsPlace` — `tests/repository/import-paths.test.ts`
- `isInvariantBroken` — `tests/simulation.ts`
- `isKebabCase` — `tests/repository/names.test.ts`
- `isKeyAt` — `tests/ui/panel-words.test.ts`
- `isLetter` — `tests/repository/browser-support.test.ts`
- `isLevelOpen` — `src/ui/panel-element.ts`
- `isLightingAgreeing` — `tools/aura-lifetime.ts`
- `isLineWhole` — `tests/ui/panel-element.test.ts`
- `isLowerAt` — `tests/repository/names.test.ts`
- `isLowerOrDigitAt` — `tests/repository/names.test.ts`
- `isMargonemEngineWarriorNamed` — `src/ports/margonem-engine-warriors.ts`
- `isMarked` — `tests/ports/margonem-engine-battle.test.ts`
- `isNameCharacter` — `tests/repository/declaration-order.test.ts`
- `isNameCharacterAt` — `tools/protocol-key-table.ts`
- `isNameEdgeAt` — `tools/capture-intake.ts`
- `isNameLike` — `tests/repository/name-register.test.ts`
- `isNoteGroup` — `src/ui/panel-element.ts`
- `isOnPath` — `tests/repository/event-entries.test.ts`
- `isOneOf` — `libs/vocabulary.ts`
- `isOneWord` — `tests/repository/name-shapes.test.ts`
- `isOurWrap` — `src/ports/margonem-engine-battle.ts`
- `isOutsidePictures` — `tools/panel-giving-way.ts`
- `isOwnNode` — `tests/repository/handed-callbacks.test.ts`
- `isPascalCase` — `tests/repository/names.test.ts`
- `isPastBoundInCaller` — `tests/repository/called-once.test.ts`
- `isPastItsTurn` — `src/core/charged-skill.ts`
- `isPayloadNarrated` — `tools/turn-count.ts`
- `isPayloadOpening` — `src/ports/payload-envelope.ts`
- `isPinnedPersonKept` — `src/ui/panel-content.ts`
- `isPoolRaiseAmong` — `tests/core/health-witness.test.ts`
- `isPoolRaiseDeclared` — `tests/core/health-witness.test.ts`
- `isPortInRange` — `tools/preview-server.ts`
- `isReachingItself` — `tests/repository/control-flow.test.ts`
- `isReadOffItsModule` — `tests/repository/name-shapes.test.ts`
- `isReadableText` — `tests/ui/panel-words.test.ts`
- `isReaderLayer` — `tests/repository/reader-layer.test.ts`
- `isReaderSideNamed` — `src/ui/panel-content.ts`
- `isRecord` — `libs/unknown-value.ts`
- `isRecordNode` — `tests/repository/throws.test.ts`
- `isReference` — `tests/repository/browser-globals.test.ts`
- `isRegionList` — `src/ui/panel-element.ts`
- `isRegionShort` — `tests/ui/level-drawn.test.ts`
- `isRootedPath` — `tests/repository/cited-paths.test.ts`
- `isRowSuspect` — `src/ui/panel-content.ts`
- `isSame` — `tests/core/last-heal-rule.test.ts`
- `isSameAsciiTextAt` — `libs/html-text.ts`
- `isSameBesideVersion` — `tools/panel-shots.ts`
- `isSameRange` — `tests/repository/browser-globals.test.ts`,
  `tests/repository/name-register.test.ts`, `tests/source-tree.ts`
- `isSectionDrawn` — `tests/ui/panel-element.test.ts`
- `isShapeFigureWithin` — `tools/fabricated-fight.ts`
- `isShelfSuperseded` — `src/runtime/shelf.ts`
- `isShoutAnnouncement` — `tools/shout-holding.ts`
- `isShoutedName` — `tests/repository/protocol-keys.test.ts`
- `isSideListed` — `src/ui/panel-content.ts`
- `isSideWideKey` — `src/core/protocol-key.ts`
- `isSlugText` — `tools/capture-intake.ts`
- `isStanding` — `tools/fabricated-fight.ts`
- `isStartedAsync` — `tests/repository/called-once.test.ts`
- `isStruckAgain` — `tests/core/last-heal-rule.test.ts`
- `isStunKey` — `tests/tools/turn-count.test.ts`
- `isTagNameEndAt` — `libs/html-text.ts`
- `isTagOpeningAt` — `libs/html-text.ts`
- `isTightCharacter` — `tests/repository/browser-support.test.ts`
- `isTooltipTargets` — `src/ports/margonem-engine-tooltip.ts`
- `isTopLevel` — `tests/repository/name-register.test.ts`, `tests/repository/purity.test.ts`
- `isTreeComplete` — `tools/develop-reports.ts`
- `isUpperAt` — `tests/repository/names.test.ts`
- `isUserscriptDocument` — `src/userscript-entry.ts`
- `isUserscriptWindow` — `src/userscript-entry.ts`
- `isVersionText` — `tools/capture-intake.ts`
- `isWhitespaceAt` — `libs/text-walk.ts`
- `isWhole` — `tests/ui/panel-look.test.ts`
- `isWordCharacter` — `tests/repository/browser-support.test.ts`, `tools/build-userscript.ts`
- `isWordStartAt` — `tests/repository/names.test.ts`
- `isWritableCollection` — `tests/repository/purity.test.ts`
- `isWrittenInPolish` — `tests/tools/preview-site.test.ts`
- `isZeroAt` — `libs/html-text.ts`

### `was` — strong

- `wasAnyTurnLost` — `src/ui/panel-content.ts`

### `has` — strong

- `hasAmbientName` — `tools/build-userscript.ts`
- `hasAttackFigure` — `src/core/fight-decoder.ts`
- `hasDamageFigure` — `tests/core/granted-blow-rule.test.ts`
- `hasDeclaredEffect` — `src/core/turn-clock.ts`
- `hasHole` — `src/ports/margonem-client-dictionary.ts`
- `hasPinnedTotalDisagreed` — `src/ui/panel-content.ts`
- `hasWord` — `tests/repository/comment-share.test.ts`

### `does` — strong

- `doesKeyReachBearer` — `src/core/carried-figure.ts`
- `doesNameOneCombatant` — `src/core/fight-decoder.ts`
- `doesRowCarryMarkup` — `src/ui/panel-words.ts`
- `doesTextClose` — `tests/ui/panel-words.test.ts`

### No verb

- `Engine` — `tests/ports/margonem-engine-battle.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `Program` — `tests/source-tree.ts`

### `_t` — not in N2's table

- `_t` — `tests/ports/margonem-client-dictionary.test.ts`, `tests/runtime/carried-tooltip.test.ts`,
  `tools/payload-cost.ts`

### `allow` — not in N2's table

- `allow` — `tests/e2e/panel-fixture.ts`

### `announce` — not in N2's table

- `announce` — `tests/core/charged-skill.test.ts`

### `answer` — not in N2's table

- `answerPreviewEvents` — `tools/preview-server.ts`
- `answerPreviewRequest` — `tools/preview-server.ts`

### `append` — not in N2's table

- `append` — in 4 files: `src/`, `src/ui/`, `tests/`
- `appendAnchor` — `src/ports/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/ports/browser-file.test.ts`

### `apply` — not in N2's table

- `apply` — `tests/core/fight-session.test.ts`, `tests/ports/recorded-session.test.ts`

### `assert` — not in N2's table

- `assertHalfNamedCutTotals` — `tests/ui/panel-content.test.ts`

### `at` — not in N2's table

- `at` — `tests/e2e/panel-fixture.ts`

### `attach` — not in N2's table

- `attachShadow` — `src/ui/panel-document.ts`, `tests/fake-document.ts`

### `battle` — not in N2's table

- `battle` — `tests/ports/margonem-engine-battle.test.ts`

### `blow` — not in N2's table

- `blow` — `tests/core/fight-decoder.test.ts`, `tests/core/fight-statistics.test.ts`
- `blowFrom` — `tests/core/fight-session.test.ts`

### `box` — not in N2's table

- `boxOf` — `tests/e2e/panel-helper.spec.ts`

### `break` — not in N2's table

- `breakCharge` — `tests/core/charged-skill.test.ts`

### `call` — not in N2's table

- `call` — `tests/fake-window.ts`
- `callEngineUpdate` — `src/ports/margonem-engine-battle.ts`
- `callSimulationMargonemEngine` — `tests/simulation.ts`
- `callUpdate` — `tests/ports/margonem-engine-battle.test.ts`

### `calling` — not in N2's table

- `calling` — `tests/tools/capture-intake.test.ts`

### `cancel` — not in N2's table

- `cancel` — in 4 files: `src/ports/`, `tests/`, `tools/`
- `cancelAnimationFrame` — in 4 files: `src/ports/`, `tests/`

### `cancels` — not in N2's table

- `cancels` — `tests/runtime/margonem-engine-search.test.ts`

### `capture` — not in N2's table

- `capture` — `tests/ports/fight-capture.test.ts`

### `card` — not in N2's table

- `cardWith` — `tests/ui/panel-card.test.ts`

### `cast` — not in N2's table

- `cast` — `tests/ports/margonem-engine-warriors.test.ts`

### `charging` — not in N2's table

- `charging` — `tests/core/charged-skill.test.ts`
- `chargingMany` — `tests/core/charged-skill.test.ts`

### `choose` — not in N2's table

- `chooseKeptFight` — `tests/runtime/margometer-runtime.test.ts`
- `chooseStorage` — `tests/runtime/margometer-runtime.test.ts`

### `chosen` — not in N2's table

- `chosen` — `tests/runtime/margometer-runtime.test.ts`

### `claiming` — not in N2's table

- `claiming` — `tests/tools/protocol-key-shape.test.ts`

### `clear` — not in N2's table

- `clearInterval` — in 5 files: `src/ports/`, `tests/`

### `click` — not in N2's table

- `click` — `src/ports/browser-file.ts`, `tests/fake-window.ts`, `tests/ports/browser-file.test.ts`

### `close` — not in N2's table

- `close` — `tools/preview-server.ts`
- `closePanelPage` — `tests/e2e/panel-camera.ts`

### `collect` — not in N2's table

- `collect` — `src/ui/panel-element.ts`

### `compare` — not in N2's table

- `compareCases` — `tools/drill-report.ts`
- `compareReportSections` — `tools/develop-reports.ts`
- `compareSectionMaps` — `tools/develop-reports.ts`
- `compareText` — `tests/repository/name-register.test.ts`
- `compareWholeReports` — `tools/develop-reports.ts`

### `concat` — not in N2's table

- `concatTip` — `src/ports/margonem-engine-tooltip.ts`,
  `tests/ports/margonem-engine-tooltip.test.ts`, `tests/rebuilding-battle.ts`

### `contains` — not in N2's table

- `contains` — `src/ui/panel-document.ts`, `tests/fake-document.ts`

### `controls` — not in N2's table

- `controls` — `tests/ui/panel-element.test.ts`

### `copies` — not in N2's table

- `copies` — `tests/tools/card-height.test.ts`

### `copy` — not in N2's table

- `copyWalk` — `tests/core/carried-status.test.ts`, `tests/core/legendary-standing.test.ts`

### `cost` — not in N2's table

- `cost` — `tests/ui/card-window.test.ts`

### `critical` — not in N2's table

- `critical` — `tests/ui/panel-card.test.ts`

### `current` — not in N2's table

- `currentScreen` — `tests/runtime/margometer-runtime.test.ts`

### `dated` — not in N2's table

- `dated` — `tests/tools/frozen-files.test.ts`

### `decoys` — not in N2's table

- `decoys` — `tests/ports/margonem-client-build.test.ts`

### `detach` — not in N2's table

- `detach` — `src/ports/margonem-engine-battle.ts`

### `dispatch` — not in N2's table

- `dispatch` — `tests/ui/panel-gesture.test.ts`

### `drag` — not in N2's table

- `drag` — `tests/ui/panel-gesture.test.ts`
- `dragOnElement` — `tests/fake-document.ts`

### `draw` — not in N2's table

- `draw` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/view-failure.test.ts`
- `drawOpened` — `tests/ui/panel-element.test.ts`
- `drawShownView` — `tests/ui/full-cast-bound.test.ts`

### `drawn` — not in N2's table

- `drawnFigures` — `tests/runtime/margometer-runtime.test.ts`

### `drop` — not in N2's table

- `dropOldestUnpinned` — `src/runtime/shelf.ts`

### `effects` — not in N2's table

- `effects` — `tests/core/aura-standing.test.ts`

### `error` — not in N2's table

- `error` — in 4 files: `src/`, `src/ports/`, `tests/`

### `every` — not in N2's table

- `every` — `src/ports/browser-time.ts`, `tests/runtime-world.ts`,
  `tests/runtime/margometer-runtime.test.ts`

### `fall` — not in N2's table

- `fall` — `tests/ports/browser-frame.test.ts`

### `feed` — not in N2's table

- `feed` — `tests/e2e/margonem-page.ts`, `tests/e2e/panel-fixture.ts`

### `fill` — not in N2's table

- `fill` — `tests/tools/preview-server.test.ts`

### `find` — not in N2's table

- `find` — `tests/ports/margonem-engine-tooltip.test.ts`, `tests/rebuilding-battle.ts`
- `findByMark` — `tests/runtime/margometer-runtime.test.ts`
- `findGrip` — `tests/ui/panel-gesture.test.ts`
- `findKeptShelfRow` — `tests/runtime/margometer-runtime.test.ts`
- `findList` — `tests/runtime/margometer-runtime.test.ts`
- `findMarked` — `tests/ui/view-failure.test.ts`
- `findSheetDepartures` — `tests/ui/panel-look.test.ts`

### `fire` — not in N2's table

- `fire` — `tests/ports/browser-interval.test.ts`, `tests/runtime/margometer-runtime.test.ts`

### `flags` — not in N2's table

- `flags` — `tests/tools/panel-giving-way.test.ts`

### `flush` — not in N2's table

- `flush` — `tests/runtime-world.ts`
- `flushFakeFrames` — `tests/fake-window.ts`

### `granting` — not in N2's table

- `granting` — `tests/tools/skill-table.test.ts`

### `headings` — not in N2's table

- `headings` — `tests/ui/panel-element.test.ts`

### `heads` — not in N2's table

- `heads` — `tests/tools/protocol-key-table.test.ts`, `tests/ui/panel-element.test.ts`

### `held` — not in N2's table

- `held` — `tests/ui/panel-element.test.ts`

### `helper` — not in N2's table

- `helperBarNow` — `src/ui/panel-element.ts`

### `here` — not in N2's table

- `here` — `tests/runtime/margometer-runtime.test.ts`

### `hero` — not in N2's table

- `hero` — `tests/ports/margonem-engine-hero.test.ts`

### `hide` — not in N2's table

- `hideCard` — `src/ui/panel-element.ts`

### `hold` — not in N2's table

- `hold` — `tools/capture-intake.ts`

### `keep` — not in N2's table

- `keep` — `src/runtime/shelf-keeper.ts`, `src/ui/panel-element.ts`,
  `tests/runtime/panel-frame.test.ts`
- `keepAll` — `tests/runtime/shelf.test.ts`

### `kept` — not in N2's table

- `kept` — `tests/ui/panel-look.test.ts`

### `labelled` — not in N2's table

- `labelled` — `tests/tools/protocol-key-table.test.ts`

### `labelling` — not in N2's table

- `labelling` — `tests/tools/protocol-key-table.test.ts`

### `launch` — not in N2's table

- `launchPanelBrowser` — `tests/e2e/panel-camera.ts`
- `launchShotBrowser` — `tools/panel-shots.ts`

### `layer` — not in N2's table

- `layerOf` — `tests/ui/panel-look.test.ts`

### `left` — not in N2's table

- `left` — `tests/ui/panel-words.test.ts`

### `line` — not in N2's table

- `lineOf` — `tests/ui/card-window.test.ts`

### `listed` — not in N2's table

- `listed` — `tests/runtime/shelf.test.ts`

### `listing` — not in N2's table

- `listing` — `tests/tools/recorded-material.test.ts`

### `load` — not in N2's table

- `load` — `tests/e2e/margonem-page.ts`

### `locate` — not in N2's table

- `locate` — `tests/e2e/panel-fixture.ts`

### `location` — not in N2's table

- `location` — `tests/ports/browser-surroundings.test.ts`

### `lost` — not in N2's table

- `lost` — `tests/ui/panel-words.test.ts`

### `m` — not in N2's table

- `m` — `tests/runtime/live-fight.test.ts`

### `many` — not in N2's table

- `many` — `tests/ui/panel-words.test.ts`

### `map` — not in N2's table

- `map` — `tests/ports/margonem-engine-place.test.ts`

### `mark` — not in N2's table

- `markPanelDue` — `src/runtime/margometer-runtime.ts`
- `markStale` — `src/runtime/margometer-runtime.ts`, `tests/runtime/live-fight.test.ts`

### `marks` — not in N2's table

- `marksNow` — `tests/runtime/margometer-runtime.test.ts`

### `measure` — not in N2's table

- `measure` — `tests/e2e/panel-card.spec.ts`

### `moment` — not in N2's table

- `momentAfterDays` — `tests/tools/margonem-readings.test.ts`

### `monsters` — not in N2's table

- `monsters` — `tests/tools/capture-intake.test.ts`

### `mount` — not in N2's table

- `mountPanel` — `src/userscript-entry.ts`, `tests/runtime-world.ts`,
  `tests/runtime/margometer-runtime.test.ts`

### `move` — not in N2's table

- `moveShelf` — `src/runtime/shelf-keeper.ts`, `tests/runtime/panel-frame.test.ts`

### `named` — not in N2's table

- `named` — `tests/core/last-heal-rule.test.ts`, `tests/ports/margonem-client-build.test.ts`,
  `tests/ui/panel-card.test.ts`

### `names` — not in N2's table

- `names` — `tests/core/fight-decoder.test.ts`, `tests/tools/capture-intake.test.ts`

### `naming` — not in N2's table

- `naming` — in 9 files: `tests/`

### `navigator` — not in N2's table

- `navigator` — `tests/ports/browser-surroundings.test.ts`

### `notes` — not in N2's table

- `notesOf` — `tests/ui/panel-card.test.ts`

### `noughts` — not in N2's table

- `noughtsOf` — `tests/ui/panel-card.test.ts`

### `now` — not in N2's table

- `now` — `src/ports/browser-time.ts`, `tests/ports/browser-clock.test.ts`,
  `tests/ui/panel-words.test.ts`

### `opening` — not in N2's table

- `opening` — `tests/tools/protocol-key-shape.test.ts`

### `original` — not in N2's table

- `original` — `tests/runtime/margonem-engine-search.test.ts`

### `own` — not in N2's table

- `ownKeys` — `tests/runtime/live-fight.test.ts`

### `padded` — not in N2's table

- `padded` — `tests/runtime/settings.test.ts`, `tests/tools/skill-table.test.ts`

### `panel` — not in N2's table

- `panel` — `tests/e2e/panel-fixture.ts`

### `paths` — not in N2's table

- `paths` — `tests/tools/preview-server.test.ts`

### `pin` — not in N2's table

- `pin` — `src/runtime/shelf-keeper.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/runtime/panel-frame.test.ts`

### `pinned` — not in N2's table

- `pinned` — `tests/ui/view-failure.test.ts`
- `pinnedName` — `tests/runtime/margometer-runtime.test.ts`

### `place` — not in N2's table

- `place` — `tests/e2e/panel-fixture.ts`

### `play` — not in N2's table

- `playInto` — `tests/runtime/live-fight.test.ts`
- `playRecordedFight` — `tests/runtime/margometer-runtime.test.ts`
- `playRecordedFightOn` — `tests/runtime/margometer-runtime.test.ts`
- `playRecording` — `tests/userscript-entry.test.ts`

### `point` — not in N2's table

- `pointAt` — `tests/ui/panel-element.test.ts`
- `pointAtElement` — `tests/fake-document.ts`
- `pointAtRow` — `tests/ui/panel-element.test.ts`

### `position` — not in N2's table

- `positionInStack` — `tests/e2e/panel-helper.spec.ts`

### `press` — not in N2's table

- `press` — `tests/runtime-world.ts`, `tests/ui/panel-gesture.test.ts`
- `pressElement` — `tests/fake-document.ts`
- `pressSave` — `tests/runtime/margometer-runtime.test.ts`

### `prevent` — not in N2's table

- `preventDefault` — `tests/fake-document.ts`, `tests/ui/panel-gesture.test.ts`

### `pull` — not in N2's table

- `pull` — `tests/tools/margonem-client-source.test.ts`

### `query` — not in N2's table

- `querySelectorAll` — `src/userscript-entry.ts`, `tests/fake-window.ts`

### `reaching` — not in N2's table

- `reaching` — `tests/tools/skill-table.test.ts`

### `record` — not in N2's table

- `recordFailure` — `src/ports/margonem-engine-battle.ts`

### `recover` — not in N2's table

- `recoverSetting` — `src/runtime/margometer-runtime.ts`

### `refuse` — not in N2's table

- `refuse` — `tests/ports/browser-store.test.ts`, `tests/runtime/settings.test.ts`

### `refused` — not in N2's table

- `refused` — `tests/tools/protocol-key-shape.test.ts`

### `registering` — not in N2's table

- `registering` — `tests/tools/status-bit-table.test.ts`

### `release` — not in N2's table

- `releaseObjectUrl` — `src/ports/browser-file.ts`
- `releasePointerCapture` — `src/ui/panel-document.ts`, `tests/fake-document.ts`

### `reload` — not in N2's table

- `reloadRuntimeWorld` — `tests/runtime/margometer-runtime.test.ts`
- `reloadWithNoFightFed` — `tests/e2e/panel-fixture.ts`

### `remaining` — not in N2's table

- `remaining` — `tests/e2e/margonem-page.ts`, `tests/e2e/panel-fixture.ts`

### `replace` — not in N2's table

- `replaceChildren` — `src/ui/panel-document.ts`, `tests/fake-document.ts`
- `replaceState` — `tests/tools/preview-state.test.ts`
- `replaceWith` — `src/ui/panel-document.ts`, `tests/fake-document.ts`

### `reporting` — not in N2's table

- `reporting` — `tests/tools/develop-reports.test.ts`

### `request` — not in N2's table

- `requestAnimationFrame` — in 4 files: `src/ports/`, `tests/`
- `requestFrame` — `src/ports/browser-time.ts`, `tests/runtime-world.ts`,
  `tests/runtime/margometer-runtime.test.ts`

### `resets` — not in N2's table

- `resets` — `tests/ui/panel-element.test.ts`

### `revoke` — not in N2's table

- `revokeObjectURL` — `src/ports/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/ports/browser-file.test.ts`

### `rewind` — not in N2's table

- `rewind` — `tests/e2e/margonem-page.ts`, `tests/e2e/panel-fixture.ts`

### `rotate` — not in N2's table

- `rotateShelf` — `src/runtime/shelf.ts`

### `route` — not in N2's table

- `routePanelPage` — `tests/e2e/panel-camera.ts`

### `row` — not in N2's table

- `row` — `tests/ui/panel-words.test.ts`

### `rows` — not in N2's table

- `rows` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-words.test.ts`

### `run` — not in N2's table

- `runDevelopCommand` — `tools/develop-reports.ts`
- `runGuardedStep` — `src/ports/browser-time.ts`
- `runPlugin` — `tests/source-tree.ts`
- `runSimulation` — `tests/simulation.ts`
- `runSimulationStep` — `tests/simulation.ts`

### `said` — not in N2's table

- `said` — `tests/e2e/panel-fixture.ts`, `tests/ui/panel-words.test.ts`

### `sample` — not in N2's table

- `sample` — `tests/ui/panel-words.test.ts`

### `saved` — not in N2's table

- `saved` — `tests/e2e/panel-fixture.ts`

### `saying` — not in N2's table

- `saying` — `tests/tools/protocol-key-shape.test.ts`

### `seat` — not in N2's table

- `seat` — `tests/tools/fabricated-fight.test.ts`

### `select` — not in N2's table

- `selectDevelopMaterial` — `tools/develop-reports.ts`

### `send` — not in N2's table

- `send` — `tools/preview-server.ts`

### `serving` — not in N2's table

- `serving` — `tests/tools/skill-table.test.ts`

### `settle` — not in N2's table

- `settle` — `src/ui/panel-element.ts`

### `sheet` — not in N2's table

- `sheet` — `tests/runtime/margometer-runtime.test.ts`

### `shouting` — not in N2's table

- `shouting` — `tests/tools/skill-table.test.ts`, `tests/ui/panel-words.test.ts`

### `sides` — not in N2's table

- `sides` — `tests/ui/panel-element.test.ts`, `tests/ui/view-failure.test.ts`

### `somebody` — not in N2's table

- `somebodyElse` — `tests/ports/margonem-engine-battle.test.ts`

### `spaced` — not in N2's table

- `spaced` — `tests/tools/protocol-key-table.test.ts`, `tests/tools/status-bit-table.test.ts`

### `split` — not in N2's table

- `splitReportLines` — `tools/develop-reports.ts`

### `spy` — not in N2's table

- `spy` — `tests/ui/blow-vocabulary.test.ts`

### `stamp` — not in N2's table

- `stampBundleVersion` — `tools/build-userscript.ts`

### `standing` — not in N2's table

- `standing` — `tests/ui/panel-element.test.ts`

### `start` — not in N2's table

- `start` — `tests/runtime/margonem-engine-search.test.ts`, `tools/preview-server.ts`
- `startMargoMeter` — `src/userscript-entry.ts`

### `starts` — not in N2's table

- `starts` — `tests/runtime/margonem-engine-search.test.ts`

### `stated` — not in N2's table

- `stated` — `tests/tools/recorded-material.test.ts`
- `statedSkills` — `tests/runtime/panel-frame.test.ts`

### `stateless` — not in N2's table

- `stateless` — `tests/core/charged-skill.test.ts`

### `stating` — not in N2's table

- `stating` — `tests/tools/skill-table.test.ts`

### `stop` — not in N2's table

- `stop` — `src/runtime/margometer-runtime.ts`, `tools/preview-server.ts`

### `stored` — not in N2's table

- `stored` — `tests/e2e/panel-fixture.ts`

### `style` — not in N2's table

- `style` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`

### `substitute` — not in N2's table

- `substituteNames` — `tools/capture-intake.ts`

### `subtitle` — not in N2's table

- `subtitleOf` — `tests/ui/panel-card.test.ts`

### `sum` — not in N2's table

- `sum` — `tests/ui/panel-content.test.ts`

### `suspicions` — not in N2's table

- `suspicions` — `tests/ui/view-failure.test.ts`

### `tails` — not in N2's table

- `tails` — `tests/tools/protocol-key-table.test.ts`

### `tell` — not in N2's table

- `tellPreviewListeners` — `tools/preview-server.ts`

### `text` — not in N2's table

- `text` — `tests/tools/develop-reports.test.ts`

### `tick` — not in N2's table

- `tick` — `tests/core/fight-decoder.test.ts`, `tests/runtime/margonem-engine-search.test.ts`

### `time` — not in N2's table

- `timeMargonemEngineUpdate` — `tools/payload-cost.ts`

### `tip` — not in N2's table

- `tip` — `src/ports/margonem-engine-tooltip.ts`, `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/rebuilding-battle.ts`

### `to` — not in N2's table

- `toISOString` — `src/ports/browser-time.ts`, `tests/ports/browser-clock.test.ts`,
  `tests/ui/panel-words.test.ts`
- `toString` — `tests/userscript-entry.test.ts`

### `translate` — not in N2's table

- `translate` — `tests/runtime/panel-frame.test.ts`
- `translateLabel` — `src/runtime/margometer-runtime.ts`

### `trigger` — not in N2's table

- `trigger` — `src/ports/margonem-engine-tooltip.ts`, `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/rebuilding-battle.ts`

### `unknown` — not in N2's table

- `unknown` — in 8 files: `tools/`

### `unnamed` — not in N2's table

- `unnamedBefore` — `tests/ui/panel-element.test.ts`

### `unread` — not in N2's table

- `unread` — `tests/tools/decoding-status.test.ts`

### `update` — not in N2's table

- `update` — `tests/runtime-world.ts`
- `updateData` — in 5 files: `tests/`

### `user` — not in N2's table

- `userAgent` — `tests/ports/browser-surroundings.test.ts`

### `view` — not in N2's table

- `view` — `tests/core/fight-session.test.ts`, `tests/ports/recorded-session.test.ts`
- `viewAt` — `tests/tools/panel-shots.test.ts`

### `viewport` — not in N2's table

- `viewport` — `tests/ui/panel-element.test.ts`

### `visitors` — not in N2's table

- `visitors` — `tests/source-tree.ts`

### `wait` — not in N2's table

- `waitForFrame` — `tests/e2e/panel-page.ts`

### `warrior` — not in N2's table

- `warrior` — `tests/runtime/margometer-runtime.test.ts`

### `widths` — not in N2's table

- `widths` — `tests/ui/panel-drag.test.ts`

### `witness` — not in N2's table

- `witnessRecording` — `tests/core/health-witness.test.ts`

### `wrap` — not in N2's table

- `wrap` — `src/ports/margonem-engine-battle.ts`
- `wrapOn` — `tests/ports/margonem-engine-battle.test.ts`

### `writing` — not in N2's table

- `writing` — `tests/tools/capture-intake.test.ts`

## Types

### `libs/`

- `CharacterReference` — `libs/html-text.ts`
- `FieldFailure` — `libs/unknown-value.ts`
- `FieldKeys` — `libs/unknown-value.ts`
- `FieldType` — `libs/unknown-value.ts`
- `JsonValue` — `libs/json-text.ts`
- `Known` — `libs/errors.ts`
- `QuotedLiteral` — `libs/text-walk.ts`
- `UnknownRecord` — `libs/unknown-value.ts`
- `VocabularyWord` — `libs/vocabulary.ts`

### `src/core/`

- `AnnouncedSkill` — `src/core/battle-event.ts`
- `AnnouncementDecoded` — `src/core/fight-decoder.ts`
- `AnnouncementStanding` — `src/core/fight-decoder.ts`
- `AttackEvent` — `src/core/battle-event.ts`
- `AuraCast` — `src/core/aura-standing.ts`
- `AuraReach` — `src/core/aura-standing.ts`
- `AuraStanding` — `src/core/aura-standing.ts`
- `AuraWalk` — `src/core/aura-standing.ts`
- `BattleEvent` — `src/core/battle-event.ts`
- `Bearer` — `src/core/carried-figure.ts`
- `BlowFigures` — `src/core/fight-statistics.ts`
- `CarriedFigure` — `src/core/carried-figure.ts`
- `CarriedFigureInputs` — `src/core/carried-figure.ts`
- `CarriedStatus` — `src/core/carried-status.ts`
- `CarriedStatusWalk` — `src/core/carried-status.ts`
- `ChargedSkillStanding` — `src/core/charged-skill.ts`
- `ChargedSkillState` — `src/core/charged-skill.ts`
- `ChargedSkillStatement` — `src/core/charged-skill.ts`
- `Combatant` — `src/core/combatant-roster.ts`
- `CombatantFigures` — `src/core/fight-statistics.ts`
- `CombatantRoster` — `src/core/combatant-roster.ts`
- `DamageFigure` — `src/core/battle-event.ts`
- `DamageHalf` — `src/core/protocol-key.ts`
- `DamageToNamedCombatantEvent` — `src/core/battle-event.ts`
- `DeclarationEvent` — `src/core/battle-event.ts`
- `DeclaredEffect` — `src/core/battle-event.ts`
- `DecodeContext` — `src/core/fight-decoder.ts`
- `DecoderTables` — `src/core/fight-decoder.ts`
- `Defence` — `src/core/protocol-key.ts`
- `DefenceMechanism` — `src/core/protocol-key.ts`
- `DestroyedStatistic` — `src/core/battle-event.ts`
- `FightEntryHealth` — `src/core/combatant-health.ts`
- `FightFigures` — `src/core/fight-figures.ts`
- `FightOutcome` — `src/core/fight-statistics.ts`
- `FightOutcomeEvent` — `src/core/battle-event.ts`
- `FightSession` — `src/core/fight-session.ts`
- `FightStandings` — `src/core/aura-standing.ts`
- `FightStatistics` — `src/core/fight-statistics.ts`
- `FightTotals` — `src/core/fight-statistics.ts`
- `FightView` — `src/core/fight-session.ts`
- `FigureCut` — `src/core/fight-statistics.ts`
- `GrammarRefusal` — `src/core/fight-decoder.ts`
- `HealingToNamedCombatantEvent` — `src/core/battle-event.ts`
- `HealthChangeDecoded` — `src/core/fight-decoder.ts`
- `HealthChangeEvent` — `src/core/battle-event.ts`
- `HeldByShout` — `src/core/aura-standing.ts`
- `KeyMeaning` — `src/core/protocol-key.ts`
- `KeyReach` — `src/core/protocol-key.ts`
- `LegendaryBonus` — `src/core/protocol-key.ts`
- `LegendaryBonusShowing` — `src/core/protocol-key.ts`
- `LegendaryBonusTally` — `src/core/legendary-standing.ts`
- `LegendaryBonusesByCombatantId` — `src/core/legendary-standing.ts`
- `LegendaryStanding` — `src/core/legendary-standing.ts`
- `LegendaryWalk` — `src/core/legendary-standing.ts`
- `MessageDecoded` — `src/core/fight-decoder.ts`
- `MessageEnd` — `src/core/fight-decoder.ts`
- `MessageParameter` — `src/core/fight-decoder.ts`
- `NamedTargetDecoded` — `src/core/fight-decoder.ts`
- `OutcomeResult` — `src/core/battle-event.ts`
- `ParametersDecoded` — `src/core/fight-decoder.ts`
- `PayloadCommitted` — `src/core/fight-session.ts`
- `PayloadDecoded` — `src/core/fight-decoder.ts`
- `PayloadRecord` — `src/core/fight-session.ts`
- `PayloadRejected` — `src/core/fight-session.ts`
- `PreparedPayload` — `src/core/fight-session.ts`
- `PreparedStanding` — `src/core/fight-session.ts`
- `PreventedDamage` — `src/core/battle-event.ts`
- `ProcEnd` — `src/core/protocol-key.ts`
- `ProtocolMessage` — `src/core/fight-decoder.ts`
- `ProvocationStanding` — `src/core/aura-standing.ts`
- `SessionOptions` — `src/core/fight-session.ts`
- `SessionPhase` — `src/core/fight-session.ts`
- `SessionState` — `src/core/fight-session.ts`
- `ShoutStated` — `src/core/aura-standing.ts`
- `SideHeal` — `src/core/combatant-health.ts`
- `SkillEffectTurns` — `src/core/aura-standing.ts`
- `SkillFigures` — `src/core/fight-statistics.ts`
- `SkillUsedEvent` — `src/core/battle-event.ts`
- `StandingAnnouncement` — `src/core/fight-decoder.ts`
- `StatedEnd` — `src/core/fight-decoder.ts`
- `StatedSkills` — `src/core/aura-standing.ts`
- `Tallying` — `src/core/fight-statistics.ts`
- `TallyingFigures` — `src/core/fight-statistics.ts`
- `TallyingSkillFigures` — `src/core/fight-statistics.ts`
- `TallyingStatistics` — `src/core/fight-statistics.ts`
- `TurnLostEvent` — `src/core/battle-event.ts`
- `TurnStanding` — `src/core/turn-clock.ts`
- `TurnStatement` — `src/core/fight-session.ts`
- `UnaccountedHealthEvent` — `src/core/battle-event.ts`
- `UnknownMessageEvent` — `src/core/battle-event.ts`
- `UnreadCause` — `src/core/battle-event.ts`
- `UnreadCounts` — `src/core/fight-session.ts`
- `UnreadDetails` — `src/core/fight-decoder.ts`
- `UnreadMessageCounts` — `src/core/fight-statistics.ts`
- `WoundStanding` — `src/core/fight-statistics.ts`

### `src/ports/`

- `BlockLanded` — `src/ports/margonem-engine-tooltip.ts`
- `BlockLanding` — `src/ports/margonem-engine-tooltip.ts`
- `BrowserClock` — `src/ports/browser-time.ts`
- `BrowserConsole` — `src/ports/browser-console.ts`
- `BrowserConsolePort` — `src/ports/browser-console.ts`
- `BrowserDate` — `src/ports/browser-time.ts`
- `BrowserDateValue` — `src/ports/browser-time.ts`
- `BrowserDownloads` — `src/ports/browser-file.ts`
- `BrowserFileSink` — `src/ports/browser-file.ts`
- `BrowserFrameScheduler` — `src/ports/browser-time.ts`
- `BrowserFrames` — `src/ports/browser-time.ts`
- `BrowserIntervalScheduler` — `src/ports/browser-time.ts`
- `BrowserMoment` — `src/ports/browser-time.ts`
- `BrowserStorage` — `src/ports/browser-store.ts`
- `BrowserSurroundingsPort` — `src/ports/browser-surroundings.ts`
- `BrowserTimers` — `src/ports/browser-time.ts`
- `CaptureKept` — `src/ports/fight-capture.ts`
- `CapturedCall` — `src/ports/fight-capture.ts`
- `CapturedCombatant` — `src/ports/margonem-engine-warriors.ts`
- `ChargeField` — `src/ports/payload-envelope.ts`
- `DownloadAnchor` — `src/ports/browser-file.ts`
- `EnvelopeFailure` — `src/ports/payload-envelope.ts`
- `EnvelopeField` — `src/ports/payload-envelope.ts`
- `FightCapture` — `src/ports/fight-capture.ts`
- `FightCaptureReading` — `src/ports/fight-capture.ts`
- `FightPlace` — `src/ports/fight-place.ts`
- `FileFailure` — `src/ports/browser-file.ts`
- `FrameHandle` — `src/ports/browser-time.ts`
- `HealthField` — `src/ports/payload-envelope.ts`
- `HeldField` — `src/ports/margonem-engine-battle.ts`
- `HeroField` — `src/ports/margonem-engine-hero.ts`
- `IntervalHandle` — `src/ports/browser-time.ts`
- `KeyValueStore` — `src/ports/browser-store.ts`
- `MargonemClientBuildPort` — `src/ports/margonem-client-build.ts`
- `MargonemClientDictionaryPort` — `src/ports/margonem-client-dictionary.ts`
- `MargonemEngineAnswer` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineBattle` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineBattlePort` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineCall` — `src/ports/fight-capture.ts`
- `MargonemEngineFailure` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineHeldMember` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineHeroPort` — `src/ports/margonem-engine-hero.ts`
- `MargonemEnginePlacePort` — `src/ports/margonem-engine-place.ts`
- `MargonemEngineTooltipPort` — `src/ports/margonem-engine-tooltip.ts`
- `MargonemEngineWarriorFailure` — `src/ports/margonem-engine-warriors.ts`
- `MargonemEngineWarriorSnapshot` — `src/ports/margonem-engine-warriors.ts`
- `MargonemReadFailure` — `src/ports/margonem-value.ts`
- `MargonemValue` — `src/ports/margonem-value.ts`
- `PayloadListener` — `src/ports/margonem-engine-battle.ts`
- `PayloadWarriorEntries` — `src/ports/payload-envelope.ts`
- `PayloadWarriorField` — `src/ports/payload-envelope.ts`
- `PlaceField` — `src/ports/margonem-engine-place.ts`
- `PreparedCapture` — `src/ports/fight-capture.ts`
- `RememberedBlock` — `src/ports/margonem-engine-tooltip.ts`
- `StoreFailure` — `src/ports/browser-store.ts`
- `StoreKey` — `src/ports/browser-store.ts`
- `TooltipTargets` — `src/ports/margonem-engine-tooltip.ts`
- `TooltipWritten` — `src/ports/margonem-engine-tooltip.ts`
- `WrapHandle` — `src/ports/margonem-engine-battle.ts`

### `src/runtime/`

- `Defect` — `src/runtime/defect-ledger.ts`
- `DefectCount` — `src/runtime/defect-ledger.ts`
- `DefectKind` — `src/runtime/defect-ledger.ts`
- `DefectLedger` — `src/runtime/defect-ledger.ts`
- `DefectLedgerOptions` — `src/runtime/defect-ledger.ts`
- `ExportFailure` — `src/runtime/fight-handover.ts`
- `FailureFate` — `src/runtime/failure-fate.ts`
- `FightCardSource` — `src/runtime/panel-frame.ts`
- `FightField` — `src/runtime/shelf.ts`
- `FightFile` — `src/runtime/fight-file.ts`
- `FightState` — `src/runtime/fight-state.ts`
- `FiguresCut` — `src/runtime/panel-frame.ts`
- `FileCalls` — `src/runtime/fight-file.ts`
- `FileSubject` — `src/runtime/fight-file.ts`
- `FileSurroundings` — `src/runtime/fight-file.ts`
- `FrameParts` — `src/runtime/panel-frame.ts`
- `Handover` — `src/runtime/fight-handover.ts`
- `HandoverPorts` — `src/runtime/fight-handover.ts`
- `KeeperState` — `src/runtime/shelf-keeper.ts`
- `KeptFight` — `src/runtime/shelf.ts`
- `KeptFightState` — `src/runtime/fight-state.ts`
- `LiveFight` — `src/runtime/live-fight.ts`
- `LiveFightOptions` — `src/runtime/live-fight.ts`
- `LiveHandover` — `src/runtime/fight-handover.ts`
- `LiveRow` — `src/runtime/panel-frame.ts`
- `MargonemEngineSearch` — `src/runtime/margometer-runtime.ts`
- `MargonemEngineSearchOptions` — `src/runtime/margometer-runtime.ts`
- `OpenedLevels` — `src/runtime/panel-frame.ts`
- `PlaceField` — `src/runtime/shelf.ts`
- `PositionField` — `src/runtime/settings.ts`
- `ReplayFailure` — `src/runtime/fight-state.ts`
- `ReportKey` — `src/runtime/fight-file.ts`
- `ReportRow` — `src/runtime/fight-file.ts`
- `ReportSkill` — `src/runtime/fight-file.ts`
- `Runtime` — `src/runtime/margometer-runtime.ts`
- `RuntimeFailure` — `src/runtime/failure-fate.ts`
- `RuntimeOptions` — `src/runtime/margometer-runtime.ts`
- `RuntimePorts` — `src/runtime/margometer-runtime.ts`
- `RuntimeState` — `src/runtime/margometer-runtime.ts`
- `RuntimeTables` — `src/runtime/margometer-runtime.ts`
- `Search` — `src/runtime/margometer-runtime.ts`
- `SearchReport` — `src/runtime/margometer-runtime.ts`
- `SettingFailure` — `src/runtime/settings.ts`
- `SettingKey` — `src/runtime/settings.ts`
- `ShelfAnswers` — `src/runtime/shelf-keeper.ts`
- `ShelfContents` — `src/runtime/shelf.ts`
- `ShelfFailure` — `src/runtime/shelf.ts`
- `ShelfField` — `src/runtime/shelf.ts`
- `ShelfKeeper` — `src/runtime/shelf-keeper.ts`
- `ShelfKeeperOptions` — `src/runtime/shelf-keeper.ts`
- `ShelfOpened` — `src/runtime/shelf.ts`
- `ShelfWritten` — `src/runtime/shelf.ts`
- `ShownFight` — `src/runtime/fight-state.ts`
- `SizeField` — `src/runtime/settings.ts`
- `TooltipTables` — `src/runtime/carried-tooltip.ts`

### `src/ui/`

- `BarIcon` — `src/ui/panel-look.ts`
- `CardAcross` — `src/ui/panel-drag.ts`
- `CardColumns` — `src/ui/panel-look.ts`
- `CardCompose` — `src/ui/panel-element.ts`
- `CardContent` — `src/ui/panel-element.ts`
- `CardEdge` — `src/ui/panel-drag.ts`
- `CardEnding` — `src/ui/panel-element.ts`
- `CardFigure` — `src/ui/panel-element.ts`
- `CardGroup` — `src/ui/panel-element.ts`
- `CardHandle` — `src/ui/panel-element.ts`
- `CardKeyPlace` — `src/ui/panel-element.ts`
- `CardLayout` — `src/ui/panel-element.ts`
- `CardLine` — `src/ui/panel-element.ts`
- `CardLookup` — `src/ui/panel-element.ts`
- `CardNoteTone` — `src/ui/panel-element.ts`
- `CardPlace` — `src/ui/panel-element.ts`
- `CardRedraw` — `src/ui/panel-element.ts`
- `CardRegister` — `src/ui/panel-element.ts`
- `CardRoom` — `src/ui/panel-element.ts`
- `CardSize` — `src/ui/panel-element.ts`
- `CardSubject` — `src/ui/panel-element.ts`
- `CardWindowPlace` — `src/ui/panel-drag.ts`
- `Caveat` — `src/ui/panel-words.ts`
- `CharactersPerLine` — `src/ui/panel-element.ts`
- `ClosingRow` — `src/ui/panel-content.ts`
- `Colour` — `src/ui/panel-palette.ts`
- `CountedNoun` — `src/ui/panel-words.ts`
- `CutPart` — `src/ui/panel-content.ts`
- `ElementCut` — `src/ui/panel-content.ts`
- `ElementRow` — `src/ui/panel-content.ts`
- `FightCardContent` — `src/ui/panel-content.ts`
- `FightMoment` — `src/ui/panel-content.ts`
- `FightReader` — `src/ui/panel-content.ts`
- `FightSuspicions` — `src/ui/panel-content.ts`
- `FoldedParts` — `src/ui/panel-content.ts`
- `GrabKind` — `src/ui/panel-drag.ts`
- `HalfNamedField` — `src/ui/panel-content.ts`
- `HalfNamedKindField` — `src/ui/panel-content.ts`
- `HalfNamedListing` — `src/ui/panel-content.ts`
- `HalfNamedOpened` — `src/ui/panel-content.ts`
- `HalfNamedPart` — `src/ui/panel-content.ts`
- `HalfNamedRow` — `src/ui/panel-content.ts`
- `HalfNamedTotalField` — `src/ui/panel-content.ts`
- `HelperAbsence` — `src/ui/panel-helper.ts`
- `HelperContent` — `src/ui/panel-helper.ts`
- `HelperPerson` — `src/ui/panel-element.ts`
- `IntentReading` — `src/ui/panel-intent.ts`
- `KeptUnread` — `src/ui/panel-element.ts`
- `ListDrawing` — `src/ui/panel-element.ts`
- `MetricCuts` — `src/ui/panel-content.ts`
- `NamedPart` — `src/ui/panel-content.ts`
- `OpenedLevelContent` — `src/ui/panel-content.ts`
- `OpenedPart` — `src/ui/panel-content.ts`
- `OpponentUnnamedRow` — `src/ui/panel-content.ts`
- `OptionsContent` — `src/ui/panel-element.ts`
- `OtherEndCut` — `src/ui/panel-content.ts`
- `OtherEndRow` — `src/ui/panel-content.ts`
- `OutsideRankingRow` — `src/ui/panel-content.ts`
- `PairLevelContent` — `src/ui/panel-content.ts`
- `PairPart` — `src/ui/panel-content.ts`
- `PairPartRow` — `src/ui/panel-content.ts`
- `PanelDefect` — `src/ui/panel-element.ts`
- `PanelDefectKind` — `src/ui/panel-words.ts`
- `PanelDirection` — `src/ui/panel-screen.ts`
- `PanelDocument` — `src/ui/panel-document.ts`
- `PanelDragHandle` — `src/ui/panel-drag.ts`
- `PanelDragOptions` — `src/ui/panel-drag.ts`
- `PanelDragState` — `src/ui/panel-drag.ts`
- `PanelDrawing` — `src/ui/panel-element.ts`
- `PanelElement` — `src/ui/panel-document.ts`
- `PanelEvent` — `src/ui/panel-document.ts`
- `PanelGrab` — `src/ui/panel-drag.ts`
- `PanelIntent` — `src/ui/panel-intent.ts`
- `PanelListener` — `src/ui/view-failure.ts`
- `PanelMark` — `src/ui/panel-intent.ts`
- `PanelMetric` — `src/ui/panel-screen.ts`
- `PanelNoun` — `src/ui/panel-screen.ts`
- `PanelPlacement` — `src/ui/panel-drag.ts`
- `PanelPosition` — `src/ui/panel-choice.ts`
- `PanelRedraw` — `src/ui/panel-element.ts`
- `PanelRegion` — `src/ui/panel-words.ts`
- `PanelRegions` — `src/ui/panel-element.ts`
- `PanelRoot` — `src/ui/panel-document.ts`
- `PanelRow` — `src/ui/panel-content.ts`
- `PanelSideChoice` — `src/ui/panel-screen.ts`
- `PanelSides` — `src/ui/panel-content.ts`
- `PanelTarget` — `src/ui/panel-document.ts`
- `PanelUnnamedEnd` — `src/ui/panel-content.ts`
- `PanelView` — `src/ui/panel-element.ts`
- `PanelViewOptions` — `src/ui/panel-element.ts`
- `PanelViewport` — `src/ui/panel-drag.ts`
- `PanelWindow` — `src/ui/panel-choice.ts`
- `PartLevelContent` — `src/ui/panel-content.ts`
- `PersonPlace` — `src/ui/panel-element.ts`
- `PersonRow` — `src/ui/panel-content.ts`
- `PinnedCase` — `src/ui/panel-content.ts`
- `PinnedPlacing` — `src/ui/panel-content.ts`
- `PinnedRow` — `src/ui/panel-content.ts`
- `PinnedShape` — `src/ui/panel-content.ts`
- `PlaceWords` — `src/ui/panel-words.ts`
- `PlainRow` — `src/ui/panel-content.ts`
- `RankingRow` — `src/ui/panel-content.ts`
- `RenderReport` — `src/ui/view-failure.ts`
- `RowCard` — `src/ui/panel-element.ts`
- `RowCardCut` — `src/ui/panel-element.ts`
- `RowContent` — `src/ui/panel-element.ts`
- `RowDetail` — `src/ui/panel-content.ts`
- `RowMark` — `src/ui/panel-element.ts`
- `ScreenAxes` — `src/ui/panel-screen.ts`
- `ScreenContent` — `src/ui/panel-content.ts`
- `ScreenState` — `src/ui/panel-screen.ts`
- `ScreenStrip` — `src/ui/panel-screen.ts`
- `ScrollMemo` — `src/ui/panel-element.ts`
- `ShareInPoints` — `src/ui/panel-words.ts`
- `ShelfRow` — `src/ui/panel-content.ts`
- `ShownScreen` — `src/ui/panel-element.ts`
- `SideRelation` — `src/ui/panel-content.ts`
- `SizeBounds` — `src/ui/panel-drag.ts`
- `SkillCut` — `src/ui/panel-content.ts`
- `SkillRow` — `src/ui/panel-content.ts`
- `StandingChargedSkill` — `src/ui/panel-helper.ts`
- `StandingHolder` — `src/ui/panel-helper.ts`
- `StandingProvocation` — `src/ui/panel-helper.ts`
- `StandingProvoked` — `src/ui/panel-helper.ts`
- `StandingTurn` — `src/ui/panel-helper.ts`
- `StandingTurnState` — `src/ui/panel-helper.ts`
- `StorageChoice` — `src/ui/panel-choice.ts`
- `TooltipContent` — `src/ui/panel-words.ts`
- `TooltipStatus` — `src/ui/panel-words.ts`
- `TranslateLabel` — `src/ui/panel-words.ts`
- `TypeStep` — `src/ui/panel-choice.ts`
- `TypeTokens` — `src/ui/panel-look.ts`
- `UndrawnReport` — `src/ui/panel-element.ts`
- `UnnamedCutLevelContent` — `src/ui/panel-content.ts`
- `UnnamedLevelContent` — `src/ui/panel-content.ts`
- `UnnamedRow` — `src/ui/panel-content.ts`
- `UnsharedPairPart` — `src/ui/panel-content.ts`
- `UnsharedPart` — `src/ui/panel-content.ts`
- `UnsharedRow` — `src/ui/panel-content.ts`
- `UnsharedSkill` — `src/ui/panel-content.ts`
- `ViewFailure` — `src/ui/view-failure.ts`
- `WaitingContent` — `src/ui/panel-element.ts`
- `WindowSize` — `src/ui/panel-choice.ts`
- `WindowSizes` — `src/ui/panel-choice.ts`
- `WindowWidths` — `src/ui/panel-drag.ts`

### `src/`

- `BootFailure` — `src/userscript-entry.ts`
- `BrowserWindow` — `src/userscript-entry.ts`
- `BrowserWindowPart` — `src/userscript-entry.ts`
- `UserscriptDocument` — `src/userscript-entry.ts`

### `tools/`

- `AuraRow` — `tools/aura-standing.ts`
- `AuraSkill` — `tools/skill-table.ts`
- `BitRow` — `tools/aura-lifetime.ts`
- `BitShift` — `tools/margonem-readings.ts`
- `CachedHelpArticle` — `tools/help-article.ts`
- `CachedMargonemClientSource` — `tools/margonem-client-source.ts`
- `CachedSkillTable` — `tools/skill-table.ts`
- `CardArguments` — `tools/card-height.ts`
- `CardHeight` — `tools/card-height.ts`
- `CasePlace` — `tools/drill-report.ts`
- `CaseTally` — `tools/drill-report.ts`
- `CombatantRoll` — `tools/capture-intake.ts`
- `ComputedKeyFamily` — `tools/protocol-key-table.ts`
- `DecodingStatus` — `tools/decoding-status.ts`
- `DefaultBranchField` — `tools/protocol-key-table.ts`
- `DescriptionRemoval` — `tools/capture-intake.ts`
- `DisputedReading` — `tools/turn-reading.ts`
- `DrillArguments` — `tools/drill-report.ts`
- `DrillCase` — `tools/drill-report.ts`
- `DrillRow` — `tools/drill-report.ts`
- `DrillRung` — `tools/drill-report.ts`
- `DrillTally` — `tools/drill-report.ts`
- `DrillVerdict` — `tools/drill-report.ts`
- `Episode` — `tools/shout-holding.ts`
- `EventKind` — `tools/turn-reading.ts`
- `FabricatedAct` — `tools/fabricated-fight.ts`
- `FabricatedCall` — `tools/fabricated-fight.ts`
- `FabricatedCombatant` — `tools/fabricated-fight.ts`
- `FabricatedElement` — `tools/fabricated-fight.ts`
- `FabricatedFight` — `tools/fabricated-fight.ts`
- `FabricatedSkill` — `tools/fabricated-fight.ts`
- `FabricatedTurn` — `tools/fabricated-fight.ts`
- `FabricationEnding` — `tools/fabricated-fight.ts`
- `FabricationShape` — `tools/fabricated-fight.ts`
- `FabricationState` — `tools/fabricated-fight.ts`
- `FightCost` — `tools/payload-cost.ts`
- `FightMessages` — `tools/turn-reading.ts`
- `FrozenFiles` — `tools/frozen-files.ts`
- `FrozenHelpCounts` — `tools/help-article.ts`
- `FrozenSkillTable` — `tools/skill-table.ts`
- `FrozenStatus` — `tools/fabricated-fight.ts`
- `GivingWayFlags` — `tools/panel-giving-way.ts`
- `GrantedBlows` — `tools/skill-table.ts`
- `HelpClaim` — `tools/help-claim-register.ts`
- `HoldingBaseline` — `tools/shout-holding.ts`
- `HoldingReading` — `tools/shout-holding.ts`
- `HoldingRow` — `tools/shout-holding.ts`
- `Intake` — `tools/capture-intake.ts`
- `KeyDifference` — `tools/margonem-readings.ts`
- `KeyPlacement` — `tools/protocol-key-shape.ts`
- `KeyShape` — `tools/protocol-key-shape.ts`
- `KeyTally` — `tools/turn-reading.ts`
- `KeyValue` — `tools/protocol-key-shape.ts`
- `LightingRow` — `tools/aura-lifetime.ts`
- `LineChange` — `tools/develop-reports.ts`
- `LineChangeKind` — `tools/develop-reports.ts`
- `MappingTask` — `tools/capture-intake.ts`
- `MargonemChannel` — `tools/margonem-client-source.ts`
- `MessageReading` — `tools/turn-reading.ts`
- `MessageTurn` — `tools/turn-reading.ts`
- `OpenerTally` — `tools/turn-reading.ts`
- `PanelFight` — `tools/drill-report.ts`
- `PanelShot` — `tools/panel-shots.ts`
- `PanelShotRecord` — `tools/panel-shots.ts`
- `PreviewFightLink` — `tools/preview-page.ts`
- `PreviewInstall` — `tools/preview-page.ts`
- `PreviewInstallNeed` — `tools/preview-page.ts`
- `PreviewOffer` — `tools/preview-page.ts`
- `PreviewPageOptions` — `tools/preview-page.ts`
- `PreviewServer` — `tools/preview-server.ts`
- `PreviewServerOptions` — `tools/preview-server.ts`
- `PreviewSiteFile` — `tools/preview-site.ts`
- `PreviewState` — `tools/preview-server.ts`
- `PreviewWords` — `tools/preview-page.ts`
- `ProseCountClaim` — `tools/protocol-key-shape.ts`
- `ProvocationRow` — `tools/aura-standing.ts`
- `Pseudonymisation` — `tools/capture-intake.ts`
- `ReadingArguments` — `tools/turn-reading.ts`
- `ReadingPlace` — `tools/turn-reading.ts`
- `ReadingState` — `tools/margonem-readings.ts`
- `ReadingVerdict` — `tools/margonem-readings.ts`
- `RecordedMaterial` — `tools/recorded-material.ts`
- `RegisteredKey` — `tools/protocol-key-shape.ts`
- `ReloadListener` — `tools/preview-server.ts`
- `ReplayedFight` — `tools/recorded-material.ts`
- `ReplayedStep` — `tools/recorded-material.ts`
- `ReportComparison` — `tools/develop-reports.ts`
- `ReportDifference` — `tools/develop-reports.ts`
- `ServedFight` — `tools/preview-server.ts`
- `ShapeStep` — `tools/protocol-key-table.ts`
- `ShapeTally` — `tools/protocol-key-shape.ts`
- `ShotMoment` — `tools/panel-shots.ts`
- `ShotStep` — `tools/panel-shots.ts`
- `ShoutSkill` — `tools/skill-table.ts`
- `SkillEffectReading` — `tools/skill-table.ts`
- `SkillReading` — `tools/skill-table.ts`
- `SkillTally` — `tools/aura-standing.ts`
- `SourceRow` — `tools/aura-standing.ts`
- `StandingRun` — `tools/aura-lifetime.ts`
- `StatusRun` — `tools/aura-lifetime.ts`
- `SteppedFight` — `tools/recorded-material.ts`
- `StruckTally` — `tools/shout-holding.ts`
- `TakenShot` — `tools/panel-shots.ts`
- `Tally` — `tools/decoding-status.ts`
- `ToolErrorCode` — `tools/margometer-tool-error.ts`
- `TurnArguments` — `tools/turn-count.ts`
- `TurnBoundary` — `tools/turn-count.ts`
- `TurnDelta` — `tools/turn-count.ts`
- `TurnGrade` — `tools/turn-count.ts`
- `TurnOutcome` — `tools/turn-count.ts`
- `TurnPlacing` — `tools/turn-count.ts`
- `TurnStretch` — `tools/turn-count.ts`
- `TurnVerdict` — `tools/turn-count.ts`
- `UserscriptEdition` — `tools/build-userscript.ts`
- `UserscriptFiles` — `tools/build-userscript.ts`

### `tests/`

- `AssertionCount` — `tests/repository/assertion-density.test.ts`
- `AstComment` — `tests/source-tree.ts`
- `AstNode` — `tests/source-tree.ts`
- `AstVisitor` — `tests/source-tree.ts`
- `BarPoint` — `tests/e2e/panel-probe.ts`
- `Binding` — `tests/repository/browser-globals.test.ts`
- `BlowKeys` — `tests/ui/blow-vocabulary.test.ts`
- `BrowserClock` — `tests/runtime/margonem-engine-search.test.ts`
- `CardLineRead` — `tests/drawn-card.ts`
- `CardRead` — `tests/drawn-card.ts`
- `Cause` — `tests/repository/protocol-keys.test.ts`
- `ChangelogEntry` — `tests/repository/changelog.test.ts`
- `Citation` — `tests/repository/cited-paths.test.ts`
- `ClassSighting` — `tests/repository/name-register.test.ts`
- `ClauseRow` — `tests/tools/aura-lifetime.test.ts`
- `CommentShare` — `tests/repository/comment-share.test.ts`
- `Comparison` — `tests/core/health-witness.test.ts`
- `CorpusTally` — `tests/core/fight-decoder.test.ts`
- `CrawlReport` — `tests/e2e/panel-crawler.ts`
- `DecisionRecord` — `tests/repository/decisions.test.ts`
- `Ending` — `tests/ui/panel-words.test.ts`
- `EventEntries` — `tests/repository/event-entries.test.ts`
- `FakeElement` — `tests/fake-document.ts`
- `FakeMargonem` — `tests/runtime/live-fight.test.ts`
- `FakeWindow` — `tests/fake-window.ts`
- `FakeWindowOptions` — `tests/fake-window.ts`
- `FaultPlan` — `tests/simulation.ts`
- `FightReplay` — `tests/ui/level-drawn.test.ts`
- `FileNames` — `tests/repository/name-register.test.ts`
- `FloorRow` — `tests/repository/browser-support.test.ts`
- `Held` — `tests/ports/margonem-engine-battle.test.ts`
- `HeldString` — `tests/repository/name-register.test.ts`
- `ImportReach` — `tests/repository/name-shapes.test.ts`
- `LabelClaim` — `tests/repository/protocol-keys.test.ts`
- `LayerStack` — `tests/e2e/panel-layer.spec.ts`
- `LayerStandIn` — `tests/e2e/panel-layer.spec.ts`
- `LevelWalk` — `tests/ui/level-drawn.test.ts`
- `LintContext` — `tests/source-tree.ts`
- `LintPlugin` — `tests/source-tree.ts`
- `MargonemEnginePresence` — `tests/e2e/margonem-page.ts`
- `NameKind` — `tests/repository/name-register.test.ts`
- `NameSighting` — `tests/repository/name-register.test.ts`
- `NameTree` — `tests/repository/name-register.test.ts`
- `NamedFigure` — `tests/core/last-heal-rule.test.ts`
- `Occurrence` — `tests/core/last-heal-rule.test.ts`
- `PageCall` — `tests/fake-window.ts`
- `PagePoint` — `tests/e2e/panel-probe.ts`
- `PanelBox` — `tests/e2e/panel-camera.ts`
- `PanelEdges` — `tests/e2e/panel-probe.ts`
- `PanelFixtures` — `tests/e2e/panel-fixture.ts`
- `PanelGesture` — `tests/e2e/panel-camera.ts`
- `PanelHandle` — `tests/e2e/panel-fixture.ts`
- `PanelHonesty` — `tests/e2e/panel-fixture.ts`
- `PanelOptions` — `tests/e2e/panel-fixture.ts`
- `PanelPageOptions` — `tests/e2e/margonem-page.ts`
- `PanelProbe` — `tests/e2e/margonem-page.ts`
- `PanelServed` — `tests/e2e/panel-camera.ts`
- `PanelWorkerFixtures` — `tests/e2e/panel-fixture.ts`
- `ParsedRecorded` — `tests/core/skill-announcement-rule.test.ts`
- `PreviewStateReading` — `tests/tools/preview-state.test.ts`
- `Purity` — `tests/verb-purities.ts`
- `ReachEntries` — `tests/core/aura-standing.test.ts`
- `RecordedDecoding` — `tests/recorded-fights.ts`
- `RecordedFight` — `tests/recorded-fights.ts`
- `RecordedHealth` — `tests/recorded-fights.ts`
- `RecordedRun` — `tests/core/granted-blow-rule.test.ts`
- `RecordedTally` — `tests/recorded-fights.ts`
- `RecordedWarrior` — `tests/repository/captured-fight-register.test.ts`
- `RegionDrawn` — `tests/ui/level-drawn.test.ts`
- `RegisterRow` — `tests/tools/drill-report.test.ts`, `tests/tools/turn-count.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `Registry` — `tests/ports/margonem-engine-tooltip.test.ts`
- `RowPlace` — `tests/ui/level-drawn.test.ts`
- `RuleName` — `tests/repository/documents.test.ts`
- `RunningStatement` — `tests/core/last-heal-rule.test.ts`
- `RuntimeWorld` — `tests/runtime-world.ts`
- `Said` — `tests/ui/panel-words.test.ts`
- `Section` — `tests/repository/declaration-order.test.ts`, `tests/ui/share-column.test.ts`
- `ShareReport` — `tests/core/absorption-destruction-rule.test.ts`
- `ShareRow` — `tests/ui/share-column.test.ts`
- `SheetDeparture` — `tests/ui/panel-look.test.ts`
- `SheetRule` — `tests/style-sheet.ts`
- `SimulationReport` — `tests/simulation.ts`
- `SkillHeader` — `tests/repository/documents.test.ts`
- `SourceFile` — `tests/source-tree.ts`
- `StyleConstructs` — `tests/repository/browser-support.test.ts`
- `Told` — `tests/runtime/margonem-engine-search.test.ts`
- `TooltipRegistry` — `tests/rebuilding-battle.ts`
- `TopItem` — `tests/repository/declaration-order.test.ts`
- `Vocabulary` — `tests/repository/name-register.test.ts`
- `WitnessReading` — `tests/core/health-witness.test.ts`
- `Wound` — `tests/ports/browser-interval.test.ts`

## Type parameters

### `libs/`

- `Field` — `libs/unknown-value.ts`
- `Value` — `libs/errors.ts`
- `Vocabulary` — `libs/vocabulary.ts`
- `Words` — `libs/vocabulary.ts`

### `src/core/`

- `Decoded` — `src/core/fight-decoder.ts`
- `Held` — `src/core/fight-statistics.ts`
- `Key` — `src/core/fight-statistics.ts`
- `Value` — `src/core/fight-statistics.ts`

### `src/ports/`

- `Answer` — `src/ports/margonem-engine-battle.ts`

### `src/runtime/`

- `Field` — `src/runtime/fight-file.ts`, `src/runtime/settings.ts`
- `Renamed` — `src/runtime/fight-file.ts`
- `Value` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`

### `tools/`

- `Row` — `tools/aura-standing.ts`

## Failure classes

### `libs/`

- `Caught` — `libs/errors.ts`
- `FieldTooLong` — `libs/unknown-value.ts`
- `FieldWrongType` — `libs/unknown-value.ts`
- `JsonUnreadable` — `libs/json-text.ts`
- `JsonUnwritable` — `libs/json-text.ts`
- `LiteralTooLong` — `libs/text-walk.ts`

### `src/core/`

- `CombatantsExceeded` — `src/core/fight-session.ts`
- `CutKeysExceeded` — `src/core/fight-session.ts`
- `EndUnreadable` — `src/core/fight-decoder.ts`
- `EventsExceeded` — `src/core/fight-session.ts`
- `ParameterKeyEmpty` — `src/core/fight-decoder.ts`
- `PayloadsExceeded` — `src/core/fight-session.ts`
- `SegmentsExceeded` — `src/core/fight-decoder.ts`
- `SkillsExceeded` — `src/core/fight-session.ts`
- `UnreadMessage` — `src/core/fight-decoder.ts`

### `src/ports/`

- `CaptureCallsExceeded` — `src/ports/fight-capture.ts`
- `FileApiAbsent` — `src/ports/browser-file.ts`
- `MargonemEngineAbsent` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineAlreadyWrapped` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineBattleAbsent` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineMethodAbsent` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineMethodUnwritable` — `src/ports/margonem-engine-battle.ts`
- `MargonemEngineWarriorsAbsent` — `src/ports/margonem-engine-warriors.ts`
- `MargonemEngineWarriorsExceeded` — `src/ports/margonem-engine-warriors.ts`
- `MargonemValueAbsent` — `src/ports/margonem-value.ts`
- `PayloadCombatantRepeated` — `src/ports/payload-envelope.ts`
- `PayloadFieldMalformed` — `src/ports/payload-envelope.ts`
- `PayloadFieldTooLong` — `src/ports/payload-envelope.ts`
- `PayloadNotRecord` — `src/ports/payload-envelope.ts`
- `SearchAbandoned` — `src/ports/margonem-engine-battle.ts`
- `StoreRefused` — `src/ports/browser-store.ts`
- `StoreUnavailable` — `src/ports/browser-store.ts`
- `StoreValueTooLong` — `src/ports/browser-store.ts`
- `WrapCovered` — `src/ports/margonem-engine-battle.ts`

### `src/runtime/`

- `EverySlotPinned` — `src/runtime/shelf.ts`
- `FightAlreadyKept` — `src/runtime/shelf.ts`
- `FiguresDisagreed` — `src/runtime/panel-frame.ts`
- `FileUnserializable` — `src/runtime/fight-file.ts`
- `KeptFightsUnreadable` — `src/runtime/shelf.ts`
- `MargonemEngineTooltipRefused` — `src/runtime/panel-frame.ts`
- `RotationRefused` — `src/runtime/shelf.ts`
- `SettingTooLong` — `src/runtime/settings.ts`
- `SettingUnreadable` — `src/runtime/settings.ts`
- `ShelfUnreadable` — `src/runtime/shelf.ts`
- `ShelfUnwritable` — `src/runtime/shelf.ts`
- `ShelfVersionUnknown` — `src/runtime/shelf.ts`
- `ShownFightAbsent` — `src/runtime/fight-handover.ts`

### `src/ui/`

- `CardRefused` — `src/ui/view-failure.ts`
- `GestureDropped` — `src/ui/view-failure.ts`
- `MarkValueUnknown` — `src/ui/panel-intent.ts`
- `RegionUndrawn` — `src/ui/view-failure.ts`
- `WindowUnplaced` — `src/ui/view-failure.ts`

### `src/`

- `BrowserWindowUnusable` — `src/userscript-entry.ts`

### `tools/`

- `CaptureIntakeError` — `tools/margometer-tool-error.ts`
- `CardHeightError` — `tools/margometer-tool-error.ts`
- `ChangelogError` — `tools/margometer-tool-error.ts`
- `DeclaredVersionError` — `tools/margometer-tool-error.ts`
- `DevelopReportError` — `tools/margometer-tool-error.ts`
- `DrillReportError` — `tools/margometer-tool-error.ts`
- `FabricatedFightError` — `tools/margometer-tool-error.ts`
- `FrozenFilesError` — `tools/margometer-tool-error.ts`
- `GivingWayError` — `tools/margometer-tool-error.ts`
- `HelpArticleError` — `tools/margometer-tool-error.ts`
- `MargoMeterToolError` — `tools/margometer-tool-error.ts`
- `MargonemClientSourceError` — `tools/margometer-tool-error.ts`
- `MargonemReadingsError` — `tools/margometer-tool-error.ts`
- `MargonemUnreachableError` — `tools/margometer-tool-error.ts`
- `PanelShotError` — `tools/margometer-tool-error.ts`
- `PayloadCostError` — `tools/margometer-tool-error.ts`
- `PreviewServeError` — `tools/margometer-tool-error.ts`
- `ProtocolKeyShapeError` — `tools/margometer-tool-error.ts`
- `ProtocolKeyTableError` — `tools/margometer-tool-error.ts`
- `RecordingReadError` — `tools/margometer-tool-error.ts`
- `SkillTableError` — `tools/margometer-tool-error.ts`
- `StatusBitTableError` — `tools/margometer-tool-error.ts`
- `TurnCountError` — `tools/margometer-tool-error.ts`
- `TurnReadingError` — `tools/margometer-tool-error.ts`
- `UserscriptBuildError` — `tools/margometer-tool-error.ts`

## Other classes

### `tests/`

- `Navigator` — `tests/ports/browser-surroundings.test.ts`

## Module constants

### `libs/`

- `ATTRIBUTE_EQUALS` — `libs/html-text.ts`
- `ATTRIBUTE_QUOTES` — `libs/html-text.ts`
- `BOGUS_COMMENT_OPENERS` — `libs/html-text.ts`
- `CODE_POINT_MAXIMUM` — `libs/html-text.ts`
- `COMMENT_CLOSE` — `libs/html-text.ts`
- `COMMENT_CLOSE_FROM` — `libs/html-text.ts`
- `COMMENT_OPEN` — `libs/html-text.ts`
- `CONTROLS_C1_FIRST` — `libs/html-text.ts`
- `CONTROLS_C1_LAST` — `libs/html-text.ts`
- `ESCAPE` — `libs/text-walk.ts`
- `FIELD_TYPE` — `libs/unknown-value.ts`
- `FIXED_MAGNITUDE_MAXIMUM` — `libs/number-text.ts`
- `HEXADECIMAL_DIGITS` — `libs/html-text.ts`
- `HEXADECIMAL_RADIX` — `libs/html-text.ts`
- `HTML_CHARACTERS_MAXIMUM` — `libs/html-text.ts`
- `INDENT_SPACES_MAXIMUM` — `libs/json-text.ts`
- `JAVASCRIPT_QUOTES` — `libs/text-walk.ts`
- `LITERAL_CHARACTERS_MAXIMUM` — `libs/text-walk.ts`
- `LOWER_CASE_OFFSET` — `libs/html-text.ts`
- `MINUS` — `libs/number-text.ts`
- `NAMED_REFERENCES` — `libs/html-text.ts`
- `NO_BREAK_SPACE_CODE_POINT` — `libs/html-text.ts`
- `NUMERIC_REFERENCE_CLOSE` — `libs/html-text.ts`
- `NUMERIC_REFERENCE_HEXADECIMAL` — `libs/html-text.ts`
- `NUMERIC_REFERENCE_OPEN` — `libs/html-text.ts`
- `PLACES_MAXIMUM` — `libs/number-text.ts`
- `POINT` — `libs/number-text.ts`
- `RAW_TEXT_ELEMENTS` — `libs/html-text.ts`
- `REFERENCE_DIGITS_MAXIMUM` — `libs/html-text.ts`
- `REFERENCE_OPEN` — `libs/html-text.ts`
- `RUN_CHARACTERS_MAXIMUM` — `libs/text-walk.ts`
- `SURROGATE_FIRST` — `libs/html-text.ts`
- `SURROGATE_LAST` — `libs/html-text.ts`
- `TAG_CLOSE` — `libs/html-text.ts`
- `TAG_NAME_OPENERS` — `libs/html-text.ts`
- `TAG_OPEN` — `libs/html-text.ts`
- `TAG_TERMINATOR` — `libs/html-text.ts`
- `WHITESPACE` — `libs/text-walk.ts`
- `ZERO` — `libs/html-text.ts`

### `src/core/`

- `AMBIGUOUS` — `src/core/combatant-roster.ts`
- `ANGUISH_KEY` — `src/core/protocol-key.ts`
- `APPLIED_SIGN` — `src/core/protocol-key.ts`
- `AURA_REACH` — `src/core/aura-standing.ts`
- `BATTLE_EVENT` — `src/core/battle-event.ts`
- `BLOWS_GRANTED_MAXIMUM` — `src/core/fight-decoder.ts`
- `BONUSES_PER_HOLDER_MAXIMUM` — `src/core/legendary-standing.ts`
- `CARRIERS_MAXIMUM` — `src/core/carried-status.ts`
- `CHARGED_SKILLS_MAXIMUM` — `src/core/charged-skill.ts`
- `CHARGED_SKILL_STATE` — `src/core/charged-skill.ts`
- `CHARGE_BROKEN_KEY` — `src/core/protocol-key.ts`
- `CLEANSE_KEY` — `src/core/protocol-key.ts`
- `COMBATANTS_MAXIMUM` — `src/core/combatant-roster.ts`
- `CRITICAL_KEY` — `src/core/protocol-key.ts`
- `CRITICAL_OF_KEY` — `src/core/protocol-key.ts`
- `CRITICAL_PROC_KEYS` — `src/core/protocol-key.ts`
- `CRITRED_KEY` — `src/core/protocol-key.ts`
- `CURSE_KEY` — `src/core/protocol-key.ts`
- `CUT_MAXIMUM` — `src/core/fight-statistics.ts`
- `DAMAGE_ELEMENT_PREFIX` — `src/core/fight-decoder.ts`
- `DAMAGE_HALF` — `src/core/protocol-key.ts`
- `DAMAGE_KEYS` — `src/core/protocol-key.ts`
- `DAMAGE_MARKER` — `src/core/protocol-key.ts`
- `DAMAGE_MARKER_AT` — `src/core/protocol-key.ts`
- `DECIMAL_BASE` — `src/core/combatant-health.ts`
- `DECLARATION_KEYS` — `src/core/protocol-key.ts`
- `DEFENCE_BY_DEFENCE` — `src/core/protocol-key.ts`
- `DEFENCE_BY_KEY` — `src/core/protocol-key.ts`
- `DEFENCE_MECHANISM` — `src/core/protocol-key.ts`
- `DESTROYED_KEYS` — `src/core/protocol-key.ts`
- `ENDS_MAXIMUM` — `src/core/fight-decoder.ts`
- `FACADE_KEY` — `src/core/protocol-key.ts`
- `GLARE_KEY` — `src/core/protocol-key.ts`
- `HALF_PLACE` — `src/core/combatant-health.ts`
- `HALVED_FOR_THE_CASTER` — `src/core/carried-figure.ts`
- `HASTE_AURA_KEY` — `src/core/protocol-key.ts`
- `HASTE_BIT_NAME` — `src/core/carried-figure.ts`
- `HEALING_REDUCER_KEY` — `src/core/protocol-key.ts`
- `HEALTH_CHANGE_BY_KEY` — `src/core/protocol-key.ts`
- `HEALTH_CHANGE_MEMBERS_MAXIMUM` — `src/core/fight-decoder.ts`
- `HEALTH_PERCENT_MAXIMUM` — `src/core/protocol-number.ts`
- `HEALTH_PERCENT_PLACES` — `src/core/protocol-number.ts`
- `HEAL_KEY` — `src/core/protocol-key.ts`
- `HOLDERS_MAXIMUM` — `src/core/legendary-standing.ts`
- `HOLYTOUCH_DECLARATION_KEY` — `src/core/protocol-key.ts`
- `HOLYTOUCH_HEALS_STATED` — `src/core/legendary-standing.ts`
- `HOLYTOUCH_HEAL_KEY` — `src/core/protocol-key.ts`
- `KEY_BY_BIT_NAME` — `src/core/carried-figure.ts`
- `KEY_FAMILY` — `src/core/protocol-key.ts`
- `KEY_MEANING_BY_KEY` — `src/core/protocol-key.ts`
- `KEY_REACH` — `src/core/protocol-key.ts`
- `KIND_ELEMENTS_SEPARATOR` — `src/core/fight-statistics.ts`
- `LASTHEAL_KEY` — `src/core/protocol-key.ts`
- `LEGENDARY_BONUS_BY_KEY` — `src/core/protocol-key.ts`
- `LEGENDARY_BONUS_SHOWING` — `src/core/protocol-key.ts`
- `MEMBER_SEPARATOR` — `src/core/fight-decoder.ts`
- `MESSAGES_MAXIMUM` — `src/core/fight-decoder.ts`
- `MESSAGE_END` — `src/core/fight-decoder.ts`
- `MESSAGE_PARTS_MAXIMUM` — `src/core/fight-decoder.ts`
- `NAMED_DAMAGE_MEMBERS` — `src/core/fight-decoder.ts`
- `NAMED_HEALING_MEMBERS` — `src/core/fight-decoder.ts`
- `NAME_LENGTH_MAXIMUM` — `src/core/fight-decoder.ts`
- `NAME_SEPARATOR` — `src/core/protocol-key.ts`
- `NOBODY` — `src/core/combatant-roster.ts`
- `NO_CARRIED_STATUS_WALK` — `src/core/carried-status.ts`
- `NO_COMBATANT` — `src/core/fight-decoder.ts`
- `NO_LEGENDARY_WALK` — `src/core/legendary-standing.ts`
- `NO_TURN_STANDING` — `src/core/turn-clock.ts`
- `NO_UNREAD` — `src/core/fight-session.ts`
- `NO_WINNER` — `src/core/fight-decoder.ts`
- `OUTCOME_RESULT` — `src/core/battle-event.ts`
- `PAYLOADS_MAXIMUM` — `src/core/fight-session.ts`
- `PERCENT_CLOSER` — `src/core/fight-decoder.ts`
- `PERCENT_OPENER` — `src/core/fight-decoder.ts`
- `PERCENT_WHOLE` — `src/core/combatant-health.ts`
- `POINT` — `src/core/protocol-number.ts`
- `PREPARE_KEY` — `src/core/protocol-key.ts`
- `PROCS_WITH_VALUE` — `src/core/protocol-key.ts`
- `PROC_END` — `src/core/protocol-key.ts`
- `PROC_END_BY_KEY` — `src/core/protocol-key.ts`
- `PROVOCATION_KEY` — `src/core/protocol-key.ts`
- `PUNCTURE_KEY` — `src/core/protocol-key.ts`
- `RAW_SIGN` — `src/core/protocol-key.ts`
- `REACH_BY_KEY` — `src/core/protocol-key.ts`
- `SEGMENTS_MAXIMUM` — `src/core/fight-decoder.ts`
- `SEGMENT_SEPARATOR` — `src/core/fight-decoder.ts`
- `SELF_SOURCED_HEALING_KEYS` — `src/core/protocol-key.ts`
- `SENTENCE_STOP` — `src/core/fight-decoder.ts`
- `SESSION_OPTIONS` — `src/core/fight-session.ts`
- `SESSION_PHASE` — `src/core/fight-session.ts`
- `SIDE_SEGMENTS` — `src/core/fight-decoder.ts`
- `SIDE_WIDE_ENDINGS` — `src/core/protocol-key.ts`
- `SIDE_WIDE_KEYS` — `src/core/protocol-key.ts`
- `SIDE_WIDE_OPENING` — `src/core/protocol-key.ts`
- `SKILLS_DATED_MAXIMUM` — `src/core/aura-standing.ts`
- `SKILLS_MAXIMUM` — `src/core/fight-statistics.ts`
- `SKILL_EFFECTS_MAXIMUM` — `src/core/aura-standing.ts`
- `SKILL_ID_KEY` — `src/core/protocol-key.ts`
- `SKILL_KEYS_READ_MAXIMUM` — `src/core/fight-decoder.ts`
- `SLOW_ALL_KEY` — `src/core/protocol-key.ts`
- `SLOW_BIT_NAME` — `src/core/carried-figure.ts`
- `SOURCES_COUNTED` — `src/core/carried-figure.ts`
- `STANDINGS_MAXIMUM` — `src/core/aura-standing.ts`
- `STATUS_BITS_MAXIMUM` — `src/core/carried-status.ts`
- `STEP_KEY` — `src/core/protocol-key.ts`
- `TEXT_KEY` — `src/core/protocol-key.ts`
- `TOTALLED_FIELDS` — `src/core/fight-statistics.ts`
- `TURN_LOST_SEPARATOR` — `src/core/fight-decoder.ts`
- `UNREAD_CAUSE` — `src/core/battle-event.ts`
- `UNREAD_COUNT_BY_CAUSE` — `src/core/fight-statistics.ts`
- `VALUELESS_DECLARATION_KEYS` — `src/core/protocol-key.ts`
- `VALUE_SEPARATOR` — `src/core/fight-decoder.ts`
- `VERYCRIT_KEY` — `src/core/protocol-key.ts`
- `WOUND_ANNOUNCEMENT_KEY` — `src/core/protocol-key.ts`
- `WOUND_TICK_KEY` — `src/core/protocol-key.ts`

### `src/ports/`

- `APPEND_METHOD` — `src/ports/margonem-engine-tooltip.ts`
- `BATTLE_FIELD` — `src/ports/margonem-engine-battle.ts`
- `BLOCK_LANDING` — `src/ports/margonem-engine-tooltip.ts`
- `BRAND` — `src/ports/browser-console.ts`
- `BUILD_CHARACTERS_MINIMUM` — `src/ports/margonem-client-build.ts`
- `BUILD_DASH` — `src/ports/margonem-client-build.ts`
- `BUILD_UNDERSCORE` — `src/ports/margonem-client-build.ts`
- `CALLS_MAXIMUM` — `src/ports/fight-capture.ts`
- `CHARGE_FIELDS` — `src/ports/payload-envelope.ts`
- `CLIENT_BREAK` — `src/ports/margonem-engine-tooltip.ts`
- `COPIED_KEYS` — `src/ports/margonem-engine-warriors.ts`
- `DAY_MAXIMUM` — `src/ports/browser-time.ts`
- `DIRECTION_SIGNS` — `src/ports/margonem-client-dictionary.ts`
- `DOWNLOAD_ANCHOR_CLASS` — `src/ports/browser-file.ts`
- `ENGINE_ASKERS` — `src/ports/margonem-engine-battle.ts`
- `ENGINE_CALL_FIELD` — `src/ports/margonem-engine-battle.ts`
- `ENGINE_FIELD` — `src/ports/margonem-engine-battle.ts`
- `ENGINE_FIELDS` — `src/ports/margonem-engine-battle.ts`
- `ENTRY_LENGTH_MAXIMUM` — `src/ports/margonem-client-dictionary.ts`
- `ENVELOPE_KEYS` — `src/ports/payload-envelope.ts`
- `FAILURES_MAXIMUM` — `src/ports/margonem-engine-battle.ts`
- `FILE_TYPE` — `src/ports/browser-file.ts`
- `FIND_METHOD` — `src/ports/margonem-engine-tooltip.ts`
- `FIRST_MONTH_OFFSET` — `src/ports/browser-time.ts`
- `FULL_STOP` — `src/ports/margonem-client-dictionary.ts`
- `HEALTH_FIELDS` — `src/ports/payload-envelope.ts`
- `HELD_FIELDS` — `src/ports/margonem-engine-battle.ts`
- `HERO_FIELDS` — `src/ports/margonem-engine-hero.ts`
- `HOLE_MARK` — `src/ports/margonem-client-dictionary.ts`
- `HOST_FIELD` — `src/ports/browser-surroundings.ts`
- `HOST_SEPARATOR` — `src/ports/browser-surroundings.ts`
- `HOUR_MAXIMUM` — `src/ports/browser-time.ts`
- `IDENTITY_KEYS` — `src/ports/margonem-engine-warriors.ts`
- `LOCATION_FIELD` — `src/ports/browser-surroundings.ts`
- `MARGONEM_VALUE` — `src/ports/margonem-value.ts`
- `MINUTE_MAXIMUM` — `src/ports/browser-time.ts`
- `MONTH_MAXIMUM` — `src/ports/browser-time.ts`
- `NAME_KEY` — `src/ports/margonem-engine-warriors.ts`
- `NAVIGATOR_FIELD` — `src/ports/browser-surroundings.ts`
- `NOTHING_CARRIED` — `src/ports/payload-envelope.ts`
- `OPTIONAL_SEPARATOR` — `src/ports/margonem-client-build.ts`
- `PLACE_FIELDS` — `src/ports/margonem-engine-place.ts`
- `QUEUE_ENTRIES_MAXIMUM` — `src/ports/payload-envelope.ts`
- `READ_METHOD` — `src/ports/margonem-engine-tooltip.ts`
- `REPLACE_METHOD` — `src/ports/margonem-engine-tooltip.ts`
- `ROWS_WRITTEN_MAXIMUM` — `src/ports/margonem-engine-tooltip.ts`
- `SCRIPTS_MAXIMUM` — `src/ports/margonem-client-build.ts`
- `SCRIPT_NAME_HEAD` — `src/ports/margonem-client-build.ts`
- `SCRIPT_NAME_LOOKS_MAXIMUM` — `src/ports/margonem-client-build.ts`
- `SCRIPT_NAME_TAIL` — `src/ports/margonem-client-build.ts`
- `SHALLOW_COPIED_KEYS` — `src/ports/margonem-engine-warriors.ts`
- `SHAPE_KEYS_MAXIMUM` — `src/ports/fight-capture.ts`
- `SHAPE_KEYS_PAST_MAXIMUM` — `src/ports/fight-capture.ts`
- `STORE_KEY` — `src/ports/browser-store.ts`
- `STORE_KEYS` — `src/ports/browser-store.ts`
- `STORE_VALUE_LENGTH_MAXIMUM` — `src/ports/browser-store.ts`
- `TELL_EVENT` — `src/ports/margonem-engine-tooltip.ts`
- `TELL_METHOD` — `src/ports/margonem-engine-tooltip.ts`
- `TOOLTIP_TARGETS` — `src/ports/margonem-engine-tooltip.ts`
- `TRANSLATE_FIELD` — `src/ports/margonem-client-dictionary.ts`
- `USER_AGENT_FIELD` — `src/ports/browser-surroundings.ts`
- `WARRIOR_COLLECTIONS` — `src/ports/margonem-engine-warriors.ts`
- `WARRIOR_ELEMENT_FIELD` — `src/ports/margonem-engine-tooltip.ts`
- `WARRIOR_FIELDS` — `src/ports/payload-envelope.ts`
- `WARRIOR_ID_KEY` — `src/ports/margonem-engine-warriors.ts`
- `WORLD_UNKNOWN` — `src/ports/browser-surroundings.ts`
- `WRAPPED_METHOD` — `src/ports/margonem-engine-battle.ts`
- `WRAP_MARKER` — `src/ports/margonem-engine-battle.ts`
- `WRAP_VERSION` — `src/ports/margonem-engine-battle.ts`

### `src/runtime/`

- `COUNT_MAXIMUM` — `src/runtime/defect-ledger.ts`
- `DEFECT_KIND` — `src/runtime/defect-ledger.ts`
- `FAILURE_FATE` — `src/runtime/failure-fate.ts`
- `FAILURE_FATES` — `src/runtime/failure-fate.ts`
- `FIGHT_FIELDS` — `src/runtime/shelf.ts`
- `FIGURES_CUT` — `src/runtime/panel-frame.ts`
- `FILE_FIELD` — `src/runtime/fight-file.ts`
- `FILE_FORMAT_VERSION` — `src/runtime/fight-file.ts`
- `FOLDED` — `src/runtime/settings.ts`
- `FOLD_SETTING_BY_WINDOW` — `src/runtime/settings.ts`
- `INDENT_SPACES` — `src/runtime/fight-file.ts`
- `KEPT_MAXIMUM` — `src/runtime/shelf.ts`
- `KINDS_COUNT` — `src/runtime/defect-ledger.ts`
- `LOOKS_MAXIMUM` — `src/runtime/margometer-runtime.ts`
- `LOOK_EVERY_MILLISECONDS` — `src/runtime/margometer-runtime.ts`
- `NOTHING_STATED` — `src/runtime/fight-file.ts`
- `PAIR_LENGTH_MAXIMUM` — `src/runtime/settings.ts`
- `PLACE_FIELDS` — `src/runtime/shelf.ts`
- `POSITION_FIELDS` — `src/runtime/settings.ts`
- `POSITION_SETTING_BY_WINDOW` — `src/runtime/settings.ts`
- `REPORT_KEY_BY_FIGHT_FIELD` — `src/runtime/fight-file.ts`
- `REPORT_KEY_BY_ROW_FIELD` — `src/runtime/fight-file.ts`
- `REPORT_KEY_BY_SKILL_FIELD` — `src/runtime/fight-file.ts`
- `ROWS_MAXIMUM` — `src/runtime/defect-ledger.ts`
- `SETTING_KEY` — `src/runtime/settings.ts`
- `SHELF_ANSWERS_MAXIMUM` — `src/runtime/shelf-keeper.ts`
- `SHELF_FIELDS` — `src/runtime/shelf.ts`
- `SHELF_KEY` — `src/runtime/shelf.ts`
- `SHELF_VERSION` — `src/runtime/shelf.ts`
- `SIZE_FIELDS` — `src/runtime/settings.ts`
- `SIZE_SETTING_BY_WINDOW` — `src/runtime/settings.ts`
- `STORAGE_DEFAULT` — `src/runtime/settings.ts`
- `STORE_KEY_BY_SETTING` — `src/runtime/settings.ts`
- `UNFOLDED` — `src/runtime/settings.ts`

### `src/ui/`

- `ADD_ON_NAME` — `src/ui/panel-words.ts`
- `APART_NOTE` — `src/ui/panel-words.ts`
- `AS_PERCENT` — `src/ui/panel-element.ts`
- `BACK_MARK` — `src/ui/panel-element.ts`
- `BAR_ICON` — `src/ui/panel-look.ts`
- `BAR_ICONS` — `src/ui/panel-look.ts`
- `BAR_ICON_DRAWINGS` — `src/ui/panel-look.ts`
- `BAR_ICON_INSET_PIXELS` — `src/ui/panel-look.ts`
- `BAR_TINT` — `src/ui/panel-look.ts`
- `CAP_WIDTH_PIXELS` — `src/ui/panel-look.ts`
- `CARDS_DRAWN_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_ATTRIBUTE` — `src/ui/panel-element.ts`
- `CARD_CUT_PARTS_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_EDGE` — `src/ui/panel-drag.ts`
- `CARD_ENDING_SEPARATOR` — `src/ui/panel-element.ts`
- `CARD_GROUPS_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_KEY_PLACE` — `src/ui/panel-element.ts`
- `CARD_LINE` — `src/ui/panel-element.ts`
- `CARD_LINES_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_METRIC_WORDS` — `src/ui/panel-words.ts`
- `CARD_NOTE_TONE` — `src/ui/panel-element.ts`
- `CARD_NOTE_TONE_CLASS` — `src/ui/panel-element.ts`
- `CARD_VARIABLES` — `src/ui/panel-look.ts`
- `CARD_WORDS` — `src/ui/panel-words.ts`
- `CAVEAT` — `src/ui/panel-words.ts`
- `CAVEATS` — `src/ui/panel-words.ts`
- `CAVEAT_LETTER` — `src/ui/panel-look.ts`
- `CAVEAT_MARK` — `src/ui/panel-words.ts`
- `CAVEAT_NOTES` — `src/ui/panel-words.ts`
- `CHANNEL_EXPONENT` — `src/ui/panel-look.ts`
- `CHANNEL_OFFSET` — `src/ui/panel-look.ts`
- `CHANNEL_VALUE_MAXIMUM` — `src/ui/panel-look.ts`
- `CHARACTERS_PER_LINE_BY_STEP` — `src/ui/panel-element.ts`
- `CHARGED_PIPS_MAXIMUM` — `src/ui/panel-element.ts`
- `CHARGED_ROWS_MAXIMUM` — `src/ui/panel-helper.ts`
- `CHARGED_SKILL_WORDS` — `src/ui/panel-words.ts`
- `CHOICE_REFUSED_ANSWER` — `src/ui/panel-words.ts`
- `CLASS` — `src/ui/panel-look.ts`
- `CLIENT_ID_BY_UNWORDED_KEY` — `src/ui/panel-words.ts`
- `CLIENT_LABEL_CHARACTERS_MAXIMUM` — `src/ui/panel-words.ts`
- `COUNTED_NOUN_WORDS` — `src/ui/panel-words.ts`
- `CRUMB_CARD_KEY` — `src/ui/panel-element.ts`
- `CUT_PARTS_MAXIMUM` — `src/ui/panel-content.ts`
- `DAY_MAXIMUM` — `src/ui/panel-words.ts`
- `DEFECTS_MAXIMUM` — `src/ui/panel-element.ts`
- `DEFECT_MARK` — `src/ui/panel-words.ts`
- `DEFECT_WORDS` — `src/ui/panel-words.ts`
- `DEFENCE_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `DESTROYED_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `DIRECTION_WORDS` — `src/ui/panel-words.ts`
- `EDGE_RELEASED` — `src/ui/panel-element.ts`
- `ELEMENT_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `EVENT_TYPE` — `src/ui/panel-document.ts`
- `EVERY_SLOT_PINNED_ANSWER` — `src/ui/panel-words.ts`
- `FEW_CEILING` — `src/ui/panel-words.ts`
- `FEW_FLOOR` — `src/ui/panel-words.ts`
- `FIGHT_CARD_KEY` — `src/ui/panel-element.ts`
- `FIGHT_CARD_WORDS` — `src/ui/panel-words.ts`
- `FILL_PLACES` — `src/ui/panel-element.ts`
- `FIRST_DAY` — `src/ui/panel-words.ts`
- `FIRST_MONTH` — `src/ui/panel-words.ts`
- `FOLD_MARK` — `src/ui/panel-element.ts`
- `FONT_STACK` — `src/ui/panel-look.ts`
- `GRAB_KIND` — `src/ui/panel-drag.ts`
- `GRIP_ATTRIBUTE` — `src/ui/panel-drag.ts`
- `GRIP_MARK` — `src/ui/panel-element.ts`
- `HALF_NAMED_FIELD` — `src/ui/panel-content.ts`
- `HALF_NAMED_KIND_FIELD` — `src/ui/panel-content.ts`
- `HALF_NAMED_OPENED` — `src/ui/panel-content.ts`
- `HALF_NAMED_TOTAL_FIELD` — `src/ui/panel-content.ts`
- `HALF_NAMED_TOTAL_FIELD_BY_METRIC` — `src/ui/panel-content.ts`
- `HEADING_LETTER_SPACING_EM` — `src/ui/panel-look.ts`
- `HEADING_TINT` — `src/ui/panel-look.ts`
- `HEALTH_LOSS_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `HEALTH_SOURCE_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `HELPER_ABSENCE` — `src/ui/panel-helper.ts`
- `HELPER_ABSENCE_WORDS` — `src/ui/panel-words.ts`
- `HELPER_CARD_PREFIX` — `src/ui/panel-element.ts`
- `HELPER_CHARGE_CARD_PREFIX` — `src/ui/panel-element.ts`
- `HELPER_HELD_CARD_PREFIX` — `src/ui/panel-element.ts`
- `HELPER_HOLDING_CARD_PREFIX` — `src/ui/panel-element.ts`
- `HELPER_NOW_CARD_KEY` — `src/ui/panel-element.ts`
- `HELPER_WORDS` — `src/ui/panel-words.ts`
- `HEX_BASE` — `src/ui/panel-palette.ts`
- `HOST_NAME` — `src/ui/panel-element.ts`
- `HOUR_MAXIMUM` — `src/ui/panel-words.ts`
- `HUNDRED` — `src/ui/panel-words.ts`
- `KIND_WORDS` — `src/ui/panel-screen.ts`
- `LABEL_CHARACTERS_MAXIMUM` — `src/ui/panel-words.ts`
- `LAYER` — `src/ui/panel-look.ts`
- `LEADING_STATUS_NAMES` — `src/ui/panel-words.ts`
- `LEGENDARY_BONUS_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `LISTS_KEPT_MAXIMUM` — `src/ui/panel-element.ts`
- `LIST_ROWS_SIZED_MINIMUM` — `src/ui/panel-look.ts`
- `LIVE_FIGHT_MARK` — `src/ui/panel-intent.ts`
- `LIVE_FIGHT_WORDS` — `src/ui/panel-words.ts`
- `LOW_CHANNEL` — `src/ui/panel-look.ts`
- `LOW_SLOPE` — `src/ui/panel-look.ts`
- `LUMINANCE_OFFSET` — `src/ui/panel-look.ts`
- `LUMINANCE_WEIGHTS` — `src/ui/panel-look.ts`
- `MARKUP_ENTITY` — `src/ui/panel-words.ts`
- `MARKUP_OPENER` — `src/ui/panel-words.ts`
- `MASK_INK` — `src/ui/panel-look.ts`
- `MASK_STRIPE_PIXELS` — `src/ui/panel-look.ts`
- `METER_HEIGHT_VIEWPORT_PERCENT_MAXIMUM` — `src/ui/panel-look.ts`
- `MINUS_SIGN` — `src/ui/panel-words.ts`
- `MINUTE_MAXIMUM` — `src/ui/panel-words.ts`
- `MONTH_WORDS` — `src/ui/panel-words.ts`
- `MOVE_REFUSED_ANSWER` — `src/ui/panel-words.ts`
- `NAMED_ROWS_MAXIMUM` — `src/ui/panel-words.ts`
- `NEITHER_END_WORDS` — `src/ui/panel-words.ts`
- `NOBODY_TO_PAY` — `src/ui/panel-words.ts`
- `NOTE_MARK_CHARACTERS` — `src/ui/panel-element.ts`
- `NOTHING_SUSPECT` — `src/ui/panel-content.ts`
- `NOTHING_WORDS` — `src/ui/panel-words.ts`
- `NOUN_WORDS` — `src/ui/panel-words.ts`
- `NO_KIND_NOTES` — `src/ui/panel-words.ts`
- `NO_SELECTION` — `src/ui/panel-look.ts`
- `NO_WINDOW_SIZES` — `src/ui/panel-choice.ts`
- `OPENED_PART` — `src/ui/panel-screen.ts`
- `OPENED_UNNAMED_CASES` — `src/ui/panel-content.ts`
- `OPENED_UNNAMED_STANDING_NOTES` — `src/ui/panel-words.ts`
- `OPPONENT_WORDS` — `src/ui/panel-screen.ts`
- `OPTIONS_LIST_NAME` — `src/ui/panel-screen.ts`
- `OPTIONS_MARK` — `src/ui/panel-element.ts`
- `OUTCOME_INK_CLASS` — `src/ui/panel-element.ts`
- `OUTCOME_LETTERS` — `src/ui/panel-words.ts`
- `OUTCOME_WORDS` — `src/ui/panel-words.ts`
- `PALETTE_COLOURS` — `src/ui/panel-palette.ts`
- `PALETTE_INDEX_BY_PROFESSION` — `src/ui/panel-palette.ts`
- `PANEL_DEFECT_KIND` — `src/ui/panel-words.ts`
- `PANEL_DIRECTION` — `src/ui/panel-screen.ts`
- `PANEL_INTENT` — `src/ui/panel-intent.ts`
- `PANEL_LISTENER` — `src/ui/view-failure.ts`
- `PANEL_MARK` — `src/ui/panel-intent.ts`
- `PANEL_METRIC` — `src/ui/panel-screen.ts`
- `PANEL_NOUN` — `src/ui/panel-screen.ts`
- `PANEL_REGION` — `src/ui/panel-words.ts`
- `PANEL_WINDOW` — `src/ui/panel-choice.ts`
- `PANEL_WINDOWS` — `src/ui/panel-choice.ts`
- `PANEL_WORDS` — `src/ui/panel-words.ts`
- `PINNED_CASE` — `src/ui/panel-content.ts`
- `PINNED_CASES` — `src/ui/panel-content.ts`
- `PINNED_PLACING` — `src/ui/panel-content.ts`
- `PINNED_PLACING_NOTES` — `src/ui/panel-words.ts`
- `PINNED_SCOPE_NOTES` — `src/ui/panel-words.ts`
- `PINNED_SHAPES` — `src/ui/panel-content.ts`
- `PIN_MARK` — `src/ui/panel-element.ts`
- `PIN_REFUSED_ANSWER` — `src/ui/panel-words.ts`
- `PLACE` — `src/ui/panel-look.ts`
- `PLAIN_MARK` — `src/ui/panel-intent.ts`
- `PRIMARY_BUTTON` — `src/ui/panel-element.ts`
- `PROC_SUB_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `PROC_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `PROFESSION_WORD_BY_KEY` — `src/ui/panel-words.ts`
- `PROVOKED_MAXIMUM` — `src/ui/panel-helper.ts`
- `RANKING_ROWS` — `src/ui/panel-content.ts`
- `REGION_WORDS` — `src/ui/panel-words.ts`
- `ROWS_BESIDE_THE_STATUSES` — `src/ui/panel-words.ts`
- `ROWS_BY_DEFAULT` — `src/ui/panel-look.ts`
- `ROWS_BY_WINDOW_MINIMUM` — `src/ui/panel-drag.ts`
- `ROWS_MAXIMUM` — `src/ui/panel-content.ts`
- `ROWS_SHELF` — `src/ui/panel-element.ts`
- `ROWS_VARIABLE` — `src/ui/panel-look.ts`
- `ROWS_WAITING` — `src/ui/panel-element.ts`
- `ROW_INK_DROP_PIXELS` — `src/ui/panel-look.ts`
- `ROW_SIDE_WIDTH_PIXELS` — `src/ui/panel-look.ts`
- `ROW_WARNINGS_MAXIMUM` — `src/ui/panel-content.ts`
- `RULE_WIDTH_PIXELS` — `src/ui/panel-look.ts`
- `SAVE_MARK` — `src/ui/panel-element.ts`
- `SCREEN_AXES` — `src/ui/panel-screen.ts`
- `SCREEN_ORDER` — `src/ui/panel-screen.ts`
- `SHAPE` — `src/ui/panel-look.ts`
- `SHARES_MAXIMUM` — `src/ui/panel-words.ts`
- `SHARE_FLOOR` — `src/ui/panel-words.ts`
- `SHELF_LIST_NAME` — `src/ui/panel-screen.ts`
- `SHELF_MARK` — `src/ui/panel-element.ts`
- `SHELF_ROWS_MAXIMUM` — `src/ui/panel-element.ts`
- `SIDES_TRACK_HEIGHT_PIXELS` — `src/ui/panel-look.ts`
- `SIDE_CHOICE` — `src/ui/panel-screen.ts`
- `SIDE_CHOICES` — `src/ui/panel-screen.ts`
- `SIDE_PART_WORDS` — `src/ui/panel-words.ts`
- `SIDE_RELATION` — `src/ui/panel-content.ts`
- `SIDE_ROWS` — `src/ui/panel-content.ts`
- `SIDE_WORDS` — `src/ui/panel-words.ts`
- `SIGNAL` — `src/ui/panel-palette.ts`
- `SIZED_METER_VARIABLES` — `src/ui/panel-look.ts`
- `SIZE_GRIP` — `src/ui/panel-look.ts`
- `SIZE_GRIP_ATTRIBUTE` — `src/ui/panel-drag.ts`
- `SIZE_VARIABLES` — `src/ui/panel-look.ts`
- `SKILLS_MAXIMUM` — `src/ui/panel-content.ts`
- `SPACE_PIXELS` — `src/ui/panel-look.ts`
- `STANDING_TURN_STATE` — `src/ui/panel-helper.ts`
- `STATUS_CATEGORY` — `src/ui/panel-words.ts`
- `STORAGE_CHOICE` — `src/ui/panel-choice.ts`
- `STORAGE_CHOICES` — `src/ui/panel-choice.ts`
- `STORAGE_MEANING_WORDS` — `src/ui/panel-words.ts`
- `STORAGE_WORDS` — `src/ui/panel-words.ts`
- `STORE_MADE_ROOM_ANSWER` — `src/ui/panel-words.ts`
- `STORE_REFUSED_ANSWER` — `src/ui/panel-words.ts`
- `STRIP_PADDING_DOWN_PIXELS` — `src/ui/panel-look.ts`
- `STYLE_ATTRIBUTE` — `src/ui/panel-document.ts`
- `SURFACE` — `src/ui/panel-look.ts`
- `SUSPECT_MARK` — `src/ui/panel-words.ts`
- `TEEN_CEILING` — `src/ui/panel-words.ts`
- `TEEN_FLOOR` — `src/ui/panel-words.ts`
- `TEN` — `src/ui/panel-words.ts`
- `TEXT` — `src/ui/panel-look.ts`
- `THOUSAND_DIGITS` — `src/ui/panel-words.ts`
- `THOUSAND_GROUPS_MAXIMUM` — `src/ui/panel-words.ts`
- `THOUSAND_SEPARATOR` — `src/ui/panel-words.ts`
- `TITLE_ATTRIBUTE` — `src/ui/panel-element.ts`
- `TITLE_LETTER_SPACING_EM` — `src/ui/panel-look.ts`
- `TOOLTIP_WORDS` — `src/ui/panel-words.ts`
- `TOP_VARIABLES` — `src/ui/panel-look.ts`
- `TURN_MARK` — `src/ui/panel-words.ts`
- `TURN_STATE_WORDS` — `src/ui/panel-words.ts`
- `TWO_DIGITS` — `src/ui/panel-words.ts`
- `TYPE_STEP` — `src/ui/panel-choice.ts`
- `TYPE_STEPS` — `src/ui/panel-choice.ts`
- `TYPE_STEP_DEFAULT` — `src/ui/panel-choice.ts`
- `TYPE_STEP_WORDS` — `src/ui/panel-words.ts`
- `TYPE_TOKENS` — `src/ui/panel-look.ts`
- `UNANNOUNCED_CAVEATS` — `src/ui/panel-words.ts`
- `UNANNOUNCED_WORDS` — `src/ui/panel-words.ts`
- `UNDRAWN_MAXIMUM` — `src/ui/panel-element.ts`
- `UNFOLD_MARK` — `src/ui/panel-element.ts`
- `UNNAMED_END` — `src/ui/panel-content.ts`
- `UNNAMED_ENDS` — `src/ui/panel-intent.ts`
- `UNNAMED_END_NOTES` — `src/ui/panel-words.ts`
- `UNPINNED_MARK` — `src/ui/panel-element.ts`
- `VARIABLE_PREFIX` — `src/ui/panel-look.ts`
- `VERSION_ATTRIBUTE` — `src/ui/panel-element.ts`
- `VISIBLE_PIXELS_MINIMUM` — `src/ui/panel-drag.ts`
- `WAITING_LIST_NAME` — `src/ui/panel-element.ts`
- `WARNINGS_MAXIMUM` — `src/ui/panel-content.ts`
- `WIDTH_TIMES_TYPE_MAXIMUM` — `src/ui/panel-drag.ts`
- `WINDOW_WORDS` — `src/ui/panel-words.ts`

### `src/`

- `ANCHOR_TAG` — `src/userscript-entry.ts`
- `BROWSER_WINDOW_PART` — `src/userscript-entry.ts`
- `BUILD_VERSION` — `src/build-version.ts`
- `SCRIPT_WITH_SOURCE` — `src/userscript-entry.ts`
- `WINDOW_FUNCTIONS` — `src/userscript-entry.ts`

### `frozen/`

- `FROZEN_AURA_TURNS` — `frozen/aura-turns.ts`
- `FROZEN_BLOWS_GRANTED` — `frozen/blows-granted.ts`
- `FROZEN_HELP_PHRASES` — `frozen/help-phrases.ts`
- `FROZEN_PROTOCOL_KEYS` — `frozen/protocol-keys.ts`
- `FROZEN_SKILL_DURATIONS` — `frozen/skill-durations.ts`
- `FROZEN_STATUS_BITS` — `frozen/status-bits.ts`

### `tools/`

- `ACTS` — `tools/fabricated-fight.ts`
- `ADMITTED_MAXIMUM` — `tools/capture-intake.ts`
- `AMBIENT_WAYS_OUT` — `tools/build-userscript.ts`
- `ANNOUNCEMENT_FAMILIES` — `tools/protocol-key-shape.ts`
- `ARGUMENTS_MAXIMUM` — in 4 files: `tools/`
- `ARGUMENT_SEPARATOR` — `tools/status-bit-table.ts`
- `ARMOUR_BASE` — `tools/fabricated-fight.ts`
- `ARMOUR_DAMAGE` — `tools/fabricated-fight.ts`
- `ARMOUR_DAMAGE_PIERCED` — `tools/fabricated-fight.ts`
- `AURA_SKILLS` — `tools/fabricated-fight.ts`
- `BACKTICK` — `tools/help-claim-register.ts`
- `BARD_SONG` — `tools/fabricated-fight.ts`
- `BASELINE_TURN` — `tools/shout-holding.ts`
- `BATTLE_EVENTS` — `tools/decoding-status.ts`
- `BLOCK_CLOSE` — `tools/protocol-key-table.ts`
- `BLOCK_COMMENT_CLOSE` — `tools/build-userscript.ts`
- `BLOCK_COMMENT_OPEN` — `tools/build-userscript.ts`
- `BLOCK_OPEN` — `tools/protocol-key-table.ts`
- `BLOWS_GRANTED_KEY` — `tools/skill-table.ts`
- `BOLD` — `tools/protocol-key-shape.ts`
- `BROWSER_VARIABLE` — `tools/panel-shots.ts`
- `BUNDLE_ENTRY` — `tools/build-userscript.ts`
- `BUNDLE_NAME` — `tools/margonem-client-source.ts`
- `BUNDLE_SOURCE_PATHS` — `tools/preview-server.ts`
- `CACHE_DIRECTORY` — `tools/develop-reports.ts`
- `CACHE_ROOT` — `tools/help-article.ts`, `tools/margonem-client-source.ts`, `tools/skill-table.ts`
- `CALL_BEFORE_ENGLISH` — `tools/capture-intake.ts`
- `CALL_CLOSE` — `tools/status-bit-table.ts`
- `CALL_OPEN` — `tools/status-bit-table.ts`
- `CAPTION_WIDTH` — `tools/decoding-status.ts`, `tools/fight-figures.ts`
- `CARDS_MAXIMUM` — `tools/card-height.ts`
- `CARD_ANCHOR` — `tools/panel-giving-way.ts`
- `CARD_INDENT` — `tools/panel-giving-way.ts`
- `CASES_FLAG` — `tools/aura-lifetime.ts`
- `CASE_KEYWORD` — `tools/protocol-key-table.ts`
- `CASE_KEY_SEPARATOR` — `tools/drill-report.ts`
- `CASE_LABELS_MAXIMUM` — `tools/protocol-key-table.ts`
- `CELLS_MAXIMUM` — `tools/skill-table.ts`
- `CELL_CLOSE` — `tools/skill-table.ts`
- `CELL_OPEN` — `tools/skill-table.ts`
- `CHANGELOG_FILE` — `tools/changelog.ts`
- `CHANGELOG_LINES_MAXIMUM` — `tools/changelog.ts`
- `CHANNEL` — `tools/margonem-readings.ts`
- `CHANNEL_HOSTS` — `tools/margonem-client-source.ts`
- `CHARGED_SKILL` — `tools/fabricated-fight.ts`
- `CHOICE_PER_ROUND` — `tools/fabricated-fight.ts`
- `CLAIMS_MAXIMUM` — `tools/protocol-key-shape.ts`
- `CLAIMS_PER_LINE` — `tools/protocol-key-shape.ts`
- `CLAIM_SEPARATOR` — `tools/protocol-key-shape.ts`
- `CLIENT_FIELDS` — `tools/fabricated-fight.ts`
- `CLOSING_SHOUTS` — `tools/fabricated-fight.ts`
- `CLOSING_SHOUTS_FLAG` — `tools/fabricated-fight.ts`
- `CLOSING_SHOUTS_SUFFIX` — `tools/fabricated-fight.ts`
- `COLUMNS` — `tools/skill-table.ts`
- `COLUMN_AIR_PIXELS` — `tools/preview-page.ts`
- `COLUMN_WIDTH` — `tools/turn-count.ts`
- `COLUMN_WIDTH_MAXIMUM` — `tools/preview-page.ts`
- `COMPARED_CELLS_MAXIMUM` — `tools/develop-reports.ts`
- `COMPLETE_MARK` — `tools/develop-reports.ts`
- `CONFIGURATION_FILE` — `tools/build-userscript.ts`
- `CONTEXT_CHARACTERS` — `tools/help-article.ts`
- `COUNT_RULE_STATED` — `tools/protocol-key-shape.ts`
- `COUNT_WIDTH` — in 5 files: `tools/`
- `COUNT_WORDS` — `tools/protocol-key-shape.ts`
- `DAMAGE_FAMILY_HEADING` — `tools/protocol-key-shape.ts`
- `DATED_MINUTE_LENGTH` — `tools/build-userscript.ts`
- `DATE_INDENT` — `tools/frozen-files.ts`
- `DATE_NOTE` — `tools/skill-table.ts`
- `DATE_SEPARATOR` — `tools/frozen-files.ts`
- `DAY_SHAPE` — `tools/capture-intake.ts`
- `DECODER_TABLES` — `tools/recorded-material.ts`
- `DECODING_TASK` — `tools/develop-reports.ts`
- `DEFAULT_BRANCH_FIELD` — `tools/protocol-key-table.ts`
- `DEFAULT_BRANCH_SHAPES` — `tools/protocol-key-table.ts`
- `DESCRIPTION_FIELD` — `tools/capture-intake.ts`
- `DETAIL_INDENT` — `tools/fight-figures.ts`
- `DEVELOPMENT_METADATA_NAME` — `tools/preview-server.ts`
- `DEVELOPMENT_SUFFIX` — `tools/build-userscript.ts`
- `DEVELOPMENT_USERSCRIPT_NAME` — `tools/preview-server.ts`
- `DEVELOP_PATHS` — `tools/develop-reports.ts`
- `DEVELOP_RECORDINGS` — `tools/develop-reports.ts`
- `DIGITS` — `tools/build-userscript.ts`
- `DIRECTIVE_KEY_WIDTH` — `tools/build-userscript.ts`
- `DRILL_ROW` — `tools/drill-report.ts`
- `DRILL_ROWS` — `tools/drill-report.ts`
- `DRILL_RUNG` — `tools/drill-report.ts`
- `DRILL_RUNGS` — `tools/drill-report.ts`
- `DRILL_VERDICT` — `tools/drill-report.ts`
- `DRILL_VERDICTS` — `tools/drill-report.ts`
- `DURATION_MARKER` — `tools/skill-table.ts`
- `EFFECTS_COLUMN` — `tools/skill-table.ts`
- `EFFECTS_MAXIMUM` — `tools/skill-table.ts`
- `EFFECT_ASSIGNMENT` — `tools/skill-table.ts`
- `EFFECT_TERMINATOR` — `tools/skill-table.ts`
- `ELEMENTS` — `tools/fabricated-fight.ts`
- `ENDING_FLAG` — `tools/fabricated-fight.ts`
- `ENERGY_STATED` — `tools/fabricated-fight.ts`
- `ENVELOPE_BEFORE_ENGLISH` — `tools/capture-intake.ts`
- `EPISODES_MAXIMUM` — `tools/shout-holding.ts`
- `ESCAPE` — `tools/build-userscript.ts`, `tools/protocol-key-table.ts`
- `EXIT_AHEAD` — `tools/margonem-readings.ts`
- `EXIT_STALE` — `tools/margonem-readings.ts`
- `EXIT_UNASKED` — `tools/margonem-readings.ts`
- `FABRICATED_AT` — `tools/fabricated-fight.ts`
- `FABRICATED_DIRECTORY` — `tools/fabricated-fight.ts`
- `FABRICATED_WORLD` — `tools/fabricated-fight.ts`
- `FABRICATION_ENDING` — `tools/fabricated-fight.ts`
- `FABRICATION_ENDINGS` — `tools/fabricated-fight.ts`
- `FABRICATION_FIELDS` — `tools/fabricated-fight.ts`
- `FABRICATION_SCRIPT` — `tools/fabricated-fight.ts`
- `FAILURE_LINE` — `tools/preview-server.ts`
- `FIELDS_PER_SKILL` — `tools/capture-intake.ts`
- `FIGURES_TASK` — `tools/develop-reports.ts`
- `FIGURE_PER_PLACE` — `tools/fabricated-fight.ts`
- `FIGURE_PER_ROUND` — `tools/fabricated-fight.ts`
- `FIGURE_PLACES` — `tools/fabricated-fight.ts`
- `FIGURE_RAW_BASE` — `tools/fabricated-fight.ts`
- `FILE_FORMAT_VERSION` — `tools/fabricated-fight.ts`
- `FILE_SUFFIX` — `tools/fabricated-fight.ts`
- `FLAG_FABRICATED` — `tools/preview-server.ts`
- `FLAG_FIGHT` — `tools/preview-server.ts`
- `FLAG_FROM` — `tools/preview-server.ts`
- `FLAG_PORT` — `tools/preview-server.ts`
- `FLED_KEY` — `tools/fabricated-fight.ts`
- `FRAGMENTS_SHOWN` — `tools/help-article.ts`
- `FROM_PATHS_MAXIMUM` — `tools/preview-server.ts`
- `FROZEN_AURA_BANNER` — `tools/skill-table.ts`
- `FROZEN_AURA_PATH` — `tools/skill-table.ts`
- `FROZEN_BLOWS_BANNER` — `tools/skill-table.ts`
- `FROZEN_BLOWS_PATH` — `tools/skill-table.ts`
- `FROZEN_DATE_FIELD` — in 4 files: `tools/`
- `FROZEN_DIRECTORY` — `tools/frozen-files.ts`
- `FROZEN_HELP_BANNER` — `tools/help-article.ts`
- `FROZEN_KEY_BANNER` — `tools/protocol-key-table.ts`
- `FROZEN_PATH` — in 4 files: `tools/`
- `FROZEN_SKILL_BANNER` — `tools/skill-table.ts`
- `FROZEN_STATUS_BANNER` — `tools/status-bit-table.ts`
- `GIVING_WAY_MARKER` — `tools/panel-giving-way.ts`
- `GIVING_WAY_REGIONS` — `tools/panel-giving-way.ts`
- `GRID_PLACES` — `tools/fabricated-fight.ts`
- `HEADINGS` — `tools/fight-figures.ts`
- `HEADING_CLOSE` — `tools/develop-reports.ts`
- `HEADING_OPEN` — `tools/develop-reports.ts`
- `HEADING_OPENER` — `tools/protocol-key-shape.ts`
- `HEALTH_BASE` — `tools/fabricated-fight.ts`
- `HEALTH_PER_LEVEL` — `tools/fabricated-fight.ts`
- `HEALTH_STEP` — `tools/fabricated-fight.ts`
- `HELP_HOST` — `tools/help-article.ts`
- `HELP_MARKERS` — `tools/help-claim-register.ts`
- `HOMEPAGE` — `tools/build-userscript.ts`, `tools/preview-site.ts`
- `HTML_TYPE` — `tools/preview-server.ts`
- `IDENTITY_COLUMN` — `tools/skill-table.ts`
- `INDENT_SPACES` — in 5 files: `tools/`
- `INLINE_SCHEME` — `tools/build-userscript.ts`
- `INSTALL_NEEDS_MAXIMUM` — `tools/preview-page.ts`
- `INTAKE_KEYS` — `tools/recorded-material.ts`
- `INTO_DEFAULT` — `tools/panel-giving-way.ts`
- `ISO_MINUTE_LENGTH` — `tools/build-userscript.ts`
- `KEEP_ALIVE_EVERY_MILLISECONDS` — `tools/preview-server.ts`
- `KEPT_BREAK` — `tools/capture-intake.ts`
- `KEYS_MAXIMUM` — `tools/protocol-key-shape.ts`
- `KEYS_SHOWN_WIDTH` — `tools/turn-reading.ts`
- `KEY_COLUMN` — `tools/protocol-key-shape.ts`
- `KEY_PLACEMENT` — `tools/protocol-key-shape.ts`
- `KEY_PLACEMENTS` — `tools/protocol-key-shape.ts`
- `KEY_VALUE` — `tools/protocol-key-shape.ts`
- `KEY_VALUES` — `tools/protocol-key-shape.ts`
- `KEY_WIDTH` — `tools/aura-standing.ts`, `tools/turn-reading.ts`
- `LABEL_TERMINATOR` — `tools/protocol-key-table.ts`
- `LANDING_PAGE` — `tools/preview-site.ts`
- `LANDING_RECORDING` — `tools/preview-site.ts`
- `LEAF_WORD` — `tools/drill-report.ts`
- `LEVEL_DEFAULT` — `tools/fabricated-fight.ts`
- `LEVEL_FLAG` — `tools/fabricated-fight.ts`
- `LEVEL_MAXIMUM` — `tools/fabricated-fight.ts`
- `LEVEL_SEPARATOR` — `tools/skill-table.ts`
- `LEVEL_STEP` — `tools/fabricated-fight.ts`
- `LINES_MAXIMUM` — `tools/develop-reports.ts`
- `LINE_CHANGE` — `tools/develop-reports.ts`
- `LINE_COMMENT` — `tools/build-userscript.ts`
- `LISTENERS_MAXIMUM` — `tools/preview-server.ts`
- `LOCALE` — `tools/help-article.ts`
- `LOOKS_MAXIMUM` — `tools/protocol-key-table.ts`, `tools/status-bit-table.ts`
- `LOOT_SENTENCE` — `tools/fabricated-fight.ts`
- `MANA_STATED` — `tools/fabricated-fight.ts`
- `MANIFEST_FIELDS` — `tools/margonem-client-source.ts`
- `MANIFEST_NAME` — `tools/help-article.ts`, `tools/margonem-client-source.ts`,
  `tools/skill-table.ts`
- `MARGONEM_CHANNEL` — `tools/margonem-client-source.ts`
- `MARGONEM_CHANNELS` — `tools/margonem-client-source.ts`
- `MARGONEM_DOMAINS` — `tools/build-userscript.ts`
- `MARGONEM_PAGE_COLOUR` — `tools/preview-page.ts`
- `MECHANICS_ARTICLE` — `tools/help-article.ts`
- `METADATA_DOWNLOAD_ADDRESS` — `tools/build-userscript.ts`
- `METADATA_NAME` — `tools/build-userscript.ts`
- `MICROSECONDS_PER_MILLISECOND` — `tools/payload-cost.ts`
- `MILLISECONDS_PER_DAY` — `tools/help-article.ts`
- `NAMES_MAXIMUM` — `tools/capture-intake.ts`
- `NAME_CHARACTERS` — `tools/protocol-key-table.ts`
- `NAME_COLUMN` — `tools/margonem-readings.ts`
- `NAME_EDGES` — `tools/capture-intake.ts`
- `NAME_WIDTH` — in 5 files: `tools/`
- `NOBODY_NAMED` — `tools/drill-report.ts`
- `NON_WORLD_HOSTS` — `tools/build-userscript.ts`
- `NOTHING` — `tools/fight-figures.ts`
- `NOTHING_ARGUMENT` — `tools/status-bit-table.ts`
- `NOTHING_CACHED` — `tools/margonem-readings.ts`
- `NOTHING_SETTLES` — `tools/aura-standing.ts`
- `NO_SHARE` — `tools/shout-holding.ts`
- `NO_STRETCH` — `tools/turn-count.ts`
- `NUMBER_WIDTH` — `tools/fight-figures.ts`
- `OCCURRENCE_CLAIM` — `tools/help-claim-register.ts`
- `OCCURRENCE_STEM` — `tools/protocol-key-shape.ts`
- `OCCURRENCE_WORD` — `tools/protocol-key-shape.ts`
- `OFFERED_MAXIMUM` — `tools/capture-intake.ts`
- `OPENER_WIDTH` — `tools/turn-reading.ts`
- `OPENING_HOLD_MILLISECONDS` — `tools/preview-site.ts`
- `OPENING_STEP_MILLISECONDS` — `tools/preview-site.ts`
- `OPENS_WORD` — `tools/drill-report.ts`
- `OPPOSING_SIDE` — `tools/fabricated-fight.ts`
- `OPPOSING_SIDE_ID_FIRST` — `tools/fabricated-fight.ts`
- `OUTBOUND_CALLS` — `tools/build-userscript.ts`
- `OUTCOME_LOSER_KEY` — `tools/fabricated-fight.ts`
- `OUTCOME_WINNER_KEY` — `tools/fabricated-fight.ts`
- `OUTPUT_DEFAULT` — `tools/fabricated-fight.ts`
- `OUTPUT_DIRECTORY` — `tools/build-userscript.ts`, `tools/preview-site.ts`
- `OUTPUT_FLAG` — `tools/fabricated-fight.ts`
- `PAGE_NAME` — `tools/skill-table.ts`
- `PANEL_FILE` — `tools/panel-giving-way.ts`
- `PARENT` — `tools/panel-giving-way.ts`
- `PART_WIDTH` — `tools/drill-report.ts`
- `PATH_SEPARATOR` — `tools/fabricated-fight.ts`
- `PERCENTILE_TAIL` — `tools/payload-cost.ts`
- `PER_SIDE_DEFAULT` — `tools/fabricated-fight.ts`
- `PER_SIDE_FLAG` — `tools/fabricated-fight.ts`
- `PER_SIDE_MAXIMUM` — `tools/fabricated-fight.ts`
- `PHRASES_MAXIMUM` — `tools/help-claim-register.ts`
- `PLACEMENT_COLUMN` — `tools/protocol-key-shape.ts`
- `PLAIN_SKILLS` — `tools/fabricated-fight.ts`
- `PLAY_SECONDS` — `tools/preview-page.ts`
- `PLAY_STEP_MILLISECONDS_MAXIMUM` — `tools/preview-page.ts`
- `PLAY_STEP_MILLISECONDS_MINIMUM` — `tools/preview-page.ts`
- `PORT_DEFAULT` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `PORT_MAXIMUM` — `tools/preview-server.ts`
- `PREVIEW_CHANNEL` — `tools/margonem-readings.ts`
- `PREVIEW_HOSTNAME` — `tools/preview-server.ts`
- `PREVIEW_INSTALL_OPENING` — `tools/preview-page.ts`
- `PREVIEW_SAID_SELECTOR` — `tools/preview-page.ts`
- `PREVIEW_SITE_INTRODUCTION` — `tools/preview-site.ts`
- `PREVIEW_SITE_WORDS` — `tools/preview-site.ts`
- `PREVIEW_SPLIT_SELECTOR` — `tools/preview-page.ts`
- `PREVIEW_STRIP_LAYER` — `tools/preview-page.ts`
- `PREVIEW_STRIP_SELECTOR` — `tools/preview-page.ts`
- `PREVIEW_TIPS_ID` — `tools/preview-page.ts`
- `PREVIEW_TIPS_LAYER` — `tools/preview-page.ts`
- `PREVIEW_TIPS_WIDTH_PIXELS` — `tools/preview-page.ts`
- `PREVIEW_WORDS` — `tools/preview-server.ts`
- `PROFESSIONS` — `tools/fabricated-fight.ts`
- `QUOTES` — `tools/build-userscript.ts`
- `REACH_WORDS` — `tools/aura-standing.ts`
- `READER_SIDE` — `tools/fabricated-fight.ts`
- `READER_SIDE_ID_FIRST` — `tools/fabricated-fight.ts`
- `READINGS_REPORTED` — `tools/margonem-readings.ts`
- `READING_VERDICT` — `tools/margonem-readings.ts`
- `REBUILD_QUIET_MILLISECONDS` — `tools/preview-server.ts`
- `RECORDINGS_MAXIMUM` — `tools/recorded-material.ts`
- `RECORDING_SUFFIX` — `tools/capture-intake.ts`, `tools/recorded-material.ts`
- `REDUCTION_BASE` — `tools/fabricated-fight.ts`
- `REDUCTION_PER_PLACE` — `tools/fabricated-fight.ts`
- `REGIONS_ASKED_MAXIMUM` — `tools/panel-giving-way.ts`
- `REGION_ANCHOR` — `tools/panel-giving-way.ts`
- `REGISTER_PATH` — `tools/help-claim-register.ts`
- `RELEASE_EDITION` — `tools/build-userscript.ts`
- `RELEASE_FLAG` — `tools/preview-site.ts`
- `RELEASE_INSTALL_NOTE` — `tools/changelog.ts`
- `RELOAD_SCRIPT` — `tools/preview-server.ts`
- `REMOVED_COUNT` — `tools/capture-intake.ts`
- `REMOVED_DESCRIPTION` — `tools/capture-intake.ts`
- `REMOVED_DESCRIPTIONS` — `tools/capture-intake.ts`
- `ROLE` — `tools/status-bit-table.ts`
- `ROUNDS_DEFAULT` — `tools/fabricated-fight.ts`
- `ROUNDS_FLAG` — `tools/fabricated-fight.ts`
- `ROWS_MAXIMUM` — `tools/skill-table.ts`
- `ROW_BY_PART` — `tools/drill-report.ts`
- `ROW_OPEN` — `tools/skill-table.ts`
- `ROW_WIDTH` — `tools/drill-report.ts`
- `RUNG_WIDTH` — `tools/drill-report.ts`
- `RUNS` — `tools/payload-cost.ts`
- `RUNS_MAXIMUM` — `tools/aura-lifetime.ts`
- `SAYS_COLUMN` — `tools/margonem-readings.ts`
- `SCREEN_WIDTH` — `tools/drill-report.ts`
- `SCRIPT_TYPE` — `tools/preview-server.ts`
- `SEAM_GUTTER_PIXELS` — `tools/preview-page.ts`
- `SECTIONS_MAXIMUM` — `tools/develop-reports.ts`
- `SECTION_OPENER` — `tools/changelog.ts`
- `SEGMENT_INDEX` — `tools/protocol-key-table.ts`
- `SENTENCE_END` — `tools/protocol-key-shape.ts`
- `SERVED_FILE_PATHS` — `tools/preview-server.ts`
- `SHAPE_MARKER` — `tools/protocol-key-shape.ts`
- `SHAPE_STEP` — `tools/protocol-key-table.ts`
- `SHOTS_MAXIMUM` — `tools/panel-shots.ts`
- `SHOT_DIRECTORY` — `tools/panel-shots.ts`
- `SHOT_MOMENT` — `tools/panel-shots.ts`
- `SHOUT_ACT` — `tools/fabricated-fight.ts`
- `SHOUT_SKILL` — `tools/fabricated-fight.ts`
- `SIDECAR_INDENT_SPACES` — `tools/panel-shots.ts`
- `SIDECAR_NAME` — `tools/panel-shots.ts`
- `SIDES` — `tools/fabricated-fight.ts`
- `SILENCE_CLAIM` — `tools/help-claim-register.ts`
- `SILENT_MARK` — `tools/preview-page.ts`
- `SKILLS_ADDRESS` — `tools/skill-table.ts`
- `SKILLS_MAXIMUM` — `tools/aura-standing.ts`
- `SLUG_CHARACTERS` — `tools/capture-intake.ts`
- `SMALL_PLACES` — `tools/fabricated-fight.ts`
- `SPLIT_FROM_PIXELS` — `tools/preview-page.ts`
- `SPLIT_SHORT_PIXELS` — `tools/preview-page.ts`
- `STALE_AFTER_DAYS` — `tools/help-article.ts`
- `STATED_SKILLS` — `tools/aura-standing.ts`, `tools/shout-holding.ts`
- `STATE_ENTRY_NAME` — `tools/preview-state.ts`
- `STATE_SCREEN_NAME` — `tools/preview-state.ts`
- `STATE_STORE_NAME` — `tools/preview-state.ts`
- `STATE_TEXT_MAXIMUM` — `tools/preview-state.ts`
- `STATE_VALUE_MAXIMUM` — `tools/preview-state.ts`
- `STATE_WAIT_EVERY_MILLISECONDS` — `tools/preview-state.ts`
- `STATE_WAIT_TRIES` — `tools/preview-state.ts`
- `STATUS_ROUNDS` — `tools/fabricated-fight.ts`
- `STYLE_IMPORT` — `tools/build-userscript.ts`
- `STYLE_URL_OPEN` — `tools/build-userscript.ts`
- `SUBSTITUTED_COUNT` — `tools/capture-intake.ts`
- `SWITCH_ANCHOR` — `tools/protocol-key-table.ts`
- `SWITCH_SUBJECT_TAIL` — `tools/protocol-key-table.ts`
- `TAB_DAMAGE_TAKEN` — `tools/panel-shots.ts`
- `TAGS_BUILT` — `tools/build-userscript.ts`
- `TAG_CALL` — `tools/build-userscript.ts`
- `TALLEST_LISTED` — `tools/card-height.ts`
- `TALLY_MAXIMUM` — `tools/decoding-status.ts`
- `TEMPLATE_HOLE` — `tools/build-userscript.ts`
- `TEMPLATE_QUOTE` — `tools/build-userscript.ts`
- `TEXT_CHARACTERS_MAXIMUM` — `tools/capture-intake.ts`
- `TEXT_ENCODER` — `tools/preview-server.ts`
- `TEXT_NAME` — `tools/help-article.ts`
- `TIPS_TALL_PIXELS_MINIMUM` — `tools/preview-site.ts`
- `TOOL_ERROR_CODE` — `tools/margometer-tool-error.ts`
- `TOOL_NAME` — `tools/fabricated-fight.ts`
- `TURNS_REPORTED_MAXIMUM` — `tools/shout-holding.ts`
- `TURN_LOST_SEPARATOR` — `tools/fabricated-fight.ts`
- `TURN_LOST_TAIL` — `tools/fabricated-fight.ts`
- `TURN_OUTCOME` — `tools/turn-count.ts`
- `TURN_OUTCOMES` — `tools/turn-count.ts`
- `TURN_PLACING` — `tools/turn-count.ts`
- `TURN_PLACINGS` — `tools/turn-count.ts`
- `TURN_QUEUE_WIDTH` — `tools/fabricated-fight.ts`
- `TURN_VERDICT` — `tools/turn-count.ts`
- `TURN_VERDICTS` — `tools/turn-count.ts`
- `TURN_WIDTH` — `tools/shout-holding.ts`
- `UNDERWAY_ENTRY` — `tools/panel-shots.ts`
- `USAGE` — `tools/changelog.ts`
- `USERSCRIPT_DOWNLOAD_ADDRESS` — `tools/build-userscript.ts`
- `USERSCRIPT_NAME` — `tools/build-userscript.ts`
- `VALUES_MAXIMUM` — `tools/capture-intake.ts`
- `VALUE_COLUMN` — `tools/protocol-key-shape.ts`
- `VERDICTS_STATED` — `tools/protocol-key-shape.ts`
- `VERDICT_DASH` — `tools/protocol-key-shape.ts`
- `VERDICT_WIDTH` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `VERDICT_WORDS` — `tools/margonem-readings.ts`
- `VERSION_CHARACTERS` — `tools/capture-intake.ts`
- `VERSION_HEADING_OPENER` — `tools/changelog.ts`
- `VERSION_PUNCTUATION` — `tools/capture-intake.ts`
- `VIEWPORT` — `tools/panel-shots.ts`
- `WALK_BACK_MAXIMUM` — `tools/status-bit-table.ts`
- `WHOLE_PERCENT` — `tools/fabricated-fight.ts`
- `WINDOWS_ACROSS_PIXELS` — `tools/preview-page.ts`
- `WINDOWS_WAIT_EVERY_MILLISECONDS` — `tools/preview-site.ts`
- `WINDOWS_WAIT_TRIES` — `tools/preview-site.ts`
- `WITNESS_KEYS` — `tools/turn-count.ts`
- `WORDS_MAXIMUM` — `tools/protocol-key-shape.ts`
- `WORD_CHARACTERS` — `tools/build-userscript.ts`
- `WORD_EDGES` — `tools/protocol-key-shape.ts`
- `WOUND_WEAKENED_PERCENT` — `tools/fabricated-fight.ts`

### `tests/`

- `AA_GRAPHIC_RATIO` — `tests/ui/panel-look.test.ts`
- `AA_MARK_RATIO` — `tests/ui/panel-look.test.ts`
- `AA_TEXT_RATIO` — `tests/ui/panel-look.test.ts`
- `ABSENCE_CLAIM` — `tests/repository/protocol-keys.test.ts`
- `ABSENT_PATHS` — `tests/tools/frozen-files.test.ts`
- `ABSORBED` — `tests/core/fight-decoder.test.ts`, `tests/core/fight-statistics.test.ts`
- `ACCEPTED` — `tests/repository/decisions.test.ts`
- `ACROSS` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-reload.spec.ts`
- `ACTS_SCRIPTED` — `tests/tools/fabricated-fight.test.ts`
- `ADD_ON_NAME` — `tests/e2e/panel-tooltip.spec.ts`
- `ADD_ON_ROW` — `tests/runtime/carried-tooltip.test.ts`
- `ADD_ON_VERSION` — `tests/runtime/fight-file.test.ts`
- `AGAINST_NAMES` — `tests/core/fight-decoder.test.ts`
- `AGAINST_TWO` — `tests/core/aura-standing.test.ts`
- `ALONG_THE_BAR` — `tests/e2e/panel-drag.spec.ts`
- `ALPHABET` — `tests/ui/panel-palette.test.ts`
- `ALTERNATIVE_SEPARATOR` — `tests/verb-purities.ts`
- `ANNOUNCED` — `tests/core/fight-statistics.test.ts`
- `ANNOUNCEMENT` — in 5 files: `tests/`
- `ANNOUNCEMENT_ELSEWHERE` — `tests/core/fight-decoder.test.ts`
- `ANNOUNCEMENT_KEY` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/core/anguish-rule.test.ts`
- `ANNOUNCEMENT_KEYS` — `tests/core/granted-blow-rule.test.ts`
- `ANONYMOUS` — `tests/repository/broad-catches.test.ts`
- `ANOTHER` — `tests/runtime/margometer-runtime.test.ts`
- `ANSWERS` — `tests/e2e/panel-options.spec.ts`
- `AROUND_LIST_CARDS` — `tests/ui/share-bound.test.ts`
- `ASSERTION_PREFIX` — `tests/repository/assertion-density.test.ts`
- `ASSERT_MODULE` — `tests/repository/assert-imports.test.ts`
- `ASSERT_NAME` — `tests/repository/assert-imports.test.ts`
- `ASSERT_PACKAGE` — `tests/repository/assert-imports.test.ts`,
  `tests/repository/reader-layer.test.ts`
- `ATTACKER` — `tests/core/injure-rule.test.ts`
- `AT_A_TIME` — `tests/e2e/panel-level.spec.ts`, `tests/e2e/panel-states.spec.ts`
- `AURA` — `tests/core/fight-statistics.test.ts`
- `AUTO` — `tests/core/fight-decoder.test.ts`
- `A_FEW` — `tests/e2e/panel-states.spec.ts`
- `BACKTICK` — in 4 files: `tests/`
- `BACKTICK_BUNDLE` — `tests/tools/protocol-key-table.test.ts`
- `BACK_ANYWHERE_NOTE` — `tests/e2e/panel-card.spec.ts`
- `BACK_NOTE` — `tests/e2e/panel-card.spec.ts`
- `BANDAGE` — `tests/core/bandage-rule.test.ts`
- `BAND_CLOSING` — `tests/tools/preview-site.test.ts`
- `BARE_BLOW` — `tests/core/fight-statistics.test.ts`
- `BARE_BLOW_AGAIN` — `tests/core/fight-statistics.test.ts`
- `BAR_ICONS` — `tests/ui/panel-look.test.ts`
- `BEARER_ID` — `tests/core/carried-figure.test.ts`
- `BINDING_NODES` — `tests/repository/browser-globals.test.ts`,
  `tests/repository/name-shapes.test.ts`
- `BIT_CELLS` — `tests/tools/aura-lifetime.test.ts`
- `BLACK` — `tests/ui/panel-look.test.ts`
- `BLANK_ELEMENT` — `tests/core/fight-decoder.test.ts`
- `BLOCKED` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `BLOCK_OPENER` — `tests/repository/comment-share.test.ts`
- `BLOW` — `tests/core/charged-skill.test.ts`
- `BLOWS_GRANTED` — `tests/frozen-tables.ts`
- `BLOW_AFTER` — `tests/core/fight-decoder.test.ts`
- `BLOW_AFTER_SELF_HEAL` — `tests/core/fight-decoder.test.ts`
- `BLOW_BY_ANOTHER` — `tests/core/fight-decoder.test.ts`
- `BOAR` — `tests/tools/turn-count.test.ts`
- `BOLD_MARK` — `tests/repository/documents.test.ts`
- `BOTH_ENDS_SCREEN` — `tests/ui/full-cast-bound.test.ts`
- `BOTH_KINDS_OF_PAIR` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `BOTH_OKRZYKI` — `tests/core/aura-standing.test.ts`
- `BOUND` — `tests/e2e/panel-card.spec.ts`
- `BOUNDED_BY_ITSELF` — `tests/tools/preview-site.test.ts`
- `BRANDED_STOOD_DOWN` — `tests/userscript-entry.test.ts`
- `BROAD_CATCHES` — `tests/repository/broad-catches.test.ts`
- `BROWSER_GLOBALS` — `tests/repository/browser-globals.test.ts`
- `BROWSER_SUITE_DIRECTORY` — `tests/repository/import-paths.test.ts`
- `BROWSER_SUITE_PREFIXES` — `tests/repository/import-paths.test.ts`
- `BUILT` — `tests/tools/preview-server.test.ts`
- `BUILT_DIRECTORY` — `tests/e2e/build-once.ts`
- `BUNDLE` — `tests/tools/preview-server.test.ts`
- `BUNDLED_PREFIXES` — `tests/source-tree.ts`
- `CALLBACK_INDEX_BY_METHOD` — `tests/repository/handed-callbacks.test.ts`
- `CALLS` — `tests/tools/preview-page.test.ts`
- `CAPTURED_AT` — `tests/runtime-world.ts`
- `CARD` — `tests/e2e/panel-card.spec.ts`
- `CARD_ATTRIBUTE` — `tests/ui/level-drawn.test.ts`
- `CARD_HEADING_OPENER` — `tests/repository/event-entries.test.ts`
- `CARD_LABEL_KEYS` — `tests/ui/blow-vocabulary.test.ts`
- `CARD_OPEN` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `CARD_OTHER_KEYS` — `tests/ui/blow-vocabulary.test.ts`
- `CARD_WIDTH_MAXIMUM` — `tests/ui/panel-drag.test.ts`
- `CARD_WORD_ENDINGS` — `tests/ui/panel-words.test.ts`
- `CARRIED` — `tests/ui/blow-vocabulary.test.ts`
- `CARRYING_EVERYTHING` — `tests/ui/panel-words.test.ts`
- `CASE_OPENERS` — `tests/repository/declaration-order.test.ts`
- `CAST_HEADING` — `tests/repository/captured-fight-register.test.ts`
- `CATEGORY_STEMS` — `tests/repository/names.test.ts`
- `CAUSE` — `tests/repository/protocol-keys.test.ts`
- `CAUSES_MAXIMUM` — `tests/simulation.ts`
- `CAUSE_MARKER` — `tests/repository/protocol-keys.test.ts`
- `CAVEATED` — `tests/ui/panel-card.test.ts`
- `CAVEAT_DOT` — `tests/ui/panel-look.test.ts`
- `CAVEAT_MARKS` — `tests/ui/panel-look.test.ts`
- `CAVEAT_STEM` — `tests/ui/panel-look.test.ts`
- `CELLS` — `tests/tools/shout-holding.test.ts`
- `CELL_LENGTH_MAXIMUM` — `tests/repository/design-tokens.test.ts`
- `CELL_MARK` — `tests/register-table.ts`, `tests/repository/documents.test.ts`
- `CELL_OPENER` — `tests/tools/drill-report.test.ts`
- `CELL_SEPARATOR` — `tests/markdown-document.ts`, `tests/tools/drill-report.test.ts`,
  `tests/verb-purities.ts`
- `CENSUS_HEADING` — `tests/repository/captured-fight-register.test.ts`
- `CENTAUR` — `tests/tools/card-height.test.ts`
- `CHAIN_DEPTH_MAXIMUM` — `tests/repository/purity.test.ts`
- `CHANGELOG` — `tests/repository/changelog.test.ts`, `tests/tools/changelog.test.ts`
- `CHANGELOG_PATH` — `tests/repository/changelog.test.ts`
- `CHANGING_METHODS` — `tests/repository/purity.test.ts`
- `CHANGING_NODES` — `tests/repository/purity.test.ts`
- `CHANNEL_VALUE_MAXIMUM` — `tests/ui/panel-look.test.ts`
- `CHARGED_STATES` — `tests/ui/panel-words.test.ts`
- `CHECKED_DIRECTORIES` — in 7 files: `tests/`
- `CITED_WHILE_ABSENT` — `tests/repository/cited-paths.test.ts`
- `CLAIM_TERMINATORS` — `tests/repository/protocol-keys.test.ts`
- `CLASSES_MAXIMUM` — `tests/repository/name-register.test.ts`
- `CLASS_NODES` — `tests/repository/throws.test.ts`
- `CLAUSE_CELLS` — `tests/tools/aura-lifetime.test.ts`
- `CLAUSE_OPENERS` — `tests/tools/aura-lifetime.test.ts`
- `CLIENT_LIST_CLAIM` — `tests/repository/protocol-keys.test.ts`
- `CLIMB_MAXIMUM` — `tests/repository/browser-globals.test.ts`,
  `tests/repository/nesting-depth.test.ts`
- `CLOSING_MARKS` — `tests/ui/panel-words.test.ts`
- `COMMENT_MARGIN` — `tests/repository/comment-share.test.ts`
- `COMMENT_OPENER` — `tests/core/aura-standing.test.ts`
- `COMMIT_CALLERS` — `tests/repository/event-entries.test.ts`
- `COMMIT_VERB` — `tests/repository/event-entries.test.ts`
- `CONFIGURATION_FILE` — `tests/repository/fabricated-fights.test.ts`
- `CONFIGURATION_PATH` — `tests/repository/name-register.test.ts`
- `CONSTRUCTOR_NAME` — `tests/repository/name-register.test.ts`,
  `tests/repository/regular-expressions.test.ts`
- `CONST_NAME` — `tests/repository/name-register.test.ts`,
  `tests/repository/type-assertions.test.ts`
- `CONTROLS` — `tests/e2e/panel-options.spec.ts`, `tests/e2e/panel-type.spec.ts`
- `COUNTS` — `tests/repository/protocol-keys.test.ts`
- `COUNT_KEY` — `tests/core/skill-announcement-rule.test.ts`
- `COUNT_STATED` — `tests/runtime/defect-ledger.test.ts`
- `CRAWL_MILLISECONDS` — `tests/e2e/panel-crawl.spec.ts`
- `CRITICAL` — `tests/core/fight-statistics.test.ts`
- `CRITICAL_ID` — `tests/ports/margonem-client-dictionary.test.ts`
- `CUSTOM` — `tests/core/fight-decoder.test.ts`
- `CUSTOM_NAME_KEY` — `tests/core/skill-announcement-rule.test.ts`
- `CUSTOM_PROPERTY_OPENER` — `tests/repository/browser-support.test.ts`
- `CUT_BLOW` — `tests/ui/helper-window.test.ts`
- `CUT_HEADINGS` — `tests/ui/panel-element.test.ts`
- `CUT_KEY_SAMPLES` — `tests/core/fight-session.test.ts`
- `CUT_NAME` — `tests/ui/helper-window.test.ts`
- `CUT_NOTE` — `tests/e2e/panel-card.spec.ts`
- `CUT_ROSTER` — `tests/ui/helper-window.test.ts`
- `DAMAGE_MARKER` — `tests/core/granted-blow-rule.test.ts`
- `DATED` — `tests/core/aura-standing.test.ts`
- `DATE_LENGTH` — `tests/repository/decisions.test.ts`
- `DATE_OPENER` — `tests/repository/decisions.test.ts`
- `DEAD_TARGET` — `tests/core/fight-statistics.test.ts`
- `DECISIONS_DIRECTORY` — `tests/repository/decisions.test.ts`
- `DECLARATIONS_MAXIMUM` — `tests/repository/control-flow.test.ts`
- `DECLARED` — `tests/repository/changelog.test.ts`
- `DECLARED_NODES` — `tests/repository/browser-globals.test.ts`
- `DECLARED_ON_BLOW` — `tests/core/fight-decoder.test.ts`
- `DECLARED_ON_SKILL` — `tests/core/fight-decoder.test.ts`
- `DECLARING_NODES` — `tests/repository/name-register.test.ts`,
  `tests/repository/name-shapes.test.ts`
- `DECODED_VERDICT` — `tests/tools/fabricated-fight.test.ts`
- `DEEPEST` — `tests/e2e/panel-crawl.spec.ts`
- `DEFAULT_ROUNDS` — `tests/tools/fabricated-fight.test.ts`
- `DELETE_OPERATOR` — `tests/repository/record-shapes.test.ts`
- `DENIED_TOOLS` — `tests/repository/documents.test.ts`
- `DENSITY_FLOOR_BY_DIRECTORY` — `tests/repository/assertion-density.test.ts`
- `DEPTH_MAXIMUM` — `tests/repository/event-entries.test.ts`,
  `tests/repository/name-register.test.ts`, `tests/source-tree.ts`
- `DESCENDING` — `tests/e2e/panel-crawler.ts`
- `DESIGN_PATH` — `tests/repository/design-tokens.test.ts`, `tests/repository/event-entries.test.ts`
- `DEVELOP_MARK` — `tests/repository/cited-paths.test.ts`
- `DEVELOP_REVISION` — `tests/recording-sources.ts`
- `DEVELOP_ROOT_PREFIX` — `tests/ui/panel-look.test.ts`
- `DEVELOP_SHEET_FILES` — `tests/ui/panel-look.test.ts`
- `DEVELOP_SHELF` — `tests/runtime/shelf.test.ts`
- `DEVELOP_SPELLINGS` — `tests/ui/panel-look.test.ts`
- `DIRECTIVE_LEAD` — `tests/repository/type-assertions.test.ts`
- `DIRECTIVE_OPENER` — `tests/repository/type-assertions.test.ts`
- `DIRECTORY_ROOTS` — `tests/repository/comment-share.test.ts`
- `DIRECTORY_SHARE_PERCENT_MAXIMUM` — `tests/repository/comment-share.test.ts`
- `DISPUTED` — `tests/tools/turn-reading.test.ts`
- `DOCBLOCK_OPENER` — `tests/repository/comment-share.test.ts`
- `DOCBLOCK_PROSE_MAXIMUM` — `tests/repository/comment-share.test.ts`
- `DOCUMENTS_LEAD` — `tests/repository/documents.test.ts`
- `DOCUMENT_OPENER` — `tests/repository/documents.test.ts`
- `DOM_HEADING` — `tests/repository/browser-support.test.ts`
- `DOWN` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-reload.spec.ts`
- `DRAINED` — `tests/ui/panel-content.test.ts`
- `DUEL` — `tests/tools/fabricated-fight.test.ts`
- `DUET` — `tests/runtime/carried-tooltip.test.ts`
- `ELSEWHERE` — `tests/tools/protocol-key-shape.test.ts`
- `ELSEWHERE_KEYS` — `tests/core/granted-blow-rule.test.ts`
- `EMPTY` — `tests/runtime/shelf.test.ts`
- `ENDING` — `tests/e2e/panel-shelf.spec.ts`, `tests/e2e/panel-states.spec.ts`,
  `tests/ui/panel-words.test.ts`
- `ENDINGS` — `tests/repository/cited-paths.test.ts`
- `ENGINES` — `tests/repository/browser-support.test.ts`
- `ENGINE_ANSWER` — `tests/e2e/margonem-page.ts`
- `ENGINE_FAILURE_ALREADY_WRAPPED` — `tests/e2e/panel-boot.spec.ts`
- `ENGINE_FAILURE_SEARCH_ABANDONED` — `tests/e2e/panel-boot.spec.ts`
- `ENGINE_LATE_MILLISECONDS` — `tests/e2e/margonem-page.ts`
- `ENGLISH_WORDS` — `tests/ui/panel-words.test.ts`
- `ENTRIES` — `tests/repository/event-entries.test.ts`
- `ENTRY_CLOSERS` — `tests/repository/changelog.test.ts`
- `ENTRY_KINDS` — `tests/repository/changelog.test.ts`
- `ENTRY_MARK` — `tests/tools/aura-lifetime.test.ts`
- `ENVELOPE` — `tests/e2e/panel-save.spec.ts`
- `ERROR_NAME` — `tests/repository/throws.test.ts`
- `ESCAPE` — `tests/libs/text-walk.test.ts`
- `EVADED` — `tests/core/fight-statistics.test.ts`
- `EVIDENCE_DELEGATIONS` — `tests/repository/protocol-keys.test.ts`
- `EVIDENCE_MARKER` — `tests/repository/protocol-keys.test.ts`
- `EVIDENCE_PREFIX` — `tests/repository/name-register.test.ts`
- `EXCLUSIONS` — `tests/repository/fabricated-fights.test.ts`
- `EXPORT_NODE` — `tests/repository/name-shapes.test.ts`
- `FAILURE_KINDS` — `tests/simulation.ts`
- `FAILURE_LINE` — `tests/e2e/panel-boot.spec.ts`
- `FAILURE_ROOT` — `tests/repository/name-register.test.ts`
- `FAMILY_RULE` — `tests/repository/protocol-keys.test.ts`
- `FAULTS_KEPT` — `tests/e2e/panel-crawler.ts`
- `FAULT_FREE` — `tests/simulation.ts`
- `FED_THROUGH` — `tests/e2e/panel-level.spec.ts`, `tests/e2e/panel-scroll.spec.ts`
- `FIGHT` — `tests/tools/fabricated-fight.test.ts`, `tests/ui/panel-screen.test.ts`
- `FIGHTS` — `tests/tools/preview-page.test.ts`
- `FILES_MAXIMUM` — `tests/source-tree.ts`
- `FILE_SUFFIXES` — `tests/repository/names.test.ts`
- `FILL_GROUNDS` — `tests/ui/panel-look.test.ts`
- `FIRE_AND_COLD_DEALER_ID` — `tests/ui/panel-element.test.ts`
- `FIRST` — `tests/runtime/defect-ledger.test.ts`
- `FIRST_MONTH` — `tests/ui/panel-words.test.ts`
- `FIRST_OF_A_PAIR` — `tests/runtime/margometer-runtime.test.ts`
- `FLED` — `tests/tools/fabricated-fight.test.ts`
- `FLOOR_HEADING` — `tests/repository/browser-support.test.ts`
- `FOLD_MARK` — `tests/e2e/panel-fold.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `FOUR_KINDS` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `FRAMES_FLUSHED_MAXIMUM` — `tests/e2e/margonem-page.ts`
- `FRAMES_MAXIMUM` — `tests/fake-window.ts`
- `FRAME_HEADING_OPENER` — `tests/repository/event-entries.test.ts`
- `FRONTMATTER_MARK` — `tests/repository/documents.test.ts`
- `FROST_CASTER_ID` — `tests/core/carried-figure.test.ts`
- `FROST_SKILL_ID` — `tests/core/carried-figure.test.ts`
- `FUNCTION_DIRECTORIES` — `tests/repository/name-shapes.test.ts`
- `FUNCTION_NODES` — `tests/source-tree.ts`
- `FUNCTION_VALUES` — `tests/repository/event-entries.test.ts`
- `GAP` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`,
  `tests/ui/panel-drag.test.ts`
- `GRANTED_ANNOUNCEMENT` — `tests/core/fight-decoder.test.ts`
- `GRANTED_FIRST` — `tests/core/fight-decoder.test.ts`
- `GRANTED_SECOND` — `tests/core/fight-decoder.test.ts`
- `GRANTED_TWICE` — `tests/core/fight-decoder.test.ts`
- `GROWING` — `tests/e2e/panel-level.spec.ts`
- `GUARDS` — `tests/repository/handed-callbacks.test.ts`
- `GUARD_DIRECTORY` — `tests/repository/documents.test.ts`
- `GUARD_ENDING` — `tests/repository/documents.test.ts`
- `GUARD_PATH` — `tests/repository/broad-catches.test.ts`
- `HAND_KEPT_KEYS` — `tests/ui/panel-words.test.ts`
- `HAND_KEPT_LIST` — `tests/repository/cited-paths.test.ts`, `tests/repository/documents.test.ts`
- `HEADER_LINES_MAXIMUM` — `tests/repository/decisions.test.ts`
- `HEADING` — `tests/tools/aura-lifetime.test.ts`, `tests/tools/shout-holding.test.ts`
- `HEADING_MARK` — `tests/repository/readmes.test.ts`
- `HEAL` — `tests/core/fight-decoder.test.ts`, `tests/core/fight-statistics.test.ts`
- `HEALER` — `tests/ui/panel-element.test.ts`
- `HEALTH_CLAIM` — `tests/repository/protocol-keys.test.ts`
- `HEALTH_MARKER` — `tests/repository/protocol-keys.test.ts`
- `HEALTH_MOVED` — `tests/tools/turn-reading.test.ts`
- `HEAL_KEY` — `tests/core/last-heal-rule.test.ts`
- `HEAL_ON_ANOTHER` — `tests/core/fight-decoder.test.ts`
- `HEAL_TARGET` — `tests/core/fight-decoder.test.ts`
- `HELD_BUILD` — `tests/tools/margonem-readings.test.ts`
- `HELD_DATE` — `tests/tools/frozen-files.test.ts`
- `HELD_STRIKES_ELSEWHERE` — `tests/tools/shout-holding.test.ts`
- `HELD_STRIKES_SHOUTER` — `tests/tools/shout-holding.test.ts`
- `HELPER_ABSENCES` — `tests/ui/panel-words.test.ts`
- `HELPER_FOLD_KEY` — `tests/e2e/panel-helper.spec.ts`
- `HELPER_GRIP` — `tests/e2e/panel-size.spec.ts`
- `HELPER_POSITION_KEY` — `tests/e2e/panel-helper.spec.ts`
- `HELPER_SIZE_KEY` — `tests/e2e/panel-size.spec.ts`
- `HELPER_WORD_ENDINGS` — `tests/ui/panel-words.test.ts`
- `HELP_MARK` — `tests/tools/aura-lifetime.test.ts`
- `HEX_BASE` — `tests/ui/panel-look.test.ts`
- `HEX_COLOUR_LENGTH` — `tests/ui/panel-look.test.ts`
- `HEX_DIGITS` — `tests/ui/panel-look.test.ts`
- `HILDUR` — in 13 files: `tests/`
- `HILDUR_ID` — `tests/ui/panel-element.test.ts`
- `HILDUR_NAME` — `tests/tools/card-height.test.ts`
- `HISTORY_MARK` — `tests/repository/cited-paths.test.ts`
- `HISTORY_SPLIT` — `tests/repository/cited-paths.test.ts`
- `HIT` — `tests/core/message-grammar.test.ts`
- `HOLDER` — `tests/core/legendary-standing.test.ts`
- `HOLDER_CLOSERS` — `tests/ui/panel-words.test.ts`
- `HOLDER_OPENERS` — `tests/ui/panel-words.test.ts`
- `HOLDING_NODES` — `tests/repository/name-register.test.ts`
- `HOLDS_NO_WORD` — `tests/ui/panel-words.test.ts`
- `HOME_SCREEN` — `tests/e2e/panel-scroll.spec.ts`
- `HOST_SELECTOR` — `tests/e2e/margonem-page.ts`
- `HUNDRED` — `tests/ui/share-bound.test.ts`, `tests/ui/share-column.test.ts`
- `IDENTIFIER_NODE` — `tests/repository/browser-globals.test.ts`
- `ID_KEY` — `tests/core/granted-blow-rule.test.ts`
- `IGNORE_FILE` — `tests/repository/fabricated-fights.test.ts`
- `IMPORTS_ALLOWED` — `tests/repository/layers.test.ts`
- `IMPORT_NODE` — `tests/repository/name-shapes.test.ts`
- `IMPORT_NODES` — `tests/repository/declaration-order.test.ts`, `tests/source-tree.ts`
- `IMPORT_SPECIFIER_NODES` — `tests/repository/browser-globals.test.ts`
- `INK_GROUNDS` — `tests/ui/panel-look.test.ts`
- `INSTALL` — `tests/tools/preview-page.test.ts`
- `ITEMS_MAXIMUM` — `tests/repository/declaration-order.test.ts`
- `KEY` — `tests/core/absorption-destruction-rule.test.ts`, `tests/core/bandage-rule.test.ts`,
  `tests/core/npc-heal-rule.test.ts`
- `KEYED_NODES` — `tests/repository/browser-globals.test.ts`
- `KEYS` — `tests/libs/unknown-value.test.ts`
- `KEYS_FOUND_MINIMUM` — `tests/repository/browser-suite-keys.test.ts`
- `KEYS_HEADING` — `tests/tools/turn-reading.test.ts`
- `KEY_OWNER_PATH` — `tests/repository/protocol-keys.test.ts`
- `KEY_REGISTER_PATH` — `tests/tools/aura-lifetime.test.ts`
- `KEY_SEPARATOR` — `tests/tools/drill-report.test.ts`
- `KEY_SUFFIX` — `tests/repository/browser-suite-keys.test.ts`
- `KILLING_HIT` — `tests/core/message-grammar.test.ts`
- `LAST_RESCUED` — `tests/runtime/carried-tooltip.test.ts`
- `LAYERED_KINDS` — `tests/repository/name-register.test.ts`
- `LAYERS` — `tests/repository/name-register.test.ts`
- `LAYER_DIRECTORIES` — `tests/repository/single-importer.test.ts`
- `LEAST_OPENED` — `tests/e2e/panel-crawl.spec.ts`
- `LIGHTINGS` — `tests/tools/aura-lifetime.test.ts`
- `LINE` — `tests/e2e/panel-card.spec.ts`
- `LINE_BREAK` — `tests/register-table.ts`
- `LINE_COMMENT_OPENER` — `tests/repository/comment-share.test.ts`
- `LINK_INLINE` — `tests/tools/preview-site.test.ts`
- `LINK_OPENING` — `tests/tools/preview-site.test.ts`
- `LISTING_INDENT` — `tests/repository/comment-share.test.ts`
- `LIVE` — `tests/e2e/panel-shelf.spec.ts`
- `LIVE_EMPTY` — `tests/runtime/fight-file.test.ts`
- `LOADED_FROM_ELSEWHERE` — `tests/tools/preview-site.test.ts`
- `LOG_LINE` — `tests/core/fight-decoder.test.ts`
- `LONG` — `tests/ui/card-window.test.ts`
- `LONGEST_DECLARATION` — `tests/ui/panel-look.test.ts`
- `LONGEST_RULE` — `tests/style-sheet.ts`
- `LONG_PLACE` — `tests/e2e/panel-card.spec.ts`
- `LOOKED_UP_BY_HELPER` — `tests/tools/preview-site.test.ts`
- `LOOKS_STATED` — `tests/runtime/margonem-engine-search.test.ts`
- `LOOKS_TIER` — `tests/repository/browser-support.test.ts`
- `LOOKUP_OPENINGS` — `tests/tools/preview-site.test.ts`
- `LOOT` — `tests/core/fight-statistics.test.ts`
- `LOST` — `tests/core/fight-decoder.test.ts`
- `MANIFEST_PATH` — `tests/repository/name-register.test.ts`
- `MARGONEM_CLIENT_BUILD` — `tests/e2e/margonem-page.ts`, `tests/runtime-world.ts`
- `MARGONEM_CLIENT_KEYS` — `tests/ui/panel-words.test.ts`
- `MARGONEM_CLIENT_SCRIPT_NAME` — `tests/e2e/margonem-page.ts`
- `MARGONEM_ENGINE_PRESENCE` — `tests/e2e/margonem-page.ts`
- `MARGONEM_INTERFACE_LAYER` — `tests/e2e/panel-layer.spec.ts`
- `MARGONEM_WINDOW_LAYER_LOWEST` — `tests/e2e/panel-layer.spec.ts`
- `MARKER_AT` — `tests/core/granted-blow-rule.test.ts`
- `MARKS_ON_THE_SCREENS` — `tests/e2e/panel-strips.spec.ts`
- `MAXIMUM_PRESSES` — `tests/e2e/panel-crawler.ts`
- `MEASURED` — `tests/tools/protocol-key-shape.test.ts`, `tests/tools/shout-holding.test.ts`
- `MEMBERS_BY_PART` — `tests/userscript-entry.test.ts`
- `MEMBER_NODE` — `tests/repository/browser-globals.test.ts`
- `MESSAGES_READ` — `tests/ui/panel-content.test.ts`
- `METADATA_NAME` — `tests/e2e/build-once.ts`
- `METER_FOLD_KEY` — `tests/e2e/panel-fold.spec.ts`, `tests/e2e/panel-reload.spec.ts`
- `METER_POSITION_KEY` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-helper.spec.ts`,
  `tests/e2e/panel-reload.spec.ts`
- `METER_SIZE_KEY` — `tests/e2e/panel-size.spec.ts`
- `METHOD_NODES` — `tests/repository/event-entries.test.ts`
- `MILLISECONDS_PER_DAY` — `tests/tools/help-article.test.ts`,
  `tests/tools/margonem-readings.test.ts`
- `MINUS_SIGN` — `tests/ui/level-drawn.test.ts`
- `MONSTER` — `tests/core/charged-skill.test.ts`
- `MONTHS_IN_YEAR` — `tests/ui/panel-words.test.ts`
- `MUTABLE_COLLECTIONS` — `tests/repository/purity.test.ts`
- `NAMED_BLOW` — `tests/core/fight-statistics.test.ts`
- `NAMED_BLOW_ANNOUNCEMENT` — `tests/core/fight-statistics.test.ts`
- `NAMED_BLOW_PREPARE` — `tests/core/fight-statistics.test.ts`
- `NAMED_BLOW_PREPARE_READY` — `tests/core/fight-statistics.test.ts`
- `NAMED_DAMAGE` — `tests/core/fight-statistics.test.ts`
- `NAMED_DAMAGE_KEY` — `tests/core/last-heal-rule.test.ts`
- `NAMED_DAMAGE_UNANNOUNCED` — `tests/core/fight-statistics.test.ts`
- `NAMED_SPECIFIER` — `tests/repository/name-shapes.test.ts`
- `NAMESPACE_SPECIFIER` — `tests/repository/name-shapes.test.ts`
- `NAMES_PAST_THE_BOUND` — `tests/ui/panel-content.test.ts`
- `NAMES_TRIED` — `tests/ui/panel-scroll.test.ts`
- `NAME_FIELD` — `tests/repository/throws.test.ts`
- `NAME_KEY` — `tests/core/granted-blow-rule.test.ts`
- `NAME_KEYS` — `tests/repository/redacted-names.test.ts`
- `NAME_KIND` — `tests/repository/name-register.test.ts`
- `NAME_LENGTH_MAXIMUM` — `tests/repository/browser-support.test.ts`
- `NAME_MARK` — `tests/source-tree.ts`
- `NAME_ON_ONE_LINE` — `tests/ui/card-window.test.ts`
- `NEGATIVE_HEAL` — `tests/core/fight-decoder.test.ts`
- `NEITHER_END` — `tests/ui/panel-content.test.ts`
- `NESTED_KIND` — `tests/tools/drill-report.test.ts`
- `NESTED_NODES` — `tests/source-tree.ts`
- `NESTED_RULES_NAME` — `tests/repository/documents.test.ts`
- `NESTING_DEPTH_MAXIMUM` — `tests/source-tree.ts`
- `NEVER` — `tests/repository/browser-support.test.ts`
- `NEVER_SAID` — `tests/e2e/panel-fixture.ts`
- `NEWER_BUNDLE` — `tests/tools/protocol-key-table.test.ts`
- `NEWER_PAGE` — `tests/tools/margonem-client-source.test.ts`
- `NEWEST` — `tests/runtime/fight-file.test.ts`
- `NOBODY` — `tests/core/combatant-roster.test.ts`, `tests/ports/fight-capture.test.ts`,
  `tests/ui/panel-card.test.ts`
- `NOTHING` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`
- `NOTHING_CARRIED` — `tests/ui/panel-words.test.ts`
- `NOTHING_DRAWN` — `tests/ui/level-drawn.test.ts`
- `NOTHING_READ` — `tests/core/fight-decoder.test.ts`
- `NOTHING_WAITING` — `tests/panel-view.ts`
- `NOTHING_YET` — `tests/e2e/panel-states.spec.ts`
- `NOT_A_BATTLE_KEY` — `tests/repository/protocol-keys.test.ts`
- `NOT_A_MESSAGE_KEY` — `tests/tools/fabricated-fight.test.ts`
- `NOT_KNOWN` — `tests/ui/level-drawn.test.ts`
- `NO_BUILD` — `tests/repository/captured-fight-register.test.ts`
- `NO_FIGHT_WORDS` — `tests/e2e/panel-boot.spec.ts`
- `NO_GRANTS` — `tests/core/fight-decoder.test.ts`, `tests/core/granted-blow-rule.test.ts`
- `NO_KIND` — `tests/simulation.ts`
- `NO_SHARE` — `tests/ui/share-column.test.ts`
- `NO_SNAPSHOTS` — `tests/ports/recorded-session.test.ts`
- `NPC_HEAL` — `tests/core/npc-heal-rule.test.ts`
- `NUMBER_WIDTH` — `tests/repository/decisions.test.ts`
- `OLDER_BUNDLE` — `tests/tools/protocol-key-table.test.ts`
- `OLDER_PAGE` — `tests/tools/margonem-client-source.test.ts`
- `ONE_LINE_NOTE` — `tests/ui/card-window.test.ts`
- `OPAQUE_GROUP_OPENERS` — `tests/repository/browser-support.test.ts`
- `OPENED_AT` — `tests/runtime/live-fight.test.ts`
- `OPENED_AT_A_PATH` — `tests/tools/preview-server.test.ts`
- `OPENED_EMPTY` — `tests/runtime/shelf.test.ts`
- `OPENERS_HEADING` — `tests/tools/turn-reading.test.ts`
- `OPENING` — `tests/core/fight-session.test.ts`
- `OPENING_BEARER_IDS` — `tests/runtime/carried-tooltip.test.ts`
- `OPENING_HASTE` — `tests/runtime/carried-tooltip.test.ts`
- `OPENS_NOTE` — `tests/e2e/panel-card.spec.ts`
- `OPPOSING_SIDE` — `tests/ui/panel-helper.test.ts`
- `OTHER` — `tests/runtime/screen-intent.test.ts`, `tests/tools/develop-reports.test.ts`
- `OTHER_NAME` — `tests/tools/develop-reports.test.ts`
- `OTHER_SCREEN` — `tests/e2e/panel-scroll.spec.ts`
- `OURS` — in 4 files: `tests/`
- `OUR_VOCABULARY` — `tests/ui/panel-words.test.ts`
- `OUTCOME` — `tests/core/message-grammar.test.ts`
- `OUTCOMES` — `tests/e2e/panel-states.spec.ts`
- `OUTRUN_BEARER_ID` — `tests/runtime/carried-tooltip.test.ts`
- `OUTRUN_HASTE` — `tests/runtime/carried-tooltip.test.ts`
- `OUTRUN_PAYLOAD_INDEX` — `tests/runtime/carried-tooltip.test.ts`
- `OVERFLOWING` — `tests/e2e/panel-scroll.spec.ts`
- `PAGE_CALL` — `tests/fake-window.ts`
- `PAGE_HEIGHT` — `tests/e2e/panel-scroll.spec.ts`
- `PAGE_ORIGIN` — `tests/e2e/panel-page.ts`
- `PAGE_WORLD` — `tests/e2e/panel-page.ts`
- `PALETTE_HEADING` — `tests/repository/design-tokens.test.ts`
- `PALETTE_LINES_BELOW` — `tests/repository/design-tokens.test.ts`
- `PANEL_DIRECTORY` — `tests/repository/browser-globals.test.ts`
- `PANEL_GRIP` — `tests/e2e/panel-size.spec.ts`
- `PANEL_NOUNS` — `tests/ui/panel-words.test.ts`
- `PANEL_OUTCOMES` — `tests/ui/panel-words.test.ts`
- `PANEL_WIDTH` — `tests/ui/panel-drag.test.ts`
- `PANEL_WIDTH_VARIABLE` — `tests/e2e/panel-options.spec.ts`
- `PANEL_WORD_ENDINGS` — `tests/ui/panel-words.test.ts`
- `PARRIED` — `tests/core/fight-statistics.test.ts`
- `PART_MARK` — `tests/repository/captured-fight-register.test.ts`
- `PART_WAY` — `tests/e2e/panel-drag.spec.ts`
- `PAST_THE_SEARCH` — `tests/e2e/panel-boot.spec.ts`
- `PATHS` — `tests/tools/frozen-files.test.ts`
- `PATHS_LISTED_MAXIMUM` — `tests/repository/name-register.test.ts`
- `PATTERNS_HEADING` — `tests/repository/browser-support.test.ts`
- `PAYLOAD_HEADING_OPENER` — `tests/repository/event-entries.test.ts`
- `PERCENT` — `tests/simulation.ts`, `tests/tools/shout-holding.test.ts`
- `PERCENT_PLACES` — `tests/core/combatant-health.test.ts`
- `PERSON` — `tests/runtime/screen-intent.test.ts`
- `PICKER_ID` — `tests/tools/preview-site.test.ts`
- `PICTURE_CLOSER` — `tests/repository/readmes.test.ts`
- `PICTURE_MARK` — `tests/repository/readmes.test.ts`
- `PIN_BY_ACTION` — `tests/repository/workflows.test.ts`
- `PIN_LINES_BELOW` — `tests/repository/workflows.test.ts`
- `PLACE` — `tests/runtime/live-fight.test.ts`
- `PLACEHOLDER_LIST_CLOSER` — `tests/repository/name-shapes.test.ts`
- `PLACEHOLDER_LIST_OPENER` — `tests/repository/name-shapes.test.ts`
- `PLACEHOLDER_RULE_OPENER` — `tests/repository/name-shapes.test.ts`
- `PLACEHOLDER_SEPARATOR` — `tests/repository/name-shapes.test.ts`
- `PLACES_TO_KEEP` — `tests/e2e/panel-strips.spec.ts`
- `PLACE_MARK` — `tests/repository/cited-paths.test.ts`
- `PLACE_NAME` — `tests/e2e/margonem-page.ts`
- `PLANS` — `tests/simulation.test.ts`
- `PLAYER` — `tests/core/charged-skill.test.ts`
- `POISON` — `tests/core/fight-decoder.test.ts`, `tests/core/fight-statistics.test.ts`,
  `tests/ui/panel-content.test.ts`
- `POISONED` — `tests/core/carried-status.test.ts`, `tests/ui/panel-content.test.ts`
- `POISONED_ID` — `tests/ui/panel-content.test.ts`
- `POLISH_LETTERS` — `tests/tools/preview-site.test.ts`
- `POOL_RAISE_KEY` — `tests/core/health-witness.test.ts`
- `PREDICATE_RULE_CLOSER` — `tests/verb-purities.ts`
- `PREDICATE_RULE_OPENER` — `tests/verb-purities.ts`
- `PREFIX` — `tests/repository/browser-support.test.ts`
- `PREFIXED_HEADING` — `tests/repository/browser-support.test.ts`
- `PREPARATION` — `tests/tools/turn-reading.test.ts`
- `PREPARE_ALONE` — `tests/core/fight-statistics.test.ts`
- `PREPARE_BESIDE` — `tests/core/fight-statistics.test.ts`
- `PREPARE_BLOW` — `tests/core/fight-statistics.test.ts`
- `PRINTABLE_FIRST` — `tests/repository/name-register.test.ts`
- `PRINTABLE_LAST` — `tests/repository/name-register.test.ts`
- `PROBE_NAME` — `tests/e2e/margonem-page.ts`
- `PROBE_ROSTER_TWO_SIDES` — `tests/core/fight-statistics.test.ts`
- `PROFESSIONS` — `tests/ui/panel-look.test.ts`, `tests/ui/panel-palette.test.ts`
- `PROMISE_NAME` — `tests/repository/synchronous-bundle.test.ts`
- `PUBLISHED_BYTES_MAXIMUM` — `tests/tools/build-userscript.test.ts`
- `PURITIES` — `tests/verb-purities.ts`
- `PURITY` — `tests/verb-purities.ts`
- `QUANTITY_FLOOR` — `tests/core/skill-announcement-rule.test.ts`
- `QUEUE_ENTRIES_MAXIMUM` — `tests/ports/payload-envelope.test.ts`
- `QUOTE` — in 8 files: `tests/`
- `QUOTED_ROW_OPENER` — `tests/tools/turn-reading.test.ts`
- `QUOTES` — `tests/ui/panel-words.test.ts`
- `RANGE_MARK` — `tests/repository/captured-fight-register.test.ts`
- `REACH_CLOSER` — `tests/core/aura-standing.test.ts`
- `REACH_OPENER` — `tests/core/aura-standing.test.ts`
- `REACH_SOURCE` — `tests/core/aura-standing.test.ts`
- `READER_DIRECTORY` — `tests/repository/reader-layer.test.ts`
- `READER_FILES` — `tests/repository/reader-layer.test.ts`
- `READER_ID` — `tests/runtime/live-fight.test.ts`
- `READER_SIDE` — `tests/ui/panel-helper.test.ts`
- `READINGS_COMPARED` — `tests/core/health-witness.test.ts`
- `README_PATHS` — `tests/repository/readmes.test.ts`
- `READ_AT` — `tests/tools/help-article.test.ts`, `tests/tools/margonem-readings.test.ts`
- `READ_AT_MILLISECONDS` — `tests/tools/help-article.test.ts`,
  `tests/tools/margonem-readings.test.ts`
- `READ_BUILD` — `tests/tools/margonem-readings.test.ts`
- `READ_DATE` — `tests/tools/frozen-files.test.ts`
- `RECORDED_KEYS` — `tests/ports/margonem-engine-warriors.test.ts`
- `RECORDINGS_DIRECTORY` — `tests/recording-sources.ts`
- `RECORDINGS_HEADING` — `tests/repository/captured-fight-register.test.ts`
- `RECORDING_EXTENSION` — `tests/recorded-fights.ts`
- `RECORDING_OPENER` — `tests/tools/turn-reading.test.ts`
- `RECORDING_SUFFIX` — `tests/repository/fabricated-fights.test.ts`
- `RECORD_NAME` — `tests/repository/decisions.test.ts`
- `REDUCER_KEY` — `tests/core/skill-announcement-rule.test.ts`
- `REDUCTION_NOTE` — `tests/ui/panel-card.test.ts`
- `REFUSAL` — `tests/ports/browser-store.test.ts`, `tests/runtime/settings.test.ts`
- `REFUSED_CLOSING` — `tests/tools/fabricated-fight.test.ts`
- `REGISTER` — `tests/repository/protocol-keys.test.ts`, `tests/tools/protocol-key-shape.test.ts`
- `REGISTERED` — `tests/tools/protocol-key-shape.test.ts`
- `REGISTER_HEADING` — in 5 files: `tests/`
- `REGISTER_PATH` — in 9 files: `tests/`
- `REGISTRIES` — `tests/ports/margonem-engine-tooltip.test.ts`
- `RENDER_CALLERS` — `tests/repository/event-entries.test.ts`
- `RENDER_VERB` — `tests/repository/event-entries.test.ts`
- `REPLAY` — `tests/tools/fabricated-fight.test.ts`
- `REPORT` — `tests/tools/develop-reports.test.ts`
- `RESISTANCES_ON_SKILL` — `tests/core/fight-decoder.test.ts`
- `RESTORED_TO_A_STRANGER` — `tests/core/fight-statistics.test.ts`
- `RESTORED_TO_NOBODY` — `tests/core/fight-statistics.test.ts`
- `RETIRED_WORDS` — `tests/repository/names.test.ts`
- `RGB_CLOSER` — `tests/ui/panel-look.test.ts`
- `RGB_OPENER` — `tests/ui/panel-look.test.ts`
- `ROOTS` — `tests/repository/cited-paths.test.ts`
- `ROOT_DOCUMENTS_OTHER` — `tests/repository/documents.test.ts`
- `ROOT_PREFIX` — `tests/repository/import-paths.test.ts`, `tests/source-tree.ts`
- `ROSTER` — in 4 files: `tests/`
- `ROWS_MAXIMUM` — `tests/repository/captured-fight-register.test.ts`
- `ROWS_TRIED` — `tests/e2e/panel-scroll.spec.ts`
- `ROWS_VARIABLE` — `tests/ui/level-drawn.test.ts`
- `ROW_MARK_CELLS` — `tests/ui/panel-element.test.ts`
- `ROW_OPENER` — `tests/register-table.ts`, `tests/repository/captured-fight-register.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `RULES_IN_A_SHEET` — `tests/style-sheet.ts`
- `RULES_PATH` — `tests/repository/documents.test.ts`, `tests/verb-purities.ts`
- `RULE_CLOSER` — `tests/repository/documents.test.ts`
- `RULE_OPENER` — `tests/repository/documents.test.ts`
- `RUNS_CELL` — `tests/repository/browser-support.test.ts`
- `RUNS_TIER` — `tests/repository/browser-support.test.ts`
- `RUNTIME_TABLES` — `tests/runtime-world.ts`
- `RUN_MAXIMUM` — `tests/core/granted-blow-rule.test.ts`
- `SAID_OUT_OF` — `tests/ui/panel-words.test.ts`
- `SAME_PERCENT` — `tests/core/last-heal-rule.test.ts`
- `SAMPLE` — `tests/tools/protocol-key-shape.test.ts`
- `SCOPE_NODES` — `tests/repository/browser-globals.test.ts`
- `SCOPE_SUFFIXES` — `tests/repository/protocol-keys.test.ts`
- `SCREENS` — `tests/ui/panel-content.test.ts`
- `SCREENS_ON_A_FIGHT` — `tests/e2e/panel-crawl.spec.ts`
- `SCRIPT_HEADING` — `tests/repository/browser-support.test.ts`
- `SECOND` — `tests/runtime/defect-ledger.test.ts`
- `SECONDARY_BUTTON` — `tests/ui/panel-gesture.test.ts`
- `SECOND_OF_A_PAIR` — `tests/runtime/margometer-runtime.test.ts`
- `SECTION` — `tests/repository/declaration-order.test.ts`
- `SECTIONS_BEFORE_THE_RULE` — `tests/repository/changelog.test.ts`
- `SECTIONS_PAST_THEIR_TAG` — `tests/repository/changelog.test.ts`
- `SECTION_EXTRAS` — `tests/ui/share-bound.test.ts`
- `SECTION_HEADINGS` — `tests/repository/name-register.test.ts`
- `SECTION_MARKER` — `tests/repository/protocol-keys.test.ts`
- `SECTION_OPENER` — in 4 files: `tests/`
- `SECTION_RANKS` — `tests/repository/declaration-order.test.ts`
- `SELF_HEAL` — `tests/core/fight-decoder.test.ts`
- `SELF_HEALING_ANNOUNCEMENT` — `tests/core/fight-decoder.test.ts`
- `SENTENCE_ENDS` — `tests/repository/changelog.test.ts`
- `SEPARATORS` — `tests/repository/protocol-keys.test.ts`
- `SEPTEMBER` — `tests/ports/browser-clock.test.ts`
- `SERVED_FILE_PATHS` — `tests/tools/preview-server.test.ts`
- `SETTINGS_ID` — `tests/e2e/margonem-page.ts`
- `SETTLED_HEADING` — `tests/repository/browser-support.test.ts`
- `SETTLED_LABELS` — `tests/repository/browser-support.test.ts`
- `SETTLED_SEPARATOR` — `tests/repository/browser-support.test.ts`
- `SHEET_DEPARTURES` — `tests/ui/panel-look.test.ts`
- `SHEET_LENGTH_MAXIMUM` — `tests/repository/browser-support.test.ts`
- `SHELF_KEY` — `tests/e2e/panel-shelf.spec.ts`
- `SHELL_MARK` — `tests/repository/cited-paths.test.ts`
- `SHORT` — in 4 files: `tests/`
- `SHORTENING` — `tests/ui/panel-look.test.ts`
- `SHORTER_WINDOW` — `tests/e2e/panel-card.spec.ts`
- `SHORT_NAME` — `tests/tools/develop-reports.test.ts`
- `SHORT_WINDOW` — `tests/e2e/panel-card.spec.ts`
- `SHOTS_PATH` — `tests/repository/readmes.test.ts`
- `SHOUTED_LENGTH_MINIMUM` — `tests/repository/protocol-keys.test.ts`
- `SHOUTER_STEPS` — `tests/tools/shout-holding.test.ts`
- `SHOUTS` — `tests/core/aura-standing.test.ts`
- `SHOUT_AT_HELD` — `tests/tools/shout-holding.test.ts`
- `SHOUT_HEADING` — `tests/tools/aura-standing.test.ts`
- `SHOWN_LIST` — `tests/shown-screen.ts`
- `SHUT_HEADING` — `tests/tools/drill-report.test.ts`
- `SHUT_OPENING` — `tests/tools/drill-report.test.ts`
- `SIBLING_PREFIX` — `tests/repository/import-paths.test.ts`, `tests/source-tree.ts`
- `SIDES_ON_A_FIGHT` — `tests/e2e/panel-strips.spec.ts`
- `SIDE_CHOICES` — `tests/ui/level-drawn.test.ts`
- `SIDE_COUNTED` — `tests/tools/drill-report.test.ts`
- `SIDE_IN_THE_NAME` — `tests/core/aura-standing.test.ts`
- `SIGNATURE_NODES` — `tests/repository/name-register.test.ts`,
  `tests/repository/name-shapes.test.ts`
- `SIGNS` — `tests/repository/protocol-keys.test.ts`
- `SILENT_CONSOLE` — `tests/runtime/margonem-engine-search.test.ts`
- `SKILLS_DIRECTORY` — `tests/repository/documents.test.ts`
- `SKILLS_LINK` — `tests/repository/documents.test.ts`
- `SKILLS_LINK_TARGET` — `tests/repository/documents.test.ts`
- `SKILL_DESCRIPTION_OPENER` — `tests/repository/documents.test.ts`
- `SKILL_FILE_NAME` — `tests/repository/documents.test.ts`
- `SKILL_NAME_OPENER` — `tests/repository/documents.test.ts`
- `SLOW_BIT` — `tests/core/carried-figure.test.ts`
- `SOMEBODY` — `tests/ports/fight-capture.test.ts`
- `SOMEBODY_ELSE` — `tests/core/legendary-standing.test.ts`
- `SOMEBODY_ELSE_STEPS` — `tests/tools/shout-holding.test.ts`
- `SOMETIMES_HEADING` — `tests/tools/drill-report.test.ts`
- `SOMEWHERE` — `tests/ui/panel-scroll.test.ts`
- `SOMEWHERE_DOWN` — `tests/fake-document.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-scroll.test.ts`
- `SOURCE_DIRECTORIES` — `tests/source-tree.ts`
- `SOURCE_HEADING` — `tests/tools/aura-standing.test.ts`
- `SPAN_MARK` — `tests/repository/cited-paths.test.ts`, `tests/repository/name-register.test.ts`
- `SPEED_BIT` — `tests/core/carried-figure.test.ts`
- `SPEED_UP` — `tests/core/carried-status.test.ts`
- `STANDARD_PREFIX` — `tests/repository/import-paths.test.ts`
- `STANDING_WIDTH` — `tests/ui/panel-drag.test.ts`
- `STATED_SKILLS` — `tests/frozen-tables.ts`, `tests/tools/fabricated-fight.test.ts`
- `STATUS_OPENER` — `tests/repository/decisions.test.ts`
- `STEP` — `tests/core/fight-statistics.test.ts`, `tests/core/message-grammar.test.ts`,
  `tests/ui/card-window.test.ts`
- `STEPPED` — `tests/tools/aura-standing.test.ts`, `tests/tools/recorded-material.test.ts`
- `STEPS` — `tests/e2e/panel-options.spec.ts`, `tests/e2e/panel-type.spec.ts`
- `STEPS_MOST` — `tests/e2e/panel-level.spec.ts`, `tests/e2e/panel-states.spec.ts`
- `STEP_AFTER` — `tests/core/fight-decoder.test.ts`
- `STEP_AND_PREPARATION` — `tests/tools/turn-reading.test.ts`
- `STEP_TAKEN` — `tests/core/fight-decoder.test.ts`
- `STILL_CLOCK` — `tests/runtime/live-fight.test.ts`
- `STORAGE_KEY` — in 4 files: `tests/`
- `STORE_KEYS` — `tests/repository/browser-suite-keys.test.ts`
- `STRIKER_POISON` — `tests/core/fight-statistics.test.ts`
- `STRIPS_ON_A_FIGHT` — `tests/e2e/panel-strips.spec.ts`
- `STRONG_VERBS` — `tests/repository/called-once.test.ts`
- `STRUCTURE_DEPTH_BY_ROOT` — `tests/repository/documents.test.ts`
- `STRUCTURE_HEADING` — `tests/repository/documents.test.ts`
- `STRUCTURE_OPENER` — `tests/repository/documents.test.ts`
- `STRUCTURE_PATH` — `tests/repository/documents.test.ts`
- `STUN_OPENER` — `tests/tools/turn-count.test.ts`
- `STYLE_ATTRIBUTE` — `tests/ui/level-drawn.test.ts`
- `STYLE_FLOOR_HEADING` — `tests/repository/browser-support.test.ts`
- `SUBTITLE_ON_ONE_LINE` — `tests/ui/card-window.test.ts`
- `SUITE_PREFIX` — `tests/repository/name-register.test.ts`
- `SUMMED_FIGURES` — `tests/runtime/fight-file.test.ts`
- `SUPERSEDED_OPENER` — `tests/repository/decisions.test.ts`
- `SUPERSEDES_OPENER` — `tests/repository/decisions.test.ts`
- `SURROUNDINGS` — `tests/runtime/fight-file.test.ts`
- `SVG_MASK_OPENER` — `tests/e2e/panel-type.spec.ts`
- `SWOW_DOWN` — `tests/core/carried-status.test.ts`
- `TABLE` — `tests/repository/purity.test.ts`
- `TABLES` — `tests/core/granted-blow-rule.test.ts`, `tests/frozen-tables.ts`,
  `tests/ui/panel-words.test.ts`
- `TABLES_DATING_NOTHING` — `tests/runtime/margometer-runtime.test.ts`
- `TABLES_GRANTING_LESS_THAN_NOTHING` — `tests/runtime/live-fight.test.ts`
- `TABLE_NAME_KEY` — `tests/core/skill-announcement-rule.test.ts`
- `TABLE_OPENER` — `tests/repository/design-tokens.test.ts`
- `TALLER` — `tests/e2e/panel-size.spec.ts`
- `TALLEST_LISTED` — `tests/tools/card-height.test.ts`
- `TARGET_HEADING` — `tests/repository/browser-support.test.ts`
- `TERMINAL_DIRECTORIES` — `tests/repository/throws.test.ts`
- `TEST_VERSION` — `tests/panel-view.ts`
- `THEIRS` — in 5 files: `tests/`
- `THEN_NAME` — `tests/repository/synchronous-bundle.test.ts`
- `THIRD` — `tests/runtime/margometer-runtime.test.ts`
- `THIRD_BLOW` — `tests/core/fight-decoder.test.ts`
- `THREE_ATTACKERS` — `tests/core/injure-rule.test.ts`
- `THRESHOLD` — `tests/core/last-heal-rule.test.ts`
- `TICK_KEY` — `tests/core/anguish-rule.test.ts`, `tests/core/wound-rule.test.ts`
- `TICK_ON_ANNOUNCER` — `tests/core/fight-decoder.test.ts`
- `TICK_ON_THE_ANNOUNCER` — `tests/core/fight-decoder.test.ts`
- `TILE` — `tests/e2e/panel-card.spec.ts`
- `TIPS_PINNED_LEFT` — `tests/tools/preview-page.test.ts`
- `TITLE_OPENER` — `tests/repository/decisions.test.ts`
- `TOKENS` — `tests/ui/card-window.test.ts`
- `TOLERANCE` — `tests/core/bandage-rule.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/core/wound-rule.test.ts`
- `TOOLTIP_ROWS_MAXIMUM` — `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/ui/panel-words.test.ts`
- `TOOL_ERROR_PATH` — `tests/repository/throws.test.ts`
- `TOP_NODES` — `tests/repository/name-register.test.ts`
- `TO_THE_LEFT` — `tests/e2e/panel-card.spec.ts`
- `TO_THE_RIGHT` — `tests/e2e/panel-card.spec.ts`
- `TURNS_NOTE` — `tests/ui/panel-card.test.ts`
- `TURN_LOST` — `tests/core/fight-statistics.test.ts`
- `TURN_STATES` — `tests/ui/panel-words.test.ts`
- `TWO_APPLIERS` — `tests/core/anguish-rule.test.ts`
- `TWO_HEALED` — `tests/core/fight-decoder.test.ts`
- `TWO_HIT_ANNOUNCEMENT` — `tests/core/fight-statistics.test.ts`
- `TWO_HIT_FIRST` — `tests/core/fight-statistics.test.ts`
- `TWO_HIT_SECOND` — `tests/core/fight-statistics.test.ts`
- `TWO_LINE_NOTE` — `tests/ui/card-window.test.ts`
- `TWO_OF_A_NAME` — `tests/core/combatant-roster.test.ts`
- `TWO_SIDES` — `tests/ui/panel-content.test.ts`
- `TYPEOF_OPENER` — `tests/repository/declaration-order.test.ts`
- `TYPE_KEY` — `tests/e2e/panel-type.spec.ts`
- `TYPE_NAME_NODES` — `tests/repository/browser-globals.test.ts`
- `TYPE_NODES` — `tests/repository/declaration-order.test.ts`, `tests/repository/names.test.ts`
- `UNBOUNDED_ANNOUNCEMENT` — `tests/core/fight-decoder.test.ts`
- `UNBOUNDED_BLOW` — `tests/core/fight-decoder.test.ts`
- `UNBROKEN_PLACE` — `tests/e2e/panel-card.spec.ts`
- `UNDERSCORE` — `tests/repository/protocol-keys.test.ts`
- `UNDRAWN_SELECTOR` — `tests/e2e/panel-fixture.ts`
- `UNFOLD_MARK` — `tests/e2e/panel-fold.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `UNMINIFIED_BUNDLE` — `tests/tools/protocol-key-table.test.ts`
- `UNNAMED_KINDS` — `tests/ui/panel-content.test.ts`
- `UNNARRATED` — `tests/tools/turn-count.test.ts`
- `UNREAD` — `tests/core/fight-decoder.test.ts`
- `UNSETTLED` — `tests/core/fight-statistics.test.ts`
- `UNSHOWN_SIZE` — `tests/ui/panel-look.test.ts`
- `UNSIZED_SHARE_KEY` — `tests/core/health-witness.test.ts`, `tests/core/last-heal-rule.test.ts`
- `USERSCRIPT_NAME` — `tests/e2e/build-once.ts`
- `USES_MARK` — `tests/repository/workflows.test.ts`
- `VARIABLE_OPENER` — `tests/ui/panel-look.test.ts`
- `VERB_ROW_OPENER` — `tests/verb-purities.ts`
- `VERSION` — `tests/tools/preview-site.test.ts`
- `VERSION_HEADING` — `tests/repository/changelog.test.ts`
- `VERSION_OPENER` — `tests/e2e/build-once.ts`
- `VICTIM` — `tests/core/injure-rule.test.ts`
- `VIEWPORT` — `tests/ui/panel-gesture.test.ts`, `tests/ui/view-failure.test.ts`
- `VIEWPORT_WIDTH` — `tests/tools/panel-shots.test.ts`
- `VISIBLE_LEAST` — `tests/e2e/panel-drag.spec.ts`
- `WARRIOR_FIELDS` — `tests/recorded-fights.ts`
- `WEAKENED_WOUND` — `tests/core/fight-decoder.test.ts`
- `WHEEL_DOWN` — `tests/e2e/panel-scroll.spec.ts`
- `WHITE` — `tests/ui/panel-look.test.ts`
- `WHOLE` — `tests/ports/warrior-entries.test.ts`
- `WIDER` — `tests/e2e/panel-size.spec.ts`
- `WIDEST_HELPER_WINDOW` — `tests/ui/share-bound.test.ts`
- `WIDEST_SCREEN` — `tests/ui/share-bound.test.ts`
- `WIDEST_SECTION` — `tests/ui/share-bound.test.ts`
- `WIDTH_DECLARATION` — `tests/tools/preview-site.test.ts`
- `WIDTH_ROOM` — `tests/ui/card-window.test.ts`
- `WINDOW` — `tests/ui/panel-drag.test.ts`
- `WINDOW_HEIGHT` — `tests/e2e/panel-drag.spec.ts`
- `WINDOW_WIDTH` — `tests/e2e/panel-drag.spec.ts`
- `WITHOUT_ACTOR` — `tests/ui/full-cast-bound.test.ts`
- `WITHOUT_TARGET` — `tests/ui/full-cast-bound.test.ts`
- `WITNESSED` — `tests/core/carried-figure.test.ts`
- `WON` — `tests/core/fight-decoder.test.ts`
- `WORDS` — `tests/tools/preview-page.test.ts`
- `WORDS_HOLDING_NO_PLACE` — `tests/ui/level-drawn.test.ts`
- `WORDS_SUFFIX` — `tests/repository/name-register.test.ts`
- `WORD_JOINER` — `tests/repository/names.test.ts`
- `WORKFLOWS_DIRECTORY` — `tests/repository/workflows.test.ts`
- `WORLD` — `tests/runtime-world.ts`
- `WOUND` — `tests/core/injure-rule.test.ts`, `tests/core/wound-rule.test.ts`
- `WRAP_FAILURES_MAXIMUM` — `tests/ports/margonem-engine-battle.test.ts`
- `WRITE_FLAG` — `tests/repository/name-register.test.ts`
- `gradesHeld` — `tests/tools/turn-count.test.ts`
- `lint` — `tests/source-tree.ts`
- `recordedFights` — `tests/recorded-fights.ts`
- `test` — `tests/e2e/panel-fixture.ts`
- `walksHeld` — `tests/tools/turn-reading.test.ts`

## Import aliases

### `libs/`

- `errors` — `libs/json-text.ts`

### `src/ports/`

- `errors` — in 12 files: `src/ports/`

### `src/runtime/`

- `errors` — in 7 files: `src/runtime/`

### `src/ui/`

- `SKILLS_KEPT_MAXIMUM` — `src/ui/panel-content.ts`
- `errors` — in 4 files: `src/ui/`

### `src/`

- `errors` — `src/userscript-entry.ts`

### `tools/`

- `errors` — in 12 files: `tools/`
- `parseJsonc` — `tools/build-userscript.ts`, `tools/panel-shots.ts`

### `tests/`

- `HELP_DATE_FIELD` — `tests/tools/frozen-files.test.ts`
- `KEY_DATE_FIELD` — `tests/tools/frozen-files.test.ts`
- `SKILLS_KEPT_MAXIMUM` — `tests/ui/panel-content.test.ts`
- `SKILL_DATE_FIELD` — `tests/tools/frozen-files.test.ts`
- `SKILL_PATH` — `tests/tools/frozen-files.test.ts`
- `STATUS_DATE_FIELD` — `tests/tools/frozen-files.test.ts`
- `TICK_KEY` — `tests/core/injure-rule.test.ts`
- `base` — `tests/e2e/panel-fixture.ts`
- `errors` — in 22 files: `tests/`
- `parseJsonc` — `tests/repository/documents.test.ts`, `tests/repository/name-register.test.ts`
- `protocolKeys` — `tests/core/aura-standing.test.ts`

## Locals

### `libs/`

- `bogusClose` — `libs/html-text.ts`
- `character` — `libs/html-text.ts`, `libs/text-walk.ts`
- `close` — `libs/html-text.ts`
- `codePoint` — `libs/html-text.ts`
- `collapsed` — `libs/html-text.ts`
- `commentClose` — `libs/html-text.ts`
- `decimal` — `libs/number-text.ts`
- `decoded` — `libs/html-text.ts`
- `digits` — `libs/number-text.ts`
- `digitsAt` — `libs/html-text.ts`
- `digitsEnd` — `libs/html-text.ts`
- `digitsFrom` — `libs/html-text.ts`
- `elementEnd` — `libs/html-text.ts`
- `end` — `libs/html-text.ts`, `libs/text-walk.ts`
- `fieldValue` — `libs/unknown-value.ts`
- `folded` — `libs/html-text.ts`
- `from` — `libs/html-text.ts`
- `index` — `libs/html-text.ts`, `libs/text-walk.ts`
- `integer` — `libs/number-text.ts`
- `isEscaped` — `libs/text-walk.ts`
- `isHexadecimal` — `libs/html-text.ts`
- `isValueNext` — `libs/html-text.ts`
- `kept` — `libs/html-text.ts`
- `key` — `libs/unknown-value.ts`
- `look` — `libs/html-text.ts`, `libs/text-walk.ts`
- `marker` — `libs/html-text.ts`
- `name` — `libs/html-text.ts`
- `nameEnd` — `libs/html-text.ts`
- `open` — `libs/html-text.ts`
- `opening` — `libs/html-text.ts`, `libs/text-walk.ts`
- `parsed` — `libs/json-text.ts`
- `parsedText` — `libs/json-text.ts`
- `point` — `libs/number-text.ts`
- `quote` — `libs/html-text.ts`
- `reference` — `libs/html-text.ts`
- `runEnd` — `libs/text-walk.ts`
- `text` — `libs/html-text.ts`, `libs/number-text.ts`, `libs/unknown-value.ts`
- `written` — `libs/json-text.ts`
- `zerosEnd` — `libs/html-text.ts`

### `src/core/`

- `absorbed` — `src/core/fight-statistics.ts`
- `absorbedPart` — `src/core/fight-statistics.ts`
- `absorbedParts` — `src/core/fight-statistics.ts`
- `actor` — `src/core/fight-decoder.ts`
- `actorId` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`,
  `src/core/legendary-standing.ts`
- `actorSegment` — `src/core/fight-decoder.ts`
- `amount` — in 4 files: `src/core/`
- `amountByKey` — `src/core/aura-standing.ts`
- `amountIndex` — `src/core/carried-figure.ts`
- `amountText` — `src/core/fight-decoder.ts`
- `amountsDescending` — `src/core/carried-figure.ts`
- `announced` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `announcedHere` — `src/core/fight-decoder.ts`
- `announcedWound` — `src/core/fight-statistics.ts`
- `announcementStanding` — `src/core/fight-decoder.ts`
- `applied` — `src/core/fight-statistics.ts`
- `attack` — `src/core/fight-decoder.ts`
- `auraTurnsBySkillId` — `src/core/aura-standing.ts`
- `band` — `src/core/combatant-health.ts`
- `bearer` — `src/core/carried-figure.ts`
- `bit` — `src/core/carried-figure.ts`, `src/core/carried-status.ts`
- `blow` — `src/core/fight-statistics.ts`
- `blowsGranted` — `src/core/fight-decoder.ts`
- `blowsGrantedBySkillId` — `src/core/fight-decoder.ts`
- `blowsRemaining` — `src/core/fight-decoder.ts`
- `bonus` — `src/core/legendary-standing.ts`, `src/core/protocol-key.ts`
- `byId` — `src/core/combatant-roster.ts`
- `candidates` — `src/core/fight-statistics.ts`
- `carriedFigures` — `src/core/carried-figure.ts`
- `carriedStatuses` — `src/core/carried-status.ts`
- `cast` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`
- `castReach` — `src/core/aura-standing.ts`
- `caster` — `src/core/carried-figure.ts`
- `casterId` — `src/core/combatant-health.ts`, `src/core/fight-statistics.ts`
- `casterSide` — `src/core/combatant-health.ts`
- `casts` — `src/core/carried-figure.ts`
- `castsOverBearer` — `src/core/carried-figure.ts`
- `change` — `src/core/protocol-key.ts`
- `charge` — `src/core/charged-skill.ts`
- `chargeBrokenIds` — `src/core/charged-skill.ts`
- `chargeStatementByCombatantId` — `src/core/fight-session.ts`
- `chargedSkills` — `src/core/fight-session.ts`
- `charging` — `src/core/charged-skill.ts`
- `combatant` — in 4 files: `src/core/`
- `combatantId` — in 8 files: `src/core/`
- `combatantIds` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `combatantNames` — `src/core/fight-decoder.ts`
- `combatants` — `src/core/fight-session.ts`
- `count` — `src/core/fight-decoder.ts`
- `counts` — `src/core/fight-session.ts`, `src/core/legendary-standing.ts`
- `countsByCombatantId` — `src/core/legendary-standing.ts`
- `cut` — `src/core/fight-statistics.ts`
- `cutForOtherEnd` — `src/core/fight-statistics.ts`
- `cutKey` — `src/core/fight-session.ts`
- `cutKeys` — `src/core/fight-session.ts`
- `cutTotal` — `src/core/fight-statistics.ts`
- `damage` — `src/core/fight-decoder.ts`
- `datedCasts` — `src/core/aura-standing.ts`
- `dealer` — `src/core/fight-statistics.ts`
- `dealt` — `src/core/fight-statistics.ts`
- `dealtCut` — `src/core/fight-statistics.ts`
- `dealtToNobody` — `src/core/fight-statistics.ts`
- `declaration` — `src/core/fight-decoder.ts`
- `declared` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `declaredEffect` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`
- `declaredShare` — `src/core/fight-decoder.ts`
- `decoded` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `defence` — `src/core/fight-statistics.ts`, `src/core/protocol-key.ts`
- `defenceByDefence` — `src/core/protocol-key.ts`
- `destroyed` — `src/core/fight-statistics.ts`
- `effect` — `src/core/aura-standing.ts`
- `element` — `src/core/fight-statistics.ts`
- `elementText` — `src/core/fight-decoder.ts`
- `elements` — `src/core/fight-statistics.ts`
- `elementsAbsorbed` — `src/core/fight-statistics.ts`
- `end` — `src/core/protocol-key.ts`
- `ending` — `src/core/protocol-key.ts`
- `entryHealthByCombatantId` — `src/core/combatant-health.ts`
- `event` — in 7 files: `src/core/`
- `eventCombatantIds` — `src/core/fight-session.ts`
- `eventCutKeys` — `src/core/fight-session.ts`
- `eventIndex` — `src/core/aura-standing.ts`
- `events` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `eventsAfter` — `src/core/fight-session.ts`
- `eventsAtSeating` — `src/core/aura-standing.ts`, `src/core/fight-session.ts`
- `eventsAtSeatingByCombatantId` — `src/core/fight-session.ts`
- `eventsBefore` — `src/core/fight-session.ts`
- `existing` — `src/core/fight-statistics.ts`
- `field` — `src/core/fight-statistics.ts`
- `figure` — `src/core/fight-statistics.ts`
- `figures` — `src/core/fight-statistics.ts`
- `fraction` — `src/core/protocol-number.ts`
- `from` — `src/core/fight-decoder.ts`
- `given` — `src/core/fight-statistics.ts`
- `giver` — `src/core/fight-statistics.ts`
- `giverId` — `src/core/fight-statistics.ts`
- `half` — `src/core/protocol-key.ts`
- `hasClosed` — `src/core/fight-session.ts`
- `hasSpentLastheal` — `src/core/legendary-standing.ts`
- `heal` — `src/core/combatant-health.ts`, `src/core/fight-statistics.ts`
- `healed` — `src/core/fight-statistics.ts`
- `heals` — `src/core/combatant-health.ts`, `src/core/legendary-standing.ts`
- `health` — `src/core/combatant-health.ts`
- `healthAtEntry` — `src/core/combatant-health.ts`
- `healthByCombatantId` — `src/core/combatant-health.ts`
- `healthNow` — `src/core/combatant-health.ts`
- `healthPercent` — `src/core/fight-decoder.ts`, `src/core/protocol-number.ts`
- `highest` — `src/core/carried-figure.ts`
- `highestByCasterId` — `src/core/carried-figure.ts`
- `holderId` — `src/core/legendary-standing.ts`
- `holytouchHealsByBearerId` — `src/core/legendary-standing.ts`
- `idByName` — `src/core/combatant-roster.ts`
- `idText` — `src/core/fight-decoder.ts`
- `imbalance` — `src/core/fight-statistics.ts`
- `isBlow` — `src/core/fight-decoder.ts`
- `isLit` — `src/core/legendary-standing.ts`
- `isOnAuto` — `src/core/fight-session.ts`
- `isRead` — `src/core/fight-decoder.ts`
- `isShout` — `src/core/aura-standing.ts`
- `isShoutRead` — `src/core/fight-decoder.ts`
- `isStriking` — `src/core/turn-clock.ts`
- `isUserNamed` — `src/core/fight-decoder.ts`
- `isWhole` — `src/core/combatant-health.ts`
- `key` — in 6 files: `src/core/`
- `keyByStatusBit` — `src/core/carried-figure.ts`
- `keyMeaning` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `keyMeaningByKey` — `src/core/protocol-key.ts`
- `keys` — `src/core/fight-decoder.ts`, `src/core/legendary-standing.ts`
- `kind` — `src/core/fight-statistics.ts`
- `kinds` — `src/core/fight-statistics.ts`
- `lastHealSpentCombatantIds` — `src/core/legendary-standing.ts`
- `lightingTurnByBit` — `src/core/carried-status.ts`
- `lightingTurnByBitByCombatantId` — `src/core/carried-status.ts`
- `listed` — `src/core/protocol-key.ts`
- `longest` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`
- `look` — `src/core/fight-decoder.ts`
- `lost` — `src/core/fight-statistics.ts`
- `magnitude` — `src/core/fight-decoder.ts`
- `mask` — `src/core/carried-status.ts`
- `maximum` — `src/core/combatant-health.ts`
- `mechanism` — `src/core/fight-statistics.ts`
- `member` — `src/core/fight-decoder.ts`
- `members` — `src/core/fight-decoder.ts`
- `message` — `src/core/fight-decoder.ts`
- `messagesLost` — `src/core/fight-session.ts`
- `moved` — `src/core/fight-decoder.ts`
- `name` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`
- `named` — `src/core/fight-decoder.ts`
- `namedCombatantIds` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `namedText` — `src/core/fight-decoder.ts`
- `names` — `src/core/fight-decoder.ts`
- `openerId` — `src/core/fight-statistics.ts`
- `openerIndex` — `src/core/fight-decoder.ts`
- `options` — `src/core/fight-session.ts`
- `otherEndKey` — `src/core/fight-statistics.ts`
- `outcomeSoFar` — `src/core/fight-statistics.ts`
- `ownerId` — `src/core/fight-statistics.ts`
- `parameter` — `src/core/fight-decoder.ts`
- `parameters` — `src/core/fight-decoder.ts`
- `parametersDecoded` — `src/core/fight-decoder.ts`
- `parametersReadCount` — `src/core/fight-decoder.ts`
- `payloadIndex` — `src/core/fight-session.ts`
- `payloadsApplied` — `src/core/fight-session.ts`
- `percent` — `src/core/carried-figure.ts`, `src/core/combatant-health.ts`
- `percentText` — `src/core/fight-decoder.ts`
- `places` — `src/core/combatant-health.ts`
- `pointIndex` — `src/core/protocol-number.ts`
- `preventedPart` — `src/core/fight-statistics.ts`
- `preventedParts` — `src/core/fight-statistics.ts`
- `provocation` — `src/core/aura-standing.ts`
- `provocationStandings` — `src/core/aura-standing.ts`
- `provokedId` — `src/core/aura-standing.ts`
- `provokedIds` — `src/core/aura-standing.ts`
- `raw` — `src/core/fight-statistics.ts`
- `reach` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`, `src/core/protocol-key.ts`
- `reached` — `src/core/legendary-standing.ts`
- `reachedByCombatantId` — `src/core/legendary-standing.ts`
- `reachedId` — `src/core/legendary-standing.ts`
- `reducedSides` — `src/core/combatant-health.ts`
- `restored` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `restoredByCombatantId` — `src/core/combatant-health.ts`
- `restoredByNobody` — `src/core/fight-statistics.ts`
- `restoredCut` — `src/core/fight-statistics.ts`
- `roster` — `src/core/fight-session.ts`
- `seenIndex` — `src/core/fight-session.ts`
- `segment` — `src/core/fight-decoder.ts`
- `segments` — `src/core/fight-decoder.ts`
- `separatorIndex` — `src/core/fight-decoder.ts`
- `share` — `src/core/combatant-health.ts`
- `shout` — `src/core/aura-standing.ts`
- `shoutNames` — `src/core/aura-standing.ts`
- `shoutStated` — `src/core/aura-standing.ts`
- `shoutsBySkillId` — `src/core/aura-standing.ts`
- `sideHealByEvent` — `src/core/fight-figures.ts`
- `skill` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`
- `skillFigures` — `src/core/fight-statistics.ts`
- `skillId` — `src/core/fight-decoder.ts`
- `skillNames` — `src/core/charged-skill.ts`, `src/core/fight-session.ts`
- `skillNamesByActorId` — `src/core/charged-skill.ts`
- `skills` — `src/core/fight-statistics.ts`
- `source` — `src/core/combatant-health.ts`
- `standingBefore` — `src/core/charged-skill.ts`
- `standingByCombatantId` — `src/core/legendary-standing.ts`
- `standingsNow` — `src/core/charged-skill.ts`
- `state` — `src/core/charged-skill.ts`, `src/core/fight-session.ts`
- `stateAfter` — `src/core/fight-session.ts`
- `stateBefore` — `src/core/fight-session.ts`
- `stated` — `src/core/combatant-health.ts`, `src/core/fight-statistics.ts`
- `statedEnd` — `src/core/fight-decoder.ts`
- `statement` — `src/core/charged-skill.ts`, `src/core/fight-session.ts`
- `statementByCombatantId` — `src/core/charged-skill.ts`
- `statistics` — `src/core/fight-figures.ts`
- `status` — `src/core/carried-figure.ts`
- `statusMasksByCombatantId` — `src/core/fight-session.ts`
- `stopped` — `src/core/fight-statistics.ts`
- `summed` — `src/core/carried-figure.ts`
- `taken` — `src/core/fight-statistics.ts`
- `takenCut` — `src/core/fight-statistics.ts`
- `takenFromNobody` — `src/core/fight-statistics.ts`
- `tallying` — `src/core/fight-statistics.ts`
- `target` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `targetId` — `src/core/legendary-standing.ts`
- `targetName` — `src/core/fight-decoder.ts`
- `targetSegment` — `src/core/fight-decoder.ts`
- `text` — `src/core/fight-decoder.ts`, `src/core/protocol-number.ts`
- `tickFigures` — `src/core/fight-statistics.ts`
- `token` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `total` — `src/core/fight-statistics.ts`
- `totals` — `src/core/fight-statistics.ts`
- `turnLost` — `src/core/fight-decoder.ts`
- `turnStanding` — `src/core/aura-standing.ts`, `src/core/carried-status.ts`
- `turnStatement` — `src/core/fight-session.ts`
- `turns` — `src/core/aura-standing.ts`
- `turnsAtCast` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`
- `turnsAtCastByCombatantId` — `src/core/aura-standing.ts`
- `turnsAtLighting` — `src/core/carried-status.ts`
- `turnsAtShout` — `src/core/aura-standing.ts`
- `turnsByCombatantId` — `src/core/carried-status.ts`
- `turnsElapsed` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`,
  `src/core/carried-status.ts`
- `turnsNow` — `src/core/carried-status.ts`
- `turnsStated` — `src/core/aura-standing.ts`
- `turnsTaken` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`, `src/core/turn-clock.ts`
- `turnsTakenNow` — `src/core/aura-standing.ts`
- `unaccounted` — `src/core/fight-decoder.ts`
- `unread` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`,
  `src/core/fight-statistics.ts`
- `unreadCause` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `valueText` — `src/core/fight-decoder.ts`
- `walk` — `src/core/aura-standing.ts`
- `wasOver` — `src/core/fight-session.ts`
- `weakeningPercent` — `src/core/fight-statistics.ts`
- `wound` — `src/core/fight-statistics.ts`
- `woundTicking` — `src/core/fight-statistics.ts`
- `wounded` — `src/core/fight-statistics.ts`
- `woundedId` — `src/core/fight-statistics.ts`

### `src/ports/`

- `ac` — `src/ports/margonem-engine-warriors.ts`
- `after` — `src/ports/margonem-engine-battle.ts`
- `anchor` — `src/ports/browser-file.ts`
- `answer` — `src/ports/margonem-engine-battle.ts`
- `asNumber` — `src/ports/payload-envelope.ts`
- `asText` — `src/ports/payload-envelope.ts`
- `askEngine` — `src/ports/margonem-engine-battle.ts`
- `asked` — in 4 files: `src/ports/`
- `battle` — `src/ports/margonem-engine-battle.ts`, `src/ports/margonem-engine-tooltip.ts`
- `before` — `src/ports/margonem-engine-battle.ts`
- `block` — `src/ports/margonem-engine-tooltip.ts`
- `blockBefore` — `src/ports/margonem-engine-tooltip.ts`
- `blockIndex` — `src/ports/margonem-engine-tooltip.ts`
- `blockLeft` — `src/ports/margonem-engine-tooltip.ts`
- `blocksById` — `src/ports/margonem-engine-tooltip.ts`
- `blocksWritten` — `src/ports/margonem-engine-tooltip.ts`
- `build` — `src/ports/margonem-client-build.ts`
- `buildEnd` — `src/ports/margonem-client-build.ts`
- `buildStart` — `src/ports/margonem-client-build.ts`
- `callIndex` — `src/ports/fight-capture.ts`
- `character` — `src/ports/margonem-client-build.ts`
- `charge` — `src/ports/payload-envelope.ts`
- `collection` — `src/ports/margonem-engine-warriors.ts`
- `collectionKey` — `src/ports/margonem-engine-warriors.ts`
- `combatant` — `src/ports/payload-envelope.ts`
- `combatantId` — `src/ports/payload-envelope.ts`
- `copied` — `src/ports/margonem-engine-warriors.ts`
- `copiedValue` — `src/ports/margonem-engine-warriors.ts`
- `count` — `src/ports/payload-envelope.ts`
- `counts` — `src/ports/margonem-engine-tooltip.ts`
- `dateValue` — `src/ports/browser-time.ts`
- `day` — `src/ports/browser-time.ts`
- `deleted` — `src/ports/browser-store.ts`
- `detached` — `src/ports/margonem-engine-battle.ts`
- `dictionaryText` — `src/ports/margonem-client-dictionary.ts`
- `drawnById` — `src/ports/margonem-engine-tooltip.ts`
- `end` — `src/ports/browser-surroundings.ts`, `src/ports/margonem-client-build.ts`
- `energy` — `src/ports/margonem-engine-warriors.ts`
- `engine` — `src/ports/margonem-engine-battle.ts`
- `engineMember` — `src/ports/margonem-engine-battle.ts`
- `failures` — `src/ports/margonem-engine-battle.ts`
- `field` — `src/ports/payload-envelope.ts`
- `figure` — `src/ports/payload-envelope.ts`
- `find` — `src/ports/margonem-engine-tooltip.ts`
- `firstCharacter` — `src/ports/margonem-client-dictionary.ts`
- `firstFailure` — `src/ports/margonem-engine-battle.ts`
- `firstRow` — `src/ports/margonem-engine-tooltip.ts`
- `from` — `src/ports/margonem-client-build.ts`
- `getEngine` — `src/ports/margonem-engine-battle.ts`
- `handle` — `src/ports/browser-time.ts`
- `hasEngine` — `src/ports/margonem-engine-battle.ts`
- `head` — `src/ports/margonem-client-build.ts`
- `health` — `src/ports/payload-envelope.ts`
- `hero` — `src/ports/margonem-engine-place.ts`
- `heroData` — `src/ports/margonem-engine-hero.ts`
- `hostText` — `src/ports/browser-surroundings.ts`
- `hour` — `src/ports/browser-time.ts`
- `hp` — `src/ports/margonem-engine-warriors.ts`
- `id` — in 4 files: `src/ports/`
- `ids` — `src/ports/payload-envelope.ts`
- `idsSeen` — `src/ports/margonem-engine-warriors.ts`
- `integer` — `src/ports/payload-envelope.ts`
- `isKept` — `src/ports/fight-capture.ts`
- `isSigned` — `src/ports/margonem-client-dictionary.ts`
- `isWrapStanding` — `src/ports/margonem-engine-battle.ts`
- `kept` — `src/ports/fight-capture.ts`, `src/ports/margonem-engine-tooltip.ts`
- `keptCall` — `src/ports/fight-capture.ts`
- `key` — `src/ports/margonem-engine-warriors.ts`
- `keyed` — `src/ports/payload-envelope.ts`
- `keys` — `src/ports/fight-capture.ts`
- `label` — `src/ports/margonem-client-dictionary.ts`
- `landing` — `src/ports/margonem-engine-tooltip.ts`
- `laterRows` — `src/ports/margonem-engine-tooltip.ts`
- `least` — `src/ports/payload-envelope.ts`
- `level` — `src/ports/payload-envelope.ts`
- `listed` — `src/ports/payload-envelope.ts`
- `look` — `src/ports/margonem-client-build.ts`
- `lvl` — `src/ports/margonem-engine-warriors.ts`
- `mana` — `src/ports/margonem-engine-warriors.ts`
- `map` — `src/ports/margonem-engine-place.ts`
- `mapName` — `src/ports/margonem-engine-place.ts`
- `mask` — `src/ports/payload-envelope.ts`
- `maximum` — `src/ports/payload-envelope.ts`
- `member` — `src/ports/browser-surroundings.ts`
- `memberRecord` — `src/ports/margonem-engine-battle.ts`
- `message` — `src/ports/payload-envelope.ts`
- `messages` — `src/ports/payload-envelope.ts`
- `messagesStated` — `src/ports/payload-envelope.ts`
- `minute` — `src/ports/browser-time.ts`
- `moment` — `src/ports/browser-time.ts`
- `monthFromZero` — `src/ports/browser-time.ts`
- `name` — `src/ports/margonem-engine-place.ts`, `src/ports/margonem-engine-warriors.ts`,
  `src/ports/payload-envelope.ts`
- `named` — `src/ports/margonem-engine-warriors.ts`
- `nextBlocksById` — `src/ports/margonem-engine-tooltip.ts`
- `now` — `src/ports/browser-time.ts`, `src/ports/payload-envelope.ts`
- `onAutoStated` — `src/ports/payload-envelope.ts`
- `open` — `src/ports/margonem-client-dictionary.ts`
- `ordinal` — `src/ports/payload-envelope.ts`
- `ordinalText` — `src/ports/payload-envelope.ts`
- `ordinals` — `src/ports/payload-envelope.ts`
- `original` — `src/ports/margonem-engine-battle.ts`
- `payloadCopy` — `src/ports/fight-capture.ts`
- `prof` — `src/ports/margonem-engine-warriors.ts`
- `profession` — `src/ports/payload-envelope.ts`
- `queue` — `src/ports/payload-envelope.ts`
- `ran` — `src/ports/browser-time.ts`
- `readerSide` — `src/ports/payload-envelope.ts`
- `refused` — `src/ports/margonem-engine-tooltip.ts`
- `registryText` — `src/ports/margonem-engine-tooltip.ts`
- `revoked` — `src/ports/browser-file.ts`
- `row` — `src/ports/margonem-engine-tooltip.ts`
- `rows` — `src/ports/margonem-engine-tooltip.ts`
- `scheduled` — `src/ports/browser-file.ts`
- `scriptIndex` — `src/ports/margonem-client-build.ts`
- `shape` — `src/ports/fight-capture.ts`
- `side` — `src/ports/payload-envelope.ts`
- `skillName` — `src/ports/payload-envelope.ts`
- `snapshot` — `src/ports/margonem-engine-warriors.ts`
- `source` — `src/ports/margonem-client-build.ts`
- `sources` — `src/ports/margonem-client-build.ts`
- `span` — `src/ports/margonem-client-build.ts`
- `state` — `src/ports/fight-capture.ts`
- `stated` — in 4 files: `src/ports/`
- `storedText` — `src/ports/browser-store.ts`
- `targets` — `src/ports/margonem-engine-tooltip.ts`
- `team` — `src/ports/margonem-engine-warriors.ts`
- `text` — in 4 files: `src/ports/`
- `theirs` — `src/ports/margonem-engine-tooltip.ts`
- `timestampText` — `src/ports/browser-time.ts`
- `tooLong` — `src/ports/browser-store.ts`
- `translate` — `src/ports/margonem-client-dictionary.ts`
- `translation` — `src/ports/margonem-client-dictionary.ts`
- `turnStatement` — `src/ports/payload-envelope.ts`
- `turnsElapsed` — `src/ports/payload-envelope.ts`
- `turnsStated` — `src/ports/payload-envelope.ts`
- `unsigned` — `src/ports/margonem-client-dictionary.ts`
- `url` — `src/ports/browser-file.ts`
- `userAgent` — `src/ports/browser-surroundings.ts`
- `valuesByKey` — `src/ports/browser-store.ts`
- `walked` — `src/ports/margonem-client-build.ts`
- `warrior` — `src/ports/margonem-engine-tooltip.ts`, `src/ports/margonem-engine-warriors.ts`
- `warriorElement` — `src/ports/margonem-engine-tooltip.ts`
- `warriorEntries` — `src/ports/payload-envelope.ts`
- `warriorEntry` — `src/ports/payload-envelope.ts`
- `warriors` — `src/ports/margonem-engine-tooltip.ts`, `src/ports/payload-envelope.ts`
- `warriorsById` — `src/ports/margonem-engine-tooltip.ts`
- `wasClicked` — `src/ports/browser-file.ts`
- `world` — `src/ports/browser-surroundings.ts`
- `wrapper` — `src/ports/margonem-engine-battle.ts`
- `written` — `src/ports/browser-store.ts`, `src/ports/fight-capture.ts`
- `x` — `src/ports/margonem-engine-place.ts`
- `y` — `src/ports/margonem-engine-place.ts`

### `src/runtime/`

- `abandoned` — `src/runtime/margometer-runtime.ts`
- `addOnVersion` — `src/runtime/fight-file.ts`
- `alsoKept` — `src/runtime/panel-frame.ts`
- `amount` — `src/runtime/fight-file.ts`
- `answered` — `src/runtime/shelf-keeper.ts`
- `answers` — `src/runtime/panel-frame.ts`
- `applied` — `src/runtime/margometer-runtime.ts`
- `asked` — `src/runtime/shelf-keeper.ts`
- `attempts` — `src/runtime/shelf.ts`
- `battle` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `battlePort` — `src/runtime/margometer-runtime.ts`
- `build` — `src/runtime/fight-file.ts`
- `buildId` — `src/runtime/fight-handover.ts`
- `builtState` — `src/runtime/margometer-runtime.ts`
- `call` — `src/runtime/live-fight.ts`
- `calls` — `src/runtime/fight-handover.ts`
- `cancelled` — `src/runtime/margometer-runtime.ts`
- `capturedAt` — `src/runtime/fight-handover.ts`
- `carried` — `src/runtime/carried-tooltip.ts`
- `carriedFigure` — `src/runtime/carried-tooltip.ts`
- `caster` — `src/runtime/carried-tooltip.ts`
- `chosen` — `src/runtime/fight-state.ts`, `src/runtime/shelf-keeper.ts`
- `chosenFightOpenedAt` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `combatant` — `src/runtime/panel-frame.ts`
- `combatantId` — `src/runtime/carried-tooltip.ts`, `src/runtime/margometer-runtime.ts`
- `committed` — `src/runtime/live-fight.ts`
- `counted` — `src/runtime/panel-frame.ts`
- `countsByRowKey` — `src/runtime/defect-ledger.ts`
- `cut` — `src/runtime/fight-file.ts`
- `defectCount` — `src/runtime/defect-ledger.ts`
- `defects` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`,
  `src/runtime/shelf-keeper.ts`
- `deleted` — `src/runtime/shelf-keeper.ts`
- `dropped` — `src/runtime/shelf.ts`
- `encoded` — `src/runtime/fight-handover.ts`, `src/runtime/shelf.ts`
- `end` — `src/runtime/margometer-runtime.ts`
- `escaped` — `src/runtime/margometer-runtime.ts`
- `failure` — in 4 files: `src/runtime/`
- `fight` — `src/runtime/live-fight.ts`, `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `fightIndex` — `src/runtime/shelf.ts`
- `fightStandings` — `src/runtime/carried-tooltip.ts`
- `fightState` — `src/runtime/fight-handover.ts`, `src/runtime/panel-frame.ts`,
  `src/runtime/shelf-keeper.ts`
- `fights` — `src/runtime/shelf.ts`
- `fightsAfter` — `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `fightsUnreadable` — `src/runtime/shelf.ts`
- `figures` — `src/runtime/fight-file.ts`, `src/runtime/fight-state.ts`,
  `src/runtime/panel-frame.ts`
- `figuresByCombatantAndBit` — `src/runtime/carried-tooltip.ts`
- `firstKey` — `src/runtime/settings.ts`
- `firstLook` — `src/runtime/margometer-runtime.ts`
- `firstNumber` — `src/runtime/settings.ts`
- `halfNamedOpened` — `src/runtime/panel-frame.ts`
- `handle` — `src/runtime/margometer-runtime.ts`
- `handover` — `src/runtime/fight-handover.ts`
- `hasFightToSave` — `src/runtime/panel-frame.ts`
- `hasMoved` — `src/runtime/margometer-runtime.ts`
- `headcount` — `src/runtime/panel-frame.ts`
- `height` — `src/runtime/settings.ts`
- `helper` — `src/runtime/panel-frame.ts`
- `helperRead` — `src/runtime/panel-frame.ts`
- `id` — `src/runtime/fight-file.ts`, `src/runtime/shelf.ts`
- `innerCut` — `src/runtime/fight-file.ts`
- `interval` — `src/runtime/margometer-runtime.ts`
- `isCaptured` — `src/runtime/live-fight.ts`
- `isCollapsed` — `src/runtime/margometer-runtime.ts`
- `isOpening` — `src/runtime/live-fight.ts`
- `isRefusedOpening` — `src/runtime/live-fight.ts`
- `isShelfEmpty` — `src/runtime/panel-frame.ts`
- `isTallied` — `src/runtime/margometer-runtime.ts`
- `keeper` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `keptFight` — `src/runtime/fight-handover.ts`, `src/runtime/fight-state.ts`,
  `src/runtime/panel-frame.ts`
- `keptFightState` — `src/runtime/fight-state.ts`
- `keptFightStatesByOpenedAt` — `src/runtime/panel-frame.ts`
- `keptFights` — `src/runtime/panel-frame.ts`
- `keptFightsNewestFirst` — `src/runtime/panel-frame.ts`
- `keptOpenedAts` — `src/runtime/shelf.ts`
- `keptUnread` — `src/runtime/panel-frame.ts`
- `key` — `src/runtime/fight-file.ts`, `src/runtime/settings.ts`
- `kind` — `src/runtime/defect-ledger.ts`
- `kindsWritten` — `src/runtime/defect-ledger.ts`
- `label` — `src/runtime/margometer-runtime.ts`
- `ledger` — `src/runtime/panel-frame.ts`
- `legendary` — `src/runtime/carried-tooltip.ts`
- `listed` — `src/runtime/shelf.ts`
- `listener` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `liveFight` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/panel-frame.ts`
- `liveFightState` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `liveOpenedAt` — `src/runtime/panel-frame.ts`
- `liveRow` — `src/runtime/panel-frame.ts`
- `mapName` — `src/runtime/shelf.ts`
- `margonemClientBuild` — `src/runtime/fight-handover.ts`, `src/runtime/shelf.ts`
- `messages` — `src/runtime/live-fight.ts`
- `messagesByPayload` — `src/runtime/fight-state.ts`
- `metric` — `src/runtime/margometer-runtime.ts`
- `moment` — `src/runtime/panel-frame.ts`
- `momentForName` — `src/runtime/fight-file.ts`
- `mounted` — `src/runtime/margometer-runtime.ts`
- `newest` — `src/runtime/fight-state.ts`
- `now` — `src/runtime/fight-handover.ts`, `src/runtime/live-fight.ts`
- `offered` — `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `opened` — `src/runtime/panel-frame.ts`, `src/runtime/shelf-keeper.ts`
- `openedAt` — `src/runtime/live-fight.ts`, `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `openedLevels` — `src/runtime/panel-frame.ts`
- `outcome` — `src/runtime/panel-frame.ts`
- `pair` — `src/runtime/fight-file.ts`, `src/runtime/panel-frame.ts`, `src/runtime/settings.ts`
- `parsed` — `src/runtime/settings.ts`, `src/runtime/shelf.ts`
- `partLevel` — `src/runtime/panel-frame.ts`
- `payload` — `src/runtime/fight-state.ts`
- `payloadRecord` — `src/runtime/live-fight.ts`
- `payloads` — `src/runtime/live-fight.ts`, `src/runtime/shelf.ts`
- `payloadsReplayedCount` — `src/runtime/fight-handover.ts`, `src/runtime/shelf-keeper.ts`
- `pinned` — `src/runtime/shelf.ts`
- `pinnedCase` — `src/runtime/panel-frame.ts`
- `place` — `src/runtime/panel-frame.ts`, `src/runtime/shelf.ts`
- `ports` — `src/runtime/margometer-runtime.ts`
- `position` — `src/runtime/margometer-runtime.ts`
- `prepared` — `src/runtime/fight-state.ts`, `src/runtime/live-fight.ts`
- `provoked` — `src/runtime/carried-tooltip.ts`
- `ran` — `src/runtime/live-fight.ts`, `src/runtime/shelf-keeper.ts`
- `ranking` — `src/runtime/panel-frame.ts`
- `readerId` — `src/runtime/shelf.ts`
- `readerSide` — `src/runtime/panel-frame.ts`
- `record` — `src/runtime/fight-state.ts`, `src/runtime/live-fight.ts`
- `refusal` — `src/runtime/live-fight.ts`
- `refused` — `src/runtime/shelf.ts`
- `region` — `src/runtime/defect-ledger.ts`
- `remaining` — `src/runtime/shelf.ts`
- `rendered` — `src/runtime/panel-frame.ts`
- `renderedWaiting` — `src/runtime/panel-frame.ts`
- `replayed` — `src/runtime/fight-state.ts`
- `report` — `src/runtime/margometer-runtime.ts`
- `reported` — `src/runtime/margometer-runtime.ts`
- `requested` — `src/runtime/margometer-runtime.ts`
- `roster` — `src/runtime/panel-frame.ts`
- `rotated` — `src/runtime/shelf.ts`
- `rowKey` — `src/runtime/defect-ledger.ts`
- `rows` — `src/runtime/defect-ledger.ts`, `src/runtime/panel-frame.ts`
- `rowsByCombatantId` — `src/runtime/carried-tooltip.ts`
- `saved` — `src/runtime/margometer-runtime.ts`
- `screen` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `search` — `src/runtime/margometer-runtime.ts`
- `secondKey` — `src/runtime/settings.ts`
- `secondNumber` — `src/runtime/settings.ts`
- `session` — `src/runtime/fight-state.ts`
- `sessionOptions` — `src/runtime/shelf-keeper.ts`
- `shorter` — `src/runtime/shelf.ts`
- `shouldDraw` — `src/runtime/margometer-runtime.ts`
- `shownFight` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `shownScreen` — `src/runtime/panel-frame.ts`
- `side` — `src/runtime/margometer-runtime.ts`
- `size` — `src/runtime/margometer-runtime.ts`
- `sizes` — `src/runtime/panel-frame.ts`
- `skill` — `src/runtime/fight-file.ts`
- `snapshotAfter` — `src/runtime/live-fight.ts`
- `standings` — `src/runtime/panel-frame.ts`
- `started` — `src/runtime/margometer-runtime.ts`
- `state` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`
- `stated` — `src/runtime/shelf.ts`
- `statedPlace` — `src/runtime/shelf.ts`
- `statistics` — `src/runtime/fight-file.ts`, `src/runtime/panel-frame.ts`
- `statusBitsCount` — `src/runtime/margometer-runtime.ts`
- `statusKey` — `src/runtime/carried-tooltip.ts`
- `statuses` — `src/runtime/carried-tooltip.ts`
- `storageChoice` — `src/runtime/margometer-runtime.ts`
- `store` — `src/runtime/shelf-keeper.ts`
- `stored` — `src/runtime/shelf.ts`
- `storedFight` — `src/runtime/shelf.ts`
- `storedText` — `src/runtime/settings.ts`
- `subject` — `src/runtime/fight-handover.ts`
- `surroundings` — `src/runtime/fight-handover.ts`
- `tables` — `src/runtime/shelf-keeper.ts`
- `targetStore` — `src/runtime/shelf-keeper.ts`
- `text` — `src/runtime/settings.ts`, `src/runtime/shelf.ts`
- `tooltipContent` — `src/runtime/carried-tooltip.ts`
- `tooltips` — `src/runtime/panel-frame.ts`
- `turn` — `src/runtime/panel-frame.ts`
- `unnamed` — `src/runtime/panel-frame.ts`
- `unnamedCut` — `src/runtime/panel-frame.ts`
- `unnamedPair` — `src/runtime/panel-frame.ts`
- `unplaced` — `src/runtime/panel-frame.ts`
- `unreadKeptFight` — `src/runtime/panel-frame.ts`
- `version` — `src/runtime/shelf.ts`
- `view` — `src/runtime/fight-state.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/panel-frame.ts`
- `waiting` — `src/runtime/panel-frame.ts`
- `warriorSnapshot` — `src/runtime/live-fight.ts`
- `width` — `src/runtime/settings.ts`
- `world` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/margometer-runtime.ts`
- `worldText` — `src/runtime/margometer-runtime.ts`
- `wrap` — `src/runtime/margometer-runtime.ts`
- `wrapped` — `src/runtime/margometer-runtime.ts`
- `written` — in 5 files: `src/runtime/`
- `x` — `src/runtime/shelf.ts`
- `y` — `src/runtime/shelf.ts`

### `src/ui/`

- `after` — `src/ui/panel-element.ts`
- `air` — `src/ui/panel-look.ts`
- `answer` — `src/ui/panel-element.ts`
- `apartCase` — `src/ui/panel-content.ts`
- `apartCases` — `src/ui/panel-content.ts`
- `apartClass` — `src/ui/panel-element.ts`
- `apartField` — `src/ui/panel-content.ts`
- `applied` — `src/ui/panel-drag.ts`
- `axes` — `src/ui/panel-screen.ts`
- `back` — `src/ui/panel-element.ts`
- `bar` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `before` — `src/ui/panel-element.ts`
- `belowRows` — `src/ui/panel-look.ts`
- `beside` — `src/ui/panel-drag.ts`
- `between` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `bigger` — `src/ui/panel-content.ts`
- `block` — `src/ui/panel-element.ts`
- `body` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `bonus` — `src/ui/panel-element.ts`
- `both` — `src/ui/panel-drag.ts`
- `bottom` — `src/ui/panel-drag.ts`
- `bounds` — `src/ui/panel-drag.ts`
- `bright` — `src/ui/panel-look.ts`
- `byAmount` — `src/ui/panel-words.ts`
- `byCast` — `src/ui/panel-helper.ts`
- `byElement` — `src/ui/panel-content.ts`
- `byLabel` — `src/ui/panel-element.ts`
- `byName` — `src/ui/panel-content.ts`
- `byOtherEnd` — `src/ui/panel-content.ts`
- `bySkill` — `src/ui/panel-content.ts`
- `byWords` — `src/ui/panel-element.ts`
- `candidate` — `src/ui/panel-element.ts`
- `cap` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `capRight` — `src/ui/panel-look.ts`
- `captured` — `src/ui/panel-drag.ts`
- `card` — `src/ui/panel-element.ts`
- `cardContext` — `src/ui/panel-element.ts`
- `cardElement` — `src/ui/panel-element.ts`
- `cardFigure` — `src/ui/panel-element.ts`
- `cardHandle` — `src/ui/panel-element.ts`
- `carrier` — `src/ui/panel-content.ts`
- `carriers` — `src/ui/panel-content.ts`
- `cast` — `src/ui/panel-element.ts`
- `castName` — `src/ui/panel-element.ts`
- `caster` — `src/ui/panel-helper.ts`
- `caveatElement` — `src/ui/panel-element.ts`
- `ceiling` — `src/ui/panel-look.ts`
- `cell` — `src/ui/panel-element.ts`
- `channel` — `src/ui/panel-look.ts`
- `channelIndex` — `src/ui/panel-look.ts`
- `charged` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `child` — `src/ui/panel-element.ts`
- `choice` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `chosen` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `clamped` — `src/ui/panel-drag.ts`, `src/ui/panel-words.ts`
- `className` — `src/ui/panel-element.ts`
- `classes` — `src/ui/panel-element.ts`
- `clearPixels` — `src/ui/panel-look.ts`
- `closing` — `src/ui/panel-content.ts`
- `closingFigure` — `src/ui/panel-content.ts`
- `closingFigureClamped` — `src/ui/panel-content.ts`
- `collected` — `src/ui/panel-element.ts`
- `colour` — `src/ui/panel-element.ts`
- `columnLines` — `src/ui/panel-element.ts`
- `columned` — `src/ui/panel-element.ts`
- `columns` — `src/ui/panel-element.ts`
- `combatant` — `src/ui/panel-content.ts`, `src/ui/panel-helper.ts`
- `combatantFigures` — `src/ui/panel-content.ts`
- `combatantId` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`
- `compose` — `src/ui/panel-element.ts`
- `composeByKey` — `src/ui/panel-element.ts`
- `composed` — `src/ui/panel-helper.ts`
- `control` — `src/ui/panel-element.ts`
- `corner` — `src/ui/panel-drag.ts`
- `costs` — `src/ui/panel-element.ts`
- `countBySide` — `src/ui/panel-content.ts`
- `counted` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `counter` — `src/ui/panel-element.ts`
- `counters` — `src/ui/panel-element.ts`
- `counts` — `src/ui/panel-words.ts`
- `createdElement` — `src/ui/panel-element.ts`
- `critical` — `src/ui/panel-element.ts`
- `crumb` — `src/ui/panel-element.ts`
- `cut` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `cutPart` — `src/ui/panel-element.ts`
- `cuts` — `src/ui/panel-content.ts`
- `day` — `src/ui/panel-words.ts`
- `defect` — `src/ui/panel-element.ts`
- `digits` — `src/ui/panel-words.ts`
- `dim` — `src/ui/panel-look.ts`
- `divider` — `src/ui/panel-words.ts`
- `document` — `src/ui/panel-element.ts`
- `doesOpen` — `src/ui/panel-element.ts`
- `dots` — `src/ui/panel-element.ts`
- `dragOptions` — `src/ui/panel-element.ts`
- `drawing` — `src/ui/panel-element.ts`
- `drawn` — `src/ui/panel-element.ts`
- `drawnCard` — `src/ui/panel-element.ts`
- `drawnGroup` — `src/ui/panel-element.ts`
- `drawnLine` — `src/ui/panel-element.ts`
- `droppedIndex` — `src/ui/panel-element.ts`
- `edgeOffset` — `src/ui/panel-element.ts`
- `element` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`
- `elementWords` — `src/ui/panel-words.ts`
- `empty` — `src/ui/panel-element.ts`
- `end` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `ending` — `src/ui/panel-element.ts`
- `endingLength` — `src/ui/panel-element.ts`
- `ends` — `src/ui/panel-element.ts`
- `everybody` — `src/ui/panel-content.ts`
- `exact` — `src/ui/panel-words.ts`
- `failure` — `src/ui/panel-element.ts`
- `fight` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `figure` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `figureBySubWord` — `src/ui/panel-element.ts`
- `figureCell` — `src/ui/panel-element.ts`
- `figurePlaced` — `src/ui/panel-content.ts`
- `figures` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `figuresOnScreen` — `src/ui/panel-content.ts`
- `fill` — `src/ui/panel-element.ts`
- `fired` — `src/ui/panel-element.ts`
- `firstCharged` — `src/ui/panel-element.ts`
- `firstColumn` — `src/ui/panel-element.ts`
- `floors` — `src/ui/panel-element.ts`
- `folded` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `frame` — `src/ui/panel-element.ts`
- `from` — `src/ui/panel-drag.ts`, `src/ui/panel-words.ts`
- `gap` — `src/ui/panel-drag.ts`
- `gapPixels` — `src/ui/panel-look.ts`
- `given` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `grab` — `src/ui/panel-drag.ts`
- `grip` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `group` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `groupIndex` — `src/ui/panel-element.ts`
- `groups` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `halfNamedPart` — `src/ui/panel-content.ts`
- `halfNamedParts` — `src/ui/panel-content.ts`
- `handled` — `src/ui/panel-listener.ts`
- `hasClosing` — `src/ui/panel-content.ts`
- `hasFightToSave` — `src/ui/panel-element.ts`
- `hasFiguresDisagreed` — `src/ui/panel-content.ts`
- `hasRest` — `src/ui/panel-content.ts`
- `headcount` — `src/ui/panel-element.ts`
- `header` — `src/ui/panel-element.ts`
- `heading` — `src/ui/panel-element.ts`
- `heals` — `src/ui/panel-words.ts`
- `height` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `heightHeld` — `src/ui/panel-drag.ts`
- `heightMaximum` — `src/ui/panel-drag.ts`
- `heightMinimum` — `src/ui/panel-drag.ts`
- `held` — `src/ui/panel-element.ts`
- `helperBar` — `src/ui/panel-element.ts`
- `helperBody` — `src/ui/panel-element.ts`
- `helperDrag` — `src/ui/panel-element.ts`
- `helperDragOptions` — `src/ui/panel-element.ts`
- `helperGrip` — `src/ui/panel-element.ts`
- `helperPlace` — `src/ui/panel-element.ts`
- `helperPlacement` — `src/ui/panel-element.ts`
- `helperPosition` — `src/ui/panel-element.ts`
- `helperPositionAfter` — `src/ui/panel-element.ts`
- `helperRegister` — `src/ui/panel-element.ts`
- `helperRight` — `src/ui/panel-drag.ts`
- `helperWindow` — `src/ui/panel-element.ts`
- `here` — `src/ui/panel-element.ts`
- `hint` — `src/ui/panel-element.ts`
- `holder` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`
- `holding` — `src/ui/panel-element.ts`
- `holytouch` — `src/ui/panel-words.ts`
- `host` — `src/ui/panel-element.ts`
- `hour` — `src/ui/panel-words.ts`
- `icon` — `src/ui/panel-look.ts`
- `id` — `src/ui/panel-words.ts`
- `inked` — `src/ui/panel-element.ts`
- `inset` — `src/ui/panel-look.ts`
- `inside` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `intent` — `src/ui/panel-element.ts`
- `isCounted` — `src/ui/panel-content.ts`
- `isDamage` — `src/ui/panel-content.ts`
- `isMeterCollapsed` — `src/ui/panel-element.ts`
- `isOneStated` — `src/ui/ranked-order.ts`
- `isOtherStated` — `src/ui/ranked-order.ts`
- `isRefused` — `src/ui/panel-element.ts`
- `isRegionKept` — `src/ui/panel-element.ts`
- `isSized` — `src/ui/panel-element.ts`
- `isTwoColumnsWithin` — `src/ui/panel-element.ts`
- `kept` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `keptKinds` — `src/ui/panel-content.ts`
- `key` — in 4 files: `src/ui/`
- `kind` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `kindIndex` — `src/ui/panel-element.ts`
- `kindRow` — `src/ui/panel-element.ts`
- `kinds` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `label` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `laidOut` — `src/ui/panel-element.ts`
- `largest` — `src/ui/panel-content.ts`
- `lastDigit` — `src/ui/panel-words.ts`
- `lastGroup` — `src/ui/panel-element.ts`
- `lastIndex` — `src/ui/panel-element.ts`
- `lastTwo` — `src/ui/panel-words.ts`
- `lastWord` — `src/ui/panel-words.ts`
- `lastheal` — `src/ui/panel-words.ts`
- `layout` — `src/ui/panel-element.ts`
- `leading` — `src/ui/panel-words.ts`
- `leadingWords` — `src/ui/panel-words.ts`
- `leaving` — `src/ui/panel-element.ts`
- `left` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `leftColumn` — `src/ui/panel-element.ts`
- `leftHead` — `src/ui/panel-words.ts`
- `legendary` — `src/ui/panel-element.ts`
- `letter` — `src/ui/panel-words.ts`
- `line` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `linear` — `src/ui/panel-look.ts`
- `lines` — `src/ui/panel-element.ts`
- `list` — `src/ui/panel-element.ts`
- `listBasis` — `src/ui/panel-look.ts`
- `listRowsLeast` — `src/ui/panel-look.ts`
- `listed` — `src/ui/panel-content.ts`
- `lit` — `src/ui/panel-element.ts`
- `lookupCard` — `src/ui/panel-element.ts`
- `luminance` — `src/ui/panel-look.ts`
- `mark` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `marked` — `src/ui/panel-element.ts`
- `marks` — `src/ui/panel-look.ts`
- `meaning` — `src/ui/panel-element.ts`
- `mergedPart` — `src/ui/panel-element.ts`
- `messagesLost` — `src/ui/panel-content.ts`
- `messagesRead` — `src/ui/panel-content.ts`
- `meter` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `meterDrag` — `src/ui/panel-element.ts`
- `meterDragOptions` — `src/ui/panel-element.ts`
- `meterGrip` — `src/ui/panel-element.ts`
- `meterOutside` — `src/ui/panel-look.ts`
- `meterPlace` — `src/ui/panel-element.ts`
- `meterPosition` — `src/ui/panel-element.ts`
- `meterRegister` — `src/ui/panel-element.ts`
- `metric` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `minute` — `src/ui/panel-words.ts`
- `month` — `src/ui/panel-words.ts`
- `name` — in 5 files: `src/ui/`
- `nameLength` — `src/ui/panel-element.ts`
- `named` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `names` — `src/ui/panel-content.ts`
- `narrowed` — `src/ui/panel-element.ts`
- `needed` — `src/ui/panel-element.ts`
- `neither` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `neitherEndPinned` — `src/ui/panel-content.ts`
- `nested` — `src/ui/panel-element.ts`
- `note` — `src/ui/panel-element.ts`
- `noteLines` — `src/ui/panel-element.ts`
- `notes` — `src/ui/panel-element.ts`
- `notesFrom` — `src/ui/panel-element.ts`
- `noun` — `src/ui/panel-element.ts`
- `now` — `src/ui/panel-helper.ts`
- `offhand` — `src/ui/panel-element.ts`
- `offsetRead` — `src/ui/panel-drag.ts`
- `oldest` — `src/ui/panel-element.ts`
- `onDark` — `src/ui/panel-look.ts`
- `onHover` — `src/ui/panel-element.ts`
- `onLight` — `src/ui/panel-look.ts`
- `openColumns` — `src/ui/panel-element.ts`
- `openKey` — `src/ui/panel-element.ts`
- `openSize` — `src/ui/panel-element.ts`
- `openTop` — `src/ui/panel-element.ts`
- `opened` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `openedAt` — `src/ui/panel-intent.ts`
- `openedPart` — `src/ui/panel-element.ts`
- `opening` — `src/ui/panel-drag.ts`
- `opens` — `src/ui/panel-element.ts`
- `opponentRows` — `src/ui/panel-element.ts`
- `opponents` — `src/ui/panel-element.ts`
- `opposing` — `src/ui/panel-element.ts`
- `otherCombatant` — `src/ui/panel-content.ts`
- `otherEnd` — `src/ui/panel-content.ts`
- `otherFigures` — `src/ui/panel-content.ts`
- `otherId` — `src/ui/panel-content.ts`
- `outcome` — `src/ui/panel-element.ts`
- `outcomeClass` — `src/ui/panel-element.ts`
- `outcomeText` — `src/ui/panel-element.ts`
- `outside` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `own` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `pair` — `src/ui/panel-element.ts`
- `pairPart` — `src/ui/panel-content.ts`
- `panelDrawing` — `src/ui/panel-element.ts`
- `parent` — `src/ui/panel-element.ts`
- `partLevel` — `src/ui/panel-element.ts`
- `partName` — `src/ui/panel-screen.ts`
- `parts` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `partsTotal` — `src/ui/panel-content.ts`
- `percent` — `src/ui/panel-words.ts`
- `person` — `src/ui/panel-element.ts`
- `personContext` — `src/ui/panel-element.ts`
- `personPart` — `src/ui/panel-content.ts`
- `pin` — `src/ui/panel-element.ts`
- `pinned` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `pinnedApart` — `src/ui/panel-content.ts`
- `pinnedCase` — `src/ui/panel-content.ts`
- `pinnedCases` — `src/ui/panel-content.ts`
- `pinnedFigures` — `src/ui/panel-content.ts`
- `pip` — `src/ui/panel-element.ts`
- `pips` — `src/ui/panel-element.ts`
- `place` — `src/ui/panel-element.ts`
- `placed` — `src/ui/panel-drag.ts`
- `placement` — `src/ui/panel-element.ts`
- `pointer` — `src/ui/panel-drag.ts`
- `points` — `src/ui/panel-words.ts`
- `pointsPaid` — `src/ui/panel-words.ts`
- `position` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `provocation` — `src/ui/panel-element.ts`
- `provocationsBounded` — `src/ui/panel-helper.ts`
- `provoked` — `src/ui/panel-helper.ts`
- `provoker` — `src/ui/panel-words.ts`
- `question` — `src/ui/panel-element.ts`
- `ran` — `src/ui/panel-element.ts`
- `rank` — `src/ui/panel-element.ts`
- `ranking` — `src/ui/panel-element.ts`
- `reached` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `reader` — `src/ui/panel-element.ts`
- `refused` — `src/ui/panel-element.ts`
- `region` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `regionName` — `src/ui/panel-element.ts`
- `regions` — `src/ui/panel-element.ts`
- `register` — `src/ui/panel-element.ts`
- `renderInPlace` — `src/ui/panel-element.ts`
- `rendered` — `src/ui/panel-element.ts`
- `renderedCard` — `src/ui/panel-element.ts`
- `renderedList` — `src/ui/panel-element.ts`
- `renderedRegion` — `src/ui/panel-element.ts`
- `replaced` — `src/ui/panel-element.ts`
- `report` — `src/ui/panel-element.ts`
- `reset` — `src/ui/panel-element.ts`
- `rest` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `right` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `rightColumn` — `src/ui/panel-element.ts`
- `rightHead` — `src/ui/panel-words.ts`
- `rightOfMeter` — `src/ui/panel-drag.ts`
- `room` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `root` — `src/ui/panel-element.ts`
- `rounded` — `src/ui/panel-drag.ts`, `src/ui/panel-words.ts`
- `row` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `rowContent` — `src/ui/panel-element.ts`
- `rowCost` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `rowElement` — `src/ui/panel-element.ts`
- `rowIndex` — `src/ui/panel-element.ts`
- `rowKey` — `src/ui/panel-element.ts`
- `rows` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `rowsMaximum` — `src/ui/panel-words.ts`
- `rule` — `src/ui/panel-element.ts`
- `rules` — `src/ui/panel-look.ts`
- `run` — `src/ui/panel-element.ts`
- `runs` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `said` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `screenTotal` — `src/ui/panel-content.ts`
- `screens` — `src/ui/panel-screen.ts`
- `scrolls` — `src/ui/panel-element.ts`
- `secondColumn` — `src/ui/panel-element.ts`
- `section` — `src/ui/panel-element.ts`
- `seen` — `src/ui/panel-content.ts`
- `separator` — `src/ui/panel-element.ts`
- `set` — `src/ui/panel-element.ts`
- `shape` — `src/ui/panel-content.ts`, `src/ui/panel-look.ts`
- `share` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `shareText` — `src/ui/panel-content.ts`
- `shared` — `src/ui/panel-content.ts`
- `shares` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `sheet` — `src/ui/panel-element.ts`
- `shorter` — `src/ui/panel-element.ts`
- `shownName` — `src/ui/panel-element.ts`
- `side` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-words.ts`
- `sideListed` — `src/ui/panel-content.ts`
- `sideRelation` — `src/ui/panel-content.ts`
- `sideRows` — `src/ui/panel-content.ts`
- `sideSegment` — `src/ui/panel-element.ts`
- `sides` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `sideways` — `src/ui/panel-element.ts`
- `sign` — `src/ui/panel-words.ts`
- `size` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `sized` — `src/ui/panel-drag.ts`
- `sizes` — `src/ui/panel-content.ts`
- `skill` — `src/ui/panel-content.ts`
- `skillRows` — `src/ui/panel-element.ts`
- `slot` — `src/ui/panel-element.ts`
- `source` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`
- `spaced` — `src/ui/panel-words.ts`
- `spare` — `src/ui/panel-element.ts`
- `split` — `src/ui/panel-element.ts`
- `standing` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`
- `start` — `src/ui/panel-words.ts`
- `started` — `src/ui/panel-drag.ts`
- `state` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `stated` — in 5 files: `src/ui/`
- `statedFigures` — `src/ui/panel-content.ts`
- `status` — `src/ui/panel-words.ts`
- `stemTop` — `src/ui/panel-look.ts`
- `stemWidthPixels` — `src/ui/panel-look.ts`
- `step` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `stepSizes` — `src/ui/panel-look.ts`
- `steps` — `src/ui/panel-element.ts`
- `storageChosen` — `src/ui/panel-element.ts`
- `strip` — `src/ui/panel-element.ts`
- `stripElement` — `src/ui/panel-element.ts`
- `strips` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `strokes` — `src/ui/panel-look.ts`
- `style` — `src/ui/panel-drag.ts`
- `sub` — `src/ui/panel-element.ts`
- `subtitle` — `src/ui/panel-element.ts`
- `suspicion` — `src/ui/panel-element.ts`
- `svg` — `src/ui/panel-look.ts`
- `taken` — `src/ui/panel-content.ts`
- `tall` — `src/ui/panel-element.ts`
- `taller` — `src/ui/panel-element.ts`
- `tallerLeast` — `src/ui/panel-element.ts`
- `target` — `src/ui/panel-element.ts`
- `textElement` — `src/ui/panel-element.ts`
- `tile` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `time` — `src/ui/panel-element.ts`
- `tokens` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `tone` — `src/ui/panel-element.ts`
- `top` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `topByName` — `src/ui/panel-element.ts`
- `total` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `totals` — `src/ui/panel-content.ts`
- `track` — `src/ui/panel-element.ts`
- `translate` — `src/ui/panel-element.ts`
- `trimmed` — `src/ui/panel-element.ts`
- `turn` — `src/ui/panel-element.ts`
- `turnsCell` — `src/ui/panel-element.ts`
- `turnsLeft` — `src/ui/panel-element.ts`
- `typeStep` — `src/ui/panel-element.ts`
- `undrawn` — `src/ui/panel-element.ts`
- `unnamed` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `unnamedCut` — `src/ui/panel-element.ts`
- `unnamedNote` — `src/ui/panel-element.ts`
- `unnamedNotes` — `src/ui/panel-element.ts`
- `unnamedOpened` — `src/ui/panel-content.ts`
- `unpaid` — `src/ui/panel-words.ts`
- `unplaced` — `src/ui/panel-content.ts`
- `url` — `src/ui/panel-look.ts`
- `uses` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `variables` — `src/ui/panel-drag.ts`
- `view` — `src/ui/panel-element.ts`
- `viewport` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `walked` — `src/ui/panel-content.ts`
- `wanted` — `src/ui/panel-screen.ts`
- `when` — `src/ui/panel-element.ts`
- `where` — `src/ui/panel-element.ts`
- `who` — `src/ui/panel-element.ts`
- `whole` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `width` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `widthMaximum` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `widthMinimum` — `src/ui/panel-drag.ts`
- `widthTypeMaximum` — `src/ui/panel-drag.ts`
- `window` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `word` — `src/ui/panel-words.ts`
- `words` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `wrapped` — `src/ui/panel-element.ts`
- `written` — `src/ui/panel-look.ts`

### `src/`

- `browserConsole` — `src/userscript-entry.ts`
- `error` — `src/userscript-entry.ts`
- `errorConsole` — `src/userscript-entry.ts`
- `height` — `src/userscript-entry.ts`
- `member` — `src/userscript-entry.ts`
- `ports` — `src/userscript-entry.ts`
- `scriptIndex` — `src/userscript-entry.ts`
- `scripts` — `src/userscript-entry.ts`
- `sources` — `src/userscript-entry.ts`
- `started` — `src/userscript-entry.ts`
- `storage` — `src/userscript-entry.ts`
- `walked` — `src/userscript-entry.ts`
- `width` — `src/userscript-entry.ts`
- `windowPart` — `src/userscript-entry.ts`

### `tools/`

- `across` — `tools/preview-site.ts`
- `act` — `tools/fabricated-fight.ts`
- `actor` — `tools/fabricated-fight.ts`
- `actorId` — `tools/turn-reading.ts`
- `addOn` — `tools/capture-intake.ts`
- `added` — `tools/margonem-readings.ts`
- `adding` — `tools/turn-reading.ts`
- `advance` — `tools/turn-count.ts`
- `after` — `tools/panel-shots.ts`, `tools/status-bit-table.ts`
- `afterText` — `tools/panel-shots.ts`
- `age` — `tools/help-article.ts`
- `ahead` — `tools/fabricated-fight.ts`
- `aligned` — `tools/aura-standing.ts`
- `ally` — `tools/fabricated-fight.ts`
- `amounts` — `tools/skill-table.ts`
- `anchor` — `tools/panel-giving-way.ts`, `tools/protocol-key-table.ts`
- `anguish` — `tools/fabricated-fight.ts`
- `announcement` — `tools/turn-reading.ts`
- `answered` — `tools/payload-cost.ts`
- `apart` — `tools/aura-lifetime.ts`
- `appended` — `tools/turn-reading.ts`
- `applied` — `tools/fabricated-fight.ts`
- `archive` — `tools/develop-reports.ts`
- `arriving` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `article` — `tools/help-article.ts`
- `asked` — in 7 files: `tools/`
- `assignmentAt` — `tools/skill-table.ts`
- `atFirst` — `tools/turn-count.ts`
- `atLast` — `tools/turn-count.ts`
- `atOnce` — `tools/aura-standing.ts`
- `atShouter` — `tools/shout-holding.ts`
- `atSomebodyElse` — `tools/shout-holding.ts`
- `aura` — `tools/aura-standing.ts`
- `auraSkills` — `tools/skill-table.ts`
- `auras` — `tools/skill-table.ts`
- `aurasText` — `tools/skill-table.ts`
- `awaiting` — `tools/fabricated-fight.ts`
- `band` — `tools/preview-page.ts`
- `bare` — `tools/preview-state.ts`
- `baseline` — `tools/shout-holding.ts`
- `battle` — `tools/payload-cost.ts`
- `before` — in 5 files: `tools/`
- `beforeText` — `tools/panel-shots.ts`
- `below` — `tools/develop-reports.ts`
- `beside` — `tools/fabricated-fight.ts`
- `bindings` — `tools/preview-page.ts`
- `bit` — `tools/aura-lifetime.ts`, `tools/fabricated-fight.ts`, `tools/margonem-readings.ts`
- `bitName` — `tools/aura-lifetime.ts`
- `bits` — `tools/margonem-readings.ts`, `tools/status-bit-table.ts`
- `block` — `tools/protocol-key-table.ts`
- `blows` — `tools/skill-table.ts`
- `blowsGrantedMinimum` — `tools/skill-table.ts`
- `blowsText` — `tools/skill-table.ts`
- `body` — `tools/help-claim-register.ts`, `tools/preview-server.ts`
- `border` — `tools/preview-page.ts`
- `bottom` — `tools/panel-shots.ts`
- `boundaries` — `tools/turn-count.ts`
- `boundary` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `boxes` — `tools/panel-shots.ts`
- `browser` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `build` — in 4 files: `tools/`
- `built` — `tools/panel-giving-way.ts`
- `bundle` — in 7 files: `tools/`
- `bundlePath` — `tools/margonem-client-source.ts`
- `bundled` — `tools/build-userscript.ts`
- `bundling` — `tools/build-userscript.ts`
- `button` — `tools/preview-page.ts`
- `byCombatantId` — `tools/turn-count.ts`
- `byKey` — `tools/turn-reading.ts`
- `byMoment` — `tools/aura-lifetime.ts`
- `byOrdinals` — `tools/turn-reading.ts`
- `bySide` — `tools/fight-figures.ts`
- `byTurn` — `tools/shout-holding.ts`
- `cached` — in 4 files: `tools/`
- `cachedSource` — `tools/margonem-client-source.ts`
- `call` — `tools/capture-intake.ts`
- `callAt` — `tools/build-userscript.ts`
- `calls` — `tools/fabricated-fight.ts`, `tools/recorded-material.ts`
- `caption` — `tools/fight-figures.ts`
- `capturedAt` — `tools/capture-intake.ts`
- `card` — `tools/panel-giving-way.ts`
- `carried` — in 4 files: `tools/`
- `cases` — `tools/aura-lifetime.ts`, `tools/drill-report.ts`
- `casterIds` — `tools/aura-standing.ts`
- `casterIdsByKey` — `tools/aura-standing.ts`
- `ceiling` — `tools/fabricated-fight.ts`
- `cells` — in 4 files: `tools/`
- `change` — `tools/develop-reports.ts`
- `changed` — `tools/capture-intake.ts`
- `changes` — `tools/develop-reports.ts`
- `channel` — `tools/margonem-client-source.ts`
- `character` — `tools/build-userscript.ts`, `tools/capture-intake.ts`,
  `tools/protocol-key-table.ts`
- `characters` — `tools/build-userscript.ts`, `tools/capture-intake.ts`
- `chosen` — `tools/develop-reports.ts`, `tools/fabricated-fight.ts`
- `cited` — `tools/help-article.ts`
- `claim` — `tools/help-claim-register.ts`
- `claims` — `tools/help-claim-register.ts`, `tools/protocol-key-shape.ts`
- `client` — `tools/margonem-readings.ts`
- `clientState` — `tools/margonem-readings.ts`
- `clip` — `tools/panel-shots.ts`
- `clocks` — `tools/shout-holding.ts`
- `close` — in 4 files: `tools/`
- `closed` — `tools/aura-lifetime.ts`
- `closes` — `tools/build-userscript.ts`
- `closing` — `tools/drill-report.ts`
- `code` — `tools/build-userscript.ts`
- `collision` — `tools/capture-intake.ts`
- `columns` — `tools/fight-figures.ts`
- `combatant` — `tools/fabricated-fight.ts`, `tools/fight-figures.ts`
- `combatantId` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `combatants` — `tools/fabricated-fight.ts`
- `command` — in 5 files: `tools/`
- `commit` — `tools/panel-shots.ts`
- `committed` — `tools/panel-shots.ts`
- `common` — `tools/aura-lifetime.ts`
- `commonAfter` — `tools/develop-reports.ts`
- `comparison` — `tools/develop-reports.ts`
- `composed` — `tools/capture-intake.ts`
- `configuration` — `tools/build-userscript.ts`
- `contested` — `tools/turn-reading.ts`
- `context` — `tools/turn-reading.ts`
- `cost` — `tools/payload-cost.ts`
- `costs` — `tools/payload-cost.ts`
- `count` — in 5 files: `tools/`
- `countByLines` — `tools/card-height.ts`
- `counted` — in 4 files: `tools/`
- `counts` — `tools/fight-figures.ts`, `tools/help-article.ts`, `tools/turn-count.ts`
- `coverageMinimum` — `tools/skill-table.ts`
- `cut` — `tools/drill-report.ts`
- `date` — `tools/help-article.ts`
- `dated` — `tools/skill-table.ts`
- `day` — `tools/capture-intake.ts`
- `days` — `tools/help-article.ts`
- `dealt` — `tools/fabricated-fight.ts`
- `dealtSign` — `tools/protocol-key-table.ts`
- `declared` — `tools/aura-standing.ts`, `tools/build-userscript.ts`
- `decoded` — `tools/turn-reading.ts`
- `decoding` — `tools/develop-reports.ts`
- `delta` — `tools/turn-count.ts`
- `depth` — `tools/build-userscript.ts`, `tools/protocol-key-table.ts`
- `described` — `tools/capture-intake.ts`
- `descriptionAt` — `tools/capture-intake.ts`
- `details` — `tools/fight-figures.ts`
- `develop` — `tools/develop-reports.ts`
- `developCount` — `tools/develop-reports.ts`
- `developFigures` — `tools/develop-reports.ts`
- `developIndex` — `tools/develop-reports.ts`
- `developLine` — `tools/develop-reports.ts`
- `developLines` — `tools/develop-reports.ts`
- `developNames` — `tools/develop-reports.ts`
- `did` — `tools/margonem-readings.ts`
- `differ` — `tools/develop-reports.ts`
- `difference` — `tools/develop-reports.ts`
- `digits` — `tools/protocol-key-table.ts`
- `directives` — `tools/build-userscript.ts`
- `directory` — `tools/develop-reports.ts`, `tools/help-article.ts`,
  `tools/margonem-client-source.ts`
- `disagreed` — `tools/protocol-key-shape.ts`
- `dispute` — `tools/turn-reading.ts`
- `disputed` — `tools/turn-reading.ts`
- `distinct` — `tools/help-article.ts`, `tools/protocol-key-table.ts`
- `document` — `tools/recorded-material.ts`
- `domain` — `tools/build-userscript.ts`
- `drawn` — `tools/panel-shots.ts`
- `drill` — `tools/drill-report.ts`
- `drillCase` — `tools/drill-report.ts`
- `driver` — `tools/preview-page.ts`
- `dump` — `tools/margonem-readings.ts`
- `dumped` — `tools/margonem-readings.ts`
- `durations` — `tools/skill-table.ts`
- `effect` — `tools/skill-table.ts`
- `effects` — `tools/skill-table.ts`
- `elapsed` — `tools/shout-holding.ts`
- `elementKeys` — `tools/fabricated-fight.ts`
- `elsewhere` — `tools/turn-count.ts`
- `emptied` — `tools/develop-reports.ts`
- `encoded` — `tools/fabricated-fight.ts`
- `end` — in 4 files: `tools/`
- `ending` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `endings` — `tools/aura-lifetime.ts`
- `engine` — `tools/payload-cost.ts`
- `english` — `tools/capture-intake.ts`
- `entries` — `tools/protocol-key-shape.ts`
- `entryIndex` — `tools/preview-server.ts`
- `entryName` — `tools/preview-state.ts`
- `envelope` — `tools/capture-intake.ts`
- `episode` — `tools/shout-holding.ts`
- `episodes` — `tools/shout-holding.ts`
- `event` — in 5 files: `tools/`
- `eventIndex` — `tools/shout-holding.ts`
- `events` — `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `eventsByKind` — `tools/decoding-status.ts`
- `excerpts` — `tools/help-article.ts`
- `expected` — `tools/turn-count.ts`
- `families` — `tools/protocol-key-shape.ts`
- `family` — `tools/protocol-key-table.ts`
- `familyFields` — `tools/protocol-key-table.ts`
- `fedThrough` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `fetched` — `tools/build-userscript.ts`
- `fetchedAt` — `tools/help-article.ts`, `tools/margonem-client-source.ts`, `tools/skill-table.ts`
- `field` — `tools/capture-intake.ts`, `tools/help-article.ts`, `tools/margonem-client-source.ts`
- `fieldValue` — `tools/capture-intake.ts`
- `fields` — `tools/protocol-key-table.ts`
- `fight` — in 11 files: `tools/`
- `fightIndex` — `tools/payload-cost.ts`
- `fightName` — `tools/panel-shots.ts`
- `fights` — `tools/preview-server.ts`, `tools/recorded-material.ts`
- `figure` — `tools/fabricated-fight.ts`
- `figures` — in 6 files: `tools/`
- `file` — `tools/preview-site.ts`
- `files` — `tools/build-userscript.ts`, `tools/preview-site.ts`
- `finished` — `tools/build-userscript.ts`
- `firstHeld` — `tools/frozen-files.ts`
- `firstIndex` — `tools/turn-count.ts`
- `firstRow` — `tools/panel-shots.ts`
- `firstRun` — `tools/aura-lifetime.ts`
- `firstStatement` — `tools/turn-count.ts`
- `flag` — `tools/capture-intake.ts`
- `flags` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `flowing` — `tools/protocol-key-shape.ts`
- `fold` — `tools/panel-giving-way.ts`
- `fought` — `tools/fabricated-fight.ts`
- `fragment` — `tools/help-article.ts`
- `fragments` — `tools/help-article.ts`
- `from` — in 5 files: `tools/`
- `fromPaths` — `tools/preview-server.ts`
- `fromPictures` — `tools/panel-giving-way.ts`
- `frozen` — in 4 files: `tools/`
- `frozenBuild` — `tools/margonem-readings.ts`
- `frozenKeys` — `tools/margonem-readings.ts`
- `frozenName` — `tools/margonem-readings.ts`
- `given` — `tools/fabricated-fight.ts`
- `grade` — `tools/turn-count.ts`
- `graded` — `tools/turn-count.ts`
- `grades` — `tools/turn-count.ts`
- `granted` — `tools/skill-table.ts`, `tools/turn-count.ts`
- `grantedBlows` — `tools/skill-table.ts`
- `hasMoved` — `tools/help-article.ts`
- `hash` — `tools/preview-state.ts`
- `haystack` — `tools/help-article.ts`
- `head` — `tools/protocol-key-table.ts`
- `headAt` — `tools/protocol-key-table.ts`
- `heading` — `tools/aura-lifetime.ts`, `tools/develop-reports.ts`, `tools/protocol-key-shape.ts`
- `headings` — `tools/aura-standing.ts`, `tools/turn-count.ts`
- `healthMaximum` — `tools/fabricated-fight.ts`
- `height` — `tools/card-height.ts`
- `heights` — `tools/card-height.ts`
- `held` — in 10 files: `tools/`
- `heldDate` — `tools/frozen-files.ts`
- `helds` — `tools/frozen-files.ts`
- `helperOffset` — `tools/panel-shots.ts`
- `hit` — `tools/help-article.ts`
- `holder` — `tools/turn-count.ts`
- `host` — `tools/margonem-client-source.ts`
- `hover` — `tools/panel-giving-way.ts`
- `html` — in 4 files: `tools/`
- `hurt` — `tools/fabricated-fight.ts`
- `id` — `tools/capture-intake.ts`, `tools/fight-figures.ts`, `tools/skill-table.ts`
- `index` — in 7 files: `tools/`
- `indexes` — `tools/fabricated-fight.ts`
- `indices` — `tools/turn-count.ts`
- `inside` — `tools/capture-intake.ts`
- `install` — `tools/preview-page.ts`
- `intake` — `tools/capture-intake.ts`
- `into` — `tools/panel-giving-way.ts`
- `introduction` — `tools/preview-page.ts`
- `isAbsent` — `tools/preview-server.ts`
- `isAhead` — `tools/margonem-readings.ts`
- `isAlike` — `tools/develop-reports.ts`
- `isBanner` — `tools/preview-server.ts`
- `isDash` — `tools/capture-intake.ts`
- `isDefault` — `tools/fabricated-fight.ts`
- `isKept` — `tools/frozen-files.ts`
- `isNarrated` — `tools/turn-count.ts`
- `isPlayer` — `tools/capture-intake.ts`
- `isReaderSide` — `tools/fabricated-fight.ts`
- `isSilent` — `tools/help-claim-register.ts`
- `items` — `tools/preview-page.ts`
- `keepAlive` — `tools/preview-server.ts`
- `kept` — in 4 files: `tools/`
- `keptByAdding` — `tools/develop-reports.ts`
- `keptByRemoving` — `tools/develop-reports.ts`
- `key` — in 9 files: `tools/`
- `keyValue` — `tools/protocol-key-shape.ts`
- `keys` — in 4 files: `tools/`
- `keysByCast` — `tools/aura-standing.ts`
- `keywordAt` — `tools/protocol-key-table.ts`
- `kind` — `tools/drill-report.ts`, `tools/turn-reading.ts`
- `kindPlace` — `tools/drill-report.ts`
- `known` — `tools/capture-intake.ts`
- `label` — `tools/capture-intake.ts`, `tools/fight-figures.ts`
- `labels` — `tools/capture-intake.ts`, `tools/protocol-key-table.ts`
- `largest` — `tools/payload-cost.ts`
- `lastIndex` — `tools/turn-count.ts`
- `lastStatement` — `tools/turn-count.ts`
- `lastStep` — `tools/turn-count.ts`
- `later` — `tools/shout-holding.ts`
- `laterEvent` — `tools/shout-holding.ts`
- `least` — `tools/preview-page.ts`
- `left` — `tools/panel-shots.ts`
- `length` — `tools/aura-lifetime.ts`, `tools/margonem-readings.ts`, `tools/skill-table.ts`
- `level` — `tools/skill-table.ts`
- `levelValue` — `tools/skill-table.ts`
- `liftedKeys` — `tools/margonem-readings.ts`
- `liftedName` — `tools/margonem-readings.ts`
- `lightings` — `tools/aura-lifetime.ts`
- `line` — in 5 files: `tools/`
- `lineEnd` — `tools/build-userscript.ts`
- `lines` — in 13 files: `tools/`
- `links` — `tools/preview-server.ts`
- `listed` — `tools/preview-server.ts`
- `listener` — `tools/preview-server.ts`
- `litAt` — `tools/aura-lifetime.ts`
- `literal` — `tools/frozen-files.ts`, `tools/protocol-key-table.ts`, `tools/status-bit-table.ts`
- `look` — in 9 files: `tools/`
- `lost` — `tools/fabricated-fight.ts`, `tools/turn-count.ts`, `tools/turn-reading.ts`
- `lostNow` — `tools/turn-count.ts`
- `made` — `tools/build-userscript.ts`, `tools/help-article.ts`
- `manifestPath` — `tools/help-article.ts`
- `manifestWritten` — `tools/help-article.ts`
- `mapped` — `tools/capture-intake.ts`
- `margonemEngineBattle` — `tools/payload-cost.ts`
- `margonemEngineMilliseconds` — `tools/payload-cost.ts`
- `mark` — `tools/develop-reports.ts`, `tools/preview-state.ts`
- `marked` — `tools/develop-reports.ts`, `tools/skill-table.ts`
- `marker` — `tools/help-claim-register.ts`, `tools/protocol-key-table.ts`
- `markerAt` — `tools/protocol-key-table.ts`
- `markerLength` — `tools/protocol-key-table.ts`
- `material` — in 5 files: `tools/`
- `median` — `tools/card-height.ts`, `tools/payload-cost.ts`
- `member` — `tools/capture-intake.ts`
- `members` — `tools/fight-figures.ts`
- `message` — `tools/protocol-key-shape.ts`, `tools/turn-reading.ts`
- `messageIndex` — `tools/turn-reading.ts`
- `messages` — `tools/fabricated-fight.ts`, `tools/payload-cost.ts`
- `messagesRead` — `tools/payload-cost.ts`
- `metadata` — `tools/build-userscript.ts`
- `metadataWritten` — `tools/build-userscript.ts`
- `milliseconds` — `tools/help-article.ts`
- `mine` — `tools/aura-lifetime.ts`, `tools/turn-count.ts`
- `minute` — `tools/build-userscript.ts`
- `missing` — `tools/help-article.ts`
- `mode` — `tools/aura-lifetime.ts`
- `monsterName` — `tools/capture-intake.ts`
- `most` — `tools/preview-page.ts`
- `moved` — in 5 files: `tools/`
- `name` — in 10 files: `tools/`
- `nameAt` — `tools/build-userscript.ts`
- `named` — in 8 files: `tools/`
- `namedBySkillId` — `tools/aura-standing.ts`
- `names` — `tools/capture-intake.ts`, `tools/develop-reports.ts`, `tools/status-bit-table.ts`
- `needle` — `tools/help-article.ts`
- `newer` — `tools/develop-reports.ts`
- `nonPlayer` — `tools/capture-intake.ts`
- `normalised` — `tools/fabricated-fight.ts`
- `note` — `tools/protocol-key-shape.ts`
- `notes` — `tools/card-height.ts`
- `nothingAt` — `tools/status-bit-table.ts`
- `now` — `tools/margonem-readings.ts`, `tools/shout-holding.ts`
- `occurrences` — `tools/protocol-key-shape.ts`
- `offered` — `tools/capture-intake.ts`
- `offset` — `tools/help-claim-register.ts`, `tools/protocol-key-shape.ts`
- `only` — `tools/protocol-key-shape.ts`
- `open` — in 5 files: `tools/`
- `openSection` — `tools/develop-reports.ts`
- `opened` — in 4 files: `tools/`
- `openedPart` — `tools/drill-report.ts`
- `opener` — `tools/changelog.ts`, `tools/frozen-files.ts`, `tools/turn-reading.ts`
- `openerAt` — `tools/frozen-files.ts`
- `openerId` — `tools/turn-reading.ts`
- `opening` — `tools/preview-server.ts`
- `opens` — `tools/drill-report.ts`, `tools/fabricated-fight.ts`
- `opposingSide` — `tools/fabricated-fight.ts`
- `order` — `tools/capture-intake.ts`
- `ordered` — `tools/card-height.ts`, `tools/payload-cost.ts`
- `ordinal` — `tools/fabricated-fight.ts`
- `otherEnd` — `tools/drill-report.ts`
- `outbound` — `tools/build-userscript.ts`
- `outcome` — `tools/fight-figures.ts`, `tools/turn-count.ts`
- `outcomes` — `tools/turn-count.ts`
- `output` — `tools/build-userscript.ts`, `tools/develop-reports.ts`
- `own` — `tools/aura-lifetime.ts`, `tools/payload-cost.ts`
- `ownTurnsEach` — `tools/aura-lifetime.ts`
- `page` — in 4 files: `tools/`
- `pageLength` — `tools/skill-table.ts`
- `pagePath` — `tools/skill-table.ts`
- `paged` — `tools/margonem-readings.ts`
- `pair` — `tools/build-userscript.ts`, `tools/capture-intake.ts`, `tools/drill-report.ts`
- `pairPart` — `tools/drill-report.ts`
- `pairs` — `tools/capture-intake.ts`, `tools/shout-holding.ts`
- `panel` — `tools/panel-shots.ts`, `tools/preview-page.ts`, `tools/preview-state.ts`
- `paragraph` — `tools/protocol-key-shape.ts`
- `parameter` — `tools/protocol-key-shape.ts`
- `parameters` — `tools/protocol-key-shape.ts`, `tools/turn-reading.ts`
- `parsed` — in 14 files: `tools/`
- `parser` — `tools/preview-state.ts`
- `partRow` — `tools/drill-report.ts`
- `parts` — `tools/build-userscript.ts`
- `past` — `tools/shout-holding.ts`
- `path` — in 6 files: `tools/`
- `pathAt` — `tools/protocol-key-shape.ts`
- `paths` — in 8 files: `tools/`
- `payload` — `tools/capture-intake.ts`, `tools/fabricated-fight.ts`, `tools/turn-reading.ts`
- `payloads` — `tools/payload-cost.ts`
- `pending` — `tools/capture-intake.ts`, `tools/turn-reading.ts`
- `percent` — `tools/fabricated-fight.ts`
- `person` — `tools/drill-report.ts`
- `phrase` — `tools/help-article.ts`, `tools/help-claim-register.ts`
- `phrases` — `tools/help-article.ts`, `tools/help-claim-register.ts`
- `picks` — `tools/preview-page.ts`
- `pinned` — `tools/drill-report.ts`
- `pinnedScreen` — `tools/drill-report.ts`
- `place` — `tools/drill-report.ts`, `tools/fabricated-fight.ts`, `tools/turn-reading.ts`
- `placed` — `tools/turn-count.ts`
- `placement` — `tools/protocol-key-shape.ts`
- `placements` — `tools/protocol-key-shape.ts`
- `placing` — `tools/turn-count.ts`
- `players` — `tools/capture-intake.ts`
- `poison` — `tools/fabricated-fight.ts`
- `port` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `position` — `tools/capture-intake.ts`, `tools/protocol-key-shape.ts`,
  `tools/protocol-key-table.ts`
- `prefix` — `tools/build-userscript.ts`
- `preview` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `previousActorId` — `tools/turn-reading.ts`
- `previousEnd` — `tools/help-article.ts`
- `profession` — `tools/fabricated-fight.ts`
- `provocation` — `tools/aura-standing.ts`, `tools/shout-holding.ts`
- `provokedIds` — `tools/shout-holding.ts`
- `provokedIdsByCasterId` — `tools/shout-holding.ts`
- `queue` — `tools/fabricated-fight.ts`
- `quote` — `tools/build-userscript.ts`, `tools/protocol-key-table.ts`
- `quoted` — `tools/protocol-key-table.ts`
- `ranked` — `tools/fight-figures.ts`
- `raw` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `reach` — `tools/aura-standing.ts`
- `reached` — `tools/build-userscript.ts`
- `readerSide` — `tools/preview-page.ts`
- `reading` — in 9 files: `tools/`
- `readings` — `tools/payload-cost.ts`, `tools/turn-reading.ts`
- `reason` — `tools/preview-server.ts`
- `rebuild` — `tools/preview-server.ts`
- `record` — `tools/panel-shots.ts`, `tools/recorded-material.ts`
- `recorded` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `recording` — `tools/capture-intake.ts`
- `redraw` — `tools/panel-giving-way.ts`
- `reduction` — `tools/fabricated-fight.ts`
- `region` — `tools/panel-giving-way.ts`
- `regions` — `tools/panel-giving-way.ts`
- `register` — `tools/help-article.ts`
- `removed` — in 4 files: `tools/`
- `renamed` — `tools/capture-intake.ts`
- `replayed` — in 5 files: `tools/`
- `replayedFight` — `tools/card-height.ts`, `tools/drill-report.ts`
- `report` — `tools/protocol-key-shape.ts`
- `response` — `tools/margonem-client-source.ts`
- `rest` — `tools/capture-intake.ts`, `tools/changelog.ts`, `tools/protocol-key-shape.ts`
- `restored` — `tools/fabricated-fight.ts`
- `rewrite` — `tools/develop-reports.ts`
- `rewriteCount` — `tools/develop-reports.ts`
- `rewriteIndex` — `tools/develop-reports.ts`
- `rewriteLine` — `tools/develop-reports.ts`
- `rewriteLines` — `tools/develop-reports.ts`
- `role` — `tools/status-bit-table.ts`
- `roll` — `tools/capture-intake.ts`
- `root` — `tools/panel-giving-way.ts`
- `roster` — `tools/drill-report.ts`, `tools/turn-reading.ts`
- `round` — `tools/fabricated-fight.ts`
- `row` — in 6 files: `tools/`
- `rows` — in 4 files: `tools/`
- `ruleAt` — `tools/protocol-key-shape.ts`
- `run` — `tools/aura-lifetime.ts`, `tools/payload-cost.ts`
- `runEnd` — `tools/protocol-key-table.ts`, `tools/status-bit-table.ts`
- `rungs` — `tools/drill-report.ts`
- `runs` — `tools/aura-lifetime.ts`
- `runsByLength` — `tools/aura-lifetime.ts`
- `said` — in 8 files: `tools/`
- `scale` — `tools/fabricated-fight.ts`
- `scaled` — `tools/fabricated-fight.ts`
- `screen` — `tools/card-height.ts`, `tools/drill-report.ts`, `tools/preview-state.ts`
- `screens` — `tools/drill-report.ts`
- `script` — `tools/build-userscript.ts`, `tools/preview-page.ts`
- `scriptWritten` — `tools/build-userscript.ts`
- `section` — `tools/changelog.ts`, `tools/develop-reports.ts`
- `sections` — `tools/develop-reports.ts`
- `sentence` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `separator` — `tools/status-bit-table.ts`
- `served` — `tools/margonem-client-source.ts`, `tools/panel-shots.ts`
- `server` — `tools/preview-server.ts`
- `settings` — `tools/preview-page.ts`
- `shape` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `shapes` — `tools/protocol-key-shape.ts`
- `share` — `tools/fabricated-fight.ts`, `tools/shout-holding.ts`
- `shared` — `tools/aura-lifetime.ts`, `tools/develop-reports.ts`
- `sheet` — `tools/preview-page.ts`
- `shelved` — `tools/decoding-status.ts`
- `shift` — `tools/margonem-readings.ts`
- `shifts` — `tools/margonem-readings.ts`
- `shot` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `shots` — `tools/panel-shots.ts`
- `shout` — `tools/skill-table.ts`
- `shoutSkills` — `tools/skill-table.ts`
- `shoutStated` — `tools/aura-standing.ts`
- `shouted` — `tools/skill-table.ts`
- `shouter` — `tools/fabricated-fight.ts`
- `shouts` — `tools/fabricated-fight.ts`, `tools/skill-table.ts`
- `shown` — `tools/panel-giving-way.ts`
- `side` — in 4 files: `tools/`
- `sides` — `tools/capture-intake.ts`, `tools/fight-figures.ts`
- `signal` — `tools/preview-server.ts`
- `silent` — `tools/help-article.ts`
- `size` — `tools/card-height.ts`, `tools/help-article.ts`
- `skill` — `tools/drill-report.ts`, `tools/skill-table.ts`
- `skillId` — `tools/aura-standing.ts`
- `skillRow` — `tools/drill-report.ts`
- `skills` — `tools/capture-intake.ts`, `tools/margonem-readings.ts`, `tools/skill-table.ts`
- `slug` — `tools/capture-intake.ts`
- `sorted` — `tools/help-claim-register.ts`
- `source` — `tools/capture-intake.ts`, `tools/panel-giving-way.ts`
- `sources` — `tools/aura-standing.ts`
- `staging` — `tools/panel-shots.ts`
- `stale` — `tools/margonem-readings.ts`
- `stamped` — `tools/build-userscript.ts`
- `standing` — in 7 files: `tools/`
- `standsFromRight` — `tools/panel-shots.ts`
- `start` — in 4 files: `tools/`
- `started` — `tools/payload-cost.ts`
- `state` — in 5 files: `tools/`
- `stated` — in 8 files: `tools/`
- `statedIndex` — `tools/turn-count.ts`
- `states` — `tools/margonem-readings.ts`
- `statistics` — `tools/drill-report.ts`, `tools/fight-figures.ts`, `tools/turn-count.ts`
- `status` — `tools/aura-lifetime.ts`, `tools/decoding-status.ts`
- `step` — in 6 files: `tools/`
- `stepIndex` — `tools/aura-lifetime.ts`
- `stepReading` — `tools/turn-reading.ts`
- `stepped` — `tools/recorded-material.ts`
- `steps` — in 5 files: `tools/`
- `stood` — `tools/preview-page.ts`
- `store` — `tools/preview-state.ts`
- `stretch` — `tools/turn-count.ts`
- `strongest` — `tools/protocol-key-shape.ts`
- `subject` — `tools/protocol-key-table.ts`
- `substituted` — `tools/capture-intake.ts`
- `substitutions` — `tools/capture-intake.ts`
- `survivor` — `tools/fabricated-fight.ts`
- `table` — `tools/margonem-readings.ts`
- `tag` — `tools/build-userscript.ts`
- `tags` — `tools/build-userscript.ts`
- `tail` — `tools/payload-cost.ts`
- `tailAt` — `tools/protocol-key-table.ts`
- `taken` — `tools/fabricated-fight.ts`, `tools/panel-shots.ts`, `tools/turn-count.ts`
- `takenAt` — `tools/panel-shots.ts`
- `takenNow` — `tools/turn-count.ts`
- `tallest` — `tools/card-height.ts`
- `tallies` — `tools/aura-standing.ts`, `tools/protocol-key-shape.ts`, `tools/turn-reading.ts`
- `tally` — in 7 files: `tools/`
- `target` — `tools/capture-intake.ts`, `tools/fabricated-fight.ts`
- `targetAt` — `tools/build-userscript.ts`
- `task` — `tools/capture-intake.ts`
- `templateDepths` — `tools/build-userscript.ts`
- `terminator` — `tools/protocol-key-table.ts`
- `text` — in 14 files: `tools/`
- `textLength` — `tools/help-article.ts`
- `textPath` — `tools/help-article.ts`
- `textWritten` — `tools/help-article.ts`
- `texts` — `tools/frozen-files.ts`
- `tips` — `tools/preview-page.ts`
- `tipsStyle` — `tools/preview-page.ts`
- `told` — `tools/preview-server.ts`
- `took` — `tools/payload-cost.ts`
- `tookMilliseconds` — `tools/payload-cost.ts`
- `total` — in 5 files: `tools/`
- `trimmed` — `tools/help-claim-register.ts`
- `turn` — `tools/fabricated-fight.ts`, `tools/turn-reading.ts`
- `turns` — in 6 files: `tools/`
- `turnsAtGoingOut` — `tools/aura-lifetime.ts`
- `turnsAtShout` — `tools/shout-holding.ts`
- `turnsNow` — `tools/aura-lifetime.ts`
- `twice` — `tools/status-bit-table.ts`
- `unasked` — `tools/margonem-readings.ts`
- `undecided` — `tools/capture-intake.ts`
- `under` — `tools/drill-report.ts`
- `unknown` — `tools/panel-giving-way.ts`
- `unnamed` — `tools/drill-report.ts`
- `unread` — `tools/decoding-status.ts`
- `unreadKeys` — `tools/decoding-status.ts`
- `untold` — `tools/turn-count.ts`
- `upTo` — `tools/shout-holding.ts`
- `update` — `tools/payload-cost.ts`, `tools/recorded-material.ts`, `tools/turn-count.ts`
- `updates` — `tools/recorded-material.ts`
- `url` — `tools/help-article.ts`, `tools/preview-server.ts`, `tools/skill-table.ts`
- `urlAt` — `tools/build-userscript.ts`
- `valueClaim` — `tools/protocol-key-shape.ts`
- `values` — `tools/skill-table.ts`
- `verdict` — `tools/margonem-readings.ts`, `tools/protocol-key-shape.ts`
- `version` — `tools/build-userscript.ts`, `tools/changelog.ts`, `tools/preview-server.ts`
- `view` — in 4 files: `tools/`
- `walk` — `tools/turn-reading.ts`
- `walked` — `tools/drill-report.ts`
- `walkedValue` — `tools/capture-intake.ts`
- `walks` — `tools/turn-reading.ts`
- `wanted` — `tools/capture-intake.ts`, `tools/preview-server.ts`
- `warning` — `tools/help-article.ts`
- `warriors` — `tools/capture-intake.ts`
- `wasDash` — `tools/capture-intake.ts`
- `watch` — `tools/preview-state.ts`
- `watcher` — `tools/preview-server.ts`
- `when` — `tools/help-article.ts`
- `widths` — `tools/aura-standing.ts`
- `window` — `tools/payload-cost.ts`
- `wiped` — `tools/fabricated-fight.ts`
- `without` — `tools/turn-reading.ts`
- `won` — `tools/fabricated-fight.ts`
- `word` — `tools/protocol-key-shape.ts`
- `wordIndex` — `tools/protocol-key-shape.ts`
- `words` — `tools/protocol-key-shape.ts`
- `worked` — `tools/panel-shots.ts`
- `world` — `tools/capture-intake.ts`
- `wrapped` — `tools/payload-cost.ts`
- `writing` — `tools/preview-state.ts`
- `written` — in 11 files: `tools/`
- `wrong` — `tools/turn-count.ts`
- `x` — `tools/panel-shots.ts`

### `tests/`

- `ONE_TOO_MANY` — `tests/ui/panel-content.test.ts`
- `PartsDate` — `tests/ui/panel-words.test.ts`
- `WINDOW_LEFT` — `tests/ui/panel-drag.test.ts`
- `_` — `tests/ports/margonem-engine-warriors.test.ts`
- `_dropped` — `tests/tools/help-article.test.ts`, `tests/tools/margonem-client-source.test.ts`
- `abandoned` — `tests/runtime/margonem-engine-search.test.ts`
- `abandons` — `tests/runtime/margonem-engine-search.test.ts`
- `above` — in 4 files: `tests/`
- `absence` — `tests/ui/panel-words.test.ts`
- `absent` — in 7 files: `tests/`
- `absentKeys` — `tests/repository/protocol-keys.test.ts`
- `across` — `tests/ui/panel-look.test.ts`
- `acted` — `tests/core/turn-clock.test.ts`
- `action` — `tests/repository/workflows.test.ts`
- `actor` — `tests/core/combatant-health.test.ts`, `tests/core/message-grammar.test.ts`,
  `tests/ui/panel-screen.test.ts`
- `actorId` — `tests/core/granted-blow-rule.test.ts`, `tests/core/injure-rule.test.ts`,
  `tests/core/turn-clock.test.ts`
- `actors` — `tests/core/npc-heal-rule.test.ts`
- `addOn` — `tests/repository/captured-fight-register.test.ts`
- `added` — `tests/runtime/defect-ledger.test.ts`
- `addon` — `tests/tools/preview-page.test.ts`
- `adds` — `tests/tools/turn-reading.test.ts`
- `admitted` — `tests/runtime/fight-file.test.ts`
- `after` — in 19 files: `tests/`
- `afterAnother` — `tests/core/turn-clock.test.ts`
- `afterBlow` — `tests/core/charged-skill.test.ts`
- `afterRow` — `tests/e2e/panel-drag.spec.ts`
- `afterTheYear` — `tests/ui/panel-words.test.ts`
- `afterUnplaced` — `tests/core/aura-standing.test.ts`
- `again` — in 7 files: `tests/`
- `agreed` — `tests/tools/develop-reports.test.ts`, `tests/tools/turn-count.test.ts`,
  `tests/ui/panel-content.test.ts`
- `agreeing` — `tests/repository/design-tokens.test.ts`
- `aimed` — `tests/core/aura-standing.test.ts`, `tests/core/fight-statistics.test.ts`
- `air` — `tests/ui/panel-look.test.ts`
- `allowed` — `tests/e2e/panel-fixture.ts`, `tests/repository/layers.test.ts`
- `alone` — in 13 files: `tests/`
- `along` — `tests/e2e/panel-probe.ts`
- `amount` — in 4 files: `tests/`
- `amounts` — `tests/ui/share-bound.test.ts`
- `ancestor` — in 5 files: `tests/`
- `anchor` — in 4 files: `tests/`
- `anchorless` — `tests/ports/browser-file.test.ts`
- `annotation` — `tests/repository/purity.test.ts`
- `announced` — in 9 files: `tests/`
- `announcedByPlayer` — `tests/core/charged-skill.test.ts`
- `announcement` — `tests/core/message-grammar.test.ts`
- `announcementName` — `tests/runtime/margometer-runtime.test.ts`
- `announcements` — `tests/core/anguish-rule.test.ts`, `tests/repository/skill-durations.test.ts`
- `announcingOnSide` — `tests/tools/drill-report.test.ts`
- `another` — `tests/core/carried-figure.test.ts`
- `anotherBlow` — `tests/core/fight-decoder.test.ts`
- `answer` — in 7 files: `tests/`
- `answered` — `tests/ports/browser-store.test.ts`, `tests/runtime-world.ts`,
  `tests/runtime/panel-frame.test.ts`
- `answering` — `tests/ports/margonem-engine-tooltip.test.ts`
- `answers` — `tests/e2e/panel-boot.spec.ts`, `tests/runtime/shelf-keeper.test.ts`
- `any` — `tests/ui/panel-content.test.ts`
- `anywhere` — `tests/ui/panel-element.test.ts`
- `apart` — in 4 files: `tests/`
- `apartAgreeing` — `tests/tools/aura-lifetime.test.ts`
- `applied` — in 4 files: `tests/`
- `applier` — `tests/core/anguish-rule.test.ts`
- `appliers` — `tests/core/anguish-rule.test.ts`
- `approximate` — `tests/core/combatant-health.test.ts`
- `arrives` — `tests/runtime/shelf.test.ts`
- `arrow` — `tests/core/fight-statistics.test.ts`
- `asked` — in 13 files: `tests/`
- `asserted` — `tests/repository/non-null-assertions.test.ts`
- `assertion` — `tests/repository/type-assertions.test.ts`
- `assertions` — `tests/repository/non-null-assertions.test.ts`
- `asset` — `tests/tools/preview-site.test.ts`
- `astray` — `tests/tools/panel-shots.test.ts`
- `asynchronous` — `tests/repository/synchronous-bundle.test.ts`
- `atBound` — in 14 files: `tests/`
- `atFirstCall` — `tests/tools/preview-state.test.ts`
- `atIntake` — `tests/runtime/fight-file.test.ts`
- `atMaximum` — `tests/ui/panel-helper.test.ts`
- `atShare` — `tests/core/combatant-health.test.ts`
- `atTheBound` — `tests/ui/panel-words.test.ts`
- `attack` — `tests/core/fight-decoder.test.ts`
- `attacker` — `tests/core/injure-rule.test.ts`
- `attackers` — `tests/core/injure-rule.test.ts`
- `attacks` — `tests/core/fight-decoder.test.ts`
- `aura` — `tests/core/aura-standing.test.ts`, `tests/core/fight-statistics.test.ts`,
  `tests/tools/frozen-files.test.ts`
- `auto` — `tests/ui/panel-helper.test.ts`
- `axis` — `tests/ui/panel-look.test.ts`
- `back` — in 5 files: `tests/`
- `backFile` — `tests/repository/control-flow.test.ts`
- `backtickAt` — `tests/tools/drill-report.test.ts`
- `backtickIndex` — `tests/repository/captured-fight-register.test.ts`
- `balance` — `tests/core/fight-statistics.test.ts`
- `band` — `tests/tools/preview-site.test.ts`
- `bandaged` — `tests/core/fight-statistics.test.ts`
- `banner` — `tests/e2e/build-once.ts`, `tests/tools/build-userscript.test.ts`,
  `tests/tools/preview-server.test.ts`
- `bar` — in 14 files: `tests/`
- `bare` — in 10 files: `tests/`
- `bareCount` — `tests/repository/browser-support.test.ts`
- `bareRow` — `tests/repository/browser-support.test.ts`
- `bareRows` — `tests/repository/browser-support.test.ts`
- `bareTarget` — `tests/ui/panel-intent.test.ts`
- `bareVerbs` — `tests/repository/name-shapes.test.ts`
- `bars` — `tests/ui/panel-element.test.ts`
- `base` — `tests/repository/name-register.test.ts`, `tests/runtime-world.ts`,
  `tests/ui/level-drawn.test.ts`
- `baseline` — `tests/tools/shout-holding.test.ts`
- `battle` — in 8 files: `tests/`
- `bearerId` — `tests/runtime/carried-tooltip.test.ts`
- `before` — in 22 files: `tests/`
- `beforeMidnight` — `tests/ui/panel-words.test.ts`
- `beforeTheHour` — `tests/ui/panel-words.test.ts`
- `beforeTheYear` — `tests/ui/panel-words.test.ts`
- `began` — `tests/tools/preview-site.test.ts`
- `behaviour` — `tests/libs/json-text.test.ts`
- `below` — `tests/repository/changelog.test.ts`, `tests/repository/workflows.test.ts`,
  `tests/ui/panel-look.test.ts`
- `beside` — in 5 files: `tests/`
- `besideZero` — `tests/ports/margonem-engine-place.test.ts`
- `between` — in 4 files: `tests/`
- `bigger` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`
- `binder` — `tests/repository/browser-globals.test.ts`
- `binding` — `tests/ports/margonem-engine-battle.test.ts`, `tests/repository/name-shapes.test.ts`,
  `tests/repository/purity.test.ts`
- `bindings` — `tests/repository/browser-globals.test.ts`, `tests/repository/name-shapes.test.ts`
- `bit` — in 4 files: `tests/`
- `bits` — `tests/core/fight-session.test.ts`, `tests/tools/frozen-files.test.ts`
- `bitten` — `tests/core/fight-statistics.test.ts`
- `blank` — `tests/runtime/fight-file.test.ts`
- `bled` — `tests/core/anguish-rule.test.ts`
- `blind` — `tests/runtime/fight-file.test.ts`
- `block` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/help-article.test.ts`,
  `tests/ui/panel-element.test.ts`
- `blocked` — `tests/core/fight-statistics.test.ts`
- `blocks` — `tests/runtime/carried-tooltip.test.ts`, `tests/ui/panel-element.test.ts`
- `blow` — `tests/core/fight-decoder.test.ts`, `tests/core/fight-statistics.test.ts`,
  `tests/core/legendary-standing.test.ts`
- `blowKeys` — `tests/ui/blow-vocabulary.test.ts`
- `blowMessage` — `tests/ui/panel-content.test.ts`
- `blows` — in 5 files: `tests/`
- `blowsRead` — `tests/core/granted-blow-rule.test.ts`
- `blue` — `tests/ui/panel-look.test.ts`
- `board` — `tests/ports/margonem-engine-tooltip.test.ts`
- `body` — in 8 files: `tests/`
- `bold` — `tests/ui/panel-card.test.ts`
- `bonus` — `tests/core/legendary-standing.test.ts`
- `border` — `tests/ui/panel-look.test.ts`
- `both` — in 14 files: `tests/`
- `bothIds` — `tests/core/fight-decoder.test.ts`
- `bound` — in 4 files: `tests/`
- `boundNode` — `tests/repository/purity.test.ts`
- `boundaries` — `tests/tools/turn-count.test.ts`
- `bounded` — `tests/core/granted-blow-rule.test.ts`, `tests/tools/turn-count.test.ts`
- `bounds` — `tests/ui/panel-drag.test.ts`
- `box` — in 8 files: `tests/`
- `boxes` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-marks.spec.ts`
- `breach` — `tests/repository/purity.test.ts`
- `breaches` — `tests/repository/event-entries.test.ts`, `tests/repository/purity.test.ts`
- `breaking` — `tests/runtime/live-fight.test.ts`, `tests/runtime/margonem-engine-search.test.ts`
- `breaksWritten` — `tests/ports/margonem-engine-tooltip.test.ts`
- `broken` — in 12 files: `tests/`
- `brokenPart` — `tests/ui/panel-content.test.ts`
- `brokenStatistics` — `tests/ui/panel-content.test.ts`
- `build` — in 4 files: `tests/`
- `built` — `tests/e2e/build-once.ts`, `tests/repository/regular-expressions.test.ts`,
  `tests/tools/build-userscript.test.ts`
- `bundle` — in 6 files: `tests/`
- `bundlePath` — `tests/tools/margonem-client-source.test.ts`
- `byCombatantId` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `byId` — `tests/recorded-fights.ts`
- `byKey` — `tests/ui/panel-content.test.ts`
- `byMessage` — `tests/core/health-witness.test.ts`
- `byName` — `tests/repository/decisions.test.ts`
- `byOneCaster` — `tests/core/carried-figure.test.ts`
- `byProfession` — `tests/repository/captured-fight-register.test.ts`
- `byVerb` — `tests/repository/name-register.test.ts`
- `call` — in 16 files: `tests/`
- `callIndex` — `tests/ports/fight-capture.test.ts`
- `callback` — `tests/repository/handed-callbacks.test.ts`
- `called` — in 4 files: `tests/`
- `calledOnce` — `tests/repository/called-once.test.ts`
- `callee` — `tests/repository/assertion-density.test.ts`, `tests/repository/event-entries.test.ts`,
  `tests/repository/purity.test.ts`
- `calleeName` — `tests/repository/event-entries.test.ts`, `tests/repository/purity.test.ts`
- `calleeVerb` — `tests/repository/event-entries.test.ts`
- `caller` — in 5 files: `tests/`
- `callerIndex` — `tests/repository/declaration-order.test.ts`
- `callerName` — `tests/repository/called-once.test.ts`, `tests/repository/purity.test.ts`
- `callerPurity` — `tests/repository/purity.test.ts`
- `calls` — in 16 files: `tests/`
- `camel` — `tests/repository/names.test.ts`
- `cancelled` — `tests/ports/browser-frame.test.ts`, `tests/ports/browser-interval.test.ts`
- `cancels` — `tests/runtime/margonem-engine-search.test.ts`
- `candidate` — in 4 files: `tests/`
- `cap` — `tests/ui/panel-element.test.ts`
- `capped` — `tests/core/combatant-health.test.ts`
- `capture` — `tests/runtime/live-fight.test.ts`
- `capturedStamp` — `tests/runtime/margometer-runtime.test.ts`
- `card` — in 14 files: `tests/`
- `cards` — `tests/e2e/panel-camera.ts`
- `carried` — in 14 files: `tests/`
- `carrier` — `tests/ui/panel-element.test.ts`
- `carrierNotes` — `tests/ui/panel-element.test.ts`
- `carries` — `tests/core/anguish-rule.test.ts`
- `carrying` — in 5 files: `tests/`
- `cases` — in 5 files: `tests/`
- `cast` — in 9 files: `tests/`
- `castPast` — `tests/core/aura-standing.test.ts`
- `caster` — `tests/core/absorption-destruction-rule.test.ts`, `tests/ui/panel-content.test.ts`
- `casterUnknown` — `tests/core/combatant-health.test.ts`
- `casters` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/tools/fabricated-fight.test.ts`
- `casts` — `tests/core/aura-standing.test.ts`, `tests/core/combatant-health.test.ts`,
  `tests/repository/type-assertions.test.ts`
- `cause` — `tests/simulation.ts`
- `caveat` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-words.test.ts`
- `cell` — in 5 files: `tests/`
- `cellBoxes` — `tests/e2e/panel-size.spec.ts`
- `cellClosing` — `tests/markdown-document.ts`
- `cellOpening` — `tests/markdown-document.ts`
- `cells` — in 12 files: `tests/`
- `centred` — `tests/tools/preview-page.test.ts`
- `chainLink` — `tests/repository/purity.test.ts`
- `change` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-screen.test.ts`
- `changed` — `tests/repository/purity.test.ts`, `tests/tools/capture-intake.test.ts`,
  `tests/tools/develop-reports.test.ts`
- `changedNode` — `tests/repository/purity.test.ts`
- `changedNodes` — `tests/repository/purity.test.ts`
- `changes` — `tests/repository/purity.test.ts`
- `channel` — `tests/ui/panel-look.test.ts`
- `channels` — `tests/ui/panel-look.test.ts`
- `character` — in 13 files: `tests/`
- `characterIndex` — `tests/repository/cited-paths.test.ts`, `tests/repository/documents.test.ts`,
  `tests/repository/type-assertions.test.ts`
- `charge` — `tests/core/fight-session.test.ts`, `tests/ui/view-failure.test.ts`
- `chargeStatements` — `tests/core/fight-session.test.ts`
- `charged` — in 6 files: `tests/`
- `charges` — `tests/ui/panel-helper.test.ts`
- `charging` — `tests/tools/panel-shots.test.ts`, `tests/ui/helper-window.test.ts`
- `checked` — in 5 files: `tests/`
- `child` — `tests/fake-document.ts`, `tests/repository/name-register.test.ts`,
  `tests/source-tree.ts`
- `childIndex` — `tests/fake-document.ts`
- `choice` — in 8 files: `tests/`
- `chosenScreen` — `tests/e2e/panel-reload.spec.ts`
- `citation` — `tests/repository/cited-paths.test.ts`
- `citations` — `tests/repository/cited-paths.test.ts`
- `cited` — `tests/repository/protocol-keys.test.ts`
- `claim` — `tests/repository/protocol-keys.test.ts`
- `claimIndex` — `tests/repository/protocol-keys.test.ts`
- `claimed` — `tests/repository/protocol-keys.test.ts`
- `claims` — `tests/repository/protocol-keys.test.ts`
- `className` — `tests/ui/panel-element.test.ts`
- `classes` — `tests/e2e/panel-helper.spec.ts`, `tests/repository/name-register.test.ts`,
  `tests/ui/helper-window.test.ts`
- `clause` — `tests/tools/aura-lifetime.test.ts`
- `clauses` — `tests/tools/aura-lifetime.test.ts`
- `clean` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-card.test.ts`
- `cleanse` — `tests/core/protocol-key.test.ts`
- `clear` — `tests/e2e/panel-layer.spec.ts`
- `cleared` — `tests/ports/browser-interval.test.ts`
- `clicked` — `tests/ports/browser-file.test.ts`
- `clock` — in 4 files: `tests/`
- `close` — `tests/core/last-heal-rule.test.ts`, `tests/markdown-document.ts`,
  `tests/repository/browser-support.test.ts`
- `closed` — in 11 files: `tests/`
- `closes` — `tests/repository/captured-fight-register.test.ts`,
  `tests/repository/protocol-keys.test.ts`, `tests/tools/drill-report.test.ts`
- `closest` — `tests/core/last-heal-rule.test.ts`
- `closing` — in 4 files: `tests/`
- `closure` — `tests/repository/handed-callbacks.test.ts`
- `code` — `tests/tools/build-userscript.test.ts`, `tests/ui/panel-palette.test.ts`
- `collections` — `tests/repository/purity.test.ts`
- `colon` — `tests/ui/panel-look.test.ts`
- `colonIndex` — `tests/repository/browser-support.test.ts`, `tests/style-sheet.ts`
- `colour` — `tests/ui/panel-palette.test.ts`
- `colourText` — `tests/ui/panel-look.test.ts`
- `coloured` — `tests/ui/panel-palette.test.ts`
- `colourless` — `tests/ui/panel-element.test.ts`
- `colours` — `tests/ui/panel-look.test.ts`
- `columns` — `tests/ui/card-window.test.ts`
- `combatant` — in 6 files: `tests/`
- `combatantEntry` — `tests/ports/payload-envelope.test.ts`
- `combatantId` — in 11 files: `tests/`
- `combatants` — in 12 files: `tests/`
- `combatantsBefore` — `tests/runtime/live-fight.test.ts`
- `command` — `tests/repository/name-register.test.ts`
- `comment` — `tests/repository/comment-share.test.ts`, `tests/source-tree.ts`
- `commentTexts` — `tests/source-tree.ts`
- `commented` — `tests/core/aura-standing.test.ts`
- `committed` — `tests/tools/panel-shots.test.ts`
- `compared` — `tests/ports/margonem-engine-warriors.test.ts`
- `comparison` — `tests/tools/develop-reports.test.ts`
- `compose` — `tests/tools/preview-state.test.ts`, `tests/ui/panel-look.test.ts`
- `composed` — in 4 files: `tests/`
- `composedLine` — `tests/repository/name-register.test.ts`
- `composedLines` — `tests/repository/name-register.test.ts`
- `computed` — `tests/repository/cited-paths.test.ts`
- `computedFamily` — `tests/tools/protocol-key-table.test.ts`
- `config` — `tests/tools/panel-shots.test.ts`
- `configuration` — `tests/repository/documents.test.ts`,
  `tests/repository/fabricated-fights.test.ts`, `tests/repository/name-register.test.ts`
- `construct` — `tests/repository/browser-support.test.ts`
- `constructs` — `tests/repository/browser-support.test.ts`
- `contested` — `tests/tools/turn-reading.test.ts`
- `context` — in 11 files: `tests/`
- `continued` — `tests/repository/protocol-keys.test.ts`
- `continuedEntry` — `tests/repository/changelog.test.ts`
- `contradicted` — `tests/ui/panel-content.test.ts`
- `control` — in 4 files: `tests/`
- `core` — `tests/repository/layers.test.ts`, `tests/repository/reader-layer.test.ts`
- `corner` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-size.spec.ts`
- `corners` — `tests/e2e/panel-drag.spec.ts`
- `count` — in 11 files: `tests/`
- `counted` — in 13 files: `tests/`
- `counters` — `tests/ui/panel-card.test.ts`
- `counts` — in 7 files: `tests/`
- `covered` — `tests/e2e/panel-layer.spec.ts`
- `covering` — `tests/e2e/panel-layer.spec.ts`
- `cramped` — `tests/runtime/shelf.test.ts`, `tests/ui/panel-drag.test.ts`
- `createElement` — `tests/fake-window.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/ui/view-failure.test.ts`
- `created` — `tests/fake-document.ts`, `tests/ui/view-failure.test.ts`
- `critical` — `tests/core/message-grammar.test.ts`
- `crowded` — `tests/runtime/live-fight.test.ts`, `tests/runtime/panel-frame.test.ts`
- `crumb` — `tests/ui/panel-element.test.ts`
- `crumbs` — `tests/ui/panel-element.test.ts`
- `currentLine` — `tests/tools/margonem-readings.test.ts`
- `currentState` — `tests/tools/margonem-readings.test.ts`
- `curse` — `tests/core/protocol-key.test.ts`
- `cut` — in 8 files: `tests/`
- `cutIndex` — `tests/ports/margonem-engine-tooltip.test.ts`
- `cutSentences` — `tests/e2e/panel-helper.spec.ts`
- `cycle` — `tests/libs/json-text.test.ts`, `tests/ports/fight-capture.test.ts`
- `damage` — `tests/ui/panel-screen.test.ts`
- `damageDealt` — `tests/runtime/margometer-runtime.test.ts`
- `damageDealtAbsorbed` — `tests/runtime/margometer-runtime.test.ts`
- `damageDealtApplied` — `tests/runtime/margometer-runtime.test.ts`
- `damageDealtByOpponent` — `tests/core/fight-statistics.test.ts`
- `dangling` — `tests/repository/cited-paths.test.ts`, `tests/repository/documents.test.ts`
- `dated` — in 4 files: `tests/`
- `datedPast` — `tests/core/aura-standing.test.ts`
- `day` — `tests/tools/help-article.test.ts`
- `deaf` — `tests/ui/helper-window.test.ts`
- `dealer` — `tests/core/fight-statistics.test.ts`, `tests/runtime/fight-file.test.ts`
- `dealt` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `dealtByKind` — `tests/core/fight-statistics.test.ts`
- `dealtRows` — `tests/ui/panel-content.test.ts`
- `dealtTogether` — `tests/ui/panel-content.test.ts`
- `dealtTotal` — `tests/tools/drill-report.test.ts`
- `declaration` — in 12 files: `tests/`
- `declarationStart` — `tests/repository/browser-support.test.ts`
- `declarations` — `tests/repository/browser-support.test.ts`
- `declarator` — in 5 files: `tests/`
- `declarators` — `tests/repository/handed-callbacks.test.ts`
- `declared` — in 11 files: `tests/`
- `declaredFunction` — `tests/repository/purity.test.ts`
- `declaredKeys` — `tests/core/skill-announcement-rule.test.ts`
- `declaringNode` — `tests/repository/name-register.test.ts`
- `decoded` — in 4 files: `tests/`
- `decoder` — `tests/tools/preview-server.test.ts`
- `decoding` — `tests/recorded-fights.ts`
- `decoy` — `tests/tools/preview-server.test.ts`
- `deep` — `tests/core/fight-statistics.test.ts`
- `deeper` — `tests/e2e/panel-drill.spec.ts`
- `deepest` — `tests/repository/called-once.test.ts`, `tests/repository/nesting-depth.test.ts`
- `defect` — `tests/ui/panel-element.test.ts`
- `defects` — `tests/runtime/live-fight.test.ts`, `tests/runtime/panel-frame.test.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `defence` — `tests/core/protocol-key.test.ts`, `tests/ui/panel-words.test.ts`
- `delegating` — `tests/repository/protocol-keys.test.ts`
- `denied` — `tests/repository/documents.test.ts`
- `density` — `tests/repository/assertion-density.test.ts`
- `departure` — `tests/ui/panel-look.test.ts`
- `depth` — in 11 files: `tests/`
- `depths` — `tests/repository/readmes.test.ts`
- `derived` — `tests/repository/declaration-order.test.ts`,
  `tests/repository/skill-durations.test.ts`
- `descendant` — in 4 files: `tests/`
- `design` — `tests/repository/event-entries.test.ts`
- `destroyed` — `tests/ui/blow-vocabulary.test.ts`
- `detail` — `tests/ports/browser-console.test.ts`, `tests/runtime/margonem-engine-search.test.ts`,
  `tests/simulation.ts`
- `develop` — `tests/repository/cited-paths.test.ts`, `tests/ui/panel-look.test.ts`
- `developKept` — `tests/ui/panel-look.test.ts`
- `developRules` — `tests/ui/panel-look.test.ts`
- `dictionary` — `tests/ports/margonem-client-dictionary.test.ts`
- `differed` — `tests/ui/panel-content.test.ts`
- `difference` — `tests/tools/develop-reports.test.ts`
- `digitsFrom` — `tests/repository/documents.test.ts`
- `directions` — `tests/ui/panel-screen.test.ts`
- `directives` — `tests/repository/type-assertions.test.ts`
- `directories` — `tests/repository/documents.test.ts`, `tests/repository/name-register.test.ts`
- `directory` — in 13 files: `tests/`
- `disagreeing` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/repository/protocol-keys.test.ts`
- `disagreement` — `tests/core/health-witness.test.ts`
- `disagreements` — `tests/repository/design-tokens.test.ts`, `tests/tools/panel-shots.test.ts`
- `disputed` — `tests/tools/turn-reading.test.ts`
- `distance` — `tests/core/combatant-health.test.ts`, `tests/ui/card-window.test.ts`
- `distinct` — `tests/core/combatant-roster.test.ts`
- `distribution` — `tests/tools/card-height.test.ts`
- `docblock` — `tests/repository/comment-share.test.ts`
- `document` — in 13 files: `tests/`
- `documented` — `tests/tools/aura-lifetime.test.ts`, `tests/tools/aura-standing.test.ts`
- `documents` — `tests/repository/documents.test.ts`
- `doesCarryUnsizedShare` — `tests/core/health-witness.test.ts`
- `doesOpen` — `tests/tools/drill-report.test.ts`, `tests/ui/panel-element.test.ts`
- `doesState` — `tests/ui/level-drawn.test.ts`
- `dot` — `tests/ui/panel-look.test.ts`
- `dotHeight` — `tests/ui/panel-look.test.ts`
- `dotTop` — `tests/ui/panel-look.test.ts`
- `dots` — `tests/ui/helper-window.test.ts`
- `doubleWidth` — `tests/ui/card-window.test.ts`
- `doubled` — `tests/repository/names.test.ts`, `tests/runtime/carried-tooltip.test.ts`
- `download` — `tests/e2e/panel-save.spec.ts`
- `downloads` — `tests/ports/browser-file.test.ts`
- `drained` — `tests/core/fight-statistics.test.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/ui/panel-content.test.ts`
- `drawing` — `tests/e2e/panel-type.spec.ts`
- `drawn` — in 20 files: `tests/`
- `drawnAnswer` — `tests/e2e/panel-options.spec.ts`
- `drawnBar` — `tests/ui/panel-element.test.ts`
- `drawnPin` — `tests/runtime/margometer-runtime.test.ts`
- `dressed` — `tests/tools/preview-page.test.ts`
- `drill` — in 5 files: `tests/`
- `drillCase` — `tests/tools/drill-report.test.ts`
- `driver` — `tests/tools/preview-page.test.ts`
- `dropped` — `tests/ui/view-failure.test.ts`
- `duel` — `tests/tools/fabricated-fight.test.ts`
- `earlier` — `tests/recorded-fights.ts`
- `earliestSection` — `tests/repository/changelog.test.ts`
- `early` — `tests/repository/changelog.test.ts`, `tests/ui/panel-element.test.ts`
- `east` — `tests/ports/margonem-engine-place.test.ts`
- `edge` — `tests/e2e/panel-options.spec.ts`, `tests/tools/preview-state.test.ts`
- `edited` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/frozen-files.test.ts`
- `edition` — `tests/tools/build-userscript.test.ts`
- `editions` — `tests/tools/preview-server.test.ts`
- `eightIn` — `tests/core/carried-figure.test.ts`
- `elapsed` — `tests/core/aura-standing.test.ts`
- `element` — `tests/ui/panel-words.test.ts`
- `elementOfClass` — `tests/ui/panel-scroll.test.ts`
- `elements` — `tests/core/fight-decoder.test.ts`, `tests/ui/panel-words.test.ts`
- `elementsWithin` — `tests/fake-document.ts`
- `elsewhere` — in 6 files: `tests/`
- `emptied` — `tests/core/granted-blow-rule.test.ts`, `tests/core/injure-rule.test.ts`
- `empty` — in 11 files: `tests/`
- `enclosing` — `tests/repository/assertion-density.test.ts`,
  `tests/repository/handed-callbacks.test.ts`
- `encode` — `tests/tools/frozen-files.test.ts`
- `end` — in 11 files: `tests/`
- `ended` — in 4 files: `tests/`
- `ending` — `tests/ui/card-window.test.ts`, `tests/ui/panel-words.test.ts`
- `endless` — `tests/libs/unknown-value.test.ts`
- `ends` — in 6 files: `tests/`
- `engine` — in 6 files: `tests/`
- `engineBattle` — `tests/ports/margonem-engine-battle.test.ts`
- `engineOwn` — `tests/runtime/margometer-runtime.test.ts`
- `english` — `tests/repository/readmes.test.ts`, `tests/tools/capture-intake.test.ts`
- `entered` — `tests/core/combatant-health.test.ts`
- `entries` — in 6 files: `tests/`
- `entryFile` — `tests/repository/reader-layer.test.ts`
- `entryPath` — `tests/tools/build-userscript.test.ts`
- `entryStart` — `tests/tools/aura-lifetime.test.ts`
- `entryText` — `tests/repository/changelog.test.ts`
- `envelope` — `tests/tools/fabricated-fight.test.ts`
- `error` — `tests/tools/changelog.test.ts`, `tests/tools/fight-figures.test.ts`,
  `tests/tools/recorded-material.test.ts`
- `errorClass` — `tests/repository/throws.test.ts`
- `event` — in 15 files: `tests/`
- `eventIndex` — `tests/core/aura-standing.test.ts`
- `events` — in 15 files: `tests/`
- `everyTrapThrows` — `tests/runtime/margometer-runtime.test.ts`
- `everyone` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `everything` — `tests/core/last-heal-rule.test.ts`
- `exact` — `tests/core/combatant-health.test.ts`
- `exceeded` — `tests/core/message-grammar.test.ts`
- `excluded` — `tests/repository/documents.test.ts`
- `expected` — in 6 files: `tests/`
- `explained` — `tests/tools/drill-report.test.ts`
- `exported` — `tests/repository/names.test.ts`
- `extra` — `tests/core/turn-clock.test.ts`
- `extras` — `tests/core/turn-clock.test.ts`
- `fabricated` — `tests/tools/fabricated-fight.test.ts`
- `factors` — `tests/ui/panel-look.test.ts`
- `failed` — `tests/libs/errors.test.ts`, `tests/runtime/live-fight.test.ts`
- `failing` — `tests/runtime/margonem-engine-search.test.ts`
- `failure` — `tests/ui/panel-intent.test.ts`, `tests/ui/view-failure.test.ts`,
  `tests/userscript-entry.test.ts`
- `failures` — in 10 files: `tests/`
- `fakeElement` — `tests/fake-document.ts`
- `faked` — `tests/fake-window.ts`
- `fallen` — `tests/fake-window.ts`, `tests/runtime-world.ts`
- `family` — `tests/tools/frozen-files.test.ts`
- `far` — `tests/tools/help-article.test.ts`
- `faulted` — `tests/simulation.test.ts`
- `faults` — `tests/repository/changelog.test.ts`, `tests/simulation.test.ts`,
  `tests/ui/panel-words.test.ts`
- `faultsInjected` — `tests/simulation.ts`
- `fed` — `tests/e2e/panel-boot.spec.ts`
- `fence` — `tests/repository/name-register.test.ts`
- `fetchHeld` — `tests/tools/margonem-client-source.test.ts`
- `few` — `tests/repository/name-register.test.ts`
- `field` — `tests/e2e/panel-save.spec.ts`, `tests/ports/payload-envelope.test.ts`
- `fieldText` — `tests/repository/decisions.test.ts`
- `fieldThrowing` — `tests/ports/margonem-engine-battle.test.ts`
- `fieldValue` — `tests/repository/captured-fight-register.test.ts`
- `fight` — in 46 files: `tests/`
- `fightDealt` — `tests/core/fight-statistics.test.ts`
- `fightIndex` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/preview-server.test.ts`,
  `tests/tools/recorded-material.test.ts`
- `fightNumber` — `tests/runtime/margometer-runtime.test.ts`
- `fightTaken` — `tests/core/fight-statistics.test.ts`
- `fightView` — `tests/core/fight-session.test.ts`, `tests/ports/recorded-session.test.ts`
- `fights` — in 7 files: `tests/`
- `figure` — in 8 files: `tests/`
- `figureCell` — `tests/ui/panel-element.test.ts`
- `figured` — `tests/runtime/carried-tooltip.test.ts`, `tests/ui/panel-words.test.ts`
- `figures` — in 19 files: `tests/`
- `file` — in 12 files: `tests/`
- `fileNames` — `tests/repository/name-register.test.ts`
- `fileSaid` — `tests/runtime/margometer-runtime.test.ts`
- `files` — in 16 files: `tests/`
- `fill` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `fills` — `tests/ui/panel-look.test.ts`
- `findings` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-look.test.ts`
- `fire` — `tests/runtime/margometer-runtime.test.ts`
- `fired` — `tests/runtime/margometer-runtime.test.ts`
- `firstApplied` — `tests/core/fight-session.test.ts`
- `firstBy` — `tests/core/combatant-health.test.ts`
- `firstCall` — `tests/e2e/panel-save.spec.ts`, `tests/runtime/fight-file.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `firstCard` — `tests/ui/card-window.test.ts`
- `firstFailure` — `tests/ports/margonem-engine-battle.test.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `firstFight` — `tests/e2e/panel-shelf.spec.ts`, `tests/ports/recorded-session.test.ts`
- `firstFile` — `tests/tools/frozen-files.test.ts`
- `firstKind` — `tests/ui/panel-element.test.ts`
- `firstPinned` — `tests/runtime/shelf.test.ts`
- `firstReading` — `tests/tools/turn-reading.test.ts`
- `firstRegistry` — `tests/ports/margonem-engine-tooltip.test.ts`
- `firstScreen` — `tests/ui/panel-card.test.ts`
- `firstShape` — `tests/e2e/panel-drill.spec.ts`
- `firstWalk` — `tests/core/carried-status.test.ts`, `tests/core/legendary-standing.test.ts`
- `firstWorld` — `tests/runtime/margometer-runtime.test.ts`
- `fits` — `tests/ports/margonem-client-dictionary.test.ts`
- `fitting` — `tests/ui/blow-vocabulary.test.ts`
- `five` — `tests/core/fight-decoder.test.ts`
- `fixture` — `tests/repository/name-register.test.ts`
- `flagged` — in 6 files: `tests/`
- `flat` — `tests/core/fight-statistics.test.ts`, `tests/libs/json-text.test.ts`
- `fled` — in 5 files: `tests/`
- `floor` — `tests/repository/assertion-density.test.ts`
- `floored` — `tests/ui/share-column.test.ts`
- `flushed` — `tests/tools/preview-page.test.ts`
- `focusedBy` — `tests/rebuilding-battle.ts`
- `fold` — in 4 files: `tests/`
- `folded` — in 4 files: `tests/`
- `folding` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-gesture.test.ts`
- `following` — `tests/core/granted-blow-rule.test.ts`, `tests/repository/browser-support.test.ts`
- `followingLine` — `tests/repository/protocol-keys.test.ts`
- `followingText` — `tests/repository/changelog.test.ts`
- `font` — in 4 files: `tests/`
- `fontIndex` — `tests/ui/panel-look.test.ts`
- `foreign` — `tests/ports/margonem-engine-battle.test.ts`
- `forged` — `tests/ports/fight-capture.test.ts`
- `format` — `tests/repository/documents.test.ts`
- `fought` — `tests/runtime/fight-file.test.ts`
- `four` — `tests/runtime/shelf.test.ts`
- `fraction` — `tests/ports/payload-envelope.test.ts`, `tests/runtime/settings.test.ts`,
  `tests/runtime/shelf.test.ts`
- `fragments` — `tests/tools/help-article.test.ts`
- `frame` — in 4 files: `tests/`
- `frames` — `tests/ports/browser-frame.test.ts`, `tests/runtime-world.ts`
- `freed` — `tests/core/aura-standing.test.ts`
- `fresh` — `tests/core/fight-decoder.test.ts`, `tests/ports/margonem-engine-tooltip.test.ts`
- `freshestByWounded` — `tests/core/injure-rule.test.ts`
- `from` — in 10 files: `tests/`
- `fromDealt` — `tests/ui/panel-screen.test.ts`
- `fromDevelop` — `tests/runtime/shelf.test.ts`
- `fromNobody` — `tests/core/fight-statistics.test.ts`
- `fromStart` — `tests/core/fight-session.test.ts`
- `fromTaken` — `tests/ui/panel-screen.test.ts`
- `frozen` — in 5 files: `tests/`
- `full` — in 8 files: `tests/`
- `fullShout` — `tests/core/fight-decoder.test.ts`
- `functionNode` — `tests/repository/control-flow.test.ts`
- `function_` — `tests/repository/name-register.test.ts`
- `functions` — in 6 files: `tests/`
- `further` — `tests/core/message-grammar.test.ts`
- `game` — `tests/repository/layers.test.ts`, `tests/tools/preview-page.test.ts`
- `gap` — `tests/e2e/panel-card.spec.ts`
- `gesture` — `tests/e2e/panel-camera.ts`
- `getShelf` — `tests/runtime/shelf-keeper.test.ts`
- `given` — in 5 files: `tests/`
- `givenFlags` — `tests/tools/panel-giving-way.test.ts`
- `giver` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `glued` — `tests/core/fight-decoder.test.ts`
- `goFile` — `tests/repository/control-flow.test.ts`
- `gone` — `tests/core/charged-skill.test.ts`, `tests/repository/protocol-keys.test.ts`,
  `tests/tools/fabricated-fight.test.ts`
- `grade` — `tests/tools/fabricated-fight.test.ts`, `tests/tools/turn-count.test.ts`
- `grades` — `tests/tools/turn-count.test.ts`
- `granted` — `tests/core/granted-blow-rule.test.ts`, `tests/tools/turn-count.test.ts`
- `green` — `tests/ui/panel-look.test.ts`
- `grip` — in 4 files: `tests/`
- `ground` — `tests/e2e/panel-size.spec.ts`, `tests/ui/panel-look.test.ts`
- `grounds` — `tests/ui/panel-look.test.ts`
- `group` — `tests/e2e/panel-card.spec.ts`, `tests/ui/panel-helper.test.ts`
- `groupCost` — `tests/e2e/panel-card.spec.ts`
- `groupStyle` — `tests/e2e/panel-card.spec.ts`
- `groups` — `tests/ui/panel-card.test.ts`
- `grown` — `tests/repository/name-register.test.ts`
- `grownHelper` — `tests/ui/panel-drag.test.ts`
- `grownMeter` — `tests/ui/panel-drag.test.ts`
- `guarded` — `tests/ports/margonem-engine-battle.test.ts`
- `guardedWrap` — `tests/ports/margonem-engine-battle.test.ts`
- `guarding` — `tests/repository/handed-callbacks.test.ts`
- `guardingNames` — `tests/repository/handed-callbacks.test.ts`
- `guards` — `tests/repository/documents.test.ts`
- `half` — in 6 files: `tests/`
- `halfAMinute` — `tests/ui/panel-words.test.ts`
- `halfAnHour` — `tests/ui/panel-words.test.ts`
- `halfAuto` — `tests/ports/payload-envelope.test.ts`
- `halfNamed` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-element.test.ts`
- `halfSide` — `tests/ports/payload-envelope.test.ts`
- `halved` — `tests/repository/design-tokens.test.ts`
- `handed` — in 4 files: `tests/`
- `handedChanges` — `tests/repository/purity.test.ts`
- `handle` — in 4 files: `tests/`
- `hasRoot` — `tests/e2e/panel-boot.spec.ts`
- `hasSnapshot` — `tests/recorded-fights.ts`
- `hasThrownIntoMargonem` — `tests/simulation.ts`
- `hash` — `tests/tools/preview-state.test.ts`
- `hatch` — `tests/ui/panel-look.test.ts`
- `hatched` — `tests/ui/panel-element.test.ts`
- `header` — in 4 files: `tests/`
- `heading` — in 8 files: `tests/`
- `headingIndex` — `tests/register-table.ts`, `tests/repository/design-tokens.test.ts`
- `headings` — `tests/repository/changelog.test.ts`, `tests/repository/comment-share.test.ts`,
  `tests/ui/panel-element.test.ts`
- `heal` — `tests/core/combatant-health.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/core/legendary-standing.test.ts`
- `healed` — in 5 files: `tests/`
- `healer` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `healing` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-screen.test.ts`
- `heals` — in 5 files: `tests/`
- `health` — `tests/core/combatant-health.test.ts`, `tests/recorded-fights.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `healthMaximum` — `tests/core/health-witness.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/recorded-fights.ts`
- `healthMaximumById` — `tests/core/bandage-rule.test.ts`, `tests/core/health-witness.test.ts`,
  `tests/core/wound-rule.test.ts`
- `healthPercent` — `tests/recorded-fights.ts`
- `healthReadings` — `tests/recorded-fights.ts`
- `heard` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/turn-count.test.ts`,
  `tests/ui/panel-content.test.ts`
- `height` — `tests/ui/panel-look.test.ts`, `tests/userscript-entry.test.ts`
- `heights` — `tests/tools/card-height.test.ts`
- `held` — in 46 files: `tests/`
- `heldPlace` — `tests/e2e/panel-drag.spec.ts`
- `heldShare` — `tests/tools/shout-holding.test.ts`
- `heldState` — `tests/runtime/shelf-keeper.test.ts`
- `heldString` — `tests/repository/name-register.test.ts`
- `heldValue` — `tests/repository/name-register.test.ts`
- `help` — `tests/tools/frozen-files.test.ts`
- `helper` — `tests/repository/declaration-order.test.ts`, `tests/ui/panel-drag.test.ts`,
  `tests/ui/panel-look.test.ts`
- `helperWindow` — `tests/ui/helper-window.test.ts`
- `here` — `tests/core/absorption-destruction-rule.test.ts`, `tests/core/last-heal-rule.test.ts`
- `hereKept` — `tests/ui/panel-look.test.ts`
- `hereRules` — `tests/ui/panel-look.test.ts`
- `hero` — in 4 files: `tests/`
- `high` — `tests/ui/panel-look.test.ts`
- `highest` — `tests/core/message-grammar.test.ts`,
  `tests/repository/captured-fight-register.test.ts`, `tests/repository/declaration-order.test.ts`
- `highestAfter` — `tests/tools/shout-holding.test.ts`
- `history` — `tests/repository/cited-paths.test.ts`
- `hit` — `tests/core/fight-decoder.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/core/message-grammar.test.ts`
- `hits` — `tests/core/fight-decoder.test.ts`
- `holder` — in 5 files: `tests/`
- `holderTotals` — `tests/core/legendary-standing.test.ts`
- `holders` — `tests/repository/name-register.test.ts`, `tests/ui/panel-words.test.ts`
- `holdersByValue` — `tests/repository/name-register.test.ts`
- `holding` — `tests/ui/helper-window.test.ts`
- `holdingCopy` — `tests/runtime/margometer-runtime.test.ts`
- `holed` — `tests/runtime/shelf.test.ts`
- `host` — in 13 files: `tests/`
- `html` — `tests/e2e/panel-fixture.ts`
- `hue` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`
- `hues` — `tests/ui/panel-look.test.ts`
- `huge` — `tests/runtime/shelf.test.ts`
- `hurt` — `tests/core/combatant-health.test.ts`
- `icon` — `tests/ui/panel-look.test.ts`
- `id` — in 16 files: `tests/`
- `identified` — `tests/core/fight-decoder.test.ts`
- `identifier` — `tests/repository/browser-globals.test.ts`,
  `tests/repository/declaration-order.test.ts`, `tests/repository/names.test.ts`
- `identifierStart` — `tests/repository/declaration-order.test.ts`
- `identifiers` — `tests/repository/called-once.test.ts`
- `idle` — `tests/ports/margonem-engine-battle.test.ts`, `tests/ui/panel-content.test.ts`
- `ids` — `tests/ports/margonem-engine-tooltip.test.ts`, `tests/tools/preview-site.test.ts`,
  `tests/ui/panel-content.test.ts`
- `ignored` — `tests/ports/margonem-engine-battle.test.ts`,
  `tests/repository/fabricated-fights.test.ts`
- `ignoring` — `tests/ports/margonem-engine-battle.test.ts`
- `illegible` — `tests/runtime/panel-frame.test.ts`
- `imported` — `tests/source-tree.ts`, `tests/tools/panel-shots.test.ts`
- `importer` — `tests/repository/name-shapes.test.ts`, `tests/repository/single-importer.test.ts`
- `importers` — `tests/repository/single-importer.test.ts`
- `importersByModule` — `tests/repository/single-importer.test.ts`
- `index` — in 29 files: `tests/`
- `init` — `tests/repository/handed-callbacks.test.ts`, `tests/repository/purity.test.ts`,
  `tests/source-tree.ts`
- `initType` — `tests/repository/names.test.ts`
- `ink` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`
- `inks` — `tests/ui/panel-look.test.ts`
- `inline` — `tests/tools/build-userscript.test.ts`
- `innermost` — `tests/source-tree.ts`
- `input` — `tests/repository/workflows.test.ts`
- `inserted` — `tests/tools/develop-reports.test.ts`
- `insetAbove` — `tests/ui/panel-look.test.ts`
- `insetBelow` — `tests/ui/panel-look.test.ts`
- `inside` — in 8 files: `tests/`
- `intake` — `tests/tools/capture-intake.test.ts`
- `intent` — `tests/ui/panel-intent.test.ts`
- `interval` — `tests/ports/browser-interval.test.ts`
- `into` — `tests/tools/panel-giving-way.test.ts`
- `is` — `tests/ui/panel-look.test.ts`
- `isAnswering` — `tests/ports/margonem-engine-tooltip.test.ts`
- `isAppended` — `tests/runtime/carried-tooltip.test.ts`
- `isAt` — `tests/core/health-witness.test.ts`
- `isBreak` — `tests/repository/names.test.ts`
- `isChargingById` — `tests/runtime/carried-tooltip.test.ts`
- `isConstructor` — `tests/repository/regular-expressions.test.ts`
- `isExported` — `tests/repository/declaration-order.test.ts`
- `isFolded` — `tests/e2e/panel-type.spec.ts`
- `isFunction` — `tests/repository/name-register.test.ts`
- `isInit` — `tests/core/fight-figures.test.ts`
- `isInside` — `tests/tools/turn-count.test.ts`, `tests/tools/turn-reading.test.ts`
- `isLiteral` — `tests/repository/regular-expressions.test.ts`
- `isLocal` — `tests/userscript-entry.test.ts`
- `isName` — `tests/core/skill-announcement-rule.test.ts`, `tests/ui/panel-words.test.ts`
- `isPageSized` — `tests/ui/panel-gesture.test.ts`
- `isPlayer` — `tests/repository/captured-fight-register.test.ts`
- `isPoolRaised` — `tests/core/health-witness.test.ts`
- `isQuoted` — `tests/repository/browser-support.test.ts`
- `isRefusing` — `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/shelf-keeper.test.ts`,
  `tests/ui/view-failure.test.ts`
- `isSession` — `tests/userscript-entry.test.ts`
- `isShaped` — `tests/ui/panel-words.test.ts`
- `isShared` — `tests/verb-purities.ts`
- `isSpent` — `tests/runtime/carried-tooltip.test.ts`
- `isStillFaulted` — `tests/repository/changelog.test.ts`
- `isThrowing` — `tests/ports/margonem-engine-tooltip.test.ts`
- `isTick` — `tests/core/wound-rule.test.ts`
- `isTold` — `tests/runtime/carried-tooltip.test.ts`
- `isTop` — `tests/repository/name-register.test.ts`
- `isUndivided` — `tests/ui/panel-element.test.ts`
- `isWrite` — `tests/simulation.ts`
- `items` — `tests/repository/declaration-order.test.ts`
- `joined` — in 4 files: `tests/`
- `jqueryObject` — `tests/ports/margonem-engine-tooltip.test.ts`
- `keeper` — `tests/runtime/live-fight.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `keeping` — `tests/runtime/live-fight.test.ts`
- `kept` — in 17 files: `tests/`
- `keptCalls` — `tests/runtime/live-fight.test.ts`
- `keptOpenedAts` — `tests/runtime/margometer-runtime.test.ts`
- `keptState` — `tests/runtime/shelf-keeper.test.ts`
- `kepts` — `tests/runtime/margometer-runtime.test.ts`
- `key` — in 18 files: `tests/`
- `keyIndex` — `tests/ports/fight-capture.test.ts`
- `keyTally` — `tests/tools/turn-reading.test.ts`
- `keyed` — `tests/ports/payload-envelope.test.ts`, `tests/ports/warrior-entries.test.ts`,
  `tests/ui/panel-element.test.ts`
- `keyedBadly` — `tests/ui/panel-content.test.ts`
- `keyedPast` — `tests/ports/payload-envelope.test.ts`
- `keyless` — `tests/core/message-grammar.test.ts`
- `keys` — in 16 files: `tests/`
- `keysFound` — `tests/repository/browser-suite-keys.test.ts`
- `killing` — `tests/core/message-grammar.test.ts`
- `kind` — in 10 files: `tests/`
- `kindCell` — `tests/ui/panel-element.test.ts`
- `kindIndex` — `tests/core/fight-statistics.test.ts`
- `kinds` — in 10 files: `tests/`
- `kindsSaid` — `tests/simulation.ts`
- `known` — in 7 files: `tests/`
- `label` — `tests/e2e/panel-card.spec.ts`, `tests/repository/browser-support.test.ts`
- `labelClaims` — `tests/repository/protocol-keys.test.ts`
- `labelIndex` — `tests/e2e/panel-card.spec.ts`, `tests/repository/browser-support.test.ts`
- `labels` — `tests/e2e/panel-card.spec.ts`, `tests/tools/protocol-key-table.test.ts`
- `lacking` — `tests/libs/unknown-value.test.ts`
- `landed` — `tests/core/carried-figure.test.ts`, `tests/e2e/panel-drag.spec.ts`,
  `tests/e2e/panel-tooltip.spec.ts`
- `large` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`
- `largest` — `tests/core/combatant-roster.test.ts`, `tests/libs/number-text.test.ts`,
  `tests/ui/panel-element.test.ts`
- `lastMember` — `tests/core/last-heal-rule.test.ts`
- `lastPort` — `tests/tools/panel-giving-way.test.ts`
- `lastShout` — `tests/core/aura-standing.test.ts`
- `late` — in 6 files: `tests/`
- `lateClock` — `tests/runtime/margonem-engine-search.test.ts`
- `latePage` — `tests/runtime/margonem-engine-search.test.ts`
- `later` — `tests/tools/drill-report.test.ts`, `tests/ui/card-window.test.ts`
- `laterMessage` — `tests/core/granted-blow-rule.test.ts`
- `layer` — `tests/repository/layers.test.ts`, `tests/repository/name-register.test.ts`
- `layered` — `tests/ports/margonem-engine-battle.test.ts`
- `layers` — `tests/repository/name-register.test.ts`
- `lead` — `tests/repository/documents.test.ts`
- `leader` — `tests/ui/view-failure.test.ts`
- `leadingCharacter` — `tests/repository/changelog.test.ts`
- `leaves` — `tests/ui/panel-element.test.ts`
- `lede` — `tests/tools/preview-site.test.ts`
- `ledger` — `tests/runtime/defect-ledger.test.ts`, `tests/ui/view-failure.test.ts`
- `left` — in 6 files: `tests/`
- `legal` — `tests/repository/protocol-keys.test.ts`
- `legible` — `tests/runtime/panel-frame.test.ts`
- `length` — `tests/tools/capture-intake.test.ts`, `tests/ui/panel-look.test.ts`
- `letter` — in 5 files: `tests/`
- `letters` — `tests/repository/protocol-keys.test.ts`, `tests/tools/preview-page.test.ts`,
  `tests/ui/panel-words.test.ts`
- `level` — in 4 files: `tests/`
- `levels` — `tests/repository/captured-fight-register.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `library` — `tests/repository/layers.test.ts`, `tests/source-tree.ts`
- `libs` — `tests/source-tree.ts`
- `lightest` — `tests/ui/panel-look.test.ts`
- `lightings` — `tests/tools/aura-lifetime.test.ts`
- `line` — in 27 files: `tests/`
- `lineHeights` — `tests/ui/panel-look.test.ts`
- `lines` — in 22 files: `tests/`
- `linkAt` — `tests/tools/preview-site.test.ts`
- `list` — in 9 files: `tests/`
- `listEnd` — `tests/repository/name-shapes.test.ts`
- `listStart` — `tests/repository/name-shapes.test.ts`
- `listed` — in 12 files: `tests/`
- `listedPart` — `tests/ui/panel-element.test.ts`
- `listener` — `tests/ports/margonem-engine-battle.test.ts`, `tests/runtime/live-fight.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `listeners` — `tests/tools/preview-server.test.ts`
- `lists` — `tests/tools/capture-intake.test.ts`
- `lit` — `tests/core/fight-session.test.ts`, `tests/tools/fabricated-fight.test.ts`,
  `tests/ui/helper-window.test.ts`
- `litExpected` — `tests/ui/helper-window.test.ts`
- `literal` — `tests/repository/protocol-keys.test.ts`,
  `tests/repository/regular-expressions.test.ts`
- `little` — `tests/e2e/panel-card.spec.ts`
- `little_` — `tests/e2e/panel-card.spec.ts`
- `live` — in 6 files: `tests/`
- `loading` — `tests/ports/margonem-engine-place.test.ts`
- `local` — `tests/source-tree.ts`
- `logged` — `tests/core/fight-decoder.test.ts`
- `longCast` — `tests/e2e/panel-helper.spec.ts`
- `longDrawn` — `tests/e2e/panel-helper.spec.ts`
- `longWanted` — `tests/e2e/panel-helper.spec.ts`
- `longer` — `tests/core/granted-blow-rule.test.ts`, `tests/tools/develop-reports.test.ts`,
  `tests/ui/card-window.test.ts`
- `longest` — in 4 files: `tests/`
- `longhand` — `tests/ui/panel-look.test.ts`
- `look` — `tests/core/granted-blow-rule.test.ts`, `tests/ui/panel-words.test.ts`
- `looked` — `tests/repository/protocol-keys.test.ts`, `tests/tools/preview-site.test.ts`
- `looks` — `tests/runtime/margonem-engine-search.test.ts`
- `lookupAt` — `tests/tools/preview-site.test.ts`
- `lopsided` — `tests/ui/card-window.test.ts`
- `losing` — `tests/tools/turn-reading.test.ts`
- `lost` — in 8 files: `tests/`
- `loud` — `tests/e2e/panel-fixture.ts`, `tests/runtime/live-fight.test.ts`
- `low` — `tests/ui/panel-look.test.ts`
- `lower` — `tests/repository/declaration-order.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-look.test.ts`
- `lowest` — `tests/repository/captured-fight-register.test.ts`
- `lowestInside` — `tests/tools/shout-holding.test.ts`
- `made` — `tests/repository/cited-paths.test.ts`
- `managerAt` — `tests/tools/preview-site.test.ts`
- `manifest` — `tests/repository/name-register.test.ts`,
  `tests/tools/margonem-client-source.test.ts`, `tests/tools/skill-table.test.ts`
- `many` — in 6 files: `tests/`
- `map` — `tests/runtime/margometer-runtime.test.ts`
- `margin` — `tests/ui/panel-look.test.ts`
- `marginAbove` — `tests/ui/panel-look.test.ts`
- `marginBelow` — `tests/ui/panel-look.test.ts`
- `margometerE2e` — `tests/e2e/margonem-page.ts`
- `margonem` — `tests/e2e/margonem-page.ts`, `tests/runtime/live-fight.test.ts`
- `mark` — `tests/e2e/panel-drill.spec.ts`, `tests/ui/panel-intent.test.ts`
- `markIndex` — `tests/repository/documents.test.ts`, `tests/repository/readmes.test.ts`
- `markValue` — `tests/ui/panel-intent.test.ts`
- `marked` — in 10 files: `tests/`
- `marker` — `tests/repository/protocol-keys.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `markerAt` — `tests/tools/protocol-key-table.test.ts`
- `markerLength` — `tests/tools/protocol-key-table.test.ts`
- `marks` — in 5 files: `tests/`
- `mask` — in 4 files: `tests/`
- `masked` — `tests/core/fight-session.test.ts`
- `masks` — `tests/core/carried-status.test.ts`, `tests/core/fight-session.test.ts`
- `matchingNodes` — `tests/source-tree.ts`
- `material` — in 4 files: `tests/`
- `maximum` — in 4 files: `tests/`
- `measured` — in 8 files: `tests/`
- `member` — in 4 files: `tests/`
- `members` — in 5 files: `tests/`
- `memory` — `tests/ports/browser-store.test.ts`
- `mentions` — `tests/repository/called-once.test.ts`, `tests/repository/declaration-order.test.ts`
- `message` — in 14 files: `tests/`
- `messagePosition` — `tests/tools/turn-reading.test.ts`
- `messageReading` — `tests/tools/turn-reading.test.ts`
- `messages` — in 11 files: `tests/`
- `messagesRead` — `tests/core/message-grammar.test.ts`
- `metadata` — `tests/tools/build-userscript.test.ts`
- `meter` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`,
  `tests/ui/view-failure.test.ts`
- `method` — in 4 files: `tests/`
- `methodFunction` — `tests/repository/event-entries.test.ts`
- `metric` — in 7 files: `tests/`
- `midStrike` — `tests/core/granted-blow-rule.test.ts`
- `middle` — `tests/e2e/panel-type.spec.ts`, `tests/runtime/margometer-runtime.test.ts`
- `minute` — `tests/tools/preview-server.test.ts`
- `misnamed` — `tests/repository/names.test.ts`
- `misplaced` — `tests/repository/declaration-order.test.ts`
- `missed` — `tests/repository/skill-durations.test.ts`
- `missing` — in 8 files: `tests/`
- `misspelt` — `tests/repository/import-paths.test.ts`
- `mixed` — `tests/ports/margonem-client-build.test.ts`, `tests/tools/turn-count.test.ts`
- `module` — `tests/ui/panel-look.test.ts`
- `moduleStates` — `tests/repository/purity.test.ts`
- `moment` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-words.test.ts`
- `moments` — `tests/runtime/live-fight.test.ts`
- `momentsWithTwo` — `tests/tools/aura-standing.test.ts`
- `month` — `tests/ui/panel-words.test.ts`
- `most` — `tests/core/injure-rule.test.ts`
- `mounts` — `tests/runtime/margometer-runtime.test.ts`
- `moved` — in 17 files: `tests/`
- `movedBySelector` — `tests/ui/panel-look.test.ts`
- `much` — `tests/e2e/panel-card.spec.ts`
- `mute` — `tests/tools/capture-intake.test.ts`
- `name` — in 41 files: `tests/`
- `nameCell` — `tests/ui/panel-element.test.ts`
- `named` — in 30 files: `tests/`
- `nameless` — in 4 files: `tests/`
- `names` — in 13 files: `tests/`
- `namesRead` — `tests/repository/redacted-names.test.ts`
- `namespaced` — `tests/repository/name-shapes.test.ts`
- `narrow` — `tests/e2e/panel-card.spec.ts`, `tests/tools/aura-lifetime.test.ts`
- `narrowed` — `tests/ui/blow-vocabulary.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `near` — `tests/tools/help-article.test.ts`, `tests/ui/panel-drag.test.ts`
- `nearly` — `tests/runtime/shelf.test.ts`
- `nearlyFull` — `tests/core/fight-session.test.ts`
- `needed` — `tests/ui/panel-element.test.ts`
- `needs` — `tests/tools/preview-page.test.ts`
- `negated` — `tests/repository/non-null-assertions.test.ts`
- `neither` — `tests/core/turn-clock.test.ts`
- `nested` — `tests/repository/called-once.test.ts`, `tests/tools/drill-report.test.ts`
- `never` — `tests/e2e/panel-fixture.ts`
- `newcomer` — `tests/core/fight-session.test.ts`
- `newer` — `tests/tools/develop-reports.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `newest` — `tests/runtime/margometer-runtime.test.ts`
- `newlineIndex` — `tests/source-tree.ts`
- `nextTurn` — `tests/core/charged-skill.test.ts`
- `noDay` — `tests/ui/panel-words.test.ts`
- `nobody` — `tests/core/fight-statistics.test.ts`, `tests/ports/margonem-engine-warriors.test.ts`,
  `tests/ui/panel-element.test.ts`
- `nobodyNamed` — `tests/core/message-grammar.test.ts`
- `nodes` — `tests/repository/non-null-assertions.test.ts`
- `nonFigure` — `tests/ui/panel-words.test.ts`
- `none` — in 6 files: `tests/`
- `notANumber` — `tests/runtime/settings.test.ts`
- `notListed` — `tests/runtime/shelf.test.ts`
- `notMethod` — `tests/ports/margonem-engine-battle.test.ts`
- `note` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-words.test.ts`
- `noted` — `tests/ui/card-window.test.ts`
- `notes` — in 4 files: `tests/`
- `notesByRowName` — `tests/ui/panel-element.test.ts`
- `nothing` — `tests/libs/json-text.test.ts`, `tests/ui/card-window.test.ts`,
  `tests/ui/panel-content.test.ts`
- `nothingReached` — `tests/ui/panel-card.test.ts`
- `noughts` — `tests/tools/capture-intake.test.ts`
- `noun` — `tests/repository/captured-fight-register.test.ts`, `tests/ui/panel-words.test.ts`
- `nouns` — `tests/ui/panel-screen.test.ts`
- `now` — `tests/core/granted-blow-rule.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `nowhere` — `tests/runtime/shelf.test.ts`
- `number` — `tests/repository/decisions.test.ts`
- `numberBefore` — `tests/ui/level-drawn.test.ts`
- `numbered` — `tests/core/fight-decoder.test.ts`, `tests/ports/recorded-session.test.ts`,
  `tests/repository/changelog.test.ts`
- `numbers` — `tests/repository/documents.test.ts`
- `object` — `tests/repository/name-register.test.ts`
- `objections` — `tests/tools/panel-shots.test.ts`
- `occurrence` — `tests/core/last-heal-rule.test.ts`
- `occurrences` — `tests/core/last-heal-rule.test.ts`
- `odd` — `tests/libs/errors.test.ts`, `tests/ports/browser-store.test.ts`,
  `tests/ports/margonem-engine-place.test.ts`
- `off` — in 4 files: `tests/`
- `offShelf` — `tests/runtime/shelf.test.ts`
- `offer` — `tests/tools/preview-page.test.ts`
- `offerAt` — `tests/tools/preview-site.test.ts`
- `offered` — `tests/tools/capture-intake.test.ts`, `tests/tools/preview-page.test.ts`
- `offs` — `tests/core/fight-statistics.test.ts`
- `offset` — `tests/repository/browser-support.test.ts`
- `okrzyk` — `tests/e2e/panel-helper.spec.ts`
- `older` — `tests/runtime/shelf.test.ts`, `tests/tools/capture-intake.test.ts`
- `oldest` — `tests/runtime/margometer-runtime.test.ts`
- `onCard` — `tests/e2e/panel-marks.spec.ts`
- `onReaderSide` — `tests/tools/fabricated-fight.test.ts`
- `onSide` — `tests/tools/drill-report.test.ts`
- `onThatShape` — `tests/tools/turn-reading.test.ts`
- `onTime` — `tests/runtime/margonem-engine-search.test.ts`
- `onTimeClock` — `tests/runtime/margonem-engine-search.test.ts`
- `onTimePage` — `tests/runtime/margonem-engine-search.test.ts`
- `once` — `tests/ports/margonem-engine-tooltip.test.ts`
- `oneLiners` — `tests/repository/control-flow.test.ts`
- `oneMore` — `tests/core/turn-clock.test.ts`
- `onePayload` — `tests/runtime/shelf.test.ts`
- `oneSection` — `tests/tools/develop-reports.test.ts`
- `only` — in 4 files: `tests/`
- `onlyKind` — `tests/ui/panel-element.test.ts`
- `onlyName` — `tests/ports/margonem-engine-place.test.ts`
- `onlyOne` — `tests/tools/develop-reports.test.ts`
- `onlyX` — `tests/ports/margonem-engine-place.test.ts`
- `onlyY` — `tests/ports/margonem-engine-place.test.ts`
- `onto` — `tests/e2e/panel-probe.ts`
- `opaqueDepth` — `tests/repository/browser-support.test.ts`
- `open` — in 6 files: `tests/`
- `opened` — in 27 files: `tests/`
- `openedAt` — `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `openedPart` — `tests/ui/level-drawn.test.ts`, `tests/ui/share-column.test.ts`
- `openedShelf` — `tests/runtime/shelf.test.ts`
- `opener` — in 10 files: `tests/`
- `openerId` — `tests/core/granted-blow-rule.test.ts`
- `openerIndex` — `tests/style-sheet.ts`, `tests/ui/panel-look.test.ts`
- `openerTally` — `tests/tools/turn-reading.test.ts`
- `openers` — `tests/core/fight-decoder.test.ts`, `tests/core/turn-clock.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `opening` — in 12 files: `tests/`
- `openingLine` — `tests/repository/readmes.test.ts`
- `opens` — `tests/tools/preview-server.test.ts`
- `opensOnCode` — `tests/repository/comment-share.test.ts`
- `operators` — `tests/ui/panel-look.test.ts`
- `opponent` — `tests/core/fight-statistics.test.ts`, `tests/runtime/carried-tooltip.test.ts`,
  `tests/ui/panel-element.test.ts`
- `opposing` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`
- `options` — in 5 files: `tests/`
- `order` — `tests/ports/margonem-engine-battle.test.ts`, `tests/tools/capture-intake.test.ts`
- `ordinal` — `tests/ports/payload-envelope.test.ts`, `tests/ports/recorded-session.test.ts`
- `original` — `tests/ports/margonem-engine-battle.test.ts`,
  `tests/ports/margonem-engine-warriors.test.ts`
- `otherEnd` — `tests/runtime/opened-readings.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `otherEndRow` — `tests/ui/level-drawn.test.ts`, `tests/ui/share-column.test.ts`
- `otherFight` — `tests/tools/develop-reports.test.ts`
- `otherName` — `tests/runtime/margometer-runtime.test.ts`
- `others` — `tests/e2e/panel-scroll.spec.ts`
- `ours` — `tests/repository/captured-fight-register.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `outcome` — in 6 files: `tests/`
- `outcomes` — `tests/core/fight-decoder.test.ts`, `tests/ui/panel-element.test.ts`
- `outer` — `tests/ui/panel-element.test.ts`
- `output` — `tests/repository/name-register.test.ts`
- `outside` — in 4 files: `tests/`
- `over` — in 10 files: `tests/`
- `overlong` — `tests/ui/blow-vocabulary.test.ts`
- `owed` — `tests/runtime/fight-file.test.ts`
- `own` — in 5 files: `tests/`
- `ownAsserts` — `tests/repository/assert-imports.test.ts`
- `owner` — `tests/repository/declaration-order.test.ts`, `tests/repository/protocol-keys.test.ts`
- `pad` — `tests/repository/name-register.test.ts`
- `padded` — `tests/ports/payload-envelope.test.ts`
- `page` — in 16 files: `tests/`
- `pagePart` — `tests/userscript-entry.test.ts`
- `pagePath` — `tests/tools/skill-table.test.ts`
- `painted` — `tests/ui/panel-look.test.ts`
- `pair` — in 6 files: `tests/`
- `pairIds` — `tests/ui/share-column.test.ts`
- `paired` — `tests/core/last-heal-rule.test.ts`, `tests/runtime/screen-intent.test.ts`
- `pairs` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `paladyn` — `tests/core/aura-standing.test.ts`
- `palette` — `tests/ui/panel-palette.test.ts`
- `panel` — in 11 files: `tests/`
- `panelBox` — `tests/e2e/panel-helper.spec.ts`
- `panelLeft` — `tests/tools/panel-shots.test.ts`, `tests/ui/panel-element.test.ts`
- `parameter` — in 9 files: `tests/`
- `parameters` — `tests/core/message-grammar.test.ts`
- `parent` — in 4 files: `tests/`
- `parrier` — `tests/core/fight-statistics.test.ts`
- `parsed` — in 19 files: `tests/`
- `partLevel` — `tests/ui/level-drawn.test.ts`
- `partRow` — `tests/ui/panel-content.test.ts`
- `parted` — `tests/runtime/screen-intent.test.ts`
- `partial` — `tests/ports/payload-envelope.test.ts`, `tests/runtime/shelf.test.ts`
- `partly` — `tests/core/aura-standing.test.ts`
- `partner` — `tests/runtime/carried-tooltip.test.ts`
- `parts` — in 9 files: `tests/`
- `pass` — `tests/repository/name-register.test.ts`
- `passed` — `tests/ports/margonem-client-build.test.ts`
- `past` — in 19 files: `tests/`
- `pastBound` — in 4 files: `tests/`
- `pastMidnight` — `tests/ui/panel-words.test.ts`
- `pastTheHour` — `tests/ui/panel-words.test.ts`
- `pastTheMonth` — `tests/ui/panel-words.test.ts`
- `path` — in 31 files: `tests/`
- `paths` — in 9 files: `tests/`
- `pathsByName` — `tests/repository/name-register.test.ts`
- `pattern` — `tests/repository/browser-globals.test.ts`, `tests/repository/purity.test.ts`
- `patternNames` — `tests/repository/purity.test.ts`
- `patterns` — `tests/repository/browser-globals.test.ts`
- `payload` — in 15 files: `tests/`
- `payloadIndex` — `tests/runtime/margometer-runtime.test.ts`
- `payloads` — in 5 files: `tests/`
- `pending` — `tests/repository/control-flow.test.ts`, `tests/source-tree.ts`
- `pendingById` — `tests/core/health-witness.test.ts`
- `pendingName` — `tests/repository/control-flow.test.ts`
- `people` — `tests/ui/panel-content.test.ts`
- `perFight` — `tests/tools/card-height.test.ts`
- `percent` — in 5 files: `tests/`
- `percentAfter` — `tests/core/health-witness.test.ts`
- `percentBefore` — `tests/core/health-witness.test.ts`
- `percentById` — `tests/core/bandage-rule.test.ts`, `tests/core/health-witness.test.ts`,
  `tests/core/wound-rule.test.ts`
- `permissions` — `tests/repository/documents.test.ts`
- `person` — in 4 files: `tests/`
- `personNotes` — `tests/ui/panel-element.test.ts`
- `phrase` — `tests/repository/protocol-keys.test.ts`
- `pictures` — `tests/repository/readmes.test.ts`
- `pin` — `tests/e2e/panel-shelf.spec.ts`, `tests/repository/workflows.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `pinned` — in 9 files: `tests/`
- `pinnedAt` — `tests/ui/panel-element.test.ts`
- `pinnedCase` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-words.test.ts`
- `pinnedCell` — `tests/ui/panel-element.test.ts`
- `pinnedRowsRead` — `tests/ui/panel-content.test.ts`
- `pinnedShare` — `tests/ui/panel-content.test.ts`
- `pinnedText` — `tests/runtime/shelf.test.ts`
- `pins` — in 4 files: `tests/`
- `pinsByAction` — `tests/repository/workflows.test.ts`
- `pips` — `tests/ui/helper-window.test.ts`
- `pixels` — `tests/ui/panel-look.test.ts`
- `place` — in 13 files: `tests/`
- `placeName` — `tests/ui/panel-screen.test.ts`
- `placed` — in 5 files: `tests/`
- `placeholders` — `tests/repository/name-shapes.test.ts`
- `placements` — `tests/tools/protocol-key-shape.test.ts`
- `places` — `tests/runtime/live-fight.test.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-content.test.ts`
- `plain` — in 5 files: `tests/`
- `plainApplied` — `tests/core/granted-blow-rule.test.ts`
- `plan` — `tests/simulation.test.ts`
- `players` — `tests/repository/captured-fight-register.test.ts`
- `point` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-probe.ts`
- `pointNow` — `tests/e2e/panel-drag.spec.ts`
- `pointedCell` — `tests/ui/panel-element.test.ts`
- `points` — in 4 files: `tests/`
- `poisonLevel` — `tests/ui/panel-content.test.ts`
- `polish` — `tests/repository/readmes.test.ts`
- `port` — `tests/ports/browser-console.test.ts`
- `ports` — `tests/userscript-entry.test.ts`
- `position` — in 4 files: `tests/`
- `positioner` — `tests/e2e/panel-layer.spec.ts`
- `prefix` — `tests/repository/documents.test.ts`
- `prefixed` — `tests/repository/browser-support.test.ts`
- `prefixedNames` — `tests/repository/browser-support.test.ts`
- `preparation` — `tests/core/fight-statistics.test.ts`
- `prepared` — in 7 files: `tests/`
- `present` — `tests/repository/protocol-keys.test.ts`
- `pressIndex` — `tests/ui/panel-element.test.ts`
- `pressed` — `tests/tools/panel-giving-way.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-element.test.ts`
- `prevented` — `tests/ui/panel-gesture.test.ts`
- `preview` — `tests/tools/preview-server.test.ts`
- `procs` — `tests/ui/panel-content.test.ts`
- `produced` — `tests/core/battle-event.test.ts`
- `profession` — `tests/recorded-fights.ts`, `tests/repository/captured-fight-register.test.ts`
- `professions` — `tests/repository/captured-fight-register.test.ts`,
  `tests/tools/fabricated-fight.test.ts`
- `program` — `tests/repository/declaration-order.test.ts`
- `property` — in 4 files: `tests/`
- `propertyValue` — `tests/repository/name-register.test.ts`
- `prose` — `tests/repository/comment-share.test.ts`, `tests/repository/design-tokens.test.ts`
- `provoked` — `tests/runtime/carried-tooltip.test.ts`, `tests/tools/fabricated-fight.test.ts`
- `pseudo` — `tests/repository/browser-support.test.ts`
- `published` — `tests/tools/preview-page.test.ts`
- `purities` — `tests/repository/purity.test.ts`, `tests/verb-purities.ts`
- `purity` — `tests/repository/name-register.test.ts`, `tests/verb-purities.ts`
- `query` — `tests/repository/declaration-order.test.ts`
- `queue` — `tests/ports/payload-envelope.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `quiet` — in 8 files: `tests/`
- `quote` — `tests/ui/panel-words.test.ts`
- `quoteIndex` — `tests/repository/design-tokens.test.ts`
- `quoted` — in 4 files: `tests/`
- `ran` — `tests/ports/browser-frame.test.ts`, `tests/ports/browser-interval.test.ts`
- `random` — `tests/simulation.ts`
- `range` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`,
  `tests/repository/declaration-order.test.ts`
- `rank` — `tests/runtime/margometer-runtime.test.ts`
- `ranked` — `tests/ui/panel-content.test.ts`
- `ranking` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-screen.test.ts`
- `ranks` — `tests/ui/panel-element.test.ts`
- `ratio` — `tests/ui/panel-look.test.ts`
- `raw` — `tests/core/fight-decoder.test.ts`
- `reach` — `tests/repository/name-shapes.test.ts`
- `reachEntries` — `tests/core/aura-standing.test.ts`
- `reached` — in 11 files: `tests/`
- `reachedCell` — `tests/ui/panel-element.test.ts`
- `reachedTotals` — `tests/core/legendary-standing.test.ts`
- `reaching` — `tests/ports/margonem-client-build.test.ts`,
  `tests/repository/browser-globals.test.ts`
- `readPreviewState` — `tests/tools/preview-state.test.ts`
- `readable` — `tests/ui/panel-content.test.ts`
- `reader` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/preview-server.test.ts`
- `readerSide` — in 6 files: `tests/`
- `reading` — in 24 files: `tests/`
- `readings` — `tests/runtime/panel-frame.test.ts`
- `readingsChecked` — `tests/core/combatant-health.test.ts`
- `reads` — `tests/repository/browser-suite-keys.test.ts`
- `reason` — `tests/tools/recorded-material.test.ts`
- `reasons` — `tests/tools/fabricated-fight.test.ts`
- `received` — `tests/ui/panel-content.test.ts`
- `receiver` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `receiverId` — `tests/ui/panel-content.test.ts`
- `reconstructed` — `tests/core/last-heal-rule.test.ts`
- `record` — in 10 files: `tests/`
- `recordFile` — `tests/repository/decisions.test.ts`
- `recorded` — `tests/tools/fabricated-fight.test.ts`
- `recording` — `tests/core/message-grammar.test.ts`, `tests/e2e/panel-page.ts`,
  `tests/ports/fight-capture.test.ts`
- `recordingRows` — `tests/repository/captured-fight-register.test.ts`
- `recordings` — `tests/core/injure-rule.test.ts`, `tests/core/message-grammar.test.ts`
- `records` — `tests/repository/decisions.test.ts`
- `recursive` — `tests/repository/control-flow.test.ts`
- `red` — `tests/ui/panel-look.test.ts`
- `reduced` — `tests/core/combatant-health.test.ts`
- `refreshed` — `tests/core/aura-standing.test.ts`
- `refusal` — `tests/tools/margonem-client-source.test.ts`, `tests/tools/recorded-material.test.ts`,
  `tests/ui/view-failure.test.ts`
- `refusals` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/view-failure.test.ts`
- `refused` — in 13 files: `tests/`
- `refusedCopy` — `tests/runtime/margometer-runtime.test.ts`
- `refusing` — in 6 files: `tests/`
- `region` — `tests/ui/panel-look.test.ts`, `tests/ui/panel-words.test.ts`,
  `tests/ui/view-failure.test.ts`
- `regionSaid` — `tests/runtime/margometer-runtime.test.ts`
- `regions` — `tests/e2e/panel-probe.ts`, `tests/ui/panel-element.test.ts`
- `register` — in 7 files: `tests/`
- `registered` — in 4 files: `tests/`
- `registeredKey` — `tests/repository/protocol-keys.test.ts`,
  `tests/tools/protocol-key-shape.test.ts`
- `registries` — `tests/ports/margonem-engine-tooltip.test.ts`, `tests/rebuilding-battle.ts`,
  `tests/runtime/carried-tooltip.test.ts`
- `registry` — `tests/ports/margonem-engine-tooltip.test.ts`, `tests/rebuilding-battle.ts`,
  `tests/runtime/carried-tooltip.test.ts`
- `released` — `tests/repository/changelog.test.ts`, `tests/runtime/shelf.test.ts`
- `reloaded` — `tests/runtime/margometer-runtime.test.ts`
- `remaining` — `tests/tools/capture-intake.test.ts`
- `renamed` — `tests/ui/panel-look.test.ts`
- `rendered` — `tests/ui/card-window.test.ts`
- `reopened` — `tests/core/fight-session.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `repeated` — in 4 files: `tests/`
- `repeats` — `tests/ui/panel-content.test.ts`
- `replaceWith` — `tests/ui/view-failure.test.ts`
- `replaced` — `tests/ports/recorded-session.test.ts`, `tests/repository/decisions.test.ts`
- `replacing` — `tests/repository/decisions.test.ts`
- `replay` — `tests/tools/fabricated-fight.test.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-content.test.ts`
- `replayed` — in 10 files: `tests/`
- `replayedOffShelf` — `tests/runtime/shelf.test.ts`
- `replays` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`
- `report` — in 9 files: `tests/`
- `reports` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/ports/browser-interval.test.ts`
- `requested` — `tests/ports/browser-frame.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `rescue` — `tests/core/fight-session.test.ts`
- `reset` — `tests/runtime/margometer-runtime.test.ts`
- `resolved` — `tests/repository/name-register.test.ts`
- `response` — `tests/tools/preview-server.test.ts`
- `rest` — in 6 files: `tests/`
- `restIndex` — `tests/ui/panel-element.test.ts`
- `restored` — in 5 files: `tests/`
- `retired` — `tests/repository/names.test.ts`
- `reversed` — `tests/tools/develop-reports.test.ts`
- `revision` — `tests/repository/cited-paths.test.ts`
- `right` — `tests/ui/card-window.test.ts`, `tests/ui/panel-drag.test.ts`
- `ring` — `tests/ui/panel-look.test.ts`
- `room` — `tests/e2e/panel-card.spec.ts`, `tests/runtime/shelf.test.ts`
- `root` — in 13 files: `tests/`
- `roster` — in 29 files: `tests/`
- `roundTripped` — `tests/runtime/fight-file.test.ts`
- `rounded` — `tests/core/combatant-health.test.ts`, `tests/core/injure-rule.test.ts`
- `roundedAttacker` — `tests/core/injure-rule.test.ts`
- `row` — in 27 files: `tests/`
- `rowCells` — `tests/register-table.ts`
- `rowHeight` — `tests/ui/panel-look.test.ts`
- `rowIndex` — in 6 files: `tests/`
- `rowValue` — `tests/e2e/panel-card.spec.ts`
- `rows` — in 24 files: `tests/`
- `rowsBefore` — `tests/ui/panel-element.test.ts`
- `rule` — in 5 files: `tests/`
- `ruleNames` — `tests/repository/documents.test.ts`
- `rules` — `tests/repository/name-shapes.test.ts`, `tests/repository/purity.test.ts`,
  `tests/style-sheet.ts`
- `rulesFromN22` — `tests/repository/name-shapes.test.ts`
- `run` — `tests/core/granted-blow-rule.test.ts`, `tests/libs/html-text.test.ts`
- `rung` — `tests/tools/drill-report.test.ts`
- `running` — in 4 files: `tests/`
- `runs` — `tests/core/granted-blow-rule.test.ts`, `tests/repository/browser-support.test.ts`
- `runtime` — `tests/userscript-entry.test.ts`
- `said` — in 23 files: `tests/`
- `saidByKey` — `tests/ui/level-drawn.test.ts`
- `saids` — `tests/ui/panel-words.test.ts`
- `same` — `tests/tools/margonem-readings.test.ts`
- `sameTurn` — `tests/core/charged-skill.test.ts`
- `sample` — in 35 files: `tests/`
- `sampleCitations` — `tests/repository/cited-paths.test.ts`
- `sampleKeys` — `tests/repository/browser-suite-keys.test.ts`,
  `tests/repository/protocol-keys.test.ts`
- `sampleNames` — `tests/repository/name-register.test.ts`
- `sampled` — `tests/ui/panel-look.test.ts`
- `samples` — `tests/runtime/settings.test.ts`, `tests/ui/panel-look.test.ts`
- `savedPath` — `tests/e2e/panel-save.spec.ts`
- `says` — `tests/tools/margonem-readings.test.ts`, `tests/ui/panel-content.test.ts`
- `saysItsSide` — `tests/core/aura-standing.test.ts`
- `scope` — `tests/repository/browser-globals.test.ts`
- `scoped` — `tests/repository/protocol-keys.test.ts`
- `screen` — in 7 files: `tests/`
- `screens` — `tests/e2e/panel-reload.spec.ts`
- `screensRead` — `tests/ui/panel-content.test.ts`
- `script` — `tests/repository/browser-support.test.ts`, `tests/tools/preview-server.test.ts`
- `search` — `tests/runtime/margonem-engine-search.test.ts`
- `seat` — `tests/repository/captured-fight-register.test.ts`
- `seated` — `tests/core/fight-session.test.ts`, `tests/tools/fabricated-fight.test.ts`
- `seatless` — in 4 files: `tests/`
- `seats` — `tests/ui/panel-content.test.ts`, `tests/ui/share-column.test.ts`
- `second` — in 6 files: `tests/`
- `secondFight` — `tests/e2e/panel-shelf.spec.ts`, `tests/ports/recorded-session.test.ts`
- `secondFile` — `tests/tools/frozen-files.test.ts`
- `secondId` — `tests/core/fight-decoder.test.ts`
- `secondName` — `tests/core/fight-decoder.test.ts`
- `secondRegistry` — `tests/ports/margonem-engine-tooltip.test.ts`
- `secondShape` — `tests/e2e/panel-drill.spec.ts`
- `secondShout` — `tests/ui/panel-helper.test.ts`
- `secondWalk` — `tests/core/carried-status.test.ts`, `tests/core/legendary-standing.test.ts`
- `secondWorld` — `tests/runtime/margometer-runtime.test.ts`
- `secondWrapper` — `tests/ports/margonem-engine-battle.test.ts`
- `section` — in 5 files: `tests/`
- `sections` — in 5 files: `tests/`
- `seen` — in 13 files: `tests/`
- `selectedStrips` — `tests/ui/panel-element.test.ts`
- `selection` — `tests/repository/browser-support.test.ts`
- `selector` — in 5 files: `tests/`
- `selectorIndex` — `tests/ui/panel-look.test.ts`
- `selectors` — `tests/e2e/panel-type.spec.ts`
- `self` — `tests/ports/margonem-engine-battle.test.ts`
- `sentence` — `tests/ui/panel-words.test.ts`
- `sentences` — `tests/ui/panel-words.test.ts`
- `separatorIndex` — `tests/repository/protocol-keys.test.ts`
- `session` — in 5 files: `tests/`
- `sessionHeld` — `tests/runtime/margometer-runtime.test.ts`
- `sessionOptions` — `tests/runtime/live-fight.test.ts`
- `setAttribute` — `tests/ui/view-failure.test.ts`
- `settings` — `tests/e2e/margonem-page.ts`, `tests/repository/documents.test.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `settled` — `tests/repository/browser-support.test.ts`, `tests/tools/fabricated-fight.test.ts`
- `sevenIn` — `tests/core/carried-figure.test.ts`
- `shape` — in 5 files: `tests/`
- `shapeChanges` — `tests/repository/record-shapes.test.ts`
- `shapes` — `tests/ports/fight-capture.test.ts`, `tests/tools/protocol-key-shape.test.ts`,
  `tests/ui/panel-element.test.ts`
- `share` — `tests/core/last-heal-rule.test.ts`, `tests/repository/comment-share.test.ts`,
  `tests/tools/drill-report.test.ts`
- `shareByCaster` — `tests/core/absorption-destruction-rule.test.ts`
- `shared` — `tests/core/fight-decoder.test.ts`, `tests/tools/aura-lifetime.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `shares` — in 8 files: `tests/`
- `sheet` — in 4 files: `tests/`
- `sheets` — `tests/ui/card-window.test.ts`
- `shelf` — in 6 files: `tests/`
- `shelfRow` — `tests/ui/panel-element.test.ts`
- `shelved` — `tests/runtime/shelf-keeper.test.ts`, `tests/tools/capture-intake.test.ts`,
  `tests/tools/decoding-status.test.ts`
- `shelves` — `tests/runtime-world.ts`, `tests/runtime/shelf-keeper.test.ts`
- `shifted` — `tests/ui/panel-element.test.ts`
- `short` — in 7 files: `tests/`
- `shortDrawn` — `tests/e2e/panel-helper.spec.ts`
- `shortFight` — `tests/tools/develop-reports.test.ts`
- `shortWanted` — `tests/e2e/panel-helper.spec.ts`
- `shortest` — `tests/ports/browser-file.test.ts`
- `shortfall` — `tests/ui/level-drawn.test.ts`
- `shorthand` — `tests/ui/panel-look.test.ts`
- `shot` — `tests/tools/panel-shots.test.ts`
- `shots` — `tests/repository/readmes.test.ts`, `tests/tools/panel-shots.test.ts`
- `shout` — in 4 files: `tests/`
- `shoutStated` — `tests/userscript-entry.test.ts`
- `shouted` — in 4 files: `tests/`
- `shouts` — `tests/tools/aura-standing.test.ts`
- `shown` — in 6 files: `tests/`
- `shut` — `tests/tools/drill-report.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-look.test.ts`
- `side` — in 9 files: `tests/`
- `sideIndex` — `tests/e2e/panel-strips.spec.ts`
- `sidecar` — `tests/tools/panel-shots.test.ts`
- `sides` — in 6 files: `tests/`
- `sidesSeen` — `tests/core/combatant-roster.test.ts`
- `sighting` — `tests/repository/name-register.test.ts`
- `sightings` — `tests/repository/name-register.test.ts`
- `signals` — `tests/ui/panel-look.test.ts`
- `silent` — in 5 files: `tests/`
- `single` — `tests/ui/card-window.test.ts`, `tests/ui/panel-element.test.ts`
- `singleImported` — `tests/repository/single-importer.test.ts`
- `singleWidth` — `tests/ui/card-window.test.ts`
- `sinkThrows` — `tests/ports/browser-file.test.ts`
- `size` — in 5 files: `tests/`
- `sized` — in 5 files: `tests/`
- `sizes` — `tests/e2e/panel-type.spec.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/userscript-entry.test.ts`
- `skewed` — `tests/core/fight-figures.test.ts`
- `skill` — in 9 files: `tests/`
- `skillId` — `tests/tools/aura-standing.test.ts`
- `skillIds` — `tests/core/aura-standing.test.ts`
- `skillLevel` — `tests/ui/panel-element.test.ts`
- `skillNumber` — `tests/ui/panel-content.test.ts`
- `skillPart` — `tests/ui/panel-content.test.ts`
- `skillPastId` — `tests/core/aura-standing.test.ts`
- `skills` — in 7 files: `tests/`
- `slash` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-look.test.ts`
- `slashIndex` — `tests/repository/name-register.test.ts`
- `slot` — `tests/ui/panel-scroll.test.ts`
- `small` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`
- `snake` — `tests/repository/names.test.ts`
- `snapshot` — `tests/ports/margonem-engine-warriors.test.ts`, `tests/recorded-fights.ts`,
  `tests/runtime/live-fight.test.ts`
- `snapshots` — `tests/ports/margonem-engine-warriors.test.ts`
- `soloRoster` — `tests/core/combatant-roster.test.ts`
- `sorted` — `tests/repository/name-register.test.ts`
- `source` — in 7 files: `tests/`
- `sources` — in 5 files: `tests/`
- `spaced` — `tests/libs/json-text.test.ts`, `tests/tools/protocol-key-shape.test.ts`
- `spans` — `tests/repository/design-tokens.test.ts`, `tests/tools/drill-report.test.ts`
- `spare` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`
- `specifier` — `tests/repository/name-shapes.test.ts`, `tests/source-tree.ts`
- `spelled` — in 6 files: `tests/`
- `spelling` — `tests/ui/panel-look.test.ts`
- `spending` — `tests/repository/design-tokens.test.ts`
- `spent` — `tests/core/legendary-standing.test.ts`, `tests/core/skill-announcement-rule.test.ts`,
  `tests/repository/design-tokens.test.ts`
- `spentBy` — `tests/runtime/carried-tooltip.test.ts`
- `split` — `tests/repository/cited-paths.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-words.test.ts`
- `stack` — `tests/e2e/panel-helper.spec.ts`
- `stacked` — `tests/e2e/panel-helper.spec.ts`, `tests/e2e/panel-layer.spec.ts`
- `stacks` — `tests/e2e/panel-layer.spec.ts`
- `stale` — `tests/repository/browser-support.test.ts`, `tests/runtime/live-fight.test.ts`,
  `tests/tools/margonem-readings.test.ts`
- `stand` — `tests/tools/preview-page.test.ts`
- `standIn` — `tests/e2e/panel-layer.spec.ts`
- `standard` — `tests/ui/panel-element.test.ts`
- `standing` — in 22 files: `tests/`
- `standingRow` — `tests/e2e/panel-card.spec.ts`
- `standings` — in 4 files: `tests/`
- `start` — in 4 files: `tests/`
- `started` — `tests/ports/browser-interval.test.ts`
- `starts` — `tests/runtime/margonem-engine-search.test.ts`
- `state` — in 7 files: `tests/`
- `stated` — in 39 files: `tests/`
- `statedHere` — `tests/core/health-witness.test.ts`
- `statedName` — `tests/repository/throws.test.ts`
- `statement` — in 4 files: `tests/`
- `statements` — `tests/repository/control-flow.test.ts`,
  `tests/repository/declaration-order.test.ts`
- `states` — `tests/ports/recorded-session.test.ts`
- `statistic` — `tests/ui/panel-words.test.ts`
- `statistics` — in 17 files: `tests/`
- `status` — in 5 files: `tests/`
- `statuses` — `tests/core/carried-status.test.ts`, `tests/ui/panel-words.test.ts`
- `stayed` — `tests/e2e/panel-card.spec.ts`
- `staying` — `tests/tools/build-userscript.test.ts`
- `stem` — `tests/repository/names.test.ts`, `tests/repository/protocol-keys.test.ts`,
  `tests/ui/panel-look.test.ts`
- `stemHeight` — `tests/ui/panel-look.test.ts`
- `stemTop` — `tests/ui/panel-look.test.ts`
- `stemWidth` — `tests/ui/panel-look.test.ts`
- `step` — in 16 files: `tests/`
- `stepConstructs` — `tests/repository/browser-support.test.ts`
- `stepped` — `tests/core/fight-decoder.test.ts`, `tests/tools/aura-lifetime.test.ts`
- `steps` — in 4 files: `tests/`
- `stood` — in 4 files: `tests/`
- `stopped` — `tests/core/fight-decoder.test.ts`, `tests/ui/blow-vocabulary.test.ts`,
  `tests/ui/panel-card.test.ts`
- `storageChoice` — `tests/ports/browser-store.test.ts`
- `storageIndex` — `tests/e2e/panel-shelf.spec.ts`, `tests/e2e/panel-strips.spec.ts`
- `storageOption` — `tests/runtime/margometer-runtime.test.ts`
- `store` — in 6 files: `tests/`
- `stored` — in 5 files: `tests/`
- `strange` — `tests/e2e/panel-boot.spec.ts`
- `stray` — `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/opened-readings.test.ts`
- `strays` — `tests/ui/panel-intent.test.ts`
- `stretch` — `tests/tools/turn-count.test.ts`
- `stretches` — `tests/tools/turn-count.test.ts`
- `striker` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `striking` — `tests/ui/panel-card.test.ts`
- `strings` — `tests/repository/name-register.test.ts`
- `strip` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-screen.test.ts`
- `stripIndex` — `tests/e2e/panel-strips.spec.ts`
- `strips` — `tests/e2e/panel-strips.spec.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-screen.test.ts`
- `struck` — in 7 files: `tests/`
- `struckAgain` — `tests/core/last-heal-rule.test.ts`
- `structurePaths` — `tests/repository/documents.test.ts`
- `stubborn` — `tests/ports/browser-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `stuck` — `tests/ports/browser-interval.test.ts`, `tests/runtime/margonem-engine-search.test.ts`
- `stunned` — `tests/tools/turn-count.test.ts`
- `stuns` — `tests/tools/turn-count.test.ts`
- `style` — in 7 files: `tests/`
- `styles` — `tests/runtime/margometer-runtime.test.ts`
- `subject` — `tests/runtime/fight-file.test.ts`, `tests/ui/panel-card.test.ts`
- `subpattern` — `tests/source-tree.ts`
- `subtitle` — `tests/ui/panel-words.test.ts`
- `subtitled` — `tests/ui/card-window.test.ts`
- `suffix` — `tests/repository/names.test.ts`
- `suite` — `tests/repository/name-register.test.ts`
- `sum` — `tests/ui/share-bound.test.ts`, `tests/ui/share-column.test.ts`
- `summary` — `tests/e2e/panel-size.spec.ts`
- `summed` — `tests/repository/comment-share.test.ts`, `tests/runtime/fight-file.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `surface` — `tests/e2e/panel-layer.spec.ts`, `tests/ui/panel-look.test.ts`
- `surroundings` — `tests/ports/browser-surroundings.test.ts`
- `suspectRow` — `tests/ui/panel-content.test.ts`
- `suspicion` — `tests/ui/panel-element.test.ts`
- `svg` — `tests/e2e/panel-type.spec.ts`
- `swap` — `tests/ui/card-window.test.ts`
- `switchAt` — `tests/tools/preview-site.test.ts`
- `swung` — `tests/ui/panel-content.test.ts`
- `synchronous` — `tests/repository/synchronous-bundle.test.ts`
- `table` — `tests/core/granted-blow-rule.test.ts`, `tests/ui/panel-words.test.ts`
- `tableRows` — `tests/repository/captured-fight-register.test.ts`
- `tabled` — `tests/repository/browser-support.test.ts`, `tests/repository/name-register.test.ts`
- `tabledStale` — `tests/repository/browser-support.test.ts`
- `tables` — `tests/core/granted-blow-rule.test.ts`, `tests/tools/panel-shots.test.ts`,
  `tests/userscript-entry.test.ts`
- `tag` — `tests/tools/preview-site.test.ts`
- `tail` — `tests/repository/protocol-keys.test.ts`
- `taken` — in 9 files: `tests/`
- `takenByOpponent` — `tests/core/fight-statistics.test.ts`
- `takenStrip` — `tests/ui/panel-element.test.ts`
- `taking` — `tests/repository/assertion-density.test.ts`
- `tall` — `tests/e2e/panel-scroll.spec.ts`, `tests/ui/card-window.test.ts`
- `tallest` — `tests/ui/panel-drag.test.ts`
- `tally` — `tests/core/fight-decoder.test.ts`, `tests/core/legendary-standing.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `tallyTakenByKind` — `tests/core/fight-statistics.test.ts`
- `target` — in 8 files: `tests/`
- `targets` — `tests/core/npc-heal-rule.test.ts`, `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/rebuilding-battle.ts`
- `tearing` — `tests/ports/margonem-engine-battle.test.ts`
- `tenacity` — `tests/core/protocol-key.test.ts`
- `terms` — `tests/ui/panel-look.test.ts`
- `text` — in 27 files: `tests/`
- `textNode` — `tests/ui/view-failure.test.ts`
- `texts` — `tests/tools/frozen-files.test.ts`, `tests/ui/panel-words.test.ts`
- `textsByHolder` — `tests/ui/panel-words.test.ts`
- `theirOwn` — `tests/core/combatant-health.test.ts`
- `theirs` — in 4 files: `tests/`
- `thirdShape` — `tests/e2e/panel-drill.spec.ts`
- `thirds` — `tests/ui/panel-words.test.ts`
- `through` — `tests/e2e/panel-fixture.ts`
- `throwing` — in 5 files: `tests/`
- `thrown` — in 6 files: `tests/`
- `tick` — `tests/core/injure-rule.test.ts`
- `ticked` — in 5 files: `tests/`
- `ticking` — `tests/core/injure-rule.test.ts`
- `ticks` — `tests/core/anguish-rule.test.ts`, `tests/core/injure-rule.test.ts`,
  `tests/runtime-world.ts`
- `tie` — `tests/ui/panel-words.test.ts`
- `tied` — `tests/ui/panel-content.test.ts`
- `tier` — `tests/repository/browser-support.test.ts`
- `tile` — `tests/e2e/panel-card.spec.ts`, `tests/ui/panel-element.test.ts`
- `time` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-words.test.ts`
- `timedRow` — `tests/ui/panel-element.test.ts`
- `timers` — `tests/ports/browser-file.test.ts`
- `tips` — `tests/e2e/panel-tooltip.spec.ts`
- `title` — `tests/repository/decisions.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-words.test.ts`
- `to` — `tests/repository/called-once.test.ts`, `tests/style-sheet.ts`,
  `tests/tools/turn-reading.test.ts`
- `toNobody` — `tests/core/fight-statistics.test.ts`
- `together` — `tests/ui/panel-content.test.ts`
- `token` — `tests/repository/design-tokens.test.ts`
- `tokens` — `tests/ui/panel-drag.test.ts`, `tests/ui/panel-look.test.ts`
- `told` — `tests/e2e/panel-tooltip.spec.ts`, `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `tolerance` — `tests/core/combatant-health.test.ts`, `tests/core/health-witness.test.ts`
- `tooMany` — `tests/runtime/margometer-runtime.test.ts`
- `tooNarrow` — `tests/ui/card-window.test.ts`
- `tool` — `tests/repository/documents.test.ts`
- `top` — `tests/repository/nesting-depth.test.ts`
- `topItem` — `tests/repository/declaration-order.test.ts`
- `topRow` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `torn` — `tests/ports/browser-clock.test.ts`, `tests/runtime/live-fight.test.ts`,
  `tests/runtime/panel-frame.test.ts`
- `total` — in 6 files: `tests/`
- `totals` — in 4 files: `tests/`
- `touching` — `tests/ui/panel-drag.test.ts`
- `track` — `tests/ui/panel-element.test.ts`
- `tracked` — `tests/repository/cited-paths.test.ts`, `tests/repository/documents.test.ts`
- `trailing` — `tests/core/aura-standing.test.ts`, `tests/repository/browser-support.test.ts`
- `translated` — `tests/runtime/carried-tooltip.test.ts`
- `translation` — `tests/repository/readmes.test.ts`
- `travelled` — `tests/core/absorption-destruction-rule.test.ts`
- `tree` — `tests/repository/name-register.test.ts`
- `tried` — in 6 files: `tests/`
- `trimmed` — `tests/core/aura-standing.test.ts`, `tests/repository/comment-share.test.ts`,
  `tests/ui/panel-words.test.ts`
- `truncated` — `tests/tools/help-article.test.ts`, `tests/tools/margonem-client-source.test.ts`
- `turn` — `tests/core/aura-standing.test.ts`, `tests/core/carried-status.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `turnStanding` — `tests/core/carried-figure.test.ts`
- `turns` — in 5 files: `tests/`
- `turnsByCombatantId` — `tests/core/carried-figure.test.ts`, `tests/core/turn-clock.test.ts`
- `turnsElapsed` — `tests/tools/shout-holding.test.ts`, `tests/ui/helper-window.test.ts`
- `turnsLeft` — `tests/ui/helper-window.test.ts`
- `twentieth` — `tests/runtime/shelf.test.ts`
- `twice` — in 9 files: `tests/`
- `two` — in 4 files: `tests/`
- `twoColumns` — `tests/ui/card-window.test.ts`
- `twoEnds` — `tests/core/fight-decoder.test.ts`
- `twoHigh` — `tests/ui/card-window.test.ts`
- `twoPast` — `tests/libs/unknown-value.test.ts`
- `twoWide` — `tests/ui/card-window.test.ts`, `tests/ui/panel-look.test.ts`
- `type` — `tests/repository/purity.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/view-failure.test.ts`
- `types` — `tests/repository/purity.test.ts`
- `ui` — `tests/repository/reader-layer.test.ts`
- `unasked` — `tests/tools/margonem-readings.test.ts`, `tests/ui/blow-vocabulary.test.ts`
- `unbalanced` — `tests/core/fight-statistics.test.ts`
- `unbounded` — `tests/tools/preview-site.test.ts`
- `uncertain` — `tests/tools/drill-report.test.ts`
- `unclamped` — `tests/ui/panel-words.test.ts`
- `unclaused` — `tests/tools/aura-lifetime.test.ts`
- `uncounted` — `tests/repository/protocol-keys.test.ts`
- `undated` — `tests/tools/frozen-files.test.ts`
- `under` — in 11 files: `tests/`
- `underAnnouncement` — `tests/tools/drill-report.test.ts`
- `underway` — `tests/tools/panel-shots.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-helper.test.ts`
- `undisputed` — `tests/tools/turn-reading.test.ts`
- `undivided` — `tests/ui/panel-element.test.ts`
- `undrawn` — `tests/ui/view-failure.test.ts`
- `undressed` — `tests/ui/panel-element.test.ts`
- `unexpected` — `tests/e2e/panel-fixture.ts`
- `unfolding` — `tests/runtime/margometer-runtime.test.ts`
- `ungraded` — `tests/tools/turn-count.test.ts`
- `unguarded` — `tests/repository/handed-callbacks.test.ts`
- `unheld` — `tests/core/legendary-standing.test.ts`, `tests/repository/design-tokens.test.ts`
- `unknown` — in 5 files: `tests/`
- `unknownKey` — `tests/ui/panel-content.test.ts`
- `unlisted` — `tests/runtime/live-fight.test.ts`
- `unmarked` — `tests/ports/margonem-engine-battle.test.ts`, `tests/ui/panel-element.test.ts`
- `unminified` — `tests/tools/status-bit-table.test.ts`
- `unmoved` — `tests/ui/panel-drag.test.ts`
- `unnamed` — in 5 files: `tests/`
- `unnamedCell` — `tests/ui/panel-element.test.ts`
- `unnumbered` — `tests/ports/margonem-engine-warriors.test.ts`
- `unpaired` — `tests/ui/panel-palette.test.ts`
- `unplaced` — in 5 files: `tests/`
- `unprinted` — `tests/ui/panel-words.test.ts`
- `unread` — in 11 files: `tests/`
- `unreadable` — `tests/tools/capture-intake.test.ts`
- `unrecognised` — `tests/tools/protocol-key-table.test.ts`
- `unregistered` — `tests/repository/browser-support.test.ts`
- `unsaid` — `tests/ui/panel-element.test.ts`
- `unsized` — `tests/core/fight-statistics.test.ts`
- `unstated` — in 6 files: `tests/`
- `untabled` — `tests/repository/name-register.test.ts`
- `untallied` — `tests/tools/turn-reading.test.ts`
- `untimedRow` — `tests/ui/panel-element.test.ts`
- `untold` — `tests/tools/turn-count.test.ts`
- `untouched` — `tests/ui/panel-card.test.ts`
- `untried` — `tests/repository/protocol-keys.test.ts`
- `untyped` — `tests/libs/unknown-value.test.ts`, `tests/repository/changelog.test.ts`
- `unused` — `tests/runtime/failure-fate.test.ts`
- `unworded` — `tests/ui/blow-vocabulary.test.ts`
- `unwritten` — `tests/tools/turn-count.test.ts`, `tests/tools/turn-reading.test.ts`
- `update` — in 8 files: `tests/`
- `updateData` — in 5 files: `tests/`
- `updates` — `tests/recorded-fights.ts`, `tests/runtime/carried-tooltip.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `upward` — `tests/repository/layers.test.ts`, `tests/ui/panel-look.test.ts`
- `url` — `tests/tools/help-article.test.ts`
- `used` — `tests/core/fight-decoder.test.ts`, `tests/repository/workflows.test.ts`,
  `tests/runtime/failure-fate.test.ts`
- `usesIndex` — `tests/repository/workflows.test.ts`
- `valueByName` — `tests/ui/panel-look.test.ts`
- `valueNode` — `tests/source-tree.ts`
- `valued` — `tests/core/fight-decoder.test.ts`
- `values` — in 4 files: `tests/`
- `valuesByToken` — `tests/repository/design-tokens.test.ts`
- `vanished` — `tests/repository/design-tokens.test.ts`
- `verb` — `tests/repository/name-register.test.ts`
- `verbs` — `tests/verb-purities.ts`
- `verdict` — `tests/tools/drill-report.test.ts`, `tests/tools/turn-count.test.ts`
- `version` — in 4 files: `tests/`
- `versions` — `tests/repository/browser-support.test.ts`
- `victim` — `tests/core/anguish-rule.test.ts`, `tests/core/injure-rule.test.ts`
- `victims` — `tests/core/anguish-rule.test.ts`, `tests/core/wound-rule.test.ts`
- `view` — in 14 files: `tests/`
- `viewportHeight` — `tests/ui/card-window.test.ts`
- `visited` — `tests/fake-document.ts`
- `visitors` — `tests/source-tree.ts`
- `vocabulary` — `tests/repository/name-register.test.ts`
- `waited` — `tests/runtime/panel-frame.test.ts`, `tests/tools/preview-site.test.ts`
- `waiting` — in 4 files: `tests/`
- `walk` — in 4 files: `tests/`
- `walkIndex` — `tests/fake-document.ts`
- `walked` — `tests/fake-document.ts`, `tests/ui/level-drawn.test.ts`
- `walkedFile` — `tests/source-tree.ts`
- `walks` — `tests/tools/turn-reading.test.ts`
- `warrior` — in 5 files: `tests/`
- `warriorEntry` — `tests/ports/warrior-entries.test.ts`
- `warriors` — in 6 files: `tests/`
- `warriorsById` — `tests/repository/captured-fight-register.test.ts`
- `warriorsList` — `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/ports/margonem-engine-warriors.test.ts`, `tests/rebuilding-battle.ts`
- `was` — in 5 files: `tests/`
- `wasAt` — `tests/core/health-witness.test.ts`
- `wasRaised` — `tests/core/health-witness.test.ts`
- `wasRaisedById` — `tests/core/health-witness.test.ts`
- `wasRow` — `tests/ui/panel-scroll.test.ts`
- `watched` — `tests/runtime/shelf.test.ts`
- `weakened` — `tests/core/injure-rule.test.ts`, `tests/core/protocol-key.test.ts`
- `weakeningPercent` — `tests/core/injure-rule.test.ts`
- `week` — `tests/tools/help-article.test.ts`
- `where` — in 5 files: `tests/`
- `which` — `tests/e2e/panel-drill.spec.ts`
- `whole` — in 22 files: `tests/`
- `wholeFile` — `tests/repository/browser-globals.test.ts`
- `wholePart` — `tests/ui/panel-content.test.ts`
- `whom` — `tests/ui/panel-words.test.ts`
- `whose` — `tests/ports/payload-envelope.test.ts`
- `wide` — in 4 files: `tests/`
- `wideEnough` — `tests/ui/card-window.test.ts`
- `widened` — `tests/ui/panel-content.test.ts`
- `wider` — `tests/tools/turn-count.test.ts`
- `width` — in 5 files: `tests/`
- `widths` — `tests/tools/preview-site.test.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-look.test.ts`
- `willFail` — `tests/ui/card-window.test.ts`
- `willThrow` — `tests/ui/panel-element.test.ts`
- `window` — in 10 files: `tests/`
- `withCard` — `tests/tools/panel-shots.test.ts`
- `withOneBlock` — `tests/ports/margonem-engine-tooltip.test.ts`
- `withReader` — `tests/runtime/shelf.test.ts`
- `withSelf` — `tests/ui/panel-content.test.ts`
- `withUnread` — `tests/tools/decoding-status.test.ts`
- `within` — `tests/ui/panel-element.test.ts`
- `without` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-card.test.ts`
- `withoutSnapshot` — `tests/ports/margonem-engine-warriors.test.ts`
- `witnessed` — `tests/tools/fabricated-fight.test.ts`
- `wojownik` — `tests/core/aura-standing.test.ts`
- `won` — `tests/core/fight-decoder.test.ts`, `tests/ui/panel-element.test.ts`
- `word` — in 7 files: `tests/`
- `worded` — `tests/repository/comment-share.test.ts`, `tests/runtime/carried-tooltip.test.ts`,
  `tests/ui/blow-vocabulary.test.ts`
- `words` — in 8 files: `tests/`
- `workflowFile` — `tests/repository/workflows.test.ts`
- `world` — in 4 files: `tests/`
- `wound` — `tests/core/injure-rule.test.ts`, `tests/ports/browser-frame.test.ts`,
  `tests/ports/browser-interval.test.ts`
- `wounds` — `tests/core/injure-rule.test.ts`
- `wrap` — `tests/ports/margonem-engine-battle.test.ts`
- `wrapped` — in 5 files: `tests/`
- `wrappedBattle` — `tests/runtime/margonem-engine-search.test.ts`
- `wrapper` — `tests/ports/margonem-engine-battle.test.ts`
- `writableParameters` — `tests/repository/purity.test.ts`
- `writer` — `tests/ports/margonem-engine-tooltip.test.ts`, `tests/repository/name-register.test.ts`
- `writes` — `tests/runtime/margometer-runtime.test.ts`
- `writing` — `tests/ports/margonem-engine-tooltip.test.ts`
- `written` — in 19 files: `tests/`
- `writtenLine` — `tests/repository/name-register.test.ts`
- `writtenLines` — `tests/repository/name-register.test.ts`
- `wrong` — in 6 files: `tests/`
- `yOnly` — `tests/runtime/shelf.test.ts`
- `zeros` — `tests/libs/html-text.test.ts`

## Parameters

### `libs/`

- `call` — `libs/errors.ts`
- `candidate` — `libs/unknown-value.ts`, `libs/vocabulary.ts`
- `cause` — `libs/errors.ts`, `libs/json-text.ts`
- `character` — `libs/html-text.ts`
- `count` — `libs/unknown-value.ts`
- `decimal` — `libs/number-text.ts`
- `digits` — `libs/html-text.ts`
- `encodable` — `libs/json-text.ts`
- `expected` — `libs/html-text.ts`, `libs/unknown-value.ts`
- `field` — `libs/unknown-value.ts`
- `from` — `libs/html-text.ts`, `libs/text-walk.ts`
- `html` — `libs/html-text.ts`
- `indentSpaces` — `libs/json-text.ts`
- `index` — `libs/html-text.ts`, `libs/text-walk.ts`
- `integer` — `libs/number-text.ts`
- `isHexadecimal` — `libs/html-text.ts`
- `isMember` — `libs/text-walk.ts`
- `key` — `libs/unknown-value.ts`
- `keys` — `libs/unknown-value.ts`
- `maximum` — `libs/number-range.ts`, `libs/text-walk.ts`, `libs/unknown-value.ts`
- `minimum` — `libs/number-range.ts`
- `name` — `libs/html-text.ts`
- `number` — `libs/number-range.ts`
- `open` — `libs/html-text.ts`, `libs/text-walk.ts`
- `places` — `libs/number-text.ts`
- `record` — `libs/unknown-value.ts`
- `text` — in 4 files: `libs/`
- `words` — `libs/vocabulary.ts`

### `src/core/`

- `actorId` — `src/core/charged-skill.ts`, `src/core/fight-statistics.ts`
- `amount` — `src/core/fight-statistics.ts`
- `announced` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `announcedHere` — `src/core/fight-decoder.ts`
- `announcementStanding` — `src/core/fight-decoder.ts`
- `bearer` — `src/core/carried-figure.ts`
- `bearerSide` — `src/core/carried-figure.ts`
- `bits` — `src/core/carried-figure.ts`
- `blow` — `src/core/fight-statistics.ts`
- `byCombatantId` — `src/core/fight-statistics.ts`
- `cast` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`
- `casterId` — `src/core/fight-statistics.ts`
- `casterSide` — `src/core/carried-figure.ts`
- `casts` — `src/core/carried-figure.ts`
- `chargeBrokenIds` — `src/core/charged-skill.ts`
- `chargedSkillStanding` — `src/core/charged-skill.ts`
- `chargedSkillStandings` — `src/core/charged-skill.ts`
- `combatantId` — in 4 files: `src/core/`
- `combatantName` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `combatants` — `src/core/combatant-roster.ts`, `src/core/fight-session.ts`
- `combatantsArriving` — `src/core/fight-session.ts`
- `combatantsBefore` — `src/core/fight-session.ts`
- `context` — `src/core/fight-decoder.ts`
- `count` — `src/core/fight-session.ts`
- `counted` — `src/core/fight-statistics.ts`
- `cut` — `src/core/fight-statistics.ts`
- `cutKeysBefore` — `src/core/fight-session.ts`
- `dealer` — `src/core/fight-statistics.ts`
- `declared` — in 4 files: `src/core/`
- `declaredEffect` — in 4 files: `src/core/`
- `decoded` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `decodedParameters` — `src/core/fight-decoder.ts`
- `defence` — `src/core/fight-statistics.ts`, `src/core/protocol-key.ts`
- `details` — `src/core/fight-decoder.ts`
- `effect` — `src/core/turn-clock.ts`
- `effects` — `src/core/aura-standing.ts`
- `end` — `src/core/fight-decoder.ts`
- `entryHealthByCombatantId` — `src/core/combatant-health.ts`
- `event` — in 5 files: `src/core/`
- `eventIndex` — `src/core/aura-standing.ts`
- `events` — in 7 files: `src/core/`
- `eventsAtSeatingBefore` — `src/core/fight-session.ts`
- `eventsAtSeatingByCombatantId` — `src/core/aura-standing.ts`
- `eventsBefore` — `src/core/fight-session.ts`
- `figure` — `src/core/fight-session.ts`, `src/core/fight-statistics.ts`
- `figures` — `src/core/fight-figures.ts`, `src/core/fight-statistics.ts`
- `from` — `src/core/fight-decoder.ts`
- `giverId` — `src/core/fight-statistics.ts`
- `healedId` — `src/core/fight-statistics.ts`
- `healthByCombatantId` — `src/core/combatant-health.ts`
- `healthMaximum` — `src/core/combatant-health.ts`
- `healthPercent` — `src/core/protocol-number.ts`
- `heldId` — `src/core/aura-standing.ts`
- `index` — `src/core/fight-decoder.ts`
- `inputs` — `src/core/carried-figure.ts`
- `isBlow` — `src/core/fight-decoder.ts`
- `key` — in 4 files: `src/core/`
- `keyMeaning` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `kinds` — `src/core/fight-statistics.ts`
- `largestSoFar` — `src/core/fight-statistics.ts`
- `leftAmount` — `src/core/carried-figure.ts`
- `leftStanding` — `src/core/legendary-standing.ts`
- `leftStatus` — `src/core/carried-status.ts`
- `lightingTurnByBitBefore` — `src/core/carried-status.ts`
- `mask` — `src/core/carried-status.ts`
- `masksByCombatantId` — `src/core/carried-status.ts`
- `maximum` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `message` — `src/core/fight-decoder.ts`
- `name` — `src/core/combatant-roster.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `namedBefore` — `src/core/fight-session.ts`
- `options` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `ordinal` — `src/core/charged-skill.ts`
- `otherEndKey` — `src/core/fight-statistics.ts`
- `outcomeResult` — `src/core/fight-decoder.ts`
- `parametersDecoded` — `src/core/fight-decoder.ts`
- `percent` — `src/core/combatant-health.ts`
- `prepared` — `src/core/fight-session.ts`
- `procs` — `src/core/fight-statistics.ts`
- `raw` — `src/core/fight-statistics.ts`
- `record` — `src/core/fight-session.ts`
- `rightAmount` — `src/core/carried-figure.ts`
- `rightStanding` — `src/core/legendary-standing.ts`
- `rightStatus` — `src/core/carried-status.ts`
- `roster` — in 5 files: `src/core/`
- `seenCombatant` — `src/core/fight-session.ts`
- `segment` — `src/core/fight-decoder.ts`
- `segments` — `src/core/fight-decoder.ts`
- `session` — `src/core/fight-session.ts`
- `sideHealByEvent` — `src/core/fight-statistics.ts`
- `skill` — `src/core/fight-decoder.ts`
- `skillName` — `src/core/charged-skill.ts`
- `skillNamesBefore` — `src/core/fight-session.ts`
- `skillNamesByActorId` — `src/core/charged-skill.ts`
- `skills` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `source` — `src/core/fight-statistics.ts`
- `stateBefore` — `src/core/fight-session.ts`
- `stated` — `src/core/fight-statistics.ts`
- `statedEnd` — `src/core/fight-decoder.ts`
- `statedSkills` — `src/core/aura-standing.ts`
- `statement` — `src/core/charged-skill.ts`, `src/core/fight-session.ts`
- `statements` — `src/core/charged-skill.ts`
- `statistics` — `src/core/fight-statistics.ts`
- `tables` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `tallying` — `src/core/fight-statistics.ts`
- `target` — `src/core/fight-statistics.ts`
- `targetId` — `src/core/fight-statistics.ts`
- `text` — `src/core/fight-decoder.ts`, `src/core/protocol-number.ts`
- `texts` — `src/core/fight-decoder.ts`
- `token` — `src/core/protocol-key.ts`
- `turnStanding` — `src/core/turn-clock.ts`
- `turnsByCombatantId` — `src/core/aura-standing.ts`, `src/core/turn-clock.ts`
- `turnsNow` — `src/core/carried-status.ts`
- `unread` — `src/core/fight-decoder.ts`
- `unreadBefore` — `src/core/fight-session.ts`
- `valueText` — `src/core/fight-decoder.ts`
- `view` — `src/core/aura-standing.ts`, `src/core/fight-figures.ts`
- `walk` — `src/core/aura-standing.ts`, `src/core/carried-status.ts`,
  `src/core/legendary-standing.ts`

### `src/ports/`

- `afterMilliseconds` — `src/ports/browser-file.ts`
- `anchor` — `src/ports/browser-file.ts`
- `atMilliseconds` — `src/ports/browser-time.ts`
- `battle` — `src/ports/margonem-engine-warriors.ts`
- `blob` — `src/ports/browser-file.ts`
- `block` — `src/ports/margonem-engine-tooltip.ts`
- `blockBefore` — `src/ports/margonem-engine-tooltip.ts`
- `browserConsole` — `src/ports/browser-console.ts`
- `browserWindow` — in 6 files: `src/ports/`
- `call` — `src/ports/fight-capture.ts`
- `capture` — `src/ports/fight-capture.ts`
- `category` — `src/ports/margonem-client-dictionary.ts`
- `cause` — `src/ports/browser-store.ts`, `src/ports/margonem-engine-battle.ts`
- `combatantId` — `src/ports/payload-envelope.ts`
- `combatants` — `src/ports/fight-capture.ts`
- `content` — `src/ports/margonem-engine-tooltip.ts`
- `count` — `src/ports/margonem-engine-warriors.ts`, `src/ports/payload-envelope.ts`
- `date` — `src/ports/browser-time.ts`
- `detail` — `src/ports/browser-console.ts`
- `dictionaryText` — `src/ports/margonem-client-dictionary.ts`
- `downloads` — `src/ports/browser-file.ts`
- `engine` — `src/ports/margonem-engine-battle.ts`, `src/ports/margonem-engine-hero.ts`,
  `src/ports/margonem-engine-place.ts`
- `engineArguments` — `src/ports/margonem-engine-battle.ts`
- `engineMethod` — `src/ports/margonem-engine-battle.ts`
- `entries` — `src/ports/payload-envelope.ts`
- `event` — `src/ports/margonem-engine-tooltip.ts`
- `everyMilliseconds` — `src/ports/browser-time.ts`
- `failure` — in 4 files: `src/ports/`
- `field` — `src/ports/browser-surroundings.ts`, `src/ports/margonem-engine-place.ts`,
  `src/ports/payload-envelope.ts`
- `frames` — `src/ports/browser-time.ts`
- `handle` — `src/ports/browser-time.ts`
- `hero` — `src/ports/margonem-engine-place.ts`
- `host` — `src/ports/browser-surroundings.ts`
- `index` — `src/ports/margonem-client-build.ts`
- `isOpening` — `src/ports/fight-capture.ts`
- `key` — `src/ports/browser-store.ts`
- `kind` — `src/ports/browser-console.ts`
- `labelId` — `src/ports/margonem-client-dictionary.ts`
- `length` — `src/ports/browser-store.ts`
- `listener` — `src/ports/margonem-engine-battle.ts`
- `looks` — `src/ports/margonem-engine-battle.ts`
- `maximum` — in 6 files: `src/ports/`
- `member` — `src/ports/margonem-engine-battle.ts`
- `memberName` — `src/ports/browser-surroundings.ts`
- `minimum` — `src/ports/browser-time.ts`
- `momentPart` — `src/ports/browser-time.ts`
- `name` — `src/ports/browser-file.ts`
- `onLateFailure` — `src/ports/browser-file.ts`
- `onStepFailure` — `src/ports/browser-time.ts`
- `options` — `src/ports/payload-envelope.ts`
- `payload` — `src/ports/fight-capture.ts`, `src/ports/margonem-engine-battle.ts`,
  `src/ports/payload-envelope.ts`
- `prepared` — `src/ports/fight-capture.ts`
- `readEngine` — `src/ports/margonem-engine-battle.ts`
- `readScriptSources` — `src/ports/margonem-client-build.ts`
- `reading` — `src/ports/margonem-value.ts`
- `row` — `src/ports/margonem-engine-tooltip.ts`
- `rows` — `src/ports/margonem-engine-tooltip.ts`
- `rowsByCombatantId` — `src/ports/margonem-engine-tooltip.ts`
- `step` — `src/ports/browser-file.ts`, `src/ports/browser-time.ts`
- `storage` — `src/ports/browser-store.ts`
- `storedText` — `src/ports/browser-store.ts`
- `targetsCandidate` — `src/ports/margonem-engine-tooltip.ts`
- `text` — `src/ports/browser-file.ts`, `src/ports/margonem-client-build.ts`
- `this` — `src/ports/margonem-engine-battle.ts`
- `timers` — `src/ports/browser-time.ts`
- `type` — `src/ports/browser-file.ts`
- `url` — `src/ports/browser-file.ts`
- `values` — `src/ports/browser-console.ts`
- `warrior` — `src/ports/margonem-engine-tooltip.ts`, `src/ports/margonem-engine-warriors.ts`
- `warriorCandidate` — `src/ports/margonem-engine-warriors.ts`
- `warriorEntry` — `src/ports/payload-envelope.ts`

### `src/runtime/`

- `atMilliseconds` — `src/runtime/fight-handover.ts`
- `attempts` — `src/runtime/shelf.ts`
- `battlePort` — `src/runtime/margometer-runtime.ts`
- `call` — `src/runtime/fight-file.ts`, `src/runtime/live-fight.ts`
- `calls` — `src/runtime/fight-file.ts`
- `carriedStatus` — `src/runtime/carried-tooltip.ts`
- `category` — `src/runtime/margometer-runtime.ts`
- `cause` — `src/runtime/fight-file.ts`
- `choice` — `src/runtime/margometer-runtime.ts`, `src/runtime/settings.ts`,
  `src/runtime/shelf-keeper.ts`
- `chosenFightOpenedAt` — `src/runtime/fight-state.ts`, `src/runtime/panel-frame.ts`
- `combatantId` — `src/runtime/carried-tooltip.ts`
- `contents` — `src/runtime/shelf-keeper.ts`
- `count` — `src/runtime/panel-frame.ts`, `src/runtime/shelf.ts`
- `cut` — `src/runtime/fight-file.ts`, `src/runtime/panel-frame.ts`
- `defect` — `src/runtime/defect-ledger.ts`
- `defectCount` — `src/runtime/defect-ledger.ts`
- `defects` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `drill` — `src/runtime/panel-frame.ts`
- `failure` — in 4 files: `src/runtime/`
- `fallback` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `fields` — `src/runtime/settings.ts`
- `fight` — in 4 files: `src/runtime/`
- `fightStandings` — `src/runtime/carried-tooltip.ts`
- `fightState` — `src/runtime/fight-handover.ts`, `src/runtime/panel-frame.ts`
- `fights` — `src/runtime/fight-state.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/shelf.ts`
- `figures` — `src/runtime/fight-file.ts`
- `figuresByCombatantAndBit` — `src/runtime/carried-tooltip.ts`
- `helper` — `src/runtime/panel-frame.ts`
- `id` — `src/runtime/margometer-runtime.ts`
- `index` — `src/runtime/fight-handover.ts`
- `intent` — `src/runtime/margometer-runtime.ts`
- `isCollapsed` — `src/runtime/settings.ts`
- `isPinned` — `src/runtime/shelf.ts`
- `isShelfEmpty` — `src/runtime/panel-frame.ts`
- `keptFight` — in 5 files: `src/runtime/`
- `keptFightStatesByOpenedAt` — `src/runtime/fight-state.ts`
- `key` — `src/runtime/settings.ts`
- `kind` — `src/runtime/live-fight.ts`, `src/runtime/panel-frame.ts`
- `leftFight` — `src/runtime/panel-frame.ts`
- `legendaryStanding` — `src/runtime/carried-tooltip.ts`
- `listener` — `src/runtime/margometer-runtime.ts`
- `liveFight` — `src/runtime/live-fight.ts`, `src/runtime/panel-frame.ts`
- `liveFightState` — `src/runtime/fight-state.ts`, `src/runtime/panel-frame.ts`
- `liveHandover` — `src/runtime/fight-handover.ts`
- `liveRow` — `src/runtime/panel-frame.ts`
- `margonemClientBuild` — `src/runtime/fight-handover.ts`
- `margonemValue` — `src/runtime/live-fight.ts`
- `maximum` — `src/runtime/shelf.ts`
- `names` — `src/runtime/settings.ts`
- `numbers` — `src/runtime/settings.ts`
- `offered` — `src/runtime/shelf-keeper.ts`
- `onLateFailure` — `src/runtime/fight-handover.ts`
- `openedAt` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`,
  `src/runtime/shelf.ts`
- `options` — in 6 files: `src/runtime/`
- `panel` — `src/runtime/margometer-runtime.ts`
- `panelWindow` — `src/runtime/margometer-runtime.ts`, `src/runtime/settings.ts`
- `parts` — `src/runtime/panel-frame.ts`
- `payload` — `src/runtime/fight-handover.ts`, `src/runtime/live-fight.ts`
- `payloads` — `src/runtime/fight-state.ts`
- `place` — `src/runtime/fight-handover.ts`, `src/runtime/panel-frame.ts`
- `ports` — `src/runtime/fight-handover.ts`, `src/runtime/margometer-runtime.ts`
- `position` — `src/runtime/settings.ts`
- `provocation` — `src/runtime/carried-tooltip.ts`
- `readerId` — `src/runtime/panel-frame.ts`
- `refused` — `src/runtime/panel-frame.ts`
- `region` — `src/runtime/panel-frame.ts`
- `report` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `reportCall` — `src/runtime/margometer-runtime.ts`
- `rightFight` — `src/runtime/panel-frame.ts`
- `roster` — `src/runtime/panel-frame.ts`
- `screen` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `search` — `src/runtime/margometer-runtime.ts`
- `shelf` — `src/runtime/shelf.ts`
- `shelfAnswers` — `src/runtime/panel-frame.ts`
- `shelfRow` — `src/runtime/panel-frame.ts`
- `shownFight` — `src/runtime/fight-handover.ts`, `src/runtime/panel-frame.ts`
- `size` — `src/runtime/settings.ts`
- `skills` — `src/runtime/fight-file.ts`
- `source` — `src/runtime/panel-frame.ts`
- `state` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`
- `statistics` — `src/runtime/fight-file.ts`
- `step` — `src/runtime/live-fight.ts`, `src/runtime/settings.ts`
- `storageChoice` — `src/runtime/shelf-keeper.ts`
- `store` — `src/runtime/settings.ts`, `src/runtime/shelf.ts`
- `storedSetting` — `src/runtime/margometer-runtime.ts`
- `subject` — `src/runtime/fight-file.ts`
- `sum` — `src/runtime/panel-frame.ts`
- `surroundings` — `src/runtime/fight-file.ts`
- `tables` — `src/runtime/carried-tooltip.ts`, `src/runtime/fight-state.ts`,
  `src/runtime/panel-frame.ts`
- `text` — `src/runtime/settings.ts`
- `tooltip` — `src/runtime/carried-tooltip.ts`
- `totals` — `src/runtime/fight-file.ts`
- `translate` — `src/runtime/carried-tooltip.ts`
- `version` — `src/runtime/shelf.ts`
- `view` — `src/runtime/carried-tooltip.ts`, `src/runtime/fight-state.ts`,
  `src/runtime/panel-frame.ts`
- `wrap` — `src/runtime/margometer-runtime.ts`

### `src/ui/`

- `above` — `src/ui/panel-look.ts`
- `absence` — `src/ui/panel-words.ts`
- `across` — `src/ui/panel-element.ts`
- `after` — `src/ui/panel-drag.ts`
- `alpha` — `src/ui/panel-look.ts`
- `amount` — `src/ui/panel-words.ts`
- `amounts` — `src/ui/panel-words.ts`
- `anchor` — `src/ui/panel-drag.ts`
- `apartShares` — `src/ui/panel-content.ts`
- `attribute` — `src/ui/panel-element.ts`
- `bar` — `src/ui/panel-drag.ts`
- `before` — `src/ui/panel-drag.ts`
- `below` — `src/ui/panel-look.ts`
- `bit` — `src/ui/panel-words.ts`
- `bottom` — `src/ui/panel-look.ts`
- `bounds` — `src/ui/panel-drag.ts`
- `card` — `src/ui/panel-element.ts`
- `cardContext` — `src/ui/panel-element.ts`
- `cardKey` — `src/ui/panel-element.ts`
- `cardWidthMaximum` — `src/ui/panel-drag.ts`
- `carrier` — `src/ui/panel-content.ts`
- `category` — `src/ui/panel-words.ts`
- `cause` — `src/ui/panel-element.ts`, `src/ui/view-failure.ts`
- `caveat` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `channel` — `src/ui/panel-palette.ts`
- `characters` — `src/ui/panel-element.ts`
- `charactersPerLine` — `src/ui/panel-element.ts`
- `charged` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `chargedSkills` — `src/ui/panel-helper.ts`
- `child` — `src/ui/panel-document.ts`
- `children` — `src/ui/panel-document.ts`
- `choice` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `chosen` — `src/ui/panel-element.ts`
- `className` — `src/ui/panel-element.ts`
- `clientY` — `src/ui/panel-element.ts`
- `closing` — `src/ui/panel-element.ts`
- `colour` — `src/ui/panel-look.ts`, `src/ui/panel-palette.ts`
- `columns` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `combatantId` — `src/ui/panel-content.ts`
- `compose` — `src/ui/panel-element.ts`
- `coordinate` — `src/ui/panel-drag.ts`
- `corner` — `src/ui/panel-drag.ts`
- `cost` — `src/ui/panel-element.ts`
- `count` — `src/ui/panel-words.ts`
- `counts` — `src/ui/panel-words.ts`
- `cut` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `cutPart` — `src/ui/panel-element.ts`
- `defects` — `src/ui/panel-element.ts`
- `detail` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `document` — `src/ui/panel-element.ts`
- `doesOpen` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `dragOptions` — `src/ui/panel-element.ts`
- `drawn` — `src/ui/panel-element.ts`
- `element` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `elementRow` — `src/ui/panel-content.ts`
- `end` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `event` — in 4 files: `src/ui/`
- `failure` — in 4 files: `src/ui/`
- `fight` — `src/ui/panel-element.ts`
- `fightId` — `src/ui/panel-screen.ts`
- `figure` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `figures` — `src/ui/panel-content.ts`
- `floor` — `src/ui/panel-element.ts`
- `floors` — `src/ui/panel-element.ts`
- `folded` — `src/ui/panel-content.ts`
- `getBar` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `getCount` — `src/ui/panel-content.ts`
- `getCut` — `src/ui/panel-content.ts`
- `getTypeStep` — `src/ui/panel-element.ts`
- `grab` — `src/ui/panel-drag.ts`
- `grip` — `src/ui/panel-drag.ts`
- `ground` — `src/ui/panel-look.ts`
- `group` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `groups` — `src/ui/panel-element.ts`
- `halfNamedPart` — `src/ui/panel-content.ts`
- `handle` — in 4 files: `src/ui/`
- `hasHolder` — `src/ui/panel-helper.ts`
- `heading` — `src/ui/panel-element.ts`
- `helper` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `helperRegister` — `src/ui/panel-element.ts`
- `host` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `hue` — `src/ui/panel-look.ts`
- `icon` — `src/ui/panel-look.ts`
- `id` — `src/ui/panel-words.ts`
- `index` — `src/ui/panel-words.ts`
- `ink` — `src/ui/panel-look.ts`
- `inset` — `src/ui/panel-look.ts`
- `intent` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `isCollapsed` — `src/ui/panel-element.ts`
- `isHeld` — `src/ui/panel-drag.ts`
- `isHelperCollapsed` — `src/ui/panel-screen.ts`
- `isHidden` — `src/ui/panel-element.ts`
- `isLast` — `src/ui/panel-element.ts`
- `isListed` — `src/ui/panel-content.ts`
- `isLive` — `src/ui/panel-words.ts`
- `isMeterCollapsed` — `src/ui/panel-screen.ts`
- `isPinned` — `src/ui/panel-words.ts`
- `isPresent` — `src/ui/panel-words.ts`
- `isSideChosen` — `src/ui/panel-element.ts`
- `isWide` — `src/ui/panel-element.ts`
- `kept` — `src/ui/panel-element.ts`
- `key` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`, `src/ui/view-failure.ts`
- `kind` — `src/ui/panel-words.ts`
- `kinds` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `label` — `src/ui/panel-element.ts`
- `largest` — `src/ui/panel-content.ts`
- `layout` — `src/ui/panel-element.ts`
- `leaving` — `src/ui/panel-element.ts`
- `leftGroup` — `src/ui/panel-words.ts`
- `leftPart` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `leftRow` — `src/ui/panel-content.ts`
- `leftSide` — `src/ui/panel-content.ts`
- `leftSkill` — `src/ui/panel-content.ts`
- `legendaryBonuses` — `src/ui/panel-content.ts`
- `legendaryBonusesReached` — `src/ui/panel-content.ts`
- `level` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `limit` — `src/ui/panel-drag.ts`
- `line` — `src/ui/panel-element.ts`
- `lines` — `src/ui/panel-element.ts`
- `list` — `src/ui/panel-element.ts`
- `listener` — `src/ui/panel-drag.ts`, `src/ui/panel-listener.ts`, `src/ui/view-failure.ts`
- `listing` — `src/ui/panel-content.ts`
- `lookupCard` — `src/ui/panel-element.ts`
- `lost` — `src/ui/panel-words.ts`
- `mapName` — `src/ui/panel-words.ts`
- `mark` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `mergedPart` — `src/ui/panel-element.ts`
- `meter` — `src/ui/panel-drag.ts`
- `meterRegister` — `src/ui/panel-element.ts`
- `meterWidthPixels` — `src/ui/panel-drag.ts`
- `metric` — in 4 files: `src/ui/`
- `metricShown` — `src/ui/panel-screen.ts`
- `moment` — `src/ui/panel-words.ts`
- `momentPart` — `src/ui/panel-words.ts`
- `name` — in 5 files: `src/ui/`
- `named` — `src/ui/panel-content.ts`
- `names` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `neither` — `src/ui/panel-content.ts`
- `noun` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `offset` — `src/ui/panel-drag.ts`
- `onFailure` — `src/ui/panel-listener.ts`, `src/ui/view-failure.ts`
- `oneFigure` — `src/ui/ranked-order.ts`
- `oneText` — `src/ui/ranked-order.ts`
- `opened` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `openedPart` — in 4 files: `src/ui/`
- `options` — `src/ui/panel-document.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `ordinal` — `src/ui/panel-words.ts`
- `otherFigure` — `src/ui/ranked-order.ts`
- `otherId` — `src/ui/panel-content.ts`
- `otherText` — `src/ui/ranked-order.ts`
- `outcome` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `pair` — `src/ui/panel-element.ts`
- `pairPart` — `src/ui/panel-content.ts`
- `pairs` — `src/ui/panel-content.ts`
- `panelDrawing` — `src/ui/panel-element.ts`
- `panelWindow` — `src/ui/panel-drag.ts`
- `partIndex` — `src/ui/panel-content.ts`
- `parts` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `person` — `src/ui/panel-element.ts`
- `personContext` — `src/ui/panel-element.ts`
- `phrase` — `src/ui/panel-words.ts`
- `pinned` — `src/ui/panel-content.ts`
- `pinnedCase` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `pinnedFigure` — `src/ui/panel-content.ts`
- `pinnedRow` — `src/ui/panel-element.ts`
- `place` — `src/ui/panel-drag.ts`, `src/ui/panel-words.ts`
- `placement` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `pointer` — `src/ui/panel-drag.ts`
- `pointerId` — `src/ui/panel-document.ts`, `src/ui/panel-drag.ts`
- `points` — `src/ui/panel-words.ts`
- `position` — `src/ui/panel-drag.ts`
- `positionRequested` — `src/ui/panel-drag.ts`
- `previousCard` — `src/ui/panel-element.ts`
- `previousRegion` — `src/ui/panel-element.ts`
- `profession` — `src/ui/panel-helper.ts`, `src/ui/panel-palette.ts`, `src/ui/panel-words.ts`
- `provocations` — `src/ui/panel-helper.ts`
- `rank` — `src/ui/panel-element.ts`
- `raw` — `src/ui/panel-element.ts`
- `readAcross` — `src/ui/panel-element.ts`
- `readViewport` — `src/ui/panel-element.ts`
- `readerSide` — `src/ui/panel-content.ts`, `src/ui/panel-helper.ts`
- `redraw` — `src/ui/panel-element.ts`
- `region` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`, `src/ui/view-failure.ts`
- `regions` — `src/ui/panel-element.ts`
- `register` — `src/ui/panel-element.ts`
- `render` — `src/ui/panel-element.ts`
- `renderInPlace` — `src/ui/panel-element.ts`
- `renderedList` — `src/ui/panel-element.ts`
- `replacement` — `src/ui/panel-document.ts`
- `report` — `src/ui/panel-element.ts`
- `rest` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `rightGroup` — `src/ui/panel-words.ts`
- `rightPart` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `rightRow` — `src/ui/panel-content.ts`
- `rightSide` — `src/ui/panel-content.ts`
- `rightSkill` — `src/ui/panel-content.ts`
- `room` — `src/ui/panel-element.ts`
- `root` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-listener.ts`
- `roster` — `src/ui/panel-content.ts`, `src/ui/panel-helper.ts`
- `row` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `rowContent` — `src/ui/panel-element.ts`
- `rowIndex` — `src/ui/panel-content.ts`
- `rows` — `src/ui/panel-content.ts`
- `rowsVisibleCount` — `src/ui/panel-element.ts`
- `said` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `screen` — `src/ui/panel-screen.ts`
- `secondColumnFrom` — `src/ui/panel-element.ts`
- `sentence` — `src/ui/panel-content.ts`
- `shape` — `src/ui/panel-content.ts`
- `share` — `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `shareText` — `src/ui/panel-content.ts`
- `shares` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `shown` — `src/ui/panel-element.ts`
- `side` — `src/ui/panel-content.ts`
- `sideListed` — `src/ui/panel-content.ts`
- `sideRelation` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `sideShown` — `src/ui/panel-screen.ts`
- `sides` — `src/ui/panel-content.ts`
- `size` — in 4 files: `src/ui/`
- `sizes` — `src/ui/panel-words.ts`
- `skill` — `src/ui/panel-content.ts`
- `skillFold` — `src/ui/panel-content.ts`
- `skillRow` — `src/ui/panel-content.ts`
- `source` — `src/ui/panel-words.ts`
- `sourceFold` — `src/ui/panel-content.ts`
- `standing` — `src/ui/panel-helper.ts`
- `standings` — `src/ui/panel-helper.ts`
- `state` — `src/ui/panel-drag.ts`, `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `stated` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `statistic` — `src/ui/panel-words.ts`
- `statistics` — `src/ui/panel-content.ts`
- `status` — `src/ui/panel-words.ts`
- `statusBits` — `src/ui/panel-words.ts`
- `statuses` — `src/ui/panel-words.ts`
- `step` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `strip` — `src/ui/panel-element.ts`
- `subject` — `src/ui/panel-element.ts`
- `sum` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `suspicions` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `tag` — `src/ui/panel-document.ts`, `src/ui/panel-element.ts`
- `taken` — `src/ui/panel-words.ts`
- `target` — `src/ui/panel-document.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `text` — `src/ui/panel-document.ts`, `src/ui/panel-element.ts`
- `tokens` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `tooltip` — `src/ui/panel-words.ts`
- `top` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `total` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `totals` — `src/ui/panel-content.ts`
- `translate` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `turn` — `src/ui/panel-helper.ts`
- `turnsElapsed` — `src/ui/panel-words.ts`
- `turnsStated` — `src/ui/panel-words.ts`
- `type` — `src/ui/panel-document.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-listener.ts`
- `typeStep` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `typeStepChosen` — `src/ui/panel-element.ts`
- `unnamedCut` — `src/ui/panel-element.ts`
- `unplaced` — `src/ui/panel-words.ts`
- `unsharedPart` — `src/ui/panel-content.ts`
- `unsharedRow` — `src/ui/panel-content.ts`
- `uses` — `src/ui/panel-words.ts`
- `variableValue` — `src/ui/panel-look.ts`
- `viewport` — `src/ui/panel-drag.ts`
- `viewportHeight` — `src/ui/panel-look.ts`
- `viewportWidth` — `src/ui/panel-look.ts`
- `waiting` — `src/ui/panel-element.ts`
- `wasTurnLostRead` — `src/ui/panel-content.ts`
- `where` — `src/ui/panel-element.ts`
- `whole` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `wholeNumber` — `src/ui/panel-words.ts`
- `whom` — `src/ui/panel-words.ts`
- `window` — in 4 files: `src/ui/`
- `windowSizes` — `src/ui/panel-screen.ts`
- `without` — `src/ui/panel-element.ts`
- `words` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `x` — `src/ui/panel-words.ts`
- `y` — `src/ui/panel-words.ts`

### `src/`

- `afterMilliseconds` — `src/userscript-entry.ts`
- `anchor` — `src/userscript-entry.ts`
- `appendedElement` — `src/userscript-entry.ts`
- `blob` — `src/userscript-entry.ts`
- `browserWindow` — `src/userscript-entry.ts`
- `documentCandidate` — `src/userscript-entry.ts`
- `failure` — `src/userscript-entry.ts`
- `missing` — `src/userscript-entry.ts`
- `name` — `src/userscript-entry.ts`
- `options` — `src/userscript-entry.ts`
- `owner` — `src/userscript-entry.ts`
- `panel` — `src/userscript-entry.ts`
- `parts` — `src/userscript-entry.ts`
- `selector` — `src/userscript-entry.ts`
- `step` — `src/userscript-entry.ts`
- `storageChoice` — `src/userscript-entry.ts`
- `tag` — `src/userscript-entry.ts`
- `text` — `src/userscript-entry.ts`
- `type` — `src/userscript-entry.ts`
- `url` — `src/userscript-entry.ts`
- `values` — `src/userscript-entry.ts`

### `tools/`

- `act` — `tools/fabricated-fight.ts`
- `acting` — `tools/fabricated-fight.ts`
- `actor` — `tools/fabricated-fight.ts`
- `address` — `tools/margonem-client-source.ts`
- `admitted` — `tools/capture-intake.ts`
- `advance` — `tools/turn-count.ts`
- `after` — `tools/turn-count.ts`
- `amount` — `tools/fabricated-fight.ts`, `tools/fight-figures.ts`
- `args` — in 5 files: `tools/`
- `argument` — in 10 files: `tools/`
- `arriving` — `tools/turn-count.ts`
- `article` — `tools/help-article.ts`
- `asked` — `tools/fabricated-fight.ts`, `tools/panel-shots.ts`
- `atShouter` — `tools/shout-holding.ts`
- `atSomebodyElse` — `tools/shout-holding.ts`
- `aura` — `tools/skill-table.ts`
- `auras` — `tools/skill-table.ts`
- `base` — `tools/fabricated-fight.ts`
- `before` — `tools/fabricated-fight.ts`, `tools/turn-count.ts`, `tools/turn-reading.ts`
- `bits` — `tools/status-bit-table.ts`
- `body` — `tools/protocol-key-table.ts`
- `boundary` — `tools/turn-count.ts`
- `box` — `tools/panel-shots.ts`
- `boxes` — `tools/panel-shots.ts`
- `browser` — `tools/panel-shots.ts`
- `build` — `tools/protocol-key-table.ts`, `tools/status-bit-table.ts`
- `bundle` — in 4 files: `tools/`
- `cached` — `tools/margonem-readings.ts`
- `call` — `tools/build-userscript.ts`, `tools/capture-intake.ts`, `tools/fabricated-fight.ts`
- `calls` — `tools/panel-shots.ts`
- `candidate` — `tools/capture-intake.ts`
- `caption` — `tools/decoding-status.ts`, `tools/develop-reports.ts`, `tools/fight-figures.ts`
- `cardCount` — `tools/card-height.ts`
- `carried` — `tools/protocol-key-shape.ts`
- `cases` — `tools/drill-report.ts`
- `cause` — `tools/panel-shots.ts`
- `cell` — `tools/aura-standing.ts`, `tools/skill-table.ts`, `tools/turn-count.ts`
- `cells` — `tools/aura-standing.ts`
- `change` — `tools/develop-reports.ts`
- `changelog` — `tools/changelog.ts`
- `channel` — `tools/margonem-client-source.ts`
- `character` — `tools/build-userscript.ts`, `tools/protocol-key-table.ts`
- `claim` — `tools/help-claim-register.ts`, `tools/protocol-key-shape.ts`
- `claims` — `tools/protocol-key-shape.ts`
- `clock` — `tools/shout-holding.ts`
- `clocks` — `tools/shout-holding.ts`
- `code` — `tools/build-userscript.ts`, `tools/margometer-tool-error.ts`
- `column` — `tools/aura-standing.ts`
- `combatant` — `tools/fabricated-fight.ts`
- `combatantId` — `tools/drill-report.ts`
- `combatants` — `tools/fabricated-fight.ts`
- `command` — `tools/develop-reports.ts`
- `committed` — `tools/panel-shots.ts`
- `comparison` — `tools/develop-reports.ts`
- `configuration` — `tools/build-userscript.ts`
- `context` — `tools/help-article.ts`, `tools/turn-reading.ts`
- `controller` — `tools/preview-server.ts`
- `cost` — `tools/payload-cost.ts`
- `costs` — `tools/payload-cost.ts`
- `count` — in 8 files: `tools/`
- `counted` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `counts` — `tools/help-article.ts`
- `cut` — `tools/fight-figures.ts`
- `cutPart` — `tools/fight-figures.ts`
- `date` — in 5 files: `tools/`
- `dateField` — `tools/frozen-files.ts`
- `declared` — `tools/aura-standing.ts`, `tools/shout-holding.ts`
- `delta` — `tools/turn-count.ts`
- `develop` — `tools/develop-reports.ts`
- `developLines` — `tools/develop-reports.ts`
- `developNames` — `tools/develop-reports.ts`
- `developText` — `tools/develop-reports.ts`
- `developmentInstall` — `tools/preview-page.ts`
- `developmentVersion` — `tools/build-userscript.ts`
- `difference` — `tools/develop-reports.ts`
- `directory` — `tools/develop-reports.ts`, `tools/preview-server.ts`
- `directoryEntry` — `tools/preview-server.ts`
- `disputed` — `tools/turn-reading.ts`
- `document` — `tools/fabricated-fight.ts`
- `doesCloseOnShouts` — `tools/fabricated-fight.ts`
- `doesOfferFights` — `tools/preview-page.ts`
- `doesOpen` — `tools/drill-report.ts`
- `doesStartFromEmpty` — `tools/preview-page.ts`
- `done` — `tools/capture-intake.ts`
- `drill` — `tools/drill-report.ts`
- `drillCase` — `tools/drill-report.ts`
- `edition` — `tools/build-userscript.ts`, `tools/preview-server.ts`
- `effect` — `tools/skill-table.ts`
- `encodable` — `tools/capture-intake.ts`, `tools/protocol-key-table.ts`
- `encode` — `tools/fabricated-fight.ts`, `tools/frozen-files.ts`
- `ending` — `tools/fabricated-fight.ts`
- `entryPath` — `tools/build-userscript.ts`
- `envelope` — `tools/capture-intake.ts`
- `episodesMaximum` — `tools/shout-holding.ts`
- `event` — `tools/preview-server.ts`, `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `events` — `tools/aura-standing.ts`, `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `expected` — `tools/turn-count.ts`
- `extra` — `tools/fabricated-fight.ts`
- `fabricatedPaths` — `tools/preview-server.ts`
- `failure` — in 4 files: `tools/`
- `fallback` — `tools/fabricated-fight.ts`
- `family` — `tools/protocol-key-shape.ts`, `tools/protocol-key-table.ts`
- `fedThrough` — `tools/panel-shots.ts`
- `fetchedAt` — `tools/help-article.ts`, `tools/margonem-readings.ts`
- `field` — `tools/capture-intake.ts`
- `fields` — `tools/protocol-key-table.ts`
- `fight` — in 10 files: `tools/`
- `fights` — `tools/preview-server.ts`, `tools/turn-count.ts`, `tools/turn-reading.ts`
- `figure` — `tools/fabricated-fight.ts`
- `figures` — `tools/fight-figures.ts`, `tools/turn-count.ts`
- `file` — `tools/preview-site.ts`
- `files` — `tools/preview-server.ts`
- `flag` — in 7 files: `tools/`
- `flags` — `tools/panel-giving-way.ts`
- `fled` — `tools/fabricated-fight.ts`
- `from` — `tools/protocol-key-table.ts`, `tools/status-bit-table.ts`
- `fromPaths` — `tools/preview-server.ts`
- `frozen` — `tools/frozen-files.ts`, `tools/margonem-readings.ts`
- `gathered` — `tools/aura-lifetime.ts`
- `getTurns` — `tools/turn-count.ts`
- `grade` — `tools/turn-count.ts`
- `grades` — `tools/turn-count.ts`
- `grant` — `tools/skill-table.ts`
- `granted` — `tools/skill-table.ts`
- `group` — `tools/card-height.ts`
- `heading` — `tools/fight-figures.ts`, `tools/turn-count.ts`
- `height` — `tools/card-height.ts`
- `heights` — `tools/card-height.ts`
- `heldDate` — `tools/frozen-files.ts`
- `helds` — `tools/frozen-files.ts`
- `highest` — `tools/protocol-key-table.ts`
- `host` — `tools/build-userscript.ts`, `tools/margonem-client-source.ts`
- `html` — `tools/margonem-client-source.ts`, `tools/panel-shots.ts`, `tools/skill-table.ts`
- `id` — `tools/capture-intake.ts`, `tools/fight-figures.ts`
- `index` — `tools/capture-intake.ts`, `tools/frozen-files.ts`, `tools/protocol-key-table.ts`
- `install` — `tools/preview-page.ts`
- `into` — `tools/panel-giving-way.ts`
- `isAtShouter` — `tools/shout-holding.ts`
- `isMember` — `tools/protocol-key-table.ts`
- `key` — in 8 files: `tools/`
- `keyCount` — `tools/decoding-status.ts`
- `keys` — `tools/margonem-readings.ts`, `tools/protocol-key-table.ts`
- `keysMaximum` — `tools/aura-standing.ts`, `tools/protocol-key-shape.ts`
- `kind` — `tools/decoding-status.ts`
- `knownMarker` — `tools/help-claim-register.ts`
- `label` — `tools/capture-intake.ts`, `tools/fight-figures.ts`
- `labelId` — `tools/payload-cost.ts`
- `largestSoFar` — `tools/payload-cost.ts`
- `left` — `tools/aura-standing.ts`
- `level` — `tools/fabricated-fight.ts`
- `levelTurns` — `tools/skill-table.ts`
- `lifted` — `tools/margonem-readings.ts`
- `lightings` — `tools/aura-lifetime.ts`
- `line` — in 7 files: `tools/`
- `lineCount` — `tools/card-height.ts`
- `lineNumber` — `tools/help-claim-register.ts`, `tools/protocol-key-shape.ts`
- `listeners` — `tools/preview-server.ts`
- `lowest` — `tools/protocol-key-table.ts`
- `manifest` — `tools/help-article.ts`, `tools/margonem-client-source.ts`, `tools/skill-table.ts`
- `mapText` — `tools/capture-intake.ts`
- `mapped` — `tools/capture-intake.ts`
- `material` — in 8 files: `tools/`
- `maximum` — `tools/fabricated-fight.ts`, `tools/help-article.ts`
- `message` — `tools/turn-reading.ts`
- `messages` — `tools/fabricated-fight.ts`
- `messagesLost` — `tools/fight-figures.ts`
- `microseconds` — `tools/payload-cost.ts`
- `mine` — `tools/turn-count.ts`
- `minimum` — `tools/fabricated-fight.ts`
- `moment` — `tools/build-userscript.ts`, `tools/panel-shots.ts`
- `moved` — `tools/fabricated-fight.ts`
- `name` — in 10 files: `tools/`
- `named` — `tools/help-article.ts`, `tools/recorded-material.ts`
- `namedIds` — `tools/fabricated-fight.ts`
- `names` — `tools/capture-intake.ts`
- `need` — `tools/preview-page.ts`
- `nothingAt` — `tools/status-bit-table.ts`
- `now` — `tools/help-article.ts`, `tools/margonem-readings.ts`
- `open` — `tools/protocol-key-table.ts`, `tools/status-bit-table.ts`
- `opened` — `tools/drill-report.ts`
- `openedPart` — `tools/drill-report.ts`
- `opener` — `tools/turn-reading.ts`
- `openerId` — `tools/turn-reading.ts`
- `options` — `tools/margometer-tool-error.ts`, `tools/preview-page.ts`, `tools/preview-server.ts`
- `ordered` — `tools/card-height.ts`
- `ordinal` — `tools/fabricated-fight.ts`
- `otherCount` — `tools/card-height.ts`
- `otherCutPart` — `tools/fight-figures.ts`
- `otherDrillCase` — `tools/drill-report.ts`
- `otherHeight` — `tools/card-height.ts`
- `otherId` — `tools/capture-intake.ts`, `tools/fight-figures.ts`
- `otherKeyCount` — `tools/decoding-status.ts`
- `otherMicroseconds` — `tools/payload-cost.ts`
- `otherPair` — `tools/capture-intake.ts`
- `otherRow` — `tools/aura-lifetime.ts`
- `otherSideGroup` — `tools/fight-figures.ts`
- `otherSkill` — `tools/fight-figures.ts`
- `otherTally` — `tools/aura-lifetime.ts`, `tools/card-height.ts`, `tools/turn-reading.ts`
- `otherTurns` — `tools/aura-lifetime.ts`, `tools/shout-holding.ts`
- `outcomes` — `tools/turn-count.ts`
- `ownTurns` — `tools/aura-lifetime.ts`
- `page` — `tools/help-article.ts`
- `pair` — `tools/capture-intake.ts`
- `pairs` — `tools/capture-intake.ts`
- `paragraph` — `tools/protocol-key-shape.ts`
- `parameter` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`, `tools/turn-reading.ts`
- `parameters` — `tools/fabricated-fight.ts`
- `path` — in 6 files: `tools/`
- `paths` — `tools/frozen-files.ts`, `tools/recorded-material.ts`
- `payload` — `tools/fabricated-fight.ts`, `tools/payload-cost.ts`, `tools/turn-reading.ts`
- `payloadIndex` — `tools/payload-cost.ts`
- `perSide` — `tools/fabricated-fight.ts`
- `phrase` — `tools/help-article.ts`, `tools/help-claim-register.ts`
- `phrases` — `tools/help-article.ts`
- `pinnedCase` — `tools/drill-report.ts`
- `place` — `tools/drill-report.ts`, `tools/fabricated-fight.ts`
- `placement` — `tools/protocol-key-shape.ts`
- `placements` — `tools/protocol-key-shape.ts`
- `port` — `tools/preview-server.ts`
- `position` — `tools/status-bit-table.ts`
- `readDate` — `tools/frozen-files.ts`
- `reading` — `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `reason` — `tools/margometer-tool-error.ts`
- `record` — `tools/capture-intake.ts`
- `recording` — `tools/capture-intake.ts`
- `region` — `tools/panel-giving-way.ts`
- `regions` — `tools/panel-giving-way.ts`
- `register` — `tools/protocol-key-shape.ts`
- `registered` — `tools/protocol-key-shape.ts`
- `registeredKey` — `tools/protocol-key-shape.ts`
- `replayed` — in 6 files: `tools/`
- `request` — `tools/preview-server.ts`
- `revision` — `tools/develop-reports.ts`
- `rewrite` — `tools/develop-reports.ts`
- `rewriteLines` — `tools/develop-reports.ts`
- `rewriteText` — `tools/develop-reports.ts`
- `right` — `tools/aura-standing.ts`
- `roll` — `tools/capture-intake.ts`
- `root` — `tools/build-userscript.ts`, `tools/capture-intake.ts`
- `roster` — `tools/fight-figures.ts`
- `round` — `tools/fabricated-fight.ts`
- `rounds` — `tools/fabricated-fight.ts`
- `row` — in 5 files: `tools/`
- `rows` — `tools/aura-lifetime.ts`, `tools/aura-standing.ts`
- `run` — `tools/aura-lifetime.ts`
- `runs` — `tools/aura-lifetime.ts`, `tools/payload-cost.ts`
- `runsMaximum` — `tools/aura-lifetime.ts`
- `said` — `tools/margonem-readings.ts`
- `screen` — `tools/card-height.ts`, `tools/drill-report.ts`
- `screens` — `tools/drill-report.ts`
- `script` — `tools/preview-page.ts`
- `sentence` — `tools/protocol-key-shape.ts`
- `served` — `tools/margonem-readings.ts`
- `setting` — `tools/build-userscript.ts`
- `shape` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `shapes` — `tools/protocol-key-shape.ts`
- `share` — `tools/shout-holding.ts`
- `shift` — `tools/margonem-readings.ts`
- `shot` — `tools/panel-shots.ts`
- `shout` — `tools/skill-table.ts`
- `shouts` — `tools/skill-table.ts`
- `side` — `tools/fabricated-fight.ts`
- `sideGroup` — `tools/fight-figures.ts`
- `skill` — `tools/fabricated-fight.ts`, `tools/fight-figures.ts`, `tools/skill-table.ts`
- `skillId` — `tools/aura-standing.ts`
- `skillName` — `tools/aura-standing.ts`
- `skills` — `tools/fight-figures.ts`, `tools/skill-table.ts`
- `skillsMaximum` — `tools/aura-standing.ts`
- `slowestSoFar` — `tools/payload-cost.ts`
- `slug` — `tools/capture-intake.ts`
- `source` — `tools/capture-intake.ts`, `tools/panel-giving-way.ts`, `tools/protocol-key-table.ts`
- `standing` — `tools/turn-reading.ts`
- `start` — `tools/protocol-key-table.ts`
- `state` — `tools/fabricated-fight.ts`, `tools/margonem-readings.ts`, `tools/preview-server.ts`
- `stated` — in 6 files: `tools/`
- `statistics` — `tools/fight-figures.ts`, `tools/turn-count.ts`
- `status` — `tools/fabricated-fight.ts`
- `step` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `stepped` — `tools/aura-lifetime.ts`, `tools/aura-standing.ts`
- `steps` — `tools/aura-lifetime.ts`, `tools/protocol-key-table.ts`, `tools/turn-count.ts`
- `subject` — `tools/margonem-readings.ts`
- `substitutions` — `tools/capture-intake.ts`
- `sum` — `tools/fabricated-fight.ts`, `tools/payload-cost.ts`
- `tallies` — `tools/turn-reading.ts`
- `tally` — in 6 files: `tools/`
- `tallyMaximum` — `tools/decoding-status.ts`
- `target` — `tools/fabricated-fight.ts`
- `task` — `tools/develop-reports.ts`
- `text` — in 12 files: `tools/`
- `turn` — `tools/fabricated-fight.ts`, `tools/shout-holding.ts`
- `turns` — `tools/aura-lifetime.ts`, `tools/shout-holding.ts`
- `turnsElapsed` — `tools/shout-holding.ts`
- `unit` — `tools/margonem-readings.ts`
- `update` — `tools/turn-count.ts`
- `url` — `tools/help-article.ts`, `tools/preview-server.ts`
- `values` — `tools/protocol-key-shape.ts`
- `version` — in 5 files: `tools/`
- `view` — `tools/shout-holding.ts`
- `viewportWidth` — `tools/panel-shots.ts`
- `walk` — `tools/turn-reading.ts`
- `walks` — `tools/turn-reading.ts`
- `watcher` — `tools/preview-server.ts`
- `widths` — `tools/aura-standing.ts`
- `word` — `tools/protocol-key-shape.ts`
- `words` — `tools/preview-page.ts`
- `worked` — `tools/panel-shots.ts`

### `tests/`

- `_` — in 27 files: `tests/`
- `_key` — `tests/ui/card-window.test.ts`
- `_name` — `tests/runtime/margometer-runtime.test.ts`
- `_playwright` — `tests/e2e/panel-fixture.ts`
- `_text` — `tests/runtime/margometer-runtime.test.ts`
- `actorId` — in 6 files: `tests/`
- `addName` — `tests/repository/name-register.test.ts`
- `after` — `tests/runtime/live-fight.test.ts`
- `all` — `tests/e2e/panel-options.spec.ts`, `tests/ui/panel-content.test.ts`
- `amount` — in 4 files: `tests/`
- `announced` — `tests/core/injure-rule.test.ts`, `tests/ui/panel-content.test.ts`
- `announcementPosition` — `tests/core/granted-blow-rule.test.ts`
- `answer` — in 11 files: `tests/`
- `answerElement` — `tests/e2e/panel-options.spec.ts`
- `appended` — `tests/fake-window.ts`
- `args` — `tests/ports/margonem-client-dictionary.test.ts`,
  `tests/ports/margonem-engine-battle.test.ts`, `tests/repository/cited-paths.test.ts`
- `around` — `tests/runtime/fight-file.test.ts`
- `assertion` — `tests/repository/non-null-assertions.test.ts`,
  `tests/repository/type-assertions.test.ts`
- `assignment` — `tests/repository/purity.test.ts`
- `attackerIds` — `tests/core/injure-rule.test.ts`
- `attributeValue` — `tests/fake-document.ts`, `tests/ui/view-failure.test.ts`
- `aura` — `tests/core/aura-standing.test.ts`
- `base` — `tests/runtime-world.ts`, `tests/runtime/margometer-runtime.test.ts`
- `battle` — `tests/ports/margonem-engine-battle.test.ts`,
  `tests/ports/margonem-engine-warriors.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `bearerEventsAtSeating` — `tests/core/carried-figure.test.ts`
- `belowLine` — `tests/repository/workflows.test.ts`
- `binding` — `tests/repository/browser-globals.test.ts`, `tests/repository/name-shapes.test.ts`
- `bit` — `tests/core/carried-figure.test.ts`, `tests/ui/panel-words.test.ts`
- `bits` — `tests/core/carried-status.test.ts`
- `blow` — `tests/core/fight-statistics.test.ts`
- `blowsCritical` — `tests/ui/panel-card.test.ts`
- `blowsStruck` — `tests/ui/panel-card.test.ts`
- `body` — in 4 files: `tests/`
- `boundary` — `tests/tools/turn-count.test.ts`
- `broken` — `tests/core/last-heal-rule.test.ts`
- `browser` — `tests/e2e/panel-camera.ts`
- `bucket` — `tests/tools/card-height.test.ts`
- `build` — `tests/tools/margonem-readings.test.ts`
- `built` — `tests/e2e/panel-boot.spec.ts`, `tests/e2e/panel-fixture.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `by` — `tests/e2e/panel-probe.ts`
- `call` — in 11 files: `tests/`
- `callIndex` — `tests/runtime/live-fight.test.ts`
- `callee` — `tests/repository/purity.test.ts`
- `caller` — `tests/repository/called-once.test.ts`, `tests/repository/event-entries.test.ts`,
  `tests/repository/purity.test.ts`
- `calls` — in 5 files: `tests/`
- `candidate` — in 6 files: `tests/`
- `card` — `tests/ui/card-window.test.ts`
- `cardClass` — `tests/e2e/panel-camera.ts`
- `caseKey` — `tests/tools/drill-report.test.ts`
- `cast` — `tests/repository/captured-fight-register.test.ts`
- `castIndex` — `tests/core/carried-figure.test.ts`
- `casterId` — `tests/core/aura-standing.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-helper.test.ts`
- `casterIndex` — `tests/core/aura-standing.test.ts`
- `casts` — `tests/core/carried-figure.test.ts`
- `catchClause` — `tests/repository/broad-catches.test.ts`
- `category` — `tests/runtime/carried-tooltip.test.ts`
- `cause` — `tests/tools/decoding-status.test.ts`
- `cell` — in 8 files: `tests/`
- `cellSelector` — `tests/e2e/panel-helper.spec.ts`
- `cells` — in 4 files: `tests/`
- `chain` — `tests/repository/purity.test.ts`
- `change` — `tests/core/fight-statistics.test.ts`, `tests/tools/develop-reports.test.ts`
- `changedNode` — `tests/repository/purity.test.ts`
- `channels` — `tests/ui/panel-look.test.ts`
- `character` — in 6 files: `tests/`
- `charge` — `tests/ui/panel-helper.test.ts`
- `chargedSkill` — `tests/core/fight-session.test.ts`, `tests/ui/panel-helper.test.ts`
- `chargedSkills` — `tests/ui/view-failure.test.ts`
- `child` — in 6 files: `tests/`
- `children` — `tests/fake-document.ts`
- `choice` — in 5 files: `tests/`
- `citation` — `tests/repository/cited-paths.test.ts`
- `className` — in 4 files: `tests/`
- `classNames` — `tests/ui/panel-element.test.ts`
- `click` — `tests/ports/browser-file.test.ts`
- `clientX` — `tests/ui/panel-gesture.test.ts`
- `clientY` — `tests/fake-document.ts`
- `clip` — `tests/e2e/panel-camera.ts`
- `clock` — `tests/runtime/margonem-engine-search.test.ts`
- `close` — `tests/ui/panel-words.test.ts`
- `closer` — `tests/repository/documents.test.ts`, `tests/ui/panel-words.test.ts`
- `closing` — `tests/markdown-document.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/share-column.test.ts`
- `coloured` — `tests/ui/panel-palette.test.ts`
- `columns` — `tests/ui/card-window.test.ts`
- `combatant` — in 10 files: `tests/`
- `combatantFigures` — `tests/tools/fabricated-fight.test.ts`
- `combatantId` — in 11 files: `tests/`
- `combatantIndex` — `tests/ui/panel-content.test.ts`
- `comparison` — `tests/core/health-witness.test.ts`
- `compose` — `tests/ui/card-window.test.ts`
- `composed` — `tests/repository/name-register.test.ts`
- `config` — `tests/e2e/build-once.ts`
- `constantName` — `tests/repository/protocol-keys.test.ts`
- `construct` — `tests/repository/browser-support.test.ts`
- `content` — `tests/ports/margonem-engine-tooltip.test.ts`, `tests/rebuilding-battle.ts`,
  `tests/tools/frozen-files.test.ts`
- `context` — `tests/source-tree.ts`
- `control` — `tests/e2e/panel-type.spec.ts`, `tests/ui/panel-element.test.ts`
- `controller` — `tests/tools/margonem-client-source.test.ts`
- `count` — in 31 files: `tests/`
- `countClaim` — `tests/repository/protocol-keys.test.ts`
- `crumb` — `tests/ui/panel-element.test.ts`
- `cutPart` — `tests/ui/panel-content.test.ts`
- `date` — `tests/tools/frozen-files.test.ts`
- `day` — `tests/ui/panel-words.test.ts`
- `days` — `tests/tools/margonem-readings.test.ts`
- `decided` — `tests/tools/margonem-readings.test.ts`
- `declaration` — in 6 files: `tests/`
- `declarator` — `tests/repository/name-register.test.ts`
- `declarators` — `tests/repository/handed-callbacks.test.ts`
- `declared` — `tests/core/fight-decoder.test.ts`, `tests/core/health-witness.test.ts`,
  `tests/repository/assertion-density.test.ts`
- `declaredEffect` — `tests/core/aura-standing.test.ts`, `tests/core/fight-decoder.test.ts`,
  `tests/core/health-witness.test.ts`
- `decoys` — `tests/ports/margonem-client-build.test.ts`
- `defectCount` — `tests/runtime/defect-ledger.test.ts`, `tests/runtime/panel-frame.test.ts`
- `defects` — `tests/ui/panel-element.test.ts`, `tests/ui/view-failure.test.ts`
- `defences` — `tests/core/fight-statistics.test.ts`
- `delegation` — `tests/repository/protocol-keys.test.ts`
- `departure` — `tests/ui/panel-look.test.ts`
- `departures` — `tests/ui/panel-look.test.ts`
- `derived` — `tests/repository/declaration-order.test.ts`
- `descendant` — in 6 files: `tests/`
- `design` — `tests/repository/event-entries.test.ts`
- `detail` — in 5 files: `tests/`
- `develop` — `tests/ui/panel-look.test.ts`
- `directories` — `tests/source-tree.ts`
- `directory` — `tests/repository/assertion-density.test.ts`,
  `tests/repository/import-paths.test.ts`, `tests/repository/name-register.test.ts`
- `directoryEntry` — `tests/tools/panel-shots.test.ts`
- `disputed` — `tests/tools/turn-reading.test.ts`
- `distance` — `tests/ui/panel-drag.test.ts`
- `document` — in 4 files: `tests/`
- `doesFakeClock` — `tests/e2e/panel-fixture.ts`
- `doesLoadTwice` — `tests/e2e/panel-fixture.ts`
- `drawn` — in 4 files: `tests/`
- `drill` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-element.test.ts`
- `drillCase` — `tests/tools/drill-report.test.ts`
- `edition` — `tests/tools/preview-server.test.ts`
- `effect` — in 4 files: `tests/`
- `effectKey` — `tests/core/aura-standing.test.ts`
- `effects` — `tests/tools/skill-table.test.ts`
- `element` — `tests/ui/card-window.test.ts`, `tests/ui/panel-element.test.ts`
- `elementKey` — `tests/core/fight-decoder.test.ts`
- `elementRow` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/share-column.test.ts`
- `enclosed` — `tests/source-tree.ts`
- `end` — `tests/core/message-grammar.test.ts`, `tests/repository/changelog.test.ts`
- `ending` — `tests/repository/cited-paths.test.ts`, `tests/ui/panel-words.test.ts`
- `engine` — in 4 files: `tests/`
- `engineIndex` — `tests/repository/browser-support.test.ts`
- `entries` — `tests/repository/event-entries.test.ts`
- `entryNumber` — `tests/tools/panel-shots.test.ts`
- `errorClass` — `tests/repository/throws.test.ts`
- `event` — in 11 files: `tests/`
- `events` — in 6 files: `tests/`
- `eventsAtSeating` — `tests/core/aura-standing.test.ts`
- `everyMilliseconds` — `tests/ports/browser-interval.test.ts`
- `executablePath` — `tests/e2e/panel-camera.ts`
- `expected` — `tests/libs/unknown-value.test.ts`, `tests/ports/payload-envelope.test.ts`
- `extra` — `tests/tools/recorded-material.test.ts`, `tests/ui/panel-element.test.ts`
- `failure` — in 10 files: `tests/`
- `fakeElement` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/drill-report.test.ts`
- `fate` — `tests/runtime/failure-fate.test.ts`
- `fault` — `tests/repository/changelog.test.ts`
- `fedThrough` — `tests/e2e/panel-fixture.ts`
- `field` — in 6 files: `tests/`
- `fieldValue` — `tests/source-tree.ts`
- `fight` — in 19 files: `tests/`
- `fights` — `tests/runtime/shelf.test.ts`
- `figure` — in 8 files: `tests/`
- `figureText` — `tests/core/last-heal-rule.test.ts`
- `figures` — `tests/tools/turn-count.test.ts`, `tests/ui/panel-content.test.ts`
- `file` — in 28 files: `tests/`
- `fileNames` — `tests/repository/name-register.test.ts`
- `filename` — `tests/source-tree.ts`
- `files` — in 8 files: `tests/`
- `finding` — `tests/repository/called-once.test.ts`
- `firstBox` — `tests/e2e/panel-helper.spec.ts`
- `firstWorld` — `tests/runtime/margometer-runtime.test.ts`
- `flaggedNode` — `tests/source-tree.ts`
- `floor` — `tests/repository/assertion-density.test.ts`, `tests/repository/changelog.test.ts`,
  `tests/ui/panel-look.test.ts`
- `focusedBy` — `tests/rebuilding-battle.ts`
- `font` — `tests/ui/panel-element.test.ts`
- `fragment` — `tests/e2e/panel-fixture.ts`
- `frames` — `tests/runtime-world.ts`
- `from` — `tests/core/fight-decoder.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/e2e/panel-probe.ts`
- `fromPaths` — `tests/tools/preview-server.test.ts`
- `functions` — `tests/repository/declaration-order.test.ts`,
  `tests/repository/handed-callbacks.test.ts`, `tests/source-tree.ts`
- `gestures` — `tests/e2e/panel-camera.ts`
- `getShelf` — `tests/runtime-world.ts`
- `getToken` — `tests/repository/design-tokens.test.ts`
- `given` — `tests/runtime/margonem-engine-search.test.ts`
- `gone` — `tests/ui/panel-look.test.ts`
- `grade` — `tests/tools/turn-count.test.ts`
- `gradeKey` — `tests/tools/turn-count.test.ts`
- `grip` — `tests/ui/panel-gesture.test.ts`
- `grounds` — `tests/ui/panel-look.test.ts`
- `group` — `tests/ui/card-window.test.ts`, `tests/ui/panel-card.test.ts`
- `guarding` — `tests/repository/handed-callbacks.test.ts`
- `handed` — `tests/repository/handed-callbacks.test.ts`
- `handle` — in 4 files: `tests/`
- `hash` — `tests/tools/preview-state.test.ts`
- `header` — `tests/repository/decisions.test.ts`, `tests/repository/documents.test.ts`
- `headerLine` — `tests/repository/decisions.test.ts`, `tests/repository/documents.test.ts`
- `heading` — in 6 files: `tests/`
- `heal` — `tests/core/last-heal-rule.test.ts`
- `heals` — `tests/core/fight-statistics.test.ts`
- `healsGiven` — `tests/ui/panel-words.test.ts`
- `health` — `tests/ports/warrior-entries.test.ts`
- `height` — `tests/e2e/panel-scroll.spec.ts`, `tests/tools/card-height.test.ts`,
  `tests/ui/panel-look.test.ts`
- `held` — in 9 files: `tests/`
- `heldString` — `tests/repository/name-register.test.ts`
- `helper` — `tests/e2e/panel-type.spec.ts`
- `helperClass` — `tests/e2e/panel-camera.ts`
- `here` — `tests/ui/panel-look.test.ts`
- `hero` — `tests/runtime/margometer-runtime.test.ts`
- `honesty` — `tests/e2e/panel-boot.spec.ts`
- `host` — in 11 files: `tests/`
- `hour` — `tests/ui/panel-words.test.ts`
- `html` — `tests/e2e/panel-fixture.ts`
- `hue` — `tests/ui/panel-look.test.ts`, `tests/ui/panel-palette.test.ts`
- `icon` — `tests/ui/panel-look.test.ts`
- `id` — in 18 files: `tests/`
- `identifier` — `tests/repository/browser-globals.test.ts`, `tests/repository/called-once.test.ts`
- `index` — in 25 files: `tests/`
- `info` — `tests/e2e/panel-fixture.ts`
- `init` — `tests/repository/name-register.test.ts`, `tests/repository/purity.test.ts`
- `inner` — `tests/ui/level-drawn.test.ts`
- `intent` — in 4 files: `tests/`
- `isAnnounced` — `tests/core/turn-clock.test.ts`
- `isDeep` — `tests/e2e/panel-crawler.ts`
- `isLive` — `tests/ui/shelf-bound.test.ts`
- `isMember` — `tests/repository/names.test.ts`
- `isOpening` — `tests/ports/fight-capture.test.ts`
- `isPinned` — `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/shelf-keeper.test.ts`,
  `tests/runtime/shelf.test.ts`
- `isRowNarrower` — `tests/ui/panel-card.test.ts`
- `isSizedAtOpening` — `tests/ui/panel-gesture.test.ts`
- `iso` — `tests/tools/build-userscript.test.ts`
- `items` — `tests/repository/declaration-order.test.ts`
- `keptCall` — `tests/runtime/live-fight.test.ts`
- `keptFight` — `tests/runtime/shelf-keeper.test.ts`
- `key` — in 23 files: `tests/`
- `keyCell` — `tests/tools/aura-lifetime.test.ts`
- `keyCount` — `tests/ports/fight-capture.test.ts`
- `keyIndex` — `tests/tools/protocol-key-shape.test.ts`, `tests/ui/panel-element.test.ts`
- `keyTally` — `tests/tools/turn-reading.test.ts`
- `keyedNode` — `tests/repository/name-register.test.ts`
- `keys` — in 4 files: `tests/`
- `kind` — in 17 files: `tests/`
- `kindCount` — `tests/core/fight-statistics.test.ts`
- `kindMarker` — `tests/repository/changelog.test.ts`
- `kinds` — `tests/source-tree.ts`
- `known` — `tests/repository/redacted-names.test.ts`
- `label` — `tests/tools/protocol-key-table.test.ts`, `tests/ui/card-window.test.ts`
- `labelClaim` — `tests/repository/protocol-keys.test.ts`
- `labelElement` — `tests/e2e/panel-card.spec.ts`
- `labelId` — `tests/simulation.ts`
- `labelKey` — `tests/ui/blow-vocabulary.test.ts`
- `layer` — `tests/repository/name-register.test.ts`
- `left` — in 13 files: `tests/`
- `legendaryBonuses` — `tests/ui/panel-card.test.ts`
- `length` — `tests/runtime/settings.test.ts`, `tests/tools/skill-table.test.ts`,
  `tests/ui/card-window.test.ts`
- `lengthMaximum` — `tests/runtime/shelf-keeper.test.ts`, `tests/runtime/shelf.test.ts`
- `letter` — `tests/repository/captured-fight-register.test.ts`
- `level` — `tests/ui/panel-card.test.ts`
- `line` — in 24 files: `tests/`
- `lineIndex` — `tests/tools/develop-reports.test.ts`
- `lines` — `tests/repository/comment-share.test.ts`, `tests/source-tree.ts`,
  `tests/tools/card-height.test.ts`
- `listener` — `tests/ports/margonem-engine-battle.test.ts`
- `literal` — `tests/repository/name-register.test.ts`
- `mapName` — `tests/ports/margonem-engine-place.test.ts`
- `margin` — `tests/ui/panel-look.test.ts`
- `margonem` — `tests/runtime/live-fight.test.ts`
- `margonemClientBuild` — `tests/runtime/shelf.test.ts`
- `mark` — in 7 files: `tests/`
- `markSelector` — `tests/e2e/panel-marks.spec.ts`
- `markValue` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-intent.test.ts`
- `marker` — `tests/repository/protocol-keys.test.ts`
- `marks` — `tests/ui/panel-intent.test.ts`
- `mask` — `tests/ports/warrior-entries.test.ts`
- `maximum` — `tests/libs/unknown-value.test.ts`, `tests/repository/nesting-depth.test.ts`
- `measured` — `tests/e2e/panel-card.spec.ts`
- `members` — `tests/core/fight-decoder.test.ts`
- `mentionIndex` — `tests/repository/declaration-order.test.ts`
- `message` — in 13 files: `tests/`
- `messageReading` — `tests/tools/turn-reading.test.ts`
- `messages` — in 7 files: `tests/`
- `meter` — `tests/e2e/panel-options.spec.ts`, `tests/e2e/panel-type.spec.ts`
- `method` — `tests/ports/margonem-engine-battle.test.ts`,
  `tests/ports/margonem-engine-tooltip.test.ts`
- `metric` — in 7 files: `tests/`
- `minute` — `tests/ui/panel-words.test.ts`
- `monthFromZero` — `tests/ui/panel-words.test.ts`
- `moved` — `tests/ui/panel-look.test.ts`
- `name` — in 27 files: `tests/`
- `nameCell` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-element.test.ts`
- `nameField` — `tests/repository/name-register.test.ts`
- `nameIndex` — `tests/repository/throws.test.ts`
- `named` — `tests/e2e/panel-fixture.ts`, `tests/tools/capture-intake.test.ts`,
  `tests/tools/panel-shots.test.ts`
- `names` — `tests/repository/declaration-order.test.ts`, `tests/ui/panel-content.test.ts`
- `nested` — `tests/repository/called-once.test.ts`
- `nonPlayer` — `tests/tools/capture-intake.test.ts`
- `note` — `tests/drawn-card.ts`
- `now` — `tests/ports/browser-clock.test.ts`
- `number` — `tests/repository/decisions.test.ts`
- `o` — `tests/core/last-heal-rule.test.ts`
- `occurrence` — `tests/core/last-heal-rule.test.ts`
- `offset` — `tests/source-tree.ts`
- `offsets` — `tests/e2e/panel-probe.ts`
- `onLateFailure` — `tests/runtime/margometer-runtime.test.ts`
- `onPageCall` — `tests/rebuilding-battle.ts`, `tests/simulation.ts`
- `onStepFailure` — `tests/runtime/margometer-runtime.test.ts`
- `open` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-words.test.ts`
- `opened` — `tests/ui/panel-content.test.ts`
- `openedAt` — in 6 files: `tests/`
- `opener` — in 6 files: `tests/`
- `openerTally` — `tests/tools/turn-reading.test.ts`
- `opening` — `tests/markdown-document.ts`
- `options` — in 4 files: `tests/`
- `order` — `tests/tools/capture-intake.test.ts`, `tests/tools/develop-reports.test.ts`
- `ordinal` — `tests/tools/turn-count.test.ts`
- `otherEnd` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `otherKey` — `tests/ui/blow-vocabulary.test.ts`
- `ours` — `tests/core/aura-standing.test.ts`
- `outcome` — `tests/ui/panel-element.test.ts`
- `over` — in 8 files: `tests/`
- `overrides` — `tests/runtime-world.ts`, `tests/runtime/live-fight.test.ts`
- `owner` — `tests/e2e/panel-helper.spec.ts`
- `page` — in 13 files: `tests/`
- `pairPart` — `tests/ui/level-drawn.test.ts`
- `panel` — in 22 files: `tests/`
- `parameter` — in 11 files: `tests/`
- `parsed` — `tests/core/granted-blow-rule.test.ts`, `tests/core/last-heal-rule.test.ts`
- `partRow` — `tests/ui/panel-content.test.ts`
- `parts` — `tests/fake-window.ts`, `tests/ports/browser-clock.test.ts`,
  `tests/ui/panel-content.test.ts`
- `past` — `tests/repository/changelog.test.ts`
- `path` — in 24 files: `tests/`
- `pathIndex` — `tests/tools/preview-server.test.ts`
- `paths` — `tests/repository/name-register.test.ts`
- `pattern` — `tests/repository/purity.test.ts`, `tests/source-tree.ts`
- `patterns` — `tests/repository/documents.test.ts`
- `payload` — in 15 files: `tests/`
- `payloads` — `tests/runtime/live-fight.test.ts`, `tests/tools/turn-reading.test.ts`
- `percent` — `tests/core/last-heal-rule.test.ts`
- `phrase` — `tests/repository/protocol-keys.test.ts`
- `pick` — `tests/ui/panel-look.test.ts`
- `pin` — `tests/ui/panel-element.test.ts`
- `pinnedRow` — `tests/ui/full-cast-bound.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/share-column.test.ts`
- `pip` — `tests/ui/helper-window.test.ts`
- `place` — in 4 files: `tests/`
- `placeholders` — `tests/repository/name-shapes.test.ts`
- `plan` — `tests/simulation.ts`
- `plugin` — `tests/source-tree.ts`
- `point` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-probe.ts`
- `pointer` — `tests/fake-document.ts`
- `pointerId` — `tests/fake-document.ts`
- `position` — `tests/core/last-heal-rule.test.ts`
- `prefix` — in 5 files: `tests/`
- `procs` — `tests/core/fight-decoder.test.ts`, `tests/ui/panel-card.test.ts`
- `profession` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-look.test.ts`,
  `tests/ui/panel-palette.test.ts`
- `property` — in 4 files: `tests/`
- `provocation` — in 4 files: `tests/`
- `provokedCount` — `tests/ui/panel-words.test.ts`
- `provokedId` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `purities` — `tests/repository/name-register.test.ts`, `tests/repository/purity.test.ts`
- `rankingRow` — `tests/ui/panel-content.test.ts`
- `reach` — `tests/repository/name-shapes.test.ts`, `tests/tools/aura-standing.test.ts`
- `reached` — `tests/fake-window.ts`
- `readerId` — `tests/runtime/shelf.test.ts`
- `readerSide` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/share-column.test.ts`
- `reading` — in 8 files: `tests/`
- `reason` — `tests/tools/fabricated-fight.test.ts`, `tests/tools/protocol-key-shape.test.ts`,
  `tests/tools/recorded-material.test.ts`
- `receiverId` — `tests/ui/panel-content.test.ts`
- `record` — in 4 files: `tests/`
- `recorded` — `tests/core/fight-figures.test.ts`, `tests/recorded-fights.ts`
- `recordedFight` — `tests/ui/level-drawn.test.ts`, `tests/ui/share-column.test.ts`
- `recording` — `tests/e2e/panel-fixture.ts`, `tests/ports/fight-capture.test.ts`
- `recordingFile` — `tests/recorded-fights.ts`, `tests/repository/fabricated-fights.test.ts`
- `region` — in 5 files: `tests/`
- `regionUndrawn` — `tests/ui/view-failure.test.ts`
- `register` — `tests/repository/browser-support.test.ts`, `tests/tools/aura-lifetime.test.ts`
- `registerRow` — `tests/tools/drill-report.test.ts`, `tests/tools/turn-count.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `registeredKey` — `tests/repository/protocol-keys.test.ts`,
  `tests/tools/fabricated-fight.test.ts`, `tests/tools/protocol-key-shape.test.ts`
- `registries` — `tests/rebuilding-battle.ts`
- `registry` — `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/runtime/carried-tooltip.test.ts`
- `renamed` — `tests/runtime/fight-file.test.ts`
- `replacement` — `tests/fake-document.ts`
- `replayed` — `tests/ports/recorded-session.test.ts`, `tests/tools/drill-report.test.ts`
- `report` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `response` — `tests/tools/preview-server.test.ts`
- `rest` — `tests/runtime/shelf.test.ts`
- `right` — in 12 files: `tests/`
- `root` — `tests/fake-document.ts`, `tests/repository/cited-paths.test.ts`,
  `tests/repository/comment-share.test.ts`
- `rootDirectory` — `tests/e2e/build-once.ts`, `tests/e2e/panel-page.ts`
- `roster` — in 5 files: `tests/`
- `route` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-fixture.ts`
- `row` — in 21 files: `tests/`
- `rowIndex` — `tests/tools/skill-table.test.ts`, `tests/ui/panel-element.test.ts`
- `rowKey` — `tests/tools/turn-reading.test.ts`
- `rowPoints` — `tests/ui/panel-content.test.ts`
- `rowSelector` — `tests/e2e/panel-card.spec.ts`
- `rows` — in 5 files: `tests/`
- `rule` — `tests/repository/documents.test.ts`, `tests/ui/panel-look.test.ts`
- `rules` — `tests/repository/name-shapes.test.ts`, `tests/ui/panel-look.test.ts`,
  `tests/verb-purities.ts`
- `rung` — `tests/ui/level-drawn.test.ts`
- `running` — `tests/core/last-heal-rule.test.ts`
- `said` — in 4 files: `tests/`
- `saids` — `tests/ui/panel-words.test.ts`
- `sample` — `tests/ui/panel-look.test.ts`
- `savedIndex` — `tests/runtime/margometer-runtime.test.ts`
- `screen` — `tests/runtime/panel-frame.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-screen.test.ts`
- `script` — `tests/e2e/panel-fixture.ts`, `tests/repository/name-register.test.ts`
- `second` — `tests/runtime/margometer-runtime.test.ts`
- `secondBox` — `tests/e2e/panel-helper.spec.ts`
- `section` — in 4 files: `tests/`
- `seed` — `tests/simulation.test.ts`
- `seen` — `tests/runtime/margonem-engine-search.test.ts`, `tests/ui/level-drawn.test.ts`
- `selector` — in 8 files: `tests/`
- `serveWithNoFightFed` — `tests/e2e/panel-fixture.ts`
- `served` — `tests/e2e/panel-camera.ts`
- `session` — `tests/core/fight-session.test.ts`, `tests/ports/recorded-session.test.ts`
- `settle` — `tests/e2e/panel-page.ts`
- `settledEntry` — `tests/repository/browser-support.test.ts`
- `shadowChild` — `tests/ui/view-failure.test.ts`
- `shape` — `tests/repository/captured-fight-register.test.ts`,
  `tests/tools/protocol-key-shape.test.ts`
- `share` — `tests/ui/panel-content.test.ts`
- `sheet` — in 5 files: `tests/`
- `shelfRow` — `tests/runtime/panel-frame.test.ts`
- `shelfStore` — `tests/runtime/live-fight.test.ts`
- `shot` — `tests/repository/readmes.test.ts`, `tests/tools/panel-shots.test.ts`
- `shout` — `tests/repository/skill-durations.test.ts`, `tests/tools/aura-standing.test.ts`,
  `tests/tools/shout-holding.test.ts`
- `shouted` — `tests/core/aura-standing.test.ts`
- `shouts` — `tests/core/aura-standing.test.ts`
- `shown` — `tests/tools/preview-state.test.ts`, `tests/ui/full-cast-bound.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `side` — in 8 files: `tests/`
- `sideRelation` — `tests/ui/panel-card.test.ts`
- `sighting` — `tests/repository/name-register.test.ts`
- `sightings` — `tests/repository/name-register.test.ts`
- `skill` — `tests/repository/skill-durations.test.ts`, `tests/tools/aura-standing.test.ts`,
  `tests/tools/skill-table.test.ts`
- `skillId` — `tests/core/aura-standing.test.ts`
- `skillIndex` — `tests/core/aura-standing.test.ts`
- `skillName` — `tests/core/charged-skill.test.ts`
- `skillRow` — in 4 files: `tests/`
- `skills` — `tests/core/aura-standing.test.ts`
- `snapshot` — `tests/recorded-fights.ts`
- `source` — in 7 files: `tests/`
- `span` — `tests/repository/cited-paths.test.ts`
- `spent` — `tests/repository/design-tokens.test.ts`
- `stackedElement` — `tests/e2e/panel-helper.spec.ts`
- `standIn` — `tests/e2e/panel-layer.spec.ts`
- `standing` — in 6 files: `tests/`
- `start` — `tests/repository/browser-globals.test.ts`, `tests/repository/browser-support.test.ts`,
  `tests/repository/control-flow.test.ts`
- `state` — `tests/ui/helper-window.test.ts`
- `stated` — in 6 files: `tests/`
- `statement` — in 5 files: `tests/`
- `statistics` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`
- `status` — `tests/core/carried-status.test.ts`, `tests/core/fight-session.test.ts`
- `statusClearsAtRound` — `tests/tools/fabricated-fight.test.ts`
- `statusMask` — `tests/tools/fabricated-fight.test.ts`
- `stem` — `tests/repository/names.test.ts`
- `step` — in 11 files: `tests/`
- `store` — `tests/runtime/shelf.test.ts`
- `stored` — in 6 files: `tests/`
- `storedText` — `tests/fake-window.ts`, `tests/runtime-world.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `strings` — `tests/repository/name-register.test.ts`
- `strip` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-screen.test.ts`
- `strong` — `tests/repository/called-once.test.ts`
- `styled` — `tests/runtime/margometer-runtime.test.ts`
- `subject` — `tests/runtime/fight-file.test.ts`
- `suiteKeys` — `tests/repository/browser-suite-keys.test.ts`
- `sum` — in 16 files: `tests/`
- `surrounded` — `tests/repository/handed-callbacks.test.ts`
- `suspicion` — `tests/runtime/margometer-runtime.test.ts`
- `suspicions` — `tests/ui/panel-element.test.ts`
- `tables` — in 4 files: `tests/`
- `tag` — `tests/fake-document.ts`, `tests/fake-window.ts`, `tests/ui/view-failure.test.ts`
- `tally` — `tests/core/fight-decoder.test.ts`
- `target` — `tests/fake-document.ts`, `tests/runtime-world.ts`
- `targetId` — `tests/core/aura-standing.test.ts`, `tests/core/charged-skill.test.ts`,
  `tests/core/legendary-standing.test.ts`
- `task` — `tests/repository/name-register.test.ts`
- `team` — `tests/runtime/margometer-runtime.test.ts`
- `term` — `tests/ui/panel-look.test.ts`
- `text` — in 36 files: `tests/`
- `texts` — `tests/ui/panel-words.test.ts`
- `theirs` — `tests/core/aura-standing.test.ts`
- `this` — `tests/ports/margonem-engine-battle.test.ts`
- `thisArg` — `tests/ports/margonem-engine-battle.test.ts`
- `throwStatement` — `tests/repository/throws.test.ts`
- `thrown` — `tests/e2e/panel-fixture.ts`
- `tick` — `tests/core/injure-rule.test.ts`
- `tickValue` — `tests/core/injure-rule.test.ts`
- `tier` — `tests/repository/browser-support.test.ts`
- `times` — `tests/runtime/margometer-runtime.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `timestampText` — `tests/ports/browser-clock.test.ts`
- `to` — `tests/core/last-heal-rule.test.ts`
- `token` — `tests/ui/panel-look.test.ts`
- `tokens` — `tests/repository/design-tokens.test.ts`
- `tone` — `tests/ui/card-window.test.ts`
- `topItem` — `tests/repository/declaration-order.test.ts`
- `total` — `tests/ui/share-column.test.ts`
- `tracked` — `tests/repository/name-register.test.ts`
- `translate` — `tests/ui/panel-card.test.ts`
- `tree` — `tests/repository/name-register.test.ts`
- `trimmed` — `tests/core/aura-standing.test.ts`, `tests/repository/workflows.test.ts`
- `turns` — `tests/core/aura-standing.test.ts`, `tests/tools/turn-count.test.ts`
- `turnsByCombatantId` — `tests/core/carried-figure.test.ts`
- `turnsElapsed` — `tests/core/charged-skill.test.ts`, `tests/ui/panel-words.test.ts`
- `turnsStated` — `tests/core/charged-skill.test.ts`
- `type` — in 5 files: `tests/`
- `unnamedNote` — `tests/ui/panel-card.test.ts`
- `update` — `tests/ports/recorded-session.test.ts`
- `updates` — `tests/simulation.ts`
- `url` — `tests/ports/browser-file.test.ts`
- `use` — `tests/e2e/panel-fixture.ts`
- `valueText` — `tests/repository/browser-support.test.ts`
- `values` — `tests/fake-window.ts`, `tests/ports/browser-console.test.ts`,
  `tests/ui/panel-look.test.ts`
- `variable` — `tests/e2e/panel-options.spec.ts`
- `verb` — `tests/repository/called-once.test.ts`, `tests/repository/name-register.test.ts`
- `verbs` — `tests/repository/event-entries.test.ts`
- `version` — `tests/e2e/panel-fixture.ts`, `tests/repository/browser-support.test.ts`
- `versionLabel` — `tests/e2e/panel-options.spec.ts`
- `view` — `tests/ports/recorded-session.test.ts`, `tests/tools/panel-shots.test.ts`
- `visit` — `tests/ports/recorded-session.test.ts`
- `visitedNode` — `tests/source-tree.ts`
- `vocabularies` — `tests/repository/name-register.test.ts`
- `vocabulary` — `tests/repository/name-register.test.ts`
- `waiting` — `tests/runtime/panel-frame.test.ts`
- `walk` — `tests/core/carried-status.test.ts`, `tests/core/legendary-standing.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `warrior` — in 6 files: `tests/`
- `warriorEntry` — `tests/ports/warrior-entries.test.ts`
- `warriors` — `tests/ports/margonem-engine-tooltip.test.ts`
- `went` — `tests/fake-document.ts`
- `where` — `tests/e2e/panel-fixture.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/share-column.test.ts`
- `wholeFile` — `tests/repository/browser-globals.test.ts`
- `width` — `tests/tools/turn-reading.test.ts`
- `widthPixels` — `tests/ui/panel-drag.test.ts`
- `window` — `tests/fake-window.ts`, `tests/simulation.ts`, `tests/userscript-entry.test.ts`
- `windowLayer` — `tests/e2e/panel-layer.spec.ts`
- `windowLeft` — `tests/ui/panel-drag.test.ts`
- `windowSelector` — `tests/e2e/panel-card.spec.ts`
- `windowWidth` — `tests/ui/panel-drag.test.ts`
- `within` — `tests/runtime/margometer-runtime.test.ts`
- `word` — in 4 files: `tests/`
- `worded` — `tests/ui/panel-palette.test.ts`, `tests/ui/panel-words.test.ts`
- `words` — `tests/ui/panel-element.test.ts`
- `workerInfo` — `tests/e2e/panel-fixture.ts`
- `world` — `tests/runtime-world.ts`, `tests/runtime/margometer-runtime.test.ts`
- `wrap` — `tests/runtime/margonem-engine-search.test.ts`
- `written` — `tests/repository/name-register.test.ts`
- `x` — `tests/e2e/panel-layer.spec.ts`, `tests/e2e/panel-probe.ts`,
  `tests/ports/margonem-engine-place.test.ts`
- `y` — `tests/e2e/panel-probe.ts`, `tests/ports/margonem-engine-place.test.ts`

## Fields

### `libs/`

- `cause` — `libs/errors.ts`, `libs/json-text.ts`
- `character` — `libs/html-text.ts`
- `count` — `libs/unknown-value.ts`
- `end` — `libs/html-text.ts`, `libs/text-walk.ts`
- `expected` — `libs/unknown-value.ts`
- `field` — `libs/unknown-value.ts`
- `list` — `libs/unknown-value.ts`
- `maximum` — `libs/text-walk.ts`, `libs/unknown-value.ts`
- `name` — in 5 files: `libs/`
- `number` — `libs/unknown-value.ts`
- `record` — `libs/unknown-value.ts`
- `statedText` — `libs/unknown-value.ts`
- `text` — `libs/text-walk.ts`, `libs/unknown-value.ts`

### `src/core/`

- `absorbed` — `src/core/fight-statistics.ts`
- `absorbedParts` — `src/core/fight-statistics.ts`
- `actor` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `actorHealthPercent` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `actorId` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `amount` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `amountByKey` — `src/core/aura-standing.ts`
- `announced` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `announcedStrikerId` — `src/core/turn-clock.ts`
- `announcement` — `src/core/fight-decoder.ts`
- `announcementStanding` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `applied` — in 4 files: `src/core/`
- `attack` — `src/core/battle-event.ts`
- `auraTurnsBySkillId` — `src/core/aura-standing.ts`
- `auras` — `src/core/aura-standing.ts`
- `bit` — `src/core/carried-figure.ts`, `src/core/carried-status.ts`
- `blows` — `src/core/fight-statistics.ts`
- `blowsCritical` — `src/core/fight-statistics.ts`
- `blowsGrantedBySkillId` — `src/core/fight-decoder.ts`
- `blowsGrantedMinimum` — `src/core/fight-decoder.ts`
- `blowsRemaining` — `src/core/fight-decoder.ts`
- `blowsStruck` — `src/core/fight-statistics.ts`
- `blowsWithoutSkill` — `src/core/fight-statistics.ts`
- `bothSides` — `src/core/aura-standing.ts`
- `broken` — `src/core/charged-skill.ts`
- `byCombatantId` — `src/core/fight-statistics.ts`
- `byHolderId` — `src/core/legendary-standing.ts`
- `byId` — `src/core/combatant-roster.ts`
- `byReachedId` — `src/core/legendary-standing.ts`
- `carriedStatusWalk` — `src/core/fight-session.ts`
- `carriedStatuses` — `src/core/fight-session.ts`
- `cast` — `src/core/aura-standing.ts`
- `castByCasterAndSkill` — `src/core/aura-standing.ts`
- `casterId` — `src/core/aura-standing.ts`, `src/core/combatant-health.ts`
- `castersSide` — `src/core/protocol-key.ts`
- `casts` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`
- `cause` — `src/core/fight-decoder.ts`
- `chance` — `src/core/protocol-key.ts`
- `charge` — `src/core/charged-skill.ts`
- `chargeStatements` — `src/core/fight-session.ts`
- `chargedSkills` — `src/core/fight-session.ts`
- `charging` — `src/core/charged-skill.ts`
- `combatantId` — in 7 files: `src/core/`
- `combatantIds` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `combatantNames` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `combatants` — `src/core/fight-session.ts`
- `combatantsMaximum` — `src/core/fight-session.ts`
- `count` — `src/core/fight-session.ts`
- `coverageMinimum` — `src/core/aura-standing.ts`
- `customSkillName` — `src/core/protocol-key.ts`
- `cutKeys` — `src/core/fight-session.ts`
- `damage` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `damageByNeitherEnd` — `src/core/fight-statistics.ts`
- `damageByNeitherEndByKind` — `src/core/fight-statistics.ts`
- `damageDealt` — `src/core/fight-statistics.ts`
- `damageDealtAbsorbed` — `src/core/fight-statistics.ts`
- `damageDealtAbsorbedByDefence` — `src/core/fight-statistics.ts`
- `damageDealtApplied` — `src/core/fight-statistics.ts`
- `damageDealtBlowLargest` — `src/core/fight-statistics.ts`
- `damageDealtByKind` — `src/core/fight-statistics.ts`
- `damageDealtByNobody` — `src/core/fight-statistics.ts`
- `damageDealtByOpponent` — `src/core/fight-statistics.ts`
- `damageDealtByOpponentAndKind` — `src/core/fight-statistics.ts`
- `damageDealtRaw` — `src/core/fight-statistics.ts`
- `damageDealtToNobody` — `src/core/fight-statistics.ts`
- `damageDealtToNobodyByKind` — `src/core/fight-statistics.ts`
- `damageDealtWithoutSkillByKey` — `src/core/fight-statistics.ts`
- `damageDealtWithoutSkillByOpponent` — `src/core/fight-statistics.ts`
- `damageDealtWithoutSkillByOpponentAndKey` — `src/core/fight-statistics.ts`
- `damagePrevented` — `src/core/fight-statistics.ts`
- `damagePreventedByDefence` — `src/core/fight-statistics.ts`
- `damageTaken` — `src/core/fight-statistics.ts`
- `damageTakenAbsorbed` — `src/core/fight-statistics.ts`
- `damageTakenAbsorbedByDefence` — `src/core/fight-statistics.ts`
- `damageTakenApplied` — `src/core/fight-statistics.ts`
- `damageTakenBlowLargest` — `src/core/fight-statistics.ts`
- `damageTakenByKind` — `src/core/fight-statistics.ts`
- `damageTakenByNobody` — `src/core/fight-statistics.ts`
- `damageTakenByOpponent` — `src/core/fight-statistics.ts`
- `damageTakenByOpponentAndKind` — `src/core/fight-statistics.ts`
- `damageTakenFromNobody` — `src/core/fight-statistics.ts`
- `damageTakenFromNobodyByKind` — `src/core/fight-statistics.ts`
- `damageTakenRaw` — `src/core/fight-statistics.ts`
- `damageTakenWithoutSkillByKey` — `src/core/fight-statistics.ts`
- `damageTakenWithoutSkillByOpponent` — `src/core/fight-statistics.ts`
- `damageToNamedCombatant` — `src/core/battle-event.ts`
- `declaration` — `src/core/battle-event.ts`, `src/core/protocol-key.ts`
- `declared` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `declaredShare` — `src/core/battle-event.ts`, `src/core/combatant-health.ts`,
  `src/core/fight-decoder.ts`
- `decoded` — `src/core/fight-session.ts`
- `defence` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `destroyed` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `doesReachOtherEnd` — `src/core/protocol-key.ts`
- `doesTakeValue` — `src/core/protocol-key.ts`
- `drawn` — `src/core/battle-event.ts`
- `effect` — `src/core/aura-standing.ts`, `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `element` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `elementsAbsorbed` — `src/core/protocol-key.ts`
- `end` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `endedAtOrdinal` — `src/core/charged-skill.ts`
- `events` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `eventsAdded` — `src/core/fight-session.ts`
- `eventsAtSeatingByCombatantId` — `src/core/fight-session.ts`
- `eventsMaximum` — `src/core/fight-session.ts`
- `fightOutcome` — `src/core/battle-event.ts`
- `fired` — `src/core/protocol-key.ts`
- `fled` — `src/core/battle-event.ts`, `src/core/protocol-key.ts`
- `grammarRefused` — `src/core/battle-event.ts`
- `half` — `src/core/protocol-key.ts`
- `hasClosed` — `src/core/fight-session.ts`
- `hasJoinedInProgress` — `src/core/fight-session.ts`
- `hasOpened` — `src/core/fight-session.ts`
- `hasSpentLastheal` — `src/core/legendary-standing.ts`
- `healingToNamedCombatant` — `src/core/battle-event.ts`
- `healthChange` — `src/core/battle-event.ts`, `src/core/protocol-key.ts`
- `healthChanges` — `src/core/fight-decoder.ts`
- `healthGiven` — `src/core/fight-statistics.ts`
- `healthGivenByNobody` — `src/core/fight-statistics.ts`
- `healthGivenByReceiver` — `src/core/fight-statistics.ts`
- `healthGivenWithoutSkillByReceiverAndKey` — `src/core/fight-statistics.ts`
- `healthMaximum` — `src/core/combatant-roster.ts`
- `healthPercent` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `healthRestored` — `src/core/fight-statistics.ts`
- `healthRestoredByGiver` — `src/core/fight-statistics.ts`
- `healthRestoredByKey` — `src/core/fight-statistics.ts`
- `healthRestoredByNobody` — `src/core/fight-statistics.ts`
- `healthRestoredByNobodyByKey` — `src/core/fight-statistics.ts`
- `healthRestoredToNobody` — `src/core/fight-statistics.ts`
- `healthRestoredWithoutSkillByKey` — `src/core/fight-statistics.ts`
- `held` — `src/core/protocol-key.ts`
- `holytouchHealsByBearerId` — `src/core/legendary-standing.ts`
- `holytouchHealsReceived` — `src/core/legendary-standing.ts`
- `id` — `src/core/aura-standing.ts`, `src/core/combatant-roster.ts`, `src/core/fight-decoder.ts`
- `idByName` — `src/core/combatant-roster.ts`
- `index` — `src/core/fight-decoder.ts`
- `isDrawn` — `src/core/fight-statistics.ts`
- `isEnd` — `src/core/fight-session.ts`
- `isFled` — `src/core/fight-statistics.ts`
- `isGlued` — `src/core/fight-decoder.ts`
- `isInit` — `src/core/fight-session.ts`
- `isOnAuto` — `src/core/fight-session.ts`
- `isOnTarget` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `isOpening` — `src/core/fight-session.ts`
- `isOver` — `src/core/fight-session.ts`
- `isWhole` — `src/core/combatant-health.ts`
- `key` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`
- `keyByStatusBit` — `src/core/carried-figure.ts`
- `keys` — `src/core/fight-decoder.ts`
- `kind` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `kinds` — `src/core/fight-statistics.ts`
- `lastActorId` — `src/core/turn-clock.ts`
- `lastHealSpentCombatantIds` — `src/core/legendary-standing.ts`
- `legendaryBonuses` — `src/core/fight-statistics.ts`
- `legendaryStandings` — `src/core/fight-session.ts`
- `legendaryWalk` — `src/core/fight-session.ts`
- `level` — `src/core/combatant-roster.ts`
- `lightingTurnByBitByCombatantId` — `src/core/carried-status.ts`
- `lost` — `src/core/battle-event.ts`
- `lostNames` — `src/core/fight-statistics.ts`
- `maximum` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `mechanism` — `src/core/protocol-key.ts`
- `message` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `messages` — `src/core/fight-session.ts`
- `messagesLost` — `src/core/fight-session.ts`
- `messagesRead` — `src/core/fight-session.ts`
- `messagesStated` — `src/core/fight-session.ts`
- `name` — in 4 files: `src/core/`
- `namedCombatantIds` — `src/core/fight-session.ts`
- `namedDamage` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `namedHealing` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `names` — `src/core/aura-standing.ts`
- `noParameter` — `src/core/battle-event.ts`
- `options` — `src/core/fight-session.ts`
- `ordinal` — `src/core/fight-session.ts`
- `otherSide` — `src/core/protocol-key.ts`
- `outcome` — `src/core/fight-statistics.ts`, `src/core/protocol-key.ts`
- `outcomes` — `src/core/fight-decoder.ts`
- `over` — `src/core/fight-session.ts`
- `parameters` — `src/core/fight-decoder.ts`
- `payloadIndex` — `src/core/fight-session.ts`
- `payloadsApplied` — `src/core/fight-figures.ts`, `src/core/fight-session.ts`
- `payloadsMaximum` — `src/core/fight-session.ts`
- `percent` — `src/core/carried-figure.ts`
- `pool` — `src/core/protocol-key.ts`
- `prevented` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `preventedParts` — `src/core/fight-statistics.ts`
- `proc` — `src/core/protocol-key.ts`
- `procs` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `procsWhenStriking` — `src/core/fight-statistics.ts`
- `procsWhenStruck` — `src/core/fight-statistics.ts`
- `profession` — `src/core/combatant-roster.ts`
- `provocations` — `src/core/aura-standing.ts`
- `provokedId` — `src/core/aura-standing.ts`
- `raw` — in 4 files: `src/core/`
- `reach` — `src/core/aura-standing.ts`
- `readerSide` — `src/core/fight-session.ts`
- `restoredByCombatantId` — `src/core/combatant-health.ts`
- `result` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `roster` — `src/core/carried-figure.ts`, `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `segments` — `src/core/fight-decoder.ts`
- `shout` — `src/core/aura-standing.ts`
- `shoutByProvokedId` — `src/core/aura-standing.ts`
- `shoutTargetId` — `src/core/aura-standing.ts`
- `shoutsBySkillId` — `src/core/aura-standing.ts`
- `showing` — `src/core/protocol-key.ts`
- `side` — `src/core/carried-figure.ts`, `src/core/combatant-roster.ts`
- `sideHealByEvent` — `src/core/fight-figures.ts`
- `sideHealsStated` — `src/core/fight-statistics.ts`
- `sideHealsUnsized` — `src/core/fight-statistics.ts`
- `sign` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `skillId` — in 4 files: `src/core/`
- `skillKeysRead` — `src/core/fight-decoder.ts`
- `skillName` — in 5 files: `src/core/`
- `skillNames` — `src/core/fight-session.ts`
- `skillUsed` — `src/core/battle-event.ts`
- `skills` — `src/core/fight-statistics.ts`
- `source` — in 4 files: `src/core/`
- `standing` — `src/core/fight-statistics.ts`
- `state` — `src/core/charged-skill.ts`, `src/core/fight-session.ts`
- `stateAfter` — `src/core/fight-session.ts`
- `statistic` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `statistics` — `src/core/fight-figures.ts`
- `statisticsDestroyed` — `src/core/fight-statistics.ts`
- `statusMasksByCombatantId` — `src/core/fight-session.ts`
- `statuses` — `src/core/carried-figure.ts`
- `struck` — `src/core/charged-skill.ts`
- `tables` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `target` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `targetHealthPercent` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `targetId` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `targetName` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `text` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `totals` — `src/core/fight-statistics.ts`
- `turnLost` — `src/core/battle-event.ts`
- `turnStanding` — `src/core/carried-status.ts`, `src/core/fight-statistics.ts`
- `turnStatement` — `src/core/fight-session.ts`
- `turns` — `src/core/aura-standing.ts`
- `turnsAtCast` — `src/core/aura-standing.ts`
- `turnsAtCastByCombatantId` — `src/core/aura-standing.ts`
- `turnsAtShout` — `src/core/aura-standing.ts`
- `turnsByCombatantId` — in 4 files: `src/core/`
- `turnsElapsed` — `src/core/aura-standing.ts`, `src/core/carried-status.ts`,
  `src/core/charged-skill.ts`
- `turnsLost` — `src/core/fight-statistics.ts`
- `turnsStated` — `src/core/aura-standing.ts`, `src/core/charged-skill.ts`
- `turnsTaken` — `src/core/carried-figure.ts`, `src/core/fight-statistics.ts`
- `unaccountedHealth` — `src/core/battle-event.ts`, `src/core/protocol-key.ts`
- `unaccountedShares` — `src/core/fight-decoder.ts`
- `underway` — `src/core/fight-session.ts`
- `unknownKey` — `src/core/battle-event.ts`
- `unknownMessage` — `src/core/battle-event.ts`
- `unread` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `unreadAdded` — `src/core/fight-session.ts`
- `unreadCause` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `unreadKeys` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `unreadMessagesGrammarRefused` — `src/core/fight-statistics.ts`
- `unreadMessagesNoParameter` — `src/core/fight-statistics.ts`
- `unreadMessagesUnknownKey` — `src/core/fight-statistics.ts`
- `unsettled` — `src/core/protocol-key.ts`
- `uses` — `src/core/fight-statistics.ts`
- `value` — `src/core/fight-decoder.ts`
- `valuelessDeclaration` — `src/core/protocol-key.ts`
- `waiting` — `src/core/fight-session.ts`
- `won` — `src/core/battle-event.ts`
- `wonNames` — `src/core/fight-statistics.ts`
- `woundByWoundedId` — `src/core/fight-statistics.ts`
- `woundedId` — `src/core/fight-statistics.ts`

### `src/ports/`

- `ac` — `src/ports/margonem-engine-warriors.ts`
- `answer` — `src/ports/margonem-engine-battle.ts`
- `blockLeft` — `src/ports/margonem-engine-tooltip.ts`
- `build` — `src/ports/margonem-value.ts`
- `buildEnd` — `src/ports/margonem-client-build.ts`
- `buildStart` — `src/ports/margonem-client-build.ts`
- `call` — `src/ports/fight-capture.ts`
- `callIndex` — `src/ports/fight-capture.ts`
- `calls` — `src/ports/fight-capture.ts`
- `cause` — `src/ports/browser-store.ts`, `src/ports/margonem-engine-battle.ts`,
  `src/ports/payload-envelope.ts`
- `charge` — `src/ports/payload-envelope.ts`
- `chargeStatements` — `src/ports/payload-envelope.ts`
- `className` — `src/ports/browser-file.ts`
- `combatantId` — `src/ports/payload-envelope.ts`
- `combatants` — `src/ports/payload-envelope.ts`
- `combatantsAfter` — `src/ports/fight-capture.ts`
- `combatantsBefore` — `src/ports/fight-capture.ts`
- `composed` — `src/ports/margonem-engine-tooltip.ts`
- `count` — `src/ports/margonem-engine-battle.ts`, `src/ports/margonem-engine-warriors.ts`,
  `src/ports/payload-envelope.ts`
- `data` — `src/ports/margonem-engine-battle.ts`
- `day` — `src/ports/browser-time.ts`
- `download` — `src/ports/browser-file.ts`
- `droppedCalls` — `src/ports/fight-capture.ts`
- `energy` — `src/ports/margonem-engine-warriors.ts`
- `field` — `src/ports/payload-envelope.ts`
- `fights` — `src/ports/browser-store.ts`
- `first` — `src/ports/margonem-engine-battle.ts`
- `hasEngine` — `src/ports/margonem-engine-battle.ts`
- `health` — `src/ports/payload-envelope.ts`
- `healthMaximum` — `src/ports/payload-envelope.ts`
- `held` — `src/ports/margonem-engine-tooltip.ts`
- `helperFolded` — `src/ports/browser-store.ts`
- `helperPosition` — `src/ports/browser-store.ts`
- `helperSize` — `src/ports/browser-store.ts`
- `hero` — `src/ports/margonem-engine-battle.ts`, `src/ports/margonem-value.ts`
- `hour` — `src/ports/browser-time.ts`
- `hp` — `src/ports/margonem-engine-warriors.ts`
- `href` — `src/ports/browser-file.ts`
- `id` — `src/ports/margonem-engine-hero.ts`, `src/ports/margonem-engine-warriors.ts`,
  `src/ports/payload-envelope.ts`
- `index` — `src/ports/fight-capture.ts`
- `isEnd` — `src/ports/payload-envelope.ts`
- `isInit` — `src/ports/payload-envelope.ts`
- `isOnAuto` — `src/ports/payload-envelope.ts`
- `isOpening` — `src/ports/fight-capture.ts`
- `isPastCeiling` — `src/ports/fight-capture.ts`
- `isTruncated` — `src/ports/fight-capture.ts`
- `kept` — `src/ports/fight-capture.ts`, `src/ports/margonem-engine-tooltip.ts`
- `key` — `src/ports/payload-envelope.ts`
- `label` — `src/ports/margonem-value.ts`
- `landing` — `src/ports/margonem-engine-tooltip.ts`
- `length` — `src/ports/browser-store.ts`
- `level` — `src/ports/payload-envelope.ts`
- `looks` — `src/ports/margonem-engine-battle.ts`
- `lvl` — `src/ports/margonem-engine-warriors.ts`
- `mana` — `src/ports/margonem-engine-warriors.ts`
- `map` — `src/ports/margonem-engine-battle.ts`
- `mapName` — `src/ports/fight-place.ts`, `src/ports/margonem-engine-place.ts`
- `maximum` — in 5 files: `src/ports/`
- `messages` — `src/ports/fight-capture.ts`, `src/ports/payload-envelope.ts`
- `messagesStated` — `src/ports/payload-envelope.ts`
- `meterFolded` — `src/ports/browser-store.ts`
- `meterPosition` — `src/ports/browser-store.ts`
- `meterSize` — `src/ports/browser-store.ts`
- `minute` — `src/ports/browser-time.ts`
- `month` — `src/ports/browser-time.ts`
- `name` — in 7 files: `src/ports/`
- `nameStart` — `src/ports/margonem-client-build.ts`
- `now` — `src/ports/payload-envelope.ts`
- `off` — `src/ports/margonem-engine-tooltip.ts`
- `on` — `src/ports/margonem-engine-tooltip.ts`
- `ordinal` — `src/ports/payload-envelope.ts`
- `payload` — `src/ports/fight-capture.ts`
- `place` — `src/ports/margonem-value.ts`
- `prof` — `src/ports/margonem-engine-warriors.ts`
- `profession` — `src/ports/payload-envelope.ts`
- `readerSide` — `src/ports/payload-envelope.ts`
- `reading` — `src/ports/margonem-value.ts`
- `refused` — `src/ports/margonem-engine-tooltip.ts`
- `shape` — `src/ports/fight-capture.ts`
- `shapesSeen` — `src/ports/fight-capture.ts`
- `side` — `src/ports/payload-envelope.ts`
- `skillName` — `src/ports/payload-envelope.ts`
- `state` — `src/ports/fight-capture.ts`
- `statesSeen` — `src/ports/fight-capture.ts`
- `statusMasksByCombatantId` — `src/ports/payload-envelope.ts`
- `statuses` — `src/ports/payload-envelope.ts`
- `storage` — `src/ports/browser-store.ts`
- `team` — `src/ports/margonem-engine-warriors.ts`
- `turnStatement` — `src/ports/payload-envelope.ts`
- `turnsElapsed` — `src/ports/payload-envelope.ts`
- `turnsStated` — `src/ports/payload-envelope.ts`
- `typeStep` — `src/ports/browser-store.ts`
- `wasRefused` — `src/ports/fight-capture.ts`
- `written` — `src/ports/margonem-engine-tooltip.ts`
- `x` — `src/ports/fight-place.ts`, `src/ports/margonem-engine-place.ts`
- `y` — `src/ports/fight-place.ts`, `src/ports/margonem-engine-place.ts`

### `src/runtime/`

- `CaptureCallsExceeded` — `src/runtime/failure-fate.ts`
- `Caught` — `src/runtime/failure-fate.ts`
- `CombatantsExceeded` — `src/runtime/failure-fate.ts`
- `CutKeysExceeded` — `src/runtime/failure-fate.ts`
- `EventsExceeded` — `src/runtime/failure-fate.ts`
- `EverySlotPinned` — `src/runtime/failure-fate.ts`
- `FightAlreadyKept` — `src/runtime/failure-fate.ts`
- `FiguresDisagreed` — `src/runtime/failure-fate.ts`
- `FileApiAbsent` — `src/runtime/failure-fate.ts`
- `FileUnserializable` — `src/runtime/failure-fate.ts`
- `GestureDropped` — `src/runtime/failure-fate.ts`
- `KeptFightsUnreadable` — `src/runtime/failure-fate.ts`
- `MargonemEngineAbsent` — `src/runtime/failure-fate.ts`
- `MargonemEngineAlreadyWrapped` — `src/runtime/failure-fate.ts`
- `MargonemEngineBattleAbsent` — `src/runtime/failure-fate.ts`
- `MargonemEngineMethodAbsent` — `src/runtime/failure-fate.ts`
- `MargonemEngineMethodUnwritable` — `src/runtime/failure-fate.ts`
- `MargonemEngineTooltipRefused` — `src/runtime/failure-fate.ts`
- `MargonemEngineWarriorsAbsent` — `src/runtime/failure-fate.ts`
- `MargonemEngineWarriorsExceeded` — `src/runtime/failure-fate.ts`
- `MargonemValueAbsent` — `src/runtime/failure-fate.ts`
- `PayloadCombatantRepeated` — `src/runtime/failure-fate.ts`
- `PayloadFieldMalformed` — `src/runtime/failure-fate.ts`
- `PayloadFieldTooLong` — `src/runtime/failure-fate.ts`
- `PayloadNotRecord` — `src/runtime/failure-fate.ts`
- `PayloadsExceeded` — `src/runtime/failure-fate.ts`
- `RegionUndrawn` — `src/runtime/failure-fate.ts`
- `RotationRefused` — `src/runtime/failure-fate.ts`
- `SearchAbandoned` — `src/runtime/failure-fate.ts`
- `SettingTooLong` — `src/runtime/failure-fate.ts`
- `SettingUnreadable` — `src/runtime/failure-fate.ts`
- `ShelfUnreadable` — `src/runtime/failure-fate.ts`
- `ShelfUnwritable` — `src/runtime/failure-fate.ts`
- `ShelfVersionUnknown` — `src/runtime/failure-fate.ts`
- `ShownFightAbsent` — `src/runtime/failure-fate.ts`
- `SkillsExceeded` — `src/runtime/failure-fate.ts`
- `StoreRefused` — `src/runtime/failure-fate.ts`
- `StoreUnavailable` — `src/runtime/failure-fate.ts`
- `StoreValueTooLong` — `src/runtime/failure-fate.ts`
- `UnreadMessage` — `src/runtime/failure-fate.ts`
- `WindowUnplaced` — `src/runtime/failure-fate.ts`
- `WrapCovered` — `src/runtime/failure-fate.ts`
- `addOnVersion` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/margometer-runtime.ts`
- `answers` — `src/runtime/panel-frame.ts`, `src/runtime/shelf-keeper.ts`
- `at` — `src/runtime/panel-frame.ts`
- `attempts` — `src/runtime/shelf.ts`
- `battle` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `bit` — `src/runtime/carried-tooltip.ts`
- `blows` — `src/runtime/fight-file.ts`
- `blowsCritical` — `src/runtime/fight-file.ts`
- `blowsStruck` — `src/runtime/fight-file.ts`
- `blowsWithoutSkill` — `src/runtime/fight-file.ts`
- `build` — `src/runtime/fight-handover.ts`, `src/runtime/live-fight.ts`,
  `src/runtime/margometer-runtime.ts`
- `byPlace` — `src/runtime/failure-fate.ts`
- `calls` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `capture` — `src/runtime/fight-handover.ts`, `src/runtime/live-fight.ts`
- `capturedAt` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `card` — `src/runtime/panel-frame.ts`
- `casts` — `src/runtime/carried-tooltip.ts`
- `cause` — `src/runtime/fight-file.ts`, `src/runtime/shelf.ts`
- `choice` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`
- `clock` — in 4 files: `src/runtime/`
- `combatantId` — `src/runtime/panel-frame.ts`
- `combatants` — `src/runtime/fight-file.ts`
- `combatantsAfter` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/live-fight.ts`
- `combatantsBefore` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/live-fight.ts`
- `console` — `src/runtime/defect-ledger.ts`, `src/runtime/margometer-runtime.ts`
- `contents` — `src/runtime/shelf.ts`
- `count` — `src/runtime/defect-ledger.ts`, `src/runtime/panel-frame.ts`, `src/runtime/shelf.ts`
- `cut` — `src/runtime/panel-frame.ts`
- `damageByNeitherEnd` — `src/runtime/fight-file.ts`
- `damageDealt` — `src/runtime/fight-file.ts`
- `damageDealtAbsorbed` — `src/runtime/fight-file.ts`
- `damageDealtAbsorbedByDefence` — `src/runtime/fight-file.ts`
- `damageDealtApplied` — `src/runtime/fight-file.ts`
- `damageDealtBlowLargest` — `src/runtime/fight-file.ts`
- `damageDealtByKind` — `src/runtime/fight-file.ts`
- `damageDealtByNobody` — `src/runtime/fight-file.ts`
- `damageDealtByOpponent` — `src/runtime/fight-file.ts`
- `damageDealtByOpponentAndKind` — `src/runtime/fight-file.ts`
- `damageDealtRaw` — `src/runtime/fight-file.ts`
- `damageDealtToNobody` — `src/runtime/fight-file.ts`
- `damageDealtToNobodyByKind` — `src/runtime/fight-file.ts`
- `damageDealtWithoutSkillByKey` — `src/runtime/fight-file.ts`
- `damageDealtWithoutSkillByOpponent` — `src/runtime/fight-file.ts`
- `damageDealtWithoutSkillByOpponentAndKey` — `src/runtime/fight-file.ts`
- `damagePrevented` — `src/runtime/fight-file.ts`
- `damagePreventedByDefence` — `src/runtime/fight-file.ts`
- `damageTaken` — `src/runtime/fight-file.ts`
- `damageTakenAbsorbed` — `src/runtime/fight-file.ts`
- `damageTakenAbsorbedByDefence` — `src/runtime/fight-file.ts`
- `damageTakenApplied` — `src/runtime/fight-file.ts`
- `damageTakenBlowLargest` — `src/runtime/fight-file.ts`
- `damageTakenByKind` — `src/runtime/fight-file.ts`
- `damageTakenByNobody` — `src/runtime/fight-file.ts`
- `damageTakenByOpponent` — `src/runtime/fight-file.ts`
- `damageTakenByOpponentAndKind` — `src/runtime/fight-file.ts`
- `damageTakenFromNobody` — `src/runtime/fight-file.ts`
- `damageTakenFromNobodyByKind` — `src/runtime/fight-file.ts`
- `damageTakenRaw` — `src/runtime/fight-file.ts`
- `damageTakenWithoutSkillByKey` — `src/runtime/fight-file.ts`
- `damageTakenWithoutSkillByOpponent` — `src/runtime/fight-file.ts`
- `decoder` — `src/runtime/margometer-runtime.ts`
- `defect` — `src/runtime/failure-fate.ts`
- `defects` — in 4 files: `src/runtime/`
- `dictionary` — `src/runtime/margometer-runtime.ts`
- `document` — `src/runtime/margometer-runtime.ts`
- `drill` — `src/runtime/panel-frame.ts`
- `droppedCalls` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `droppedOpenedAt` — `src/runtime/shelf.ts`
- `element` — `src/runtime/panel-frame.ts`
- `engine` — `src/runtime/defect-ledger.ts`
- `failure` — in 5 files: `src/runtime/`
- `fallbackWithDefect` — `src/runtime/failure-fate.ts`
- `fightPlace` — `src/runtime/panel-frame.ts`
- `fightState` — `src/runtime/fight-state.ts`, `src/runtime/panel-frame.ts`
- `fightStatesByOpenedAt` — `src/runtime/shelf-keeper.ts`
- `fights` — `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `fightsUnreadable` — `src/runtime/shelf.ts`
- `figures` — `src/runtime/defect-ledger.ts`, `src/runtime/fight-state.ts`
- `file` — `src/runtime/defect-ledger.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/margometer-runtime.ts`
- `first` — `src/runtime/defect-ledger.ts`
- `formatVersion` — `src/runtime/fight-file.ts`
- `frame` — `src/runtime/margometer-runtime.ts`
- `frames` — `src/runtime/margometer-runtime.ts`
- `gesture` — `src/runtime/defect-ledger.ts`
- `handle` — `src/runtime/margometer-runtime.ts`
- `hasChoiceRefused` — `src/runtime/shelf-keeper.ts`
- `hasFailed` — `src/runtime/margometer-runtime.ts`
- `hasFightToSave` — `src/runtime/panel-frame.ts`
- `hasFrameRefused` — `src/runtime/margometer-runtime.ts`
- `hasJoinedInProgress` — `src/runtime/carried-tooltip.ts`, `src/runtime/panel-frame.ts`
- `hasMoveRefused` — `src/runtime/shelf-keeper.ts`
- `hasPinRefused` — `src/runtime/shelf-keeper.ts`
- `hasReportFailed` — `src/runtime/margometer-runtime.ts`
- `hasSpentLastheal` — `src/runtime/carried-tooltip.ts`
- `hasStoreMadeRoom` — `src/runtime/shelf-keeper.ts`
- `hasStoreRefused` — `src/runtime/shelf-keeper.ts`
- `healthGiven` — `src/runtime/fight-file.ts`
- `healthGivenByNobody` — `src/runtime/fight-file.ts`
- `healthGivenByReceiver` — `src/runtime/fight-file.ts`
- `healthGivenWithoutSkillByReceiverAndKey` — `src/runtime/fight-file.ts`
- `healthRestored` — `src/runtime/fight-file.ts`
- `healthRestoredByGiver` — `src/runtime/fight-file.ts`
- `healthRestoredByKey` — `src/runtime/fight-file.ts`
- `healthRestoredByNobody` — `src/runtime/fight-file.ts`
- `healthRestoredByNobodyByKey` — `src/runtime/fight-file.ts`
- `healthRestoredToNobody` — `src/runtime/fight-file.ts`
- `healthRestoredWithoutSkillByKey` — `src/runtime/fight-file.ts`
- `height` — `src/runtime/settings.ts`
- `helper` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `helperFolded` — `src/runtime/settings.ts`
- `helperPlacement` — `src/runtime/margometer-runtime.ts`
- `helperPosition` — `src/runtime/settings.ts`
- `helperSize` — `src/runtime/settings.ts`
- `hero` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `holytouchHealsReceived` — `src/runtime/carried-tooltip.ts`
- `index` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `initShelfStore` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`
- `interval` — `src/runtime/margometer-runtime.ts`
- `isChosen` — `src/runtime/panel-frame.ts`
- `isDone` — `src/runtime/margometer-runtime.ts`
- `isEverySlotPinned` — `src/runtime/shelf-keeper.ts`
- `isFightUnread` — `src/runtime/panel-frame.ts`
- `isLive` — `src/runtime/panel-frame.ts`
- `isMeterCollapsed` — `src/runtime/panel-frame.ts`
- `isMounted` — `src/runtime/margometer-runtime.ts`
- `isOnAuto` — `src/runtime/panel-frame.ts`
- `isOnShelf` — `src/runtime/panel-frame.ts`
- `isOpening` — `src/runtime/live-fight.ts`
- `isOver` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/panel-frame.ts`
- `isPinnable` — `src/runtime/panel-frame.ts`
- `isPinned` — in 4 files: `src/runtime/`
- `isStale` — `src/runtime/margometer-runtime.ts`
- `isStoodDown` — `src/runtime/margometer-runtime.ts`
- `isTruncated` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `isUnread` — `src/runtime/panel-frame.ts`
- `keeper` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/panel-frame.ts`
- `keeping` — `src/runtime/defect-ledger.ts`
- `kept` — `src/runtime/defect-ledger.ts`
- `keptFight` — `src/runtime/fight-state.ts`
- `keptUnread` — `src/runtime/panel-frame.ts`
- `key` — `src/runtime/settings.ts`
- `keyByStatusBit` — `src/runtime/carried-tooltip.ts`
- `kind` — in 5 files: `src/runtime/`
- `left` — `src/runtime/settings.ts`
- `level` — `src/runtime/panel-frame.ts`
- `listName` — `src/runtime/panel-frame.ts`
- `listener` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `live` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/panel-frame.ts`
- `looks` — `src/runtime/margometer-runtime.ts`
- `mapName` — `src/runtime/shelf.ts`
- `margonemClientBuild` — in 4 files: `src/runtime/`
- `margonemEngineBattle` — `src/runtime/live-fight.ts`
- `markStale` — `src/runtime/live-fight.ts`
- `maximum` — `src/runtime/shelf.ts`
- `messages` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/live-fight.ts`
- `messagesByPayload` — `src/runtime/fight-state.ts`
- `messagesLost` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/panel-frame.ts`
- `messagesRead` — `src/runtime/panel-frame.ts`
- `meter` — `src/runtime/margometer-runtime.ts`
- `meterFolded` — `src/runtime/settings.ts`
- `meterPlacement` — `src/runtime/margometer-runtime.ts`
- `meterPosition` — `src/runtime/settings.ts`
- `meterSize` — `src/runtime/settings.ts`
- `metric` — `src/runtime/panel-frame.ts`
- `mount` — `src/runtime/defect-ledger.ts`
- `mountPanel` — `src/runtime/margometer-runtime.ts`
- `name` — in 6 files: `src/runtime/`
- `none` — `src/runtime/failure-fate.ts`
- `onFightKept` — `src/runtime/live-fight.ts`
- `onFightOpened` — `src/runtime/live-fight.ts`
- `opened` — `src/runtime/panel-frame.ts`
- `openedAt` — `src/runtime/live-fight.ts`, `src/runtime/panel-frame.ts`, `src/runtime/shelf.ts`
- `openedAtRefusal` — `src/runtime/live-fight.ts`
- `options` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`,
  `src/runtime/shelf-keeper.ts`
- `outcome` — `src/runtime/panel-frame.ts`
- `pair` — `src/runtime/panel-frame.ts`
- `part` — `src/runtime/panel-frame.ts`
- `payload` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/live-fight.ts`
- `payloadRefusal` — `src/runtime/live-fight.ts`
- `payloads` — `src/runtime/fight-file.ts`, `src/runtime/live-fight.ts`, `src/runtime/shelf.ts`
- `payloadsApplied` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `percent` — `src/runtime/carried-tooltip.ts`
- `place` — in 6 files: `src/runtime/`
- `ports` — `src/runtime/margometer-runtime.ts`
- `position` — `src/runtime/margometer-runtime.ts`
- `procsWhenStriking` — `src/runtime/fight-file.ts`
- `procsWhenStruck` — `src/runtime/fight-file.ts`
- `profession` — `src/runtime/panel-frame.ts`
- `provokedBy` — `src/runtime/carried-tooltip.ts`
- `provokedCount` — `src/runtime/carried-tooltip.ts`
- `ranking` — `src/runtime/panel-frame.ts`
- `readViewport` — `src/runtime/margometer-runtime.ts`
- `reader` — `src/runtime/panel-frame.ts`
- `readerId` — `src/runtime/live-fight.ts`, `src/runtime/panel-frame.ts`, `src/runtime/shelf.ts`
- `readerSide` — `src/runtime/panel-frame.ts`
- `reading` — `src/runtime/defect-ledger.ts`
- `record` — `src/runtime/live-fight.ts`
- `refused` — `src/runtime/panel-frame.ts`
- `region` — in 5 files: `src/runtime/`
- `report` — `src/runtime/fight-file.ts`, `src/runtime/margometer-runtime.ts`
- `roster` — in 4 files: `src/runtime/`
- `screen` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `search` — `src/runtime/margometer-runtime.ts`
- `session` — `src/runtime/live-fight.ts`
- `sessionOptions` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/shelf-keeper.ts`
- `settings` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`
- `shelf` — `src/runtime/panel-frame.ts`
- `shelfAnswer` — `src/runtime/failure-fate.ts`
- `shelfAnswers` — `src/runtime/panel-frame.ts`
- `shownAsSuspect` — `src/runtime/failure-fate.ts`
- `shownAsUnknown` — `src/runtime/failure-fate.ts`
- `side` — `src/runtime/panel-frame.ts`
- `sideHealsStated` — `src/runtime/fight-file.ts`
- `sideHealsUnsized` — `src/runtime/fight-file.ts`
- `size` — `src/runtime/margometer-runtime.ts`
- `sizes` — `src/runtime/panel-frame.ts`
- `skills` — `src/runtime/fight-file.ts`
- `snapshotBefore` — `src/runtime/live-fight.ts`
- `standDown` — `src/runtime/failure-fate.ts`
- `statedSkills` — `src/runtime/carried-tooltip.ts`
- `statement` — `src/runtime/panel-frame.ts`
- `statistics` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `statisticsDestroyed` — `src/runtime/fight-file.ts`
- `statusBits` — `src/runtime/carried-tooltip.ts`
- `statuses` — `src/runtime/carried-tooltip.ts`
- `storage` — `src/runtime/panel-frame.ts`, `src/runtime/settings.ts`
- `store` — `src/runtime/shelf-keeper.ts`
- `subject` — `src/runtime/fight-handover.ts`
- `surroundings` — `src/runtime/fight-handover.ts`, `src/runtime/margometer-runtime.ts`
- `suspicions` — `src/runtime/panel-frame.ts`
- `tables` — in 4 files: `src/runtime/`
- `text` — `src/runtime/fight-file.ts`
- `tooltip` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `top` — `src/runtime/settings.ts`
- `totals` — `src/runtime/fight-file.ts`
- `translate` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `turnHolderId` — `src/runtime/panel-frame.ts`
- `turnsByCombatantId` — `src/runtime/carried-tooltip.ts`
- `turnsElapsed` — `src/runtime/carried-tooltip.ts`
- `turnsLost` — `src/runtime/fight-file.ts`
- `turnsStated` — `src/runtime/carried-tooltip.ts`
- `turnsTaken` — `src/runtime/carried-tooltip.ts`, `src/runtime/fight-file.ts`
- `typeStep` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`,
  `src/runtime/settings.ts`
- `unnamed` — `src/runtime/panel-frame.ts`
- `unnamedCut` — `src/runtime/panel-frame.ts`
- `unplaced` — `src/runtime/panel-frame.ts`
- `unreadMessagesGrammarRefused` — `src/runtime/fight-file.ts`
- `unreadMessagesNoParameter` — `src/runtime/fight-file.ts`
- `unreadMessagesUnknownKey` — `src/runtime/fight-file.ts`
- `userAgent` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `uses` — `src/runtime/fight-file.ts`
- `version` — `src/runtime/shelf.ts`
- `view` — `src/runtime/fight-state.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/panel-frame.ts`
- `wasRefused` — `src/runtime/live-fight.ts`
- `width` — `src/runtime/settings.ts`
- `windowSizes` — `src/runtime/panel-frame.ts`
- `world` — in 4 files: `src/runtime/`
- `wrap` — `src/runtime/margometer-runtime.ts`
- `wrapFailuresMarked` — `src/runtime/margometer-runtime.ts`
- `x` — `src/runtime/shelf.ts`
- `y` — `src/runtime/shelf.ts`

### `src/ui/`

- `+acdmg_destroyed` — `src/ui/panel-words.ts`
- `+crit` — `src/ui/panel-words.ts`
- `+fastarrow` — `src/ui/panel-words.ts`
- `+freeze` — `src/ui/panel-words.ts`
- `+legbon_anguish` — `src/ui/panel-words.ts`
- `+legbon_curse` — `src/ui/panel-words.ts`
- `+legbon_holytouch` — `src/ui/panel-words.ts`
- `+legbon_puncture` — `src/ui/panel-words.ts`
- `+legbon_verycrit` — `src/ui/panel-words.ts`
- `+of_crit` — `src/ui/panel-words.ts`
- `+of_wound` — `src/ui/panel-words.ts`
- `+of_woundmagic` — `src/ui/panel-words.ts`
- `+of_woundpoison` — `src/ui/panel-words.ts`
- `+pierce` — `src/ui/panel-words.ts`
- `+stun` — `src/ui/panel-words.ts`
- `+stun2` — `src/ui/panel-words.ts`
- `+stun2-c` — `src/ui/panel-words.ts`
- `+stun2-d` — `src/ui/panel-words.ts`
- `+stun2-f` — `src/ui/panel-words.ts`
- `+stun2-l` — `src/ui/panel-words.ts`
- `+superspell-dispel` — `src/ui/panel-words.ts`
- `+superspell-prevented` — `src/ui/panel-words.ts`
- `+swing` — `src/ui/panel-words.ts`
- `+wound` — `src/ui/panel-words.ts`
- `+woundfrost` — `src/ui/panel-words.ts`
- `+woundmagic` — `src/ui/panel-words.ts`
- `+woundpoison` — `src/ui/panel-words.ts`
- `-arrowblock` — `src/ui/panel-words.ts`
- `-contra` — `src/ui/panel-words.ts`
- `-evade` — `src/ui/panel-words.ts`
- `-legbon_cleanse` — `src/ui/panel-words.ts`
- `-legbon_critred` — `src/ui/panel-words.ts`
- `-legbon_facade` — `src/ui/panel-words.ts`
- `-legbon_glare` — `src/ui/panel-words.ts`
- `-parry` — `src/ui/panel-words.ts`
- `-pierceb` — `src/ui/panel-words.ts`
- `-tenacity` — `src/ui/panel-words.ts`
- `abdest_per` — `src/ui/panel-words.ts`
- `abmdest_per` — `src/ui/panel-words.ts`
- `absorb` — `src/ui/panel-words.ts`
- `absorbed` — `src/ui/panel-element.ts`
- `absorbm` — `src/ui/panel-words.ts`
- `acdmg` — `src/ui/panel-words.ts`
- `actdmg` — `src/ui/panel-words.ts`
- `actor` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `addOnVersion` — `src/ui/panel-element.ts`
- `afterFight` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `amount` — `src/ui/panel-words.ts`
- `anguish` — `src/ui/panel-words.ts`
- `answers` — `src/ui/panel-element.ts`
- `apart` — `src/ui/panel-content.ts`
- `at` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `attribute` — `src/ui/panel-element.ts`
- `b` — `src/ui/panel-words.ts`
- `back` — in 4 files: `src/ui/`
- `backFromFights` — `src/ui/panel-words.ts`
- `backFromOptions` — `src/ui/panel-words.ts`
- `bandage` — `src/ui/panel-words.ts`
- `bar` — `src/ui/panel-look.ts`
- `barCap` — `src/ui/panel-look.ts`
- `betweenFights` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `bit` — `src/ui/panel-words.ts`
- `blok` — `src/ui/panel-words.ts`
- `blows` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `blowsCritical` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `blowsCriticalOffhand` — `src/ui/panel-words.ts`
- `blowsStruck` — `src/ui/panel-content.ts`
- `blowsWithoutSkill` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `border` — `src/ui/panel-look.ts`
- `broken` — `src/ui/panel-words.ts`
- `button` — `src/ui/panel-document.ts`
- `buttons` — `src/ui/panel-document.ts`
- `byElement` — `src/ui/panel-content.ts`
- `byOtherEnd` — `src/ui/panel-content.ts`
- `bySkill` — `src/ui/panel-content.ts`
- `cancel` — `src/ui/panel-document.ts`, `src/ui/view-failure.ts`
- `capture` — `src/ui/view-failure.ts`
- `card` — in 4 files: `src/ui/`
- `cardCaveat` — `src/ui/panel-look.ts`
- `cardCaveatNote` — `src/ui/panel-look.ts`
- `cardColumn` — `src/ui/panel-look.ts`
- `cardColumns` — `src/ui/panel-look.ts`
- `cardDefect` — `src/ui/panel-look.ts`
- `cardGroup` — `src/ui/panel-look.ts`
- `cardHeading` — `src/ui/panel-look.ts`
- `cardHidden` — `src/ui/panel-look.ts`
- `cardLabel` — `src/ui/panel-look.ts`
- `cardLine` — `src/ui/panel-look.ts`
- `cardName` — `src/ui/panel-look.ts`
- `cardNote` — `src/ui/panel-look.ts`
- `cardOutcome` — `src/ui/panel-look.ts`
- `cardStrong` — `src/ui/panel-look.ts`
- `cardSub` — `src/ui/panel-look.ts`
- `cardSubtitle` — `src/ui/panel-look.ts`
- `cardSuspect` — `src/ui/panel-look.ts`
- `cardValue` — `src/ui/panel-look.ts`
- `cardWide` — `src/ui/panel-look.ts`
- `cardWidthPixelsMaximum` — `src/ui/panel-look.ts`
- `case` — `src/ui/panel-content.ts`
- `castSeparator` — `src/ui/panel-words.ts`
- `castWidthPixelsMinimum` — `src/ui/panel-look.ts`
- `casterColour` — `src/ui/panel-helper.ts`
- `casterId` — `src/ui/panel-helper.ts`
- `casterName` — `src/ui/panel-helper.ts`
- `casterSideRelation` — `src/ui/panel-helper.ts`
- `cause` — `src/ui/view-failure.ts`
- `caveat` — `src/ui/panel-element.ts`, `src/ui/panel-palette.ts`
- `character` — `src/ui/panel-words.ts`
- `chargedSkill` — `src/ui/panel-words.ts`
- `chargedSkills` — `src/ui/panel-helper.ts`
- `charging` — `src/ui/panel-words.ts`
- `children` — `src/ui/panel-document.ts`
- `choice` — `src/ui/panel-intent.ts`
- `chosenFightOpenedAt` — `src/ui/panel-screen.ts`
- `className` — `src/ui/panel-document.ts`, `src/ui/panel-element.ts`
- `clearPixels` — `src/ui/panel-look.ts`
- `clientX` — `src/ui/panel-document.ts`
- `clientY` — `src/ui/panel-document.ts`
- `close` — `src/ui/panel-intent.ts`
- `closing` — `src/ui/panel-content.ts`
- `collapse` — `src/ui/panel-words.ts`
- `colour` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`
- `combatantId` — `src/ui/panel-content.ts`, `src/ui/panel-helper.ts`, `src/ui/panel-intent.ts`
- `combatants` — `src/ui/panel-words.ts`
- `compose` — `src/ui/panel-element.ts`
- `control` — `src/ui/panel-look.ts`
- `controlLead` — `src/ui/panel-look.ts`
- `count` — `src/ui/panel-element.ts`
- `critpierce` — `src/ui/panel-words.ts`
- `crumb` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `crumbBack` — `src/ui/panel-look.ts`
- `crumbHere` — `src/ui/panel-look.ts`
- `cut` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `damage` — `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `damageDealt` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `damageDealtAbsorbedByDefence` — `src/ui/panel-content.ts`
- `damageDealtByNobody` — `src/ui/panel-content.ts`
- `damageDealtRaw` — `src/ui/panel-content.ts`
- `damageDealtToNobody` — `src/ui/panel-content.ts`
- `damageDealtToNobodyByKind` — `src/ui/panel-content.ts`
- `damageKind` — `src/ui/panel-words.ts`
- `damagePrevented` — `src/ui/panel-content.ts`
- `damagePreventedByDefence` — `src/ui/panel-content.ts`
- `damageTaken` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `damageTakenAbsorbedByDefence` — `src/ui/panel-content.ts`
- `damageTakenByNobody` — `src/ui/panel-content.ts`
- `damageTakenFromNobody` — `src/ui/panel-content.ts`
- `damageTakenFromNobodyByKind` — `src/ui/panel-content.ts`
- `damageTakenRaw` — `src/ui/panel-content.ts`
- `day` — `src/ui/panel-content.ts`
- `dealtTo` — `src/ui/panel-words.ts`
- `dealtWithNoActor` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `defect` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-palette.ts`
- `defects` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `destroyed` — `src/ui/panel-words.ts`
- `detail` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `direction` — `src/ui/panel-screen.ts`
- `directions` — `src/ui/panel-element.ts`
- `dmg` — `src/ui/panel-words.ts`
- `dmga` — `src/ui/panel-words.ts`
- `dmgc` — `src/ui/panel-words.ts`
- `dmgd` — `src/ui/panel-words.ts`
- `dmgf` — `src/ui/panel-words.ts`
- `dmgl` — `src/ui/panel-words.ts`
- `dmgo` — `src/ui/panel-words.ts`
- `dmgp` — `src/ui/panel-words.ts`
- `document` — `src/ui/panel-element.ts`
- `doesOpen` — `src/ui/panel-element.ts`
- `doesOpenPair` — `src/ui/panel-content.ts`
- `doesOpenPart` — `src/ui/panel-content.ts`
- `drag` — `src/ui/panel-words.ts`, `src/ui/view-failure.ts`
- `drawing` — `src/ui/panel-element.ts`
- `drawn` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `edge` — `src/ui/panel-drag.ts`
- `eitherKind` — `src/ui/panel-words.ts`
- `element` — in 4 files: `src/ui/`
- `empty` — `src/ui/panel-look.ts`
- `end` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`
- `ending` — `src/ui/panel-element.ts`
- `engine` — `src/ui/panel-words.ts`
- `everyone` — `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `expand` — `src/ui/panel-words.ts`
- `few` — `src/ui/panel-words.ts`
- `field` — `src/ui/panel-content.ts`
- `fight` — `src/ui/panel-intent.ts`
- `fightPlace` — `src/ui/panel-element.ts`
- `fightUnread` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `fights` — `src/ui/panel-words.ts`
- `figure` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `figures` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `file` — `src/ui/panel-words.ts`
- `fill` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `fire` — `src/ui/panel-words.ts`
- `fled` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `fold` — `src/ui/panel-intent.ts`, `src/ui/panel-look.ts`
- `folded` — `src/ui/panel-look.ts`
- `fontPixels` — `src/ui/panel-look.ts`
- `fontSmallPixels` — `src/ui/panel-look.ts`
- `frame` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `from` — `src/ui/panel-element.ts`
- `fromLeft` — `src/ui/panel-drag.ts`
- `fromTop` — `src/ui/panel-drag.ts`
- `gapPixels` — `src/ui/panel-look.ts`
- `gesture` — `src/ui/panel-words.ts`
- `gestureBack` — `src/ui/panel-words.ts`
- `gestureBackAnywhere` — `src/ui/panel-words.ts`
- `getTypeStep` — `src/ui/panel-element.ts`
- `getTypeTokens` — `src/ui/panel-drag.ts`
- `given` — `src/ui/panel-screen.ts`
- `givenWithNoActor` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `grab` — `src/ui/panel-drag.ts`, `src/ui/view-failure.ts`
- `grip` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `groups` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `h` — `src/ui/panel-words.ts`
- `half` — `src/ui/panel-look.ts`
- `halfNamed` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `hasFightToSave` — `src/ui/panel-element.ts`
- `hasFiguresDisagreed` — `src/ui/panel-content.ts`, `src/ui/panel-helper.ts`
- `hasJoinedInProgress` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `hasSpentLastheal` — `src/ui/panel-words.ts`
- `header` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `headerLine` — `src/ui/panel-look.ts`
- `headerOutcome` — `src/ui/panel-look.ts`
- `headerPlace` — `src/ui/panel-look.ts`
- `headerPlaceName` — `src/ui/panel-look.ts`
- `headerPlaceTile` — `src/ui/panel-look.ts`
- `heading` — `src/ui/panel-element.ts`
- `heal` — `src/ui/panel-words.ts`
- `heal_target` — `src/ui/panel-words.ts`
- `healall_per` — `src/ui/panel-words.ts`
- `healing` — `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `heals` — `src/ui/panel-words.ts`
- `healthGiven` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `healthGivenByNobody` — `src/ui/panel-content.ts`
- `healthRestored` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `healthRestoredByNobody` — `src/ui/panel-content.ts`
- `healthRestoredByNobodyByKey` — `src/ui/panel-content.ts`
- `healthRestoredToNobody` — `src/ui/panel-content.ts`
- `healthSource` — `src/ui/panel-words.ts`
- `height` — `src/ui/panel-choice.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `heightMaximum` — `src/ui/panel-drag.ts`
- `heightMinimum` — `src/ui/panel-drag.ts`
- `heightPixels` — `src/ui/panel-element.ts`
- `held` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `helper` — in 5 files: `src/ui/`
- `helperBar` — `src/ui/panel-look.ts`
- `helperBody` — `src/ui/panel-look.ts`
- `helperCast` — `src/ui/panel-look.ts`
- `helperDrag` — `src/ui/panel-element.ts`
- `helperFold` — `src/ui/panel-intent.ts`
- `helperFolded` — `src/ui/panel-look.ts`
- `helperHolding` — `src/ui/panel-look.ts`
- `helperPip` — `src/ui/panel-look.ts`
- `helperPipLit` — `src/ui/panel-look.ts`
- `helperPips` — `src/ui/panel-look.ts`
- `helperPlacement` — `src/ui/panel-element.ts`
- `helperUnder` — `src/ui/panel-look.ts`
- `helperWidthPixels` — `src/ui/panel-look.ts`
- `holytouchHealsReceived` — `src/ui/panel-words.ts`
- `hour` — `src/ui/panel-content.ts`
- `hover` — `src/ui/view-failure.ts`
- `icon` — `src/ui/panel-element.ts`
- `index` — `src/ui/panel-words.ts`
- `injure` — `src/ui/panel-words.ts`
- `inkDark` — `src/ui/panel-look.ts`
- `inkLight` — `src/ui/panel-look.ts`
- `insetPixels` — `src/ui/panel-look.ts`
- `insideSection` — `src/ui/panel-words.ts`
- `isChosen` — `src/ui/panel-content.ts`
- `isCurrent` — `src/ui/panel-screen.ts`
- `isFightUnread` — `src/ui/panel-element.ts`
- `isHelperCollapsed` — `src/ui/panel-screen.ts`
- `isLive` — `src/ui/panel-content.ts`
- `isMeterCollapsed` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `isNested` — `src/ui/panel-element.ts`
- `isOnAuto` — `src/ui/panel-helper.ts`
- `isOnOptions` — `src/ui/panel-screen.ts`
- `isOnShelf` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `isOver` — `src/ui/panel-helper.ts`
- `isPinnable` — `src/ui/panel-content.ts`
- `isPinned` — `src/ui/panel-content.ts`
- `isRowNarrower` — `src/ui/panel-element.ts`
- `isSideChosen` — `src/ui/panel-element.ts`
- `isStrong` — `src/ui/panel-element.ts`
- `isSuspect` — `src/ui/panel-element.ts`
- `isTurnHolder` — `src/ui/panel-element.ts`
- `isUnread` — `src/ui/panel-content.ts`
- `keeping` — `src/ui/panel-words.ts`
- `kept` — `src/ui/panel-words.ts`
- `keptUnread` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `keptUnreadNote` — `src/ui/panel-words.ts`
- `key` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/view-failure.ts`
- `keyPrefix` — `src/ui/panel-element.ts`
- `kind` — in 4 files: `src/ui/`
- `kinds` — `src/ui/panel-content.ts`
- `label` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `large` — `src/ui/panel-choice.ts`, `src/ui/panel-words.ts`
- `largest` — `src/ui/panel-content.ts`
- `layer` — `src/ui/panel-look.ts`
- `leave` — `src/ui/panel-document.ts`, `src/ui/view-failure.ts`
- `left` — `src/ui/panel-choice.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `legbon_holytouch_heal` — `src/ui/panel-words.ts`
- `legbon_lastheal` — `src/ui/panel-words.ts`
- `legendary` — `src/ui/panel-words.ts`
- `legendaryBonuses` — `src/ui/panel-content.ts`
- `legendaryBonusesReached` — `src/ui/panel-content.ts`
- `legendaryHeld` — `src/ui/panel-words.ts`
- `legendaryReached` — `src/ui/panel-words.ts`
- `level` — `src/ui/panel-content.ts`
- `light` — `src/ui/panel-words.ts`
- `lineHeightPixels` — `src/ui/panel-look.ts`
- `lineHeightTitlePixels` — `src/ui/panel-look.ts`
- `lines` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `list` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `listBasis` — `src/ui/panel-look.ts`
- `listName` — `src/ui/panel-element.ts`
- `listRowsLeast` — `src/ui/panel-look.ts`
- `listWaiting` — `src/ui/panel-look.ts`
- `listener` — `src/ui/view-failure.ts`
- `local` — `src/ui/panel-choice.ts`, `src/ui/panel-words.ts`
- `lost` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `m` — `src/ui/panel-words.ts`
- `many` — `src/ui/panel-words.ts`
- `mark` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `markSizePixels` — `src/ui/panel-look.ts`
- `medium` — `src/ui/panel-choice.ts`, `src/ui/panel-words.ts`
- `memory` — `src/ui/panel-choice.ts`, `src/ui/panel-words.ts`
- `messages` — `src/ui/panel-words.ts`
- `messagesLost` — `src/ui/panel-content.ts`
- `messagesRead` — `src/ui/panel-content.ts`
- `meter` — in 5 files: `src/ui/`
- `meterDrag` — `src/ui/panel-element.ts`
- `meterPlacement` — `src/ui/panel-element.ts`
- `meterWidthPixels` — `src/ui/panel-look.ts`
- `metric` — in 4 files: `src/ui/`
- `minute` — `src/ui/panel-content.ts`
- `mode` — `src/ui/panel-document.ts`, `src/ui/panel-element.ts`
- `month` — `src/ui/panel-content.ts`
- `mount` — `src/ui/panel-words.ts`
- `move` — `src/ui/panel-document.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-intent.ts`
- `name` — in 7 files: `src/ui/`
- `neither` — `src/ui/panel-element.ts`
- `neitherEnd` — `src/ui/panel-content.ts`
- `noFightYet` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `noKind` — `src/ui/panel-content.ts`
- `noSides` — `src/ui/panel-words.ts`
- `nobody` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `note` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `notes` — `src/ui/panel-element.ts`
- `nothingHappens` — `src/ui/panel-words.ts`
- `nothingYet` — `src/ui/panel-words.ts`
- `noun` — `src/ui/panel-screen.ts`
- `nouns` — `src/ui/panel-element.ts`
- `now` — `src/ui/panel-words.ts`
- `npc_heal` — `src/ui/panel-words.ts`
- `offsetPixels` — `src/ui/panel-drag.ts`
- `offsetX` — `src/ui/panel-document.ts`
- `offsetY` — `src/ui/panel-document.ts`
- `onAuto` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `onFailure` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `onIntent` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `one` — `src/ui/panel-words.ts`
- `openFights` — `src/ui/panel-words.ts`
- `openOptions` — `src/ui/panel-words.ts`
- `openPart` — `src/ui/panel-intent.ts`, `src/ui/panel-screen.ts`
- `openRow` — `src/ui/panel-intent.ts`
- `openUnnamed` — `src/ui/panel-intent.ts`
- `openUnnamedEnd` — `src/ui/panel-screen.ts`
- `opened` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `openedAt` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`
- `openedCombatantId` — `src/ui/panel-screen.ts`
- `opposing` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `options` — in 4 files: `src/ui/`
- `optionsAnswer` — `src/ui/panel-look.ts`
- `optionsHeading` — `src/ui/panel-look.ts`
- `optionsMeaning` — `src/ui/panel-look.ts`
- `optionsQuestion` — `src/ui/panel-look.ts`
- `optionsReset` — `src/ui/panel-look.ts`
- `optionsStep` — `src/ui/panel-look.ts`
- `optionsSteps` — `src/ui/panel-look.ts`
- `optionsWindow` — `src/ui/panel-look.ts`
- `optionsWindowName` — `src/ui/panel-look.ts`
- `optionsWindowOwn` — `src/ui/panel-look.ts`
- `optionsWindowState` — `src/ui/panel-look.ts`
- `otherId` — `src/ui/panel-content.ts`
- `otherName` — `src/ui/panel-content.ts`
- `otherProfession` — `src/ui/panel-content.ts`
- `ourSide` — `src/ui/panel-words.ts`
- `ours` — `src/ui/panel-palette.ts`
- `outcome` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `outcomeLost` — `src/ui/panel-look.ts`
- `outcomeWon` — `src/ui/panel-look.ts`
- `outside` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `outsideNote` — `src/ui/panel-words.ts`
- `outsideRanking` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `outsideRow` — `src/ui/panel-words.ts`
- `p` — `src/ui/panel-words.ts`
- `pair` — `src/ui/panel-element.ts`
- `pairCombatantId` — `src/ui/panel-screen.ts`
- `pairKinds` — `src/ui/panel-element.ts`
- `panel` — `src/ui/panel-look.ts`
- `part` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `parts` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `percent` — `src/ui/panel-words.ts`
- `person` — `src/ui/panel-content.ts`
- `pin` — `src/ui/panel-intent.ts`
- `pinned` — `src/ui/panel-content.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `pinnedActor` — `src/ui/panel-element.ts`
- `pinnedTarget` — `src/ui/panel-element.ts`
- `pipSizePixels` — `src/ui/panel-look.ts`
- `place` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `placing` — `src/ui/panel-content.ts`
- `plain` — in 4 files: `src/ui/`
- `pointerId` — `src/ui/panel-document.ts`, `src/ui/panel-drag.ts`
- `pointerLeft` — `src/ui/panel-drag.ts`
- `pointerTop` — `src/ui/panel-drag.ts`
- `points` — `src/ui/panel-words.ts`
- `poison` — `src/ui/panel-words.ts`
- `position` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `press` — `src/ui/panel-document.ts`, `src/ui/view-failure.ts`
- `preventDefault` — `src/ui/panel-document.ts`
- `prevented` — `src/ui/panel-words.ts`
- `procsWhenStriking` — `src/ui/panel-content.ts`
- `procsWhenStruck` — `src/ui/panel-content.ts`
- `profession` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `provocation` — `src/ui/panel-words.ts`
- `provocations` — `src/ui/panel-helper.ts`
- `provoked` — `src/ui/panel-helper.ts`
- `provokedBy` — `src/ui/panel-words.ts`
- `provokedCount` — `src/ui/panel-words.ts`
- `provokedId` — `src/ui/panel-helper.ts`
- `quiet` — `src/ui/panel-look.ts`
- `radiusPixels` — `src/ui/panel-look.ts`
- `radiusSmallPixels` — `src/ui/panel-look.ts`
- `raised` — `src/ui/panel-look.ts`
- `rank` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `rankWidthPixels` — `src/ui/panel-look.ts`
- `ranking` — `src/ui/panel-element.ts`
- `raw` — `src/ui/panel-words.ts`
- `reader` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `readerSide` — `src/ui/panel-element.ts`
- `reading` — `src/ui/panel-words.ts`
- `received` — `src/ui/panel-screen.ts`
- `reduction` — `src/ui/panel-words.ts`
- `region` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`, `src/ui/view-failure.ts`
- `regionAcross` — `src/ui/panel-look.ts`
- `regionDown` — `src/ui/panel-look.ts`
- `regions` — `src/ui/panel-element.ts`
- `register` — `src/ui/panel-element.ts`
- `relatedTarget` — `src/ui/panel-document.ts`
- `release` — `src/ui/panel-document.ts`, `src/ui/view-failure.ts`
- `remainder` — `src/ui/panel-words.ts`
- `render` — `src/ui/panel-element.ts`
- `renderHelper` — `src/ui/panel-element.ts`
- `renderInPlace` — `src/ui/panel-element.ts`
- `renderWaiting` — `src/ui/panel-element.ts`
- `report` — `src/ui/panel-element.ts`
- `resdmg` — `src/ui/panel-words.ts`
- `resdmgc` — `src/ui/panel-words.ts`
- `resdmgf` — `src/ui/panel-words.ts`
- `resdmgl` — `src/ui/panel-words.ts`
- `resetSize` — `src/ui/panel-intent.ts`
- `resize` — `src/ui/panel-intent.ts`
- `resizeGrip` — `src/ui/panel-words.ts`
- `resizeHint` — `src/ui/panel-words.ts`
- `rest` — `src/ui/panel-content.ts`
- `restNote` — `src/ui/panel-words.ts`
- `restOfKinds` — `src/ui/panel-words.ts`
- `restoredWithNoActor` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `right` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `row` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-look.ts`
- `rowApart` — `src/ui/panel-look.ts`
- `rowCaveat` — `src/ui/panel-look.ts`
- `rowChosen` — `src/ui/panel-look.ts`
- `rowDrillable` — `src/ui/panel-look.ts`
- `rowHeightPixels` — `src/ui/panel-look.ts`
- `rowLeaf` — `src/ui/panel-look.ts`
- `rowName` — `src/ui/panel-look.ts`
- `rowOutcome` — `src/ui/panel-look.ts`
- `rowPin` — `src/ui/panel-look.ts`
- `rowPinSet` — `src/ui/panel-look.ts`
- `rowRank` — `src/ui/panel-look.ts`
- `rowShare` — `src/ui/panel-look.ts`
- `rowSide` — `src/ui/panel-look.ts`
- `rowSize` — `src/ui/panel-look.ts`
- `rowSuspect` — `src/ui/panel-look.ts`
- `rowTime` — `src/ui/panel-look.ts`
- `rowTurn` — `src/ui/panel-look.ts`
- `rowUnread` — `src/ui/panel-look.ts`
- `rowValue` — `src/ui/panel-look.ts`
- `rows` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `rowsMaximum` — `src/ui/panel-words.ts`
- `rowsVisibleCount` — `src/ui/panel-content.ts`
- `said` — `src/ui/panel-element.ts`
- `save` — `src/ui/panel-intent.ts`, `src/ui/panel-look.ts`
- `saveFight` — `src/ui/panel-words.ts`
- `saveFile` — `src/ui/panel-intent.ts`
- `scope` — `src/ui/panel-words.ts`
- `screen` — `src/ui/panel-intent.ts`
- `scrollTop` — `src/ui/panel-document.ts`
- `secondColumnFrom` — `src/ui/panel-element.ts`
- `section` — `src/ui/panel-look.ts`
- `sectionWords` — `src/ui/panel-look.ts`
- `session` — `src/ui/panel-choice.ts`, `src/ui/panel-words.ts`
- `share` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `shareOfFigure` — `src/ui/panel-words.ts`
- `shareText` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `sheet` — `src/ui/panel-element.ts`
- `shelf` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-look.ts`
- `shelfAnswers` — `src/ui/panel-element.ts`
- `shelfEmpty` — `src/ui/panel-words.ts`
- `showKept` — `src/ui/panel-intent.ts`
- `showLive` — `src/ui/panel-intent.ts`
- `side` — in 4 files: `src/ui/`
- `sideHealsUnsized` — `src/ui/panel-content.ts`
- `sideListed` — `src/ui/panel-content.ts`
- `sideRelation` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`
- `sides` — in 4 files: `src/ui/`
- `sidesLabel` — `src/ui/panel-look.ts`
- `sidesLine` — `src/ui/panel-look.ts`
- `sidesNobody` — `src/ui/panel-look.ts`
- `sidesOurs` — `src/ui/panel-look.ts`
- `sidesSpare` — `src/ui/panel-look.ts`
- `sidesTheirs` — `src/ui/panel-look.ts`
- `sidesTrack` — `src/ui/panel-look.ts`
- `size` — `src/ui/panel-drag.ts`, `src/ui/panel-intent.ts`
- `sizeDefault` — `src/ui/panel-words.ts`
- `sizeGrip` — `src/ui/panel-look.ts`
- `sizeOwn` — `src/ui/panel-words.ts`
- `sizePixels` — `src/ui/panel-look.ts`
- `sizeReset` — `src/ui/panel-words.ts`
- `sizes` — `src/ui/panel-content.ts`
- `skill` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-screen.ts`
- `skillId` — `src/ui/panel-helper.ts`
- `skillName` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`
- `skillUses` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `skills` — `src/ui/panel-words.ts`
- `slot` — `src/ui/panel-look.ts`
- `small` — `src/ui/panel-choice.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `source` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-screen.ts`
- `spent` — `src/ui/panel-words.ts`
- `stat` — `src/ui/panel-element.ts`
- `state` — `src/ui/panel-helper.ts`
- `stated` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `statement` — `src/ui/panel-helper.ts`
- `statisticsDestroyed` — `src/ui/panel-content.ts`
- `statusBits` — `src/ui/panel-words.ts`
- `statuses` — `src/ui/panel-words.ts`
- `stemWidthPixels` — `src/ui/panel-look.ts`
- `step` — `src/ui/panel-intent.ts`
- `storage` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-words.ts`
- `striking` — `src/ui/panel-words.ts`
- `strip` — `src/ui/panel-look.ts`
- `stripCurrent` — `src/ui/panel-look.ts`
- `strips` — `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `stripsGap` — `src/ui/panel-look.ts`
- `struck` — `src/ui/panel-words.ts`
- `sub` — `src/ui/panel-element.ts`
- `subject` — `src/ui/panel-content.ts`
- `subtitle` — `src/ui/panel-element.ts`
- `suspect` — `src/ui/panel-element.ts`, `src/ui/panel-palette.ts`
- `suspicion` — `src/ui/panel-look.ts`
- `suspicions` — in 4 files: `src/ui/`
- `t` — `src/ui/panel-words.ts`
- `takenFrom` — `src/ui/panel-words.ts`
- `takenWithNoActor` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `takenWithNoTarget` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `target` — `src/ui/panel-content.ts`, `src/ui/panel-document.ts`, `src/ui/panel-words.ts`
- `text` — `src/ui/panel-element.ts`
- `textContent` — `src/ui/panel-document.ts`
- `theirSide` — `src/ui/panel-words.ts`
- `theirs` — `src/ui/panel-palette.ts`
- `thirdatt` — `src/ui/panel-words.ts`
- `tile` — `src/ui/panel-words.ts`
- `time` — `src/ui/panel-words.ts`
- `title` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `titleVersion` — `src/ui/panel-look.ts`
- `tone` — `src/ui/panel-element.ts`
- `top` — `src/ui/panel-choice.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `total` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `track` — `src/ui/panel-look.ts`
- `translate` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `turnHolder` — `src/ui/panel-helper.ts`
- `turnHolderId` — `src/ui/panel-element.ts`
- `turnOrdinal` — `src/ui/panel-helper.ts`
- `turnState` — `src/ui/panel-helper.ts`
- `turns` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `turnsCaveat` — `src/ui/panel-element.ts`
- `turnsElapsed` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `turnsLeft` — `src/ui/panel-words.ts`
- `turnsLost` — `src/ui/panel-content.ts`
- `turnsStated` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `turnsTaken` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `turnsWithLost` — `src/ui/panel-words.ts`
- `typeSize` — `src/ui/panel-words.ts`
- `typeStep` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-screen.ts`
- `unannounced` — `src/ui/panel-words.ts`
- `undivided` — `src/ui/panel-words.ts`
- `undrawn` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/view-failure.ts`
- `unfold` — `src/ui/panel-look.ts`
- `unit` — `src/ui/panel-words.ts`
- `unknown` — `src/ui/panel-palette.ts`, `src/ui/panel-words.ts`
- `unknownHowMany` — `src/ui/panel-words.ts`
- `unnamed` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `unnamedCut` — `src/ui/panel-element.ts`
- `unnamedNote` — `src/ui/panel-element.ts`
- `unnamedOpened` — `src/ui/panel-content.ts`
- `unplaced` — `src/ui/panel-content.ts`
- `unread` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `unreadMessagesNoParameter` — `src/ui/panel-content.ts`
- `unreadMessagesUnknownKey` — `src/ui/panel-content.ts`
- `uses` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `view` — `src/ui/panel-element.ts`
- `w` — `src/ui/panel-words.ts`
- `wasTurnLostRead` — `src/ui/panel-content.ts`
- `when` — `src/ui/panel-words.ts`
- `wholeFight` — `src/ui/panel-words.ts`
- `wide` — `src/ui/panel-look.ts`
- `width` — `src/ui/panel-choice.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `widthMaximum` — `src/ui/panel-drag.ts`
- `widthMinimum` — `src/ui/panel-drag.ts`
- `widthPixels` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `window` — in 4 files: `src/ui/`
- `windowShadow` — `src/ui/panel-look.ts`
- `windowSize` — `src/ui/panel-words.ts`
- `windowSizes` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `withoutActor` — `src/ui/panel-words.ts`
- `withoutKind` — `src/ui/panel-words.ts`
- `withoutSide` — `src/ui/panel-words.ts`
- `withoutTarget` — `src/ui/panel-words.ts`
- `won` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `words` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `world` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `wound` — `src/ui/panel-words.ts`
- `written` — `src/ui/panel-drag.ts`

### `src/`

- `Blob` — `src/userscript-entry.ts`
- `Date` — `src/userscript-entry.ts`
- `URL` — `src/userscript-entry.ts`
- `addOnVersion` — `src/userscript-entry.ts`
- `auraTurnsBySkillId` — `src/userscript-entry.ts`
- `battle` — `src/userscript-entry.ts`
- `blowsGrantedBySkillId` — `src/userscript-entry.ts`
- `body` — `src/userscript-entry.ts`
- `build` — `src/userscript-entry.ts`
- `clock` — `src/userscript-entry.ts`
- `console` — `src/userscript-entry.ts`
- `decoder` — `src/userscript-entry.ts`
- `dictionary` — `src/userscript-entry.ts`
- `document` — `src/userscript-entry.ts`
- `downloads` — `src/userscript-entry.ts`
- `file` — `src/userscript-entry.ts`
- `frames` — `src/userscript-entry.ts`
- `height` — `src/userscript-entry.ts`
- `hero` — `src/userscript-entry.ts`
- `innerHeight` — `src/userscript-entry.ts`
- `innerWidth` — `src/userscript-entry.ts`
- `interval` — `src/userscript-entry.ts`
- `keyByStatusBit` — `src/userscript-entry.ts`
- `localStorage` — `src/userscript-entry.ts`
- `missing` — `src/userscript-entry.ts`
- `name` — `src/userscript-entry.ts`
- `place` — `src/userscript-entry.ts`
- `sessionOptions` — `src/userscript-entry.ts`
- `sessionStorage` — `src/userscript-entry.ts`
- `settings` — `src/userscript-entry.ts`
- `shoutsBySkillId` — `src/userscript-entry.ts`
- `src` — `src/userscript-entry.ts`
- `statedSkills` — `src/userscript-entry.ts`
- `statusBits` — `src/userscript-entry.ts`
- `surroundings` — `src/userscript-entry.ts`
- `tables` — `src/userscript-entry.ts`
- `timers` — `src/userscript-entry.ts`
- `tooltip` — `src/userscript-entry.ts`
- `type` — `src/userscript-entry.ts`
- `width` — `src/userscript-entry.ts`
- `window` — `src/userscript-entry.ts`

### `frozen/`

- `absagain_per` — `frozen/help-phrases.ts`
- `absorb` — `frozen/help-phrases.ts`
- `absorbm` — `frozen/help-phrases.ts`
- `absorpcja` — `frozen/help-phrases.ts`
- `acdmg` — `frozen/help-phrases.ts`
- `acdmg_destroyed` — `frozen/help-phrases.ts`
- `actdmg` — `frozen/help-phrases.ts`
- `active_absorbdest_per` — `frozen/help-phrases.ts`
- `active_block_per` — `frozen/help-phrases.ts`
- `active_decblock_per` — `frozen/help-phrases.ts`
- `active_decblock_per-enemies` — `frozen/help-phrases.ts`
- `adddmg2` — `frozen/help-phrases.ts`
- `afterheal` — `frozen/help-phrases.ts`
- `alllowdmg` — `frozen/help-phrases.ts`
- `allslow_per` — `frozen/help-phrases.ts`
- `anguish` — `frozen/help-phrases.ts`
- `arrowblock` — `frozen/help-phrases.ts`
- `article` — `frozen/help-phrases.ts`
- `aura-ac_per` — `frozen/help-phrases.ts`
- `aura-resall` — `frozen/help-phrases.ts`
- `aura-sa_per` — `frozen/help-phrases.ts`
- `bandage` — `frozen/help-phrases.ts`
- `bits` — `frozen/status-bits.ts`
- `blok` — `frozen/help-phrases.ts`
- `blowsGrantedMinimum` — `frozen/blows-granted.ts`
- `cleanse` — `frozen/help-phrases.ts`
- `combo-max` — `frozen/help-phrases.ts`
- `computedFamily` — `frozen/protocol-keys.ts`
- `contra` — `frozen/help-phrases.ts`
- `counts` — `frozen/help-phrases.ts`
- `coverageMinimum` — `frozen/aura-turns.ts`
- `crit` — `frozen/help-phrases.ts`
- `critmval` — `frozen/help-phrases.ts`
- `critmval-allies` — `frozen/help-phrases.ts`
- `critpierce_per` — `frozen/help-phrases.ts`
- `critpoison_per` — `frozen/help-phrases.ts`
- `critred` — `frozen/help-phrases.ts`
- `critsa` — `frozen/help-phrases.ts`
- `critslow_per` — `frozen/help-phrases.ts`
- `critval` — `frozen/help-phrases.ts`
- `critval-allies` — `frozen/help-phrases.ts`
- `critwound` — `frozen/help-phrases.ts`
- `crush` — `frozen/help-phrases.ts`
- `curse` — `frozen/help-phrases.ts`
- `dealtSign` — `frozen/protocol-keys.ts`
- `destroyed` — `frozen/help-phrases.ts`
- `dispel` — `frozen/help-phrases.ts`
- `dmgmulcombo` — `frozen/help-phrases.ts`
- `dystansowe` — `frozen/help-phrases.ts`
- `effects` — `frozen/skill-durations.ts`
- `endest` — `frozen/help-phrases.ts`
- `energy` — `frozen/help-phrases.ts`
- `engback` — `frozen/help-phrases.ts`
- `evade` — `frozen/help-phrases.ts`
- `exp` — `frozen/help-phrases.ts`
- `facade` — `frozen/help-phrases.ts`
- `fastarrow` — `frozen/help-phrases.ts`
- `fetchedAt` — in 4 files: `frozen/`
- `fizyczne` — `frozen/help-phrases.ts`
- `flee` — `frozen/help-phrases.ts`
- `freeze` — `frozen/help-phrases.ts`
- `gameBuild` — `frozen/protocol-keys.ts`, `frozen/status-bits.ts`
- `glare` — `frozen/help-phrases.ts`
- `heal_per-allies` — `frozen/help-phrases.ts`
- `heal_per-enemies` — `frozen/help-phrases.ts`
- `healall_per` — `frozen/help-phrases.ts`
- `holytouch` — `frozen/help-phrases.ts`
- `honoru` — `frozen/help-phrases.ts`
- `hp_per-allies` — `frozen/help-phrases.ts`
- `id` — `frozen/aura-turns.ts`, `frozen/blows-granted.ts`, `frozen/skill-durations.ts`
- `injure` — `frozen/help-phrases.ts`
- `key` — `frozen/skill-durations.ts`
- `keys` — `frozen/protocol-keys.ts`
- `lastheal` — `frozen/help-phrases.ts`
- `lowheal_per-enemies` — `frozen/help-phrases.ts`
- `mana` — `frozen/help-phrases.ts`
- `manadest` — `frozen/help-phrases.ts`
- `marker` — `frozen/protocol-keys.ts`
- `markerAt` — `frozen/protocol-keys.ts`
- `markerLength` — `frozen/protocol-keys.ts`
- `max_moves` — `frozen/help-phrases.ts`
- `nieuchronne` — `frozen/help-phrases.ts`
- `of_wound1` — `frozen/help-phrases.ts`
- `parry` — `frozen/help-phrases.ts`
- `pierce` — `frozen/help-phrases.ts`
- `pierceb` — `frozen/help-phrases.ts`
- `poison` — `frozen/help-phrases.ts`
- `poison_lowdmg_per-enemies` — `frozen/help-phrases.ts`
- `pomocnicze` — `frozen/help-phrases.ts`
- `prepare` — `frozen/help-phrases.ts`
- `prevented` — `frozen/help-phrases.ts`
- `puncture` — `frozen/help-phrases.ts`
- `regen` — `frozen/help-phrases.ts`
- `removedot` — `frozen/help-phrases.ts`
- `removedot-allies` — `frozen/help-phrases.ts`
- `removeslow-allies` — `frozen/help-phrases.ts`
- `removestun-allies` — `frozen/help-phrases.ts`
- `resdmg` — `frozen/help-phrases.ts`
- `resfire_per` — `frozen/help-phrases.ts`
- `resfrost_per` — `frozen/help-phrases.ts`
- `reslight_per` — `frozen/help-phrases.ts`
- `shout` — `frozen/help-phrases.ts`
- `shouts` — `frozen/aura-turns.ts`
- `skillId` — `frozen/help-phrases.ts`
- `skills` — `frozen/aura-turns.ts`, `frozen/blows-granted.ts`, `frozen/skill-durations.ts`
- `step` — `frozen/help-phrases.ts`
- `stun` — `frozen/help-phrases.ts`
- `stun2` — `frozen/help-phrases.ts`
- `sunshield_per` — `frozen/help-phrases.ts`
- `superspell` — `frozen/help-phrases.ts`
- `superspell-dispel` — `frozen/help-phrases.ts`
- `superspell-prevented` — `frozen/help-phrases.ts`
- `surpass_bonus` — `frozen/help-phrases.ts`
- `swing` — `frozen/help-phrases.ts`
- `taken_dmg` — `frozen/help-phrases.ts`
- `tcustom` — `frozen/help-phrases.ts`
- `tenacity` — `frozen/help-phrases.ts`
- `thirdatt` — `frozen/help-phrases.ts`
- `trucizna` — `frozen/help-phrases.ts`
- `tspell` — `frozen/help-phrases.ts`
- `turns` — `frozen/aura-turns.ts`, `frozen/skill-durations.ts`
- `txt` — `frozen/help-phrases.ts`
- `verycrit` — `frozen/help-phrases.ts`
- `wound` — `frozen/help-phrases.ts`
- `wound1` — `frozen/help-phrases.ts`
- `woundpoison` — `frozen/help-phrases.ts`
- `zimno` — `frozen/help-phrases.ts`

### `tools/`

- `ac` — `tools/fabricated-fight.ts`
- `act` — `tools/fabricated-fight.ts`
- `actor` — `tools/fabricated-fight.ts`
- `actorId` — `tools/turn-reading.ts`
- `actsReached` — `tools/fabricated-fight.ts`
- `add` — `tools/fabricated-fight.ts`
- `added` — `tools/develop-reports.ts`, `tools/margonem-readings.ts`
- `adding` — `tools/turn-reading.ts`
- `address` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `adds` — `tools/turn-reading.ts`
- `advance` — `tools/turn-count.ts`
- `afterDriver` — `tools/preview-page.ts`
- `afterLine` — `tools/preview-page.ts`, `tools/preview-site.ts`
- `agreedNames` — `tools/develop-reports.ts`
- `agreeing` — `tools/aura-lifetime.ts`
- `ally` — `tools/fabricated-fight.ts`
- `alone` — `tools/protocol-key-shape.ts`
- `always` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `amounts` — `tools/skill-table.ts`
- `announcementStanding` — `tools/turn-reading.ts`
- `anywhere` — `tools/protocol-key-shape.ts`
- `apart` — `tools/aura-lifetime.ts`
- `apartAgreeing` — `tools/aura-lifetime.ts`
- `appendedScript` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `applied` — `tools/fabricated-fight.ts`
- `args` — `tools/build-userscript.ts`, `tools/develop-reports.ts`, `tools/panel-shots.ts`
- `armour` — `tools/fabricated-fight.ts`
- `article` — `tools/help-article.ts`
- `at` — in 5 files: `tools/`
- `atShouter` — `tools/shout-holding.ts`
- `atSomebodyElse` — `tools/shout-holding.ts`
- `auras` — `tools/skill-table.ts`
- `awaiting` — `tools/fabricated-fight.ts`
- `backHint` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `baseline` — `tools/shout-holding.ts`
- `battleground` — `tools/fabricated-fight.ts`
- `bearers` — `tools/aura-lifetime.ts`
- `beforeBundle` — `tools/panel-shots.ts`, `tools/preview-page.ts`
- `bit` — `tools/aura-lifetime.ts`, `tools/margonem-readings.ts`
- `bitName` — `tools/aura-lifetime.ts`
- `blowsGrantedMinimum` — `tools/skill-table.ts`
- `boolean` — in 8 files: `tools/`
- `boundary` — `tools/turn-reading.ts`
- `bounded` — `tools/turn-count.ts`
- `browser` — `tools/panel-giving-way.ts`
- `build` — `tools/capture-intake.ts`, `tools/margonem-client-source.ts`
- `bundlePath` — `tools/margonem-client-source.ts`
- `cache-control` — `tools/preview-server.ts`
- `cached` — `tools/help-article.ts`, `tools/skill-table.ts`
- `calls` — in 5 files: `tools/`
- `callsAddress` — `tools/preview-page.ts`, `tools/preview-server.ts`
- `captureIntake` — `tools/margometer-tool-error.ts`
- `cardHeight` — `tools/margometer-tool-error.ts`
- `casterId` — `tools/shout-holding.ts`
- `casterIds` — `tools/aura-standing.ts`
- `casters` — `tools/aura-standing.ts`
- `cause` — in 16 files: `tools/`
- `changed` — `tools/capture-intake.ts`
- `changelog` — `tools/margometer-tool-error.ts`
- `changes` — `tools/develop-reports.ts`
- `channel` — `tools/margonem-client-source.ts`
- `closing` — `tools/drill-report.ts`
- `code` — `tools/margometer-tool-error.ts`
- `collect` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `combatantId` — in 4 files: `tools/`
- `combatants` — `tools/fabricated-fight.ts`
- `combatantsAfter` — `tools/fabricated-fight.ts`
- `combatantsBefore` — `tools/fabricated-fight.ts`
- `combo` — `tools/fabricated-fight.ts`
- `commit` — `tools/panel-shots.ts`
- `content-type` — `tools/preview-server.ts`
- `cooldowns` — `tools/fabricated-fight.ts`
- `count` — `tools/frozen-files.ts`
- `counted` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `counts` — `tools/help-article.ts`
- `coverageMinimum` — `tools/aura-standing.ts`, `tools/skill-table.ts`
- `current` — `tools/margonem-readings.ts`
- `cwd` — `tools/build-userscript.ts`, `tools/develop-reports.ts`
- `date` — `tools/frozen-files.ts`
- `dealtSign` — `tools/protocol-key-table.ts`
- `declaredVersion` — `tools/margometer-tool-error.ts`
- `detail` — `tools/card-height.ts`
- `developLines` — `tools/develop-reports.ts`
- `developReport` — `tools/margometer-tool-error.ts`
- `development` — `tools/margonem-client-source.ts`
- `developmentInstall` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `differences` — `tools/develop-reports.ts`
- `digits` — `tools/protocol-key-table.ts`
- `dodatek` — `tools/capture-intake.ts`
- `doesAddressCarryState` — `tools/preview-page.ts`, `tools/preview-server.ts`,
  `tools/preview-site.ts`
- `doesCloseOnShouts` — `tools/fabricated-fight.ts`
- `doesHover` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `doesLoadTwice` — `tools/panel-shots.ts`, `tools/preview-page.ts`
- `doesOpen` — `tools/card-height.ts`
- `doesOpenTurn` — `tools/fabricated-fight.ts`
- `doesShoot` — `tools/panel-giving-way.ts`
- `doesStartFromEmpty` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `drillReport` — `tools/margometer-tool-error.ts`
- `edition` — `tools/preview-server.ts`
- `effects` — `tools/skill-table.ts`
- `element` — `tools/drill-report.ts`
- `elsewhere` — `tools/turn-count.ts`
- `end` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `ending` — `tools/fabricated-fight.ts`
- `endings` — `tools/aura-lifetime.ts`
- `energy` — `tools/fabricated-fight.ts`
- `engine` — `tools/panel-shots.ts`, `tools/preview-page.ts`
- `entry` — in 4 files: `tools/`
- `entryCount` — `tools/preview-page.ts`
- `entryIndex` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `episodes` — `tools/shout-holding.ts`
- `events` — `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `eventsByKind` — `tools/decoding-status.ts`
- `exact` — `tools/turn-count.ts`
- `fabricatedBy` — `tools/fabricated-fight.ts`
- `fabricatedFight` — `tools/margometer-tool-error.ts`
- `fabricatedShape` — `tools/fabricated-fight.ts`
- `fabricationScript` — `tools/fabricated-fight.ts`
- `fedThrough` — `tools/panel-shots.ts`, `tools/preview-page.ts`
- `fetchedAt` — `tools/help-article.ts`, `tools/margonem-client-source.ts`, `tools/skill-table.ts`
- `field` — `tools/protocol-key-table.ts`
- `fight` — in 4 files: `tools/`
- `fightName` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `fightNames` — `tools/preview-server.ts`
- `fights` — in 5 files: `tools/`
- `figureBonus` — `tools/fabricated-fight.ts`
- `figureNow` — `tools/fabricated-fight.ts`
- `files` — `tools/preview-server.ts`
- `fled` — `tools/fabricated-fight.ts`
- `focus` — `tools/fabricated-fight.ts`
- `from` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `fromPaths` — `tools/preview-server.ts`
- `frozen` — `tools/margonem-readings.ts`
- `frozenFiles` — `tools/margometer-tool-error.ts`
- `gender` — `tools/fabricated-fight.ts`
- `givingWay` — `tools/margometer-tool-error.ts`
- `granted` — `tools/skill-table.ts`, `tools/turn-count.ts`
- `gridRow` — `tools/fabricated-fight.ts`
- `groups` — `tools/card-height.ts`
- `halfNamed` — `tools/drill-report.ts`
- `hasMoved` — `tools/frozen-files.ts`
- `headers` — `tools/preview-server.ts`
- `health` — `tools/fabricated-fight.ts`
- `healthMaximum` — `tools/fabricated-fight.ts`
- `healthPercent` — `tools/fabricated-fight.ts`
- `height` — `tools/panel-shots.ts`
- `heldAtOnce` — `tools/aura-standing.ts`
- `heldDate` — `tools/frozen-files.ts`
- `helpArticle` — `tools/margometer-tool-error.ts`
- `holder` — `tools/turn-count.ts`
- `host` — `tools/margonem-client-source.ts`
- `hostname` — `tools/preview-server.ts`
- `hp` — `tools/fabricated-fight.ts`
- `html` — `tools/panel-shots.ts`
- `icon` — `tools/fabricated-fight.ts`
- `id` — `tools/fabricated-fight.ts`, `tools/skill-table.ts`
- `inLump` — `tools/turn-count.ts`
- `index` — `tools/fabricated-fight.ts`
- `install` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `into` — `tools/panel-giving-way.ts`
- `introduction` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `isCases` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `isContested` — `tools/turn-reading.ts`
- `isFabricated` — `tools/fabricated-fight.ts`
- `isKeys` — `tools/turn-reading.ts`
- `isNarrated` — `tools/turn-count.ts`
- `isPlayerById` — `tools/capture-intake.ts`
- `isRowNarrower` — `tools/card-height.ts`
- `isSilent` — `tools/help-claim-register.ts`, `tools/preview-page.ts`, `tools/preview-site.ts`
- `isTallest` — `tools/card-height.ts`
- `key` — in 5 files: `tools/`
- `keys` — `tools/turn-reading.ts`
- `kind` — `tools/develop-reports.ts`, `tools/drill-report.ts`, `tools/protocol-key-table.ts`
- `kinds` — `tools/turn-reading.ts`
- `komunikaty` — `tools/capture-intake.ts`
- `label` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `ladunek` — `tools/capture-intake.ts`
- `language` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `length` — `tools/aura-lifetime.ts`
- `level` — `tools/fabricated-fight.ts`
- `lifted` — `tools/margonem-readings.ts`
- `lightings` — `tools/aura-lifetime.ts`
- `line` — `tools/develop-reports.ts`, `tools/help-claim-register.ts`, `tools/protocol-key-shape.ts`
- `lines` — `tools/card-height.ts`
- `listeners` — `tools/preview-server.ts`
- `litAt` — `tools/aura-lifetime.ts`
- `lost` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `lostId` — `tools/turn-reading.ts`
- `lvl` — `tools/fabricated-fight.ts`
- `mana` — `tools/fabricated-fight.ts`
- `margonem` — `tools/payload-cost.ts`
- `margonemClientSource` — `tools/margometer-tool-error.ts`
- `margonemReadings` — `tools/margometer-tool-error.ts`
- `margonemUnreachable` — `tools/margometer-tool-error.ts`
- `mark` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `marker` — `tools/protocol-key-table.ts`
- `markerAt` — `tools/protocol-key-table.ts`
- `markerLength` — `tools/protocol-key-table.ts`
- `material` — `tools/develop-reports.ts`, `tools/recorded-material.ts`
- `member` — `tools/fabricated-fight.ts`
- `messages` — in 4 files: `tools/`
- `messagesLost` — `tools/decoding-status.ts`
- `messagesRefused` — `tools/decoding-status.ts`
- `messagesWithUnread` — `tools/decoding-status.ts`
- `messagesWithoutParameter` — `tools/decoding-status.ts`
- `messagesWritten` — `tools/fabricated-fight.ts`
- `metadata` — `tools/build-userscript.ts`
- `metadataAddress` — `tools/build-userscript.ts`, `tools/preview-server.ts`
- `metric` — `tools/card-height.ts`
- `microseconds` — `tools/payload-cost.ts`
- `moment` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `momentsFromOne` — `tools/aura-standing.ts`
- `momentsPastTwo` — `tools/aura-standing.ts`
- `momentsWithTwo` — `tools/aura-standing.ts`
- `move` — `tools/fabricated-fight.ts`
- `moveOpening` — `tools/fabricated-fight.ts`
- `name` — in 14 files: `tools/`
- `namedAtOnce` — `tools/aura-standing.ts`
- `namesById` — `tools/capture-intake.ts`
- `needs` — `tools/preview-page.ts`, `tools/preview-site.ts`
- `needsLine` — `tools/preview-page.ts`, `tools/preview-site.ts`
- `neitherEnd` — `tools/drill-report.ts`
- `never` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `newer` — `tools/develop-reports.ts`
- `noKind` — `tools/drill-report.ts`
- `nonPlayer` — `tools/recorded-material.ts`
- `none` — `tools/protocol-key-shape.ts`
- `notes` — `tools/card-height.ts`
- `nr` — `tools/capture-intake.ts`
- `number` — `tools/protocol-key-shape.ts`
- `occurrences` — `tools/protocol-key-shape.ts`
- `offer` — `tools/preview-page.ts`, `tools/preview-site.ts`
- `onAnnouncement` — `tools/protocol-key-shape.ts`
- `onBlow` — `tools/protocol-key-shape.ts`
- `onDamage` — `tools/protocol-key-shape.ts`
- `opened` — `tools/drill-report.ts`, `tools/turn-reading.ts`
- `openedAt` — `tools/turn-count.ts`
- `opener` — `tools/turn-reading.ts`
- `openerId` — `tools/turn-reading.ts`
- `openerKey` — `tools/turn-reading.ts`
- `openerKind` — `tools/turn-reading.ts`
- `opens` — `tools/drill-report.ts`
- `opisow` — `tools/capture-intake.ts`
- `opposing` — `tools/fabricated-fight.ts`
- `ordinal` — `tools/fabricated-fight.ts`
- `originalId` — `tools/fabricated-fight.ts`
- `otherLevel` — `tools/fabricated-fight.ts`
- `outcome` — `tools/turn-count.ts`
- `over` — `tools/panel-shots.ts`, `tools/turn-count.ts`
- `ownTurns` — `tools/aura-lifetime.ts`
- `ownTurnsCommon` — `tools/aura-lifetime.ts`
- `ownTurnsCommonRuns` — `tools/aura-lifetime.ts`
- `ownTurnsEach` — `tools/aura-lifetime.ts`
- `ownTurnsLongest` — `tools/aura-lifetime.ts`
- `pageLength` — `tools/skill-table.ts`
- `pagePath` — `tools/skill-table.ts`
- `pair` — `tools/drill-report.ts`
- `pairs` — `tools/shout-holding.ts`
- `panelShot` — `tools/margometer-tool-error.ts`
- `parameters` — `tools/fabricated-fight.ts`, `tools/turn-reading.ts`
- `part` — `tools/drill-report.ts`
- `paths` — in 6 files: `tools/`
- `pause` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `payload` — `tools/fabricated-fight.ts`, `tools/turn-reading.ts`
- `payloadCost` — `tools/margometer-tool-error.ts`
- `payloadMicroseconds` — `tools/payload-cost.ts`
- `payloads` — `tools/decoding-status.ts`
- `perSide` — `tools/fabricated-fight.ts`
- `person` — `tools/drill-report.ts`
- `phrases` — `tools/help-claim-register.ts`
- `place` — `tools/panel-shots.ts`, `tools/preview-page.ts`, `tools/turn-reading.ts`
- `placeName` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `placed` — `tools/turn-count.ts`
- `placement` — `tools/protocol-key-shape.ts`
- `placements` — `tools/protocol-key-shape.ts`
- `placing` — `tools/turn-count.ts`
- `play` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `playing` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `pominietych` — `tools/capture-intake.ts`
- `poolLeft` — `tools/fabricated-fight.ts`
- `poolMinimum` — `tools/fabricated-fight.ts`
- `poolPenalty` — `tools/fabricated-fight.ts`
- `poolTime` — `tools/fabricated-fight.ts`
- `poolTotal` — `tools/fabricated-fight.ts`
- `port` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `prefix` — `tools/build-userscript.ts`, `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `previewServe` — `tools/margometer-tool-error.ts`
- `production` — `tools/margonem-client-source.ts`
- `prof` — `tools/fabricated-fight.ts`
- `profession` — `tools/card-height.ts`, `tools/fabricated-fight.ts`
- `protocolKeyShape` — `tools/margometer-tool-error.ts`
- `protocolKeyTable` — `tools/margometer-tool-error.ts`
- `provokedId` — `tools/shout-holding.ts`
- `przegladarka` — `tools/capture-intake.ts`
- `przy` — `tools/capture-intake.ts`
- `pseudonimow` — `tools/capture-intake.ts`
- `quoted` — `tools/protocol-key-table.ts`
- `ranking` — `tools/drill-report.ts`
- `raport` — `tools/capture-intake.ts`
- `raw` — `tools/fabricated-fight.ts`
- `reach` — `tools/aura-standing.ts`
- `readBundle` — `tools/preview-server.ts`
- `readDate` — `tools/frozen-files.ts`
- `readerSide` — `tools/drill-report.ts`
- `reading` — `tools/recorded-material.ts`
- `readings` — `tools/turn-reading.ts`
- `record` — `tools/recorded-material.ts`
- `recording` — `tools/capture-intake.ts`, `tools/card-height.ts`
- `recordingRead` — `tools/margometer-tool-error.ts`
- `recordings` — `tools/aura-standing.ts`, `tools/decoding-status.ts`, `tools/protocol-key-shape.ts`
- `recursive` — in 8 files: `tools/`
- `regions` — `tools/panel-giving-way.ts`
- `removed` — `tools/capture-intake.ts`, `tools/develop-reports.ts`, `tools/margonem-readings.ts`
- `resistanceFire` — `tools/fabricated-fight.ts`
- `resistanceFrost` — `tools/fabricated-fight.ts`
- `resistanceLight` — `tools/fabricated-fight.ts`
- `rewriteLines` — `tools/develop-reports.ts`
- `roster` — `tools/drill-report.ts`, `tools/turn-reading.ts`
- `round` — `tools/fabricated-fight.ts`
- `rounds` — `tools/fabricated-fight.ts`
- `row` — `tools/aura-standing.ts`, `tools/drill-report.ts`
- `rows` — `tools/shout-holding.ts`
- `rung` — `tools/drill-report.ts`
- `runs` — `tools/aura-lifetime.ts`
- `says` — `tools/margonem-readings.ts`
- `scale` — `tools/fabricated-fight.ts`
- `screen` — `tools/card-height.ts`, `tools/drill-report.ts`
- `script` — `tools/build-userscript.ts`, `tools/panel-shots.ts`
- `scriptAddress` — `tools/build-userscript.ts`, `tools/preview-server.ts`
- `scriptDirectory` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `scriptName` — `tools/panel-shots.ts`
- `segmentKey` — `tools/protocol-key-table.ts`
- `sentence` — `tools/preview-page.ts`, `tools/preview-site.ts`, `tools/protocol-key-shape.ts`
- `settled` — `tools/fabricated-fight.ts`
- `shape` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `shared` — `tools/develop-reports.ts`
- `short` — `tools/turn-count.ts`
- `shots` — `tools/panel-shots.ts`
- `shouldOpenFabricated` — `tools/preview-server.ts`
- `shouldWatch` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `shut` — `tools/drill-report.ts`
- `side` — `tools/fabricated-fight.ts`
- `sideRelation` — `tools/card-height.ts`
- `skill` — `tools/drill-report.ts`
- `skillId` — `tools/aura-standing.ts`
- `skillName` — `tools/aura-standing.ts`
- `skillTable` — `tools/margometer-tool-error.ts`
- `skills` — `tools/fabricated-fight.ts`, `tools/recorded-material.ts`, `tools/skill-table.ts`
- `skillsComboMaximum` — `tools/fabricated-fight.ts`
- `skillsDisabled` — `tools/fabricated-fight.ts`
- `sometimes` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `source` — `tools/drill-report.ts`
- `sourcesAtOnce` — `tools/aura-standing.ts`
- `stale` — `tools/margonem-readings.ts`
- `standing` — `tools/turn-reading.ts`
- `standingAtOnce` — `tools/aura-standing.ts`
- `start` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `statementOrdinal` — `tools/fabricated-fight.ts`
- `statistics` — `tools/drill-report.ts`
- `status` — `tools/preview-server.ts`
- `statusBitTable` — `tools/margometer-tool-error.ts`
- `statusClearsAtRound` — `tools/fabricated-fight.ts`
- `statusMask` — `tools/fabricated-fight.ts`
- `stderr` — `tools/build-userscript.ts`, `tools/develop-reports.ts`, `tools/panel-shots.ts`
- `stdout` — `tools/build-userscript.ts`, `tools/develop-reports.ts`
- `steps` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`, `tools/recorded-material.ts`
- `stretch` — `tools/turn-count.ts`
- `string` — in 4 files: `tools/`
- `substitutions` — `tools/capture-intake.ts`
- `suffix` — `tools/build-userscript.ts`
- `swiat` — `tools/capture-intake.ts`
- `tables` — `tools/turn-reading.ts`
- `taken` — `tools/turn-count.ts`
- `takenAt` — `tools/panel-shots.ts`
- `tallyMicroseconds` — `tools/payload-cost.ts`
- `target` — `tools/fabricated-fight.ts`
- `team` — `tools/fabricated-fight.ts`
- `text` — in 6 files: `tools/`
- `textLength` — `tools/help-article.ts`
- `textPath` — `tools/help-article.ts`
- `texts` — `tools/frozen-files.ts`
- `title` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `to` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `together` — `tools/aura-lifetime.ts`
- `tooltips` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `translate` — `tools/card-height.ts`
- `turnCount` — `tools/margometer-tool-error.ts`
- `turnReading` — `tools/margometer-tool-error.ts`
- `turns` — `tools/skill-table.ts`, `tools/turn-count.ts`, `tools/turn-reading.ts`
- `turnsAtLighting` — `tools/aura-lifetime.ts`
- `turnsAtShout` — `tools/shout-holding.ts`
- `turnsElapsed` — `tools/aura-lifetime.ts`, `tools/shout-holding.ts`
- `turnsStated` — `tools/aura-standing.ts`
- `under` — `tools/turn-count.ts`
- `underway` — `tools/panel-shots.ts`
- `unknown` — `tools/margonem-readings.ts`
- `unnamed` — `tools/drill-report.ts`
- `unnamedCut` — `tools/drill-report.ts`
- `unnamedNote` — `tools/card-height.ts`
- `unnamedPair` — `tools/drill-report.ts`
- `unreadKeysByFrequency` — `tools/decoding-status.ts`
- `untold` — `tools/turn-count.ts`
- `update` — `tools/recorded-material.ts`
- `url` — `tools/help-article.ts`, `tools/preview-server.ts`, `tools/skill-table.ts`
- `urwany` — `tools/capture-intake.ts`
- `userscriptBuild` — `tools/margometer-tool-error.ts`
- `userscriptName` — `tools/panel-shots.ts`, `tools/preview-page.ts`
- `value` — `tools/capture-intake.ts`, `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `values` — `tools/protocol-key-shape.ts`, `tools/skill-table.ts`
- `verdict` — in 4 files: `tools/`
- `version` — `tools/panel-shots.ts`
- `versionLine` — `tools/preview-page.ts`, `tools/preview-site.ts`
- `viewport` — `tools/panel-shots.ts`
- `wasRemoved` — `tools/capture-intake.ts`
- `wasReportRemoved` — `tools/capture-intake.ts`
- `wentOutAt` — `tools/aura-lifetime.ts`
- `wersja` — `tools/capture-intake.ts`
- `whole` — `tools/protocol-key-shape.ts`
- `width` — `tools/panel-shots.ts`
- `wojownicyPo` — `tools/capture-intake.ts`
- `wojownicyPrzed` — `tools/capture-intake.ts`
- `words` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `wpisy` — `tools/capture-intake.ts`
- `x` — `tools/panel-shots.ts`
- `y` — `tools/panel-shots.ts`

### `tests/`

- `$` — `tests/ports/margonem-engine-tooltip.test.ts`, `tests/rebuilding-battle.ts`
- `+legbon_anguish` — `tests/core/legendary-standing.test.ts`
- `+legbon_curse` — `tests/core/legendary-standing.test.ts`
- `+legbon_holytouch` — `tests/core/legendary-standing.test.ts`
- `+legbon_puncture` — `tests/core/legendary-standing.test.ts`
- `+legbon_verycrit` — `tests/core/legendary-standing.test.ts`
- `-3` — `tests/tools/capture-intake.test.ts`
- `-4` — `tests/tools/capture-intake.test.ts`
- `-legbon_cleanse` — `tests/core/legendary-standing.test.ts`
- `-legbon_critred` — `tests/core/legendary-standing.test.ts`
- `-legbon_facade` — `tests/core/legendary-standing.test.ts`
- `-legbon_glare` — `tests/core/legendary-standing.test.ts`
- `07` — `tests/ports/payload-envelope.test.ts`
- `08` — `tests/ports/payload-envelope.test.ts`
- `1` — `tests/ports/warrior-entries.test.ts`
- `2` — `tests/runtime/fight-file.test.ts`
- `7` — `tests/tools/capture-intake.test.ts`
- `9` — `tests/tools/capture-intake.test.ts`
- `Blob` — `tests/fake-window.ts`
- `CARD_WORDS` — `tests/ui/panel-words.test.ts`
- `CAVEAT` — `tests/ui/panel-words.test.ts`
- `CLIENT_ID_BY_UNWORDED_KEY` — `tests/ui/panel-words.test.ts`
- `DEFENCE_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `Date` — `tests/fake-window.ts`
- `ELEMENT_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `Engine` — in 9 files: `tests/`
- `FIGHT_CARD_WORDS` — `tests/ui/panel-words.test.ts`
- `HEALTH_LOSS_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `HEALTH_SOURCE_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `HELPER_WORDS` — `tests/ui/panel-words.test.ts`
- `LEGENDARY_BONUS_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `MARGOMETER_TIPS` — `tests/e2e/panel-tooltip.spec.ts`
- `MARGOMETER_TOLD` — `tests/e2e/panel-tooltip.spec.ts`
- `NAMED_KEY` — `tests/core/aura-standing.test.ts`
- `PANEL_DEFECT_KIND` — `tests/ui/panel-words.test.ts`
- `PANEL_REGION` — `tests/ui/panel-words.test.ts`
- `PROC_SUB_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `PROC_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `PROFESSION_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `SIGNAL.unknown` — `tests/repository/design-tokens.test.ts`
- `STATUS_CATEGORY` — `tests/ui/panel-words.test.ts`
- `THOUSAND_SEPARATOR` — `tests/ui/panel-words.test.ts`
- `UNANNOUNCED_CAVEATS` — `tests/ui/panel-words.test.ts`
- `URL` — `tests/fake-window.ts`
- `__margometerBattleWrap` — `tests/ports/margonem-engine-battle.test.ts`
- `_t` — `tests/ports/margonem-client-dictionary.test.ts`, `tests/simulation.ts`
- `a` — `tests/libs/json-text.test.ts`, `tests/libs/unknown-value.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `abandoned` — `tests/runtime/margonem-engine-search.test.ts`
- `ac` — `tests/ports/fight-capture.test.ts`, `tests/ports/margonem-engine-warriors.test.ts`
- `across` — `tests/e2e/panel-type.spec.ts`
- `actions/setup-node` — `tests/repository/workflows.test.ts`
- `actorHealthPercent` — in 8 files: `tests/`
- `actorId` — in 9 files: `tests/`
- `addEventListener` — `tests/repository/handed-callbacks.test.ts`
- `addOnVersion` — in 4 files: `tests/`
- `added` — `tests/tools/margonem-readings.test.ts`
- `address` — `tests/tools/preview-page.test.ts`
- `after` — `tests/runtime/live-fight.test.ts`
- `afterDriver` — `tests/e2e/margonem-page.ts`
- `afterLine` — `tests/tools/preview-page.test.ts`
- `agreed` — `tests/core/health-witness.test.ts`, `tests/tools/turn-count.test.ts`
- `agreeing` — `tests/tools/aura-lifetime.test.ts`
- `alias` — `tests/repository/name-register.test.ts`
- `along` — `tests/e2e/panel-probe.ts`
- `amount` — in 13 files: `tests/`
- `amountByKey` — `tests/core/carried-figure.test.ts`
- `amounts` — `tests/tools/skill-table.test.ts`
- `anchor` — `tests/ports/browser-file.test.ts`
- `anchors` — `tests/fake-window.ts`
- `announced` — in 10 files: `tests/`
- `announcedStrikerId` — `tests/core/turn-clock.test.ts`
- `announcementStanding` — in 17 files: `tests/`
- `announcementsActor` — `tests/repository/protocol-keys.test.ts`
- `answer` — `tests/ports/margonem-engine-battle.test.ts`
- `answers` — `tests/e2e/margonem-page.ts`, `tests/ui/panel-element.test.ts`
- `apart` — `tests/tools/aura-lifetime.test.ts`
- `apartAgreeing` — `tests/tools/aura-lifetime.test.ts`
- `appeared` — `tests/core/health-witness.test.ts`
- `appended` — `tests/ports/margonem-engine-tooltip.test.ts`, `tests/rebuilding-battle.ts`,
  `tests/runtime/carried-tooltip.test.ts`
- `appendedScript` — `tests/tools/preview-page.test.ts`
- `applied` — in 8 files: `tests/`
- `args` — in 6 files: `tests/`
- `argument` — `tests/source-tree.ts`
- `arguments` — `tests/source-tree.ts`
- `article` — `tests/tools/help-article.test.ts`
- `asked` — `tests/e2e/panel-options.spec.ts`, `tests/tools/turn-count.test.ts`
- `assertions` — `tests/repository/assertion-density.test.ts`
- `async` — `tests/source-tree.ts`
- `at` — in 9 files: `tests/`
- `atShouter` — `tests/tools/shout-holding.test.ts`
- `atSomebodyElse` — `tests/tools/shout-holding.test.ts`
- `attacks` — `tests/core/fight-decoder.test.ts`
- `attributes` — `tests/fake-document.ts`
- `auraTurnsBySkillId` — `tests/core/aura-standing.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `auto` — `tests/e2e/panel-fixture.ts`, `tests/ports/fight-capture.test.ts`,
  `tests/ports/payload-envelope.test.ts`
- `back` — `tests/ui/panel-words.test.ts`
- `backFromFights` — `tests/ui/panel-words.test.ts`
- `backFromOptions` — `tests/ui/panel-words.test.ts`
- `backHint` — `tests/tools/preview-page.test.ts`
- `bare` — `tests/core/aura-standing.test.ts`, `tests/ui/panel-words.test.ts`
- `bars` — `tests/e2e/panel-scroll.spec.ts`
- `base` — `tests/repository/name-register.test.ts`, `tests/ui/level-drawn.test.ts`
- `battle` — in 9 files: `tests/`
- `before` — `tests/e2e/margonem-page.ts`
- `beforeBundle` — `tests/e2e/margonem-page.ts`
- `behind` — `tests/e2e/panel-scroll.spec.ts`
- `big` — `tests/runtime/fight-file.test.ts`
- `bit` — in 5 files: `tests/`
- `bitName` — `tests/tools/aura-lifetime.test.ts`
- `blobs` — `tests/fake-window.ts`
- `blows` — in 5 files: `tests/`
- `blowsCritical` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-words.test.ts`
- `blowsCriticalOffhand` — `tests/ui/panel-words.test.ts`
- `blowsGrantedBySkillId` — `tests/core/fight-decoder.test.ts`,
  `tests/core/granted-blow-rule.test.ts`, `tests/runtime/live-fight.test.ts`
- `blowsGrantedMinimum` — `tests/tools/skill-table.test.ts`
- `blowsStruck` — `tests/ui/panel-card.test.ts`
- `blowsWithoutSkill` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-words.test.ts`
- `body` — in 6 files: `tests/`
- `border` — `tests/repository/design-tokens.test.ts`
- `bottom` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`,
  `tests/e2e/panel-size.spec.ts`
- `bounded` — `tests/tools/turn-count.test.ts`
- `breaksWritten` — `tests/ports/margonem-engine-tooltip.test.ts`
- `broken` — `tests/ports/recorded-session.test.ts`
- `browser` — `tests/tools/panel-giving-way.test.ts`
- `bubbles` — `tests/e2e/panel-card.spec.ts`
- `buffs` — `tests/ports/payload-envelope.test.ts`, `tests/ports/warrior-entries.test.ts`
- `build` — in 4 files: `tests/`
- `built` — `tests/e2e/panel-fixture.ts`
- `bundlePath` — `tests/tools/margonem-client-source.test.ts`,
  `tests/tools/margonem-readings.test.ts`
- `button` — `tests/e2e/panel-drill.spec.ts`, `tests/e2e/panel-options.spec.ts`,
  `tests/ui/panel-gesture.test.ts`
- `by` — `tests/e2e/panel-drag.spec.ts`
- `byCombatantId` — in 4 files: `tests/`
- `byElement` — `tests/ui/panel-element.test.ts`
- `byHolderId` — `tests/ui/panel-content.test.ts`
- `byName` — `tests/core/fight-decoder.test.ts`
- `byOtherEnd` — `tests/ui/panel-element.test.ts`
- `byReachedId` — `tests/ui/panel-content.test.ts`
- `bySkill` — `tests/ui/panel-element.test.ts`
- `call` — `tests/ports/fight-capture.test.ts`
- `callIndex` — `tests/ports/fight-capture.test.ts`
- `callee` — `tests/source-tree.ts`
- `calls` — in 11 files: `tests/`
- `callsAddress` — `tests/tools/preview-page.test.ts`
- `cancelled` — `tests/ports/browser-frame.test.ts`
- `cancels` — `tests/runtime/margonem-engine-search.test.ts`
- `capture` — `tests/runtime/panel-frame.test.ts`
- `capturedAt` — `tests/runtime/fight-file.test.ts`, `tests/tools/capture-intake.test.ts`
- `card` — in 5 files: `tests/`
- `cardAt` — `tests/e2e/panel-helper.spec.ts`
- `cardWidth` — `tests/repository/design-tokens.test.ts`
- `carried` — `tests/tools/preview-page.test.ts`
- `carriedStatuses` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`
- `castSeparator` — `tests/ui/panel-words.test.ts`
- `caster` — `tests/core/absorption-destruction-rule.test.ts`
- `casterColour` — `tests/ui/panel-helper.test.ts`
- `casterId` — `tests/core/carried-figure.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-helper.test.ts`
- `casterName` — `tests/ui/panel-helper.test.ts`
- `casterSideRelation` — `tests/ui/panel-helper.test.ts`
- `casters` — `tests/tools/aura-standing.test.ts`
- `casts` — `tests/core/carried-figure.test.ts`
- `cause` — `tests/ports/browser-console.test.ts`
- `caveat` — `tests/repository/design-tokens.test.ts`, `tests/ui/card-window.test.ts`,
  `tests/ui/panel-look.test.ts`
- `channel` — `tests/e2e/panel-camera.ts`, `tests/tools/margonem-client-source.test.ts`,
  `tests/tools/margonem-readings.test.ts`
- `charge` — `tests/core/charged-skill.test.ts`, `tests/core/fight-session.test.ts`,
  `tests/ports/warrior-entries.test.ts`
- `chargeStatements` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`
- `chargedSkill` — `tests/ui/panel-words.test.ts`
- `chargedSkills` — in 4 files: `tests/`
- `charging` — `tests/ports/recorded-session.test.ts`
- `children` — `tests/fake-document.ts`, `tests/tools/preview-state.test.ts`
- `choice` — `tests/runtime/live-fight.test.ts`, `tests/runtime/shelf-keeper.test.ts`,
  `tests/ui/panel-intent.test.ts`
- `claim` — `tests/repository/protocol-keys.test.ts`
- `class` — `tests/repository/name-register.test.ts`
- `className` — in 5 files: `tests/`
- `classes` — `tests/repository/name-register.test.ts`
- `clause` — `tests/tools/aura-lifetime.test.ts`
- `clear` — `tests/e2e/panel-layer.spec.ts`
- `cleared` — `tests/ports/browser-interval.test.ts`
- `clientHeight` — `tests/e2e/panel-card.spec.ts`
- `clientWidth` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `clientX` — in 4 files: `tests/`
- `clientY` — in 4 files: `tests/`
- `clip` — `tests/e2e/panel-camera.ts`
- `clock` — in 4 files: `tests/`
- `closed` — `tests/e2e/panel-crawler.ts`
- `closing` — `tests/ui/panel-element.test.ts`
- `collapse` — `tests/ui/panel-words.test.ts`
- `colon` — `tests/ui/panel-words.test.ts`
- `colour` — `tests/ui/panel-helper.test.ts`, `tests/ui/view-failure.test.ts`
- `combatantId` — in 24 files: `tests/`
- `combatantIds` — `tests/core/fight-statistics.test.ts`, `tests/tools/decoding-status.test.ts`
- `combatantNames` — `tests/core/turn-clock.test.ts`, `tests/repository/redacted-names.test.ts`
- `combatants` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`,
  `tests/recorded-fights.ts`
- `combatantsAfter` — in 5 files: `tests/`
- `combatantsBefore` — in 5 files: `tests/`
- `combatantsMaximum` — `tests/core/fight-session.test.ts`, `tests/runtime/live-fight.test.ts`
- `compared` — `tests/core/health-witness.test.ts`
- `composed` — `tests/e2e/panel-card.spec.ts`
- `computed` — `tests/source-tree.ts`
- `concatTip` — `tests/ports/margonem-engine-tooltip.test.ts`
- `configFile` — `tests/e2e/build-once.ts`
- `console` — in 9 files: `tests/`
- `constant` — `tests/repository/name-register.test.ts`
- `constants` — `tests/repository/declaration-order.test.ts`
- `constructor` — `tests/libs/unknown-value.test.ts`
- `constructs` — `tests/repository/browser-support.test.ts`
- `contentType` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-fixture.ts`
- `contents` — `tests/runtime/shelf.test.ts`
- `count` — in 7 files: `tests/`
- `counted` — `tests/e2e/panel-card.spec.ts`, `tests/tools/turn-reading.test.ts`
- `coverageMinimum` — `tests/core/aura-standing.test.ts`, `tests/tools/aura-standing.test.ts`,
  `tests/tools/skill-table.test.ts`
- `covered` — `tests/e2e/panel-layer.spec.ts`
- `create` — `tests/source-tree.ts`
- `createObjectURL` — `tests/fake-window.ts`
- `created` — `tests/fake-document.ts`
- `cur` — `tests/ports/margonem-engine-battle.test.ts`,
  `tests/ports/margonem-engine-warriors.test.ts`, `tests/ports/warrior-entries.test.ts`
- `cut` — `tests/e2e/panel-marks.spec.ts`, `tests/ui/panel-words.test.ts`
- `cwd` — `tests/e2e/build-once.ts`
- `d` — `tests/ports/margonem-engine-hero.test.ts`, `tests/ports/margonem-engine-place.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `damageByNeitherEnd` — `tests/ui/panel-content.test.ts`
- `damageByNeitherEndByKind` — `tests/ui/panel-content.test.ts`
- `damageDealt` — `tests/runtime/fight-file.test.ts`, `tests/ui/panel-card.test.ts`,
  `tests/ui/panel-content.test.ts`
- `damageDealtAbsorbed` — `tests/runtime/fight-file.test.ts`
- `damageDealtAbsorbedByDefence` — `tests/ui/panel-card.test.ts`
- `damageDealtApplied` — `tests/runtime/fight-file.test.ts`
- `damageDealtByKind` — `tests/ui/panel-content.test.ts`
- `damageDealtByNobody` — `tests/runtime/panel-frame.test.ts`, `tests/ui/panel-content.test.ts`
- `damageDealtByOpponent` — `tests/ui/panel-content.test.ts`
- `damageDealtRaw` — `tests/runtime/fight-file.test.ts`, `tests/ui/panel-card.test.ts`
- `damageDealtToNobody` — `tests/ui/panel-card.test.ts`
- `damageDealtToNobodyByKind` — `tests/core/fight-statistics.test.ts`
- `damageDealtWithoutSkillByOpponent` — `tests/runtime/panel-frame.test.ts`,
  `tests/ui/panel-content.test.ts`
- `damageKind` — `tests/ui/panel-words.test.ts`
- `damagePrevented` — `tests/core/fight-statistics.test.ts`, `tests/runtime/fight-file.test.ts`,
  `tests/ui/panel-card.test.ts`
- `damagePreventedByDefence` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-card.test.ts`
- `damageTaken` — in 4 files: `tests/`
- `damageTakenAbsorbed` — `tests/core/fight-statistics.test.ts`, `tests/runtime/fight-file.test.ts`
- `damageTakenAbsorbedByDefence` — `tests/core/fight-statistics.test.ts`,
  `tests/ui/panel-card.test.ts`
- `damageTakenApplied` — `tests/core/fight-statistics.test.ts`, `tests/runtime/fight-file.test.ts`
- `damageTakenByNobody` — `tests/ui/panel-content.test.ts`
- `damageTakenFromNobody` — `tests/ui/panel-card.test.ts`
- `damageTakenRaw` — `tests/runtime/fight-file.test.ts`, `tests/ui/panel-card.test.ts`
- `date` — `tests/repository/decisions.test.ts`, `tests/tools/margonem-readings.test.ts`
- `day` — in 5 files: `tests/`
- `dealt` — `tests/runtime/fight-file.test.ts`, `tests/tools/capture-intake.test.ts`
- `dealtByOpponent` — `tests/runtime/fight-file.test.ts`
- `dealtSign` — `tests/tools/frozen-files.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `dealtTo` — `tests/ui/panel-words.test.ts`
- `declaration` — `tests/source-tree.ts`
- `declarations` — `tests/source-tree.ts`
- `declared` — in 12 files: `tests/`
- `deeper` — `tests/e2e/panel-crawler.ts`
- `defect` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-look.test.ts`
- `defects` — in 7 files: `tests/`
- `defence` — `tests/core/fight-decoder.test.ts`
- `defences` — `tests/ui/blow-vocabulary.test.ts`
- `denoland/setup-deno` — `tests/repository/workflows.test.ts`
- `depth` — `tests/repository/nesting-depth.test.ts`
- `description` — `tests/repository/documents.test.ts`
- `descriptionsRemoved` — `tests/tools/capture-intake.test.ts`
- `destroyed` — in 10 files: `tests/`
- `detail` — `tests/repository/browser-support.test.ts`, `tests/ui/panel-card.test.ts`,
  `tests/ui/panel-element.test.ts`
- `develop` — `tests/ui/panel-look.test.ts`
- `developmentInstall` — `tests/tools/preview-page.test.ts`
- `dictionary` — `tests/fake-window.ts`, `tests/runtime-world.ts`
- `died` — `tests/core/health-witness.test.ts`
- `dmg` — `tests/runtime/fight-file.test.ts`
- `document` — `tests/fake-window.ts`, `tests/repository/cited-paths.test.ts`,
  `tests/runtime-world.ts`
- `doesAddressCarryState` — `tests/tools/preview-page.test.ts`
- `doesCarryUnsizedShare` — `tests/core/health-witness.test.ts`
- `doesCover` — `tests/e2e/panel-helper.spec.ts`
- `doesFakeClock` — `tests/e2e/panel-boot.spec.ts`, `tests/e2e/panel-fixture.ts`
- `doesHover` — `tests/e2e/panel-camera.ts`, `tests/tools/panel-giving-way.test.ts`,
  `tests/tools/panel-shots.test.ts`
- `doesLoadTwice` — `tests/e2e/margonem-page.ts`, `tests/e2e/panel-boot.spec.ts`,
  `tests/e2e/panel-fixture.ts`
- `doesOpen` — `tests/ui/panel-card.test.ts`
- `doesOpenPair` — `tests/ui/panel-element.test.ts`
- `doesOpenPart` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `doesShoot` — `tests/tools/panel-giving-way.test.ts`
- `doesSpanPoolRaise` — `tests/core/health-witness.test.ts`
- `doesStartFromEmpty` — `tests/tools/preview-page.test.ts`
- `doesTakeValue` — `tests/core/protocol-key.test.ts`
- `doesThrowOnFind` — `tests/ports/margonem-engine-tooltip.test.ts`
- `down` — `tests/e2e/panel-type.spec.ts`
- `download` — `tests/fake-window.ts`, `tests/ports/browser-file.test.ts`
- `downloads` — `tests/fake-window.ts`, `tests/ports/browser-file.test.ts`
- `drag` — `tests/ui/panel-words.test.ts`
- `drawn` — in 5 files: `tests/`
- `drill` — `tests/ui/panel-element.test.ts`
- `droppedCalls` — `tests/runtime/fight-file.test.ts`
- `droppedOpenedAt` — `tests/runtime/shelf.test.ts`
- `edge` — `tests/tools/preview-state.test.ts`, `tests/ui/card-window.test.ts`,
  `tests/ui/panel-drag.test.ts`
- `effect` — in 8 files: `tests/`
- `effects` — `tests/tools/frozen-files.test.ts`
- `either` — `tests/verb-purities.ts`
- `eitherKind` — `tests/ui/panel-words.test.ts`
- `element` — in 14 files: `tests/`
- `elements` — `tests/repository/purity.test.ts`, `tests/source-tree.ts`
- `end` — in 6 files: `tests/`
- `endBattle` — in 4 files: `tests/`
- `endedAtOrdinal` — `tests/runtime/panel-frame.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-helper.test.ts`
- `ending` — `tests/ui/card-window.test.ts`, `tests/ui/panel-words.test.ts`
- `energy` — `tests/ports/fight-capture.test.ts`, `tests/ports/margonem-engine-warriors.test.ts`
- `engine` — in 4 files: `tests/`
- `entries` — `tests/core/aura-standing.test.ts`
- `entry` — `tests/repository/changelog.test.ts`, `tests/tools/preview-page.test.ts`,
  `tests/tools/preview-state.test.ts`
- `entryIndex` — `tests/tools/preview-page.test.ts`
- `episodes` — `tests/tools/shout-holding.test.ts`
- `events` — in 4 files: `tests/`
- `eventsAtSeatingByCombatantId` — `tests/core/aura-standing.test.ts`,
  `tests/core/carried-figure.test.ts`
- `eventsMaximum` — `tests/core/fight-session.test.ts`
- `exact` — `tests/tools/turn-count.test.ts`
- `executablePath` — `tests/e2e/panel-camera.ts`
- `expand` — `tests/ui/panel-words.test.ts`
- `expression` — `tests/source-tree.ts`
- `exts` — `tests/source-tree.ts`
- `f` — `tests/libs/unknown-value.test.ts`
- `failure` — `tests/repository/name-register.test.ts`, `tests/runtime/defect-ledger.test.ts`,
  `tests/ui/view-failure.test.ts`
- `failures` — `tests/runtime/margonem-engine-search.test.ts`, `tests/ui/full-cast-bound.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `faults` — `tests/e2e/panel-crawler.ts`
- `faultsInjected` — `tests/simulation.ts`
- `fed` — `tests/e2e/margonem-page.ts`, `tests/tools/preview-state.test.ts`
- `fedThrough` — in 9 files: `tests/`
- `fetchedAt` — in 4 files: `tests/`
- `field` — `tests/ports/payload-envelope.test.ts`, `tests/repository/name-register.test.ts`
- `fight` — `tests/tools/preview-server.test.ts`
- `fightName` — `tests/tools/preview-page.test.ts`
- `fightPlace` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`
- `fightUnread` — `tests/ui/panel-words.test.ts`
- `fights` — in 11 files: `tests/`
- `fightsUnreadable` — `tests/runtime/shelf.test.ts`
- `figure` — in 5 files: `tests/`
- `figures` — `tests/runtime/panel-frame.test.ts`, `tests/ui/level-drawn.test.ts`
- `file` — `tests/runtime-world.ts`, `tests/runtime/margometer-runtime.test.ts`
- `files` — `tests/repository/name-register.test.ts`
- `fill` — `tests/ui/panel-element.test.ts`
- `filler` — `tests/tools/capture-intake.test.ts`
- `find` — `tests/ports/margonem-engine-tooltip.test.ts`
- `fire` — `tests/ports/browser-interval.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `first` — `tests/ui/card-window.test.ts`
- `fled` — `tests/ui/panel-words.test.ts`
- `focus` — `tests/runtime/carried-tooltip.test.ts`
- `folded` — `tests/tools/preview-state.test.ts`
- `font` — `tests/e2e/panel-type.spec.ts`
- `fontSize` — `tests/repository/design-tokens.test.ts`
- `foo` — `tests/runtime/fight-file.test.ts`
- `foot` — `tests/e2e/panel-size.spec.ts`
- `foreignThrowPercent` — `tests/simulation.test.ts`, `tests/simulation.ts`
- `formatCardSubtitle` — `tests/ui/panel-words.test.ts`
- `formatDefect` — `tests/ui/panel-words.test.ts`
- `formatVersion` — `tests/tools/capture-intake.test.ts`
- `found` — `tests/repository/browser-suite-keys.test.ts`
- `frame` — `tests/fake-window.ts`, `tests/repository/event-entries.test.ts`
- `frames` — in 4 files: `tests/`
- `from` — `tests/tools/turn-reading.test.ts`
- `fromPaths` — `tests/tools/preview-server.test.ts`
- `frozen` — `tests/tools/margonem-readings.test.ts`
- `fullStop` — `tests/ui/panel-words.test.ts`
- `function` — `tests/repository/name-register.test.ts`
- `functions` — `tests/repository/assertion-density.test.ts`,
  `tests/repository/browser-support.test.ts`, `tests/repository/declaration-order.test.ts`
- `gameBuild` — `tests/runtime/shelf.test.ts`, `tests/tools/capture-intake.test.ts`
- `gesture` — `tests/ui/panel-words.test.ts`
- `gestureBack` — `tests/ui/panel-words.test.ts`
- `gestureBackAnywhere` — `tests/ui/panel-words.test.ts`
- `getAttribute` — `tests/ui/panel-intent.test.ts`
- `getDate` — `tests/ports/browser-clock.test.ts`
- `getHours` — `tests/ports/browser-clock.test.ts`
- `getItem` — `tests/ports/browser-store.test.ts`, `tests/runtime/settings.test.ts`
- `getMinutes` — `tests/ports/browser-clock.test.ts`
- `getMonth` — `tests/ports/browser-clock.test.ts`
- `getShelf` — `tests/runtime-world.ts`, `tests/runtime/shelf-keeper.test.ts`
- `given` — `tests/e2e/panel-card.spec.ts`
- `glued` — `tests/core/fight-decoder.test.ts`
- `grammar-refused` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`,
  `tests/core/fight-session.test.ts`
- `granted` — `tests/tools/turn-count.test.ts`
- `groupCost` — `tests/e2e/panel-card.spec.ts`
- `groups` — `tests/drawn-card.ts`, `tests/tools/card-height.test.ts`,
  `tests/ui/card-window.test.ts`
- `half` — `tests/core/protocol-key.test.ts`
- `halfNamed` — `tests/ui/panel-element.test.ts`
- `handle` — `tests/ui/card-window.test.ts`
- `hasChoiceRefused` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `hasElement` — `tests/ports/margonem-engine-tooltip.test.ts`
- `hasEngine` — `tests/ports/margonem-engine-battle.test.ts`
- `hasFightToSave` — `tests/panel-view.ts`, `tests/shown-screen.ts`
- `hasFiguresDisagreed` — `tests/ui/panel-element.test.ts`, `tests/ui/view-failure.test.ts`
- `hasInvariantBroken` — `tests/simulation.ts`
- `hasJoinedInProgress` — in 5 files: `tests/`
- `hasMethods` — `tests/ports/margonem-engine-tooltip.test.ts`
- `hasMoveRefused` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `hasMoved` — `tests/tools/margonem-readings.test.ts`
- `hasPinRefused` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `hasSnapshot` — `tests/recorded-fights.ts`, `tests/tools/decoding-status.test.ts`
- `hasSpentLastheal` — `tests/ui/panel-words.test.ts`
- `hasStoreMadeRoom` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `hasStoreRefused` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `hasThrownIntoMargonem` — `tests/simulation.ts`
- `hash` — `tests/tools/preview-state.test.ts`
- `heading` — `tests/ui/panel-look.test.ts`
- `headings` — `tests/drawn-card.ts`
- `heal` — `tests/core/last-heal-rule.test.ts`
- `heals` — `tests/core/legendary-standing.test.ts`
- `health` — `tests/recorded-fights.ts`
- `healthGiven` — `tests/runtime/fight-file.test.ts`, `tests/ui/panel-card.test.ts`,
  `tests/ui/panel-content.test.ts`
- `healthGivenByNobody` — `tests/ui/panel-content.test.ts`
- `healthGivenByReceiver` — `tests/ui/panel-content.test.ts`
- `healthMaximum` — in 17 files: `tests/`
- `healthNow` — `tests/recorded-fights.ts`
- `healthPercent` — in 8 files: `tests/`
- `healthReadings` — `tests/recorded-fights.ts`
- `healthRestored` — `tests/core/fight-statistics.test.ts`, `tests/runtime/fight-file.test.ts`,
  `tests/ui/panel-card.test.ts`
- `healthRestoredByNobody` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-card.test.ts`
- `healthRestoredByNobodyByKey` — `tests/core/fight-statistics.test.ts`
- `healthRestoredToNobody` — `tests/ui/panel-content.test.ts`
- `healthSource` — `tests/ui/panel-words.test.ts`
- `height` — in 19 files: `tests/`
- `heightMaximum` — `tests/ui/panel-drag.test.ts`
- `heightMinimum` — `tests/ui/panel-drag.test.ts`
- `heightPixels` — `tests/ui/card-window.test.ts`
- `held` — in 4 files: `tests/`
- `heldAtOnce` — `tests/tools/aura-standing.test.ts`
- `heldDate` — `tests/tools/margonem-readings.test.ts`
- `helper` — `tests/ui/panel-drag.test.ts`, `tests/ui/panel-element.test.ts`
- `helperPlacement` — `tests/panel-view.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-gesture.test.ts`
- `helperRight` — `tests/e2e/panel-helper.spec.ts`
- `helperWidth` — `tests/repository/design-tokens.test.ts`
- `here` — `tests/ui/panel-look.test.ts`
- `hero` — in 5 files: `tests/`
- `history` — `tests/tools/preview-state.test.ts`
- `holder` — `tests/repository/name-register.test.ts`
- `holytouchHealsReceived` — `tests/ui/panel-words.test.ts`
- `honesty` — `tests/e2e/panel-fixture.ts`
- `host` — in 5 files: `tests/`
- `hostAt` — `tests/e2e/panel-layer.spec.ts`
- `hostname` — `tests/fake-window.ts`, `tests/ports/browser-surroundings.test.ts`
- `hour` — in 5 files: `tests/`
- `hp` — in 5 files: `tests/`
- `href` — `tests/fake-window.ts`, `tests/ports/browser-file.test.ts`
- `html` — `tests/e2e/panel-camera.ts`
- `id` — in 30 files: `tests/`
- `imported` — `tests/source-tree.ts`
- `imports` — `tests/repository/declaration-order.test.ts`
- `includeDirs` — `tests/source-tree.ts`
- `index` — `tests/runtime/fight-file.test.ts`, `tests/tools/capture-intake.test.ts`
- `inherited` — `tests/libs/unknown-value.test.ts`
- `init` — in 8 files: `tests/`
- `inkDark` — `tests/repository/design-tokens.test.ts`
- `inkLight` — `tests/repository/design-tokens.test.ts`
- `innerHeight` — `tests/fake-window.ts`, `tests/userscript-entry.test.ts`
- `innerWidth` — `tests/fake-window.ts`, `tests/userscript-entry.test.ts`
- `insideSection` — `tests/ui/panel-words.test.ts`
- `install` — `tests/tools/preview-page.test.ts`
- `interfaceAt` — `tests/e2e/panel-layer.spec.ts`
- `interfaceLayer` — `tests/e2e/panel-layer.spec.ts`
- `interval` — `tests/runtime-world.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `into` — `tests/tools/panel-giving-way.test.ts`
- `introduction` — `tests/tools/preview-page.test.ts`
- `isApart` — `tests/ui/level-drawn.test.ts`
- `isCases` — `tests/tools/turn-count.test.ts`
- `isChainBroken` — `tests/core/last-heal-rule.test.ts`
- `isChosen` — `tests/ui/panel-element.test.ts`, `tests/ui/shelf-bound.test.ts`
- `isDirectory` — `tests/source-tree.ts`
- `isDrawn` — `tests/core/fight-statistics.test.ts`
- `isEnd` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`
- `isEverySlotPinned` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `isExported` — `tests/repository/declaration-order.test.ts`
- `isFabricated` — `tests/repository/fabricated-fights.test.ts`,
  `tests/tools/capture-intake.test.ts`
- `isFightUnread` — `tests/panel-view.ts`
- `isFile` — `tests/repository/cited-paths.test.ts`
- `isFled` — `tests/core/fight-statistics.test.ts`
- `isFunction` — `tests/repository/declaration-order.test.ts`
- `isGrip` — `tests/e2e/panel-probe.ts`
- `isInit` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`,
  `tests/ports/payload-envelope.test.ts`
- `isKeys` — `tests/tools/turn-reading.test.ts`
- `isLive` — in 4 files: `tests/`
- `isMeterCollapsed` — `tests/panel-view.ts`, `tests/shown-screen.ts`,
  `tests/ui/panel-element.test.ts`
- `isOnAuto` — in 6 files: `tests/`
- `isOnShelf` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `isOpening` — `tests/ports/fight-capture.test.ts`
- `isOver` — in 5 files: `tests/`
- `isPastCeiling` — `tests/ports/fight-capture.test.ts`
- `isPinnable` — `tests/runtime/panel-frame.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `isPinned` — in 6 files: `tests/`
- `isPlayer` — `tests/repository/captured-fight-register.test.ts`
- `isRowNarrower` — `tests/ui/panel-card.test.ts`
- `isSectionOpened` — `tests/ui/level-drawn.test.ts`
- `isSilent` — `tests/tools/preview-page.test.ts`
- `isStrong` — `tests/drawn-card.ts`, `tests/ui/card-window.test.ts`
- `isSub` — `tests/drawn-card.ts`
- `isTruncated` — `tests/runtime/fight-file.test.ts`
- `isUnread` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `isWide` — `tests/e2e/panel-card.spec.ts`
- `keeper` — `tests/runtime/live-fight.test.ts`, `tests/runtime/panel-frame.test.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `kept` — `tests/ports/fight-capture.test.ts`, `tests/runtime/live-fight.test.ts`
- `keptUnread` — `tests/panel-view.ts`, `tests/ui/panel-words.test.ts`
- `keptUnreadNote` — `tests/ui/panel-words.test.ts`
- `key` — in 11 files: `tests/`
- `keyByStatusBit` — `tests/core/carried-figure.test.ts`
- `keys` — `tests/core/skill-announcement-rule.test.ts`, `tests/repository/name-register.test.ts`,
  `tests/tools/aura-lifetime.test.ts`
- `kind` — in 29 files: `tests/`
- `kinds` — `tests/e2e/panel-crawler.ts`, `tests/ui/panel-element.test.ts`
- `kindsSaid` — `tests/simulation.ts`
- `komunikaty` — `tests/tools/capture-intake.test.ts`
- `l` — `tests/libs/unknown-value.test.ts`
- `label` — `tests/drawn-card.ts`, `tests/tools/preview-page.test.ts`,
  `tests/ui/card-window.test.ts`
- `lacking` — `tests/ports/margonem-engine-tooltip.test.ts`
- `ladunek` — `tests/tools/capture-intake.test.ts`
- `language` — `tests/e2e/margonem-page.ts`, `tests/tools/preview-page.test.ts`
- `lastActorId` — `tests/core/turn-clock.test.ts`
- `lastCall` — `tests/e2e/margonem-page.ts`
- `lastShout` — `tests/core/aura-standing.test.ts`
- `late` — `tests/e2e/margonem-page.ts`
- `leaves` — `tests/e2e/panel-crawler.ts`
- `ledger` — `tests/runtime/defect-ledger.test.ts`
- `left` — in 8 files: `tests/`
- `legbon_lastheal` — `tests/core/legendary-standing.test.ts`
- `legendary` — `tests/ui/panel-words.test.ts`
- `legendaryBonuses` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`
- `legendaryBonusesReached` — `tests/ui/panel-card.test.ts`
- `legendaryHeld` — `tests/ui/panel-words.test.ts`
- `legendaryReached` — `tests/ui/panel-words.test.ts`
- `legendaryStandings` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`
- `length` — in 32 files: `tests/`
- `level` — in 19 files: `tests/`
- `lifted` — `tests/tools/margonem-readings.test.ts`
- `lightings` — `tests/tools/aura-lifetime.test.ts`
- `line` — `tests/tools/develop-reports.test.ts`, `tests/tools/protocol-key-shape.test.ts`
- `lineHeight` — `tests/repository/design-tokens.test.ts`
- `lineRight` — `tests/e2e/panel-card.spec.ts`
- `lines` — in 9 files: `tests/`
- `lint` — `tests/source-tree.ts`
- `listName` — in 4 files: `tests/`
- `listed` — `tests/libs/unknown-value.test.ts`
- `listener` — `tests/runtime/margonem-engine-search.test.ts`
- `live` — `tests/runtime/live-fight.test.ts`, `tests/runtime/panel-frame.test.ts`
- `local` — `tests/repository/name-register.test.ts`, `tests/source-tree.ts`
- `localStorage` — `tests/fake-window.ts`, `tests/tools/preview-page.test.ts`
- `location` — `tests/fake-window.ts`, `tests/ports/browser-surroundings.test.ts`,
  `tests/tools/preview-state.test.ts`
- `longCast` — `tests/e2e/panel-helper.spec.ts`
- `longDrawn` — `tests/e2e/panel-helper.spec.ts`
- `longWanted` — `tests/e2e/panel-helper.spec.ts`
- `lost` — `tests/tools/turn-count.test.ts`, `tests/ui/panel-words.test.ts`
- `lostNames` — `tests/core/fight-statistics.test.ts`
- `lvl` — in 4 files: `tests/`
- `m` — in 10 files: `tests/`
- `mana` — `tests/ports/fight-capture.test.ts`, `tests/ports/margonem-engine-warriors.test.ts`
- `map` — `tests/ports/margonem-engine-place.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `mapName` — in 5 files: `tests/`
- `margometerE2e` — `tests/tools/preview-state.test.ts`
- `margonem` — `tests/fake-window.ts`, `tests/simulation.ts`
- `margonemClientBuild` — in 4 files: `tests/`
- `margonemEngineBattle` — `tests/runtime/panel-frame.test.ts`
- `mark` — `tests/e2e/panel-camera.ts`, `tests/tools/panel-giving-way.test.ts`,
  `tests/tools/panel-shots.test.ts`
- `marker` — `tests/tools/frozen-files.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `markerAt` — `tests/tools/frozen-files.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `markerLength` — `tests/tools/frozen-files.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `marks` — `tests/e2e/panel-marks.spec.ts`
- `material` — in 7 files: `tests/`
- `max` — in 5 files: `tests/`
- `maxHeightShare` — `tests/repository/design-tokens.test.ts`
- `maximum` — `tests/ports/margonem-engine-warriors.test.ts`, `tests/ports/payload-envelope.test.ts`
- `message` — in 5 files: `tests/`
- `messageActor` — `tests/repository/protocol-keys.test.ts`
- `messages` — in 9 files: `tests/`
- `messagesLost` — in 4 files: `tests/`
- `messagesRead` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`,
  `tests/ui/panel-content.test.ts`
- `messagesStated` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`
- `metadata` — `tests/tools/preview-server.test.ts`
- `metadataAddress` — `tests/tools/build-userscript.test.ts`, `tests/tools/preview-server.test.ts`
- `meter` — `tests/ui/panel-drag.test.ts`, `tests/ui/panel-element.test.ts`
- `meterPlacement` — in 4 files: `tests/`
- `meterWidth` — `tests/repository/design-tokens.test.ts`
- `method` — `tests/libs/unknown-value.test.ts`, `tests/ports/margonem-engine-battle.test.ts`
- `metric` — in 8 files: `tests/`
- `mi` — `tests/ports/payload-envelope.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `midStrike` — `tests/core/granted-blow-rule.test.ts`
- `minute` — in 5 files: `tests/`
- `missing` — `tests/ports/margonem-client-dictionary.test.ts`
- `momentsFromOne` — `tests/tools/aura-standing.test.ts`
- `momentsPastTwo` — `tests/tools/aura-standing.test.ts`
- `momentsWithTwo` — `tests/tools/aura-standing.test.ts`
- `month` — in 5 files: `tests/`
- `more` — `tests/ports/fight-capture.test.ts`
- `most` — `tests/ports/fight-capture.test.ts`
- `mount` — `tests/fake-window.ts`
- `moved` — `tests/core/fight-decoder.test.ts`, `tests/core/health-witness.test.ts`,
  `tests/ui/panel-look.test.ts`
- `myteam` — `tests/ports/payload-envelope.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `n` — `tests/libs/unknown-value.test.ts`, `tests/ports/margonem-engine-battle.test.ts`
- `name` — in 50 files: `tests/`
- `named` — `tests/e2e/panel-save.spec.ts`, `tests/libs/unknown-value.test.ts`,
  `tests/repository/name-shapes.test.ts`
- `namedAtOnce` — `tests/tools/aura-standing.test.ts`
- `namesSubstituted` — `tests/tools/capture-intake.test.ts`
- `namespaced` — `tests/repository/name-shapes.test.ts`
- `navigator` — `tests/fake-window.ts`, `tests/ports/browser-surroundings.test.ts`
- `needs` — `tests/tools/preview-page.test.ts`
- `needsLine` — `tests/tools/preview-page.test.ts`
- `nested` — `tests/libs/unknown-value.test.ts`
- `nick` — `tests/ports/margonem-engine-hero.test.ts`
- `no-parameter` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`,
  `tests/core/fight-session.test.ts`
- `noFightYet` — `tests/ui/panel-words.test.ts`
- `noKind` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `noSides` — `tests/ui/panel-words.test.ts`
- `nobody` — `tests/repository/protocol-keys.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-look.test.ts`
- `node` — `tests/repository/nesting-depth.test.ts`
- `none` — `tests/core/granted-blow-rule.test.ts`, `tests/e2e/margonem-page.ts`,
  `tests/verb-purities.ts`
- `notes` — `tests/drawn-card.ts`, `tests/tools/card-height.test.ts`
- `nothingHappens` — `tests/ui/panel-words.test.ts`
- `nothingYet` — `tests/ui/panel-words.test.ts`
- `now` — `tests/ui/panel-words.test.ts`
- `npc` — `tests/ports/margonem-engine-warriors.test.ts`, `tests/tools/capture-intake.test.ts`
- `nr` — `tests/tools/capture-intake.test.ts`
- `number` — `tests/repository/decisions.test.ts`, `tests/repository/documents.test.ts`
- `object` — `tests/source-tree.ts`
- `occurrences` — `tests/tools/protocol-key-shape.test.ts`
- `offer` — `tests/tools/preview-page.test.ts`
- `offered` — `tests/fake-window.ts`
- `offsetPixels` — `tests/ui/card-window.test.ts`, `tests/ui/panel-drag.test.ts`
- `onBeforeCall` — `tests/ports/margonem-engine-battle.test.ts`
- `onPageCall` — `tests/fake-window.ts`, `tests/simulation.ts`
- `onPayload` — `tests/ports/margonem-engine-battle.test.ts`
- `onto` — `tests/e2e/panel-probe.ts`
- `openFights` — `tests/ui/panel-words.test.ts`
- `openOptions` — `tests/ui/panel-words.test.ts`
- `openPart` — `tests/runtime/screen-intent.test.ts`
- `openUnnamedEnd` — `tests/runtime/opened-readings.test.ts`, `tests/runtime/screen-intent.test.ts`
- `opened` — in 6 files: `tests/`
- `openedAt` — in 7 files: `tests/`
- `openedAtRefusal` — `tests/runtime/panel-frame.test.ts`
- `openedCombatantId` — `tests/runtime/opened-readings.test.ts`,
  `tests/runtime/screen-intent.test.ts`
- `operator` — `tests/source-tree.ts`
- `opposing` — `tests/ui/panel-element.test.ts`
- `option` — `tests/e2e/panel-fixture.ts`
- `optional` — `tests/source-tree.ts`
- `options` — in 5 files: `tests/`
- `ordinal` — in 4 files: `tests/`
- `originalId` — `tests/ports/margonem-engine-warriors.test.ts`
- `other` — `tests/ports/fight-capture.test.ts`
- `others` — `tests/e2e/panel-scroll.spec.ts`, `tests/runtime/margonem-engine-search.test.ts`
- `ourSide` — `tests/ui/panel-words.test.ts`
- `ours` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-look.test.ts`
- `outcome` — in 6 files: `tests/`
- `outcomes` — `tests/core/fight-decoder.test.ts`
- `outside` — `tests/repository/redacted-names.test.ts`
- `outsideNote` — `tests/ui/panel-words.test.ts`
- `outsideRanking` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-words.test.ts`
- `outsideRow` — `tests/ui/panel-words.test.ts`
- `over` — `tests/tools/preview-state.test.ts`, `tests/tools/turn-count.test.ts`
- `overflow` — `tests/e2e/panel-size.spec.ts`
- `ownTurnsCommon` — `tests/tools/aura-lifetime.test.ts`
- `ownTurnsCommonRuns` — `tests/tools/aura-lifetime.test.ts`
- `ownTurnsLongest` — `tests/tools/aura-lifetime.test.ts`
- `page` — in 5 files: `tests/`
- `pageLength` — `tests/tools/skill-table.test.ts`
- `pagePath` — `tests/tools/skill-table.test.ts`
- `pair` — `tests/shown-screen.ts`, `tests/ui/level-drawn.test.ts`, `tests/ui/panel-element.test.ts`
- `pairCombatantId` — `tests/runtime/screen-intent.test.ts`
- `paired` — `tests/core/last-heal-rule.test.ts`
- `pairs` — `tests/repository/browser-support.test.ts`, `tests/tools/shout-holding.test.ts`
- `panel` — `tests/e2e/panel-fixture.ts`, `tests/ui/panel-element.test.ts`
- `panelInset` — `tests/repository/design-tokens.test.ts`
- `panelLayer` — `tests/repository/design-tokens.test.ts`
- `panelLeft` — `tests/e2e/panel-helper.spec.ts`
- `param` — `tests/source-tree.ts`
- `parameter` — `tests/repository/name-register.test.ts`, `tests/source-tree.ts`
- `params` — `tests/source-tree.ts`
- `parent` — `tests/source-tree.ts`
- `parsed` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/core/skill-announcement-rule.test.ts`
- `part` — in 5 files: `tests/`
- `parts` — `tests/runtime/panel-frame.test.ts`
- `past` — `tests/core/last-heal-rule.test.ts`, `tests/ports/fight-capture.test.ts`
- `path` — in 16 files: `tests/`
- `paths` — in 4 files: `tests/`
- `pattern` — `tests/source-tree.ts`
- `pause` — `tests/tools/preview-page.test.ts`
- `payload` — in 9 files: `tests/`
- `payloadRefusal` — `tests/runtime/panel-frame.test.ts`
- `payloads` — in 6 files: `tests/`
- `payloadsApplied` — in 4 files: `tests/`
- `payloadsMaximum` — `tests/core/fight-session.test.ts`, `tests/runtime/live-fight.test.ts`
- `payloadsPerFrame` — `tests/simulation.test.ts`, `tests/simulation.ts`
- `percent` — `tests/core/last-heal-rule.test.ts`, `tests/ui/panel-words.test.ts`
- `percentAfter` — `tests/core/health-witness.test.ts`
- `percentBefore` — `tests/core/health-witness.test.ts`, `tests/core/last-heal-rule.test.ts`
- `percentByName` — `tests/core/last-heal-rule.test.ts`
- `pinned` — `tests/ui/panel-element.test.ts`
- `place` — in 14 files: `tests/`
- `placeName` — `tests/tools/preview-page.test.ts`
- `placement` — `tests/tools/protocol-key-shape.test.ts`
- `places` — `tests/ui/level-drawn.test.ts`
- `plain` — `tests/core/granted-blow-rule.test.ts`
- `plainApplied` — `tests/core/granted-blow-rule.test.ts`
- `play` — `tests/tools/preview-page.test.ts`
- `playing` — `tests/tools/preview-page.test.ts`
- `pointerId` — `tests/fake-document.ts`, `tests/ui/panel-gesture.test.ts`
- `pointersHeld` — `tests/fake-document.ts`
- `pointersReleased` — `tests/fake-document.ts`
- `poll` — `tests/ports/fight-capture.test.ts`
- `port` — `tests/tools/panel-giving-way.test.ts`, `tests/tools/preview-server.test.ts`
- `ports` — `tests/runtime-world.ts`
- `position` — in 5 files: `tests/`
- `prefix` — in 7 files: `tests/`
- `pressed` — `tests/ui/helper-window.test.ts`
- `presses` — `tests/e2e/panel-crawler.ts`
- `prevented` — in 9 files: `tests/`
- `procs` — in 9 files: `tests/`
- `procsWhenStriking` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`
- `procsWhenStruck` — `tests/ui/panel-card.test.ts`
- `prof` — in 4 files: `tests/`
- `profession` — in 18 files: `tests/`
- `promised` — `tests/e2e/panel-level.spec.ts`, `tests/ui/level-drawn.test.ts`
- `properties` — `tests/repository/browser-support.test.ts`, `tests/repository/purity.test.ts`,
  `tests/source-tree.ts`
- `property` — `tests/source-tree.ts`
- `provocation` — `tests/ui/panel-words.test.ts`
- `provocations` — `tests/ui/view-failure.test.ts`
- `provoked` — `tests/ui/panel-helper.test.ts`
- `provokedBy` — `tests/ui/panel-words.test.ts`
- `provokedCount` — `tests/ui/panel-words.test.ts`
- `provokedId` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `purities` — `tests/repository/name-register.test.ts`
- `quiet` — `tests/ui/panel-look.test.ts`
- `r` — `tests/libs/unknown-value.test.ts`
- `radius` — `tests/repository/design-tokens.test.ts`
- `radiusSmall` — `tests/repository/design-tokens.test.ts`
- `raised` — `tests/core/health-witness.test.ts`
- `range` — `tests/repository/declaration-order.test.ts`, `tests/source-tree.ts`
- `rank` — `tests/ui/panel-element.test.ts`
- `ranking` — `tests/shown-screen.ts`, `tests/simulation.ts`, `tests/ui/panel-element.test.ts`
- `raw` — in 9 files: `tests/`
- `reach` — `tests/core/carried-figure.test.ts`, `tests/tools/aura-standing.test.ts`
- `read` — `tests/e2e/panel-save.spec.ts`, `tests/repository/redacted-names.test.ts`
- `readDate` — `tests/tools/margonem-readings.test.ts`
- `readFiguresSaid` — `tests/runtime/panel-frame.test.ts`
- `readViewport` — `tests/ui/panel-element.test.ts`
- `reader` — in 4 files: `tests/`
- `readerId` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`,
  `tests/runtime/shelf.test.ts`
- `readerSide` — in 8 files: `tests/`
- `reading` — `tests/tools/decoding-status.test.ts`, `tests/ui/panel-element.test.ts`
- `recording` — in 7 files: `tests/`
- `recordings` — `tests/tools/aura-standing.test.ts`
- `recursive` — in 6 files: `tests/`
- `refusals` — `tests/runtime/margonem-engine-search.test.ts`
- `refused` — `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/panel-frame.test.ts`
- `regex` — `tests/source-tree.ts`
- `region` — `tests/runtime/defect-ledger.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/view-failure.test.ts`
- `register` — `tests/ui/card-window.test.ts`
- `registries` — `tests/rebuilding-battle.ts`
- `registry` — `tests/ports/margonem-engine-tooltip.test.ts`
- `relatedTarget` — `tests/e2e/panel-card.spec.ts`, `tests/fake-document.ts`,
  `tests/ui/view-failure.test.ts`
- `removeItem` — `tests/ports/browser-store.test.ts`, `tests/runtime/settings.test.ts`
- `removed` — `tests/tools/margonem-readings.test.ts`
- `replaced` — `tests/ports/margonem-engine-tooltip.test.ts`
- `replacedBy` — `tests/fake-document.ts`
- `replay` — `tests/tools/fabricated-fight.test.ts`, `tests/ui/level-drawn.test.ts`
- `replays` — `tests/ui/panel-content.test.ts`
- `report` — `tests/runtime/margonem-engine-search.test.ts`, `tests/tools/capture-intake.test.ts`
- `requestAnimationFrame` — `tests/repository/handed-callbacks.test.ts`
- `resizeGrip` — `tests/ui/panel-words.test.ts`
- `resizeHint` — `tests/ui/panel-words.test.ts`
- `resolved` — `tests/core/fight-decoder.test.ts`
- `rest` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `restNote` — `tests/ui/panel-words.test.ts`
- `restOfKinds` — `tests/ui/panel-words.test.ts`
- `restored` — `tests/core/fight-decoder.test.ts`, `tests/runtime/fight-file.test.ts`
- `restoredByOpponent` — `tests/runtime/fight-file.test.ts`
- `result` — `tests/core/turn-clock.test.ts`, `tests/repository/redacted-names.test.ts`
- `revision` — `tests/repository/cited-paths.test.ts`
- `revokeObjectURL` — `tests/fake-window.ts`
- `right` — `tests/e2e/panel-options.spec.ts`, `tests/e2e/panel-probe.ts`,
  `tests/e2e/panel-size.spec.ts`
- `rootDir` — `tests/e2e/build-once.ts`
- `rootListeners` — `tests/fake-document.ts`
- `roster` — in 22 files: `tests/`
- `row` — `tests/e2e/panel-options.spec.ts`, `tests/e2e/panel-type.spec.ts`,
  `tests/tools/drill-report.test.ts`
- `rowHeight` — `tests/repository/design-tokens.test.ts`
- `rows` — in 5 files: `tests/`
- `rowsVisibleCount` — `tests/ui/panel-element.test.ts`
- `rules` — `tests/source-tree.ts`
- `rung` — `tests/tools/drill-report.test.ts`
- `runtime` — `tests/runtime-world.ts`
- `said` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-fixture.ts`,
  `tests/e2e/panel-helper.spec.ts`
- `saidByKey` — `tests/ui/level-drawn.test.ts`
- `sameTop` — `tests/e2e/panel-helper.spec.ts`
- `saveFight` — `tests/ui/panel-words.test.ts`
- `saved` — `tests/e2e/margonem-page.ts`, `tests/runtime-world.ts`
- `says` — `tests/tools/margonem-readings.test.ts`
- `scope` — `tests/e2e/panel-fixture.ts`, `tests/repository/browser-globals.test.ts`,
  `tests/ui/panel-words.test.ts`
- `screen` — in 4 files: `tests/`
- `screens` — `tests/e2e/panel-crawler.ts`
- `script` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-fixture.ts`,
  `tests/tools/preview-server.test.ts`
- `scriptAddress` — `tests/tools/build-userscript.test.ts`, `tests/tools/preview-server.test.ts`
- `scriptDirectory` — `tests/e2e/margonem-page.ts`, `tests/tools/preview-page.test.ts`
- `scriptName` — `tests/e2e/panel-camera.ts`
- `scripts` — `tests/fake-window.ts`, `tests/repository/name-register.test.ts`
- `scrollHeight` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `scrollTop` — `tests/fake-document.ts`
- `scrollWidth` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `second` — `tests/e2e/panel-crawler.ts`
- `secondColumnFrom` — `tests/ui/card-window.test.ts`
- `section` — `tests/repository/changelog.test.ts`, `tests/repository/declaration-order.test.ts`
- `seed` — `tests/simulation.test.ts`, `tests/simulation.ts`
- `selector` — `tests/e2e/panel-layer.spec.ts`, `tests/e2e/panel-probe.ts`, `tests/style-sheet.ts`
- `selectors` — `tests/repository/browser-support.test.ts`
- `sentence` — `tests/tools/preview-page.test.ts`
- `session` — `tests/fake-window.ts`, `tests/runtime/panel-frame.test.ts`
- `sessionOptions` — `tests/runtime-world.ts`, `tests/runtime/live-fight.test.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `sessionStorage` — `tests/fake-window.ts`
- `setInterval` — `tests/repository/handed-callbacks.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `setItem` — `tests/ports/browser-store.test.ts`, `tests/runtime/settings.test.ts`
- `setTimeout` — `tests/repository/handed-callbacks.test.ts`
- `settings` — in 4 files: `tests/`
- `shadow` — `tests/fake-document.ts`
- `shape` — `tests/ports/fight-capture.test.ts`, `tests/tools/protocol-key-shape.test.ts`
- `share` — `tests/core/absorption-destruction-rule.test.ts`, `tests/tools/shout-holding.test.ts`,
  `tests/ui/panel-words.test.ts`
- `shareOfFigure` — `tests/ui/panel-words.test.ts`
- `shareText` — `tests/ui/panel-element.test.ts`, `tests/ui/share-column.test.ts`
- `shelf` — in 4 files: `tests/`
- `shelfAnswers` — `tests/shown-screen.ts`
- `shelfEmpty` — `tests/ui/panel-words.test.ts`
- `short` — `tests/tools/turn-count.test.ts`, `tests/ui/level-drawn.test.ts`
- `shortDrawn` — `tests/e2e/panel-helper.spec.ts`
- `shortWanted` — `tests/e2e/panel-helper.spec.ts`
- `shouldOpenFabricated` — `tests/tools/preview-server.test.ts`
- `shouldWatch` — `tests/tools/preview-server.test.ts`
- `shoutTargetId` — `tests/core/carried-figure.test.ts`
- `shoutsBySkillId` — `tests/core/aura-standing.test.ts`
- `shown` — in 8 files: `tests/`
- `side` — in 20 files: `tests/`
- `sideHealsStated` — `tests/ui/panel-content.test.ts`
- `sideHealsUnsized` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`
- `sideRelation` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-helper.test.ts`,
  `tests/ui/view-failure.test.ts`
- `sides` — `tests/ui/panel-element.test.ts`
- `sightings` — `tests/repository/name-register.test.ts`
- `sinceUnsized` — `tests/core/last-heal-rule.test.ts`
- `size` — in 4 files: `tests/`
- `sizeDefault` — `tests/ui/panel-words.test.ts`
- `sizeOwn` — `tests/ui/panel-words.test.ts`
- `sizeReset` — `tests/ui/panel-words.test.ts`
- `sizes` — in 4 files: `tests/`
- `skillId` — in 9 files: `tests/`
- `skillName` — in 13 files: `tests/`
- `skillUses` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-words.test.ts`
- `skills` — `tests/tools/capture-intake.test.ts`, `tests/ui/panel-words.test.ts`
- `snapshotBefore` — `tests/runtime/panel-frame.test.ts`
- `source` — in 8 files: `tests/`
- `sourceCode` — `tests/source-tree.ts`
- `sourcesAtOnce` — `tests/tools/aura-standing.test.ts`
- `spaceBeforeTile` — `tests/e2e/panel-card.spec.ts`
- `spaceHalf` — `tests/repository/design-tokens.test.ts`
- `spaceRegion` — `tests/repository/design-tokens.test.ts`
- `spaceSmall` — `tests/repository/design-tokens.test.ts`
- `spaceWide` — `tests/repository/design-tokens.test.ts`
- `specifiers` — `tests/source-tree.ts`
- `spelled` — `tests/ui/panel-words.test.ts`
- `spent` — `tests/core/legendary-standing.test.ts`
- `spill` — `tests/e2e/panel-options.spec.ts`
- `src` — `tests/fake-window.ts`, `tests/ports/margonem-client-build.test.ts`,
  `tests/userscript-entry.test.ts`
- `stale` — `tests/runtime/live-fight.test.ts`
- `standing` — `tests/core/carried-status.test.ts`
- `standingAt` — `tests/e2e/panel-helper.spec.ts`
- `standingAtOnce` — `tests/tools/aura-standing.test.ts`
- `standings` — `tests/runtime/panel-frame.test.ts`
- `start` — `tests/tools/preview-page.test.ts`
- `started` — `tests/ports/browser-interval.test.ts`
- `starts` — `tests/runtime/margonem-engine-search.test.ts`
- `state` — in 5 files: `tests/`
- `stated` — `tests/drawn-card.ts`, `tests/ui/card-window.test.ts`, `tests/ui/level-drawn.test.ts`
- `statedSkills` — `tests/runtime/margometer-runtime.test.ts`
- `statement` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `statistic` — `tests/core/fight-decoder.test.ts`
- `statistics` — in 7 files: `tests/`
- `statisticsDestroyed` — `tests/ui/panel-card.test.ts`
- `status` — in 4 files: `tests/`
- `statusClearsAtRound` — `tests/tools/fabricated-fight.test.ts`
- `statusMask` — `tests/tools/fabricated-fight.test.ts`
- `statusMasksByCombatantId` — `tests/core/fight-figures.test.ts`,
  `tests/core/fight-session.test.ts`
- `statuses` — `tests/core/carried-figure.test.ts`, `tests/ui/panel-words.test.ts`
- `stderr` — `tests/repository/cited-paths.test.ts`
- `stdin` — `tests/repository/name-register.test.ts`
- `stdio` — `tests/e2e/build-once.ts`
- `stdout` — in 4 files: `tests/`
- `step` — `tests/e2e/panel-options.spec.ts`, `tests/e2e/panel-type.spec.ts`,
  `tests/ui/panel-intent.test.ts`
- `steps` — in 4 files: `tests/`
- `storage` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-words.test.ts`
- `store` — `tests/tools/preview-page.test.ts`, `tests/tools/preview-state.test.ts`
- `storeRead` — `tests/fake-window.ts`
- `storeRefusalPercent` — `tests/simulation.test.ts`, `tests/simulation.ts`
- `storeWrite` — `tests/fake-window.ts`
- `stored` — `tests/fake-window.ts`
- `striking` — `tests/ui/panel-words.test.ts`
- `strings` — `tests/repository/name-register.test.ts`
- `strong` — `tests/verb-purities.ts`
- `struck` — `tests/ports/recorded-session.test.ts`, `tests/ui/panel-words.test.ts`
- `style` — `tests/runtime/margometer-runtime.test.ts`
- `subjectsOwn` — `tests/repository/protocol-keys.test.ts`
- `subtitle` — `tests/drawn-card.ts`, `tests/ui/card-window.test.ts`
- `suffix` — `tests/tools/recorded-material.test.ts`
- `summary` — `tests/e2e/panel-size.spec.ts`
- `superClass` — `tests/source-tree.ts`
- `super_cast` — `tests/ports/warrior-entries.test.ts`
- `supersedes` — `tests/repository/decisions.test.ts`
- `surface` — `tests/repository/design-tokens.test.ts`
- `surfaceRaised` — `tests/repository/design-tokens.test.ts`
- `surroundings` — `tests/runtime-world.ts`
- `suspect` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-look.test.ts`
- `suspicions` — in 4 files: `tests/`
- `swiat` — `tests/tools/capture-intake.test.ts`
- `table` — `tests/core/granted-blow-rule.test.ts`
- `tables` — in 21 files: `tests/`
- `tag` — `tests/fake-document.ts`
- `taken` — `tests/tools/turn-count.test.ts`
- `takenFrom` — `tests/ui/panel-words.test.ts`
- `target` — `tests/fake-document.ts`, `tests/ui/panel-gesture.test.ts`,
  `tests/ui/view-failure.test.ts`
- `targetHealthPercent` — in 9 files: `tests/`
- `targetId` — in 9 files: `tests/`
- `targetName` — `tests/core/legendary-standing.test.ts`, `tests/repository/redacted-names.test.ts`
- `tasks` — `tests/repository/name-register.test.ts`
- `team` — in 7 files: `tests/`
- `text` — in 21 files: `tests/`
- `textContent` — `tests/fake-document.ts`
- `textLength` — `tests/tools/help-article.test.ts`
- `textPath` — `tests/tools/help-article.test.ts`
- `textQuiet` — `tests/repository/design-tokens.test.ts`
- `texts` — `tests/tools/margonem-readings.test.ts`
- `theMargonemEngineBattle` — `tests/ports/margonem-engine-battle.test.ts`
- `theirSide` — `tests/ui/panel-words.test.ts`
- `theirs` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-look.test.ts`
- `thisArg` — `tests/ports/margonem-engine-battle.test.ts`
- `tick` — `tests/runtime/margonem-engine-search.test.ts`
- `tile` — `tests/e2e/panel-card.spec.ts`, `tests/ui/panel-element.test.ts`
- `tileRight` — `tests/e2e/panel-card.spec.ts`
- `timer` — `tests/fake-window.ts`
- `timers` — `tests/ports/browser-file.test.ts`, `tests/ports/browser-interval.test.ts`,
  `tests/runtime/margonem-engine-search.test.ts`
- `title` — in 4 files: `tests/`
- `to` — `tests/tools/turn-reading.test.ts`
- `toString` — `tests/libs/unknown-value.test.ts`
- `together` — `tests/tools/aura-lifetime.test.ts`
- `told` — in 4 files: `tests/`
- `tone` — `tests/ui/card-window.test.ts`
- `tooltip` — in 4 files: `tests/`
- `tooltips` — `tests/tools/preview-page.test.ts`
- `top` — in 8 files: `tests/`
- `total` — `tests/ui/panel-element.test.ts`, `tests/ui/share-column.test.ts`
- `total_turns` — `tests/ports/warrior-entries.test.ts`
- `totals` — `tests/runtime/fight-file.test.ts`, `tests/runtime/panel-frame.test.ts`,
  `tests/ui/panel-content.test.ts`
- `track` — `tests/repository/design-tokens.test.ts`
- `tracked` — `tests/repository/name-register.test.ts`
- `translate` — `tests/panel-view.ts`, `tests/ui/panel-card.test.ts`
- `turn` — `tests/ports/warrior-entries.test.ts`
- `turnHolder` — `tests/ui/view-failure.test.ts`
- `turnHolderId` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`
- `turnOrdinal` — `tests/ui/view-failure.test.ts`
- `turnState` — `tests/ui/view-failure.test.ts`
- `turnStatement` — in 4 files: `tests/`
- `turns` — in 7 files: `tests/`
- `turnsAtCastByCombatantId` — `tests/core/carried-figure.test.ts`
- `turnsByCombatantId` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`
- `turnsElapsed` — in 11 files: `tests/`
- `turnsLeft` — `tests/ui/panel-words.test.ts`
- `turnsLost` — `tests/core/fight-decoder.test.ts`, `tests/ui/panel-card.test.ts`
- `turnsStated` — in 10 files: `tests/`
- `turnsTaken` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-words.test.ts`
- `turnsWithLost` — `tests/ui/panel-words.test.ts`
- `turns_warriors` — `tests/ports/payload-envelope.test.ts`
- `type` — `tests/ports/browser-file.test.ts`, `tests/repository/name-register.test.ts`,
  `tests/source-tree.ts`
- `typeAnnotation` — `tests/source-tree.ts`
- `typeName` — `tests/source-tree.ts`
- `typeParameter` — `tests/repository/name-register.test.ts`
- `typeSize` — `tests/ui/panel-words.test.ts`
- `typeStep` — `tests/panel-view.ts`, `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`
- `types` — `tests/repository/declaration-order.test.ts`, `tests/source-tree.ts`
- `under` — `tests/tools/turn-count.test.ts`
- `undrawn` — `tests/runtime/panel-frame.test.ts`
- `unexplained` — `tests/core/health-witness.test.ts`
- `unhandledKinds` — `tests/simulation.ts`
- `unknown` — `tests/repository/browser-suite-keys.test.ts`, `tests/ui/panel-words.test.ts`
- `unknown-key` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`,
  `tests/core/fight-session.test.ts`
- `unknownHowMany` — `tests/ui/panel-words.test.ts`
- `unnamed` — `tests/shown-screen.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-element.test.ts`
- `unnamedCut` — `tests/shown-screen.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-element.test.ts`
- `unnamedNote` — `tests/ui/panel-card.test.ts`
- `unplaced` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `unread` — in 5 files: `tests/`
- `unreadCause` — `tests/core/fight-statistics.test.ts`, `tests/tools/decoding-status.test.ts`
- `unreadKeys` — `tests/core/fight-statistics.test.ts`, `tests/tools/decoding-status.test.ts`
- `unreadMessagesGrammarRefused` — `tests/ui/panel-content.test.ts`
- `unreadMessagesNoParameter` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`
- `unreadMessagesUnknownKey` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `unsized` — `tests/core/fight-decoder.test.ts`
- `untold` — `tests/tools/turn-count.test.ts`
- `updateData` — `tests/ports/margonem-engine-battle.test.ts`, `tests/rebuilding-battle.ts`
- `updates` — `tests/recorded-fights.ts`, `tests/runtime/shelf.test.ts`
- `url` — `tests/tools/help-article.test.ts`, `tests/tools/skill-table.test.ts`
- `userAgent` — `tests/fake-window.ts`, `tests/ports/browser-surroundings.test.ts`,
  `tests/runtime/fight-file.test.ts`
- `userscriptName` — `tests/e2e/margonem-page.ts`, `tests/e2e/panel-fixture.ts`
- `uses` — `tests/runtime/fight-file.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `value` — in 11 files: `tests/`
- `values` — `tests/tools/skill-table.test.ts`
- `vanished` — `tests/core/health-witness.test.ts`
- `verdict` — in 5 files: `tests/`
- `version` — `tests/e2e/panel-fixture.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/runtime/shelf.test.ts`
- `versionLine` — `tests/tools/preview-page.test.ts`
- `versions` — `tests/repository/browser-support.test.ts`
- `view` — `tests/recorded-fights.ts`, `tests/runtime/panel-frame.test.ts`,
  `tests/tools/decoding-status.test.ts`
- `viewport` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-card.spec.ts`
- `vocabularies` — `tests/repository/name-register.test.ts`
- `w` — in 8 files: `tests/`
- `waited` — `tests/runtime/panel-frame.test.ts`
- `walk` — `tests/source-tree.ts`
- `warriors` — `tests/ports/margonem-engine-warriors.test.ts`
- `warriorsList` — in 6 files: `tests/`
- `wasRefused` — `tests/ports/fight-capture.test.ts`, `tests/runtime/live-fight.test.ts`
- `wasTurnLostRead` — `tests/ui/panel-card.test.ts`
- `weak` — `tests/verb-purities.ts`
- `wersja` — `tests/tools/capture-intake.test.ts`
- `where` — `tests/ui/share-column.test.ts`
- `wholeFight` — `tests/ui/panel-words.test.ts`
- `width` — in 16 files: `tests/`
- `widthMaximum` — `tests/ui/panel-drag.test.ts`
- `widthMinimum` — `tests/ui/panel-drag.test.ts`
- `widthPixels` — `tests/ui/card-window.test.ts`, `tests/ui/panel-drag.test.ts`
- `widths` — `tests/ui/level-drawn.test.ts`
- `window` — in 6 files: `tests/`
- `windowAt` — `tests/e2e/panel-layer.spec.ts`
- `windowLayer` — `tests/e2e/panel-layer.spec.ts`
- `windowShadow` — `tests/repository/design-tokens.test.ts`
- `windowSize` — `tests/ui/panel-words.test.ts`
- `windowSizes` — `tests/panel-view.ts`, `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`
- `withoutActor` — `tests/ui/panel-words.test.ts`
- `withoutKind` — `tests/ui/panel-words.test.ts`
- `withoutSide` — `tests/ui/panel-words.test.ts`
- `withoutTarget` — `tests/ui/panel-words.test.ts`
- `won` — `tests/ui/panel-words.test.ts`
- `wonNames` — `tests/core/fight-statistics.test.ts`
- `worded` — `tests/repository/comment-share.test.ts`
- `words` — `tests/tools/preview-page.test.ts`, `tests/ui/card-window.test.ts`
- `world` — in 8 files: `tests/`
- `woundsAttacker` — `tests/repository/protocol-keys.test.ts`
- `wpisy` — `tests/tools/capture-intake.test.ts`
- `wrapped` — `tests/runtime/live-fight.test.ts`
- `wraps` — `tests/runtime/margonem-engine-search.test.ts`
- `writable` — `tests/ports/margonem-engine-battle.test.ts`
- `writer` — `tests/ports/margonem-engine-tooltip.test.ts`
- `written` — `tests/ports/margonem-engine-tooltip.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/panel-frame.test.ts`
- `x` — in 16 files: `tests/`
- `y` — in 15 files: `tests/`

## Vocabularies

Each `as const` object of a module, by its keys.

### `libs/`

- `FIELD_TYPE` — `libs/unknown-value.ts`: `number`, `text`, `statedText`, `record`, `list`

### `src/core/`

- `AURA_REACH` — `src/core/aura-standing.ts`: `bothSides`
- `BATTLE_EVENT` — `src/core/battle-event.ts`: `attack`, `damageToNamedCombatant`, `declaration`,
  `fightOutcome`, `healingToNamedCombatant`, `healthChange`, `skillUsed`, `turnLost`,
  `unaccountedHealth`, `unknownMessage`
- `CHARGED_SKILL_STATE` — `src/core/charged-skill.ts`: `charging`, `struck`, `broken`
- `DAMAGE_HALF` — `src/core/protocol-key.ts`: `raw`, `applied`
- `DEFENCE_MECHANISM` — `src/core/protocol-key.ts`: `pool`, `chance`
- `KEY_FAMILY` — `src/core/protocol-key.ts`: `damage`, `prevented`, `destroyed`, `proc`,
  `healthChange`, `declaration`, `valuelessDeclaration`, `skillName`, `customSkillName`, `skillId`,
  `outcome`, `fled`, `unaccountedHealth`, `namedDamage`, `namedHealing`
- `KEY_REACH` — `src/core/protocol-key.ts`: `castersSide`, `otherSide`
- `LEGENDARY_BONUS_SHOWING` — `src/core/protocol-key.ts`: `fired`, `held`
- `MESSAGE_END` — `src/core/fight-decoder.ts`: `actor`, `target`
- `OUTCOME_RESULT` — `src/core/battle-event.ts`: `won`, `lost`, `drawn`, `fled`
- `PROC_END` — `src/core/protocol-key.ts`: `actor`, `target`, `unsettled`
- `SESSION_PHASE` — `src/core/fight-session.ts`: `waiting`, `underway`, `over`
- `UNREAD_CAUSE` — `src/core/battle-event.ts`: `unknownKey`, `noParameter`, `grammarRefused`

### `src/ports/`

- `BLOCK_LANDING` — `src/ports/margonem-engine-tooltip.ts`: `on`, `off`, `kept`, `refused`
- `MARGONEM_VALUE` — `src/ports/margonem-value.ts`: `place`, `hero`, `label`, `build`
- `STORE_KEY` — `src/ports/browser-store.ts`: `fights`, `meterFolded`, `meterPosition`,
  `helperFolded`, `helperPosition`, `storage`, `typeStep`, `meterSize`, `helperSize`

### `src/runtime/`

- `DEFECT_KIND` — `src/runtime/defect-ledger.ts`: `kept`, `keeping`, `mount`, `region`, `reading`,
  `figures`, `gesture`, `file`, `engine`
- `FAILURE_FATE` — `src/runtime/failure-fate.ts`: `shownAsUnknown`, `shownAsSuspect`, `defect`,
  `shelfAnswer`, `fallbackWithDefect`, `standDown`, `none`, `byPlace`
- `FIGURES_CUT` — `src/runtime/panel-frame.ts`: `screen`, `drill`, `pair`, `part`, `helper`
- `FILE_FIELD` — `src/runtime/fight-file.ts`: `formatVersion`, `addOnVersion`, `capturedAt`,
  `world`, `margonemClientBuild`, `userAgent`, `report`, `droppedCalls`, `isTruncated`, `calls`,
  `index`, `payload`, `messages`, `combatantsBefore`, `combatantsAfter`
- `REPORT_KEY_BY_FIGHT_FIELD` — `src/runtime/fight-file.ts`: `damageDealtByNobody`,
  `damageTakenByNobody`, `healthGivenByNobody`, `healthRestoredToNobody`, `damageByNeitherEnd`,
  `sideHealsUnsized`, `sideHealsStated`
- `REPORT_KEY_BY_ROW_FIELD` — `src/runtime/fight-file.ts`: `sideHealsUnsized`,
  `healthRestoredByNobodyByKey`, `healthRestoredByKey`, `healthRestoredWithoutSkillByKey`,
  `damageTakenWithoutSkillByKey`, `damageDealtWithoutSkillByKey`,
  `damageDealtWithoutSkillByOpponentAndKey`, `healthGivenWithoutSkillByReceiverAndKey`
- `REPORT_KEY_BY_SKILL_FIELD` — `src/runtime/fight-file.ts`: `damageDealt`, `damageDealtByOpponent`,
  `healthGiven`, `healthGivenByReceiver`
- `SETTING_KEY` — `src/runtime/settings.ts`: `storage`, `typeStep`, `meterPosition`, `meterFolded`,
  `helperPosition`, `helperFolded`, `meterSize`, `helperSize`

### `src/ui/`

- `BAR_ICON` — `src/ui/panel-look.ts`: `options`, `shelf`, `save`, `fold`, `unfold`
- `CARD_EDGE` — `src/ui/panel-drag.ts`: `left`, `right`
- `CARD_KEY_PLACE` — `src/ui/panel-element.ts`: `skill`, `pair`, `pairKinds`
- `CARD_LINE` — `src/ui/panel-element.ts`: `stat`, `sub`, `heading`, `note`
- `CARD_NOTE_TONE` — `src/ui/panel-element.ts`: `plain`, `suspect`, `caveat`, `defect`
- `CARD_VARIABLES` — `src/ui/panel-look.ts`: `top`, `left`, `right`, `height`
- `CARD_WORDS` — `src/ui/panel-words.ts`: `wholeFight`, `raw`, `blows`, `blowsWithoutSkill`,
  `skillUses`, `turns`, `turnsWithLost`, `prevented`, `blowsCritical`, `blowsCriticalOffhand`,
  `striking`, `struck`, `scope`, `insideSection`, `destroyed`, `legendary`, `legendaryHeld`,
  `legendaryReached`, `gesture`, `gestureBack`, `gestureBackAnywhere`, `cut`
- `CAVEAT` — `src/ui/panel-words.ts`: `reduction`, `turns`, `unannounced`, `undivided`
- `CAVEAT_LETTER` — `src/ui/panel-look.ts`: `clearPixels`, `gapPixels`, `stemWidthPixels`
- `CLASS` — `src/ui/panel-look.ts`: `title`, `titleVersion`, `control`, `controlLead`, `frame`,
  `folded`, `meter`, `slot`, `header`, `headerLine`, `headerPlace`, `headerPlaceName`,
  `headerPlaceTile`, `headerOutcome`, `outcomeWon`, `outcomeLost`, `strips`, `stripsGap`, `strip`,
  `stripCurrent`, `crumb`, `crumbBack`, `crumbHere`, `optionsQuestion`, `optionsHeading`,
  `optionsSteps`, `optionsStep`, `optionsWindow`, `optionsWindowName`, `optionsWindowState`,
  `optionsWindowOwn`, `optionsReset`, `optionsAnswer`, `optionsMeaning`, `list`, `listWaiting`,
  `section`, `sectionWords`, `row`, `rowDrillable`, `rowLeaf`, `rowRank`, `rowTime`, `rowName`,
  `rowSize`, `rowChosen`, `rowApart`, `rowPin`, `rowPinSet`, `rowValue`, `rowOutcome`, `rowUnread`,
  `rowShare`, `rowSuspect`, `rowCaveat`, `rowTurn`, `rowSide`, `bar`, `barCap`, `figure`, `pinned`,
  `outside`, `empty`, `undrawn`, `suspicions`, `suspicion`, `defects`, `defect`, `sides`,
  `sidesLine`, `sidesLabel`, `sidesSpare`, `sidesTrack`, `sidesOurs`, `sidesTheirs`, `sidesNobody`,
  `card`, `cardHidden`, `cardWide`, `cardColumns`, `cardColumn`, `cardName`, `cardSubtitle`,
  `cardGroup`, `cardHeading`, `cardLine`, `cardStrong`, `cardSub`, `cardLabel`, `cardCaveat`,
  `cardValue`, `cardNote`, `cardSuspect`, `cardDefect`, `cardOutcome`, `cardCaveatNote`, `helper`,
  `helperBar`, `helperBody`, `helperFolded`, `helperUnder`, `helperCast`, `helperHolding`,
  `helperPips`, `helperPip`, `helperPipLit`, `sizeGrip`
- `COUNTED_NOUN_WORDS` — `src/ui/panel-words.ts`: `messages`, `heals`, `fights`, `combatants`,
  `turns`
- `EVENT_TYPE` — `src/ui/panel-document.ts`: `press`, `back`, `move`, `leave`, `release`, `cancel`
- `FIGHT_CARD_WORDS` — `src/ui/panel-words.ts`: `when`, `world`, `character`, `profession`
- `GRAB_KIND` — `src/ui/panel-drag.ts`: `move`, `size`
- `HALF_NAMED_FIELD` — `src/ui/panel-content.ts`: `damageTakenFromNobody`, `damageDealtToNobody`,
  `healthRestoredByNobody`
- `HALF_NAMED_KIND_FIELD` — `src/ui/panel-content.ts`: `damageTakenFromNobodyByKind`,
  `damageDealtToNobodyByKind`, `healthRestoredByNobodyByKey`
- `HALF_NAMED_OPENED` — `src/ui/panel-content.ts`: `person`, `element`
- `HALF_NAMED_TOTAL_FIELD` — `src/ui/panel-content.ts`: `damageDealtByNobody`,
  `damageTakenByNobody`, `healthGivenByNobody`, `healthRestoredToNobody`
- `HELPER_ABSENCE` — `src/ui/panel-helper.ts`: `noFightYet`, `betweenFights`, `fightUnread`
- `HELPER_WORDS` — `src/ui/panel-words.ts`: `title`, `drag`, `collapse`, `expand`, `now`,
  `nothingHappens`, `provocation`, `castSeparator`, `turnsLeft`, `chargedSkill`
- `LAYER` — `src/ui/panel-look.ts`: `section`, `grip`, `helper`, `card`
- `LIVE_FIGHT_WORDS` — `src/ui/panel-words.ts`: `time`, `outcome`
- `NEITHER_END_WORDS` — `src/ui/panel-words.ts`: `label`, `note`
- `OPENED_PART` — `src/ui/panel-screen.ts`: `skill`, `source`, `element`, `plain`
- `PANEL_DEFECT_KIND` — `src/ui/panel-words.ts`: `kept`, `keeping`, `mount`, `region`, `reading`,
  `figures`, `gesture`, `file`, `engine`
- `PANEL_DIRECTION` — `src/ui/panel-screen.ts`: `given`, `received`
- `PANEL_INTENT` — `src/ui/panel-intent.ts`: `metric`, `side`, `openRow`, `openUnnamed`, `openPart`,
  `close`, `fold`, `move`, `resize`, `resetSize`, `saveFile`, `storage`, `typeStep`, `shelf`,
  `options`, `showKept`, `showLive`, `pin`
- `PANEL_LISTENER` — `src/ui/view-failure.ts`: `press`, `back`, `hover`, `leave`, `grab`, `drag`,
  `release`, `cancel`, `capture`
- `PANEL_MARK` — `src/ui/panel-intent.ts`: `fold`, `save`, `shelf`, `options`, `screen`, `side`,
  `row`, `back`, `skill`, `source`, `kind`, `plain`, `fight`, `pin`, `unnamed`, `storage`,
  `typeStep`, `resetSize`, `helperFold`
- `PANEL_METRIC` — `src/ui/panel-screen.ts`: `damageDealt`, `damageTaken`, `healthGiven`,
  `healthRestored`
- `PANEL_NOUN` — `src/ui/panel-screen.ts`: `damage`, `healing`
- `PANEL_REGION` — `src/ui/panel-words.ts`: `header`, `strips`, `crumb`, `list`, `pinned`, `sides`,
  `outside`, `suspicions`, `defects`, `card`, `helper`
- `PANEL_WINDOW` — `src/ui/panel-choice.ts`: `meter`, `helper`
- `PANEL_WORDS` — `src/ui/panel-words.ts`: `title`, `withoutActor`, `withoutTarget`, `unknown`,
  `unknownHowMany`, `nothingYet`, `noFightYet`, `fightUnread`, `keptUnread`, `keptUnreadNote`,
  `noSides`, `fights`, `backFromFights`, `options`, `backFromOptions`, `storage`, `typeSize`,
  `windowSize`, `resizeHint`, `sizeOwn`, `sizeDefault`, `sizeReset`, `resizeGrip`, `ourSide`,
  `theirSide`, `withoutSide`, `wholeFight`, `openFights`, `openOptions`, `back`, `shelfEmpty`,
  `dealtTo`, `takenFrom`, `damageKind`, `healthSource`, `skills`, `withoutKind`, `eitherKind`,
  `restOfKinds`, `outsideRanking`, `outsideRow`, `outsideNote`, `restNote`, `share`,
  `shareOfFigure`, `drag`, `collapse`, `expand`, `saveFight`
- `PINNED_CASE` — `src/ui/panel-content.ts`: `dealtWithNoActor`, `givenWithNoActor`,
  `takenWithNoActor`, `takenWithNoTarget`, `restoredWithNoActor`
- `PINNED_PLACING` — `src/ui/panel-content.ts`: `apart`, `cut`
- `PLACE` — `src/ui/panel-look.ts`: `insetPixels`, `layer`
- `SHAPE` — `src/ui/panel-look.ts`: `radiusPixels`, `radiusSmallPixels`, `windowShadow`
- `SIDE_CHOICE` — `src/ui/panel-screen.ts`: `everyone`, `reader`, `opposing`
- `SIDE_RELATION` — `src/ui/panel-content.ts`: `reader`, `opposing`, `nobody`
- `SIGNAL` — `src/ui/panel-palette.ts`: `ours`, `theirs`, `suspect`, `caveat`, `defect`, `unknown`
- `SIZED_METER_VARIABLES` — `src/ui/panel-look.ts`: `listBasis`, `listRowsLeast`, `share`
- `SIZE_GRIP` — `src/ui/panel-look.ts`: `sizePixels`
- `SPACE_PIXELS` — `src/ui/panel-look.ts`: `half`, `small`, `regionDown`, `regionAcross`, `wide`
- `STANDING_TURN_STATE` — `src/ui/panel-helper.ts`: `held`, `unread`, `afterFight`, `onAuto`
- `STORAGE_CHOICE` — `src/ui/panel-choice.ts`: `local`, `session`, `memory`
- `SURFACE` — `src/ui/panel-look.ts`: `panel`, `raised`, `track`, `border`
- `TEXT` — `src/ui/panel-look.ts`: `plain`, `quiet`, `inkDark`, `inkLight`
- `TOOLTIP_WORDS` — `src/ui/panel-words.ts`: `provokedBy`, `provokedCount`, `spent`, `turnsTaken`
- `TYPE_STEP` — `src/ui/panel-choice.ts`: `small`, `medium`, `large`
- `UNNAMED_END` — `src/ui/panel-content.ts`: `actor`, `target`

### `src/`

- `BROWSER_WINDOW_PART` — `src/userscript-entry.ts`: `window`, `document`, `console`, `timers`,
  `frames`, `clock`, `downloads`

### `frozen/`

- `FROZEN_AURA_TURNS` — `frozen/aura-turns.ts`: `fetchedAt`, `skills`, `shouts`
- `FROZEN_BLOWS_GRANTED` — `frozen/blows-granted.ts`: `fetchedAt`, `skills`
- `FROZEN_HELP_PHRASES` — `frozen/help-phrases.ts`: `article`, `fetchedAt`, `counts`
- `FROZEN_PROTOCOL_KEYS` — `frozen/protocol-keys.ts`: `gameBuild`, `computedFamily`, `keys`
- `FROZEN_SKILL_DURATIONS` — `frozen/skill-durations.ts`: `fetchedAt`, `skills`
- `FROZEN_STATUS_BITS` — `frozen/status-bits.ts`: `gameBuild`, `bits`

### `tools/`

- `CLIENT_FIELDS` — `tools/fabricated-fight.ts`: `battleground`, `skillsDisabled`,
  `skillsComboMaximum`, `skills`, `poolTime`, `poolTotal`, `poolMinimum`, `poolPenalty`, `poolLeft`,
  `moveOpening`, `move`, `originalId`, `otherLevel`, `gender`, `gridRow`, `icon`, `mana`, `energy`,
  `armour`, `resistanceFire`, `resistanceFrost`, `resistanceLight`, `act`, `focus`, `combo`,
  `cooldowns`, `figureNow`, `figureBonus`, `healthPercent`
- `DEFAULT_BRANCH_FIELD` — `tools/protocol-key-table.ts`: `marker`, `markerAt`, `markerLength`,
  `dealtSign`
- `DRILL_ROW` — `tools/drill-report.ts`: `person`, `halfNamed`, `skill`, `source`, `closing`,
  `kind`, `noKind`, `neitherEnd`
- `DRILL_RUNG` — `tools/drill-report.ts`: `ranking`, `opened`, `pair`, `part`, `unnamedPair`,
  `unnamed`, `unnamedCut`
- `DRILL_VERDICT` — `tools/drill-report.ts`: `always`, `sometimes`, `never`
- `FABRICATION_ENDING` — `tools/fabricated-fight.ts`: `settled`, `fled`
- `FABRICATION_FIELDS` — `tools/fabricated-fight.ts`: `isFabricated`, `fabricatedBy`,
  `fabricationScript`, `fabricatedShape`
- `INTAKE_KEYS` — `tools/recorded-material.ts`: `nonPlayer`, `skills`
- `KEY_PLACEMENT` — `tools/protocol-key-shape.ts`: `alone`, `onAnnouncement`, `onBlow`, `onDamage`,
  `anywhere`
- `KEY_VALUE` — `tools/protocol-key-shape.ts`: `none`, `whole`, `number`, `text`
- `LINE_CHANGE` — `tools/develop-reports.ts`: `removed`, `added`
- `MARGONEM_CHANNEL` — `tools/margonem-client-source.ts`: `production`, `development`
- `READING_VERDICT` — `tools/margonem-readings.ts`: `current`, `stale`, `unknown`
- `SHAPE_STEP` — `tools/protocol-key-table.ts`: `text`, `segmentKey`, `quoted`, `digits`
- `SHOT_MOMENT` — `tools/panel-shots.ts`: `underway`, `over`
- `TOOL_ERROR_CODE` — `tools/margometer-tool-error.ts`: `userscriptBuild`, `declaredVersion`,
  `recordingRead`, `developReport`, `changelog`, `captureIntake`, `margonemClientSource`,
  `margonemUnreachable`, `protocolKeyTable`, `protocolKeyShape`, `statusBitTable`, `skillTable`,
  `helpArticle`, `panelShot`, `previewServe`, `drillReport`, `cardHeight`, `givingWay`, `turnCount`,
  `turnReading`, `fabricatedFight`, `margonemReadings`, `payloadCost`, `frozenFiles`
- `TURN_OUTCOME` — `tools/turn-count.ts`: `exact`, `over`, `under`
- `TURN_PLACING` — `tools/turn-count.ts`: `exact`, `elsewhere`
- `TURN_VERDICT` — `tools/turn-count.ts`: `always`, `sometimes`, `never`, `inLump`
- `WITNESS_KEYS` — `tools/turn-count.ts`: `holder`

### `tests/`

- `CAUSE` — `tests/repository/protocol-keys.test.ts`: `subjectsOwn`, `announcementsActor`,
  `messageActor`, `woundsAttacker`, `nobody`
- `ENDING` — `tests/ui/panel-words.test.ts`: `fullStop`, `colon`, `bare`, `spelled`
- `KEYS` — `tests/libs/unknown-value.test.ts`: `figure`, `named`, `nested`, `listed`, `inherited`,
  `method`
- `MARGONEM_ENGINE_PRESENCE` — `tests/e2e/margonem-page.ts`: `before`, `late`, `none`
- `NAME_KIND` — `tests/repository/name-register.test.ts`: `function`, `type`, `typeParameter`,
  `failure`, `class`, `constant`, `alias`, `local`, `parameter`, `field`
- `PAGE_CALL` — `tests/fake-window.ts`: `storeRead`, `storeWrite`, `console`, `frame`, `timer`,
  `mount`, `scripts`, `downloads`, `tooltip`, `dictionary`
- `PURITY` — `tests/verb-purities.ts`: `strong`, `weak`, `none`, `either`
- `SECTION` — `tests/repository/declaration-order.test.ts`: `imports`, `types`, `constants`,
  `functions`
- `TABLES` — `tests/core/granted-blow-rule.test.ts`: `table`, `none`
- `WARRIOR_FIELDS` — `tests/recorded-fights.ts`: `id`, `name`, `side`, `profession`, `level`,
  `health`, `healthMaximum`, `healthNow`, `healthPercent`

## Strings held by name

Every string a module-level constant of the program or its tools holds, by the file that spells it:
the game's keys and fields, the store's keys, the sheet's classes and variables, the page's
attributes. Text is left out: a string with a space or a letter past ASCII, one opening with a
digit, which is a figure or a date, and a word a `…_WORDS` table holds for the reader. So is a
suite's material.

### `frozen/protocol-keys.ts`

- `"+"` — `FROZEN_PROTOCOL_KEYS`
- `"+abdest"` — `FROZEN_PROTOCOL_KEYS`
- `"+abdest_per"` — `FROZEN_PROTOCOL_KEYS`
- `"+abmdest_per"` — `FROZEN_PROTOCOL_KEYS`
- `"+absorb"` — `FROZEN_PROTOCOL_KEYS`
- `"+absorbm"` — `FROZEN_PROTOCOL_KEYS`
- `"+acdmg"` — `FROZEN_PROTOCOL_KEYS`
- `"+acdmg_destroyed"` — `FROZEN_PROTOCOL_KEYS`
- `"+actdmg"` — `FROZEN_PROTOCOL_KEYS`
- `"+crit"` — `FROZEN_PROTOCOL_KEYS`
- `"+critpierce"` — `FROZEN_PROTOCOL_KEYS`
- `"+critpoison_per"` — `FROZEN_PROTOCOL_KEYS`
- `"+critsa"` — `FROZEN_PROTOCOL_KEYS`
- `"+critsa_per"` — `FROZEN_PROTOCOL_KEYS`
- `"+critslow"` — `FROZEN_PROTOCOL_KEYS`
- `"+critslow_per"` — `FROZEN_PROTOCOL_KEYS`
- `"+critwound"` — `FROZEN_PROTOCOL_KEYS`
- `"+crush"` — `FROZEN_PROTOCOL_KEYS`
- `"+crush_distance"` — `FROZEN_PROTOCOL_KEYS`
- `"+crush_fire"` — `FROZEN_PROTOCOL_KEYS`
- `"+crush_frost"` — `FROZEN_PROTOCOL_KEYS`
- `"+crush_light"` — `FROZEN_PROTOCOL_KEYS`
- `"+crush_physical"` — `FROZEN_PROTOCOL_KEYS`
- `"+distract"` — `FROZEN_PROTOCOL_KEYS`
- `"+endest"` — `FROZEN_PROTOCOL_KEYS`
- `"+energy"` — `FROZEN_PROTOCOL_KEYS`
- `"+engback"` — `FROZEN_PROTOCOL_KEYS`
- `"+exp"` — `FROZEN_PROTOCOL_KEYS`
- `"+fastarrow"` — `FROZEN_PROTOCOL_KEYS`
- `"+firearrow"` — `FROZEN_PROTOCOL_KEYS`
- `"+freeze"` — `FROZEN_PROTOCOL_KEYS`
- `"+immobilize"` — `FROZEN_PROTOCOL_KEYS`
- `"+injure"` — `FROZEN_PROTOCOL_KEYS`
- `"+legbon_anguish"` — `FROZEN_PROTOCOL_KEYS`
- `"+legbon_curse"` — `FROZEN_PROTOCOL_KEYS`
- `"+legbon_frenzy_main"` — `FROZEN_PROTOCOL_KEYS`
- `"+legbon_frenzy_off"` — `FROZEN_PROTOCOL_KEYS`
- `"+legbon_holytouch"` — `FROZEN_PROTOCOL_KEYS`
- `"+legbon_puncture"` — `FROZEN_PROTOCOL_KEYS`
- `"+legbon_pushback"` — `FROZEN_PROTOCOL_KEYS`
- `"+legbon_verycrit"` — `FROZEN_PROTOCOL_KEYS`
- `"+lowheal2turns"` — `FROZEN_PROTOCOL_KEYS`
- `"+manadest"` — `FROZEN_PROTOCOL_KEYS`
- `"+mcurse"` — `FROZEN_PROTOCOL_KEYS`
- `"+of_crit"` — `FROZEN_PROTOCOL_KEYS`
- `"+of_dmg"` — `FROZEN_PROTOCOL_KEYS`
- `"+of_wound"` — `FROZEN_PROTOCOL_KEYS`
- `"+of_woundmagic"` — `FROZEN_PROTOCOL_KEYS`
- `"+of_woundpoison"` — `FROZEN_PROTOCOL_KEYS`
- `"+oth_cover"` — `FROZEN_PROTOCOL_KEYS`
- `"+oth_dmg"` — `FROZEN_PROTOCOL_KEYS`
- `"+ph"` — `FROZEN_PROTOCOL_KEYS`
- `"+pierce"` — `FROZEN_PROTOCOL_KEYS`
- `"+rage"` — `FROZEN_PROTOCOL_KEYS`
- `"+resdmg"` — `FROZEN_PROTOCOL_KEYS`
- `"+resdmgc"` — `FROZEN_PROTOCOL_KEYS`
- `"+resdmgf"` — `FROZEN_PROTOCOL_KEYS`
- `"+resdmgl"` — `FROZEN_PROTOCOL_KEYS`
- `"+rotatingblade"` — `FROZEN_PROTOCOL_KEYS`
- `"+spell-taken_dmg"` — `FROZEN_PROTOCOL_KEYS`
- `"+spell-taken_dmg-all"` — `FROZEN_PROTOCOL_KEYS`
- `"+spell-vamp_time"` — `FROZEN_PROTOCOL_KEYS`
- `"+stun"` — `FROZEN_PROTOCOL_KEYS`
- `"+stun2"` — `FROZEN_PROTOCOL_KEYS`
- `"+stun2-c"` — `FROZEN_PROTOCOL_KEYS`
- `"+stun2-d"` — `FROZEN_PROTOCOL_KEYS`
- `"+stun2-f"` — `FROZEN_PROTOCOL_KEYS`
- `"+stun2-l"` — `FROZEN_PROTOCOL_KEYS`
- `"+superspell-dispel"` — `FROZEN_PROTOCOL_KEYS`
- `"+superspell-prevented"` — `FROZEN_PROTOCOL_KEYS`
- `"+swing"` — `FROZEN_PROTOCOL_KEYS`
- `"+taken_dmg"` — `FROZEN_PROTOCOL_KEYS`
- `"+thirdatt"` — `FROZEN_PROTOCOL_KEYS`
- `"+verycrit"` — `FROZEN_PROTOCOL_KEYS`
- `"+vulture"` — `FROZEN_PROTOCOL_KEYS`
- `"+wound"` — `FROZEN_PROTOCOL_KEYS`
- `"+woundfrost"` — `FROZEN_PROTOCOL_KEYS`
- `"+woundmagic"` — `FROZEN_PROTOCOL_KEYS`
- `"+woundpoison"` — `FROZEN_PROTOCOL_KEYS`
- `"-absorb"` — `FROZEN_PROTOCOL_KEYS`
- `"-absorbm"` — `FROZEN_PROTOCOL_KEYS`
- `"-arrowblock"` — `FROZEN_PROTOCOL_KEYS`
- `"-blok"` — `FROZEN_PROTOCOL_KEYS`
- `"-contra"` — `FROZEN_PROTOCOL_KEYS`
- `"-endest"` — `FROZEN_PROTOCOL_KEYS`
- `"-evade"` — `FROZEN_PROTOCOL_KEYS`
- `"-immunity_to_dmg"` — `FROZEN_PROTOCOL_KEYS`
- `"-legbon_cleanse"` — `FROZEN_PROTOCOL_KEYS`
- `"-legbon_critred"` — `FROZEN_PROTOCOL_KEYS`
- `"-legbon_dmgred"` — `FROZEN_PROTOCOL_KEYS`
- `"-legbon_facade"` — `FROZEN_PROTOCOL_KEYS`
- `"-legbon_glare"` — `FROZEN_PROTOCOL_KEYS`
- `"-legbon_resgain"` — `FROZEN_PROTOCOL_KEYS`
- `"-legbon_retaliation"` — `FROZEN_PROTOCOL_KEYS`
- `"-lowcritallval"` — `FROZEN_PROTOCOL_KEYS`
- `"-manadest"` — `FROZEN_PROTOCOL_KEYS`
- `"-parry"` — `FROZEN_PROTOCOL_KEYS`
- `"-pierceb"` — `FROZEN_PROTOCOL_KEYS`
- `"-poison_lowdmg_per"` — `FROZEN_PROTOCOL_KEYS`
- `"-rage"` — `FROZEN_PROTOCOL_KEYS`
- `"-redabdest_per"` — `FROZEN_PROTOCOL_KEYS`
- `"-redacdmg"` — `FROZEN_PROTOCOL_KEYS`
- `"-redacdmg_per"` — `FROZEN_PROTOCOL_KEYS`
- `"-reddest_per"` — `FROZEN_PROTOCOL_KEYS`
- `"-reddest_per0"` — `FROZEN_PROTOCOL_KEYS`
- `"-redendest"` — `FROZEN_PROTOCOL_KEYS`
- `"-redendest_per"` — `FROZEN_PROTOCOL_KEYS`
- `"-redmanadest"` — `FROZEN_PROTOCOL_KEYS`
- `"-redmanadest_per"` — `FROZEN_PROTOCOL_KEYS`
- `"-resmanaendest"` — `FROZEN_PROTOCOL_KEYS`
- `"-spell-distortion"` — `FROZEN_PROTOCOL_KEYS`
- `"-spell-immunity_to_dmg"` — `FROZEN_PROTOCOL_KEYS`
- `"-tenacity"` — `FROZEN_PROTOCOL_KEYS`
- `"-thirdatt"` — `FROZEN_PROTOCOL_KEYS`
- `"DHSqC3Uh"` — `FROZEN_PROTOCOL_KEYS`
- `"absolute"` — `FROZEN_PROTOCOL_KEYS`
- `"achpp_per"` — `FROZEN_PROTOCOL_KEYS`
- `"active_absorbdest_per"` — `FROZEN_PROTOCOL_KEYS`
- `"active_block_per"` — `FROZEN_PROTOCOL_KEYS`
- `"active_decblock_per"` — `FROZEN_PROTOCOL_KEYS`
- `"active_decblock_per-enemies"` — `FROZEN_PROTOCOL_KEYS`
- `"active_resall_per"` — `FROZEN_PROTOCOL_KEYS`
- `"afterheal"` — `FROZEN_PROTOCOL_KEYS`
- `"alllowdmg"` — `FROZEN_PROTOCOL_KEYS`
- `"allslow"` — `FROZEN_PROTOCOL_KEYS`
- `"allslow_per"` — `FROZEN_PROTOCOL_KEYS`
- `"anguish"` — `FROZEN_PROTOCOL_KEYS`
- `"ansgame"` — `FROZEN_PROTOCOL_KEYS`
- `"antidote"` — `FROZEN_PROTOCOL_KEYS`
- `"arrowrain"` — `FROZEN_PROTOCOL_KEYS`
- `"aura-ac"` — `FROZEN_PROTOCOL_KEYS`
- `"aura-ac_per"` — `FROZEN_PROTOCOL_KEYS`
- `"aura-adddmg2_per-meele"` — `FROZEN_PROTOCOL_KEYS`
- `"aura-resall"` — `FROZEN_PROTOCOL_KEYS`
- `"aura-sa"` — `FROZEN_PROTOCOL_KEYS`
- `"aura-sa_per"` — `FROZEN_PROTOCOL_KEYS`
- `"balloflight"` — `FROZEN_PROTOCOL_KEYS`
- `"bandage"` — `FROZEN_PROTOCOL_KEYS`
- `"blackout"` — `FROZEN_PROTOCOL_KEYS`
- `"blizzard"` — `FROZEN_PROTOCOL_KEYS`
- `"chainlightning"` — `FROZEN_PROTOCOL_KEYS`
- `"chainlightning_perw"` — `FROZEN_PROTOCOL_KEYS`
- `"combo-max"` — `FROZEN_PROTOCOL_KEYS`
- `"cover"` — `FROZEN_PROTOCOL_KEYS`
- `"critmval-allies"` — `FROZEN_PROTOCOL_KEYS`
- `"critmval-enemies"` — `FROZEN_PROTOCOL_KEYS`
- `"critstagnation"` — `FROZEN_PROTOCOL_KEYS`
- `"critval-allies"` — `FROZEN_PROTOCOL_KEYS`
- `"critval-enemies"` — `FROZEN_PROTOCOL_KEYS`
- `"critwound"` — `FROZEN_PROTOCOL_KEYS`
- `"daggerthrow"` — `FROZEN_PROTOCOL_KEYS`
- `"distance"` — `FROZEN_PROTOCOL_KEYS`
- `"distortion"` — `FROZEN_PROTOCOL_KEYS`
- `"distractshoot"` — `FROZEN_PROTOCOL_KEYS`
- `"disturb"` — `FROZEN_PROTOCOL_KEYS`
- `"disturbshoot"` — `FROZEN_PROTOCOL_KEYS`
- `"dloot"` — `FROZEN_PROTOCOL_KEYS`
- `"dmg"` — `FROZEN_PROTOCOL_KEYS`
- `"dmg-target_physical"` — `FROZEN_PROTOCOL_KEYS`
- `"dmg_hpp"` — `FROZEN_PROTOCOL_KEYS`
- `"doubleshoot"` — `FROZEN_PROTOCOL_KEYS`
- `"en-regen"` — `FROZEN_PROTOCOL_KEYS`
- `"en-regen-cast"` — `FROZEN_PROTOCOL_KEYS`
- `"energy"` — `FROZEN_PROTOCOL_KEYS`
- `"energyout"` — `FROZEN_PROTOCOL_KEYS`
- `"fire"` — `FROZEN_PROTOCOL_KEYS`
- `"fireshield"` — `FROZEN_PROTOCOL_KEYS`
- `"firewall"` — `FROZEN_PROTOCOL_KEYS`
- `"flee"` — `FROZEN_PROTOCOL_KEYS`
- `"footshoot"` — `FROZEN_PROTOCOL_KEYS`
- `"frost"` — `FROZEN_PROTOCOL_KEYS`
- `"frostshield"` — `FROZEN_PROTOCOL_KEYS`
- `"heal"` — `FROZEN_PROTOCOL_KEYS`
- `"heal_per"` — `FROZEN_PROTOCOL_KEYS`
- `"heal_per-allies"` — `FROZEN_PROTOCOL_KEYS`
- `"heal_per-enemies"` — `FROZEN_PROTOCOL_KEYS`
- `"heal_target"` — `FROZEN_PROTOCOL_KEYS`
- `"healall"` — `FROZEN_PROTOCOL_KEYS`
- `"healall_per"` — `FROZEN_PROTOCOL_KEYS`
- `"hp_per-allies"` — `FROZEN_PROTOCOL_KEYS`
- `"hp_per-enemies"` — `FROZEN_PROTOCOL_KEYS`
- `"injure"` — `FROZEN_PROTOCOL_KEYS`
- `"insult"` — `FROZEN_PROTOCOL_KEYS`
- `"legbon_holytouch_heal"` — `FROZEN_PROTOCOL_KEYS`
- `"legbon_lastheal"` — `FROZEN_PROTOCOL_KEYS`
- `"light"` — `FROZEN_PROTOCOL_KEYS`
- `"lightshield"` — `FROZEN_PROTOCOL_KEYS`
- `"lightshield2"` — `FROZEN_PROTOCOL_KEYS`
- `"loot"` — `FROZEN_PROTOCOL_KEYS`
- `"loser"` — `FROZEN_PROTOCOL_KEYS`
- `"lowheal_per-enemies"` — `FROZEN_PROTOCOL_KEYS`
- `"mana"` — `FROZEN_PROTOCOL_KEYS`
- `"managain"` — `FROZEN_PROTOCOL_KEYS`
- `"manatransfer"` — `FROZEN_PROTOCOL_KEYS`
- `"mlightshiled"` — `FROZEN_PROTOCOL_KEYS`
- `"npc_heal"` — `FROZEN_PROTOCOL_KEYS`
- `"of-woundstart"` — `FROZEN_PROTOCOL_KEYS`
- `"physical"` — `FROZEN_PROTOCOL_KEYS`
- `"poison"` — `FROZEN_PROTOCOL_KEYS`
- `"poison_lowdmg_per-enemies"` — `FROZEN_PROTOCOL_KEYS`
- `"poisonspread"` — `FROZEN_PROTOCOL_KEYS`
- `"poisonspread_failkey"` — `FROZEN_PROTOCOL_KEYS`
- `"prepare"` — `FROZEN_PROTOCOL_KEYS`
- `"removedot"` — `FROZEN_PROTOCOL_KEYS`
- `"removedot-allies"` — `FROZEN_PROTOCOL_KEYS`
- `"removeslow-allies"` — `FROZEN_PROTOCOL_KEYS`
- `"removestun"` — `FROZEN_PROTOCOL_KEYS`
- `"removestun-allies"` — `FROZEN_PROTOCOL_KEYS`
- `"resfire_per"` — `FROZEN_PROTOCOL_KEYS`
- `"resfrost_per"` — `FROZEN_PROTOCOL_KEYS`
- `"reslight_per"` — `FROZEN_PROTOCOL_KEYS`
- `"reusearrows"` — `FROZEN_PROTOCOL_KEYS`
- `"rime_per"` — `FROZEN_PROTOCOL_KEYS`
- `"shout"` — `FROZEN_PROTOCOL_KEYS`
- `"skillId"` — `FROZEN_PROTOCOL_KEYS`
- `"soullink"` — `FROZEN_PROTOCOL_KEYS`
- `"spell-taken_dmg"` — `FROZEN_PROTOCOL_KEYS`
- `"stealmana"` — `FROZEN_PROTOCOL_KEYS`
- `"step"` — `FROZEN_PROTOCOL_KEYS`
- `"stinkbomb"` — `FROZEN_PROTOCOL_KEYS`
- `"stinkbomb_crit"` — `FROZEN_PROTOCOL_KEYS`
- `"stinkbomb_pierce"` — `FROZEN_PROTOCOL_KEYS`
- `"storm"` — `FROZEN_PROTOCOL_KEYS`
- `"sunreduction"` — `FROZEN_PROTOCOL_KEYS`
- `"sunshield"` — `FROZEN_PROTOCOL_KEYS`
- `"sunshield_per"` — `FROZEN_PROTOCOL_KEYS`
- `"surpass_bonus_total"` — `FROZEN_PROTOCOL_KEYS`
- `"tcustom"` — `FROZEN_PROTOCOL_KEYS`
- `"thunder"` — `FROZEN_PROTOCOL_KEYS`
- `"trickyknife"` — `FROZEN_PROTOCOL_KEYS`
- `"tspell"` — `FROZEN_PROTOCOL_KEYS`
- `"txt"` — `FROZEN_PROTOCOL_KEYS`
- `"vamp"` — `FROZEN_PROTOCOL_KEYS`
- `"vamp_time"` — `FROZEN_PROTOCOL_KEYS`
- `"winner"` — `FROZEN_PROTOCOL_KEYS`
- `"wound"` — `FROZEN_PROTOCOL_KEYS`
- `"woundextend"` — `FROZEN_PROTOCOL_KEYS`

### `frozen/skill-durations.ts`

- `"absagain_per"` — `FROZEN_SKILL_DURATIONS`
- `"absorb_per"` — `FROZEN_SKILL_DURATIONS`
- `"absorbd"` — `FROZEN_SKILL_DURATIONS`
- `"absorbm_per"` — `FROZEN_SKILL_DURATIONS`
- `"ac"` — `FROZEN_SKILL_DURATIONS`
- `"ac2_per"` — `FROZEN_SKILL_DURATIONS`
- `"ac_per"` — `FROZEN_SKILL_DURATIONS`
- `"acdmg"` — `FROZEN_SKILL_DURATIONS`
- `"achpp_per"` — `FROZEN_SKILL_DURATIONS`
- `"acshield_per"` — `FROZEN_SKILL_DURATIONS`
- `"act"` — `FROZEN_SKILL_DURATIONS`
- `"actdmg"` — `FROZEN_SKILL_DURATIONS`
- `"active_absorbdest_per"` — `FROZEN_SKILL_DURATIONS`
- `"active_acdmg_per"` — `FROZEN_SKILL_DURATIONS`
- `"active_acdmg_physical-perw"` — `FROZEN_SKILL_DURATIONS`
- `"active_add_light_cumulaction"` — `FROZEN_SKILL_DURATIONS`
- `"active_block_per"` — `FROZEN_SKILL_DURATIONS`
- `"active_crit"` — `FROZEN_SKILL_DURATIONS`
- `"active_crit-allies"` — `FROZEN_SKILL_DURATIONS`
- `"active_decblock_per"` — `FROZEN_SKILL_DURATIONS`
- `"active_decblock_per-enemies"` — `FROZEN_SKILL_DURATIONS`
- `"active_decevade_per"` — `FROZEN_SKILL_DURATIONS`
- `"active_redstun"` — `FROZEN_SKILL_DURATIONS`
- `"active_wound_per"` — `FROZEN_SKILL_DURATIONS`
- `"add_attacks"` — `FROZEN_SKILL_DURATIONS`
- `"adddmg_fire-perw"` — `FROZEN_SKILL_DURATIONS`
- `"adddmg_physical-perw"` — `FROZEN_SKILL_DURATIONS`
- `"adrenalin_evade"` — `FROZEN_SKILL_DURATIONS`
- `"adrenalin_reddest"` — `FROZEN_SKILL_DURATIONS`
- `"adrenalin_sa"` — `FROZEN_SKILL_DURATIONS`
- `"agi"` — `FROZEN_SKILL_DURATIONS`
- `"alllowdmg"` — `FROZEN_SKILL_DURATIONS`
- `"allslow_per"` — `FROZEN_SKILL_DURATIONS`
- `"antidote"` — `FROZEN_SKILL_DURATIONS`
- `"arrowblock"` — `FROZEN_SKILL_DURATIONS`
- `"aura-ac_per"` — `FROZEN_SKILL_DURATIONS`
- `"aura-adddmg2_per-meele_physical"` — `FROZEN_SKILL_DURATIONS`
- `"aura-resall"` — `FROZEN_SKILL_DURATIONS`
- `"aura-sa_per"` — `FROZEN_SKILL_DURATIONS`
- `"bandage_per"` — `FROZEN_SKILL_DURATIONS`
- `"blok_per"` — `FROZEN_SKILL_DURATIONS`
- `"combo-block"` — `FROZEN_SKILL_DURATIONS`
- `"combo-crit"` — `FROZEN_SKILL_DURATIONS`
- `"combo-max"` — `FROZEN_SKILL_DURATIONS`
- `"combo-pierce"` — `FROZEN_SKILL_DURATIONS`
- `"combo-skill"` — `FROZEN_SKILL_DURATIONS`
- `"combo-wound"` — `FROZEN_SKILL_DURATIONS`
- `"combo_dmg_hpp-target"` — `FROZEN_SKILL_DURATIONS`
- `"combo_energyrestore_per"` — `FROZEN_SKILL_DURATIONS`
- `"combo_heal_per"` — `FROZEN_SKILL_DURATIONS`
- `"combo_lowdmg_enemy"` — `FROZEN_SKILL_DURATIONS`
- `"contra"` — `FROZEN_SKILL_DURATIONS`
- `"cooldown"` — `FROZEN_SKILL_DURATIONS`
- `"crit"` — `FROZEN_SKILL_DURATIONS`
- `"critmval-allies"` — `FROZEN_SKILL_DURATIONS`
- `"critmval-enemies"` — `FROZEN_SKILL_DURATIONS`
- `"critmval_c"` — `FROZEN_SKILL_DURATIONS`
- `"critmval_f"` — `FROZEN_SKILL_DURATIONS`
- `"critmval_l"` — `FROZEN_SKILL_DURATIONS`
- `"critpierce_per"` — `FROZEN_SKILL_DURATIONS`
- `"critpoison"` — `FROZEN_SKILL_DURATIONS`
- `"critrage_perw"` — `FROZEN_SKILL_DURATIONS`
- `"critsa"` — `FROZEN_SKILL_DURATIONS`
- `"critslow_per"` — `FROZEN_SKILL_DURATIONS`
- `"critval"` — `FROZEN_SKILL_DURATIONS`
- `"critval-allies"` — `FROZEN_SKILL_DURATIONS`
- `"critval-enemies"` — `FROZEN_SKILL_DURATIONS`
- `"critwound"` — `FROZEN_SKILL_DURATIONS`
- `"crush_dmg_physical"` — `FROZEN_SKILL_DURATIONS`
- `"decblock_per"` — `FROZEN_SKILL_DURATIONS`
- `"decevade_per"` — `FROZEN_SKILL_DURATIONS`
- `"distract"` — `FROZEN_SKILL_DURATIONS`
- `"disturb_crit"` — `FROZEN_SKILL_DURATIONS`
- `"disturb_pierce"` — `FROZEN_SKILL_DURATIONS`
- `"dmg-force-4_light-perw"` — `FROZEN_SKILL_DURATIONS`
- `"dmg-swing_absolute-perw"` — `FROZEN_SKILL_DURATIONS`
- `"dmg-target_absolute"` — `FROZEN_SKILL_DURATIONS`
- `"dmg-target_fire-perw"` — `FROZEN_SKILL_DURATIONS`
- `"dmg-target_physical"` — `FROZEN_SKILL_DURATIONS`
- `"dmg_evade_hpp-target"` — `FROZEN_SKILL_DURATIONS`
- `"dmg_evade_hpp-target_light"` — `FROZEN_SKILL_DURATIONS`
- `"dmg_from_npc_per"` — `FROZEN_SKILL_DURATIONS`
- `"dmg_from_player_per"` — `FROZEN_SKILL_DURATIONS`
- `"dmg_to_npc_per"` — `FROZEN_SKILL_DURATIONS`
- `"dmgmulabsolute"` — `FROZEN_SKILL_DURATIONS`
- `"doublecastcost_per"` — `FROZEN_SKILL_DURATIONS`
- `"en-regen"` — `FROZEN_SKILL_DURATIONS`
- `"energy"` — `FROZEN_SKILL_DURATIONS`
- `"energybon"` — `FROZEN_SKILL_DURATIONS`
- `"energygain"` — `FROZEN_SKILL_DURATIONS`
- `"energyout"` — `FROZEN_SKILL_DURATIONS`
- `"energyrestore_per"` — `FROZEN_SKILL_DURATIONS`
- `"engback"` — `FROZEN_SKILL_DURATIONS`
- `"evade_per"` — `FROZEN_SKILL_DURATIONS`
- `"fastarrow"` — `FROZEN_SKILL_DURATIONS`
- `"firebon"` — `FROZEN_SKILL_DURATIONS`
- `"freeze"` — `FROZEN_SKILL_DURATIONS`
- `"frostbon"` — `FROZEN_SKILL_DURATIONS`
- `"heal1_per"` — `FROZEN_SKILL_DURATIONS`
- `"heal_per"` — `FROZEN_SKILL_DURATIONS`
- `"heal_per-allies"` — `FROZEN_SKILL_DURATIONS`
- `"heal_per-enemies"` — `FROZEN_SKILL_DURATIONS`
- `"healall_per"` — `FROZEN_SKILL_DURATIONS`
- `"healpower"` — `FROZEN_SKILL_DURATIONS`
- `"hp"` — `FROZEN_SKILL_DURATIONS`
- `"hp_per-allies"` — `FROZEN_SKILL_DURATIONS`
- `"hpbon"` — `FROZEN_SKILL_DURATIONS`
- `"immunity_to_dmg"` — `FROZEN_SKILL_DURATIONS`
- `"injure"` — `FROZEN_SKILL_DURATIONS`
- `"lastcrit"` — `FROZEN_SKILL_DURATIONS`
- `"lightbon"` — `FROZEN_SKILL_DURATIONS`
- `"lightshield_per"` — `FROZEN_SKILL_DURATIONS`
- `"lowdmg_enemy"` — `FROZEN_SKILL_DURATIONS`
- `"lowdmg_self"` — `FROZEN_SKILL_DURATIONS`
- `"lowheal_per-enemies"` — `FROZEN_SKILL_DURATIONS`
- `"mana"` — `FROZEN_SKILL_DURATIONS`
- `"manabon"` — `FROZEN_SKILL_DURATIONS`
- `"manaendest"` — `FROZEN_SKILL_DURATIONS`
- `"managain"` — `FROZEN_SKILL_DURATIONS`
- `"manarestore_per"` — `FROZEN_SKILL_DURATIONS`
- `"manastr"` — `FROZEN_SKILL_DURATIONS`
- `"of-crit"` — `FROZEN_SKILL_DURATIONS`
- `"of-critval"` — `FROZEN_SKILL_DURATIONS`
- `"of-str"` — `FROZEN_SKILL_DURATIONS`
- `"of-thirdatt"` — `FROZEN_SKILL_DURATIONS`
- `"of-wounddmgbon_perw"` — `FROZEN_SKILL_DURATIONS`
- `"parry"` — `FROZEN_SKILL_DURATIONS`
- `"pcontra"` — `FROZEN_SKILL_DURATIONS`
- `"perdmg"` — `FROZEN_SKILL_DURATIONS`
- `"perdmg-allies"` — `FROZEN_SKILL_DURATIONS`
- `"pierce"` — `FROZEN_SKILL_DURATIONS`
- `"pierceb"` — `FROZEN_SKILL_DURATIONS`
- `"poison_lowdmg_per-enemies"` — `FROZEN_SKILL_DURATIONS`
- `"poisonbon_poison-perw"` — `FROZEN_SKILL_DURATIONS`
- `"rage"` — `FROZEN_SKILL_DURATIONS`
- `"rage_3turns"` — `FROZEN_SKILL_DURATIONS`
- `"red-sa"` — `FROZEN_SKILL_DURATIONS`
- `"redabdest_per"` — `FROZEN_SKILL_DURATIONS`
- `"redacdmg_per"` — `FROZEN_SKILL_DURATIONS`
- `"reddest_per"` — `FROZEN_SKILL_DURATIONS`
- `"redslow"` — `FROZEN_SKILL_DURATIONS`
- `"redstun"` — `FROZEN_SKILL_DURATIONS`
- `"removedot-allies"` — `FROZEN_SKILL_DURATIONS`
- `"removestun-allies"` — `FROZEN_SKILL_DURATIONS`
- `"resdmg"` — `FROZEN_SKILL_DURATIONS`
- `"resfire"` — `FROZEN_SKILL_DURATIONS`
- `"resfire_per"` — `FROZEN_SKILL_DURATIONS`
- `"resfrost"` — `FROZEN_SKILL_DURATIONS`
- `"resfrost_per"` — `FROZEN_SKILL_DURATIONS`
- `"reslight"` — `FROZEN_SKILL_DURATIONS`
- `"reslight_per"` — `FROZEN_SKILL_DURATIONS`
- `"sa-clothes"` — `FROZEN_SKILL_DURATIONS`
- `"sa1"` — `FROZEN_SKILL_DURATIONS`
- `"sa2_per"` — `FROZEN_SKILL_DURATIONS`
- `"sa_per"` — `FROZEN_SKILL_DURATIONS`
- `"shout"` — `FROZEN_SKILL_DURATIONS`
- `"slow"` — `FROZEN_SKILL_DURATIONS`
- `"slowfreeze_per"` — `FROZEN_SKILL_DURATIONS`
- `"stealmana_per"` — `FROZEN_SKILL_DURATIONS`
- `"stinkbomb_crit"` — `FROZEN_SKILL_DURATIONS`
- `"stinkbomb_pierce"` — `FROZEN_SKILL_DURATIONS`
- `"str1h"` — `FROZEN_SKILL_DURATIONS`
- `"str2h"` — `FROZEN_SKILL_DURATIONS`
- `"stun"` — `FROZEN_SKILL_DURATIONS`
- `"sunshield_per"` — `FROZEN_SKILL_DURATIONS`
- `"swing"` — `FROZEN_SKILL_DURATIONS`
- `"taken_dmg_per"` — `FROZEN_SKILL_DURATIONS`
- `"taken_dmg_per-all"` — `FROZEN_SKILL_DURATIONS`
- `"test"` — `FROZEN_SKILL_DURATIONS`
- `"vamp"` — `FROZEN_SKILL_DURATIONS`
- `"vamp_time_per"` — `FROZEN_SKILL_DURATIONS`
- `"vulture_perw"` — `FROZEN_SKILL_DURATIONS`
- `"woundchance"` — `FROZEN_SKILL_DURATIONS`
- `"wounddmgbon_perw"` — `FROZEN_SKILL_DURATIONS`
- `"woundred"` — `FROZEN_SKILL_DURATIONS`

### `frozen/status-bits.ts`

- `"DHSqC3Uh"` — `FROZEN_STATUS_BITS`
- `"critical_deep_wound"` — `FROZEN_STATUS_BITS`
- `"deep_wound"` — `FROZEN_STATUS_BITS`
- `"fire"` — `FROZEN_STATUS_BITS`
- `"frostbite"` — `FROZEN_STATUS_BITS`
- `"poisoned"` — `FROZEN_STATUS_BITS`
- `"shock"` — `FROZEN_STATUS_BITS`
- `"speed_up"` — `FROZEN_STATUS_BITS`
- `"swow_down"` — `FROZEN_STATUS_BITS`
- `"wound"` — `FROZEN_STATUS_BITS`

### `libs/html-text.ts`

- `"!?"` — `BOGUS_COMMENT_OPENERS`
- `"\""` — `NAMED_REFERENCES`
- `"\"'"` — `ATTRIBUTE_QUOTES`
- `"&"` — `NAMED_REFERENCES`, `REFERENCE_OPEN`
- `"&#"` — `NUMERIC_REFERENCE_OPEN`
- `"&amp;"` — `NAMED_REFERENCES`
- `"&gt;"` — `NAMED_REFERENCES`
- `"&in;"` — `NAMED_REFERENCES`
- `"&lt;"` — `NAMED_REFERENCES`
- `"&nbsp"` — `NAMED_REFERENCES`
- `"&nbsp;"` — `NAMED_REFERENCES`
- `"&quot;"` — `NAMED_REFERENCES`
- `"-->"` — `COMMENT_CLOSE`
- `"/"` — `TAG_TERMINATOR`
- `"/!?"` — `TAG_NAME_OPENERS`
- `";"` — `NUMERIC_REFERENCE_CLOSE`
- `"<"` — `NAMED_REFERENCES`, `TAG_OPEN`
- `"<!--"` — `COMMENT_OPEN`
- `"="` — `ATTRIBUTE_EQUALS`
- `">"` — `NAMED_REFERENCES`, `TAG_CLOSE`
- `"script"` — `RAW_TEXT_ELEMENTS`
- `"style"` — `RAW_TEXT_ELEMENTS`
- `"xX"` — `NUMERIC_REFERENCE_HEXADECIMAL`

### `libs/number-text.ts`

- `"-"` — `MINUS`
- `"."` — `POINT`

### `libs/text-walk.ts`

- ``"\"'`"`` — `JAVASCRIPT_QUOTES`
- `"\\"` — `ESCAPE`

### `libs/unknown-value.ts`

- `"list"` — `FIELD_TYPE`
- `"number"` — `FIELD_TYPE`
- `"record"` — `FIELD_TYPE`
- `"stated-text"` — `FIELD_TYPE`
- `"text"` — `FIELD_TYPE`

### `src/core/aura-standing.ts`

- `"both-sides"` — `AURA_REACH`

### `src/core/battle-event.ts`

- `"attack"` — `BATTLE_EVENT`
- `"damage-to-named-combatant"` — `BATTLE_EVENT`
- `"declaration"` — `BATTLE_EVENT`
- `"drawn"` — `OUTCOME_RESULT`
- `"fight-outcome"` — `BATTLE_EVENT`
- `"fled"` — `OUTCOME_RESULT`
- `"grammar-refused"` — `UNREAD_CAUSE`
- `"healing-to-named-combatant"` — `BATTLE_EVENT`
- `"health-change"` — `BATTLE_EVENT`
- `"lost"` — `OUTCOME_RESULT`
- `"no-parameter"` — `UNREAD_CAUSE`
- `"skill-used"` — `BATTLE_EVENT`
- `"turn-lost"` — `BATTLE_EVENT`
- `"unaccounted-health"` — `BATTLE_EVENT`
- `"unknown-key"` — `UNREAD_CAUSE`
- `"unknown-message"` — `BATTLE_EVENT`
- `"won"` — `OUTCOME_RESULT`

### `src/core/carried-figure.ts`

- `"speed_up"` — `HASTE_BIT_NAME`
- `"swow_down"` — `SLOW_BIT_NAME`

### `src/core/charged-skill.ts`

- `"broken"` — `CHARGED_SKILL_STATE`
- `"charging"` — `CHARGED_SKILL_STATE`
- `"struck"` — `CHARGED_SKILL_STATE`

### `src/core/fight-decoder.ts`

- `"%)"` — `PERCENT_CLOSER`
- `"("` — `PERCENT_OPENER`
- `","` — `MEMBER_SEPARATOR`
- `"."` — `SENTENCE_STOP`
- `";"` — `SEGMENT_SEPARATOR`
- `"="` — `VALUE_SEPARATOR`
- `"?"` — `NO_WINNER`
- `"actor"` — `MESSAGE_END`
- `"dmg"` — `DAMAGE_ELEMENT_PREFIX`
- `"target"` — `MESSAGE_END`

### `src/core/fight-session.ts`

- `"over"` — `SESSION_PHASE`
- `"underway"` — `SESSION_PHASE`
- `"waiting"` — `SESSION_PHASE`

### `src/core/fight-statistics.ts`

- `"damageDealt"` — `TOTALLED_FIELDS`
- `"damageDealtAbsorbed"` — `TOTALLED_FIELDS`
- `"damageDealtApplied"` — `TOTALLED_FIELDS`
- `"damageDealtRaw"` — `TOTALLED_FIELDS`
- `"damagePrevented"` — `TOTALLED_FIELDS`
- `"damageTaken"` — `TOTALLED_FIELDS`
- `"damageTakenAbsorbed"` — `TOTALLED_FIELDS`
- `"damageTakenApplied"` — `TOTALLED_FIELDS`
- `"damageTakenRaw"` — `TOTALLED_FIELDS`
- `"healthGiven"` — `TOTALLED_FIELDS`
- `"healthRestored"` — `TOTALLED_FIELDS`
- `"unreadMessagesGrammarRefused"` — `UNREAD_COUNT_BY_CAUSE`
- `"unreadMessagesNoParameter"` — `UNREAD_COUNT_BY_CAUSE`
- `"unreadMessagesUnknownKey"` — `UNREAD_COUNT_BY_CAUSE`
- `"|"` — `KIND_ELEMENTS_SEPARATOR`

### `src/core/protocol-key.ts`

- `"+"` — `RAW_SIGN`
- `"+abdest_per"` — `DESTROYED_KEYS`
- `"+abmdest_per"` — `DESTROYED_KEYS`
- `"+absorb"` — `DECLARATION_KEYS`
- `"+absorbm"` — `DECLARATION_KEYS`
- `"+acdmg"` — `DESTROYED_KEYS`
- `"+actdmg"` — `DESTROYED_KEYS`
- `"+crit"` — `CRITICAL_KEY`
- `"+critpierce"` — `DESTROYED_KEYS`
- `"+critpoison_per"` — `DECLARATION_KEYS`
- `"+critsa"` — `DECLARATION_KEYS`
- `"+critslow_per"` — `DECLARATION_KEYS`
- `"+crush_physical"` — `DECLARATION_KEYS`
- `"+engback"` — `DECLARATION_KEYS`
- `"+exp"` — `DECLARATION_KEYS`
- `"+injure"` — `WOUND_ANNOUNCEMENT_KEY`
- `"+legbon_anguish"` — `ANGUISH_KEY`
- `"+legbon_curse"` — `CURSE_KEY`
- `"+legbon_holytouch"` — `HOLYTOUCH_DECLARATION_KEY`
- `"+legbon_puncture"` — `PUNCTURE_KEY`
- `"+legbon_verycrit"` — `VERYCRIT_KEY`
- `"+of_crit"` — `CRITICAL_OF_KEY`
- `"+of_woundmagic"` — `PROCS_WITH_VALUE`
- `"+of_woundpoison"` — `PROCS_WITH_VALUE`
- `"+ph"` — `DECLARATION_KEYS`
- `"+rage"` — `DECLARATION_KEYS`
- `"+resdmg"` — `DESTROYED_KEYS`
- `"+resdmgc"` — `DESTROYED_KEYS`
- `"+resdmgf"` — `DESTROYED_KEYS`
- `"+resdmgl"` — `DESTROYED_KEYS`
- `"+spell-taken_dmg-all"` — `VALUELESS_DECLARATION_KEYS`
- `"+superspell-dispel"` — `CHARGE_BROKEN_KEY`
- `"+taken_dmg"` — `DECLARATION_KEYS`
- `"+thirdatt"` — `DAMAGE_KEYS`
- `"+woundfrost"` — `PROCS_WITH_VALUE`
- `"+woundmagic"` — `PROCS_WITH_VALUE`
- `"+woundpoison"` — `PROCS_WITH_VALUE`
- `"-"` — `APPLIED_SIGN`
- `"-all"` — `SIDE_WIDE_ENDINGS`
- `"-allies"` — `SIDE_WIDE_ENDINGS`
- `"-endest"` — `DECLARATION_KEYS`
- `"-enemies"` — `SIDE_WIDE_ENDINGS`
- `"-legbon_cleanse"` — `CLEANSE_KEY`
- `"-legbon_critred"` — `CRITRED_KEY`
- `"-legbon_facade"` — `FACADE_KEY`
- `"-legbon_glare"` — `GLARE_KEY`
- `"-manadest"` — `DECLARATION_KEYS`
- `"-poison_lowdmg_per"` — `DECLARATION_KEYS`
- `"-thirdatt"` — `DAMAGE_KEYS`
- `"active_absorbdest_per"` — `DECLARATION_KEYS`
- `"active_block_per"` — `DECLARATION_KEYS`
- `"active_decblock_per"` — `DECLARATION_KEYS`
- `"active_decblock_per-enemies"` — `DECLARATION_KEYS`
- `"actor"` — `PROC_END`
- `"afterheal"` — `DECLARATION_KEYS`
- `"alllowdmg"` — `DECLARATION_KEYS`, `SIDE_WIDE_KEYS`
- `"allslow_per"` — `SLOW_ALL_KEY`
- `"applied"` — `DAMAGE_HALF`
- `"aura-"` — `SIDE_WIDE_OPENING`
- `"aura-ac_per"` — `DECLARATION_KEYS`
- `"aura-adddmg2_per-meele"` — `DECLARATION_KEYS`
- `"aura-resall"` — `DECLARATION_KEYS`
- `"aura-sa_per"` — `HASTE_AURA_KEY`
- `"casters-side"` — `KEY_REACH`
- `"chance"` — `DEFENCE_MECHANISM`
- `"combo-max"` — `DECLARATION_KEYS`
- `"critmval-allies"` — `DECLARATION_KEYS`
- `"critval-allies"` — `DECLARATION_KEYS`
- `"custom-skill-name"` — `KEY_FAMILY`
- `"damage"` — `KEY_FAMILY`
- `"declaration"` — `KEY_FAMILY`
- `"destroyed"` — `KEY_FAMILY`
- `"dmg"` — `DAMAGE_MARKER`
- `"en-regen"` — `DECLARATION_KEYS`
- `"en-regen-cast"` — `VALUELESS_DECLARATION_KEYS`
- `"energy"` — `DECLARATION_KEYS`
- `"fired"` — `LEGENDARY_BONUS_SHOWING`
- `"fled"` — `KEY_FAMILY`
- `"heal"` — `HEAL_KEY`
- `"heal_per-allies"` — `DECLARATION_KEYS`
- `"heal_per-enemies"` — `DECLARATION_KEYS`
- `"health-change"` — `KEY_FAMILY`
- `"held"` — `LEGENDARY_BONUS_SHOWING`
- `"hp_per-allies"` — `DECLARATION_KEYS`
- `"hp_per-enemies"` — `DECLARATION_KEYS`
- `"injure"` — `WOUND_TICK_KEY`
- `"legbon_holytouch_heal"` — `HOLYTOUCH_HEAL_KEY`
- `"legbon_lastheal"` — `LASTHEAL_KEY`
- `"lowheal_per-enemies"` — `HEALING_REDUCER_KEY`
- `"mana"` — `DECLARATION_KEYS`
- `"named-damage"` — `KEY_FAMILY`
- `"named-healing"` — `KEY_FAMILY`
- `"other-side"` — `KEY_REACH`
- `"outcome"` — `KEY_FAMILY`
- `"poison_lowdmg_per-enemies"` — `DECLARATION_KEYS`
- `"pool"` — `DEFENCE_MECHANISM`
- `"prepare"` — `PREPARE_KEY`
- `"prevented"` — `KEY_FAMILY`
- `"proc"` — `KEY_FAMILY`
- `"raw"` — `DAMAGE_HALF`
- `"removedot-allies"` — `VALUELESS_DECLARATION_KEYS`
- `"removeslow-allies"` — `VALUELESS_DECLARATION_KEYS`
- `"removestun-allies"` — `VALUELESS_DECLARATION_KEYS`
- `"resfire_per"` — `DECLARATION_KEYS`
- `"resfrost_per"` — `DECLARATION_KEYS`
- `"reslight_per"` — `DECLARATION_KEYS`
- `"shout"` — `PROVOCATION_KEY`
- `"skill-id"` — `KEY_FAMILY`
- `"skill-name"` — `KEY_FAMILY`
- `"skillId"` — `SKILL_ID_KEY`
- `"step"` — `STEP_KEY`
- `"sunshield_per"` — `VALUELESS_DECLARATION_KEYS`
- `"surpass_bonus_total"` — `DECLARATION_KEYS`
- `"target"` — `PROC_END`
- `"txt"` — `TEXT_KEY`
- `"unaccounted-health"` — `KEY_FAMILY`
- `"unsettled"` — `PROC_END`
- `"valueless-declaration"` — `KEY_FAMILY`

### `src/core/protocol-number.ts`

- `"."` — `POINT`

### `src/ports/browser-console.ts`

- `"MargoMeter/Panel"` — `BRAND`

### `src/ports/browser-file.ts`

- `"MargoMeter-download"` — `DOWNLOAD_ANCHOR_CLASS`
- `"application/json"` — `FILE_TYPE`

### `src/ports/browser-store.ts`

- `"MargoMeter-fights"` — `STORE_KEY`
- `"MargoMeter-helper-folded"` — `STORE_KEY`
- `"MargoMeter-helper-position"` — `STORE_KEY`
- `"MargoMeter-helper-size"` — `STORE_KEY`
- `"MargoMeter-meter-folded"` — `STORE_KEY`
- `"MargoMeter-meter-position"` — `STORE_KEY`
- `"MargoMeter-meter-size"` — `STORE_KEY`
- `"MargoMeter-storage"` — `STORE_KEY`
- `"MargoMeter-type-step"` — `STORE_KEY`

### `src/ports/browser-surroundings.ts`

- `"."` — `HOST_SEPARATOR`
- `"hostname"` — `HOST_FIELD`
- `"location"` — `LOCATION_FIELD`
- `"navigator"` — `NAVIGATOR_FIELD`
- `"unknown"` — `WORLD_UNKNOWN`
- `"userAgent"` — `USER_AGENT_FIELD`

### `src/ports/fight-capture.ts`

- `"+"` — `SHAPE_KEYS_PAST_MAXIMUM`

### `src/ports/margonem-client-build.ts`

- `"-"` — `BUILD_DASH`
- `"."` — `OPTIONAL_SEPARATOR`
- `".js"` — `SCRIPT_NAME_TAIL`
- `"_"` — `BUILD_UNDERSCORE`
- `"main.min"` — `SCRIPT_NAME_HEAD`

### `src/ports/margonem-client-dictionary.ts`

- `"%"` — `HOLE_MARK`
- `"+-"` — `DIRECTION_SIGNS`
- `"."` — `FULL_STOP`
- `"_t"` — `TRANSLATE_FIELD`

### `src/ports/margonem-engine-battle.ts`

- `"Engine"` — `ENGINE_FIELD`
- `"__margometerBattleWrap"` — `WRAP_MARKER`
- `"battle"` — `BATTLE_FIELD`
- `"d"` — `HELD_FIELDS`
- `"getEngine"` — `ENGINE_CALL_FIELD`
- `"hero"` — `ENGINE_FIELDS`
- `"map"` — `ENGINE_FIELDS`
- `"updateData"` — `WRAPPED_METHOD`

### `src/ports/margonem-engine-hero.ts`

- `"id"` — `HERO_FIELDS`

### `src/ports/margonem-engine-place.ts`

- `"name"` — `PLACE_FIELDS`
- `"x"` — `PLACE_FIELDS`
- `"y"` — `PLACE_FIELDS`

### `src/ports/margonem-engine-tooltip.ts`

- `"$"` — `WARRIOR_ELEMENT_FIELD`
- `"<br>"` — `CLIENT_BREAK`
- `"concatTip"` — `APPEND_METHOD`
- `"find"` — `FIND_METHOD`
- `"getTipData"` — `READ_METHOD`
- `"kept"` — `BLOCK_LANDING`
- `"off"` — `BLOCK_LANDING`
- `"on"` — `BLOCK_LANDING`
- `"refused"` — `BLOCK_LANDING`
- `"tip"` — `REPLACE_METHOD`
- `"tipupdate"` — `TELL_EVENT`
- `"trigger"` — `TELL_METHOD`

### `src/ports/margonem-engine-warriors.ts`

- `"ac"` — `SHALLOW_COPIED_KEYS`
- `"energy"` — `COPIED_KEYS`
- `"mana"` — `COPIED_KEYS`
- `"originalId"` — `IDENTITY_KEYS`
- `"warriors"` — `WARRIOR_COLLECTIONS`
- `"warriorsList"` — `WARRIOR_COLLECTIONS`

### `src/ports/margonem-value.ts`

- `"build"` — `MARGONEM_VALUE`
- `"hero"` — `MARGONEM_VALUE`
- `"label"` — `MARGONEM_VALUE`
- `"place"` — `MARGONEM_VALUE`

### `src/ports/payload-envelope.ts`

- `"auto"` — `ENVELOPE_KEYS`
- `"buffs"` — `WARRIOR_FIELDS`
- `"cur"` — `HEALTH_FIELDS`
- `"endBattle"` — `ENVELOPE_KEYS`
- `"hp"` — `WARRIOR_FIELDS`
- `"id"` — `WARRIOR_FIELDS`
- `"init"` — `ENVELOPE_KEYS`
- `"lvl"` — `WARRIOR_FIELDS`
- `"m"` — `ENVELOPE_KEYS`
- `"max"` — `HEALTH_FIELDS`
- `"mi"` — `ENVELOPE_KEYS`
- `"myteam"` — `ENVELOPE_KEYS`
- `"name"` — `CHARGE_FIELDS`, `WARRIOR_FIELDS`
- `"prof"` — `WARRIOR_FIELDS`
- `"super_cast"` — `WARRIOR_FIELDS`
- `"team"` — `WARRIOR_FIELDS`
- `"total_turns"` — `CHARGE_FIELDS`
- `"turn"` — `CHARGE_FIELDS`
- `"turns_warriors"` — `ENVELOPE_KEYS`
- `"w"` — `ENVELOPE_KEYS`

### `src/runtime/defect-ledger.ts`

- `"engine"` — `DEFECT_KIND`
- `"figures"` — `DEFECT_KIND`
- `"file"` — `DEFECT_KIND`
- `"gesture"` — `DEFECT_KIND`
- `"keeping"` — `DEFECT_KIND`
- `"kept"` — `DEFECT_KIND`
- `"mount"` — `DEFECT_KIND`
- `"reading"` — `DEFECT_KIND`
- `"region"` — `DEFECT_KIND`

### `src/runtime/failure-fate.ts`

- `"by-place"` — `FAILURE_FATE`
- `"defect"` — `FAILURE_FATE`
- `"fallback-with-defect"` — `FAILURE_FATE`
- `"none"` — `FAILURE_FATE`
- `"shelf-answer"` — `FAILURE_FATE`
- `"shown-as-suspect"` — `FAILURE_FATE`
- `"shown-as-unknown"` — `FAILURE_FATE`
- `"stand-down"` — `FAILURE_FATE`

### `src/runtime/fight-file.ts`

- `"addOnVersion"` — `FILE_FIELD`
- `"byNeitherEnd"` — `REPORT_KEY_BY_FIGHT_FIELD`
- `"calls"` — `FILE_FIELD`
- `"capturedAt"` — `FILE_FIELD`
- `"castsStated"` — `REPORT_KEY_BY_FIGHT_FIELD`
- `"castsUnplaced"` — `REPORT_KEY_BY_FIGHT_FIELD`, `REPORT_KEY_BY_ROW_FIELD`
- `"combatantsAfter"` — `FILE_FIELD`
- `"combatantsBefore"` — `FILE_FIELD`
- `"damageDealtWithoutSkillByOpponentAndSource"` — `REPORT_KEY_BY_ROW_FIELD`
- `"damageDealtWithoutSkillBySource"` — `REPORT_KEY_BY_ROW_FIELD`
- `"damageTakenWithoutSkillBySource"` — `REPORT_KEY_BY_ROW_FIELD`
- `"dealt"` — `REPORT_KEY_BY_SKILL_FIELD`
- `"dealtByNobody"` — `REPORT_KEY_BY_FIGHT_FIELD`
- `"dealtByOpponent"` — `REPORT_KEY_BY_SKILL_FIELD`
- `"droppedCalls"` — `FILE_FIELD`
- `"formatVersion"` — `FILE_FIELD`
- `"gameBuild"` — `FILE_FIELD`
- `"givenByNobody"` — `REPORT_KEY_BY_FIGHT_FIELD`
- `"healthGivenWithoutSkillByReceiverAndSource"` — `REPORT_KEY_BY_ROW_FIELD`
- `"healthRestoredByNobodyBySource"` — `REPORT_KEY_BY_ROW_FIELD`
- `"healthRestoredBySource"` — `REPORT_KEY_BY_ROW_FIELD`
- `"healthRestoredWithoutSkillBySource"` — `REPORT_KEY_BY_ROW_FIELD`
- `"index"` — `FILE_FIELD`
- `"isTruncated"` — `FILE_FIELD`
- `"messages"` — `FILE_FIELD`
- `"none"` — `NOTHING_STATED`
- `"payload"` — `FILE_FIELD`
- `"report"` — `FILE_FIELD`
- `"restored"` — `REPORT_KEY_BY_SKILL_FIELD`
- `"restoredByOpponent"` — `REPORT_KEY_BY_SKILL_FIELD`
- `"restoredToNobody"` — `REPORT_KEY_BY_FIGHT_FIELD`
- `"takenByNobody"` — `REPORT_KEY_BY_FIGHT_FIELD`
- `"userAgent"` — `FILE_FIELD`
- `"world"` — `FILE_FIELD`

### `src/runtime/panel-frame.ts`

- `"drill"` — `FIGURES_CUT`
- `"helper"` — `FIGURES_CUT`
- `"pair"` — `FIGURES_CUT`
- `"part"` — `FIGURES_CUT`
- `"screen"` — `FIGURES_CUT`

### `src/runtime/settings.ts`

- `"height"` — `SIZE_FIELDS`
- `"helper-folded"` — `SETTING_KEY`
- `"helper-position"` — `SETTING_KEY`
- `"helper-size"` — `SETTING_KEY`
- `"left"` — `POSITION_FIELDS`
- `"meter-folded"` — `SETTING_KEY`
- `"meter-position"` — `SETTING_KEY`
- `"meter-size"` — `SETTING_KEY`
- `"storage"` — `SETTING_KEY`
- `"top"` — `POSITION_FIELDS`
- `"type-step"` — `SETTING_KEY`
- `"width"` — `SIZE_FIELDS`

### `src/runtime/shelf.ts`

- `"fights"` — `SHELF_FIELDS`
- `"gameBuild"` — `FIGHT_FIELDS`
- `"isPinned"` — `FIGHT_FIELDS`
- `"mapName"` — `PLACE_FIELDS`
- `"openedAt"` — `FIGHT_FIELDS`
- `"payloads"` — `FIGHT_FIELDS`
- `"place"` — `FIGHT_FIELDS`
- `"readerId"` — `FIGHT_FIELDS`
- `"version"` — `SHELF_FIELDS`
- `"x"` — `PLACE_FIELDS`
- `"y"` — `PLACE_FIELDS`

### `src/ui/panel-choice.ts`

- `"helper"` — `PANEL_WINDOW`
- `"large"` — `TYPE_STEP`
- `"local"` — `STORAGE_CHOICE`
- `"medium"` — `TYPE_STEP`
- `"memory"` — `STORAGE_CHOICE`
- `"meter"` — `PANEL_WINDOW`
- `"session"` — `STORAGE_CHOICE`
- `"small"` — `TYPE_STEP`

### `src/ui/panel-content.ts`

- `"actor"` — `UNNAMED_END`
- `"apart"` — `PINNED_PLACING`
- `"cut"` — `PINNED_PLACING`
- `"damageDealtByNobody"` — `HALF_NAMED_TOTAL_FIELD`
- `"damageDealtToNobody"` — `HALF_NAMED_FIELD`
- `"damageDealtToNobodyByKind"` — `HALF_NAMED_KIND_FIELD`
- `"damageTakenByNobody"` — `HALF_NAMED_TOTAL_FIELD`
- `"damageTakenFromNobody"` — `HALF_NAMED_FIELD`
- `"damageTakenFromNobodyByKind"` — `HALF_NAMED_KIND_FIELD`
- `"dealtWithNoActor"` — `PINNED_CASE`
- `"element"` — `HALF_NAMED_OPENED`
- `"givenWithNoActor"` — `PINNED_CASE`
- `"healthGivenByNobody"` — `HALF_NAMED_TOTAL_FIELD`
- `"healthRestoredByNobody"` — `HALF_NAMED_FIELD`
- `"healthRestoredByNobodyByKey"` — `HALF_NAMED_KIND_FIELD`
- `"healthRestoredToNobody"` — `HALF_NAMED_TOTAL_FIELD`
- `"nobody"` — `SIDE_RELATION`
- `"opposing"` — `SIDE_RELATION`
- `"person"` — `HALF_NAMED_OPENED`
- `"reader"` — `SIDE_RELATION`
- `"restoredWithNoActor"` — `PINNED_CASE`
- `"takenWithNoActor"` — `PINNED_CASE`
- `"takenWithNoTarget"` — `PINNED_CASE`
- `"target"` — `UNNAMED_END`

### `src/ui/panel-document.ts`

- `"contextmenu"` — `EVENT_TYPE`
- `"pointercancel"` — `EVENT_TYPE`
- `"pointerdown"` — `EVENT_TYPE`
- `"pointermove"` — `EVENT_TYPE`
- `"pointerout"` — `EVENT_TYPE`
- `"pointerup"` — `EVENT_TYPE`
- `"style"` — `STYLE_ATTRIBUTE`

### `src/ui/panel-drag.ts`

- `"data-grip"` — `GRIP_ATTRIBUTE`
- `"data-size-grip"` — `SIZE_GRIP_ATTRIBUTE`
- `"left"` — `CARD_EDGE`
- `"move"` — `GRAB_KIND`
- `"right"` — `CARD_EDGE`
- `"size"` — `GRAB_KIND`

### `src/ui/panel-element.ts`

- `"+"` — `UNFOLD_MARK`
- `"MargoMeter-Panel"` — `HOST_NAME`
- `"auto"` — `EDGE_RELEASED`
- `"caveat"` — `CARD_NOTE_TONE`
- `"crumb:back"` — `CRUMB_CARD_KEY`
- `"data-card"` — `CARD_ATTRIBUTE`
- `"data-margometer-version"` — `VERSION_ATTRIBUTE`
- `"defect"` — `CARD_NOTE_TONE`
- `"fight"` — `FIGHT_CARD_KEY`
- `"heading"` — `CARD_LINE`
- `"helper:"` — `HELPER_CARD_PREFIX`
- `"note"` — `CARD_LINE`
- `"pair"` — `CARD_KEY_PLACE`
- `"pair-kinds"` — `CARD_KEY_PLACE`
- `"plain"` — `CARD_NOTE_TONE`
- `"skill"` — `CARD_KEY_PLACE`
- `"stat"` — `CARD_LINE`
- `"sub"` — `CARD_LINE`
- `"suspect"` — `CARD_NOTE_TONE`
- `"title"` — `TITLE_ATTRIBUTE`
- `"waiting"` — `WAITING_LIST_NAME`

### `src/ui/panel-helper.ts`

- `"afterFight"` — `STANDING_TURN_STATE`
- `"betweenFights"` — `HELPER_ABSENCE`
- `"fightUnread"` — `HELPER_ABSENCE`
- `"held"` — `STANDING_TURN_STATE`
- `"noFightYet"` — `HELPER_ABSENCE`
- `"onAuto"` — `STANDING_TURN_STATE`
- `"unread"` — `STANDING_TURN_STATE`

### `src/ui/panel-intent.ts`

- `"close"` — `PANEL_INTENT`
- `"closing"` — `PLAIN_MARK`
- `"data-back"` — `PANEL_MARK`
- `"data-fight"` — `PANEL_MARK`
- `"data-fold"` — `PANEL_MARK`
- `"data-helper-fold"` — `PANEL_MARK`
- `"data-kind"` — `PANEL_MARK`
- `"data-options"` — `PANEL_MARK`
- `"data-pin"` — `PANEL_MARK`
- `"data-plain"` — `PANEL_MARK`
- `"data-reset-size"` — `PANEL_MARK`
- `"data-row"` — `PANEL_MARK`
- `"data-save"` — `PANEL_MARK`
- `"data-screen"` — `PANEL_MARK`
- `"data-shelf"` — `PANEL_MARK`
- `"data-side"` — `PANEL_MARK`
- `"data-skill"` — `PANEL_MARK`
- `"data-source"` — `PANEL_MARK`
- `"data-storage"` — `PANEL_MARK`
- `"data-type-step"` — `PANEL_MARK`
- `"data-unnamed"` — `PANEL_MARK`
- `"fold"` — `PANEL_INTENT`
- `"live"` — `LIVE_FIGHT_MARK`
- `"metric"` — `PANEL_INTENT`
- `"move"` — `PANEL_INTENT`
- `"open-part"` — `PANEL_INTENT`
- `"open-row"` — `PANEL_INTENT`
- `"open-unnamed"` — `PANEL_INTENT`
- `"options"` — `PANEL_INTENT`
- `"pin"` — `PANEL_INTENT`
- `"reset-size"` — `PANEL_INTENT`
- `"resize"` — `PANEL_INTENT`
- `"save-file"` — `PANEL_INTENT`
- `"shelf"` — `PANEL_INTENT`
- `"show-kept"` — `PANEL_INTENT`
- `"show-live"` — `PANEL_INTENT`
- `"side"` — `PANEL_INTENT`
- `"storage"` — `PANEL_INTENT`
- `"type-step"` — `PANEL_INTENT`

### `src/ui/panel-look.ts`

- `"--MargoMeter-"` — `VARIABLE_PREFIX`
- `"--MargoMeter-card-height"` — `CARD_VARIABLES`
- `"--MargoMeter-card-left"` — `CARD_VARIABLES`
- `"--MargoMeter-card-right"` — `CARD_VARIABLES`
- `"--MargoMeter-card-top"` — `CARD_VARIABLES`
- `"--MargoMeter-helper-height"` — `SIZE_VARIABLES`
- `"--MargoMeter-helper-top"` — `TOP_VARIABLES`
- `"--MargoMeter-helper-width"` — `SIZE_VARIABLES`
- `"--MargoMeter-list-basis"` — `SIZED_METER_VARIABLES`
- `"--MargoMeter-list-rows-least"` — `SIZED_METER_VARIABLES`
- `"--MargoMeter-meter-height"` — `SIZE_VARIABLES`
- `"--MargoMeter-meter-share"` — `SIZED_METER_VARIABLES`
- `"--MargoMeter-meter-top"` — `TOP_VARIABLES`
- `"--MargoMeter-meter-width"` — `SIZE_VARIABLES`
- `"--MargoMeter-rows"` — `ROWS_VARIABLE`
- `"-webkit-user-select:none;user-select:none;"` — `NO_SELECTION`
- `"MargoMeter-body"` — `CLASS`
- `"MargoMeter-card"` — `CLASS`
- `"MargoMeter-helper"` — `CLASS`
- `"MargoMeter-sides"` — `CLASS`
- `"MargoMeter-titlebar"` — `CLASS`
- `"apart"` — `CLASS`
- `"bar"` — `CLASS`
- `"bar-cap"` — `CLASS`
- `"card-caveat"` — `CLASS`
- `"card-caveat-note"` — `CLASS`
- `"card-column"` — `CLASS`
- `"card-columns"` — `CLASS`
- `"card-defect"` — `CLASS`
- `"card-group"` — `CLASS`
- `"card-heading"` — `CLASS`
- `"card-hidden"` — `CLASS`
- `"card-label"` — `CLASS`
- `"card-line"` — `CLASS`
- `"card-name"` — `CLASS`
- `"card-note"` — `CLASS`
- `"card-outcome"` — `CLASS`
- `"card-strong"` — `CLASS`
- `"card-sub"` — `CLASS`
- `"card-subtitle"` — `CLASS`
- `"card-suspect"` — `CLASS`
- `"card-value"` — `CLASS`
- `"card-wide"` — `CLASS`
- `"chosen"` — `CLASS`
- `"crumb"` — `CLASS`
- `"crumb-back"` — `CLASS`
- `"crumb-here"` — `CLASS`
- `"defect"` — `CLASS`
- `"defects"` — `CLASS`
- `"drillable"` — `CLASS`
- `"empty"` — `CLASS`
- `"figure"` — `CLASS`
- `"fold"` — `BAR_ICON`
- `"folded"` — `CLASS`
- `"header"` — `CLASS`
- `"header-line"` — `CLASS`
- `"header-outcome"` — `CLASS`
- `"header-place"` — `CLASS`
- `"header-place-name"` — `CLASS`
- `"header-place-tile"` — `CLASS`
- `"helper-bar"` — `CLASS`
- `"helper-body"` — `CLASS`
- `"helper-cast"` — `CLASS`
- `"helper-folded"` — `CLASS`
- `"helper-holding"` — `CLASS`
- `"helper-pip"` — `CLASS`
- `"helper-pip-lit"` — `CLASS`
- `"helper-pips"` — `CLASS`
- `"helper-under"` — `CLASS`
- `"leaf"` — `CLASS`
- `"list"` — `CLASS`
- `"list-waiting"` — `CLASS`
- `"meter"` — `CLASS`
- `"options"` — `BAR_ICON`
- `"options-answer"` — `CLASS`
- `"options-heading"` — `CLASS`
- `"options-meaning"` — `CLASS`
- `"options-question"` — `CLASS`
- `"options-reset"` — `CLASS`
- `"options-step"` — `CLASS`
- `"options-steps"` — `CLASS`
- `"options-window"` — `CLASS`
- `"options-window-name"` — `CLASS`
- `"options-window-own"` — `CLASS`
- `"options-window-state"` — `CLASS`
- `"outcome-lost"` — `CLASS`
- `"outcome-won"` — `CLASS`
- `"outside-region"` — `CLASS`
- `"pinned"` — `CLASS`
- `"pinned-region"` — `CLASS`
- `"row"` — `CLASS`
- `"row-caveat"` — `CLASS`
- `"row-name"` — `CLASS`
- `"row-outcome"` — `CLASS`
- `"row-pin"` — `CLASS`
- `"row-rank"` — `CLASS`
- `"row-share"` — `CLASS`
- `"row-side"` — `CLASS`
- `"row-size"` — `CLASS`
- `"row-suspect"` — `CLASS`
- `"row-time"` — `CLASS`
- `"row-turn"` — `CLASS`
- `"row-value"` — `CLASS`
- `"save"` — `BAR_ICON`
- `"section-heading"` — `CLASS`
- `"section-words"` — `CLASS`
- `"selected"` — `CLASS`
- `"shelf"` — `BAR_ICON`
- `"sides"` — `CLASS`
- `"sides-label"` — `CLASS`
- `"sides-nobody"` — `CLASS`
- `"sides-ours"` — `CLASS`
- `"sides-spare"` — `CLASS`
- `"sides-theirs"` — `CLASS`
- `"sides-track"` — `CLASS`
- `"size-grip"` — `CLASS`
- `"slot"` — `CLASS`
- `"strip"` — `CLASS`
- `"strips"` — `CLASS`
- `"strips-gap"` — `CLASS`
- `"suspicion"` — `CLASS`
- `"suspicions"` — `CLASS`
- `"titlebar-button"` — `CLASS`
- `"titlebar-lead"` — `CLASS`
- `"titlebar-version"` — `CLASS`
- `"undrawn"` — `CLASS`
- `"unfold"` — `BAR_ICON`
- `"unread"` — `CLASS`

### `src/ui/panel-screen.ts`

- `"damage"` — `PANEL_NOUN`
- `"damageDealt"` — `PANEL_METRIC`
- `"damageTaken"` — `PANEL_METRIC`
- `"element"` — `OPENED_PART`
- `"everyone"` — `SIDE_CHOICE`
- `"given"` — `PANEL_DIRECTION`
- `"healing"` — `PANEL_NOUN`
- `"healthGiven"` — `PANEL_METRIC`
- `"healthRestored"` — `PANEL_METRIC`
- `"opposing"` — `SIDE_CHOICE`
- `"options"` — `OPTIONS_LIST_NAME`
- `"plain"` — `OPENED_PART`
- `"reader"` — `SIDE_CHOICE`
- `"received"` — `PANEL_DIRECTION`
- `"shelf"` — `SHELF_LIST_NAME`
- `"skill"` — `OPENED_PART`
- `"source"` — `OPENED_PART`

### `src/ui/panel-words.ts`

- `"&"` — `MARKUP_ENTITY`
- `"-"` — `MINUS_SIGN`
- `"<"` — `MARKUP_OPENER`
- `"<1%"` — `SHARE_FLOOR`
- `"MargoMeter"` — `ADD_ON_NAME`
- `"P"` — `OUTCOME_LETTERS`
- `"R"` — `OUTCOME_LETTERS`
- `"U"` — `OUTCOME_LETTERS`
- `"W"` — `OUTCOME_LETTERS`
- `"buff"` — `STATUS_CATEGORY`
- `"card"` — `PANEL_REGION`
- `"crumb"` — `PANEL_REGION`
- `"defects"` — `PANEL_REGION`
- `"engine"` — `PANEL_DEFECT_KIND`
- `"figures"` — `PANEL_DEFECT_KIND`
- `"file"` — `PANEL_DEFECT_KIND`
- `"gesture"` — `PANEL_DEFECT_KIND`
- `"header"` — `PANEL_REGION`
- `"helper"` — `PANEL_REGION`
- `"i"` — `CAVEAT_MARK`
- `"keeping"` — `PANEL_DEFECT_KIND`
- `"kept"` — `PANEL_DEFECT_KIND`
- `"list"` — `PANEL_REGION`
- `"mount"` — `PANEL_DEFECT_KIND`
- `"outside"` — `PANEL_REGION`
- `"pinned"` — `PANEL_REGION`
- `"reading"` — `PANEL_DEFECT_KIND`
- `"reduction"` — `CAVEAT`
- `"region"` — `PANEL_DEFECT_KIND`
- `"sides"` — `PANEL_REGION`
- `"strips"` — `PANEL_REGION`
- `"suspicions"` — `PANEL_REGION`
- `"turns"` — `CAVEAT`
- `"unannounced"` — `CAVEAT`
- `"undivided"` — `CAVEAT`

### `src/ui/view-failure.ts`

- `"back"` — `PANEL_LISTENER`
- `"cancel"` — `PANEL_LISTENER`
- `"capture"` — `PANEL_LISTENER`
- `"drag"` — `PANEL_LISTENER`
- `"grab"` — `PANEL_LISTENER`
- `"hover"` — `PANEL_LISTENER`
- `"leave"` — `PANEL_LISTENER`
- `"press"` — `PANEL_LISTENER`
- `"release"` — `PANEL_LISTENER`

### `src/userscript-entry.ts`

- `"Blob"` — `WINDOW_FUNCTIONS`
- `"Date"` — `WINDOW_FUNCTIONS`
- `"URL"` — `WINDOW_FUNCTIONS`
- `"a"` — `ANCHOR_TAG`
- `"cancelAnimationFrame"` — `WINDOW_FUNCTIONS`
- `"clearInterval"` — `WINDOW_FUNCTIONS`
- `"clock"` — `BROWSER_WINDOW_PART`
- `"console"` — `BROWSER_WINDOW_PART`
- `"document"` — `BROWSER_WINDOW_PART`
- `"downloads"` — `BROWSER_WINDOW_PART`
- `"frames"` — `BROWSER_WINDOW_PART`
- `"requestAnimationFrame"` — `WINDOW_FUNCTIONS`
- `"script[src]"` — `SCRIPT_WITH_SOURCE`
- `"setInterval"` — `WINDOW_FUNCTIONS`
- `"setTimeout"` — `WINDOW_FUNCTIONS`
- `"timers"` — `BROWSER_WINDOW_PART`
- `"window"` — `BROWSER_WINDOW_PART`

### `tools/aura-lifetime.ts`

- `"--cases"` — `CASES_FLAG`

### `tools/build-userscript.ts`

- `"\""` — `QUOTES`
- `"${"` — `TEMPLATE_HOLE`
- `"'"` — `QUOTES`
- `"*/"` — `BLOCK_COMMENT_CLOSE`
- `"-dev"` — `DEVELOPMENT_SUFFIX`
- `"/*"` — `BLOCK_COMMENT_OPEN`
- `"//"` — `LINE_COMMENT`
- `"@import"` — `STYLE_IMPORT`
- `"EventSource"` — `AMBIENT_WAYS_OUT`, `OUTBOUND_CALLS`
- `"Image"` — `AMBIENT_WAYS_OUT`
- `"MargoMeter"` — `RELEASE_EDITION`
- `"Request"` — `AMBIENT_WAYS_OUT`
- `"SharedWorker"` — `AMBIENT_WAYS_OUT`
- `"WebSocket"` — `AMBIENT_WAYS_OUT`
- `"Worker"` — `AMBIENT_WAYS_OUT`
- `"XMLHttpRequest"` — `AMBIENT_WAYS_OUT`, `OUTBOUND_CALLS`
- `"\\"` — `ESCAPE`
- ``"`"`` — `QUOTES`, `TEMPLATE_QUOTE`
- `"a"` — `TAGS_BUILT`
- `"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$"` — `WORD_CHARACTERS`
- `"com"` — `MARGONEM_DOMAINS`
- `"commons"` — `NON_WORLD_HOSTS`
- `"createElement("` — `TAG_CALL`
- `"data:"` — `INLINE_SCHEME`
- `"deno.json"` — `CONFIGURATION_FILE`
- `"dist"` — `OUTPUT_DIRECTORY`
- `"div"` — `TAGS_BUILT`
- `"fetch"` — `AMBIENT_WAYS_OUT`
- `"fetch("` — `OUTBOUND_CALLS`
- `"forum"` — `NON_WORLD_HOSTS`
- `"https://github.com/KamilGrocholski/margometer"` — `HOMEPAGE`
- `"importScripts"` — `AMBIENT_WAYS_OUT`
- `"location"` — `AMBIENT_WAYS_OUT`
- `"margometer.meta.js"` — `METADATA_NAME`
- `"margometer.user.js"` — `USERSCRIPT_NAME`
- `"navigator"` — `AMBIENT_WAYS_OUT`
- `"pl"` — `MARGONEM_DOMAINS`
- `"pomoc"` — `NON_WORLD_HOSTS`
- `"sendBeacon"` — `AMBIENT_WAYS_OUT`, `OUTBOUND_CALLS`
- `"span"` — `TAGS_BUILT`
- `"src/userscript-boot.ts"` — `BUNDLE_ENTRY`
- `"style"` — `TAGS_BUILT`
- `"url("` — `STYLE_URL_OPEN`
- `"www"` — `NON_WORLD_HOSTS`

### `tools/capture-intake.ts`

- `".-"` — `VERSION_PUNCTUATION`
- `".json"` — `RECORDING_SUFFIX`
- `"abcdefghijklmnopqrstuvwxyz0123456789"` — `SLUG_CHARACTERS`
- `"dddd-dd-dd"` — `DAY_SHAPE`
- `"descriptionsRemoved"` — `REMOVED_COUNT`
- `"namesSubstituted"` — `SUBSTITUTED_COUNT`

### `tools/changelog.ts`

- `"CHANGELOG.md"` — `CHANGELOG_FILE`

### `tools/develop-reports.ts`

- `".cache"` — `CACHE_DIRECTORY`
- `".complete"` — `COMPLETE_MARK`
- `"added"` — `LINE_CHANGE`
- `"captures"` — `DEVELOP_RECORDINGS`
- `"deno.json"` — `DEVELOP_PATHS`
- `"deno.lock"` — `DEVELOP_PATHS`
- `"fight:decoding"` — `DECODING_TASK`
- `"fight:figures"` — `FIGURES_TASK`
- `"frozen"` — `DEVELOP_PATHS`
- `"libs"` — `DEVELOP_PATHS`
- `"project"` — `DEVELOP_PATHS`
- `"removed"` — `LINE_CHANGE`
- `"src"` — `DEVELOP_PATHS`
- `"tools"` — `DEVELOP_PATHS`

### `tools/drill-report.ts`

- `"always"` — `DRILL_VERDICT`
- `"closing"` — `DRILL_ROW`
- `"half-named"` — `DRILL_ROW`
- `"kind"` — `DRILL_ROW`
- `"never"` — `DRILL_VERDICT`
- `"opened"` — `DRILL_RUNG`
- `"opens"` — `OPENS_WORD`
- `"pair"` — `DRILL_RUNG`
- `"part"` — `DRILL_RUNG`
- `"person"` — `DRILL_ROW`
- `"ranking"` — `DRILL_RUNG`
- `"skill"` — `DRILL_ROW`
- `"sometimes"` — `DRILL_VERDICT`
- `"source"` — `DRILL_ROW`
- `"unnamed"` — `DRILL_RUNG`

### `tools/fabricated-fight.ts`

- `"+dmg"` — `ELEMENTS`
- `"+dmgc"` — `ELEMENTS`
- `"+dmgd"` — `ELEMENTS`
- `"+dmgf"` — `ELEMENTS`
- `"+dmgl"` — `ELEMENTS`
- `"+dmgo"` — `ELEMENTS`
- `"-dmg"` — `ELEMENTS`
- `"-dmgc"` — `ELEMENTS`
- `"-dmgd"` — `ELEMENTS`
- `"-dmgf"` — `ELEMENTS`
- `"-dmgl"` — `ELEMENTS`
- `"-dmgo"` — `ELEMENTS`
- `".json"` — `FILE_SUFFIX`
- `"/"` — `PATH_SEPARATOR`
- `"ac"` — `CLIENT_FIELDS`
- `"act"` — `CLIENT_FIELDS`
- `"b"` — `PROFESSIONS`
- `"battleground"` — `CLIENT_FIELDS`
- `"bonus"` — `CLIENT_FIELDS`
- `"c"` — `ELEMENTS`
- `"closing-shouts"` — `CLOSING_SHOUTS_FLAG`
- `"combo"` — `CLIENT_FIELDS`
- `"cooldowns"` — `CLIENT_FIELDS`
- `"cur"` — `CLIENT_FIELDS`
- `"d"` — `ELEMENTS`
- `"ending"` — `ENDING_FLAG`
- `"energy"` — `CLIENT_FIELDS`
- `"f"` — `ELEMENTS`
- `"fabricated"` — `FABRICATED_DIRECTORY`, `FABRICATED_WORLD`
- `"fabricatedBy"` — `FABRICATION_FIELDS`
- `"fabricatedShape"` — `FABRICATION_FIELDS`
- `"fabricationScript"` — `FABRICATION_FIELDS`
- `"fled"` — `FABRICATION_ENDING`
- `"flee"` — `FLED_KEY`
- `"focus"` — `CLIENT_FIELDS`
- `"gender"` — `CLIENT_FIELDS`
- `"h"` — `PROFESSIONS`
- `"hpp"` — `CLIENT_FIELDS`
- `"icon"` — `CLIENT_FIELDS`
- `"isFabricated"` — `FABRICATION_FIELDS`
- `"l"` — `ELEMENTS`
- `"left"` — `CLIENT_FIELDS`
- `"level"` — `LEVEL_FLAG`
- `"loser"` — `OUTCOME_LOSER_KEY`
- `"m"` — `PROFESSIONS`
- `"mana"` — `CLIENT_FIELDS`
- `"minimum"` — `CLIENT_FIELDS`
- `"move"` — `CLIENT_FIELDS`
- `"o"` — `ELEMENTS`
- `"oplvl"` — `CLIENT_FIELDS`
- `"originalId"` — `CLIENT_FIELDS`
- `"out"` — `OUTPUT_FLAG`
- `"p"` — `PROFESSIONS`
- `"penalty"` — `CLIENT_FIELDS`
- `"per-side"` — `PER_SIDE_FLAG`
- `"poolTime"` — `CLIENT_FIELDS`
- `"resfire"` — `CLIENT_FIELDS`
- `"resfrost"` — `CLIENT_FIELDS`
- `"reslight"` — `CLIENT_FIELDS`
- `"rounds"` — `ROUNDS_FLAG`
- `"settled"` — `FABRICATION_ENDING`
- `"shouts"` — `CLOSING_SHOUTS_SUFFIX`
- `"skills"` — `CLIENT_FIELDS`
- `"skills_combo_max"` — `CLIENT_FIELDS`
- `"skills_disabled"` — `CLIENT_FIELDS`
- `"start_move"` — `CLIENT_FIELDS`
- `"t"` — `PROFESSIONS`
- `"ten-a-side"` — `FABRICATION_SCRIPT`
- `"tools/fabricated-fight.ts"` — `TOOL_NAME`
- `"total"` — `CLIENT_FIELDS`
- `"w"` — `PROFESSIONS`
- `"winner"` — `OUTCOME_WINNER_KEY`
- `"y"` — `CLIENT_FIELDS`

### `tools/fight-figures.ts`

- `"applied"` — `HEADINGS`
- `"given"` — `HEADINGS`
- `"prevented"` — `HEADINGS`
- `"raw(blow)"` — `HEADINGS`
- `"restored"` — `HEADINGS`
- `"taken"` — `HEADINGS`

### `tools/frozen-files.ts`

- `"frozen/"` — `FROZEN_DIRECTORY`

### `tools/help-article.ts`

- `".cache/help/"` — `CACHE_ROOT`
- `"fetchedAt"` — `FROZEN_DATE_FIELD`
- `"frozen/help-phrases.ts"` — `FROZEN_PATH`
- `"https://pomoc.margonem.pl"` — `HELP_HOST`
- `"pl"` — `LOCALE`
- `"provenance.json"` — `MANIFEST_NAME`
- `"text.txt"` — `TEXT_NAME`

### `tools/help-claim-register.ts`

- `"*Help:*"` — `HELP_MARKERS`
- `"_Help:_"` — `HELP_MARKERS`
- ``"`"`` — `BACKTICK`
- `"docs/protocol-keys.md"` — `REGISTER_PATH`
- `"names"` — `OCCURRENCE_CLAIM`

### `tools/margometer-tool-error.ts`

- `"CaptureIntake"` — `TOOL_ERROR_CODE`
- `"CardHeight"` — `TOOL_ERROR_CODE`
- `"Changelog"` — `TOOL_ERROR_CODE`
- `"DeclaredVersion"` — `TOOL_ERROR_CODE`
- `"DevelopReport"` — `TOOL_ERROR_CODE`
- `"DrillReport"` — `TOOL_ERROR_CODE`
- `"FabricatedFight"` — `TOOL_ERROR_CODE`
- `"FrozenFiles"` — `TOOL_ERROR_CODE`
- `"GivingWay"` — `TOOL_ERROR_CODE`
- `"HelpArticle"` — `TOOL_ERROR_CODE`
- `"MargonemClientSource"` — `TOOL_ERROR_CODE`
- `"MargonemReadings"` — `TOOL_ERROR_CODE`
- `"MargonemUnreachable"` — `TOOL_ERROR_CODE`
- `"PanelShot"` — `TOOL_ERROR_CODE`
- `"PayloadCost"` — `TOOL_ERROR_CODE`
- `"PreviewServe"` — `TOOL_ERROR_CODE`
- `"ProtocolKeyShape"` — `TOOL_ERROR_CODE`
- `"ProtocolKeyTable"` — `TOOL_ERROR_CODE`
- `"RecordingRead"` — `TOOL_ERROR_CODE`
- `"SkillTable"` — `TOOL_ERROR_CODE`
- `"StatusBitTable"` — `TOOL_ERROR_CODE`
- `"TurnCount"` — `TOOL_ERROR_CODE`
- `"TurnReading"` — `TOOL_ERROR_CODE`
- `"UserscriptBuild"` — `TOOL_ERROR_CODE`

### `tools/margonem-client-source.ts`

- `".cache/game-client/"` — `CACHE_ROOT`
- `"build"` — `MANIFEST_FIELDS`
- `"bundlePath"` — `MANIFEST_FIELDS`
- `"development"` — `MARGONEM_CHANNEL`
- `"fetchedAt"` — `MANIFEST_FIELDS`
- `"host"` — `MANIFEST_FIELDS`
- `"https://experimental.margonem.pl"` — `CHANNEL_HOSTS`
- `"https://tempest.margonem.pl"` — `CHANNEL_HOSTS`
- `"main.js"` — `BUNDLE_NAME`
- `"production"` — `MARGONEM_CHANNEL`
- `"provenance.json"` — `MANIFEST_NAME`

### `tools/margonem-readings.ts`

- `"current"` — `READING_VERDICT`
- `"stale"` — `READING_VERDICT`
- `"unknown"` — `READING_VERDICT`

### `tools/panel-giving-way.ts`

- `".."` — `PARENT`
- `"dist/giving-way"` — `INTO_DEFAULT`
- `"src/ui/panel-element.ts"` — `PANEL_FILE`

### `tools/panel-shots.ts`

- `"MARGOMETER_BROWSER"` — `BROWSER_VARIABLE`
- `"over"` — `SHOT_MOMENT`
- `"screenshots"` — `SHOT_DIRECTORY`
- `"taken-at.json"` — `SIDECAR_NAME`
- `"underway"` — `SHOT_MOMENT`

### `tools/preview-page.ts`

- `"#14171c"` — `MARGONEM_PAGE_COLOUR`
- `".preview-said"` — `PREVIEW_SAID_SELECTOR`
- `".preview-split"` — `PREVIEW_SPLIT_SELECTOR`
- `".preview-strip"` — `PREVIEW_STRIP_SELECTOR`
- `"preview-tips"` — `PREVIEW_TIPS_ID`

### `tools/preview-server.ts`

- `"MargoMeterTool/Preview"` — `FAILURE_LINE`
- `"deno.json"` — `BUNDLE_SOURCE_PATHS`
- `"deno.lock"` — `BUNDLE_SOURCE_PATHS`
- `"fabricated"` — `FLAG_FABRICATED`
- `"fight"` — `FLAG_FIGHT`
- `"from"` — `FLAG_FROM`
- `"frozen"` — `BUNDLE_SOURCE_PATHS`
- `"libs"` — `BUNDLE_SOURCE_PATHS`
- `"margometer-dev.meta.js"` — `DEVELOPMENT_METADATA_NAME`
- `"margometer-dev.user.js"` — `DEVELOPMENT_USERSCRIPT_NAME`
- `"no-store"` — `HTML_TYPE`, `SCRIPT_TYPE`
- `"port"` — `FLAG_PORT`
- `"src"` — `BUNDLE_SOURCE_PATHS`

### `tools/preview-site.ts`

- `"captures/2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json"` — `LANDING_RECORDING`
- `"dist/preview"` — `OUTPUT_DIRECTORY`
- `"https://github.com/KamilGrocholski/margometer"` — `HOMEPAGE`
- `"index.html"` — `LANDING_PAGE`
- `"release"` — `RELEASE_FLAG`

### `tools/preview-state.ts`

- `"e"` — `STATE_ENTRY_NAME`
- `"k"` — `STATE_STORE_NAME`
- `"s"` — `STATE_SCREEN_NAME`

### `tools/protocol-key-shape.ts`

- `"**"` — `BOLD`
- ``"*_`.,;:()[]\"'"`` — `WORD_EDGES`
- `";"` — `CLAIM_SEPARATOR`
- `"?dmg*"` — `DAMAGE_FAMILY_HEADING`
- `"_Shape:_"` — `SHAPE_MARKER`
- `"anywhere"` — `KEY_PLACEMENT`
- `"occurrence"` — `OCCURRENCE_STEM`
- `"occurrences"` — `OCCURRENCE_WORD`
- `"text"` — `KEY_VALUE`

### `tools/protocol-key-table.ts`

- `"$_"` — `NAME_CHARACTERS`
- `")=="` — `DEFAULT_BRANCH_SHAPES`
- `")?"` — `DEFAULT_BRANCH_SHAPES`
- `","` — `DEFAULT_BRANCH_SHAPES`
- `".charAt(0)"` — `DEFAULT_BRANCH_SHAPES`
- `".charAt(0)=="` — `DEFAULT_BRANCH_SHAPES`
- `".substr("` — `DEFAULT_BRANCH_SHAPES`
- `":"` — `LABEL_TERMINATOR`
- `"=="` — `DEFAULT_BRANCH_SHAPES`
- `"?"` — `DEFAULT_BRANCH_SHAPES`
- `"[0]"` — `SEGMENT_INDEX`
- `"[0])"` — `SWITCH_SUBJECT_TAIL`
- `"\\"` — `ESCAPE`
- `"case"` — `CASE_KEYWORD`
- `"dealtSign"` — `DEFAULT_BRANCH_FIELD`
- `"default:"` — `DEFAULT_BRANCH_SHAPES`
- `"digits"` — `SHAPE_STEP`
- `"frozen/protocol-keys.ts"` — `FROZEN_PATH`
- `"gameBuild"` — `FROZEN_DATE_FIELD`
- `"manageBattleEffects("` — `SWITCH_ANCHOR`
- `"marker"` — `DEFAULT_BRANCH_FIELD`
- `"markerAt"` — `DEFAULT_BRANCH_FIELD`
- `"markerLength"` — `DEFAULT_BRANCH_FIELD`
- `"quoted"` — `SHAPE_STEP`
- `"segment-key"` — `SHAPE_STEP`
- `"text"` — `SHAPE_STEP`
- `"{"` — `BLOCK_OPEN`
- `"}"` — `BLOCK_CLOSE`

### `tools/recorded-material.ts`

- `".json"` — `RECORDING_SUFFIX`
- `"npc"` — `INTAKE_KEYS`
- `"skills"` — `INTAKE_KEYS`

### `tools/shout-holding.ts`

- `"before"` — `BASELINE_TURN`

### `tools/skill-table.ts`

- `","` — `LEVEL_SEPARATOR`
- `".cache/skills/"` — `CACHE_ROOT`
- `";"` — `EFFECT_TERMINATOR`
- `"</td>"` — `CELL_CLOSE`
- `"<td>"` — `CELL_OPEN`
- `"<tr>"` — `ROW_OPEN`
- `"="` — `EFFECT_ASSIGNMENT`
- `"@"` — `DURATION_MARKER`
- `"add_attacks"` — `BLOWS_GRANTED_KEY`
- `"description"` — `COLUMNS`
- `"effects"` — `COLUMNS`
- `"fetchedAt"` — `FROZEN_DATE_FIELD`
- `"frozen/aura-turns.ts"` — `FROZEN_AURA_PATH`
- `"frozen/blows-granted.ts"` — `FROZEN_BLOWS_PATH`
- `"frozen/skill-durations.ts"` — `FROZEN_PATH`
- `"https://public-api.margonem.pl/we_get/skills/"` — `SKILLS_ADDRESS`
- `"id"` — `COLUMNS`
- `"levels"` — `COLUMNS`
- `"name"` — `COLUMNS`
- `"needs"` — `COLUMNS`
- `"profession"` — `COLUMNS`
- `"provenance.json"` — `MANIFEST_NAME`
- `"skills.html"` — `PAGE_NAME`
- `"tags"` — `COLUMNS`

### `tools/status-bit-table.ts`

- `"("` — `CALL_OPEN`
- `")"` — `CALL_CLOSE`
- `","` — `ARGUMENT_SEPARATOR`
- `"buff"` — `ROLE`
- `"frozen/status-bits.ts"` — `FROZEN_PATH`
- `"gameBuild"` — `FROZEN_DATE_FIELD`
- `"null"` — `NOTHING_ARGUMENT`

### `tools/turn-count.ts`

- `"always"` — `TURN_VERDICT`
- `"current"` — `WITNESS_KEYS`
- `"elsewhere"` — `TURN_PLACING`
- `"exact"` — `TURN_OUTCOME`, `TURN_PLACING`
- `"never"` — `TURN_VERDICT`
- `"over"` — `TURN_OUTCOME`
- `"sometimes"` — `TURN_VERDICT`
- `"under"` — `TURN_OUTCOME`

## Tasks

### `deno.json`

- `build`
- `capture:intake`
- `check`
- `e2e`
- `fight:auras`
- `fight:cost`
- `fight:decoding`
- `fight:develop`
- `fight:fabricate`
- `fight:figures`
- `fight:life`
- `fight:openers`
- `fight:shout`
- `fight:turns`
- `margonem:client`
- `margonem:help`
- `margonem:keys`
- `margonem:readings`
- `margonem:shape`
- `margonem:skills`
- `margonem:statuses`
- `names`
- `panel:cards`
- `panel:drill`
- `panel:giveway`
- `panel:shots`
- `preview`
- `preview:fabricated`
- `preview:giveway`
- `preview:site`
- `release:notes`

### `package.json`

- `e2e`

## Directories

- `.agents/`
- `.agents/skills/`
- `.agents/skills/audit/`
- `.agents/skills/commit/`
- `.agents/skills/fix/`
- `.agents/skills/gate/`
- `.agents/skills/intake/`
- `.agents/skills/mutate/`
- `.agents/skills/readings/`
- `.agents/skills/record-decision/`
- `.agents/skills/release/`
- `.agents/skills/review/`
- `.agents/skills/verify/`
- `.agents/skills/write-document/`
- `.claude/`
- `.github/`
- `.github/workflows/`
- `docs/`
- `docs/adr/`
- `frozen/`
- `libs/`
- `project/`
- `screenshots/`
- `src/`
- `src/core/`
- `src/ports/`
- `src/runtime/`
- `src/ui/`
- `tests/`
- `tests/core/`
- `tests/e2e/`
- `tests/libs/`
- `tests/ports/`
- `tests/repository/`
- `tests/runtime/`
- `tests/tools/`
- `tests/ui/`
- `tools/`

## Files

- `.agents/skills/audit/SKILL.md`
- `.agents/skills/commit/SKILL.md`
- `.agents/skills/fix/SKILL.md`
- `.agents/skills/gate/SKILL.md`
- `.agents/skills/intake/SKILL.md`
- `.agents/skills/mutate/SKILL.md`
- `.agents/skills/readings/SKILL.md`
- `.agents/skills/record-decision/SKILL.md`
- `.agents/skills/release/SKILL.md`
- `.agents/skills/review/SKILL.md`
- `.agents/skills/verify/SKILL.md`
- `.agents/skills/write-document/SKILL.md`
- `.claude/settings.json`
- `.claude/skills`
- `.github/workflows/check.yml`
- `.github/workflows/pages.yml`
- `.github/workflows/release.yml`
- `.gitignore`
- `AGENTS.md`
- `CHANGELOG.md`
- `CLAUDE.md`
- `CONTEXT.md`
- `DESIGN.md`
- `LICENSE`
- `NOTICE.md`
- `PRODUCT.md`
- `README.en.md`
- `README.md`
- `SECURITY.md`
- `TODO.md`
- `deno.json`
- `deno.lock`
- `docs/adr/0001-a-vocabulary-is-an-object.md`
- `docs/adr/0002-a-sibling-is-imported-by-dot-and-the-rest-from-the-root.md`
- `docs/adr/0003-a-module-reads-top-down-in-tigerbeetles-order.md`
- `docs/adr/0004-the-frozen-readings-are-develops-at-the-revision.md`
- `docs/adr/0005-the-readings-are-refreshed-here.md`
- `docs/adr/0006-an-if-that-does-not-leave-has-an-else.md`
- `docs/adr/0007-the-protocol-key-register-is-carried-and-a-help-freeze-counts-what-it-cites.md`
- `docs/adr/0008-a-failure-is-an-error-returned-beside-the-value.md`
- `docs/adr/0009-a-failure-is-named-for-what-failed-and-how.md`
- `docs/adr/0010-the-structure-is-a-document-of-its-own.md`
- `docs/adr/0011-a-reading-is-re-dated-only-when-its-content-moves.md`
- `docs/adr/0012-damage-dealt-and-taken-count-what-an-absorption-pool-took.md`
- `docs/adr/0013-a-reader-chooses-the-type-size-and-the-size-of-each-window.md`
- `docs/adr/0014-the-fight-line-holds-the-place-and-a-card-says-which-fight-it-was.md`
- `docs/adr/0015-each-question-in-the-options-stands-under-a-heading-in-the-shape-its-answers-need.md`
- `docs/adr/0016-the-end-an-opened-figure-left-out-opens-onto-that-persons-keys.md`
- `docs/adr/0017-the-middle-type-step-is-what-a-reader-who-chose-none-reads.md`
- `docs/adr/0018-a-function-called-from-one-place-is-written-in-its-caller-unless-it-is-pure.md`
- `docs/adr/0019-each-events-entry-is-the-name-the-design-gives-it.md`
- `docs/adr/0020-a-module-one-module-of-its-layer-imports-is-written-in-it.md`
- `docs/adr/0021-a-record-is-born-whole-and-a-fixed-choice-is-a-table.md`
- `docs/adr/0022-a-body-nests-five-blocks-deep-and-a-function-that-would-nest-past-it-stays-one.md`
- `docs/adr/0023-a-name-says-whether-a-thing-is-the-games-the-browsers-or-ours.md`
- `docs/adr/0024-the-dom-names-the-meter-and-the-helper-and-develops-sheet-is-read-in-those-names.md`
- `docs/adr/0025-a-field-names-what-it-holds-and-the-fight-file-keeps-its-keys-through-a-map.md`
- `docs/adr/0026-a-name-says-margonem-and-the-way-it-is-reached.md`
- `docs/adr/0027-a-name-says-what-it-holds-and-a-function-what-it-acts-on.md`
- `docs/adr/0028-a-storage-key-names-the-window-it-keeps.md`
- `docs/adr/0029-the-legendary-bonuses-stand-in-a-run-of-their-own-on-the-card.md`
- `docs/adr/0030-every-legendary-bonus-is-named-in-our-words-from-the-published-help.md`
- `docs/adr/0031-somebody-elses-legendary-bonuses-stand-on-the-card-of-whoever-they-reached.md`
- `docs/adr/0032-the-card-counts-the-legendary-bonuses-that-reached-its-combatant-and-names-no-giver.md`
- `docs/adr/0033-a-card-too-tall-for-the-window-stands-in-two-columns.md`
- `docs/adr/0034-every-row-under-an-end-left-out-says-so-at-every-level.md`
- `docs/adr/0035-a-fights-totals-hold-only-what-is-summed.md`
- `docs/adr/0036-the-caveat-letter-is-drawn-and-every-bar-control-is-one-box.md`
- `docs/adr/0037-a-browser-api-this-program-calls-is-a-boundary.md`
- `docs/adr/0038-a-fighter-s-tooltip-leaves-the-charge-to-the-game.md`
- `docs/adr/0039-a-tooltip-row-is-written-as-the-game-writes-its-own.md`
- `docs/adr/0040-pomocnik-says-the-turns-a-length-has-left.md`
- `docs/adr/0041-an-ended-charge-draws-no-length.md`
- `docs/adr/0042-e10-guards-the-handovers-of-what-the-bundle-carries.md`
- `docs/adr/0043-a-heal-of-its-own-announcer-hands-the-announcement-on.md`
- `docs/adr/0044-assertion-density-is-held-where-it-stands-and-only-rises.md`
- `docs/adr/0045-a-pools-part-stands-under-the-elements-it-could-take-from.md`
- `docs/adr/0046-a-shelf-row-says-how-a-fight-went-in-a-letter-and-keeps-a-fight-it-cannot-read.md`
- `docs/adr/0047-a-development-build-installs-beside-the-release-under-a-name-of-its-own.md`
- `docs/auras-standing.md`
- `docs/browser-support.md`
- `docs/captured-fights.md`
- `docs/design.md`
- `docs/drill-levels.md`
- `docs/names.md`
- `docs/protocol-keys.md`
- `docs/reading-a-turn.md`
- `docs/releasing.md`
- `docs/structure.md`
- `docs/turns-taken.md`
- `frozen/AGENTS.md`
- `frozen/aura-turns.ts`
- `frozen/blows-granted.ts`
- `frozen/help-phrases.ts`
- `frozen/protocol-keys.ts`
- `frozen/skill-durations.ts`
- `frozen/status-bits.ts`
- `libs/errors.ts`
- `libs/html-text.ts`
- `libs/json-text.ts`
- `libs/number-range.ts`
- `libs/number-text.ts`
- `libs/text-walk.ts`
- `libs/unknown-value.ts`
- `libs/vocabulary.ts`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `project/browser-lib.json`
- `project/browser-lib.lock`
- `screenshots/panel-card.png`
- `screenshots/panel-deep.png`
- `screenshots/panel-half-named.png`
- `screenshots/panel-opened.png`
- `screenshots/panel-ranking.png`
- `screenshots/panel-shelf.png`
- `screenshots/taken-at.json`
- `src/build-version.ts`
- `src/core/aura-standing.ts`
- `src/core/battle-event.ts`
- `src/core/carried-figure.ts`
- `src/core/carried-status.ts`
- `src/core/charged-skill.ts`
- `src/core/combatant-health.ts`
- `src/core/combatant-roster.ts`
- `src/core/fight-decoder.ts`
- `src/core/fight-figures.ts`
- `src/core/fight-session.ts`
- `src/core/fight-statistics.ts`
- `src/core/legendary-standing.ts`
- `src/core/protocol-key.ts`
- `src/core/protocol-number.ts`
- `src/core/turn-clock.ts`
- `src/ports/browser-console.ts`
- `src/ports/browser-file.ts`
- `src/ports/browser-store.ts`
- `src/ports/browser-surroundings.ts`
- `src/ports/browser-time.ts`
- `src/ports/fight-capture.ts`
- `src/ports/fight-place.ts`
- `src/ports/margonem-client-build.ts`
- `src/ports/margonem-client-dictionary.ts`
- `src/ports/margonem-engine-battle.ts`
- `src/ports/margonem-engine-hero.ts`
- `src/ports/margonem-engine-place.ts`
- `src/ports/margonem-engine-tooltip.ts`
- `src/ports/margonem-engine-warriors.ts`
- `src/ports/margonem-value.ts`
- `src/ports/payload-envelope.ts`
- `src/runtime/carried-tooltip.ts`
- `src/runtime/defect-ledger.ts`
- `src/runtime/failure-fate.ts`
- `src/runtime/fight-file.ts`
- `src/runtime/fight-handover.ts`
- `src/runtime/fight-state.ts`
- `src/runtime/live-fight.ts`
- `src/runtime/margometer-runtime.ts`
- `src/runtime/panel-frame.ts`
- `src/runtime/settings.ts`
- `src/runtime/shelf-keeper.ts`
- `src/runtime/shelf.ts`
- `src/ui/panel-choice.ts`
- `src/ui/panel-content.ts`
- `src/ui/panel-document.ts`
- `src/ui/panel-drag.ts`
- `src/ui/panel-element.ts`
- `src/ui/panel-helper.ts`
- `src/ui/panel-intent.ts`
- `src/ui/panel-listener.ts`
- `src/ui/panel-look.ts`
- `src/ui/panel-palette.ts`
- `src/ui/panel-screen.ts`
- `src/ui/panel-words.ts`
- `src/ui/ranked-order.ts`
- `src/ui/view-failure.ts`
- `src/userscript-boot.ts`
- `src/userscript-entry.ts`
- `tests/core/absorption-destruction-rule.test.ts`
- `tests/core/anguish-rule.test.ts`
- `tests/core/aura-standing.test.ts`
- `tests/core/bandage-rule.test.ts`
- `tests/core/battle-event.test.ts`
- `tests/core/carried-figure.test.ts`
- `tests/core/carried-status.test.ts`
- `tests/core/charged-skill.test.ts`
- `tests/core/combatant-health.test.ts`
- `tests/core/combatant-roster.test.ts`
- `tests/core/fight-decoder.test.ts`
- `tests/core/fight-figures.test.ts`
- `tests/core/fight-session.test.ts`
- `tests/core/fight-statistics.test.ts`
- `tests/core/granted-blow-rule.test.ts`
- `tests/core/health-witness.test.ts`
- `tests/core/injure-rule.test.ts`
- `tests/core/last-heal-rule.test.ts`
- `tests/core/legendary-standing.test.ts`
- `tests/core/message-grammar.test.ts`
- `tests/core/npc-heal-rule.test.ts`
- `tests/core/protocol-key.test.ts`
- `tests/core/protocol-number.test.ts`
- `tests/core/skill-announcement-rule.test.ts`
- `tests/core/turn-clock.test.ts`
- `tests/core/wound-rule.test.ts`
- `tests/drawn-card.ts`
- `tests/e2e/AGENTS.md`
- `tests/e2e/build-once.ts`
- `tests/e2e/margonem-page.ts`
- `tests/e2e/panel-boot.spec.ts`
- `tests/e2e/panel-camera.ts`
- `tests/e2e/panel-card.spec.ts`
- `tests/e2e/panel-crawl.spec.ts`
- `tests/e2e/panel-crawler.ts`
- `tests/e2e/panel-drag.spec.ts`
- `tests/e2e/panel-drill.spec.ts`
- `tests/e2e/panel-fixture.ts`
- `tests/e2e/panel-fold.spec.ts`
- `tests/e2e/panel-helper.spec.ts`
- `tests/e2e/panel-layer.spec.ts`
- `tests/e2e/panel-level.spec.ts`
- `tests/e2e/panel-marks.spec.ts`
- `tests/e2e/panel-options.spec.ts`
- `tests/e2e/panel-page.ts`
- `tests/e2e/panel-probe.ts`
- `tests/e2e/panel-reload.spec.ts`
- `tests/e2e/panel-save.spec.ts`
- `tests/e2e/panel-scroll.spec.ts`
- `tests/e2e/panel-shelf.spec.ts`
- `tests/e2e/panel-size.spec.ts`
- `tests/e2e/panel-states.spec.ts`
- `tests/e2e/panel-strips.spec.ts`
- `tests/e2e/panel-tooltip.spec.ts`
- `tests/e2e/panel-type.spec.ts`
- `tests/fake-document.ts`
- `tests/fake-window.ts`
- `tests/frozen-tables.ts`
- `tests/libs/errors.test.ts`
- `tests/libs/html-text.test.ts`
- `tests/libs/json-text.test.ts`
- `tests/libs/number-range.test.ts`
- `tests/libs/number-text.test.ts`
- `tests/libs/text-walk.test.ts`
- `tests/libs/unknown-value.test.ts`
- `tests/markdown-document.ts`
- `tests/panel-view.ts`
- `tests/ports/browser-clock.test.ts`
- `tests/ports/browser-console.test.ts`
- `tests/ports/browser-file.test.ts`
- `tests/ports/browser-frame.test.ts`
- `tests/ports/browser-interval.test.ts`
- `tests/ports/browser-store.test.ts`
- `tests/ports/browser-surroundings.test.ts`
- `tests/ports/fight-capture.test.ts`
- `tests/ports/margonem-client-build.test.ts`
- `tests/ports/margonem-client-dictionary.test.ts`
- `tests/ports/margonem-engine-battle.test.ts`
- `tests/ports/margonem-engine-hero.test.ts`
- `tests/ports/margonem-engine-place.test.ts`
- `tests/ports/margonem-engine-tooltip.test.ts`
- `tests/ports/margonem-engine-warriors.test.ts`
- `tests/ports/payload-envelope.test.ts`
- `tests/ports/recorded-session.test.ts`
- `tests/ports/warrior-entries.test.ts`
- `tests/rebuilding-battle.ts`
- `tests/recorded-fights.ts`
- `tests/recording-sources.ts`
- `tests/register-table.ts`
- `tests/repository/assert-imports.test.ts`
- `tests/repository/assertion-density.test.ts`
- `tests/repository/broad-catches.test.ts`
- `tests/repository/browser-globals.test.ts`
- `tests/repository/browser-suite-keys.test.ts`
- `tests/repository/browser-support.test.ts`
- `tests/repository/called-once.test.ts`
- `tests/repository/captured-fight-register.test.ts`
- `tests/repository/changelog.test.ts`
- `tests/repository/cited-paths.test.ts`
- `tests/repository/comment-share.test.ts`
- `tests/repository/control-flow.test.ts`
- `tests/repository/decisions.test.ts`
- `tests/repository/declaration-order.test.ts`
- `tests/repository/design-tokens.test.ts`
- `tests/repository/documents.test.ts`
- `tests/repository/event-entries.test.ts`
- `tests/repository/fabricated-fights.test.ts`
- `tests/repository/handed-callbacks.test.ts`
- `tests/repository/import-paths.test.ts`
- `tests/repository/layers.test.ts`
- `tests/repository/name-register.test.ts`
- `tests/repository/name-shapes.test.ts`
- `tests/repository/names.test.ts`
- `tests/repository/nesting-depth.test.ts`
- `tests/repository/non-null-assertions.test.ts`
- `tests/repository/protocol-keys.test.ts`
- `tests/repository/purity.test.ts`
- `tests/repository/reader-layer.test.ts`
- `tests/repository/readmes.test.ts`
- `tests/repository/record-shapes.test.ts`
- `tests/repository/redacted-names.test.ts`
- `tests/repository/regular-expressions.test.ts`
- `tests/repository/single-importer.test.ts`
- `tests/repository/skill-durations.test.ts`
- `tests/repository/synchronous-bundle.test.ts`
- `tests/repository/throws.test.ts`
- `tests/repository/type-assertions.test.ts`
- `tests/repository/workflows.test.ts`
- `tests/runtime-world.ts`
- `tests/runtime/carried-tooltip.test.ts`
- `tests/runtime/defect-ledger.test.ts`
- `tests/runtime/failure-fate.test.ts`
- `tests/runtime/fight-file.test.ts`
- `tests/runtime/live-fight.test.ts`
- `tests/runtime/margometer-runtime.test.ts`
- `tests/runtime/margonem-engine-search.test.ts`
- `tests/runtime/opened-readings.test.ts`
- `tests/runtime/panel-frame.test.ts`
- `tests/runtime/screen-intent.test.ts`
- `tests/runtime/settings.test.ts`
- `tests/runtime/shelf-keeper.test.ts`
- `tests/runtime/shelf.test.ts`
- `tests/share-text.ts`
- `tests/shown-screen.ts`
- `tests/simulation.test.ts`
- `tests/simulation.ts`
- `tests/source-tree.ts`
- `tests/style-sheet.ts`
- `tests/tools/aura-lifetime.test.ts`
- `tests/tools/aura-standing.test.ts`
- `tests/tools/build-userscript.test.ts`
- `tests/tools/capture-intake.test.ts`
- `tests/tools/card-height.test.ts`
- `tests/tools/changelog.test.ts`
- `tests/tools/decoding-status.test.ts`
- `tests/tools/develop-reports.test.ts`
- `tests/tools/drill-report.test.ts`
- `tests/tools/fabricated-fight.test.ts`
- `tests/tools/fight-figures.test.ts`
- `tests/tools/frozen-files.test.ts`
- `tests/tools/help-article.test.ts`
- `tests/tools/help-claim-register.test.ts`
- `tests/tools/margonem-client-source.test.ts`
- `tests/tools/margonem-readings.test.ts`
- `tests/tools/panel-giving-way.test.ts`
- `tests/tools/panel-shots.test.ts`
- `tests/tools/preview-page.test.ts`
- `tests/tools/preview-server.test.ts`
- `tests/tools/preview-site.test.ts`
- `tests/tools/preview-state.test.ts`
- `tests/tools/protocol-key-shape.test.ts`
- `tests/tools/protocol-key-table.test.ts`
- `tests/tools/recorded-material.test.ts`
- `tests/tools/shout-holding.test.ts`
- `tests/tools/skill-table.test.ts`
- `tests/tools/status-bit-table.test.ts`
- `tests/tools/turn-count.test.ts`
- `tests/tools/turn-reading.test.ts`
- `tests/ui/blow-vocabulary.test.ts`
- `tests/ui/card-window.test.ts`
- `tests/ui/full-cast-bound.test.ts`
- `tests/ui/helper-window.test.ts`
- `tests/ui/level-drawn.test.ts`
- `tests/ui/panel-card.test.ts`
- `tests/ui/panel-content.test.ts`
- `tests/ui/panel-drag.test.ts`
- `tests/ui/panel-element.test.ts`
- `tests/ui/panel-gesture.test.ts`
- `tests/ui/panel-helper.test.ts`
- `tests/ui/panel-intent.test.ts`
- `tests/ui/panel-look.test.ts`
- `tests/ui/panel-palette.test.ts`
- `tests/ui/panel-screen.test.ts`
- `tests/ui/panel-scroll.test.ts`
- `tests/ui/panel-words.test.ts`
- `tests/ui/ranked-order.test.ts`
- `tests/ui/share-bound.test.ts`
- `tests/ui/share-column.test.ts`
- `tests/ui/shelf-bound.test.ts`
- `tests/ui/view-failure.test.ts`
- `tests/userscript-entry.test.ts`
- `tests/verb-purities.ts`
- `tools/aura-lifetime.ts`
- `tools/aura-standing.ts`
- `tools/build-userscript.ts`
- `tools/capture-intake.ts`
- `tools/card-height.ts`
- `tools/changelog.ts`
- `tools/decoding-status.ts`
- `tools/develop-reports.ts`
- `tools/drill-report.ts`
- `tools/fabricated-fight.ts`
- `tools/fight-figures.ts`
- `tools/frozen-files.ts`
- `tools/help-article.ts`
- `tools/help-claim-register.ts`
- `tools/margometer-tool-error.ts`
- `tools/margonem-client-source.ts`
- `tools/margonem-readings.ts`
- `tools/panel-giving-way.ts`
- `tools/panel-shots.ts`
- `tools/payload-cost.ts`
- `tools/preview-page.ts`
- `tools/preview-server.ts`
- `tools/preview-site.ts`
- `tools/preview-state.ts`
- `tools/protocol-key-shape.ts`
- `tools/protocol-key-table.ts`
- `tools/recorded-material.ts`
- `tools/shout-holding.ts`
- `tools/skill-table.ts`
- `tools/status-bit-table.ts`
- `tools/turn-count.ts`
- `tools/turn-reading.ts`
