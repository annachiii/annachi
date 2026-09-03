from __future__ import annotations

from datetime import datetime
from typing import Iterable

from .models import ScheduledBlock

_DT_FORMAT = "%Y%m%dT%H%M%S"


def _escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")


def to_ics(blocks: Iterable[ScheduledBlock], calendar_name: str = "Auto Schedule") -> str:
    """Render scheduled blocks as an RFC 5545 .ics calendar (local, floating time)."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//annachi//auto-scheduler//EN",
        f"X-WR-CALNAME:{_escape(calendar_name)}",
    ]
    stamp = datetime.utcnow().strftime(_DT_FORMAT) + "Z"
    for i, block in enumerate(blocks):
        lines += [
            "BEGIN:VEVENT",
            f"UID:{block.task_id}-{i}@annachi-scheduler",
            f"DTSTAMP:{stamp}",
            f"DTSTART:{block.start.strftime(_DT_FORMAT)}",
            f"DTEND:{block.end.strftime(_DT_FORMAT)}",
            f"SUMMARY:{_escape(block.task_name)}",
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"
