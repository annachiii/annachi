# annachi · 自动日程规划

一个零依赖（仅使用 Python 标准库）的自动日程规划工具。给定一批任务（时长、优先级、
截止时间、依赖关系）和工作时间窗口，自动把任务排入日历，并可导出为标准 `.ics` 文件
导入到 Google Calendar / Apple 日历等应用。

## 特性

- **优先级 + 截止时间驱动**：每一步优先安排截止时间最早、优先级最高的就绪任务。
- **依赖关系**：支持 `depends_on`，自动按拓扑顺序排程，并检测循环依赖。
- **工作时间窗口**：可自定义每周哪些天、几点到几点算作可用时间（如 9:00-12:00,
  13:30-18:00，周一至周五）。
- **已占用时间段**：自动避开会议等已有日程。
- **任务拆分**：默认允许任务拆分到多个空闲时间段（可设置最小拆分粒度
  `min_chunk_minutes`），也可设置 `splittable: false` 要求连续时间块。
- **超期提示 / 无法排入提示**：排不下的任务和会超过截止时间的任务都会在报告中列出。
- **导出 `.ics`**：一键生成标准日历文件。

## 快速开始

```bash
python3 -m scheduler examples/tasks.json \
  --start 2026-09-03T09:00 \
  --days 7 \
  --busy examples/busy.json \
  --ics out.ics
```

`--start` 省略时默认为当前时间；`--days` 默认向后规划 7 天。

### 任务文件格式（JSON 数组）

```json
[
  {
    "id": "design",
    "name": "需求与方案设计",
    "duration_minutes": 120,
    "priority": 5,
    "deadline": "2026-09-04T18:00:00",
    "splittable": false
  },
  {
    "id": "dev",
    "name": "功能开发",
    "duration_minutes": 300,
    "priority": 4,
    "depends_on": ["design"]
  }
]
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 任务唯一标识 |
| `name` | 是 | 任务名称 |
| `duration_minutes` | 是 | 预计耗时（分钟） |
| `priority` | 否 | 1-5，默认 3，越大越优先 |
| `deadline` | 否 | ISO 时间，超过则在报告中标记超期 |
| `earliest_start` | 否 | 任务最早可开始时间 |
| `depends_on` | 否 | 依赖的任务 id 列表，需等其排完才能开始 |
| `splittable` | 否 | 是否允许拆成多段，默认 `true` |
| `min_chunk_minutes` | 否 | 拆分时每段最小时长，默认 15 |

### 自定义工作时间窗口

不传 `--work-windows` 时，默认使用周一至周五 9:00-12:00、13:30-18:00。也可以传入自
己的 JSON 文件：

```json
[
  { "start_hour": 9, "start_minute": 0, "end_hour": 18, "end_minute": 0, "weekdays": [0, 1, 2, 3, 4] }
]
```

`weekdays` 中 0 = 周一 … 6 = 周日。

### 已占用时间段

```json
[
  { "start": "2026-09-03T10:00:00", "end": "2026-09-03T11:00:00", "label": "站会" }
]
```

## 作为库使用

```python
from datetime import datetime, timedelta
from scheduler import Planner, Task, WorkWindow

planner = Planner(work_windows=[WorkWindow(9, 0, 18, 0)])
tasks = [Task(id="a", name="写报告", duration_minutes=90, priority=4)]

start = datetime.now()
result = planner.plan(tasks, start, start + timedelta(days=3))

for block in result.blocks:
    print(block.start, block.end, block.task_name)
```

## 运行测试

```bash
pip install pytest
python3 -m pytest tests/ -q
```
