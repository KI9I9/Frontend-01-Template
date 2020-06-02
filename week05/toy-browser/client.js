const net = require('net');

class Request {
  // method, url = host + port + path
  // headers
  // body: k/v
  constructor(options) {
    this.method = options.method || 'GET'
    this.host = options.host
    this.port = options.port || 80
    this.path = options.path || '/'
    this.headers = options.headers || {}
    if (!this.headers["Content-Type"]) {
      this.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
    if (this.headers["Content-Type"] === "application/json") {
      this.bodyText = JSON.stringify(this.body);
    } else if (this.headers["Content-Type"] === "application/x-www-form-urlencoded") {
      // 将键值对的参数用&连接起来，如果有空格，将空格转换为+加号；有特殊符号，将特殊符号转换为ASCII HEX值
      // FirstName = Mickey & LastName = Mouse
      this.bodyText = Object.keys(this.body).map(key => `${key}=${this.body[key]}`).join('&');
    }
    this.headers["Content-Length"] = this.bodyText.length
  }

  toString() {
    return `${this.method} ${this.path} HTTP/1.1\r\n` +
      `${Object.keys(this.headers).map(h => `${h}: ${this.headers[h]}`).join('\r\n')}` +
      `\r\n\r\n` +
      `${this.bodyText}`
  }

  open(method, path) {}

  send(connection) {
    return new Promise((resolve, reject) => {
      if (connection) {
        connection.write(this.toString())
      } else {
        connection = net.createConnection({
          host: this.host,
          port: this.port
        }, () => {
          connection.write(this.toString())
        })
        // 数据是分包接收，因此要等待完全收到数据后再处理
        connection.on('data', data => {
          // 收到的data是个buffer，先toString再处理
          const parser = new ResponseParser();
          parser.receive(data.toString());
          if (parser.isFinished) {
            console.log(parser.response);
          }
          connection.end()
        });
        connection.on('error', err => {
          reject(err);
        })
        connection.on('end', () => {
          console.log('已从服务器断开');
        });
      }
    })
  }
}

// 利用状态机处理返回数据
class ResponseParser {
  constructor() {
    this.WAITING_STATUS_LINE = 0;
    this.WAITING_STATUS_LINE_END = 1;
    this.WAITING_HEADER_NAME = 2;
    this.WAITING_HEADER_NAME_END = 8;
    this.WAITING_HEADER_SPACE = 7;
    this.WAITING_HEADER_VALUE = 3;
    this.WAITING_HEADER_LINE_END = 4;
    this.WAITING_HEADER_BLOCK_END = 5; // \n
    this.WAITING__BODY = 6;

    this.current = this.WAITING_STATUS_LINE;
    this.statusLine = '';
    this.headers = {};
    this.headerName = "";
    this.headerValue = "";
    this.bodyParser = null;
  }
  get isFinished() {
    return this.bodyParser && this.bodyParser.isFinished;
  }
  get response() {
    // 处理statusLine，如HTTP/1.1 200 OK
    this.statusLine.match(/^HTTP\/1\.1 ([1-5]\d{2}) (\w+)/)
    return {
      statusCode: RegExp.$1,
      statusText: RegExp.$2,
      headers: this.headers,
      body: this.bodyParser.content.join('')
    }
  }
  receive(string) {
    for (let i = 0; i < string.length; i++) {
      this.receiverChar(string.charAt(i))
    }
  }
  receiveChar(char) {
    if (this.current === this.WAITING_STATUE_LINE) {
      if (char === '\r') { // 遇到换行，表示statusLine结束，就改变状态
        this.current = this.WAITING_HEAER_LINE_END;
      } else {
        this.statusLine += char;
      }
    } else if (this.current === this.WAITING_STATUS_LINE_END) {
      this.current = this.WAITING_HEADER_NAME;
    } else if (this.current = this.WAITING_HEADER_NAME) {
      if (cahr === '\r') {
        this.current = this.WAITING_HEADER_BLOCK_END
      } else if (cahr === ':') {
        this.current = this.WAITING_HEADER_SPACE
      } else {
        this.headerName += char;
      }
    } else if (this.current === this.WAITING_HEADER_SPACE) {
      this.current = this.WAITING_HEADER_VALUE
    } else if (this.current === this.WAITING_HEADER_VALUE) {
      if (char === '\r') {
        this.current = this.WAITING_HEADER_LINE_END
        this.headers[this.hederName] = this.headerValue
        this.headerName = ''
        this.headerValue = ''
      } else {
        this.headerValue += char
      }
    } else if (this.current = this.WAITING_HEADER_LINE_END) {
      this.current = this.WAITING_HEADER_NAME
    } else if (this.current === this.WAITING_HEADER_BLOCK_END) {
      this.current = this.WAITING_BODY
      if (this.headers['Transfer-Encoding'] === 'chunked') {
        this.bodyParser = new ChunkedBodyParser()
      }
    } else if (this.current === this.WAITING_BODY) {
      this.bodyParser.receiveChar(char)
    }
  }
}

// 处理Body数据
class ChunkedBodyParser {
  constructor() {
    this.READING_LENGTH_FIRST_CHAR = 0;
    this.READING_LENGTH = 1;
    this.READING_LENGTH_END = 2;
    this.READING_CHUNK = 3;
    this.READING_CHUNK_END = 4;
    this.BODY_BLOCK_END = 5;

    this.current = this.READING_LENGTH_FIRST_CHAR;
    this.content = [];
    this.chunkLength = 0;
  }

