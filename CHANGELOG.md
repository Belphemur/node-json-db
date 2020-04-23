# [1.1.0](https://github.com/Belphemur/node-json-db/compare/v1.0.3...v1.1.0) (2020-04-23)


### Features

* add some array utils ([8f9d2dd](https://github.com/Belphemur/node-json-db/commit/8f9d2dd01950d3441fa8badd98689caeadf16e9c))

## [1.0.3](https://github.com/Belphemur/node-json-db/compare/v1.0.2...v1.0.3) (2019-12-11)


### Bug Fixes

* **Array:** Support dot and number in name ([d4ce40a](https://github.com/Belphemur/node-json-db/commit/d4ce40adaa3b0b51cbc57060ee77eccd317cd136)), closes [#95](https://github.com/Belphemur/node-json-db/issues/95)

## [1.0.2](https://github.com/Belphemur/node-json-db/compare/v1.0.1...v1.0.2) (2019-10-15)


### Bug Fixes

* **Array:** Add support for dash in array name ([b271507](https://github.com/Belphemur/node-json-db/commit/b2715070023a07a29c2d66268b1f69d35cf9229d)), closes [#98](https://github.com/Belphemur/node-json-db/issues/98)

## [1.0.1](https://github.com/Belphemur/node-json-db/compare/v1.0.0...v1.0.1) (2019-07-22)


### Bug Fixes

* **README:** Update documentation ([c7a631b](https://github.com/Belphemur/node-json-db/commit/c7a631b)), closes [#90](https://github.com/Belphemur/node-json-db/issues/90) [#85](https://github.com/Belphemur/node-json-db/issues/85)

# [1.0.0](https://github.com/Belphemur/node-json-db/compare/v0.11.0...v1.0.0) (2019-06-24)


### Features

* **Packaging:** Use es6 module packaging ([f5cd8fd](https://github.com/Belphemur/node-json-db/commit/f5cd8fd))


### BREAKING CHANGES

* **Packaging:** The default export has been removed. You need to do a deconstruction import to load the library now.

import JsonDB from 'node-json-db'
becomes
import {JsonDB} from 'node-json-db'

# [0.11.0](https://github.com/Belphemur/node-json-db/compare/v0.10.0...v0.11.0) (2019-03-15)


### Bug Fixes

* **Separator:** Fix still using the slash as separator. ([1781e5c](https://github.com/Belphemur/node-json-db/commit/1781e5c))


### Features

* **Config:** Add Config file to setup the Database ([a740b91](https://github.com/Belphemur/node-json-db/commit/a740b91))

# [0.10.0](https://github.com/Belphemur/node-json-db/compare/v0.9.2...v0.10.0) (2019-02-20)


### Features

* **Filter:** Add filtering feature ([fa81531](https://github.com/Belphemur/node-json-db/commit/fa81531))

## [0.9.2](https://github.com/Belphemur/node-json-db/compare/v0.9.1...v0.9.2) (2018-11-18)


### Bug Fixes

* **Packaging:** Add type to package. ([aef8826](https://github.com/Belphemur/node-json-db/commit/aef8826)), closes [#58](https://github.com/Belphemur/node-json-db/issues/58) [#57](https://github.com/Belphemur/node-json-db/issues/57)

## [0.9.1](https://github.com/Belphemur/node-json-db/compare/v0.9.0...v0.9.1) (2018-10-10)


### Bug Fixes

* **ArrayInfo:** Returns type of isValid ([dae4e81](https://github.com/Belphemur/node-json-db/commit/dae4e81))

## [0.9.0](https://github.com/Belphemur/node-json-db/compare/v0.7.3...v0.9.0) (2018-09-04)


### Features

* **Exists:** Add exits method ([ddd7b3f](https://github.com/Belphemur/node-json-db/commit/ddd7b3f)), closes [#19](https://github.com/Belphemur/node-json-db/issues/19)
* **find:** Add find feature ([ef81910](https://github.com/Belphemur/node-json-db/commit/ef81910)), closes [#17](https://github.com/Belphemur/node-json-db/issues/17)
