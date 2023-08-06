# NoParanoia Theme
## NoParanoia theme for Visual Studio Code

![Theme example](https://raw.githubusercontent.com/N0Paranoia/vsc-NoParanoia-theme/master/images/NoParanoiaScreenshot.png)

### Getting started
* You can install the NoParanoia theme trough the Visual Studio Code marketplace.
* For the source code you can check my github page here https://github.com/N0Paranoia/vsc-NoParanoia-theme

### Issues and requests
* You can post your issues or change request here https://github.com/N0Paranoia/vsc-NoParanoia-theme/issues

### Multiple fonts setup (Operator Mono alternative)
The fonts used in de screenshot are "Fira Code" and "Script12 BT".
If you want to use the fonts like they are shown in the screenshot you can follow the guide below:

1. Download and install "Fira Code" and "Script12 BT".
1. Install VSCode Extension: Custom CSS and JS Loader.
1. Create a file named styles.css in a convenient location.
1. paste the following code in to your styles.css:
```css
.mtk3,
.mtk11,
.mtk25,
.mtk16,
.mtk4,
.mtk10,
.mtk18,
.monaco-icon-label-description-container .label-name {
font-family: "Script12 BT";
font-size: 1.2em;
}
.tabs-container .monaco-icon-label-description-container .label-name,
.sidebar .monaco-icon-label-description-container .label-name,
.quick-open-row .monaco-icon-label-description-container .label-name {
font-family: -apple-system,BlinkMacSystemFont,Segoe WPC,Segoe UI,HelveticaNeue-Light,Ubuntu,Droid Sans,sans-serif;
font-size: 1em;
}
```
5. press command+shift+P (MacOS) or Ctrl+shift+P (Windows/Linux) and type/select ">Preferences: Open Settings (JSON)" and paste the folowing lines in the settings file:
```javascript
"editor.fontFamily": "Fira Code",
"editor.fontLigatures": true,   
"vscode_custom_css.imports": ["file:///[location of your styles.css]"],
```
6. press command+shift+P (MacOS) or Ctrl+shift+P (Windows/Linux) and type/select ">Reload Custom CSS an JS"



**Enjoy!**
