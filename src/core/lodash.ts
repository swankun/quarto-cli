/*
* lodash.ts
*
* piecemeal exports of lodash to make the tree-shaker happier
*
* Copyright (C) 2022 by RStudio, PBC
*
*/

// @deno-types="../resources/typings/lodash/cloneDeep.d.ts";
import ld_cloneDeep from "lodash/cloneDeep";

// @deno-types="../resources/typings/lodash/debounce.d.ts";
import ld_debounce from "lodash/debounce";

// @deno-types="../resources/typings/lodash/difference.d.ts";
import ld_difference from "lodash/difference";

// @deno-types="../resources/typings/lodash/escape.d.ts";
import ld_escape from "lodash/escape";

// @deno-types="../resources/typings/lodash/forEach.d.ts";
import ld_forEach from "lodash/forEach";

// @deno-types="../resources/typings/lodash/isArray.d.ts";
import ld_isArray from "lodash/isArray";

// @deno-types="../resources/typings/lodash/mergeWith.d.ts";
import ld_mergeWith from "lodash/mergeWith";

// @deno-types="../resources/typings/lodash/shuffle.d.ts";
import ld_shuffle from "lodash/shuffle";

// @deno-types="../resources/typings/lodash/template.d.ts";
import ld_template from "lodash/template";

// @deno-types="../resources/typings/lodash/toString.d.ts";
import ld_toString from "lodash/toString";

// @deno-types="../resources/typings/lodash/uniq.d.ts";
import ld_uniq from "lodash/uniq";

// @deno-types="../resources/typings/lodash/uniqBy.d.ts";
import ld_uniqBy from "lodash/uniqBy";

// @deno-types="../resources/typings/lodash/isObject.d.ts";
import ld_isObject from "lodash/isObject";

// @deno-types="../resources/typings/lodash/isEqual.d.ts";
import ld_isEqual from "lodash/isEqual";

// @deno-types="../resources/typings/lodash/orderBy.d.ts";
import ld_orderBy from "lodash/orderBy";

export const cloneDeep = ld_cloneDeep;
export const debounce = ld_debounce;
export const difference = ld_difference;
export const each = ld_forEach;
export const forEach = ld_forEach;
export const isArray = ld_isArray;
export const mergeWith = ld_mergeWith;
export const shuffle = ld_shuffle;
export const template = ld_template;
export const toString = ld_toString;
export const uniq = ld_uniq;
export const uniqBy = ld_uniqBy;
export const isObject = ld_isObject;
export const isEqual = ld_isEqual;
export const orderBy = ld_orderBy;
export const escape = ld_escape;
