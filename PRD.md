# 音乐学习记录应用 - 产品需求文档 (PRD) v2.0

## 1. 产品概述

### 1.1 产品名称
**胡天才音乐学习** - 基于番茄工作法的音乐学习记录应用

### 1.2 产品定位
帮助音乐学习者有效管理学习时间，追踪学习进度，提高学习效率的移动端 Web 应用（H5）。

### 1.3 平台说明
- **应用类型**: H5 移动端应用（手机浏览器访问）
- **适配方案**: 响应式设计，优先适配 iOS/Android 手机
- **部署方式**: 微信公众号内嵌 / 独立域名访问 / App 打包

### 1.4 目标用户
- 音乐学习者
- 音乐教师
- 音乐专业学生

---

## 2. 技术架构

### 2.1 前后端分离架构
```
┌─────────────────────────────────────────────────────────┐
│                      H5 前端                             │
│  (Vue 3 + Vant + Vue Router + Pinia)                   │
│  运行于手机浏览器                                        │
└─────────────────────────────────────────────────────────┘
                           ↑ REST API
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     Node.js 后端                        │
│  (Express/Koa + JWT)                                    │
└─────────────────────────────────────────────────────────┘
                           ↑
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     MySQL 数据库                        │
│  (用户数据、学习记录、任务数据)                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 技术栈
| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Vue 3 + Composition API |
| UI 组件库 | Vant 4 (移动端优先) |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| HTTP 客户端 | Axios |
| 后端框架 | Node.js + Express |
| 认证 | JWT (JSON Web Token) |
| 数据库 | MySQL |
| ORM | Sequelize |

### 2.3 数据库设计
```sql
-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 任务表
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  category ENUM('music-history', 'singing', 'improvisation', 'teaching', 'training') NOT NULL,
  estimated_pomodoros INT DEFAULT 1,
  completed_pomodoros INT DEFAULT 0,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 学习记录表
CREATE TABLE study_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  task_id INT,
  task_name VARCHAR(100),
  category ENUM('music-history', 'singing', 'improvisation', 'teaching', 'training'),
  duration INT NOT NULL,  -- 分钟
  pomodoros INT DEFAULT 1,
  record_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- 系统设置表
CREATE TABLE user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  work_duration INT DEFAULT 25,
  short_break INT DEFAULT 5,
  long_break INT DEFAULT 15,
  long_break_interval INT DEFAULT 4,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 游戏记录表
CREATE TABLE game_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  game_type ENUM('2048', 'snake', 'brick') NOT NULL,
  score INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 3. 用户权限系统

### 3.1 角色定义
| 角色 | 权限说明 |
|------|----------|
| **admin** | 管理员：可查看所有用户数据、系统管理 |
| **user** | 普通用户：仅可访问自己的数据 |

### 3.2 权限控制
- **登录验证**: 所有 API 请求需携带有效 JWT Token
- **接口权限**: 普通用户只能访问 `/api/user/*` 下的个人数据
- **管理员接口**: `/api/admin/*` 仅 admin 角色可访问

### 3.3 认证流程
```
1. 用户注册 → POST /api/auth/register
2. 用户登录 → POST /api/auth/login → 返回 JWT Token
3. 前端存储 Token (localStorage)
4. 后续请求 Header 携带: Authorization: Bearer <token>
5. Token 有效期: 7 天
```

---

## 4. 功能需求

### 4.1 用户模块
#### 4.1.1 用户注册
- 用户名（唯一）、密码、昵称（可选）
- 密码加密存储（bcrypt）

#### 4.1.2 用户登录
- 用户名 + 密码登录
- 返回 JWT Token 和用户信息

#### 4.1.3 个人中心
- 查看个人信息
- 修改昵称
- 修改密码
- 退出登录

### 4.2 任务管理 (FR-1)
- 创建任务（名称、分类、预估番茄数、备注）
- 编辑任务
- 删除任务
- 完成任务标记
- 任务列表（按分类筛选）
- 任务进度跟踪

### 4.3 番茄计时器 (FR-2)
- 计时器核心功能
- 可配置工作/休息时长
- 浏览器通知提醒
- 声音提示
- 计时完成后自动记录学习数据
- 当前任务关联

### 4.4 学习记录 (FR-3)
- 自动记录每次番茄完成
- 手动添加学习记录
- 查看学习历史
- 删除学习记录

### 4.5 数据统计 (FR-4)
- 总番茄数
- 总学习时长
- 完成任务数
- 连续学习天数
- 本周学习趋势（柱状图）
- 分类统计（甜甜圈图）

### 4.6 学习日历 (FR-5)
- **日历视图**: 月/周/日三种视图切换
- **学习标记**: 每日学习情况可视化显示
- **数据详情**: 点击日期查看当天详细记录
- **颜色区分**: 根据学习时长显示不同颜色深浅
- **快速导航**: 支持月份/年份快速切换

### 4.6 休息小游戏 (FR-5)
- 休息时间内置轻量小游戏
- 游戏类型：
  - **2048**: 经典数字合成游戏
  - **贪吃蛇**: 经典贪吃蛇游戏
  - **打砖块**: 经典打砖块游戏
- 游戏记录本地存储
- 休息结束提醒

### 4.7 系统设置 (FR-6)
- 工作时长设置
- 短休息时长设置
- 长休息时长设置
- 长休息间隔设置

---

## 5. H5 移动端适配

### 5.1 页面设计规范
- **设计宽度**: 375px (iPhone 标准)
- **最大宽度**: 480px (限制在大屏手机上不做过宽)
- **安全区域**: 适配 iOS Safe Area 和 Android 刘海屏

