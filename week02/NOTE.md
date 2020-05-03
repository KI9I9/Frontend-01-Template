# 第二周

- 编程语言通识与 JavaScript 语言设计
- 词法，类型



## 编程语言通识

### 语言按语法分类

+ 非形式语言
  - 中文
  - 英文
+ 形式语言（乔姆斯基谱系）
  + 0- 型文法（无限制文法或短语结构文法）包括所有的文法。?::=?
  + 1- 型文法（上下文相关文法）生成上下文相关语言。 ?<A>?::=?<B>?
  + 2- 型文法（上下文无关文法）生成上下文无关语言。 <A>::=?
  + 3- 型文法（正规文法）生成正则语言。 <A>::=<A>?


### 形式语言产生式

+ BNF
  - 语法结构
  - 符号
    - ()可以有括号
    - *表示重复多次
    - |表示或
    - +表示至少一次
+ EBNF
+ ABNF


### 图灵完备

+ 命令式(图灵机)
  - goto
  - if 和 while
+ 声明式 lambda
  - 递归

### 类型系统

+ 动态静态
+ 强类型弱类型
+ 符合类型
+ 子类型



## 词法、类型

### Unicode

+ https://www.fileformat.info/info/unicode/
+ https://home.unicode.org

### InputElement

+ WhiteSpace
  - <TAB>
  - <VT>
  - <FF>
  - <SP>
  - <NBSP>
  - <ZWNBSP>
  - <USP>
+ LineTerminator
  - <LF>
  - <CR>
  - <LS>
  - <PS>
+ Comment
+ Token
  - Punctuator
  - IdentifierName
    - Identifier
    - Keywords
    - Future reserved Keywords: enum
  - Literal
    - Number
    - String
    - Boolean
    - Null
    - Undefined

