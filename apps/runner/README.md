# Execution worker scaffold

This directory reserves the separate execution service boundary. `worker.py` is empty; it does not start a server or execute submissions. The Dockerfile and requirements are preparation only.

Do not run submitted code in the Spring Boot API or directly on the host. A future implementation must provide process/filesystem/network isolation, non-root execution, resource limits, timeouts, output limits and cleanup before accepting untrusted work.

See the [coding environment plan](../../docs/plans/coding-environment.md). The planned port is 8081; no service currently listens there.
