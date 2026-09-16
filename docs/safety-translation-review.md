# Safety translation review

This pass compared 29 high-priority messages in every one of the 44 language
packs against the English source (1,276 message comparisons). It was a direct
editorial review by the coding assistant, without an external translation service.
It is not independent native-speaker certification or a review of every UI string.

## Meaning checked

- Stay on shore, do not swim alone, and never enter under a red flag.
- Offshore means from land towards water; onshore does not automatically mean safer.
- Favourable wind and waves still require checking beach flags.
- Missing data does not support a swim rating; stale readings do not support a fresh recommendation.
- No warning reported and no increased risk in a saved record are not safety clearance.
- An unsuccessful refresh does not clear an earlier adverse signal.
- Keep out until the adverse signal has ended and fresh information confirms that change.
- A wind assessment does not establish water quality, currents, local waves or temperature.
- Current samples and warnings cannot establish conditions at a future time.
- A failed sample, uncertain warning coverage and the relevant lake section require checking.
- Application thresholds are warnings, not safe limits; local signals take priority.

## Corrections

51 strings were corrected across 19 packs:

- Hungarian: made the stay-on-shore instruction direct, clarified that no warning
  does not mean safe swimming, and changed “above” to “from” at the inclusive gust threshold.
- Nynorsk: corrected negation word order, the word for “discouraged”, the imperative
  “be careful”, saved-data wording and warning terminology. Bokmål warning headings
  now explicitly identify a weather hazard warning rather than just a forecast.
- Serbian: removed stray Latin letters from Cyrillic sentences and corrected
  entry-point, retained-reading and safety-limit wording.
- Maltese: made the red-flag prohibition explicit, corrected the fatigue sentence,
  and specified remaining outside the water while an adverse signal persists.
- Swedish: made the keep-out-of-water instruction idiomatic.
- Armenian: distinguished “no assessment is given” from “not recommended” in the
  stale-data explanation. Armenian and Georgian now retain “moderate”, rather than
  weakening it to “light”, in the favourable-condition explanation.
- Azerbaijani and Kazakh: restored “whether the earlier signal still applies”,
  rather than presuming it remains in force.
- Italian and Spanish: restored the explicit reference to local lifeguards.
- Czech, Slovak, Russian, Ukrainian, Belarusian, Bulgarian and Greek: clarified
  that the basin instruction concerns the relevant part of the lake.

## Reviewed keys

```text
safety.dangerTitle
safety.cautionDescription
safety.unknownDescription
safety.goodDescription
checklist.flagText
conditions.offshore
conditions.onshore
decision.wind.safe
outlook.staleText
outlook.windText
outlook.normal
weatherAlerts.none
weatherAlerts.danger
lakeDecision.unresolvedAction
lakeDecision.avoidAction
lakeDecision.limitedAction
lakeDecision.localWater
lakeDecision.futureWarnings
lakeDecision.failedSample
lakeDecision.regionalStorm
lakeDecision.warningsUnknown
windAdvice.limits
windAdvice.offshoreThreshold
windAdvice.gustThreshold
windAdvice.noDataHelp
windAdvice.onshore
balaton.sampleNote
balaton.stormNote
disclaimer.text
```

Related Nynorsk, Serbian and Maltese messages were also inspected where an issue
recurred. No assessment logic or warning thresholds were changed. Structural
validation checks all packs for complete keys and matching interpolation variables;
those checks cannot establish semantic correctness. Native-speaker review remains
separate, particularly for less familiar languages and specialist terminology.

Validation completed: all 44 packs pass structural validation, all 102 tests pass,
and ESLint, the production build and `git diff --check` pass.
