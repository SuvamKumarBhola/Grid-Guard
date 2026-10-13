#!/usr/bin/env python3
"""
GridGuard Concurrent Load, Resilience, and Failure Injection Benchmark.
Measures real throughput (RPS), p50/p95/p99 latency, and safety fallback activation.
"""
import sys
import time
import argparse
import asyncio
import numpy as np
import httpx
from typing import List, Dict, Any


async def worker(
    client: httpx.AsyncClient,
    base_url: str,
    asset_ids: List[str],
    total_requests: int,
    results: List[Dict[str, Any]],
):
    import random
    for _ in range(total_requests):
        asset_id = random.choice(asset_ids)
        # Randomly inject 10% degraded sensor requests to verify fallback resilience under load
        is_degraded = random.random() < 0.10
        payload = None
        if is_degraded:
            payload = {
                "observations": {
                    "load_factor": 0.88,
                    "winding_temperature_c": 102.0,
                    "ambient_temperature_c": 35.0,
                    "voltage_variance": 0.05,
                    "current_variance": 0.08,
                    "power_factor": 0.85,
                },
                "sensor_health": 0.42,  # Intentionally triggers fallback gate
            }

        start = time.perf_counter()
        try:
            url = f"{base_url}/api/v1/assets/{asset_id}/risk"
            if payload:
                resp = await client.post(url, json=payload, timeout=5.0)
            else:
                resp = await client.post(url, timeout=5.0)

            elapsed_ms = (time.perf_counter() - start) * 1000.0
            data = resp.json() if resp.status_code == 200 else {}
            results.append({
                "status_code": resp.status_code,
                "latency_ms": elapsed_ms,
                "route": data.get("route", "error"),
                "is_fallback": data.get("route") == "safety-fallback",
                "error": resp.status_code >= 400,
            })
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            results.append({
                "status_code": 500,
                "latency_ms": elapsed_ms,
                "route": "client_exception",
                "is_fallback": False,
                "error": True,
            })


async def run_benchmark(base_url: str, total_requests: int, concurrency: int):
    # Fetch asset list
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{base_url}/api/v1/assets")
        if resp.status_code != 200:
            print(f"Error fetching assets from {base_url}: {resp.status_code}")
            sys.exit(1)
        assets = resp.json()
        asset_ids = [a["asset"]["asset_id"] for a in assets]

    print(f"Loaded {len(asset_ids)} assets for load test.")
    print(f"Starting test: {total_requests} requests across {concurrency} concurrent workers...")

    results: List[Dict[str, Any]] = []
    req_per_worker = total_requests // concurrency

    wall_start = time.perf_counter()
    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = [
            worker(client, base_url, asset_ids, req_per_worker, results)
            for _ in range(concurrency)
        ]
        await asyncio.gather(*tasks)

    total_time = time.perf_counter() - wall_start
    total_completed = len(results)
    successful = [r for r in results if not r["error"]]
    latencies = [r["latency_ms"] for r in successful]
    fallback_count = sum(1 for r in results if r["is_fallback"])
    error_count = sum(1 for r in results if r["error"])

    throughput = total_completed / total_time
    p50 = float(np.percentile(latencies, 50)) if latencies else 0.0
    p95 = float(np.percentile(latencies, 95)) if latencies else 0.0
    p99 = float(np.percentile(latencies, 99)) if latencies else 0.0
    fallback_pct = (fallback_count / total_completed) * 100.0 if total_completed else 0.0

    print("\n================ BENCHMARK REPORT ================")
    print(f"Total Requests:       {total_completed}")
    print(f"Concurrent Workers:   {concurrency}")
    print(f"Total Duration:       {total_time:.2f} s")
    print(f"Throughput:           {throughput:.1f} req/s")
    print(f"Error Rate:           {(error_count / total_completed)*100:.2f}% ({error_count}/{total_completed})")
    print(f"Fallback Activation: {fallback_pct:.1f}% ({fallback_count}/{total_completed})")
    print(f"Latency p50:          {p50:.2f} ms")
    print(f"Latency p95:          {p95:.2f} ms")
    print(f"Latency p99:          {p99:.2f} ms")
    print("==================================================\n")

    return {
        "total_requests": total_completed,
        "concurrency": concurrency,
        "duration_seconds": round(total_time, 2),
        "throughput_rps": round(throughput, 1),
        "error_count": error_count,
        "fallback_count": fallback_count,
        "fallback_pct": round(fallback_pct, 1),
        "latency_p50_ms": round(p50, 2),
        "latency_p95_ms": round(p95, 2),
        "latency_p99_ms": round(p99, 2),
    }


