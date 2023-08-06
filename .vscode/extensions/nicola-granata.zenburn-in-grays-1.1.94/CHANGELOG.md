# `Zenburn In Grays` Theme Change Log 

> Note: [`Development`] sections in *Changelog* are addressed to the developer to remind him of any important changes that occurred during the writing of the code and do not always concern improvements made to the extension or to the theme.

## [1.1.94]
- [`Themes`] `Dark Matter` suite only: added `Anthracite` sub-theme, with extra cold gray background;
- [`Themes`] Deprecated `Zenburn Cold Gray` in favor of `Zenburn in Grays`;
- [`Development`] Added function for deprecate old themes that insert deprecation in favor of theme indicated;
- [`Development`] Short badge on `README.md`;
- [`Development`] Improved VSCode Themes Master UI PHP and JS functions to auto-unselect harmful build options after build theme/extension.

## [1.1.85]
- [`Themes`] Reintroduced `Midnight` sub-theme on certain combination of colors for all my skins;
- [`Development`] Added code based on array `excluded_combo` that can exclude some combinations of color variants in sub-theme for unsightliness or similarity to other skin due to filtering: basically i've excluded some skins based on cold colors from `Low Blue` sub-theme and some skins based on warm colors from `Midnight` sub-theme.

## [1.1.83]
- [`Themes`] Dark Matter only: added `Midnight` sub-theme inspired by *Telegram X Midnight Theme*. Appearance of `In Grays` and `Cold Gray` skins with `Midnight` background is unsightly;
- [`Development`] Added variable that overwrites the relative colors of the user interface with the relativized colors of the sub-theme for a better management of the color combination;
- [`Development`] Added code that get sub-theme descriptions and insert them in `README.md`.
- [`Development`] Added function that send Themes directly in VS Code Extensions Folder and Kill Reload VS Code executable for testing theme without debugging: this solve the issue to to select secondary skin twice before VS Code load her correctly.

## [1.1.79]
- [`Themes`] Improvements to some UI colors;
- [`Development`] Optimized some functions for themes generation;

## [1.1.71]
- [`Themes`] Added Nirvana sub-theme group, with a warm variation like Low Blue Light but only on token colors.
- [`Themes`] Improvements to some UI colors;
- [`Themes`] Fix some colors in themes skins and in Setting;
- [`Development`] Add the function that rebuild missing generic token colors scopes, obtaining them from the analysis of different TextMate Themes. This function also build a global token scopes dictionary for futures implementations;
- [`Development`] Optimized some functions for themes generation;
- [`Development`] Automated assignmet of all Token Colors Themes to Skins based on type (dark/light);
- [`Development`] Added function that convert existing TextMate Token Colors Themes in VSCode Token Colors and apply it to skins.

## [1.1.59]

- [`Themes`] Fix some colors in themes skins;
- [`Development`] Update UI of `VSCode Themes Master`;
- [`Development`] Fix some bugs in `VSCode Themes Master`;

## [1.1.54]

- [`Development`] Fix links in README.md.

## [1.1.53]

- [`Themes`] Colors of Explorer relativized to editor background color and not to active border / active tab (based on theme).
- [`Development`] Themes rebuilt with integration of some colors;

## [1.0.10]

- [`Themes`] Restyled icon.
- [`Themes`] Themes rebuilt using my `VSCode Themes Master` (a localhost PHP Script);
- [`Themes`] Addedd some skins;
- [`Themes`] Renamed some skins;
- [`Themes`] Modified colors of skins;

## [1.0.6]

- [`Themes`] Restyled icon.

## [1.0.2]

- [`Themes`] Restyled icon.
- [`Themes`] `Sugar Paper` inactive color more brighten.
- [`Themes`] Editor background color darkened.

## [1.0.1]

- [`Themes`] The prefix `$` for PHP variables is more visible.
- [`Themes`] `Asphalt` secondary color darkened.

## [1.0.0]

- [`Themes`] First release of `Zenburn Cold Gray Theme`
