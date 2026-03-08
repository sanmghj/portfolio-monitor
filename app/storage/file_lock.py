from contextlib import contextmanager
from pathlib import Path
import time


@contextmanager
def file_lock(target: Path, timeout_seconds: float = 5.0, delay_seconds: float = 0.1):
    lock_path = target.with_suffix(f"{target.suffix}.lock")
    start = time.monotonic()

    while True:
        try:
            fd = lock_path.open("x", encoding="utf-8")
            break
        except FileExistsError:
            if time.monotonic() - start >= timeout_seconds:
                raise TimeoutError(f"Timed out waiting for lock: {lock_path}")
            time.sleep(delay_seconds)

    try:
        fd.write(str(time.time()))
        fd.flush()
        yield
    finally:
        fd.close()
        if lock_path.exists():
            lock_path.unlink()