def main():
    parser = argparse.ArgumentParser(description="GridGuard load and resilience test")
    parser.add_argument("--base-url", default="http://testserver", help="GridGuard base URL")
    parser.add_argument("--requests", type=int, default=200, help="Total requests")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent workers")
    parser.add_argument("--in-process", action="store_true", default=True, help="Benchmark in-process ASGI directly")
    args = parser.parse_args()

    if args.in_process:
        from app.main import app, app_state
        from app.services.synthetic_generator import populate_synthetic_grid
        if not app_state.asset_repo.list():
            populate_synthetic_grid(app_state.asset_repo, app_state.feeder_repo, app_state.telemetry_service)

        transport = httpx.ASGITransport(app=app)

        async def run_in_process():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                resp = await client.get("/api/v1/assets")
                assets = resp.json()
                asset_ids = [a["asset"]["asset_id"] for a in assets]

            results = []
            req_per_worker = args.requests // args.concurrency
            wall_start = time.perf_counter()

            async def asgi_worker():
                import random
                async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
                    for _ in range(req_per_worker):
                        asset_id = random.choice(asset_ids)
                        is_degraded = random.random() < 0.10
                        payload = None
                        if is_degraded:
                            payload = {
                                "observations": {
                                    "load_factor": 0.88,
                                    "winding_temperature_c": 102.0,
                                    "ambient_temperature_c": 35.0,
                                    "voltage_variance": 0.05,
                                    "current_variance": 0.08,
                                    "power_factor": 0.85,
                                },
                                "sensor_health": 0.42,
                            }
                        start = time.perf_counter()
                        try:
                            url = f"/api/v1/assets/{asset_id}/risk"
                            if payload:
                                r = await c.post(url, json=payload)
                            else:
                                r = await c.post(url)
                            elapsed = (time.perf_counter() - start) * 1000.0
                            d = r.json() if r.status_code == 200 else {}
                            results.append({
                                "status_code": r.status_code,
                                "latency_ms": elapsed,
                                "route": d.get("route", "error"),
                                "is_fallback": d.get("route") == "safety-fallback",
                                "error": r.status_code >= 400,
                            })
                        except Exception:
                            elapsed = (time.perf_counter() - start) * 1000.0
                            results.append({
                                "status_code": 500,
                                "latency_ms": elapsed,
                                "route": "client_exception",
                                "is_fallback": False,
                                "error": True,
                            })

            tasks = [asgi_worker() for _ in range(args.concurrency)]
            await asyncio.gather(*tasks)

            total_time = time.perf_counter() - wall_start
            total_completed = len(results)
            successful = [r for r in results if not r["error"]]
            latencies = [r["latency_ms"] for r in successful]
            fallback_count = sum(1 for r in results if r["is_fallback"])
            error_count = sum(1 for r in results if r["error"])

            throughput = total_completed / total_time
            p50 = float(np.percentile(latencies, 50)) if latencies else 0.0
            p95 = float(np.percentile(latencies, 95)) if latencies else 0.0
            p99 = float(np.percentile(latencies, 99)) if latencies else 0.0
            fallback_pct = (fallback_count / total_completed) * 100.0 if total_completed else 0.0

            print("\n================ BENCHMARK REPORT ================")
            print(f"Total Requests:       {total_completed}")
            print(f"Concurrent Workers:   {args.concurrency}")
            print(f"Total Duration:       {total_time:.2f} s")
            print(f"Throughput:           {throughput:.1f} req/s")
            print(f"Error Rate:           {(error_count / total_completed)*100:.2f}% ({error_count}/{total_completed})")
            print(f"Fallback Activation: {fallback_pct:.1f}% ({fallback_count}/{total_completed})")
            print(f"Latency p50:          {p50:.2f} ms")
            print(f"Latency p95:          {p95:.2f} ms")
            print(f"Latency p99:          {p99:.2f} ms")
            print("==================================================\n")

        asyncio.run(run_in_process())
    else:
        asyncio.run(run_benchmark(args.base_url, args.requests, args.concurrency))


if __name__ == "__main__":
    main()