### 5.2 交互规范
- **点击区域**: 最小 44px × 44px
- **表单输入**: 使用 Vant 表单组件，适配键盘弹出
- **下拉刷新**: 使用 Vant PullRefresh
- **上拉加载**: 使用 Vant List

### 5.3 导航设计
- **底部 TabBar**: 4 个 tab（计时器、任务、统计、我的）
- **页面切换**: Vue Router SPA 切换

### 5.4 性能优化
- **首屏加载**: < 2s
- **路由懒加载**: 按需加载页面组件
- **图片懒加载**: Vant Image 组件

---

## 6. 接口设计

### 6.1 认证接口
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/register | 注册 | 公开 |
| POST | /api/auth/login | 登录 | 公开 |
| GET | /api/auth/profile | 获取当前用户信息 | 登录 |
| PUT | /api/auth/profile | 修改个人信息 | 登录 |
| PUT | /api/auth/password | 修改密码 | 登录 |

### 6.2 任务接口
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/tasks | 获取任务列表 | 登录 |
| POST | /api/tasks | 创建任务 | 登录 |
| PUT | /api/tasks/:id | 更新任务 | 登录 |
| DELETE | /api/tasks/:id | 删除任务 | 登录 |

### 6.3 学习记录接口
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/records | 获取记录列表 | 登录 |
| POST | /api/records | 添加记录 | 登录 |
| DELETE | /api/records/:id | 删除记录 | 登录 |
| GET | /api/records/stats | 获取统计数据 | 登录 |

### 6.4 设置接口
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/settings | 获取设置 | 登录 |
| PUT | /api/settings | 更新设置 | 登录 |

### 6.5 游戏记录接口
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/games/scores | 获取游戏最高分 | 登录 |
| POST | /api/games/scores | 保存游戏分数 | 登录 |

### 6.6 日历接口
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/records/calendar | 获取日历数据（按月） | 登录 |

---

## 7. 验收标准

### AC-1: 用户注册登录
- [ ] 用户可以注册新账号（用户名唯一）
- [ ] 用户可以登录系统
- [ ] 登录后获取 JWT Token
- [ ] Token 过期需重新登录

### AC-2: 权限控制
- [ ] 普通用户只能访问自己的数据
- [ ] 未登录无法访问需要认证的接口
- [ ] 管理员可以查看所有用户数据

### AC-3: 任务管理
- [ ] 用户可以创建任务
- [ ] 用户可以编辑任务
- [ ] 用户可以删除任务
- [ ] 任务按分类显示
- [ ] 任务进度实时更新

### AC-4: 番茄计时器
- [ ] 计时器正常运行
- [ ] 计时完成提醒
- [ ] 自动记录学习数据

### AC-5: 数据统计
- [ ] 显示总番茄数、总时长
- [ ] 显示本周趋势图
- [ ] 显示分类统计图

### AC-6: 休息小游戏
- [ ] 休息时可选择小游戏
- [ ] 2048 游戏正常运行
- [ ] 贪吃蛇游戏正常运行
- [ ] 打砖块游戏正常运行
- [ ] 游戏记录本地保存

### AC-7: 学习日历
- [ ] 显示月/周/日三种视图
- [ ] 每日学习情况可视化标记
- [ ] 点击日期查看当天详细记录
- [ ] 根据学习时长显示不同颜色
- [ ] 支持月份/年份快速切换

### AC-8: H5 移动端体验
- [ ] 在手机浏览器中正常显示
- [ ] 底部导航栏正常工作
- [ ] 表单输入正常
- [ ] 适配 iOS 和 Android

---

## 8. 项目结构

```
music-study-app/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/             # 配置文件
│   │   ├── controllers/        # 控制器
│   │   ├── middleware/         # 中间件 (auth, error)
│   │   ├── models/            # Sequelize 模型
│   │   ├── routes/            # 路由
│   │   ├── utils/             # 工具函数
│   │   └── app.js            # 入口文件
│   ├── .env                   # 环境变量
│   └── package.json
│
├── frontend/                   # H5 前端
│   ├── src/
│   │   ├── api/               # API 请求
│   │   ├── assets/           # 静态资源
│   │   ├── components/       # 公共组件
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态
│   │   ├── views/            # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 9. 实施计划

| 阶段 | 任务 | 优先级 |
|------|------|--------|
| P0 | 后端项目初始化 + MySQL 连接 | P0 |
| P0 | 用户注册登录 (JWT) | P0 |
| P0 | 任务 CRUD API | P0 |
| P0 | 学习记录 API | P0 |
| P0 | 统计数据 API | P0 |
| P1 | 前端项目初始化 (Vue 3 + Vant) | P1 |
| P1 | 登录注册页面 | P1 |
| P1 | 任务管理页面 | P1 |
| P1 | 番茄计时器页面 | P1 |
| P1 | 统计页面 | P1 |
| P1 | 个人中心页面 | P1 |
| P2 | 管理员功能 | P2 |
| P2 | 测试与优化 | P2 |

---

## 10. 待确认事项

- [ ] 腾讯云 MySQL 数据库配置
- [ ] 服务器域名和 HTTPS 证书
- [ ] 是否需要微信公众号集成
- [ ] 管理员账号初始密码

---

**文档版本**: v2.0  
**创建日期**: 2026-03-15  
**更新说明**: 新增前后端分离、数据库存储、用户登录、权限控制、H5移动端适配