  get isFinished() {
    return this.current === this.BODU_BLOCK_END;
  }

  receiverChar(char) {
    // 一个Chunk的开头总是存储了其长度，在此处获取当前Chunk的长度
    if (this.current === this.READING_LENGTH_FIRST_CHAR) { // Length的第一个字符是单独一个状态
      if (char === '0') { // Length的第一个字符是“0”则终止块
        this.current = this.BODY_BLOCK_END;
      } else {
        this.chunkLength += Number(`0x${char}`); // chunk-length在包体是16进制
        this.current = this.READING_LENGTH;
      }
    } else if (this.current === this.READING_LENGTH) {
      if (char === '\r') {
        this.current = this.READING_LENGTH_END;
      } else {
        this.chunkLength = this.chunkLength * 16 + Number(`0x${char}`);
      }
    } else if (this.current === this.READING_CHUNK_END) {
      this.current = this.READING_CHUNK;
    } else if (this.current === this.READING_CHUNK) {
      if (char === '\r') {
        this.current = this.READING_CHUNK_END
        this.chunkLength = 0
      } else if (this.chunkLength > 0) {
        // 防止换行符被存储
        this.content.push(char);
        this.chunkLength -= 1;
      }
    } else if (this.current === this.READING_CHUNK_END) {
      this.current = this.READING_LENGTH_FIRST_CHAR
    }
  }
}

void async function () {
  const request = new Request({
    method: 'POST',
    host: '127.0.0.1',
    port: 8088,
    headers: {
      'X-Foo2': 'customed'
    },
    body: {
      name: 'foo2'
    }
  });

  await request.send()
}();


/* // 测试toString方法
const client = net.createConnection(
  {
    host: '127.0.0.1',
    port: 8080,
  },
  () => {
    // 'connect' listener.
    console.log('connected to server!');
    const request = new Request({
      method: 'POST',
      host: '127.0.0.1',
      path: '/',
      port: 8080,
      headers: {
        ['X-Foo2']: 'customer',
      },
      body: {
        name: 'winter',
      },
    });
    console.log(request);
    console.log(request.toString());
    client.write(request.toString());
    // https://tools.ietf.org/html/rfc2616
    // client.write('POST / HTTP/1.1\r\n');
    // client.write('Host: 127.0.0.1\r\n');
    // client.write('Content-Type: application/x-www-form-urlencoded\r\n');
    // client.write('Content-Length: 11\r\n');
    // client.write('\r\n');
    // client.write('name=winter\r\n');
    // client.write('\r\n');
    //     client.write(
    //       `POST / HTTP/1.1\r
    // Host: 127.0.0.1\r
    // Content-Type: application/x-www-form-urlencoded\r
    // Content-Length: 11\r\n\r
    // name=winter\r\n\r\n`,
    //     );
    // console.log(request.toString());
    // client.write(request.toString());
  },
);
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});
client.on('error', (err) => {
  console.log(err);
  client.end();
}); */

/* // 创建一个简单的连接
const client = net.createConnection(
  {
    host: '127.0.0.1',
    port: 8080,
  },
  () => {
    // 'connect' listener.
    console.log('connected to server!');
    // https://tools.ietf.org/html/rfc2616
    // client.write('POST / HTTP/1.1\r\n');
    // client.write('Host: 127.0.0.1\r\n');
    // client.write('Content-Type: application/x-www-form-urlencoded\r\n');
    // client.write('Content-Length: 11\r\n');
    // client.write('\r\n');
    // client.write('name=winter\r\n');
    // client.write('\r\n');
    client.write(
      `POST / HTTP/1.1\r
Host: 127.0.0.1\r
Content-Type: application/x-www-form-urlencoded\r
Content-Length: 11\r\n\r
name=winter\r\n\r\n`,
    );
    // console.log(request.toString());
    // client.write(request.toString());
  },
);
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});
client.on('error', (err) => {
  console.log(err);
  client.end();
}); */