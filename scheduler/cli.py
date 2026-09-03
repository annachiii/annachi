from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta
from typing import List, Optional

from .ics import to_ics
from .models import BusyPeriod, Task, WorkWindow
from .planner import Planner, PlanResult

DEFAULT_WORK_WINDOWS = [
    WorkWindow(9, 0, 12, 0),
    WorkWindow(13, 30, 18, 0),
]


def _parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value)


def load_tasks(path: str) -> List[Task]:
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    tasks = []
    for item in raw:
        item = dict(item)
        if item.get("deadline"):
            item["deadline"] = _parse_datetime(item["deadline"])
        if item.get("earliest_start"):
            item["earliest_start"] = _parse_datetime(item["earliest_start"])
        tasks.append(Task(**item))
    return tasks


def load_busy_periods(path: str) -> List[BusyPeriod]:
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [
        BusyPeriod(_parse_datetime(item["start"]), _parse_datetime(item["end"]), item.get("label", ""))
        for item in raw
    ]


def load_work_windows(path: str) -> List[WorkWindow]:
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [
        WorkWindow(
            item["start_hour"],
            item["start_minute"],
            item["end_hour"],
            item["end_minute"],
            item.get("weekdays", [0, 1, 2, 3, 4]),
        )
        for item in raw
    ]


def print_report(result: PlanResult) -> None:
    if result.blocks:
        print("已排程任务:")
        for block in result.blocks:
            marker = "  [!超期]" if block.task_id in result.missed_deadlines else ""
            print(
                f"  {block.start:%Y-%m-%d %H:%M} - {block.end:%H:%M}  "
                f"{block.task_name} ({block.duration_minutes}min){marker}"
            )
    else:
        print("没有任务被排入日程。")

    if result.unscheduled:
        print("\n未能排程的任务:")
        for item in result.unscheduled:
            print(f"  - {item.task.name} ({item.task.id}): {item.reason}")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="自动规划日程")
    parser.add_argument("tasks", help="任务定义 JSON 文件路径")
    parser.add_argument("--start", default=None, help="规划起始时间，ISO 格式（如 2026-09-03T09:00），默认当前时间")
    parser.add_argument("--days", type=int, default=7, help="向后规划的天数，默认 7")
    parser.add_argument("--busy", default=None, help="已占用时间段 JSON 文件路径")
    parser.add_argument("--work-windows", default=None, help="自定义工作时间窗口 JSON 文件路径")
    parser.add_argument("--ics", default=None, help="将结果导出为 .ics 日历文件的路径")
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    tasks = load_tasks(args.tasks)
    busy = load_busy_periods(args.busy) if args.busy else []
    work_windows = load_work_windows(args.work_windows) if args.work_windows else DEFAULT_WORK_WINDOWS

    range_start = _parse_datetime(args.start) if args.start else datetime.now().replace(second=0, microsecond=0)
    range_end = range_start + timedelta(days=args.days)

    planner = Planner(work_windows=work_windows, busy_periods=busy)
    result = planner.plan(tasks, range_start, range_end)

    print_report(result)

    if args.ics:
        with open(args.ics, "w", encoding="utf-8") as f:
            f.write(to_ics(result.blocks))
        print(f"\n已导出日历文件: {args.ics}")

    return 0 if not result.unscheduled else 1


if __name__ == "__main__":
    sys.exit(main())
