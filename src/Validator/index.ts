/*
 * @adonisjs/validator
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import {
  TypedSchema,
  ValidatorNode,
  CompilerOutput,
  ParsedTypedSchema,
  ValidationContract,
  ErrorReporterConstructorContract,
} from '@ioc:Adonis/Core/Validator'

import { schema } from '../Schema'
import { Compiler } from '../Compiler'
import { rules, getRuleFn } from '../Rules'
import * as validations from '../Validations'
import { VanillaErrorReporter } from '../ErrorReporter'
import { exists, existsStrict, isObject } from './helpers'

/**
 * The compiled output runtime helpers
 */
const HELPERS = { exists: exists, isObject }

/**
 * Helpers that has strict checking for non-existing values
 */
const STRICT_HELPERS = { exists: existsStrict, isObject }

/**
 * Cache to store the compiled schemas
 */
const COMPILED_CACHE: { [key: string]: CompilerOutput<any> } = {}

/**
 * An object of messages to use as fallback, when no custom
 * messages are defined.
 */
const NOOP_MESSAGES = {}

/**
 */
const validate = <T extends ParsedTypedSchema<TypedSchema>>(
  validator: ValidatorNode<T>
): Promise<T['props']> => {
  let Reporter: ErrorReporterConstructorContract = validator.reporter || VanillaErrorReporter
  const bail = validator.bail === undefined ? false : validator.bail
  const reporter = new Reporter(validator.messages || NOOP_MESSAGES, bail)
  const helpers = validator.existsStrict === true ? STRICT_HELPERS : HELPERS

  /**
   * Compile everytime, when no cache is defined
   */
  if (!validator.cacheKey) {
    return new Compiler(validator.schema.tree).compile()(
      validator.data,
      validations,
      reporter,
      helpers,
    ) as Promise<T['props']>
  }

  /**
   * Look for compiled function or compile one
   */
  let compiledFn = COMPILED_CACHE[validator.cacheKey]
  if (!compiledFn) {
    compiledFn = new Compiler(validator.schema.tree).compile()
    COMPILED_CACHE[validator.cacheKey] = compiledFn
  }

  /**
   * Execute compiled function
   */
  return compiledFn(validator.data, validations, reporter, helpers)
}

/**
 * Extend validator by adding a new rule
 */
const addRule = (name: string, ruleDefinition: ValidationContract<any>) => {
  /**
   * Adding to the rules object, so that one can reference the method. Also
   * interface of rules list has to be extended seperately.
   */
  rules[name] = getRuleFn(name)
  validations[name] = ruleDefinition
}

/**
 * Add a new type
 */
const addType = (name: string, typeDefinition: any) => {
  schema[name] = typeDefinition
}

/**
 * Module available methods/properties
 */
export const validator = {
  addRule,
  addType,
  validate,
}
