import { getOwnNames, createSandBox, globalObj } from './share/util'
import { version } from '../package.json'
import { parse, Options } from 'acorn'
import Scope from './scope'

import { hoist } from './evaluate_n/helper'
import evaluate from './evaluate_n'

export interface SvalOptions {
  ecmaVer?: 3 | 5 | 6 | 7 | 8 | 9 | 10 | 2015 | 2016 | 2017 | 2018 | 2019
  sandBox?: boolean
}

class Sval {
  static version: string = version

  private options: Options = {}
  private scope = new Scope(null, true)

  exports: { [name: string]: any } = {}

  constructor(options: SvalOptions = {}) {
    let { ecmaVer, sandBox = true } = options

    if (
      [
        3, 5, 6, 7, 8, 9, 10,
        2015, 2016, 2017, 2018, 2019
      ].indexOf(ecmaVer) === -1
    ) {
      ecmaVer = 10
    }

    this.options.ecmaVersion = ecmaVer

    if (sandBox) {
      // Shallow clone to create a sandbox
      const win = createSandBox()
      this.scope.let('window', win)
      this.scope.let('this', win)
    } else {
      this.scope.let('window', globalObj)
      this.scope.let('this', globalObj)
    }
    
    this.scope.const('exports', this.exports = {})
  }

  import(nameOrModules: string | { [name: string]: any }, mod?: any) {
    if (typeof nameOrModules === 'string') {
      nameOrModules = { [nameOrModules]: mod }
    }

    if (typeof nameOrModules !== 'object') return

    const names = getOwnNames(nameOrModules)
    for (const index in names) {
      const name = names[index]
      this.scope.var(name, nameOrModules[name])
    }
  }

  run(code: string) {
    const ast = parse(code, this.options) as any
    hoist(ast, this.scope)
    evaluate(ast, this.scope)
  }
}

export default Sval