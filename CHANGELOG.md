## [2.4.2](https://github.com/Belphemur/node-json-db/compare/v2.4.1...v2.4.2) (2025-11-07)


### Bug Fixes

* restore class exports for DataError, DatabaseError, and adapters ([#1071](https://github.com/Belphemur/node-json-db/issues/1071)) ([210a519](https://github.com/Belphemur/node-json-db/commit/210a51957e215f27342c8da7040552f259cd2589)), closes [#1069](https://github.com/Belphemur/node-json-db/issues/1069)

## [2.4.1](https://github.com/Belphemur/node-json-db/compare/v2.4.0...v2.4.1) (2025-10-30)


### Bug Fixes

* remove type-only export for Config classes ([#1064](https://github.com/Belphemur/node-json-db/issues/1064)) ([7f3325f](https://github.com/Belphemur/node-json-db/commit/7f3325f8476bd172941d9ffb7d111f7fd95ca8f1))

# [2.4.0](https://github.com/Belphemur/node-json-db/compare/v2.3.2...v2.4.0) (2025-10-17)


### Bug Fixes

* **lock:** memory allocation ([c24199a](https://github.com/Belphemur/node-json-db/commit/c24199af6fac416edf35909ad3ea44e2dc5b5253))


### Features

* **locking:** rewrite the locking mechanism to remove dependency ([0beb0ff](https://github.com/Belphemur/node-json-db/commit/0beb0ffad1a66ebe73354a0335c4bf9f5fa514dc))

## [2.3.2](https://github.com/Belphemur/node-json-db/compare/v2.3.1...v2.3.2) (2025-10-16)


### Bug Fixes

* **tests:** fix issue with testing framework ([94e3cfe](https://github.com/Belphemur/node-json-db/commit/94e3cfec0d98612d6fe44244681e3413a037f34b))
* **utf8:** add support for UTF-8 in arrays ([611f6b4](https://github.com/Belphemur/node-json-db/commit/611f6b484ca56319f87c064f6aa18b9dafadb7af)), closes [#550](https://github.com/Belphemur/node-json-db/issues/550)

## [2.3.1](https://github.com/Belphemur/node-json-db/compare/v2.3.0...v2.3.1) (2025-01-23)


### Bug Fixes

* override empty file ([024169f](https://github.com/Belphemur/node-json-db/commit/024169ffeab114eae993c83c1cfbb9d355c8e178)), closes [#844](https://github.com/Belphemur/node-json-db/issues/844)

# [2.3.0](https://github.com/Belphemur/node-json-db/compare/v2.2.0...v2.3.0) (2023-10-16)


### Bug Fixes

* add trow erros ([c71b446](https://github.com/Belphemur/node-json-db/commit/c71b4468435935e01b5b0872a9320090b3f22fc3))
* increment test coverage ([33a7e93](https://github.com/Belphemur/node-json-db/commit/33a7e93e13e942cd7fe4b7acddbbb4ff8f0bc2a9))


### Features

* adjust to support others properties ([58911b5](https://github.com/Belphemur/node-json-db/commit/58911b5727713081ad18f21b3ff16629434923d4))
* change method name ([889d55e](https://github.com/Belphemur/node-json-db/commit/889d55eeddaf609fcde87284c25b6d3ee4fef40b))
* new toPath method ([7d224c3](https://github.com/Belphemur/node-json-db/commit/7d224c3113cc40a02d44921dea53fae3fff43fb2))
* **path:** add method to transform a usual "route" into a path for the db ([c389c7c](https://github.com/Belphemur/node-json-db/commit/c389c7c3cfad57228a72112a249acb70b6400f13))
* test wrong propertyName ([6a95687](https://github.com/Belphemur/node-json-db/commit/6a95687ea3528ba455a19ee3e64417a4edc099f8))

# [2.2.0](https://github.com/Belphemur/node-json-db/compare/v2.1.5...v2.2.0) (2023-04-09)


### Bug Fixes

* **Array:** Fix issue with array that have numerical property key ([db7b5cb](https://github.com/Belphemur/node-json-db/commit/db7b5cb0672e9371a9eb97531d8dfdc7ffa1c406)), closes [#571](https://github.com/Belphemur/node-json-db/issues/571)


### Features

* **getObjectDefault:** Add method `getObjectDefault` to get an object or a default value when the path is leading to non existing data. ([d47786b](https://github.com/Belphemur/node-json-db/commit/d47786bf76529f9bb6f878e138893c06a1f4b491)), closes [#582](https://github.com/Belphemur/node-json-db/issues/582)

## [2.1.5](https://github.com/Belphemur/node-json-db/compare/v2.1.4...v2.1.5) (2023-03-14)


### Performance Improvements

* **Interoperability:** Export underlying adapter type to let developers customize the storage logic ([cfa874e](https://github.com/Belphemur/node-json-db/commit/cfa874ed9c43500578131470e391142464d9f03b)), closes [#568](https://github.com/Belphemur/node-json-db/issues/568)

## [2.1.4](https://github.com/Belphemur/node-json-db/compare/v2.1.3...v2.1.4) (2023-01-24)


### Performance Improvements

* **FileAdapter:** Remove need for atomically. With RWLock we have all we need. ([4b52670](https://github.com/Belphemur/node-json-db/commit/4b526703c78f8c2e0ff8cdcd0e198ffba0cd5219))

## [2.1.3](https://github.com/Belphemur/node-json-db/compare/v2.1.2...v2.1.3) (2022-09-21)


### Performance Improvements

* **Locking:** Use proper read write lock instead of one lock for all operation ([f3f422a](https://github.com/Belphemur/node-json-db/commit/f3f422a5f4cea27f339da8c9adde7ebad251396c)), closes [#490](https://github.com/Belphemur/node-json-db/issues/490)

## [2.1.2](https://github.com/Belphemur/node-json-db/compare/v2.1.1...v2.1.2) (2022-09-09)


### Bug Fixes

* **Concurrency:** Fix issue with concurrent push from different sources ([daae2bb](https://github.com/Belphemur/node-json-db/commit/daae2bb6310d79c7479e4a50b9bde63ac93d0d02)), closes [#484](https://github.com/Belphemur/node-json-db/issues/484)


### Performance Improvements

* **Concurrency:** Be sure that only one read or one write can be done at the same time ([1cf0038](https://github.com/Belphemur/node-json-db/commit/1cf0038fc344ab1c1edd3f45ad3660d7ba04daaa))
* **Errors:** Export errors for easier error management in other projects ([60c90f8](https://github.com/Belphemur/node-json-db/commit/60c90f862a840576b90af7be375dfc2ed7c0777d)), closes [#479](https://github.com/Belphemur/node-json-db/issues/479)

## [2.1.1](https://github.com/Belphemur/node-json-db/compare/v2.1.0...v2.1.1) (2022-08-26)


### Performance Improvements

* **Config:** Easier way to import the configuration of JsonDB ([e3502c2](https://github.com/Belphemur/node-json-db/commit/e3502c2fcf574c838769a11ac7dbd51268842a87))

# [2.1.0](https://github.com/Belphemur/node-json-db/compare/v2.0.0...v2.1.0) (2022-08-08)


### Bug Fixes

* **Config:** put proper default for ConfigWithAdapter ([8d38302](https://github.com/Belphemur/node-json-db/commit/8d3830267e72831ea2abdd3c6ff4a061f5dc3c40))


### Features

* **Date:** Add support for serializing and deserializing date type ([d7a904e](https://github.com/Belphemur/node-json-db/commit/d7a904e84e6a5c3671d3177508faca217c0c909b)), closes [#362](https://github.com/Belphemur/node-json-db/issues/362)

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
