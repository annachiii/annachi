from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class Task:
    """A unit of work to be placed into the schedule."""

    id: str
    name: str
    duration_minutes: int
    priority: int = 3  # 1 (low) - 5 (high)
    deadline: Optional[datetime] = None
    earliest_start: Optional[datetime] = None
    depends_on: List[str] = field(default_factory=list)
    splittable: bool = True
    min_chunk_minutes: int = 15

    def __post_init__(self) -> None:
        if self.duration_minutes <= 0:
            raise ValueError(f"task {self.id!r}: duration_minutes must be positive")
        if not 1 <= self.priority <= 5:
            raise ValueError(f"task {self.id!r}: priority must be between 1 and 5")
        if self.min_chunk_minutes <= 0:
            raise ValueError(f"task {self.id!r}: min_chunk_minutes must be positive")


@dataclass
class BusyPeriod:
    """An already-occupied time range that the planner must schedule around."""

    start: datetime
    end: datetime
    label: str = ""


@dataclass
class WorkWindow:
    """A recurring daily working window, e.g. 09:00-12:00 on weekdays (Mon=0)."""

    start_hour: int
    start_minute: int
    end_hour: int
    end_minute: int
    weekdays: List[int] = field(default_factory=lambda: [0, 1, 2, 3, 4])

    def __post_init__(self) -> None:
        if (self.start_hour, self.start_minute) >= (self.end_hour, self.end_minute):
            raise ValueError("WorkWindow start must be before end")


@dataclass
class ScheduledBlock:
    """A concrete placement of (part of) a task on the calendar."""

    task_id: str
    task_name: str
    start: datetime
    end: datetime

    @property
    def duration_minutes(self) -> int:
        return int((self.end - self.start).total_seconds() // 60)
