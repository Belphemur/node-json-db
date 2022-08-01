# [2.0.0](https://github.com/Belphemur/node-json-db/compare/v1.6.0...v2.0.0) (2022-08-01)


### Bug Fixes

* **Array:** Fix array not properly async ([26355b0](https://github.com/Belphemur/node-json-db/commit/26355b0b72697783d95a6fd817ba51ff146ff6f6))
* **HumanReadable:** Fix missing humanreadable ([13e51d9](https://github.com/Belphemur/node-json-db/commit/13e51d930eb93548ecb6b4dd1736d45eb4ed5e5b))
* **JsonAdapter:** Don't override the data property ([817c581](https://github.com/Belphemur/node-json-db/commit/817c581037bcf3268863264de256cd966dc66f62))


### Features

* **Adapter:** Add concept of adapter to read and write data ([fcea4bb](https://github.com/Belphemur/node-json-db/commit/fcea4bbd44a5dab9ce0857d14831686c5b190be4))
* **Adapter:** Let the user decide what adapter to use if they want to tweak the inner working ([c8f264b](https://github.com/Belphemur/node-json-db/commit/c8f264b1f71d4e1d0c72fe9954134a0af7c4d10f)), closes [#448](https://github.com/Belphemur/node-json-db/issues/448)
* **Async:** All the method are now async/await ([ab63e82](https://github.com/Belphemur/node-json-db/commit/ab63e8202456c0d43167df27dcbd77a403e8bd07)), closes [#171](https://github.com/Belphemur/node-json-db/issues/171)
* **Async:** Make the whole library async ([764cdf4](https://github.com/Belphemur/node-json-db/commit/764cdf4484f21c2d05c98c39814cc9573f2bf822)), closes [#444](https://github.com/Belphemur/node-json-db/issues/444)
* **AtomicFileAdapter:** Add support for fsync ([4a51239](https://github.com/Belphemur/node-json-db/commit/4a51239f492a4f6b1f15e14ce2e468b363802608))
* **Configuration:** Force giving a config object to the constructor ([002a72a](https://github.com/Belphemur/node-json-db/commit/002a72aff02fbf516c5c47b0d98bfe5eda4043d2))


### BREAKING CHANGES

* **Async:** Every method of the library is now async and returns a promise.
* **Configuration:** We now need to receive the JsonDBConfig object in the constructor

# [1.6.0](https://github.com/Belphemur/node-json-db/compare/v1.5.0...v1.6.0) (2022-06-30)


### Features

* **Array:** Add support for nested array ([854422f](https://github.com/Belphemur/node-json-db/commit/854422f5855acd397a9027c011a66b142052d84e)), closes [#422](https://github.com/Belphemur/node-json-db/issues/422) [#417](https://github.com/Belphemur/node-json-db/issues/417)

# [1.5.0](https://github.com/Belphemur/node-json-db/compare/v1.4.1...v1.5.0) (2022-03-11)


### Features

* **FSYNC:** Optional fsync when saving the database ([d1c67fd](https://github.com/Belphemur/node-json-db/commit/d1c67fd35658ad1ec0c359aafc1cb7e763e0cce7)), closes [#372](https://github.com/Belphemur/node-json-db/issues/372)

## [1.4.1](https://github.com/Belphemur/node-json-db/compare/v1.4.0...v1.4.1) (2021-09-22)


### Bug Fixes

* **Docs:** Be sure the doc contains Config ([d626568](https://github.com/Belphemur/node-json-db/commit/d62656816ac728b68eef96758b0605b29153b7e9))

# [1.4.0](https://github.com/Belphemur/node-json-db/compare/v1.3.0...v1.4.0) (2021-09-13)


### Features

* **GetIndexValue:** Get index of a value in an array ([d56de61](https://github.com/Belphemur/node-json-db/commit/d56de6142726654d2e577d22ce474ae60e0197ce)), closes [#191](https://github.com/Belphemur/node-json-db/issues/191)

# [1.3.0](https://github.com/Belphemur/node-json-db/compare/v1.2.1...v1.3.0) (2021-03-07)


### Features

* **typing:** Add basic typing to the lib for TS ([5309e9e](https://github.com/Belphemur/node-json-db/commit/5309e9e633f25fa2590f693e0e50ebb30ea57578))

## [1.2.1](https://github.com/Belphemur/node-json-db/compare/v1.2.0...v1.2.1) (2021-03-07)


### Bug Fixes

* **getIndex:** Improve documentation ([9951c6d](https://github.com/Belphemur/node-json-db/commit/9951c6de7d09adaa66620584e592e1151ba60e5d))

# [1.2.0](https://github.com/Belphemur/node-json-db/compare/v1.1.0...v1.2.0) (2021-03-07)


### Bug Fixes

* **Convention:** Fixed quotes ([dd4494c](https://github.com/Belphemur/node-json-db/commit/dd4494c321172037ff51af284911ea64279e1455))
* **README:** Update documentation ([b0f8ad4](https://github.com/Belphemur/node-json-db/commit/b0f8ad48212a9e4b76362b42395d937ed970ba58))


### Features

* **filename:** Support non json file extensions ([e219124](https://github.com/Belphemur/node-json-db/commit/e2191246c50d9477a43c038975589a9d1da5a58d))
* **getIndex:** Support Numerical id ([6a8ee73](https://github.com/Belphemur/node-json-db/commit/6a8ee7381345ab74b851ffe2092285b09ecce922))

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
