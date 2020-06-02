# 浏览器工作原理 ：从URL到网页显示的过程

实际上，对浏览器的实现者来说，他们做的事情，就是把一个 URL 变成一个屏幕上显示的网页。

这个过程是这样的：

- DNS查询

- 浏览器首先使用 HTTP 协议或者 HTTPS 协议，向服务端请求页面；

- 把请求回来的 HTML 代码经过解析，构建成 DOM 树；

- 计算 DOM 树上的 CSS 属性；

- 最后根据 CSS 属性对元素逐个进行渲染，得到内存中的位图；

- 一个可选的步骤是对位图进行合成，这会极大地增加后续绘制的速度；

- 合成之后，再绘制到界面上。

  

# 感性认识

我们从 HTTP 请求回来开始，这个过程并非一般想象中的一步做完再做下一步，而是一条**流水线**。

从 HTTP 请求回来，就产生了流式的数据，后续的 DOM 树构建、CSS 计算、渲染、合成、绘制，都是尽可能地流式处理前一步的产出：即不需要等到上一步骤完全结束，就开始处理上一步的输出，这样我们在浏览网页时，才会看到逐步出现的页面。

# 一、HTTP协议

HTTP 协议是基于 TCP 协议出现的，对 TCP 协议来说，TCP 协议是一条双向的通讯通道，HTTP 在 TCP 的基础上，规定了 Request-Response 的模式。这个模式决定了通讯必定是由浏览器端首先发起的。

大部分情况下，浏览器的实现者只需要用一个 TCP 库，甚至一个现成的 HTTP 库就可以搞定浏览器的网络通讯部分。HTTP 是纯粹的文本协议，它是规定了使用 TCP 协议来传输文本格式的一个应用层协议。

## HTTP 协议格式

### HTTP Method（方法）

- GET
- POST
- HEAD：HEAD 则是跟 GET 类似，只返回请求头，多数由 JavaScript 发起
- PUT
- DELETE：PUT 和 DELETE 分别表示添加资源和删除资源，但是实际上这只是语义上的一种约定，并没有强约束。
- CONNECT：CONNECT 现在多用于 HTTPS 和 WebSocket。
- OPTIONS
- TRACE：OPTIONS 和 TRACE 一般用于调试，多数线上服务都不支持。

### HTTP Status code（状态码）和 Status text（状态文本）

- 1xx：临时回应，表示客户端请继续。

  对我们前端来说，1xx 系列的状态码是非常陌生的，原因是 1xx 的状态被浏览器 HTTP 库直接处理掉了，不会让上层应用知晓。

- 2xx：请求成功。

  - 200：请求成功。

- 3xx: 表示请求的目标有变化，希望客户端进一步处理。

  - 301&302：永久性与临时性跳转。

  3xx 系列比较复杂，301 和 302 两个状态表示当前资源已经被转移，只不过一个是永久性转移，一个是临时性转移。实际上 301 更接近于一种报错，提示客户端下次别来了。

  - 304：跟客户端缓存没有更新。

  304 又是一个每个前端必知必会的状态，产生这个状态的前提是：客户端本地**已经有缓存的版本**，并且在 Request 中告诉了服务端，当服务端通过时间或者 tag，发现**没有更新**的时候，就会返回一个不含 body 的 304 状态。

- 4xx：客户端请求错误。

  - 403：无权限。
  - 404：表示请求的页面不存在。
  - 418：It’s a teapot. 这是一个彩蛋，来自 ietf 的一个愚人节玩笑。（超文本咖啡壶控制协议）

- 5xx：服务端请求错误。

  - 500：服务端错误。
  - 503：服务端暂时性错误，可以一会再试。

### HTTP Head (HTTP 头)

HTTP 头可以看作一个**键值对**。原则上，HTTP 头也是一种数据，我们可以自由定义 HTTP 头和值。不过在 HTTP 规范中，规定了一些特殊的 HTTP 头。

- Request Header

- Response Header

### HTTP Request Body

HTTP 请求的 body 主要用于提交表单场景。实际上，HTTP 请求的 body 是比较自由的，只要浏览器端发送的 body 服务端认可就可以了。一些常见的 body 格式是：

- application/json
- application/x-www-form-urlencoded
- multipart/form-data
- text/xml

我们使用 HTML 的 form 标签提交产生的 HTML 请求，默认会产生 application/x-www-form-urlencoded 的数据格式，当有文件上传时，则会使用 multipart/form-data。

