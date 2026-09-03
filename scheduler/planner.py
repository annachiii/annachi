from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from .models import BusyPeriod, ScheduledBlock, Task, WorkWindow


class SchedulingError(Exception):
    """Raised for structural problems in the task set (bad refs, cycles)."""


@dataclass
class UnscheduledTask:
    task: Task
    reason: str


@dataclass
class PlanResult:
    blocks: List[ScheduledBlock]
    unscheduled: List[UnscheduledTask]
    missed_deadlines: List[str]  # task ids that finished after their deadline


class Planner:
    """Greedy scheduler: at each step picks the most urgent ready task
    (earliest deadline, then highest priority) and places it in the
    earliest free slot within the working hours, respecting dependencies
    and pre-existing busy periods.
    """

    def __init__(
        self,
        work_windows: List[WorkWindow],
        busy_periods: Optional[List[BusyPeriod]] = None,
    ) -> None:
        if not work_windows:
            raise ValueError("at least one WorkWindow is required")
        self.work_windows = work_windows
        self.busy_periods = list(busy_periods or [])

    def plan(self, tasks: List[Task], range_start: datetime, range_end: datetime) -> PlanResult:
        if range_start >= range_end:
            raise ValueError("range_start must be before range_end")
        _check_dependencies(tasks)

        free = self._free_intervals(range_start, range_end)
        remaining: Dict[str, Task] = {t.id: t for t in tasks}
        done_end: Dict[str, datetime] = {}
        blocks: List[ScheduledBlock] = []
        unscheduled: List[UnscheduledTask] = []
        missed_deadlines: List[str] = []

        while remaining:
            ready = [t for t in remaining.values() if all(d in done_end for d in t.depends_on)]
            if not ready:
                for t in remaining.values():
                    missing = [d for d in t.depends_on if d not in done_end]
                    unscheduled.append(UnscheduledTask(t, f"unresolved dependencies: {missing}"))
                break

            def ready_time(t: Task) -> datetime:
                candidates = [done_end[d] for d in t.depends_on]
                if t.earliest_start:
                    candidates.append(t.earliest_start)
                return max(candidates) if candidates else range_start

            ready.sort(key=lambda t: (t.deadline or datetime.max, -t.priority, ready_time(t), t.id))
            task = ready[0]
            rt = max(ready_time(task), range_start)

            placed, free, end_time = _place_task(task, rt, free)
            if not placed:
                unscheduled.append(UnscheduledTask(task, "no free time slot large enough remains"))
                del remaining[task.id]
                continue

            blocks.extend(placed)
            done_end[task.id] = end_time
            if task.deadline and end_time > task.deadline:
                missed_deadlines.append(task.id)
            del remaining[task.id]

        blocks.sort(key=lambda b: b.start)
        return PlanResult(blocks=blocks, unscheduled=unscheduled, missed_deadlines=missed_deadlines)

    def _daily_windows(self, day_start: datetime) -> List[Tuple[datetime, datetime]]:
        weekday = day_start.weekday()
        windows = []
        for w in self.work_windows:
            if weekday not in w.weekdays:
                continue
            start = day_start.replace(hour=w.start_hour, minute=w.start_minute, second=0, microsecond=0)
            end = day_start.replace(hour=w.end_hour, minute=w.end_minute, second=0, microsecond=0)
            windows.append((start, end))
        return sorted(windows)

    def _free_intervals(self, range_start: datetime, range_end: datetime) -> List[List[datetime]]:
        intervals: List[List[datetime]] = []
        day = range_start.replace(hour=0, minute=0, second=0, microsecond=0)
        while day < range_end:
            for start, end in self._daily_windows(day):
                start, end = max(start, range_start), min(end, range_end)
                if start < end:
                    intervals.append([start, end])
            day += timedelta(days=1)

        for busy in sorted(self.busy_periods, key=lambda b: b.start):
            intervals = _subtract(intervals, busy.start, busy.end)

        intervals.sort(key=lambda iv: iv[0])
        return intervals


def _check_dependencies(tasks: List[Task]) -> None:
    ids = {t.id for t in tasks}
    for t in tasks:
        for dep in t.depends_on:
            if dep not in ids:
                raise SchedulingError(f"task {t.id!r} depends on unknown task {dep!r}")

    WHITE, GRAY, BLACK = 0, 1, 2
    color = {t.id: WHITE for t in tasks}
    by_id = {t.id: t for t in tasks}

    def visit(tid: str, stack: List[str]) -> None:
        color[tid] = GRAY
        for dep in by_id[tid].depends_on:
            if color[dep] == GRAY:
                raise SchedulingError("dependency cycle detected: " + " -> ".join(stack + [dep]))
            if color[dep] == WHITE:
                visit(dep, stack + [dep])
        color[tid] = BLACK

    for t in tasks:
        if color[t.id] == WHITE:
            visit(t.id, [t.id])


def _subtract(intervals: List[List[datetime]], busy_start: datetime, busy_end: datetime) -> List[List[datetime]]:
    result: List[List[datetime]] = []
    for start, end in intervals:
        if busy_end <= start or busy_start >= end:
            result.append([start, end])
            continue
        if busy_start > start:
            result.append([start, min(busy_start, end)])
        if busy_end < end:
            result.append([max(busy_end, start), end])
    return result


def _place_task(
    task: Task,
    ready_time: datetime,
    free: List[List[datetime]],
) -> Tuple[List[ScheduledBlock], List[List[datetime]], Optional[datetime]]:
    """Try to place `task` (fully) into `free`, at or after `ready_time`.

    Returns (blocks, new_free, end_time). On failure to fit the whole
    task, returns ([], free, None) leaving `free` untouched (atomic).
    """
    remaining_minutes = task.duration_minutes
    placed: List[ScheduledBlock] = []
    new_free = [iv[:] for iv in free]
    last_end: Optional[datetime] = None

    i = 0
    while i < len(new_free) and remaining_minutes > 0:
        start, end = new_free[i]
        slot_start = max(start, ready_time)
        available = int((end - slot_start).total_seconds() // 60)

        if slot_start >= end or available <= 0:
            i += 1
            continue
        if not task.splittable and available < remaining_minutes:
            i += 1
            continue

        take = min(remaining_minutes, available)
        if task.splittable and take < remaining_minutes and take < task.min_chunk_minutes:
            i += 1
            continue

        block_start = slot_start
        block_end = slot_start + timedelta(minutes=take)
        placed.append(ScheduledBlock(task.id, task.name, block_start, block_end))
        last_end = block_end
        remaining_minutes -= take

        if block_start > start:
            new_free[i] = [start, block_start]
            if block_end < end:
                new_free.insert(i + 1, [block_end, end])
            i += 1
        else:
            if block_end < end:
                new_free[i] = [block_end, end]
            else:
                del new_free[i]

        if not task.splittable:
            break

    if remaining_minutes > 0:
        return [], free, None

    return placed, new_free, last_end
