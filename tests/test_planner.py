from datetime import datetime, timedelta

import pytest

from scheduler import BusyPeriod, Planner, SchedulingError, Task, WorkWindow
from scheduler.ics import to_ics

ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]


def make_planner(work_windows=None, busy=None):
    windows = work_windows or [WorkWindow(9, 0, 17, 0, weekdays=ALL_DAYS)]
    return Planner(work_windows=windows, busy_periods=busy)


def test_basic_scheduling_within_work_window():
    planner = make_planner()
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [Task(id="a", name="A", duration_minutes=60)]

    result = planner.plan(tasks, start, start + timedelta(days=1))

    assert not result.unscheduled
    assert len(result.blocks) == 1
    block = result.blocks[0]
    assert block.start == datetime(2026, 9, 3, 9, 0)
    assert block.end == datetime(2026, 9, 3, 10, 0)


def test_busy_period_is_avoided():
    busy = [BusyPeriod(datetime(2026, 9, 3, 9, 0), datetime(2026, 9, 3, 10, 0))]
    planner = make_planner(busy=busy)
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [Task(id="a", name="A", duration_minutes=30, splittable=False)]

    result = planner.plan(tasks, start, start + timedelta(days=1))

    assert not result.unscheduled
    block = result.blocks[0]
    assert block.start >= datetime(2026, 9, 3, 10, 0)


def test_dependency_ordering():
    planner = make_planner()
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [
        Task(id="b", name="B", duration_minutes=30, depends_on=["a"]),
        Task(id="a", name="A", duration_minutes=30, priority=1),
    ]

    result = planner.plan(tasks, start, start + timedelta(days=2))

    assert not result.unscheduled
    by_id = {b.task_id: b for b in result.blocks}
    assert by_id["a"].end <= by_id["b"].start


def test_dependency_cycle_raises():
    planner = make_planner()
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [
        Task(id="a", name="A", duration_minutes=30, depends_on=["b"]),
        Task(id="b", name="B", duration_minutes=30, depends_on=["a"]),
    ]

    with pytest.raises(SchedulingError):
        planner.plan(tasks, start, start + timedelta(days=2))


def test_unknown_dependency_raises():
    planner = make_planner()
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [Task(id="a", name="A", duration_minutes=30, depends_on=["missing"])]

    with pytest.raises(SchedulingError):
        planner.plan(tasks, start, start + timedelta(days=2))


def test_earlier_deadline_and_higher_priority_go_first():
    planner = make_planner()
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [
        Task(id="low", name="Low priority, far deadline", duration_minutes=30, priority=1,
             deadline=datetime(2026, 9, 10, 17, 0)),
        Task(id="urgent", name="High priority, near deadline", duration_minutes=30, priority=5,
             deadline=datetime(2026, 9, 3, 17, 0)),
    ]

    result = planner.plan(tasks, start, start + timedelta(days=5))

    by_id = {b.task_id: b for b in result.blocks}
    assert by_id["urgent"].start < by_id["low"].start


def test_splittable_task_splits_across_days():
    windows = [WorkWindow(9, 0, 10, 0, weekdays=ALL_DAYS)]  # only 1h/day available
    planner = make_planner(work_windows=windows)
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [Task(id="a", name="A", duration_minutes=90, min_chunk_minutes=15)]

    result = planner.plan(tasks, start, start + timedelta(days=3))

    assert not result.unscheduled
    a_blocks = [b for b in result.blocks if b.task_id == "a"]
    assert len(a_blocks) == 2
    assert sum(b.duration_minutes for b in a_blocks) == 90


def test_non_splittable_task_waits_for_contiguous_slot():
    windows = [WorkWindow(9, 0, 10, 0, weekdays=ALL_DAYS)]  # only 1h/day available
    planner = make_planner(work_windows=windows)
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [Task(id="a", name="A", duration_minutes=90, splittable=False)]

    result = planner.plan(tasks, start, start + timedelta(days=3))

    assert len(result.unscheduled) == 1
    assert result.unscheduled[0].task.id == "a"


def test_missed_deadline_is_reported():
    windows = [WorkWindow(9, 0, 10, 0, weekdays=ALL_DAYS)]
    planner = make_planner(work_windows=windows)
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [Task(id="a", name="A", duration_minutes=30, deadline=datetime(2026, 9, 3, 9, 0))]

    result = planner.plan(tasks, start, start + timedelta(days=1))

    assert result.blocks
    assert "a" in result.missed_deadlines


def test_ics_export_contains_events():
    planner = make_planner()
    start = datetime(2026, 9, 3, 8, 0)
    tasks = [Task(id="a", name="A", duration_minutes=30)]
    result = planner.plan(tasks, start, start + timedelta(days=1))

    ics = to_ics(result.blocks)

    assert "BEGIN:VCALENDAR" in ics
    assert "SUMMARY:A" in ics
    assert ics.count("BEGIN:VEVENT") == 1