### HTTPS

在 HTTP 协议的基础上，HTTPS 和 HTTP2 规定了更复杂的内容，但是它基本保持了 HTTP 的设计思想，即：使用上的 Request-Response 模式。

HTTPS 有两个作用：

- 一是确定请求的目标服务端身份，
- 二是保证传输的数据不会被网络中间节点窃听或者篡改。

HTTPS 的标准也是由 RFC 规定的，你可以查看它的详情链接：https://tools.ietf.org/html/rfc2818

HTTPS 是使用加密通道来传输 HTTP 的内容。但是 HTTPS 首先与服务端建立一条 TLS 加密通道。TLS 构建于 TCP 协议之上，它实际上是**对传输的内容做一次加密**，所以从传输内容上看，HTTPS 跟 HTTP 没有任何区别。

## HTTP2

HTTP 2 是 HTTP 1.1 的升级版本，你可以查看它的详情链接。https://tools.ietf.org/html/rfc7540

HTTP 2.0 最大的改进有两点：

- 一是支持**服务端推送**，
- 二是支持 **TCP 连接复用**。

服务端推送能够在客户端发送第一个请求到服务端时，提前把一部分内容推送给客户端，放入缓存当中，这可以避免客户端请求顺序带来的并行度不高，从而导致的性能问题。

TCP 连接复用，则使用同一个 TCP 连接来传输多个 HTTP 请求，避免了 TCP 连接建立时的三次握手开销，和初建 TCP 连接时传输窗口小的问题。

Note: 其实很多优化涉及更下层的协议。IP 层的分包情况，和物理层的建连时间是需要被考虑的。

# 解析（HTML）代码

## 拆分词token

首先我们来看看一个非常标准的标签，会被如何拆分：

```html
<p class="a">text text text</p>
```

可以把这段代码依次拆成词（token）：

- <p“标签开始”的开始；

- class=“a” 属性；

- > “标签开始”的结束；

- text text text 文本；

- </p> 标签结束。

## 状态机

绝大多数语言的词法部分都是用状态机实现的。那么我们来把部分词（token）的解析画成一个状态机看看：

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/8595a004-a44a-4117-9f1c-e87a3960a8ee/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/8595a004-a44a-4117-9f1c-e87a3960a8ee/Untitled.png)

# 构建 DOM 树

接下来我们要把这些简单的词变成 DOM 树，这个过程我们是使用栈来实现的，任何语言几乎都有栈，为了给你跑着玩，我们还是用 JavaScript 来实现吧，毕竟 JavaScript 中的栈只要用数组就好了。

为了构建 DOM 树，我们需要一个 **Node 类**，接下来我们所有的节点都会是这个 Node 类的实例。

在完全符合标准的浏览器中，不一样的 HTML 节点对应了不同的 Node 的子类，我们为了简化，就不完整实现这个继承体系了。我们仅仅把 Node 分为 Element 和 Text（如果是基于类的 OOP 的话，我们还需要抽象工厂来创建对象）

```jsx
function Element(){
    this.childNodes = [];
}
function Text(value){
    this.value = value || "";
}
```

前面我们的词（token）中，以下两个是需要成对匹配的：

- tag start
- tag end

根据一些编译原理中常见的技巧，我们使用的栈正是用于**匹配开始和结束标签**的方案。

对于 Text 节点，我们则需要把相邻的 Text 节点合并起来，我们的做法是当词（token）入栈时，检查栈顶是否是 Text 节点，如果是的话就合并 Text 节点。

```jsx
<html maaa=a >
    <head>
        <title>cool</title>
    </head>
    <body>
        <img src="a" />
    </body>
</html>
```

通过这个栈，我们可以构建 DOM 树：

- 栈顶元素就是当前节点；
- 遇到属性，就添加到当前节点；
- 遇到文本节点，如果当前节点是文本节点，则跟文本节点合并，否则入栈成为当前节点的子节点；
- 遇到注释节点，作为当前节点的子节点；
- 遇到 tag start 就入栈一个节点，当前节点就是这个节点的父节点；
- 遇到 tag end 就出栈一个节点（还可以检查是否匹配）。

当我们的源代码完全遵循 XHTML（这是一种比较严谨的 HTML 语法）时，这非常简单问题，然而 HTML 具有很强的容错能力，奥妙在于当 tag end 跟栈顶的 start tag **不匹配**的时候如何处理。