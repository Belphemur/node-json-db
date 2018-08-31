const {name} = require('./package.json')
const typescript = require('rollup-plugin-typescript3').default()
module.exports = {
  js: 'buble',
  input: 'src/JsonDB.ts',
  format: ['cjs', 'es'],
  filename: name + '[suffix].js',
  css: true,
  plugins: [
    typescript
  ],
  'name': name
}
