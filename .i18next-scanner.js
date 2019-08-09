const typescript = require('typescript');
const fs = require('fs');
const path = require('path');

module.exports = {
  input: [
    'src/**/*.{ts,tsx}',
    // Use ! to filter out files or directories
    '!src/**/*.spec.{ts,tsx}',
  ],
  output: './',
  options: {
    debug: true,
    func: {
      list: ['i18next.t', 'i18n.t', 't'],
    },
    trans: {
      defaultsKey: 'defaults',
    },
    lngs: ['en-US', 'es'],
    defaultLng: 'en-US',
    ns: ['translation'],
    defaultNs: 'translation',
    defaultValue: '__MISSING__TRANSLATION__',
    resource: {
      loadPath: 'src/i18n/locales/{{lng}}.json',
      savePath: 'src/i18n/locales/{{lng}}.json',
    },
    nsSeparator: ':',
    keySeparator: false,
  },
  transform: function transform(file, enc, done) {
    const { base, ext } = path.parse(file.path);
    // custom transform for typescript files
    if (['.ts', '.tsx'].includes(ext) && !base.includes('.d.ts')) {
      const content = fs.readFileSync(file.path, enc);

      // convert ts code into es2018 code that the parser can injest
      const { outputText } = typescript.transpileModule(content, {
        compilerOptions: {
          target: 'es2018',
        },
        fileName: path.basename(file.path),
      });

      this.parser.parseTransFromString(outputText);
      this.parser.parseFuncFromString(outputText);
    }

    done();
  },
};
