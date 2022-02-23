/*
* lodash.ts
*
* piecemeal exports of lodash to make the tree-shaker happier
*
* Copyright (C) 2022 by RStudio, PBC
*
*/

// @deno-types="@types/lodash";
import ld_cloneDeep from "lodash/cloneDeep";
// @deno-types="@types/lodash";
import ld_debounce from "lodash/debounce";
// @deno-types="@types/lodash";
import ld_difference from "lodash/difference";
// @deno-types="@types/lodash";
import ld_each from "lodash/each";
// @deno-types="@types/lodash";
import ld_forEach from "lodash/forEach";
// @deno-types="@types/lodash";
import ld_isArray from "lodash/isArray";
// @deno-types="@types/lodash";
import ld_mergeWith from "lodash/mergeWith";
// @deno-types="@types/lodash";
import ld_shuffle from "lodash/shuffle";
// @deno-types="@types/lodash";
import ld_template from "lodash/template";
// @deno-types="@types/lodash";
import ld_toString from "lodash/toString";
// @deno-types="@types/lodash";
import ld_uniq from "lodash/uniq";
// @deno-types="@types/lodash";
import ld_uniqBy from "lodash/uniqBy";
// @deno-types="@types/lodash";
import ld_isObject from "lodash/isObject";
// @deno-types="@types/lodash";
import ld_isEqual from "lodash/isEqual";
// @deno-types="@types/lodash";
import ld_orderBy from "lodash/orderBy";
// @deno-types="@types/lodash";
import ld_escape from "lodash/escape";

export const cloneDeep = ld_cloneDeep;
export const debounce = ld_debounce;
export const difference = ld_difference;
export const each = ld_each;
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
