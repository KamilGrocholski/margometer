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

- `initBrowserClock` — `src/game/browser-time.ts`
- `initBrowserConsole` — `src/game/browser-console.ts`
- `initBrowserFile` — `src/game/browser-file.ts`
- `initBrowserFrames` — `src/game/browser-time.ts`
- `initBrowserInterval` — `src/game/browser-time.ts`
- `initBrowserStore` — `src/game/browser-store.ts`
- `initBrowserSurroundings` — `src/game/browser-surroundings.ts`
- `initCardHandle` — `src/ui/panel-element.ts`
- `initCeilingStore` — `tests/runtime/shelf-keeper.test.ts`
- `initDefectLedger` — `src/runtime/defect-ledger.ts`
- `initGameBattle` — `src/game/game-battle.ts`
- `initGameBuild` — `src/game/game-build.ts`
- `initGameDictionary` — `src/game/game-dictionary.ts`
- `initGameEngineSearch` — `src/runtime/margometer-runtime.ts`
- `initGameHero` — `src/game/game-hero.ts`
- `initGamePlace` — `src/game/game-place.ts`
- `initGameTooltip` — `src/game/game-tooltip.ts`
- `initHeldStore` — `tests/runtime-world.ts`
- `initKeeper` — `tests/runtime/shelf-keeper.test.ts`
- `initLiveFight` — `src/runtime/live-fight.ts`
- `initMemoryStore` — `src/game/browser-store.ts`
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
- `openPreviewEvents` — `tools/preview-server.ts`
- `openShelf` — `src/runtime/shelf.ts`
- `openShelfRowCard` — `tests/runtime/margometer-runtime.test.ts`
- `openShelfScreen` — `tests/runtime/margometer-runtime.test.ts`

### `on` — none

- `onAbandoned` — `src/runtime/margometer-runtime.ts`, `tests/runtime/engine-search.test.ts`
- `onAttached` — `src/runtime/margometer-runtime.ts`, `tests/runtime/engine-search.test.ts`
- `onBeforeCall` — in 4 files: `src/game/`, `src/runtime/`, `tests/`
- `onDragEnd` — `src/ui/panel-drag.ts`
- `onDrawn` — `src/ui/panel-drag.ts`
- `onFailure` — in 8 files: `src/runtime/`, `tests/`
- `onFightOpened` — `src/runtime/margometer-runtime.ts`, `tests/runtime/live-fight.test.ts`
- `onFrame` — `src/runtime/margometer-runtime.ts`
- `onGameEngineSearchFailed` — `src/runtime/margometer-runtime.ts`
- `onHover` — `src/ui/panel-element.ts`
- `onIntent` — in 7 files: `src/runtime/`, `tests/`
- `onListen` — `tools/preview-server.ts`
- `onLookFailed` — `src/runtime/margometer-runtime.ts`, `tests/runtime/engine-search.test.ts`
- `onLookFailure` — `src/runtime/margometer-runtime.ts`
- `onPageCall` — `tests/simulation.ts`
- `onPayload` — in 4 files: `src/game/`, `src/runtime/`, `tests/`
- `onRefused` — `src/runtime/margometer-runtime.ts`, `tests/runtime/engine-search.test.ts`
- `onRuntimeIntent` — `src/runtime/margometer-runtime.ts`
- `onStoodDown` — `src/runtime/margometer-runtime.ts`, `tests/runtime/engine-search.test.ts`

### `prepare` — strong

- `prepareCapture` — `src/game/fight-capture.ts`
- `prepareCarriedStatusWalk` — `src/core/carried-status.ts`
- `prepareChargedSkills` — `src/core/charged-skill.ts`
- `prepareFrozenBuffBits` — `tools/buff-bit-table.ts`
- `prepareFrozenFiles` — `tools/frozen-files.ts`
- `prepareFrozenHelpCounts` — `tools/help-article.ts`
- `prepareFrozenKeyTable` — `tools/protocol-key-table.ts`
- `prepareFrozenSkillTable` — `tools/skill-table.ts`
- `prepareLegendaryWalk` — `src/core/legendary-standing.ts`
- `prepareLightingTurnByBit` — `src/core/carried-status.ts`
- `preparePayload` — `src/core/fight-session.ts`
- `preparePayloadCombatants` — `src/core/fight-session.ts`
- `preparePayloadStanding` — `src/core/fight-session.ts`
- `preparePayloadUnread` — `src/core/fight-session.ts`
- `prepareStoreWrite` — `src/game/browser-store.ts`
- `prepareTurn` — `tools/fabricated-fight.ts`

### `commit` — weak

- `commitCapture` — `src/game/fight-capture.ts`
- `commitPayload` — `src/core/fight-session.ts`

### `execute` — none

- `executeAbsorbedBlow` — `tools/fabricated-fight.ts`
- `executeAlliesCast` — `tools/fabricated-fight.ts`
- `executeArmourBreakingBlow` — `tools/fabricated-fight.ts`
- `executeAuraCast` — `tools/fabricated-fight.ts`
- `executeAuxiliaryWound` — `tools/fabricated-fight.ts`
- `executeBandage` — `tools/fabricated-fight.ts`
- `executeBardSong` — `tools/fabricated-fight.ts`
- `executeBlow` — `tools/fabricated-fight.ts`
- `executeBlowAtNobody` — `tools/fabricated-fight.ts`
- `executeBlowFromNobody` — `tools/fabricated-fight.ts`
- `executeCriticalBlow` — `tools/fabricated-fight.ts`
- `executeCriticalPierce` — `tools/fabricated-fight.ts`
- `executeCursedBlow` — `tools/fabricated-fight.ts`
- `executeEnemiesCast` — `tools/fabricated-fight.ts`
- `executeEvadedBlow` — `tools/fabricated-fight.ts`
- `executeHealAlly` — `tools/fabricated-fight.ts`
- `executeHealSelf` — `tools/fabricated-fight.ts`
- `executeHealToNobody` — `tools/fabricated-fight.ts`
- `executeHealthGiven` — `tools/fabricated-fight.ts`
- `executeHealthTaken` — `tools/fabricated-fight.ts`
- `executeHolyTouch` — `tools/fabricated-fight.ts`
- `executeLastHeal` — `tools/fabricated-fight.ts`
- `executeLegendaryBuffs` — `tools/fabricated-fight.ts`
- `executeLightTick` — `tools/fabricated-fight.ts`
- `executeLiveStep` — `src/runtime/live-fight.ts`
- `executeLookFailed` — `src/runtime/margometer-runtime.ts`
- `executeLoot` — `tools/fabricated-fight.ts`
- `executeLossToNobody` — `tools/fabricated-fight.ts`
- `executeNamedDamage` — `tools/fabricated-fight.ts`
- `executeOffhandBlow` — `tools/fabricated-fight.ts`
- `executePiercingBlow` — `tools/fabricated-fight.ts`
- `executePlainBlow` — `tools/fabricated-fight.ts`
- `executePoisonTick` — `tools/fabricated-fight.ts`
- `executePrepare` — `tools/fabricated-fight.ts`
- `executeRegionStep` — `src/ui/panel-element.ts`
- `executeResources` — `tools/fabricated-fight.ts`
- `executeScreenIntent` — `src/runtime/margometer-runtime.ts`
- `executeSearchBound` — `src/runtime/margometer-runtime.ts`
- `executeSearchLook` — `src/runtime/margometer-runtime.ts`
- `executeShout` — `tools/fabricated-fight.ts`
- `executeSideHeal` — `tools/fabricated-fight.ts`
- `executeStance` — `tools/fabricated-fight.ts`
- `executeStandingBuffs` — `tools/fabricated-fight.ts`
- `executeStunningBlow` — `tools/fabricated-fight.ts`
- `executeThirdAttack` — `tools/fabricated-fight.ts`
- `executeTurnLost` — `tools/fabricated-fight.ts`
- `executeWeakenedWound` — `tools/fabricated-fight.ts`
- `executeWoundTick` — `tools/fabricated-fight.ts`
- `executeWoundingBlow` — `tools/fabricated-fight.ts`

### `verify` — strong

- `verifyDefenceMechanisms` — `src/core/fight-statistics.ts`
- `verifyFightFigures` — `src/core/fight-figures.ts`
- `verifyFightStatistics` — `src/core/fight-statistics.ts`
- `verifyQueueHolders` — `tools/turn-count.ts`
- `verifyScreenState` — `src/runtime/margometer-runtime.ts`

### `get` — strong

- `get` — in 4 files: `tests/`
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
- `getCords` — `tests/game/game-place.test.ts`
- `getCorpusTally` — `tests/core/fight-decoder.test.ts`
- `getCountedTotal` — `src/ui/panel-content.ts`
- `getCounts` — `src/runtime/defect-ledger.ts`
- `getCrumbWordsForUnnamedCut` — `src/ui/panel-element.ts`
- `getCutsForMetric` — `src/ui/panel-content.ts`
- `getDate` — `src/game/browser-time.ts`
- `getDeclaration` — `tests/style-sheet.ts`
- `getDefenceMechanism` — `src/core/protocol-key.ts`
- `getDirectionForMetric` — `src/ui/panel-screen.ts`
- `getDirectionWordsForMetric` — `src/ui/panel-words.ts`
- `getEdgesDown` — `tests/ui/panel-look.test.ts`
- `getElement` — `tools/fabricated-fight.ts`
- `getElementsWithin` — `tests/fake-document.ts`
- `getEndForPinned` — `src/ui/panel-content.ts`
- `getEndOfRun` — `libs/text-walk.ts`
- `getEngine` — in 4 files: `tests/`
- `getFailureCount` — `src/game/game-battle.ts`
- `getFightOutcomeForReaderSide` — `src/ui/panel-content.ts`
- `getFightSuspicions` — `src/runtime/panel-frame.ts`
- `getFights` — `src/runtime/shelf-keeper.ts`, `tests/runtime/panel-frame.test.ts`
- `getFigureForMetric` — `src/ui/panel-content.ts`
- `getFiguresUnreadable` — `tests/ui/level-drawn.test.ts`
- `getFirstFailure` — `src/game/game-battle.ts`
- `getGameWordsForKey` — `src/ui/panel-words.ts`
- `getGivenSourceCut` — `src/ui/panel-content.ts`
- `getGrabbedElement` — `src/ui/panel-drag.ts`
- `getGrades` — `tests/tools/turn-count.test.ts`
- `getHalfNamedAtNamedEnd` — `src/ui/panel-content.ts`
- `getHalfNamedByKind` — `src/ui/panel-content.ts`
- `getHalfNamedTotalForMetric` — `src/ui/panel-content.ts`
- `getHeadingCells` — `tests/ui/panel-element.test.ts`
- `getHealthPercent` — `tools/fabricated-fight.ts`
- `getHealthPercentsFromEvent` — `src/core/combatant-health.ts`
- `getHolderName` — `tests/ui/panel-words.test.ts`
- `getHost` — `tests/runtime-world.ts`
- `getHours` — `src/game/browser-time.ts`
- `getId` — `tests/game/game-hero.test.ts`
- `getInkForBar` — `src/ui/panel-look.ts`
- `getItem` — in 9 files: `src/game/`, `tests/`
- `getKeyForNamedPart` — `src/ui/panel-element.ts`
- `getKeyTallyOrder` — `tools/turn-reading.ts`
- `getKeysShared` — `tests/ui/level-drawn.test.ts`
- `getLargestFigure` — `src/ui/panel-content.ts`
- `getLeadingStatuses` — `src/ui/panel-words.ts`
- `getLineAt` — `tests/source-tree.ts`
- `getLineHeights` — `tests/ui/panel-look.test.ts`
- `getLineTexts` — `tests/ui/panel-words.test.ts`
- `getListField` — `libs/unknown-value.ts`
- `getListedTotal` — `src/ui/panel-content.ts`
- `getLuminance` — `src/ui/panel-look.ts`
- `getMarkForNamedPart` — `src/ui/panel-element.ts`
- `getMedian` — `tools/card-height.ts`
- `getMessageIndexAfter` — `tools/turn-count.ts`
- `getMetricForPinned` — `src/ui/panel-content.ts`
- `getMinutes` — `src/game/browser-time.ts`
- `getMonth` — `src/game/browser-time.ts`
- `getMovedHealth` — `tests/core/health-witness.test.ts`
- `getNamedCombatantIds` — `src/core/fight-decoder.ts`
- `getNeitherEndForMetric` — `src/ui/panel-content.ts`
- `getNeitherEndForPinned` — `src/ui/panel-content.ts`
- `getNoteForCaveat` — `src/ui/panel-words.ts`
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
- `getPanelDragSize` — `src/ui/panel-drag.ts`
- `getPanelFight` — `tools/drill-report.ts`
- `getPanelWithin` — `tests/fake-document.ts`
- `getParsedMessages` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/core/skill-announcement-rule.test.ts`
- `getPartTotal` — `src/ui/panel-content.ts`
- `getPersonRows` — `tests/ui/helper-window.test.ts`
- `getPinnedFigure` — `src/ui/panel-content.ts`
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
- `getRowsWithoutCard` — `tests/ui/helper-window.test.ts`
- `getRuleBody` — `tests/style-sheet.ts`
- `getScreenAfterNoun` — `src/ui/panel-screen.ts`
- `getScreensForNoun` — `src/ui/panel-screen.ts`
- `getSentences` — `tests/ui/panel-words.test.ts`
- `getSentencesFromChoices` — `tests/ui/panel-words.test.ts`
- `getSentencesFromSuspicions` — `tests/ui/panel-words.test.ts`
- `getSentencesFromTooltip` — `tests/ui/panel-words.test.ts`
- `getSessionPhase` — `src/core/fight-session.ts`
- `getShareGroupHead` — `src/ui/panel-words.ts`
- `getShareSum` — `tests/ui/share-column.test.ts`
- `getShelf` — `tests/runtime-world.ts`, `tests/runtime/shelf-keeper.test.ts`
- `getShorteningMissing` — `tests/ui/panel-look.test.ts`
- `getShorthandParts` — `tests/ui/panel-look.test.ts`
- `getShownStrip` — `src/ui/panel-element.ts`
- `getSideRelation` — `src/ui/panel-content.ts`
- `getSideRelationCharged` — `src/ui/panel-content.ts`
- `getSideRelationListed` — `src/ui/panel-content.ts`
- `getSkillOwnerId` — `src/core/fight-statistics.ts`
- `getSkillUses` — `src/ui/panel-content.ts`
- `getStandingOnSide` — `tools/fabricated-fight.ts`
- `getStandingTurnNow` — `src/ui/panel-helper.ts`
- `getStandingTurnState` — `src/ui/panel-helper.ts`
- `getStatedTextField` — `libs/unknown-value.ts`
- `getStatedWarriors` — `tools/fabricated-fight.ts`
- `getStorageChosen` — `tests/runtime/margometer-runtime.test.ts`
- `getSubWordsForBlowKey` — `src/ui/panel-words.ts`
- `getTermPixels` — `tests/ui/panel-look.test.ts`
- `getTextField` — `libs/unknown-value.ts`
- `getTextForNamedPart` — `src/ui/panel-content.ts`
- `getTextsByClass` — `tests/fake-document.ts`
- `getTipData` — `src/game/game-tooltip.ts`, `tests/game/game-tooltip.test.ts`,
  `tests/rebuilding-battle.ts`
- `getTokenSpelling` — `tests/ui/panel-look.test.ts`
- `getTop` — `src/ui/panel-element.ts`
- `getTotalFromCut` — `src/ui/panel-content.ts`
- `getTotalFromParts` — `src/ui/panel-content.ts`
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
- `getWidthPixels` — `src/ui/panel-drag.ts`
- `getWindow` — `tests/ui/helper-window.test.ts`
- `getWindowWidthPixels` — `src/ui/panel-drag.ts`
- `getWindowWidths` — `src/ui/panel-element.ts`
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

- `set` — `tests/ui/panel-look.test.ts`
- `setAttribute` — `src/ui/panel-document.ts`, `tests/fake-document.ts`
- `setBuiltOnce` — `tests/e2e/build-once.ts`
- `setCardHidden` — `src/ui/panel-element.ts`
- `setCardPosition` — `src/ui/panel-element.ts`
- `setDragged` — `tests/e2e/panel-probe.ts`
- `setFocusedBy` — `tests/rebuilding-battle.ts`
- `setGripMark` — `src/ui/panel-drag.ts`
- `setInterval` — in 5 files: `src/game/`, `tests/`
- `setItem` — in 9 files: `src/game/`, `tests/`
- `setOverflowingLevelOpened` — `tests/e2e/panel-scroll.spec.ts`
- `setPageServed` — `tests/e2e/panel-fixture.ts`
- `setPointerCapture` — `src/ui/panel-document.ts`, `tests/fake-document.ts`
- `setPointerHeld` — `src/ui/panel-drag.ts`
- `setPosition` — `src/ui/panel-drag.ts`
- `setRebuilt` — `tests/rebuilding-battle.ts`
- `setRollName` — `tools/capture-intake.ts`
- `setRowMarks` — `src/ui/panel-element.ts`
- `setScreenFight` — `src/runtime/margometer-runtime.ts`
- `setSecondFightKept` — `tests/e2e/panel-shelf.spec.ts`
- `setShelfCardOpen` — `tests/e2e/panel-card.spec.ts`
- `setShelfRefused` — `src/runtime/shelf-keeper.ts`
- `setShelfWritten` — `src/runtime/shelf-keeper.ts`
- `setSize` — `src/ui/panel-drag.ts`
- `setStatusBit` — `tools/fabricated-fight.ts`
- `setTimeout` — in 4 files: `src/`, `src/game/`, `tests/`
- `setTop` — `src/ui/panel-element.ts`
- `setTypeStep` — `src/ui/panel-element.ts`

### `lookup` — strong

- `lookup` — `src/ui/panel-element.ts`
- `lookupAnnouncedForMessage` — `src/core/fight-decoder.ts`
- `lookupAnnouncedWound` — `src/core/fight-statistics.ts`
- `lookupAsynchronousCode` — `tests/repository/synchronous-bundle.test.ts`
- `lookupAuraCast` — `src/core/aura-standing.ts`
- `lookupAuraTurnsStated` — `src/core/aura-standing.ts`
- `lookupBareReachEntries` — `tests/core/aura-standing.test.ts`
- `lookupBarrelAsserts` — `tests/repository/assert-imports.test.ts`
- `lookupBodiesOnOneLine` — `tests/repository/control-flow.test.ts`
- `lookupCallBreach` — `tests/repository/purity.test.ts`
- `lookupCalledOnce` — `tests/repository/called-once.test.ts`
- `lookupCallerDeclaration` — `tests/source-tree.ts`
- `lookupCallerName` — `tests/repository/event-entries.test.ts`
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
- `lookupEndedState` — `src/core/charged-skill.ts`
- `lookupErrorClasses` — `tests/repository/throws.test.ts`
- `lookupEventBreaches` — `tests/repository/event-entries.test.ts`
- `lookupFightReader` — `src/runtime/panel-frame.ts`
- `lookupFirstDifference` — `tests/repository/name-register.test.ts`, `tools/develop-reports.ts`
- `lookupFragments` — `tools/help-article.ts`
- `lookupGameBattle` — `src/game/game-battle.ts`
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
- `lookupKeptFightState` — `src/runtime/shelf-keeper.ts`, `tests/runtime/panel-frame.test.ts`
- `lookupKeyMeaning` — `src/core/protocol-key.ts`
- `lookupKeyReach` — `src/core/protocol-key.ts`
- `lookupKindOrderFaults` — `tests/repository/changelog.test.ts`
- `lookupLayer` — `tests/repository/name-register.test.ts`
- `lookupLayerReach` — `tests/repository/layers.test.ts`
- `lookupMisnamedExports` — `tests/repository/names.test.ts`
- `lookupMisnamedFile` — `tests/repository/names.test.ts`
- `lookupMisspeltImports` — `tests/repository/import-paths.test.ts`
- `lookupModuleStates` — `tests/repository/purity.test.ts`
- `lookupNamedCombatantId` — `src/core/fight-decoder.ts`
- `lookupNewestFight` — `src/runtime/fight-state.ts`
- `lookupNonNullAssertions` — `tests/repository/non-null-assertions.test.ts`
- `lookupOpeners` — `tests/core/turn-clock.test.ts`
- `lookupOpponent` — `tools/fabricated-fight.ts`
- `lookupOutboundCalls` — `tools/build-userscript.ts`
- `lookupOwnAsserts` — `tests/repository/assert-imports.test.ts`
- `lookupPinnedCase` — `src/ui/panel-content.ts`
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
- `lookupRegisteredStatusName` — `tools/buff-bit-table.ts`
- `lookupRegularExpressions` — `tests/repository/regular-expressions.test.ts`
- `lookupReportKey` — `tests/runtime/fight-file.test.ts`
- `lookupScriptNameSpan` — `src/game/game-build.ts`
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
- `lookupSwitchSubjectStart` — `tools/protocol-key-table.ts`
- `lookupThrows` — `tests/repository/throws.test.ts`
- `lookupTopDeclaration` — `tests/repository/nesting-depth.test.ts`
- `lookupTurnLostBy` — `src/core/fight-decoder.ts`
- `lookupTurnOpener` — `src/core/turn-clock.ts`
- `lookupTypeAssertions` — `tests/repository/type-assertions.test.ts`
- `lookupUnderwayObjections` — `tests/tools/panel-shots.test.ts`
- `lookupUnguardedCallbacks` — `tests/repository/handed-callbacks.test.ts`
- `lookupUnguardedCallbacksBody` — `tests/repository/handed-callbacks.test.ts`
- `lookupUnnamedCutLevel` — `src/runtime/panel-frame.ts`
- `lookupUnnamedCutPress` — `src/runtime/panel-frame.ts`
- `lookupUnnamedFailures` — `tests/repository/throws.test.ts`
- `lookupUnnamedLevel` — `src/runtime/panel-frame.ts`
- `lookupUnnamedPairLevel` — `src/runtime/panel-frame.ts`
- `lookupUnplacedNames` — `tests/repository/redacted-names.test.ts`
- `lookupWindowPartMissing` — `src/userscript-entry.ts`
- `lookupWoundActorId` — `src/core/fight-statistics.ts`
- `lookupWritableParameters` — `tests/repository/purity.test.ts`

### `read` — either

- `read` — in 5 files: `src/game/`, `tests/`
- `readAll` — `tests/tools/preview-state.test.ts`
- `readAnnouncedSkills` — `tests/repository/skill-durations.test.ts`
- `readAnsweredResponse` — `tools/game-client-source.ts`
- `readAstNodes` — `tests/source-tree.ts`
- `readAt` — `tests/e2e/panel-layer.spec.ts`
- `readBackticked` — `tests/tools/drill-report.test.ts`
- `readBar` — `tests/ui/panel-element.test.ts`
- `readBareCell` — `tests/tools/drill-report.test.ts`
- `readBattle` — `src/game/game-battle.ts`
- `readBattleOn` — `tests/game/game-battle.test.ts`
- `readBoldRuleNames` — `tests/repository/documents.test.ts`
- `readBoundNames` — `tests/repository/name-register.test.ts`
- `readBrowserStorage` — `src/userscript-entry.ts`
- `readBrowserText` — `src/game/browser-surroundings.ts`
- `readBuildId` — `src/game/game-build.ts`, `tests/runtime-world.ts`,
  `tests/runtime/live-fight.test.ts`
- `readBuiltUserscript` — `tests/e2e/build-once.ts`
- `readBuiltVersion` — `tests/e2e/build-once.ts`
- `readBundle` — `tests/tools/preview-server.test.ts`, `tools/panel-giving-way.ts`,
  `tools/preview-server.ts`
- `readBundleFiles` — `tests/source-tree.ts`
- `readCachedBundle` — `tools/game-client-source.ts`
- `readCachedClientSource` — `tools/game-client-source.ts`
- `readCachedHelpArticle` — `tools/help-article.ts`
- `readCachedSkillTable` — `tools/skill-table.ts`
- `readCalleeName` — `tests/repository/handed-callbacks.test.ts`
- `readCapturedCombatant` — `src/game/warrior-snapshot.ts`
- `readCard` — `tests/drawn-card.ts`
- `readCardCounts` — `tests/runtime/margometer-runtime.test.ts`
- `readCardHeight` — `tests/e2e/panel-card.spec.ts`
- `readCardName` — `tests/e2e/panel-card.spec.ts`
- `readCardOf` — `tests/ui/panel-card.test.ts`
- `readCarriedCount` — `tools/capture-intake.ts`
- `readCell` — `tests/e2e/panel-helper.spec.ts`
- `readCentreOf` — `tests/e2e/panel-probe.ts`
- `readChangedByAssignment` — `tests/repository/purity.test.ts`
- `readChangedByMethod` — `tests/repository/purity.test.ts`
- `readChangedNodes` — `tests/repository/purity.test.ts`
- `readCharge` — `tests/game/warrior-entries.test.ts`
- `readChildNode` — `tests/repository/name-register.test.ts`
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
- `readDealt` — `tools/fight-figures.ts`
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
- `readExplainedCells` — `tests/tools/drill-report.test.ts`
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
- `readFunctionNode` — `tests/repository/called-once.test.ts`
- `readGameBattleRecord` — `src/game/game-battle.ts`
- `readGameEngineRecord` — `src/game/game-place.ts`
- `readGameEngines` — `src/game/game-battle.ts`
- `readGameHeroId` — `src/game/game-hero.ts`
- `readGamePlace` — `src/game/game-place.ts`
- `readGameValue` — `src/runtime/live-fight.ts`
- `readGameWarriorEntries` — `src/game/payload-envelope.ts`
- `readGameWarriorEntryHealth` — `src/game/payload-envelope.ts`
- `readGameWarriorSnapshot` — `src/game/warrior-snapshot.ts`
- `readGameWarriors` — `src/game/game-battle.ts`
- `readGameWarriorsNamed` — `src/game/warrior-snapshot.ts`
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
- `readHeldString` — `tests/repository/name-register.test.ts`
- `readHeldText` — `tools/frozen-files.ts`
- `readHelpersMentions` — `tests/repository/declaration-order.test.ts`
- `readHeroCoordinate` — `src/game/game-place.ts`
- `readHeroId` — `src/game/game-hero.ts`, `tests/runtime/live-fight.test.ts`
- `readHeroIdOf` — `tests/game/game-hero.test.ts`
- `readHildur` — `tests/tools/drill-report.test.ts`
- `readHostStyle` — `tests/e2e/panel-probe.ts`
- `readIdentity` — `tools/capture-intake.ts`
- `readImportSources` — `tests/source-tree.ts`
- `readInstallBand` — `tests/tools/preview-site.test.ts`
- `readKeptFights` — `tests/runtime-world.ts`
- `readKeyName` — `tests/repository/name-register.test.ts`
- `readKeysReadByName` — `tests/repository/protocol-keys.test.ts`
- `readKindsSaidShut` — `tests/tools/drill-report.test.ts`
- `readLabel` — `src/game/game-dictionary.ts`, `tests/ui/panel-element.test.ts`
- `readLayerStacks` — `tests/e2e/panel-layer.spec.ts`
- `readLevel` — `tests/e2e/panel-level.spec.ts`
- `readLine` — `tests/repository/called-once.test.ts`
- `readLineHeightDrawn` — `tests/repository/design-tokens.test.ts`
- `readList` — `tests/ui/panel-element.test.ts`
- `readListedDocuments` — `tests/repository/documents.test.ts`
- `readLiveGameWarriors` — `src/runtime/live-fight.ts`
- `readLoadedMarks` — `tests/tools/preview-site.test.ts`
- `readMark` — `tests/ui/panel-intent.test.ts`
- `readMasks` — `tests/game/warrior-entries.test.ts`
- `readMessageIndices` — `tools/turn-count.ts`
- `readMessageKeys` — `tests/tools/fabricated-fight.test.ts`
- `readMessageTurn` — `tools/turn-reading.ts`
- `readMethodName` — `tests/repository/event-entries.test.ts`
- `readMoment` — in 5 files: `src/game/`, `tests/`
- `readMomentPart` — `src/game/browser-time.ts`
- `readNameVersion` — `tests/repository/captured-fight-register.test.ts`
- `readNamed` — `tests/core/last-heal-rule.test.ts`
- `readNames` — `tests/game/warrior-snapshot.test.ts`
- `readNamesUsedBy` — `tests/ui/panel-look.test.ts`
- `readNestedNodes` — `tests/source-tree.ts`
- `readNodeName` — `tests/repository/name-register.test.ts`
- `readNotes` — `tests/ui/panel-card.test.ts`
- `readNowMilliseconds` — in 4 files: `src/game/`, `tests/`
- `readOk` — `tests/game/payload-envelope.test.ts`
- `readOne` — `tests/game/warrior-entries.test.ts`
- `readOpenedAt` — `tests/runtime/shelf.test.ts`
- `readPanelBoxes` — `tests/e2e/panel-camera.ts`
- `readPanelIntent` — `src/ui/panel-intent.ts`
- `readPanelShape` — `tests/e2e/panel-probe.ts`
- `readParameterNames` — `tests/repository/purity.test.ts`
- `readPatternNames` — `tests/repository/purity.test.ts`
- `readPayloadCosts` — `tools/payload-cost.ts`
- `readPayloadEnvelope` — `src/game/payload-envelope.ts`
- `readPayloadEnvelopeInteger` — `src/game/payload-envelope.ts`
- `readPictures` — `tests/repository/readmes.test.ts`
- `readPinned` — `tests/ui/panel-element.test.ts`
- `readPinnedCard` — `tests/ui/panel-element.test.ts`
- `readPinnedFight` — `tests/ui/panel-element.test.ts`
- `readPins` — `tests/repository/workflows.test.ts`
- `readPlace` — `src/game/game-place.ts`, `tests/runtime/live-fight.test.ts`
- `readPlaceOf` — `tests/game/game-place.test.ts`
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
- `readRecordedText` — `tests/game/warrior-snapshot.test.ts`
- `readRecordingCalls` — `tools/capture-intake.ts`
- `readRecordingFile` — `tools/recorded-material.ts`
- `readRecordingNames` — `tests/tools/preview-server.test.ts`
- `readRecordingPaths` — `tests/e2e/panel-crawl.spec.ts`
- `readRecordingRows` — `tests/repository/captured-fight-register.test.ts`
- `readRecordingTableRows` — `tests/repository/captured-fight-register.test.ts`
- `readRecordingText` — `tests/runtime/fight-file.test.ts`
- `readRegionDrawn` — `tests/ui/level-drawn.test.ts`
- `readRegisterGuards` — `tests/repository/documents.test.ts`
- `readRegisterRows` — `tests/tools/drill-report.test.ts`
- `readReleaseFile` — `tools/changelog.ts`
- `readRootName` — `tests/repository/purity.test.ts`
- `readRow` — `tests/ui/panel-content.test.ts`
- `readRowCells` — `tests/repository/captured-fight-register.test.ts`,
  `tests/tools/drill-report.test.ts`
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
- `readScriptSources` — `src/game/game-build.ts`, `src/userscript-entry.ts`,
  `tests/game/game-build.test.ts`
- `readScrollers` — `tests/e2e/panel-scroll.spec.ts`
- `readSection` — `tests/repository/captured-fight-register.test.ts`
- `readSectionLines` — `tests/tools/drill-report.test.ts`
- `readServedBuild` — `tools/game-client-source.ts`
- `readSettingOrFallback` — `src/runtime/margometer-runtime.ts`
- `readShapeFlag` — `tools/fabricated-fight.ts`
- `readSheetVariable` — `tests/ui/panel-look.test.ts`
- `readSheetVariables` — `tests/ui/panel-look.test.ts`
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
- `readTimestampText` — in 4 files: `src/game/`, `tests/`
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
- `readTypeStep` — `src/runtime/settings.ts`
- `readUnderPoint` — `tests/e2e/panel-probe.ts`
- `readUnwrapped` — `tests/tools/drill-report.test.ts`
- `readUpdates` — `tests/runtime/margometer-runtime.test.ts`
- `readUserAgent` — `src/game/browser-surroundings.ts`, `tests/runtime-world.ts`
- `readUserscriptFiles` — `tools/build-userscript.ts`
- `readVerb` — `tests/verb-purities.ts`
- `readVerbPurities` — `tests/verb-purities.ts`
- `readViewport` — in 7 files: `src/`, `src/ui/`, `tests/`
- `readVocabularyKeys` — `tests/repository/name-register.test.ts`
- `readWindowCollapsed` — `src/runtime/settings.ts`
- `readWindowPosition` — `src/runtime/settings.ts`
- `readWindowSize` — `src/runtime/settings.ts`
- `readWorld` — `src/game/browser-surroundings.ts`, `tests/runtime-world.ts`
- `readWorldPage` — `tools/game-client-source.ts`

### `write` — none

- `write` — `src/game/browser-store.ts`, `src/ui/panel-drag.ts`
- `writeBrandedLine` — in 6 files: `src/game/`, `tests/`
- `writeCarriedTooltips` — `src/runtime/carried-tooltip.ts`
- `writeClientSourceCache` — `tools/game-client-source.ts`
- `writeClientStatusReport` — `tools/game-client-source.ts`
- `writeDevelopmentPreview` — `tools/game-readings.ts`
- `writeFabricatedFight` — `tools/fabricated-fight.ts`
- `writeFile` — in 4 files: `src/game/`, `tests/`
- `writeFrozenBuffBits` — `tools/buff-bit-table.ts`
- `writeFrozenFiles` — `tools/frozen-files.ts`
- `writeFrozenHelpCounts` — `tools/help-article.ts`
- `writeFrozenKeyTable` — `tools/protocol-key-table.ts`
- `writeFrozenSkillTable` — `tools/skill-table.ts`
- `writeGameWarriorBlock` — `src/game/game-tooltip.ts`
- `writeGivingWayShots` — `tools/panel-giving-way.ts`
- `writeHelpArticleCache` — `tools/help-article.ts`
- `writeHelpSearchReport` — `tools/help-article.ts`
- `writeIntake` — `tools/capture-intake.ts`
- `writeKeptFight` — `src/runtime/shelf.ts`
- `writeKeptFightPin` — `src/runtime/shelf.ts`
- `writePanelDragPosition` — `src/ui/panel-drag.ts`
- `writePanelPicture` — `tests/e2e/panel-camera.ts`
- `writePanelShots` — `tools/panel-shots.ts`
- `writeReadingsStatus` — `tools/game-readings.ts`
- `writeRefreshedReadings` — `tools/game-readings.ts`
- `writeRows` — `src/game/game-tooltip.ts`, `tests/runtime/margometer-runtime.test.ts`,
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
- `parseBacktickedPhrases` — `tools/help-claim-register.ts`
- `parseBitRows` — `tests/tools/aura-lifetime.test.ts`
- `parseCardArguments` — `tools/card-height.ts`
- `parseCaseLabels` — `tools/protocol-key-table.ts`
- `parseCellEffects` — `tools/skill-table.ts`
- `parseChangelogEntries` — `tests/repository/changelog.test.ts`
- `parseCitedHelpPhrases` — `tools/help-claim-register.ts`
- `parseClauseRows` — `tests/tools/aura-lifetime.test.ts`
- `parseDecimal` — `libs/number-text.ts`
- `parseDeclaredVersion` — `tools/build-userscript.ts`
- `parseDrillArguments` — `tools/drill-report.ts`
- `parseEffect` — `tools/skill-table.ts`
- `parseGameBuildId` — `src/game/game-build.ts`
- `parseGameBundleName` — `src/game/game-build.ts`
- `parseHealthPercent` — `src/core/protocol-number.ts`
- `parseHelpClaim` — `tools/help-claim-register.ts`
- `parseHelpClaims` — `tools/help-claim-register.ts`
- `parseHoldingRows` — `tests/tools/shout-holding.test.ts`
- `parseInteger` — `libs/number-text.ts`
- `parseJson` — `libs/json-text.ts`
- `parseKeyToken` — `src/core/fight-decoder.ts`
- `parseLabel` — `src/game/game-dictionary.ts`
- `parseLabelClaims` — `tests/repository/protocol-keys.test.ts`
- `parseMomentDay` — `tools/capture-intake.ts`
- `parseNamedTarget` — `src/core/fight-decoder.ts`
- `parseOrFail` — in 4 files: `tests/`
- `parsePaletteStated` — `tests/repository/design-tokens.test.ts`
- `parseProseCountClaims` — `tools/protocol-key-shape.ts`
- `parseProtocolMessage` — `src/core/fight-decoder.ts`
- `parseProtocolMessageEnd` — `src/core/fight-decoder.ts`
- `parseProtocolMessageSegments` — `src/core/fight-decoder.ts`
- `parseReach` — `tests/tools/aura-standing.test.ts`
- `parseReadingArguments` — `tools/turn-reading.ts`
- `parseRecordingsNamed` — `tools/protocol-key-shape.ts`
- `parseRegisterHeading` — `tools/protocol-key-shape.ts`
- `parseRegisterRows` — `tests/tools/aura-standing.test.ts`, `tests/tools/turn-count.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `parseRegisteredKeys` — `tools/protocol-key-shape.ts`
- `parseRowCells` — `tools/skill-table.ts`
- `parseRowsUnder` — `tests/tools/turn-reading.test.ts`
- `parseSectionLines` — `tests/tools/turn-reading.test.ts`
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
- `parseStatedVerdicts` — `tools/protocol-key-shape.ts`
- `parseTableCells` — `tests/markdown-document.ts`
- `parseTableCellsBare` — `tests/markdown-document.ts`
- `parseTableInteger` — `tests/register-table.ts`
- `parseTableRows` — `tests/register-table.ts`
- `parseTokenRows` — `tests/repository/design-tokens.test.ts`
- `parseTurnArguments` — `tools/turn-count.ts`
- `parseUnwrappedText` — `tests/markdown-document.ts`
- `parseWholePair` — `src/runtime/settings.ts`
- `parseWorld` — `src/game/browser-surroundings.ts`

### `decode` — strong

- `decode` — `tests/core/fight-decoder.test.ts`, `tests/core/fight-statistics.test.ts`
- `decodeAnnouncedSkill` — `src/core/fight-decoder.ts`
- `decodeAttackEvent` — `src/core/fight-decoder.ts`
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
- `encodeCaptureShape` — `src/game/fight-capture.ts`
- `encodeCaptureState` — `src/game/fight-capture.ts`
- `encodeFabricatedFight` — `tools/fabricated-fight.ts`
- `encodeFamilyText` — `tools/protocol-key-table.ts`
- `encodeFightFile` — `src/runtime/fight-file.ts`
- `encodeFightFileName` — `src/runtime/fight-file.ts`
- `encodeFightReport` — `src/runtime/fight-file.ts`
- `encodeFigure` — `tools/fabricated-fight.ts`
- `encodeFigureRecord` — `tools/fabricated-fight.ts`
- `encodeFledClosing` — `tools/fabricated-fight.ts`
- `encodeFrozenBuffModule` — `tools/buff-bit-table.ts`
- `encodeFrozenHelpModule` — `tools/help-article.ts`
- `encodeFrozenKeyModule` — `tools/protocol-key-table.ts`
- `encodeFrozenSkillTexts` — `tools/skill-table.ts`
- `encodeFrozenSkills` — `tools/skill-table.ts`
- `encodeHealthChange` — `tools/fabricated-fight.ts`
- `encodeHealthPercent` — `src/core/protocol-number.ts`
- `encodeHealthRecord` — `tools/fabricated-fight.ts`
- `encodeJson` — `libs/json-text.ts`
- `encodeKeptFight` — `src/runtime/shelf.ts`
- `encodeMessage` — `tools/fabricated-fight.ts`
- `encodeMovedHealth` — `tools/fabricated-fight.ts`
- `encodeNamedText` — `tools/fabricated-fight.ts`
- `encodeOpeningDeclarations` — `tools/fabricated-fight.ts`
- `encodeOpeningWarrior` — `tools/fabricated-fight.ts`
- `encodeProtocolMessage` — `src/core/fight-decoder.ts`
- `encodeProtocolMessageEnd` — `src/core/fight-decoder.ts`
- `encodeReportCombatants` — `src/runtime/fight-file.ts`
- `encodeReportCut` — `src/runtime/fight-file.ts`
- `encodeReportPairCut` — `src/runtime/fight-file.ts`
- `encodeReportRow` — `src/runtime/fight-file.ts`
- `encodeReportSkills` — `src/runtime/fight-file.ts`
- `encodeRequiredJson` — `tools/capture-intake.ts`
- `encodeRequiredText` — `tools/buff-bit-table.ts`, `tools/help-article.ts`,
  `tools/protocol-key-table.ts`
- `encodeSample` — `tests/tools/frozen-files.test.ts`
- `encodeSettledClosing` — `tools/fabricated-fight.ts`
- `encodeSide` — `tools/fabricated-fight.ts`
- `encodeSideNames` — `tools/fabricated-fight.ts`
- `encodeSnapshot` — `tools/fabricated-fight.ts`
- `encodeStandingWarrior` — `tools/fabricated-fight.ts`
- `encodeStep` — `tools/fabricated-fight.ts`
- `encodeTooltipBlock` — `src/game/game-tooltip.ts`
- `encodeTurnQueue` — `tools/fabricated-fight.ts`
- `encodeUserscriptBanner` — `tools/build-userscript.ts`
- `encodeUserscriptBannerDirectives` — `tools/build-userscript.ts`
- `encodeValued` — `tools/fabricated-fight.ts`
- `encodeValueless` — `tools/fabricated-fight.ts`
- `encodeWarriorsById` — `tools/fabricated-fight.ts`
- `encodeWrittenShelf` — `tests/runtime/shelf.test.ts`

### `tally` — strong

- `tally` — `tests/core/fight-statistics.test.ts`
- `tallyAuraRows` — `tools/aura-standing.ts`
- `tallyBitRows` — `tools/aura-lifetime.ts`
- `tallyBitRowsCommonTurns` — `tools/aura-lifetime.ts`
- `tallyBlowFigures` — `src/core/fight-statistics.ts`
- `tallyCardHeight` — `tools/card-height.ts`
- `tallyCardHeights` — `tools/card-height.ts`
- `tallyCardSize` — `src/ui/panel-element.ts`
- `tallyCarriedFigures` — `src/core/carried-figure.ts`
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
- `tallyPercentForBearer` — `src/core/carried-figure.ts`
- `tallyProvocationRows` — `tools/aura-standing.ts`
- `tallyRecordedFight` — `tests/recorded-fights.ts`
- `tallyRestoredGivenImbalance` — `src/core/fight-statistics.ts`
- `tallySourceRows` — `tools/aura-standing.ts`
- `tallyStruck` — `tests/tools/shout-holding.test.ts`
- `tallyStruckShare` — `tools/shout-holding.ts`
- `tallyTotals` — `src/core/fight-statistics.ts`
- `tallyTurnDelta` — `tools/turn-count.ts`

### `count` — strong

- `count` — `src/game/game-battle.ts`
- `countBlockHeadings` — `tests/repository/comment-share.test.ts`
- `countBlocksInText` — `tests/runtime/carried-tooltip.test.ts`
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
- `countProtocolMessageSegments` — `src/core/fight-decoder.ts`
- `countRows` — `tests/runtime/margometer-runtime.test.ts`
- `countRowsForOpenedLevel` — `src/ui/panel-element.ts`
- `countRowsForPairLevel` — `src/ui/panel-element.ts`
- `countRowsThatOpen` — `tests/runtime/margometer-runtime.test.ts`
- `countUnreadMessages` — `src/core/fight-statistics.ts`

### `clamp` — strong

- `clamp` — `libs/number-range.ts`
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
- `indexCombatantRollSnapshots` — `tools/capture-intake.ts`
- `indexCombatantRoster` — `src/core/combatant-roster.ts`
- `indexDefenceMechanisms` — `src/core/protocol-key.ts`
- `indexFightEntryHealth` — `src/core/combatant-health.ts`
- `indexKeyByStatusBit` — `src/core/carried-figure.ts`
- `indexKeyMeanings` — `src/core/protocol-key.ts`
- `indexLightingRows` — `tools/aura-lifetime.ts`
- `indexLightingRowsOne` — `tools/aura-lifetime.ts`
- `indexMembersBySide` — `tools/fight-figures.ts`
- `indexNameSubstitutions` — `tools/capture-intake.ts`
- `indexNamedBySkillId` — `tools/aura-standing.ts`
- `indexRecordedRoster` — `tests/core/fight-decoder.test.ts`
- `indexRecordedWarriors` — `tests/repository/captured-fight-register.test.ts`
- `indexReducedSides` — `src/core/combatant-health.ts`
- `indexReportSections` — `tools/develop-reports.ts`
- `indexShoutsBySkillId` — `src/core/aura-standing.ts`
- `indexSideHeals` — `src/core/combatant-health.ts`
- `indexTurnsByCombatantId` — `tools/aura-lifetime.ts`, `tools/turn-count.ts`

### `replay` — strong

- `replayAuraStandings` — `src/core/aura-standing.ts`
- `replayClocks` — `tools/shout-holding.ts`
- `replayEach` — `tests/game/recorded-session.test.ts`
- `replayEpisodes` — `tools/shout-holding.ts`
- `replayFabricatedFight` — `tests/tools/fabricated-fight.test.ts`
- `replayFightPayloads` — `src/runtime/fight-state.ts`
- `replayKeptFight` — `src/runtime/fight-state.ts`
- `replayLightingRows` — `tools/aura-lifetime.ts`
- `replayMaterialSteps` — `tools/recorded-material.ts`
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
- `presentCardNoteLines` — `src/ui/panel-element.ts`
- `presentCardPartsMergedByWord` — `src/ui/panel-element.ts`
- `presentCardProcLines` — `src/ui/panel-element.ts`
- `presentCardProcSubParts` — `src/ui/panel-element.ts`
- `presentCardRawLine` — `src/ui/panel-element.ts`
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
- `presentNounStrips` — `src/ui/panel-screen.ts`
- `presentOpenedLevel` — `src/ui/panel-content.ts`
- `presentOpenedLevels` — `src/runtime/panel-frame.ts`
- `presentOptions` — `src/runtime/panel-frame.ts`
- `presentPairLevel` — `src/ui/panel-content.ts`
- `presentPartLevel` — `src/ui/panel-content.ts`
- `presentPinnedCutParts` — `src/ui/panel-element.ts`
- `presentRowCard` — `src/ui/panel-element.ts`
- `presentRowCardCutLines` — `src/ui/panel-element.ts`
- `presentScreen` — `src/ui/panel-content.ts`
- `presentScreenForEveryone` — `tools/drill-report.ts`
- `presentShelfAnswers` — `src/runtime/panel-frame.ts`
- `presentShelfHeadcount` — `src/runtime/panel-frame.ts`
- `presentShelfRows` — `src/runtime/panel-frame.ts`
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

- `format` — `tools/aura-standing.ts`
- `formatAuraReport` — `tools/aura-standing.ts`
- `formatAuraReportLine` — `tools/aura-standing.ts`
- `formatAuraReportShouts` — `tools/aura-standing.ts`
- `formatAuraReportSources` — `tools/aura-standing.ts`
- `formatAuraReportStanding` — `tools/aura-standing.ts`
- `formatBitReport` — `tools/aura-lifetime.ts`
- `formatBitShift` — `tools/game-readings.ts`
- `formatBlowLines` — `tools/fight-figures.ts`
- `formatCardSubtitle` — `src/ui/panel-words.ts`
- `formatCaseReport` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `formatCastText` — `tests/repository/captured-fight-register.test.ts`
- `formatChargedSkillSubtitle` — `src/ui/panel-words.ts`
- `formatCitation` — `tests/repository/cited-paths.test.ts`
- `formatCodeSpan` — `tests/repository/name-register.test.ts`
- `formatColour` — `src/ui/panel-palette.ts`
- `formatComparison` — `tools/develop-reports.ts`
- `formatCostReport` — `tools/payload-cost.ts`
- `formatCountedNoun` — `src/ui/panel-words.ts`
- `formatCounter` — `src/ui/panel-words.ts`
- `formatCutText` — `tools/fight-figures.ts`
- `formatDecimal` — `libs/number-text.ts`
- `formatDecisionName` — `tests/repository/decisions.test.ts`
- `formatDecisionNumber` — `tests/repository/decisions.test.ts`
- `formatDecodingStatus` — `tools/decoding-status.ts`
- `formatDefect` — `src/ui/panel-words.ts`
- `formatDestroyed` — `src/ui/panel-words.ts`
- `formatDetailLines` — `tools/fight-figures.ts`
- `formatDifferenceLines` — `tools/develop-reports.ts`
- `formatDisputeReport` — `tools/turn-reading.ts`
- `formatDrillReport` — `tools/drill-report.ts`
- `formatDumpAge` — `tools/help-article.ts`
- `formatEntry` — `tests/repository/name-register.test.ts`
- `formatFabricationShape` — `tools/fabricated-fight.ts`
- `formatFightCardCounts` — `src/ui/panel-element.ts`
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
- `formatOpenerKey` — `tests/tools/turn-reading.test.ts`
- `formatOpenerReport` — `tools/turn-reading.ts`
- `formatOutOf` — `src/ui/panel-words.ts`
- `formatOutcomeLines` — `tools/fight-figures.ts`
- `formatPinnedNotes` — `src/ui/panel-element.ts`
- `formatPlace` — `src/ui/panel-words.ts`
- `formatPlaceWords` — `src/ui/panel-words.ts`
- `formatPreviewKeys` — `tools/game-readings.ts`
- `formatReadingLine` — `tools/game-readings.ts`
- `formatReadingLines` — `tools/fight-figures.ts`
- `formatReadingWalk` — `tools/turn-reading.ts`
- `formatReadingWalkLine` — `tools/turn-reading.ts`
- `formatRecordedFigures` — `tools/fight-figures.ts`
- `formatRecordingName` — `tools/recorded-material.ts`
- `formatRefreshLine` — `tools/game-readings.ts`
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
- `formatStatusCountLine` — `tools/decoding-status.ts`
- `formatStatusReport` — `tools/decoding-status.ts`
- `formatStatusTallyLines` — `tools/decoding-status.ts`
- `formatTallestReport` — `tools/card-height.ts`
- `formatTallyKey` — `tests/tools/turn-reading.test.ts`
- `formatTurnOrdinal` — `src/ui/panel-words.ts`
- `formatTurnWalk` — `tools/turn-count.ts`
- `formatTurnWalkLine` — `tools/turn-count.ts`
- `formatTurns` — `src/ui/panel-words.ts`
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

- `add` — in 7 files: `src/core/`, `src/runtime/`, `src/ui/`
- `addBlowDealt` — `src/core/fight-statistics.ts`
- `addBlowProcs` — `src/core/fight-statistics.ts`
- `addBlowTaken` — `src/core/fight-statistics.ts`
- `addBlowWithNoTarget` — `src/core/fight-statistics.ts`
- `addCall` — `tools/fabricated-fight.ts`
- `addCaseToTally` — `tools/drill-report.ts`
- `addCombatantFigures` — `src/core/fight-statistics.ts`
- `addComparison` — `tests/core/health-witness.test.ts`
- `addCutForOtherEnd` — `src/core/fight-statistics.ts`
- `addDamageDealtApplied` — `src/core/fight-statistics.ts`
- `addDamageFiguresToCut` — `src/core/fight-statistics.ts`
- `addDamageFiguresToOtherEndCut` — `src/core/fight-statistics.ts`
- `addDamageTakenApplied` — `src/core/fight-statistics.ts`
- `addEventListener` — `src/ui/panel-document.ts`, `tests/fake-document.ts`,
  `tests/tools/preview-state.test.ts`
- `addEventTurns` — `src/core/turn-clock.ts`
- `addFightCardLine` — `src/ui/panel-element.ts`
- `addFileDefect` — `src/runtime/margometer-runtime.ts`
- `addFoldedCut` — `src/ui/panel-content.ts`
- `addGuardedListener` — `src/ui/panel-listener.ts`
- `addHealth` — `tools/fabricated-fight.ts`
- `addHealthGiven` — `src/core/fight-statistics.ts`
- `addHealthLost` — `src/core/fight-statistics.ts`
- `addHealthRestored` — `src/core/fight-statistics.ts`
- `addHealthRestoredBySource` — `src/core/fight-statistics.ts`
- `addLevel` — `tests/ui/level-drawn.test.ts`
- `addMessageIndexes` — `tools/fabricated-fight.ts`
- `addName` — `tests/repository/name-register.test.ts`
- `addNamedDamageTaken` — `src/core/fight-statistics.ts`
- `addOpenedLevelToTally` — `tools/drill-report.ts`
- `addOpenedRungs` — `tests/ui/level-drawn.test.ts`
- `addParameterRead` — `src/core/fight-decoder.ts`
- `addPartRungToTally` — `tools/drill-report.ts`
- `addPinnedLevelToTally` — `tools/drill-report.ts`
- `addPinnedRungs` — `tests/ui/level-drawn.test.ts`
- `addProseCountClaims` — `tools/protocol-key-shape.ts`
- `addRegionDefect` — `src/runtime/panel-frame.ts`
- `addRestoredToNobody` — `src/core/fight-statistics.ts`
- `addSkillDealt` — `src/core/fight-statistics.ts`
- `addSkillFigures` — `src/core/fight-statistics.ts`
- `addSkillRestored` — `src/core/fight-statistics.ts`
- `addStatusRows` — `src/ui/panel-words.ts`
- `addStruck` — `tools/shout-holding.ts`
- `addToCut` — `src/core/fight-statistics.ts`
- `addTurn` — `src/core/turn-clock.ts`
- `addTurnCall` — `tools/fabricated-fight.ts`
- `addTurnStatement` — `tools/fabricated-fight.ts`
- `addUndrawnDefects` — `src/runtime/panel-frame.ts`
- `addUnplacedCast` — `src/core/fight-statistics.ts`
- `addValuedKey` — `src/core/fight-decoder.ts`
- `addViewFailureGuarded` — `src/ui/view-failure.ts`

### `remove` — weak

- `remove` — `src/game/browser-file.ts`, `tests/fake-window.ts`, `tests/game/browser-file.test.ts`
- `removeHealth` — `tools/fabricated-fight.ts`
- `removeItem` — in 8 files: `src/game/`, `tests/`
- `removeSkillDescriptions` — `tools/capture-intake.ts`
- `removeUnshelvedFightStates` — `src/runtime/shelf-keeper.ts`

### `create` — strong

- `create` — `tests/source-tree.ts`
- `createAnchor` — `src/game/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/game/browser-file.test.ts`
- `createBlob` — `src/game/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/game/browser-file.test.ts`
- `createCaptureCopy` — `src/game/fight-capture.ts`
- `createCardRegister` — `src/ui/panel-element.ts`
- `createCombatantFigures` — `src/core/fight-statistics.ts`
- `createElement` — in 4 files: `src/`, `src/ui/`, `tests/`
- `createEnvelopeFailure` — `src/game/payload-envelope.ts`
- `createFabricatedFight` — `tools/fabricated-fight.ts`
- `createFabricatedWarrior` — `tools/fabricated-fight.ts`
- `createFabricatedWarriors` — `tools/fabricated-fight.ts`
- `createFightCapture` — `src/game/fight-capture.ts`
- `createFightSession` — `src/core/fight-session.ts`
- `createObjectURL` — `src/game/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/game/browser-file.test.ts`
- `createOpenPartIntent` — `src/ui/panel-intent.ts`
- `createScreenState` — `src/ui/panel-screen.ts`
- `createScrollMemo` — `src/ui/panel-element.ts`

### `delete` — none

- `delete` — `src/game/browser-store.ts`
- `deleteKeptFight` — `src/runtime/shelf.ts`
- `deleteShelf` — `src/runtime/shelf.ts`
- `deleteWindowSize` — `src/runtime/settings.ts`

### `reset` — weak

- `reset` — `src/ui/panel-element.ts`
- `resetScreenOpened` — `src/runtime/margometer-runtime.ts`

### `require` — strong

- `requireBlockBody` — `tools/protocol-key-table.ts`
- `requireBuffBits` — `tools/buff-bit-table.ts`
- `requireBundleInBrowser` — `tools/build-userscript.ts`
- `requireCachedArticleText` — `tools/help-article.ts`
- `requireCachedBuild` — `tools/game-client-source.ts`
- `requireCachedClientSource` — `tools/game-client-source.ts`
- `requireCachedHelpArticle` — `tools/help-article.ts`
- `requireCachedSkillTable` — `tools/skill-table.ts`
- `requireCachedSkills` — `tools/skill-table.ts`
- `requireCallsCarried` — `tools/capture-intake.ts`
- `requireComputedKeyFamily` — `tools/protocol-key-table.ts`
- `requireEveryCombatantDecided` — `tools/capture-intake.ts`
- `requireFabricationShape` — `tools/fabricated-fight.ts`
- `requireGameChannel` — `tools/game-client-source.ts`
- `requirePageBuild` — `tools/game-client-source.ts`
- `requirePageBundleAddress` — `tools/game-client-source.ts`
- `requireProtocolKeys` — `tools/protocol-key-table.ts`
- `requireRecordingIsNew` — `tools/capture-intake.ts`
- `requireScreens` — `tools/drill-report.ts`
- `requireSkillsOfPage` — `tools/skill-table.ts`
- `requireSnapshotsCarried` — `tools/capture-intake.ts`

### `expect` — strong

- `expectAbsent` — `tests/game/game-dictionary.test.ts`, `tests/game/game-hero.test.ts`,
  `tests/game/game-place.test.ts`
- `expectHonest` — `tests/e2e/panel-fixture.ts`
- `expectMalformed` — `tests/game/payload-envelope.test.ts`
- `expectRefused` — `tests/game/browser-store.test.ts`, `tests/tools/recorded-material.test.ts`
- `expectSettingUnreadable` — `tests/runtime/settings.test.ts`
- `expectShareTellsNothingFromSomething` — `tests/ui/share-column.test.ts`
- `expectSideUnreadable` — `tests/core/message-grammar.test.ts`
- `expectStoreRefused` — `tests/runtime/settings.test.ts`
- `expectTooLong` — `tests/game/browser-store.test.ts`, `tests/game/payload-envelope.test.ts`,
  `tests/libs/unknown-value.test.ts`
- `expectWrongType` — `tests/libs/unknown-value.test.ts`

### `attempt` — none

- `attempt` — `libs/errors.ts`

### `compose` — strong

- `compose` — `tests/ui/card-window.test.ts`
- `composeAcross` — `src/ui/panel-element.ts`
- `composeAnnouncedHeal` — `tests/ui/panel-content.test.ts`
- `composeAnnouncementStanding` — `src/core/fight-decoder.ts`
- `composeAnsweringStorage` — `tests/game/browser-store.test.ts`
- `composeAuraSkills` — `tools/skill-table.ts`
- `composeAuraStandings` — `src/core/aura-standing.ts`
- `composeBarColour` — `src/ui/panel-look.ts`
- `composeBattlePage` — `tests/runtime/margometer-runtime.test.ts`
- `composeBitShifts` — `tools/game-readings.ts`
- `composeBlow` — `tests/core/aura-standing.test.ts`, `tests/core/carried-status.test.ts`,
  `tests/core/turn-clock.test.ts`
- `composeBlowLargest` — `src/core/fight-statistics.ts`
- `composeBodyWithout` — `tests/ui/panel-look.test.ts`
- `composeCachedClient` — `tests/tools/game-readings.test.ts`
- `composeCardAcross` — `src/ui/panel-drag.ts`
- `composeCardAcrossStyle` — `src/ui/panel-element.ts`
- `composeCardLineClass` — `src/ui/panel-element.ts`
- `composeCardLookup` — `src/ui/panel-element.ts`
- `composeCardRules` — `src/ui/panel-look.ts`
- `composeCardTop` — `src/ui/panel-look.ts`
- `composeCardTrimmed` — `src/ui/panel-element.ts`
- `composeCardWithin` — `src/ui/panel-element.ts`
- `composeCardsPlaced` — `tools/preview-site.ts`
- `composeCarriedStatuses` — `src/core/carried-status.ts`
- `composeCast` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`
- `composeCastPastItsBound` — `tests/runtime/margometer-runtime.test.ts`
- `composeCaveatMarkRule` — `src/ui/panel-look.ts`
- `composeCharge` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `composeChargingStanding` — `src/core/charged-skill.ts`
- `composeClientState` — `tools/game-readings.ts`
- `composeClock` — `tests/runtime/engine-search.test.ts`
- `composeClosingRow` — `src/ui/panel-content.ts`
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
- `composeDate` — `tests/game/browser-clock.test.ts`
- `composeDecidedFreeze` — `tests/tools/game-readings.test.ts`
- `composeDeclaration` — `tests/core/turn-clock.test.ts`
- `composeDeclaringBlow` — `tests/core/legendary-standing.test.ts`
- `composeDefaultPosition` — `src/ui/panel-drag.ts`
- `composeDisputeRegister` — `tools/turn-reading.ts`
- `composeDisputedReadings` — `tools/turn-reading.ts`
- `composeDownloads` — `tests/game/browser-file.test.ts`
- `composeDraggedPosition` — `src/ui/panel-drag.ts`
- `composeDraggedSize` — `src/ui/panel-drag.ts`
- `composeDriver` — `tests/e2e/game-page.ts`
- `composeDumpState` — `tools/game-readings.ts`
- `composeElementCut` — `src/ui/panel-content.ts`
- `composeElementOfClass` — `tests/ui/panel-scroll.test.ts`
- `composeEmptySubject` — `tests/runtime/fight-file.test.ts`
- `composeEngine` — `tests/game/game-hero.test.ts`, `tests/game/game-place.test.ts`
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
- `composeFightView` — `src/core/fight-session.ts`
- `composeFigure` — `tools/fabricated-fight.ts`
- `composeFileSubject` — `src/runtime/fight-handover.ts`
- `composeFoldsJoined` — `src/ui/panel-content.ts`
- `composeFontBody` — `src/ui/panel-look.ts`
- `composeFontTitle` — `src/ui/panel-look.ts`
- `composeFoughtSubject` — `tests/runtime/fight-file.test.ts`
- `composeFrameRules` — `src/ui/panel-look.ts`
- `composeFrameWorld` — `tests/runtime/panel-frame.test.ts`
- `composeFrames` — `tests/game/browser-frame.test.ts`
- `composeFromLeft` — `tests/ui/panel-drag.test.ts`
- `composeFromRight` — `tests/ui/panel-drag.test.ts`
- `composeFrozenFiles` — `tools/frozen-files.ts`
- `composeFrozenFilesMoved` — `tools/frozen-files.ts`
- `composeFrozenState` — `tools/game-readings.ts`
- `composeFullCast` — `tests/core/fight-session.test.ts`
- `composeFullCastScreen` — `tests/ui/full-cast-bound.test.ts`
- `composeFullShelf` — `tests/ui/shelf-bound.test.ts`
- `composeFunctionLines` — `tests/repository/name-register.test.ts`
- `composeGame` — `tests/e2e/game-page.ts`, `tests/runtime/live-fight.test.ts`
- `composeGameLate` — `tests/e2e/game-page.ts`
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
- `composeHeld` — `tests/game/game-battle.test.ts`
- `composeHelperOpeningPosition` — `src/ui/panel-drag.ts`
- `composeHelperPositionAfterTypeStep` — `src/ui/panel-drag.ts`
- `composeHelperRules` — `src/ui/panel-look.ts`
- `composeHostStyle` — `src/ui/panel-drag.ts`
- `composeInsetUnderRows` — `src/ui/panel-look.ts`
- `composeIntake` — `tools/capture-intake.ts`
- `composeIntakeName` — `tools/capture-intake.ts`
- `composeKeyDifference` — `tools/game-readings.ts`
- `composeKeyTally` — `tools/turn-reading.ts`
- `composeKeysAddingTurn` — `tools/turn-reading.ts`
- `composeLandingPage` — `tests/tools/preview-site.test.ts`
- `composeLastheal` — `tests/core/legendary-standing.test.ts`
- `composeLayeredLines` — `tests/repository/name-register.test.ts`
- `composeLedger` — `tests/runtime/defect-ledger.test.ts`
- `composeLegendaryStandings` — `src/core/legendary-standing.ts`
- `composeLevelScreen` — `tests/ui/level-drawn.test.ts`
- `composeListName` — `src/ui/panel-screen.ts`
- `composeListRules` — `src/ui/panel-look.ts`
- `composeListener` — `tests/game/game-battle.test.ts`
- `composeManifestPath` — `tools/game-client-source.ts`, `tools/help-article.ts`
- `composeMappedValue` — `tools/capture-intake.ts`
- `composeMask` — `tests/core/carried-status.test.ts`
- `composeMessageReadings` — `tools/turn-reading.ts`
- `composeMessageReadingsOfStep` — `tools/turn-reading.ts`
- `composeNameForPart` — `src/ui/panel-screen.ts`
- `composeNameRegister` — `tests/repository/name-register.test.ts`
- `composeNamed` — `tests/ui/card-window.test.ts`
- `composeNotesForOpenedRow` — `tests/ui/panel-element.test.ts`
- `composeOne` — `tests/game/game-tooltip.test.ts`
- `composeOneCombatantRoster` — `tests/core/fight-statistics.test.ts`
- `composeOpenedParts` — `tests/ui/level-drawn.test.ts`
- `composeOpenerTally` — `tools/turn-reading.ts`
- `composeOpeningPosition` — `src/ui/panel-drag.ts`
- `composeOpeningReplay` — `tools/preview-site.ts`
- `composeOpeningWatched` — `tools/preview-site.ts`
- `composeOpponentCut` — `src/ui/panel-content.ts`
- `composeOptions` — `tests/runtime/live-fight.test.ts`, `tests/tools/preview-page.test.ts`
- `composeOptionsRules` — `src/ui/panel-look.ts`
- `composeOptionsStepClass` — `src/ui/panel-look.ts`
- `composeOwnScope` — `tools/preview-page.ts`
- `composePage` — `tests/game/game-tooltip.test.ts`
- `composePairPartFigures` — `src/ui/panel-content.ts`
- `composePairParts` — `src/ui/panel-content.ts`
- `composePanelDragGrab` — `src/ui/panel-drag.ts`
- `composePanelHandle` — `tests/e2e/panel-fixture.ts`
- `composePanelPage` — `tests/e2e/game-page.ts`
- `composePanelShots` — `tools/panel-shots.ts`
- `composePanelSides` — `src/ui/panel-content.ts`
- `composePeopleForKey` — `src/ui/panel-content.ts`
- `composePeopleForPart` — `src/ui/panel-content.ts`
- `composePeopleForSkill` — `src/ui/panel-content.ts`
- `composePersonCard` — `src/ui/panel-element.ts`
- `composePinnedFigures` — `src/ui/panel-content.ts`
- `composePinnedRows` — `src/ui/panel-content.ts`
- `composePlace` — `src/ui/panel-element.ts`, `tests/ui/panel-drag.test.ts`
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
- `composeProbe` — `tests/e2e/game-page.ts`
- `composeProvocation` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `composeProvocationStandings` — `src/core/aura-standing.ts`
- `composePseudonymisedRecording` — `tools/capture-intake.ts`
- `composeRankedTally` — `tools/decoding-status.ts`
- `composeRebuildingBattle` — `tests/rebuilding-battle.ts`
- `composeRecordingBattle` — `tests/runtime/margometer-runtime.test.ts`
- `composeRecordingInEnglish` — `tools/capture-intake.ts`
- `composeReduction` — `tools/fabricated-fight.ts`
- `composeRefusingStorage` — `tests/game/browser-store.test.ts`
- `composeRefusingStore` — `tests/runtime/settings.test.ts`
- `composeRegionRules` — `src/ui/panel-look.ts`
- `composeRegistry` — `tests/game/game-tooltip.test.ts`
- `composeReleaseNotes` — `tools/changelog.ts`
- `composeRenamedRecord` — `tools/capture-intake.ts`
- `composeReport` — `tests/runtime/engine-search.test.ts`
- `composeRestRow` — `src/ui/panel-content.ts`
- `composeRoster` — `tests/core/aura-standing.test.ts`
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
- `composeShelfRow` — `tests/ui/shelf-bound.test.ts`
- `composeShotClip` — `tools/panel-shots.ts`
- `composeShotPage` — `tools/panel-shots.ts`
- `composeShoutSkills` — `tools/skill-table.ts`
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
- `composeSwap` — `tests/ui/card-window.test.ts`
- `composeTarget` — `tests/ui/panel-intent.test.ts`
- `composeTestCast` — `tests/core/combatant-roster.test.ts`
- `composeTestCombatant` — `tests/core/combatant-roster.test.ts`
- `composeThrowingPage` — `tests/runtime/engine-search.test.ts`
- `composeTimers` — `tests/game/browser-interval.test.ts`
- `composeTipHolder` — `tests/rebuilding-battle.ts`
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
- `composeTwoSided` — `tests/core/fight-statistics.test.ts`
- `composeUnaskedClientState` — `tools/game-readings.ts`
- `composeUnbalanced` — `tests/core/fight-statistics.test.ts`
- `composeUnderListRules` — `src/ui/panel-look.ts`
- `composeUnfoughtFight` — `tests/tools/turn-reading.test.ts`
- `composeVariable` — `src/ui/panel-look.ts`
- `composeVariables` — `src/ui/panel-look.ts`
- `composeView` — `tests/core/aura-standing.test.ts`
- `composeVocabularyLines` — `tests/repository/name-register.test.ts`
- `composeWarrior` — `tests/game/game-tooltip.test.ts`, `tests/game/warrior-snapshot.test.ts`
- `composeWidestFight` — `tests/ui/full-cast-bound.test.ts`
- `composeWidthsBySelector` — `tests/tools/preview-site.test.ts`
- `composeWindowDragging` — `tools/preview-site.ts`
- `composeWindowRight` — `src/ui/panel-drag.ts`
- `composeWindowsCornered` — `tools/preview-site.ts`
- `composeWindowsSeeded` — `tools/panel-shots.ts`

### `is` — strong

- `isAlphanumericAt` — `src/game/game-build.ts`, `tests/repository/names.test.ts`
- `isAnnouncement` — `tests/core/granted-blow-rule.test.ts`,
  `tests/core/skill-announcement-rule.test.ts`
- `isBitSet` — `tools/aura-lifetime.ts`
- `isBlowCritical` — `src/core/fight-statistics.ts`
- `isCallableOn` — `src/userscript-entry.ts`
- `isCamelCase` — `tests/repository/names.test.ts`
- `isCanonicalPlace` — `tests/repository/documents.test.ts`
- `isCardWithin` — `src/ui/panel-element.ts`
- `isCarryingKey` — `tests/core/npc-heal-rule.test.ts`
- `isCasterHalved` — `src/core/carried-figure.ts`
- `isCaughtRangeError` — `tests/ui/view-failure.test.ts`
- `isClearOf` — `tests/e2e/panel-helper.spec.ts`
- `isCollectionMade` — `tests/repository/purity.test.ts`
- `isCommentLine` — `tests/ui/panel-words.test.ts`
- `isConstAssertion` — `tests/repository/type-assertions.test.ts`
- `isCountText` — `tests/repository/captured-fight-register.test.ts`
- `isCountWord` — `tools/protocol-key-shape.ts`
- `isCountingSentence` — `tools/protocol-key-shape.ts`
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
- `isFabricatedEnvelope` — `tests/repository/fabricated-fights.test.ts`
- `isFabricatedPath` — `tools/fabricated-fight.ts`
- `isFightOver` — `tools/fabricated-fight.ts`
- `isGameWarriorNamed` — `src/game/warrior-snapshot.ts`
- `isGuardedBody` — `tests/repository/handed-callbacks.test.ts`
- `isImportSpeltForItsPlace` — `tests/repository/import-paths.test.ts`
- `isInvariantBroken` — `tests/simulation.ts`
- `isKebabCase` — `tests/repository/names.test.ts`
- `isKeyAt` — `tests/ui/panel-words.test.ts`
- `isLevelOpen` — `src/ui/panel-element.ts`
- `isLightingAgreeing` — `tools/aura-lifetime.ts`
- `isLineWhole` — `tests/ui/panel-element.test.ts`
- `isLowerAt` — `tests/repository/names.test.ts`
- `isLowerOrDigitAt` — `tests/repository/names.test.ts`
- `isNameCharacter` — `tests/repository/declaration-order.test.ts`
- `isNameCharacterAt` — `tools/protocol-key-table.ts`
- `isNameLike` — `tests/repository/name-register.test.ts`
- `isNoteGroup` — `src/ui/panel-element.ts`
- `isOnPath` — `tests/repository/event-entries.test.ts`
- `isOneOf` — `libs/vocabulary.ts`
- `isOurWrap` — `src/game/game-battle.ts`
- `isOwnNode` — `tests/repository/handed-callbacks.test.ts`
- `isPascalCase` — `tests/repository/names.test.ts`
- `isPastBoundInCaller` — `tests/repository/called-once.test.ts`
- `isPastItsTurn` — `src/core/charged-skill.ts`
- `isPayloadNarrated` — `tools/turn-count.ts`
- `isPinnedPersonKept` — `src/ui/panel-content.ts`
- `isPoolRaiseAmong` — `tests/core/health-witness.test.ts`
- `isPoolRaiseDeclared` — `tests/core/health-witness.test.ts`
- `isReachingItself` — `tests/repository/control-flow.test.ts`
- `isReadableText` — `tests/ui/panel-words.test.ts`
- `isReaderLayer` — `tests/repository/reader-layer.test.ts`
- `isReaderSideNamed` — `src/ui/panel-content.ts`
- `isRecord` — `libs/unknown-value.ts`
- `isRecordNode` — `tests/repository/throws.test.ts`
- `isRegionList` — `src/ui/panel-element.ts`
- `isRegionShort` — `tests/ui/level-drawn.test.ts`
- `isRootedPath` — `tests/repository/cited-paths.test.ts`
- `isRowSuspect` — `src/ui/panel-content.ts`
- `isSame` — `tests/core/last-heal-rule.test.ts`
- `isSameAsciiTextAt` — `libs/html-text.ts`
- `isSameRange` — `tests/repository/name-register.test.ts`, `tests/source-tree.ts`
- `isSectionDrawn` — `tests/ui/panel-element.test.ts`
- `isShapeFigureWithin` — `tools/fabricated-fight.ts`
- `isShoutAnnouncement` — `tools/shout-holding.ts`
- `isShoutedName` — `tests/repository/protocol-keys.test.ts`
- `isSideListed` — `src/ui/panel-content.ts`
- `isSideWideKey` — `src/core/protocol-key.ts`
- `isSlugText` — `tools/capture-intake.ts`
- `isStanding` — `tools/fabricated-fight.ts`
- `isStartedAsync` — `tests/repository/called-once.test.ts`
- `isStruckAgain` — `tests/core/last-heal-rule.test.ts`
- `isStunKey` — `tests/tools/turn-count.test.ts`
- `isTooltipTargets` — `src/game/game-tooltip.ts`
- `isTopLevel` — `tests/repository/name-register.test.ts`, `tests/repository/purity.test.ts`
- `isTreeComplete` — `tools/develop-reports.ts`
- `isUpperAt` — `tests/repository/names.test.ts`
- `isUserscriptDocument` — `src/userscript-entry.ts`
- `isUserscriptWindow` — `src/userscript-entry.ts`
- `isVersionText` — `tools/capture-intake.ts`
- `isWhitespaceAt` — `libs/text-walk.ts`
- `isWhole` — `tests/ui/panel-look.test.ts`
- `isWritableCollection` — `tests/repository/purity.test.ts`
- `isWritableRecord` — `src/game/game-battle.ts`
- `isWrittenInPolish` — `tests/tools/preview-site.test.ts`

### `was` — strong

- `wasAnyTurnLost` — `src/ui/panel-content.ts`

### `has` — strong

- `hasAttackFigure` — `src/core/fight-decoder.ts`
- `hasDamageFigure` — `tests/core/granted-blow-rule.test.ts`
- `hasDeclaredEffect` — `src/core/turn-clock.ts`
- `hasHole` — `src/game/game-dictionary.ts`
- `hasPinnedTotalDisagreed` — `src/ui/panel-content.ts`
- `hasSideTotalDisagreed` — `src/ui/panel-content.ts`
- `hasWord` — `tests/repository/comment-share.test.ts`

### `does` — strong

- `doesKeyReachBearer` — `src/core/carried-figure.ts`
- `doesNameOneCombatant` — `src/core/fight-decoder.ts`
- `doesRowCarryMarkup` — `src/ui/panel-words.ts`

### No verb

- `Engine` — `tests/runtime/margometer-runtime.test.ts`
- `Program` — `tests/source-tree.ts`

### `_t` — not in N2's table

- `_t` — `tests/game/game-dictionary.test.ts`, `tests/runtime/carried-tooltip.test.ts`,
  `tools/payload-cost.ts`

### `allow` — not in N2's table

- `allow` — `tests/e2e/panel-fixture.ts`

### `announce` — not in N2's table

- `announce` — `tests/core/charged-skill.test.ts`

### `answer` — not in N2's table

- `answerPreviewRequest` — `tools/preview-server.ts`

### `append` — not in N2's table

- `append` — in 4 files: `src/`, `src/ui/`, `tests/`
- `appendAnchor` — `src/game/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/game/browser-file.test.ts`

### `apply` — not in N2's table

- `apply` — `tests/core/fight-session.test.ts`, `tests/game/recorded-session.test.ts`

### `assert` — not in N2's table

- `assertHalfNamedCutTotals` — `tests/ui/panel-content.test.ts`

### `at` — not in N2's table

- `at` — in 5 files: `tests/`

### `attach` — not in N2's table

- `attachShadow` — `src/ui/panel-document.ts`, `tests/fake-document.ts`

### `blow` — not in N2's table

- `blow` — `tests/core/fight-statistics.test.ts`

### `break` — not in N2's table

- `breakCharge` — `tests/core/charged-skill.test.ts`

### `call` — not in N2's table

- `call` — `tests/fake-window.ts`
- `callSimulationGame` — `tests/simulation.ts`
- `callUpdate` — `tests/game/game-battle.test.ts`

### `cancel` — not in N2's table

- `cancel` — in 4 files: `src/game/`, `tests/`, `tools/`
- `cancelAnimationFrame` — in 4 files: `src/game/`, `tests/`

### `cancels` — not in N2's table

- `cancels` — `tests/runtime/engine-search.test.ts`

### `capture` — not in N2's table

- `capture` — `tests/game/fight-capture.test.ts`

### `card` — not in N2's table

- `cardWith` — `tests/ui/panel-card.test.ts`

### `cast` — not in N2's table

- `cast` — `tests/game/warrior-snapshot.test.ts`

### `charging` — not in N2's table

- `charging` — `tests/core/charged-skill.test.ts`
- `chargingMany` — `tests/core/charged-skill.test.ts`

### `choose` — not in N2's table

- `chooseStorage` — `tests/runtime/margometer-runtime.test.ts`

### `chosen` — not in N2's table

- `chosen` — `tests/runtime/margometer-runtime.test.ts`

### `clear` — not in N2's table

- `clearInterval` — in 5 files: `src/game/`, `tests/`

### `click` — not in N2's table

- `click` — `src/game/browser-file.ts`, `tests/fake-window.ts`, `tests/game/browser-file.test.ts`

### `close` — not in N2's table

- `close` — `tools/preview-server.ts`
- `closePanelPage` — `tests/e2e/panel-camera.ts`

### `collect` — not in N2's table

- `collect` — `src/ui/panel-element.ts`

### `compare` — not in N2's table

- `compareCases` — `tools/drill-report.ts`
- `compareElementRows` — `src/ui/panel-content.ts`
- `compareReportSections` — `tools/develop-reports.ts`
- `compareRowsByFigureThenId` — `src/ui/panel-content.ts`
- `compareSectionMaps` — `tools/develop-reports.ts`
- `compareSkillRows` — `src/ui/panel-content.ts`
- `compareText` — `tests/repository/name-register.test.ts`
- `compareWholeReports` — `tools/develop-reports.ts`

### `concat` — not in N2's table

- `concatTip` — `src/game/game-tooltip.ts`, `tests/game/game-tooltip.test.ts`,
  `tests/rebuilding-battle.ts`

### `contains` — not in N2's table

- `contains` — `src/ui/panel-document.ts`, `tests/fake-document.ts`

### `controls` — not in N2's table

- `controls` — `tests/ui/panel-element.test.ts`

### `copy` — not in N2's table

- `copyWalk` — `tests/core/carried-status.test.ts`, `tests/core/legendary-standing.test.ts`

### `cost` — not in N2's table

- `cost` — `tests/ui/card-window.test.ts`

### `critical` — not in N2's table

- `critical` — `tests/ui/panel-card.test.ts`

### `current` — not in N2's table

- `current` — `tests/runtime/margometer-runtime.test.ts`

### `detach` — not in N2's table

- `detach` — `src/game/game-battle.ts`

### `dispatch` — not in N2's table

- `dispatch` — `tests/ui/panel-gesture.test.ts`

### `drag` — not in N2's table

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

### `error` — not in N2's table

- `error` — in 4 files: `src/`, `src/game/`, `tests/`

### `every` — not in N2's table

- `every` — `src/game/browser-time.ts`, `tests/runtime-world.ts`,
  `tests/runtime/margometer-runtime.test.ts`

### `fall` — not in N2's table

- `fall` — `tests/game/browser-frame.test.ts`

### `feed` — not in N2's table

- `feed` — `tests/e2e/game-page.ts`, `tests/e2e/panel-fixture.ts`

### `find` — not in N2's table

- `find` — `tests/game/game-tooltip.test.ts`, `tests/rebuilding-battle.ts`
- `findByMark` — `tests/runtime/margometer-runtime.test.ts`
- `findGrip` — `tests/ui/panel-gesture.test.ts`
- `findKeptShelfRow` — `tests/runtime/margometer-runtime.test.ts`
- `findList` — `tests/runtime/margometer-runtime.test.ts`
- `findMarked` — `tests/ui/view-failure.test.ts`
- `findSheetDepartures` — `tests/ui/panel-look.test.ts`

### `fire` — not in N2's table

- `fire` — `tests/game/browser-interval.test.ts`, `tests/runtime/margometer-runtime.test.ts`

### `flags` — not in N2's table

- `flags` — `tests/tools/panel-giving-way.test.ts`

### `flush` — not in N2's table

- `flush` — `tests/runtime-world.ts`
- `flushFakeFrames` — `tests/fake-window.ts`

### `guarded` — not in N2's table

- `guarded` — `src/game/browser-time.ts`

### `headings` — not in N2's table

- `headings` — `tests/ui/panel-element.test.ts`

### `heads` — not in N2's table

- `heads` — `tests/ui/panel-element.test.ts`

### `held` — not in N2's table

- `held` — `tests/ui/panel-element.test.ts`

### `helper` — not in N2's table

- `helperBarNow` — `src/ui/panel-element.ts`

### `here` — not in N2's table

- `here` — `tests/runtime/margometer-runtime.test.ts`

### `hero` — not in N2's table

- `hero` — `tests/game/game-hero.test.ts`

### `hide` — not in N2's table

- `hide` — `src/ui/panel-element.ts`

### `hold` — not in N2's table

- `hold` — `tools/capture-intake.ts`

### `keep` — not in N2's table

- `keep` — `src/runtime/shelf-keeper.ts`, `src/ui/panel-element.ts`,
  `tests/runtime/panel-frame.test.ts`
- `keepAll` — `tests/runtime/shelf.test.ts`

### `kept` — not in N2's table

- `kept` — `tests/ui/panel-look.test.ts`

### `launch` — not in N2's table

- `launchPanelBrowser` — `tests/e2e/panel-camera.ts`
- `launchShotBrowser` — `tools/panel-shots.ts`

### `layer` — not in N2's table

- `layerOf` — `tests/ui/panel-look.test.ts`

### `listed` — not in N2's table

- `listed` — `tests/runtime/shelf.test.ts`

### `load` — not in N2's table

- `load` — `tests/e2e/game-page.ts`

### `location` — not in N2's table

- `location` — `tests/game/browser-surroundings.test.ts`

### `lost` — not in N2's table

- `lost` — `tests/ui/panel-words.test.ts`

### `many` — not in N2's table

- `many` — `tests/ui/panel-words.test.ts`

### `map` — not in N2's table

- `map` — `tests/game/game-place.test.ts`

### `mark` — not in N2's table

- `markPanelDue` — `src/runtime/margometer-runtime.ts`
- `markStale` — `src/runtime/margometer-runtime.ts`, `tests/runtime/live-fight.test.ts`

### `marks` — not in N2's table

- `marksNow` — `tests/runtime/margometer-runtime.test.ts`

### `measure` — not in N2's table

- `measure` — `tests/e2e/panel-card.spec.ts`

### `mount` — not in N2's table

- `mountPanel` — `src/userscript-entry.ts`, `tests/runtime-world.ts`,
  `tests/runtime/margometer-runtime.test.ts`

### `move` — not in N2's table

- `moveShelf` — `src/runtime/shelf-keeper.ts`, `tests/runtime/panel-frame.test.ts`

### `named` — not in N2's table

- `named` — `tests/core/last-heal-rule.test.ts`, `tests/ui/panel-card.test.ts`

### `navigator` — not in N2's table

- `navigator` — `tests/game/browser-surroundings.test.ts`

### `notes` — not in N2's table

- `notesOf` — `tests/ui/panel-card.test.ts`

### `noughts` — not in N2's table

- `noughtsOf` — `tests/ui/panel-card.test.ts`

### `now` — not in N2's table

- `now` — `src/game/browser-time.ts`, `tests/game/browser-clock.test.ts`

### `other` — not in N2's table

- `other` — `tests/ui/card-window.test.ts`

### `padded` — not in N2's table

- `padded` — `tests/runtime/settings.test.ts`

### `panel` — not in N2's table

- `panel` — `tests/e2e/panel-fixture.ts`

### `pin` — not in N2's table

- `pin` — `src/runtime/shelf-keeper.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/runtime/panel-frame.test.ts`

### `pinned` — not in N2's table

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

### `press` — not in N2's table

- `press` — `tests/runtime-world.ts`
- `pressElement` — `tests/fake-document.ts`
- `pressSave` — `tests/runtime/margometer-runtime.test.ts`

### `prevent` — not in N2's table

- `preventDefault` — `tests/fake-document.ts`

### `query` — not in N2's table

- `querySelectorAll` — `src/userscript-entry.ts`, `tests/fake-window.ts`

### `refuse` — not in N2's table

- `refuse` — `tests/game/browser-store.test.ts`, `tests/runtime/settings.test.ts`

### `refused` — not in N2's table

- `refused` — `tests/tools/protocol-key-shape.test.ts`

### `release` — not in N2's table

- `release` — `src/game/browser-file.ts`
- `releasePointerCapture` — `src/ui/panel-document.ts`, `tests/fake-document.ts`

### `reload` — not in N2's table

- `reloadRuntimeWorld` — `tests/runtime/margometer-runtime.test.ts`
- `reloadWithNoFightFed` — `tests/e2e/panel-fixture.ts`

### `remaining` — not in N2's table

- `remaining` — `tests/e2e/game-page.ts`, `tests/e2e/panel-fixture.ts`

### `replace` — not in N2's table

- `replaceChildren` — `src/ui/panel-document.ts`, `tests/fake-document.ts`
- `replaceState` — `tests/tools/preview-state.test.ts`
- `replaceWith` — `src/ui/panel-document.ts`, `tests/fake-document.ts`

### `request` — not in N2's table

- `requestAnimationFrame` — in 4 files: `src/game/`, `tests/`
- `requestFrame` — `src/game/browser-time.ts`, `tests/runtime-world.ts`,
  `tests/runtime/margometer-runtime.test.ts`

### `resets` — not in N2's table

- `resets` — `tests/ui/panel-element.test.ts`

### `revoke` — not in N2's table

- `revokeObjectURL` — `src/game/browser-file.ts`, `src/userscript-entry.ts`,
  `tests/game/browser-file.test.ts`

### `rewind` — not in N2's table

- `rewind` — `tests/e2e/game-page.ts`, `tests/e2e/panel-fixture.ts`

### `rotate` — not in N2's table

- `rotateShelf` — `src/runtime/shelf.ts`

### `route` — not in N2's table

- `routePanelPage` — `tests/e2e/panel-camera.ts`

### `row` — not in N2's table

- `row` — `tests/ui/panel-words.test.ts`

### `rows` — not in N2's table

- `rows` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`

### `run` — not in N2's table

- `runDevelopCommand` — `tools/develop-reports.ts`
- `runPlugin` — `tests/source-tree.ts`
- `runSimulation` — `tests/simulation.ts`
- `runSimulationStep` — `tests/simulation.ts`

### `said` — not in N2's table

- `said` — `tests/e2e/panel-fixture.ts`, `tests/ui/panel-words.test.ts`

### `saved` — not in N2's table

- `saved` — `tests/e2e/panel-fixture.ts`

### `select` — not in N2's table

- `selectDevelopMaterial` — `tools/develop-reports.ts`

### `send` — not in N2's table

- `send` — `tools/preview-server.ts`

### `settle` — not in N2's table

- `settle` — `src/ui/panel-element.ts`

### `sheet` — not in N2's table

- `sheet` — `tests/runtime/margometer-runtime.test.ts`

### `shouting` — not in N2's table

- `shouting` — `tests/ui/panel-words.test.ts`

### `sides` — not in N2's table

- `sides` — `tests/ui/panel-element.test.ts`, `tests/ui/view-failure.test.ts`

### `somebody` — not in N2's table

- `somebodyElse` — `tests/game/game-battle.test.ts`

### `speak` — not in N2's table

- `speak` — `tests/ui/panel-words.test.ts`

### `split` — not in N2's table

- `splitReportLines` — `tools/develop-reports.ts`

### `spy` — not in N2's table

- `spy` — `tests/ui/blow-vocabulary.test.ts`

### `stamp` — not in N2's table

- `stampBundleVersion` — `tools/build-userscript.ts`

### `standing` — not in N2's table

- `standing` — `tests/ui/panel-element.test.ts`

### `start` — not in N2's table

- `start` — `tests/runtime/engine-search.test.ts`, `tools/preview-server.ts`
- `startMargoMeter` — `src/userscript-entry.ts`

### `starts` — not in N2's table

- `starts` — `tests/runtime/engine-search.test.ts`

### `stated` — not in N2's table

- `stated` — `tests/tools/recorded-material.test.ts`
- `statedSkills` — `tests/runtime/panel-frame.test.ts`

### `stateless` — not in N2's table

- `stateless` — `tests/core/charged-skill.test.ts`

### `stop` — not in N2's table

- `stop` — `src/runtime/margometer-runtime.ts`, `tools/preview-server.ts`

### `stored` — not in N2's table

- `stored` — `tests/e2e/panel-fixture.ts`

### `style` — not in N2's table

- `style` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`

### `substitute` — not in N2's table

- `substitute` — `tools/capture-intake.ts`

### `subtitle` — not in N2's table

- `subtitleOf` — `tests/ui/panel-card.test.ts`

### `sum` — not in N2's table

- `sum` — `tests/ui/panel-content.test.ts`

### `suspicions` — not in N2's table

- `suspicions` — `tests/ui/view-failure.test.ts`

### `tell` — not in N2's table

- `tellPreviewListeners` — `tools/preview-server.ts`

### `tick` — not in N2's table

- `tick` — `tests/runtime/engine-search.test.ts`

### `timed` — not in N2's table

- `timed` — `tools/payload-cost.ts`

### `tip` — not in N2's table

- `tip` — `src/game/game-tooltip.ts`, `tests/game/game-tooltip.test.ts`,
  `tests/rebuilding-battle.ts`

### `to` — not in N2's table

- `toISOString` — `src/game/browser-time.ts`, `tests/game/browser-clock.test.ts`
- `toString` — `tests/userscript-entry.test.ts`

### `translate` — not in N2's table

- `translate` — `src/runtime/margometer-runtime.ts`, `tests/runtime/panel-frame.test.ts`

### `trigger` — not in N2's table

- `trigger` — `src/game/game-tooltip.ts`, `tests/game/game-tooltip.test.ts`,
  `tests/rebuilding-battle.ts`

### `unnamed` — not in N2's table

- `unnamedBefore` — `tests/ui/panel-element.test.ts`

### `unread` — not in N2's table

- `unread` — `tests/tools/decoding-status.test.ts`

### `update` — not in N2's table

- `update` — `tests/runtime-world.ts`
- `updateData` — in 5 files: `tests/`

### `user` — not in N2's table

- `userAgent` — `tests/game/browser-surroundings.test.ts`

### `view` — not in N2's table

- `view` — `tests/core/fight-session.test.ts`, `tests/game/recorded-session.test.ts`

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

- `wrap` — `src/game/game-battle.ts`
- `wrapOn` — `tests/game/game-battle.test.ts`

## Types

### `libs/`

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
- `DefenceMechanism` — `src/core/protocol-key.ts`
- `DestroyedStatistic` — `src/core/battle-event.ts`
- `FightEntryHealth` — `src/core/combatant-health.ts`
- `FightFigures` — `src/core/fight-figures.ts`
- `FightOutcome` — `src/core/fight-statistics.ts`
- `FightOutcomeEvent` — `src/core/battle-event.ts`
- `FightSession` — `src/core/fight-session.ts`
- `FightStandings` — `src/core/aura-standing.ts`
- `FightStatistics` — `src/core/fight-statistics.ts`
- `FightView` — `src/core/fight-session.ts`
- `FigureCut` — `src/core/fight-statistics.ts`
- `GrammarRefusal` — `src/core/fight-decoder.ts`
- `HealingToNamedCombatantEvent` — `src/core/battle-event.ts`
- `HealthChangeDecoded` — `src/core/fight-decoder.ts`
- `HealthChangeEvent` — `src/core/battle-event.ts`
- `HeldByShout` — `src/core/aura-standing.ts`
- `KeyMeaning` — `src/core/protocol-key.ts`
- `KeyReach` — `src/core/protocol-key.ts`
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

### `src/game/`

- `BrowserClock` — `src/game/browser-time.ts`
- `BrowserConsole` — `src/game/browser-console.ts`
- `BrowserConsolePort` — `src/game/browser-console.ts`
- `BrowserDate` — `src/game/browser-time.ts`
- `BrowserDateValue` — `src/game/browser-time.ts`
- `BrowserDownloads` — `src/game/browser-file.ts`
- `BrowserFileSink` — `src/game/browser-file.ts`
- `BrowserFrameScheduler` — `src/game/browser-time.ts`
- `BrowserFrames` — `src/game/browser-time.ts`
- `BrowserIntervalScheduler` — `src/game/browser-time.ts`
- `BrowserMoment` — `src/game/browser-time.ts`
- `BrowserScripts` — `src/game/game-build.ts`
- `BrowserStorage` — `src/game/browser-store.ts`
- `BrowserSurroundingsPort` — `src/game/browser-surroundings.ts`
- `BrowserTimers` — `src/game/browser-time.ts`
- `CaptureKept` — `src/game/fight-capture.ts`
- `CapturedCall` — `src/game/fight-capture.ts`
- `CapturedCombatant` — `src/game/warrior-snapshot.ts`
- `ChargeField` — `src/game/payload-envelope.ts`
- `DownloadAnchor` — `src/game/browser-file.ts`
- `EnvelopeFailure` — `src/game/payload-envelope.ts`
- `EnvelopeField` — `src/game/payload-envelope.ts`
- `FightCapture` — `src/game/fight-capture.ts`
- `FightPlace` — `src/game/fight-place.ts`
- `FileFailure` — `src/game/browser-file.ts`
- `FrameHandle` — `src/game/browser-time.ts`
- `GameBattle` — `src/game/game-battle.ts`
- `GameBattlePort` — `src/game/game-battle.ts`
- `GameBuildPort` — `src/game/game-build.ts`
- `GameDictionaryPort` — `src/game/game-dictionary.ts`
- `GameEngineCall` — `src/game/fight-capture.ts`
- `GameEngineFailure` — `src/game/game-battle.ts`
- `GameEngineField` — `src/game/game-hero.ts`, `src/game/game-place.ts`
- `GameHeroPort` — `src/game/game-hero.ts`
- `GamePlacePort` — `src/game/game-place.ts`
- `GameReadFailure` — `src/game/game-value.ts`
- `GameTooltipPort` — `src/game/game-tooltip.ts`
- `GameValue` — `src/game/game-value.ts`
- `GameWarriorEntries` — `src/game/payload-envelope.ts`
- `GameWarriorFailure` — `src/game/warrior-snapshot.ts`
- `GameWarriorField` — `src/game/payload-envelope.ts`
- `GameWarriorSnapshot` — `src/game/warrior-snapshot.ts`
- `HealthField` — `src/game/payload-envelope.ts`
- `HeldField` — `src/game/game-hero.ts`, `src/game/game-place.ts`
- `HeroField` — `src/game/game-hero.ts`
- `IntervalHandle` — `src/game/browser-time.ts`
- `KeyValueStore` — `src/game/browser-store.ts`
- `PayloadListener` — `src/game/game-battle.ts`
- `PlaceField` — `src/game/game-place.ts`
- `PreparedCapture` — `src/game/fight-capture.ts`
- `StoreFailure` — `src/game/browser-store.ts`
- `StoreKey` — `src/game/browser-store.ts`
- `TooltipTargets` — `src/game/game-tooltip.ts`
- `TooltipWritten` — `src/game/game-tooltip.ts`
- `WrapHandle` — `src/game/game-battle.ts`

### `src/runtime/`

- `Defect` — `src/runtime/defect-ledger.ts`
- `DefectCount` — `src/runtime/defect-ledger.ts`
- `DefectKind` — `src/runtime/defect-ledger.ts`
- `DefectLedger` — `src/runtime/defect-ledger.ts`
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
- `GameEngineSearch` — `src/runtime/margometer-runtime.ts`
- `Handover` — `src/runtime/fight-handover.ts`
- `HandoverPorts` — `src/runtime/fight-handover.ts`
- `KeeperState` — `src/runtime/shelf-keeper.ts`
- `KeptFight` — `src/runtime/shelf.ts`
- `KeptFightState` — `src/runtime/fight-state.ts`
- `LiveFight` — `src/runtime/live-fight.ts`
- `LiveFightOptions` — `src/runtime/live-fight.ts`
- `LiveHandover` — `src/runtime/fight-handover.ts`
- `LiveRow` — `src/runtime/panel-frame.ts`
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
- `ShelfWritten` — `src/runtime/shelf.ts`
- `ShownFight` — `src/runtime/fight-state.ts`
- `SizeField` — `src/runtime/settings.ts`
- `TooltipTables` — `src/runtime/carried-tooltip.ts`

### `src/ui/`

- `CardAcross` — `src/ui/panel-drag.ts`
- `CardCompose` — `src/ui/panel-element.ts`
- `CardContent` — `src/ui/panel-element.ts`
- `CardFigure` — `src/ui/panel-element.ts`
- `CardGroup` — `src/ui/panel-element.ts`
- `CardHandle` — `src/ui/panel-element.ts`
- `CardKeyPlace` — `src/ui/panel-element.ts`
- `CardLine` — `src/ui/panel-element.ts`
- `CardLookup` — `src/ui/panel-element.ts`
- `CardNoteTone` — `src/ui/panel-element.ts`
- `CardPlace` — `src/ui/panel-element.ts`
- `CardRedraw` — `src/ui/panel-element.ts`
- `CardRegister` — `src/ui/panel-element.ts`
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
- `UserscriptDocument` — `src/userscript-entry.ts`
- `WindowPart` — `src/userscript-entry.ts`

### `tools/`

- `AuraRow` — `tools/aura-standing.ts`
- `AuraSkill` — `tools/skill-table.ts`
- `BitRow` — `tools/aura-lifetime.ts`
- `BitShift` — `tools/game-readings.ts`
- `CachedClientSource` — `tools/game-client-source.ts`
- `CachedHelpArticle` — `tools/help-article.ts`
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
- `FabricatedElement` — `tools/fabricated-fight.ts`
- `FabricatedFight` — `tools/fabricated-fight.ts`
- `FabricatedSkill` — `tools/fabricated-fight.ts`
- `FabricatedTurn` — `tools/fabricated-fight.ts`
- `FabricatedWarrior` — `tools/fabricated-fight.ts`
- `FabricationEnding` — `tools/fabricated-fight.ts`
- `FabricationShape` — `tools/fabricated-fight.ts`
- `FabricationState` — `tools/fabricated-fight.ts`
- `FightCost` — `tools/payload-cost.ts`
- `FightMessages` — `tools/turn-reading.ts`
- `FrozenFiles` — `tools/frozen-files.ts`
- `FrozenHelpCounts` — `tools/help-article.ts`
- `FrozenSkillTable` — `tools/skill-table.ts`
- `GameChannel` — `tools/game-client-source.ts`
- `GivingWayFlags` — `tools/panel-giving-way.ts`
- `GrantedBlows` — `tools/skill-table.ts`
- `HelpClaim` — `tools/help-claim-register.ts`
- `HoldingBaseline` — `tools/shout-holding.ts`
- `HoldingReading` — `tools/shout-holding.ts`
- `HoldingRow` — `tools/shout-holding.ts`
- `Intake` — `tools/capture-intake.ts`
- `KeyDifference` — `tools/game-readings.ts`
- `KeyPlacement` — `tools/protocol-key-shape.ts`
- `KeyShape` — `tools/protocol-key-shape.ts`
- `KeyTally` — `tools/turn-reading.ts`
- `KeyValue` — `tools/protocol-key-shape.ts`
- `LightingRow` — `tools/aura-lifetime.ts`
- `MappingTask` — `tools/capture-intake.ts`
- `MessageTurn` — `tools/turn-reading.ts`
- `OpenRun` — `tools/aura-lifetime.ts`
- `OpenerTally` — `tools/turn-reading.ts`
- `PanelFight` — `tools/drill-report.ts`
- `PanelShot` — `tools/panel-shots.ts`
- `PanelShotRecord` — `tools/panel-shots.ts`
- `ParametersDecoded` — `tools/turn-reading.ts`
- `PreviewFightLink` — `tools/preview-page.ts`
- `PreviewInstall` — `tools/preview-page.ts`
- `PreviewInstallNeed` — `tools/preview-page.ts`
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
- `ReadingState` — `tools/game-readings.ts`
- `ReadingVerdict` — `tools/game-readings.ts`
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
- `UserscriptFiles` — `tools/build-userscript.ts`

### `tests/`

- `AstComment` — `tests/source-tree.ts`
- `AstNode` — `tests/source-tree.ts`
- `AstVisitor` — `tests/source-tree.ts`
- `BarPoint` — `tests/e2e/panel-probe.ts`
- `BlowKeys` — `tests/ui/blow-vocabulary.test.ts`
- `BrowserClock` — `tests/runtime/engine-search.test.ts`
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
- `EnginePresence` — `tests/e2e/game-page.ts`
- `EventEntries` — `tests/repository/event-entries.test.ts`
- `FakeElement` — `tests/fake-document.ts`
- `FakeGame` — `tests/runtime/live-fight.test.ts`
- `FakeWindow` — `tests/fake-window.ts`
- `FakeWindowOptions` — `tests/fake-window.ts`
- `FaultPlan` — `tests/simulation.ts`
- `FightReplay` — `tests/ui/level-drawn.test.ts`
- `FileNames` — `tests/repository/name-register.test.ts`
- `Held` — `tests/game/game-battle.test.ts`
- `HeldString` — `tests/repository/name-register.test.ts`
- `LabelClaim` — `tests/repository/protocol-keys.test.ts`
- `LayerStack` — `tests/e2e/panel-layer.spec.ts`
- `LayerStandIn` — `tests/e2e/panel-layer.spec.ts`
- `LevelWalk` — `tests/ui/level-drawn.test.ts`
- `LintContext` — `tests/source-tree.ts`
- `LintPlugin` — `tests/source-tree.ts`
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
- `PanelPageOptions` — `tests/e2e/game-page.ts`
- `PanelProbe` — `tests/e2e/game-page.ts`
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
- `Registry` — `tests/game/game-tooltip.test.ts`
- `RowPlace` — `tests/ui/level-drawn.test.ts`
- `RuleName` — `tests/repository/documents.test.ts`
- `RunningStatement` — `tests/core/last-heal-rule.test.ts`
- `RuntimeWorld` — `tests/runtime-world.ts`
- `Section` — `tests/repository/declaration-order.test.ts`, `tests/ui/share-column.test.ts`
- `ShareReport` — `tests/core/absorption-destruction-rule.test.ts`
- `ShareRow` — `tests/ui/share-column.test.ts`
- `SheetDeparture` — `tests/ui/panel-look.test.ts`
- `SheetRule` — `tests/style-sheet.ts`
- `SimulationReport` — `tests/simulation.ts`
- `SkillHeader` — `tests/repository/documents.test.ts`
- `SourceFile` — `tests/source-tree.ts`
- `Told` — `tests/runtime/engine-search.test.ts`
- `TooltipRegistry` — `tests/rebuilding-battle.ts`
- `TopItem` — `tests/repository/declaration-order.test.ts`
- `Vocabulary` — `tests/repository/name-register.test.ts`
- `WitnessReading` — `tests/core/health-witness.test.ts`
- `Wound` — `tests/game/browser-interval.test.ts`

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
- `JsonTextAbsent` — `libs/json-text.ts`
- `JsonUnreadable` — `libs/json-text.ts`
- `JsonUnwritable` — `libs/json-text.ts`

### `src/core/`

- `CombatantsExceeded` — `src/core/fight-session.ts`
- `EndUnreadable` — `src/core/fight-decoder.ts`
- `EventsExceeded` — `src/core/fight-session.ts`
- `ParameterKeyEmpty` — `src/core/fight-decoder.ts`
- `PayloadsExceeded` — `src/core/fight-session.ts`
- `SegmentsExceeded` — `src/core/fight-decoder.ts`
- `UnreadMessage` — `src/core/fight-decoder.ts`

### `src/game/`

- `FileApiAbsent` — `src/game/browser-file.ts`
- `GameBattleAbsent` — `src/game/game-battle.ts`
- `GameEngineAbsent` — `src/game/game-battle.ts`
- `GameEngineAlreadyWrapped` — `src/game/game-battle.ts`
- `GameMethodAbsent` — `src/game/game-battle.ts`
- `GameValueAbsent` — `src/game/game-value.ts`
- `GameWarriorsAbsent` — `src/game/warrior-snapshot.ts`
- `GameWarriorsExceeded` — `src/game/warrior-snapshot.ts`
- `PayloadCombatantRepeated` — `src/game/payload-envelope.ts`
- `PayloadFieldMalformed` — `src/game/payload-envelope.ts`
- `PayloadFieldTooLong` — `src/game/payload-envelope.ts`
- `PayloadNotRecord` — `src/game/payload-envelope.ts`
- `SearchAbandoned` — `src/game/game-battle.ts`
- `StoreRefused` — `src/game/browser-store.ts`
- `StoreUnavailable` — `src/game/browser-store.ts`
- `StoreValueTooLong` — `src/game/browser-store.ts`
- `WrapCovered` — `src/game/game-battle.ts`

### `src/runtime/`

- `EverySlotPinned` — `src/runtime/shelf.ts`
- `FightAlreadyKept` — `src/runtime/shelf.ts`
- `FightNotKept` — `src/runtime/shelf.ts`
- `FiguresDisagreed` — `src/runtime/panel-frame.ts`
- `FileUnserializable` — `src/runtime/fight-file.ts`
- `RotationRefused` — `src/runtime/shelf.ts`
- `SettingTooLong` — `src/runtime/settings.ts`
- `SettingUnreadable` — `src/runtime/settings.ts`
- `ShelfUnreadable` — `src/runtime/shelf.ts`
- `ShelfUnwritable` — `src/runtime/shelf.ts`
- `ShelfVersionUnknown` — `src/runtime/shelf.ts`
- `ShownFightAbsent` — `src/runtime/fight-handover.ts`

### `src/ui/`

- `GestureDropped` — `src/ui/view-failure.ts`
- `MarkValueUnknown` — `src/ui/panel-intent.ts`
- `RegionUndrawn` — `src/ui/view-failure.ts`
- `WindowUnplaced` — `src/ui/view-failure.ts`

### `src/`

- `BrowserWindowUnusable` — `src/userscript-entry.ts`

### `tools/`

- `BuffBitTableError` — `tools/margometer-tool-error.ts`
- `CaptureIntakeError` — `tools/margometer-tool-error.ts`
- `CardHeightError` — `tools/margometer-tool-error.ts`
- `ChangelogError` — `tools/margometer-tool-error.ts`
- `DeclaredVersionError` — `tools/margometer-tool-error.ts`
- `DevelopReportError` — `tools/margometer-tool-error.ts`
- `DrillReportError` — `tools/margometer-tool-error.ts`
- `FabricatedFightError` — `tools/margometer-tool-error.ts`
- `GameReadingsError` — `tools/margometer-tool-error.ts`
- `GameSourceError` — `tools/margometer-tool-error.ts`
- `GameUnreachableError` — `tools/margometer-tool-error.ts`
- `GivingWayError` — `tools/margometer-tool-error.ts`
- `HelpArticleError` — `tools/margometer-tool-error.ts`
- `MargoMeterToolError` — `tools/margometer-tool-error.ts`
- `PanelShotError` — `tools/margometer-tool-error.ts`
- `PayloadCostError` — `tools/margometer-tool-error.ts`
- `PreviewServeError` — `tools/margometer-tool-error.ts`
- `ProtocolKeyShapeError` — `tools/margometer-tool-error.ts`
- `ProtocolKeyTableError` — `tools/margometer-tool-error.ts`
- `RecordingReadError` — `tools/margometer-tool-error.ts`
- `SkillTableError` — `tools/margometer-tool-error.ts`
- `TurnCountError` — `tools/margometer-tool-error.ts`
- `TurnReadingError` — `tools/margometer-tool-error.ts`
- `UserscriptBuildError` — `tools/margometer-tool-error.ts`

## Other classes

### `tests/`

- `Navigator` — `tests/game/browser-surroundings.test.ts`

## Module constants

### `libs/`

- `CHARACTERS_MAXIMUM` — `libs/html-text.ts`
- `ENTITIES` — `libs/html-text.ts`
- `FIELD_TYPE` — `libs/unknown-value.ts`
- `JAVASCRIPT_QUOTES` — `libs/text-walk.ts`
- `LITERAL_CHARACTERS_MAXIMUM` — `libs/text-walk.ts`
- `LOWER_CASE_OFFSET` — `libs/html-text.ts`
- `MINUS` — `libs/number-text.ts`
- `POINT` — `libs/number-text.ts`
- `RAW_TEXT_ELEMENTS` — `libs/html-text.ts`
- `TAGS_MAXIMUM` — `libs/html-text.ts`
- `TAG_CLOSE` — `libs/html-text.ts`
- `TAG_OPEN` — `libs/html-text.ts`
- `TAG_TERMINATOR` — `libs/html-text.ts`
- `WHITESPACE` — `libs/text-walk.ts`

### `src/core/`

- `AMBIGUOUS` — `src/core/combatant-roster.ts`
- `APPLIED_SIGN` — `src/core/protocol-key.ts`
- `AURA_REACH` — `src/core/aura-standing.ts`
- `BATTLE_EVENT` — `src/core/battle-event.ts`
- `BLOWS_GRANTED_MAXIMUM` — `src/core/fight-decoder.ts`
- `CARRIERS_MAXIMUM` — `src/core/carried-status.ts`
- `CHARGED_SKILLS_MAXIMUM` — `src/core/charged-skill.ts`
- `CHARGED_SKILL_STATE` — `src/core/charged-skill.ts`
- `CHARGE_BROKEN_KEY` — `src/core/protocol-key.ts`
- `COMBATANTS_MAXIMUM` — `src/core/combatant-roster.ts`
- `CRITICAL_KEY` — `src/core/protocol-key.ts`
- `CRITICAL_OF_KEY` — `src/core/protocol-key.ts`
- `CRITICAL_PROC_KEYS` — `src/core/protocol-key.ts`
- `CUT_MAXIMUM` — `src/core/fight-statistics.ts`
- `DAMAGE_ELEMENT_PREFIX` — `src/core/fight-decoder.ts`
- `DAMAGE_HALF` — `src/core/protocol-key.ts`
- `DAMAGE_KEYS` — `src/core/protocol-key.ts`
- `DAMAGE_MARKER` — `src/core/protocol-key.ts`
- `DAMAGE_MARKER_AT` — `src/core/protocol-key.ts`
- `DECIMAL_BASE` — `src/core/combatant-health.ts`
- `DECLARATION_KEYS` — `src/core/protocol-key.ts`
- `DEFENCE_MECHANISM` — `src/core/protocol-key.ts`
- `DEFENCE_MECHANISM_BY_DEFENCE` — `src/core/protocol-key.ts`
- `DEFENCE_MECHANISM_BY_KEY` — `src/core/protocol-key.ts`
- `DESTROYED_KEYS` — `src/core/protocol-key.ts`
- `ENDS_MAXIMUM` — `src/core/combatant-health.ts`, `src/core/fight-decoder.ts`
- `HALF_PLACE` — `src/core/combatant-health.ts`
- `HALVED_FOR_THE_CASTER` — `src/core/carried-figure.ts`
- `HASTE_AURA_KEY` — `src/core/protocol-key.ts`
- `HASTE_BIT_NAME` — `src/core/carried-figure.ts`
- `HEALING_REDUCER_KEY` — `src/core/protocol-key.ts`
- `HEALTH_CHANGE_BY_KEY` — `src/core/protocol-key.ts`
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
- `LASTHEAL_KEY` — `src/core/protocol-key.ts`
- `MEMBER_SEPARATOR` — `src/core/fight-decoder.ts`
- `MESSAGES_MAXIMUM` — `src/core/fight-decoder.ts`
- `MESSAGE_END` — `src/core/fight-decoder.ts`
- `NAMED_DAMAGE_MEMBERS` — `src/core/fight-decoder.ts`
- `NAMED_HEALING_MEMBERS` — `src/core/fight-decoder.ts`
- `NAME_LENGTH_MAXIMUM` — `src/core/fight-decoder.ts`
- `NAME_SEPARATOR` — `src/core/protocol-key.ts`
- `NO_CARRIED_STATUS_WALK` — `src/core/carried-status.ts`
- `NO_COMBATANT` — `src/core/fight-decoder.ts`
- `NO_LEGENDARY_WALK` — `src/core/legendary-standing.ts`
- `NO_TURN_STANDING` — `src/core/turn-clock.ts`
- `NO_UNREAD` — `src/core/fight-session.ts`
- `NO_WINNER` — `src/core/fight-decoder.ts`
- `OUTCOME_RESULT` — `src/core/battle-event.ts`
- `PERCENT_CLOSER` — `src/core/fight-decoder.ts`
- `PERCENT_OPENER` — `src/core/fight-decoder.ts`
- `PERCENT_WHOLE` — `src/core/combatant-health.ts`
- `POINT` — `src/core/protocol-number.ts`
- `PREPARE_KEY` — `src/core/protocol-key.ts`
- `PROCS_MAXIMUM` — `src/core/fight-statistics.ts`
- `PROCS_WITH_VALUE` — `src/core/protocol-key.ts`
- `PROC_END` — `src/core/protocol-key.ts`
- `PROC_END_BY_KEY` — `src/core/protocol-key.ts`
- `PROVOCATION_KEY` — `src/core/protocol-key.ts`
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
- `SKILLS_MAXIMUM` — `src/core/fight-statistics.ts`
- `SKILL_ID_KEY` — `src/core/protocol-key.ts`
- `SLOW_ALL_KEY` — `src/core/protocol-key.ts`
- `SLOW_BIT_NAME` — `src/core/carried-figure.ts`
- `SOURCES_COUNTED` — `src/core/carried-figure.ts`
- `SOURCES_MAXIMUM` — `src/core/carried-figure.ts`
- `STANDINGS_MAXIMUM` — `src/core/aura-standing.ts`
- `STATUS_BITS_MAXIMUM` — `src/core/carried-status.ts`
- `STEP_KEY` — `src/core/protocol-key.ts`
- `TEXT_KEY` — `src/core/protocol-key.ts`
- `TURN_LOST_SEPARATOR` — `src/core/fight-decoder.ts`
- `UNREAD_CAUSE` — `src/core/battle-event.ts`
- `VALUELESS_DECLARATION_KEYS` — `src/core/protocol-key.ts`
- `VALUE_SEPARATOR` — `src/core/fight-decoder.ts`
- `WOUND_ANNOUNCEMENT_KEY` — `src/core/protocol-key.ts`
- `WOUND_TICK_KEY` — `src/core/protocol-key.ts`

### `src/game/`

- `APPEND_METHOD` — `src/game/game-tooltip.ts`
- `BATTLE_FIELD` — `src/game/game-battle.ts`
- `BRAND` — `src/game/browser-console.ts`
- `BUILD_CHARACTERS_MINIMUM` — `src/game/game-build.ts`
- `CALLS_MAXIMUM` — `src/game/fight-capture.ts`
- `CHARGE_FIELDS` — `src/game/payload-envelope.ts`
- `CLIENT_BREAK` — `src/game/game-tooltip.ts`
- `COPIED_KEYS` — `src/game/warrior-snapshot.ts`
- `DAY_MAXIMUM` — `src/game/browser-time.ts`
- `DIRECTION_SIGNS` — `src/game/game-dictionary.ts`
- `DOWNLOAD_ANCHOR_CLASS` — `src/game/browser-file.ts`
- `ENGINE_CALL_FIELD` — `src/game/game-battle.ts`
- `ENGINE_FIELD` — `src/game/game-battle.ts`
- `ENGINE_FIELDS` — `src/game/game-hero.ts`, `src/game/game-place.ts`
- `ENTRY_LENGTH_MAXIMUM` — `src/game/game-dictionary.ts`
- `ENVELOPE_KEYS` — `src/game/payload-envelope.ts`
- `FAILURES_MAXIMUM` — `src/game/game-battle.ts`
- `FILE_TYPE` — `src/game/browser-file.ts`
- `FIND_METHOD` — `src/game/game-tooltip.ts`
- `FIRST_MONTH_OFFSET` — `src/game/browser-time.ts`
- `FULL_STOP` — `src/game/game-dictionary.ts`
- `GAME_VALUE` — `src/game/game-value.ts`
- `HEALTH_FIELDS` — `src/game/payload-envelope.ts`
- `HELD_FIELDS` — `src/game/game-hero.ts`, `src/game/game-place.ts`
- `HERO_FIELDS` — `src/game/game-hero.ts`
- `HOLE_MARK` — `src/game/game-dictionary.ts`
- `HOST_FIELD` — `src/game/browser-surroundings.ts`
- `HOST_SEPARATOR` — `src/game/browser-surroundings.ts`
- `HOUR_MAXIMUM` — `src/game/browser-time.ts`
- `IDENTITY_KEYS` — `src/game/warrior-snapshot.ts`
- `LOCATION_FIELD` — `src/game/browser-surroundings.ts`
- `LOOKS_MAXIMUM` — `src/game/game-build.ts`
- `MINUTE_MAXIMUM` — `src/game/browser-time.ts`
- `MONTH_MAXIMUM` — `src/game/browser-time.ts`
- `NAME_KEY` — `src/game/warrior-snapshot.ts`
- `NAVIGATOR_FIELD` — `src/game/browser-surroundings.ts`
- `NOTHING_CARRIED` — `src/game/payload-envelope.ts`
- `OPTIONAL_SEPARATOR` — `src/game/game-build.ts`
- `PLACE_FIELDS` — `src/game/game-place.ts`
- `QUEUE_ENTRIES_MAXIMUM` — `src/game/payload-envelope.ts`
- `READ_METHOD` — `src/game/game-tooltip.ts`
- `REPLACE_METHOD` — `src/game/game-tooltip.ts`
- `ROWS_WRITTEN_MAXIMUM` — `src/game/game-tooltip.ts`
- `SCRIPTS_MAXIMUM` — `src/game/game-build.ts`
- `SCRIPT_NAME_HEAD` — `src/game/game-build.ts`
- `SCRIPT_NAME_TAIL` — `src/game/game-build.ts`
- `SHALLOW_COPIED_KEYS` — `src/game/warrior-snapshot.ts`
- `SHAPE_KEYS_MAXIMUM` — `src/game/fight-capture.ts`
- `STORE_KEY` — `src/game/browser-store.ts`
- `STORE_KEYS` — `src/game/browser-store.ts`
- `STORE_VALUE_LENGTH_MAXIMUM` — `src/game/browser-store.ts`
- `TELL_EVENT` — `src/game/game-tooltip.ts`
- `TELL_METHOD` — `src/game/game-tooltip.ts`
- `TOOLTIP_TARGETS` — `src/game/game-tooltip.ts`
- `TRANSLATE_FIELD` — `src/game/game-dictionary.ts`
- `USER_AGENT_FIELD` — `src/game/browser-surroundings.ts`
- `WARRIOR_COLLECTIONS` — `src/game/warrior-snapshot.ts`
- `WARRIOR_ELEMENT_FIELD` — `src/game/game-tooltip.ts`
- `WARRIOR_FIELDS` — `src/game/payload-envelope.ts`
- `WARRIOR_ID_KEY` — `src/game/warrior-snapshot.ts`
- `WORLD_UNKNOWN` — `src/game/browser-surroundings.ts`
- `WRAPPED_METHOD` — `src/game/game-battle.ts`
- `WRAP_MARKER` — `src/game/game-battle.ts`
- `WRAP_VERSION` — `src/game/game-battle.ts`

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
- `SHELF_ANSWERS_MAXIMUM` — `src/runtime/panel-frame.ts`
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
- `BAR_TINT` — `src/ui/panel-look.ts`
- `CARDS_DRAWN_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_ATTRIBUTE` — `src/ui/panel-element.ts`
- `CARD_CUT_PARTS_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_GROUPS_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_KEY_PLACE` — `src/ui/panel-element.ts`
- `CARD_LINE` — `src/ui/panel-element.ts`
- `CARD_LINES_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_METRIC_WORDS` — `src/ui/panel-words.ts`
- `CARD_NOTE_TONE` — `src/ui/panel-element.ts`
- `CARD_NOTE_TONE_CLASS` — `src/ui/panel-element.ts`
- `CARD_PARTS_MAXIMUM` — `src/ui/panel-element.ts`
- `CARD_VARIABLES` — `src/ui/panel-look.ts`
- `CARD_WORDS` — `src/ui/panel-words.ts`
- `CAVEAT` — `src/ui/panel-words.ts`
- `CAVEATS` — `src/ui/panel-words.ts`
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
- `COUNTED_NOUNS` — `src/ui/panel-words.ts`
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
- `GRIP_MARK_BY_WINDOW` — `src/ui/panel-drag.ts`
- `HALF_NAMED_FIELD` — `src/ui/panel-content.ts`
- `HALF_NAMED_KIND_FIELD` — `src/ui/panel-content.ts`
- `HALF_NAMED_OPENED` — `src/ui/panel-content.ts`
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
- `HUNDRED` — `src/ui/panel-words.ts`
- `KIND_WORDS` — `src/ui/panel-screen.ts`
- `LABEL_CHARACTERS_MAXIMUM` — `src/ui/panel-words.ts`
- `LAYER` — `src/ui/panel-look.ts`
- `LEADING_STATUS_NAMES` — `src/ui/panel-words.ts`
- `LISTS_KEPT_MAXIMUM` — `src/ui/panel-element.ts`
- `LIST_ROWS_SIZED_MINIMUM` — `src/ui/panel-look.ts`
- `LIVE_FIGHT_MARK` — `src/ui/panel-intent.ts`
- `LIVE_FIGHT_OUTCOME` — `src/ui/panel-words.ts`
- `LIVE_FIGHT_TIME` — `src/ui/panel-words.ts`
- `LOW_CHANNEL` — `src/ui/panel-look.ts`
- `LOW_SLOPE` — `src/ui/panel-look.ts`
- `LUMINANCE_OFFSET` — `src/ui/panel-look.ts`
- `LUMINANCE_WEIGHTS` — `src/ui/panel-look.ts`
- `MARKUP_ENTITY` — `src/ui/panel-words.ts`
- `MARKUP_OPENER` — `src/ui/panel-words.ts`
- `MASK_INK` — `src/ui/panel-look.ts`
- `MINUS_SIGN` — `src/ui/panel-words.ts`
- `MONTH_WORDS` — `src/ui/panel-words.ts`
- `NAMED_ROWS_MAXIMUM` — `src/ui/panel-words.ts`
- `NEITHER_END_WORDS` — `src/ui/panel-words.ts`
- `NOBODY_TO_PAY` — `src/ui/panel-words.ts`
- `NOTE_MARK_CHARACTERS` — `src/ui/panel-element.ts`
- `NOTHING_SUSPECT` — `src/ui/panel-content.ts`
- `NOTHING_WORDS` — `src/ui/panel-words.ts`
- `NOUN_WORDS` — `src/ui/panel-words.ts`
- `NO_SELECTION` — `src/ui/panel-look.ts`
- `NO_WINDOW_SIZES` — `src/ui/panel-choice.ts`
- `OFFHAND_CRIT_KEY` — `src/ui/panel-element.ts`
- `OPENED_PART` — `src/ui/panel-screen.ts`
- `OPENED_UNNAMED_CASES` — `src/ui/panel-content.ts`
- `OPPONENT_WORDS` — `src/ui/panel-screen.ts`
- `OPTIONS_LIST_NAME` — `src/ui/panel-screen.ts`
- `OPTIONS_MARK` — `src/ui/panel-element.ts`
- `OUTCOME_WORDS` — `src/ui/panel-words.ts`
- `PALETTE_COLOURS` — `src/ui/panel-palette.ts`
- `PALETTE_INDEX_BY_PROFESSION` — `src/ui/panel-palette.ts`
- `PANEL_DEFECT_KIND` — `src/ui/panel-words.ts`
- `PANEL_DIRECTION` — `src/ui/panel-screen.ts`
- `PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM` — `src/ui/panel-look.ts`
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
- `ROW_WARNINGS` — `src/ui/panel-content.ts`
- `RULE_WIDTH` — `src/ui/panel-look.ts`
- `SAVE_MARK` — `src/ui/panel-element.ts`
- `SCREEN_AXES` — `src/ui/panel-screen.ts`
- `SCREEN_ORDER` — `src/ui/panel-screen.ts`
- `SHAPE` — `src/ui/panel-look.ts`
- `SHARES_MAXIMUM` — `src/ui/panel-words.ts`
- `SHARE_FLOOR` — `src/ui/panel-words.ts`
- `SHELF_MARK` — `src/ui/panel-element.ts`
- `SHELF_ROWS_MAXIMUM` — `src/ui/panel-element.ts`
- `SIDE_CHOICE` — `src/ui/panel-screen.ts`
- `SIDE_CHOICES` — `src/ui/panel-screen.ts`
- `SIDE_PART_WORDS` — `src/ui/panel-words.ts`
- `SIDE_RELATION` — `src/ui/panel-content.ts`
- `SIDE_ROWS` — `src/ui/panel-content.ts`
- `SIDE_WORDS` — `src/ui/panel-words.ts`
- `SIGNAL` — `src/ui/panel-palette.ts`
- `SIZED_PANEL_VARIABLES` — `src/ui/panel-look.ts`
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
- `VISIBLE_MINIMUM` — `src/ui/panel-drag.ts`
- `WAITING_LIST_NAME` — `src/ui/panel-element.ts`
- `WARNINGS_MAXIMUM` — `src/ui/panel-content.ts`
- `WIDTH_TIMES_TYPE_MAXIMUM` — `src/ui/panel-drag.ts`
- `WINDOW_WORDS` — `src/ui/panel-words.ts`

### `src/`

- `ANCHOR_TAG` — `src/userscript-entry.ts`
- `BROWSER_WINDOW_PART` — `src/userscript-entry.ts`
- `BUILD_VERSION` — `src/build-version.ts`
- `SCRIPT_WITH_SOURCE` — `src/userscript-entry.ts`

### `frozen/`

- `FROZEN_AURA_TURNS` — `frozen/aura-turns.ts`
- `FROZEN_BLOWS_GRANTED` — `frozen/blows-granted.ts`
- `FROZEN_BUFF_BITS` — `frozen/buff-bits.ts`
- `FROZEN_HELP_PHRASES` — `frozen/help-phrases.ts`
- `FROZEN_PROTOCOL_KEYS` — `frozen/protocol-keys.ts`
- `FROZEN_SKILL_DURATIONS` — `frozen/skill-durations.ts`

### `tools/`

- `ACTS` — `tools/fabricated-fight.ts`
- `ADMITTED_MAXIMUM` — `tools/capture-intake.ts`
- `ANNOUNCEMENT_FAMILIES` — `tools/protocol-key-shape.ts`
- `ARGUMENTS_MAXIMUM` — in 4 files: `tools/`
- `ARGUMENT_SEPARATOR` — `tools/buff-bit-table.ts`
- `ARMOUR_BASE` — `tools/fabricated-fight.ts`
- `ARMOUR_DAMAGE` — `tools/fabricated-fight.ts`
- `ARMOUR_DAMAGE_PIERCED` — `tools/fabricated-fight.ts`
- `AURA_SKILLS` — `tools/fabricated-fight.ts`
- `BACKTICK` — `tools/help-claim-register.ts`
- `BARD_SONG` — `tools/fabricated-fight.ts`
- `BATTLE_EVENTS` — `tools/decoding-status.ts`
- `BLOCK_CLOSE` — `tools/protocol-key-table.ts`
- `BLOCK_OPEN` — `tools/protocol-key-table.ts`
- `BLOWS_GRANTED_KEY` — `tools/skill-table.ts`
- `BOLD` — `tools/protocol-key-shape.ts`
- `BROWSER_VARIABLE` — `tools/panel-shots.ts`
- `BUNDLE_ENTRY` — `tools/build-userscript.ts`
- `BUNDLE_NAME` — `tools/game-client-source.ts`
- `CACHE_DIRECTORY` — `tools/develop-reports.ts`
- `CACHE_ROOT` — `tools/game-client-source.ts`, `tools/help-article.ts`, `tools/skill-table.ts`
- `CALLS_MAXIMUM` — `tools/capture-intake.ts`
- `CALL_BEFORE_ENGLISH` — `tools/capture-intake.ts`
- `CALL_CLOSE` — `tools/buff-bit-table.ts`
- `CALL_OPEN` — `tools/buff-bit-table.ts`
- `CAPTION_WIDTH` — `tools/decoding-status.ts`, `tools/fight-figures.ts`
- `CARDS_MAXIMUM` — `tools/card-height.ts`
- `CARDS_TALL_MINIMUM_PIXELS` — `tools/preview-site.ts`
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
- `CHANNEL` — `tools/game-readings.ts`
- `CHANNEL_HOSTS` — `tools/game-client-source.ts`
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
- `COMPLETE_MARK` — `tools/develop-reports.ts`
- `CONFIGURATION_FILE` — `tools/build-userscript.ts`, `tools/changelog.ts`, `tools/preview-site.ts`
- `CONTEXT_CHARACTERS` — `tools/help-article.ts`
- `CONTEXT_LINES` — `tools/develop-reports.ts`
- `COPIED` — `tools/panel-giving-way.ts`
- `COUNT_RULE_STATED` — `tools/protocol-key-shape.ts`
- `COUNT_WIDTH` — in 5 files: `tools/`
- `COUNT_WORDS` — `tools/protocol-key-shape.ts`
- `CUT_PARTS_MAXIMUM` — `tools/fight-figures.ts`
- `DAMAGE_FAMILY_HEADING` — `tools/protocol-key-shape.ts`
- `DATE_INDENT` — `tools/frozen-files.ts`
- `DATE_NOTE` — `tools/skill-table.ts`
- `DATE_SEPARATOR` — `tools/frozen-files.ts`
- `DAY_SHAPE` — `tools/capture-intake.ts`
- `DECODER_TABLES` — `tools/recorded-material.ts`
- `DECODING_TASK` — `tools/develop-reports.ts`
- `DEFAULT_BRANCH_SHAPES` — `tools/protocol-key-table.ts`
- `DEFAULT_INTO` — `tools/panel-giving-way.ts`
- `DEFAULT_PORT` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `DESCRIPTION_FIELD` — `tools/capture-intake.ts`
- `DETAIL_INDENT` — `tools/fight-figures.ts`
- `DEVELOPMENT_SUFFIX` — `tools/build-userscript.ts`
- `DEVELOP_PATHS` — `tools/develop-reports.ts`
- `DEVELOP_RECORDINGS` — `tools/develop-reports.ts`
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
- `ESCAPE` — `tools/protocol-key-table.ts`
- `EXIT_AHEAD` — `tools/game-readings.ts`
- `EXIT_STALE` — `tools/game-readings.ts`
- `EXIT_UNASKED` — `tools/game-readings.ts`
- `FABRICATED_AT` — `tools/fabricated-fight.ts`
- `FABRICATED_DIRECTORY` — `tools/fabricated-fight.ts`
- `FABRICATED_WORLD` — `tools/fabricated-fight.ts`
- `FABRICATION_ENDING` — `tools/fabricated-fight.ts`
- `FABRICATION_ENDINGS` — `tools/fabricated-fight.ts`
- `FABRICATION_FIELDS` — `tools/fabricated-fight.ts`
- `FABRICATION_SCRIPT` — `tools/fabricated-fight.ts`
- `FAILURE_LINE` — `tools/preview-server.ts`
- `FIELDS_PER_ABILITY` — `tools/capture-intake.ts`
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
- `FROZEN_BUFF_BANNER` — `tools/buff-bit-table.ts`
- `FROZEN_DATE_FIELD` — in 4 files: `tools/`
- `FROZEN_HELP_BANNER` — `tools/help-article.ts`
- `FROZEN_KEY_BANNER` — `tools/protocol-key-table.ts`
- `FROZEN_PATH` — in 4 files: `tools/`
- `FROZEN_SKILL_BANNER` — `tools/skill-table.ts`
- `GAME_CHANNEL` — `tools/game-client-source.ts`
- `GAME_CHANNELS` — `tools/game-client-source.ts`
- `GAME_DOMAINS` — `tools/build-userscript.ts`
- `GAME_PAGE_COLOUR` — `tools/preview-page.ts`
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
- `INSTALL_NEEDS_MAXIMUM` — `tools/preview-page.ts`
- `INTAKE_KEYS` — `tools/capture-intake.ts`
- `KEEP_ALIVE_EVERY_MILLISECONDS` — `tools/preview-server.ts`
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
- `LISTENERS_MAXIMUM` — `tools/preview-server.ts`
- `LOCALE` — `tools/help-article.ts`
- `LOOKS_MAXIMUM` — `tools/buff-bit-table.ts`, `tools/protocol-key-table.ts`
- `LOOT_SENTENCE` — `tools/fabricated-fight.ts`
- `MANA_STATED` — `tools/fabricated-fight.ts`
- `MANIFEST_FIELDS` — `tools/game-client-source.ts`
- `MANIFEST_NAME` — `tools/game-client-source.ts`, `tools/help-article.ts`, `tools/skill-table.ts`
- `MECHANICS_ARTICLE` — `tools/help-article.ts`
- `METADATA_DOWNLOAD_ADDRESS` — `tools/build-userscript.ts`
- `METADATA_NAME` — `tools/build-userscript.ts`
- `MICROSECONDS_PER_MILLISECOND` — `tools/payload-cost.ts`
- `MILLISECONDS_PER_DAY` — `tools/help-article.ts`
- `NAMES_MAXIMUM` — `tools/capture-intake.ts`
- `NAME_CHARACTERS` — `tools/protocol-key-table.ts`
- `NAME_COLUMN` — `tools/game-readings.ts`
- `NAME_WIDTH` — in 5 files: `tools/`
- `NOBODY_NAMED` — `tools/drill-report.ts`
- `NON_GAME_HOSTS` — `tools/build-userscript.ts`
- `NOTHING` — `tools/fight-figures.ts`
- `NOTHING_ARGUMENT` — `tools/buff-bit-table.ts`
- `NOTHING_CACHED` — `tools/game-readings.ts`
- `NOTHING_SETTLES` — `tools/aura-standing.ts`
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
- `OURS_ID_FIRST` — `tools/fabricated-fight.ts`
- `OUTBOUND_CALLS` — `tools/build-userscript.ts`
- `OUTCOME_LOSER_KEY` — `tools/fabricated-fight.ts`
- `OUTCOME_WINNER_KEY` — `tools/fabricated-fight.ts`
- `OUTPUT_DEFAULT` — `tools/fabricated-fight.ts`
- `OUTPUT_DIRECTORY` — `tools/build-userscript.ts`, `tools/preview-site.ts`
- `OUTPUT_FLAG` — `tools/fabricated-fight.ts`
- `PAGE_NAME` — `tools/skill-table.ts`
- `PANEL_FILE` — `tools/panel-giving-way.ts`
- `PART_WIDTH` — `tools/drill-report.ts`
- `PATH_SEPARATOR` — `tools/fabricated-fight.ts`, `tools/recorded-material.ts`
- `PERCENTILE_TAIL` — `tools/payload-cost.ts`
- `PER_SIDE_DEFAULT` — `tools/fabricated-fight.ts`
- `PER_SIDE_FLAG` — `tools/fabricated-fight.ts`
- `PER_SIDE_MAXIMUM` — `tools/fabricated-fight.ts`
- `PHRASES_MAXIMUM` — `tools/help-claim-register.ts`
- `PLACEMENT_COLUMN` — `tools/protocol-key-shape.ts`
- `PLAIN_SKILLS` — `tools/fabricated-fight.ts`
- `PLAY_SECONDS` — `tools/preview-page.ts`
- `PLAY_STEP_MAXIMUM_MILLISECONDS` — `tools/preview-page.ts`
- `PLAY_STEP_MINIMUM_MILLISECONDS` — `tools/preview-page.ts`
- `PREVIEW_CHANNEL` — `tools/game-readings.ts`
- `PREVIEW_HOSTNAME` — `tools/preview-server.ts`
- `PREVIEW_INSTALL_OPENING` — `tools/preview-page.ts`
- `PREVIEW_SAID_SELECTOR` — `tools/preview-page.ts`
- `PREVIEW_SITE_INTRODUCTION` — `tools/preview-site.ts`
- `PREVIEW_SITE_WORDS` — `tools/preview-site.ts`
- `PREVIEW_SPLIT_SELECTOR` — `tools/preview-page.ts`
- `PREVIEW_STRIP_LAYER` — `tools/preview-page.ts`
- `PREVIEW_STRIP_SELECTOR` — `tools/preview-page.ts`
- `PREVIEW_TIPS_LAYER` — `tools/preview-page.ts`
- `PREVIEW_TIPS_WIDTH_PIXELS` — `tools/preview-page.ts`
- `PREVIEW_WORDS` — `tools/preview-server.ts`
- `PROFESSIONS` — `tools/fabricated-fight.ts`
- `REACH_WORDS` — `tools/aura-standing.ts`
- `READINGS_REPORTED` — `tools/game-readings.ts`
- `READING_VERDICT` — `tools/game-readings.ts`
- `REBUILD_QUIET_MILLISECONDS` — `tools/preview-server.ts`
- `RECORDINGS_MAXIMUM` — `tools/recorded-material.ts`, `tools/turn-count.ts`,
  `tools/turn-reading.ts`
- `RECORDING_SUFFIX` — `tools/capture-intake.ts`, `tools/recorded-material.ts`
- `REDUCTION_BASE` — `tools/fabricated-fight.ts`
- `REDUCTION_PER_PLACE` — `tools/fabricated-fight.ts`
- `REGIONS_ASKED_MAXIMUM` — `tools/panel-giving-way.ts`
- `REGION_ANCHOR` — `tools/panel-giving-way.ts`
- `REGISTER_PATH` — `tools/help-claim-register.ts`
- `RELEASE_FLAG` — `tools/preview-site.ts`
- `RELEASE_INSTALL_NOTE` — `tools/changelog.ts`
- `RELOAD_SCRIPT` — `tools/preview-server.ts`
- `REMOVED_COUNT` — `tools/capture-intake.ts`
- `REMOVED_DESCRIPTION` — `tools/capture-intake.ts`
- `REMOVED_DESCRIPTIONS` — `tools/capture-intake.ts`
- `ROLE` — `tools/buff-bit-table.ts`
- `ROUNDS_DEFAULT` — `tools/fabricated-fight.ts`
- `ROUNDS_FLAG` — `tools/fabricated-fight.ts`
- `ROWS_MAXIMUM` — `tools/skill-table.ts`
- `ROW_BY_PART` — `tools/drill-report.ts`
- `ROW_OPEN` — `tools/skill-table.ts`
- `ROW_WIDTH` — `tools/drill-report.ts`
- `RUNG_WIDTH` — `tools/drill-report.ts`
- `RUNS` — `tools/payload-cost.ts`
- `RUNS_MAXIMUM` — `tools/aura-lifetime.ts`
- `SAYS_COLUMN` — `tools/game-readings.ts`
- `SCREEN_WIDTH` — `tools/drill-report.ts`
- `SCRIPT_TYPE` — `tools/preview-server.ts`
- `SEAM_GUTTER_PIXELS` — `tools/preview-site.ts`
- `SECTIONS_MAXIMUM` — `tools/develop-reports.ts`
- `SECTION_OPENER` — `tools/changelog.ts`
- `SEGMENT_INDEX` — `tools/protocol-key-table.ts`
- `SENTENCE_END` — `tools/protocol-key-shape.ts`
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
- `SIDE_OURS` — `tools/fabricated-fight.ts`
- `SIDE_THEIRS` — `tools/fabricated-fight.ts`
- `SILENCE_CLAIM` — `tools/help-claim-register.ts`
- `SILENT_MARK` — `tools/preview-page.ts`
- `SKILLS_ADDRESS` — `tools/skill-table.ts`
- `SKILLS_MAXIMUM` — `tools/aura-standing.ts`, `tools/fight-figures.ts`
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
- `STATUS_BITS_MAXIMUM` — `tools/buff-bit-table.ts`
- `STATUS_BIT_MAXIMUM` — `tools/fabricated-fight.ts`
- `STATUS_ROUNDS` — `tools/fabricated-fight.ts`
- `STEPS_MAXIMUM` — `tools/aura-lifetime.ts`
- `SUBSTITUTED_COUNT` — `tools/capture-intake.ts`
- `SWITCH_ANCHOR` — `tools/protocol-key-table.ts`
- `SWITCH_SUBJECT_TAIL` — `tools/protocol-key-table.ts`
- `TAB_DAMAGE_TAKEN` — `tools/panel-shots.ts`
- `TALLEST_LISTED` — `tools/card-height.ts`
- `TALLY_MAXIMUM` — `tools/decoding-status.ts`
- `TEXT_ENCODER` — `tools/preview-server.ts`
- `TEXT_NAME` — `tools/help-article.ts`
- `THEIRS_ID_FIRST` — `tools/fabricated-fight.ts`
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
- `VERDICT_WORDS` — `tools/game-readings.ts`
- `VERSION_HEADING_OPENER` — `tools/changelog.ts`
- `VIEWPORT` — `tools/panel-shots.ts`
- `WALK_BACK_MAXIMUM` — `tools/buff-bit-table.ts`
- `WATCHED_DIRECTORIES` — `tools/preview-server.ts`
- `WHOLE_PERCENT` — `tools/fabricated-fight.ts`
- `WINDOWS_ACROSS_PIXELS` — `tools/preview-page.ts`
- `WINDOWS_WAIT_EVERY_MILLISECONDS` — `tools/preview-site.ts`
- `WINDOWS_WAIT_TRIES` — `tools/preview-site.ts`
- `WITNESS_KEYS` — `tools/turn-count.ts`
- `WORD_EDGES` — `tools/protocol-key-shape.ts`
- `WOUND_WEAKENED_PERCENT` — `tools/fabricated-fight.ts`

### `tests/`

- `AA_GRAPHIC_RATIO` — `tests/ui/panel-look.test.ts`
- `AA_MARK_RATIO` — `tests/ui/panel-look.test.ts`
- `AA_TEXT_RATIO` — `tests/ui/panel-look.test.ts`
- `ABSENCE_CLAIM` — `tests/repository/protocol-keys.test.ts`
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
- `ANNOUNCEMENT` — in 4 files: `tests/`
- `ANNOUNCEMENT_ELSEWHERE` — `tests/core/fight-decoder.test.ts`
- `ANNOUNCEMENT_KEY` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/core/anguish-rule.test.ts`
- `ANNOUNCEMENT_KEYS` — `tests/core/granted-blow-rule.test.ts`
- `ANONYMOUS` — `tests/repository/broad-catches.test.ts`
- `ANOTHER` — `tests/runtime/margometer-runtime.test.ts`
- `ANSWERS` — `tests/e2e/panel-options.spec.ts`
- `ASSERT_MODULE` — `tests/repository/assert-imports.test.ts`
- `ASSERT_NAME` — `tests/repository/assert-imports.test.ts`
- `ASSERT_PACKAGE` — `tests/repository/assert-imports.test.ts`,
  `tests/repository/reader-layer.test.ts`
- `ATTACKER` — `tests/core/injure-rule.test.ts`
- `AT_A_TIME` — `tests/e2e/panel-level.spec.ts`, `tests/e2e/panel-states.spec.ts`
- `AURA` — `tests/core/fight-statistics.test.ts`
- `AUTO` — `tests/core/fight-decoder.test.ts`
- `A_FEW` — `tests/e2e/panel-states.spec.ts`
- `BACKTICK` — `tests/markdown-document.ts`, `tests/repository/captured-fight-register.test.ts`,
  `tests/tools/drill-report.test.ts`
- `BACKTICK_BUNDLE` — `tests/tools/protocol-key-table.test.ts`
- `BACK_ANYWHERE_NOTE` — `tests/e2e/panel-card.spec.ts`
- `BACK_NOTE` — `tests/e2e/panel-card.spec.ts`
- `BANDAGE` — `tests/core/bandage-rule.test.ts`
- `BAND_CLOSING` — `tests/tools/preview-site.test.ts`
- `BARE_BLOW` — `tests/core/fight-statistics.test.ts`
- `BARE_BLOW_AGAIN` — `tests/core/fight-statistics.test.ts`
- `BIT_CELLS` — `tests/tools/aura-lifetime.test.ts`
- `BLACK` — `tests/ui/panel-look.test.ts`
- `BLANK_ELEMENT` — `tests/core/fight-decoder.test.ts`
- `BLOCKED` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `BLOCK_OPENER` — `tests/repository/comment-share.test.ts`
- `BLOW` — `tests/core/charged-skill.test.ts`
- `BLOWS_GRANTED` — `tests/frozen-tables.ts`
- `BLOW_AFTER` — `tests/core/fight-decoder.test.ts`
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
- `BROWSER_SUITE_DIRECTORY` — `tests/repository/import-paths.test.ts`
- `BROWSER_SUITE_PREFIXES` — `tests/repository/import-paths.test.ts`
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
- `CARRIED` — `tests/ui/blow-vocabulary.test.ts`
- `CARRYING_EVERYTHING` — `tests/ui/panel-words.test.ts`
- `CASE_OPENERS` — `tests/repository/declaration-order.test.ts`
- `CAST_HEADING` — `tests/repository/captured-fight-register.test.ts`
- `CATEGORY_STEMS` — `tests/repository/names.test.ts`
- `CAUSE` — `tests/repository/protocol-keys.test.ts`
- `CAUSES_MAXIMUM` — `tests/simulation.ts`
- `CAUSE_MARKER` — `tests/repository/protocol-keys.test.ts`
- `CAVEATED` — `tests/ui/panel-card.test.ts`
- `CELLS` — `tests/tools/shout-holding.test.ts`
- `CELL_LENGTH_MAXIMUM` — `tests/repository/design-tokens.test.ts`
- `CELL_MARK` — `tests/register-table.ts`, `tests/repository/documents.test.ts`
- `CELL_OPENER` — `tests/tools/drill-report.test.ts`
- `CELL_SEPARATOR` — `tests/markdown-document.ts`, `tests/tools/drill-report.test.ts`,
  `tests/verb-purities.ts`
- `CENSUS_HEADING` — `tests/repository/captured-fight-register.test.ts`
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
- `CLIMB_MAXIMUM` — `tests/repository/nesting-depth.test.ts`
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
- `CRITICAL_ID` — `tests/game/game-dictionary.test.ts`
- `CUSTOM` — `tests/core/fight-decoder.test.ts`
- `CUSTOM_NAME_KEY` — `tests/core/skill-announcement-rule.test.ts`
- `CUT_BLOW` — `tests/ui/helper-window.test.ts`
- `CUT_HEADINGS` — `tests/ui/panel-element.test.ts`
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
- `DECLARED_ON_BLOW` — `tests/core/fight-decoder.test.ts`
- `DECLARED_ON_SKILL` — `tests/core/fight-decoder.test.ts`
- `DECLARING_NODES` — `tests/repository/name-register.test.ts`
- `DECODED_VERDICT` — `tests/tools/fabricated-fight.test.ts`
- `DEEPEST` — `tests/e2e/panel-crawl.spec.ts`
- `DEFAULT_ROUNDS` — `tests/tools/fabricated-fight.test.ts`
- `DELETE_OPERATOR` — `tests/repository/record-shapes.test.ts`
- `DENIED_TOOLS` — `tests/repository/documents.test.ts`
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
- `DOWN` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-reload.spec.ts`
- `DRAINED` — `tests/ui/panel-content.test.ts`
- `DUEL` — `tests/tools/fabricated-fight.test.ts`
- `DUET` — `tests/runtime/carried-tooltip.test.ts`
- `ELSEWHERE` — `tests/tools/protocol-key-shape.test.ts`
- `ELSEWHERE_KEYS` — `tests/core/granted-blow-rule.test.ts`
- `EMPTY` — `tests/runtime/shelf.test.ts`
- `ENDING` — `tests/e2e/panel-shelf.spec.ts`, `tests/e2e/panel-states.spec.ts`
- `ENDINGS` — `tests/repository/cited-paths.test.ts`
- `ENGINE_ANSWER` — `tests/e2e/game-page.ts`
- `ENGINE_FAILURE_ALREADY_WRAPPED` — `tests/e2e/panel-boot.spec.ts`
- `ENGINE_FAILURE_SEARCH_ABANDONED` — `tests/e2e/panel-boot.spec.ts`
- `ENGINE_LATE_MILLISECONDS` — `tests/e2e/game-page.ts`
- `ENTRIES` — `tests/repository/event-entries.test.ts`
- `ENTRY_CLOSERS` — `tests/repository/changelog.test.ts`
- `ENTRY_KINDS` — `tests/repository/changelog.test.ts`
- `ENTRY_MARK` — `tests/tools/aura-lifetime.test.ts`
- `ENVELOPE` — `tests/e2e/panel-save.spec.ts`
- `ERROR_NAME` — `tests/repository/throws.test.ts`
- `EVADED` — `tests/core/fight-statistics.test.ts`
- `EVIDENCE_DELEGATIONS` — `tests/repository/protocol-keys.test.ts`
- `EVIDENCE_MARKER` — `tests/repository/protocol-keys.test.ts`
- `EVIDENCE_PREFIX` — `tests/repository/name-register.test.ts`
- `EXCLUSIONS` — `tests/repository/fabricated-fights.test.ts`
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
- `FIRST` — `tests/runtime/defect-ledger.test.ts`
- `FIRST_MONTH` — `tests/ui/panel-words.test.ts`
- `FIRST_OF_A_PAIR` — `tests/runtime/margometer-runtime.test.ts`
- `FLED` — `tests/tools/fabricated-fight.test.ts`
- `FOLD_KEY` — `tests/e2e/panel-fold.spec.ts`, `tests/e2e/panel-reload.spec.ts`
- `FOLD_MARK` — `tests/e2e/panel-fold.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `FOUR_KINDS` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `FRAMES_FLUSHED_MAXIMUM` — `tests/e2e/game-page.ts`
- `FRAMES_MAXIMUM` — `tests/fake-window.ts`
- `FRAME_HEADING_OPENER` — `tests/repository/event-entries.test.ts`
- `FRONTMATTER_MARK` — `tests/repository/documents.test.ts`
- `FUNCTION_NODES` — `tests/source-tree.ts`
- `FUNCTION_VALUES` — `tests/repository/event-entries.test.ts`
- `GAME_BUILD` — `tests/e2e/game-page.ts`, `tests/runtime-world.ts`
- `GAME_INTERFACE_LAYER` — `tests/e2e/panel-layer.spec.ts`
- `GAME_KEYS` — `tests/ui/panel-words.test.ts`
- `GAME_SCRIPT_NAME` — `tests/e2e/game-page.ts`
- `GAME_WINDOW_LAYER_LOWEST` — `tests/e2e/panel-layer.spec.ts`
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
- `HEAL_TARGET` — `tests/core/fight-decoder.test.ts`
- `HELD_BUILD` — `tests/tools/game-readings.test.ts`
- `HELD_DATE` — `tests/tools/frozen-files.test.ts`
- `HELPER_GRIP` — `tests/e2e/panel-size.spec.ts`
- `HELPER_SIZE_KEY` — `tests/e2e/panel-size.spec.ts`
- `HELP_MARK` — `tests/tools/aura-lifetime.test.ts`
- `HEX_BASE` — `tests/ui/panel-look.test.ts`
- `HEX_COLOUR_LENGTH` — `tests/ui/panel-look.test.ts`
- `HEX_DIGITS` — `tests/ui/panel-look.test.ts`
- `HILDUR` — in 13 files: `tests/`
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
- `HOST_SELECTOR` — `tests/e2e/game-page.ts`
- `HUNDRED` — `tests/ui/share-bound.test.ts`, `tests/ui/share-column.test.ts`
- `ID_KEY` — `tests/core/granted-blow-rule.test.ts`
- `IGNORE_FILE` — `tests/repository/fabricated-fights.test.ts`
- `IMPORTS_ALLOWED` — `tests/repository/layers.test.ts`
- `IMPORT_NODES` — `tests/repository/declaration-order.test.ts`, `tests/source-tree.ts`
- `INK_GROUNDS` — `tests/ui/panel-look.test.ts`
- `INSTALL` — `tests/tools/preview-page.test.ts`
- `ITEMS_MAXIMUM` — `tests/repository/declaration-order.test.ts`
- `KEY` — `tests/core/absorption-destruction-rule.test.ts`, `tests/core/bandage-rule.test.ts`,
  `tests/core/npc-heal-rule.test.ts`
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
- `LONGEST_DECLARATION` — `tests/ui/panel-look.test.ts`
- `LONGEST_RULE` — `tests/style-sheet.ts`
- `LONG_PLACE` — `tests/e2e/panel-card.spec.ts`
- `LOOKS_STATED` — `tests/runtime/engine-search.test.ts`
- `LOOT` — `tests/core/fight-statistics.test.ts`
- `LOST` — `tests/core/fight-decoder.test.ts`
- `MANIFEST_PATH` — `tests/repository/name-register.test.ts`
- `MARKER_AT` — `tests/core/granted-blow-rule.test.ts`
- `MARKS_ON_THE_SCREENS` — `tests/e2e/panel-strips.spec.ts`
- `MAXIMUM_CARD_WIDTH` — `tests/ui/panel-drag.test.ts`
- `MAXIMUM_PRESSES` — `tests/e2e/panel-crawler.ts`
- `MEASURED` — `tests/tools/protocol-key-shape.test.ts`, `tests/tools/shout-holding.test.ts`
- `MEMBERS_BY_PART` — `tests/userscript-entry.test.ts`
- `MESSAGES_READ` — `tests/ui/panel-content.test.ts`
- `METADATA_NAME` — `tests/e2e/build-once.ts`
- `METHOD_NODES` — `tests/repository/event-entries.test.ts`
- `MILLISECONDS_PER_DAY` — `tests/tools/game-readings.test.ts`, `tests/tools/help-article.test.ts`
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
- `NAMES_PAST_THE_BOUND` — `tests/ui/panel-content.test.ts`
- `NAMES_TRIED` — `tests/ui/panel-scroll.test.ts`
- `NAME_FIELD` — `tests/repository/throws.test.ts`
- `NAME_KEY` — `tests/core/granted-blow-rule.test.ts`
- `NAME_KEYS` — `tests/repository/redacted-names.test.ts`
- `NAME_KIND` — `tests/repository/name-register.test.ts`
- `NAME_MARK` — `tests/source-tree.ts`
- `NAME_ON_ONE_LINE` — `tests/ui/card-window.test.ts`
- `NEGATIVE_HEAL` — `tests/core/fight-decoder.test.ts`
- `NEITHER_END` — `tests/ui/panel-content.test.ts`
- `NESTED_NODES` — `tests/source-tree.ts`
- `NESTED_RULES_NAME` — `tests/repository/documents.test.ts`
- `NESTING_DEPTH_MAXIMUM` — `tests/source-tree.ts`
- `NEVER_SAID` — `tests/e2e/panel-fixture.ts`
- `NEWER_BUNDLE` — `tests/tools/protocol-key-table.test.ts`
- `NEWER_PAGE` — `tests/tools/game-client-source.test.ts`
- `NEWEST` — `tests/runtime/fight-file.test.ts`
- `NOBODY` — `tests/core/combatant-roster.test.ts`, `tests/game/fight-capture.test.ts`,
  `tests/ui/panel-card.test.ts`
- `NOTHING` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`
- `NOTHING_CARRIED` — `tests/ui/panel-words.test.ts`
- `NOTHING_DRAWN` — `tests/ui/level-drawn.test.ts`
- `NOTHING_WAITING` — `tests/panel-view.ts`
- `NOTHING_YET` — `tests/e2e/panel-states.spec.ts`
- `NOT_A_BATTLE_KEY` — `tests/repository/protocol-keys.test.ts`
- `NOT_A_MESSAGE_KEY` — `tests/tools/fabricated-fight.test.ts`
- `NOT_KNOWN` — `tests/ui/level-drawn.test.ts`
- `NO_BUILD` — `tests/repository/captured-fight-register.test.ts`
- `NO_GAME_WORDS` — `tests/e2e/panel-boot.spec.ts`
- `NO_GRANTS` — `tests/core/fight-decoder.test.ts`, `tests/core/granted-blow-rule.test.ts`
- `NO_KIND` — `tests/simulation.ts`
- `NO_SHARE` — `tests/ui/share-column.test.ts`
- `NO_SNAPSHOTS` — `tests/game/recorded-session.test.ts`
- `NPC_HEAL` — `tests/core/npc-heal-rule.test.ts`
- `NUMBER_WIDTH` — `tests/repository/decisions.test.ts`
- `OLDER_BUNDLE` — `tests/tools/protocol-key-table.test.ts`
- `OLDER_PAGE` — `tests/tools/game-client-source.test.ts`
- `ONE_LINE_NOTE` — `tests/ui/card-window.test.ts`
- `OPENED_AT` — `tests/runtime/live-fight.test.ts`
- `OPENED_AT_A_PATH` — `tests/tools/preview-server.test.ts`
- `OPENERS_HEADING` — `tests/tools/turn-reading.test.ts`
- `OPENING` — `tests/core/fight-session.test.ts`
- `OPENS_NOTE` — `tests/e2e/panel-card.spec.ts`
- `OTHER` — `tests/runtime/screen-intent.test.ts`, `tests/tools/develop-reports.test.ts`
- `OTHER_NAME` — `tests/tools/develop-reports.test.ts`
- `OTHER_SCREEN` — `tests/e2e/panel-scroll.spec.ts`
- `OURS` — in 5 files: `tests/`
- `OUR_VOCABULARY` — `tests/ui/panel-words.test.ts`
- `OUTCOME` — `tests/core/message-grammar.test.ts`
- `OUTCOMES` — `tests/e2e/panel-states.spec.ts`
- `OVERFLOWING` — `tests/e2e/panel-scroll.spec.ts`
- `PAGE_CALL` — `tests/fake-window.ts`
- `PAGE_HEIGHT` — `tests/e2e/panel-scroll.spec.ts`
- `PAGE_ORIGIN` — `tests/e2e/panel-page.ts`
- `PAGE_WORLD` — `tests/e2e/panel-page.ts`
- `PALETTE_HEADING` — `tests/repository/design-tokens.test.ts`
- `PALETTE_LINES_BELOW` — `tests/repository/design-tokens.test.ts`
- `PANEL_GRIP` — `tests/e2e/panel-size.spec.ts`
- `PANEL_NOUNS` — `tests/ui/panel-words.test.ts`
- `PANEL_OUTCOMES` — `tests/ui/panel-words.test.ts`
- `PANEL_WIDTH` — `tests/ui/panel-drag.test.ts`
- `PANEL_WIDTH_VARIABLE` — `tests/e2e/panel-options.spec.ts`
- `PARRIED` — `tests/core/fight-statistics.test.ts`
- `PART_MARK` — `tests/repository/captured-fight-register.test.ts`
- `PART_WAY` — `tests/e2e/panel-drag.spec.ts`
- `PAST_THE_SEARCH` — `tests/e2e/panel-boot.spec.ts`
- `PATHS` — `tests/tools/frozen-files.test.ts`
- `PATHS_LISTED_MAXIMUM` — `tests/repository/name-register.test.ts`
- `PAYLOAD_HEADING_OPENER` — `tests/repository/event-entries.test.ts`
- `PERCENT` — `tests/simulation.ts`, `tests/tools/shout-holding.test.ts`
- `PERCENT_PLACES` — `tests/core/combatant-health.test.ts`
- `PERSON` — `tests/runtime/screen-intent.test.ts`
- `PICTURE_CLOSER` — `tests/repository/readmes.test.ts`
- `PICTURE_MARK` — `tests/repository/readmes.test.ts`
- `PIN_BY_ACTION` — `tests/repository/workflows.test.ts`
- `PIN_LINES_BELOW` — `tests/repository/workflows.test.ts`
- `PLACE` — `tests/runtime/live-fight.test.ts`
- `PLACES_TO_KEEP` — `tests/e2e/panel-strips.spec.ts`
- `PLACE_KEY` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-helper.spec.ts`,
  `tests/e2e/panel-reload.spec.ts`
- `PLACE_MARK` — `tests/repository/cited-paths.test.ts`
- `PLACE_NAME` — `tests/e2e/game-page.ts`
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
- `PREPARATION` — `tests/tools/turn-reading.test.ts`
- `PREPARE_ALONE` — `tests/core/fight-statistics.test.ts`
- `PREPARE_BESIDE` — `tests/core/fight-statistics.test.ts`
- `PREPARE_BLOW` — `tests/core/fight-statistics.test.ts`
- `PRINTABLE_FIRST` — `tests/repository/name-register.test.ts`
- `PRINTABLE_LAST` — `tests/repository/name-register.test.ts`
- `PROBE_NAME` — `tests/e2e/game-page.ts`
- `PROBE_ROSTER_TWO_SIDES` — `tests/core/fight-statistics.test.ts`
- `PROFESSIONS` — `tests/ui/panel-look.test.ts`, `tests/ui/panel-palette.test.ts`
- `PROMISE_NAME` — `tests/repository/synchronous-bundle.test.ts`
- `PUBLISHED_BYTES_MAXIMUM` — `tests/tools/build-userscript.test.ts`
- `PURITIES` — `tests/verb-purities.ts`
- `PURITY` — `tests/verb-purities.ts`
- `QUANTITY_FLOOR` — `tests/core/skill-announcement-rule.test.ts`
- `QUEUE_ENTRIES_MAXIMUM` — `tests/game/payload-envelope.test.ts`
- `QUOTE` — in 6 files: `tests/`
- `QUOTED_ROW_OPENER` — `tests/tools/turn-reading.test.ts`
- `QUOTES` — `tests/ui/panel-words.test.ts`
- `RANGE_MARK` — `tests/repository/captured-fight-register.test.ts`
- `REACH_CLOSER` — `tests/core/aura-standing.test.ts`
- `REACH_OPENER` — `tests/core/aura-standing.test.ts`
- `REACH_SOURCE` — `tests/core/aura-standing.test.ts`
- `READER_DIRECTORY` — `tests/repository/reader-layer.test.ts`
- `READER_FILES` — `tests/repository/reader-layer.test.ts`
- `READER_ID` — `tests/runtime/live-fight.test.ts`
- `READINGS_COMPARED` — `tests/core/health-witness.test.ts`
- `README_PATHS` — `tests/repository/readmes.test.ts`
- `READ_AT` — `tests/tools/game-readings.test.ts`, `tests/tools/help-article.test.ts`
- `READ_AT_MILLISECONDS` — `tests/tools/game-readings.test.ts`, `tests/tools/help-article.test.ts`
- `READ_BUILD` — `tests/tools/game-readings.test.ts`
- `READ_DATE` — `tests/tools/frozen-files.test.ts`
- `RECORDED_KEYS` — `tests/game/warrior-snapshot.test.ts`
- `RECORDINGS_DIRECTORY` — `tests/recording-sources.ts`
- `RECORDINGS_HEADING` — `tests/repository/captured-fight-register.test.ts`
- `RECORDING_EXTENSION` — `tests/recorded-fights.ts`
- `RECORDING_OPENER` — `tests/tools/turn-reading.test.ts`
- `RECORDING_SUFFIX` — `tests/repository/fabricated-fights.test.ts`
- `RECORD_NAME` — `tests/repository/decisions.test.ts`
- `REDUCER_KEY` — `tests/core/skill-announcement-rule.test.ts`
- `REDUCTION_NOTE` — `tests/ui/panel-card.test.ts`
- `REFUSAL` — `tests/game/browser-store.test.ts`, `tests/runtime/settings.test.ts`
- `REFUSED_CLOSING` — `tests/tools/fabricated-fight.test.ts`
- `REGISTER` — `tests/repository/protocol-keys.test.ts`, `tests/tools/protocol-key-shape.test.ts`
- `REGISTERED` — `tests/tools/protocol-key-shape.test.ts`
- `REGISTER_HEADING` — in 5 files: `tests/`
- `REGISTER_PATH` — in 8 files: `tests/`
- `RENDER_CALLERS` — `tests/repository/event-entries.test.ts`
- `RENDER_VERB` — `tests/repository/event-entries.test.ts`
- `REPLAY` — `tests/tools/fabricated-fight.test.ts`
- `REPORT` — `tests/tools/develop-reports.test.ts`
- `RESISTANCES_ON_SKILL` — `tests/core/fight-decoder.test.ts`
- `RESTORED_TO_A_STRANGER` — `tests/core/fight-statistics.test.ts`
- `RESTORED_TO_NOBODY` — `tests/core/fight-statistics.test.ts`
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
- `RUNTIME_TABLES` — `tests/runtime-world.ts`
- `RUN_MAXIMUM` — `tests/core/granted-blow-rule.test.ts`
- `SAID_OUT_OF` — `tests/ui/panel-words.test.ts`
- `SAME_PERCENT` — `tests/core/last-heal-rule.test.ts`
- `SAMPLE` — `tests/tools/protocol-key-shape.test.ts`
- `SCOPE_SUFFIXES` — `tests/repository/protocol-keys.test.ts`
- `SCREENS` — `tests/ui/panel-content.test.ts`
- `SCREENS_ON_A_FIGHT` — `tests/e2e/panel-crawl.spec.ts`
- `SECOND` — `tests/runtime/defect-ledger.test.ts`
- `SECONDARY_BUTTON` — `tests/ui/panel-gesture.test.ts`
- `SECOND_OF_A_PAIR` — `tests/runtime/margometer-runtime.test.ts`
- `SECTION` — `tests/repository/declaration-order.test.ts`
- `SECTIONS_BEFORE_THE_RULE` — `tests/repository/changelog.test.ts`
- `SECTIONS_PAST_THEIR_TAG` — `tests/repository/changelog.test.ts`
- `SECTION_HEADINGS` — `tests/repository/name-register.test.ts`
- `SECTION_MARKER` — `tests/repository/protocol-keys.test.ts`
- `SECTION_OPENER` — in 4 files: `tests/`
- `SECTION_RANKS` — `tests/repository/declaration-order.test.ts`
- `SENTENCE_ENDS` — `tests/repository/changelog.test.ts`
- `SEPARATORS` — `tests/repository/protocol-keys.test.ts`
- `SEPTEMBER` — `tests/game/browser-clock.test.ts`
- `SETTINGS_ID` — `tests/e2e/game-page.ts`
- `SHEET_DEPARTURES` — `tests/ui/panel-look.test.ts`
- `SHELF_KEY` — `tests/e2e/panel-shelf.spec.ts`
- `SHELL_MARK` — `tests/repository/cited-paths.test.ts`
- `SHORT` — in 4 files: `tests/`
- `SHORTENING` — `tests/ui/panel-look.test.ts`
- `SHORT_NAME` — `tests/tools/develop-reports.test.ts`
- `SHORT_WINDOW` — `tests/e2e/panel-card.spec.ts`
- `SHOTS_PATH` — `tests/repository/readmes.test.ts`
- `SHOUTED_LENGTH_MINIMUM` — `tests/repository/protocol-keys.test.ts`
- `SHOUTS` — `tests/core/aura-standing.test.ts`
- `SHOUT_HEADING` — `tests/tools/aura-standing.test.ts`
- `SHOWN_LIST` — `tests/shown-screen.ts`
- `SHUT_HEADING` — `tests/tools/drill-report.test.ts`
- `SHUT_OPENING` — `tests/tools/drill-report.test.ts`
- `SIBLING_PREFIX` — `tests/repository/import-paths.test.ts`, `tests/source-tree.ts`
- `SIDES_ON_A_FIGHT` — `tests/e2e/panel-strips.spec.ts`
- `SIDE_CHOICES` — `tests/ui/level-drawn.test.ts`
- `SIDE_COUNTED` — `tests/tools/drill-report.test.ts`
- `SIDE_IN_THE_NAME` — `tests/core/aura-standing.test.ts`
- `SIGNATURE_NODES` — `tests/repository/name-register.test.ts`
- `SIGNS` — `tests/repository/protocol-keys.test.ts`
- `SIZE_KEY` — `tests/e2e/panel-size.spec.ts`
- `SKILLS_DIRECTORY` — `tests/repository/documents.test.ts`
- `SKILLS_LINK` — `tests/repository/documents.test.ts`
- `SKILLS_LINK_TARGET` — `tests/repository/documents.test.ts`
- `SKILL_DESCRIPTION_OPENER` — `tests/repository/documents.test.ts`
- `SKILL_FILE_NAME` — `tests/repository/documents.test.ts`
- `SKILL_NAME_OPENER` — `tests/repository/documents.test.ts`
- `SLOW_BIT` — `tests/core/carried-figure.test.ts`
- `SOMEBODY` — `tests/game/fight-capture.test.ts`
- `SOMEBODY_ELSE` — `tests/core/legendary-standing.test.ts`
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
- `STANDING_FOLD_KEY` — `tests/e2e/panel-helper.spec.ts`
- `STANDING_PLACE_KEY` — `tests/e2e/panel-helper.spec.ts`
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
- `SUBTITLE_ON_ONE_LINE` — `tests/ui/card-window.test.ts`
- `SUPERSEDED_OPENER` — `tests/repository/decisions.test.ts`
- `SUPERSEDES_OPENER` — `tests/repository/decisions.test.ts`
- `SURROUNDINGS` — `tests/runtime/fight-file.test.ts`
- `SWOW_DOWN` — `tests/core/carried-status.test.ts`
- `TABLE` — `tests/repository/purity.test.ts`
- `TABLES` — `tests/core/granted-blow-rule.test.ts`, `tests/frozen-tables.ts`,
  `tests/ui/panel-words.test.ts`
- `TABLES_DATING_NOTHING` — `tests/runtime/margometer-runtime.test.ts`
- `TABLE_NAME_KEY` — `tests/core/skill-announcement-rule.test.ts`
- `TABLE_OPENER` — `tests/repository/design-tokens.test.ts`
- `TALLER` — `tests/e2e/panel-size.spec.ts`
- `TALLEST_LISTED` — `tests/tools/card-height.test.ts`
- `TERMINAL_DIRECTORIES` — `tests/repository/throws.test.ts`
- `TEST_VERSION` — `tests/panel-view.ts`
- `THEIRS` — in 6 files: `tests/`
- `THEN_NAME` — `tests/repository/synchronous-bundle.test.ts`
- `THIRD` — `tests/runtime/margometer-runtime.test.ts`
- `THIRD_BLOW` — `tests/core/fight-decoder.test.ts`
- `THREE_ATTACKERS` — `tests/core/injure-rule.test.ts`
- `THRESHOLD` — `tests/core/last-heal-rule.test.ts`
- `TICK_KEY` — `tests/core/anguish-rule.test.ts`, `tests/core/wound-rule.test.ts`
- `TICK_ON_THE_ANNOUNCER` — `tests/core/fight-decoder.test.ts`
- `TILE` — `tests/e2e/panel-card.spec.ts`
- `TIPS_PINNED_LEFT` — `tests/tools/preview-page.test.ts`
- `TITLE_OPENER` — `tests/repository/decisions.test.ts`
- `TOKENS` — `tests/ui/card-window.test.ts`
- `TOLERANCE` — `tests/core/bandage-rule.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/core/wound-rule.test.ts`
- `TOOLTIP_ROWS_MAXIMUM` — `tests/game/game-tooltip.test.ts`, `tests/ui/panel-words.test.ts`
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
- `UNSIZED_SHARE_KEY` — `tests/core/health-witness.test.ts`, `tests/core/last-heal-rule.test.ts`
- `USERSCRIPT_NAME` — `tests/e2e/build-once.ts`
- `USES_MARK` — `tests/repository/workflows.test.ts`
- `VARIABLE_OPENER` — `tests/ui/panel-look.test.ts`
- `VERB_ROW_OPENER` — `tests/verb-purities.ts`
- `VERSION` — `tests/tools/preview-site.test.ts`
- `VERSION_HEADING` — `tests/repository/changelog.test.ts`
- `VERSION_OPENER` — `tests/e2e/build-once.ts`
- `VICTIM` — `tests/core/injure-rule.test.ts`
- `VIEWPORT` — `tests/ui/panel-gesture.test.ts`
- `VIEWPORT_WIDTH` — `tests/tools/panel-shots.test.ts`
- `VISIBLE_LEAST` — `tests/e2e/panel-drag.spec.ts`
- `WARRIOR_FIELDS` — `tests/recorded-fights.ts`
- `WEAKENED_WOUND` — `tests/core/fight-decoder.test.ts`
- `WHEEL_DOWN` — `tests/e2e/panel-scroll.spec.ts`
- `WHITE` — `tests/ui/panel-look.test.ts`
- `WHOLE` — `tests/game/warrior-entries.test.ts`
- `WIDER` — `tests/e2e/panel-size.spec.ts`
- `WIDEST_SECTION` — `tests/ui/share-bound.test.ts`
- `WIDTH_DECLARATION` — `tests/tools/preview-site.test.ts`
- `WINDOW` — `tests/ui/panel-drag.test.ts`
- `WINDOW_HEIGHT` — `tests/e2e/panel-drag.spec.ts`
- `WINDOW_WIDTH` — `tests/e2e/panel-drag.spec.ts`
- `WITHOUT_ACTOR` — `tests/ui/full-cast-bound.test.ts`
- `WITHOUT_TARGET` — `tests/ui/full-cast-bound.test.ts`
- `WITNESSED` — `tests/core/carried-figure.test.ts`
- `WON` — `tests/core/fight-decoder.test.ts`
- `WORDS` — `tests/tools/preview-page.test.ts`
- `WORDS_HOLDING_NO_PLACE` — `tests/ui/level-drawn.test.ts`
- `WORKFLOWS_DIRECTORY` — `tests/repository/workflows.test.ts`
- `WORLD` — `tests/runtime-world.ts`
- `WOUND` — `tests/core/injure-rule.test.ts`, `tests/core/wound-rule.test.ts`
- `WRAP_FAILURES_MAXIMUM` — `tests/game/game-battle.test.ts`
- `WRITE_FLAG` — `tests/repository/name-register.test.ts`
- `gradesHeld` — `tests/tools/turn-count.test.ts`
- `lint` — `tests/source-tree.ts`
- `recordedFights` — `tests/recorded-fights.ts`
- `test` — `tests/e2e/panel-fixture.ts`
- `walksHeld` — `tests/tools/turn-reading.test.ts`

## Import aliases

### `libs/`

- `errors` — `libs/json-text.ts`

### `src/game/`

- `errors` — in 12 files: `src/game/`

### `src/runtime/`

- `errors` — in 7 files: `src/runtime/`

### `src/ui/`

- `errors` — in 4 files: `src/ui/`

### `src/`

- `errors` — `src/userscript-entry.ts`

### `tools/`

- `errors` — in 10 files: `tools/`
- `parseJsonc` — `tools/build-userscript.ts`

### `tests/`

- `BUFF_DATE_FIELD` — `tests/tools/frozen-files.test.ts`
- `HELP_DATE_FIELD` — `tests/tools/frozen-files.test.ts`
- `KEY_DATE_FIELD` — `tests/tools/frozen-files.test.ts`
- `SKILL_DATE_FIELD` — `tests/tools/frozen-files.test.ts`
- `SKILL_PATH` — `tests/tools/frozen-files.test.ts`
- `TICK_KEY` — `tests/core/injure-rule.test.ts`
- `base` — `tests/e2e/panel-fixture.ts`
- `errors` — in 20 files: `tests/`
- `parseJsonc` — `tests/repository/documents.test.ts`, `tests/repository/name-register.test.ts`
- `protocolKeys` — `tests/core/aura-standing.test.ts`

## Locals

### `libs/`

- `at` — `libs/text-walk.ts`
- `character` — `libs/html-text.ts`, `libs/text-walk.ts`
- `close` — `libs/html-text.ts`
- `collapsed` — `libs/html-text.ts`
- `digits` — `libs/number-text.ts`
- `end` — `libs/html-text.ts`, `libs/text-walk.ts`
- `entity` — `libs/html-text.ts`
- `folded` — `libs/html-text.ts`
- `from` — `libs/html-text.ts`
- `index` — `libs/html-text.ts`, `libs/text-walk.ts`
- `isUpper` — `libs/html-text.ts`
- `kept` — `libs/html-text.ts`
- `look` — `libs/html-text.ts`, `libs/text-walk.ts`
- `name` — `libs/html-text.ts`
- `open` — `libs/html-text.ts`
- `opening` — `libs/html-text.ts`, `libs/text-walk.ts`
- `parsed` — `libs/json-text.ts`
- `point` — `libs/number-text.ts`
- `text` — `libs/html-text.ts`, `libs/number-text.ts`, `libs/unknown-value.ts`
- `value` — `libs/json-text.ts`, `libs/number-text.ts`, `libs/unknown-value.ts`
- `withoutRawText` — `libs/html-text.ts`
- `written` — `libs/json-text.ts`

### `src/core/`

- `absorbed` — `src/core/fight-statistics.ts`
- `absorbedParts` — `src/core/fight-statistics.ts`
- `actor` — `src/core/fight-decoder.ts`
- `actorId` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `actorSegment` — `src/core/fight-decoder.ts`
- `amount` — `src/core/combatant-health.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `amountText` — `src/core/fight-decoder.ts`
- `amountsDescending` — `src/core/carried-figure.ts`
- `announced` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `announcedHere` — `src/core/fight-decoder.ts`
- `announcementStanding` — `src/core/fight-decoder.ts`
- `applied` — `src/core/fight-statistics.ts`
- `at` — `src/core/carried-figure.ts`, `src/core/fight-decoder.ts`
- `attack` — `src/core/fight-decoder.ts`
- `aura` — `src/core/carried-figure.ts`
- `band` — `src/core/combatant-health.ts`
- `bearer` — `src/core/carried-figure.ts`
- `bit` — `src/core/carried-figure.ts`, `src/core/carried-status.ts`
- `blow` — `src/core/fight-statistics.ts`
- `blowsGranted` — `src/core/fight-decoder.ts`
- `blowsRemaining` — `src/core/fight-decoder.ts`
- `byId` — `src/core/combatant-roster.ts`
- `cast` — `src/core/aura-standing.ts`
- `caster` — `src/core/carried-figure.ts`
- `casterId` — `src/core/combatant-health.ts`, `src/core/fight-statistics.ts`
- `casterSide` — `src/core/combatant-health.ts`
- `casts` — `src/core/carried-figure.ts`
- `change` — `src/core/protocol-key.ts`
- `charge` — `src/core/charged-skill.ts`
- `chargeBrokenIds` — `src/core/charged-skill.ts`
- `chargedSkills` — `src/core/fight-session.ts`
- `charging` — `src/core/charged-skill.ts`
- `combatant` — in 4 files: `src/core/`
- `combatantId` — in 6 files: `src/core/`
- `combatantIds` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `combatantNames` — `src/core/fight-decoder.ts`
- `combatants` — `src/core/fight-session.ts`
- `count` — `src/core/fight-decoder.ts`
- `counts` — `src/core/fight-session.ts`
- `cut` — `src/core/fight-statistics.ts`
- `cutForOtherEnd` — `src/core/fight-statistics.ts`
- `cutTotal` — `src/core/fight-statistics.ts`
- `damage` — `src/core/fight-decoder.ts`
- `dealer` — `src/core/fight-statistics.ts`
- `dealt` — `src/core/fight-statistics.ts`
- `dealtCut` — `src/core/fight-statistics.ts`
- `dealtToNobody` — `src/core/fight-statistics.ts`
- `declaration` — `src/core/fight-decoder.ts`
- `declared` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `declaredEffect` — `src/core/fight-decoder.ts`
- `declaredShare` — `src/core/fight-decoder.ts`
- `decoded` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `defence` — `src/core/fight-statistics.ts`, `src/core/protocol-key.ts`
- `destroyed` — `src/core/fight-statistics.ts`
- `effect` — `src/core/aura-standing.ts`
- `element` — `src/core/fight-decoder.ts`
- `end` — `src/core/protocol-key.ts`
- `ending` — `src/core/protocol-key.ts`
- `entryHealthByCombatantId` — `src/core/combatant-health.ts`
- `event` — in 7 files: `src/core/`
- `events` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `eventsAfter` — `src/core/fight-session.ts`
- `eventsBefore` — `src/core/fight-session.ts`
- `existing` — `src/core/fight-statistics.ts`
- `figure` — `src/core/fight-statistics.ts`
- `figures` — `src/core/fight-statistics.ts`
- `found` — in 7 files: `src/core/`
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
- `healthPercent` — `src/core/fight-decoder.ts`
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
- `isStriking` — `src/core/turn-clock.ts`
- `isUserNamed` — `src/core/fight-decoder.ts`
- `isWhole` — `src/core/combatant-health.ts`
- `key` — in 5 files: `src/core/`
- `keyMeaning` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `keys` — `src/core/fight-decoder.ts`
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
- `mechanism` — `src/core/fight-statistics.ts`, `src/core/protocol-key.ts`
- `member` — `src/core/fight-decoder.ts`
- `members` — `src/core/fight-decoder.ts`
- `message` — `src/core/fight-decoder.ts`
- `messagesLost` — `src/core/fight-session.ts`
- `moved` — `src/core/fight-decoder.ts`
- `name` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`
- `named` — `src/core/fight-decoder.ts`
- `namedText` — `src/core/fight-decoder.ts`
- `next` — `src/core/charged-skill.ts`, `src/core/fight-session.ts`
- `one` — `src/core/aura-standing.ts`
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
- `part` — `src/core/fight-statistics.ts`
- `payloadIndex` — `src/core/fight-session.ts`
- `payloadsApplied` — `src/core/fight-session.ts`
- `percent` — `src/core/carried-figure.ts`, `src/core/combatant-health.ts`
- `percentText` — `src/core/fight-decoder.ts`
- `places` — `src/core/combatant-health.ts`
- `pointIndex` — `src/core/protocol-number.ts`
- `preventedParts` — `src/core/fight-statistics.ts`
- `previous` — `src/core/charged-skill.ts`
- `provocation` — `src/core/aura-standing.ts`
- `provokedId` — `src/core/aura-standing.ts`
- `raw` — `src/core/fight-statistics.ts`
- `reach` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`, `src/core/protocol-key.ts`
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
- `shoutStated` — `src/core/aura-standing.ts`
- `sideHealByEvent` — `src/core/fight-figures.ts`
- `skill` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`
- `skillFigures` — `src/core/fight-statistics.ts`
- `skillNames` — `src/core/charged-skill.ts`
- `skillNamesByActorId` — `src/core/charged-skill.ts`
- `skills` — `src/core/fight-statistics.ts`
- `source` — `src/core/combatant-health.ts`
- `standingByCombatantId` — `src/core/legendary-standing.ts`
- `state` — `src/core/charged-skill.ts`, `src/core/fight-session.ts`
- `stateBefore` — `src/core/fight-session.ts`
- `stated` — `src/core/combatant-health.ts`, `src/core/fight-statistics.ts`
- `statedEnd` — `src/core/fight-decoder.ts`
- `statement` — `src/core/charged-skill.ts`
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
- `targetName` — `src/core/fight-decoder.ts`
- `targetSegment` — `src/core/fight-decoder.ts`
- `text` — `src/core/fight-decoder.ts`, `src/core/protocol-number.ts`
- `tickFigures` — `src/core/fight-statistics.ts`
- `token` — `src/core/fight-decoder.ts`
- `total` — `src/core/fight-statistics.ts`
- `totals` — `src/core/fight-statistics.ts`
- `turnLost` — `src/core/fight-decoder.ts`
- `turnStanding` — `src/core/aura-standing.ts`, `src/core/carried-status.ts`
- `turnStatement` — `src/core/fight-session.ts`
- `turns` — `src/core/aura-standing.ts`
- `turnsAtCast` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`
- `turnsAtLighting` — `src/core/carried-status.ts`
- `turnsAtShout` — `src/core/aura-standing.ts`
- `turnsByCombatantId` — `src/core/carried-status.ts`
- `turnsElapsed` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`,
  `src/core/carried-status.ts`
- `turnsNow` — `src/core/carried-status.ts`
- `turnsStated` — `src/core/aura-standing.ts`
- `turnsTaken` — `src/core/carried-figure.ts`, `src/core/turn-clock.ts`
- `turnsTakenNow` — `src/core/aura-standing.ts`
- `unaccounted` — `src/core/fight-decoder.ts`
- `unread` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`,
  `src/core/fight-statistics.ts`
- `unreadCause` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `value` — `src/core/fight-decoder.ts`, `src/core/protocol-number.ts`
- `walk` — `src/core/aura-standing.ts`
- `wasOver` — `src/core/fight-session.ts`
- `wound` — `src/core/fight-statistics.ts`
- `wounded` — `src/core/fight-statistics.ts`
- `woundedId` — `src/core/fight-statistics.ts`

### `src/game/`

- `ac` — `src/game/warrior-snapshot.ts`
- `after` — `src/game/game-battle.ts`
- `anchor` — `src/game/browser-file.ts`
- `answer` — `src/game/game-battle.ts`
- `asNumber` — `src/game/payload-envelope.ts`
- `asText` — `src/game/payload-envelope.ts`
- `asked` — `src/game/game-tooltip.ts`
- `at` — `src/game/game-build.ts`, `src/game/game-tooltip.ts`
- `battle` — `src/game/game-battle.ts`
- `before` — `src/game/game-battle.ts`
- `block` — `src/game/game-tooltip.ts`
- `blockBefore` — `src/game/game-tooltip.ts`
- `blocksById` — `src/game/game-tooltip.ts`
- `blocksWritten` — `src/game/game-tooltip.ts`
- `build` — `src/game/game-build.ts`
- `buildEnd` — `src/game/game-build.ts`
- `buildStart` — `src/game/game-build.ts`
- `callIndex` — `src/game/fight-capture.ts`
- `character` — `src/game/game-build.ts`
- `charge` — `src/game/payload-envelope.ts`
- `clicked` — `src/game/browser-file.ts`
- `collection` — `src/game/warrior-snapshot.ts`
- `collectionKey` — `src/game/warrior-snapshot.ts`
- `combatant` — `src/game/payload-envelope.ts`
- `combatantId` — `src/game/payload-envelope.ts`
- `copied` — `src/game/warrior-snapshot.ts`
- `count` — `src/game/payload-envelope.ts`
- `data` — `src/game/game-place.ts`
- `dateValue` — `src/game/browser-time.ts`
- `day` — `src/game/browser-time.ts`
- `deleted` — `src/game/browser-store.ts`
- `drawnIds` — `src/game/game-tooltip.ts`
- `end` — `src/game/browser-surroundings.ts`, `src/game/game-build.ts`
- `energy` — `src/game/warrior-snapshot.ts`
- `engine` — `src/game/game-battle.ts`
- `engineCandidates` — `src/game/game-battle.ts`
- `engineMember` — `src/game/game-place.ts`
- `engines` — `src/game/game-battle.ts`
- `entry` — `src/game/game-dictionary.ts`, `src/game/payload-envelope.ts`
- `failures` — `src/game/game-battle.ts`
- `field` — `src/game/payload-envelope.ts`
- `figure` — `src/game/payload-envelope.ts`
- `find` — `src/game/game-tooltip.ts`
- `first` — `src/game/game-dictionary.ts`
- `from` — `src/game/game-build.ts`
- `getEngine` — `src/game/game-battle.ts`
- `handle` — `src/game/browser-time.ts`
- `head` — `src/game/game-build.ts`
- `health` — `src/game/payload-envelope.ts`
- `hero` — `src/game/game-place.ts`
- `heroData` — `src/game/game-hero.ts`
- `heroIds` — `src/game/game-hero.ts`
- `heroObject` — `src/game/game-hero.ts`
- `hour` — `src/game/browser-time.ts`
- `hp` — `src/game/warrior-snapshot.ts`
- `id` — in 4 files: `src/game/`
- `ids` — `src/game/payload-envelope.ts`
- `isBlockOn` — `src/game/game-tooltip.ts`
- `isKept` — `src/game/fight-capture.ts`
- `isSigned` — `src/game/game-dictionary.ts`
- `kept` — `src/game/fight-capture.ts`
- `keptCall` — `src/game/fight-capture.ts`
- `key` — `src/game/warrior-snapshot.ts`
- `keyed` — `src/game/payload-envelope.ts`
- `keys` — `src/game/fight-capture.ts`
- `label` — `src/game/game-dictionary.ts`
- `least` — `src/game/payload-envelope.ts`
- `level` — `src/game/payload-envelope.ts`
- `listed` — `src/game/payload-envelope.ts`
- `look` — `src/game/game-build.ts`
- `lvl` — `src/game/warrior-snapshot.ts`
- `mana` — `src/game/warrior-snapshot.ts`
- `map` — `src/game/game-place.ts`
- `mapName` — `src/game/game-place.ts`
- `mask` — `src/game/payload-envelope.ts`
- `maximum` — `src/game/payload-envelope.ts`
- `member` — `src/game/browser-surroundings.ts`
- `message` — `src/game/payload-envelope.ts`
- `messages` — `src/game/payload-envelope.ts`
- `messagesStated` — `src/game/payload-envelope.ts`
- `minute` — `src/game/browser-time.ts`
- `monthFromZero` — `src/game/browser-time.ts`
- `name` — `src/game/game-place.ts`, `src/game/payload-envelope.ts`, `src/game/warrior-snapshot.ts`
- `named` — `src/game/warrior-snapshot.ts`
- `nextBlocksById` — `src/game/game-tooltip.ts`
- `now` — `src/game/payload-envelope.ts`
- `onAutoStated` — `src/game/payload-envelope.ts`
- `open` — `src/game/game-dictionary.ts`
- `ordinal` — `src/game/payload-envelope.ts`
- `ordinalText` — `src/game/payload-envelope.ts`
- `ordinals` — `src/game/payload-envelope.ts`
- `original` — `src/game/game-battle.ts`
- `place` — `src/game/game-place.ts`
- `places` — `src/game/game-place.ts`
- `prof` — `src/game/warrior-snapshot.ts`
- `profession` — `src/game/payload-envelope.ts`
- `queue` — `src/game/payload-envelope.ts`
- `ran` — `src/game/browser-time.ts`
- `read` — in 5 files: `src/game/`
- `readerSide` — `src/game/payload-envelope.ts`
- `registryText` — `src/game/game-tooltip.ts`
- `revoked` — `src/game/browser-file.ts`
- `row` — `src/game/game-tooltip.ts`
- `scheduled` — `src/game/browser-file.ts`
- `shape` — `src/game/fight-capture.ts`
- `side` — `src/game/payload-envelope.ts`
- `skillName` — `src/game/payload-envelope.ts`
- `snapshot` — `src/game/warrior-snapshot.ts`
- `source` — `src/game/game-build.ts`
- `sources` — `src/game/game-build.ts`
- `span` — `src/game/game-build.ts`
- `state` — `src/game/fight-capture.ts`
- `stated` — in 4 files: `src/game/`
- `stood` — `src/game/payload-envelope.ts`
- `targets` — `src/game/game-tooltip.ts`
- `team` — `src/game/warrior-snapshot.ts`
- `text` — in 4 files: `src/game/`
- `theirs` — `src/game/game-tooltip.ts`
- `tooLong` — `src/game/browser-store.ts`
- `translate` — `src/game/game-dictionary.ts`
- `turnStatement` — `src/game/payload-envelope.ts`
- `turnsElapsed` — `src/game/payload-envelope.ts`
- `turnsStated` — `src/game/payload-envelope.ts`
- `unsigned` — `src/game/game-dictionary.ts`
- `url` — `src/game/browser-file.ts`
- `value` — `src/game/payload-envelope.ts`, `src/game/warrior-snapshot.ts`
- `valuesByKey` — `src/game/browser-store.ts`
- `walked` — `src/game/game-build.ts`
- `warrior` — `src/game/game-tooltip.ts`
- `warriorElement` — `src/game/game-tooltip.ts`
- `warriorEntries` — `src/game/payload-envelope.ts`
- `warriors` — `src/game/game-tooltip.ts`, `src/game/payload-envelope.ts`
- `world` — `src/game/browser-surroundings.ts`
- `wrapper` — `src/game/game-battle.ts`
- `written` — `src/game/browser-store.ts`, `src/game/fight-capture.ts`, `src/game/game-tooltip.ts`
- `x` — `src/game/game-place.ts`
- `y` — `src/game/game-place.ts`

### `src/runtime/`

- `addOnVersion` — `src/runtime/fight-file.ts`
- `alsoKept` — `src/runtime/panel-frame.ts`
- `amount` — `src/runtime/fight-file.ts`
- `answered` — `src/runtime/shelf-keeper.ts`
- `answers` — `src/runtime/panel-frame.ts`
- `applied` — `src/runtime/margometer-runtime.ts`
- `at` — `src/runtime/shelf.ts`
- `attempts` — `src/runtime/shelf.ts`
- `battle` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `build` — `src/runtime/fight-file.ts`
- `buildId` — `src/runtime/fight-handover.ts`
- `builtState` — `src/runtime/margometer-runtime.ts`
- `call` — `src/runtime/live-fight.ts`
- `calls` — `src/runtime/fight-handover.ts`
- `capturedAt` — `src/runtime/fight-handover.ts`
- `carried` — `src/runtime/carried-tooltip.ts`
- `caster` — `src/runtime/carried-tooltip.ts`
- `charging` — `src/runtime/carried-tooltip.ts`
- `chosen` — `src/runtime/fight-state.ts`
- `chosenFightOpenedAt` — `src/runtime/panel-frame.ts`
- `combatantId` — `src/runtime/carried-tooltip.ts`, `src/runtime/margometer-runtime.ts`
- `committed` — `src/runtime/live-fight.ts`
- `counted` — `src/runtime/panel-frame.ts`
- `counts` — `src/runtime/defect-ledger.ts`
- `cut` — `src/runtime/fight-file.ts`
- `defectCount` — `src/runtime/defect-ledger.ts`
- `defects` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`,
  `src/runtime/shelf-keeper.ts`
- `dropped` — `src/runtime/shelf.ts`
- `encoded` — `src/runtime/fight-handover.ts`
- `end` — `src/runtime/margometer-runtime.ts`
- `failure` — `src/runtime/defect-ledger.ts`, `src/runtime/panel-frame.ts`
- `fight` — `src/runtime/live-fight.ts`, `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `fightStandings` — `src/runtime/carried-tooltip.ts`
- `fightState` — `src/runtime/fight-handover.ts`, `src/runtime/panel-frame.ts`,
  `src/runtime/shelf-keeper.ts`
- `fights` — `src/runtime/shelf.ts`
- `figures` — in 4 files: `src/runtime/`
- `first` — `src/runtime/margometer-runtime.ts`, `src/runtime/settings.ts`
- `found` — `src/runtime/panel-frame.ts`
- `gameBuild` — `src/runtime/fight-handover.ts`, `src/runtime/shelf.ts`
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
- `isCollapsed` — `src/runtime/margometer-runtime.ts`
- `isShelfEmpty` — `src/runtime/panel-frame.ts`
- `keeper` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `keptFight` — `src/runtime/fight-handover.ts`, `src/runtime/fight-state.ts`
- `keptFightState` — `src/runtime/fight-state.ts`
- `keptFights` — `src/runtime/panel-frame.ts`
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
- `liveRow` — `src/runtime/panel-frame.ts`
- `mapName` — `src/runtime/shelf.ts`
- `messages` — `src/runtime/live-fight.ts`
- `messagesByPayload` — `src/runtime/fight-state.ts`
- `metric` — `src/runtime/margometer-runtime.ts`
- `momentForName` — `src/runtime/fight-file.ts`
- `mounted` — `src/runtime/margometer-runtime.ts`
- `newest` — `src/runtime/fight-state.ts`
- `next` — `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `now` — `src/runtime/fight-handover.ts`
- `offered` — `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `one` — `src/runtime/carried-tooltip.ts`, `src/runtime/fight-state.ts`,
  `src/runtime/panel-frame.ts`
- `opened` — `src/runtime/panel-frame.ts`, `src/runtime/shelf-keeper.ts`
- `openedAt` — `src/runtime/shelf-keeper.ts`, `src/runtime/shelf.ts`
- `openedLevels` — `src/runtime/panel-frame.ts`
- `outcome` — `src/runtime/panel-frame.ts`
- `pair` — `src/runtime/fight-file.ts`, `src/runtime/panel-frame.ts`, `src/runtime/settings.ts`
- `parsed` — `src/runtime/settings.ts`, `src/runtime/shelf.ts`
- `part` — `src/runtime/panel-frame.ts`
- `payload` — `src/runtime/fight-state.ts`
- `payloads` — `src/runtime/live-fight.ts`, `src/runtime/shelf.ts`
- `payloadsReplayedCount` — `src/runtime/fight-handover.ts`, `src/runtime/shelf-keeper.ts`
- `pinned` — `src/runtime/shelf.ts`
- `pinnedCase` — `src/runtime/panel-frame.ts`
- `place` — `src/runtime/shelf.ts`
- `ports` — `src/runtime/margometer-runtime.ts`
- `position` — `src/runtime/margometer-runtime.ts`
- `prepared` — `src/runtime/fight-state.ts`, `src/runtime/live-fight.ts`
- `provoked` — `src/runtime/carried-tooltip.ts`
- `ran` — `src/runtime/live-fight.ts`, `src/runtime/shelf-keeper.ts`
- `ranking` — `src/runtime/panel-frame.ts`
- `read` — in 4 files: `src/runtime/`
- `readerId` — `src/runtime/shelf.ts`
- `readerSide` — `src/runtime/panel-frame.ts`
- `record` — `src/runtime/fight-state.ts`, `src/runtime/live-fight.ts`
- `refused` — `src/runtime/shelf.ts`
- `region` — `src/runtime/defect-ledger.ts`
- `remaining` — `src/runtime/shelf.ts`
- `rememberedFightState` — `src/runtime/shelf-keeper.ts`
- `rendered` — `src/runtime/panel-frame.ts`
- `renderedWaiting` — `src/runtime/panel-frame.ts`
- `requested` — `src/runtime/margometer-runtime.ts`
- `rest` — `src/runtime/shelf.ts`
- `roster` — `src/runtime/panel-frame.ts`
- `rotated` — `src/runtime/shelf.ts`
- `rowKey` — `src/runtime/defect-ledger.ts`
- `rows` — `src/runtime/defect-ledger.ts`, `src/runtime/panel-frame.ts`
- `rowsByCombatantId` — `src/runtime/carried-tooltip.ts`
- `saved` — `src/runtime/margometer-runtime.ts`
- `screen` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `search` — `src/runtime/margometer-runtime.ts`
- `second` — `src/runtime/settings.ts`
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
- `statistics` — `src/runtime/fight-file.ts`, `src/runtime/panel-frame.ts`
- `statusBitsCount` — `src/runtime/margometer-runtime.ts`
- `statuses` — `src/runtime/carried-tooltip.ts`
- `storageChoice` — `src/runtime/margometer-runtime.ts`
- `store` — `src/runtime/shelf-keeper.ts`
- `stored` — `src/runtime/shelf.ts`
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
- `value` — `src/runtime/shelf.ts`
- `version` — `src/runtime/shelf.ts`
- `view` — `src/runtime/fight-state.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/panel-frame.ts`
- `waiting` — `src/runtime/panel-frame.ts`
- `width` — `src/runtime/settings.ts`
- `world` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/margometer-runtime.ts`
- `wrap` — `src/runtime/margometer-runtime.ts`
- `wrapped` — `src/runtime/margometer-runtime.ts`
- `written` — in 5 files: `src/runtime/`
- `x` — `src/runtime/shelf.ts`
- `y` — `src/runtime/shelf.ts`

### `src/ui/`

- `after` — `src/ui/panel-element.ts`
- `air` — `src/ui/panel-look.ts`
- `answer` — `src/ui/panel-element.ts`
- `apart` — `src/ui/panel-words.ts`
- `apartClass` — `src/ui/panel-element.ts`
- `applied` — `src/ui/panel-drag.ts`
- `at` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `axes` — `src/ui/panel-screen.ts`
- `back` — `src/ui/panel-element.ts`
- `bar` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `before` — `src/ui/panel-element.ts`
- `belowRows` — `src/ui/panel-look.ts`
- `beside` — `src/ui/panel-drag.ts`
- `between` — `src/ui/panel-element.ts`
- `bigger` — `src/ui/panel-content.ts`
- `block` — `src/ui/panel-element.ts`
- `body` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
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
- `cap` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `capRight` — `src/ui/panel-look.ts`
- `captured` — `src/ui/panel-drag.ts`
- `card` — `src/ui/panel-element.ts`
- `cardContext` — `src/ui/panel-element.ts`
- `cardElement` — `src/ui/panel-element.ts`
- `cardHandle` — `src/ui/panel-element.ts`
- `cardLookup` — `src/ui/panel-element.ts`
- `cast` — `src/ui/panel-element.ts`
- `castName` — `src/ui/panel-element.ts`
- `caster` — `src/ui/panel-helper.ts`
- `ceiling` — `src/ui/panel-look.ts`
- `channel` — `src/ui/panel-look.ts`
- `charge` — `src/ui/panel-words.ts`
- `charged` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `child` — `src/ui/panel-element.ts`
- `choice` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `chosen` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `clamped` — `src/ui/panel-drag.ts`, `src/ui/panel-words.ts`
- `className` — `src/ui/panel-element.ts`
- `classes` — `src/ui/panel-element.ts`
- `clock` — `src/ui/panel-words.ts`
- `closing` — `src/ui/panel-content.ts`
- `closingFigure` — `src/ui/panel-content.ts`
- `closingFigureClamped` — `src/ui/panel-content.ts`
- `collected` — `src/ui/panel-element.ts`
- `colour` — `src/ui/panel-element.ts`
- `combatant` — `src/ui/panel-content.ts`, `src/ui/panel-helper.ts`
- `combatantFigures` — `src/ui/panel-content.ts`
- `combatantId` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`
- `compose` — `src/ui/panel-element.ts`
- `composeByKey` — `src/ui/panel-element.ts`
- `composed` — `src/ui/panel-helper.ts`
- `control` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `corner` — `src/ui/panel-drag.ts`
- `countBySide` — `src/ui/panel-content.ts`
- `counted` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `counters` — `src/ui/panel-element.ts`
- `counts` — `src/ui/panel-words.ts`
- `critical` — `src/ui/panel-element.ts`
- `crumb` — `src/ui/panel-element.ts`
- `current` — `src/ui/panel-element.ts`
- `cut` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
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
- `element` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `empty` — `src/ui/panel-element.ts`
- `end` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `ends` — `src/ui/panel-element.ts`
- `everybody` — `src/ui/panel-content.ts`
- `exact` — `src/ui/panel-words.ts`
- `failure` — `src/ui/panel-element.ts`
- `fight` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `figure` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `figureBySubWord` — `src/ui/panel-element.ts`
- `figurePlaced` — `src/ui/panel-content.ts`
- `figures` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `figuresOnScreen` — `src/ui/panel-content.ts`
- `first` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `floors` — `src/ui/panel-element.ts`
- `folded` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `found` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`
- `frame` — `src/ui/panel-element.ts`
- `from` — `src/ui/panel-drag.ts`, `src/ui/panel-words.ts`
- `gap` — `src/ui/panel-drag.ts`
- `given` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `grab` — `src/ui/panel-drag.ts`
- `grip` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `group` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `groups` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `handled` — `src/ui/panel-listener.ts`
- `hasClosing` — `src/ui/panel-content.ts`
- `hasFightToSave` — `src/ui/panel-element.ts`
- `hasRest` — `src/ui/panel-content.ts`
- `header` — `src/ui/panel-element.ts`
- `heading` — `src/ui/panel-element.ts`
- `heals` — `src/ui/panel-words.ts`
- `height` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `heightMaximum` — `src/ui/panel-drag.ts`
- `heightMinimum` — `src/ui/panel-drag.ts`
- `helperBar` — `src/ui/panel-element.ts`
- `helperBody` — `src/ui/panel-element.ts`
- `helperDrag` — `src/ui/panel-element.ts`
- `helperDragOptions` — `src/ui/panel-element.ts`
- `helperGrip` — `src/ui/panel-element.ts`
- `helperPlace` — `src/ui/panel-element.ts`
- `helperPlacement` — `src/ui/panel-element.ts`
- `helperPosition` — `src/ui/panel-element.ts`
- `helperRegister` — `src/ui/panel-element.ts`
- `helperRight` — `src/ui/panel-drag.ts`
- `helperWindow` — `src/ui/panel-element.ts`
- `here` — `src/ui/panel-element.ts`
- `hint` — `src/ui/panel-element.ts`
- `holder` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`
- `holding` — `src/ui/panel-element.ts`
- `host` — `src/ui/panel-element.ts`
- `id` — `src/ui/panel-words.ts`
- `inset` — `src/ui/panel-look.ts`
- `inside` — `src/ui/panel-drag.ts`
- `intent` — `src/ui/panel-element.ts`
- `isCounted` — `src/ui/panel-content.ts`
- `isDamage` — `src/ui/panel-content.ts`
- `isMeterCollapsed` — `src/ui/panel-element.ts`
- `isOneStated` — `src/ui/ranked-order.ts`
- `isOpen` — `src/ui/panel-element.ts`
- `isOtherStated` — `src/ui/ranked-order.ts`
- `isRegionKept` — `src/ui/panel-element.ts`
- `isSized` — `src/ui/panel-element.ts`
- `isTallied` — `src/ui/panel-words.ts`
- `kept` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `key` — in 4 files: `src/ui/`
- `kind` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `kinds` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `label` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `largest` — `src/ui/panel-content.ts`
- `last` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `lastTwo` — `src/ui/panel-words.ts`
- `leading` — `src/ui/panel-words.ts`
- `leaving` — `src/ui/panel-element.ts`
- `left` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `line` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `linear` — `src/ui/panel-look.ts`
- `lines` — `src/ui/panel-element.ts`
- `list` — `src/ui/panel-element.ts`
- `listBasis` — `src/ui/panel-look.ts`
- `listRowsLeast` — `src/ui/panel-look.ts`
- `listed` — `src/ui/panel-content.ts`
- `lit` — `src/ui/panel-element.ts`
- `luminance` — `src/ui/panel-look.ts`
- `mark` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `marked` — `src/ui/panel-element.ts`
- `meaning` — `src/ui/panel-element.ts`
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
- `month` — `src/ui/panel-words.ts`
- `name` — in 5 files: `src/ui/`
- `named` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `names` — `src/ui/panel-content.ts`
- `narrowed` — `src/ui/panel-element.ts`
- `needed` — `src/ui/panel-element.ts`
- `neither` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `neitherEndPinned` — `src/ui/panel-content.ts`
- `nested` — `src/ui/panel-element.ts`
- `next` — `src/ui/panel-element.ts`
- `note` — `src/ui/panel-element.ts`
- `notes` — `src/ui/panel-element.ts`
- `noun` — `src/ui/panel-element.ts`
- `now` — `src/ui/panel-helper.ts`
- `offhand` — `src/ui/panel-element.ts`
- `oldest` — `src/ui/panel-element.ts`
- `onDark` — `src/ui/panel-look.ts`
- `onHover` — `src/ui/panel-element.ts`
- `onLight` — `src/ui/panel-look.ts`
- `one` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `openKey` — `src/ui/panel-element.ts`
- `openSize` — `src/ui/panel-element.ts`
- `openTop` — `src/ui/panel-element.ts`
- `opened` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `openedAt` — `src/ui/panel-intent.ts`
- `opening` — `src/ui/panel-drag.ts`
- `opponents` — `src/ui/panel-element.ts`
- `opposing` — `src/ui/panel-element.ts`
- `other` — `src/ui/panel-content.ts`, `src/ui/panel-drag.ts`
- `otherCombatant` — `src/ui/panel-content.ts`
- `otherFigures` — `src/ui/panel-content.ts`
- `otherId` — `src/ui/panel-content.ts`
- `outcome` — `src/ui/panel-element.ts`
- `outside` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `own` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `pair` — `src/ui/panel-element.ts`
- `panelDrawing` — `src/ui/panel-element.ts`
- `part` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `parts` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `partsTotal` — `src/ui/panel-content.ts`
- `passed` — `src/ui/panel-words.ts`
- `percent` — `src/ui/panel-words.ts`
- `person` — `src/ui/panel-element.ts`
- `personContext` — `src/ui/panel-element.ts`
- `pin` — `src/ui/panel-element.ts`
- `pinned` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `pinnedApart` — `src/ui/panel-content.ts`
- `pinnedCase` — `src/ui/panel-content.ts`
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
- `reached` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`
- `read` — `src/ui/panel-drag.ts`
- `reader` — `src/ui/panel-element.ts`
- `region` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `regionName` — `src/ui/panel-element.ts`
- `regions` — `src/ui/panel-element.ts`
- `register` — `src/ui/panel-element.ts`
- `renderInPlace` — `src/ui/panel-element.ts`
- `rendered` — `src/ui/panel-element.ts`
- `replaced` — `src/ui/panel-element.ts`
- `report` — `src/ui/panel-element.ts`
- `reset` — `src/ui/panel-element.ts`
- `rest` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `right` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `room` — `src/ui/panel-look.ts`
- `root` — `src/ui/panel-element.ts`
- `rounded` — `src/ui/panel-drag.ts`, `src/ui/panel-words.ts`
- `row` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `rowContent` — `src/ui/panel-element.ts`
- `rowCost` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `rows` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `rowsMaximum` — `src/ui/panel-words.ts`
- `rule` — `src/ui/panel-element.ts`
- `run` — `src/ui/panel-element.ts`
- `runs` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `said` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `screenTotal` — `src/ui/panel-content.ts`
- `screens` — `src/ui/panel-screen.ts`
- `scrolls` — `src/ui/panel-element.ts`
- `second` — `src/ui/panel-words.ts`
- `section` — `src/ui/panel-element.ts`
- `seen` — `src/ui/panel-content.ts`
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
- `sides` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `sideways` — `src/ui/panel-element.ts`
- `sign` — `src/ui/panel-words.ts`
- `size` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `sized` — `src/ui/panel-drag.ts`
- `sizes` — `src/ui/panel-content.ts`
- `skill` — `src/ui/panel-content.ts`
- `slot` — `src/ui/panel-element.ts`
- `source` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`
- `spaced` — `src/ui/panel-words.ts`
- `spare` — `src/ui/panel-element.ts`
- `standing` — `src/ui/panel-helper.ts`
- `start` — `src/ui/panel-words.ts`
- `started` — `src/ui/panel-drag.ts`
- `state` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `stated` — in 5 files: `src/ui/`
- `status` — `src/ui/panel-words.ts`
- `step` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `stepSizes` — `src/ui/panel-look.ts`
- `steps` — `src/ui/panel-element.ts`
- `strip` — `src/ui/panel-element.ts`
- `strips` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `strokes` — `src/ui/panel-look.ts`
- `style` — `src/ui/panel-drag.ts`
- `sub` — `src/ui/panel-element.ts`
- `subtitle` — `src/ui/panel-element.ts`
- `suspicion` — `src/ui/panel-element.ts`
- `taken` — `src/ui/panel-content.ts`
- `tall` — `src/ui/panel-element.ts`
- `target` — `src/ui/panel-element.ts`
- `tile` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `time` — `src/ui/panel-element.ts`
- `times` — `src/ui/panel-words.ts`
- `tokens` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `tone` — `src/ui/panel-element.ts`
- `top` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `topByName` — `src/ui/panel-element.ts`
- `total` — `src/ui/panel-content.ts`
- `totals` — `src/ui/panel-content.ts`
- `track` — `src/ui/panel-element.ts`
- `translate` — `src/ui/panel-element.ts`
- `turn` — `src/ui/panel-element.ts`
- `typeStep` — `src/ui/panel-element.ts`
- `undrawn` — `src/ui/panel-element.ts`
- `unnamed` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `unnamedCut` — `src/ui/panel-element.ts`
- `unnamedOpened` — `src/ui/panel-content.ts`
- `unpaid` — `src/ui/panel-words.ts`
- `unplaced` — `src/ui/panel-content.ts`
- `uses` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `value` — `src/ui/panel-element.ts`
- `variables` — `src/ui/panel-drag.ts`
- `view` — `src/ui/panel-element.ts`
- `viewport` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `walked` — `src/ui/panel-content.ts`
- `wanted` — `src/ui/panel-screen.ts`
- `went` — `src/ui/panel-element.ts`
- `when` — `src/ui/panel-element.ts`
- `where` — `src/ui/panel-element.ts`
- `who` — `src/ui/panel-element.ts`
- `whole` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `width` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `widthMaximum` — `src/ui/panel-drag.ts`
- `widthMinimum` — `src/ui/panel-drag.ts`
- `window` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `word` — `src/ui/panel-words.ts`
- `words` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `wrapped` — `src/ui/panel-element.ts`
- `written` — `src/ui/panel-look.ts`

### `src/`

- `at` — `src/userscript-entry.ts`
- `browserConsole` — `src/userscript-entry.ts`
- `error` — `src/userscript-entry.ts`
- `errorConsole` — `src/userscript-entry.ts`
- `height` — `src/userscript-entry.ts`
- `ports` — `src/userscript-entry.ts`
- `scripts` — `src/userscript-entry.ts`
- `sources` — `src/userscript-entry.ts`
- `started` — `src/userscript-entry.ts`
- `storage` — `src/userscript-entry.ts`
- `walked` — `src/userscript-entry.ts`
- `width` — `src/userscript-entry.ts`

### `tools/`

- `abilities` — `tools/capture-intake.ts`
- `ached` — `tools/fabricated-fight.ts`
- `across` — `tools/preview-site.ts`
- `act` — `tools/fabricated-fight.ts`
- `actor` — `tools/fabricated-fight.ts`
- `actorId` — `tools/turn-reading.ts`
- `addOn` — `tools/capture-intake.ts`
- `added` — `tools/game-readings.ts`
- `adding` — `tools/turn-reading.ts`
- `advance` — `tools/turn-count.ts`
- `after` — `tools/buff-bit-table.ts`
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
- `at` — in 11 files: `tools/`
- `atFirst` — `tools/turn-count.ts`
- `atLast` — `tools/turn-count.ts`
- `atOnce` — `tools/aura-standing.ts`
- `atShouter` — `tools/shout-holding.ts`
- `atSomebodyElse` — `tools/shout-holding.ts`
- `auras` — `tools/skill-table.ts`
- `aurasText` — `tools/skill-table.ts`
- `awaiting` — `tools/fabricated-fight.ts`
- `band` — `tools/preview-page.ts`
- `bandaged` — `tools/fabricated-fight.ts`
- `bare` — `tools/preview-state.ts`
- `baseline` — `tools/shout-holding.ts`
- `battle` — `tools/payload-cost.ts`
- `before` — `tools/fabricated-fight.ts`, `tools/help-article.ts`, `tools/shout-holding.ts`
- `beside` — `tools/fabricated-fight.ts`
- `bindings` — `tools/preview-page.ts`
- `bit` — `tools/aura-lifetime.ts`, `tools/game-readings.ts`
- `bitName` — `tools/aura-lifetime.ts`
- `bits` — `tools/buff-bit-table.ts`, `tools/game-readings.ts`
- `block` — `tools/protocol-key-table.ts`
- `blows` — `tools/skill-table.ts`
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
- `bundlePath` — `tools/game-client-source.ts`
- `bundling` — `tools/build-userscript.ts`
- `button` — `tools/preview-page.ts`
- `byCombatantId` — `tools/turn-count.ts`
- `byKey` — `tools/turn-reading.ts`
- `byMoment` — `tools/aura-lifetime.ts`
- `byOrdinals` — `tools/turn-reading.ts`
- `bySide` — `tools/fight-figures.ts`
- `byTurn` — `tools/shout-holding.ts`
- `cached` — in 4 files: `tools/`
- `call` — `tools/capture-intake.ts`
- `calls` — `tools/fabricated-fight.ts`
- `caption` — `tools/fight-figures.ts`
- `capturedAt` — `tools/capture-intake.ts`
- `card` — `tools/panel-giving-way.ts`
- `carried` — in 4 files: `tools/`
- `cases` — `tools/aura-lifetime.ts`, `tools/drill-report.ts`
- `casterIds` — `tools/aura-standing.ts`
- `casterIdsByKey` — `tools/aura-standing.ts`
- `ceiling` — `tools/fabricated-fight.ts`
- `cells` — in 4 files: `tools/`
- `changed` — `tools/capture-intake.ts`
- `channel` — `tools/game-client-source.ts`
- `character` — `tools/capture-intake.ts`, `tools/protocol-key-table.ts`
- `characters` — `tools/capture-intake.ts`
- `chosen` — `tools/develop-reports.ts`, `tools/fabricated-fight.ts`
- `cited` — `tools/help-article.ts`
- `claim` — `tools/help-claim-register.ts`
- `claims` — `tools/protocol-key-shape.ts`
- `client` — `tools/game-readings.ts`
- `clientState` — `tools/game-readings.ts`
- `clip` — `tools/panel-shots.ts`
- `clock` — `tools/aura-lifetime.ts`
- `clocks` — `tools/shout-holding.ts`
- `close` — `tools/help-claim-register.ts`, `tools/protocol-key-shape.ts`, `tools/skill-table.ts`
- `closed` — `tools/aura-lifetime.ts`
- `closing` — `tools/drill-report.ts`
- `collision` — `tools/capture-intake.ts`
- `columns` — `tools/fight-figures.ts`
- `combatant` — `tools/fight-figures.ts`
- `combatantId` — `tools/aura-lifetime.ts`, `tools/turn-count.ts`, `tools/turn-reading.ts`
- `command` — in 5 files: `tools/`
- `commit` — `tools/panel-shots.ts`
- `common` — `tools/aura-lifetime.ts`
- `comparison` — `tools/develop-reports.ts`
- `contested` — `tools/turn-reading.ts`
- `context` — `tools/develop-reports.ts`, `tools/turn-reading.ts`
- `cost` — `tools/payload-cost.ts`
- `costs` — `tools/payload-cost.ts`
- `count` — in 5 files: `tools/`
- `countByLines` — `tools/card-height.ts`
- `counted` — in 4 files: `tools/`
- `counts` — `tools/fight-figures.ts`, `tools/help-article.ts`, `tools/turn-count.ts`
- `current` — `tools/develop-reports.ts`
- `cut` — `tools/drill-report.ts`
- `date` — `tools/help-article.ts`
- `dated` — `tools/skill-table.ts`
- `day` — `tools/capture-intake.ts`
- `days` — `tools/help-article.ts`
- `dealt` — `tools/fabricated-fight.ts`
- `dealtSign` — `tools/protocol-key-table.ts`
- `declared` — `tools/build-userscript.ts`
- `decoded` — `tools/turn-reading.ts`
- `decoding` — `tools/develop-reports.ts`
- `delta` — `tools/turn-count.ts`
- `depth` — `tools/protocol-key-table.ts`
- `described` — `tools/capture-intake.ts`
- `details` — `tools/fight-figures.ts`
- `develop` — `tools/develop-reports.ts`
- `developFigures` — `tools/develop-reports.ts`
- `developLines` — `tools/develop-reports.ts`
- `developNames` — `tools/develop-reports.ts`
- `did` — `tools/game-readings.ts`
- `differ` — `tools/develop-reports.ts`
- `difference` — `tools/develop-reports.ts`
- `digits` — `tools/protocol-key-table.ts`
- `directives` — `tools/build-userscript.ts`
- `directory` — `tools/develop-reports.ts`, `tools/game-client-source.ts`, `tools/help-article.ts`
- `disagreed` — `tools/protocol-key-shape.ts`
- `disputed` — `tools/turn-reading.ts`
- `distinct` — `tools/help-article.ts`, `tools/protocol-key-table.ts`
- `document` — `tools/recorded-material.ts`
- `domain` — `tools/build-userscript.ts`
- `drawn` — `tools/panel-shots.ts`
- `drill` — `tools/drill-report.ts`
- `driver` — `tools/preview-page.ts`
- `dump` — `tools/game-readings.ts`
- `dumped` — `tools/game-readings.ts`
- `durations` — `tools/skill-table.ts`
- `effect` — `tools/skill-table.ts`
- `elapsed` — `tools/shout-holding.ts`
- `element` — `tools/fabricated-fight.ts`
- `elsewhere` — `tools/turn-count.ts`
- `encoded` — `tools/fabricated-fight.ts`
- `end` — `tools/changelog.ts`, `tools/help-article.ts`, `tools/protocol-key-shape.ts`
- `ending` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `endings` — `tools/aura-lifetime.ts`
- `engine` — `tools/payload-cost.ts`
- `english` — `tools/capture-intake.ts`
- `entries` — `tools/protocol-key-shape.ts`
- `entry` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`, `tools/preview-state.ts`
- `entryIndex` — `tools/preview-server.ts`
- `envelope` — `tools/capture-intake.ts`
- `episode` — `tools/shout-holding.ts`
- `episodes` — `tools/shout-holding.ts`
- `event` — in 5 files: `tools/`
- `events` — `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `eventsByKind` — `tools/decoding-status.ts`
- `expected` — `tools/turn-count.ts`
- `families` — `tools/protocol-key-shape.ts`
- `family` — `tools/protocol-key-table.ts`
- `fetchedAt` — `tools/game-client-source.ts`, `tools/help-article.ts`, `tools/skill-table.ts`
- `field` — `tools/capture-intake.ts`, `tools/game-client-source.ts`, `tools/help-article.ts`
- `fields` — `tools/protocol-key-table.ts`
- `fight` — in 11 files: `tools/`
- `fightName` — `tools/panel-shots.ts`
- `fights` — `tools/preview-server.ts`, `tools/recorded-material.ts`
- `figure` — `tools/fabricated-fight.ts`
- `figures` — in 7 files: `tools/`
- `file` — `tools/preview-site.ts`
- `files` — `tools/build-userscript.ts`, `tools/preview-site.ts`
- `finished` — `tools/build-userscript.ts`
- `fire` — `tools/fabricated-fight.ts`
- `first` — `tools/aura-lifetime.ts`, `tools/frozen-files.ts`, `tools/turn-count.ts`
- `firstRow` — `tools/panel-shots.ts`
- `flag` — `tools/capture-intake.ts`
- `flags` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `flowing` — `tools/protocol-key-shape.ts`
- `fold` — `tools/panel-giving-way.ts`
- `fought` — `tools/fabricated-fight.ts`
- `found` — in 9 files: `tools/`
- `fragment` — `tools/help-article.ts`
- `fragments` — `tools/help-article.ts`
- `from` — in 4 files: `tools/`
- `fromPaths` — `tools/preview-server.ts`
- `frozen` — in 4 files: `tools/`
- `frozenBuild` — `tools/game-readings.ts`
- `frozenKeys` — `tools/game-readings.ts`
- `gameBattle` — `tools/payload-cost.ts`
- `gameMilliseconds` — `tools/payload-cost.ts`
- `given` — `tools/fabricated-fight.ts`
- `grade` — `tools/turn-count.ts`
- `graded` — `tools/turn-count.ts`
- `grades` — `tools/turn-count.ts`
- `granted` — `tools/skill-table.ts`, `tools/turn-count.ts`
- `has` — `tools/aura-lifetime.ts`
- `hasMoved` — `tools/help-article.ts`
- `hash` — `tools/preview-state.ts`
- `haystack` — `tools/help-article.ts`
- `head` — `tools/protocol-key-table.ts`
- `heading` — `tools/aura-lifetime.ts`, `tools/develop-reports.ts`, `tools/protocol-key-shape.ts`
- `headings` — `tools/aura-standing.ts`, `tools/turn-count.ts`
- `healthMaximum` — `tools/fabricated-fight.ts`
- `height` — `tools/card-height.ts`
- `heights` — `tools/card-height.ts`
- `held` — in 11 files: `tools/`
- `heldDate` — `tools/frozen-files.ts`
- `helds` — `tools/frozen-files.ts`
- `helperOffset` — `tools/panel-shots.ts`
- `hit` — `tools/help-article.ts`
- `holder` — `tools/turn-count.ts`
- `host` — `tools/game-client-source.ts`
- `hover` — `tools/panel-giving-way.ts`
- `html` — in 4 files: `tools/`
- `hurt` — `tools/fabricated-fight.ts`
- `id` — `tools/capture-intake.ts`, `tools/fight-figures.ts`, `tools/skill-table.ts`
- `index` — in 6 files: `tools/`
- `indexes` — `tools/fabricated-fight.ts`
- `indices` — `tools/turn-count.ts`
- `injure` — `tools/fabricated-fight.ts`
- `intake` — `tools/capture-intake.ts`
- `into` — `tools/panel-giving-way.ts`
- `introduction` — `tools/preview-page.ts`
- `isAbsent` — `tools/preview-server.ts`
- `isAhead` — `tools/game-readings.ts`
- `isDash` — `tools/capture-intake.ts`
- `isDefault` — `tools/fabricated-fight.ts`
- `isDigit` — `tools/capture-intake.ts`
- `isKept` — `tools/frozen-files.ts`
- `isLetter` — `tools/capture-intake.ts`
- `isNarrated` — `tools/turn-count.ts`
- `isOurs` — `tools/fabricated-fight.ts`
- `isPunctuation` — `tools/capture-intake.ts`
- `isSilent` — `tools/help-claim-register.ts`
- `items` — `tools/preview-page.ts`
- `keepAlive` — `tools/preview-server.ts`
- `kept` — in 4 files: `tools/`
- `key` — in 9 files: `tools/`
- `keys` — in 4 files: `tools/`
- `keysByCast` — `tools/aura-standing.ts`
- `kind` — `tools/drill-report.ts`, `tools/turn-reading.ts`
- `kindPlace` — `tools/drill-report.ts`
- `known` — `tools/capture-intake.ts`
- `label` — `tools/capture-intake.ts`, `tools/fight-figures.ts`
- `labels` — `tools/capture-intake.ts`, `tools/protocol-key-table.ts`
- `largest` — `tools/payload-cost.ts`
- `last` — `tools/fabricated-fight.ts`, `tools/recorded-material.ts`, `tools/turn-count.ts`
- `later` — `tools/shout-holding.ts`
- `least` — `tools/preview-page.ts`
- `left` — `tools/panel-shots.ts`
- `length` — `tools/aura-lifetime.ts`, `tools/game-readings.ts`, `tools/skill-table.ts`
- `level` — `tools/skill-table.ts`
- `liftedKeys` — `tools/game-readings.ts`
- `light` — `tools/fabricated-fight.ts`
- `lightings` — `tools/aura-lifetime.ts`
- `line` — in 5 files: `tools/`
- `lineIndex` — `tools/develop-reports.ts`
- `lines` — in 13 files: `tools/`
- `links` — `tools/preview-server.ts`
- `listed` — `tools/preview-server.ts`
- `listener` — `tools/preview-server.ts`
- `literal` — `tools/frozen-files.ts`
- `look` — in 5 files: `tools/`
- `lost` — `tools/fabricated-fight.ts`, `tools/turn-count.ts`, `tools/turn-reading.ts`
- `lostNow` — `tools/turn-count.ts`
- `mapped` — `tools/capture-intake.ts`
- `mark` — `tools/develop-reports.ts`, `tools/preview-state.ts`
- `marked` — `tools/skill-table.ts`
- `marker` — `tools/help-claim-register.ts`, `tools/protocol-key-table.ts`
- `markerAt` — `tools/protocol-key-table.ts`
- `markerLength` — `tools/protocol-key-table.ts`
- `mask` — `tools/aura-lifetime.ts`
- `material` — in 5 files: `tools/`
- `median` — `tools/payload-cost.ts`
- `members` — `tools/fight-figures.ts`
- `message` — `tools/protocol-key-shape.ts`, `tools/turn-reading.ts`
- `messages` — `tools/fabricated-fight.ts`, `tools/payload-cost.ts`
- `metadata` — `tools/build-userscript.ts`
- `milliseconds` — `tools/help-article.ts`
- `mine` — `tools/aura-lifetime.ts`, `tools/turn-count.ts`
- `missing` — `tools/help-article.ts`
- `most` — `tools/preview-page.ts`
- `moved` — in 4 files: `tools/`
- `name` — in 9 files: `tools/`
- `named` — in 8 files: `tools/`
- `namedBySkillId` — `tools/aura-standing.ts`
- `names` — `tools/develop-reports.ts`
- `needle` — `tools/help-article.ts`
- `newer` — `tools/develop-reports.ts`
- `next` — `tools/shout-holding.ts`
- `nonPlayer` — `tools/capture-intake.ts`
- `normalised` — `tools/fabricated-fight.ts`
- `note` — `tools/protocol-key-shape.ts`
- `notes` — `tools/card-height.ts`
- `now` — `tools/game-readings.ts`, `tools/shout-holding.ts`
- `occurrences` — `tools/protocol-key-shape.ts`
- `offered` — `tools/capture-intake.ts`
- `offset` — `tools/help-claim-register.ts`, `tools/protocol-key-shape.ts`
- `one` — in 8 files: `tools/`
- `only` — `tools/protocol-key-shape.ts`
- `open` — in 6 files: `tools/`
- `opened` — in 5 files: `tools/`
- `opener` — `tools/changelog.ts`, `tools/frozen-files.ts`, `tools/turn-reading.ts`
- `openerId` — `tools/turn-reading.ts`
- `opening` — `tools/preview-server.ts`
- `opens` — `tools/drill-report.ts`, `tools/fabricated-fight.ts`
- `order` — `tools/capture-intake.ts`
- `ordered` — `tools/card-height.ts`, `tools/payload-cost.ts`
- `ordinal` — `tools/fabricated-fight.ts`
- `other` — `tools/drill-report.ts`, `tools/fabricated-fight.ts`
- `outbound` — `tools/build-userscript.ts`
- `outcome` — `tools/fight-figures.ts`, `tools/turn-count.ts`
- `outcomes` — `tools/turn-count.ts`
- `output` — `tools/build-userscript.ts`, `tools/develop-reports.ts`
- `own` — `tools/aura-lifetime.ts`, `tools/payload-cost.ts`
- `ownTurnsEach` — `tools/aura-lifetime.ts`
- `page` — in 4 files: `tools/`
- `pageLength` — `tools/skill-table.ts`
- `pagePath` — `tools/skill-table.ts`
- `paged` — `tools/game-readings.ts`
- `pair` — `tools/drill-report.ts`
- `pairs` — `tools/capture-intake.ts`
- `panel` — `tools/panel-shots.ts`, `tools/preview-page.ts`, `tools/preview-state.ts`
- `paragraph` — `tools/protocol-key-shape.ts`
- `parameter` — `tools/protocol-key-shape.ts`
- `parameters` — `tools/protocol-key-shape.ts`, `tools/turn-reading.ts`
- `parsed` — in 11 files: `tools/`
- `parser` — `tools/preview-state.ts`
- `part` — `tools/drill-report.ts`
- `partRow` — `tools/drill-report.ts`
- `parts` — `tools/build-userscript.ts`, `tools/capture-intake.ts`
- `past` — `tools/shout-holding.ts`
- `path` — in 6 files: `tools/`
- `paths` — in 8 files: `tools/`
- `payload` — `tools/capture-intake.ts`, `tools/fabricated-fight.ts`, `tools/turn-reading.ts`
- `payloads` — `tools/payload-cost.ts`
- `pending` — `tools/capture-intake.ts`, `tools/preview-server.ts`, `tools/turn-reading.ts`
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
- `prefix` — `tools/build-userscript.ts`
- `prepared` — `tools/payload-cost.ts`
- `preview` — `tools/panel-giving-way.ts`, `tools/preview-server.ts`
- `previousActorId` — `tools/turn-reading.ts`
- `previousEnd` — `tools/help-article.ts`
- `profession` — `tools/fabricated-fight.ts`
- `queue` — `tools/fabricated-fight.ts`
- `quote` — `tools/protocol-key-table.ts`
- `quoted` — `tools/protocol-key-table.ts`
- `ranked` — `tools/fight-figures.ts`
- `raw` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `reach` — `tools/aura-standing.ts`
- `read` — in 6 files: `tools/`
- `readerSide` — `tools/preview-page.ts`
- `reading` — in 8 files: `tools/`
- `readings` — `tools/turn-reading.ts`
- `reason` — `tools/preview-server.ts`
- `record` — `tools/panel-shots.ts`, `tools/payload-cost.ts`, `tools/recorded-material.ts`
- `recorded` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `recording` — `tools/capture-intake.ts`
- `redraw` — `tools/panel-giving-way.ts`
- `reduction` — `tools/fabricated-fight.ts`
- `region` — `tools/panel-giving-way.ts`
- `regions` — `tools/panel-giving-way.ts`
- `removed` — `tools/capture-intake.ts`, `tools/game-readings.ts`
- `renamed` — `tools/capture-intake.ts`
- `replayed` — in 5 files: `tools/`
- `report` — `tools/protocol-key-shape.ts`
- `response` — `tools/game-client-source.ts`, `tools/help-article.ts`, `tools/skill-table.ts`
- `rest` — `tools/changelog.ts`, `tools/protocol-key-shape.ts`
- `restored` — `tools/fabricated-fight.ts`
- `result` — `tools/capture-intake.ts`
- `rewrite` — `tools/develop-reports.ts`
- `rewriteLines` — `tools/develop-reports.ts`
- `role` — `tools/buff-bit-table.ts`
- `roll` — `tools/capture-intake.ts`
- `root` — `tools/panel-giving-way.ts`
- `roster` — `tools/drill-report.ts`, `tools/turn-reading.ts`
- `round` — `tools/fabricated-fight.ts`
- `row` — in 5 files: `tools/`
- `rows` — `tools/aura-standing.ts`, `tools/shout-holding.ts`, `tools/skill-table.ts`
- `run` — `tools/aura-lifetime.ts`, `tools/payload-cost.ts`
- `rungs` — `tools/drill-report.ts`
- `runs` — `tools/aura-lifetime.ts`
- `runsByLength` — `tools/aura-lifetime.ts`
- `said` — in 7 files: `tools/`
- `scale` — `tools/fabricated-fight.ts`
- `scaled` — `tools/fabricated-fight.ts`
- `screen` — `tools/card-height.ts`, `tools/drill-report.ts`, `tools/preview-state.ts`
- `screens` — `tools/drill-report.ts`
- `script` — `tools/build-userscript.ts`, `tools/preview-page.ts`
- `section` — `tools/changelog.ts`, `tools/develop-reports.ts`
- `sections` — `tools/develop-reports.ts`
- `sentence` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `separator` — `tools/buff-bit-table.ts`
- `served` — `tools/game-client-source.ts`, `tools/panel-shots.ts`
- `server` — `tools/preview-server.ts`
- `session` — `tools/payload-cost.ts`
- `settings` — `tools/preview-page.ts`
- `shape` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `shapes` — `tools/protocol-key-shape.ts`
- `share` — `tools/fabricated-fight.ts`, `tools/shout-holding.ts`
- `shared` — `tools/aura-lifetime.ts`, `tools/develop-reports.ts`
- `sheet` — `tools/preview-page.ts`
- `shelved` — `tools/decoding-status.ts`
- `shift` — `tools/game-readings.ts`
- `shifts` — `tools/game-readings.ts`
- `shorter` — `tools/develop-reports.ts`
- `shot` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `shots` — `tools/panel-shots.ts`
- `shouldOpenFabricated` — `tools/preview-server.ts`
- `shout` — `tools/skill-table.ts`
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
- `skills` — `tools/game-readings.ts`, `tools/skill-table.ts`
- `slug` — `tools/capture-intake.ts`
- `sorted` — `tools/help-claim-register.ts`
- `source` — `tools/capture-intake.ts`, `tools/panel-giving-way.ts`
- `sources` — `tools/aura-standing.ts`
- `staging` — `tools/panel-shots.ts`
- `stale` — `tools/game-readings.ts`
- `stamped` — `tools/build-userscript.ts`
- `standing` — in 6 files: `tools/`
- `standsFromRight` — `tools/panel-shots.ts`
- `start` — in 5 files: `tools/`
- `started` — `tools/payload-cost.ts`
- `state` — in 5 files: `tools/`
- `stated` — in 8 files: `tools/`
- `states` — `tools/game-readings.ts`
- `statistics` — `tools/drill-report.ts`, `tools/fight-figures.ts`, `tools/turn-count.ts`
- `status` — `tools/decoding-status.ts`
- `step` — in 6 files: `tools/`
- `stepped` — `tools/recorded-material.ts`
- `steps` — in 5 files: `tools/`
- `stood` — `tools/preview-page.ts`
- `store` — `tools/preview-state.ts`
- `stretch` — `tools/turn-count.ts`
- `strongest` — `tools/protocol-key-shape.ts`
- `subject` — `tools/protocol-key-table.ts`
- `substitutions` — `tools/capture-intake.ts`
- `table` — `tools/game-readings.ts`
- `tail` — `tools/payload-cost.ts`
- `taken` — `tools/fabricated-fight.ts`, `tools/panel-shots.ts`, `tools/turn-count.ts`
- `takenAt` — `tools/panel-shots.ts`
- `takenNow` — `tools/turn-count.ts`
- `tallest` — `tools/card-height.ts`
- `tallies` — `tools/aura-standing.ts`, `tools/protocol-key-shape.ts`, `tools/turn-reading.ts`
- `tally` — in 7 files: `tools/`
- `target` — `tools/capture-intake.ts`, `tools/fabricated-fight.ts`
- `task` — `tools/capture-intake.ts`
- `terminator` — `tools/protocol-key-table.ts`
- `text` — in 11 files: `tools/`
- `textLength` — `tools/help-article.ts`
- `textPath` — `tools/help-article.ts`
- `texts` — `tools/frozen-files.ts`
- `ticked` — `tools/fabricated-fight.ts`
- `tips` — `tools/preview-page.ts`
- `tipsStyle` — `tools/preview-page.ts`
- `told` — `tools/preview-server.ts`
- `took` — `tools/payload-cost.ts`
- `tookMilliseconds` — `tools/payload-cost.ts`
- `total` — in 5 files: `tools/`
- `trimmed` — `tools/help-claim-register.ts`
- `turn` — `tools/fabricated-fight.ts`, `tools/turn-reading.ts`
- `turns` — in 6 files: `tools/`
- `turnsAtShout` — `tools/shout-holding.ts`
- `turnsByCombatantId` — `tools/aura-lifetime.ts`
- `unasked` — `tools/game-readings.ts`
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
- `url` — `tools/help-article.ts`, `tools/skill-table.ts`
- `value` — in 4 files: `tools/`
- `values` — `tools/skill-table.ts`
- `verdict` — `tools/game-readings.ts`, `tools/protocol-key-shape.ts`
- `version` — `tools/build-userscript.ts`, `tools/changelog.ts`, `tools/fabricated-fight.ts`
- `view` — in 5 files: `tools/`
- `walk` — `tools/turn-reading.ts`
- `walked` — `tools/drill-report.ts`
- `walks` — `tools/turn-reading.ts`
- `wanted` — `tools/capture-intake.ts`, `tools/preview-server.ts`
- `warning` — `tools/help-article.ts`
- `warrior` — `tools/fabricated-fight.ts`
- `warriors` — `tools/capture-intake.ts`, `tools/fabricated-fight.ts`
- `was` — `tools/aura-lifetime.ts`
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
- `words` — `tools/protocol-key-shape.ts`
- `world` — `tools/capture-intake.ts`
- `wound` — `tools/fabricated-fight.ts`
- `wrapped` — `tools/payload-cost.ts`
- `writing` — `tools/preview-state.ts`
- `written` — in 10 files: `tools/`
- `wrong` — `tools/turn-count.ts`
- `x` — `tools/panel-shots.ts`

### `tests/`

- `ONE_TOO_MANY` — `tests/ui/panel-content.test.ts`
- `WINDOW_LEFT` — `tests/ui/panel-drag.test.ts`
- `_` — `tests/game/warrior-snapshot.test.ts`
- `_dropped` — `tests/tools/game-client-source.test.ts`, `tests/tools/help-article.test.ts`
- `abandoned` — `tests/runtime/engine-search.test.ts`
- `above` — in 4 files: `tests/`
- `absent` — in 6 files: `tests/`
- `acted` — `tests/core/turn-clock.test.ts`
- `action` — `tests/repository/workflows.test.ts`
- `actor` — `tests/core/message-grammar.test.ts`, `tests/ui/panel-screen.test.ts`
- `actorId` — `tests/core/granted-blow-rule.test.ts`, `tests/core/injure-rule.test.ts`
- `actors` — `tests/core/npc-heal-rule.test.ts`
- `addOn` — `tests/repository/captured-fight-register.test.ts`
- `added` — `tests/runtime/defect-ledger.test.ts`
- `addon` — `tests/tools/preview-page.test.ts`
- `adds` — `tests/tools/turn-reading.test.ts`
- `admitted` — `tests/runtime/fight-file.test.ts`
- `after` — in 17 files: `tests/`
- `afterRow` — `tests/e2e/panel-drag.spec.ts`
- `afterTheYear` — `tests/ui/panel-words.test.ts`
- `again` — in 6 files: `tests/`
- `agreed` — `tests/tools/develop-reports.test.ts`, `tests/tools/turn-count.test.ts`,
  `tests/ui/panel-content.test.ts`
- `agreeing` — `tests/repository/design-tokens.test.ts`
- `aimed` — `tests/core/aura-standing.test.ts`, `tests/core/fight-statistics.test.ts`
- `air` — `tests/ui/panel-look.test.ts`
- `allowed` — `tests/e2e/panel-fixture.ts`, `tests/repository/layers.test.ts`
- `alone` — in 12 files: `tests/`
- `along` — `tests/e2e/panel-probe.ts`
- `amount` — in 4 files: `tests/`
- `amounts` — `tests/ui/share-bound.test.ts`
- `anchor` — `tests/fake-window.ts`, `tests/game/browser-file.test.ts`,
  `tests/userscript-entry.test.ts`
- `anchorless` — `tests/game/browser-file.test.ts`
- `annotation` — `tests/repository/purity.test.ts`
- `announced` — in 8 files: `tests/`
- `announcedByPlayer` — `tests/core/charged-skill.test.ts`
- `announcement` — `tests/core/message-grammar.test.ts`
- `announcements` — `tests/core/anguish-rule.test.ts`
- `announcingOnSide` — `tests/tools/drill-report.test.ts`
- `answer` — `tests/game/game-battle.test.ts`, `tests/tools/preview-server.test.ts`
- `answered` — `tests/game/browser-store.test.ts`, `tests/runtime-world.ts`
- `answering` — `tests/game/game-tooltip.test.ts`
- `answers` — `tests/e2e/panel-boot.spec.ts`
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
- `asset` — `tests/tools/preview-site.test.ts`
- `astray` — `tests/tools/panel-shots.test.ts`
- `at` — in 54 files: `tests/`
- `atBound` — in 4 files: `tests/`
- `atIntake` — `tests/runtime/fight-file.test.ts`
- `atShare` — `tests/core/combatant-health.test.ts`
- `atTheBound` — `tests/ui/panel-words.test.ts`
- `attack` — `tests/core/fight-decoder.test.ts`
- `attacker` — `tests/core/injure-rule.test.ts`
- `attackers` — `tests/core/injure-rule.test.ts`
- `attacks` — `tests/core/fight-decoder.test.ts`
- `aura` — `tests/core/fight-statistics.test.ts`, `tests/tools/frozen-files.test.ts`
- `auto` — `tests/ui/panel-helper.test.ts`
- `back` — in 5 files: `tests/`
- `balance` — `tests/core/fight-statistics.test.ts`
- `band` — `tests/tools/preview-site.test.ts`
- `bandaged` — `tests/core/fight-statistics.test.ts`
- `banner` — `tests/e2e/build-once.ts`, `tests/tools/build-userscript.test.ts`
- `bar` — in 13 files: `tests/`
- `bare` — in 9 files: `tests/`
- `bars` — `tests/ui/panel-element.test.ts`
- `base` — `tests/repository/name-register.test.ts`, `tests/runtime-world.ts`,
  `tests/ui/level-drawn.test.ts`
- `baseline` — `tests/tools/shout-holding.test.ts`
- `battle` — in 8 files: `tests/`
- `before` — in 21 files: `tests/`
- `beforeMidnight` — `tests/ui/panel-words.test.ts`
- `beforeTheHour` — `tests/ui/panel-words.test.ts`
- `beforeTheYear` — `tests/ui/panel-words.test.ts`
- `began` — `tests/tools/preview-site.test.ts`
- `behaviour` — `tests/libs/json-text.test.ts`
- `below` — `tests/repository/changelog.test.ts`, `tests/repository/workflows.test.ts`,
  `tests/ui/panel-look.test.ts`
- `beside` — in 4 files: `tests/`
- `between` — in 4 files: `tests/`
- `bigger` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`
- `binding` — `tests/repository/purity.test.ts`
- `bit` — `tests/core/carried-status.test.ts`, `tests/ui/panel-words.test.ts`,
  `tests/userscript-entry.test.ts`
- `bits` — `tests/core/fight-session.test.ts`, `tests/tools/frozen-files.test.ts`
- `bitten` — `tests/core/fight-statistics.test.ts`
- `blank` — `tests/runtime/fight-file.test.ts`
- `bled` — `tests/core/anguish-rule.test.ts`
- `blind` — `tests/runtime/fight-file.test.ts`
- `block` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/help-article.test.ts`,
  `tests/ui/panel-element.test.ts`
- `blocked` — `tests/core/fight-statistics.test.ts`
- `blocks` — `tests/runtime/carried-tooltip.test.ts`, `tests/ui/panel-element.test.ts`
- `blow` — `tests/core/fight-decoder.test.ts`
- `blows` — `tests/core/fight-statistics.test.ts`, `tests/core/granted-blow-rule.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `blue` — `tests/ui/panel-look.test.ts`
- `board` — `tests/game/game-tooltip.test.ts`
- `body` — in 8 files: `tests/`
- `bold` — `tests/ui/panel-card.test.ts`
- `both` — in 14 files: `tests/`
- `bound` — `tests/repository/names.test.ts`
- `boundaries` — `tests/tools/turn-count.test.ts`
- `bounded` — `tests/core/granted-blow-rule.test.ts`, `tests/tools/turn-count.test.ts`
- `bounds` — `tests/ui/panel-drag.test.ts`
- `box` — in 8 files: `tests/`
- `boxes` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-marks.spec.ts`
- `breach` — `tests/repository/purity.test.ts`
- `broken` — in 9 files: `tests/`
- `build` — `tests/game/game-build.test.ts`, `tests/repository/captured-fight-register.test.ts`,
  `tests/runtime/live-fight.test.ts`
- `built` — `tests/e2e/build-once.ts`, `tests/repository/regular-expressions.test.ts`,
  `tests/tools/build-userscript.test.ts`
- `bundle` — in 5 files: `tests/`
- `byCombatantId` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `byId` — `tests/recorded-fights.ts`
- `byKey` — `tests/ui/panel-content.test.ts`
- `byMessage` — `tests/core/health-witness.test.ts`
- `byName` — `tests/repository/decisions.test.ts`
- `byProfession` — `tests/repository/captured-fight-register.test.ts`
- `byVerb` — `tests/repository/name-register.test.ts`
- `call` — in 12 files: `tests/`
- `callback` — `tests/repository/handed-callbacks.test.ts`
- `called` — in 4 files: `tests/`
- `callee` — `tests/repository/event-entries.test.ts`, `tests/repository/purity.test.ts`
- `calleeName` — `tests/repository/event-entries.test.ts`, `tests/repository/purity.test.ts`
- `calleeVerb` — `tests/repository/event-entries.test.ts`
- `caller` — in 5 files: `tests/`
- `callerName` — `tests/repository/called-once.test.ts`, `tests/repository/purity.test.ts`
- `callerPurity` — `tests/repository/purity.test.ts`
- `calls` — in 15 files: `tests/`
- `camel` — `tests/repository/names.test.ts`
- `cancelled` — `tests/game/browser-frame.test.ts`, `tests/game/browser-interval.test.ts`
- `cancels` — `tests/runtime/engine-search.test.ts`
- `candidate` — `tests/source-tree.ts`
- `cap` — `tests/ui/panel-element.test.ts`
- `capped` — `tests/core/combatant-health.test.ts`
- `capture` — `tests/runtime/live-fight.test.ts`
- `card` — in 14 files: `tests/`
- `cards` — `tests/e2e/panel-camera.ts`
- `carried` — in 13 files: `tests/`
- `carries` — `tests/core/anguish-rule.test.ts`
- `carrying` — in 5 files: `tests/`
- `cases` — in 4 files: `tests/`
- `cast` — in 8 files: `tests/`
- `caster` — `tests/core/absorption-destruction-rule.test.ts`, `tests/ui/panel-content.test.ts`
- `casters` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/tools/fabricated-fight.test.ts`
- `casts` — `tests/core/combatant-health.test.ts`
- `cause` — `tests/simulation.ts`
- `caveat` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-words.test.ts`
- `cell` — in 5 files: `tests/`
- `cells` — in 11 files: `tests/`
- `centred` — `tests/tools/preview-page.test.ts`
- `change` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-screen.test.ts`
- `changed` — `tests/repository/purity.test.ts`, `tests/tools/capture-intake.test.ts`,
  `tests/tools/develop-reports.test.ts`
- `changes` — `tests/repository/purity.test.ts`
- `channel` — `tests/ui/panel-look.test.ts`
- `channels` — `tests/ui/panel-look.test.ts`
- `character` — in 11 files: `tests/`
- `charge` — `tests/core/fight-session.test.ts`, `tests/runtime/carried-tooltip.test.ts`
- `charged` — in 6 files: `tests/`
- `charges` — `tests/ui/panel-helper.test.ts`
- `charging` — `tests/tools/panel-shots.test.ts`, `tests/ui/helper-window.test.ts`
- `checked` — in 5 files: `tests/`
- `child` — `tests/fake-document.ts`, `tests/repository/name-register.test.ts`
- `choice` — in 8 files: `tests/`
- `citation` — `tests/repository/cited-paths.test.ts`
- `cited` — `tests/repository/protocol-keys.test.ts`
- `claim` — `tests/repository/protocol-keys.test.ts`
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
- `cleared` — `tests/game/browser-interval.test.ts`
- `clock` — `tests/game/browser-clock.test.ts`, `tests/runtime/engine-search.test.ts`
- `close` — `tests/core/last-heal-rule.test.ts`, `tests/markdown-document.ts`
- `closed` — in 11 files: `tests/`
- `closes` — `tests/repository/captured-fight-register.test.ts`,
  `tests/repository/protocol-keys.test.ts`, `tests/tools/drill-report.test.ts`
- `closest` — `tests/core/last-heal-rule.test.ts`
- `closing` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `closure` — `tests/repository/handed-callbacks.test.ts`
- `code` — `tests/ui/panel-palette.test.ts`
- `collections` — `tests/repository/purity.test.ts`
- `colon` — `tests/ui/panel-look.test.ts`
- `colourless` — `tests/ui/panel-element.test.ts`
- `colours` — `tests/ui/panel-look.test.ts`
- `combatant` — `tests/core/combatant-health.test.ts`, `tests/game/warrior-snapshot.test.ts`,
  `tests/recorded-fights.ts`
- `combatantId` — in 9 files: `tests/`
- `combatants` — in 12 files: `tests/`
- `combatantsBefore` — `tests/runtime/live-fight.test.ts`
- `command` — `tests/repository/name-register.test.ts`
- `comment` — `tests/repository/comment-share.test.ts`, `tests/source-tree.ts`
- `commented` — `tests/core/aura-standing.test.ts`
- `compared` — `tests/game/warrior-snapshot.test.ts`
- `comparison` — `tests/tools/develop-reports.test.ts`
- `compose` — `tests/tools/preview-state.test.ts`, `tests/ui/panel-look.test.ts`
- `composed` — `tests/repository/name-register.test.ts`, `tests/repository/protocol-keys.test.ts`,
  `tests/runtime/fight-file.test.ts`
- `composedLines` — `tests/repository/name-register.test.ts`
- `computed` — `tests/repository/cited-paths.test.ts`
- `computedFamily` — `tests/tools/protocol-key-table.test.ts`
- `config` — `tests/tools/panel-shots.test.ts`
- `configuration` — `tests/repository/documents.test.ts`,
  `tests/repository/fabricated-fights.test.ts`, `tests/repository/name-register.test.ts`
- `contested` — `tests/tools/turn-reading.test.ts`
- `context` — in 11 files: `tests/`
- `continued` — `tests/repository/protocol-keys.test.ts`
- `contradicted` — `tests/ui/panel-content.test.ts`
- `control` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-element.test.ts`
- `core` — `tests/repository/layers.test.ts`, `tests/repository/reader-layer.test.ts`
- `corner` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-size.spec.ts`
- `corners` — `tests/e2e/panel-drag.spec.ts`
- `count` — in 8 files: `tests/`
- `counted` — in 13 files: `tests/`
- `counters` — `tests/ui/panel-card.test.ts`
- `counts` — in 6 files: `tests/`
- `covered` — `tests/e2e/panel-layer.spec.ts`
- `covering` — `tests/e2e/panel-layer.spec.ts`
- `cramped` — `tests/runtime/shelf.test.ts`, `tests/ui/panel-drag.test.ts`
- `createElement` — `tests/fake-window.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/ui/view-failure.test.ts`
- `created` — `tests/fake-document.ts`
- `critical` — `tests/core/message-grammar.test.ts`
- `crumb` — `tests/ui/panel-element.test.ts`
- `crumbs` — `tests/ui/panel-element.test.ts`
- `current` — `tests/tools/game-readings.test.ts`, `tests/ui/panel-element.test.ts`
- `curse` — `tests/core/protocol-key.test.ts`
- `cut` — in 7 files: `tests/`
- `cycle` — `tests/game/fight-capture.test.ts`, `tests/libs/json-text.test.ts`
- `damage` — `tests/ui/panel-screen.test.ts`
- `damageDealt` — `tests/runtime/margometer-runtime.test.ts`
- `damageDealtAbsorbed` — `tests/runtime/margometer-runtime.test.ts`
- `damageDealtApplied` — `tests/runtime/margometer-runtime.test.ts`
- `damageDealtByOpponent` — `tests/core/fight-statistics.test.ts`
- `dangling` — `tests/repository/cited-paths.test.ts`, `tests/repository/documents.test.ts`
- `dated` — in 4 files: `tests/`
- `day` — `tests/tools/help-article.test.ts`
- `deaf` — `tests/ui/helper-window.test.ts`
- `dealer` — `tests/core/fight-statistics.test.ts`, `tests/runtime/fight-file.test.ts`
- `dealt` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `dealtByKind` — `tests/core/fight-statistics.test.ts`
- `dealtRows` — `tests/ui/panel-content.test.ts`
- `dealtTogether` — `tests/ui/panel-content.test.ts`
- `dealtTotal` — `tests/tools/drill-report.test.ts`
- `declaration` — in 7 files: `tests/`
- `declarator` — in 4 files: `tests/`
- `declarators` — `tests/repository/handed-callbacks.test.ts`
- `declared` — in 9 files: `tests/`
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
- `defence` — `tests/core/protocol-key.test.ts`
- `delegating` — `tests/repository/protocol-keys.test.ts`
- `denied` — `tests/repository/documents.test.ts`
- `departure` — `tests/ui/panel-look.test.ts`
- `depth` — in 9 files: `tests/`
- `derived` — `tests/repository/declaration-order.test.ts`,
  `tests/repository/skill-durations.test.ts`
- `design` — `tests/repository/event-entries.test.ts`
- `destroyed` — `tests/ui/blow-vocabulary.test.ts`
- `detail` — `tests/game/browser-console.test.ts`, `tests/simulation.ts`
- `develop` — `tests/repository/cited-paths.test.ts`, `tests/ui/panel-look.test.ts`
- `developKept` — `tests/ui/panel-look.test.ts`
- `developRules` — `tests/ui/panel-look.test.ts`
- `dictionary` — `tests/game/game-dictionary.test.ts`
- `differed` — `tests/ui/panel-content.test.ts`
- `difference` — `tests/tools/develop-reports.test.ts`
- `digitsFrom` — `tests/repository/documents.test.ts`
- `directions` — `tests/ui/panel-screen.test.ts`
- `directories` — `tests/repository/documents.test.ts`, `tests/repository/name-register.test.ts`
- `directory` — in 9 files: `tests/`
- `disagreeing` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/repository/protocol-keys.test.ts`
- `disputed` — `tests/tools/turn-reading.test.ts`
- `distance` — `tests/core/combatant-health.test.ts`
- `distinct` — `tests/core/combatant-roster.test.ts`
- `distribution` — `tests/tools/card-height.test.ts`
- `docblock` — `tests/repository/comment-share.test.ts`
- `document` — in 13 files: `tests/`
- `documented` — `tests/tools/aura-lifetime.test.ts`, `tests/tools/aura-standing.test.ts`
- `documents` — `tests/repository/documents.test.ts`
- `doesCarryUnsizedShare` — `tests/core/health-witness.test.ts`
- `doesOpen` — `tests/tools/drill-report.test.ts`, `tests/ui/panel-element.test.ts`
- `doesState` — `tests/ui/level-drawn.test.ts`
- `dots` — `tests/ui/helper-window.test.ts`
- `doubled` — `tests/repository/names.test.ts`, `tests/runtime/carried-tooltip.test.ts`
- `download` — `tests/e2e/panel-save.spec.ts`
- `downloads` — `tests/game/browser-file.test.ts`
- `drained` — `tests/core/fight-statistics.test.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/ui/panel-content.test.ts`
- `drawn` — in 16 files: `tests/`
- `drawnBar` — `tests/ui/panel-element.test.ts`
- `dressed` — `tests/tools/preview-page.test.ts`
- `drill` — in 5 files: `tests/`
- `driver` — `tests/tools/preview-page.test.ts`
- `dropped` — `tests/ui/view-failure.test.ts`
- `duel` — `tests/tools/fabricated-fight.test.ts`
- `early` — `tests/repository/changelog.test.ts`, `tests/ui/panel-element.test.ts`
- `east` — `tests/game/game-place.test.ts`
- `edge` — `tests/e2e/panel-options.spec.ts`, `tests/tools/preview-state.test.ts`
- `edited` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/frozen-files.test.ts`
- `elapsed` — `tests/core/aura-standing.test.ts`
- `element` — in 5 files: `tests/`
- `elements` — `tests/core/fight-decoder.test.ts`
- `elsewhere` — in 5 files: `tests/`
- `emptied` — `tests/core/granted-blow-rule.test.ts`
- `empty` — in 11 files: `tests/`
- `enclosing` — `tests/repository/handed-callbacks.test.ts`
- `encode` — `tests/tools/frozen-files.test.ts`
- `end` — in 7 files: `tests/`
- `ended` — `tests/core/aura-standing.test.ts`, `tests/core/fight-decoder.test.ts`
- `endless` — `tests/libs/unknown-value.test.ts`
- `ends` — in 5 files: `tests/`
- `engine` — in 6 files: `tests/`
- `engineOwn` — `tests/runtime/margometer-runtime.test.ts`
- `english` — `tests/tools/capture-intake.test.ts`
- `entered` — `tests/core/combatant-health.test.ts`
- `entries` — in 5 files: `tests/`
- `entry` — in 9 files: `tests/`
- `envelope` — `tests/tools/fabricated-fight.test.ts`
- `error` — `tests/tools/changelog.test.ts`, `tests/tools/fight-figures.test.ts`,
  `tests/tools/recorded-material.test.ts`
- `event` — in 14 files: `tests/`
- `events` — in 14 files: `tests/`
- `every` — `tests/ui/view-failure.test.ts`
- `everyone` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `everything` — `tests/core/last-heal-rule.test.ts`
- `exact` — `tests/core/combatant-health.test.ts`
- `exceeded` — `tests/core/message-grammar.test.ts`
- `excluded` — `tests/repository/documents.test.ts`
- `expected` — in 6 files: `tests/`
- `explained` — `tests/tools/drill-report.test.ts`
- `extra` — `tests/core/turn-clock.test.ts`
- `extras` — `tests/core/turn-clock.test.ts`
- `factors` — `tests/ui/panel-look.test.ts`
- `failed` — `tests/libs/errors.test.ts`, `tests/runtime/live-fight.test.ts`
- `failing` — `tests/runtime/engine-search.test.ts`
- `failure` — `tests/userscript-entry.test.ts`
- `failures` — in 9 files: `tests/`
- `faked` — `tests/fake-window.ts`
- `fallen` — `tests/fake-window.ts`, `tests/runtime-world.ts`
- `family` — `tests/tools/frozen-files.test.ts`
- `far` — `tests/tools/help-article.test.ts`
- `faulted` — `tests/simulation.test.ts`
- `faults` — `tests/repository/changelog.test.ts`, `tests/simulation.test.ts`
- `faultsInjected` — `tests/simulation.ts`
- `fed` — `tests/e2e/panel-boot.spec.ts`
- `fence` — `tests/repository/name-register.test.ts`
- `few` — `tests/repository/name-register.test.ts`
- `field` — `tests/e2e/panel-save.spec.ts`, `tests/game/payload-envelope.test.ts`
- `fight` — in 43 files: `tests/`
- `fightDealt` — `tests/core/fight-statistics.test.ts`
- `fightTaken` — `tests/core/fight-statistics.test.ts`
- `fights` — in 7 files: `tests/`
- `figure` — in 6 files: `tests/`
- `figured` — `tests/runtime/carried-tooltip.test.ts`, `tests/ui/panel-words.test.ts`
- `figures` — in 17 files: `tests/`
- `file` — in 9 files: `tests/`
- `files` — in 15 files: `tests/`
- `fill` — `tests/ui/panel-content.test.ts`
- `fills` — `tests/ui/panel-look.test.ts`
- `fire` — `tests/runtime/margometer-runtime.test.ts`
- `fired` — `tests/runtime/margometer-runtime.test.ts`
- `first` — in 27 files: `tests/`
- `firstBy` — `tests/core/combatant-health.test.ts`
- `fits` — `tests/game/game-dictionary.test.ts`
- `fitting` — `tests/ui/blow-vocabulary.test.ts`
- `five` — `tests/core/fight-decoder.test.ts`
- `flagged` — in 6 files: `tests/`
- `flat` — `tests/core/fight-statistics.test.ts`, `tests/libs/json-text.test.ts`
- `fled` — in 4 files: `tests/`
- `floored` — `tests/ui/share-column.test.ts`
- `flushed` — `tests/tools/preview-page.test.ts`
- `focusedBy` — `tests/rebuilding-battle.ts`
- `fold` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-gesture.test.ts`,
  `tests/ui/view-failure.test.ts`
- `folded` — in 4 files: `tests/`
- `folding` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-gesture.test.ts`
- `following` — `tests/core/granted-blow-rule.test.ts`
- `font` — in 4 files: `tests/`
- `foreign` — `tests/game/game-battle.test.ts`
- `forged` — `tests/game/fight-capture.test.ts`
- `format` — `tests/repository/documents.test.ts`
- `found` — in 65 files: `tests/`
- `four` — `tests/runtime/shelf.test.ts`
- `fraction` — `tests/runtime/settings.test.ts`
- `fragments` — `tests/tools/help-article.test.ts`
- `frame` — in 4 files: `tests/`
- `frames` — `tests/game/browser-frame.test.ts`, `tests/runtime-world.ts`
- `freed` — `tests/core/aura-standing.test.ts`, `tests/tools/shout-holding.test.ts`
- `fresh` — `tests/core/fight-decoder.test.ts`, `tests/game/game-tooltip.test.ts`
- `freshestByWounded` — `tests/core/injure-rule.test.ts`
- `from` — in 8 files: `tests/`
- `fromDealt` — `tests/ui/panel-screen.test.ts`
- `fromDevelop` — `tests/runtime/shelf.test.ts`
- `fromNobody` — `tests/core/fight-statistics.test.ts`
- `fromStart` — `tests/core/fight-session.test.ts`
- `fromTaken` — `tests/ui/panel-screen.test.ts`
- `frozen` — in 4 files: `tests/`
- `full` — in 8 files: `tests/`
- `function_` — `tests/repository/name-register.test.ts`
- `functions` — in 4 files: `tests/`
- `further` — `tests/core/message-grammar.test.ts`
- `game` — in 4 files: `tests/`
- `gameBuild` — `tests/tools/protocol-key-table.test.ts`
- `gap` — `tests/e2e/panel-card.spec.ts`
- `gesture` — `tests/e2e/panel-camera.ts`
- `getShelf` — `tests/runtime/shelf-keeper.test.ts`
- `given` — in 4 files: `tests/`
- `giver` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `glued` — `tests/core/fight-decoder.test.ts`
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
- `guarding` — `tests/repository/handed-callbacks.test.ts`
- `guards` — `tests/repository/documents.test.ts`
- `half` — `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/shelf.test.ts`,
  `tests/tools/preview-state.test.ts`
- `halfNamed` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-element.test.ts`
- `halved` — `tests/repository/design-tokens.test.ts`
- `handed` — `tests/e2e/panel-save.spec.ts`, `tests/repository/handed-callbacks.test.ts`,
  `tests/runtime/defect-ledger.test.ts`
- `handle` — `tests/fake-document.ts`, `tests/ui/card-window.test.ts`,
  `tests/ui/panel-gesture.test.ts`
- `hasRoot` — `tests/e2e/panel-boot.spec.ts`
- `hasSnapshot` — `tests/recorded-fights.ts`
- `hasThrownIntoGame` — `tests/simulation.ts`
- `hash` — `tests/tools/preview-state.test.ts`
- `hatch` — `tests/ui/panel-look.test.ts`
- `hatched` — `tests/ui/panel-element.test.ts`
- `header` — in 4 files: `tests/`
- `heading` — in 6 files: `tests/`
- `headings` — `tests/repository/changelog.test.ts`, `tests/repository/comment-share.test.ts`,
  `tests/ui/panel-element.test.ts`
- `heal` — `tests/core/combatant-health.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/core/legendary-standing.test.ts`
- `healed` — in 5 files: `tests/`
- `healer` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `healing` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-screen.test.ts`
- `heals` — in 5 files: `tests/`
- `health` — `tests/core/combatant-health.test.ts`, `tests/recorded-fights.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `healthMaximum` — `tests/core/health-witness.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/recorded-fights.ts`
- `healthMaximumById` — `tests/core/bandage-rule.test.ts`, `tests/core/health-witness.test.ts`,
  `tests/core/wound-rule.test.ts`
- `healthPercent` — `tests/recorded-fights.ts`
- `healthReadings` — `tests/recorded-fights.ts`
- `heard` — `tests/tools/turn-count.test.ts`, `tests/ui/panel-content.test.ts`
- `height` — `tests/ui/panel-look.test.ts`, `tests/userscript-entry.test.ts`
- `heights` — `tests/tools/card-height.test.ts`
- `held` — in 41 files: `tests/`
- `help` — `tests/tools/frozen-files.test.ts`
- `helper` — `tests/repository/declaration-order.test.ts`, `tests/ui/panel-drag.test.ts`,
  `tests/ui/panel-look.test.ts`
- `here` — `tests/core/absorption-destruction-rule.test.ts`, `tests/core/last-heal-rule.test.ts`
- `hereKept` — `tests/ui/panel-look.test.ts`
- `hereRules` — `tests/ui/panel-look.test.ts`
- `hero` — in 4 files: `tests/`
- `high` — `tests/ui/panel-look.test.ts`
- `highest` — `tests/core/message-grammar.test.ts`,
  `tests/repository/captured-fight-register.test.ts`, `tests/repository/declaration-order.test.ts`
- `history` — `tests/repository/cited-paths.test.ts`
- `hit` — `tests/core/fight-decoder.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/core/message-grammar.test.ts`
- `hits` — `tests/core/fight-decoder.test.ts`
- `holder` — in 4 files: `tests/`
- `holders` — `tests/repository/name-register.test.ts`, `tests/ui/panel-words.test.ts`
- `holdersByValue` — `tests/repository/name-register.test.ts`
- `holding` — `tests/ui/helper-window.test.ts`
- `holed` — `tests/runtime/shelf.test.ts`
- `host` — in 13 files: `tests/`
- `html` — `tests/e2e/panel-fixture.ts`
- `hue` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`
- `hues` — `tests/ui/panel-look.test.ts`
- `hurt` — `tests/core/combatant-health.test.ts`
- `id` — in 14 files: `tests/`
- `identifier` — `tests/repository/declaration-order.test.ts`
- `identifiers` — `tests/repository/called-once.test.ts`
- `idle` — `tests/game/game-battle.test.ts`, `tests/ui/panel-content.test.ts`
- `ids` — `tests/game/game-tooltip.test.ts`, `tests/ui/panel-content.test.ts`
- `ignored` — `tests/repository/fabricated-fights.test.ts`
- `imported` — `tests/source-tree.ts`
- `importer` — `tests/repository/single-importer.test.ts`
- `importers` — `tests/repository/single-importer.test.ts`
- `importersByModule` — `tests/repository/single-importer.test.ts`
- `index` — in 16 files: `tests/`
- `init` — `tests/repository/handed-callbacks.test.ts`, `tests/repository/purity.test.ts`,
  `tests/source-tree.ts`
- `initType` — `tests/repository/names.test.ts`
- `ink` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`
- `inks` — `tests/ui/panel-look.test.ts`
- `input` — `tests/repository/workflows.test.ts`
- `insetAbove` — `tests/ui/panel-look.test.ts`
- `insetBelow` — `tests/ui/panel-look.test.ts`
- `inside` — in 7 files: `tests/`
- `intent` — `tests/ui/panel-intent.test.ts`
- `interval` — `tests/game/browser-interval.test.ts`
- `into` — `tests/tools/panel-giving-way.test.ts`
- `is` — `tests/ui/panel-look.test.ts`
- `isAnswering` — `tests/game/game-tooltip.test.ts`
- `isAppended` — `tests/runtime/carried-tooltip.test.ts`
- `isAt` — `tests/core/health-witness.test.ts`
- `isConstructor` — `tests/repository/regular-expressions.test.ts`
- `isExported` — `tests/repository/declaration-order.test.ts`
- `isFunction` — `tests/repository/name-register.test.ts`
- `isInit` — `tests/core/fight-figures.test.ts`
- `isInside` — `tests/tools/turn-count.test.ts`, `tests/tools/turn-reading.test.ts`
- `isLiteral` — `tests/repository/regular-expressions.test.ts`
- `isLocal` — `tests/userscript-entry.test.ts`
- `isName` — `tests/core/skill-announcement-rule.test.ts`, `tests/ui/panel-words.test.ts`
- `isPlayer` — `tests/repository/captured-fight-register.test.ts`
- `isPoolRaised` — `tests/core/health-witness.test.ts`
- `isRefusing` — `tests/runtime/shelf-keeper.test.ts`, `tests/ui/view-failure.test.ts`
- `isSession` — `tests/userscript-entry.test.ts`
- `isShaped` — `tests/ui/panel-words.test.ts`
- `isShared` — `tests/verb-purities.ts`
- `isSpent` — `tests/runtime/carried-tooltip.test.ts`
- `isThrowing` — `tests/game/game-tooltip.test.ts`
- `isTick` — `tests/core/wound-rule.test.ts`
- `isTold` — `tests/runtime/carried-tooltip.test.ts`
- `isTop` — `tests/repository/name-register.test.ts`
- `isTurnsFirst` — `tests/runtime/carried-tooltip.test.ts`
- `isWrite` — `tests/simulation.ts`
- `item` — `tests/repository/declaration-order.test.ts`
- `items` — `tests/repository/declaration-order.test.ts`
- `joined` — `tests/core/fight-session.test.ts`, `tests/runtime/carried-tooltip.test.ts`,
  `tests/ui/panel-content.test.ts`
- `keeper` — `tests/runtime/live-fight.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `kept` — in 16 files: `tests/`
- `keptCalls` — `tests/runtime/live-fight.test.ts`
- `kepts` — `tests/runtime/margometer-runtime.test.ts`
- `key` — in 17 files: `tests/`
- `keyed` — `tests/game/payload-envelope.test.ts`, `tests/game/warrior-entries.test.ts`,
  `tests/ui/panel-element.test.ts`
- `keyedPast` — `tests/game/payload-envelope.test.ts`
- `keyless` — `tests/core/message-grammar.test.ts`
- `keys` — in 14 files: `tests/`
- `killing` — `tests/core/message-grammar.test.ts`
- `kind` — in 7 files: `tests/`
- `kinds` — in 9 files: `tests/`
- `kindsSaid` — `tests/simulation.ts`
- `known` — in 7 files: `tests/`
- `labels` — `tests/e2e/panel-card.spec.ts`
- `landed` — `tests/e2e/panel-drag.spec.ts`, `tests/e2e/panel-tooltip.spec.ts`
- `large` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`
- `largest` — `tests/core/combatant-roster.test.ts`, `tests/ui/panel-element.test.ts`
- `last` — `tests/core/last-heal-rule.test.ts`, `tests/repository/changelog.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `lastShout` — `tests/core/aura-standing.test.ts`
- `late` — in 5 files: `tests/`
- `lateClock` — `tests/runtime/engine-search.test.ts`
- `latePage` — `tests/runtime/engine-search.test.ts`
- `later` — `tests/ui/card-window.test.ts`
- `layer` — `tests/repository/layers.test.ts`, `tests/repository/name-register.test.ts`
- `layered` — `tests/game/game-battle.test.ts`
- `layers` — `tests/repository/name-register.test.ts`
- `lead` — `tests/repository/documents.test.ts`
- `leaves` — `tests/ui/panel-element.test.ts`
- `lede` — `tests/tools/preview-site.test.ts`
- `ledger` — `tests/runtime/defect-ledger.test.ts`
- `left` — in 4 files: `tests/`
- `legal` — `tests/repository/protocol-keys.test.ts`
- `length` — `tests/ui/panel-look.test.ts`
- `letter` — in 4 files: `tests/`
- `letters` — `tests/repository/protocol-keys.test.ts`
- `level` — `tests/recorded-fights.ts`, `tests/repository/captured-fight-register.test.ts`,
  `tests/ui/panel-element.test.ts`
- `levels` — `tests/repository/captured-fight-register.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `library` — `tests/repository/layers.test.ts`, `tests/source-tree.ts`
- `libs` — `tests/source-tree.ts`
- `lightest` — `tests/ui/panel-look.test.ts`
- `lightings` — `tests/tools/aura-lifetime.test.ts`
- `line` — in 27 files: `tests/`
- `lines` — in 20 files: `tests/`
- `list` — in 9 files: `tests/`
- `listed` — in 11 files: `tests/`
- `listedPart` — `tests/ui/panel-element.test.ts`
- `listener` — `tests/runtime/engine-search.test.ts`, `tests/runtime/live-fight.test.ts`
- `listeners` — `tests/tools/preview-server.test.ts`
- `lit` — `tests/core/fight-session.test.ts`, `tests/ui/helper-window.test.ts`
- `literal` — `tests/repository/regular-expressions.test.ts`
- `little` — `tests/e2e/panel-card.spec.ts`
- `little_` — `tests/e2e/panel-card.spec.ts`
- `live` — in 4 files: `tests/`
- `loading` — `tests/game/game-place.test.ts`
- `local` — `tests/source-tree.ts`
- `logged` — `tests/core/fight-decoder.test.ts`
- `longCast` — `tests/e2e/panel-helper.spec.ts`
- `longDrawn` — `tests/e2e/panel-helper.spec.ts`
- `longWanted` — `tests/e2e/panel-helper.spec.ts`
- `longer` — `tests/core/granted-blow-rule.test.ts`, `tests/tools/develop-reports.test.ts`
- `longest` — `tests/core/fight-decoder.test.ts`
- `longhand` — `tests/ui/panel-look.test.ts`
- `look` — `tests/core/granted-blow-rule.test.ts`, `tests/ui/panel-words.test.ts`
- `looked` — `tests/repository/protocol-keys.test.ts`
- `looks` — `tests/runtime/engine-search.test.ts`
- `losing` — `tests/tools/turn-reading.test.ts`
- `lost` — in 7 files: `tests/`
- `loud` — `tests/e2e/panel-fixture.ts`, `tests/runtime/live-fight.test.ts`
- `low` — `tests/ui/panel-look.test.ts`
- `lower` — `tests/repository/declaration-order.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-look.test.ts`
- `lowest` — `tests/repository/captured-fight-register.test.ts`
- `made` — `tests/repository/cited-paths.test.ts`
- `managerAt` — `tests/tools/preview-site.test.ts`
- `manifest` — `tests/repository/name-register.test.ts`
- `many` — in 6 files: `tests/`
- `map` — `tests/runtime/margometer-runtime.test.ts`
- `margin` — `tests/ui/panel-look.test.ts`
- `marginAbove` — `tests/ui/panel-look.test.ts`
- `marginBelow` — `tests/ui/panel-look.test.ts`
- `margometerE2e` — `tests/e2e/game-page.ts`
- `mark` — `tests/e2e/panel-drill.spec.ts`, `tests/ui/panel-intent.test.ts`
- `marked` — in 9 files: `tests/`
- `marker` — `tests/repository/protocol-keys.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `markerAt` — `tests/tools/protocol-key-table.test.ts`
- `markerLength` — `tests/tools/protocol-key-table.test.ts`
- `marks` — in 4 files: `tests/`
- `mask` — `tests/core/carried-status.test.ts`
- `masks` — `tests/core/carried-status.test.ts`, `tests/core/fight-session.test.ts`
- `material` — in 4 files: `tests/`
- `maximum` — in 4 files: `tests/`
- `measured` — in 7 files: `tests/`
- `member` — `tests/repository/purity.test.ts`, `tests/repository/throws.test.ts`,
  `tests/userscript-entry.test.ts`
- `members` — in 4 files: `tests/`
- `memory` — `tests/game/browser-store.test.ts`
- `mentions` — `tests/repository/called-once.test.ts`, `tests/repository/declaration-order.test.ts`
- `message` — in 12 files: `tests/`
- `messages` — in 8 files: `tests/`
- `metadata` — `tests/tools/build-userscript.test.ts`
- `meter` — `tests/ui/panel-look.test.ts`
- `method` — `tests/game/game-tooltip.test.ts`, `tests/repository/event-entries.test.ts`,
  `tests/repository/handed-callbacks.test.ts`
- `metric` — in 7 files: `tests/`
- `midStrike` — `tests/core/granted-blow-rule.test.ts`
- `middle` — `tests/runtime/margometer-runtime.test.ts`
- `missed` — `tests/repository/skill-durations.test.ts`
- `missing` — in 7 files: `tests/`
- `mixed` — `tests/game/game-build.test.ts`, `tests/tools/turn-count.test.ts`
- `module` — `tests/ui/panel-look.test.ts`
- `moment` — `tests/runtime/margometer-runtime.test.ts`
- `momentsWithTwo` — `tests/tools/aura-standing.test.ts`
- `month` — `tests/ui/panel-words.test.ts`
- `most` — `tests/core/injure-rule.test.ts`
- `mounts` — `tests/runtime/margometer-runtime.test.ts`
- `moved` — in 16 files: `tests/`
- `movedBySelector` — `tests/ui/panel-look.test.ts`
- `much` — `tests/e2e/panel-card.spec.ts`
- `name` — in 35 files: `tests/`
- `named` — in 29 files: `tests/`
- `nameless` — in 4 files: `tests/`
- `names` — in 11 files: `tests/`
- `narrow` — `tests/e2e/panel-card.spec.ts`, `tests/tools/aura-lifetime.test.ts`
- `narrowed` — `tests/ui/blow-vocabulary.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `near` — `tests/tools/help-article.test.ts`, `tests/ui/panel-drag.test.ts`
- `nearly` — `tests/runtime/shelf.test.ts`
- `needed` — `tests/ui/panel-element.test.ts`
- `needs` — `tests/tools/preview-page.test.ts`
- `negated` — `tests/repository/non-null-assertions.test.ts`
- `neither` — `tests/core/turn-clock.test.ts`
- `nested` — `tests/repository/called-once.test.ts`
- `never` — `tests/e2e/panel-fixture.ts`
- `newcomer` — `tests/core/fight-session.test.ts`
- `newer` — `tests/tools/develop-reports.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `newest` — `tests/runtime/margometer-runtime.test.ts`
- `next` — in 11 files: `tests/`
- `nextTurn` — `tests/core/charged-skill.test.ts`
- `noDay` — `tests/ui/panel-words.test.ts`
- `nobody` — `tests/core/fight-statistics.test.ts`, `tests/game/warrior-snapshot.test.ts`,
  `tests/ui/panel-element.test.ts`
- `nobodyNamed` — `tests/core/message-grammar.test.ts`
- `node` — in 15 files: `tests/`
- `nodes` — `tests/repository/non-null-assertions.test.ts`
- `none` — in 6 files: `tests/`
- `notANumber` — `tests/runtime/settings.test.ts`
- `notListed` — `tests/runtime/shelf.test.ts`
- `notMethod` — `tests/game/game-battle.test.ts`
- `notes` — `tests/repository/changelog.test.ts`, `tests/tools/changelog.test.ts`,
  `tests/ui/panel-card.test.ts`
- `nothing` — `tests/libs/json-text.test.ts`, `tests/ui/card-window.test.ts`,
  `tests/ui/panel-content.test.ts`
- `noun` — `tests/repository/captured-fight-register.test.ts`, `tests/ui/panel-words.test.ts`
- `nouns` — `tests/ui/panel-screen.test.ts`
- `now` — `tests/core/granted-blow-rule.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `nowhere` — `tests/runtime/shelf.test.ts`
- `number` — `tests/repository/decisions.test.ts`
- `numbered` — `tests/game/recorded-session.test.ts`, `tests/repository/changelog.test.ts`
- `numbers` — `tests/repository/documents.test.ts`
- `object` — `tests/repository/name-register.test.ts`
- `occurrences` — `tests/core/last-heal-rule.test.ts`
- `odd` — `tests/game/browser-store.test.ts`, `tests/game/game-place.test.ts`,
  `tests/libs/errors.test.ts`
- `off` — in 4 files: `tests/`
- `offShelf` — `tests/runtime/shelf.test.ts`
- `offer` — `tests/tools/preview-page.test.ts`
- `offerAt` — `tests/tools/preview-site.test.ts`
- `offered` — `tests/tools/capture-intake.test.ts`
- `offs` — `tests/core/fight-statistics.test.ts`
- `okrzyk` — `tests/e2e/panel-helper.spec.ts`
- `older` — `tests/runtime/shelf.test.ts`, `tests/tools/capture-intake.test.ts`
- `onCard` — `tests/e2e/panel-marks.spec.ts`
- `onSide` — `tests/tools/drill-report.test.ts`
- `onThatShape` — `tests/tools/turn-reading.test.ts`
- `onTime` — `tests/runtime/engine-search.test.ts`
- `onTimeClock` — `tests/runtime/engine-search.test.ts`
- `onTimePage` — `tests/runtime/engine-search.test.ts`
- `once` — `tests/game/game-tooltip.test.ts`
- `one` — in 32 files: `tests/`
- `only` — in 4 files: `tests/`
- `onlyName` — `tests/game/game-place.test.ts`
- `onlyOne` — `tests/tools/develop-reports.test.ts`
- `onlyX` — `tests/game/game-place.test.ts`
- `onlyY` — `tests/game/game-place.test.ts`
- `onto` — `tests/e2e/panel-probe.ts`
- `open` — in 5 files: `tests/`
- `opened` — in 26 files: `tests/`
- `opener` — in 7 files: `tests/`
- `openerId` — `tests/core/granted-blow-rule.test.ts`
- `openers` — `tests/core/fight-decoder.test.ts`, `tests/core/turn-clock.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `opening` — in 9 files: `tests/`
- `opensOnCode` — `tests/repository/comment-share.test.ts`
- `opponent` — `tests/runtime/carried-tooltip.test.ts`
- `opposing` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-element.test.ts`
- `options` — in 5 files: `tests/`
- `order` — `tests/game/game-battle.test.ts`
- `ordinal` — `tests/game/payload-envelope.test.ts`, `tests/game/recorded-session.test.ts`
- `original` — `tests/game/game-battle.test.ts`, `tests/game/warrior-snapshot.test.ts`
- `other` — in 16 files: `tests/`
- `others` — `tests/e2e/panel-scroll.spec.ts`
- `ours` — in 4 files: `tests/`
- `outcome` — in 6 files: `tests/`
- `outcomes` — `tests/core/fight-decoder.test.ts`
- `output` — `tests/repository/name-register.test.ts`
- `outside` — in 4 files: `tests/`
- `over` — in 10 files: `tests/`
- `overlong` — `tests/ui/blow-vocabulary.test.ts`
- `owed` — `tests/runtime/fight-file.test.ts`
- `own` — in 5 files: `tests/`
- `owner` — `tests/repository/declaration-order.test.ts`, `tests/repository/protocol-keys.test.ts`
- `pad` — `tests/repository/name-register.test.ts`
- `page` — in 14 files: `tests/`
- `painted` — `tests/ui/panel-look.test.ts`
- `pair` — in 5 files: `tests/`
- `paired` — `tests/core/last-heal-rule.test.ts`, `tests/runtime/screen-intent.test.ts`
- `pairs` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-content.test.ts`
- `paladyn` — `tests/core/aura-standing.test.ts`
- `palette` — `tests/ui/panel-palette.test.ts`
- `panel` — in 11 files: `tests/`
- `panelBox` — `tests/e2e/panel-helper.spec.ts`
- `panelLeft` — `tests/tools/panel-shots.test.ts`, `tests/ui/panel-element.test.ts`
- `parameter` — in 4 files: `tests/`
- `parameters` — `tests/core/message-grammar.test.ts`
- `parent` — `tests/fake-document.ts`, `tests/repository/handed-callbacks.test.ts`,
  `tests/repository/purity.test.ts`
- `parrier` — `tests/core/fight-statistics.test.ts`
- `parsed` — in 17 files: `tests/`
- `part` — in 8 files: `tests/`
- `parted` — `tests/runtime/screen-intent.test.ts`
- `partial` — `tests/game/payload-envelope.test.ts`, `tests/runtime/shelf.test.ts`
- `partly` — `tests/core/aura-standing.test.ts`
- `partner` — `tests/runtime/carried-tooltip.test.ts`
- `parts` — in 9 files: `tests/`
- `pass` — `tests/repository/name-register.test.ts`
- `passed` — `tests/game/game-build.test.ts`
- `past` — in 11 files: `tests/`
- `pastBound` — `tests/runtime/shelf.test.ts`
- `pastTheMonth` — `tests/ui/panel-words.test.ts`
- `path` — in 29 files: `tests/`
- `paths` — in 9 files: `tests/`
- `pathsByName` — `tests/repository/name-register.test.ts`
- `pattern` — `tests/repository/purity.test.ts`
- `payload` — in 14 files: `tests/`
- `payloads` — in 5 files: `tests/`
- `pending` — `tests/repository/control-flow.test.ts`, `tests/repository/name-register.test.ts`
- `pendingById` — `tests/core/health-witness.test.ts`
- `people` — `tests/ui/panel-content.test.ts`
- `percent` — in 5 files: `tests/`
- `percentAfter` — `tests/core/health-witness.test.ts`
- `percentBefore` — `tests/core/health-witness.test.ts`
- `percentById` — `tests/core/bandage-rule.test.ts`, `tests/core/health-witness.test.ts`,
  `tests/core/wound-rule.test.ts`
- `permissions` — `tests/repository/documents.test.ts`
- `person` — `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/opened-readings.test.ts`,
  `tests/ui/panel-content.test.ts`
- `phrase` — `tests/repository/protocol-keys.test.ts`
- `pin` — `tests/e2e/panel-shelf.spec.ts`, `tests/repository/workflows.test.ts`
- `pinned` — in 9 files: `tests/`
- `pinnedCase` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-words.test.ts`
- `pinnedShare` — `tests/ui/panel-content.test.ts`
- `pinnedText` — `tests/runtime/shelf.test.ts`
- `pins` — `tests/repository/workflows.test.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/runtime/shelf.test.ts`
- `pinsByAction` — `tests/repository/workflows.test.ts`
- `pips` — `tests/ui/helper-window.test.ts`
- `place` — in 12 files: `tests/`
- `placed` — in 4 files: `tests/`
- `placements` — `tests/tools/protocol-key-shape.test.ts`
- `places` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`
- `plain` — in 4 files: `tests/`
- `plainApplied` — `tests/core/granted-blow-rule.test.ts`
- `plan` — `tests/simulation.test.ts`
- `players` — `tests/repository/captured-fight-register.test.ts`
- `point` — `tests/e2e/panel-drag.spec.ts`
- `points` — in 4 files: `tests/`
- `port` — `tests/game/browser-console.test.ts`
- `position` — `tests/ui/panel-gesture.test.ts`
- `positioner` — `tests/e2e/panel-layer.spec.ts`
- `prefix` — `tests/repository/documents.test.ts`
- `prepared` — in 7 files: `tests/`
- `present` — `tests/repository/protocol-keys.test.ts`
- `pressed` — `tests/tools/panel-giving-way.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-element.test.ts`
- `preview` — `tests/tools/preview-server.test.ts`
- `produced` — `tests/core/battle-event.test.ts`
- `profession` — `tests/recorded-fights.ts`, `tests/repository/captured-fight-register.test.ts`
- `professions` — `tests/repository/captured-fight-register.test.ts`,
  `tests/tools/fabricated-fight.test.ts`
- `program` — `tests/repository/declaration-order.test.ts`
- `property` — `tests/repository/name-register.test.ts`, `tests/repository/purity.test.ts`,
  `tests/ui/panel-look.test.ts`
- `prose` — `tests/repository/comment-share.test.ts`, `tests/repository/design-tokens.test.ts`
- `provoked` — `tests/runtime/carried-tooltip.test.ts`, `tests/tools/fabricated-fight.test.ts`
- `published` — `tests/tools/preview-page.test.ts`
- `purities` — `tests/repository/purity.test.ts`, `tests/verb-purities.ts`
- `purity` — `tests/repository/name-register.test.ts`, `tests/verb-purities.ts`
- `query` — `tests/repository/declaration-order.test.ts`
- `queue` — `tests/game/payload-envelope.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `quiet` — in 7 files: `tests/`
- `quote` — `tests/ui/panel-words.test.ts`
- `quoted` — `tests/repository/changelog.test.ts`, `tests/repository/documents.test.ts`,
  `tests/repository/regular-expressions.test.ts`
- `ran` — `tests/game/browser-frame.test.ts`, `tests/game/browser-interval.test.ts`
- `random` — `tests/simulation.ts`
- `range` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`,
  `tests/repository/declaration-order.test.ts`
- `ranked` — `tests/ui/panel-content.test.ts`
- `ranking` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-screen.test.ts`
- `ranks` — `tests/ui/panel-element.test.ts`
- `ratio` — `tests/ui/panel-look.test.ts`
- `raw` — `tests/core/fight-decoder.test.ts`
- `reached` — in 10 files: `tests/`
- `read` — in 31 files: `tests/`
- `readable` — `tests/ui/panel-content.test.ts`
- `reader` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/preview-server.test.ts`
- `readerSide` — in 6 files: `tests/`
- `reading` — in 22 files: `tests/`
- `readings` — `tests/runtime/panel-frame.test.ts`
- `reads` — `tests/repository/browser-suite-keys.test.ts`
- `reason` — `tests/tools/recorded-material.test.ts`
- `reasons` — `tests/tools/fabricated-fight.test.ts`
- `received` — `tests/ui/panel-content.test.ts`
- `receiver` — `tests/ui/panel-content.test.ts`
- `receiverId` — `tests/ui/panel-content.test.ts`
- `reconstructed` — `tests/core/last-heal-rule.test.ts`
- `record` — in 8 files: `tests/`
- `recorded` — `tests/tools/fabricated-fight.test.ts`
- `recording` — `tests/core/message-grammar.test.ts`, `tests/game/fight-capture.test.ts`
- `recordings` — `tests/core/message-grammar.test.ts`
- `records` — `tests/repository/decisions.test.ts`
- `red` — `tests/ui/panel-look.test.ts`
- `reduced` — `tests/core/combatant-health.test.ts`
- `refreshed` — `tests/core/aura-standing.test.ts`
- `refusals` — `tests/runtime/margometer-runtime.test.ts`
- `refused` — in 12 files: `tests/`
- `refusing` — in 6 files: `tests/`
- `region` — `tests/ui/panel-look.test.ts`, `tests/ui/panel-words.test.ts`
- `regions` — `tests/e2e/panel-probe.ts`, `tests/ui/panel-element.test.ts`
- `register` — in 6 files: `tests/`
- `registered` — `tests/repository/design-tokens.test.ts`, `tests/repository/documents.test.ts`,
  `tests/tools/fabricated-fight.test.ts`
- `registries` — `tests/game/game-tooltip.test.ts`, `tests/rebuilding-battle.ts`,
  `tests/runtime/carried-tooltip.test.ts`
- `registry` — `tests/game/game-tooltip.test.ts`, `tests/rebuilding-battle.ts`,
  `tests/runtime/carried-tooltip.test.ts`
- `released` — `tests/repository/changelog.test.ts`, `tests/runtime/shelf.test.ts`
- `reloaded` — `tests/runtime/margometer-runtime.test.ts`
- `removed` — `tests/runtime/shelf.test.ts`
- `renamed` — `tests/ui/panel-look.test.ts`
- `reopened` — `tests/core/fight-session.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `repeated` — in 4 files: `tests/`
- `repeats` — `tests/ui/panel-content.test.ts`
- `replaceWith` — `tests/ui/view-failure.test.ts`
- `replaced` — `tests/game/recorded-session.test.ts`, `tests/repository/decisions.test.ts`
- `replacing` — `tests/repository/decisions.test.ts`
- `replay` — `tests/tools/fabricated-fight.test.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-content.test.ts`
- `replayed` — in 7 files: `tests/`
- `replays` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`
- `report` — in 9 files: `tests/`
- `reports` — `tests/core/absorption-destruction-rule.test.ts`,
  `tests/game/browser-interval.test.ts`
- `requested` — `tests/game/browser-frame.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `rescue` — `tests/core/fight-session.test.ts`
- `reset` — `tests/runtime/margometer-runtime.test.ts`
- `resolved` — `tests/repository/name-register.test.ts`
- `rest` — in 6 files: `tests/`
- `restored` — in 5 files: `tests/`
- `reversed` — `tests/tools/develop-reports.test.ts`
- `revision` — `tests/repository/cited-paths.test.ts`
- `right` — `tests/ui/panel-drag.test.ts`
- `ring` — `tests/ui/panel-look.test.ts`
- `room` — `tests/e2e/panel-card.spec.ts`, `tests/runtime/shelf.test.ts`
- `root` — in 13 files: `tests/`
- `roster` — in 29 files: `tests/`
- `rounded` — `tests/core/combatant-health.test.ts`
- `row` — in 26 files: `tests/`
- `rowHeight` — `tests/ui/panel-look.test.ts`
- `rows` — in 20 files: `tests/`
- `rule` — in 4 files: `tests/`
- `rules` — `tests/repository/purity.test.ts`, `tests/style-sheet.ts`
- `run` — `tests/core/granted-blow-rule.test.ts`
- `rung` — `tests/tools/drill-report.test.ts`
- `running` — in 4 files: `tests/`
- `runs` — `tests/core/granted-blow-rule.test.ts`
- `runtime` — `tests/userscript-entry.test.ts`
- `said` — in 22 files: `tests/`
- `saidByKey` — `tests/ui/level-drawn.test.ts`
- `same` — `tests/tools/game-readings.test.ts`
- `sameTurn` — `tests/core/charged-skill.test.ts`
- `sample` — in 30 files: `tests/`
- `sampled` — `tests/ui/panel-look.test.ts`
- `samples` — `tests/runtime/settings.test.ts`, `tests/ui/panel-look.test.ts`
- `says` — `tests/tools/game-readings.test.ts`, `tests/ui/panel-content.test.ts`
- `saysItsSide` — `tests/core/aura-standing.test.ts`
- `scoped` — `tests/repository/protocol-keys.test.ts`
- `screen` — in 7 files: `tests/`
- `screens` — `tests/e2e/panel-reload.spec.ts`
- `scripts` — `tests/game/game-build.test.ts`
- `search` — `tests/runtime/engine-search.test.ts`
- `seat` — `tests/repository/captured-fight-register.test.ts`
- `seatless` — in 4 files: `tests/`
- `seats` — `tests/ui/panel-content.test.ts`, `tests/ui/share-column.test.ts`
- `second` — in 12 files: `tests/`
- `section` — in 4 files: `tests/`
- `sections` — `tests/tools/develop-reports.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `seen` — in 13 files: `tests/`
- `selector` — in 5 files: `tests/`
- `self` — `tests/game/game-battle.test.ts`
- `sentence` — `tests/ui/panel-words.test.ts`
- `sentences` — `tests/ui/panel-words.test.ts`
- `session` — in 5 files: `tests/`
- `sessionOptions` — `tests/runtime/live-fight.test.ts`
- `settings` — `tests/e2e/game-page.ts`, `tests/repository/documents.test.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `settled` — `tests/tools/fabricated-fight.test.ts`
- `shape` — in 5 files: `tests/`
- `shapes` — `tests/game/fight-capture.test.ts`, `tests/tools/protocol-key-shape.test.ts`,
  `tests/ui/panel-element.test.ts`
- `share` — `tests/core/last-heal-rule.test.ts`, `tests/repository/comment-share.test.ts`,
  `tests/tools/drill-report.test.ts`
- `shareByCaster` — `tests/core/absorption-destruction-rule.test.ts`
- `shared` — `tests/core/fight-decoder.test.ts`, `tests/tools/aura-lifetime.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `shares` — in 7 files: `tests/`
- `sheet` — `tests/tools/preview-site.test.ts`, `tests/ui/panel-look.test.ts`
- `sheets` — `tests/ui/card-window.test.ts`
- `shelf` — in 5 files: `tests/`
- `shelved` — `tests/tools/capture-intake.test.ts`, `tests/tools/decoding-status.test.ts`
- `shelves` — `tests/runtime-world.ts`, `tests/runtime/shelf-keeper.test.ts`
- `shifted` — `tests/ui/panel-element.test.ts`
- `short` — in 7 files: `tests/`
- `shortDrawn` — `tests/e2e/panel-helper.spec.ts`
- `shortWanted` — `tests/e2e/panel-helper.spec.ts`
- `shorthand` — `tests/ui/panel-look.test.ts`
- `shots` — `tests/repository/readmes.test.ts`, `tests/tools/panel-shots.test.ts`
- `shout` — `tests/repository/skill-durations.test.ts`, `tests/tools/aura-standing.test.ts`,
  `tests/userscript-entry.test.ts`
- `shouted` — `tests/core/aura-standing.test.ts`, `tests/tools/aura-standing.test.ts`,
  `tests/tools/fabricated-fight.test.ts`
- `shouts` — `tests/tools/aura-standing.test.ts`
- `shown` — in 6 files: `tests/`
- `shut` — `tests/tools/drill-report.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-look.test.ts`
- `side` — in 8 files: `tests/`
- `sidecar` — `tests/tools/panel-shots.test.ts`
- `sides` — in 6 files: `tests/`
- `sidesSeen` — `tests/core/combatant-roster.test.ts`
- `sightings` — `tests/repository/name-register.test.ts`
- `signals` — `tests/ui/panel-look.test.ts`
- `silent` — in 5 files: `tests/`
- `sinkThrows` — `tests/game/browser-file.test.ts`
- `size` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/card-window.test.ts`,
  `tests/ui/panel-drag.test.ts`
- `sized` — in 5 files: `tests/`
- `sizes` — `tests/runtime/margometer-runtime.test.ts`, `tests/userscript-entry.test.ts`
- `skewed` — `tests/core/fight-figures.test.ts`
- `skill` — in 8 files: `tests/`
- `skillId` — `tests/tools/aura-standing.test.ts`
- `skills` — in 4 files: `tests/`
- `slash` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-look.test.ts`
- `slot` — `tests/ui/panel-scroll.test.ts`
- `small` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`
- `snake` — `tests/repository/names.test.ts`
- `snapshot` — `tests/game/warrior-snapshot.test.ts`, `tests/recorded-fights.ts`
- `snapshots` — `tests/game/warrior-snapshot.test.ts`
- `sorted` — `tests/repository/name-register.test.ts`
- `source` — in 6 files: `tests/`
- `sources` — in 5 files: `tests/`
- `spaced` — `tests/libs/json-text.test.ts`
- `spans` — `tests/tools/drill-report.test.ts`
- `spare` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-look.test.ts`
- `specifier` — `tests/source-tree.ts`
- `spelled` — in 4 files: `tests/`
- `spelling` — `tests/ui/panel-look.test.ts`
- `spending` — `tests/repository/design-tokens.test.ts`
- `spent` — `tests/core/legendary-standing.test.ts`, `tests/core/skill-announcement-rule.test.ts`,
  `tests/repository/design-tokens.test.ts`
- `spentBy` — `tests/runtime/carried-tooltip.test.ts`
- `split` — `tests/repository/cited-paths.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-words.test.ts`
- `stack` — `tests/e2e/panel-helper.spec.ts`
- `stacks` — `tests/e2e/panel-layer.spec.ts`
- `stale` — `tests/runtime/live-fight.test.ts`, `tests/tools/game-readings.test.ts`
- `stand` — `tests/tools/preview-page.test.ts`
- `standIn` — `tests/e2e/panel-layer.spec.ts`
- `standard` — `tests/ui/panel-element.test.ts`
- `standing` — in 20 files: `tests/`
- `standingRow` — `tests/e2e/panel-card.spec.ts`
- `standings` — in 4 files: `tests/`
- `start` — `tests/repository/captured-fight-register.test.ts`,
  `tests/repository/control-flow.test.ts`
- `started` — `tests/game/browser-interval.test.ts`
- `starts` — `tests/runtime/engine-search.test.ts`
- `state` — in 6 files: `tests/`
- `stated` — in 37 files: `tests/`
- `statedById` — `tests/runtime/carried-tooltip.test.ts`
- `statedHere` — `tests/core/health-witness.test.ts`
- `statement` — `tests/game/warrior-entries.test.ts`, `tests/repository/declaration-order.test.ts`
- `statements` — `tests/repository/control-flow.test.ts`,
  `tests/repository/declaration-order.test.ts`
- `states` — `tests/game/recorded-session.test.ts`
- `statistic` — `tests/ui/panel-words.test.ts`
- `statistics` — in 15 files: `tests/`
- `status` — `tests/repository/decisions.test.ts`, `tests/tools/decoding-status.test.ts`,
  `tests/tools/develop-reports.test.ts`
- `statuses` — `tests/ui/panel-words.test.ts`
- `stayed` — `tests/e2e/panel-card.spec.ts`
- `stem` — `tests/repository/names.test.ts`, `tests/repository/protocol-keys.test.ts`
- `step` — in 14 files: `tests/`
- `stepped` — `tests/core/fight-decoder.test.ts`
- `steps` — `tests/runtime/margometer-runtime.test.ts`, `tests/tools/recorded-material.test.ts`,
  `tests/tools/turn-count.test.ts`
- `stood` — in 4 files: `tests/`
- `stopped` — `tests/core/fight-decoder.test.ts`, `tests/ui/blow-vocabulary.test.ts`,
  `tests/ui/panel-card.test.ts`
- `store` — in 6 files: `tests/`
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
- `strips` — `tests/e2e/panel-strips.spec.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-screen.test.ts`
- `struck` — in 7 files: `tests/`
- `struckAgain` — `tests/core/last-heal-rule.test.ts`
- `stubborn` — `tests/game/browser-frame.test.ts`
- `stuck` — `tests/game/browser-interval.test.ts`, `tests/runtime/engine-search.test.ts`
- `stunned` — `tests/tools/turn-count.test.ts`
- `stuns` — `tests/tools/turn-count.test.ts`
- `style` — in 5 files: `tests/`
- `styles` — `tests/runtime/margometer-runtime.test.ts`
- `subject` — `tests/runtime/fight-file.test.ts`, `tests/ui/panel-card.test.ts`
- `suffix` — `tests/repository/names.test.ts`
- `sum` — `tests/ui/share-bound.test.ts`, `tests/ui/share-column.test.ts`
- `summary` — `tests/e2e/panel-size.spec.ts`
- `summed` — `tests/repository/comment-share.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `surface` — `tests/e2e/panel-layer.spec.ts`, `tests/ui/panel-look.test.ts`
- `surroundings` — `tests/game/browser-surroundings.test.ts`
- `suspicion` — `tests/ui/panel-element.test.ts`
- `swap` — `tests/ui/card-window.test.ts`
- `switchAt` — `tests/tools/preview-site.test.ts`
- `swung` — `tests/ui/panel-content.test.ts`
- `synchronous` — `tests/repository/synchronous-bundle.test.ts`
- `table` — `tests/core/granted-blow-rule.test.ts`, `tests/ui/panel-words.test.ts`
- `tabled` — `tests/repository/name-register.test.ts`
- `tables` — `tests/core/granted-blow-rule.test.ts`, `tests/tools/panel-shots.test.ts`,
  `tests/userscript-entry.test.ts`
- `tag` — `tests/tools/preview-site.test.ts`
- `tail` — `tests/repository/protocol-keys.test.ts`
- `taken` — in 9 files: `tests/`
- `takenByKind` — `tests/core/fight-statistics.test.ts`
- `takenByOpponent` — `tests/core/fight-statistics.test.ts`
- `tall` — `tests/e2e/panel-scroll.spec.ts`, `tests/ui/card-window.test.ts`
- `tallest` — `tests/ui/panel-drag.test.ts`
- `tally` — `tests/core/fight-decoder.test.ts`, `tests/tools/turn-reading.test.ts`
- `target` — in 8 files: `tests/`
- `targets` — `tests/core/npc-heal-rule.test.ts`, `tests/game/game-tooltip.test.ts`,
  `tests/rebuilding-battle.ts`
- `tearing` — `tests/game/game-battle.test.ts`
- `tenacity` — `tests/core/protocol-key.test.ts`
- `terms` — `tests/ui/panel-look.test.ts`
- `text` — in 26 files: `tests/`
- `texts` — `tests/tools/frozen-files.test.ts`, `tests/ui/panel-words.test.ts`
- `theirOwn` — `tests/core/combatant-health.test.ts`
- `theirs` — in 4 files: `tests/`
- `third` — `tests/e2e/panel-drill.spec.ts`
- `thirds` — `tests/ui/panel-words.test.ts`
- `through` — `tests/e2e/panel-fixture.ts`
- `throwing` — `tests/game/browser-clock.test.ts`, `tests/game/browser-surroundings.test.ts`,
  `tests/game/game-place.test.ts`
- `thrown` — in 5 files: `tests/`
- `tick` — `tests/core/injure-rule.test.ts`
- `ticked` — in 4 files: `tests/`
- `ticks` — `tests/core/anguish-rule.test.ts`, `tests/core/injure-rule.test.ts`,
  `tests/runtime-world.ts`
- `tie` — `tests/ui/panel-words.test.ts`
- `tile` — `tests/e2e/panel-card.spec.ts`, `tests/ui/panel-element.test.ts`
- `time` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-words.test.ts`
- `timers` — `tests/game/browser-file.test.ts`
- `title` — `tests/repository/decisions.test.ts`, `tests/ui/panel-element.test.ts`
- `to` — `tests/repository/called-once.test.ts`, `tests/style-sheet.ts`,
  `tests/tools/turn-reading.test.ts`
- `toNobody` — `tests/core/fight-statistics.test.ts`
- `together` — `tests/ui/panel-content.test.ts`
- `token` — `tests/repository/design-tokens.test.ts`
- `tokens` — `tests/ui/panel-drag.test.ts`, `tests/ui/panel-look.test.ts`
- `told` — `tests/e2e/panel-tooltip.spec.ts`, `tests/runtime/engine-search.test.ts`
- `tolerance` — `tests/core/combatant-health.test.ts`, `tests/core/health-witness.test.ts`
- `tooMany` — `tests/runtime/margometer-runtime.test.ts`
- `tool` — `tests/repository/documents.test.ts`
- `top` — `tests/repository/nesting-depth.test.ts`
- `torn` — `tests/game/browser-clock.test.ts`
- `total` — in 5 files: `tests/`
- `totals` — `tests/runtime/margometer-runtime.test.ts`, `tests/ui/panel-content.test.ts`
- `touching` — `tests/ui/panel-drag.test.ts`
- `track` — `tests/ui/panel-element.test.ts`
- `tracked` — `tests/repository/cited-paths.test.ts`, `tests/repository/documents.test.ts`
- `trailing` — `tests/core/aura-standing.test.ts`
- `translated` — `tests/runtime/carried-tooltip.test.ts`
- `travelled` — `tests/core/absorption-destruction-rule.test.ts`
- `tree` — `tests/repository/name-register.test.ts`
- `tried` — in 6 files: `tests/`
- `trimmed` — `tests/core/aura-standing.test.ts`, `tests/repository/comment-share.test.ts`,
  `tests/ui/panel-words.test.ts`
- `truncated` — `tests/tools/game-client-source.test.ts`, `tests/tools/help-article.test.ts`
- `turn` — `tests/runtime/engine-search.test.ts`
- `turns` — in 4 files: `tests/`
- `turnsElapsed` — `tests/tools/shout-holding.test.ts`
- `twentieth` — `tests/runtime/shelf.test.ts`
- `twice` — `tests/core/combatant-roster.test.ts`, `tests/repository/protocol-keys.test.ts`,
  `tests/ui/panel-look.test.ts`
- `two` — in 5 files: `tests/`
- `twoEnds` — `tests/core/fight-decoder.test.ts`
- `twoPast` — `tests/libs/unknown-value.test.ts`
- `type` — `tests/repository/purity.test.ts`, `tests/ui/panel-element.test.ts`
- `types` — `tests/repository/purity.test.ts`
- `ui` — `tests/repository/reader-layer.test.ts`
- `unasked` — `tests/tools/game-readings.test.ts`, `tests/ui/blow-vocabulary.test.ts`
- `unbalanced` — `tests/core/fight-statistics.test.ts`
- `unbounded` — `tests/tools/preview-site.test.ts`
- `uncertain` — `tests/tools/drill-report.test.ts`
- `unclamped` — `tests/ui/panel-words.test.ts`
- `uncounted` — `tests/repository/protocol-keys.test.ts`
- `undated` — `tests/tools/frozen-files.test.ts`
- `under` — in 10 files: `tests/`
- `underAnnouncement` — `tests/tools/drill-report.test.ts`
- `underway` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `undisputed` — `tests/tools/turn-reading.test.ts`
- `unexpected` — `tests/e2e/panel-fixture.ts`
- `unfolding` — `tests/runtime/margometer-runtime.test.ts`
- `ungraded` — `tests/tools/turn-count.test.ts`
- `unheld` — `tests/repository/design-tokens.test.ts`
- `unkept` — `tests/runtime/shelf.test.ts`
- `unknown` — in 4 files: `tests/`
- `unknownKey` — `tests/ui/panel-content.test.ts`
- `unmarked` — `tests/game/game-battle.test.ts`, `tests/ui/panel-element.test.ts`
- `unminified` — `tests/tools/buff-bit-table.test.ts`
- `unnamed` — in 4 files: `tests/`
- `unnumbered` — `tests/game/warrior-snapshot.test.ts`
- `unplaced` — in 4 files: `tests/`
- `unprinted` — `tests/ui/panel-words.test.ts`
- `unread` — in 7 files: `tests/`
- `unreadable` — `tests/tools/capture-intake.test.ts`
- `unrecognised` — `tests/tools/protocol-key-table.test.ts`
- `unsaid` — `tests/ui/panel-element.test.ts`
- `unsized` — `tests/core/fight-statistics.test.ts`
- `unstated` — in 6 files: `tests/`
- `untallied` — `tests/tools/turn-reading.test.ts`
- `untold` — `tests/tools/turn-count.test.ts`
- `untouched` — `tests/ui/panel-card.test.ts`
- `untried` — `tests/repository/protocol-keys.test.ts`
- `untyped` — `tests/repository/changelog.test.ts`
- `unused` — `tests/runtime/failure-fate.test.ts`
- `unworded` — `tests/ui/blow-vocabulary.test.ts`
- `unwritten` — `tests/tools/turn-count.test.ts`, `tests/tools/turn-reading.test.ts`
- `update` — in 8 files: `tests/`
- `updateData` — in 5 files: `tests/`
- `updates` — `tests/recorded-fights.ts`, `tests/runtime/margometer-runtime.test.ts`
- `upward` — `tests/repository/layers.test.ts`, `tests/ui/panel-look.test.ts`
- `used` — `tests/core/fight-decoder.test.ts`, `tests/repository/workflows.test.ts`,
  `tests/runtime/failure-fate.test.ts`
- `value` — in 13 files: `tests/`
- `valued` — `tests/core/fight-decoder.test.ts`
- `values` — in 4 files: `tests/`
- `vanished` — `tests/repository/design-tokens.test.ts`
- `verb` — `tests/repository/name-register.test.ts`
- `verbs` — `tests/verb-purities.ts`
- `verdict` — `tests/tools/drill-report.test.ts`, `tests/tools/turn-count.test.ts`
- `version` — in 4 files: `tests/`
- `victim` — `tests/core/anguish-rule.test.ts`, `tests/core/injure-rule.test.ts`
- `victims` — `tests/core/anguish-rule.test.ts`, `tests/core/wound-rule.test.ts`
- `view` — in 10 files: `tests/`
- `visitors` — `tests/source-tree.ts`
- `waiting` — in 4 files: `tests/`
- `walk` — in 4 files: `tests/`
- `walked` — `tests/fake-document.ts`, `tests/ui/level-drawn.test.ts`
- `walks` — `tests/tools/turn-reading.test.ts`
- `warrior` — in 5 files: `tests/`
- `warriors` — in 4 files: `tests/`
- `warriorsList` — `tests/game/game-tooltip.test.ts`, `tests/rebuilding-battle.ts`
- `was` — in 5 files: `tests/`
- `wasAt` — `tests/core/health-witness.test.ts`
- `wasRaised` — `tests/core/health-witness.test.ts`
- `wasRaisedById` — `tests/core/health-witness.test.ts`
- `wasRow` — `tests/ui/panel-scroll.test.ts`
- `watched` — `tests/runtime/shelf.test.ts`
- `weakened` — `tests/core/protocol-key.test.ts`
- `week` — `tests/tools/help-article.test.ts`
- `where` — in 5 files: `tests/`
- `which` — `tests/e2e/panel-drill.spec.ts`
- `whole` — in 21 files: `tests/`
- `whom` — `tests/ui/panel-words.test.ts`
- `whose` — `tests/game/payload-envelope.test.ts`
- `wide` — in 4 files: `tests/`
- `wider` — `tests/tools/turn-count.test.ts`
- `width` — `tests/tools/preview-site.test.ts`, `tests/ui/panel-look.test.ts`,
  `tests/userscript-entry.test.ts`
- `widths` — `tests/tools/preview-site.test.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-look.test.ts`
- `willFail` — `tests/ui/card-window.test.ts`
- `window` — in 10 files: `tests/`
- `withCard` — `tests/tools/panel-shots.test.ts`
- `withSelf` — `tests/ui/panel-content.test.ts`
- `within` — `tests/ui/panel-element.test.ts`
- `without` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-card.test.ts`
- `withoutSnapshot` — `tests/game/warrior-snapshot.test.ts`
- `witnessed` — `tests/tools/fabricated-fight.test.ts`
- `wojownik` — `tests/core/aura-standing.test.ts`
- `won` — `tests/core/fight-decoder.test.ts`, `tests/ui/panel-element.test.ts`
- `word` — in 5 files: `tests/`
- `worded` — `tests/repository/comment-share.test.ts`, `tests/runtime/carried-tooltip.test.ts`,
  `tests/ui/blow-vocabulary.test.ts`
- `words` — in 7 files: `tests/`
- `world` — `tests/runtime-world.ts`, `tests/runtime/carried-tooltip.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `wound` — `tests/core/injure-rule.test.ts`, `tests/game/browser-frame.test.ts`,
  `tests/game/browser-interval.test.ts`
- `wounds` — `tests/core/injure-rule.test.ts`
- `wrap` — `tests/game/game-battle.test.ts`
- `wrapped` — in 5 files: `tests/`
- `writer` — `tests/game/game-tooltip.test.ts`, `tests/repository/name-register.test.ts`
- `writing` — `tests/game/game-tooltip.test.ts`
- `written` — in 19 files: `tests/`
- `writtenLines` — `tests/repository/name-register.test.ts`
- `wrong` — in 6 files: `tests/`
- `yOnly` — `tests/runtime/shelf.test.ts`

## Parameters

### `libs/`

- `call` — `libs/errors.ts`
- `cause` — `libs/errors.ts`, `libs/json-text.ts`
- `count` — `libs/unknown-value.ts`
- `expected` — `libs/html-text.ts`, `libs/unknown-value.ts`
- `field` — `libs/unknown-value.ts`
- `from` — `libs/html-text.ts`, `libs/text-walk.ts`
- `html` — `libs/html-text.ts`
- `indentSpaces` — `libs/json-text.ts`
- `index` — `libs/text-walk.ts`
- `isMember` — `libs/text-walk.ts`
- `key` — `libs/unknown-value.ts`
- `keys` — `libs/unknown-value.ts`
- `maximum` — `libs/number-range.ts`, `libs/unknown-value.ts`
- `minimum` — `libs/number-range.ts`
- `name` — `libs/html-text.ts`
- `open` — `libs/html-text.ts`, `libs/text-walk.ts`
- `places` — `libs/number-text.ts`
- `record` — `libs/unknown-value.ts`
- `text` — in 4 files: `libs/`
- `value` — in 5 files: `libs/`
- `words` — `libs/vocabulary.ts`

### `src/core/`

- `a` — `src/core/carried-figure.ts`
- `actorId` — `src/core/charged-skill.ts`, `src/core/fight-statistics.ts`
- `amount` — `src/core/fight-statistics.ts`
- `announced` — `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`
- `announcedHere` — `src/core/fight-decoder.ts`
- `announcementStanding` — `src/core/fight-decoder.ts`
- `auras` — `src/core/carried-figure.ts`
- `b` — `src/core/carried-figure.ts`
- `bearer` — `src/core/carried-figure.ts`
- `bearerSide` — `src/core/carried-figure.ts`
- `bits` — `src/core/carried-figure.ts`
- `blow` — `src/core/fight-statistics.ts`
- `byCombatantId` — `src/core/fight-statistics.ts`
- `cast` — `src/core/aura-standing.ts`
- `casterId` — `src/core/fight-statistics.ts`
- `casterSide` — `src/core/carried-figure.ts`
- `casts` — `src/core/carried-figure.ts`
- `chargeBrokenIds` — `src/core/charged-skill.ts`
- `chargedSkillStanding` — `src/core/charged-skill.ts`
- `chargedSkillStandings` — `src/core/charged-skill.ts`
- `combatantId` — in 4 files: `src/core/`
- `combatants` — `src/core/combatant-roster.ts`, `src/core/fight-session.ts`
- `combatantsArriving` — `src/core/fight-session.ts`
- `combatantsBefore` — `src/core/fight-session.ts`
- `context` — `src/core/fight-decoder.ts`
- `count` — `src/core/fight-session.ts`
- `counted` — `src/core/fight-statistics.ts`
- `cut` — `src/core/fight-statistics.ts`
- `dealer` — `src/core/fight-statistics.ts`
- `declared` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`, `src/core/turn-clock.ts`
- `decoded` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `defence` — `src/core/protocol-key.ts`
- `details` — `src/core/fight-decoder.ts`
- `effect` — `src/core/turn-clock.ts`
- `effects` — `src/core/aura-standing.ts`
- `end` — `src/core/fight-decoder.ts`
- `entryHealthByCombatantId` — `src/core/combatant-health.ts`
- `event` — in 5 files: `src/core/`
- `events` — in 6 files: `src/core/`
- `figure` — `src/core/fight-statistics.ts`
- `figures` — `src/core/fight-figures.ts`, `src/core/fight-statistics.ts`
- `found` — `src/core/fight-decoder.ts`
- `from` — `src/core/fight-decoder.ts`
- `giverId` — `src/core/fight-statistics.ts`
- `healedId` — `src/core/fight-statistics.ts`
- `healthByCombatantId` — `src/core/combatant-health.ts`
- `healthMaximum` — `src/core/combatant-health.ts`
- `index` — `src/core/fight-decoder.ts`
- `inputs` — `src/core/carried-figure.ts`
- `isBlow` — `src/core/fight-decoder.ts`
- `key` — in 4 files: `src/core/`
- `keyMeaning` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `kinds` — `src/core/fight-statistics.ts`
- `largestSoFar` — `src/core/fight-statistics.ts`
- `lightingTurnByBitBefore` — `src/core/carried-status.ts`
- `mask` — `src/core/carried-status.ts`
- `masksByCombatantId` — `src/core/carried-status.ts`
- `maximum` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `message` — `src/core/fight-decoder.ts`
- `name` — `src/core/combatant-roster.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `one` — in 9 files: `src/core/`
- `options` — `src/core/fight-session.ts`
- `ordinal` — `src/core/charged-skill.ts`
- `other` — `src/core/carried-status.ts`, `src/core/legendary-standing.ts`
- `otherEndKey` — `src/core/fight-statistics.ts`
- `parametersDecoded` — `src/core/fight-decoder.ts`
- `percent` — `src/core/combatant-health.ts`
- `prepared` — `src/core/fight-session.ts`
- `procs` — `src/core/fight-statistics.ts`
- `record` — `src/core/fight-session.ts`
- `result` — `src/core/fight-decoder.ts`
- `roster` — in 5 files: `src/core/`
- `segment` — `src/core/fight-decoder.ts`
- `segments` — `src/core/fight-decoder.ts`
- `session` — `src/core/fight-session.ts`
- `sideHealByEvent` — `src/core/fight-statistics.ts`
- `skill` — `src/core/fight-decoder.ts`
- `skillName` — `src/core/charged-skill.ts`
- `skillNamesByActorId` — `src/core/charged-skill.ts`
- `skills` — `src/core/aura-standing.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `source` — `src/core/fight-statistics.ts`
- `stateBefore` — `src/core/fight-session.ts`
- `stated` — `src/core/fight-statistics.ts`
- `statedEnd` — `src/core/fight-decoder.ts`
- `statedSkills` — `src/core/aura-standing.ts`
- `statement` — `src/core/charged-skill.ts`
- `statements` — `src/core/charged-skill.ts`
- `statistics` — `src/core/fight-statistics.ts`
- `tables` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `tallying` — `src/core/fight-statistics.ts`
- `target` — `src/core/fight-statistics.ts`
- `targetId` — `src/core/fight-statistics.ts`
- `text` — `src/core/fight-decoder.ts`, `src/core/protocol-number.ts`
- `texts` — `src/core/fight-decoder.ts`
- `turnStanding` — `src/core/turn-clock.ts`
- `turnsByCombatantId` — `src/core/aura-standing.ts`, `src/core/turn-clock.ts`
- `turnsNow` — `src/core/carried-status.ts`
- `unread` — `src/core/fight-decoder.ts`
- `unreadBefore` — `src/core/fight-session.ts`
- `value` — `src/core/fight-decoder.ts`, `src/core/protocol-number.ts`
- `view` — `src/core/aura-standing.ts`, `src/core/fight-figures.ts`
- `walk` — `src/core/aura-standing.ts`, `src/core/carried-status.ts`,
  `src/core/legendary-standing.ts`

### `src/game/`

- `afterMilliseconds` — `src/game/browser-file.ts`
- `anchor` — `src/game/browser-file.ts`
- `args` — `src/game/game-battle.ts`
- `atMilliseconds` — `src/game/browser-time.ts`
- `battle` — `src/game/warrior-snapshot.ts`
- `blob` — `src/game/browser-file.ts`
- `block` — `src/game/game-tooltip.ts`
- `blockBefore` — `src/game/game-tooltip.ts`
- `browserConsole` — `src/game/browser-console.ts`
- `browserWindow` — in 6 files: `src/game/`
- `call` — `src/game/fight-capture.ts`
- `capture` — `src/game/fight-capture.ts`
- `category` — `src/game/game-dictionary.ts`
- `cause` — `src/game/browser-store.ts`
- `combatantId` — `src/game/payload-envelope.ts`
- `combatants` — `src/game/fight-capture.ts`
- `content` — `src/game/game-tooltip.ts`
- `count` — `src/game/payload-envelope.ts`, `src/game/warrior-snapshot.ts`
- `date` — `src/game/browser-time.ts`
- `detail` — `src/game/browser-console.ts`
- `downloads` — `src/game/browser-file.ts`
- `engine` — `src/game/game-hero.ts`, `src/game/game-place.ts`
- `engines` — `src/game/game-battle.ts`
- `entries` — `src/game/payload-envelope.ts`
- `entry` — `src/game/game-dictionary.ts`, `src/game/payload-envelope.ts`
- `event` — `src/game/game-tooltip.ts`
- `everyMilliseconds` — `src/game/browser-time.ts`
- `failure` — in 4 files: `src/game/`
- `field` — `src/game/browser-surroundings.ts`, `src/game/game-place.ts`,
  `src/game/payload-envelope.ts`
- `frames` — `src/game/browser-time.ts`
- `handle` — `src/game/browser-time.ts`
- `hero` — `src/game/game-place.ts`
- `host` — `src/game/browser-surroundings.ts`
- `index` — `src/game/game-build.ts`
- `isOpening` — `src/game/fight-capture.ts`
- `key` — `src/game/browser-store.ts`
- `kind` — `src/game/browser-console.ts`
- `labelId` — `src/game/game-dictionary.ts`
- `length` — `src/game/browser-store.ts`
- `listener` — `src/game/game-battle.ts`
- `looks` — `src/game/game-battle.ts`
- `maximum` — in 5 files: `src/game/`
- `memberName` — `src/game/browser-surroundings.ts`
- `minimum` — `src/game/browser-time.ts`
- `name` — `src/game/browser-file.ts`
- `onLateFailure` — `src/game/browser-file.ts`
- `onStepFailure` — `src/game/browser-time.ts`
- `options` — `src/game/payload-envelope.ts`
- `payload` — `src/game/fight-capture.ts`, `src/game/game-battle.ts`, `src/game/payload-envelope.ts`
- `prepared` — `src/game/fight-capture.ts`
- `row` — `src/game/game-tooltip.ts`
- `rows` — `src/game/game-tooltip.ts`
- `rowsByCombatantId` — `src/game/game-tooltip.ts`
- `scripts` — `src/game/game-build.ts`
- `step` — `src/game/browser-file.ts`, `src/game/browser-time.ts`
- `storage` — `src/game/browser-store.ts`
- `text` — `src/game/browser-file.ts`, `src/game/game-build.ts`
- `this` — `src/game/game-battle.ts`
- `timers` — `src/game/browser-time.ts`
- `type` — `src/game/browser-file.ts`
- `url` — `src/game/browser-file.ts`
- `value` — in 7 files: `src/game/`
- `values` — `src/game/browser-console.ts`
- `warrior` — `src/game/game-tooltip.ts`, `src/game/warrior-snapshot.ts`

### `src/runtime/`

- `asked` — `src/runtime/shelf-keeper.ts`
- `atMilliseconds` — `src/runtime/fight-handover.ts`
- `attempts` — `src/runtime/shelf.ts`
- `battlePort` — `src/runtime/margometer-runtime.ts`
- `before` — `src/runtime/shelf.ts`
- `browserConsole` — `src/runtime/defect-ledger.ts`
- `call` — `src/runtime/fight-file.ts`, `src/runtime/live-fight.ts`
- `calls` — `src/runtime/fight-file.ts`
- `category` — `src/runtime/margometer-runtime.ts`
- `cause` — `src/runtime/fight-file.ts`
- `choice` — `src/runtime/margometer-runtime.ts`, `src/runtime/settings.ts`,
  `src/runtime/shelf-keeper.ts`
- `chosenFightOpenedAt` — `src/runtime/fight-state.ts`, `src/runtime/panel-frame.ts`
- `combatantId` — `src/runtime/carried-tooltip.ts`
- `contents` — `src/runtime/shelf-keeper.ts`
- `count` — `src/runtime/panel-frame.ts`
- `cut` — `src/runtime/fight-file.ts`, `src/runtime/panel-frame.ts`
- `defect` — `src/runtime/defect-ledger.ts`
- `defects` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `drill` — `src/runtime/panel-frame.ts`
- `failure` — `src/runtime/fight-handover.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/panel-frame.ts`
- `fallback` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `fields` — `src/runtime/settings.ts`
- `fight` — in 4 files: `src/runtime/`
- `fightStandings` — `src/runtime/carried-tooltip.ts`
- `fightState` — `src/runtime/fight-handover.ts`, `src/runtime/panel-frame.ts`
- `fights` — `src/runtime/fight-state.ts`, `src/runtime/shelf.ts`
- `figures` — `src/runtime/carried-tooltip.ts`, `src/runtime/fight-file.ts`
- `first` — `src/runtime/panel-frame.ts`
- `gameBuild` — `src/runtime/fight-handover.ts`
- `hasFightToSave` — `src/runtime/panel-frame.ts`
- `id` — `src/runtime/margometer-runtime.ts`
- `index` — `src/runtime/fight-handover.ts`
- `intent` — `src/runtime/margometer-runtime.ts`
- `interval` — `src/runtime/margometer-runtime.ts`
- `isCollapsed` — `src/runtime/settings.ts`
- `isPinned` — `src/runtime/shelf.ts`
- `isShelfEmpty` — `src/runtime/panel-frame.ts`
- `key` — `src/runtime/settings.ts`
- `kind` — `src/runtime/live-fight.ts`, `src/runtime/panel-frame.ts`
- `listener` — `src/runtime/margometer-runtime.ts`
- `liveFight` — `src/runtime/live-fight.ts`, `src/runtime/panel-frame.ts`
- `liveFightState` — `src/runtime/fight-state.ts`, `src/runtime/panel-frame.ts`
- `liveHandover` — `src/runtime/fight-handover.ts`
- `liveRow` — `src/runtime/panel-frame.ts`
- `lookupKeptFightState` — `src/runtime/fight-state.ts`
- `maximum` — `src/runtime/shelf.ts`
- `names` — `src/runtime/settings.ts`
- `offered` — `src/runtime/shelf-keeper.ts`
- `onLateFailure` — `src/runtime/fight-handover.ts`
- `one` — in 6 files: `src/runtime/`
- `openedAt` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`,
  `src/runtime/shelf.ts`
- `options` — in 5 files: `src/runtime/`
- `other` — `src/runtime/panel-frame.ts`
- `panel` — `src/runtime/margometer-runtime.ts`
- `panelWindow` — `src/runtime/margometer-runtime.ts`, `src/runtime/settings.ts`
- `parts` — `src/runtime/panel-frame.ts`
- `payload` — `src/runtime/fight-handover.ts`, `src/runtime/live-fight.ts`
- `payloads` — `src/runtime/fight-state.ts`
- `place` — `src/runtime/fight-handover.ts`, `src/runtime/panel-frame.ts`
- `ports` — `src/runtime/fight-handover.ts`, `src/runtime/margometer-runtime.ts`
- `position` — `src/runtime/settings.ts`
- `read` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `readerId` — `src/runtime/panel-frame.ts`
- `region` — `src/runtime/panel-frame.ts`
- `report` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `roster` — `src/runtime/panel-frame.ts`
- `screen` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`
- `search` — `src/runtime/margometer-runtime.ts`
- `shelf` — `src/runtime/shelf.ts`
- `shelfAnswers` — `src/runtime/panel-frame.ts`
- `shownFight` — `src/runtime/fight-handover.ts`, `src/runtime/panel-frame.ts`
- `size` — `src/runtime/settings.ts`
- `skills` — `src/runtime/fight-file.ts`
- `source` — `src/runtime/panel-frame.ts`
- `state` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`
- `statistics` — `src/runtime/fight-file.ts`
- `step` — `src/runtime/live-fight.ts`, `src/runtime/settings.ts`
- `storageChoice` — `src/runtime/shelf-keeper.ts`
- `store` — `src/runtime/settings.ts`, `src/runtime/shelf.ts`
- `subject` — `src/runtime/fight-file.ts`
- `sum` — `src/runtime/panel-frame.ts`
- `surroundings` — `src/runtime/fight-file.ts`
- `tables` — `src/runtime/carried-tooltip.ts`, `src/runtime/fight-state.ts`,
  `src/runtime/panel-frame.ts`
- `text` — `src/runtime/settings.ts`
- `tooltip` — `src/runtime/carried-tooltip.ts`
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
- `at` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `attribute` — `src/ui/panel-element.ts`
- `bar` — `src/ui/panel-drag.ts`
- `before` — `src/ui/panel-drag.ts`
- `below` — `src/ui/panel-look.ts`
- `bit` — `src/ui/panel-words.ts`
- `bottom` — `src/ui/panel-look.ts`
- `bounds` — `src/ui/panel-drag.ts`
- `card` — `src/ui/panel-element.ts`
- `cardComposed` — `src/ui/panel-element.ts`
- `cardContext` — `src/ui/panel-element.ts`
- `cardKey` — `src/ui/panel-element.ts`
- `cardLookup` — `src/ui/panel-element.ts`
- `cardWidthMaximum` — `src/ui/panel-drag.ts`
- `category` — `src/ui/panel-words.ts`
- `cause` — `src/ui/panel-element.ts`, `src/ui/view-failure.ts`
- `caveat` — `src/ui/panel-words.ts`
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
- `combatantId` — `src/ui/panel-content.ts`
- `compose` — `src/ui/panel-element.ts`
- `corner` — `src/ui/panel-drag.ts`
- `count` — `src/ui/panel-words.ts`
- `counts` — `src/ui/panel-words.ts`
- `current` — `src/ui/panel-screen.ts`
- `cut` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `defects` — `src/ui/panel-element.ts`
- `detail` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `document` — `src/ui/panel-element.ts`
- `doesOpen` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `dragOptions` — `src/ui/panel-element.ts`
- `drawn` — `src/ui/panel-element.ts`
- `element` — `src/ui/panel-content.ts`
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
- `getAcross` — `src/ui/panel-element.ts`
- `getBar` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `getCount` — `src/ui/panel-content.ts`
- `getCut` — `src/ui/panel-content.ts`
- `getTypeStep` — `src/ui/panel-element.ts`
- `getViewportHeight` — `src/ui/panel-element.ts`
- `grab` — `src/ui/panel-drag.ts`
- `grip` — `src/ui/panel-drag.ts`
- `group` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `groups` — `src/ui/panel-element.ts`
- `handle` — in 4 files: `src/ui/`
- `hasHolder` — `src/ui/panel-helper.ts`
- `heading` — `src/ui/panel-element.ts`
- `helper` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `helperRegister` — `src/ui/panel-element.ts`
- `host` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `hue` — `src/ui/panel-look.ts`
- `id` — `src/ui/panel-words.ts`
- `index` — `src/ui/panel-words.ts`
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
- `kept` — `src/ui/panel-element.ts`
- `key` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `kind` — `src/ui/panel-words.ts`
- `kinds` — `src/ui/panel-content.ts`
- `label` — `src/ui/panel-element.ts`
- `largest` — `src/ui/panel-content.ts`
- `leaving` — `src/ui/panel-element.ts`
- `level` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `limit` — `src/ui/panel-drag.ts`
- `line` — `src/ui/panel-element.ts`
- `lines` — `src/ui/panel-element.ts`
- `list` — `src/ui/panel-element.ts`
- `listener` — `src/ui/panel-drag.ts`, `src/ui/panel-listener.ts`, `src/ui/view-failure.ts`
- `listing` — `src/ui/panel-content.ts`
- `lost` — `src/ui/panel-words.ts`
- `mapName` — `src/ui/panel-words.ts`
- `mark` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `meter` — `src/ui/panel-drag.ts`
- `meterRegister` — `src/ui/panel-element.ts`
- `meterWidthPixels` — `src/ui/panel-drag.ts`
- `metric` — in 4 files: `src/ui/`
- `name` — in 5 files: `src/ui/`
- `named` — `src/ui/panel-content.ts`
- `names` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `neither` — `src/ui/panel-content.ts`
- `next` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `noun` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `o` — `src/ui/panel-content.ts`
- `onFailure` — `src/ui/panel-listener.ts`, `src/ui/view-failure.ts`
- `one` — in 4 files: `src/ui/`
- `oneFigure` — `src/ui/ranked-order.ts`
- `oneText` — `src/ui/ranked-order.ts`
- `opened` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `options` — `src/ui/panel-document.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `ordinal` — `src/ui/panel-words.ts`
- `other` — in 5 files: `src/ui/`
- `otherFigure` — `src/ui/ranked-order.ts`
- `otherId` — `src/ui/panel-content.ts`
- `otherText` — `src/ui/ranked-order.ts`
- `outcome` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `pair` — `src/ui/panel-element.ts`
- `pairs` — `src/ui/panel-content.ts`
- `panelDrawing` — `src/ui/panel-element.ts`
- `panelWindow` — `src/ui/panel-drag.ts`
- `part` — in 5 files: `src/ui/`
- `parts` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `person` — `src/ui/panel-element.ts`
- `personContext` — `src/ui/panel-element.ts`
- `pinned` — `src/ui/panel-content.ts`
- `pinnedCase` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `place` — `src/ui/panel-drag.ts`, `src/ui/panel-words.ts`
- `placement` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `pointer` — `src/ui/panel-drag.ts`
- `pointerId` — `src/ui/panel-document.ts`, `src/ui/panel-drag.ts`
- `points` — `src/ui/panel-words.ts`
- `position` — `src/ui/panel-drag.ts`
- `previous` — `src/ui/panel-element.ts`
- `profession` — `src/ui/panel-helper.ts`, `src/ui/panel-palette.ts`, `src/ui/panel-words.ts`
- `provocations` — `src/ui/panel-helper.ts`
- `rank` — `src/ui/panel-element.ts`
- `raw` — `src/ui/panel-element.ts`
- `readerSide` — `src/ui/panel-content.ts`, `src/ui/panel-helper.ts`
- `redraw` — `src/ui/panel-element.ts`
- `region` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`, `src/ui/view-failure.ts`
- `regions` — `src/ui/panel-element.ts`
- `register` — `src/ui/panel-element.ts`
- `render` — `src/ui/panel-element.ts`
- `renderInPlace` — `src/ui/panel-element.ts`
- `report` — `src/ui/panel-element.ts`
- `rest` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `room` — `src/ui/panel-element.ts`
- `root` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-listener.ts`
- `roster` — `src/ui/panel-content.ts`, `src/ui/panel-helper.ts`
- `row` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `rowContent` — `src/ui/panel-element.ts`
- `rows` — `src/ui/panel-content.ts`
- `rowsVisibleCount` — `src/ui/panel-element.ts`
- `said` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `screen` — `src/ui/panel-screen.ts`
- `shape` — `src/ui/panel-content.ts`
- `share` — `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `shareText` — `src/ui/panel-content.ts`
- `shares` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `shown` — `src/ui/panel-element.ts`
- `side` — `src/ui/panel-content.ts`
- `sideListed` — `src/ui/panel-content.ts`
- `sideRelation` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `sides` — `src/ui/panel-content.ts`
- `size` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `sizes` — `src/ui/panel-words.ts`
- `skill` — `src/ui/panel-content.ts`
- `source` — `src/ui/panel-words.ts`
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
- `sum` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `suspicions` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `tag` — `src/ui/panel-document.ts`, `src/ui/panel-element.ts`
- `taken` — `src/ui/panel-words.ts`
- `target` — `src/ui/panel-intent.ts`
- `text` — `src/ui/panel-element.ts`
- `tokens` — `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `tooltip` — `src/ui/panel-words.ts`
- `top` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `total` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `totals` — `src/ui/panel-content.ts`
- `translate` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `turn` — `src/ui/panel-helper.ts`
- `type` — `src/ui/panel-document.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-listener.ts`
- `typeStep` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
- `unnamedCut` — `src/ui/panel-element.ts`
- `unplaced` — `src/ui/panel-words.ts`
- `uses` — `src/ui/panel-words.ts`
- `value` — in 5 files: `src/ui/`
- `viewport` — `src/ui/panel-drag.ts`
- `viewportHeight` — `src/ui/panel-look.ts`
- `waiting` — `src/ui/panel-element.ts`
- `wasTurnLostRead` — `src/ui/panel-content.ts`
- `where` — `src/ui/panel-element.ts`
- `whole` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `whom` — `src/ui/panel-words.ts`
- `window` — in 4 files: `src/ui/`
- `windowSizes` — `src/ui/panel-screen.ts`
- `without` — `src/ui/panel-element.ts`
- `words` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `write` — `src/ui/panel-drag.ts`
- `x` — `src/ui/panel-words.ts`
- `y` — `src/ui/panel-words.ts`

### `src/`

- `afterMilliseconds` — `src/userscript-entry.ts`
- `anchor` — `src/userscript-entry.ts`
- `blob` — `src/userscript-entry.ts`
- `browserWindow` — `src/userscript-entry.ts`
- `failure` — `src/userscript-entry.ts`
- `missing` — `src/userscript-entry.ts`
- `name` — `src/userscript-entry.ts`
- `node` — `src/userscript-entry.ts`
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
- `value` — `src/userscript-entry.ts`
- `values` — `src/userscript-entry.ts`

### `tools/`

- `act` — `tools/fabricated-fight.ts`
- `acting` — `tools/fabricated-fight.ts`
- `actor` — `tools/fabricated-fight.ts`
- `address` — `tools/game-client-source.ts`
- `admitted` — `tools/capture-intake.ts`
- `advance` — `tools/turn-count.ts`
- `after` — `tools/turn-count.ts`
- `amount` — `tools/fabricated-fight.ts`, `tools/fight-figures.ts`
- `args` — in 5 files: `tools/`
- `arriving` — `tools/turn-count.ts`
- `article` — `tools/help-article.ts`
- `asked` — `tools/fabricated-fight.ts`, `tools/panel-shots.ts`
- `at` — in 6 files: `tools/`
- `atShouter` — `tools/shout-holding.ts`
- `atSomebodyElse` — `tools/shout-holding.ts`
- `auras` — `tools/skill-table.ts`
- `base` — `tools/fabricated-fight.ts`
- `before` — `tools/fabricated-fight.ts`, `tools/turn-count.ts`, `tools/turn-reading.ts`
- `bit` — `tools/aura-lifetime.ts`, `tools/fabricated-fight.ts`
- `bits` — `tools/buff-bit-table.ts`
- `body` — `tools/protocol-key-table.ts`
- `boundary` — `tools/turn-count.ts`
- `box` — `tools/panel-shots.ts`
- `boxes` — `tools/panel-shots.ts`
- `browser` — `tools/panel-shots.ts`
- `build` — `tools/buff-bit-table.ts`, `tools/protocol-key-table.ts`
- `bundle` — in 4 files: `tools/`
- `cached` — `tools/game-readings.ts`
- `call` — `tools/build-userscript.ts`, `tools/capture-intake.ts`, `tools/fabricated-fight.ts`
- `calls` — `tools/panel-shots.ts`
- `caption` — `tools/decoding-status.ts`, `tools/develop-reports.ts`, `tools/fight-figures.ts`
- `carried` — `tools/protocol-key-shape.ts`
- `cases` — `tools/drill-report.ts`
- `cause` — `tools/help-article.ts`, `tools/panel-shots.ts`, `tools/skill-table.ts`
- `cell` — `tools/aura-standing.ts`, `tools/skill-table.ts`
- `cells` — `tools/aura-standing.ts`
- `changelog` — `tools/changelog.ts`
- `channel` — `tools/game-client-source.ts`
- `claim` — `tools/protocol-key-shape.ts`
- `claims` — `tools/protocol-key-shape.ts`
- `clocks` — `tools/shout-holding.ts`
- `code` — `tools/margometer-tool-error.ts`
- `combatantId` — `tools/drill-report.ts`
- `command` — `tools/develop-reports.ts`
- `comparison` — `tools/develop-reports.ts`
- `configuration` — `tools/build-userscript.ts`
- `context` — `tools/help-article.ts`, `tools/turn-reading.ts`
- `controller` — `tools/preview-server.ts`
- `cost` — `tools/payload-cost.ts`
- `costs` — `tools/payload-cost.ts`
- `count` — in 7 files: `tools/`
- `counted` — `tools/turn-count.ts`
- `counts` — `tools/help-article.ts`
- `cut` — `tools/fight-figures.ts`
- `data` — `tools/preview-server.ts`
- `date` — in 5 files: `tools/`
- `dateField` — `tools/frozen-files.ts`
- `delta` — `tools/turn-count.ts`
- `develop` — `tools/develop-reports.ts`
- `developLines` — `tools/develop-reports.ts`
- `developNames` — `tools/develop-reports.ts`
- `developText` — `tools/develop-reports.ts`
- `difference` — `tools/develop-reports.ts`
- `directory` — `tools/develop-reports.ts`, `tools/preview-server.ts`
- `disputed` — `tools/turn-reading.ts`
- `doesCloseOnShouts` — `tools/fabricated-fight.ts`
- `doesOfferFights` — `tools/preview-page.ts`
- `doesOpen` — `tools/drill-report.ts`
- `doesStartFromEmpty` — `tools/preview-page.ts`
- `done` — `tools/capture-intake.ts`
- `drill` — `tools/drill-report.ts`
- `encode` — `tools/fabricated-fight.ts`, `tools/frozen-files.ts`
- `ending` — `tools/fabricated-fight.ts`
- `entry` — `tools/build-userscript.ts`, `tools/panel-shots.ts`, `tools/preview-server.ts`
- `envelope` — `tools/capture-intake.ts`
- `event` — `tools/preview-server.ts`, `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `events` — `tools/aura-standing.ts`, `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `expected` — `tools/turn-count.ts`
- `extra` — `tools/fabricated-fight.ts`
- `failure` — `tools/game-client-source.ts`, `tools/game-readings.ts`, `tools/preview-server.ts`
- `fallback` — `tools/fabricated-fight.ts`
- `family` — `tools/protocol-key-shape.ts`, `tools/protocol-key-table.ts`
- `fetchedAt` — `tools/game-readings.ts`, `tools/help-article.ts`
- `field` — `tools/capture-intake.ts`
- `fields` — `tools/protocol-key-table.ts`
- `fight` — in 10 files: `tools/`
- `fights` — `tools/preview-server.ts`, `tools/turn-count.ts`, `tools/turn-reading.ts`
- `figure` — `tools/fabricated-fight.ts`
- `figures` — `tools/fight-figures.ts`, `tools/turn-count.ts`
- `file` — `tools/preview-site.ts`
- `flag` — `tools/fabricated-fight.ts`
- `flags` — `tools/panel-giving-way.ts`
- `fled` — `tools/fabricated-fight.ts`
- `from` — `tools/protocol-key-table.ts`
- `fromPaths` — `tools/preview-server.ts`
- `frozen` — `tools/frozen-files.ts`, `tools/game-readings.ts`
- `gathered` — `tools/aura-lifetime.ts`
- `getTurns` — `tools/turn-count.ts`
- `grade` — `tools/turn-count.ts`
- `grades` — `tools/turn-count.ts`
- `granted` — `tools/skill-table.ts`
- `group` — `tools/card-height.ts`
- `heading` — `tools/fight-figures.ts`
- `heights` — `tools/card-height.ts`
- `heldDate` — `tools/frozen-files.ts`
- `helds` — `tools/frozen-files.ts`
- `host` — `tools/build-userscript.ts`, `tools/game-client-source.ts`
- `html` — `tools/game-client-source.ts`, `tools/panel-shots.ts`, `tools/skill-table.ts`
- `id` — `tools/capture-intake.ts`, `tools/fight-figures.ts`
- `index` — `tools/frozen-files.ts`, `tools/protocol-key-table.ts`
- `install` — `tools/preview-page.ts`
- `isAtShouter` — `tools/shout-holding.ts`
- `key` — in 8 files: `tools/`
- `keys` — `tools/game-readings.ts`, `tools/protocol-key-table.ts`
- `kind` — `tools/decoding-status.ts`
- `label` — `tools/capture-intake.ts`, `tools/fight-figures.ts`
- `labelId` — `tools/payload-cost.ts`
- `left` — `tools/aura-standing.ts`
- `level` — `tools/fabricated-fight.ts`
- `lifted` — `tools/game-readings.ts`
- `lightings` — `tools/aura-lifetime.ts`
- `line` — in 6 files: `tools/`
- `listeners` — `tools/preview-server.ts`
- `mapText` — `tools/capture-intake.ts`
- `mapped` — `tools/capture-intake.ts`
- `mask` — `tools/aura-lifetime.ts`
- `material` — in 7 files: `tools/`
- `maximum` — `tools/fabricated-fight.ts`, `tools/help-article.ts`
- `message` — `tools/turn-reading.ts`
- `messages` — `tools/fabricated-fight.ts`
- `messagesLost` — `tools/fight-figures.ts`
- `microseconds` — `tools/payload-cost.ts`
- `mine` — `tools/turn-count.ts`
- `minimum` — `tools/fabricated-fight.ts`
- `moment` — `tools/panel-shots.ts`
- `moved` — `tools/fabricated-fight.ts`
- `name` — in 8 files: `tools/`
- `named` — `tools/help-article.ts`, `tools/recorded-material.ts`
- `names` — `tools/capture-intake.ts`
- `need` — `tools/preview-page.ts`
- `now` — `tools/game-readings.ts`, `tools/help-article.ts`
- `one` — in 17 files: `tools/`
- `opened` — `tools/drill-report.ts`
- `opener` — `tools/turn-reading.ts`
- `openerId` — `tools/turn-reading.ts`
- `options` — `tools/margometer-tool-error.ts`, `tools/preview-page.ts`, `tools/preview-server.ts`
- `ordered` — `tools/card-height.ts`
- `ordinal` — `tools/fabricated-fight.ts`
- `other` — in 9 files: `tools/`
- `outcomes` — `tools/turn-count.ts`
- `paragraph` — `tools/protocol-key-shape.ts`
- `parameters` — `tools/fabricated-fight.ts`
- `part` — `tools/drill-report.ts`
- `path` — in 6 files: `tools/`
- `paths` — in 4 files: `tools/`
- `payload` — `tools/fabricated-fight.ts`, `tools/payload-cost.ts`, `tools/turn-reading.ts`
- `perSide` — `tools/fabricated-fight.ts`
- `phrase` — `tools/help-article.ts`
- `phrases` — `tools/help-article.ts`
- `pinnedCase` — `tools/drill-report.ts`
- `place` — `tools/drill-report.ts`, `tools/fabricated-fight.ts`
- `placement` — `tools/protocol-key-shape.ts`
- `placements` — `tools/protocol-key-shape.ts`
- `readDate` — `tools/frozen-files.ts`
- `reading` — `tools/shout-holding.ts`, `tools/turn-reading.ts`
- `reason` — `tools/margometer-tool-error.ts`
- `recording` — `tools/capture-intake.ts`
- `region` — `tools/panel-giving-way.ts`
- `regions` — `tools/panel-giving-way.ts`
- `register` — `tools/protocol-key-shape.ts`
- `registered` — `tools/protocol-key-shape.ts`
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
- `said` — `tools/game-readings.ts`
- `screen` — `tools/card-height.ts`, `tools/drill-report.ts`
- `screens` — `tools/drill-report.ts`
- `script` — `tools/preview-page.ts`, `tools/preview-server.ts`
- `sentence` — `tools/protocol-key-shape.ts`
- `served` — `tools/game-readings.ts`
- `shape` — `tools/fabricated-fight.ts`, `tools/protocol-key-shape.ts`
- `shapes` — `tools/protocol-key-shape.ts`
- `shift` — `tools/game-readings.ts`
- `shot` — `tools/panel-shots.ts`
- `shouts` — `tools/skill-table.ts`
- `side` — `tools/fabricated-fight.ts`
- `skill` — `tools/fabricated-fight.ts`, `tools/fight-figures.ts`
- `skillId` — `tools/aura-standing.ts`
- `skillName` — `tools/aura-standing.ts`
- `skills` — `tools/fight-figures.ts`, `tools/skill-table.ts`
- `slug` — `tools/capture-intake.ts`
- `source` — `tools/capture-intake.ts`, `tools/panel-giving-way.ts`, `tools/protocol-key-table.ts`
- `standing` — `tools/turn-reading.ts`
- `start` — `tools/protocol-key-table.ts`
- `state` — `tools/fabricated-fight.ts`, `tools/game-readings.ts`, `tools/preview-server.ts`
- `stated` — in 6 files: `tools/`
- `statistics` — `tools/aura-lifetime.ts`, `tools/fight-figures.ts`, `tools/turn-count.ts`
- `step` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `stepped` — `tools/aura-lifetime.ts`, `tools/aura-standing.ts`
- `steps` — `tools/aura-lifetime.ts`, `tools/protocol-key-table.ts`, `tools/turn-count.ts`
- `subject` — `tools/game-readings.ts`
- `substitutions` — `tools/capture-intake.ts`
- `sum` — `tools/fabricated-fight.ts`, `tools/payload-cost.ts`
- `tallies` — `tools/turn-reading.ts`
- `tally` — `tools/decoding-status.ts`, `tools/drill-report.ts`, `tools/shout-holding.ts`
- `target` — `tools/fabricated-fight.ts`
- `task` — `tools/develop-reports.ts`
- `text` — in 10 files: `tools/`
- `turn` — `tools/fabricated-fight.ts`
- `turnsElapsed` — `tools/shout-holding.ts`
- `unit` — `tools/game-readings.ts`
- `update` — `tools/turn-count.ts`
- `url` — `tools/preview-server.ts`
- `value` — in 10 files: `tools/`
- `values` — `tools/protocol-key-shape.ts`
- `version` — in 4 files: `tools/`
- `view` — `tools/shout-holding.ts`
- `viewportWidth` — `tools/panel-shots.ts`
- `walk` — `tools/turn-reading.ts`
- `walks` — `tools/turn-reading.ts`
- `warrior` — `tools/fabricated-fight.ts`
- `warriors` — `tools/fabricated-fight.ts`
- `watcher` — `tools/preview-server.ts`
- `widths` — `tools/aura-standing.ts`
- `word` — `tools/protocol-key-shape.ts`
- `words` — `tools/preview-page.ts`

### `tests/`

- `_` — in 16 files: `tests/`
- `_name` — `tests/runtime/margometer-runtime.test.ts`
- `_playwright` — `tests/e2e/panel-fixture.ts`
- `_text` — `tests/runtime/margometer-runtime.test.ts`
- `a` — `tests/core/aura-standing.test.ts`
- `actorId` — in 5 files: `tests/`
- `addName` — `tests/repository/name-register.test.ts`
- `after` — `tests/runtime/live-fight.test.ts`
- `all` — `tests/e2e/panel-options.spec.ts`, `tests/ui/panel-content.test.ts`
- `amount` — `tests/core/carried-figure.test.ts`, `tests/core/last-heal-rule.test.ts`,
  `tests/core/legendary-standing.test.ts`
- `announced` — `tests/ui/panel-content.test.ts`
- `another` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`
- `answer` — `tests/e2e/panel-boot.spec.ts`, `tests/game/browser-store.test.ts`,
  `tests/game/game-battle.test.ts`
- `args` — `tests/game/game-battle.test.ts`, `tests/game/game-dictionary.test.ts`,
  `tests/repository/cited-paths.test.ts`
- `around` — `tests/runtime/fight-file.test.ts`
- `at` — in 22 files: `tests/`
- `auras` — `tests/core/carried-figure.test.ts`
- `b` — `tests/core/aura-standing.test.ts`
- `base` — `tests/runtime-world.ts`, `tests/runtime/margometer-runtime.test.ts`
- `battle` — `tests/game/game-battle.test.ts`, `tests/game/warrior-snapshot.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `bit` — `tests/core/carried-figure.test.ts`, `tests/ui/panel-words.test.ts`
- `bits` — `tests/core/carried-status.test.ts`
- `blowsCritical` — `tests/ui/panel-card.test.ts`
- `blowsStruck` — `tests/ui/panel-card.test.ts`
- `body` — `tests/repository/handed-callbacks.test.ts`, `tests/style-sheet.ts`,
  `tests/ui/panel-look.test.ts`
- `broken` — `tests/core/last-heal-rule.test.ts`
- `browser` — `tests/e2e/panel-camera.ts`
- `build` — `tests/tools/game-readings.test.ts`
- `built` — `tests/e2e/panel-boot.spec.ts`, `tests/e2e/panel-fixture.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `by` — `tests/e2e/panel-probe.ts`
- `call` — in 11 files: `tests/`
- `callee` — `tests/repository/purity.test.ts`
- `caller` — `tests/repository/called-once.test.ts`, `tests/repository/event-entries.test.ts`,
  `tests/repository/purity.test.ts`
- `calls` — in 5 files: `tests/`
- `cardClass` — `tests/e2e/panel-camera.ts`
- `cast` — `tests/repository/captured-fight-register.test.ts`
- `casterId` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `category` — `tests/runtime/carried-tooltip.test.ts`
- `cause` — `tests/tools/decoding-status.test.ts`
- `cell` — in 6 files: `tests/`
- `cells` — `tests/register-table.ts`, `tests/repository/captured-fight-register.test.ts`
- `change` — `tests/core/fight-statistics.test.ts`
- `channels` — `tests/ui/panel-look.test.ts`
- `character` — `tests/repository/declaration-order.test.ts`
- `child` — `tests/fake-document.ts`, `tests/ui/panel-element.test.ts`
- `children` — `tests/fake-document.ts`
- `choice` — in 5 files: `tests/`
- `citation` — `tests/repository/cited-paths.test.ts`
- `className` — in 4 files: `tests/`
- `classNames` — `tests/ui/panel-element.test.ts`
- `click` — `tests/game/browser-file.test.ts`
- `clientY` — `tests/fake-document.ts`
- `clip` — `tests/e2e/panel-camera.ts`
- `clock` — `tests/runtime/engine-search.test.ts`
- `close` — `tests/ui/panel-words.test.ts`
- `closer` — `tests/repository/documents.test.ts`, `tests/ui/panel-words.test.ts`
- `closing` — `tests/repository/captured-fight-register.test.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/share-column.test.ts`
- `coloured` — `tests/ui/panel-palette.test.ts`
- `combatantId` — in 8 files: `tests/`
- `compose` — `tests/ui/card-window.test.ts`
- `composed` — `tests/repository/name-register.test.ts`
- `config` — `tests/e2e/build-once.ts`
- `content` — `tests/game/game-tooltip.test.ts`, `tests/rebuilding-battle.ts`,
  `tests/tools/frozen-files.test.ts`
- `context` — `tests/source-tree.ts`
- `count` — in 12 files: `tests/`
- `date` — `tests/tools/frozen-files.test.ts`
- `days` — `tests/tools/game-readings.test.ts`
- `decided` — `tests/tools/game-readings.test.ts`
- `declaration` — `tests/repository/called-once.test.ts`, `tests/repository/purity.test.ts`
- `declarator` — `tests/repository/name-register.test.ts`
- `declarators` — `tests/repository/handed-callbacks.test.ts`
- `declared` — `tests/core/health-witness.test.ts`
- `defects` — `tests/ui/panel-element.test.ts`, `tests/ui/view-failure.test.ts`
- `defences` — `tests/core/fight-statistics.test.ts`
- `departures` — `tests/ui/panel-look.test.ts`
- `derived` — `tests/repository/declaration-order.test.ts`
- `design` — `tests/repository/event-entries.test.ts`
- `detail` — `tests/runtime/defect-ledger.test.ts`, `tests/simulation.ts`,
  `tests/ui/panel-card.test.ts`
- `develop` — `tests/ui/panel-look.test.ts`
- `directories` — `tests/source-tree.ts`
- `directory` — `tests/repository/import-paths.test.ts`
- `document` — in 5 files: `tests/`
- `doesFakeClock` — `tests/e2e/panel-fixture.ts`
- `doesLoadTwice` — `tests/e2e/panel-fixture.ts`
- `drill` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-element.test.ts`
- `effect` — `tests/core/aura-standing.test.ts`, `tests/core/turn-clock.test.ts`,
  `tests/repository/skill-durations.test.ts`
- `effects` — `tests/tools/skill-table.test.ts`
- `element` — `tests/e2e/panel-card.spec.ts`, `tests/fake-document.ts`,
  `tests/ui/card-window.test.ts`
- `end` — `tests/core/message-grammar.test.ts`, `tests/repository/changelog.test.ts`
- `ending` — `tests/repository/cited-paths.test.ts`
- `engine` — `tests/e2e/panel-fixture.ts`, `tests/game/game-hero.test.ts`,
  `tests/game/game-place.test.ts`
- `entries` — `tests/repository/event-entries.test.ts`
- `entry` — in 7 files: `tests/`
- `event` — in 9 files: `tests/`
- `events` — in 5 files: `tests/`
- `everyMilliseconds` — `tests/game/browser-interval.test.ts`
- `executablePath` — `tests/e2e/panel-camera.ts`
- `expected` — `tests/game/payload-envelope.test.ts`, `tests/libs/unknown-value.test.ts`
- `extra` — `tests/tools/recorded-material.test.ts`, `tests/ui/panel-element.test.ts`
- `failure` — in 9 files: `tests/`
- `fate` — `tests/runtime/failure-fate.test.ts`
- `fedThrough` — `tests/e2e/panel-fixture.ts`
- `field` — in 6 files: `tests/`
- `fight` — in 16 files: `tests/`
- `fights` — `tests/runtime/shelf.test.ts`
- `figure` — `tests/tools/drill-report.test.ts`, `tests/ui/panel-card.test.ts`
- `figures` — `tests/tools/turn-count.test.ts`, `tests/ui/panel-content.test.ts`
- `file` — in 25 files: `tests/`
- `filename` — `tests/source-tree.ts`
- `files` — in 6 files: `tests/`
- `first` — `tests/runtime/margometer-runtime.test.ts`
- `floor` — `tests/repository/changelog.test.ts`, `tests/ui/panel-look.test.ts`
- `focusedBy` — `tests/rebuilding-battle.ts`
- `font` — `tests/ui/panel-element.test.ts`
- `found` — `tests/repository/called-once.test.ts`
- `fragment` — `tests/e2e/panel-fixture.ts`
- `frames` — `tests/runtime-world.ts`
- `from` — `tests/core/last-heal-rule.test.ts`, `tests/e2e/panel-probe.ts`
- `fromPaths` — `tests/tools/preview-server.test.ts`
- `functions` — `tests/repository/declaration-order.test.ts`,
  `tests/repository/handed-callbacks.test.ts`, `tests/source-tree.ts`
- `game` — `tests/runtime/live-fight.test.ts`
- `gestures` — `tests/e2e/panel-camera.ts`
- `getShelf` — `tests/runtime-world.ts`
- `given` — `tests/runtime/engine-search.test.ts`
- `gone` — `tests/ui/panel-look.test.ts`
- `grade` — `tests/tools/turn-count.test.ts`
- `grip` — `tests/ui/panel-gesture.test.ts`
- `grounds` — `tests/ui/panel-look.test.ts`
- `group` — `tests/ui/panel-card.test.ts`
- `guarding` — `tests/repository/handed-callbacks.test.ts`
- `handed` — `tests/repository/handed-callbacks.test.ts`
- `handle` — in 4 files: `tests/`
- `hash` — `tests/tools/preview-state.test.ts`
- `header` — `tests/repository/decisions.test.ts`, `tests/repository/documents.test.ts`
- `heading` — in 4 files: `tests/`
- `heal` — `tests/core/last-heal-rule.test.ts`
- `heals` — `tests/core/fight-statistics.test.ts`
- `healsGiven` — `tests/ui/panel-words.test.ts`
- `health` — `tests/game/warrior-entries.test.ts`
- `height` — `tests/e2e/panel-scroll.spec.ts`, `tests/ui/panel-look.test.ts`
- `held` — in 9 files: `tests/`
- `helperClass` — `tests/e2e/panel-camera.ts`
- `here` — `tests/ui/panel-look.test.ts`
- `hero` — `tests/runtime/margometer-runtime.test.ts`
- `honesty` — `tests/e2e/panel-boot.spec.ts`
- `host` — in 10 files: `tests/`
- `html` — `tests/e2e/panel-fixture.ts`
- `hue` — `tests/ui/panel-palette.test.ts`
- `id` — in 15 files: `tests/`
- `index` — in 10 files: `tests/`
- `info` — `tests/e2e/panel-fixture.ts`
- `init` — `tests/repository/name-register.test.ts`, `tests/repository/purity.test.ts`
- `intent` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/view-failure.test.ts`
- `isAnnounced` — `tests/core/turn-clock.test.ts`
- `isDeep` — `tests/e2e/panel-crawler.ts`
- `isLive` — `tests/ui/shelf-bound.test.ts`
- `isMember` — `tests/repository/names.test.ts`
- `isOpening` — `tests/game/fight-capture.test.ts`
- `isPinned` — `tests/runtime/margometer-runtime.test.ts`, `tests/runtime/shelf-keeper.test.ts`,
  `tests/runtime/shelf.test.ts`
- `isRowNarrower` — `tests/ui/panel-card.test.ts`
- `item` — `tests/repository/declaration-order.test.ts`
- `items` — `tests/repository/declaration-order.test.ts`
- `key` — in 23 files: `tests/`
- `keys` — in 4 files: `tests/`
- `kind` — in 12 files: `tests/`
- `kinds` — `tests/source-tree.ts`
- `known` — `tests/repository/redacted-names.test.ts`
- `labelId` — `tests/simulation.ts`
- `layer` — `tests/repository/name-register.test.ts`
- `left` — `tests/core/aura-standing.test.ts`, `tests/ui/panel-drag.test.ts`
- `length` — `tests/runtime/settings.test.ts`, `tests/ui/card-window.test.ts`
- `lengthMaximum` — `tests/runtime/shelf-keeper.test.ts`, `tests/runtime/shelf.test.ts`
- `letter` — `tests/repository/captured-fight-register.test.ts`
- `level` — `tests/ui/panel-card.test.ts`
- `line` — in 18 files: `tests/`
- `lines` — `tests/repository/comment-share.test.ts`, `tests/source-tree.ts`,
  `tests/tools/card-height.test.ts`
- `listener` — `tests/game/game-battle.test.ts`
- `mapName` — `tests/game/game-place.test.ts`
- `margin` — `tests/ui/panel-look.test.ts`
- `mark` — in 6 files: `tests/`
- `marker` — `tests/repository/protocol-keys.test.ts`
- `marks` — `tests/ui/panel-intent.test.ts`
- `mask` — `tests/game/warrior-entries.test.ts`
- `maximum` — `tests/libs/unknown-value.test.ts`, `tests/repository/nesting-depth.test.ts`
- `message` — in 13 files: `tests/`
- `messages` — in 6 files: `tests/`
- `method` — `tests/game/game-tooltip.test.ts`
- `metric` — in 7 files: `tests/`
- `moved` — `tests/ui/panel-look.test.ts`
- `name` — in 22 files: `tests/`
- `named` — `tests/e2e/panel-fixture.ts`, `tests/tools/panel-shots.test.ts`
- `names` — `tests/repository/declaration-order.test.ts`, `tests/ui/panel-content.test.ts`
- `nested` — `tests/repository/called-once.test.ts`
- `node` — in 11 files: `tests/`
- `number` — `tests/repository/decisions.test.ts`
- `o` — `tests/core/last-heal-rule.test.ts`
- `offset` — `tests/source-tree.ts`
- `offsets` — `tests/e2e/panel-probe.ts`
- `onLateFailure` — `tests/runtime/margometer-runtime.test.ts`
- `onPageCall` — `tests/rebuilding-battle.ts`, `tests/simulation.ts`
- `onStepFailure` — `tests/runtime/margometer-runtime.test.ts`
- `one` — in 93 files: `tests/`
- `open` — `tests/ui/panel-element.test.ts`, `tests/ui/panel-words.test.ts`
- `opened` — `tests/ui/panel-content.test.ts`
- `openedAt` — `tests/runtime/shelf-keeper.test.ts`, `tests/runtime/shelf.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `opener` — in 5 files: `tests/`
- `opening` — `tests/repository/captured-fight-register.test.ts`
- `options` — in 4 files: `tests/`
- `other` — in 13 files: `tests/`
- `ours` — `tests/core/aura-standing.test.ts`
- `over` — in 8 files: `tests/`
- `overrides` — `tests/runtime-world.ts`, `tests/runtime/live-fight.test.ts`
- `owner` — `tests/e2e/panel-helper.spec.ts`
- `page` — in 13 files: `tests/`
- `panel` — in 22 files: `tests/`
- `parameter` — `tests/repository/handed-callbacks.test.ts`, `tests/tools/fabricated-fight.test.ts`
- `parsed` — `tests/core/granted-blow-rule.test.ts`, `tests/core/last-heal-rule.test.ts`
- `part` — `tests/ui/helper-window.test.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-element.test.ts`
- `parts` — `tests/fake-window.ts`, `tests/game/browser-clock.test.ts`,
  `tests/ui/panel-content.test.ts`
- `past` — `tests/repository/changelog.test.ts`
- `path` — in 24 files: `tests/`
- `paths` — `tests/repository/name-register.test.ts`
- `pattern` — `tests/repository/name-register.test.ts`, `tests/repository/purity.test.ts`
- `patterns` — `tests/repository/documents.test.ts`
- `payload` — in 12 files: `tests/`
- `payloads` — `tests/runtime/live-fight.test.ts`, `tests/tools/turn-reading.test.ts`
- `percent` — `tests/core/last-heal-rule.test.ts`
- `phrase` — `tests/repository/protocol-keys.test.ts`
- `pick` — `tests/ui/panel-look.test.ts`
- `place` — `tests/e2e/game-page.ts`, `tests/e2e/panel-fixture.ts`, `tests/ui/panel-element.test.ts`
- `plan` — `tests/simulation.ts`
- `plugin` — `tests/source-tree.ts`
- `point` — `tests/e2e/panel-drag.spec.ts`
- `pointerId` — `tests/fake-document.ts`
- `prefix` — in 4 files: `tests/`
- `procs` — `tests/ui/panel-card.test.ts`
- `profession` — `tests/ui/panel-card.test.ts`
- `property` — `tests/style-sheet.ts`, `tests/ui/panel-look.test.ts`
- `provokedCount` — `tests/ui/panel-words.test.ts`
- `provokedId` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `purities` — `tests/repository/name-register.test.ts`, `tests/repository/purity.test.ts`
- `reached` — `tests/fake-window.ts`
- `read` — in 10 files: `tests/`
- `readerId` — `tests/runtime/shelf.test.ts`
- `readerSide` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/share-column.test.ts`
- `reading` — in 8 files: `tests/`
- `reason` — `tests/tools/fabricated-fight.test.ts`, `tests/tools/protocol-key-shape.test.ts`,
  `tests/tools/recorded-material.test.ts`
- `receiverId` — `tests/ui/panel-content.test.ts`
- `record` — `tests/core/fight-session.test.ts`, `tests/recorded-fights.ts`
- `recording` — `tests/e2e/panel-fixture.ts`, `tests/game/fight-capture.test.ts`
- `region` — `tests/e2e/panel-probe.ts`, `tests/runtime/defect-ledger.test.ts`,
  `tests/tools/panel-giving-way.test.ts`
- `register` — `tests/tools/aura-lifetime.test.ts`
- `registries` — `tests/rebuilding-battle.ts`
- `registry` — `tests/game/game-tooltip.test.ts`
- `renamed` — `tests/runtime/fight-file.test.ts`
- `replayed` — `tests/game/recorded-session.test.ts`
- `report` — `tests/runtime/engine-search.test.ts`
- `rest` — `tests/runtime/shelf.test.ts`
- `right` — `tests/core/aura-standing.test.ts`
- `root` — `tests/repository/cited-paths.test.ts`, `tests/repository/comment-share.test.ts`
- `rootDirectory` — `tests/e2e/build-once.ts`, `tests/e2e/panel-page.ts`
- `roster` — in 5 files: `tests/`
- `route` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-fixture.ts`
- `row` — in 13 files: `tests/`
- `rowSelector` — `tests/e2e/panel-card.spec.ts`
- `rows` — in 4 files: `tests/`
- `rule` — `tests/repository/documents.test.ts`
- `rules` — `tests/ui/panel-look.test.ts`, `tests/verb-purities.ts`
- `rung` — `tests/ui/level-drawn.test.ts`
- `running` — `tests/core/last-heal-rule.test.ts`
- `said` — `tests/e2e/panel-fixture.ts`, `tests/game/game-battle.test.ts`,
  `tests/tools/aura-standing.test.ts`
- `sample` — `tests/ui/panel-look.test.ts`
- `screen` — `tests/runtime/panel-frame.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-screen.test.ts`
- `script` — `tests/e2e/panel-fixture.ts`, `tests/repository/name-register.test.ts`
- `second` — `tests/runtime/margometer-runtime.test.ts`
- `section` — `tests/repository/captured-fight-register.test.ts`, `tests/ui/share-column.test.ts`
- `seed` — `tests/simulation.test.ts`
- `seen` — `tests/runtime/engine-search.test.ts`, `tests/ui/level-drawn.test.ts`
- `selector` — in 7 files: `tests/`
- `serveWithNoFightFed` — `tests/e2e/panel-fixture.ts`
- `served` — `tests/e2e/panel-camera.ts`
- `session` — `tests/core/fight-session.test.ts`, `tests/game/recorded-session.test.ts`
- `settle` — `tests/e2e/panel-page.ts`
- `shape` — `tests/repository/captured-fight-register.test.ts`
- `sheet` — in 4 files: `tests/`
- `shelfStore` — `tests/runtime/live-fight.test.ts`
- `shot` — `tests/repository/readmes.test.ts`, `tests/tools/panel-shots.test.ts`
- `shouted` — `tests/core/aura-standing.test.ts`
- `shouts` — `tests/core/aura-standing.test.ts`
- `shown` — `tests/tools/preview-state.test.ts`, `tests/ui/full-cast-bound.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `side` — in 7 files: `tests/`
- `sideRelation` — `tests/ui/panel-card.test.ts`
- `sightings` — `tests/repository/name-register.test.ts`
- `skillId` — `tests/core/aura-standing.test.ts`
- `skillName` — `tests/core/charged-skill.test.ts`
- `skills` — `tests/core/aura-standing.test.ts`
- `snapshot` — `tests/recorded-fights.ts`
- `source` — in 7 files: `tests/`
- `span` — `tests/repository/cited-paths.test.ts`
- `spent` — `tests/repository/design-tokens.test.ts`
- `standIn` — `tests/e2e/panel-layer.spec.ts`
- `standing` — `tests/runtime/panel-frame.test.ts`, `tests/ui/card-window.test.ts`
- `start` — `tests/repository/control-flow.test.ts`
- `state` — `tests/ui/helper-window.test.ts`
- `stated` — in 6 files: `tests/`
- `statement` — `tests/repository/declaration-order.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-helper.test.ts`
- `statistics` — `tests/ui/level-drawn.test.ts`, `tests/ui/panel-content.test.ts`
- `stem` — `tests/repository/names.test.ts`
- `step` — in 11 files: `tests/`
- `store` — `tests/runtime/shelf.test.ts`
- `stored` — `tests/fake-window.ts`
- `strings` — `tests/repository/name-register.test.ts`
- `strong` — `tests/repository/called-once.test.ts`
- `subject` — `tests/runtime/fight-file.test.ts`
- `sum` — in 16 files: `tests/`
- `tables` — in 4 files: `tests/`
- `tag` — `tests/fake-document.ts`, `tests/fake-window.ts`
- `tally` — `tests/core/fight-decoder.test.ts`
- `target` — `tests/fake-document.ts`, `tests/runtime-world.ts`
- `targetId` — `tests/core/aura-standing.test.ts`, `tests/core/charged-skill.test.ts`,
  `tests/core/legendary-standing.test.ts`
- `task` — `tests/repository/name-register.test.ts`
- `team` — `tests/runtime/margometer-runtime.test.ts`
- `term` — `tests/ui/panel-look.test.ts`
- `text` — in 35 files: `tests/`
- `texts` — `tests/ui/panel-words.test.ts`
- `theirs` — `tests/core/aura-standing.test.ts`
- `this` — `tests/game/game-battle.test.ts`
- `thisArg` — `tests/game/game-battle.test.ts`
- `thrown` — `tests/e2e/panel-fixture.ts`
- `tick` — `tests/core/injure-rule.test.ts`
- `times` — `tests/runtime/engine-search.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `to` — `tests/core/last-heal-rule.test.ts`
- `token` — `tests/ui/panel-look.test.ts`
- `tokens` — `tests/repository/design-tokens.test.ts`
- `tone` — `tests/ui/card-window.test.ts`
- `total` — `tests/ui/share-column.test.ts`
- `tracked` — `tests/repository/name-register.test.ts`
- `translate` — `tests/ui/panel-card.test.ts`
- `tree` — `tests/repository/name-register.test.ts`
- `trimmed` — `tests/core/aura-standing.test.ts`
- `turns` — `tests/core/aura-standing.test.ts`, `tests/tools/turn-count.test.ts`
- `turnsByCombatantId` — `tests/core/carried-figure.test.ts`
- `turnsElapsed` — `tests/core/charged-skill.test.ts`, `tests/ui/panel-words.test.ts`
- `turnsStated` — `tests/core/charged-skill.test.ts`, `tests/ui/panel-words.test.ts`
- `type` — in 5 files: `tests/`
- `update` — `tests/game/recorded-session.test.ts`
- `updates` — `tests/simulation.ts`
- `url` — `tests/game/browser-file.test.ts`
- `use` — `tests/e2e/panel-fixture.ts`
- `value` — in 12 files: `tests/`
- `values` — `tests/fake-window.ts`, `tests/game/browser-console.test.ts`,
  `tests/ui/panel-look.test.ts`
- `variable` — `tests/e2e/panel-options.spec.ts`
- `verb` — `tests/repository/called-once.test.ts`, `tests/repository/name-register.test.ts`
- `verbs` — `tests/repository/event-entries.test.ts`
- `version` — `tests/e2e/panel-fixture.ts`
- `view` — `tests/game/recorded-session.test.ts`, `tests/tools/panel-shots.test.ts`
- `visit` — `tests/game/recorded-session.test.ts`
- `vocabularies` — `tests/repository/name-register.test.ts`
- `walk` — `tests/core/carried-status.test.ts`, `tests/core/legendary-standing.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `warriors` — `tests/game/game-tooltip.test.ts`
- `went` — `tests/fake-document.ts`
- `where` — `tests/e2e/panel-fixture.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/share-column.test.ts`
- `width` — `tests/tools/turn-reading.test.ts`
- `widthPixels` — `tests/ui/panel-drag.test.ts`
- `window` — `tests/fake-window.ts`, `tests/simulation.ts`, `tests/userscript-entry.test.ts`
- `windowLayer` — `tests/e2e/panel-layer.spec.ts`
- `windowLeft` — `tests/ui/panel-drag.test.ts`
- `windowSelector` — `tests/e2e/panel-card.spec.ts`
- `windowWidth` — `tests/ui/panel-drag.test.ts`
- `within` — `tests/runtime/margometer-runtime.test.ts`
- `word` — `tests/tools/drill-report.test.ts`
- `worded` — `tests/ui/panel-palette.test.ts`, `tests/ui/panel-words.test.ts`
- `words` — `tests/ui/panel-element.test.ts`
- `workerInfo` — `tests/e2e/panel-fixture.ts`
- `world` — `tests/runtime-world.ts`, `tests/runtime/margometer-runtime.test.ts`
- `wrap` — `tests/runtime/engine-search.test.ts`
- `written` — `tests/repository/name-register.test.ts`
- `x` — `tests/e2e/panel-layer.spec.ts`, `tests/e2e/panel-probe.ts`, `tests/game/game-place.test.ts`
- `y` — `tests/e2e/panel-probe.ts`, `tests/game/game-place.test.ts`

## Fields

### `libs/`

- `cause` — `libs/errors.ts`, `libs/json-text.ts`
- `count` — `libs/unknown-value.ts`
- `end` — `libs/html-text.ts`, `libs/text-walk.ts`
- `expected` — `libs/unknown-value.ts`
- `field` — `libs/unknown-value.ts`
- `list` — `libs/unknown-value.ts`
- `maximum` — `libs/unknown-value.ts`
- `name` — in 4 files: `libs/`
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
- `auras` — `src/core/aura-standing.ts`, `src/core/carried-figure.ts`
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
- `byId` — `src/core/combatant-roster.ts`
- `carriedStatusWalk` — `src/core/fight-session.ts`
- `carriedStatuses` — `src/core/fight-session.ts`
- `cast` — `src/core/aura-standing.ts`
- `castByCasterAndSkill` — `src/core/aura-standing.ts`
- `casterId` — `src/core/aura-standing.ts`, `src/core/combatant-health.ts`
- `castersSide` — `src/core/protocol-key.ts`
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
- `doesTakeValue` — `src/core/protocol-key.ts`
- `drawn` — `src/core/battle-event.ts`
- `effect` — `src/core/aura-standing.ts`, `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `element` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`,
  `src/core/fight-statistics.ts`
- `end` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `endedAtOrdinal` — `src/core/charged-skill.ts`
- `events` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `eventsAdded` — `src/core/fight-session.ts`
- `eventsMaximum` — `src/core/fight-session.ts`
- `fightOutcome` — `src/core/battle-event.ts`
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
- `legendaryStandings` — `src/core/fight-session.ts`
- `legendaryWalk` — `src/core/fight-session.ts`
- `level` — `src/core/combatant-roster.ts`
- `lightingTurnByBitByCombatantId` — `src/core/carried-status.ts`
- `lost` — `src/core/battle-event.ts`
- `lostNames` — `src/core/fight-statistics.ts`
- `maximum` — `src/core/fight-decoder.ts`, `src/core/fight-session.ts`
- `message` — `src/core/battle-event.ts`, `src/core/fight-decoder.ts`
- `messages` — `src/core/fight-session.ts`
- `messagesLost` — `src/core/fight-session.ts`
- `messagesRead` — `src/core/fight-session.ts`
- `messagesStated` — `src/core/fight-session.ts`
- `name` — in 4 files: `src/core/`
- `namedDamage` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `namedHealing` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `names` — `src/core/aura-standing.ts`
- `next` — `src/core/fight-session.ts`
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
- `side` — `src/core/carried-figure.ts`, `src/core/combatant-roster.ts`
- `sideHealByEvent` — `src/core/fight-figures.ts`
- `sideHealsStated` — `src/core/fight-statistics.ts`
- `sideHealsUnsized` — `src/core/fight-statistics.ts`
- `sign` — `src/core/fight-decoder.ts`, `src/core/protocol-key.ts`
- `skillId` — in 4 files: `src/core/`
- `skillKeysRead` — `src/core/fight-decoder.ts`
- `skillName` — in 5 files: `src/core/`
- `skillUsed` — `src/core/battle-event.ts`
- `skills` — `src/core/fight-statistics.ts`
- `source` — in 4 files: `src/core/`
- `standing` — `src/core/fight-statistics.ts`
- `state` — `src/core/charged-skill.ts`, `src/core/fight-session.ts`
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

### `src/game/`

- `ac` — `src/game/warrior-snapshot.ts`
- `asked` — `src/game/game-tooltip.ts`
- `build` — `src/game/game-value.ts`
- `buildEnd` — `src/game/game-build.ts`
- `buildStart` — `src/game/game-build.ts`
- `call` — `src/game/fight-capture.ts`
- `callIndex` — `src/game/fight-capture.ts`
- `calls` — `src/game/fight-capture.ts`
- `cause` — `src/game/browser-store.ts`, `src/game/payload-envelope.ts`
- `charge` — `src/game/payload-envelope.ts`
- `chargeStatements` — `src/game/payload-envelope.ts`
- `className` — `src/game/browser-file.ts`
- `combatantId` — `src/game/payload-envelope.ts`
- `combatants` — `src/game/payload-envelope.ts`
- `combatantsAfter` — `src/game/fight-capture.ts`
- `combatantsBefore` — `src/game/fight-capture.ts`
- `count` — `src/game/game-battle.ts`, `src/game/payload-envelope.ts`,
  `src/game/warrior-snapshot.ts`
- `data` — `src/game/game-hero.ts`, `src/game/game-place.ts`
- `day` — `src/game/browser-time.ts`
- `download` — `src/game/browser-file.ts`
- `droppedCalls` — `src/game/fight-capture.ts`
- `energy` — `src/game/warrior-snapshot.ts`
- `field` — `src/game/payload-envelope.ts`
- `fights` — `src/game/browser-store.ts`
- `first` — `src/game/game-battle.ts`
- `health` — `src/game/payload-envelope.ts`
- `healthMaximum` — `src/game/payload-envelope.ts`
- `helperFolded` — `src/game/browser-store.ts`
- `helperPosition` — `src/game/browser-store.ts`
- `helperSize` — `src/game/browser-store.ts`
- `hero` — `src/game/game-hero.ts`, `src/game/game-place.ts`, `src/game/game-value.ts`
- `hour` — `src/game/browser-time.ts`
- `hp` — `src/game/warrior-snapshot.ts`
- `href` — `src/game/browser-file.ts`
- `id` — `src/game/game-hero.ts`, `src/game/payload-envelope.ts`, `src/game/warrior-snapshot.ts`
- `index` — `src/game/fight-capture.ts`
- `isEnd` — `src/game/payload-envelope.ts`
- `isInit` — `src/game/payload-envelope.ts`
- `isOnAuto` — `src/game/payload-envelope.ts`
- `isOpening` — `src/game/fight-capture.ts`
- `isPastCeiling` — `src/game/fight-capture.ts`
- `isTruncated` — `src/game/fight-capture.ts`
- `kept` — `src/game/fight-capture.ts`
- `label` — `src/game/game-value.ts`
- `length` — `src/game/browser-store.ts`
- `level` — `src/game/payload-envelope.ts`
- `looks` — `src/game/game-battle.ts`
- `lvl` — `src/game/warrior-snapshot.ts`
- `mana` — `src/game/warrior-snapshot.ts`
- `map` — `src/game/game-place.ts`
- `mapName` — `src/game/fight-place.ts`, `src/game/game-place.ts`
- `maximum` — in 4 files: `src/game/`
- `messages` — `src/game/fight-capture.ts`, `src/game/payload-envelope.ts`
- `messagesStated` — `src/game/payload-envelope.ts`
- `meterFolded` — `src/game/browser-store.ts`
- `meterPosition` — `src/game/browser-store.ts`
- `meterSize` — `src/game/browser-store.ts`
- `minute` — `src/game/browser-time.ts`
- `month` — `src/game/browser-time.ts`
- `name` — in 6 files: `src/game/`
- `nameStart` — `src/game/game-build.ts`
- `now` — `src/game/payload-envelope.ts`
- `ordinal` — `src/game/payload-envelope.ts`
- `payload` — `src/game/fight-capture.ts`
- `place` — `src/game/game-value.ts`
- `prof` — `src/game/warrior-snapshot.ts`
- `profession` — `src/game/payload-envelope.ts`
- `readerSide` — `src/game/payload-envelope.ts`
- `shape` — `src/game/fight-capture.ts`
- `shapesSeen` — `src/game/fight-capture.ts`
- `side` — `src/game/payload-envelope.ts`
- `skillName` — `src/game/payload-envelope.ts`
- `state` — `src/game/fight-capture.ts`
- `statesSeen` — `src/game/fight-capture.ts`
- `statusMasksByCombatantId` — `src/game/payload-envelope.ts`
- `statuses` — `src/game/payload-envelope.ts`
- `storage` — `src/game/browser-store.ts`
- `team` — `src/game/warrior-snapshot.ts`
- `turnStatement` — `src/game/payload-envelope.ts`
- `turnsElapsed` — `src/game/payload-envelope.ts`
- `turnsStated` — `src/game/payload-envelope.ts`
- `typeStep` — `src/game/browser-store.ts`
- `value` — `src/game/game-value.ts`
- `written` — `src/game/game-tooltip.ts`
- `x` — `src/game/fight-place.ts`, `src/game/game-place.ts`
- `y` — `src/game/fight-place.ts`, `src/game/game-place.ts`

### `src/runtime/`

- `Caught` — `src/runtime/failure-fate.ts`
- `CombatantsExceeded` — `src/runtime/failure-fate.ts`
- `EventsExceeded` — `src/runtime/failure-fate.ts`
- `EverySlotPinned` — `src/runtime/failure-fate.ts`
- `FightAlreadyKept` — `src/runtime/failure-fate.ts`
- `FightNotKept` — `src/runtime/failure-fate.ts`
- `FiguresDisagreed` — `src/runtime/failure-fate.ts`
- `FileApiAbsent` — `src/runtime/failure-fate.ts`
- `FileUnserializable` — `src/runtime/failure-fate.ts`
- `GameBattleAbsent` — `src/runtime/failure-fate.ts`
- `GameEngineAbsent` — `src/runtime/failure-fate.ts`
- `GameEngineAlreadyWrapped` — `src/runtime/failure-fate.ts`
- `GameMethodAbsent` — `src/runtime/failure-fate.ts`
- `GameValueAbsent` — `src/runtime/failure-fate.ts`
- `GameWarriorsAbsent` — `src/runtime/failure-fate.ts`
- `GameWarriorsExceeded` — `src/runtime/failure-fate.ts`
- `GestureDropped` — `src/runtime/failure-fate.ts`
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
- `auras` — `src/runtime/carried-tooltip.ts`
- `battle` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`
- `bit` — `src/runtime/carried-tooltip.ts`
- `blows` — `src/runtime/fight-file.ts`
- `blowsCritical` — `src/runtime/fight-file.ts`
- `blowsStruck` — `src/runtime/fight-file.ts`
- `blowsWithoutSkill` — `src/runtime/fight-file.ts`
- `build` — `src/runtime/fight-handover.ts`, `src/runtime/live-fight.ts`,
  `src/runtime/margometer-runtime.ts`
- `calls` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `capture` — `src/runtime/fight-handover.ts`, `src/runtime/live-fight.ts`
- `capturedAt` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
- `card` — `src/runtime/panel-frame.ts`
- `cause` — `src/runtime/fight-file.ts`, `src/runtime/shelf.ts`
- `charge` — `src/runtime/carried-tooltip.ts`
- `choice` — `src/runtime/margometer-runtime.ts`, `src/runtime/shelf-keeper.ts`
- `clock` — in 4 files: `src/runtime/`
- `combatantId` — `src/runtime/panel-frame.ts`
- `combatants` — `src/runtime/fight-file.ts`
- `combatantsAfter` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/live-fight.ts`
- `combatantsBefore` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/live-fight.ts`
- `console` — `src/runtime/margometer-runtime.ts`
- `contents` — `src/runtime/shelf.ts`
- `count` — `src/runtime/defect-ledger.ts`, `src/runtime/panel-frame.ts`
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
- `figures` — `src/runtime/defect-ledger.ts`, `src/runtime/fight-state.ts`
- `file` — `src/runtime/defect-ledger.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/margometer-runtime.ts`
- `first` — `src/runtime/defect-ledger.ts`
- `formatVersion` — `src/runtime/fight-file.ts`
- `frame` — `src/runtime/margometer-runtime.ts`
- `frames` — `src/runtime/margometer-runtime.ts`
- `gameBattle` — `src/runtime/live-fight.ts`
- `gameBuild` — in 4 files: `src/runtime/`
- `gesture` — `src/runtime/defect-ledger.ts`
- `handle` — `src/runtime/margometer-runtime.ts`
- `hasChoiceRefused` — `src/runtime/shelf-keeper.ts`
- `hasFailed` — `src/runtime/margometer-runtime.ts`
- `hasFightToSave` — `src/runtime/panel-frame.ts`
- `hasFrameRefused` — `src/runtime/margometer-runtime.ts`
- `hasJoinedInProgress` — `src/runtime/carried-tooltip.ts`, `src/runtime/panel-frame.ts`
- `hasRefused` — `src/runtime/margometer-runtime.ts`
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
- `helper` — `src/runtime/margometer-runtime.ts`
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
- `isOver` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/panel-frame.ts`
- `isPinnable` — `src/runtime/panel-frame.ts`
- `isPinned` — in 4 files: `src/runtime/`
- `isStale` — `src/runtime/margometer-runtime.ts`
- `isStoodDown` — `src/runtime/margometer-runtime.ts`
- `isTruncated` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`
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
- `listener` — `src/runtime/live-fight.ts`
- `live` — `src/runtime/live-fight.ts`, `src/runtime/margometer-runtime.ts`,
  `src/runtime/panel-frame.ts`
- `looks` — `src/runtime/margometer-runtime.ts`
- `mapName` — `src/runtime/shelf.ts`
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
- `onFightOpened` — `src/runtime/live-fight.ts`
- `opened` — `src/runtime/panel-frame.ts`
- `openedAt` — `src/runtime/live-fight.ts`, `src/runtime/panel-frame.ts`, `src/runtime/shelf.ts`
- `options` — `src/runtime/margometer-runtime.ts`, `src/runtime/panel-frame.ts`,
  `src/runtime/shelf-keeper.ts`
- `outcome` — `src/runtime/panel-frame.ts`
- `pair` — `src/runtime/panel-frame.ts`
- `part` — `src/runtime/panel-frame.ts`
- `payload` — `src/runtime/fight-file.ts`, `src/runtime/fight-handover.ts`,
  `src/runtime/live-fight.ts`
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
- `region` — in 5 files: `src/runtime/`
- `report` — `src/runtime/fight-file.ts`
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
- `skillName` — `src/runtime/carried-tooltip.ts`
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
- `width` — `src/runtime/settings.ts`
- `windowSizes` — `src/runtime/panel-frame.ts`
- `world` — in 4 files: `src/runtime/`
- `wrap` — `src/runtime/margometer-runtime.ts`
- `x` — `src/runtime/shelf.ts`
- `y` — `src/runtime/shelf.ts`

### `src/ui/`

- `+acdmg_destroyed` — `src/ui/panel-words.ts`
- `+crit` — `src/ui/panel-words.ts`
- `+fastarrow` — `src/ui/panel-words.ts`
- `+freeze` — `src/ui/panel-words.ts`
- `+legbon_curse` — `src/ui/panel-words.ts`
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
- `+wound` — `src/ui/panel-words.ts`
- `+woundfrost` — `src/ui/panel-words.ts`
- `+woundmagic` — `src/ui/panel-words.ts`
- `+woundpoison` — `src/ui/panel-words.ts`
- `-arrowblock` — `src/ui/panel-words.ts`
- `-contra` — `src/ui/panel-words.ts`
- `-evade` — `src/ui/panel-words.ts`
- `-legbon_cleanse` — `src/ui/panel-words.ts`
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
- `at` — `src/ui/panel-content.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
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
- `cardGroup` — `src/ui/panel-look.ts`
- `cardHeading` — `src/ui/panel-look.ts`
- `cardHidden` — `src/ui/panel-look.ts`
- `cardLabel` — `src/ui/panel-look.ts`
- `cardLine` — `src/ui/panel-look.ts`
- `cardName` — `src/ui/panel-look.ts`
- `cardNote` — `src/ui/panel-look.ts`
- `cardStrong` — `src/ui/panel-look.ts`
- `cardSub` — `src/ui/panel-look.ts`
- `cardSubtitle` — `src/ui/panel-look.ts`
- `cardSuspect` — `src/ui/panel-look.ts`
- `cardValue` — `src/ui/panel-look.ts`
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
- `charge` — `src/ui/panel-words.ts`
- `chargedSkill` — `src/ui/panel-words.ts`
- `chargedSkills` — `src/ui/panel-helper.ts`
- `charging` — `src/ui/panel-words.ts`
- `children` — `src/ui/panel-document.ts`
- `choice` — `src/ui/panel-intent.ts`
- `chosenFightOpenedAt` — `src/ui/panel-screen.ts`
- `className` — `src/ui/panel-document.ts`, `src/ui/panel-element.ts`
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
- `damageDealtRaw` — `src/ui/panel-content.ts`
- `damageDealtToNobody` — `src/ui/panel-content.ts`
- `damageDealtToNobodyByKind` — `src/ui/panel-content.ts`
- `damageKind` — `src/ui/panel-words.ts`
- `damagePrevented` — `src/ui/panel-content.ts`
- `damagePreventedByDefence` — `src/ui/panel-content.ts`
- `damageTaken` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `damageTakenAbsorbedByDefence` — `src/ui/panel-content.ts`
- `damageTakenFromNobody` — `src/ui/panel-content.ts`
- `damageTakenFromNobodyByKind` — `src/ui/panel-content.ts`
- `damageTakenRaw` — `src/ui/panel-content.ts`
- `day` — `src/ui/panel-content.ts`
- `dealtTo` — `src/ui/panel-words.ts`
- `dealtWithNoActor` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `defect` — `src/ui/panel-look.ts`, `src/ui/panel-palette.ts`
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
- `drawn` — `src/ui/panel-words.ts`
- `edge` — `src/ui/panel-drag.ts`
- `element` — in 4 files: `src/ui/`
- `empty` — `src/ui/panel-look.ts`
- `end` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`
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
- `fled` — `src/ui/panel-words.ts`
- `fold` — `src/ui/panel-intent.ts`
- `folded` — `src/ui/panel-look.ts`
- `fontPixels` — `src/ui/panel-look.ts`
- `fontSmallPixels` — `src/ui/panel-look.ts`
- `frame` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `from` — `src/ui/panel-element.ts`
- `fromLeft` — `src/ui/panel-drag.ts`
- `fromTop` — `src/ui/panel-drag.ts`
- `gesture` — `src/ui/panel-words.ts`
- `gestureBack` — `src/ui/panel-words.ts`
- `gestureBackAnywhere` — `src/ui/panel-words.ts`
- `getTypeStep` — `src/ui/panel-element.ts`
- `getTypeTokens` — `src/ui/panel-drag.ts`
- `given` — `src/ui/panel-screen.ts`
- `givenWithNoActor` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `grab` — `src/ui/panel-drag.ts`, `src/ui/view-failure.ts`
- `grip` — `src/ui/panel-drag.ts`, `src/ui/panel-element.ts`
- `groups` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`
- `h` — `src/ui/panel-words.ts`
- `half` — `src/ui/panel-look.ts`
- `halfNamed` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `hasFightToSave` — `src/ui/panel-element.ts`
- `hasFiguresDisagreed` — `src/ui/panel-content.ts`
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
- `healthRestored` — `src/ui/panel-content.ts`, `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`
- `healthRestoredByNobody` — `src/ui/panel-content.ts`
- `healthRestoredByNobodyByKey` — `src/ui/panel-content.ts`
- `healthSource` — `src/ui/panel-words.ts`
- `height` — `src/ui/panel-choice.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `heightMaximum` — `src/ui/panel-drag.ts`
- `heightMinimum` — `src/ui/panel-drag.ts`
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
- `holytouch` — `src/ui/panel-words.ts`
- `holytouchHealsReceived` — `src/ui/panel-words.ts`
- `hour` — `src/ui/panel-content.ts`
- `hover` — `src/ui/view-failure.ts`
- `index` — `src/ui/panel-words.ts`
- `injure` — `src/ui/panel-words.ts`
- `inkDark` — `src/ui/panel-look.ts`
- `inkLight` — `src/ui/panel-look.ts`
- `insetPixels` — `src/ui/panel-look.ts`
- `isChosen` — `src/ui/panel-content.ts`
- `isCurrent` — `src/ui/panel-element.ts`, `src/ui/panel-screen.ts`
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
- `keeping` — `src/ui/panel-words.ts`
- `kept` — `src/ui/panel-words.ts`
- `keptUnread` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `key` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `keyPrefix` — `src/ui/panel-element.ts`
- `kind` — in 4 files: `src/ui/`
- `kinds` — `src/ui/panel-content.ts`
- `label` — `src/ui/panel-element.ts`, `src/ui/panel-words.ts`
- `large` — `src/ui/panel-choice.ts`, `src/ui/panel-words.ts`
- `largest` — `src/ui/panel-content.ts`
- `lastheal` — `src/ui/panel-words.ts`
- `layer` — `src/ui/panel-look.ts`
- `leave` — `src/ui/panel-document.ts`, `src/ui/view-failure.ts`
- `left` — `src/ui/panel-choice.ts`, `src/ui/panel-drag.ts`, `src/ui/panel-look.ts`
- `legbon_holytouch_heal` — `src/ui/panel-words.ts`
- `legbon_lastheal` — `src/ui/panel-words.ts`
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
- `lost` — `src/ui/panel-words.ts`
- `m` — `src/ui/panel-words.ts`
- `many` — `src/ui/panel-words.ts`
- `mark` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `markLetterPixels` — `src/ui/panel-look.ts`
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
- `options` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-words.ts`
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
- `outcome` — `src/ui/panel-content.ts`
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
- `right` — `src/ui/panel-look.ts`
- `row` — `src/ui/panel-content.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-look.ts`
- `rowApart` — `src/ui/panel-look.ts`
- `rowCaveat` — `src/ui/panel-look.ts`
- `rowChosen` — `src/ui/panel-look.ts`
- `rowDrillable` — `src/ui/panel-look.ts`
- `rowHeightPixels` — `src/ui/panel-look.ts`
- `rowLeaf` — `src/ui/panel-look.ts`
- `rowName` — `src/ui/panel-look.ts`
- `rowPin` — `src/ui/panel-look.ts`
- `rowPinSet` — `src/ui/panel-look.ts`
- `rowRank` — `src/ui/panel-look.ts`
- `rowShare` — `src/ui/panel-look.ts`
- `rowSide` — `src/ui/panel-look.ts`
- `rowSize` — `src/ui/panel-look.ts`
- `rowSuspect` — `src/ui/panel-look.ts`
- `rowTime` — `src/ui/panel-look.ts`
- `rowTurn` — `src/ui/panel-look.ts`
- `rowValue` — `src/ui/panel-look.ts`
- `rows` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `rowsMaximum` — `src/ui/panel-words.ts`
- `rowsVisibleCount` — `src/ui/panel-content.ts`
- `said` — `src/ui/panel-element.ts`
- `save` — `src/ui/panel-intent.ts`
- `saveFight` — `src/ui/panel-words.ts`
- `saveFile` — `src/ui/panel-intent.ts`
- `scope` — `src/ui/panel-words.ts`
- `screen` — `src/ui/panel-intent.ts`
- `scrollTop` — `src/ui/panel-document.ts`
- `section` — `src/ui/panel-look.ts`
- `sectionWords` — `src/ui/panel-look.ts`
- `session` — `src/ui/panel-choice.ts`, `src/ui/panel-words.ts`
- `share` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/panel-words.ts`
- `shareOfFigure` — `src/ui/panel-words.ts`
- `shareText` — `src/ui/panel-content.ts`, `src/ui/panel-element.ts`
- `sheet` — `src/ui/panel-element.ts`
- `shelf` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
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
- `skillName` — `src/ui/panel-element.ts`, `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
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
- `turnsPassed` — `src/ui/panel-words.ts`
- `turnsStated` — `src/ui/panel-helper.ts`, `src/ui/panel-words.ts`
- `turnsTaken` — `src/ui/panel-content.ts`, `src/ui/panel-words.ts`
- `turnsWithLost` — `src/ui/panel-words.ts`
- `typeSize` — `src/ui/panel-words.ts`
- `typeStep` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`, `src/ui/panel-screen.ts`
- `unannounced` — `src/ui/panel-words.ts`
- `undrawn` — `src/ui/panel-element.ts`, `src/ui/panel-look.ts`, `src/ui/view-failure.ts`
- `unit` — `src/ui/panel-words.ts`
- `unknown` — `src/ui/panel-palette.ts`, `src/ui/panel-words.ts`
- `unnamed` — `src/ui/panel-element.ts`, `src/ui/panel-intent.ts`
- `unnamedCut` — `src/ui/panel-element.ts`
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
- `won` — `src/ui/panel-words.ts`
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
- `bits` — `frozen/buff-bits.ts`
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
- `gameBuild` — `frozen/buff-bits.ts`, `frozen/protocol-keys.ts`
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

- `abilities` — `tools/capture-intake.ts`
- `ac` — `tools/fabricated-fight.ts`
- `act` — `tools/fabricated-fight.ts`
- `actor` — `tools/fabricated-fight.ts`
- `actorId` — `tools/turn-reading.ts`
- `actsReached` — `tools/fabricated-fight.ts`
- `added` — `tools/game-readings.ts`
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
- `bit` — `tools/aura-lifetime.ts`, `tools/game-readings.ts`
- `bitName` — `tools/aura-lifetime.ts`
- `blowsGrantedMinimum` — `tools/skill-table.ts`
- `boolean` — in 6 files: `tools/`
- `boundary` — `tools/turn-reading.ts`
- `bounded` — `tools/turn-count.ts`
- `browser` — `tools/panel-giving-way.ts`
- `buffBitTable` — `tools/margometer-tool-error.ts`
- `build` — `tools/capture-intake.ts`, `tools/game-client-source.ts`
- `bundlePath` — `tools/game-client-source.ts`
- `cache-control` — `tools/preview-server.ts`
- `cached` — `tools/help-article.ts`, `tools/skill-table.ts`
- `calls` — in 5 files: `tools/`
- `callsAddress` — `tools/preview-page.ts`, `tools/preview-server.ts`
- `captureIntake` — `tools/margometer-tool-error.ts`
- `cardHeight` — `tools/margometer-tool-error.ts`
- `casterId` — `tools/shout-holding.ts`
- `casterIds` — `tools/aura-standing.ts`
- `casters` — `tools/aura-standing.ts`
- `cause` — in 14 files: `tools/`
- `changed` — `tools/capture-intake.ts`
- `changelog` — `tools/margometer-tool-error.ts`
- `channel` — `tools/game-client-source.ts`
- `closing` — `tools/drill-report.ts`
- `code` — `tools/margometer-tool-error.ts`
- `collect` — `tools/panel-giving-way.ts`
- `combatantId` — in 4 files: `tools/`
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
- `current` — `tools/game-readings.ts`
- `cwd` — `tools/build-userscript.ts`, `tools/develop-reports.ts`
- `date` — `tools/frozen-files.ts`
- `dealtSign` — `tools/protocol-key-table.ts`
- `declaredVersion` — `tools/margometer-tool-error.ts`
- `detail` — `tools/card-height.ts`
- `developLines` — `tools/develop-reports.ts`
- `developReport` — `tools/margometer-tool-error.ts`
- `development` — `tools/game-client-source.ts`
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
- `execute` — `tools/fabricated-fight.ts`
- `fabricatedBy` — `tools/fabricated-fight.ts`
- `fabricatedFight` — `tools/margometer-tool-error.ts`
- `fabricatedShape` — `tools/fabricated-fight.ts`
- `fabricationScript` — `tools/fabricated-fight.ts`
- `fedThrough` — `tools/panel-shots.ts`, `tools/preview-page.ts`
- `fetchedAt` — `tools/game-client-source.ts`, `tools/help-article.ts`, `tools/skill-table.ts`
- `field` — `tools/protocol-key-table.ts`
- `fight` — in 4 files: `tools/`
- `fightName` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `fights` — in 5 files: `tools/`
- `figureBonus` — `tools/fabricated-fight.ts`
- `figureNow` — `tools/fabricated-fight.ts`
- `fled` — `tools/fabricated-fight.ts`
- `focus` — `tools/fabricated-fight.ts`
- `from` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `fromPaths` — `tools/preview-server.ts`
- `frozen` — `tools/game-readings.ts`
- `game` — `tools/payload-cost.ts`
- `gameReadings` — `tools/margometer-tool-error.ts`
- `gameSource` — `tools/margometer-tool-error.ts`
- `gameUnreachable` — `tools/margometer-tool-error.ts`
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
- `host` — `tools/game-client-source.ts`
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
- `kind` — `tools/drill-report.ts`, `tools/protocol-key-table.ts`
- `kinds` — `tools/turn-reading.ts`
- `komunikaty` — `tools/capture-intake.ts`
- `label` — `tools/preview-page.ts`, `tools/preview-site.ts`
- `ladunek` — `tools/capture-intake.ts`
- `language` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `length` — `tools/aura-lifetime.ts`
- `level` — `tools/fabricated-fight.ts`
- `lifted` — `tools/game-readings.ts`
- `lightings` — `tools/aura-lifetime.ts`
- `line` — `tools/help-claim-register.ts`, `tools/protocol-key-shape.ts`
- `lineIndex` — `tools/develop-reports.ts`
- `lines` — `tools/card-height.ts`
- `listeners` — `tools/preview-server.ts`
- `litAt` — `tools/aura-lifetime.ts`
- `lost` — `tools/turn-count.ts`, `tools/turn-reading.ts`
- `lostId` — `tools/turn-reading.ts`
- `lvl` — `tools/fabricated-fight.ts`
- `mana` — `tools/fabricated-fight.ts`
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
- `metric` — `tools/card-height.ts`
- `microseconds` — `tools/payload-cost.ts`
- `moment` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`
- `momentsFromOne` — `tools/aura-standing.ts`
- `momentsPastTwo` — `tools/aura-standing.ts`
- `momentsWithTwo` — `tools/aura-standing.ts`
- `move` — `tools/fabricated-fight.ts`
- `moveOpening` — `tools/fabricated-fight.ts`
- `name` — in 13 files: `tools/`
- `namedAtOnce` — `tools/aura-standing.ts`
- `namesById` — `tools/capture-intake.ts`
- `needs` — `tools/preview-page.ts`, `tools/preview-site.ts`
- `needsLine` — `tools/preview-page.ts`, `tools/preview-site.ts`
- `neitherEnd` — `tools/drill-report.ts`
- `never` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `newer` — `tools/develop-reports.ts`
- `noKind` — `tools/drill-report.ts`
- `nonPlayer` — `tools/capture-intake.ts`
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
- `production` — `tools/game-client-source.ts`
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
- `removed` — `tools/capture-intake.ts`, `tools/game-readings.ts`
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
- `says` — `tools/game-readings.ts`
- `scale` — `tools/fabricated-fight.ts`
- `screen` — `tools/card-height.ts`, `tools/drill-report.ts`
- `script` — `tools/build-userscript.ts`, `tools/panel-shots.ts`, `tools/preview-server.ts`
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
- `skills` — `tools/fabricated-fight.ts`, `tools/skill-table.ts`
- `skillsComboMaximum` — `tools/fabricated-fight.ts`
- `skillsDisabled` — `tools/fabricated-fight.ts`
- `sometimes` — `tools/drill-report.ts`, `tools/turn-count.ts`
- `source` — `tools/drill-report.ts`
- `sourcesAtOnce` — `tools/aura-standing.ts`
- `stale` — `tools/game-readings.ts`
- `standing` — `tools/turn-reading.ts`
- `standingAtOnce` — `tools/aura-standing.ts`
- `start` — `tools/preview-page.ts`, `tools/preview-server.ts`, `tools/preview-site.ts`
- `statementOrdinal` — `tools/fabricated-fight.ts`
- `statistics` — `tools/drill-report.ts`
- `status` — `tools/preview-server.ts`
- `statusClearsAtRound` — `tools/fabricated-fight.ts`
- `statusMask` — `tools/fabricated-fight.ts`
- `stderr` — `tools/build-userscript.ts`, `tools/develop-reports.ts`, `tools/panel-shots.ts`
- `stdout` — `tools/build-userscript.ts`, `tools/develop-reports.ts`
- `steps` — `tools/panel-giving-way.ts`, `tools/panel-shots.ts`, `tools/recorded-material.ts`
- `stretch` — `tools/turn-count.ts`
- `string` — `tools/drill-report.ts`, `tools/fabricated-fight.ts`, `tools/panel-giving-way.ts`
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
- `turnsElapsed` — `tools/shout-holding.ts`
- `turnsStated` — `tools/aura-standing.ts`
- `under` — `tools/turn-count.ts`
- `underway` — `tools/panel-shots.ts`
- `unknown` — `tools/game-readings.ts`
- `unnamed` — `tools/drill-report.ts`
- `unnamedCut` — `tools/drill-report.ts`
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
- `warriors` — `tools/fabricated-fight.ts`
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

- `$` — `tests/game/game-tooltip.test.ts`, `tests/rebuilding-battle.ts`
- `-3` — `tests/tools/capture-intake.test.ts`
- `-4` — `tests/tools/capture-intake.test.ts`
- `1` — `tests/game/warrior-entries.test.ts`
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
- `MARGOMETER_TIPS` — `tests/e2e/panel-tooltip.spec.ts`
- `MARGOMETER_TOLD` — `tests/e2e/panel-tooltip.spec.ts`
- `NAMED_KEY` — `tests/core/aura-standing.test.ts`
- `PANEL_DEFECT_KIND` — `tests/ui/panel-words.test.ts`
- `PANEL_REGION` — `tests/ui/panel-words.test.ts`
- `PROC_SUB_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `PROC_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `PROFESSION_WORD_BY_KEY` — `tests/ui/panel-words.test.ts`
- `STATUS_CATEGORY` — `tests/ui/panel-words.test.ts`
- `THOUSAND_SEPARATOR` — `tests/ui/panel-words.test.ts`
- `UNANNOUNCED_CAVEATS` — `tests/ui/panel-words.test.ts`
- `UNKNOWN_COLOUR` — `tests/repository/design-tokens.test.ts`
- `URL` — `tests/fake-window.ts`
- `__margometerBattleWrap` — `tests/game/game-battle.test.ts`
- `_t` — `tests/game/game-dictionary.test.ts`, `tests/simulation.ts`
- `a` — `tests/libs/json-text.test.ts`, `tests/libs/unknown-value.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `abandoned` — `tests/runtime/engine-search.test.ts`
- `ac` — `tests/game/fight-capture.test.ts`, `tests/game/warrior-snapshot.test.ts`
- `actions/setup-node` — `tests/repository/workflows.test.ts`
- `actorHealthPercent` — in 6 files: `tests/`
- `actorId` — in 7 files: `tests/`
- `addEventListener` — `tests/repository/handed-callbacks.test.ts`
- `addOnVersion` — in 4 files: `tests/`
- `added` — `tests/tools/game-readings.test.ts`
- `address` — `tests/tools/preview-page.test.ts`
- `after` — `tests/runtime/live-fight.test.ts`
- `afterDriver` — `tests/e2e/game-page.ts`
- `afterLine` — `tests/tools/preview-page.test.ts`
- `agreed` — `tests/core/health-witness.test.ts`, `tests/tools/turn-count.test.ts`
- `agreedNames` — `tests/tools/develop-reports.test.ts`
- `agreeing` — `tests/tools/aura-lifetime.test.ts`
- `alias` — `tests/repository/name-register.test.ts`
- `along` — `tests/e2e/panel-probe.ts`
- `amount` — in 12 files: `tests/`
- `amountByKey` — `tests/core/carried-figure.test.ts`
- `amounts` — `tests/tools/skill-table.test.ts`
- `anchor` — `tests/game/browser-file.test.ts`
- `anchors` — `tests/fake-window.ts`
- `announced` — in 8 files: `tests/`
- `announcedStrikerId` — `tests/core/turn-clock.test.ts`
- `announcementStanding` — in 17 files: `tests/`
- `announcementsActor` — `tests/repository/protocol-keys.test.ts`
- `answers` — `tests/e2e/game-page.ts`, `tests/ui/panel-element.test.ts`
- `apart` — `tests/tools/aura-lifetime.test.ts`
- `apartAgreeing` — `tests/tools/aura-lifetime.test.ts`
- `appeared` — `tests/core/health-witness.test.ts`
- `appended` — `tests/game/game-tooltip.test.ts`, `tests/rebuilding-battle.ts`,
  `tests/runtime/carried-tooltip.test.ts`
- `appendedScript` — `tests/tools/preview-page.test.ts`
- `applied` — in 6 files: `tests/`
- `args` — in 6 files: `tests/`
- `argument` — `tests/source-tree.ts`
- `arguments` — `tests/source-tree.ts`
- `article` — `tests/tools/help-article.test.ts`
- `asked` — in 4 files: `tests/`
- `async` — `tests/source-tree.ts`
- `at` — in 11 files: `tests/`
- `atShouter` — `tests/tools/shout-holding.test.ts`
- `atSomebodyElse` — `tests/tools/shout-holding.test.ts`
- `attacks` — `tests/core/fight-decoder.test.ts`
- `attributes` — `tests/fake-document.ts`
- `auraTurnsBySkillId` — `tests/core/aura-standing.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `auras` — `tests/core/carried-figure.test.ts`
- `auto` — `tests/e2e/panel-fixture.ts`, `tests/game/fight-capture.test.ts`,
  `tests/game/payload-envelope.test.ts`
- `backHint` — `tests/tools/preview-page.test.ts`
- `bare` — `tests/core/aura-standing.test.ts`
- `bars` — `tests/e2e/panel-scroll.spec.ts`
- `base` — `tests/repository/name-register.test.ts`, `tests/ui/level-drawn.test.ts`
- `battle` — in 9 files: `tests/`
- `beforeBundle` — `tests/e2e/game-page.ts`
- `behind` — `tests/e2e/panel-scroll.spec.ts`
- `big` — `tests/runtime/fight-file.test.ts`
- `bit` — in 5 files: `tests/`
- `bitName` — `tests/tools/aura-lifetime.test.ts`
- `blobs` — `tests/fake-window.ts`
- `blows` — in 4 files: `tests/`
- `blowsCritical` — `tests/ui/panel-card.test.ts`
- `blowsGrantedBySkillId` — `tests/core/fight-decoder.test.ts`,
  `tests/core/granted-blow-rule.test.ts`
- `blowsGrantedMinimum` — `tests/tools/skill-table.test.ts`
- `blowsStruck` — `tests/ui/panel-card.test.ts`
- `blowsWithoutSkill` — `tests/ui/panel-card.test.ts`
- `body` — in 6 files: `tests/`
- `border` — `tests/repository/design-tokens.test.ts`
- `bottom` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`,
  `tests/e2e/panel-size.spec.ts`
- `bounded` — `tests/tools/turn-count.test.ts`
- `broken` — `tests/game/recorded-session.test.ts`
- `browser` — `tests/tools/panel-giving-way.test.ts`
- `bubbles` — `tests/e2e/panel-card.spec.ts`
- `buffs` — `tests/game/payload-envelope.test.ts`, `tests/game/warrior-entries.test.ts`
- `build` — in 4 files: `tests/`
- `built` — `tests/e2e/panel-fixture.ts`
- `bundlePath` — `tests/tools/game-client-source.test.ts`, `tests/tools/game-readings.test.ts`
- `button` — `tests/e2e/panel-drill.spec.ts`, `tests/e2e/panel-options.spec.ts`,
  `tests/ui/panel-gesture.test.ts`
- `by` — `tests/e2e/panel-drag.spec.ts`
- `byCombatantId` — `tests/core/fight-figures.test.ts`, `tests/core/fight-statistics.test.ts`,
  `tests/ui/panel-content.test.ts`
- `byElement` — `tests/ui/panel-element.test.ts`
- `byName` — `tests/core/fight-decoder.test.ts`
- `byOtherEnd` — `tests/ui/panel-element.test.ts`
- `bySkill` — `tests/ui/panel-element.test.ts`
- `call` — `tests/game/fight-capture.test.ts`
- `callIndex` — `tests/game/fight-capture.test.ts`
- `callee` — `tests/source-tree.ts`
- `calls` — in 11 files: `tests/`
- `callsAddress` — `tests/tools/preview-page.test.ts`
- `cancelled` — `tests/game/browser-frame.test.ts`
- `cancels` — `tests/runtime/engine-search.test.ts`
- `capture` — `tests/runtime/panel-frame.test.ts`
- `capturedAt` — `tests/runtime/fight-file.test.ts`, `tests/tools/capture-intake.test.ts`
- `card` — in 4 files: `tests/`
- `cardAt` — `tests/e2e/panel-helper.spec.ts`
- `cardWidth` — `tests/repository/design-tokens.test.ts`
- `carried` — `tests/tools/preview-page.test.ts`
- `carriedStatuses` — `tests/core/aura-standing.test.ts`
- `caster` — `tests/core/absorption-destruction-rule.test.ts`
- `casterColour` — `tests/ui/panel-helper.test.ts`
- `casterId` — `tests/core/carried-figure.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-helper.test.ts`
- `casterName` — `tests/ui/panel-helper.test.ts`
- `casterSideRelation` — `tests/ui/panel-helper.test.ts`
- `casters` — `tests/tools/aura-standing.test.ts`
- `cause` — `tests/game/browser-console.test.ts`
- `caveat` — `tests/repository/design-tokens.test.ts`, `tests/ui/card-window.test.ts`,
  `tests/ui/panel-look.test.ts`
- `channel` — `tests/e2e/panel-camera.ts`, `tests/tools/game-client-source.test.ts`,
  `tests/tools/game-readings.test.ts`
- `charge` — in 4 files: `tests/`
- `chargeStatements` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`
- `chargedSkills` — `tests/core/aura-standing.test.ts`
- `charging` — `tests/game/recorded-session.test.ts`
- `children` — `tests/fake-document.ts`, `tests/tools/preview-state.test.ts`
- `choice` — `tests/runtime/live-fight.test.ts`, `tests/runtime/shelf-keeper.test.ts`,
  `tests/ui/panel-intent.test.ts`
- `claim` — `tests/repository/protocol-keys.test.ts`
- `class` — `tests/repository/name-register.test.ts`
- `className` — in 5 files: `tests/`
- `classes` — `tests/repository/name-register.test.ts`
- `clause` — `tests/tools/aura-lifetime.test.ts`
- `clear` — `tests/e2e/panel-layer.spec.ts`
- `cleared` — `tests/game/browser-interval.test.ts`
- `clientHeight` — `tests/e2e/panel-card.spec.ts`
- `clientWidth` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `clientX` — `tests/fake-document.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-gesture.test.ts`
- `clientY` — `tests/fake-document.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-gesture.test.ts`
- `clip` — `tests/e2e/panel-camera.ts`
- `clock` — in 4 files: `tests/`
- `closed` — `tests/e2e/panel-crawler.ts`
- `closing` — `tests/ui/panel-element.test.ts`
- `colour` — `tests/ui/panel-helper.test.ts`
- `combatantId` — in 22 files: `tests/`
- `combatantIds` — `tests/core/fight-statistics.test.ts`, `tests/tools/decoding-status.test.ts`
- `combatantNames` — `tests/core/turn-clock.test.ts`, `tests/repository/redacted-names.test.ts`
- `combatants` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`,
  `tests/recorded-fights.ts`
- `combatantsAfter` — in 5 files: `tests/`
- `combatantsBefore` — in 5 files: `tests/`
- `combatantsMaximum` — `tests/core/fight-session.test.ts`
- `compared` — `tests/core/health-witness.test.ts`
- `composed` — `tests/e2e/panel-card.spec.ts`
- `computed` — `tests/source-tree.ts`
- `concatTip` — `tests/game/game-tooltip.test.ts`
- `configFile` — `tests/e2e/build-once.ts`
- `console` — `tests/fake-window.ts`, `tests/runtime-world.ts`
- `constant` — `tests/repository/name-register.test.ts`
- `constants` — `tests/repository/declaration-order.test.ts`
- `constructor` — `tests/libs/unknown-value.test.ts`
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
- `cur` — `tests/game/game-battle.test.ts`, `tests/game/warrior-entries.test.ts`,
  `tests/game/warrior-snapshot.test.ts`
- `cut` — `tests/e2e/panel-marks.spec.ts`
- `cwd` — `tests/e2e/build-once.ts`
- `d` — `tests/game/game-hero.test.ts`, `tests/game/game-place.test.ts`,
  `tests/runtime/margometer-runtime.test.ts`
- `damageByNeitherEnd` — `tests/ui/panel-content.test.ts`
- `damageByNeitherEndByKind` — `tests/ui/panel-content.test.ts`
- `damageDealt` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`
- `damageDealtAbsorbedByDefence` — `tests/ui/panel-card.test.ts`
- `damageDealtByNobody` — `tests/runtime/panel-frame.test.ts`, `tests/ui/panel-content.test.ts`
- `damageDealtByOpponent` — `tests/ui/panel-content.test.ts`
- `damageDealtRaw` — `tests/ui/panel-card.test.ts`
- `damageDealtToNobody` — `tests/ui/panel-card.test.ts`
- `damageDealtToNobodyByKind` — `tests/core/fight-statistics.test.ts`
- `damagePrevented` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-card.test.ts`
- `damagePreventedByDefence` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-card.test.ts`
- `damageTaken` — `tests/core/fight-figures.test.ts`, `tests/core/fight-statistics.test.ts`,
  `tests/ui/panel-card.test.ts`
- `damageTakenAbsorbed` — `tests/core/fight-statistics.test.ts`
- `damageTakenAbsorbedByDefence` — `tests/core/fight-statistics.test.ts`,
  `tests/ui/panel-card.test.ts`
- `damageTakenApplied` — `tests/core/fight-statistics.test.ts`
- `damageTakenByNobody` — `tests/ui/panel-content.test.ts`
- `damageTakenFromNobody` — `tests/ui/panel-card.test.ts`
- `damageTakenRaw` — `tests/ui/panel-card.test.ts`
- `date` — `tests/repository/decisions.test.ts`, `tests/tools/game-readings.test.ts`
- `day` — in 5 files: `tests/`
- `dealt` — `tests/runtime/fight-file.test.ts`, `tests/tools/capture-intake.test.ts`
- `dealtByOpponent` — `tests/runtime/fight-file.test.ts`
- `dealtSign` — `tests/tools/frozen-files.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `declaration` — `tests/source-tree.ts`
- `declarations` — `tests/source-tree.ts`
- `declared` — in 10 files: `tests/`
- `deeper` — `tests/e2e/panel-crawler.ts`
- `defect` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-look.test.ts`
- `defects` — in 7 files: `tests/`
- `defence` — `tests/core/fight-decoder.test.ts`
- `defences` — `tests/ui/blow-vocabulary.test.ts`
- `denoland/setup-deno` — `tests/repository/workflows.test.ts`
- `depth` — `tests/repository/nesting-depth.test.ts`
- `description` — `tests/repository/documents.test.ts`
- `descriptionsRemoved` — `tests/tools/capture-intake.test.ts`
- `destroyed` — in 7 files: `tests/`
- `detail` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-element.test.ts`
- `develop` — `tests/ui/panel-look.test.ts`
- `dictionary` — `tests/fake-window.ts`, `tests/runtime-world.ts`
- `died` — `tests/core/health-witness.test.ts`
- `differences` — `tests/tools/develop-reports.test.ts`
- `dmg` — `tests/runtime/fight-file.test.ts`
- `document` — `tests/fake-window.ts`, `tests/repository/cited-paths.test.ts`,
  `tests/runtime-world.ts`
- `doesAddressCarryState` — `tests/tools/preview-page.test.ts`
- `doesCarryUnsizedShare` — `tests/core/health-witness.test.ts`
- `doesCover` — `tests/e2e/panel-helper.spec.ts`
- `doesFakeClock` — `tests/e2e/panel-boot.spec.ts`, `tests/e2e/panel-fixture.ts`
- `doesHover` — `tests/e2e/panel-camera.ts`, `tests/tools/panel-giving-way.test.ts`,
  `tests/tools/panel-shots.test.ts`
- `doesLoadTwice` — `tests/e2e/game-page.ts`, `tests/e2e/panel-boot.spec.ts`,
  `tests/e2e/panel-fixture.ts`
- `doesOpen` — `tests/ui/panel-card.test.ts`
- `doesOpenPair` — `tests/ui/panel-element.test.ts`
- `doesOpenPart` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `doesShoot` — `tests/tools/panel-giving-way.test.ts`
- `doesSpanPoolRaise` — `tests/core/health-witness.test.ts`
- `doesStartFromEmpty` — `tests/tools/preview-page.test.ts`
- `doesTakeValue` — `tests/core/protocol-key.test.ts`
- `doesThrowOnFind` — `tests/game/game-tooltip.test.ts`
- `download` — `tests/fake-window.ts`, `tests/game/browser-file.test.ts`
- `downloads` — `tests/fake-window.ts`, `tests/game/browser-file.test.ts`
- `drawn` — in 5 files: `tests/`
- `drill` — `tests/ui/panel-element.test.ts`
- `droppedCalls` — `tests/runtime/fight-file.test.ts`
- `droppedOpenedAt` — `tests/runtime/shelf.test.ts`
- `edge` — `tests/tools/preview-state.test.ts`, `tests/ui/card-window.test.ts`,
  `tests/ui/panel-drag.test.ts`
- `effect` — in 7 files: `tests/`
- `effects` — `tests/tools/frozen-files.test.ts`
- `either` — `tests/verb-purities.ts`
- `element` — in 11 files: `tests/`
- `elements` — `tests/repository/purity.test.ts`, `tests/source-tree.ts`
- `end` — in 6 files: `tests/`
- `endBattle` — in 4 files: `tests/`
- `endedAtOrdinal` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `energy` — `tests/game/fight-capture.test.ts`, `tests/game/warrior-snapshot.test.ts`
- `engine` — in 4 files: `tests/`
- `entries` — `tests/core/aura-standing.test.ts`
- `entry` — `tests/repository/changelog.test.ts`, `tests/tools/preview-page.test.ts`,
  `tests/tools/preview-state.test.ts`
- `entryIndex` — `tests/tools/preview-page.test.ts`
- `events` — `tests/core/aura-standing.test.ts`, `tests/recorded-fights.ts`,
  `tests/tools/decoding-status.test.ts`
- `eventsMaximum` — `tests/core/fight-session.test.ts`
- `exact` — `tests/tools/turn-count.test.ts`
- `executablePath` — `tests/e2e/panel-camera.ts`
- `expression` — `tests/source-tree.ts`
- `exts` — `tests/source-tree.ts`
- `f` — `tests/libs/unknown-value.test.ts`
- `failure` — `tests/repository/name-register.test.ts`, `tests/runtime/defect-ledger.test.ts`
- `failures` — `tests/runtime/engine-search.test.ts`, `tests/ui/full-cast-bound.test.ts`,
  `tests/ui/level-drawn.test.ts`
- `faults` — `tests/e2e/panel-crawler.ts`
- `faultsInjected` — `tests/simulation.ts`
- `fed` — `tests/e2e/game-page.ts`, `tests/tools/preview-state.test.ts`
- `fedThrough` — in 9 files: `tests/`
- `fetchedAt` — `tests/tools/game-client-source.test.ts`, `tests/tools/game-readings.test.ts`,
  `tests/tools/help-article.test.ts`
- `field` — `tests/game/payload-envelope.test.ts`, `tests/repository/name-register.test.ts`
- `fight` — `tests/tools/preview-server.test.ts`
- `fightName` — `tests/tools/preview-page.test.ts`
- `fightPlace` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`
- `fights` — in 9 files: `tests/`
- `figure` — in 5 files: `tests/`
- `figures` — `tests/runtime/panel-frame.test.ts`, `tests/ui/level-drawn.test.ts`
- `file` — `tests/runtime-world.ts`, `tests/runtime/margometer-runtime.test.ts`
- `files` — `tests/repository/name-register.test.ts`
- `fill` — `tests/ui/panel-element.test.ts`
- `find` — `tests/game/game-tooltip.test.ts`
- `fire` — `tests/game/browser-interval.test.ts`, `tests/runtime/margometer-runtime.test.ts`
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
- `frozen` — `tests/tools/game-readings.test.ts`
- `function` — `tests/repository/name-register.test.ts`
- `functions` — `tests/repository/declaration-order.test.ts`
- `game` — `tests/fake-window.ts`, `tests/simulation.ts`
- `gameBattle` — `tests/runtime/panel-frame.test.ts`
- `gameBuild` — in 5 files: `tests/`
- `getAttribute` — `tests/ui/panel-intent.test.ts`
- `getDate` — `tests/game/browser-clock.test.ts`
- `getHours` — `tests/game/browser-clock.test.ts`
- `getItem` — `tests/game/browser-store.test.ts`, `tests/runtime/settings.test.ts`
- `getMinutes` — `tests/game/browser-clock.test.ts`
- `getMonth` — `tests/game/browser-clock.test.ts`
- `getShelf` — `tests/runtime-world.ts`, `tests/runtime/shelf-keeper.test.ts`
- `given` — `tests/e2e/panel-card.spec.ts`
- `glued` — `tests/core/fight-decoder.test.ts`
- `grammar-refused` — `tests/core/aura-standing.test.ts`, `tests/core/fight-session.test.ts`
- `granted` — `tests/tools/turn-count.test.ts`
- `groupCost` — `tests/e2e/panel-card.spec.ts`
- `groups` — `tests/drawn-card.ts`, `tests/tools/card-height.test.ts`,
  `tests/ui/card-window.test.ts`
- `half` — `tests/core/protocol-key.test.ts`
- `halfNamed` — `tests/ui/panel-element.test.ts`
- `handle` — `tests/ui/card-window.test.ts`
- `hasChoiceRefused` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `hasElement` — `tests/game/game-tooltip.test.ts`
- `hasFightToSave` — `tests/panel-view.ts`, `tests/shown-screen.ts`
- `hasFiguresDisagreed` — `tests/ui/panel-element.test.ts`
- `hasInvariantBroken` — `tests/simulation.ts`
- `hasJoinedInProgress` — `tests/core/aura-standing.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-words.test.ts`
- `hasMethods` — `tests/game/game-tooltip.test.ts`
- `hasMoved` — `tests/tools/game-readings.test.ts`
- `hasSnapshot` — `tests/recorded-fights.ts`, `tests/tools/decoding-status.test.ts`
- `hasSpentLastheal` — `tests/ui/panel-words.test.ts`
- `hasStoreMadeRoom` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `hasStoreRefused` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `hasThrownIntoGame` — `tests/simulation.ts`
- `hash` — `tests/tools/preview-state.test.ts`
- `heading` — `tests/ui/panel-look.test.ts`
- `headings` — `tests/drawn-card.ts`
- `heal` — `tests/core/last-heal-rule.test.ts`
- `heals` — `tests/core/legendary-standing.test.ts`
- `health` — `tests/recorded-fights.ts`
- `healthGiven` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`
- `healthGivenByNobody` — `tests/ui/panel-content.test.ts`
- `healthGivenByReceiver` — `tests/ui/panel-content.test.ts`
- `healthMaximum` — in 17 files: `tests/`
- `healthNow` — `tests/recorded-fights.ts`
- `healthPercent` — in 8 files: `tests/`
- `healthReadings` — `tests/recorded-fights.ts`
- `healthRestored` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-card.test.ts`
- `healthRestoredByNobody` — `tests/core/fight-statistics.test.ts`, `tests/ui/panel-card.test.ts`
- `healthRestoredByNobodyByKey` — `tests/core/fight-statistics.test.ts`
- `healthRestoredToNobody` — `tests/ui/panel-content.test.ts`
- `height` — in 17 files: `tests/`
- `heightMaximum` — `tests/ui/panel-drag.test.ts`
- `heightMinimum` — `tests/ui/panel-drag.test.ts`
- `held` — in 4 files: `tests/`
- `heldAtOnce` — `tests/tools/aura-standing.test.ts`
- `heldDate` — `tests/tools/game-readings.test.ts`
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
- `hostname` — `tests/fake-window.ts`, `tests/game/browser-surroundings.test.ts`
- `hour` — in 5 files: `tests/`
- `hp` — in 5 files: `tests/`
- `href` — `tests/fake-window.ts`, `tests/game/browser-file.test.ts`
- `html` — `tests/e2e/panel-camera.ts`
- `id` — in 29 files: `tests/`
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
- `install` — `tests/tools/preview-page.test.ts`
- `interfaceAt` — `tests/e2e/panel-layer.spec.ts`
- `interfaceLayer` — `tests/e2e/panel-layer.spec.ts`
- `interval` — `tests/runtime-world.ts`, `tests/runtime/margometer-runtime.test.ts`
- `into` — `tests/tools/panel-giving-way.test.ts`
- `introduction` — `tests/tools/preview-page.test.ts`
- `isApart` — `tests/ui/level-drawn.test.ts`
- `isCases` — `tests/tools/turn-count.test.ts`
- `isChainBroken` — `tests/core/last-heal-rule.test.ts`
- `isChosen` — `tests/ui/panel-element.test.ts`, `tests/ui/shelf-bound.test.ts`
- `isDirectory` — `tests/source-tree.ts`
- `isEnd` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`
- `isEverySlotPinned` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`
- `isExported` — `tests/repository/declaration-order.test.ts`
- `isFabricated` — `tests/repository/fabricated-fights.test.ts`
- `isFightUnread` — `tests/panel-view.ts`
- `isFile` — `tests/repository/cited-paths.test.ts`
- `isFunction` — `tests/repository/declaration-order.test.ts`
- `isGrip` — `tests/e2e/panel-probe.ts`
- `isInit` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`,
  `tests/game/payload-envelope.test.ts`
- `isKeys` — `tests/tools/turn-reading.test.ts`
- `isLive` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `isMeterCollapsed` — `tests/panel-view.ts`, `tests/shown-screen.ts`,
  `tests/ui/panel-element.test.ts`
- `isOnAuto` — in 5 files: `tests/`
- `isOnShelf` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `isOpening` — `tests/game/fight-capture.test.ts`
- `isOver` — in 4 files: `tests/`
- `isPastCeiling` — `tests/game/fight-capture.test.ts`
- `isPinnable` — `tests/ui/panel-element.test.ts`, `tests/ui/shelf-bound.test.ts`
- `isPinned` — in 6 files: `tests/`
- `isPlayer` — `tests/repository/captured-fight-register.test.ts`
- `isRowNarrower` — `tests/ui/panel-card.test.ts`
- `isSectionOpened` — `tests/ui/level-drawn.test.ts`
- `isSilent` — `tests/tools/preview-page.test.ts`
- `isStrong` — `tests/drawn-card.ts`, `tests/ui/card-window.test.ts`
- `isSub` — `tests/drawn-card.ts`
- `isTruncated` — `tests/runtime/fight-file.test.ts`
- `keeper` — `tests/runtime/live-fight.test.ts`, `tests/runtime/panel-frame.test.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `kept` — `tests/game/fight-capture.test.ts`
- `keptUnread` — `tests/panel-view.ts`
- `key` — in 10 files: `tests/`
- `keyByStatusBit` — `tests/core/carried-figure.test.ts`
- `keys` — `tests/core/skill-announcement-rule.test.ts`, `tests/repository/name-register.test.ts`,
  `tests/tools/aura-lifetime.test.ts`
- `kind` — in 26 files: `tests/`
- `kinds` — `tests/e2e/panel-crawler.ts`
- `kindsSaid` — `tests/simulation.ts`
- `komunikaty` — `tests/tools/capture-intake.test.ts`
- `l` — `tests/libs/unknown-value.test.ts`
- `label` — `tests/drawn-card.ts`, `tests/tools/preview-page.test.ts`,
  `tests/ui/card-window.test.ts`
- `lacking` — `tests/game/game-tooltip.test.ts`
- `ladunek` — `tests/tools/capture-intake.test.ts`
- `language` — `tests/e2e/game-page.ts`, `tests/tools/preview-page.test.ts`
- `lastActorId` — `tests/core/turn-clock.test.ts`
- `lastCall` — `tests/e2e/game-page.ts`
- `lastShout` — `tests/core/aura-standing.test.ts`
- `leaves` — `tests/e2e/panel-crawler.ts`
- `ledger` — `tests/runtime/defect-ledger.test.ts`
- `left` — in 8 files: `tests/`
- `legendaryStandings` — `tests/core/aura-standing.test.ts`
- `length` — in 16 files: `tests/`
- `level` — in 19 files: `tests/`
- `lifted` — `tests/tools/game-readings.test.ts`
- `lightings` — `tests/tools/aura-lifetime.test.ts`
- `line` — `tests/tools/protocol-key-shape.test.ts`
- `lineHeight` — `tests/repository/design-tokens.test.ts`
- `lineRight` — `tests/e2e/panel-card.spec.ts`
- `lines` — in 9 files: `tests/`
- `lint` — `tests/source-tree.ts`
- `listName` — in 4 files: `tests/`
- `listed` — `tests/libs/unknown-value.test.ts`
- `live` — `tests/runtime/live-fight.test.ts`, `tests/runtime/panel-frame.test.ts`
- `local` — `tests/repository/name-register.test.ts`, `tests/source-tree.ts`
- `localStorage` — `tests/fake-window.ts`, `tests/tools/preview-page.test.ts`
- `location` — `tests/fake-window.ts`, `tests/game/browser-surroundings.test.ts`,
  `tests/tools/preview-state.test.ts`
- `longCast` — `tests/e2e/panel-helper.spec.ts`
- `longDrawn` — `tests/e2e/panel-helper.spec.ts`
- `longWanted` — `tests/e2e/panel-helper.spec.ts`
- `lost` — `tests/tools/turn-count.test.ts`, `tests/ui/panel-words.test.ts`
- `lvl` — in 4 files: `tests/`
- `m` — in 10 files: `tests/`
- `mana` — `tests/game/fight-capture.test.ts`, `tests/game/warrior-snapshot.test.ts`
- `map` — `tests/game/game-place.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `mapName` — in 5 files: `tests/`
- `margometerE2e` — `tests/tools/preview-state.test.ts`
- `mark` — `tests/e2e/panel-camera.ts`, `tests/tools/panel-giving-way.test.ts`,
  `tests/tools/panel-shots.test.ts`
- `marker` — `tests/tools/frozen-files.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `markerAt` — `tests/tools/frozen-files.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `markerLength` — `tests/tools/frozen-files.test.ts`, `tests/tools/protocol-key-table.test.ts`
- `marks` — `tests/e2e/panel-marks.spec.ts`
- `material` — in 6 files: `tests/`
- `max` — in 5 files: `tests/`
- `maxHeightShare` — `tests/repository/design-tokens.test.ts`
- `maximum` — `tests/game/payload-envelope.test.ts`, `tests/game/warrior-snapshot.test.ts`
- `message` — in 4 files: `tests/`
- `messageActor` — `tests/repository/protocol-keys.test.ts`
- `messages` — in 9 files: `tests/`
- `messagesLost` — `tests/core/aura-standing.test.ts`, `tests/runtime/fight-file.test.ts`,
  `tests/ui/panel-content.test.ts`
- `messagesRead` — `tests/core/aura-standing.test.ts`, `tests/ui/panel-content.test.ts`
- `messagesStated` — `tests/core/fight-figures.test.ts`, `tests/core/fight-session.test.ts`
- `meter` — `tests/ui/panel-drag.test.ts`, `tests/ui/panel-element.test.ts`
- `meterPlacement` — in 4 files: `tests/`
- `meterWidth` — `tests/repository/design-tokens.test.ts`
- `method` — `tests/libs/unknown-value.test.ts`
- `metric` — in 8 files: `tests/`
- `mi` — `tests/game/payload-envelope.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `midStrike` — `tests/core/granted-blow-rule.test.ts`
- `minute` — in 5 files: `tests/`
- `missing` — `tests/game/game-dictionary.test.ts`
- `momentsFromOne` — `tests/tools/aura-standing.test.ts`
- `momentsPastTwo` — `tests/tools/aura-standing.test.ts`
- `momentsWithTwo` — `tests/tools/aura-standing.test.ts`
- `month` — in 5 files: `tests/`
- `more` — `tests/game/fight-capture.test.ts`
- `most` — `tests/game/fight-capture.test.ts`
- `mount` — `tests/fake-window.ts`
- `moved` — `tests/core/fight-decoder.test.ts`, `tests/core/health-witness.test.ts`,
  `tests/ui/panel-look.test.ts`
- `myteam` — `tests/game/payload-envelope.test.ts`, `tests/runtime/margometer-runtime.test.ts`
- `n` — `tests/game/game-battle.test.ts`, `tests/libs/unknown-value.test.ts`
- `name` — in 46 files: `tests/`
- `named` — `tests/e2e/panel-save.spec.ts`, `tests/libs/unknown-value.test.ts`
- `namedAtOnce` — `tests/tools/aura-standing.test.ts`
- `namesSubstituted` — `tests/tools/capture-intake.test.ts`
- `navigator` — `tests/fake-window.ts`, `tests/game/browser-surroundings.test.ts`
- `needs` — `tests/tools/preview-page.test.ts`
- `needsLine` — `tests/tools/preview-page.test.ts`
- `nested` — `tests/libs/unknown-value.test.ts`
- `nick` — `tests/game/game-hero.test.ts`
- `no-parameter` — `tests/core/aura-standing.test.ts`, `tests/core/fight-session.test.ts`
- `noKind` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
- `nobody` — `tests/repository/protocol-keys.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/panel-look.test.ts`
- `node` — `tests/repository/nesting-depth.test.ts`
- `none` — `tests/core/granted-blow-rule.test.ts`, `tests/verb-purities.ts`
- `notes` — `tests/drawn-card.ts`, `tests/tools/card-height.test.ts`
- `npc` — `tests/game/warrior-snapshot.test.ts`, `tests/tools/capture-intake.test.ts`
- `nr` — `tests/tools/capture-intake.test.ts`
- `number` — `tests/repository/decisions.test.ts`, `tests/repository/documents.test.ts`
- `object` — `tests/source-tree.ts`
- `occurrences` — `tests/tools/protocol-key-shape.test.ts`
- `offer` — `tests/tools/preview-page.test.ts`
- `offered` — `tests/fake-window.ts`
- `onBeforeCall` — `tests/game/game-battle.test.ts`
- `onPageCall` — `tests/fake-window.ts`, `tests/simulation.ts`
- `onPayload` — `tests/game/game-battle.test.ts`
- `onto` — `tests/e2e/panel-probe.ts`
- `openPart` — `tests/runtime/screen-intent.test.ts`
- `openUnnamedEnd` — `tests/runtime/opened-readings.test.ts`, `tests/runtime/screen-intent.test.ts`
- `opened` — in 6 files: `tests/`
- `openedAt` — in 7 files: `tests/`
- `openedCombatantId` — `tests/runtime/opened-readings.test.ts`,
  `tests/runtime/screen-intent.test.ts`
- `operator` — `tests/source-tree.ts`
- `opposing` — `tests/ui/panel-element.test.ts`
- `option` — `tests/e2e/panel-fixture.ts`
- `optional` — `tests/source-tree.ts`
- `options` — in 4 files: `tests/`
- `ordinal` — in 4 files: `tests/`
- `originalId` — `tests/game/warrior-snapshot.test.ts`
- `other` — `tests/game/fight-capture.test.ts`
- `others` — `tests/e2e/panel-scroll.spec.ts`, `tests/runtime/engine-search.test.ts`
- `ours` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-look.test.ts`
- `outcome` — in 4 files: `tests/`
- `outcomes` — `tests/core/fight-decoder.test.ts`
- `outside` — `tests/repository/redacted-names.test.ts`
- `outsideRanking` — `tests/ui/panel-element.test.ts`
- `over` — `tests/tools/preview-state.test.ts`, `tests/tools/turn-count.test.ts`
- `overflow` — `tests/e2e/panel-size.spec.ts`
- `ownTurnsCommon` — `tests/tools/aura-lifetime.test.ts`
- `ownTurnsCommonRuns` — `tests/tools/aura-lifetime.test.ts`
- `ownTurnsLongest` — `tests/tools/aura-lifetime.test.ts`
- `page` — in 5 files: `tests/`
- `pair` — `tests/shown-screen.ts`, `tests/ui/level-drawn.test.ts`, `tests/ui/panel-element.test.ts`
- `pairCombatantId` — `tests/runtime/screen-intent.test.ts`
- `paired` — `tests/core/last-heal-rule.test.ts`
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
- `past` — `tests/core/last-heal-rule.test.ts`, `tests/game/fight-capture.test.ts`
- `path` — in 15 files: `tests/`
- `paths` — `tests/tools/game-readings.test.ts`, `tests/tools/turn-count.test.ts`,
  `tests/tools/turn-reading.test.ts`
- `pattern` — `tests/source-tree.ts`
- `pause` — `tests/tools/preview-page.test.ts`
- `payload` — in 9 files: `tests/`
- `payloads` — in 6 files: `tests/`
- `payloadsApplied` — `tests/core/aura-standing.test.ts`, `tests/core/fight-figures.test.ts`,
  `tests/runtime/fight-file.test.ts`
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
- `pointerId` — `tests/fake-document.ts`
- `pointersHeld` — `tests/fake-document.ts`
- `pointersReleased` — `tests/fake-document.ts`
- `poll` — `tests/game/fight-capture.test.ts`
- `port` — `tests/tools/panel-giving-way.test.ts`, `tests/tools/preview-server.test.ts`
- `ports` — `tests/runtime-world.ts`
- `position` — in 5 files: `tests/`
- `prefix` — `tests/repository/documents.test.ts`, `tests/tools/build-userscript.test.ts`,
  `tests/ui/panel-look.test.ts`
- `pressed` — `tests/ui/helper-window.test.ts`
- `presses` — `tests/e2e/panel-crawler.ts`
- `prevented` — in 6 files: `tests/`
- `procs` — in 7 files: `tests/`
- `procsWhenStriking` — `tests/ui/panel-card.test.ts`
- `procsWhenStruck` — `tests/ui/panel-card.test.ts`
- `prof` — in 4 files: `tests/`
- `profession` — in 18 files: `tests/`
- `promised` — `tests/e2e/panel-level.spec.ts`, `tests/ui/level-drawn.test.ts`
- `properties` — `tests/repository/purity.test.ts`, `tests/source-tree.ts`
- `property` — `tests/source-tree.ts`
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
- `raw` — in 6 files: `tests/`
- `reach` — `tests/core/carried-figure.test.ts`, `tests/tools/aura-standing.test.ts`
- `read` — `tests/e2e/panel-save.spec.ts`, `tests/repository/redacted-names.test.ts`
- `readDate` — `tests/tools/game-readings.test.ts`
- `readFiguresSaid` — `tests/runtime/panel-frame.test.ts`
- `readViewport` — `tests/ui/panel-element.test.ts`
- `reader` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `readerId` — `tests/runtime/panel-frame.test.ts`, `tests/runtime/shelf-keeper.test.ts`,
  `tests/runtime/shelf.test.ts`
- `readerSide` — in 7 files: `tests/`
- `reading` — `tests/tools/decoding-status.test.ts`, `tests/ui/panel-element.test.ts`
- `recording` — in 7 files: `tests/`
- `recordings` — `tests/tools/aura-standing.test.ts`
- `recursive` — `tests/tools/build-userscript.test.ts`, `tests/tools/preview-server.test.ts`,
  `tests/ui/panel-look.test.ts`
- `refusals` — `tests/runtime/engine-search.test.ts`
- `regex` — `tests/source-tree.ts`
- `region` — `tests/runtime/defect-ledger.test.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/view-failure.test.ts`
- `register` — `tests/ui/card-window.test.ts`
- `registries` — `tests/rebuilding-battle.ts`
- `registry` — `tests/game/game-tooltip.test.ts`
- `relatedTarget` — `tests/e2e/panel-card.spec.ts`, `tests/fake-document.ts`
- `removeItem` — `tests/game/browser-store.test.ts`, `tests/runtime/settings.test.ts`
- `removed` — `tests/tools/game-readings.test.ts`
- `replaced` — `tests/game/game-tooltip.test.ts`
- `replacedBy` — `tests/fake-document.ts`
- `replay` — `tests/tools/fabricated-fight.test.ts`, `tests/ui/level-drawn.test.ts`
- `replays` — `tests/ui/panel-content.test.ts`
- `report` — `tests/runtime/engine-search.test.ts`, `tests/tools/capture-intake.test.ts`
- `requestAnimationFrame` — `tests/repository/handed-callbacks.test.ts`
- `resolved` — `tests/core/fight-decoder.test.ts`
- `rest` — `tests/ui/panel-content.test.ts`, `tests/ui/panel-element.test.ts`
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
- `rows` — in 4 files: `tests/`
- `rowsVisibleCount` — `tests/ui/panel-element.test.ts`
- `rules` — `tests/source-tree.ts`
- `rung` — `tests/tools/drill-report.test.ts`
- `runtime` — `tests/runtime-world.ts`
- `said` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-fixture.ts`,
  `tests/e2e/panel-helper.spec.ts`
- `saidByKey` — `tests/ui/level-drawn.test.ts`
- `sameTop` — `tests/e2e/panel-helper.spec.ts`
- `saved` — `tests/e2e/game-page.ts`, `tests/runtime-world.ts`
- `says` — `tests/tools/game-readings.test.ts`
- `scope` — `tests/e2e/panel-fixture.ts`
- `screen` — in 4 files: `tests/`
- `screens` — `tests/e2e/panel-crawler.ts`
- `script` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-fixture.ts`
- `scriptDirectory` — `tests/e2e/game-page.ts`, `tests/tools/preview-page.test.ts`
- `scriptName` — `tests/e2e/panel-camera.ts`
- `scripts` — `tests/fake-window.ts`, `tests/repository/name-register.test.ts`
- `scrollHeight` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `scrollTop` — `tests/fake-document.ts`
- `scrollWidth` — `tests/e2e/panel-card.spec.ts`, `tests/e2e/panel-helper.spec.ts`
- `second` — `tests/e2e/panel-crawler.ts`
- `section` — `tests/repository/changelog.test.ts`, `tests/repository/declaration-order.test.ts`
- `seed` — `tests/simulation.test.ts`, `tests/simulation.ts`
- `selector` — `tests/e2e/panel-layer.spec.ts`, `tests/e2e/panel-probe.ts`, `tests/style-sheet.ts`
- `sentence` — `tests/tools/preview-page.test.ts`
- `session` — `tests/fake-window.ts`, `tests/runtime/panel-frame.test.ts`
- `sessionOptions` — `tests/runtime-world.ts`, `tests/runtime/live-fight.test.ts`,
  `tests/runtime/shelf-keeper.test.ts`
- `sessionStorage` — `tests/fake-window.ts`
- `setInterval` — `tests/repository/handed-callbacks.test.ts`, `tests/runtime/engine-search.test.ts`
- `setItem` — `tests/game/browser-store.test.ts`, `tests/runtime/settings.test.ts`
- `setTimeout` — `tests/repository/handed-callbacks.test.ts`
- `settings` — in 4 files: `tests/`
- `shadow` — `tests/fake-document.ts`
- `shape` — `tests/game/fight-capture.test.ts`, `tests/tools/protocol-key-shape.test.ts`
- `share` — `tests/core/absorption-destruction-rule.test.ts`
- `shareText` — `tests/ui/panel-element.test.ts`, `tests/ui/share-column.test.ts`
- `shelf` — in 4 files: `tests/`
- `shelfAnswers` — `tests/shown-screen.ts`
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
- `sideRelation` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-helper.test.ts`
- `sides` — `tests/ui/panel-element.test.ts`
- `sightings` — `tests/repository/name-register.test.ts`
- `sinceUnsized` — `tests/core/last-heal-rule.test.ts`
- `size` — in 4 files: `tests/`
- `sizes` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `skillId` — in 9 files: `tests/`
- `skillName` — in 12 files: `tests/`
- `skillUses` — `tests/ui/panel-card.test.ts`
- `skills` — `tests/tools/capture-intake.test.ts`
- `snapshotBefore` — `tests/runtime/panel-frame.test.ts`
- `source` — in 7 files: `tests/`
- `sourceCode` — `tests/source-tree.ts`
- `sourcesAtOnce` — `tests/tools/aura-standing.test.ts`
- `spaceBeforeTile` — `tests/e2e/panel-card.spec.ts`
- `spaceHalf` — `tests/repository/design-tokens.test.ts`
- `spaceRegion` — `tests/repository/design-tokens.test.ts`
- `spaceSmall` — `tests/repository/design-tokens.test.ts`
- `spaceWide` — `tests/repository/design-tokens.test.ts`
- `specifiers` — `tests/source-tree.ts`
- `spent` — `tests/core/legendary-standing.test.ts`
- `spill` — `tests/e2e/panel-options.spec.ts`
- `src` — `tests/fake-window.ts`, `tests/game/game-build.test.ts`, `tests/userscript-entry.test.ts`
- `stale` — `tests/runtime/live-fight.test.ts`
- `standing` — `tests/core/carried-status.test.ts`
- `standingAt` — `tests/e2e/panel-helper.spec.ts`
- `standingAtOnce` — `tests/tools/aura-standing.test.ts`
- `standings` — `tests/runtime/panel-frame.test.ts`
- `start` — `tests/tools/preview-page.test.ts`
- `started` — `tests/game/browser-interval.test.ts`
- `starts` — `tests/runtime/engine-search.test.ts`
- `state` — `tests/game/fight-capture.test.ts`, `tests/ui/helper-window.test.ts`,
  `tests/ui/panel-helper.test.ts`
- `stated` — `tests/drawn-card.ts`, `tests/ui/card-window.test.ts`, `tests/ui/level-drawn.test.ts`
- `statedSkills` — `tests/runtime/margometer-runtime.test.ts`
- `statement` — `tests/ui/helper-window.test.ts`, `tests/ui/panel-helper.test.ts`
- `statistic` — `tests/core/fight-decoder.test.ts`
- `statistics` — in 7 files: `tests/`
- `statisticsDestroyed` — `tests/ui/panel-card.test.ts`
- `status` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-fixture.ts`,
  `tests/repository/decisions.test.ts`
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
- `storage` — `tests/ui/panel-element.test.ts`
- `store` — `tests/tools/preview-page.test.ts`, `tests/tools/preview-state.test.ts`
- `storeRead` — `tests/fake-window.ts`
- `storeRefusalPercent` — `tests/simulation.test.ts`, `tests/simulation.ts`
- `storeWrite` — `tests/fake-window.ts`
- `stored` — `tests/fake-window.ts`
- `strings` — `tests/repository/name-register.test.ts`
- `strong` — `tests/verb-purities.ts`
- `struck` — `tests/game/recorded-session.test.ts`
- `style` — `tests/runtime/margometer-runtime.test.ts`
- `subjectsOwn` — `tests/repository/protocol-keys.test.ts`
- `subtitle` — `tests/drawn-card.ts`, `tests/ui/card-window.test.ts`
- `suffix` — `tests/tools/recorded-material.test.ts`
- `summary` — `tests/e2e/panel-size.spec.ts`
- `superClass` — `tests/source-tree.ts`
- `super_cast` — `tests/game/warrior-entries.test.ts`
- `supersedes` — `tests/repository/decisions.test.ts`
- `surface` — `tests/repository/design-tokens.test.ts`
- `surfaceRaised` — `tests/repository/design-tokens.test.ts`
- `surroundings` — `tests/runtime-world.ts`
- `suspect` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-look.test.ts`
- `suspicions` — `tests/ui/panel-element.test.ts`
- `swiat` — `tests/tools/capture-intake.test.ts`
- `table` — `tests/core/granted-blow-rule.test.ts`
- `tables` — in 21 files: `tests/`
- `tag` — `tests/fake-document.ts`
- `taken` — `tests/tools/turn-count.test.ts`
- `target` — `tests/fake-document.ts`, `tests/ui/panel-gesture.test.ts`
- `targetHealthPercent` — in 7 files: `tests/`
- `targetId` — in 7 files: `tests/`
- `targetName` — `tests/core/legendary-standing.test.ts`, `tests/repository/redacted-names.test.ts`
- `tasks` — `tests/repository/name-register.test.ts`
- `team` — in 7 files: `tests/`
- `text` — in 19 files: `tests/`
- `textContent` — `tests/fake-document.ts`
- `textLength` — `tests/tools/help-article.test.ts`
- `textPath` — `tests/tools/help-article.test.ts`
- `textQuiet` — `tests/repository/design-tokens.test.ts`
- `texts` — `tests/tools/game-readings.test.ts`
- `theGame` — `tests/game/game-battle.test.ts`
- `theirs` — `tests/repository/design-tokens.test.ts`, `tests/ui/panel-look.test.ts`
- `thisArg` — `tests/game/game-battle.test.ts`
- `tick` — `tests/runtime/engine-search.test.ts`
- `tile` — `tests/e2e/panel-card.spec.ts`, `tests/ui/panel-element.test.ts`
- `tileRight` — `tests/e2e/panel-card.spec.ts`
- `timer` — `tests/fake-window.ts`
- `timers` — `tests/game/browser-file.test.ts`, `tests/game/browser-interval.test.ts`,
  `tests/runtime/engine-search.test.ts`
- `title` — `tests/e2e/game-page.ts`, `tests/repository/decisions.test.ts`,
  `tests/tools/preview-page.test.ts`
- `to` — `tests/tools/turn-reading.test.ts`
- `together` — `tests/tools/aura-lifetime.test.ts`
- `told` — in 4 files: `tests/`
- `tone` — `tests/ui/card-window.test.ts`
- `tooltip` — in 4 files: `tests/`
- `tooltips` — `tests/tools/preview-page.test.ts`
- `top` — in 8 files: `tests/`
- `total` — `tests/ui/panel-element.test.ts`, `tests/ui/share-column.test.ts`
- `total_turns` — `tests/game/warrior-entries.test.ts`
- `totals` — `tests/runtime/panel-frame.test.ts`, `tests/ui/panel-content.test.ts`
- `track` — `tests/repository/design-tokens.test.ts`
- `tracked` — `tests/repository/name-register.test.ts`
- `translate` — `tests/panel-view.ts`, `tests/ui/panel-card.test.ts`
- `turn` — `tests/game/warrior-entries.test.ts`
- `turnHolderId` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`
- `turnStatement` — `tests/core/aura-standing.test.ts`, `tests/core/fight-figures.test.ts`,
  `tests/core/fight-session.test.ts`
- `turns` — in 6 files: `tests/`
- `turnsAtCastByCombatantId` — `tests/core/carried-figure.test.ts`
- `turnsByCombatantId` — `tests/core/aura-standing.test.ts`, `tests/core/carried-figure.test.ts`
- `turnsElapsed` — in 9 files: `tests/`
- `turnsLost` — `tests/core/fight-decoder.test.ts`, `tests/ui/panel-card.test.ts`
- `turnsStated` — in 8 files: `tests/`
- `turnsTaken` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-words.test.ts`
- `turns_warriors` — `tests/game/payload-envelope.test.ts`
- `type` — `tests/game/browser-file.test.ts`, `tests/repository/name-register.test.ts`,
  `tests/source-tree.ts`
- `typeAnnotation` — `tests/source-tree.ts`
- `typeName` — `tests/source-tree.ts`
- `typeParameter` — `tests/repository/name-register.test.ts`
- `typeStep` — `tests/panel-view.ts`, `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`
- `types` — `tests/repository/declaration-order.test.ts`, `tests/source-tree.ts`
- `under` — `tests/tools/turn-count.test.ts`
- `undrawn` — `tests/runtime/panel-frame.test.ts`
- `unexplained` — `tests/core/health-witness.test.ts`
- `unhandledKinds` — `tests/simulation.ts`
- `unknown` — `tests/repository/browser-suite-keys.test.ts`
- `unknown-key` — `tests/core/aura-standing.test.ts`, `tests/core/fight-session.test.ts`
- `unnamed` — `tests/shown-screen.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-element.test.ts`
- `unnamedCut` — `tests/shown-screen.ts`, `tests/ui/level-drawn.test.ts`,
  `tests/ui/panel-element.test.ts`
- `unplaced` — `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`,
  `tests/ui/shelf-bound.test.ts`
- `unread` — `tests/core/aura-standing.test.ts`, `tests/core/fight-decoder.test.ts`,
  `tests/recorded-fights.ts`
- `unreadCause` — `tests/core/fight-statistics.test.ts`, `tests/tools/decoding-status.test.ts`
- `unreadKeys` — `tests/core/fight-statistics.test.ts`, `tests/tools/decoding-status.test.ts`
- `unreadMessagesGrammarRefused` — `tests/ui/panel-content.test.ts`
- `unreadMessagesNoParameter` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`
- `unreadMessagesUnknownKey` — `tests/ui/panel-card.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `unsized` — `tests/core/fight-decoder.test.ts`
- `untold` — `tests/tools/turn-count.test.ts`
- `updateData` — `tests/game/game-battle.test.ts`, `tests/rebuilding-battle.ts`
- `updates` — `tests/recorded-fights.ts`, `tests/runtime/shelf.test.ts`
- `url` — `tests/tools/help-article.test.ts`
- `userAgent` — `tests/fake-window.ts`, `tests/game/browser-surroundings.test.ts`,
  `tests/runtime/fight-file.test.ts`
- `userscriptName` — `tests/e2e/game-page.ts`, `tests/e2e/panel-fixture.ts`
- `uses` — `tests/runtime/fight-file.test.ts`, `tests/ui/panel-content.test.ts`,
  `tests/ui/panel-element.test.ts`
- `value` — in 10 files: `tests/`
- `values` — `tests/tools/skill-table.test.ts`
- `vanished` — `tests/core/health-witness.test.ts`
- `verdict` — in 5 files: `tests/`
- `version` — `tests/e2e/panel-fixture.ts`, `tests/runtime/margometer-runtime.test.ts`,
  `tests/runtime/shelf.test.ts`
- `versionLine` — `tests/tools/preview-page.test.ts`
- `view` — `tests/recorded-fights.ts`, `tests/runtime/panel-frame.test.ts`,
  `tests/tools/decoding-status.test.ts`
- `viewport` — `tests/e2e/panel-camera.ts`, `tests/e2e/panel-card.spec.ts`
- `vocabularies` — `tests/repository/name-register.test.ts`
- `w` — in 8 files: `tests/`
- `walk` — `tests/source-tree.ts`
- `warriors` — `tests/game/warrior-snapshot.test.ts`
- `warriorsList` — in 6 files: `tests/`
- `wasTurnLostRead` — `tests/ui/panel-card.test.ts`
- `weak` — `tests/verb-purities.ts`
- `wersja` — `tests/tools/capture-intake.test.ts`
- `where` — `tests/ui/share-column.test.ts`
- `width` — in 14 files: `tests/`
- `widthMaximum` — `tests/ui/panel-drag.test.ts`
- `widthMinimum` — `tests/ui/panel-drag.test.ts`
- `widthPixels` — `tests/ui/panel-drag.test.ts`
- `widths` — `tests/ui/level-drawn.test.ts`
- `window` — in 6 files: `tests/`
- `windowAt` — `tests/e2e/panel-layer.spec.ts`
- `windowLayer` — `tests/e2e/panel-layer.spec.ts`
- `windowShadow` — `tests/repository/design-tokens.test.ts`
- `windowSizes` — `tests/panel-view.ts`, `tests/shown-screen.ts`, `tests/ui/panel-element.test.ts`
- `won` — `tests/ui/panel-words.test.ts`
- `worded` — `tests/repository/comment-share.test.ts`
- `words` — `tests/tools/preview-page.test.ts`
- `world` — in 8 files: `tests/`
- `woundsAttacker` — `tests/repository/protocol-keys.test.ts`
- `wpisy` — `tests/tools/capture-intake.test.ts`
- `wrapped` — `tests/runtime/live-fight.test.ts`
- `wraps` — `tests/runtime/engine-search.test.ts`
- `writer` — `tests/game/game-tooltip.test.ts`
- `written` — `tests/game/game-tooltip.test.ts`, `tests/runtime/panel-frame.test.ts`
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
- `MESSAGE_END` — `src/core/fight-decoder.ts`: `actor`, `target`
- `OUTCOME_RESULT` — `src/core/battle-event.ts`: `won`, `lost`, `drawn`, `fled`
- `PROC_END` — `src/core/protocol-key.ts`: `actor`, `target`, `unsettled`
- `SESSION_PHASE` — `src/core/fight-session.ts`: `waiting`, `underway`, `over`
- `UNREAD_CAUSE` — `src/core/battle-event.ts`: `unknownKey`, `noParameter`, `grammarRefused`

### `src/game/`

- `GAME_VALUE` — `src/game/game-value.ts`: `place`, `hero`, `label`, `build`
- `STORE_KEY` — `src/game/browser-store.ts`: `fights`, `meterFolded`, `meterPosition`,
  `helperFolded`, `helperPosition`, `storage`, `typeStep`, `meterSize`, `helperSize`

### `src/runtime/`

- `DEFECT_KIND` — `src/runtime/defect-ledger.ts`: `kept`, `keeping`, `mount`, `region`, `reading`,
  `figures`, `gesture`, `file`, `engine`
- `FAILURE_FATE` — `src/runtime/failure-fate.ts`: `shownAsUnknown`, `shownAsSuspect`, `defect`,
  `shelfAnswer`, `fallbackWithDefect`, `standDown`
- `FIGURES_CUT` — `src/runtime/panel-frame.ts`: `screen`, `drill`, `pair`
- `FILE_FIELD` — `src/runtime/fight-file.ts`: `formatVersion`, `addOnVersion`, `capturedAt`,
  `world`, `gameBuild`, `userAgent`, `report`, `droppedCalls`, `isTruncated`, `calls`, `index`,
  `payload`, `messages`, `combatantsBefore`, `combatantsAfter`
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

- `CARD_KEY_PLACE` — `src/ui/panel-element.ts`: `skill`, `pair`, `pairKinds`
- `CARD_LINE` — `src/ui/panel-element.ts`: `stat`, `sub`, `heading`, `note`
- `CARD_NOTE_TONE` — `src/ui/panel-element.ts`: `plain`, `suspect`, `caveat`
- `CARD_VARIABLES` — `src/ui/panel-look.ts`: `top`, `left`, `right`, `height`
- `CARD_WORDS` — `src/ui/panel-words.ts`: `wholeFight`, `raw`, `blows`, `blowsWithoutSkill`,
  `skillUses`, `turns`, `turnsWithLost`, `prevented`, `blowsCritical`, `blowsCriticalOffhand`,
  `striking`, `struck`, `scope`, `destroyed`, `gesture`, `gestureBack`, `gestureBackAnywhere`, `cut`
- `CAVEAT` — `src/ui/panel-words.ts`: `reduction`, `turns`, `unannounced`
- `CLASS` — `src/ui/panel-look.ts`: `title`, `titleVersion`, `control`, `controlLead`, `frame`,
  `folded`, `meter`, `slot`, `header`, `headerLine`, `headerPlace`, `headerPlaceName`,
  `headerPlaceTile`, `headerOutcome`, `strips`, `stripsGap`, `strip`, `stripCurrent`, `crumb`,
  `crumbBack`, `crumbHere`, `optionsQuestion`, `optionsHeading`, `optionsSteps`, `optionsStep`,
  `optionsWindow`, `optionsWindowName`, `optionsWindowState`, `optionsWindowOwn`, `optionsReset`,
  `optionsAnswer`, `optionsMeaning`, `list`, `listWaiting`, `section`, `sectionWords`, `row`,
  `rowDrillable`, `rowLeaf`, `rowRank`, `rowTime`, `rowName`, `rowSize`, `rowChosen`, `rowApart`,
  `rowPin`, `rowPinSet`, `rowValue`, `rowShare`, `rowSuspect`, `rowCaveat`, `rowTurn`, `rowSide`,
  `bar`, `barCap`, `figure`, `pinned`, `outside`, `empty`, `undrawn`, `suspicions`, `suspicion`,
  `defects`, `defect`, `sides`, `sidesLine`, `sidesLabel`, `sidesSpare`, `sidesTrack`, `sidesOurs`,
  `sidesTheirs`, `sidesNobody`, `card`, `cardHidden`, `cardName`, `cardSubtitle`, `cardGroup`,
  `cardHeading`, `cardLine`, `cardStrong`, `cardSub`, `cardLabel`, `cardCaveat`, `cardValue`,
  `cardNote`, `cardSuspect`, `cardCaveatNote`, `helper`, `helperBar`, `helperBody`, `helperFolded`,
  `helperUnder`, `helperCast`, `helperHolding`, `helperPips`, `helperPip`, `helperPipLit`,
  `sizeGrip`
- `COUNTED_NOUNS` — `src/ui/panel-words.ts`: `messages`, `heals`, `fights`, `combatants`, `turns`
- `EVENT_TYPE` — `src/ui/panel-document.ts`: `press`, `back`, `move`, `leave`, `release`, `cancel`
- `FIGHT_CARD_WORDS` — `src/ui/panel-words.ts`: `when`, `world`, `character`, `profession`
- `GRAB_KIND` — `src/ui/panel-drag.ts`: `move`, `size`
- `HALF_NAMED_FIELD` — `src/ui/panel-content.ts`: `damageTakenFromNobody`, `damageDealtToNobody`,
  `healthRestoredByNobody`
- `HALF_NAMED_KIND_FIELD` — `src/ui/panel-content.ts`: `damageTakenFromNobodyByKind`,
  `damageDealtToNobodyByKind`, `healthRestoredByNobodyByKey`
- `HALF_NAMED_OPENED` — `src/ui/panel-content.ts`: `person`, `element`
- `HELPER_ABSENCE` — `src/ui/panel-helper.ts`: `noFightYet`, `betweenFights`, `fightUnread`
- `HELPER_WORDS` — `src/ui/panel-words.ts`: `title`, `drag`, `collapse`, `expand`, `now`,
  `nothingHappens`, `provocation`, `castSeparator`, `turnsPassed`, `turnsLeft`, `chargedSkill`
- `LAYER` — `src/ui/panel-look.ts`: `helper`, `card`
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
  `nothingYet`, `noFightYet`, `fightUnread`, `keptUnread`, `noSides`, `fights`, `backFromFights`,
  `options`, `backFromOptions`, `storage`, `typeSize`, `windowSize`, `resizeHint`, `sizeOwn`,
  `sizeDefault`, `sizeReset`, `resizeGrip`, `ourSide`, `theirSide`, `withoutSide`, `wholeFight`,
  `openFights`, `openOptions`, `back`, `shelfEmpty`, `dealtTo`, `takenFrom`, `damageKind`,
  `healthSource`, `skills`, `withoutKind`, `restOfKinds`, `outsideRanking`, `outsideRow`,
  `outsideNote`, `restNote`, `share`, `shareOfFigure`, `drag`, `collapse`, `expand`, `saveFight`
- `PINNED_CASE` — `src/ui/panel-content.ts`: `dealtWithNoActor`, `givenWithNoActor`,
  `takenWithNoActor`, `takenWithNoTarget`, `restoredWithNoActor`
- `PINNED_PLACING` — `src/ui/panel-content.ts`: `apart`, `cut`
- `PLACE` — `src/ui/panel-look.ts`: `insetPixels`, `layer`
- `SHAPE` — `src/ui/panel-look.ts`: `radiusPixels`, `radiusSmallPixels`, `windowShadow`
- `SIDE_CHOICE` — `src/ui/panel-screen.ts`: `everyone`, `reader`, `opposing`
- `SIDE_RELATION` — `src/ui/panel-content.ts`: `reader`, `opposing`, `nobody`
- `SIGNAL` — `src/ui/panel-palette.ts`: `ours`, `theirs`, `suspect`, `caveat`, `defect`, `unknown`
- `SIZED_PANEL_VARIABLES` — `src/ui/panel-look.ts`: `listBasis`, `listRowsLeast`, `share`
- `SIZE_GRIP` — `src/ui/panel-look.ts`: `sizePixels`
- `SPACE_PIXELS` — `src/ui/panel-look.ts`: `half`, `small`, `regionDown`, `regionAcross`, `wide`
- `STANDING_TURN_STATE` — `src/ui/panel-helper.ts`: `held`, `unread`, `afterFight`, `onAuto`
- `STORAGE_CHOICE` — `src/ui/panel-choice.ts`: `local`, `session`, `memory`
- `SURFACE` — `src/ui/panel-look.ts`: `panel`, `raised`, `track`, `border`
- `TEXT` — `src/ui/panel-look.ts`: `plain`, `quiet`, `inkDark`, `inkLight`
- `TOOLTIP_WORDS` — `src/ui/panel-words.ts`: `provokedBy`, `provokedCount`, `holytouch`, `lastheal`,
  `spent`, `turnsTaken`
- `TYPE_STEP` — `src/ui/panel-choice.ts`: `small`, `medium`, `large`
- `UNNAMED_END` — `src/ui/panel-content.ts`: `actor`, `target`

### `src/`

- `BROWSER_WINDOW_PART` — `src/userscript-entry.ts`: `window`, `document`, `console`, `timers`,
  `frames`, `clock`, `downloads`

### `frozen/`

- `FROZEN_AURA_TURNS` — `frozen/aura-turns.ts`: `fetchedAt`, `skills`, `shouts`
- `FROZEN_BLOWS_GRANTED` — `frozen/blows-granted.ts`: `fetchedAt`, `skills`
- `FROZEN_BUFF_BITS` — `frozen/buff-bits.ts`: `gameBuild`, `bits`
- `FROZEN_HELP_PHRASES` — `frozen/help-phrases.ts`: `article`, `fetchedAt`, `counts`
- `FROZEN_PROTOCOL_KEYS` — `frozen/protocol-keys.ts`: `gameBuild`, `computedFamily`, `keys`
- `FROZEN_SKILL_DURATIONS` — `frozen/skill-durations.ts`: `fetchedAt`, `skills`

### `tools/`

- `CLIENT_FIELDS` — `tools/fabricated-fight.ts`: `battleground`, `skillsDisabled`,
  `skillsComboMaximum`, `skills`, `poolTime`, `poolTotal`, `poolMinimum`, `poolPenalty`, `poolLeft`,
  `moveOpening`, `move`, `originalId`, `otherLevel`, `gender`, `gridRow`, `icon`, `mana`, `energy`,
  `armour`, `resistanceFire`, `resistanceFrost`, `resistanceLight`, `act`, `focus`, `combo`,
  `cooldowns`, `figureNow`, `figureBonus`, `healthPercent`
- `DRILL_ROW` — `tools/drill-report.ts`: `person`, `halfNamed`, `skill`, `source`, `closing`,
  `kind`, `noKind`, `neitherEnd`
- `DRILL_RUNG` — `tools/drill-report.ts`: `ranking`, `opened`, `pair`, `part`, `unnamedPair`,
  `unnamed`, `unnamedCut`
- `DRILL_VERDICT` — `tools/drill-report.ts`: `always`, `sometimes`, `never`
- `FABRICATION_ENDING` — `tools/fabricated-fight.ts`: `settled`, `fled`
- `FABRICATION_FIELDS` — `tools/fabricated-fight.ts`: `isFabricated`, `fabricatedBy`,
  `fabricationScript`, `fabricatedShape`
- `GAME_CHANNEL` — `tools/game-client-source.ts`: `production`, `development`
- `INTAKE_KEYS` — `tools/capture-intake.ts`: `nonPlayer`, `abilities`
- `KEY_PLACEMENT` — `tools/protocol-key-shape.ts`: `alone`, `onAnnouncement`, `onBlow`, `onDamage`,
  `anywhere`
- `KEY_VALUE` — `tools/protocol-key-shape.ts`: `none`, `whole`, `number`, `text`
- `READING_VERDICT` — `tools/game-readings.ts`: `current`, `stale`, `unknown`
- `SHAPE_STEP` — `tools/protocol-key-table.ts`: `text`, `segmentKey`, `quoted`, `digits`
- `SHOT_MOMENT` — `tools/panel-shots.ts`: `underway`, `over`
- `TOOL_ERROR_CODE` — `tools/margometer-tool-error.ts`: `userscriptBuild`, `declaredVersion`,
  `recordingRead`, `developReport`, `changelog`, `captureIntake`, `gameSource`, `gameUnreachable`,
  `protocolKeyTable`, `protocolKeyShape`, `buffBitTable`, `skillTable`, `helpArticle`, `panelShot`,
  `previewServe`, `drillReport`, `cardHeight`, `givingWay`, `turnCount`, `turnReading`,
  `fabricatedFight`, `gameReadings`, `payloadCost`
- `TURN_OUTCOME` — `tools/turn-count.ts`: `exact`, `over`, `under`
- `TURN_PLACING` — `tools/turn-count.ts`: `exact`, `elsewhere`
- `TURN_VERDICT` — `tools/turn-count.ts`: `always`, `sometimes`, `never`, `inLump`
- `WITNESS_KEYS` — `tools/turn-count.ts`: `holder`

### `tests/`

- `CAUSE` — `tests/repository/protocol-keys.test.ts`: `subjectsOwn`, `announcementsActor`,
  `messageActor`, `woundsAttacker`, `nobody`
- `KEYS` — `tests/libs/unknown-value.test.ts`: `figure`, `named`, `nested`, `listed`, `inherited`,
  `method`
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

Every string a module-level constant holds, by the file that spells it: the game's keys and fields,
the store's keys, the sheet's classes and variables, the page's attributes. A string with a space or
a letter past ASCII is text rather than a name, and is left out.

### `frozen/aura-turns.ts`

- `"2026-09-23T08:58:25.997Z"` — `FROZEN_AURA_TURNS`

### `frozen/blows-granted.ts`

- `"2026-09-23T08:58:25.997Z"` — `FROZEN_BLOWS_GRANTED`

### `frozen/buff-bits.ts`

- `"Bb28FQty"` — `FROZEN_BUFF_BITS`
- `"critical_deep_wound"` — `FROZEN_BUFF_BITS`
- `"deep_wound"` — `FROZEN_BUFF_BITS`
- `"fire"` — `FROZEN_BUFF_BITS`
- `"frostbite"` — `FROZEN_BUFF_BITS`
- `"poisoned"` — `FROZEN_BUFF_BITS`
- `"shock"` — `FROZEN_BUFF_BITS`
- `"speed_up"` — `FROZEN_BUFF_BITS`
- `"swow_down"` — `FROZEN_BUFF_BITS`
- `"wound"` — `FROZEN_BUFF_BITS`

### `frozen/help-phrases.ts`

- `"2026-09-27T08:53:05.002Z"` — `FROZEN_HELP_PHRASES`
- `"372"` — `FROZEN_HELP_PHRASES`

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
- `"Bb28FQty"` — `FROZEN_PROTOCOL_KEYS`
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

- `"2026-09-23T08:58:25.997Z"` — `FROZEN_SKILL_DURATIONS`
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

### `libs/html-text.ts`

- `"\""` — `ENTITIES`
- `"&"` — `ENTITIES`
- `"&amp;"` — `ENTITIES`
- `"&gt;"` — `ENTITIES`
- `"&lt;"` — `ENTITIES`
- `"&nbsp"` — `ENTITIES`
- `"&nbsp;"` — `ENTITIES`
- `"&quot;"` — `ENTITIES`
- `"/"` — `TAG_TERMINATOR`
- `"<"` — `ENTITIES`, `TAG_OPEN`
- `">"` — `ENTITIES`, `TAG_CLOSE`
- `"script"` — `RAW_TEXT_ELEMENTS`
- `"style"` — `RAW_TEXT_ELEMENTS`

### `libs/number-text.ts`

- `"-"` — `MINUS`
- `"."` — `POINT`

### `libs/text-walk.ts`

- ``"\"'`"`` — `JAVASCRIPT_QUOTES`

### `libs/unknown-value.ts`

- `"list"` — `FIELD_TYPE`
- `"number"` — `FIELD_TYPE`
- `"record"` — `FIELD_TYPE`
- `"stated-text"` — `FIELD_TYPE`
- `"text"` — `FIELD_TYPE`

### `src/build-version.ts`

- `"0.0.0-dev"` — `BUILD_VERSION`

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
- `"0"` — `NO_COMBATANT`
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
- `"+legbon_anguish"` — `VALUELESS_DECLARATION_KEYS`
- `"+legbon_holytouch"` — `HOLYTOUCH_DECLARATION_KEY`
- `"+legbon_puncture"` — `DECLARATION_KEYS`
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
- `"-legbon_critred"` — `DECLARATION_KEYS`
- `"-legbon_facade"` — `DECLARATION_KEYS`
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
- `"fled"` — `KEY_FAMILY`
- `"heal"` — `HEAL_KEY`
- `"heal_per-allies"` — `DECLARATION_KEYS`
- `"heal_per-enemies"` — `DECLARATION_KEYS`
- `"health-change"` — `KEY_FAMILY`
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

### `src/game/browser-console.ts`

- `"MargoMeter/Panel"` — `BRAND`

### `src/game/browser-file.ts`

- `"MargoMeter-download"` — `DOWNLOAD_ANCHOR_CLASS`
- `"application/json"` — `FILE_TYPE`

### `src/game/browser-store.ts`

- `"MargoMeter-fights"` — `STORE_KEY`
- `"MargoMeter-folded"` — `STORE_KEY`
- `"MargoMeter-place"` — `STORE_KEY`
- `"MargoMeter-pomocnik-folded"` — `STORE_KEY`
- `"MargoMeter-pomocnik-place"` — `STORE_KEY`
- `"MargoMeter-pomocnik-size"` — `STORE_KEY`
- `"MargoMeter-size"` — `STORE_KEY`
- `"MargoMeter-storage"` — `STORE_KEY`
- `"MargoMeter-type"` — `STORE_KEY`

### `src/game/browser-surroundings.ts`

- `"."` — `HOST_SEPARATOR`
- `"hostname"` — `HOST_FIELD`
- `"location"` — `LOCATION_FIELD`
- `"navigator"` — `NAVIGATOR_FIELD`
- `"unknown"` — `WORLD_UNKNOWN`
- `"userAgent"` — `USER_AGENT_FIELD`

### `src/game/game-battle.ts`

- `"Engine"` — `ENGINE_FIELD`
- `"__margometerBattleWrap"` — `WRAP_MARKER`
- `"battle"` — `BATTLE_FIELD`
- `"getEngine"` — `ENGINE_CALL_FIELD`
- `"updateData"` — `WRAPPED_METHOD`

### `src/game/game-build.ts`

- `"."` — `OPTIONAL_SEPARATOR`
- `".js"` — `SCRIPT_NAME_TAIL`
- `"main.min"` — `SCRIPT_NAME_HEAD`

### `src/game/game-dictionary.ts`

- `"%"` — `HOLE_MARK`
- `"+-"` — `DIRECTION_SIGNS`
- `"."` — `FULL_STOP`
- `"_t"` — `TRANSLATE_FIELD`

### `src/game/game-hero.ts`

- `"d"` — `HELD_FIELDS`
- `"hero"` — `ENGINE_FIELDS`
- `"id"` — `HERO_FIELDS`

### `src/game/game-place.ts`

- `"d"` — `HELD_FIELDS`
- `"hero"` — `ENGINE_FIELDS`
- `"map"` — `ENGINE_FIELDS`
- `"name"` — `PLACE_FIELDS`
- `"x"` — `PLACE_FIELDS`
- `"y"` — `PLACE_FIELDS`

### `src/game/game-tooltip.ts`

- `"$"` — `WARRIOR_ELEMENT_FIELD`
- `"<br>"` — `CLIENT_BREAK`
- `"concatTip"` — `APPEND_METHOD`
- `"find"` — `FIND_METHOD`
- `"getTipData"` — `READ_METHOD`
- `"tip"` — `REPLACE_METHOD`
- `"tipupdate"` — `TELL_EVENT`
- `"trigger"` — `TELL_METHOD`

### `src/game/game-value.ts`

- `"build"` — `GAME_VALUE`
- `"hero"` — `GAME_VALUE`
- `"label"` — `GAME_VALUE`
- `"place"` — `GAME_VALUE`

### `src/game/payload-envelope.ts`

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

### `src/game/warrior-snapshot.ts`

- `"ac"` — `SHALLOW_COPIED_KEYS`
- `"energy"` — `COPIED_KEYS`
- `"hp"` — `SHALLOW_COPIED_KEYS`
- `"id"` — `WARRIOR_ID_KEY`
- `"lvl"` — `COPIED_KEYS`
- `"mana"` — `COPIED_KEYS`
- `"name"` — `COPIED_KEYS`, `NAME_KEY`
- `"originalId"` — `IDENTITY_KEYS`
- `"prof"` — `COPIED_KEYS`
- `"team"` — `COPIED_KEYS`
- `"warriors"` — `WARRIOR_COLLECTIONS`
- `"warriorsList"` — `WARRIOR_COLLECTIONS`

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

- `"defect"` — `FAILURE_FATE`
- `"fallback-with-defect"` — `FAILURE_FATE`
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
- `"pair"` — `FIGURES_CUT`
- `"screen"` — `FIGURES_CUT`

### `src/runtime/settings.ts`

- `"1"` — `FOLDED`
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
- `"damageDealtToNobody"` — `HALF_NAMED_FIELD`
- `"damageDealtToNobodyByKind"` — `HALF_NAMED_KIND_FIELD`
- `"damageTakenFromNobody"` — `HALF_NAMED_FIELD`
- `"damageTakenFromNobodyByKind"` — `HALF_NAMED_KIND_FIELD`
- `"dealtWithNoActor"` — `PINNED_CASE`
- `"element"` — `HALF_NAMED_OPENED`
- `"givenWithNoActor"` — `PINNED_CASE`
- `"healthRestoredByNobody"` — `HALF_NAMED_FIELD`
- `"healthRestoredByNobodyByKey"` — `HALF_NAMED_KIND_FIELD`
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
- `"helper"` — `GRIP_MARK_BY_WINDOW`
- `"meter"` — `GRIP_MARK_BY_WINDOW`
- `"move"` — `GRAB_KIND`
- `"size"` — `GRAB_KIND`

### `src/ui/panel-element.ts`

- `"+"` — `UNFOLD_MARK`
- `"+of_crit"` — `OFFHAND_CRIT_KEY`
- `"MargoMeter-Panel"` — `HOST_NAME`
- `"auto"` — `EDGE_RELEASED`
- `"caveat"` — `CARD_NOTE_TONE`
- `"crumb:back"` — `CRUMB_CARD_KEY`
- `"data-card"` — `CARD_ATTRIBUTE`
- `"data-margometer-version"` — `VERSION_ATTRIBUTE`
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
- `"--MargoMeter-list-basis"` — `SIZED_PANEL_VARIABLES`
- `"--MargoMeter-list-rows-least"` — `SIZED_PANEL_VARIABLES`
- `"--MargoMeter-meter-height"` — `SIZE_VARIABLES`
- `"--MargoMeter-meter-top"` — `TOP_VARIABLES`
- `"--MargoMeter-meter-width"` — `SIZE_VARIABLES`
- `"--MargoMeter-panel-share"` — `SIZED_PANEL_VARIABLES`
- `"--MargoMeter-rows"` — `ROWS_VARIABLE`
- `"-webkit-user-select:none;user-select:none;"` — `NO_SELECTION`
- `"10"` — `PLACE`
- `"2"` — `LAYER`
- `"3"` — `LAYER`
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
- `"card-group"` — `CLASS`
- `"card-heading"` — `CLASS`
- `"card-hidden"` — `CLASS`
- `"card-label"` — `CLASS`
- `"card-line"` — `CLASS`
- `"card-name"` — `CLASS`
- `"card-note"` — `CLASS`
- `"card-strong"` — `CLASS`
- `"card-sub"` — `CLASS`
- `"card-subtitle"` — `CLASS`
- `"card-suspect"` — `CLASS`
- `"card-value"` — `CLASS`
- `"chosen"` — `CLASS`
- `"crumb"` — `CLASS`
- `"crumb-back"` — `CLASS`
- `"crumb-here"` — `CLASS`
- `"defect"` — `CLASS`
- `"defects"` — `CLASS`
- `"drillable"` — `CLASS`
- `"empty"` — `CLASS`
- `"figure"` — `CLASS`
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
- `"outside-region"` — `CLASS`
- `"pinned"` — `CLASS`
- `"pinned-region"` — `CLASS`
- `"row"` — `CLASS`
- `"row-caveat"` — `CLASS`
- `"row-name"` — `CLASS`
- `"row-pin"` — `CLASS`
- `"row-rank"` — `CLASS`
- `"row-share"` — `CLASS`
- `"row-side"` — `CLASS`
- `"row-size"` — `CLASS`
- `"row-suspect"` — `CLASS`
- `"row-time"` — `CLASS`
- `"row-turn"` — `CLASS`
- `"row-value"` — `CLASS`
- `"section-heading"` — `CLASS`
- `"section-words"` — `CLASS`
- `"selected"` — `CLASS`
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
- `"skill"` — `OPENED_PART`
- `"source"` — `OPENED_PART`

### `src/ui/panel-words.ts`

- `"&"` — `MARKUP_ENTITY`
- `"-"` — `MINUS_SIGN`
- `"<"` — `MARKUP_OPENER`
- `"<1%"` — `SHARE_FLOOR`
- `"CZYM"` — `PANEL_WORDS`
- `"Ciosy"` — `CARD_WORDS`
- `"KOMU"` — `PANEL_WORDS`
- `"Kiedy"` — `FIGHT_CARD_WORDS`
- `"Krytyki"` — `CARD_WORDS`
- `"Leczenie"` — `NOUN_WORDS`
- `"Licznik"` — `WINDOW_WORDS`
- `"MargoMeter"` — `ADD_ON_NAME`, `PANEL_WORDS`
- `"My"` — `PANEL_WORDS`, `SIDE_WORDS`
- `"Oni"` — `PANEL_WORDS`, `SIDE_WORDS`
- `"Opcje"` — `PANEL_WORDS`
- `"Otrzymane"` — `CARD_METRIC_WORDS`
- `"Pomocnik"` — `HELPER_WORDS`
- `"Profesja"` — `FIGHT_CARD_WORDS`
- `"Prowokacja"` — `HELPER_WORDS`
- `"Prowokuje"` — `TOOLTIP_WORDS`
- `"Teraz"` — `HELPER_WORDS`
- `"Walki"` — `PANEL_WORDS`
- `"Wszyscy"` — `SIDE_WORDS`
- `"Zadane"` — `CARD_METRIC_WORDS`
- `"Zatrzymane"` — `CARD_WORDS`
- `"Zniszczone"` — `CARD_WORDS`
- `"buff"` — `STATUS_CATEGORY`
- `"card"` — `PANEL_REGION`
- `"crumb"` — `PANEL_REGION`
- `"cze"` — `MONTH_WORDS`
- `"dane"` — `DIRECTION_WORDS`
- `"defects"` — `PANEL_REGION`
- `"engine"` — `PANEL_DEFECT_KIND`
- `"figures"` — `PANEL_DEFECT_KIND`
- `"file"` — `PANEL_DEFECT_KIND`
- `"gesture"` — `PANEL_DEFECT_KIND`
- `"gru"` — `MONTH_WORDS`
- `"header"` — `PANEL_REGION`
- `"helper"` — `PANEL_REGION`
- `"i"` — `CAVEAT_MARK`
- `"keeping"` — `PANEL_DEFECT_KIND`
- `"kept"` — `PANEL_DEFECT_KIND`
- `"kwi"` — `MONTH_WORDS`
- `"lip"` — `MONTH_WORDS`
- `"lis"` — `MONTH_WORDS`
- `"list"` — `PANEL_REGION`
- `"listy"` — `REGION_WORDS`
- `"lut"` — `MONTH_WORDS`
- `"maj"` — `MONTH_WORDS`
- `"mar"` — `MONTH_WORDS`
- `"mount"` — `PANEL_DEFECT_KIND`
- `"otrzymane"` — `DIRECTION_WORDS`
- `"outside"` — `PANEL_REGION`
- `"pinned"` — `PANEL_REGION`
- `"pomocnika"` — `REGION_WORDS`
- `"postaci"` — `COUNTED_NOUNS`
- `"postacie"` — `COUNTED_NOUNS`
- `"przegrana"` — `OUTCOME_WORDS`
- `"przerwane"` — `CHARGED_SKILL_WORDS`
- `"reading"` — `PANEL_DEFECT_KIND`
- `"reduction"` — `CAVEAT`
- `"region"` — `PANEL_DEFECT_KIND`
- `"remis"` — `OUTCOME_WORDS`
- `"sides"` — `PANEL_REGION`
- `"sie"` — `MONTH_WORDS`
- `"strips"` — `PANEL_REGION`
- `"sty"` — `MONTH_WORDS`
- `"suspicions"` — `PANEL_REGION`
- `"teraz"` — `LIVE_FIGHT_TIME`
- `"trwa"` — `LIVE_FIGHT_OUTCOME`
- `"tur"` — `COUNTED_NOUNS`
- `"tura"` — `COUNTED_NOUNS`
- `"turns"` — `CAVEAT`
- `"tury"` — `COUNTED_NOUNS`
- `"ucieczka"` — `OUTCOME_WORDS`
- `"uleczenia"` — `COUNTED_NOUNS`
- `"uleczenie"` — `COUNTED_NOUNS`
- `"unannounced"` — `CAVEAT`
- `"walk"` — `COUNTED_NOUNS`
- `"walka"` — `COUNTED_NOUNS`
- `"walki"` — `COUNTED_NOUNS`
- `"wiersza"` — `REGION_WORDS`
- `"wrz"` — `MONTH_WORDS`
- `"wygrana"` — `OUTCOME_WORDS`
- `"wykonane"` — `CHARGED_SKILL_WORDS`
- `"wykorzystany"` — `TOOLTIP_WORDS`
- `"zadane"` — `DIRECTION_WORDS`

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

- `"a"` — `ANCHOR_TAG`
- `"clock"` — `BROWSER_WINDOW_PART`
- `"console"` — `BROWSER_WINDOW_PART`
- `"document"` — `BROWSER_WINDOW_PART`
- `"downloads"` — `BROWSER_WINDOW_PART`
- `"frames"` — `BROWSER_WINDOW_PART`
- `"script[src]"` — `SCRIPT_WITH_SOURCE`
- `"timers"` — `BROWSER_WINDOW_PART`
- `"window"` — `BROWSER_WINDOW_PART`

### `tests/core/absorption-destruction-rule.test.ts`

- `"active_absorbdest_per"` — `KEY`
- `"tspell"` — `ANNOUNCEMENT_KEY`

### `tests/core/anguish-rule.test.ts`

- `"+legbon_anguish"` — `ANNOUNCEMENT_KEY`
- `"anguish"` — `TICK_KEY`
- `"captures/2026-08-25-luvia-grupa-vs-draugr-none-none.json"` — `TWO_APPLIERS`

### `tests/core/aura-standing.test.ts`

- `"-all"` — `SIDE_IN_THE_NAME`
- `"-allies"` — `SIDE_IN_THE_NAME`
- `"-enemies"` — `SIDE_IN_THE_NAME`
- `"//"` — `COMMENT_OPENER`
- `"2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0"` — `BOTH_OKRZYKI`
- `"2026-09-09-tempest-duet-vs-wojownik-ne0iTNdg-0.14.0"` — `AGAINST_TWO`
- `"]);"` — `REACH_CLOSER`
- `"aura-"` — `SIDE_IN_THE_NAME`
- `"src/core/protocol-key.ts"` — `REACH_SOURCE`

### `tests/core/bandage-rule.test.ts`

- `"bandage"` — `KEY`
- `"captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json"` — `BANDAGE`

### `tests/core/combatant-roster.test.ts`

- `"captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json"` — `TWO_OF_A_NAME`
- `"captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json"` — `NOBODY`

### `tests/core/fight-decoder.test.ts`

- `"-10000243=25.11;0;poison=136,20"` — `TICK_ON_THE_ANNOUNCER`
- `"-255967=100.00;0;step"` — `STEP_TAKEN`
- `"-255967=19.27;0;poison=140,14"` — `POISON`
- `"459132=98.49;0;step"` — `STEP_AFTER`
- `"467968=100.00;-10000249=99.41;+dmgd=1553;-absorb=354;+injure=98;-dmgd=658"` — `BLOW_BY_ANOTHER`
- `"467968=100.00;-10000249=99.69;+pierce;+dmgd=1557;+acdmg=16;-absorb=545;-dmgd=1012"` — `ABSORBED`
- `"467968=99.52;0;heal=-92"` — `NEGATIVE_HEAL`
- `"482845=100.00;0;heal=99"` — `HEAL`
- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`
- `"captures/2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none.json"` — `AUTO`

### `tests/core/fight-statistics.test.ts`

- `"-10000544=98.62;0;poison=204,20"` — `STRIKER_POISON`
- `"-10020804=30.33;61801=60.10;-poison_lowdmg_per=10;+dmg=1091;+dmgc=2140;-parry;-dmg=0"` —
  `PARRIED`
- `"-10124094=23.21;22914=43.63;+dmg=3275;+acdmg=96;-absorb=136;-dmg=2365"` — `PREPARE_BLOW`
- `"-255967=100.00;0;step"` — `STEP`
- `"-255967=19.27;0;poison=140,14"` — `POISON`
- `"0;0;heal=99"` — `RESTORED_TO_NOBODY`
- `"114881=95.35;195782=96.83;+dmg=1259;+dmgo=839;+acdmg=17;-blok=378;-dmg=0"` — `BLOCKED`
- `"1=50.00;0;legbon_lastheal=40,Nieznajoma(50.00%)"` — `RESTORED_TO_A_STRANGER`
- `"467968=100.00;-10000249=99.69;+crit;+pierce;+dmgd=1557;+acdmg=16;-dmgd=1012"` — `CRITICAL`
- `"467968=100.00;-10000249=99.69;+pierce;+dmgd=1557;+acdmg=16;-absorb=545;-dmgd=1012"` — `ABSORBED`
- `"467968=100.00;-10000249=99.69;-evade;+dmgd=900;-dmgd=0"` — `EVADED`
- `"467968=100.00;-10000249=99.69;-tenacity;+dmgd=100;-dmgd=100"` — `UNSETTLED`
- `"482845=100.00;-161518=21.34;+crit;+dmgd=612;+acdmg=5;-dmgd=363"` — `BARE_BLOW_AGAIN`
- `"482845=100.00;-161518=70.07;+dmgd=466;+acdmg=5;-dmgd=223"` — `BARE_BLOW`
- `"482845=100.00;0;heal=99"` — `HEAL`
- `"w"` — `PROBE_ROSTER_TWO_SIDES`

### `tests/core/granted-blow-rule.test.ts`

- `"+oth_dmg"` — `ELSEWHERE_KEYS`
- `"dmg"` — `DAMAGE_MARKER`
- `"heal"` — `ELSEWHERE_KEYS`
- `"healall_per"` — `ELSEWHERE_KEYS`
- `"legbon_lastheal"` — `ELSEWHERE_KEYS`
- `"skillId"` — `ID_KEY`
- `"tcustom"` — `ANNOUNCEMENT_KEYS`
- `"tspell"` — `NAME_KEY`

### `tests/core/health-witness.test.ts`

- `"healall_per"` — `UNSIZED_SHARE_KEY`
- `"hp_per-allies"` — `POOL_RAISE_KEY`

### `tests/core/injure-rule.test.ts`

- `"captures/2026-08-15-tempest-grupa-vs-hildur-3-1786514810315-none.json"` — `THREE_ATTACKERS`

### `tests/core/last-heal-rule.test.ts`

- `"+oth_dmg"` — `NAMED_DAMAGE_KEY`
- `"healall_per"` — `UNSIZED_SHARE_KEY`
- `"legbon_lastheal"` — `HEAL_KEY`

### `tests/core/message-grammar.test.ts`

- `"-255967=100.00;0;step"` — `STEP`
- `"482845=100.00;-161518=0.00;+dmgd=485;+acdmg=5;-dmgd=248"` — `KILLING_HIT`
- `"482845=100.00;-161518=70.07;+dmgd=466;+acdmg=5;-dmgd=223"` — `HIT`

### `tests/core/npc-heal-rule.test.ts`

- `"captures/2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1.json"` — `NPC_HEAL`
- `"npc_heal"` — `KEY`

### `tests/core/skill-announcement-rule.test.ts`

- `"combo-max"` — `COUNT_KEY`
- `"lowheal_per-enemies"` — `REDUCER_KEY`
- `"tcustom"` — `CUSTOM_NAME_KEY`
- `"tspell"` — `TABLE_NAME_KEY`

### `tests/core/turn-clock.test.ts`

- `"Cios"` — `ANNOUNCEMENT`

### `tests/core/wound-rule.test.ts`

- `"captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json"` — `WOUND`
- `"wound"` — `TICK_KEY`

### `tests/e2e/build-once.ts`

- `"dist"` — `BUILT_DIRECTORY`
- `"margometer.meta.js"` — `METADATA_NAME`
- `"margometer.user.js"` — `USERSCRIPT_NAME`

### `tests/e2e/game-page.ts`

- `"#MargoMeter-Panel"` — `HOST_SELECTOR`
- `"1785244275300"` — `GAME_BUILD`
- `"E2E"` — `PLACE_NAME`
- `"e2e-engine"` — `ENGINE_ANSWER`
- `"e2e-settings"` — `SETTINGS_ID`
- `"margometerE2e"` — `PROBE_NAME`

### `tests/e2e/panel-boot.spec.ts`

- `"GameEngineAlreadyWrapped"` — `ENGINE_FAILURE_ALREADY_WRAPPED`
- `"MargoMeter/Panel"` — `FAILURE_LINE`
- `"SearchAbandoned"` — `ENGINE_FAILURE_SEARCH_ABANDONED`

### `tests/e2e/panel-card.spec.ts`

- `".MargoMeter-card"` — `CARD`
- `".MargoMeter-card:not(.card-hidden)"` — `CARD_OPEN`

### `tests/e2e/panel-crawl.spec.ts`

- `"captures/2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none.json"` — `DEEPEST`

### `tests/e2e/panel-crawler.ts`

- `"[data-kind]"` — `DESCENDING`
- `"[data-row]"` — `DESCENDING`
- `"[data-skill]"` — `DESCENDING`
- `"[data-source]"` — `DESCENDING`
- `"[data-unnamed]"` — `DESCENDING`

### `tests/e2e/panel-drag.spec.ts`

- `"MargoMeter-place"` — `PLACE_KEY`

### `tests/e2e/panel-fixture.ts`

- `".undrawn"` — `UNDRAWN_SELECTOR`
- `"NaN"` — `NEVER_SAID`
- `"[object"` — `NEVER_SAID`
- `"undefined"` — `NEVER_SAID`

### `tests/e2e/panel-fold.spec.ts`

- `"+"` — `UNFOLD_MARK`
- `"MargoMeter-folded"` — `FOLD_KEY`

### `tests/e2e/panel-helper.spec.ts`

- `"+"` — `UNFOLD_MARK`
- `".MargoMeter-card:not(.card-hidden)"` — `CARD_OPEN`
- `"MargoMeter-place"` — `PLACE_KEY`
- `"MargoMeter-pomocnik-folded"` — `STANDING_FOLD_KEY`
- `"MargoMeter-pomocnik-place"` — `STANDING_PLACE_KEY`

### `tests/e2e/panel-level.spec.ts`

- `"captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json"` — `GROWING`

### `tests/e2e/panel-options.spec.ts`

- `"--MargoMeter-meter-width"` — `PANEL_WIDTH_VARIABLE`
- `".options-answer"` — `ANSWERS`
- `".options-step"` — `ANSWERS`
- `".options-window"` — `ANSWERS`
- `"MargoMeter-storage"` — `STORAGE_KEY`
- `"[data-fold]"` — `CONTROLS`
- `"[data-options]"` — `CONTROLS`
- `"[data-save]"` — `CONTROLS`
- `"[data-shelf]"` — `CONTROLS`
- `"large"` — `STEPS`
- `"medium"` — `STEPS`
- `"small"` — `STEPS`

### `tests/e2e/panel-page.ts`

- `"https://tempest.margonem.pl"` — `PAGE_ORIGIN`
- `"tempest"` — `PAGE_WORLD`

### `tests/e2e/panel-reload.spec.ts`

- `"MargoMeter-folded"` — `FOLD_KEY`
- `"MargoMeter-place"` — `PLACE_KEY`
- `"MargoMeter-storage"` — `STORAGE_KEY`

### `tests/e2e/panel-save.spec.ts`

- `"addOnVersion"` — `ENVELOPE`
- `"calls"` — `ENVELOPE`
- `"capturedAt"` — `ENVELOPE`
- `"formatVersion"` — `ENVELOPE`
- `"gameBuild"` — `ENVELOPE`
- `"report"` — `ENVELOPE`
- `"world"` — `ENVELOPE`

### `tests/e2e/panel-scroll.spec.ts`

- `"captures/2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json"` — `OVERFLOWING`
- `"damageDealt"` — `HOME_SCREEN`
- `"damageTaken"` — `OTHER_SCREEN`

### `tests/e2e/panel-shelf.spec.ts`

- `"MargoMeter-fights"` — `SHELF_KEY`
- `"MargoMeter-storage"` — `STORAGE_KEY`
- `"captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json"` — `ENDING`
- `"live"` — `LIVE`

### `tests/e2e/panel-size.spec.ts`

- `"MargoMeter-pomocnik-size"` — `HELPER_SIZE_KEY`
- `"MargoMeter-size"` — `SIZE_KEY`
- `"[data-size-grip=\"helper\"]"` — `HELPER_GRIP`
- `"[data-size-grip=\"meter\"]"` — `PANEL_GRIP`

### `tests/e2e/panel-states.spec.ts`

- `"PRZEGRANA"` — `OUTCOMES`
- `"REMIS"` — `OUTCOMES`
- `"UCIECZKA"` — `OUTCOMES`
- `"WYGRANA"` — `OUTCOMES`
- `"captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json"` — `ENDING`

### `tests/e2e/panel-strips.spec.ts`

- `"MargoMeter-storage"` — `STORAGE_KEY`

### `tests/e2e/panel-tooltip.spec.ts`

- `"MargoMeter"` — `ADD_ON_NAME`

### `tests/e2e/panel-type.spec.ts`

- `"11px"` — `STEPS`
- `"12px"` — `STEPS`
- `"13px"` — `STEPS`
- `"MargoMeter-type"` — `TYPE_KEY`
- `"[data-fold]"` — `CONTROLS`
- `"[data-options]"` — `CONTROLS`
- `"[data-save]"` — `CONTROLS`
- `"[data-shelf]"` — `CONTROLS`
- `"large"` — `STEPS`
- `"medium"` — `STEPS`
- `"small"` — `STEPS`

### `tests/fake-window.ts`

- `"console"` — `PAGE_CALL`
- `"dictionary"` — `PAGE_CALL`
- `"downloads"` — `PAGE_CALL`
- `"frame"` — `PAGE_CALL`
- `"mount"` — `PAGE_CALL`
- `"scripts"` — `PAGE_CALL`
- `"store-read"` — `PAGE_CALL`
- `"store-write"` — `PAGE_CALL`
- `"timer"` — `PAGE_CALL`
- `"tooltip"` — `PAGE_CALL`

### `tests/game/fight-capture.test.ts`

- `"somebody"` — `SOMEBODY`
- `"w"` — `SOMEBODY`

### `tests/game/game-dictionary.test.ts`

- `"msg_+crit"` — `CRITICAL_ID`

### `tests/game/recorded-session.test.ts`

- `"captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json"` —
  `NO_SNAPSHOTS`

### `tests/game/warrior-entries.test.ts`

- `"w"` — `WHOLE`

### `tests/game/warrior-snapshot.test.ts`

- `"ac"` — `RECORDED_KEYS`
- `"energy"` — `RECORDED_KEYS`
- `"hp"` — `RECORDED_KEYS`
- `"id"` — `RECORDED_KEYS`
- `"lvl"` — `RECORDED_KEYS`
- `"mana"` — `RECORDED_KEYS`
- `"name"` — `RECORDED_KEYS`
- `"prof"` — `RECORDED_KEYS`
- `"team"` — `RECORDED_KEYS`

### `tests/libs/unknown-value.test.ts`

- `"constructor"` — `KEYS`
- `"f"` — `KEYS`
- `"l"` — `KEYS`
- `"n"` — `KEYS`
- `"r"` — `KEYS`
- `"toString"` — `KEYS`

### `tests/markdown-document.ts`

- ``"`"`` — `BACKTICK`
- `"|"` — `CELL_SEPARATOR`

### `tests/panel-view.ts`

- `"0.0.0-test"` — `TEST_VERSION`

### `tests/recorded-fights.ts`

- `".json"` — `RECORDING_EXTENSION`
- `"cur"` — `WARRIOR_FIELDS`
- `"hp"` — `WARRIOR_FIELDS`
- `"hpp"` — `WARRIOR_FIELDS`
- `"id"` — `WARRIOR_FIELDS`
- `"lvl"` — `WARRIOR_FIELDS`
- `"max"` — `WARRIOR_FIELDS`
- `"name"` — `WARRIOR_FIELDS`
- `"prof"` — `WARRIOR_FIELDS`
- `"team"` — `WARRIOR_FIELDS`

### `tests/recording-sources.ts`

- `"captures/"` — `RECORDINGS_DIRECTORY`
- `"fa1dcce"` — `DEVELOP_REVISION`

### `tests/register-table.ts`

- `"|"` — `CELL_MARK`

### `tests/repository/assert-imports.test.ts`

- `"@std/assert"` — `ASSERT_PACKAGE`
- `"@std/assert/assert"` — `ASSERT_MODULE`
- `"assert"` — `ASSERT_NAME`

### `tests/repository/broad-catches.test.ts`

- `"libs/errors.ts"` — `GUARD_PATH`

### `tests/repository/browser-suite-keys.test.ts`

- `"_KEY"` — `KEY_SUFFIX`

### `tests/repository/called-once.test.ts`

- `"libs"` — `CHECKED_DIRECTORIES`
- `"src"` — `CHECKED_DIRECTORIES`
- `"tools"` — `CHECKED_DIRECTORIES`

### `tests/repository/captured-fight-register.test.ts`

- ``"`"`` — `BACKTICK`
- `"docs/captured-fights.md"` — `REGISTER_PATH`
- `"|"` — `ROW_OPENER`

### `tests/repository/changelog.test.ts`

- `"!"` — `SENTENCE_ENDS`
- `"\""` — `ENTRY_CLOSERS`
- `")"` — `ENTRY_CLOSERS`
- `"**Poprawka**"` — `ENTRY_KINDS`
- `"**Zmiana**"` — `ENTRY_KINDS`
- `"."` — `SENTENCE_ENDS`
- `"?"` — `SENTENCE_ENDS`
- `"CHANGELOG.md"` — `CHANGELOG_PATH`

### `tests/repository/cited-paths.test.ts`

- `"$"` — `SHELL_MARK`
- `".agents/"` — `ROOTS`
- `".github/"` — `ROOTS`
- `".html"` — `ENDINGS`
- `".js"` — `ENDINGS`
- `".json"` — `ENDINGS`
- `".md"` — `ENDINGS`
- `".png"` — `ENDINGS`
- `".ts"` — `ENDINGS`
- `".yml"` — `ENDINGS`
- `":"` — `HISTORY_SPLIT`
- `"TODO.md"` — `HAND_KEPT_LIST`
- ``"`"`` — `SPAN_MARK`
- `"captures/"` — `ROOTS`
- `"design/"` — `ROOTS`
- `"develop:"` — `DEVELOP_MARK`
- `"docs/"` — `ROOTS`
- `"fabricated/"` — `ROOTS`
- `"frozen/"` — `ROOTS`
- `"libs/"` — `ROOTS`
- `"project/"` — `ROOTS`
- `"screenshots/"` — `ROOTS`
- `"src/"` — `ROOTS`
- `"tests/"` — `ROOTS`
- `"tools/"` — `ROOTS`

### `tests/repository/comment-share.test.ts`

- `"*"` — `COMMENT_MARGIN`
- `"/**"` — `DOCBLOCK_OPENER`
- `"//"` — `LINE_COMMENT_OPENER`
- `"src/"` — `DIRECTORY_ROOTS`
- `"tools/"` — `DIRECTORY_ROOTS`
- `"{"` — `BLOCK_OPENER`

### `tests/repository/control-flow.test.ts`

- `"frozen"` — `CHECKED_DIRECTORIES`
- `"libs"` — `CHECKED_DIRECTORIES`
- `"src"` — `CHECKED_DIRECTORIES`
- `"tools"` — `CHECKED_DIRECTORIES`

### `tests/repository/decisions.test.ts`

- `"Accepted"` — `ACCEPTED`
- `"docs/adr/"` — `DECISIONS_DIRECTORY`

### `tests/repository/declaration-order.test.ts`

- `"Deno.test("` — `CASE_OPENERS`
- `"ExportAllDeclaration"` — `IMPORT_NODES`
- `"ImportDeclaration"` — `IMPORT_NODES`
- `"TSInterfaceDeclaration"` — `TYPE_NODES`
- `"TSModuleDeclaration"` — `TYPE_NODES`
- `"TSTypeAliasDeclaration"` — `TYPE_NODES`
- `"constants"` — `SECTION`
- `"functions"` — `SECTION`
- `"imports"` — `SECTION`
- `"test("` — `CASE_OPENERS`
- `"test.describe("` — `CASE_OPENERS`
- `"test.use("` — `CASE_OPENERS`
- `"types"` — `SECTION`

### `tests/repository/design-tokens.test.ts`

- `"DESIGN.md"` — `DESIGN_PATH`
- ``"`"`` — `QUOTE`
- `"|"` — `TABLE_OPENER`

### `tests/repository/documents.test.ts`

- `"**"` — `BOLD_MARK`
- `"---"` — `FRONTMATTER_MARK`
- `"."` — `RULE_CLOSER`
- `"../.agents/skills"` — `SKILLS_LINK_TARGET`
- `".agents/skills/"` — `SKILLS_DIRECTORY`
- `".claude/skills"` — `SKILLS_LINK`
- `".test.ts"` — `GUARD_ENDING`
- `"/AGENTS.md"` — `NESTED_RULES_NAME`
- `"/SKILL.md"` — `SKILL_FILE_NAME`
- `"AGENTS.md"` — `ROOT_DOCUMENTS_OTHER`, `RULES_PATH`
- `"CLAUDE.md"` — `ROOT_DOCUMENTS_OTHER`
- `"Edit"` — `DENIED_TOOLS`
- `"README.en.md"` — `ROOT_DOCUMENTS_OTHER`
- `"README.md"` — `ROOT_DOCUMENTS_OTHER`
- `"TODO.md"` — `HAND_KEPT_LIST`, `ROOT_DOCUMENTS_OTHER`
- `"Write"` — `DENIED_TOOLS`
- ``"`"`` — `QUOTE`
- `"docs/structure.md"` — `STRUCTURE_PATH`
- `"tests/repository/"` — `GUARD_DIRECTORY`
- `"|"` — `CELL_MARK`

### `tests/repository/event-entries.test.ts`

- `"ArrowFunctionExpression"` — `FUNCTION_VALUES`
- `"FunctionExpression"` — `FUNCTION_VALUES`
- `"MethodDefinition"` — `METHOD_NODES`
- `"Property"` — `METHOD_NODES`
- ``"`"`` — `QUOTE`
- `"commit"` — `COMMIT_VERB`
- `"docs/design.md"` — `DESIGN_PATH`
- `"init"` — `RENDER_CALLERS`
- `"render"` — `RENDER_VERB`
- `"replay"` — `COMMIT_CALLERS`
- `"src"` — `CHECKED_DIRECTORIES`

### `tests/repository/fabricated-fights.test.ts`

- `".gitignore"` — `IGNORE_FILE`
- `".json"` — `RECORDING_SUFFIX`
- `"deno.json"` — `CONFIGURATION_FILE`

### `tests/repository/handed-callbacks.test.ts`

- `"attempt"` — `GUARDS`

### `tests/repository/import-paths.test.ts`

- `"#/"` — `ROOT_PREFIX`
- `"./"` — `SIBLING_PREFIX`
- `"@playwright/test"` — `BROWSER_SUITE_PREFIXES`
- `"@std/"` — `STANDARD_PREFIX`
- `"node:"` — `BROWSER_SUITE_PREFIXES`
- `"tests/e2e/"` — `BROWSER_SUITE_DIRECTORY`

### `tests/repository/layers.test.ts`

- `"frozen/"` — `IMPORTS_ALLOWED`
- `"libs/"` — `IMPORTS_ALLOWED`
- `"src/build-version.ts"` — `IMPORTS_ALLOWED`
- `"src/core/"` — `IMPORTS_ALLOWED`
- `"src/game/"` — `IMPORTS_ALLOWED`
- `"src/runtime/"` — `IMPORTS_ALLOWED`
- `"src/ui/"` — `IMPORTS_ALLOWED`
- `"src/userscript-"` — `IMPORTS_ALLOWED`

### `tests/repository/name-register.test.ts`

- `"!"` — `PRINTABLE_FIRST`
- `"--write"` — `WRITE_FLAG`
- `"ArrayExpression"` — `HOLDING_NODES`
- `"CatchClause"` — `DECLARING_NODES`
- `"ClassDeclaration"` — `DECLARING_NODES`
- `"ClassExpression"` — `DECLARING_NODES`
- `"Error"` — `FAILURE_ROOT`
- `"ExportNamedDeclaration"` — `TOP_NODES`
- `"Fields"` — `SECTION_HEADINGS`
- `"Functions"` — `SECTION_HEADINGS`
- `"ImportDefaultSpecifier"` — `DECLARING_NODES`
- `"ImportNamespaceSpecifier"` — `DECLARING_NODES`
- `"ImportSpecifier"` — `DECLARING_NODES`
- `"Literal"` — `DECLARING_NODES`
- `"Locals"` — `SECTION_HEADINGS`
- `"MethodDefinition"` — `DECLARING_NODES`
- `"ObjectExpression"` — `HOLDING_NODES`
- `"Parameters"` — `SECTION_HEADINGS`
- `"Program"` — `TOP_NODES`
- `"Property"` — `DECLARING_NODES`, `HOLDING_NODES`
- `"PropertyDefinition"` — `DECLARING_NODES`
- `"TSAsExpression"` — `HOLDING_NODES`
- `"TSCallSignatureDeclaration"` — `DECLARING_NODES`, `SIGNATURE_NODES`
- `"TSConstructSignatureDeclaration"` — `DECLARING_NODES`, `SIGNATURE_NODES`
- `"TSDeclareFunction"` — `DECLARING_NODES`, `SIGNATURE_NODES`
- `"TSFunctionType"` — `DECLARING_NODES`, `SIGNATURE_NODES`
- `"TSInterfaceDeclaration"` — `DECLARING_NODES`
- `"TSMethodSignature"` — `DECLARING_NODES`, `SIGNATURE_NODES`
- `"TSPropertySignature"` — `DECLARING_NODES`
- `"TSSatisfiesExpression"` — `HOLDING_NODES`
- `"TSTypeAliasDeclaration"` — `DECLARING_NODES`
- `"TSTypeParameter"` — `DECLARING_NODES`
- `"Types"` — `SECTION_HEADINGS`
- `"VariableDeclarator"` — `DECLARING_NODES`
- ``"`"`` — `SPAN_MARK`
- `"captures/"` — `EVIDENCE_PREFIX`
- `"class"` — `NAME_KIND`
- `"const"` — `CONST_NAME`
- `"constructor"` — `CONSTRUCTOR_NAME`
- `"deno.json"` — `CONFIGURATION_PATH`
- `"docs/names.md"` — `REGISTER_PATH`
- `"field"` — `NAME_KIND`
- `"frozen/"` — `LAYERS`
- `"function"` — `NAME_KIND`
- `"libs/"` — `LAYERS`
- `"local"` — `NAME_KIND`
- `"package.json"` — `MANIFEST_PATH`
- `"parameter"` — `NAME_KIND`
- `"src/"` — `LAYERS`
- `"src/core/"` — `LAYERS`
- `"src/game/"` — `LAYERS`
- `"src/runtime/"` — `LAYERS`
- `"src/ui/"` — `LAYERS`
- `"tests/"` — `LAYERS`
- `"tools/"` — `LAYERS`
- `"type"` — `NAME_KIND`
- `"~"` — `PRINTABLE_LAST`

### `tests/repository/names.test.ts`

- `".spec.ts"` — `FILE_SUFFIXES`
- `".test.ts"` — `FILE_SUFFIXES`
- `".ts"` — `FILE_SUFFIXES`
- `"ClassDeclaration"` — `TYPE_NODES`
- `"TSInterfaceDeclaration"` — `TYPE_NODES`
- `"TSTypeAliasDeclaration"` — `TYPE_NODES`
- `"common"` — `CATEGORY_STEMS`
- `"helpers"` — `CATEGORY_STEMS`
- `"index"` — `CATEGORY_STEMS`
- `"misc"` — `CATEGORY_STEMS`
- `"utils"` — `CATEGORY_STEMS`

### `tests/repository/nesting-depth.test.ts`

- `"libs"` — `CHECKED_DIRECTORIES`
- `"src"` — `CHECKED_DIRECTORIES`
- `"tools"` — `CHECKED_DIRECTORIES`

### `tests/repository/protocol-keys.test.ts`

- `"+-"` — `SIGNS`
- `"_"` — `UNDERSCORE`
- `"_-"` — `SEPARATORS`
- `"_Cause:_"` — `CAUSE_MARKER`
- `"_Evidence:_"` — `EVIDENCE_MARKER`
- `"_Health:_"` — `HEALTH_MARKER`
- ``"```"`` — `CLAIM_TERMINATORS`
- `"allies"` — `SCOPE_SUFFIXES`
- `"nobody"` — `CAUSE`
- `"src/core/protocol-key.ts"` — `KEY_OWNER_PATH`

### `tests/repository/purity.test.ts`

- `"Array"` — `MUTABLE_COLLECTIONS`
- `"AssignmentExpression"` — `CHANGING_NODES`
- `"Map"` — `MUTABLE_COLLECTIONS`
- `"Set"` — `MUTABLE_COLLECTIONS`
- `"UpdateExpression"` — `CHANGING_NODES`
- `"add"` — `CHANGING_METHODS`
- `"clear"` — `CHANGING_METHODS`
- `"copyWithin"` — `CHANGING_METHODS`
- `"delete"` — `CHANGING_METHODS`
- `"fill"` — `CHANGING_METHODS`
- `"libs"` — `CHECKED_DIRECTORIES`
- `"pop"` — `CHANGING_METHODS`
- `"push"` — `CHANGING_METHODS`
- `"reverse"` — `CHANGING_METHODS`
- `"set"` — `CHANGING_METHODS`
- `"shift"` — `CHANGING_METHODS`
- `"sort"` — `CHANGING_METHODS`
- `"splice"` — `CHANGING_METHODS`
- `"src"` — `CHECKED_DIRECTORIES`
- `"tools"` — `CHECKED_DIRECTORIES`
- `"unshift"` — `CHANGING_METHODS`

### `tests/repository/reader-layer.test.ts`

- `"@std/assert"` — `ASSERT_PACKAGE`
- `"src/ui/"` — `READER_DIRECTORY`
- `"src/userscript-boot.ts"` — `READER_FILES`
- `"src/userscript-entry.ts"` — `READER_FILES`

### `tests/repository/readmes.test.ts`

- `"\""` — `PICTURE_CLOSER`
- `"#"` — `HEADING_MARK`
- `"README.en.md"` — `README_PATHS`
- `"README.md"` — `README_PATHS`
- `"screenshots/taken-at.json"` — `SHOTS_PATH`

### `tests/repository/record-shapes.test.ts`

- `"delete"` — `DELETE_OPERATOR`
- `"libs"` — `CHECKED_DIRECTORIES`
- `"src/core"` — `CHECKED_DIRECTORIES`
- `"src/game"` — `CHECKED_DIRECTORIES`
- `"src/runtime"` — `CHECKED_DIRECTORIES`

### `tests/repository/regular-expressions.test.ts`

- `"RegExp"` — `CONSTRUCTOR_NAME`

### `tests/repository/single-importer.test.ts`

- `"src/core/"` — `LAYER_DIRECTORIES`
- `"src/game/"` — `LAYER_DIRECTORIES`
- `"src/runtime/"` — `LAYER_DIRECTORIES`
- `"src/ui/"` — `LAYER_DIRECTORIES`

### `tests/repository/synchronous-bundle.test.ts`

- `"Promise"` — `PROMISE_NAME`
- `"then"` — `THEN_NAME`

### `tests/repository/throws.test.ts`

- `"ClassDeclaration"` — `CLASS_NODES`
- `"ClassExpression"` — `CLASS_NODES`
- `"Error"` — `ERROR_NAME`
- `"name"` — `NAME_FIELD`
- `"tests"` — `TERMINAL_DIRECTORIES`
- `"tools"` — `TERMINAL_DIRECTORIES`
- `"tools/margometer-tool-error.ts"` — `TOOL_ERROR_PATH`

### `tests/repository/type-assertions.test.ts`

- `"@ts-"` — `DIRECTIVE_OPENER`
- `"const"` — `CONST_NAME`
- `"frozen"` — `CHECKED_DIRECTORIES`
- `"libs"` — `CHECKED_DIRECTORIES`
- `"src"` — `CHECKED_DIRECTORIES`
- `"tools"` — `CHECKED_DIRECTORIES`

### `tests/repository/workflows.test.ts`

- `".github/workflows/"` — `WORKFLOWS_DIRECTORY`

### `tests/runtime-world.ts`

- `"2026-08-29T10:00:00.000Z"` — `CAPTURED_AT`
- `"53XkBRxF"` — `GAME_BUILD`
- `"tempest"` — `WORLD`

### `tests/runtime/carried-tooltip.test.ts`

- `"MargoMeter"` — `ADD_ON_ROW`
- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`
- `"captures/2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none.json"` — `LAST_RESCUED`
- `"captures/2026-09-09-tempest-duet-vs-wojownik-ne0iTNdg-0.14.0.json"` — `DUET`

### `tests/runtime/fight-file.test.ts`

- `"0.0.0-test"` — `ADD_ON_VERSION`
- `"2026-08-29T10:11:12.345Z"` — `SURROUNDINGS`
- `"53XkBRxF"` — `SURROUNDINGS`
- `"captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json"` — `NEWEST`
- `"tempest"` — `SURROUNDINGS`

### `tests/runtime/live-fight.test.ts`

- `"Mapa"` — `PLACE`

### `tests/runtime/margometer-runtime.test.ts`

- `"captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json"` — `ANOTHER`
- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`
- `"captures/2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none.json"` — `FIRST_OF_A_PAIR`
- `"captures/2026-08-15-tempest-grupa-vs-hildur-2-1786514810315-none.json"` — `SECOND_OF_A_PAIR`
- `"captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json"` — `THIRD`

### `tests/runtime/opened-readings.test.ts`

- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`

### `tests/runtime/panel-frame.test.ts`

- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`

### `tests/shown-screen.ts`

- `"shown"` — `SHOWN_LIST`

### `tests/source-tree.ts`

- `"#"` — `NAME_MARK`
- `"#/"` — `ROOT_PREFIX`
- `"./"` — `SIBLING_PREFIX`
- `"ArrowFunctionExpression"` — `FUNCTION_NODES`
- `"BreakStatement"` — `NESTED_NODES`
- `"ContinueStatement"` — `NESTED_NODES`
- `"DoWhileStatement"` — `NESTED_NODES`
- `"ExportAllDeclaration"` — `IMPORT_NODES`
- `"ExportNamedDeclaration"` — `IMPORT_NODES`
- `"ExpressionStatement"` — `NESTED_NODES`
- `"ForInStatement"` — `NESTED_NODES`
- `"ForOfStatement"` — `NESTED_NODES`
- `"ForStatement"` — `NESTED_NODES`
- `"FunctionDeclaration"` — `FUNCTION_NODES`, `NESTED_NODES`
- `"FunctionExpression"` — `FUNCTION_NODES`
- `"IfStatement"` — `NESTED_NODES`
- `"ImportDeclaration"` — `IMPORT_NODES`
- `"LabeledStatement"` — `NESTED_NODES`
- `"ReturnStatement"` — `NESTED_NODES`
- `"SwitchStatement"` — `NESTED_NODES`
- `"ThrowStatement"` — `NESTED_NODES`
- `"TryStatement"` — `NESTED_NODES`
- `"VariableDeclaration"` — `NESTED_NODES`
- `"WhileStatement"` — `NESTED_NODES`
- `"frozen"` — `SOURCE_DIRECTORIES`
- `"frozen/"` — `BUNDLED_PREFIXES`
- `"libs"` — `SOURCE_DIRECTORIES`
- `"libs/"` — `BUNDLED_PREFIXES`
- `"src"` — `SOURCE_DIRECTORIES`
- `"tests"` — `SOURCE_DIRECTORIES`
- `"tools"` — `SOURCE_DIRECTORIES`

### `tests/tools/aura-lifetime.test.ts`

- `"_Help:_"` — `HELP_MARK`
- ``"`"`` — `QUOTE`
- `"docs/auras-standing.md"` — `REGISTER_PATH`
- `"docs/protocol-keys.md"` — `KEY_REGISTER_PATH`
- `"wykonanych"` — `CLAUSE_OPENERS`

### `tests/tools/aura-standing.test.ts`

- ``"`"`` — `QUOTE`
- `"docs/auras-standing.md"` — `REGISTER_PATH`

### `tests/tools/capture-intake.test.ts`

- `"captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json"` — `SHORT`

### `tests/tools/card-height.test.ts`

- `"2026-08-06-tempest-grupa-vs-hildur-1785244275300-none"` — `HILDUR_NAME`
- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`

### `tests/tools/decoding-status.test.ts`

- `"captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json"` — `SHORT`

### `tests/tools/develop-reports.test.ts`

- `"2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none"` — `SHORT_NAME`
- `"2026-08-11-tempest-tancerz-vs-wermont-1786441768914-none"` — `OTHER_NAME`

### `tests/tools/drill-report.test.ts`

- ``"`"`` — `BACKTICK`
- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`
- `"docs/drill-levels.md"` — `REGISTER_PATH`
- `"|"` — `CELL_SEPARATOR`

### `tests/tools/fabricated-fight.test.ts`

- `"decoded"` — `DECODED_VERDICT`

### `tests/tools/fight-figures.test.ts`

- `"captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json"` — `SHORT`

### `tests/tools/frozen-files.test.ts`

- `"frozen/a.ts"` — `PATHS`
- `"frozen/b.ts"` — `PATHS`
- `"held"` — `HELD_DATE`
- `"read"` — `READ_DATE`

### `tests/tools/game-readings.test.ts`

- `"2026-08-09T12:00:00.000Z"` — `READ_AT`
- `"heldBuild"` — `HELD_BUILD`
- `"readBuild"` — `READ_BUILD`

### `tests/tools/help-article.test.ts`

- `"2026-08-09T12:00:00.000Z"` — `READ_AT`

### `tests/tools/preview-page.test.ts`

- `"/?fight=first"` — `FIGHTS`
- `"/?fight=second"` — `FIGHTS`
- `"/calls?fight=first"` — `FIGHTS`
- `"/calls?fight=second"` — `FIGHTS`
- `"0;1=100.00;+dmg=5;-dmg=5"` — `CALLS`
- `"MargoMeter"` — `INSTALL`
- `"Preview"` — `WORDS`
- `"en"` — `WORDS`
- `"entry"` — `WORDS`
- `"first"` — `FIGHTS`
- `"https://example.test/margometer.user.js"` — `INSTALL`
- `"pause"` — `WORDS`
- `"play"` — `WORDS`
- `"playing"` — `WORDS`
- `"second"` — `FIGHTS`
- `"tooltips"` — `WORDS`

### `tests/tools/preview-site.test.ts`

- `".preview-strip"` — `BOUNDED_BY_ITSELF`
- `"1.2.3"` — `VERSION`
- `"</header>"` — `BAND_CLOSING`
- `"@import"` — `LOADED_FROM_ELSEWHERE`
- `"url(http"` — `LOADED_FROM_ELSEWHERE`

### `tests/tools/recorded-material.test.ts`

- `"captures/2026-09-19-luvia-tropiciel-vs-mag-Bb28FQty-0.17.0.json"` — `STEPPED`

### `tests/tools/shout-holding.test.ts`

- `"%"` — `PERCENT`
- `"docs/auras-standing.md"` — `REGISTER_PATH`

### `tests/tools/turn-count.test.ts`

- `"+stun"` — `STUN_OPENER`
- `"captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json"` — `BOAR`
- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `UNNARRATED`
- `"docs/turns-taken.md"` — `REGISTER_PATH`

### `tests/tools/turn-reading.test.ts`

- `"2026-"` — `RECORDING_OPENER`
- `"captures/2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none.json"` — `DISPUTED`
- `"docs/reading-a-turn.md"` — `REGISTER_PATH`

### `tests/ui/blow-vocabulary.test.ts`

- `"blows"` — `CARD_LABEL_KEYS`
- `"blowsCritical"` — `CARD_LABEL_KEYS`
- `"blowsCriticalOffhand"` — `CARD_LABEL_KEYS`
- `"blowsWithoutSkill"` — `CARD_LABEL_KEYS`
- `"cut"` — `CARD_OTHER_KEYS`
- `"destroyed"` — `CARD_OTHER_KEYS`
- `"gesture"` — `CARD_OTHER_KEYS`
- `"gestureBack"` — `CARD_OTHER_KEYS`
- `"gestureBackAnywhere"` — `CARD_OTHER_KEYS`
- `"prevented"` — `CARD_LABEL_KEYS`
- `"raw"` — `CARD_LABEL_KEYS`
- `"scope"` — `CARD_OTHER_KEYS`
- `"skillUses"` — `CARD_LABEL_KEYS`
- `"striking"` — `CARD_OTHER_KEYS`
- `"struck"` — `CARD_OTHER_KEYS`
- `"turns"` — `CARD_LABEL_KEYS`
- `"turnsWithLost"` — `CARD_LABEL_KEYS`
- `"wholeFight"` — `CARD_OTHER_KEYS`

### `tests/ui/card-window.test.ts`

- `"(83)"` — `HILDUR`
- `"Otrzymane"` — `HILDUR`
- `"Zadane"` — `HILDUR`
- `"note"` — `HILDUR`
- `"plain"` — `HILDUR`
- `"stat"` — `HILDUR`
- `"sub"` — `HILDUR`
- `"surowe"` — `HILDUR`

### `tests/ui/helper-window.test.ts`

- `"NajdluzszyNickJakiPrzeszedl"` — `CUT_NAME`

### `tests/ui/level-drawn.test.ts`

- `"-"` — `MINUS_SIGN`
- `"--MargoMeter-rows"` — `ROWS_VARIABLE`
- `"data-card"` — `CARD_ATTRIBUTE`
- `"everyone"` — `SIDE_CHOICES`
- `"opposing"` — `SIDE_CHOICES`
- `"reader"` — `SIDE_CHOICES`
- `"style"` — `STYLE_ATTRIBUTE`

### `tests/ui/panel-card.test.ts`

- `"+crit"` — `HILDUR`
- `"+of_crit"` — `HILDUR`
- `"+pierce"` — `HILDUR`
- `"-evade"` — `HILDUR`
- `"-legbon_cleanse"` — `HILDUR`
- `"absorb"` — `HILDUR`
- `"absorbm"` — `HILDUR`
- `"acdmg"` — `HILDUR`
- `"blok"` — `HILDUR`
- `"resdmg"` — `HILDUR`

### `tests/ui/panel-content.test.ts`

- `"-255967=19.27;0;poison=140,14"` — `POISON`
- `"0;0;+dmg=700;-dmg=700"` — `NEITHER_END`
- `"114881=95.35;195782=96.83;+dmg=1259;+dmgo=839;+acdmg=17;-blok=378;-dmg=0"` — `BLOCKED`
- `"captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json"` — `POISONED`
- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`
- `"captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json"` — `FOUR_KINDS`
- `"captures/2026-09-14-luvia-grupa-vs-mamlambo-auto-Cl9U89Zr-0.16.0.json"` — `BOTH_KINDS_OF_PAIR`
- `"dmgg"` — `UNNAMED_KINDS`

### `tests/ui/panel-element.test.ts`

- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`
- `"captures/2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none.json"` — `BOTH_KINDS_OF_PAIR`
- `"captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json"` — `FOUR_KINDS`
- `"row-caveat"` — `ROW_MARK_CELLS`
- `"row-suspect"` — `ROW_MARK_CELLS`
- `"row-turn"` — `ROW_MARK_CELLS`

### `tests/ui/panel-look.test.ts`

- `"\"@/"` — `DEVELOP_ROOT_PREFIX`
- `")"` — `RGB_CLOSER`
- `"--MargoMeter-"` — `VARIABLE_OPENER`
- `"--MargoMeter-meter-top"` — `DEVELOP_SPELLINGS`
- `"--MargoMeter-panel-top"` — `DEVELOP_SPELLINGS`
- `".MargoMeter-card"` — `SHEET_DEPARTURES`
- `".MargoMeter-helper"` — `SHEET_DEPARTURES`
- `".MargoMeter-titlebar"` — `SHEET_DEPARTURES`
- `".card-"` — `DEVELOP_SPELLINGS`
- `".header-line"` — `SHEET_DEPARTURES`
- `".header-line>*"` — `SHEET_DEPARTURES`
- `".header-place"` — `SHEET_DEPARTURES`
- `".header-place-name"` — `SHEET_DEPARTURES`
- `".header-place-tile"` — `SHEET_DEPARTURES`
- `".helper-"` — `DEVELOP_SPELLINGS`
- `".helper-body"` — `SHEET_DEPARTURES`
- `".meter"` — `SHEET_DEPARTURES`
- `".meter>"` — `DEVELOP_SPELLINGS`
- `".meter>.list"` — `SHEET_DEPARTURES`
- `".meter>.size-grip"` — `SHEET_DEPARTURES`
- `".meter{"` — `DEVELOP_SPELLINGS`
- `".options-answer"` — `SHEET_DEPARTURES`
- `".options-answer.selected::before"` — `SHEET_DEPARTURES`
- `".options-answer::before"` — `SHEET_DEPARTURES`
- `".options-heading"` — `SHEET_DEPARTURES`
- `".options-meaning"` — `SHEET_DEPARTURES`
- `".options-question"` — `SHEET_DEPARTURES`
- `".options-reset"` — `SHEET_DEPARTURES`
- `".options-step"` — `SHEET_DEPARTURES`
- `".options-step-large"` — `SHEET_DEPARTURES`
- `".options-step-medium"` — `SHEET_DEPARTURES`
- `".options-step-small"` — `SHEET_DEPARTURES`
- `".options-step.selected,.options-answer.selected"` — `SHEET_DEPARTURES`
- `".options-step:first-child"` — `SHEET_DEPARTURES`
- `".options-step:hover,.options-answer:hover"` — `SHEET_DEPARTURES`
- `".options-steps"` — `SHEET_DEPARTURES`
- `".options-window"` — `SHEET_DEPARTURES`
- `".options-window-name"` — `SHEET_DEPARTURES`
- `".options-window-state"` — `SHEET_DEPARTURES`
- `".options-window-state.options-window-own"` — `SHEET_DEPARTURES`
- `".panel>"` — `DEVELOP_SPELLINGS`
- `".panel{"` — `DEVELOP_SPELLINGS`
- `".size-grip"` — `SHEET_DEPARTURES`
- `".size-grip:hover"` — `SHEET_DEPARTURES`
- `".standing-"` — `DEVELOP_SPELLINGS`
- `".strips-label"` — `SHEET_DEPARTURES`
- `".tip-"` — `DEVELOP_SPELLINGS`
- `".titlebar-fights"` — `SHEET_DEPARTURES`
- `".titlebar-lead"` — `SHEET_DEPARTURES`
- `".titlebar-version"` — `SHEET_DEPARTURES`
- `"0123456789abcdef"` — `HEX_DIGITS`
- `":host"` — `SHEET_DEPARTURES`
- `"MargoMeter-card"` — `DEVELOP_SPELLINGS`
- `"MargoMeter-helper"` — `DEVELOP_SPELLINGS`
- `"MargoMeter-standing"` — `DEVELOP_SPELLINGS`
- `"MargoMeter-tip"` — `DEVELOP_SPELLINGS`
- `"b"` — `PROFESSIONS`
- `"box-sizing"` — `SHEET_DEPARTURES`
- `"display"` — `SHEET_DEPARTURES`
- `"flex"` — `SHEET_DEPARTURES`
- `"gap"` — `SHEET_DEPARTURES`
- `"h"` — `PROFESSIONS`
- `"height"` — `SHEET_DEPARTURES`
- `"justify-content"` — `SHEET_DEPARTURES`
- `"left"` — `SHEET_DEPARTURES`
- `"libs/number-range.ts"` — `DEVELOP_SHEET_FILES`
- `"libs/number-text.ts"` — `DEVELOP_SHEET_FILES`
- `"libs/text-walk.ts"` — `DEVELOP_SHEET_FILES`
- `"m"` — `PROFESSIONS`
- `"max-height"` — `SHEET_DEPARTURES`
- `"min-height"` — `SHEET_DEPARTURES`
- `"min-width"` — `SHEET_DEPARTURES`, `SHORTENING`
- `"overflow"` — `SHEET_DEPARTURES`, `SHORTENING`
- `"p"` — `PROFESSIONS`
- `"position"` — `SHEET_DEPARTURES`
- `"raised"` — `INK_GROUNDS`
- `"rgb("` — `RGB_OPENER`
- `"right"` — `SHEET_DEPARTURES`
- `"src/ui/panel-look.ts"` — `DEVELOP_SHEET_FILES`
- `"surface"` — `INK_GROUNDS`
- `"t"` — `PROFESSIONS`
- `"text-overflow"` — `SHEET_DEPARTURES`, `SHORTENING`
- `"track"` — `FILL_GROUNDS`, `INK_GROUNDS`
- `"w"` — `PROFESSIONS`
- `"white-space"` — `SHORTENING`
- `"width"` — `SHEET_DEPARTURES`

### `tests/ui/panel-palette.test.ts`

- `"abcdefghijklmnopqrstuvwxyz"` — `ALPHABET`
- `"b"` — `PROFESSIONS`
- `"h"` — `PROFESSIONS`
- `"m"` — `PROFESSIONS`
- `"p"` — `PROFESSIONS`
- `"t"` — `PROFESSIONS`
- `"w"` — `PROFESSIONS`

### `tests/ui/panel-scroll.test.ts`

- `"damageDealt|everyone"` — `SOMEWHERE`

### `tests/ui/panel-words.test.ts`

- ``"\"'`"`` — `QUOTES`
- `"combatant"` — `OUR_VOCABULARY`
- `"decoder"` — `OUR_VOCABULARY`
- `"dmg"` — `HAND_KEPT_KEYS`
- `"endbattle"` — `HAND_KEPT_KEYS`
- `"half-named"` — `OUR_VOCABULARY`
- `"healall_per"` — `HAND_KEPT_KEYS`
- `"legbon"` — `HAND_KEPT_KEYS`
- `"oth_dmg"` — `HAND_KEPT_KEYS`
- `"payload"` — `OUR_VOCABULARY`
- `"protocol"` — `OUR_VOCABULARY`
- `"roster"` — `OUR_VOCABULARY`
- `"skillid"` — `HAND_KEPT_KEYS`
- `"suspect"` — `OUR_VOCABULARY`
- `"tspell"` — `HAND_KEPT_KEYS`
- `"unaccounted"` — `OUR_VOCABULARY`
- `"unattributed"` — `OUR_VOCABULARY`
- `"undrawn"` — `OUR_VOCABULARY`

### `tests/ui/share-column.test.ts`

- `"0%"` — `NO_SHARE`

### `tests/ui/view-failure.test.ts`

- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`

### `tests/userscript-entry.test.ts`

- `"Blob"` — `MEMBERS_BY_PART`
- `"Date"` — `MEMBERS_BY_PART`
- `"URL"` — `MEMBERS_BY_PART`
- `"cancelAnimationFrame"` — `MEMBERS_BY_PART`
- `"captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json"` — `HILDUR`
- `"clearInterval"` — `MEMBERS_BY_PART`
- `"document"` — `MEMBERS_BY_PART`
- `"requestAnimationFrame"` — `MEMBERS_BY_PART`
- `"setInterval"` — `MEMBERS_BY_PART`
- `"setTimeout"` — `MEMBERS_BY_PART`

### `tests/verb-purities.ts`

- `"AGENTS.md"` — `RULES_PATH`
- ``"`"`` — `QUOTE`
- `"either"` — `PURITY`
- `"none"` — `PURITY`
- `"strong"` — `PURITY`
- `"weak"` — `PURITY`
- `"|"` — `CELL_SEPARATOR`

### `tools/aura-lifetime.ts`

- `"--cases"` — `CASES_FLAG`

### `tools/aura-standing.ts`

- `"both"` — `REACH_WORDS`
- `"caster's"` — `REACH_WORDS`
- `"other"` — `REACH_WORDS`

### `tools/buff-bit-table.ts`

- `"("` — `CALL_OPEN`
- `")"` — `CALL_CLOSE`
- `","` — `ARGUMENT_SEPARATOR`
- `"buff"` — `ROLE`
- `"frozen/buff-bits.ts"` — `FROZEN_PATH`
- `"gameBuild"` — `FROZEN_DATE_FIELD`
- `"null"` — `NOTHING_ARGUMENT`

### `tools/build-userscript.ts`

- `"-dev"` — `DEVELOPMENT_SUFFIX`
- `"EventSource"` — `OUTBOUND_CALLS`
- `"XMLHttpRequest"` — `OUTBOUND_CALLS`
- `"com"` — `GAME_DOMAINS`
- `"commons"` — `NON_GAME_HOSTS`
- `"deno.json"` — `CONFIGURATION_FILE`
- `"dist"` — `OUTPUT_DIRECTORY`
- `"fetch("` — `OUTBOUND_CALLS`
- `"forum"` — `NON_GAME_HOSTS`
- `"https://github.com/KamilGrocholski/margometer"` — `HOMEPAGE`
- `"margometer.meta.js"` — `METADATA_NAME`
- `"margometer.user.js"` — `USERSCRIPT_NAME`
- `"pl"` — `GAME_DOMAINS`
- `"pomoc"` — `NON_GAME_HOSTS`
- `"sendBeacon"` — `OUTBOUND_CALLS`
- `"src/userscript-boot.ts"` — `BUNDLE_ENTRY`
- `"www"` — `NON_GAME_HOSTS`

### `tools/capture-intake.ts`

- `".json"` — `RECORDING_SUFFIX`
- `"dddd-dd-dd"` — `DAY_SHAPE`
- `"descriptionsRemoved"` — `REMOVED_COUNT`
- `"namesSubstituted"` — `SUBSTITUTED_COUNT`
- `"npc"` — `INTAKE_KEYS`
- `"skills"` — `INTAKE_KEYS`

### `tools/changelog.ts`

- `"CHANGELOG.md"` — `CHANGELOG_FILE`
- `"deno.json"` — `CONFIGURATION_FILE`

### `tools/develop-reports.ts`

- `".cache"` — `CACHE_DIRECTORY`
- `".complete"` — `COMPLETE_MARK`
- `"captures"` — `DEVELOP_RECORDINGS`
- `"deno.json"` — `DEVELOP_PATHS`
- `"deno.lock"` — `DEVELOP_PATHS`
- `"fight:decoding"` — `DECODING_TASK`
- `"fight:figures"` — `FIGURES_TASK`
- `"frozen"` — `DEVELOP_PATHS`
- `"libs"` — `DEVELOP_PATHS`
- `"project"` — `DEVELOP_PATHS`
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
- `"2026-01-01T00:00:00.000Z"` — `FABRICATED_AT`
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

### `tools/game-client-source.ts`

- `".cache/game-client/"` — `CACHE_ROOT`
- `"build"` — `MANIFEST_FIELDS`
- `"bundlePath"` — `MANIFEST_FIELDS`
- `"development"` — `GAME_CHANNEL`
- `"fetchedAt"` — `MANIFEST_FIELDS`
- `"host"` — `MANIFEST_FIELDS`
- `"https://experimental.margonem.pl"` — `CHANNEL_HOSTS`
- `"https://tempest.margonem.pl"` — `CHANNEL_HOSTS`
- `"main.js"` — `BUNDLE_NAME`
- `"production"` — `GAME_CHANNEL`
- `"provenance.json"` — `MANIFEST_NAME`

### `tools/game-readings.ts`

- `"STALE"` — `VERDICT_WORDS`
- `"UNKNOWN"` — `VERDICT_WORDS`
- `"current"` — `READING_VERDICT`, `VERDICT_WORDS`
- `"stale"` — `READING_VERDICT`
- `"unknown"` — `READING_VERDICT`

### `tools/help-article.ts`

- `".cache/help/"` — `CACHE_ROOT`
- `"372"` — `MECHANICS_ARTICLE`
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

- `"BuffBitTable"` — `TOOL_ERROR_CODE`
- `"CaptureIntake"` — `TOOL_ERROR_CODE`
- `"CardHeight"` — `TOOL_ERROR_CODE`
- `"Changelog"` — `TOOL_ERROR_CODE`
- `"DeclaredVersion"` — `TOOL_ERROR_CODE`
- `"DevelopReport"` — `TOOL_ERROR_CODE`
- `"DrillReport"` — `TOOL_ERROR_CODE`
- `"FabricatedFight"` — `TOOL_ERROR_CODE`
- `"GameReadings"` — `TOOL_ERROR_CODE`
- `"GameSource"` — `TOOL_ERROR_CODE`
- `"GameUnreachable"` — `TOOL_ERROR_CODE`
- `"GivingWay"` — `TOOL_ERROR_CODE`
- `"HelpArticle"` — `TOOL_ERROR_CODE`
- `"PanelShot"` — `TOOL_ERROR_CODE`
- `"PayloadCost"` — `TOOL_ERROR_CODE`
- `"PreviewServe"` — `TOOL_ERROR_CODE`
- `"ProtocolKeyShape"` — `TOOL_ERROR_CODE`
- `"ProtocolKeyTable"` — `TOOL_ERROR_CODE`
- `"RecordingRead"` — `TOOL_ERROR_CODE`
- `"SkillTable"` — `TOOL_ERROR_CODE`
- `"TurnCount"` — `TOOL_ERROR_CODE`
- `"TurnReading"` — `TOOL_ERROR_CODE`
- `"UserscriptBuild"` — `TOOL_ERROR_CODE`

### `tools/panel-giving-way.ts`

- `"deno.json"` — `COPIED`
- `"deno.lock"` — `COPIED`
- `"dist/giving-way"` — `DEFAULT_INTO`
- `"frozen"` — `COPIED`
- `"libs"` — `COPIED`
- `"src"` — `COPIED`
- `"src/ui/panel-element.ts"` — `PANEL_FILE`

### `tools/panel-shots.ts`

- `"MARGOMETER_BROWSER"` — `BROWSER_VARIABLE`
- `"over"` — `SHOT_MOMENT`
- `"screenshots"` — `SHOT_DIRECTORY`
- `"taken-at.json"` — `SIDECAR_NAME`
- `"underway"` — `SHOT_MOMENT`

### `tools/preview-page.ts`

- `"#14171c"` — `GAME_PAGE_COLOUR`
- `".preview-said"` — `PREVIEW_SAID_SELECTOR`
- `".preview-split"` — `PREVIEW_SPLIT_SELECTOR`
- `".preview-strip"` — `PREVIEW_STRIP_SELECTOR`

### `tools/preview-server.ts`

- `"--fabricated"` — `FLAG_FABRICATED`
- `"--fight"` — `FLAG_FIGHT`
- `"--from"` — `FLAG_FROM`
- `"--port"` — `FLAG_PORT`
- `"127.0.0.1"` — `PREVIEW_HOSTNAME`
- `"MargoMeterTool/Preview"` — `FAILURE_LINE`
- `"Preview"` — `PREVIEW_WORDS`
- `"en"` — `PREVIEW_WORDS`
- `"entry"` — `PREVIEW_WORDS`
- `"frozen"` — `WATCHED_DIRECTORIES`
- `"libs"` — `WATCHED_DIRECTORIES`
- `"no-store"` — `HTML_TYPE`, `SCRIPT_TYPE`
- `"pause"` — `PREVIEW_WORDS`
- `"play"` — `PREVIEW_WORDS`
- `"playing"` — `PREVIEW_WORDS`
- `"src"` — `WATCHED_DIRECTORIES`
- `"tooltips"` — `PREVIEW_WORDS`

### `tools/preview-site.ts`

- `"--release"` — `RELEASE_FLAG`
- `"captures/2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json"` — `LANDING_RECORDING`
- `"deno.json"` — `CONFIGURATION_FILE`
- `"dist/preview"` — `OUTPUT_DIRECTORY`
- `"https://github.com/KamilGrocholski/margometer"` — `HOMEPAGE`
- `"index.html"` — `LANDING_PAGE`
- `"odtwarzanie"` — `PREVIEW_SITE_WORDS`
- `"pauza"` — `PREVIEW_SITE_WORDS`
- `"pl"` — `PREVIEW_SITE_WORDS`
- `"wpis"` — `PREVIEW_SITE_WORDS`

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
- `"both"` — `COUNT_WORDS`
- `"eight"` — `COUNT_WORDS`
- `"eleven"` — `COUNT_WORDS`
- `"five"` — `COUNT_WORDS`
- `"four"` — `COUNT_WORDS`
- `"nine"` — `COUNT_WORDS`
- `"occurrence"` — `OCCURRENCE_STEM`
- `"occurrences"` — `OCCURRENCE_WORD`
- `"one"` — `COUNT_WORDS`
- `"seven"` — `COUNT_WORDS`
- `"single"` — `COUNT_WORDS`
- `"six"` — `COUNT_WORDS`
- `"ten"` — `COUNT_WORDS`
- `"text"` — `KEY_VALUE`
- `"three"` — `COUNT_WORDS`
- `"twelve"` — `COUNT_WORDS`
- `"two"` — `COUNT_WORDS`

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
- `"dealtSign"` — `DEFAULT_BRANCH_SHAPES`
- `"default:"` — `DEFAULT_BRANCH_SHAPES`
- `"digits"` — `SHAPE_STEP`
- `"frozen/protocol-keys.ts"` — `FROZEN_PATH`
- `"gameBuild"` — `FROZEN_DATE_FIELD`
- `"manageBattleEffects("` — `SWITCH_ANCHOR`
- `"marker"` — `DEFAULT_BRANCH_SHAPES`
- `"markerAt"` — `DEFAULT_BRANCH_SHAPES`
- `"markerLength"` — `DEFAULT_BRANCH_SHAPES`
- `"quoted"` — `SHAPE_STEP`
- `"segment-key"` — `SHAPE_STEP`
- `"text"` — `SHAPE_STEP`
- `"{"` — `BLOCK_OPEN`
- `"}"` — `BLOCK_CLOSE`

### `tools/recorded-material.ts`

- `".json"` — `RECORDING_SUFFIX`
- `"/"` — `PATH_SEPARATOR`

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
- `game:buffs`
- `game:client`
- `game:help`
- `game:keys`
- `game:readings`
- `game:shape`
- `game:skills`
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
- `src/game/`
- `src/runtime/`
- `src/ui/`
- `tests/`
- `tests/core/`
- `tests/e2e/`
- `tests/game/`
- `tests/libs/`
- `tests/repository/`
- `tests/runtime/`
- `tests/tools/`
- `tests/ui/`
- `tools/`

## Files

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
- `frozen/buff-bits.ts`
- `frozen/help-phrases.ts`
- `frozen/protocol-keys.ts`
- `frozen/skill-durations.ts`
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
- `src/game/browser-console.ts`
- `src/game/browser-file.ts`
- `src/game/browser-store.ts`
- `src/game/browser-surroundings.ts`
- `src/game/browser-time.ts`
- `src/game/fight-capture.ts`
- `src/game/fight-place.ts`
- `src/game/game-battle.ts`
- `src/game/game-build.ts`
- `src/game/game-dictionary.ts`
- `src/game/game-hero.ts`
- `src/game/game-place.ts`
- `src/game/game-tooltip.ts`
- `src/game/game-value.ts`
- `src/game/payload-envelope.ts`
- `src/game/warrior-snapshot.ts`
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
- `tests/e2e/game-page.ts`
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
- `tests/game/browser-clock.test.ts`
- `tests/game/browser-console.test.ts`
- `tests/game/browser-file.test.ts`
- `tests/game/browser-frame.test.ts`
- `tests/game/browser-interval.test.ts`
- `tests/game/browser-store.test.ts`
- `tests/game/browser-surroundings.test.ts`
- `tests/game/fight-capture.test.ts`
- `tests/game/game-battle.test.ts`
- `tests/game/game-build.test.ts`
- `tests/game/game-dictionary.test.ts`
- `tests/game/game-hero.test.ts`
- `tests/game/game-place.test.ts`
- `tests/game/game-tooltip.test.ts`
- `tests/game/payload-envelope.test.ts`
- `tests/game/recorded-session.test.ts`
- `tests/game/warrior-entries.test.ts`
- `tests/game/warrior-snapshot.test.ts`
- `tests/libs/errors.test.ts`
- `tests/libs/html-text.test.ts`
- `tests/libs/json-text.test.ts`
- `tests/libs/number-range.test.ts`
- `tests/libs/number-text.test.ts`
- `tests/libs/text-walk.test.ts`
- `tests/libs/unknown-value.test.ts`
- `tests/markdown-document.ts`
- `tests/panel-view.ts`
- `tests/rebuilding-battle.ts`
- `tests/recorded-fights.ts`
- `tests/recording-sources.ts`
- `tests/register-table.ts`
- `tests/repository/assert-imports.test.ts`
- `tests/repository/broad-catches.test.ts`
- `tests/repository/browser-suite-keys.test.ts`
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
- `tests/runtime/engine-search.test.ts`
- `tests/runtime/failure-fate.test.ts`
- `tests/runtime/fight-file.test.ts`
- `tests/runtime/live-fight.test.ts`
- `tests/runtime/margometer-runtime.test.ts`
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
- `tests/tools/buff-bit-table.test.ts`
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
- `tests/tools/game-client-source.test.ts`
- `tests/tools/game-readings.test.ts`
- `tests/tools/help-article.test.ts`
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
- `tools/buff-bit-table.ts`
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
- `tools/game-client-source.ts`
- `tools/game-readings.ts`
- `tools/help-article.ts`
- `tools/help-claim-register.ts`
- `tools/margometer-tool-error.ts`
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
- `tools/turn-count.ts`
- `tools/turn-reading.ts`
