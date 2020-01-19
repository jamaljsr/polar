# Polar Themes

Polar currently supports two themes, `light` and `dark`, based primarily on the two themes available in [antd](https://next.ant.design/docs/react/customize-theme). The only reason to change the files in this folder is if you wish to customize the global styles provided by antd.

If you update one of these files, be sure to run `yarn theme` to update the CSS files that the app actually uses. The reason for using css files is to simplify swapping the styles during runtime. Since the antd stylesheets are in LESS format, they first need to be compiled into CSS before they can be used in Electron. Compiling the LESS files at runtime would be an unnecessary performance burden on the user as they toggle between the themes.
