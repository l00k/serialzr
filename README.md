# Serializer

JS library for serializing and deserializing complex objects into JSON and back.

![NPM Version](https://img.shields.io/npm/v/serialzr)
![GitHub top language](https://img.shields.io/github/languages/top/l00k/serialzr)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/l00k/serialzr/ci.yaml?branch=master)
![Codecov](https://img.shields.io/codecov/c/github/l00k/serialzr)

## Features
- two-way serialization / deserialization without specifying target type - thanks to `@type` property
- defining exposed / excluded properties via groups or graph
- defining custom serialization / deserialization functions (per type or per property)
- built-in support for array of objects and `Record<string, T>` maps


- zero dependencies
- full TypeScript support
- covered with tests

## NPM package
```bash
yarn add serialzr
```
