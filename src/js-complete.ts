import { CompletionItemProvider, workspace, TextDocument, Position, CancellationToken, CompletionContext, 
  ProviderResult, CompletionItem, CompletionList, CompletionItemKind} from "vscode";
const fs = require('fs')
const path = require('path')
const _  = require('lodash')

export class JsCompletionItemProvider implements CompletionItemProvider {
 // 获取对象属性和方法
 getFieldMethod(content, objName) {
    let fieldObj = _.get(content, objName, '')
    if (typeof fieldObj === 'object') {
      let ret = []
      for (const fieldKey in fieldObj.field) {
        if (fieldObj.field.hasOwnProperty(fieldKey)) {
          ret.push(new CompletionItem(fieldKey, CompletionItemKind.Field))
        }
      }
      for (const methodKey in fieldObj.method) {
        if (fieldObj.method.hasOwnProperty(methodKey)) {
          ret.push(new CompletionItem(methodKey, CompletionItemKind.Method))
        }
      }
      return ret
    }
    return null
 }

  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
    let config = workspace.getConfiguration('vue-helper')
    if (config.tips) {
      let filePath = path.resolve(workspace.rootPath, config.tips)
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const content = JSON.parse(data);
        let prevText = document.lineAt(position.line).text.trim()
        if (prevText.endsWith(')')) {
          // 方法参数提示
          let ret = prevText.replace(/.*\.(.*)\(\)$/gi, '$1')
          for (const key in content) {
            if (content.hasOwnProperty(key)) {
              const obj = content[key];
              for (const keyMethod in obj.method) {
                if (obj.method.hasOwnProperty(keyMethod)) {
                  if (keyMethod === ret && obj.method[keyMethod].params) {
                    if (Array.isArray(obj.method[keyMethod].params)) {
                      return obj.method[keyMethod].params.map(keyItem => {
                        return new CompletionItem(keyItem, CompletionItemKind.Field)
                      })
                    } else {
                      return [new CompletionItem(obj.method[keyMethod].params, CompletionItemKind.Field)]
                    }
                  }
                }
              }
            }
          }
        }
        prevText = prevText.substring(0, prevText.length - 1)
        let lineText = ''
        if (prevText.includes('.')) {
          lineText = prevText.replace(/.*\.(.*)$/gi, '$1')
        } else {
          lineText = prevText
        }
        if (lineText.endsWith(')')) {
          // 匹配到方法
          lineText = lineText.replace(/\(.*\)/, '')
          for (const key in content) {
            if (content.hasOwnProperty(key)) {
              const obj = content[key];
              for (const keyMethod in obj.method) {
                if (obj.method.hasOwnProperty(keyMethod)) {
                  if (keyMethod === lineText && obj.method[keyMethod].return && obj.method[keyMethod].returnType && obj.method[keyMethod].returnType === 'object') {
                    return this.getFieldMethod(content, obj.method[keyMethod].return)
                  }
                }
              }
            }
          }
        } else {
          // 域
          return this.getFieldMethod(content, lineText)
        }
      }
    }
    return null
  }
}