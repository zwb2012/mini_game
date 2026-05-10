# Server 目录

在本目录中编写或编辑服务端代码时，请遵循以下标准。

## 技术栈

- **运行时**: Node.js + Express + TypeScript
- **数据库**: 待定（模板默认为内存存储，生产环境替换为 PostgreSQL/MySQL）
- **部署**: Docker 或直接部署

## 编码规范

- 所有 API 端点必须返回统一响应格式: `{ success: boolean, data?: any, error?: string }`
- 路由文件按业务领域分文件（`routes/ranking.ts`、`routes/userdata.ts`）
- 敏感信息（API Key、密钥）通过环境变量注入，不写死在代码中
- 支付验证必须在服务端完成——绝不信任客户端上报的支付结果

## API 设计约定

- RESTful 风格: 有意义的 HTTP 动词 + 资源导向路径
- 正确的 HTTP 状态码（200/201/400/401/409/500）
- 评分提交类端点需要基础频率限制
- 所有端点需要有对应的错误处理

## 安全

- CORS 配置只允许已知的游戏客户端域名
- 敏感数据传输使用 HTTPS
- 用户数据访问需要 token 校验

## 测试

- API 端点有对应的合约测试
- 支付验证逻辑必须有单元测试
- 测试放在 `tests/server/`

## 模板来源

完整实现的骨架代码位于 `templates/backend-base/`（Express + 排行榜/用户数据/配置下发/支付验证路由）。
使用 `backend-developer` agent 进行服务端开发。
