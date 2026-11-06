# Agent service scaffold

This directory reserves the future AI worker boundary. `main.py` is empty; it does not start FastAPI, call models or provide agent tools. Requirements and the Dockerfile are preparation only.

Implement one evaluated, permission-checked agent only after the profile and coding foundations are reliable. Model responses must not be presented as verified grading. The planned port is 8000; no service or documentation endpoint currently listens there.

See the [architecture](../../docs/architecture.md) for the intended boundary.
