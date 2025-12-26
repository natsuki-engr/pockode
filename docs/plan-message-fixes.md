# 消息处理 TODO

## system 消息展示重设计
- 当前：system 作为独立的 assistant 消息气泡显示
- 考虑改为 UI 提示（toast/banner 形式），不作为对话气泡
- 用途示例："✅ Edit completed"、"🆕 Started new session" 等临时提示

## 空 assistant 消息的 UI 优化
- 发送失败时会显示空气泡 + 错误信息
- 可以考虑优化显示方式
