#!/usr/bin/env python3
"""Correctness tests for the native Jezero rover route solver.

The generated grids are intentionally small algorithm fixtures, not surface
raster data. Tests verify exact route costs, looplessness, uniqueness, and the
unchanged JSON/exit-code contract.
"""

from __future__ import annotations

import json
import math
import os
import random
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple


ROOT = Path(__file__).resolve().parents[1]
SOLVER = Path(os.environ.get("ROVER_BINARY", str(ROOT / "native" / "rover_pathfinder")))
RESULT_FILE = Path(__file__).resolve().parent / "native_test_result.json"
Point = Tuple[int, int]
Route = Tuple[float, Tuple[Point, ...]]


def neighbors(point: Point, width: int, height: int) -> Iterable[Point]:
    x, y = point
    # This order is independent of solver tie ordering; tests compare equal
    # cost route identities as a set while requiring the sorted cost prefix.
    for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < width and 0 <= ny < height:
            yield nx, ny


def enumerate_simple_routes(
    grid: Sequence[Sequence[float]], start: Point, target: Point
) -> List[Route]:
    """Enumerate all simple routes, paying the value of each entered cell."""
    height = len(grid)
    width = len(grid[0])
    routes: List[Route] = []

    def visit(point: Point, path: List[Point], cost: float) -> None:
        if point == target:
            routes.append((cost, tuple(path)))
            return
        for nxt in neighbors(point, width, height):
            if nxt in path or grid[nxt[1]][nxt[0]] < 0:
                continue
            visit(nxt, path + [nxt], cost + float(grid[nxt[1]][nxt[0]]))

    if grid[start[1]][start[0]] >= 0 and grid[target[1]][target[0]] >= 0:
        visit(start, [start], 0.0)
    return sorted(routes, key=lambda item: (item[0], item[1]))


def make_case(grid: Sequence[Sequence[float]], start: Point, target: Point) -> Dict:
    return {
        "width": len(grid[0]),
        "height": len(grid),
        "start": {"x": start[0], "y": start[1]},
        "target": {"x": target[0], "y": target[1]},
        "grid": [list(row) for row in grid],
    }


class NativeSolverTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if not SOLVER.is_file():
            raise AssertionError(
                "compiled solver missing; build native/rover_pathfinder.cpp first"
            )

    def run_json(self, document: Dict) -> Tuple[int, Dict]:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", encoding="utf-8", delete=False
        ) as handle:
            json.dump(document, handle)
            input_path = handle.name
        try:
            completed = subprocess.run(
                [str(SOLVER), input_path],
                cwd=str(ROOT),
                text=True,
                capture_output=True,
                check=False,
            )
        finally:
            Path(input_path).unlink(missing_ok=True)
        self.assertTrue(completed.stdout.strip(), msg=completed.stderr)
        try:
            output = json.loads(completed.stdout)
        except json.JSONDecodeError as exc:
            self.fail(f"solver emitted invalid JSON: {exc}: {completed.stdout}")
        return completed.returncode, output

    def run_raw(self, raw: str) -> Tuple[int, Dict]:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", encoding="utf-8", delete=False
        ) as handle:
            handle.write(raw)
            input_path = handle.name
        try:
            completed = subprocess.run(
                [str(SOLVER), input_path],
                cwd=str(ROOT),
                text=True,
                capture_output=True,
                check=False,
            )
        finally:
            Path(input_path).unlink(missing_ok=True)
        self.assertTrue(completed.stdout.strip(), msg=completed.stderr)
        return completed.returncode, json.loads(completed.stdout)

    def assert_exact_route_prefix(
        self, grid: Sequence[Sequence[float]], start: Point, target: Point
    ) -> None:
        expected = enumerate_simple_routes(grid, start, target)
        returncode, output = self.run_json(make_case(grid, start, target))
        self.assertEqual(returncode, 0)

        if not expected:
            self.assertEqual(output.get("status"), "error")
            self.assertEqual(output.get("error_code"), "NO_PATH")
            self.assertEqual(output.get("paths"), [])
            return

        self.assertEqual(output.get("status"), "success")
        actual = output.get("paths")
        self.assertIsInstance(actual, list)
        expected_prefix = expected[:3]
        self.assertEqual(len(actual), len(expected_prefix))

        actual_paths = []
        actual_costs = []
        for rank, route in enumerate(actual, 1):
            self.assertEqual(route.get("rank"), rank)
            points = tuple(
                (point["x"], point["y"]) for point in route.get("path", [])
            )
            self.assertGreaterEqual(len(points), 1)
            self.assertEqual(points[0], start)
            self.assertEqual(points[-1], target)
            self.assertEqual(len(points), len(set(points)), "route is not loopless")
            for current, nxt in zip(points, points[1:]):
                self.assertEqual(abs(current[0] - nxt[0]) + abs(current[1] - nxt[1]), 1)
                self.assertGreaterEqual(grid[nxt[1]][nxt[0]], 0)
            calculated = sum(float(grid[y][x]) for x, y in points[1:])
            reported = float(route["cost"])
            self.assertTrue(
                math.isclose(reported, calculated, rel_tol=0.0, abs_tol=1e-9),
                msg=f"reported {reported} != calculated {calculated}",
            )
            actual_paths.append(points)
            actual_costs.append(reported)

        self.assertEqual(len(actual_paths), len(set(actual_paths)), "duplicate route")
        self.assertEqual(actual_costs, sorted(actual_costs))
        self.assertEqual(
            actual_costs,
            [cost for cost, _ in expected_prefix],
            "returned cost prefix is not exact",
        )
        self.assertEqual(output.get("path"), actual[0]["path"])

    def test_same_start_target_and_zero_cost(self) -> None:
        self.assert_exact_route_prefix([[0]], (0, 0), (0, 0))
        self.assert_exact_route_prefix([[0, 0, 0]], (0, 0), (2, 0))

    def test_single_path_and_entered_cell_costs(self) -> None:
        self.assert_exact_route_prefix([[0, 1, 2, 4, 8]], (0, 0), (4, 0))

    def test_obstacles_and_no_path(self) -> None:
        self.assert_exact_route_prefix(
            [
                [0, -1, 4],
                [1, -1, 8],
                [2, -1, 1],
            ],
            (0, 0),
            (2, 0),
        )
        self.assert_exact_route_prefix(
            [[0, -1, 1], [-1, -1, -1], [1, -1, 0]], (0, 0), (2, 2)
        )

    def test_exhaustive_weighted_fixtures(self) -> None:
        fixtures = [
            ([[0, 1], [2, 0], [1, 2]], (0, 0), (1, 2)),
            (
                [[0, 2, 4], [1, 0, 8], [2, 1, 0]],
                (0, 0),
                (2, 2),
            ),
            (
                [[0, 1, -1, 2], [2, 4, 1, 8], [4, 0, 2, 1]],
                (0, 0),
                (3, 2),
            ),
        ]
        for grid, start, target in fixtures:
            with self.subTest(width=len(grid[0]), height=len(grid)):
                self.assert_exact_route_prefix(grid, start, target)

    def test_bounded_random_small_fixtures(self) -> None:
        rng = random.Random(105194)
        values = [-1, 0, 1, 2, 4, 8]
        for index in range(24):
            width, height = rng.choice([(2, 3), (3, 3), (4, 3)])
            grid = [[rng.choice(values) for _ in range(width)] for _ in range(height)]
            start, target = (0, 0), (width - 1, height - 1)
            grid[start[1]][start[0]] = 0
            grid[target[1]][target[0]] = rng.choice([0, 1, 2, 4, 8])
            with self.subTest(fixture=index, width=width, height=height):
                self.assert_exact_route_prefix(grid, start, target)

    def test_malformed_json(self) -> None:
        returncode, output = self.run_raw('{"width":')
        self.assertEqual(returncode, 1)
        self.assertEqual(output.get("status"), "error")
        self.assertEqual(output.get("error_code"), "INVALID_JSON")

    def test_bounds_validation(self) -> None:
        for width, height in ((1001, 1000), (1000, 1001)):
            with self.subTest(width=width, height=height):
                returncode, output = self.run_json(
                    {"width": width, "height": height}
                )
                self.assertEqual(returncode, 1)
                self.assertEqual(output.get("status"), "error")
                self.assertEqual(output.get("error_code"), "INVALID_INPUT")


def main() -> int:
    started = time.monotonic()
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(NativeSolverTests)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    failures = [name for case, _ in result.failures for name in [case.id()]]
    errors = [name for case, _ in result.errors for name in [case.id()]]
    summary = {
        "status": "passed" if result.wasSuccessful() else "failed",
        "tests_run": result.testsRun,
        "failures": failures,
        "errors": errors,
        "duration_seconds": round(time.monotonic() - started, 3),
        "solver": str(SOLVER),
    }
    RESULT_FILE.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
